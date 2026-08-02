'use client';

import Image from 'next/image';
import { ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { CartItem } from '@/lib/store/cartStore';

interface CheckoutStepReviewProps {
  items: CartItem[];
  onContinue: () => void;
}

export function CheckoutStepReview({ items, onContinue }: CheckoutStepReviewProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(price);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Review Your Items</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((item) => (
          <div key={item.productId} className="flex gap-4 py-4 border-b border-gray-100 last:border-0">
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

            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">{item.name}</h3>
              <span
                className={`inline-block px-2 py-1 text-xs font-medium rounded ${
                  item.marketType === 'kilo'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-green-100 text-green-800'
                }`}
              >
                {item.marketType === 'kilo' ? 'Per Kilo' : 'Per Carton'}
              </span>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-gray-600">
                  {formatPrice(item.price)} × {item.quantity}
                </span>
                <span className="font-bold text-blue-600">
                  {formatPrice(item.price * item.quantity)}
                </span>
              </div>
            </div>
          </div>
        ))}

        <div className="pt-4">
          <Button onClick={onContinue} size="lg" className="w-full btn-modern">
            Continue to Delivery
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
