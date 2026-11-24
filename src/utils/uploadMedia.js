// Uploads a venue/menu photo or video to Cloudinary (signed by the
// `sign-cloudinary-upload` Edge Function), falling back to the public
// `venue-media` Supabase Storage bucket if Cloudinary isn't available, and
// returns its public URL — the URL is what gets saved on the
// venue, not the file itself. (Files used to be read into base64 data:
// URLs and stored in the database row: slow, impossible for videos/large
// files, and every visitor downloaded them with the venue list.)
//
// Photos are scaled down in the browser first (longest side 1920px, WebP),
// so a 6 MB phone photo uploads as a few hundred KB. Videos upload as-is.
// Goes through XMLHttpRequest rather than supabase-js so the form can show
// real upload progress for big files.

import { useSyncExternalStore } from 'react';

// How many uploads are running right now, so the venue form can hold off
// saving until every photo/video has finished (a row whose image is still
// uploading has no URL yet).
let activeUploads = 0;
const uploadListeners = new Set();
function setActiveUploads(n) {
  activeUploads = n;
  uploadListeners.forEach((l) => l());
}
export function useActiveUploads() {
  return useSyncExternalStore(
    (l) => {
      uploadListeners.add(l);
      return () => uploadListeners.delete(l);
    },
    () => activeUploads,
  );
}

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
  setActiveUploads(activeUploads + 1);
  try {
    return await doUpload(client, original, onProgress);
  } finally {
    setActiveUploads(activeUploads - 1);
  }
}

async function doUpload(client, original, onProgress) {
  if (!/^(image|video)\//.test(original.type)) throw new Error('Please choose a photo or video.');

  const file = original.type.startsWith('image/') ? await shrinkImage(original) : original;

  const { data } = await client.auth.getSession();
  const session = data.session;
  if (!session) throw new Error('Your session has expired — please sign in again.');

  // Cloudinary first. If it isn't set up (or the signing function is
  // unreachable), fall back to Supabase Storage so uploads keep working.
  let signed = null;
  try {
    const { data: sig, error } = await client.functions.invoke('sign-cloudinary-upload', { body: {} });
    if (error) throw error;
    if (sig?.signature) signed = sig;
  } catch (err) {
    console.warn('[uploadMedia] Cloudinary signing unavailable, using Supabase Storage', err);
  }

  const url = signed ? await uploadToCloudinary(signed, file, onProgress) : await uploadToSupabase(session, file, onProgress);
  onProgress?.(1);
  return url;
}

// Cloudinary free-plan limits per file.
const CLOUDINARY_MAX_IMAGE = 10 * 1024 * 1024;
const CLOUDINARY_MAX_VIDEO = 100 * 1024 * 1024;

function sendWithProgress(xhr, body, onProgress) {
  return new Promise((resolve, reject) => {
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.(e.loaded / e.total);
    };
    xhr.onload = () => resolve(xhr);
    xhr.onerror = () => reject(new Error('Upload failed — check your connection and try again.'));
    xhr.send(body);
  });
}

const mb = (bytes) => Math.round(bytes / 1024 / 1024);

async function uploadToCloudinary({ cloudName, apiKey, folder, timestamp, signature }, file, onProgress) {
  const isVideo = file.type.startsWith('video/');
  const limit = isVideo ? CLOUDINARY_MAX_VIDEO : CLOUDINARY_MAX_IMAGE;
  if (file.size > limit) {
    throw new Error(
      `That ${isVideo ? 'video' : 'photo'} is ${mb(file.size)} MB — the limit is ${mb(limit)} MB.${isVideo ? ' Try a shorter or compressed video.' : ''}`,
    );
  }

  const form = new FormData();
  form.append('file', file);
  form.append('api_key', apiKey);
  form.append('timestamp', String(timestamp));
  form.append('folder', folder);
  form.append('signature', signature);

  const xhr = new XMLHttpRequest();
  xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/${isVideo ? 'video' : 'image'}/upload`);
  await sendWithProgress(xhr, form, onProgress);

  let res = {};
  try {
    res = JSON.parse(xhr.responseText);
  } catch {
    /* handled below */
  }
  if (xhr.status < 200 || xhr.status >= 300 || !res.secure_url) {
    const message = res.error?.message || 'Upload failed.';
    throw new Error(/size|too large/i.test(message) ? `That file is too large — the limit is ${mb(limit)} MB.` : message);
  }
  // Photos: let Cloudinary pick the best format and quality for each
  // visitor's device (smaller, faster images in the main app).
  return isVideo ? res.secure_url : res.secure_url.replace('/image/upload/', '/image/upload/f_auto,q_auto/');
}

async function uploadToSupabase(session, file, onProgress) {
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error(`That file is ${mb(file.size)} MB — the limit is 50 MB. Try a shorter or compressed video.`);
  }
  const path = `${session.user.id}/${crypto.randomUUID()}.${extensionFor(file)}`;
  const base = import.meta.env.VITE_SUPABASE_URL;

  const xhr = new XMLHttpRequest();
  xhr.open('POST', `${base}/storage/v1/object/${BUCKET}/${path}`);
  xhr.setRequestHeader('Authorization', `Bearer ${session.access_token}`);
  xhr.setRequestHeader('apikey', import.meta.env.VITE_SUPABASE_ANON_KEY);
  xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
  xhr.setRequestHeader('Cache-Control', 'max-age=31536000');
  await sendWithProgress(xhr, file, onProgress);

  if (xhr.status < 200 || xhr.status >= 300) {
    let message = 'Upload failed.';
    try {
      message = JSON.parse(xhr.responseText).message || message;
    } catch {
      /* keep the generic message */
    }
    if (xhr.status === 413 || /size/i.test(message)) message = 'That file is too large — the limit is 50 MB.';
    throw new Error(message);
  }
  return `${base}/storage/v1/object/public/${BUCKET}/${path}`;
}
