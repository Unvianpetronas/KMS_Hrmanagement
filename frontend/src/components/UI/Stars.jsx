import { useState } from 'react';

export default function Stars({ rating = 0, onRate, size = 18 }) {
  const [hover, setHover] = useState(0);

  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          style={{
            cursor: onRate ? 'pointer' : 'default',
            fontSize: size,
            color: star <= (hover || Math.round(rating)) ? '#d97706' : '#d1d5db',
            transition: 'color 0.15s',
            transform: star === hover && onRate ? 'scale(1.2)' : 'scale(1)',
            display: 'inline-block',
          }}
          onMouseEnter={() => onRate && setHover(star)}
          onMouseLeave={() => onRate && setHover(0)}
          onClick={() => onRate && onRate(star)}
        >
          ★
        </span>
      ))}
      {!onRate && rating > 0 && (
        <span className="text-xs text-slate-400 font-medium ml-1">
          {rating.toFixed(1)}
        </span>
      )}
    </span>
  );
}
