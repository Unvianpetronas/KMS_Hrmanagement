import { TAG_COLORS } from '../../services/constants';

export default function TagBadge({ tag, small = false }) {
  const color = TAG_COLORS[tag] || '#64748b';
  return (
    <span
      style={{
        padding: small ? '2px 8px' : '3px 10px',
        borderRadius: 20,
        background: `${color}15`,
        color,
        fontSize: small ? 10 : 11,
        fontWeight: 700,
        border: `1px solid ${color}25`,
      }}
    >
      {tag}
    </span>
  );
}
