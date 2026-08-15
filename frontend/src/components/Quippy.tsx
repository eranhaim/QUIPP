interface QuippyProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  message?: string;
  className?: string;
  theme?: 'primary' | 'accent' | 'inverse';
}

const sizeMap = {
  sm: 'w-10 h-10 text-xs',
  md: 'w-16 h-16 text-sm',
  lg: 'w-24 h-24 text-base',
  xl: 'w-32 h-32 text-lg',
};

const Quippy = ({ size = 'md', message, className = '', theme = 'primary' }: QuippyProps) => {
  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <div className={`${sizeMap[size]} rounded-2xl bg-primary text-primary-foreground flex items-center justify-center font-display font-bold select-none`}>
        <span>Q</span>
      </div>
      {message && (
        <p className="text-sm text-muted-foreground italic text-center max-w-[280px]">
          "{message}"
        </p>
      )}
    </div>
  );
};

export default Quippy;