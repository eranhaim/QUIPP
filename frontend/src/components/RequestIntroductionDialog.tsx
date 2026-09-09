import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Mail } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface RequestIntroductionDialogProps {
  username: string;
  triggerClassName?: string;
}

export default function RequestIntroductionDialog({
  username,
  triggerClassName,
}: RequestIntroductionDialogProps) {
  const [open, setOpen] = useState(false);
  const [purpose, setPurpose] = useState('');
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: () =>
      api('/api/introductions', {
        method: 'POST',
        auth: true,
        body: { candidateUsername: username, purpose, approvedChannel: 'email' },
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['introductions'] });
      setOpen(false);
      setPurpose('');
      toast({
        title: 'Request sent',
        description: `@${username} must accept before either email is shared.`,
      });
    },
    onError: (error: Error) => {
      toast({ title: 'Could not send request', description: error.message, variant: 'destructive' });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className={triggerClassName}>
          <Mail className="h-4 w-4" aria-hidden />
          Request introduction
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Request an introduction to @{username}</DialogTitle>
          <DialogDescription>
            Your purpose is shared now. Your email is shared only if @{username} accepts.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor={`intro-purpose-${username}`}>Professional purpose</Label>
            <Textarea
              id={`intro-purpose-${username}`}
              value={purpose}
              onChange={(event) => setPurpose(event.target.value)}
              placeholder="Explain why you would like to connect and what you hope to discuss."
              minLength={10}
              maxLength={500}
              rows={5}
            />
            <p className="text-xs text-muted-foreground">{purpose.length}/500 characters</p>
          </div>
          <div className="rounded-xl border border-border bg-muted/40 p-4 text-sm">
            <p className="font-semibold">Disclosure preview</p>
            <p className="mt-1 text-muted-foreground">
              @{username} will see this purpose and your public Passport. If they accept, both
              parties will see the email attached to their QUIPP account.
            </p>
          </div>
          <p className="sr-only" aria-live="polite">
            {mutation.isPending ? 'Sending introduction request' : ''}
          </p>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Back
          </Button>
          <Button
            type="button"
            disabled={purpose.trim().length < 10 || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? 'Sending…' : 'Consent and send'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
