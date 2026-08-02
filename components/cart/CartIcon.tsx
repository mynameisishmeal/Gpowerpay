'use client';

import { ShoppingCart } from 'lucide-react';
import { useCartStore } from '@/lib/store/cartStore';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';

/**
 * Floating Cart Icon with Badge
 * Always visible in navbar
 */
export function CartIcon() {
  const { getTotalItems, toggleCart, items } = useCartStore();
  const [itemCount, setItemCount] = useState(0);
  const [mounted, setMounted] = useState(false);

  // Only render cart count on client side to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Update item count whenever cart items change
  useEffect(() => {
    if (mounted) {
      setItemCount(getTotalItems());
    }
  }, [items, mounted, getTotalItems]);

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleCart}
      className="relative"
      aria-label={`Shopping cart with ${itemCount} items`}
    >
      <ShoppingCart size={20} />
      {mounted && itemCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
          {itemCount > 99 ? '99+' : itemCount}
        </span>
      )}
    </Button>
  );
}
