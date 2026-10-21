import { emotionLabels, fusionLabels } from '../../data/mockHistory';

export function EmotionBadge({ emotion }) {
  const meta = emotionLabels[emotion] || emotionLabels.neutral;
  const classMap = { positive: 'badge-stable', neutral: 'badge-neutral', negative: 'badge-significant' };
  return (
    <span className={`badge ${classMap[meta.tone] || 'badge-neutral'}`}>
      <span style={{ color: meta.color }}>●</span>
      {meta.label}
    </span>
  );
}

export function FusionBadge({ result }) {
  const meta = fusionLabels[result] || fusionLabels.stable;
  const classMap = {
    stable: 'badge-stable',
    expression_change: 'badge-change',
    voice_variation: 'badge-change',
    significant_change: 'badge-significant',
  };
  return (
    <span className={`badge ${classMap[result] || 'badge-stable'}`}>
      <span>{meta.icon}</span>
      {meta.label}
    </span>
  );
}

export function SentimentBadge({ sentiment }) {
  if (!sentiment) return null;
  const isPositive = sentiment.toUpperCase() === 'POSITIVE';
  return (
    <span className={`badge ${isPositive ? 'badge-stable' : 'badge-significant'}`}>
      <span style={{ color: isPositive ? '#5ECFB1' : '#E76F51' }}>●</span>
      {sentiment}
    </span>
  );
}
