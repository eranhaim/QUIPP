import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { Share2, Copy } from 'lucide-react';
import Layout from '@/components/Layout';
import InitialsAvatar from '@/components/InitialsAvatar';
import TechScoreRing from '@/components/TechScoreRing';
import CredentialPatch from '@/components/CredentialPatch';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { sampleUser, sampleCredentials, sampleExperiences, tierConfig, techTagConfig } from '@/data/mockData';
import { toast } from '@/hooks/use-toast';

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay },
});

const SectionHeader = ({ children }: { children: React.ReactNode }) => (
  <div className="mb-6">
    <h2 className="text-xl md:text-2xl font-bold font-display text-foreground uppercase">{children}</h2>
    <div className="w-12 h-0.5 bg-primary mt-2" />
  </div>
);

const Passport = () => {
  const { username } = useParams();
  const user = sampleUser;
  const [visibility, setVisibility] = useState(user.visibilityStatus);
  const [selectedCred, setSelectedCred] = useState<typeof sampleCredentials[0] | null>(null);
  const passportUrl = `${window.location.origin}/p/${user.username}`;
  const hasCredentials = sampleCredentials.length > 0;

  const copyLink = () => {
    navigator.clipboard.writeText(passportUrl);
    toast({ title: 'Copied', description: 'Passport link copied.' });
  };

  return (
    <Layout>
      {/* ──── SECTION 1: IDENTITY HERO (Purple) ──── */}
      <section className="py-12 md:py-20" style={{ background: '#36186b' }}>
        <motion.div {...fade()} className="max-w-[680px] mx-auto px-5 text-center">
          <InitialsAvatar firstName={user.firstName} lastName={user.lastName || ''} size={80} className="mx-auto mb-4" />

          <h1 className="text-3xl md:text-5xl font-extrabold font-display text-white mb-1 tracking-tight uppercase">
            {user.nickname || user.firstName}
          </h1>
          {user.title && <p className="text-sm font-bold text-primary mb-1">{user.title}</p>}
          <p className="text-sm text-white/70 mb-1">The Drake Hotel — Kitchen</p>

          {/* Tech Score */}
          <div className="my-8">
            <TechScoreRing score={user.techProficiencyScore} size={120} />
          </div>

          {/* Status Toggle */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
            {([
              { value: 'open' as const, label: 'OPEN' },
              { value: 'employed' as const, label: 'EMPLOYED' },
              { value: 'private' as const, label: 'PRIVATE' },
            ]).map(opt => (
              <button
                key={opt.value}
                onClick={() => setVisibility(opt.value)}
                className={`text-xs font-bold px-5 py-2.5 rounded-full transition-all ${
                  visibility === opt.value
                    ? 'bg-primary text-primary-foreground'
                    : 'border border-white/30 text-white/70 hover:border-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <Button
            className="rounded-full h-12 px-8 font-bold w-full max-w-xs"
            onClick={copyLink}
          >
            <Share2 className="w-4 h-4" /> Share Passport
          </Button>
        </motion.div>
      </section>

      {/* ──── SECTION 2: TECH STACK ──── */}
      <section className="py-12 bg-background">
        <motion.div {...fade(0.1)} className="max-w-[680px] mx-auto px-5">
          <SectionHeader>Tech Stack</SectionHeader>
          {user.equipment.length > 0 ? (
            <div className="flex gap-2 flex-wrap">
              {user.equipment.map(eq => (
                <span
                  key={eq.id}
                  className="text-sm px-4 py-2 rounded-lg font-medium text-white"
                  style={{ background: '#221f20' }}
                >
                  {eq.name}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Declare your equipment to build your tech stack.</p>
          )}
        </motion.div>
      </section>

      {/* ──── SECTION 3: CREDENTIALS ──── */}
      <section className="py-12 bg-background">
        <motion.div {...fade(0.15)} className="max-w-[680px] mx-auto px-5">
          <SectionHeader>Credentials</SectionHeader>
          {hasCredentials ? (
            <div className="grid grid-cols-3 md:grid-cols-3 gap-3">
              {sampleCredentials.map(cred => (
                <CredentialPatch key={cred.id} credential={cred} onClick={() => setSelectedCred(cred)} />
              ))}
              {/* "Earn next" slot */}
              <Link
                to="/academy"
                className="w-full aspect-square rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center text-center hover:border-primary transition-colors"
              >
                <span className="text-2xl mb-1">+</span>
                <span className="text-[10px] text-muted-foreground font-medium">Earn your next credential →</span>
              </Link>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground mb-4">Every great Passport starts here.</p>
              <Button className="rounded-full h-12 px-8 font-bold" asChild>
                <Link to="/academy">Earn your first credential</Link>
              </Button>
            </div>
          )}
        </motion.div>
      </section>

      {/* ──── SECTION 4: JOURNEY ──── */}
      <section className="py-12 bg-background">
        <motion.div {...fade(0.2)} className="max-w-[680px] mx-auto px-5">
          <SectionHeader>Journey</SectionHeader>
          <div className="space-y-3">
            {sampleExperiences.map((exp, i) => {
              const label = i === sampleExperiences.length - 1 ? 'FOUNDATION' : i === 0 ? 'CURRENT' : 'TECH INTEGRATION';
              return (
                <div key={exp.id} className="bg-background border border-border rounded-xl p-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
                    {exp.isCurrent && (
                      <span className="text-[10px] font-bold uppercase px-3 py-1 rounded-full bg-primary text-primary-foreground">Current</span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-foreground">{exp.companyName}</p>
                  <p className="text-xs text-muted-foreground">{exp.position} · {exp.startDate} – {exp.isCurrent ? 'Present' : exp.endDate}</p>
                </div>
              );
            })}
          </div>
        </motion.div>
      </section>

      {/* ──── SECTION 5: ENDORSED BY ──── */}
      <section className="py-12 bg-background">
        <motion.div {...fade(0.25)} className="max-w-[680px] mx-auto px-5">
          <SectionHeader>Endorsed By</SectionHeader>
          <div className="bg-background border border-border rounded-xl p-5 flex items-center gap-3">
            <span className="text-primary text-lg">✓</span>
            <div>
              <p className="text-sm font-semibold text-foreground">The Drake Hotel</p>
              <p className="text-xs text-muted-foreground">Workplace verified</p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ──── SECTION 6: PERMANENTLY YOURS ──── */}
      <section className="py-16" style={{ background: '#221f20' }}>
        <motion.div {...fade(0.3)} className="max-w-[680px] mx-auto px-5 text-center">
          <h2 className="text-3xl md:text-[48px] font-extrabold font-display text-white mb-3 tracking-tight leading-[1.1]">
            Permanently Yours.
          </h2>
          <p className="text-sm text-white/60 mb-2 max-w-md mx-auto">
            Every credential on this Passport is permanently verifiable at
          </p>
          <a href={passportUrl} className="text-sm font-bold text-primary hover:underline mb-6 inline-block">
            quipp.co/p/{user.username}
          </a>
          <div className="flex justify-center mb-6">
            <QRCodeSVG value={passportUrl} size={140} bgColor="transparent" fgColor="#d1f300" />
          </div>
          <Button
            className="rounded-full h-12 px-8 font-bold"
            variant="outline"
            onClick={copyLink}
            style={{ background: '#221f20', color: '#fff', borderColor: 'rgba(255,255,255,0.3)' }}
          >
            <Copy className="w-4 h-4" /> Copy Link
          </Button>
        </motion.div>
      </section>

      {/* ──── CREDENTIAL DETAIL DIALOG ──── */}
      <Dialog open={!!selectedCred} onOpenChange={() => setSelectedCred(null)}>
        <DialogContent className="bg-background border-border max-w-md rounded-xl">
          {selectedCred && (() => {
            const tier = tierConfig[selectedCred.tier];
            const tag = techTagConfig[selectedCred.tag];
            return (
              <div>
                <div className={`w-full aspect-square rounded-xl ${tier.patchBg} ${tier.patchFg} flex flex-col items-center justify-center gap-2 mb-6 relative`}>
                  <span className="text-5xl">{tag?.icon}</span>
                  <span className="text-lg font-bold font-display uppercase">{selectedCred.courseName}</span>
                  <span className="text-sm font-bold uppercase opacity-70">{tier.label}</span>
                  <span className="absolute bottom-2 left-3 text-xs font-display font-bold opacity-50 lowercase">quipp</span>
                  {selectedCred.isManufacturer && <span className="absolute bottom-2 right-3 text-xs font-bold opacity-50">{selectedCred.provider}</span>}
                </div>

                <h3 className="text-xl font-bold font-display text-foreground mb-2">{selectedCred.courseName}</h3>
                <span className={`inline-block text-[11px] font-bold uppercase px-3 py-1 rounded-full ${tier.bgClass} ${tier.fgClass} mb-3`}>{tier.label}</span>
                <span className="inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border border-border text-muted-foreground ml-2">{tag?.label}</span>

                <p className="text-sm text-muted-foreground mt-3">Earned: {new Date(selectedCred.earnedDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                {selectedCred.quizScore && <p className="text-sm text-muted-foreground">Score: {selectedCred.quizScore}%</p>}

                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mt-4 mb-2">Skills Verified</h4>
                <ul className="space-y-1 mb-4">
                  {selectedCred.skillsDemonstrated.map((skill, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="text-primary">●</span>{skill}
                    </li>
                  ))}
                </ul>

                <div className="flex gap-2">
                  <Button className="flex-1 rounded-full" asChild>
                    <Link to={`/certifications/${selectedCred.id}`}>Share</Link>
                  </Button>
                  <Button variant="outline" className="flex-1 rounded-full" asChild>
                    <Link to={`/verify/${selectedCred.verificationId}`}>Verify</Link>
                  </Button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Passport;
