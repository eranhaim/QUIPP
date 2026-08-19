import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { QRCodeSVG } from 'qrcode.react';
import { CheckCircle2, XCircle } from 'lucide-react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { api, ApiError } from '@/lib/api';
import type { TagName, Tier, VerifyResult } from '@/lib/types';

const TAG_LABEL: Record<TagName, string> = {
  THERMAL: 'Thermal',
  COLD: 'Cold',
  BEVERAGE: 'Beverage',
  DIGITAL: 'Digital',
  SERVICE: 'Service',
};

const TAG_ICON: Record<TagName, string> = {
  THERMAL: '🔥',
  COLD: '❄️',
  BEVERAGE: '☕',
  DIGITAL: '💻',
  SERVICE: '🍽️',
};

const TIER_STYLES: Record<Tier, string> = {
  IN: 'bg-foreground text-background',
  DEEP: 'bg-secondary text-secondary-foreground',
  THERE: 'bg-primary text-primary-foreground',
};

const Verify = () => {
  const { id = '' } = useParams();
  const verifyUrl = `${window.location.origin}/verify/${id}`;

  const query = useQuery({
    queryKey: ['verify', id],
    queryFn: () => api<VerifyResult>(`/api/credentials/verify/${id}`),
    enabled: !!id,
    retry: false,
  });

  if (query.isPending) {
    return (
      <Layout>
        <section className="pt-16 pb-24 max-w-[600px] mx-auto px-5">
          <div className="h-6 w-40 bg-muted rounded animate-pulse mb-6" />
          <div className="h-10 w-2/3 bg-muted rounded animate-pulse" />
          <div className="mt-6 h-48 w-full bg-muted rounded-3xl animate-pulse" />
        </section>
      </Layout>
    );
  }

  if (query.isError || !query.data) {
    const notFound = query.error instanceof ApiError && query.error.status === 404;
    return (
      <Layout>
        <section className="pt-16 md:pt-28 pb-24">
          <div className="max-w-[600px] mx-auto px-5 text-center">
            <XCircle className="h-14 w-14 text-destructive mx-auto mb-4" aria-hidden />
            <h1 className="text-3xl md:text-4xl font-bold font-display text-foreground uppercase">
              {notFound ? 'Credential not found' : 'Verification failed'}
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              {notFound
                ? 'This QUIPP verification ID does not match any credential in the network.'
                : 'Something went wrong. Try again in a moment.'}
            </p>
            <Button asChild className="mt-6 rounded-full">
              <Link to="/">Back to QUIPP</Link>
            </Button>
          </div>
        </section>
      </Layout>
    );
  }

  const { credential, holder } = query.data;
  const holderName = holder.firstName ?? holder.username;

  return (
    <Layout>
      <section className="pt-16 md:pt-28 pb-24">
        <div className="max-w-[600px] mx-auto px-5">
          <div className="text-center mb-10">
            <span className="text-2xl font-bold font-display text-secondary lowercase mb-4 block">
              quipp
            </span>
            <h1 className="text-[32px] md:text-[48px] font-bold font-display text-foreground mb-4 uppercase tracking-tight">
              Credential verified
            </h1>
            <p className="inline-flex items-center gap-2 text-xl font-bold font-display text-secondary">
              <CheckCircle2 className="h-6 w-6" aria-hidden />
              Verified
            </p>
          </div>

          <div className="bg-card rounded-3xl p-8 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">{TAG_ICON[credential.tagName]}</span>
              <span className="text-xs font-bold uppercase text-muted-foreground">
                {TAG_LABEL[credential.tagName]}
              </span>
            </div>
            <h3 className="text-xl font-semibold text-card-foreground">
              <Link to={`/passport/${holder.username}`} className="hover:underline">
                {holderName}
              </Link>
            </h3>
            <p className="text-sm text-muted-foreground mb-3">@{holder.username}</p>
            <p className="text-lg text-card-foreground mb-2">{credential.courseName}</p>
            <span
              className={`inline-block text-[11px] font-bold uppercase px-3 py-1 rounded-full ${TIER_STYLES[credential.tier]} mb-2`}
            >
              {credential.tier}
            </span>
            {credential.isManufacturer && (
              <span className="inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border border-secondary/40 text-secondary ml-2">
                {credential.provider}
              </span>
            )}
            <p className="text-sm text-muted-foreground mt-2">
              Earned:{' '}
              {new Date(credential.earnedDate).toLocaleDateString('en-US', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </p>
            <p className="text-xs text-muted-foreground font-mono mt-1">
              ID: {credential.verificationId}
            </p>
          </div>

          {credential.skillsDemonstrated.length > 0 && (
            <div className="bg-card rounded-3xl p-8 mb-6">
              <h3 className="text-lg font-bold font-display text-card-foreground mb-3 uppercase">
                Skills verified
              </h3>
              <ul className="space-y-2">
                {credential.skillsDemonstrated.map((skill, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="text-secondary" aria-hidden="true">→</span>
                    {skill}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="text-center">
            <div className="flex justify-center mb-4">
              <QRCodeSVG
                value={verifyUrl}
                size={120}
                bgColor="#ffffff"
                fgColor="#221f20"
                title={`QR code linking to ${verifyUrl}`}
              />
            </div>
            <p className="text-lg font-bold font-display text-foreground mb-4 uppercase">
              Earn yours.
            </p>
            <Button className="rounded-full h-12 px-8 font-bold" asChild>
              <Link to="/signup">Start →</Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Verify;
