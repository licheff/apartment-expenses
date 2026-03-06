import { supabase } from '@/lib/supabase'

const BUCKET = 'subscription-icons'

/**
 * Uploads an SVG file to Supabase Storage and returns its public URL.
 * Uses a UUID filename so edits never collide with the old file.
 * Throws on upload error.
 */
export async function uploadSubscriptionIcon(file: File): Promise<string> {
  const filename = `${crypto.randomUUID()}.svg`

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filename, file, { contentType: 'image/svg+xml', upsert: true })

  if (error) throw error

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filename)
  return data.publicUrl
}
