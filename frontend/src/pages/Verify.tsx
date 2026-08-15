import { useParams, Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { sampleCredentials, tierConfig, techTagConfig } from '@/data/mockData';

const Verify = () => {
  const { id } = useParams();
  const credential = sampleCredentials.find(c => c.verificationId === id) || sampleCredentials[0];
  const verifyUrl = `${window.location.origin}/verify/${credential.verificationId}`;
  const tier = tierConfig[credential.tier];
  const tag = techTagConfig[credential.tag];

  return (
    <Layout>
      <section className="pt-16 md:pt-28 pb-32">
        <div className="max-w-[600px] mx-auto px-5">
          <div className="text-center mb-10">
            <span className="text-2xl font-bold font-display text-primary lowercase mb-4 block">quipp</span>
            <h1 className="text-[32px] md:text-[48px] font-bold font-display text-foreground mb-4 uppercase tracking-tight">CREDENTIAL VERIFIED</h1>
            <p className="text-xl font-bold font-display text-success">✓ VERIFIED</p>
          </div>

          <div className="bg-card rounded-3xl p-8 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">{tag?.icon}</span>
              <span className="text-xs font-bold uppercase text-muted-foreground">{tag?.label}</span>
            </div>
            <h3 className="text-xl font-semibold text-card-foreground mb-1">Alex</h3>
            <p className="text-base font-bold text-primary mb-3">TechCook</p>
            <p className="text-lg text-card-foreground mb-2">{credential.courseName}</p>
            <span className={`inline-block text-[11px] font-bold uppercase px-3 py-1 rounded-full ${tier.bgClass} ${tier.fgClass} mb-2`}>{tier.label}</span>
            {credential.isManufacturer && (
              <span className="inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border border-primary/30 text-primary ml-2">{credential.provider}</span>
            )}
            <p className="text-sm text-muted-foreground mt-2">Earned: {new Date(credential.earnedDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
            <p className="text-xs text-muted-foreground font-mono mt-1">ID: {credential.verificationId}</p>
          </div>

          <div className="bg-card rounded-3xl p-8 mb-6">
            <h3 className="text-lg font-bold font-display text-card-foreground mb-3 uppercase">Skills Verified</h3>
            <ul className="space-y-2">
              {credential.skillsDemonstrated.map((skill, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground"><span className="text-primary">→</span>{skill}</li>
              ))}
            </ul>
          </div>

          <div className="text-center">
            <div className="flex justify-center mb-4">
              <QRCodeSVG value={verifyUrl} size={120} bgColor="transparent" fgColor="hsl(0,0%,100%)" />
            </div>
            <p className="text-lg font-bold font-display text-foreground mb-4 uppercase">Earn yours.</p>
            <Button className="rounded-full h-12 px-8 font-bold" asChild><Link to="/onboarding">Start →</Link></Button>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Verify;
