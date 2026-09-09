import { CheckCircle2, XCircle } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import AppShell from '@/components/AppShell';
import { Button } from '@/components/ui/button';

export default function CoursePackCheckoutStatus() {
  const { pathname, search } = useLocation();
  const success = pathname.endsWith('/success');
  const hasSession = new URLSearchParams(search).has('session_id');

  return (
    <AppShell>
      <main className="mx-auto max-w-xl px-5 py-16 text-center">
        <div className="rounded-3xl bg-card p-8">
          {success ? (
            <CheckCircle2 className="mx-auto h-12 w-12 text-primary" aria-hidden="true" />
          ) : (
            <XCircle className="mx-auto h-12 w-12 text-muted-foreground" aria-hidden="true" />
          )}
          <h1 className="mt-5 text-3xl font-bold font-display">
            {success ? 'Checkout complete' : 'Checkout cancelled'}
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            {success
              ? hasSession
                ? 'Your payment was received. Seats can take a moment to appear while payment confirmation finishes.'
                : 'Your course seats are being prepared.'
              : 'No charge was made. You can return to Training whenever you are ready.'}
          </p>
          <Button asChild className="mt-6 rounded-full">
            <Link to="/operator/training">
              {success ? 'View course packs' : 'Return to Training'}
            </Link>
          </Button>
        </div>
      </main>
    </AppShell>
  );
}
