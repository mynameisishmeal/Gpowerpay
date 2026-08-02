import { formatPrice, calculateDiscount } from '@/lib/utils/formatters';

interface PriceDisplayProps {
  price: number;
  compareAtPrice?: number;
  size?: 'sm' | 'md' | 'lg';
  showDiscount?: boolean;
  className?: string;
}

/**
 * PriceDisplay Component
 * Displays product price with optional compare-at price and discount badge
 */
export function PriceDisplay({
  price,
  compareAtPrice,
  size = 'md',
  showDiscount = true,
  className = '',
}: PriceDisplayProps) {
  const hasDiscount = compareAtPrice && compareAtPrice > price;
  const discountPercentage = hasDiscount ? calculateDiscount(price, compareAtPrice) : 0;

  const sizeClasses = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  const compareSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <div className={`flex items-center gap-2 flex-wrap ${className}`}>
      {/* Current Price */}
      <span className={`font-bold text-gray-900 ${sizeClasses[size]}`}>
        {formatPrice(price)}
      </span>

      {/* Compare At Price (Strikethrough) */}
      {hasDiscount && (
        <span className={`text-gray-500 line-through ${compareSizeClasses[size]}`}>
          {formatPrice(compareAtPrice!)}
        </span>
      )}

      {/* Discount Badge */}
      {hasDiscount && showDiscount && (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
          -{discountPercentage}%
        </span>
      )}
    </div>
  );
}
