// Uploads a venue/menu photo or video to the public `venue-media` Storage
// bucket and returns its public URL — the URL is what gets saved on the
// venue, not the file itself. (Files used to be read into base64 data:
// URLs and stored in the database row: slow, impossible for videos/large
// files, and every visitor downloaded them with the venue list.)
//
// Photos are scaled down in the browser first (longest side 1920px, WebP),
// so a 6 MB phone photo uploads as a few hundred KB. Videos upload as-is.
// Goes through XMLHttpRequest rather than supabase-js so the form can show
// real upload progress for big files.

export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024; // matches the bucket's limit
const MAX_IMAGE_SIDE = 1920;
const BUCKET = 'venue-media';

const VIDEO_EXT = /\.(mp4|webm|mov|m4v|ogv)(\?|#|$)/i;

export function isVideoUrl(url) {
  return typeof url === 'string' && (url.startsWith('data:video') || VIDEO_EXT.test(url));
}

async function shrinkImage(file) {
  // GIFs (animation) and SVGs (vector) are left alone, as is anything small.
  if (!/^image\/(jpeg|png|webp|heic|heif)$/.test(file.type) || file.size < 400 * 1024) return file;
  let bitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return file; // the browser can't decode it — upload the original
  }
  const scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close?.();
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', 0.85));
  return blob && blob.size < file.size ? new File([blob], 'photo.webp', { type: 'image/webp' }) : file;
}

function extensionFor(file) {
  const fromName = file.name?.match(/\.([a-z0-9]+)$/i)?.[1];
  if (fromName) return fromName.toLowerCase();
  return file.type.split('/')[1]?.replace('quicktime', 'mov') || 'bin';
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} client the portal's signed-in client
 * @param {File} original
 * @param {(fraction: number) => void} [onProgress] 0..1
 * @returns {Promise<string>} public URL
 */
export async function uploadVenueMedia(client, original, onProgress) {
  if (!/^(image|video)\//.test(original.type)) throw new Error('Please choose a photo or video.');

  const file = original.type.startsWith('image/') ? await shrinkImage(original) : original;
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error(`That file is ${Math.round(file.size / 1024 / 1024)} MB — the limit is 50 MB. Try a shorter or compressed video.`);
  }

  const { data } = await client.auth.getSession();
  const session = data.session;
  if (!session) throw new Error('Your session has expired — please sign in again.');

  const path = `${session.user.id}/${crypto.randomUUID()}.${extensionFor(file)}`;
  const base = import.meta.env.VITE_SUPABASE_URL;

  await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${base}/storage/v1/object/${BUCKET}/${path}`);
    xhr.setRequestHeader('Authorization', `Bearer ${session.access_token}`);
    xhr.setRequestHeader('apikey', import.meta.env.VITE_SUPABASE_ANON_KEY);
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
    xhr.setRequestHeader('Cache-Control', 'max-age=31536000');
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.(e.loaded / e.total);
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) return resolve();
      let message = 'Upload failed.';
      try {
        message = JSON.parse(xhr.responseText).message || message;
      } catch {
        /* keep the generic message */
      }
      if (xhr.status === 413 || /size/i.test(message)) message = 'That file is too large — the limit is 50 MB.';
      reject(new Error(message));
    };
    xhr.onerror = () => reject(new Error('Upload failed — check your connection and try again.'));
    xhr.send(file);
  });

  onProgress?.(1);
  return `${base}/storage/v1/object/public/${BUCKET}/${path}`;
}
