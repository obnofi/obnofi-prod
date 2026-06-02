import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;

function getEnvValue(
  name:
    | "NEXT_PUBLIC_SUPABASE_URL"
    | "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    | "SUPABASE_SERVICE_ROLE_KEY"
) {
  switch (name) {
    case "NEXT_PUBLIC_SUPABASE_URL":
      return process.env.NEXT_PUBLIC_SUPABASE_URL;
    case "NEXT_PUBLIC_SUPABASE_ANON_KEY":
      return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    case "SUPABASE_SERVICE_ROLE_KEY":
      return process.env.SUPABASE_SERVICE_ROLE_KEY;
    default:
      return undefined;
  }
}

function getRequiredEnv(
  name:
    | "NEXT_PUBLIC_SUPABASE_URL"
    | "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    | "SUPABASE_SERVICE_ROLE_KEY"
) {
  const value = getEnvValue(name);
  if (!value) {
    throw new Error(`Missing required Supabase environment variable: ${name}`);
  }
  return value;
}

export function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export function createBrowserSupabaseClient() {
  if (browserClient) {
    return browserClient;
  }

  browserClient = createClient(
    getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    getRequiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    }
  );

  return browserClient;
}

export function createServiceSupabaseClient() {
  return createClient(
    getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

async function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function uploadPublicAsset(file: File, pathPrefix: string) {
  if (!isSupabaseConfigured()) {
    return fileToDataUrl(file);
  }

  const supabase = createBrowserSupabaseClient();
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "png";
  const path = `${pathPrefix}/${crypto.randomUUID()}.${extension}`;
  const { data, error } = await supabase.storage
    .from("clearing-assets")
    .upload(path, file, {
      cacheControl: "3600",
      contentType: file.type,
      upsert: true,
    });

  if (error) {
    throw error;
  }

  const { data: publicUrlData } = supabase.storage
    .from("clearing-assets")
    .getPublicUrl(data.path);

  return publicUrlData.publicUrl;
}

export async function uploadClearingAsset(file: File, roomId: string) {
  return uploadPublicAsset(file, roomId);
}

export async function uploadGroveImageAsset(file: File, pageId: string) {
  return uploadPublicAsset(file, `grove-images/${pageId}`);
}

export async function uploadPageCanopyAsset(file: File, pageId: string) {
  return uploadPublicAsset(file, `page-canopies/${pageId}`);
}
