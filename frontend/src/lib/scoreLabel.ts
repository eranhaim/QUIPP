export type ScoreLabel = 'Building' | 'Growing' | 'Recognised' | 'Authority';

export function getTechScoreLabel(score: number): ScoreLabel {
  if (score <= 24) return 'Building';
  if (score <= 49) return 'Growing';
  if (score <= 74) return 'Recognised';
  return 'Authority';
}
