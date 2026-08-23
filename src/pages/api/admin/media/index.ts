import type { APIRoute } from 'astro';
import { getSupabase } from '../../../../lib/supabase-server';
import { ALLOWED_CONTENT_TYPES, MAX_UPLOAD_BYTES, MEDIA_BUCKET, publicMediaUrl, sniffImageDimensions } from '../../../../lib/media';

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

function sanitizeFileName(name: string): string {
  const cleaned = name.trim().replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/-+/g, '-');
  return (cleaned || 'upload').slice(-100); // keep the tail, where the extension lives
}

/** Lists every uploaded image, newest first, with a ready-to-use public URL — for the media picker + management screen. */
export const GET: APIRoute = async () => {
  try {
    const { data, error } = await getSupabase().from('media_library').select('*').order('created_at', { ascending: false });
    if (error) return json({ error: error.message }, 502);
    const media = (data ?? []).map((row) => ({ ...row, url: publicMediaUrl(row.storage_path) }));
    return json({ media });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Server is not configured correctly.' }, 500);
  }
};

/** Uploads one image to the `media` bucket and records it in media_library. */
export const POST: APIRoute = async ({ request }) => {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json({ error: 'Expected multipart/form-data with a "file" field.' }, 400);
  }
  const file = form.get('file');
  if (!(file instanceof File)) return json({ error: 'Missing file.' }, 400);
  if (!ALLOWED_CONTENT_TYPES.has(file.type)) return json({ error: `Unsupported file type: ${file.type || 'unknown'}.` }, 400);
  if (file.size <= 0) return json({ error: 'File is empty.' }, 400);
  if (file.size > MAX_UPLOAD_BYTES) return json({ error: `File exceeds the ${Math.floor(MAX_UPLOAD_BYTES / (1024 * 1024))}MB limit.` }, 400);

  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const dimensions = sniffImageDimensions(bytes, file.type);
  const fileName = sanitizeFileName(file.name || 'upload');
  const storagePath = `${crypto.randomUUID()}-${fileName}`;

  try {
    const supabase = getSupabase();
    const { error: uploadError } = await supabase.storage.from(MEDIA_BUCKET).upload(storagePath, buffer, { contentType: file.type, upsert: false });
    if (uploadError) return json({ error: uploadError.message }, 502);

    const { data, error: insertError } = await supabase
      .from('media_library')
      .insert({
        storage_path: storagePath,
        file_name: fileName,
        content_type: file.type,
        size_bytes: file.size,
        width: dimensions?.width ?? null,
        height: dimensions?.height ?? null,
      })
      .select('*')
      .single();
    if (insertError) {
      // Row insert failed after the file made it into storage — clean up so
      // we don't leave an orphaned, un-tracked object in the bucket.
      await supabase.storage.from(MEDIA_BUCKET).remove([storagePath]);
      return json({ error: insertError.message }, 502);
    }
    return json({ media: { ...data, url: publicMediaUrl(data.storage_path) } }, 201);
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Server is not configured correctly.' }, 500);
  }
};
