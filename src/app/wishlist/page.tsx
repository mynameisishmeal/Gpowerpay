'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useWishlistStore } from '@/lib/store/wishlistStore';
import { useCartStore } from '@/lib/store/cartStore';
import { Heart, ShoppingCart, Trash2, Loader2, Package } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import toast from 'react-hot-toast';

export default function WishlistPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { items, loading, fetchWishlist, removeFromWishlist, clearWishlist } = useWishlistStore();
  const addToCart = useCartStore((state) => state.addItem);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/wishlist');
      return;
    }

    if (status === 'authenticated') {
      fetchWishlist();
    }
  }, [status]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(price);
  };

  const handleAddToCart = (item: any) => {
    addToCart({
      productId: item.productId,
      name: item.productName,
      price: item.price,
      quantity: 1,
      marketType: item.marketType,
      image: item.image,
      maxQuantity: 999,
      inStock: true,
    });

    toast.success(`${item.productName} added to cart!`, { icon: '🛒' });
  };

  const handleRemove = async (productId: string, marketType: 'kilo' | 'carton') => {
    setRemovingId(`${productId}-${marketType}`);
    try {
      await removeFromWishlist(productId, marketType);
      toast.success('Removed from wishlist');
    } catch (error) {
      toast.error('Failed to remove item');
    } finally {
      setRemovingId(null);
    }
  };

  const handleClearAll = async () => {
    if (!confirm('Are you sure you want to clear your entire wishlist?')) return;

    try {
      await clearWishlist();
      toast.success('Wishlist cleared');
    } catch (error) {
      toast.error('Failed to clear wishlist');
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your wishlist...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Heart size={32} className="text-red-500 fill-red-500" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">My Wishlist</h1>
                <p className="text-gray-600">
                  {items.length} {items.length === 1 ? 'item' : 'items'} saved
                </p>
              </div>
            </div>
            {items.length > 0 && (
              <Button
                variant="outline"
                onClick={handleClearAll}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 size={20} className="mr-2" />
                Clear All
              </Button>
            )}
          </div>
        </div>

        {/* Empty State */}
        {items.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Heart size={64} className="text-gray-300 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Wishlist is Empty</h2>
              <p className="text-gray-600 mb-6">
                Start adding your favorite products to your wishlist!
              </p>
              <Link href="/products">
                <Button className="btn-modern">
                  <ShoppingCart size={20} className="mr-2" />
                  Browse Products
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          /* Wishlist Items */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map((item) => (
              <Card key={`${item.productId}-${item.marketType}`} className="overflow-hidden">
                <div className="relative aspect-square bg-gray-100">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.productName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package size={64} className="text-gray-300" />
                    </div>
                  )}
                  
                  {/* Remove Button */}
                  <button
                    onClick={() => handleRemove(item.productId, item.marketType)}
                    disabled={removingId === `${item.productId}-${item.marketType}`}
                    className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    {removingId === `${item.productId}-${item.marketType}` ? (
                      <Loader2 size={20} className="text-red-600 animate-spin" />
                    ) : (
                      <Trash2 size={20} className="text-red-600" />
                    )}
                  </button>
                </div>

                <CardContent className="p-4">
                  <Link href={`/products/${item.productSlug}`}>
                    <h3 className="font-semibold text-gray-900 mb-2 hover:text-blue-600 line-clamp-2">
                      {item.productName}
                    </h3>
                  </Link>
                  
                  <div className="mb-3">
                    <p className="text-lg font-bold text-blue-600">{formatPrice(item.price)}</p>
                    <p className="text-xs text-gray-500 capitalize">
                      {item.marketType === 'kilo' ? 'Per Kilo' : 'Per Carton'}
                    </p>
                  </div>

                  <p className="text-xs text-gray-500 mb-3">
                    Added {new Date(item.addedAt).toLocaleDateString()}
                  </p>

                  <Button
                    onClick={() => handleAddToCart(item)}
                    className="w-full btn-modern"
                    size="sm"
                  >
                    <ShoppingCart size={16} className="mr-2" />
                    Add to Cart
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
