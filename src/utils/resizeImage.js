// Crops an image to a centred square and scales it to `size` px, returned as
// a small JPEG — so profile pictures upload as ~20 KB regardless of whether
// someone picks a 12 MP phone photo.
export async function squareAvatarBlob(file, size = 256) {
  if (!file.type.startsWith('image/')) throw new Error('Please choose an image file.');
  if (file.size > 10 * 1024 * 1024) throw new Error('That image is too large — please choose one under 10 MB.');

  let bitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error('We could not read that image. Try a JPG or PNG.');
  }

  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  // JPEG has no transparency — paint white first so a transparent PNG
  // doesn't come out black.
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);
  ctx.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, size, size);
  bitmap.close?.();

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.88));
  if (!blob) throw new Error('Could not process that image.');
  return blob;
}
