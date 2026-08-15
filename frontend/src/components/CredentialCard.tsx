import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Linkedin } from 'lucide-react';
import { Credential, tierConfig } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { Dialog, DialogContent } from '@/components/ui/dialog';

const CredentialCard = ({ credential }: { credential: Credential }) => {
  const [expanded, setExpanded] = useState(false);
  const isMobile = useIsMobile();
  const verifyUrl = `${window.location.origin}/verify/${credential.verificationId}`;
  const tier = tierConfig[credential.tier] || tierConfig.IN;

  const cardContent = (
    <>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold text-muted-foreground uppercase">{credential.provider}</span>
        <span className={`text-[11px] font-bold uppercase px-3 py-1 rounded-md ${tier.bgClass} ${tier.fgClass}`}>
          {tier.label}
        </span>
      </div>
      <h3 className="text-base font-bold text-card-foreground mb-1">{credential.courseName}</h3>
      <p className="text-xs text-primary font-bold mb-1">Earned</p>
      <p className="text-xs text-muted-foreground">
        {new Date(credential.earnedDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
      </p>
    </>
  );

  const expandedContent = (
    <div className="mt-4 pt-4 border-t border-border">
      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Skills Verified</h4>
      <ul className="space-y-1 mb-4">
        {credential.skillsDemonstrated.map((skill, i) => (
          <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
            <span className="text-primary">→</span>{skill}
          </li>
        ))}
      </ul>
      <div className="flex justify-center mb-3">
        <QRCodeSVG value={verifyUrl} size={100} bgColor="transparent" fgColor="hsl(0 0% 100%)" />
      </div>
      <div className="flex gap-2">
        <Button size="sm" variant="secondary" className="flex-1 rounded-md" onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(verifyUrl); }}>
          <Copy className="w-3 h-3" /> Copy
        </Button>
        <Button size="sm" variant="secondary" className="flex-1 rounded-md">
          <Linkedin className="w-3 h-3" /> Share
        </Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <>
        <div className={`bg-card rounded-2xl shadow-card p-5 cursor-pointer ${credential.isManufacturer ? 'ring-1 ring-primary/30' : ''}`} onClick={() => setExpanded(true)}>
          {cardContent}
        </div>
        <Dialog open={expanded} onOpenChange={setExpanded}>
          <DialogContent className="bg-card border-border max-h-[90vh] overflow-y-auto rounded-2xl">
            {cardContent}
            {expandedContent}
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <div className={`bg-card rounded-2xl shadow-card p-5 cursor-pointer transition-shadow hover:shadow-lg ${credential.isManufacturer ? 'ring-1 ring-primary/30' : ''}`} onClick={() => setExpanded(!expanded)}>
      {cardContent}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            {expandedContent}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CredentialCard;