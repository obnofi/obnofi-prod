import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "temp-client-id",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "temp-client-secret",
    }),
    // 임시 개발용: credentials 로그인
    CredentialsProvider({
      name: "Development",
      credentials: {},
      async authorize() {
        // 임시 사용자 반환
        return {
          id: "dev-user-1",
          name: "Developer",
          email: "dev@obnofi.com",
          image: null,
        };
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
    async signIn() {
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
