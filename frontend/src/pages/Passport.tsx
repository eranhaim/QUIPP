import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { Share2, Copy } from 'lucide-react';
import AuthAwareShell from '@/components/AuthAwareShell';
import InitialsAvatar from '@/components/InitialsAvatar';
import TechScoreRing from '@/components/TechScoreRing';
import CredentialPatch from '@/components/CredentialPatch';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import type { Credential, Profile, TagName, Tier } from '@/lib/types';

const TAG_LABEL: Record<TagName, string> = {
  THERMAL: 'Thermal',
  COLD: 'Cold',
  BEVERAGE: 'Beverage',
  DIGITAL: 'Digital',
  SERVICE: 'Service',
};

const TIER_STYLES: Record<Tier, { bg: string; fg: string }> = {
  IN: { bg: 'bg-foreground', fg: 'text-background' },
  DEEP: { bg: 'bg-secondary', fg: 'text-secondary-foreground' },
  THERE: { bg: 'bg-primary', fg: 'text-primary-foreground' },
};

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay },
});

const SectionHeader = ({ children }: { children: React.ReactNode }) => (
  <div className="mb-6">
    <h2 className="text-xl md:text-2xl font-bold font-display text-foreground uppercase">
      {children}
    </h2>
    <div className="w-12 h-0.5 bg-primary mt-2" />
  </div>
);

function fetchProfile(username: string) {
  return api<{ profile: Profile }>(`/api/profile/username/${username}`);
}
function fetchCredentials(username: string) {
  return api<{ credentials: Credential[] }>(`/api/credentials/user/${username}`);
}

const Passport = () => {
  const { username = '' } = useParams();
  const { profile: myProfile } = useAuth();
  const [selectedCred, setSelectedCred] = useState<Credential | null>(null);

  const profileQuery = useQuery({
    queryKey: ['profile', 'username', username],
    queryFn: () => fetchProfile(username),
    enabled: !!username,
  });
  const credentialsQuery = useQuery({
    queryKey: ['credentials', 'user', username],
    queryFn: () => fetchCredentials(username),
    enabled: !!username,
  });

  if (profileQuery.isPending) {
    return (
      <AuthAwareShell>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-sm text-muted-foreground">Loading…</div>
        </div>
      </AuthAwareShell>
    );
  }

  if (profileQuery.isError || !profileQuery.data) {
    return (
      <AuthAwareShell>
        <section className="py-20 text-center">
          <h1 className="text-3xl font-bold font-display uppercase">Passport not found</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            The QUIPP passport for <span className="font-mono">@{username}</span> does not exist.
          </p>
          <Button asChild className="mt-6 rounded-full">
            <Link to="/">Home</Link>
          </Button>
        </section>
      </AuthAwareShell>
    );
  }

  const profile = profileQuery.data.profile;
  const credentials = credentialsQuery.data?.credentials ?? [];
  const isOwner = myProfile?.username === profile.username;
  const passportUrl = `${window.location.origin}/p/${profile.username}`;
  const hasCredentials = credentials.length > 0;

  const copyLink = () => {
    navigator.clipboard.writeText(passportUrl);
    toast({ title: 'Copied', description: 'Passport link copied.' });
  };

  return (
    <AuthAwareShell>
      <section className="py-12 md:py-20" style={{ background: '#36186b' }}>
        <motion.div {...fade()} className="max-w-[680px] mx-auto px-5 text-center">
          <InitialsAvatar
            firstName={profile.firstName ?? profile.username[0]}
            lastName={profile.lastName ?? ''}
            size={80}
            className="mx-auto mb-4"
          />

          <h1 className="text-3xl md:text-5xl font-extrabold font-display text-white mb-1 tracking-tight uppercase">
            {profile.firstName ?? profile.username}
          </h1>
          {profile.techRole && (
            <p className="text-sm font-bold text-primary mb-1">{profile.techRole}</p>
          )}
          {profile.location && (
            <p className="text-sm text-white/70 mb-1">{profile.location}</p>
          )}

          <div className="my-8">
            <TechScoreRing score={profile.techProficiencyScore} size={120} />
          </div>

          <Button className="rounded-full h-12 px-8 font-bold w-full max-w-xs" onClick={copyLink}>
            <Share2 className="w-4 h-4" /> Share Passport
          </Button>
        </motion.div>
      </section>

      <section className="py-12 bg-background">
        <motion.div {...fade(0.15)} className="max-w-[680px] mx-auto px-5">
          <SectionHeader>Credentials</SectionHeader>
          {credentialsQuery.isPending ? (
            <div className="grid grid-cols-3 gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="aspect-square rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : hasCredentials ? (
            <div className="grid grid-cols-3 gap-3">
              {credentials.map((cred) => (
                <CredentialPatch
                  key={cred.id}
                  credential={cred}
                  onClick={() => setSelectedCred(cred)}
                />
              ))}
              {isOwner && (
                <Link
                  to="/academy"
                  className="w-full aspect-square rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center text-center hover:border-primary transition-colors"
                >
                  <span className="text-2xl mb-1">+</span>
                  <span className="text-[10px] text-muted-foreground font-medium">
                    Earn your next credential →
                  </span>
                </Link>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground mb-4">
                {isOwner
                  ? 'Every great Passport starts here.'
                  : `${profile.firstName ?? '@' + profile.username} has not earned a QUIPP credential yet.`}
              </p>
              {isOwner && (
                <Button className="rounded-full h-12 px-8 font-bold" asChild>
                  <Link to="/academy">Earn your first credential</Link>
                </Button>
              )}
            </div>
          )}
        </motion.div>
      </section>

      {(profile.specialty || profile.baseRole || profile.yearsExperience > 0) && (
        <section className="py-12 bg-background">
          <motion.div {...fade(0.2)} className="max-w-[680px] mx-auto px-5">
            <SectionHeader>Background</SectionHeader>
            <div className="bg-card rounded-xl p-5 space-y-2">
              {profile.baseRole && (
                <Row label="Role" value={profile.baseRole} />
              )}
              {profile.specialty && (
                <Row label="Specialty" value={profile.specialty} />
              )}
              {profile.yearsExperience > 0 && (
                <Row
                  label="Experience"
                  value={`${profile.yearsExperience} year${profile.yearsExperience === 1 ? '' : 's'}`}
                />
              )}
            </div>
          </motion.div>
        </section>
      )}

      <section className="py-16" style={{ background: '#221f20' }}>
        <motion.div {...fade(0.3)} className="max-w-[680px] mx-auto px-5 text-center">
          <h2 className="text-3xl md:text-[48px] font-extrabold font-display text-white mb-3 tracking-tight leading-[1.1]">
            Permanently yours.
          </h2>
          <p className="text-sm text-white/60 mb-2 max-w-md mx-auto">
            Every credential on this Passport is permanently verifiable at
          </p>
          <a
            href={passportUrl}
            className="text-sm font-bold text-primary hover:underline mb-6 inline-block break-all"
          >
            quipp.co/p/{profile.username}
          </a>
          <div className="flex justify-center mb-6">
            <QRCodeSVG value={passportUrl} size={140} bgColor="transparent" fgColor="#d1f300" />
          </div>
          <Button
            className="rounded-full h-12 px-8 font-bold"
            variant="outline"
            onClick={copyLink}
            style={{
              background: '#221f20',
              color: '#fff',
              borderColor: 'rgba(255,255,255,0.3)',
            }}
          >
            <Copy className="w-4 h-4" /> Copy Link
          </Button>
        </motion.div>
      </section>

      <Dialog open={!!selectedCred} onOpenChange={(open) => !open && setSelectedCred(null)}>
        <DialogContent className="bg-background border-border max-w-md rounded-xl">
          {selectedCred && (
            <div>
              <div
                className={`w-full aspect-square rounded-xl flex flex-col items-center justify-center gap-2 mb-6 relative ${TIER_STYLES[selectedCred.tier].bg} ${TIER_STYLES[selectedCred.tier].fg}`}
              >
                <span className="text-5xl">{tagIcon(selectedCred.tagName)}</span>
                <span className="text-lg font-bold font-display uppercase text-center px-4">
                  {selectedCred.courseName}
                </span>
                <span className="text-sm font-bold uppercase opacity-70">{selectedCred.tier}</span>
                <span className="absolute bottom-2 left-3 text-xs font-display font-bold opacity-50 lowercase">
                  quipp
                </span>
                {selectedCred.isManufacturer && (
                  <span className="absolute bottom-2 right-3 text-xs font-bold opacity-50">
                    {selectedCred.provider}
                  </span>
                )}
              </div>

              <h3 className="text-xl font-bold font-display text-foreground mb-2">
                {selectedCred.courseName}
              </h3>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span
                  className={`inline-block text-[11px] font-bold uppercase px-3 py-1 rounded-full ${TIER_STYLES[selectedCred.tier].bg} ${TIER_STYLES[selectedCred.tier].fg}`}
                >
                  {selectedCred.tier}
                </span>
                <span className="inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border border-border text-muted-foreground">
                  {TAG_LABEL[selectedCred.tagName]}
                </span>
              </div>

              <p className="text-sm text-muted-foreground mt-3">
                Earned:{' '}
                {new Date(selectedCred.earnedDate).toLocaleDateString('en-US', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
              {selectedCred.quizScore != null && (
                <p className="text-sm text-muted-foreground">Score: {selectedCred.quizScore}%</p>
              )}
              <p className="text-xs text-muted-foreground mt-1 font-mono">
                {selectedCred.verificationId}
              </p>

              {selectedCred.skillsDemonstrated.length > 0 && (
                <>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mt-4 mb-2">
                    Skills verified
                  </h4>
                  <ul className="space-y-1 mb-4">
                    {selectedCred.skillsDemonstrated.map((skill, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-sm text-muted-foreground"
                      >
                        <span className="text-primary">●</span>
                        {skill}
                      </li>
                    ))}
                  </ul>
                </>
              )}

              <div className="flex gap-2 mt-4">
                <Button className="flex-1 rounded-full" asChild>
                  <Link to={`/verify/${selectedCred.verificationId}`}>Verify</Link>
                </Button>
                <Button variant="outline" className="flex-1 rounded-full" onClick={copyLink}>
                  Share
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AuthAwareShell>
  );
};

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between text-sm">
    <span className="text-muted-foreground uppercase tracking-widest text-[11px]">{label}</span>
    <span className="text-foreground font-medium">{value}</span>
  </div>
);

function tagIcon(tag: TagName): string {
  switch (tag) {
    case 'THERMAL':
      return '🔥';
    case 'COLD':
      return '❄️';
    case 'BEVERAGE':
      return '☕';
    case 'DIGITAL':
      return '💻';
    case 'SERVICE':
      return '🍽️';
  }
}

export default Passport;
