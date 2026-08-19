import { getTechScoreLabel } from '@/lib/scoreLabel';

interface ProficiencyBarProps {
  label: string;
  description?: string;
  score: number;
  maxScore?: number;
  theme?: 'primary' | 'accent' | 'inverse';
}

const ProficiencyBar = ({ label, description, score, maxScore = 100 }: ProficiencyBarProps) => {
  const pct = Math.round((score / maxScore) * 100);
  const scoreLabel = getTechScoreLabel(score);

  return (
    <div className="mb-5 last:mb-0">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-bold uppercase tracking-wider text-foreground">{label}</span>
        <span className="text-xs font-bold text-muted-foreground">{score}/{maxScore} {scoreLabel.toUpperCase()}</span>
      </div>
      <div className="w-full h-2.5 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
      {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
    </div>
  );
};

export default ProficiencyBar;