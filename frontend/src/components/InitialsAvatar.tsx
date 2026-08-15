interface InitialsAvatarProps {
  firstName: string;
  lastName: string;
  size?: number;
  className?: string;
}

const InitialsAvatar = ({ firstName, lastName, size = 80, className = '' }: InitialsAvatarProps) => {
  const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || '?';
  return (
    <div className={`relative inline-block ${className}`}>
      <div
        className="rounded-full flex items-center justify-center font-bold font-display"
        style={{
          width: size,
          height: size,
          fontSize: size * 0.4,
          background: '#36186b',
          color: '#d1f300',
        }}
      >
        {initials}
      </div>
    </div>
  );
};

export default InitialsAvatar;
