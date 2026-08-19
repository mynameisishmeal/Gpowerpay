'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  Package,
  MapPin,
  Phone,
  User,
  Clock,
  CheckCircle,
  Truck,
  AlertCircle,
  Navigation,
  Loader2,
  Calendar,
  CreditCard,
  FileText,
  ShieldAlert,
  Copy,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import toast from 'react-hot-toast';

interface OrderItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  marketType: 'kilo' | 'carton';
  image?: string;
  subtotal: number;
}

interface Order {
  _id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  deliveryOption: 'home' | 'pickup';
  deliveryType?: 'bulk' | 'small';
  deliveryAddress?: {
    street: string;
    city: string;
    state: string;
    landmark?: string;
    phone: string;
  };
  deliveryDate?: string;
  pickupDate?: string;
  deliveryStatus?: 'in_store' | 'on_the_way' | 'rider_delivered' | 'sadmin_delivered' | 'delivered' | 'disputed';
  paymentMethod: 'wallet' | 'paystack' | 'split';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  status: string;
  statusHistory?: Array<{
    status: string;
    timestamp: string;
    note?: string;
  }>;
  notes?: string;
  createdAt: string;
}

export default function RiderOrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Status update states
  const [pickingUp, setPickingUp] = useState(false);
  const [showDeliveryDialog, setShowDeliveryDialog] = useState(false);
  const [confirmationCode, setConfirmationCode] = useState('');
  const [submittingDelivery, setSubmittingDelivery] = useState(false);

  // Authentication and role protection
  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      router.push('/rider/login');
      return;
    }

    if (authStatus === 'authenticated' && (session?.user?.role as string) !== 'rider') {
      toast.error('Access denied. Riders only.');
      router.push('/');
      return;
    }

    if (authStatus === 'authenticated' && orderId) {
      fetchOrderDetails();
    }
  }, [authStatus, session, orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/orders/${orderId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch order details');
      }

      if (data.success && data.order) {
        setOrder(data.order);
      } else {
        throw new Error('Order not found');
      }
    } catch (err: any) {
      console.error('Error fetching order details:', err);
      setError(err.message || 'Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsPickedUp = async () => {
    if (!order) return;

    try {
      setPickingUp(true);
      const response = await fetch(`/api/rider/orders/${order._id}/pickup`, {
        method: 'POST',
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to mark order as picked up');
      }

      toast.success('Order marked as picked up! You are now on the way to customer.', {
        icon: '🚚',
      });
      fetchOrderDetails();
    } catch (err: any) {
      console.error('Error marking as picked up:', err);
      toast.error(err.message || 'Failed to update order status');
    } finally {
      setPickingUp(false);
    }
  };

  const handleConfirmDelivery = async () => {
    if (!order || !confirmationCode.trim()) {
      toast.error('Please enter the customer confirmation code');
      return;
    }

    try {
      setSubmittingDelivery(true);
      const response = await fetch('/api/rider/mark-delivered', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order._id,
          confirmationCode: confirmationCode.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Invalid confirmation code');
      }

      toast.success('Delivery confirmed successfully!', {
        icon: '✅',
      });
      setShowDeliveryDialog(false);
      setConfirmationCode('');
      fetchOrderDetails();
    } catch (err: any) {
      console.error('Error confirming delivery:', err);
      toast.error(err.message || 'Failed to confirm delivery');
    } finally {
      setSubmittingDelivery(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (authStatus === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading delivery order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center p-6">
          <ShieldAlert className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Not Available</h2>
          <p className="text-gray-600 mb-6">
            {error || 'This order could not be found or is not assigned to you.'}
          </p>
          <Link href="/rider/dashboard">
            <Button className="w-full">Back to Rider Dashboard</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const isDelivered = order.deliveryStatus === 'delivered' || order.deliveryStatus === 'rider_delivered';
  const isOnTheWay = order.deliveryStatus === 'on_the_way';
  const isInStore = order.deliveryStatus === 'in_store' || !order.deliveryStatus;

  const fullAddress = order.deliveryAddress
    ? `${order.deliveryAddress.street}, ${order.deliveryAddress.city}, ${order.deliveryAddress.state}`
    : '';

  const mapsUrl = fullAddress
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`
    : '';

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`, { icon: '📋', duration: 2000 });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation & Header */}
        <div className="mb-6">
          <Link
            href="/rider/dashboard"
            className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft size={18} className="mr-1.5" />
            Back to Rider Dashboard
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-5 rounded-xl border shadow-sm">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  Order #{order.orderNumber}
                  <button 
                    onClick={() => copyToClipboard(order.orderNumber, 'Order number')}
                    className="text-gray-400 hover:text-gray-700 transition-colors bg-gray-100 hover:bg-gray-200 p-1.5 rounded-md flex items-center justify-center focus:outline-none"
                    title="Copy Order Number"
                  >
                    <Copy size={16} />
                  </button>
                </h1>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                    isDelivered
                      ? 'bg-green-100 text-green-800'
                      : isOnTheWay
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {isDelivered
                    ? 'Delivered'
                    : isOnTheWay
                    ? 'On The Way'
                    : 'Ready for Pickup'}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">
                <Clock size={14} /> Assigned on {formatDate(order.createdAt)}
              </p>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-xs text-gray-500 uppercase tracking-wider">Total Value</span>
              <p className="text-xl font-bold text-blue-600">{formatPrice(order.total)}</p>
            </div>
          </div>
        </div>

        {/* Action Status Banner */}
        <div className="mb-6">
          {isInStore && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <Package className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-amber-900">Step 1: Pick Up from Store</h3>
                  <p className="text-sm text-amber-800 mt-1">
                    Collect the packages listed below from the fulfillment store. Once ready, click the button to notify the customer that you are on the way.
                  </p>
                  <div className="mt-4">
                    <Button
                      onClick={handleMarkAsPickedUp}
                      disabled={pickingUp}
                      className="bg-amber-600 hover:bg-amber-700 text-white font-semibold"
                    >
                      {pickingUp ? (
                        <>
                          <Loader2 size={16} className="animate-spin mr-2" />
                          Updating Status...
                        </>
                      ) : (
                        <>
                          <Truck size={16} className="mr-2" />
                          Mark as Picked Up (On The Way)
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {isOnTheWay && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <Truck className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-900">Step 2: Deliver to Customer</h3>
                  <p className="text-sm text-blue-800 mt-1">
                    You are on the way to the delivery address. When you hand the package to the customer, ask them for their <strong>6-digit confirmation code</strong> to finalize delivery.
                  </p>
                  <div className="mt-4 flex gap-3 flex-wrap">
                    <Button
                      onClick={() => setShowDeliveryDialog(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                    >
                      <CheckCircle size={16} className="mr-2" />
                      Enter Confirmation Code & Complete Delivery
                    </Button>
                    {mapsUrl && (
                      <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" className="bg-white">
                          <Navigation size={16} className="mr-2 text-blue-600" />
                          Open in Google Maps
                        </Button>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {isDelivered && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-green-900">Delivery Completed</h3>
                  <p className="text-sm text-green-800 mt-0.5">
                    This order has been successfully delivered and confirmed with the verification code.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Details (2 cols) */}
          <div className="md:col-span-2 space-y-6">
            {/* Customer & Location Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <User size={18} className="text-blue-600" />
                  Customer & Delivery Location
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-3 border-b">
                  <div>
                    <span className="text-xs text-gray-500 block">Customer Name</span>
                    <span className="font-semibold text-gray-900">{order.customerName}</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block">Phone Contact</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <a
                        href={`tel:${order.customerPhone || order.deliveryAddress?.phone}`}
                        className="font-semibold text-blue-600 hover:underline flex items-center gap-1.5"
                      >
                        <Phone size={14} />
                        {order.customerPhone || order.deliveryAddress?.phone || 'No phone provided'}
                      </a>
                      {(order.customerPhone || order.deliveryAddress?.phone) && (
                        <button
                          onClick={() => copyToClipboard((order.customerPhone || order.deliveryAddress?.phone) as string, 'Phone number')}
                          className="text-gray-400 hover:text-blue-600 transition-colors p-1 rounded-md hover:bg-blue-50 focus:outline-none"
                          title="Copy Phone Number"
                        >
                          <Copy size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <span className="text-xs text-gray-500 block mb-1">Destination Address</span>
                  {order.deliveryAddress ? (
                    <div className="bg-gray-50 p-3 rounded-lg border text-sm text-gray-800 space-y-1">
                      <div className="flex items-start gap-2">
                        <MapPin size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-gray-900">{order.deliveryAddress.street}</p>
                          <p className="text-gray-600">
                            {order.deliveryAddress.city}, {order.deliveryAddress.state}
                          </p>
                          {order.deliveryAddress.landmark && (
                            <p className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded mt-1 border border-amber-200 inline-block">
                              📍 Landmark: {order.deliveryAddress.landmark}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">In-Store Pickup</p>
                  )}
                </div>

                {order.notes && (
                  <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg text-sm text-yellow-900">
                    <p className="font-semibold text-xs text-yellow-800 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <FileText size={14} /> Customer Delivery Instructions:
                    </p>
                    <p>{order.notes}</p>
                  </div>
                )}

                {mapsUrl && (
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <Button variant="outline" className="w-full text-blue-600 border-blue-200 hover:bg-blue-50">
                      <Navigation size={16} className="mr-2" />
                      Get Directions in Google Maps
                    </Button>
                  </a>
                )}
              </CardContent>
            </Card>

            {/* Package Contents / Items List */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Package size={18} className="text-blue-600" />
                    Items to Deliver ({order.items.length})
                  </span>
                  {order.deliveryType && (
                    <span className="text-xs px-2.5 py-1 bg-purple-100 text-purple-800 font-semibold rounded-full uppercase">
                      {order.deliveryType} Delivery
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="divide-y">
                  {order.items.map((item, index) => (
                    <div key={index} className="py-3.5 flex items-center gap-3.5 first:pt-0 last:pb-0">
                      <div className="w-14 h-14 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 relative border">
                        {item.image ? (
                          <Image
                            src={item.image}
                            alt={item.productName || 'Product'}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <Package size={20} />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 text-sm truncate">
                          {item.productName || 'Product'}
                        </h4>
                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-600">
                          <span className="px-2 py-0.5 bg-gray-100 rounded text-gray-800 font-medium">
                            {item.marketType === 'kilo' ? 'Per Kilo' : 'Per Carton'}
                          </span>
                          <span>Quantity: <strong>{item.quantity}</strong></span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-semibold text-gray-900 text-sm">
                          {formatPrice(item.subtotal)}
                        </span>
                        <span className="block text-xs text-gray-500">
                          {formatPrice(item.price)} each
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar / Summary (1 col) */}
          <div className="space-y-6">
            {/* Payment & Financials */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <CreditCard size={18} className="text-blue-600" />
                  Payment Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Payment Method</span>
                  <span className="font-semibold text-gray-900 capitalize">
                    {order.paymentMethod}
                  </span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Payment Status</span>
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-semibold uppercase ${
                      order.paymentStatus === 'paid'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {order.paymentStatus}
                  </span>
                </div>

                <div className="border-t pt-3 space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Subtotal</span>
                    <span>{formatPrice(order.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Delivery Fee</span>
                    <span>{formatPrice(order.deliveryFee)}</span>
                  </div>
                  <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t">
                    <span>Total Amount</span>
                    <span className="text-blue-600">{formatPrice(order.total)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold">Rider Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {isInStore && (
                  <Button
                    onClick={handleMarkAsPickedUp}
                    disabled={pickingUp}
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                  >
                    {pickingUp ? (
                      <Loader2 size={16} className="animate-spin mr-2" />
                    ) : (
                      <Truck size={16} className="mr-2" />
                    )}
                    Mark as Picked Up
                  </Button>
                )}

                {isOnTheWay && (
                  <Button
                    onClick={() => setShowDeliveryDialog(true)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <CheckCircle size={16} className="mr-2" />
                    Complete Delivery
                  </Button>
                )}

                <a
                  href={`tel:${order.customerPhone || order.deliveryAddress?.phone}`}
                  className="block"
                >
                  <Button variant="outline" className="w-full">
                    <Phone size={16} className="mr-2 text-green-600" />
                    Call Customer
                  </Button>
                </a>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Confirmation Code Dialog */}
      <Dialog open={showDeliveryDialog} onOpenChange={setShowDeliveryDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Complete Delivery</DialogTitle>
            <DialogDescription>
              Enter the 6-digit confirmation code provided by the customer to verify package handover.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-900">
              💡 The customer received this code in their order confirmation notification/receipt.
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">
                6-Digit Confirmation Code
              </label>
              <Input
                type="text"
                maxLength={6}
                placeholder="e.g. 123456"
                value={confirmationCode}
                onChange={(e) => setConfirmationCode(e.target.value.replace(/\D/g, ''))}
                className="text-center text-2xl tracking-widest font-mono font-bold"
                autoFocus
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeliveryDialog(false);
                setConfirmationCode('');
              }}
              disabled={submittingDelivery}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmDelivery}
              disabled={submittingDelivery || confirmationCode.length < 6}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {submittingDelivery ? (
                <>
                  <Loader2 size={16} className="animate-spin mr-2" />
                  Verifying...
                </>
              ) : (
                <>
                  <CheckCircle size={16} className="mr-2" />
                  Verify & Deliver
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
