import Link from 'next/link';
import Image from 'next/image';
import { IProduct } from '@/types';
import { PriceDisplay } from './PriceDisplay';
import { StockBadge } from './StockBadge';
import { QuantitySelector } from './QuantitySelector';
import { Star, ShoppingCart, Heart, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWishlistStore } from '@/lib/store/wishlistStore';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import toast from 'react-hot-toast';

interface ProductCardProps {
  product: IProduct;
  onAddToCart?: (product: IProduct, quantity: number) => void;
  priority?: boolean;
}

/**
 * ProductCard Component
 * Displays product in grid view with image, price, and actions
 */
export function ProductCard({ product, onAddToCart, priority = false }: ProductCardProps) {
  const { data: session } = useSession();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlistStore();
  const [wishlistLoading, setWishlistLoading] = useState(false);

  const primaryImage = product.images?.find(img => img.isPrimary) || product.images?.[0];
  const primaryMarket = product.availableMarkets[0];
  const pricing = product.pricing[primaryMarket];
  const inventory = product.inventory[primaryMarket];

  const [quantity, setQuantity] = useState(pricing.minQuantity || 1);
  const maxQuantity = inventory.trackInventory ? inventory.stock : pricing.maxQuantity || 999;

  const isRider = (session?.user?.role as string) === 'rider';
  const isInStock = !inventory.trackInventory || inventory.stock > 0;
  const productId = String(product._id);
  const inWishlist = isInWishlist(productId, primaryMarket);

  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isRider) {
      return;
    }

    if (!session) {
      toast.error('Please login to add to wishlist');
      return;
    }

    console.log('🔍 ProductCard - Adding to wishlist:', {
      productId,
      productName: product.name,
      primaryMarket,
      inWishlist,
    });

    setWishlistLoading(true);
    try {
      if (inWishlist) {
        await removeFromWishlist(productId, primaryMarket);
        toast.success('Removed from wishlist');
      } else {
        await addToWishlist(productId, primaryMarket);
        toast.success('Added to wishlist', { icon: '❤️' });
      }
    } catch (error: any) {
      console.error('Wishlist toggle error:', error);
      if (error.message === 'Product already in wishlist') {
        toast.error('Already in wishlist');
      } else {
        toast.error('Failed to update wishlist');
      }
    } finally {
      setWishlistLoading(false);
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const url = `${window.location.origin}/products/${product.seo.slug}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: product.shortDescription || 'Check out this product on Gpowerpay',
          url: url,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        toast.success('Link copied to clipboard!');
      } catch (error) {
        toast.error('Failed to copy link');
      }
    }
  };

  return (
    <div className="group bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-300">
      {/* Image Section */}
      <Link href={`/products/${product.seo.slug}`} className="block relative aspect-square overflow-hidden bg-gray-100">
        {primaryImage ? (
          <Image
            src={primaryImage.url}
            alt={primaryImage.alt || product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            priority={priority}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <ShoppingCart size={48} />
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-2">
          {product.isNewArrival && (
            <span className="px-2 py-1 bg-blue-600 text-white text-xs font-medium rounded">
              New
            </span>
          )}
          {product.isFeatured && (
            <span className="px-2 py-1 bg-purple-600 text-white text-xs font-medium rounded">
              Featured
            </span>
          )}
        </div>

        {/* Stock Badge */}
        <div className="absolute top-2 right-2">
          <StockBadge
            stock={inventory.stock}
            lowStockThreshold={inventory.lowStockThreshold}
            trackInventory={inventory.trackInventory}
            size="sm"
            showIcon={false}
          />
        </div>

        {/* Wishlist Button - Hidden for riders */}
        {!isRider && (
          <button
            onClick={handleWishlistToggle}
            disabled={wishlistLoading}
            className="absolute bottom-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors disabled:opacity-50"
            title={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Heart
              size={20}
              className={`transition-colors ${inWishlist ? 'fill-red-500 text-red-500' : 'text-gray-600'
                }`}
            />
          </button>
        )}

        {/* Share Button */}
        <button
          onClick={handleShare}
          className={`absolute right-2 p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors ${isRider ? 'bottom-2' : 'bottom-12'
            }`}
          title="Share product"
        >
          <Share2 size={20} className="text-gray-600" />
        </button>
      </Link>

      {/* Content Section */}
      <div className="p-4">
        {/* Category */}
        {product.category && typeof product.category === 'object' && 'name' in product.category && (
          <p className="text-xs text-gray-500 mb-1">
            {product.category.name}
          </p>
        )}

        {/* Product Name */}
        <Link href={`/products/${product.seo.slug}`}>
          <h3 className="text-base font-semibold text-gray-900 mb-2 line-clamp-2 hover:text-blue-600 transition-colors">
            {product.name}
          </h3>
        </Link>

        {/* Short Description */}
        {product.shortDescription && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {product.shortDescription}
          </p>
        )}

        {/* Rating */}
        {product.reviewCount > 0 && (
          <div className="flex items-center gap-1 mb-3">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={14}
                  className={
                    i < Math.floor(product.averageRating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }
                />
              ))}
            </div>
            <span className="text-xs text-gray-600">
              ({product.reviewCount})
            </span>
          </div>
        )}

        {/* Price */}
        <div className="mb-3">
          <PriceDisplay
            price={pricing.price}
            compareAtPrice={pricing.compareAtPrice}
            size="md"
          />
          <p className="text-xs text-gray-500 mt-1">
            {primaryMarket === 'kilo'
              ? 'Per Kilo'
              : `Per Carton${('unitsPerCarton' in pricing) ? ` (${pricing.unitsPerCarton} units)` : ''}`
            }
          </p>
        </div>

        {/* Add to Cart Button - Hidden for riders */}
        {!isRider && onAddToCart && (
          <div className="flex flex-col gap-2 mt-2">
            <QuantitySelector
              quantity={quantity}
              onQuantityChange={setQuantity}
              min={pricing.minQuantity || 1}
              max={maxQuantity}
              disabled={!isInStock}
              size="sm"
            />
            <Button
              onClick={() => {
                onAddToCart(product, quantity);
                setQuantity(pricing.minQuantity || 1); // Reset after adding
              }}
              disabled={!isInStock}
              className="w-full btn-modern"
              size="sm"
            >
              <ShoppingCart size={16} className="mr-2" />
              {isInStock ? 'Add to Cart' : 'Out of Stock'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
