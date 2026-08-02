'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useCartStore } from '@/lib/store/cartStore';
import { ArrowLeft, Package, MapPin, CreditCard, Check, Mail, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckoutStepReview } from '@/components/checkout/CheckoutStepReview';
import { CheckoutStepDelivery } from '@/components/checkout/CheckoutStepDelivery';
import { CheckoutStepPayment } from '@/components/checkout/CheckoutStepPayment';
import toast from 'react-hot-toast';

/**
 * Multi-step Checkout Page
 */

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export type DeliveryOption = 'home' | 'pickup';
export type DeliveryType = 'bulk' | 'small' | null;

export interface DeliveryInfo {
  option: DeliveryOption;
  deliveryType?: DeliveryType;
  address?: {
    street: string;
    city: string;
    state: string;
    landmark?: string;
    phone: string;
  };
  pickupDate?: string;
  deliveryDate?: string;
  deliveryFee: number;
}

export interface PaymentMethod {
  type: 'wallet' | 'paystack' | 'split';
  walletAmount?: number;
  paystackAmount?: number;
}

export default function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = searchParams;
  const router = useRouter();
  const { data: session, status } = useSession();
  const { items, getTotalPrice, getTotalItems } = useCartStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryInfo | null>(null);
  const [currentDeliveryOption, setCurrentDeliveryOption] = useState<DeliveryOption>('home');
  const [deliveryType, setDeliveryType] = useState<DeliveryType>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  
  // Auto-select delivery type based on item count
  useEffect(() => {
    const itemCount = getTotalItems();
    if (currentDeliveryOption === 'home') {
      if (itemCount > 5) {
        setDeliveryType('bulk'); // Force bulk for >5 items
      } else if (itemCount >= 1 && itemCount <= 5) {
        setDeliveryType('small'); // Force small for 1-5 items
      }
    }
  }, [currentDeliveryOption, getTotalItems]);
  const [processing, setProcessing] = useState(false);
  const [orderCompleted, setOrderCompleted] = useState(false);
  const clearCart = useCartStore((state) => state.clearCart);

  // Redirect if not logged in
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/checkout');
    }
  }, [status, router]);
  
  // Redirect if cart is empty (but not if order was just completed)
  useEffect(() => {
    if (status === 'authenticated' && items.length === 0 && !orderCompleted) {
      router.push('/cart');
    }
  }, [items.length, status, router, orderCompleted]);

  // Show loading while checking auth or if redirecting
  if (status === 'loading' || status === 'unauthenticated' || (status === 'authenticated' && items.length === 0)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const subtotal = getTotalPrice();
  const deliveryFee = deliveryInfo?.deliveryFee || 0;
  const total = subtotal + deliveryFee;

  const steps = [
    { number: 1, title: 'Review Cart', icon: Package },
    { number: 2, title: 'Delivery', icon: MapPin },
    { number: 3, title: 'Payment', icon: CreditCard },
  ];

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(price);
  };

  const handleCompleteOrder = async (payment: PaymentMethod) => {
    if (!session?.user || !deliveryInfo) return;

    setProcessing(true);
    setPaymentMethod(payment);

    try {
      // Create order
      const orderData = {
        customerPhone: deliveryInfo.address?.phone || (session.user as any).phone || (deliveryInfo.option === 'pickup' ? 'N/A' : ''),
        items: items.map(item => ({
          productId: item.productId,
          productName: item.name || 'Unknown Product', // Fallback for old cart data
          price: item.price,
          quantity: item.quantity,
          marketType: item.marketType,
          image: item.image,
          subtotal: item.price * item.quantity,
        })),
        subtotal,
        deliveryFee,
        total,
        deliveryOption: deliveryInfo.option,
        deliveryType: deliveryType, // Pass the delivery type
        deliveryAddress: deliveryInfo.address,
        deliveryDate: deliveryInfo.deliveryDate,
        pickupDate: deliveryInfo.pickupDate,
        paymentMethod: payment.type,
      };

      console.log('📦 Order Data Being Sent:', JSON.stringify(orderData, null, 2));
      console.log('📞 Customer Phone:', orderData.customerPhone);
      console.log('👤 Session User:', session.user);
      console.log('📍 Delivery Info:', deliveryInfo);

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create order');
      }

      console.log('✅ Order created successfully:', data.order);

      // Mark order as completed to prevent cart redirect
      setOrderCompleted(true);

      // Clear cart AFTER successful order creation
      clearCart();
      
      // Clear delivery form from localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('gpowerpay-delivery-info');
      }

      // Redirect to order confirmation
      toast.success('Order placed successfully!');
      router.push(`/orders/${data.order.orderId}?success=true`);
    } catch (error: any) {
      console.error('Order creation error:', error);
      toast.error(error.message || 'Failed to create order. Please try again.');
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Link href="/cart" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6">
          <ArrowLeft size={20} className="mr-2" />
          Back to Cart
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Checkout</h1>
          <p className="text-gray-600">
            Complete your order - {getTotalItems()} {getTotalItems() === 1 ? 'item' : 'items'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Progress Steps */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  {steps.map((step, index) => {
                    const Icon = step.icon;
                    const isActive = currentStep === step.number;
                    const isCompleted = currentStep > step.number;

                    return (
                      <div key={step.number} className="flex items-center flex-1">
                        <div className="flex flex-col items-center flex-1">
                          <div
                            className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-colors ${
                              isCompleted
                                ? 'bg-green-500 text-white'
                                : isActive
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-200 text-gray-500'
                            }`}
                          >
                            {isCompleted ? (
                              <Check size={24} />
                            ) : (
                              <Icon size={24} />
                            )}
                          </div>
                          <span
                            className={`text-sm font-medium ${
                              isActive ? 'text-blue-600' : 'text-gray-500'
                            }`}
                          >
                            {step.title}
                          </span>
                        </div>
                        {index < steps.length - 1 && (
                          <div
                            className={`h-1 flex-1 mx-4 transition-colors ${
                              currentStep > step.number
                                ? 'bg-green-500'
                                : 'bg-gray-200'
                            }`}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Step Content */}
            {currentStep === 1 && (
              <CheckoutStepReview
                items={items}
                onContinue={() => setCurrentStep(2)}
              />
            )}

            {currentStep === 2 && (
              <CheckoutStepDelivery
                onBack={() => setCurrentStep(1)}
                onContinue={(info) => {
                  setDeliveryInfo(info);
                  setCurrentStep(3);
                }}
                onDeliveryOptionChange={(option) => {
                  setCurrentDeliveryOption(option);
                  if (option === 'pickup') {
                    setDeliveryType(null); // Clear delivery type for pickup
                  }
                }}
                initialData={deliveryInfo}
              />
            )}

            {currentStep === 3 && deliveryInfo && (
              <CheckoutStepPayment
                total={total}
                deliveryInfo={deliveryInfo}
                onBack={() => setCurrentStep(2)}
                onComplete={handleCompleteOrder}
                processing={processing}
              />
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <Card className="card-shadow sticky top-24">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal ({getTotalItems()} items)</span>
                    <span className="font-medium">{formatPrice(subtotal)}</span>
                  </div>

                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span className="text-blue-600">{formatPrice(total)}</span>
                    </div>
                  </div>
                </div>

                {/* Delivery Type Selection Card - Auto-selected based on quantity */}
                {currentStep === 2 && currentDeliveryOption === 'home' && (
                  <Card className="bg-blue-50 border-blue-200 mt-4">
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-3 text-sm">
                        Delivery Type (Auto-selected)
                      </h3>
                      <div className="space-y-2">
                        {/* Bulk Delivery - Only for >5 items */}
                        <div className={`flex items-center gap-3 p-3 rounded-lg border-2 ${
                          getTotalItems() > 5
                            ? 'bg-blue-50 border-blue-600'
                            : 'bg-gray-100 border-gray-300 opacity-60'
                        }`}>
                          <input
                            type="radio"
                            name="deliveryType"
                            value="bulk"
                            checked={deliveryType === 'bulk'}
                            disabled
                            className="w-4 h-4 text-blue-600"
                          />
                          <div className="flex-1">
                            <p className="font-medium text-sm text-gray-900">Bulk Delivery</p>
                            <p className="text-xs text-gray-500">For more than 5 items</p>
                          </div>
                          {getTotalItems() > 5 ? (
                            <span className="text-xs text-green-600 font-medium">
                              Selected
                            </span>
                          ) : (
                            <span className="text-xs text-gray-500">
                              Not eligible
                            </span>
                          )}
                        </div>

                        {/* Small Quantity - Only for 1-5 items */}
                        <div className={`flex items-center gap-3 p-3 rounded-lg border-2 ${
                          getTotalItems() >= 1 && getTotalItems() <= 5
                            ? 'bg-blue-50 border-blue-600'
                            : 'bg-gray-100 border-gray-300 opacity-60'
                        }`}>
                          <input
                            type="radio"
                            name="deliveryType"
                            value="small"
                            checked={deliveryType === 'small'}
                            disabled
                            className="w-4 h-4 text-blue-600"
                          />
                          <div className="flex-1">
                            <p className="font-medium text-sm text-gray-900">Small Quantity</p>
                            <p className="text-xs text-gray-500">For 1-5 items</p>
                          </div>
                          {getTotalItems() >= 1 && getTotalItems() <= 5 ? (
                            <span className="text-xs text-green-600 font-medium">
                              Selected
                            </span>
                          ) : (
                            <span className="text-xs text-gray-500">
                              Not eligible
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="mt-3 p-2 bg-green-50 rounded text-xs text-green-700">
                        ✓ Delivery type automatically selected based on your order quantity
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Delivery Info Summary */}
                {deliveryInfo && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h3 className="font-semibold text-gray-900 mb-3">
                      Delivery Details
                    </h3>
                    {deliveryInfo.option === 'home' ? (
                      <div className="text-sm text-gray-600 space-y-1">
                        <p className="font-medium">Home Delivery</p>
                        {deliveryInfo.deliveryType && (
                          <p className="text-xs text-blue-600 font-medium">
                            {deliveryInfo.deliveryType === 'bulk' ? 'Bulk Delivery' : 'Small Quantity Delivery'}
                          </p>
                        )}
                        <p>{deliveryInfo.address?.street}</p>
                        <p>{deliveryInfo.address?.city}, {deliveryInfo.address?.state}</p>
                        {deliveryInfo.deliveryDate && (
                          <p className="mt-2">Date: {new Date(deliveryInfo.deliveryDate).toLocaleDateString()}</p>
                        )}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-600 space-y-1">
                        <p className="font-medium">Store Pickup</p>
                        <p>Gpower Frozen Foods</p>
                        {deliveryInfo.pickupDate && (
                          <p className="mt-2">Date: {new Date(deliveryInfo.pickupDate).toLocaleDateString()}</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
