import { useState } from 'react';

export default function Stars({ rating = 0, onRate, size = 18 }) {
  const [hover, setHover] = useState(0);

  return (
    <span style={{ display: 'inline-flex', gap: 2, alignItems: 'center' }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          style={{
            cursor: onRate ? 'pointer' : 'default',
            fontSize: size,
            color: star <= (hover || Math.round(rating)) ? '#fbbf24' : '#374151',
            transition: 'all 0.2s',
            filter: star <= (hover || Math.round(rating))
              ? 'drop-shadow(0 0 4px rgba(251,191,36,0.6))' : 'none',
            transform: star === hover ? 'scale(1.3)' : 'scale(1)',
          }}
          onMouseEnter={() => onRate && setHover(star)}
          onMouseLeave={() => onRate && setHover(0)}
          onClick={() => onRate && onRate(star)}
        >
          ★
        </span>
      ))}
      {!onRate && rating > 0 && (
        <span style={{ fontSize: 12, color: '#9ca3af', marginLeft: 4, fontWeight: 700 }}>
          {rating.toFixed(1)}
        </span>
      )}
    </span>
  );
}
