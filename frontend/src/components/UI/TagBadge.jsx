import { TAG_COLORS } from '../../services/constants';

export default function TagBadge({ tag, small = false }) {
  const color = TAG_COLORS[tag] || '#64748b';
  return (
    <span
      style={{
        display: 'inline-block',
        padding: small ? '1px 7px' : '2px 8px',
        borderRadius: 4,
        background: `${color}12`,
        color,
        fontSize: small ? 10 : 11,
        fontWeight: 600,
        border: `1px solid ${color}30`,
        lineHeight: '1.6',
      }}
    >
      {tag}
    </span>
  );
}
