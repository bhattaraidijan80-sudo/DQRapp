import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ||
  'https://wmaklxnxmtvfshjzubic.supabase.co';

export const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'sb_publishable_ezxXFoFZJCEzh0ELJaaZnA_4Vy850UH';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Compresses an uploaded image file on an offscreen canvas so it stays lightweight
 * for both Supabase Storage and localStorage fallback.
 */
export async function compressImageFile(
  file: File,
  maxWidth = 1100,
  quality = 0.84
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => {
        if (typeof reader.result === 'string') resolve(reader.result);
        else reject(new Error('Invalid image.'));
      };
      img.onload = () => {
        const scale = Math.min(1, maxWidth / Math.max(1, img.width));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads an image file to the `dqr-media` Supabase Storage bucket if available,
 * and seamlessly falls back to a compressed Data URL if the bucket hasn't been created yet.
 */
export async function uploadDqrMedia(
  file: File,
  folder: string
): Promise<string> {
  const compressedDataUrl = await compressImageFile(file);

  try {
    const res = await fetch(compressedDataUrl);
    const blob = await res.blob();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `${folder}/${Date.now()}_${safeName}`;

    const { error } = await supabase.storage
      .from('dqr-media')
      .upload(path, blob, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (!error) {
      const { data } = supabase.storage.from('dqr-media').getPublicUrl(path);
      if (data?.publicUrl) return data.publicUrl;
    }
  } catch {
    // Graceful fallback to compressed data URL
  }

  return compressedDataUrl;
}

export async function loadAllStoreFromSupabase(): Promise<
  Record<string, unknown>
> {
  try {
    const { data, error } = await supabase
      .from('dqr_app_store')
      .select('store_key, payload');

    if (error || !data) return {};
    const out: Record<string, unknown> = {};
    for (const row of data) {
      if (row && typeof row.store_key === 'string') {
        out[row.store_key] = row.payload;
      }
    }
    return out;
  } catch {
    return {};
  }
}

export async function loadStoreFromSupabase<T>(
  storeKey: string
): Promise<T | null> {
  try {
    const { data, error } = await supabase
      .from('dqr_app_store')
      .select('payload')
      .eq('store_key', storeKey)
      .maybeSingle();

    if (error || !data) return null;
    return data.payload as T;
  } catch {
    return null;
  }
}

export async function saveStoreToSupabase<T>(
  storeKey: string,
  payload: T
): Promise<boolean> {
  try {
    const { error } = await supabase.from('dqr_app_store').upsert(
      {
        store_key: storeKey,
        payload,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'store_key' }
    );
    return !error;
  } catch {
    return false;
  }
}
