'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle, XCircle, Package, User, Phone, MapPin, LogIn } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { useLoading } from '@/components/providers/LoadingProvider';

interface OrderInfo {
  _id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress?: {
    street: string;
    city: string;
    state: string;
    landmark?: string;
  };
  items: Array<{
    productName: string;
    quantity: number;
  }>;
  total: number;
  deliveryType: string;
  deliveryStatus: string;
  assignedRider?: {
    riderId: string;
    name: string;
  };
}

export default function RiderVerifyPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [code, setCode] = useState('');
  const { startLoading, stopLoading } = useLoading();
  const [orderInfo, setOrderInfo] = useState<OrderInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isRider = session?.user?.role === 'rider';
  const isSadmin = session?.user?.role === 'sadmin';

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/rider/login?callbackUrl=/rider/verify');
    } else if (status === 'authenticated') {
      if (!isRider && !isSadmin) {
        toast.error('Access denied. Riders and Super Admins only.');
        router.push('/');
      }
    }
  }, [status, session, router, isRider, isSadmin]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Double check before rendering
  if (status === 'unauthenticated' || (!isRider && !isSadmin)) {
    return null;
  }

  const handleVerify = async () => {
    if (code.length !== 6) {
      toast.error('Please enter a 6-digit code');
      return;
    }

    startLoading('Verifying order code...');
    setError(null);
    setOrderInfo(null);

    try {
      const response = await fetch('/api/rider/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmationCode: code }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Invalid confirmation code');
      }

      setOrderInfo(data.order);
      toast.success('Order verified successfully!');
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      stopLoading();
    }
  };

  const handleMarkDelivered = async () => {
    if (!orderInfo || !isRider) return;

    if (!confirm('Are you sure you want to mark this order as delivered?')) return;

    startLoading('Marking order as delivered...');
    try {
      const response = await fetch('/api/rider/mark-delivered', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: orderInfo._id,
          confirmationCode: code,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to mark as delivered');
      }

      toast.success('Order marked as delivered!');
      
      // Refresh order info
      setOrderInfo({ ...orderInfo, deliveryStatus: 'delivered' });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      stopLoading();
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-full mb-4">
            <Package size={40} className="text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Rider Verification</h1>
          <p className="text-gray-600">Enter the customer's 6-digit confirmation code</p>
          
          {/* Login/Dashboard Link */}
          <div className="mt-4">
            {isRider ? (
              <Link href="/rider/dashboard">
                <Button variant="outline" size="sm">
                  Go to Dashboard
                </Button>
              </Link>
            ) : (
              <Link href="/rider/login">
                <Button variant="outline" size="sm">
                  <LogIn size={16} className="mr-2" />
                  Rider Login
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Verification Card */}
        <Card className="mb-6 shadow-xl">
          <CardHeader>
            <CardTitle>Verify Delivery</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmation Code
                </label>
                <Input
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  className="text-center text-2xl font-bold tracking-widest"
                />
              </div>

              <Button
                onClick={handleVerify}
                disabled={code.length !== 6}
                className="w-full"
                size="lg"
              >
                Verify Order
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Error Message */}
        {error && (
          <Card className="border-red-200 bg-red-50 mb-6">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <XCircle size={24} className="text-red-600" />
                <div>
                  <h3 className="font-semibold text-red-900">Verification Failed</h3>
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Order Info */}
        {orderInfo && (
          <Card className="border-green-200 bg-green-50 shadow-xl">
            <CardHeader className="bg-green-100 border-b border-green-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle size={32} className="text-green-600" />
                  <div>
                    <CardTitle className="text-green-900">Order Verified!</CardTitle>
                    <p className="text-sm text-green-700">Order #{orderInfo.orderNumber}</p>
                  </div>
                </div>
                {orderInfo.deliveryStatus === 'delivered' && (
                  <span className="px-3 py-1 bg-green-600 text-white rounded-full text-sm font-medium">
                    Delivered
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {/* Customer Info */}
              <div className="bg-white rounded-lg p-4 border border-green-200">
                <div className="flex items-center gap-2 mb-3">
                  <User size={20} className="text-green-700" />
                  <h3 className="font-semibold text-gray-900">Customer Information</h3>
                </div>
                <div className="space-y-2">
                  <p className="text-gray-900"><strong>Name:</strong> {orderInfo.customerName}</p>
                  <div className="flex items-center gap-2">
                    <Phone size={16} className="text-gray-500" />
                    <a href={`tel:${orderInfo.customerPhone}`} className="text-blue-600 hover:underline">
                      {orderInfo.customerPhone}
                    </a>
                  </div>
                </div>
              </div>

              {/* Delivery Address */}
              {orderInfo.deliveryAddress && (
                <div className="bg-white rounded-lg p-4 border border-green-200">
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin size={20} className="text-green-700" />
                    <h3 className="font-semibold text-gray-900">Delivery Address</h3>
                  </div>
                  <div className="text-gray-700">
                    <p>{orderInfo.deliveryAddress.street}</p>
                    <p>{orderInfo.deliveryAddress.city}, {orderInfo.deliveryAddress.state}</p>
                    {orderInfo.deliveryAddress.landmark && (
                      <p className="text-sm text-gray-600 mt-1">
                        <strong>Landmark:</strong> {orderInfo.deliveryAddress.landmark}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Order Items */}
              <div className="bg-white rounded-lg p-4 border border-green-200">
                <h3 className="font-semibold text-gray-900 mb-3">Order Items</h3>
                <ul className="space-y-2">
                  {orderInfo.items.map((item, index) => (
                    <li key={index} className="flex justify-between text-gray-700">
                      <span>{item.productName}</span>
                      <span className="text-gray-500">×{item.quantity}</span>
                    </li>
                  ))}
                </ul>
                <div className="border-t border-green-200 mt-3 pt-3">
                  <div className="flex justify-between font-semibold text-gray-900">
                    <span>Total</span>
                    <span>{formatPrice(orderInfo.total)}</span>
                  </div>
                </div>
              </div>

              {/* Delivery Type Badge */}
              <div className="text-center">
                <span className="inline-block bg-blue-100 text-blue-800 px-4 py-2 rounded-full font-medium">
                  {orderInfo.deliveryType === 'bulk' ? '📦 Bulk Delivery' : '🚲 Small Quantity'}
                </span>
              </div>

              {/* Mark as Delivered Button (Riders Only) */}
              {isRider && orderInfo.deliveryStatus !== 'delivered' && (
                <Button
                  onClick={handleMarkDelivered}
                  className="w-full bg-green-600 hover:bg-green-700"
                  size="lg"
                >
                  ✅ Mark as Delivered
                </Button>
              )}

              {!isRider && orderInfo.deliveryStatus !== 'delivered' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                  <p className="text-sm text-blue-800">
                    <Link href="/rider/login" className="font-medium hover:underline">
                      Sign in as a rider
                    </Link>
                    {' '}to mark this order as delivered
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card className="mt-6">
          <CardContent className="p-6">
            <h3 className="font-semibold text-gray-900 mb-2">📋 How to Use</h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-700 text-sm">
              <li>Ask the customer for their 6-digit confirmation code</li>
              <li>Enter the code above and click "Verify Order"</li>
              <li>Confirm the customer details match</li>
              <li>Deliver the items</li>
              <li>{isRider ? 'Click "Mark as Delivered" when complete' : 'Sign in as a rider to mark orders as delivered'}</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
