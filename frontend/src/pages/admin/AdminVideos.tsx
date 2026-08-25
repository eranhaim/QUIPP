import { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { Trash2, Copy } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import VideoUpload from '@/components/VideoUpload';
import type { Video } from '@/lib/types';

const AdminVideos = () => {
  const qc = useQueryClient();
  const [copied, setCopied] = useState<string | null>(null);

  const q = useQuery({
    queryKey: ['admin', 'videos'],
    queryFn: () => api<{ videos: Video[] }>('/api/admin/videos', { auth: true }),
  });

  const del = useMutation({
    mutationFn: (id: string) =>
      api(`/api/admin/videos/${id}`, { method: 'DELETE', auth: true }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'videos'] }),
  });

  const copy = async (id: string) => {
    try {
      await navigator.clipboard.writeText(id);
      setCopied(id);
      setTimeout(() => setCopied(null), 1200);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div>
        <h1 className="text-3xl font-bold font-display text-foreground mb-6">Videos</h1>

        {q.isPending && <p className="text-sm text-muted-foreground">Loading…</p>}
        {q.error && (
          <p className="text-sm text-destructive">
            {q.error instanceof ApiError && q.error.status === 503
              ? 'Video storage is not configured on the server. Set the AWS_* env vars and restart.'
              : 'Could not load videos.'}
          </p>
        )}

        <div className="grid gap-3">
          {q.data?.videos.map((v) => (
            <div
              key={v.id}
              className="bg-card rounded-2xl p-5 flex items-center justify-between gap-4"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                      v.status === 'ready'
                        ? 'bg-primary text-primary-foreground'
                        : v.status === 'pending'
                          ? 'bg-muted text-muted-foreground'
                          : 'bg-destructive text-destructive-foreground'
                    }`}
                  >
                    {v.status}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {formatSize(v.sizeBytes)} · {v.durationSec ? formatDuration(v.durationSec) : '—'}
                  </span>
                </div>
                <p className="text-base font-semibold text-card-foreground truncate">{v.title}</p>
                <p className="text-xs text-muted-foreground truncate font-mono">{v.id}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full"
                  onClick={() => copy(v.id)}
                >
                  <Copy className="w-4 h-4 mr-1" aria-hidden />
                  {copied === v.id ? 'Copied' : 'Copy id'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full text-destructive"
                  onClick={() => {
                    if (confirm(`Delete "${v.title}"? This cannot be undone.`)) {
                      del.mutate(v.id);
                    }
                  }}
                >
                  <Trash2 className="w-4 h-4" aria-hidden />
                  <span className="sr-only">Delete</span>
                </Button>
              </div>
            </div>
          ))}
          {q.data && q.data.videos.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No videos yet. Upload one to get started.
            </p>
          )}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-foreground mb-3">Upload</h2>
        <VideoUpload onUploaded={() => qc.invalidateQueries({ queryKey: ['admin', 'videos'] })} />
      </div>
    </div>
  );
};

function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}
function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default AdminVideos;
