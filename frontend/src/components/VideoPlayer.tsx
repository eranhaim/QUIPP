import { useEffect, useRef, useState } from 'react';

interface VideoPlayerProps {
  src: string;
  mimeType?: string | null;
  storageKey?: string;
  onWatchedPctChange?: (pct: number) => void;
  className?: string;
}

/**
 * Accessible HTML5 video player. Reports watched percentage on `timeupdate`.
 * Remembers the last watched position in localStorage per `storageKey`
 * so users can resume where they left off within the same browser.
 */
const VideoPlayer = ({
  src,
  mimeType,
  storageKey,
  onWatchedPctChange,
  className = '',
}: VideoPlayerProps) => {
  const ref = useRef<HTMLVideoElement>(null);
  const [watchedPct, setWatchedPct] = useState(0);

  useEffect(() => {
    const v = ref.current;
    if (!v || !storageKey) return;
    const saved = Number(localStorage.getItem(`video-pos:${storageKey}`) ?? '0');
    if (Number.isFinite(saved) && saved > 1) {
      v.currentTime = saved;
    }
  }, [storageKey, src]);

  const handleTimeUpdate = () => {
    const v = ref.current;
    if (!v || !v.duration || Number.isNaN(v.duration)) return;
    const pct = Math.min(100, Math.round((v.currentTime / v.duration) * 100));
    if (pct !== watchedPct) {
      setWatchedPct(pct);
      onWatchedPctChange?.(pct);
    }
    if (storageKey && Math.floor(v.currentTime) % 5 === 0) {
      localStorage.setItem(`video-pos:${storageKey}`, String(v.currentTime));
    }
  };

  const handleEnded = () => {
    setWatchedPct(100);
    onWatchedPctChange?.(100);
    if (storageKey) localStorage.removeItem(`video-pos:${storageKey}`);
  };

  return (
    <video
      ref={ref}
      controls
      preload="metadata"
      onTimeUpdate={handleTimeUpdate}
      onEnded={handleEnded}
      className={`w-full rounded-2xl bg-black ${className}`}
      playsInline
    >
      <source src={src} type={mimeType ?? 'video/mp4'} />
      {/* <track kind="captions" src="…" srclang="en" /> reserved for future captions */}
      Your browser does not support the video tag.
    </video>
  );
};

export default VideoPlayer;
