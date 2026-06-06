import { useEffect, useState, type ImgHTMLAttributes } from "react";

const MEDIA_CACHE_PREFIX = "megsy_media_blob_v1_";
const memoryCache = new Map<string, string>();

const keyFor = (src: string) => `${MEDIA_CACHE_PREFIX}${encodeURIComponent(src).slice(0, 180)}`;

const remember = (src: string, dataUrl: string) => {
  memoryCache.set(src, dataUrl);
  try {
    localStorage.setItem(keyFor(src), dataUrl);
  } catch {
    try {
      Object.keys(localStorage)
        .filter((key) => key.startsWith(MEDIA_CACHE_PREFIX))
        .slice(0, 12)
        .forEach((key) => localStorage.removeItem(key));
      localStorage.setItem(keyFor(src), dataUrl);
    } catch {
      /* cache full or unavailable */
    }
  }
};

export const preloadMediaImage = async (src?: string | null) => {
  if (!src || src.startsWith("data:") || memoryCache.has(src)) return;
  try {
    const stored = localStorage.getItem(keyFor(src));
    if (stored) {
      memoryCache.set(src, stored);
      return;
    }
  } catch {
    /* ignore */
  }

  try {
    const response = await fetch(src, { cache: "force-cache" });
    const blob = await response.blob();
    const reader = new FileReader();
    reader.onload = () => remember(src, reader.result as string);
    reader.readAsDataURL(blob);
  } catch {
    /* keep browser cache fallback */
  }
};

type CachedMediaImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  src?: string;
  thumbWidth?: number;
};

const CachedMediaImage = ({ src, thumbWidth: _thumbWidth, ...props }: CachedMediaImageProps) => {
  const [resolvedSrc, setResolvedSrc] = useState(() => {
    if (!src || src.startsWith("data:")) return src;
    const inMemory = memoryCache.get(src);
    if (inMemory) return inMemory;
    try {
      const stored = localStorage.getItem(keyFor(src));
      if (stored) {
        memoryCache.set(src, stored);
        return stored;
      }
    } catch {
      /* ignore */
    }
    return src;
  });

  useEffect(() => {
    if (!src || src.startsWith("data:")) {
      setResolvedSrc(src);
      return;
    }

    const inMemory = memoryCache.get(src);
    if (inMemory) {
      setResolvedSrc(inMemory);
      return;
    }

    try {
      const stored = localStorage.getItem(keyFor(src));
      if (stored) {
        memoryCache.set(src, stored);
        setResolvedSrc(stored);
        return;
      }
    } catch {
      /* ignore */
    }

    setResolvedSrc(src);
    preloadMediaImage(src);
  }, [src]);

  return <img src={resolvedSrc} {...props} />;
};

export default CachedMediaImage;