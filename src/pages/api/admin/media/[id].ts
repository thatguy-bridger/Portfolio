import type { APIRoute } from 'astro';
import { getSupabase } from '../../../../lib/supabase-server';
import { MEDIA_BUCKET } from '../../../../lib/media';

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

/** Deletes both the storage object and its media_library row. Does not check whether any page currently references the image (out of scope for this phase — deleting an in-use image just breaks that <img>, same as pasting a bad URL always could). */
export const DELETE: APIRoute = async ({ params }) => {
  const id = params.id;
  if (!id) return json({ error: 'Missing media id.' }, 400);

  try {
    const supabase = getSupabase();
    const { data: row, error: fetchError } = await supabase.from('media_library').select('storage_path').eq('id', id).maybeSingle();
    if (fetchError) return json({ error: fetchError.message }, 502);
    if (!row) return json({ error: 'Not found.' }, 404);

    const { error: storageError } = await supabase.storage.from(MEDIA_BUCKET).remove([row.storage_path]);
    if (storageError) return json({ error: storageError.message }, 502);

    const { error: deleteError } = await supabase.from('media_library').delete().eq('id', id);
    if (deleteError) return json({ error: deleteError.message }, 502);

    return json({ ok: true });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Server is not configured correctly.' }, 500);
  }
};
