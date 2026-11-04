import { useRef, useState } from 'react';
import { Upload, Film, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { uploadVenueMedia, isVideoUrl } from '../../utils/uploadMedia';

const inputCls =
  'w-full rounded-xl border border-ink/12 bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20 dark:border-white/10 dark:bg-[#111217] dark:text-white';

export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// A URL text field plus a "choose from device" button. Picking a file
// uploads it to Supabase Storage (see utils/uploadMedia) and drops the
// resulting public URL into the field, so either a pasted URL or a local
// file works. `client` is the portal's own signed-in Supabase client
// (admin/support or agent), which decides whose folder the file lands in.
export default function MediaInput({ value, onChange, client, placeholder = 'Image or video URL', accept = 'image/*,video/*' }) {
  const fileRef = useRef(null);
  const { notify } = useToast();
  const [progress, setProgress] = useState(null); // null = idle, 0..1 while uploading
  const uploading = progress != null;
  const isVideo = isVideoUrl(value);
  const hasPreview = value && (value.startsWith('data:') || value.startsWith('http'));

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!accept.includes('video') && !file.type.startsWith('image/')) {
      notify('Please choose a photo for this item.', 'warning');
      return;
    }
    setProgress(0);
    try {
      const url = await uploadVenueMedia(client, file, setProgress);
      onChange(url);
    } catch (err) {
      notify(err.message || 'Upload failed.', 'warning');
    } finally {
      setProgress(null);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {hasPreview ? (
        isVideo ? (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-ink/5 text-ink/40 dark:bg-white/10 dark:text-white/40">
            <Film size={16} />
          </span>
        ) : (
          <img src={value} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover" />
        )
      ) : (
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-ink/5 text-ink/30 dark:bg-white/10 dark:text-white/30">
          <ImageIcon size={16} />
        </span>
      )}
      <input
        value={uploading ? `Uploading… ${Math.round(progress * 100)}%` : value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={uploading}
        className={`${inputCls} ${uploading ? 'text-brand' : ''}`}
      />
      <button
        type="button"
        disabled={uploading}
        onClick={() => fileRef.current?.click()}
        title={accept.includes('video') ? 'Choose photo or video from your device (up to 50 MB)' : 'Choose a photo from your device'}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand transition hover:bg-brand hover:text-white disabled:pointer-events-none"
      >
        {uploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
      </button>
      <input ref={fileRef} type="file" accept={accept} className="hidden" onChange={handleFile} />
    </div>
  );
}
