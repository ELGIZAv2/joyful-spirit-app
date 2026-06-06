// Multi-image attach component — accepts up to maxImages.
import { Plus, X } from "lucide-react";
import { useRef } from "react";

interface Props {
  images: string[];
  onChange: (next: string[]) => void;
  maxImages: number;
  label?: string;
}

export function MultiImageAttach({ images, onChange, maxImages, label }: Props) {
  const ref = useRef<HTMLInputElement>(null);
  const canAddMore = images.length < maxImages;

  const onFiles = (files: FileList | null) => {
    if (!files) return;
    const remaining = maxImages - images.length;
    const list = Array.from(files).slice(0, remaining);
    Promise.all(
      list.map(
        (f) =>
          new Promise<string>((res) => {
            const r = new FileReader();
            r.onload = () => res(r.result as string);
            r.readAsDataURL(f);
          }),
      ),
    ).then((urls) => onChange([...images, ...urls]));
  };

  return (
    <div className="px-4 pt-3">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          {label ?? "References"} ({images.length}/{maxImages})
        </span>
      </div>
      <div className="flex gap-2 flex-wrap">
        {images.map((src, i) => (
          <div key={i} className="relative">
            <img src={src} alt="" className="h-16 w-16 object-cover rounded-xl" />
            <button
              onClick={() => onChange(images.filter((_, j) => j !== i))}
              className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground"
              aria-label="Remove"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
        {canAddMore && (
          <button
            onClick={() => ref.current?.click()}
            className="h-16 w-16 rounded-xl border border-dashed border-border/60 flex items-center justify-center text-muted-foreground hover:bg-accent/40"
          >
            <Plus className="w-5 h-5" />
          </button>
        )}
      </div>
      <input
        ref={ref}
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          onFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
