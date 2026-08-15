import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Linkedin, Copy, Instagram } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Quippy from '@/components/Quippy';
import { sampleCredentials, sampleCourses, tierConfig, techTagConfig } from '@/data/mockData';
import { toast } from '@/hooks/use-toast';

const CredentialDisplay = () => {
  const { id } = useParams();
  const credential = sampleCredentials.find(c => c.id === id) || sampleCredentials[0];
  const course = sampleCourses.find(c => c.id === credential?.courseId);
  const verifyUrl = `${window.location.origin}/verify/${credential.verificationId}`;
  const tier = tierConfig[credential.tier];
  const tag = techTagConfig[credential.tag];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <section className="pt-16 md:pt-28 pb-32">
        <div className="max-w-[680px] mx-auto px-5">
          {/* Patch moment */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className={`w-44 h-44 mx-auto rounded-3xl ${tier.patchBg} ${tier.patchFg} flex flex-col items-center justify-center gap-2 mb-8`}
          >
            <span className="text-4xl">{tag?.icon}</span>
            <span className="text-sm font-bold font-display uppercase">{credential.courseName}</span>
            <span className="text-xs font-bold uppercase opacity-70">{tier.label}</span>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
            <Quippy size="md" message="Yours now. Forever." className="mb-8" />
          </motion.div>

          {/* Share section */}
          <div className="bg-card rounded-3xl p-8 mb-6">
            <h3 className="text-lg font-bold font-display text-card-foreground text-center mb-4 uppercase">Share Your Credential</h3>
            <div className="flex flex-wrap justify-center gap-3">
              <Button className="rounded-full"><Linkedin className="w-4 h-4" /> LinkedIn</Button>
              <Button variant="secondary" className="rounded-full"><Instagram className="w-4 h-4" /> Instagram</Button>
              <Button variant="secondary" className="rounded-full" onClick={() => { navigator.clipboard.writeText(verifyUrl); toast({ title: 'Copied' }); }}>
                <Copy className="w-4 h-4" /> Copy Link
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Button size="lg" className="rounded-full h-14 font-bold" asChild>
              <Link to="/passport/alex">View Passport</Link>
            </Button>
            <Button size="lg" variant="secondary" className="rounded-full h-14" asChild>
              <Link to="/training">Earn another</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default CredentialDisplay;
