import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { Mail, ShieldAlert } from 'lucide-react';
import AppShell from '@/components/AppShell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import type { Introduction } from '@/lib/types';

interface ConnectionsResponse {
  incoming: Introduction[];
  outgoing: Introduction[];
}

export default function Connections() {
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') === 'outgoing' ? 'outgoing' : 'incoming';
  const introductions = useQuery({
    queryKey: ['introductions'],
    queryFn: () => api<ConnectionsResponse>('/api/introductions/me', { auth: true }),
  });
  const items = introductions.data?.[tab] ?? [];

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 py-8 md:px-8 md:py-12">
        <header>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
            Double opt-in
          </p>
          <h1 className="mt-2 text-3xl font-extrabold font-display uppercase md:text-5xl">
            Connections
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Review professional introductions. Email appears only after both people consent.
          </p>
        </header>

        <Tabs
          value={tab}
          className="mt-8"
          onValueChange={(value) => setParams({ tab: value })}
        >
          <TabsList aria-label="Introduction direction">
            <TabsTrigger value="incoming">
              Incoming ({introductions.data?.incoming.length ?? 0})
            </TabsTrigger>
            <TabsTrigger value="outgoing">
              Outgoing ({introductions.data?.outgoing.length ?? 0})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <p className="mt-5 text-sm text-muted-foreground" aria-live="polite">
          {introductions.isPending
            ? 'Loading introductions…'
            : introductions.isError
              ? 'Connections are unavailable right now.'
              : items.length === 0
                ? `No ${tab} introductions yet.`
                : ''}
        </p>
        <section className="mt-4 space-y-4" aria-label={`${tab} introductions`}>
          {items.map((introduction) => (
            <ConnectionCard key={introduction.id} introduction={introduction} />
          ))}
        </section>
      </div>
    </AppShell>
  );
}

function ConnectionCard({ introduction }: { introduction: Introduction }) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: ({ action, body }: { action: string; body?: unknown }) =>
      api(`/api/introductions/${introduction.id}/${action}`, {
        method: 'POST',
        auth: true,
        body,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['introductions'] });
      toast({ title: 'Connection updated' });
    },
    onError: (error: Error) =>
      toast({ title: 'Could not update connection', description: error.message, variant: 'destructive' }),
  });

  const report = () => {
    const reason = window.prompt('Why are you reporting this introduction?');
    if (!reason?.trim() || !window.confirm('Report this introduction? This cannot be undone.')) return;
    mutation.mutate({ action: 'report', body: { reason } });
  };
  const cancel = () => {
    if (window.confirm('Cancel this pending introduction request?')) {
      mutation.mutate({ action: 'cancel' });
    }
  };

  const name =
    [introduction.counterpart.firstName, introduction.counterpart.lastName]
      .filter(Boolean)
      .join(' ') || `@${introduction.counterpart.username}`;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>
              <Link to={`/p/${introduction.counterpart.username}`} className="hover:underline">
                {name}
              </Link>
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              @{introduction.counterpart.username} · {new Date(introduction.createdAt).toLocaleDateString()}
            </p>
          </div>
          <Badge variant={introduction.status === 'connected' ? 'default' : 'secondary'}>
            {introduction.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Purpose</p>
          <p className="mt-1 text-sm">{introduction.purpose}</p>
        </div>

        {introduction.status === 'connected' && introduction.counterpart.email ? (
          <a
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
            href={`mailto:${introduction.counterpart.email}`}
          >
            <Mail className="h-4 w-4" aria-hidden />
            {introduction.counterpart.email}
          </a>
        ) : (
          <p className="text-sm text-muted-foreground">
            Contact details remain hidden until this request is accepted.
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          {introduction.direction === 'incoming' && introduction.status === 'pending' ? (
            <>
              <Button
                disabled={mutation.isPending}
                onClick={() => mutation.mutate({ action: 'accept' })}
              >
                Accept and share email
              </Button>
              <Button
                variant="outline"
                disabled={mutation.isPending}
                onClick={() => mutation.mutate({ action: 'decline' })}
              >
                Decline
              </Button>
            </>
          ) : null}
          {introduction.direction === 'outgoing' && introduction.status === 'pending' ? (
            <Button variant="outline" disabled={mutation.isPending} onClick={cancel}>
              Cancel request
            </Button>
          ) : null}
          {introduction.status === 'connected' ? (
            <>
              <Button
                size="sm"
                variant="outline"
                disabled={mutation.isPending}
                onClick={() => mutation.mutate({ action: 'outcome', body: { helpful: true } })}
              >
                Helpful
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={mutation.isPending}
                onClick={() => mutation.mutate({ action: 'outcome', body: { helpful: false } })}
              >
                Not helpful
              </Button>
            </>
          ) : null}
          {introduction.status !== 'reported' ? (
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive"
              disabled={mutation.isPending}
              onClick={report}
            >
              <ShieldAlert className="h-4 w-4" aria-hidden />
              Report
            </Button>
          ) : null}
        </div>
        <p className="sr-only" aria-live="polite">
          {mutation.isPending ? 'Updating connection' : ''}
        </p>
      </CardContent>
    </Card>
  );
}
