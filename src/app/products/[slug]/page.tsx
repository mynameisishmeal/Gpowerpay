'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { IProduct, MarketType } from '@/types';
import { ImageGallery } from '@/components/products/ImageGallery';
import { PriceDisplay, StockBadge, MarketTypeSelector } from '@/components/products';
import { QuantitySelector } from '@/components/products/QuantitySelector';
import { ProductGrid } from '@/components/products/ProductGrid';
import { Button } from '@/components/ui/button';
import { ReviewForm } from '@/components/reviews/ReviewForm';
import { ReviewList } from '@/components/reviews/ReviewList';
import { StarRating } from '@/components/reviews/StarRating';
import { useCartStore } from '@/lib/store/cartStore';
import toast from 'react-hot-toast';
import {
  ShoppingCart,
  Heart,
  Share2,
  Star,
  Package,
  Truck,
  Shield,
  ChevronRight,
  Loader2,
} from 'lucide-react';

/**
 * Product Detail Page
 * Displays product information with purchase options
 * REQUIRES LOGIN
 */
export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const slug = params.slug as string;

  const [product, setProduct] = useState<IProduct | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<IProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedMarket, setSelectedMarket] = useState<MarketType>('kilo');
  const [quantity, setQuantity] = useState(1);
  const [reviewRefresh, setReviewRefresh] = useState(0);
  const addItem = useCartStore((state) => state.addItem);

  // Redirect to login if not authenticated or dashboard if rider
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(`/login?callbackUrl=/products/${slug}`);
    } else if (status === 'authenticated' && (session?.user?.role as string) === 'rider') {
      router.replace('/rider/dashboard');
    }
  }, [status, session, router, slug]);

  // Fetch product
  useEffect(() => {
    // Skip if not authenticated
    if (status !== 'authenticated' || !slug) return;

    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/products/${slug}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Product not found');
        }

        setProduct(data.product);
        setSelectedMarket(data.product.availableMarkets[0]);

        // Fetch related products
        const relatedResponse = await fetch(`/api/products/${data.product._id}/related?limit=4`);
        const relatedData = await relatedResponse.json();
        if (relatedData.success) {
          setRelatedProducts(relatedData.products);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [slug, status]);

  // Show loading while checking auth or fetching product
  if (status === 'loading' || (status === 'authenticated' && loading)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated or if rider (will redirect)
  if (status === 'unauthenticated' || (status === 'authenticated' && (session?.user?.role as string) === 'rider')) {
    return null;
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Product Not Found</h1>
          <p className="text-gray-600 mb-6">{error || 'The product you are looking for does not exist.'}</p>
          <Button onClick={() => router.push('/products')} className="btn-modern">
            Browse Products
          </Button>
        </div>
      </div>
    );
  }

  const pricing = product.pricing[selectedMarket];
  const inventory = product.inventory[selectedMarket];
  const isInStock = !inventory.trackInventory || inventory.stock > 0;
  const maxQuantity = inventory.trackInventory ? inventory.stock : pricing.maxQuantity || 999;

  const handleAddToCart = () => {
    if (!product) return;

    const pricing = product.pricing[selectedMarket];
    const image = product.images?.find(img => img.isPrimary) || product.images?.[0];

    addItem({
      productId: product._id.toString(),
      name: product.name,
      price: pricing.price,
      quantity,
      marketType: selectedMarket,
      image: image?.url,
      maxQuantity: maxQuantity, // Use the calculated maxQuantity (respects inventory)
      inStock: isInStock,
    });

    toast.success(`${quantity} ${product.name} added to cart!`, {
      icon: '🛒',
    });

    // Reset quantity to 1
    setQuantity(1);
  };

  const handleShare = async () => {
    if (!product) return;
    const url = window.location.href;
    
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
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center gap-2 text-sm">
            <Link href="/" className="text-gray-600 hover:text-blue-600">
              Home
            </Link>
            <ChevronRight size={16} className="text-gray-400" />
            <Link href="/products" className="text-gray-600 hover:text-blue-600">
              Products
            </Link>
            {product.category && typeof product.category === 'object' && (
              <>
                <ChevronRight size={16} className="text-gray-400" />
                <span className="text-gray-600">{(product.category as any).name}</span>
              </>
            )}
            <ChevronRight size={16} className="text-gray-400" />
            <span className="text-gray-900 font-medium truncate">{product.name}</span>
          </nav>
        </div>
      </div>

      {/* Product Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Left: Images */}
          <div>
            <ImageGallery images={product.images} productName={product.name} />
          </div>

          {/* Right: Product Info */}
          <div className="space-y-6">
            {/* Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              {product.isNewArrival && (
                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                  New Arrival
                </span>
              )}
              {product.isFeatured && (
                <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm font-medium rounded-full">
                  Featured
                </span>
              )}
              <StockBadge
                stock={inventory.stock}
                lowStockThreshold={inventory.lowStockThreshold}
                trackInventory={inventory.trackInventory}
                size="md"
              />
            </div>

            {/* Title */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
              {product.brand && (
                <p className="text-gray-600">
                  Brand: <span className="font-medium">{product.brand}</span>
                </p>
              )}
            </div>

            {/* Rating */}
            {product.reviewCount > 0 ? (
              <div className="flex items-center gap-3">
                <StarRating rating={product.averageRating} readonly size={20} />
                <a
                  href="#reviews"
                  className="text-blue-600 hover:underline"
                >
                  {product.averageRating.toFixed(1)} ({product.reviewCount} review{product.reviewCount !== 1 ? 's' : ''})
                </a>
              </div>
            ) : (
              <a
                href="#reviews"
                className="text-gray-600 hover:text-blue-600"
              >
                No reviews yet - Be the first to review!
              </a>
            )}

            {/* Short Description */}
            {product.shortDescription && (
              <p className="text-lg text-gray-700">{product.shortDescription}</p>
            )}

            {/* Price */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <PriceDisplay
                price={pricing.price}
                compareAtPrice={pricing.compareAtPrice}
                size="lg"
              />
            </div>

            {/* Market Type Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Purchase Option
              </label>
              <MarketTypeSelector
                availableMarkets={product.availableMarkets}
                selected={selectedMarket}
                onSelect={setSelectedMarket}
              />
              {selectedMarket === 'carton' && (
                <p className="text-sm text-gray-600 mt-2">
                  {(pricing as any).unitsPerCarton} units per carton
                </p>
              )}
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity
              </label>
              <QuantitySelector
                quantity={quantity}
                onQuantityChange={setQuantity}
                min={pricing.minQuantity}
                max={maxQuantity}
                disabled={!isInStock}
                size="lg"
              />
              {inventory.trackInventory && (
                <p className="text-sm text-gray-600 mt-2">{inventory.stock} available</p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                onClick={handleAddToCart}
                disabled={!isInStock}
                className="w-full h-14 text-lg btn-modern"
              >
                <ShoppingCart size={20} className="mr-2" />
                {isInStock ? 'Add to Cart' : 'Out of Stock'}
              </Button>

              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="h-12">
                  <Heart size={18} className="mr-2" />
                  Wishlist
                </Button>
                <Button variant="outline" className="h-12" onClick={handleShare}>
                  <Share2 size={18} className="mr-2" />
                  Share
                </Button>
              </div>
            </div>

            {/* Features */}
            <div className="border-t pt-6 space-y-3">
              <div className="flex items-center gap-3 text-gray-700">
                <Shield className="h-5 w-5 text-blue-600" />
                <span>Quality guaranteed frozen foods</span>
              </div>
              <div className="flex items-center gap-3 text-gray-700">
                <Package className="h-5 w-5 text-blue-600" />
                <span>Secure packaging for freshness</span>
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Product Description</h2>
          <div className="prose max-w-none text-gray-700">
            {product.description}
          </div>
        </div>

        {/* Reviews Section */}
        <div id="reviews" className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Customer Reviews</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Review Form */}
            <div className="lg:col-span-1">
              <ReviewForm
                productId={product._id.toString()}
                productName={product.name}
                onSuccess={() => {
                  setReviewRefresh(prev => prev + 1);
                  // Refresh product to update rating
                  fetch(`/api/products/${slug}`)
                    .then(res => res.json())
                    .then(data => {
                      if (data.product) {
                        setProduct(data.product);
                      }
                    });
                }}
              />
            </div>

            {/* Review List */}
            <div className="lg:col-span-2">
              <ReviewList
                productId={product._id.toString()}
                refreshTrigger={reviewRefresh}
              />
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Related Products</h2>
              <Link
                href={`/products?category=${product.category}`}
                className="text-blue-600 hover:underline font-medium"
              >
                View All
              </Link>
            </div>
            <ProductGrid
              products={relatedProducts}
              onAddToCart={() => {}}
              columns={4}
            />
          </div>
        )}
      </div>
    </div>
  );
}
