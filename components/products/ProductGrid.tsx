import { IProduct } from '@/types';
import { ProductCard } from './ProductCard';
import { Package } from 'lucide-react';

interface ProductGridProps {
  products: IProduct[];
  onAddToCart?: (product: IProduct, quantity: number) => void;
  emptyMessage?: string;
  loading?: boolean;
  columns?: 2 | 3 | 4;
}

/**
 * ProductGrid Component
 * Displays products in a responsive grid layout
 */
export function ProductGrid({
  products,
  onAddToCart,
  emptyMessage = 'No products found',
  loading = false,
  columns = 4,
}: ProductGridProps) {
  const gridCols = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  };

  if (loading) {
    return (
      <div className={`grid ${gridCols[columns]} gap-6`}>
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-lg border border-gray-200 overflow-hidden animate-pulse"
          >
            <div className="aspect-square bg-gray-200" />
            <div className="p-4 space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
              <div className="h-8 bg-gray-200 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <Package className="h-16 w-16 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {emptyMessage}
        </h3>
        <p className="text-gray-600 text-center max-w-md">
          Try adjusting your filters or search terms to find what you're looking for.
        </p>
      </div>
    );
  }

  return (
    <div className={`grid ${gridCols[columns]} gap-6`}>
      {products.map((product, index) => (
        <ProductCard
          key={product._id.toString()}
          product={product}
          onAddToCart={onAddToCart}
          priority={index < 4} // Prioritize first 4 images
        />
      ))}
    </div>
  );
}
