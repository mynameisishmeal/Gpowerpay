import { getStockStatus, getStockStatusLabel, getStockStatusColor } from '@/lib/utils/formatters';
import { Package } from 'lucide-react';

interface StockBadgeProps {
  stock: number;
  lowStockThreshold: number;
  trackInventory: boolean;
  size?: 'sm' | 'md';
  showIcon?: boolean;
  className?: string;
}

/**
 * StockBadge Component
 * Displays product stock status with color coding
 */
export function StockBadge({
  stock,
  lowStockThreshold,
  trackInventory,
  size = 'sm',
  showIcon = true,
  className = '',
}: StockBadgeProps) {
  const status = getStockStatus(stock, lowStockThreshold, trackInventory);
  const label = getStockStatusLabel(status);
  const colorClass = getStockStatusColor(status);

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
  };

  const iconSizes = {
    sm: 12,
    md: 14,
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${colorClass} ${sizeClasses[size]} ${className}`}
    >
      {showIcon && <Package size={iconSizes[size]} />}
      <span>{label}</span>
      {['in_stock', 'low_stock'].includes(status) && trackInventory && (
        <span className="ml-1">({stock} left)</span>
      )}
    </span>
  );
}
