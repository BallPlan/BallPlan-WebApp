import { useRef } from 'react';
import { Upload, Film, Image as ImageIcon } from 'lucide-react';

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

// A URL text field plus a "choose from device" button — picking a file reads
// it into a data URL (this app has no backend to upload to) and drops it
// straight into the same field, so either a pasted URL or a local file works.
export default function MediaInput({ value, onChange, placeholder = 'Image or video URL' }) {
  const fileRef = useRef(null);
  const isVideo = typeof value === 'string' && value.startsWith('data:video');
  const hasPreview = value && (value.startsWith('data:') || value.startsWith('http'));

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    onChange(dataUrl);
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
      <input value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={inputCls} />
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        title="Choose photo or video from your device"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand transition hover:bg-brand hover:text-white"
      >
        <Upload size={15} />
      </button>
      <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFile} />
    </div>
  );
}
