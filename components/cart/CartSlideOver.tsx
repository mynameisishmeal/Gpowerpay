'use client';

import { useCartStore } from '@/lib/store/cartStore';
import { X, Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useConfirm } from '@/lib/hooks/useConfirm';

/**
 * Cart Slide-over Panel
 * Slides in from right side
 */
export function CartSlideOver() {
  const {
    items,
    isOpen,
    closeCart,
    updateQuantity,
    removeItem,
    getTotalPrice,
    getTotalItems,
    clearCart,
  } = useCartStore();
  const pathname = usePathname();

  useEffect(() => {
    // Close cart when route changes
    if (isOpen) {
      closeCart();
    }
  }, [pathname]);

  const { confirm, ConfirmDialog } = useConfirm();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(price);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay - Click to close */}
      <div
        className="fixed inset-0 bg-black/50 z-[110] transition-opacity"
        onClick={closeCart}
        aria-label="Close cart"
      />

      {/* Slide-over Panel */}
      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-xl z-[120] flex flex-col animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <ShoppingBag size={20} className="text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              Shopping Cart ({getTotalItems()})
            </h2>
          </div>
          <button
            onClick={closeCart}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close cart"
          >
            <X size={24} />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <ShoppingBag size={64} className="text-gray-300 mb-4" />
              <p className="text-gray-500 text-lg mb-2">Your cart is empty</p>
              <p className="text-gray-400 text-sm mb-6">
                Add some products to get started
              </p>
              <Link href="/products" onClick={closeCart}>
                <Button className="btn-modern">Browse Products</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.productId}
                  className="flex gap-4 p-3 bg-gray-50 rounded-lg"
                >
                  {/* Product Image */}
                  <div className="flex-shrink-0">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        width={80}
                        height={80}
                        className="rounded object-cover"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-gray-200 rounded flex items-center justify-center">
                        <ShoppingBag size={24} className="text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Product Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate mb-1">
                          {item.name}
                        </h3>
                        <span
                          className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${
                            item.marketType === 'kilo'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {item.marketType === 'kilo' ? 'Per Kilo' : 'Per Carton'}
                        </span>
                      </div>
                      <button
                        onClick={() => removeItem(item.productId, item.marketType)}
                        className="text-red-500 hover:text-red-700 ml-2"
                        aria-label="Remove item"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {/* Price */}
                    <p className="text-sm font-semibold text-gray-900 mb-2">
                      {formatPrice(item.price)} × {item.quantity}
                    </p>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          updateQuantity(item.productId, item.quantity - 1, item.marketType)
                        }
                        className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100 transition-colors"
                        aria-label="Decrease quantity"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-12 text-center font-medium">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(item.productId, item.quantity + 1, item.marketType)
                        }
                        disabled={
                          item.maxQuantity
                            ? item.quantity >= item.maxQuantity
                            : false
                        }
                        className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Increase quantity"
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    {/* Subtotal */}
                    <p className="text-sm font-bold text-blue-600 mt-2">
                      Subtotal: {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-gray-200 p-4 space-y-4">
            {/* Total */}
            <div className="flex items-center justify-between text-lg font-bold">
              <span>Total:</span>
              <span className="text-blue-600">{formatPrice(getTotalPrice())}</span>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <Link href="/checkout" onClick={closeCart} className="block">
                <Button className="w-full btn-modern bg-blue-600 hover:bg-blue-700">
                  Proceed to Checkout
                </Button>
              </Link>
              
              <div className="grid grid-cols-2 gap-3">
                <Link href="/cart" onClick={closeCart} className="block">
                  <Button variant="outline" className="w-full">
                    View Cart
                  </Button>
                </Link>
                <Link href="/products" onClick={closeCart} className="block">
                  <Button variant="outline" className="w-full text-sm">
                    Continue Shopping
                  </Button>
                </Link>
              </div>
              
              <Button
                variant="outline"
                onClick={async () => {
                  const confirmed = await confirm({
                    title: 'Clear Cart',
                    message: 'Are you sure you want to clear your cart? This action cannot be undone.',
                    confirmText: 'Clear Cart',
                    cancelText: 'Cancel',
                    variant: 'danger',
                  });
                  
                  if (confirmed) {
                    clearCart();
                    closeCart();
                  }
                }}
                className="w-full text-red-600 border-red-300 hover:bg-red-50"
              >
                Clear Cart
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog />
    </>
  );
}
