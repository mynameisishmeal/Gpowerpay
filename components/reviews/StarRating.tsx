'use client';

import { Star } from 'lucide-react';

/**
 * Star Rating Component - Display and input star ratings
 */

interface StarRatingProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  readonly?: boolean;
  size?: number;
  showLabel?: boolean;
}

export function StarRating({
  rating,
  onRatingChange,
  readonly = false,
  size = 20,
  showLabel = false,
}: StarRatingProps) {
  const stars = [1, 2, 3, 4, 5];

  const handleClick = (value: number) => {
    if (!readonly && onRatingChange) {
      onRatingChange(value);
    }
  };

  return (
    <div className="flex items-center gap-1">
      {stars.map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => handleClick(star)}
          disabled={readonly}
          className={`${
            readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'
          } transition-transform`}
          aria-label={`${star} star${star > 1 ? 's' : ''}`}
        >
          <Star
            size={size}
            className={
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }
          />
        </button>
      ))}
      {showLabel && (
        <span className="ml-2 text-sm text-gray-600">
          {rating.toFixed(1)} / 5
        </span>
      )}
    </div>
  );
}
