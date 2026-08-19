import type { Credential, TagName, Tier } from '@/lib/types';

interface CredentialPatchProps {
  credential: Pick<
    Credential,
    'courseName' | 'tier' | 'tagName' | 'provider' | 'isManufacturer'
  >;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

const TAG_ICON: Record<TagName, string> = {
  THERMAL: '🔥',
  COLD: '❄️',
  BEVERAGE: '☕',
  DIGITAL: '💻',
  SERVICE: '🍽️',
};

const patchStyles: Record<Tier, { bg: string; text: string; border?: string }> = {
  IN: { bg: '#ffffff', text: '#221f20', border: '2px solid #221f20' },
  DEEP: { bg: '#36186b', text: '#ffffff' },
  THERE: { bg: '#d1f300', text: '#221f20' },
};

const badgeStyles: Record<Tier, { bg: string; text: string }> = {
  IN: { bg: '#221f20', text: '#ffffff' },
  DEEP: { bg: '#d1f300', text: '#221f20' },
  THERE: { bg: '#d1f300', text: '#221f20' },
};

const CredentialPatch = ({ credential, onClick }: CredentialPatchProps) => {
  const patch = patchStyles[credential.tier];
  const badge = badgeStyles[credential.tier];

  return (
    <button
      onClick={onClick}
      className="w-full aspect-square rounded-xl flex flex-col items-center justify-center gap-1 cursor-pointer relative group transition-transform hover:scale-105 hover:ring-2 hover:ring-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      style={{
        background: patch.bg,
        color: patch.text,
        border: patch.border ?? 'none',
      }}
    >
      <span className="text-2xl">{TAG_ICON[credential.tagName]}</span>
      <span className="text-[10px] font-bold uppercase tracking-wider leading-tight text-center px-2">
        {credential.courseName}
      </span>
      <span
        className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full mt-1"
        style={{ background: badge.bg, color: badge.text }}
      >
        {credential.tier}
      </span>
      <span className="absolute bottom-1.5 left-1.5 text-[8px] font-bold font-display opacity-50 lowercase">
        q
      </span>
      {credential.isManufacturer && (
        <span className="absolute bottom-1.5 right-1.5 text-[8px] font-bold opacity-50 uppercase">
          {credential.provider}
        </span>
      )}
    </button>
  );
};

export default CredentialPatch;
