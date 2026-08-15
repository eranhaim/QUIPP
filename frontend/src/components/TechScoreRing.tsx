import { getTechScoreLabel } from '@/data/mockData';

interface TechScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

const TechScoreRing = ({ score, size = 140, strokeWidth = 8, className = '' }: TechScoreRingProps) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const label = getTechScoreLabel(score);

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.2)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          stroke="#d1f300"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s ease-out' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold text-white font-display">{score}</span>
        <span className="text-xs text-white/60">/ 100</span>
        <span className="text-[11px] font-bold uppercase tracking-wider text-white/60 mt-1">{label}</span>
      </div>
    </div>
  );
};

export default TechScoreRing;
