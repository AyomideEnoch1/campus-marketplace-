import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Upload helper for Supabase Storage (e.g. 'marketplace' bucket)
 */
export async function uploadToSupabase(
  bucket: string,
  path: string,
  file: File | Blob | Buffer,
  contentType?: string
): Promise<{ url: string | null; error: Error | null }> {
  try {
    const { data, error } = await supabaseAdmin.storage.from(bucket).upload(path, file, {
      contentType: contentType || "image/jpeg",
      upsert: true,
    });

    if (error) {
      return { url: null, error };
    }

    const { data: publicUrlData } = supabaseAdmin.storage.from(bucket).getPublicUrl(data.path);
    return { url: publicUrlData.publicUrl, error: null };
  } catch (err: any) {
    return { url: null, error: err };
  }
}
