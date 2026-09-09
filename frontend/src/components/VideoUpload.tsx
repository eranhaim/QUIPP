import { useCallback, useRef, useState } from 'react';
import { Upload, CheckCircle2, X } from 'lucide-react';
import { api, ApiError, uploadToPresigned } from '@/lib/api';
import { Button } from '@/components/ui/button';
import type { Video } from '@/lib/types';

interface VideoUploadProps {
  onUploaded?: (video: Video) => void;
  endpointBase?: string;
}

const MAX_BYTES = 500 * 1024 * 1024;
const ALLOWED = new Set(['video/mp4', 'video/webm', 'video/quicktime']);

const VideoUpload = ({ onUploaded, endpointBase = '/api/admin/videos' }: VideoUploadProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const uploading = progress !== null && !done;

  const pick = (f: File) => {
    setError(null);
    setDone(false);
    setProgress(null);
    if (!ALLOWED.has(f.type)) {
      setError(`Unsupported type: ${f.type || 'unknown'}. Use MP4, WebM, or MOV.`);
      return;
    }
    if (f.size > MAX_BYTES) {
      setError(`File is too large (${Math.round(f.size / 1024 / 1024)} MB). Max 500 MB.`);
      return;
    }
    setFile(f);
    if (!title) setTitle(f.name.replace(/\.[^.]+$/, ''));
  };

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) pick(f);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const upload = async () => {
    if (!file) return;
    setError(null);
    setProgress(0);
    setDone(false);
    try {
      const draft = await api<{ video: Video; uploadUrl: string; s3Key: string }>(
        endpointBase,
        {
          method: 'POST',
          auth: true,
          body: {
            title: title.trim() || file.name,
            originalFilename: file.name,
            mimeType: file.type,
            sizeBytes: file.size,
          },
        },
      );
      await uploadToPresigned(draft.uploadUrl, file, file.type, setProgress);
      const durationSec = await probeDuration(file).catch(() => undefined);
      const { video } = await api<{ video: Video }>(
        `${endpointBase}/${draft.video.id}/confirm`,
        { method: 'POST', auth: true, body: { durationSec } },
      );
      setDone(true);
      setProgress(100);
      onUploaded?.(video);
      setTimeout(() => {
        setFile(null);
        setTitle('');
        setProgress(null);
        setDone(false);
      }, 1200);
    } catch (err) {
      setProgress(null);
      setError(err instanceof ApiError ? err.message : 'Upload failed');
    }
  };

  return (
    <div className="bg-card rounded-2xl p-6 space-y-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click();
        }}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
          dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-foreground'
        }`}
      >
        <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" aria-hidden />
        <p className="text-sm text-foreground font-medium">
          {file ? file.name : 'Drop a video, or click to browse'}
        </p>
        <p className="text-xs text-muted-foreground mt-1">MP4, WebM or MOV · up to 500 MB</p>
        <input
          ref={inputRef}
          type="file"
          accept="video/mp4,video/webm,video/quicktime"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) pick(f);
          }}
        />
      </div>

      {file && !done && (
        <div className="space-y-3">
          <div>
            <label htmlFor="video-title" className="text-xs font-medium text-card-foreground block mb-1.5">
              Title
            </label>
            <input
              id="video-title"
              className="w-full h-11 px-4 rounded-full border-2 border-border bg-background text-foreground text-sm focus:outline-none focus:border-primary"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={uploading}
            />
          </div>

          {progress !== null && (
            <div>
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Uploading</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button className="flex-1 rounded-full" onClick={upload} disabled={uploading}>
              {uploading ? 'Uploading…' : 'Upload'}
            </Button>
            {!uploading && (
              <Button
                variant="ghost"
                className="rounded-full"
                onClick={() => {
                  setFile(null);
                  setTitle('');
                  setError(null);
                }}
              >
                <X className="w-4 h-4" aria-hidden />
                <span className="sr-only">Cancel</span>
              </Button>
            )}
          </div>
        </div>
      )}

      {done && (
        <div className="flex items-center gap-2 text-sm text-primary">
          <CheckCircle2 className="w-4 h-4" aria-hidden /> Upload complete.
        </div>
      )}
      {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
    </div>
  );
};

/**
 * Best-effort duration read from a File. Falls back to undefined so the server
 * simply stores whatever it already has.
 */
function probeDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      resolve(video.duration);
      URL.revokeObjectURL(video.src);
    };
    video.onerror = () => reject(new Error('cannot read metadata'));
    video.src = URL.createObjectURL(file);
  });
}

export default VideoUpload;
