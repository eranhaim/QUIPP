import { Credential, tierConfig, techTagConfig } from '@/data/mockData';

interface CredentialPatchProps {
  credential: Credential;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

const CredentialPatch = ({ credential, size = 'md', onClick }: CredentialPatchProps) => {
  const tag = techTagConfig[credential.tag];

  // Tier-specific patch styles per Issue 05
  const patchStyles: Record<string, { bg: string; text: string; border?: string }> = {
    IN: { bg: '#ffffff', text: '#221f20', border: '2px solid #221f20' },
    DEEP: { bg: '#36186b', text: '#ffffff' },
    THERE: { bg: '#d1f300', text: '#221f20' },
  };

  const badgeStyles: Record<string, { bg: string; text: string }> = {
    IN: { bg: '#221f20', text: '#ffffff' },
    DEEP: { bg: '#d1f300', text: '#221f20' },
    THERE: { bg: '#d1f300', text: '#221f20' },
  };

  const patch = patchStyles[credential.tier];
  const badge = badgeStyles[credential.tier];

  return (
    <button
      onClick={onClick}
      className="w-full aspect-square rounded-xl flex flex-col items-center justify-center gap-1 cursor-pointer relative group"
      style={{
        background: patch.bg,
        color: patch.text,
        border: patch.border || 'none',
        transition: 'all 200ms ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.05)';
        e.currentTarget.style.boxShadow = '0 0 0 2px #d1f300';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <span className="text-2xl">{tag?.icon || '⚡'}</span>
      <span className="text-[10px] font-bold uppercase tracking-wider leading-tight text-center px-2">{credential.courseName}</span>
      {/* Tier badge */}
      <span
        className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full mt-1"
        style={{ background: badge.bg, color: badge.text }}
      >
        {credential.tier}
      </span>
      {/* quipp mark */}
      <span className="absolute bottom-1.5 left-1.5 text-[8px] font-bold font-display opacity-50 lowercase">q</span>
      {credential.isManufacturer && (
        <span className="absolute bottom-1.5 right-1.5 text-[8px] font-bold opacity-50 uppercase">{credential.provider}</span>
      )}
    </button>
  );
};

export default CredentialPatch;
