/**
 * Utility functions for formatting data
 * Keep functions small and focused
 */

/**
 * Format price to Nigerian Naira
 */
export function formatPrice(price: number, includeSymbol = true): string {
  const formatted = new Intl.NumberFormat('en-NG', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price);

  return includeSymbol ? `₦${formatted}` : formatted;
}

/**
 * Format discount percentage
 */
export function calculateDiscount(price: number, compareAtPrice: number): number {
  if (!compareAtPrice || compareAtPrice <= price) return 0;
  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
}

/**
 * Format number with commas
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

/**
 * Format date to readable string
 */
export function formatDate(date: Date | string, format: 'short' | 'long' = 'short'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (format === 'short') {
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
  
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}

/**
 * Generate slug from text
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Get stock status
 */
export function getStockStatus(
  stock: number,
  lowStockThreshold: number,
  trackInventory: boolean
): 'in_stock' | 'low_stock' | 'out_of_stock' | 'unlimited' {
  if (!trackInventory) return 'unlimited';
  if (stock === 0) return 'out_of_stock';
  if (stock <= lowStockThreshold) return 'low_stock';
  return 'in_stock';
}

/**
 * Get stock status label
 */
export function getStockStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    in_stock: 'In Stock',
    low_stock: 'Low Stock',
    out_of_stock: 'Out of Stock',
    unlimited: 'Available',
  };
  return labels[status] || status;
}

/**
 * Get stock status color
 */
export function getStockStatusColor(status: string): string {
  const colors: Record<string, string> = {
    in_stock: 'text-green-600 bg-green-50',
    low_stock: 'text-yellow-600 bg-yellow-50',
    out_of_stock: 'text-red-600 bg-red-50',
    unlimited: 'text-blue-600 bg-blue-50',
  };
  return colors[status] || 'text-gray-600 bg-gray-50';
}
