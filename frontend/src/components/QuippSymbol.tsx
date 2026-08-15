interface QuippSymbolProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  className?: string;
  color?: 'primary' | 'success' | 'tech' | 'muted' | 'foreground' | 'inherit';
}

const sizeMap = {
  xs: 'text-xs',
  sm: 'text-sm',
  md: 'text-lg',
  lg: 'text-2xl',
  xl: 'text-4xl',
  hero: 'text-6xl',
};

const colorMap = {
  primary: 'text-primary',
  success: 'text-success',
  tech: 'text-tech',
  muted: 'text-muted-foreground',
  foreground: 'text-foreground',
  inherit: '',
};

const QuippSymbol = ({ size = 'md', className = '', color = 'primary' }: QuippSymbolProps) => {
  return (
    <span
      className={`font-display font-bold select-none ${sizeMap[size]} ${colorMap[color]} ${className}`}
      aria-label="QUIPP Kenaz torch symbol"
      role="img"
    >
      ᚲ
    </span>
  );
};

export default QuippSymbol;