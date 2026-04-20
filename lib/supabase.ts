import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// 클라이언트 컴포넌트용 (anon key)
export const supabase = createClient(url, anon);

// 서버 API 라우트용 (service role — 클라이언트에 절대 노출 금지)
export const supabaseAdmin = createClient(url, serviceRole);

// 파일 업로드 헬퍼
export async function uploadFile(
  bucket: string,
  path: string,
  file: File | Buffer,
  contentType?: string
) {
  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .upload(path, file, { contentType, upsert: true });

  if (error) throw error;

  const { data: urlData } = supabaseAdmin.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}

export async function deleteFile(bucket: string, path: string) {
  const { error } = await supabaseAdmin.storage.from(bucket).remove([path]);
  if (error) throw error;
}
