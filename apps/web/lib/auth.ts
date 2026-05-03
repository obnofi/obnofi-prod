import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@obnofi/db";
import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import {
  normalizeProfileImagePreset,
  pickProfileImagePreset,
} from "@/lib/profileImagePresets";

const googleClientId =
  process.env.GOOGLE_CLIENT_ID ??
  process.env.AUTH_GOOGLE_ID ??
  "temp-client-id";

const googleClientSecret =
  process.env.GOOGLE_CLIENT_SECRET ??
  process.env.AUTH_GOOGLE_SECRET ??
  "temp-client-secret";

async function ensureUserProfileImage(
  userId: string,
  fallbackSeed: string
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { image: true },
  });

  const initialProfileImage = pickProfileImagePreset(fallbackSeed);

  if (!user) {
    return initialProfileImage;
  }

  const normalizedImage = normalizeProfileImagePreset(user.image, fallbackSeed);

  if (user.image === normalizedImage) {
    return normalizedImage;
  }

  await prisma.user.update({
    where: { id: userId },
    data: { image: normalizedImage },
  });

  return normalizedImage;
}

async function setUserProfileImagePreset(userId: string, fallbackSeed: string) {
  const initialProfileImage = pickProfileImagePreset(fallbackSeed);

  await prisma.user.update({
    where: { id: userId },
    data: { image: initialProfileImage },
  });

  return initialProfileImage;
}

const baseAdapter = PrismaAdapter(prisma);

const adapter = {
  ...baseAdapter,
  async createUser(user: Parameters<NonNullable<typeof baseAdapter.createUser>>[0]) {
    const fallbackSeed = user.email ?? user.name ?? "obnofi-user";

    return baseAdapter.createUser!({
      ...user,
      image: pickProfileImagePreset(fallbackSeed),
    });
  },
};

export const authOptions: NextAuthOptions = {
  adapter,
  providers: [
    GoogleProvider({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
      allowDangerousEmailAccountLinking: true,
      httpOptions: {
        timeout: 15000,
      },
    }),
    // 임시 개발용: credentials 로그인
    CredentialsProvider({
      name: "Development",
      credentials: {},
      async authorize() {
        // Credentials provider는 adapter와 함께 써도 Account 레코드를 생성하지 않으므로
        // User를 직접 upsert한다.
        const user = await prisma.user.upsert({
          where: { email: "dev@obnofi.com" },
          update: {
            image: pickProfileImagePreset("dev-user-1"),
          },
          create: {
            id: "dev-user-1",
            name: "Developer",
            email: "dev@obnofi.com",
            image: pickProfileImagePreset("dev-user-1"),
          },
        });
        return user;
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        if (typeof token.name === "string") {
          session.user.name = token.name;
        }
        // Read image from JWT — set at sign-in, no DB call needed per request
        if (typeof token.picture === "string") {
          session.user.image = token.picture;
        }
      }
      return session;
    },
    async jwt({ token, user, trigger, session, isNewUser }) {
      if (user) {
        token.sub = user.id;
        const fallbackSeed = token.email ?? user.email ?? user.id;

        // New sign-ups should always start from an obnofi preset, not the OAuth provider image.
        token.picture =
          trigger === "signUp" || isNewUser
            ? await setUserProfileImagePreset(user.id, fallbackSeed)
            : await ensureUserProfileImage(user.id, fallbackSeed);
      }

      if (trigger === "update") {
        if (typeof session?.name === "string") {
          token.name = session.name;
        }
        if (typeof session?.image === "string") {
          token.picture = session.image;
        }
      }

      return token;
    },
    async signIn() {
      // DB work moved to jwt callback (runs once at sign-in)
      return true;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
  },
};
