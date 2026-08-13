'use client';

import { useState, useEffect, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowLeft, Package, MapPin, CreditCard, Truck, CheckCircle, XCircle, Clock, RotateCcw, Phone, User, Bike, Copy } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCartStore } from '@/lib/store/cartStore';
import toast from 'react-hot-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ReviewForm } from '@/components/reviews/ReviewForm';
import { Star } from 'lucide-react';

interface OrderItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  marketType: string;
  image?: string;
  subtotal: number;
}

interface Order {
  orderId: string;
  confirmationCode: string;
  customerEmail: string;
  customerPhone: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: 'pending' | 'processing' | 'out_for_delivery' | 'rider_delivered' | 'completed' | 'delivered' | 'cancelled' | 'disputed';
  deliveryOption: 'home' | 'pickup';
  deliveryType?: 'bulk' | 'small';
  deliveryStatus?: 'in_store' | 'on_the_way' | 'rider_delivered' | 'delivered' | 'disputed';
  assignedRider?: {
    riderId: string;
    name: string;
    phone: string;
    image?: string;
  };
  deliveryAddress?: any;
  deliveryDate?: string;
  pickupDate?: string;
  paymentMethod: string;
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  createdAt: string;
  updatedAt: string;
}

interface Rider {
  _id: string;
  name: string;
  phone: string;
  riderType: 'bulk' | 'small';
  status: 'active' | 'inactive';
  image?: string;
}

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reordering, setReordering] = useState(false);
  const [availableRiders, setAvailableRiders] = useState<Rider[]>([]);
  const [loadingRiders, setLoadingRiders] = useState(false);
  const [assigningRider, setAssigningRider] = useState<string | null>(null);
  const [resolving, setResolving] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [showDisputeDialog, setShowDisputeDialog] = useState(false);
  const addItem = useCartStore((state) => state.addItem);

  // Unwrap params Promise in Next.js 16
  const { id } = use(params);

  const isSuccess = searchParams.get('success') === 'true';

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (isSuccess) {
      toast.success('Order placed successfully!');
    }

    fetchOrder();
  }, [id, status, isSuccess]);

  useEffect(() => {
    // Fetch available riders if order is home delivery and no rider assigned yet
    if (order && order.deliveryOption === 'home' && order.deliveryType && !order.assignedRider) {
      fetchAvailableRiders();
    }
  }, [order]);

  const fetchOrder = async () => {
    try {
      const response = await fetch(`/api/orders/${id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch order');
      }

      setOrder(data.order);
    } catch (err: any) {
      setError(err.message);
      toast.error('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableRiders = async () => {
    if (!order?.deliveryType) return;

    setLoadingRiders(true);
    try {
      const response = await fetch(`/api/riders?riderType=${order.deliveryType}&status=active`);
      const data = await response.json();

      if (response.ok) {
        // Map the response to ensure correct field names
        const mappedRiders = (data.riders || []).map((rider: any) => ({
          ...rider,
          riderType: rider.partnerType || rider.riderType,
        }));
        setAvailableRiders(mappedRiders);
      }
    } catch (err) {
      console.error('Error fetching riders:', err);
    } finally {
      setLoadingRiders(false);
    }
  };

  const handleAssignRider = async (riderId: string) => {
    console.log('🎯 Assigning rider with ID:', riderId);
    console.log('📋 Available riders:', availableRiders.map(r => ({ id: r._id, name: r.name })));
    
    setAssigningRider(riderId);
    try {
      const requestBody = { riderId };
      console.log('📤 Sending request body:', requestBody);
      
      const response = await fetch(`/api/orders/${id}/assign-rider`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      console.log('📥 Response:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to assign rider');
      }

      toast.success('Rider assigned successfully!');
      fetchOrder(); // Refresh order to show assigned rider
    } catch (err: any) {
      console.error('❌ Error assigning rider:', err);
      toast.error(err.message || 'Failed to assign rider');
    } finally {
      setAssigningRider(null);
    }
  };

  const handleResolveDelivery = async (action: 'accept' | 'dispute') => {
    if (action === 'dispute' && !disputeReason) {
      toast.error('Please provide a reason for the dispute');
      return;
    }

    setResolving(true);
    try {
      const response = await fetch(`/api/orders/${id}/resolve-delivery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason: action === 'dispute' ? disputeReason : undefined }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to resolve delivery');
      }

      toast.success(action === 'accept' ? 'Delivery accepted!' : 'Delivery disputed.');
      setShowDisputeDialog(false);
      fetchOrder(); // refresh order
    } catch (err: any) {
      toast.error(err.message || 'Failed to resolve delivery');
    } finally {
      setResolving(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success(`${label} copied to clipboard!`);
    }).catch(() => {
      toast.error('Failed to copy');
    });
  };

  const handleCancelOrder = async () => {
    if (!confirm('Are you sure you want to cancel this order?')) return;

    try {
      const response = await fetch(`/api/orders/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel order');
      }

      toast.success('Order cancelled successfully');
      fetchOrder(); // Refresh order
    } catch (err: any) {
      toast.error(err.message || 'Failed to cancel order');
    }
  };

  const handleReorder = () => {
    if (!order) return;

    setReordering(true);
    
    try {
      let itemsAdded = 0;
      
      // Add all items from the order to cart
      order.items.forEach((item) => {
        addItem({
          productId: item.productId,
          name: item.productName,
          price: item.price,
          quantity: item.quantity,
          marketType: item.marketType as 'kilo' | 'carton',
          image: item.image,
          maxQuantity: 999,
          inStock: true, // Assume in stock, will be validated at checkout
        });
        itemsAdded++;
      });

      toast.success(`${itemsAdded} ${itemsAdded === 1 ? 'item' : 'items'} added to cart!`, {
        icon: '🛒',
        duration: 4000,
      });

      // Redirect to cart
      setTimeout(() => {
        router.push('/cart');
      }, 1000);
    } catch (error) {
      toast.error('Failed to reorder items');
      setReordering(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(price);
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock },
      processing: { bg: 'bg-blue-100', text: 'text-blue-800', icon: Truck },
      out_for_delivery: { bg: 'bg-blue-100', text: 'text-blue-800', icon: Truck },
      rider_delivered: { bg: 'bg-purple-100', text: 'text-purple-800', icon: CheckCircle },
      completed: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
      delivered: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
      cancelled: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle },
      disputed: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle },
    };

    const badge = badges[status as keyof typeof badges] || badges.pending;
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${badge.bg} ${badge.text}`}>
        <Icon size={16} />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle size={48} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'This order does not exist or you do not have access to it.'}</p>
          <Link href="/orders">
            <Button>View All Orders</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Link href="/orders" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6">
          <ArrowLeft size={20} className="mr-2" />
          Back to Orders
        </Link>

        {/* Success Message */}
        {isSuccess && (
          <Card className="mb-6 border-green-200 bg-green-50">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <CheckCircle size={24} className="text-green-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-green-900 mb-1">Order Placed Successfully!</h3>
                  <p className="text-green-700 text-sm">
                    Your order has been received and is being processed. We'll send you updates via email.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Order Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="mb-2">Order #{order.orderId}</CardTitle>
                <p className="text-sm text-gray-500">
                  Placed on {new Date(order.createdAt).toLocaleDateString('en-NG', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
                
                {/* Confirmation Code */}
                {order.confirmationCode && (
                  <div className="mt-4 inline-flex items-center gap-3 bg-blue-50 border-2 border-blue-300 rounded-lg px-4 py-3">
                    <div>
                      <p className="text-xs text-blue-700 font-medium mb-0.5">Confirmation Code</p>
                      <p className="text-2xl font-bold text-blue-900 tracking-wider">{order.confirmationCode}</p>
                    </div>
                    <button
                      onClick={() => copyToClipboard(order.confirmationCode, 'Confirmation code')}
                      className="p-2 hover:bg-blue-100 rounded transition-colors"
                      title="Copy confirmation code"
                    >
                      <Copy size={18} className="text-blue-600" />
                    </button>
                  </div>
                )}
              </div>
              <div className="flex flex-col items-end gap-2">
                {/* Show deliveryStatus if available, otherwise show status */}
                {order.deliveryStatus ? (
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${
                    order.deliveryStatus === 'in_store' ? 'bg-yellow-100 text-yellow-800' :
                    order.deliveryStatus === 'on_the_way' ? 'bg-blue-100 text-blue-800' :
                    order.deliveryStatus === 'rider_delivered' ? 'bg-purple-100 text-purple-800' :
                    order.deliveryStatus === 'disputed' ? 'bg-red-100 text-red-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {order.deliveryStatus === 'in_store' && <><Package size={16} /> In Store</>}
                    {order.deliveryStatus === 'on_the_way' && <><Truck size={16} /> On The Way</>}
                    {order.deliveryStatus === 'rider_delivered' && <><CheckCircle size={16} /> Awaiting Confirmation</>}
                    {order.deliveryStatus === 'delivered' && <><CheckCircle size={16} /> Delivered</>}
                    {order.deliveryStatus === 'disputed' && <><XCircle size={16} /> Disputed</>}
                  </span>
                ) : (
                  getStatusBadge(order.status)
                )}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleReorder}
                    disabled={reordering}
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  >
                    <RotateCcw size={16} className="mr-2" />
                    {reordering ? 'Adding to cart...' : 'Reorder'}
                  </Button>
                  {order.status === 'pending' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancelOrder}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      Cancel Order
                    </Button>
                  )}
                  {(order.status === 'completed' || order.deliveryStatus === 'delivered') && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
                        >
                          <Star size={16} className="mr-2" />
                          Rate Items
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Rate Items in Order #{order.orderId}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-6 mt-4">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="border-b pb-6 last:border-0 last:pb-0">
                              <ReviewForm productId={item.productId} productName={item.productName} />
                            </div>
                          ))}
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Delivery Resolution Banner */}
            {order.status === 'rider_delivered' && (
              <Card className="border-blue-300 bg-blue-50 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-blue-900 flex items-center gap-2">
                        <CheckCircle className="text-blue-600" />
                        Confirm Your Delivery
                      </h3>
                      <p className="text-blue-800 mt-1">
                        Your rider has marked this order as delivered. Please confirm that you have received your items in good condition.
                      </p>
                    </div>
                    <div className="flex gap-3 shrink-0">
                      <Dialog open={showDisputeDialog} onOpenChange={setShowDisputeDialog}>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700">
                            Dispute Delivery
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Dispute Delivery</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <p className="text-sm text-gray-600">
                              Please explain why you are disputing this delivery. Our support team will investigate immediately.
                            </p>
                            <textarea
                              className="w-full min-h-[100px] p-3 border rounded-md focus:ring-2 focus:ring-blue-500"
                              placeholder="E.g., I did not receive the package, items are missing/damaged..."
                              value={disputeReason}
                              onChange={(e) => setDisputeReason(e.target.value)}
                            />
                            <div className="flex justify-end gap-3">
                              <Button variant="outline" onClick={() => setShowDisputeDialog(false)}>
                                Cancel
                              </Button>
                              <Button
                                variant="destructive"
                                disabled={!disputeReason || resolving}
                                onClick={() => handleResolveDelivery('dispute')}
                              >
                                {resolving ? 'Submitting...' : 'Submit Dispute'}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button
                        className="bg-green-600 hover:bg-green-700 text-white"
                        disabled={resolving}
                        onClick={() => handleResolveDelivery('accept')}
                      >
                        {resolving ? 'Confirming...' : 'Accept Delivery'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle>Order Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="divide-y divide-gray-200">
                  {order.items.map((item, index) => (
                    <div key={index} className="py-4 first:pt-0 last:pb-0">
                      <div className="flex gap-4">
                        {item.image && (
                          <img
                            src={item.image}
                            alt={item.productName}
                            className="w-20 h-20 object-cover rounded-lg"
                          />
                        )}
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{item.productName}</h4>
                          <p className="text-sm text-gray-500 capitalize">{item.marketType} Market</p>
                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-sm text-gray-600">
                              Qty: {item.quantity} × {formatPrice(item.price)}
                            </span>
                            <span className="font-semibold text-gray-900">
                              {formatPrice(item.subtotal)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Delivery Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin size={20} />
                  Delivery Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                {order.deliveryOption === 'home' ? (
                  <div className="space-y-2">
                    <p className="font-semibold text-gray-900">Home Delivery</p>
                    {order.deliveryType && (
                      <p className="text-sm text-blue-600 font-medium">
                        {order.deliveryType === 'bulk' ? '📦 Bulk Delivery' : '🚲 Small Quantity Delivery'}
                      </p>
                    )}
                    {order.deliveryAddress && (
                      <>
                        <p className="text-gray-600">{order.deliveryAddress.street}</p>
                        <p className="text-gray-600">
                          {order.deliveryAddress.city}, {order.deliveryAddress.state}
                        </p>
                        {order.deliveryAddress.landmark && (
                          <p className="text-sm text-gray-500">Landmark: {order.deliveryAddress.landmark}</p>
                        )}
                        <p className="text-sm text-gray-500">Phone: {order.deliveryAddress.phone}</p>
                      </>
                    )}
                    {order.deliveryDate && (
                      <p className="text-sm text-gray-600 mt-3">
                        <strong>Delivery Date:</strong> {new Date(order.deliveryDate).toLocaleDateString()}
                      </p>
                    )}
                    
                    {/* Delivery Status */}
                    {order.deliveryStatus && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-sm font-semibold text-gray-700 mb-2">Delivery Status:</p>
                        <div className="flex items-center gap-2">
                          {order.deliveryStatus === 'in_store' && (
                            <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                              📦 In Store
                            </span>
                          )}
                          {order.deliveryStatus === 'on_the_way' && (
                            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                              🚚 On The Way
                            </span>
                          )}
                          {order.deliveryStatus === 'rider_delivered' && (
                            <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                              ⏳ Awaiting Confirmation
                            </span>
                          )}
                          {order.deliveryStatus === 'delivered' && (
                            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                              ✅ Delivered
                            </span>
                          )}
                          {order.deliveryStatus === 'disputed' && (
                            <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                              ❌ Disputed
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="font-semibold text-gray-900">Store Pickup</p>
                    <p className="text-gray-600">Gpower Frozen Foods</p>
                    {order.pickupDate && (
                      <p className="text-sm text-gray-600 mt-3">
                        <strong>Pickup Date:</strong> {new Date(order.pickupDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Rider Selection/Assignment Card - Only for home delivery */}
            {order.deliveryOption === 'home' && order.deliveryType && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bike size={20} />
                    Delivery Rider
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {order.assignedRider ? (
                    /* Show assigned rider */
                    <div className="space-y-4">
                      {/* Confirmation Code for Rider */}
                      {order.confirmationCode && (
                        <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-yellow-800 font-medium mb-1">
                                📋 Share this code with your rider
                              </p>
                              <p className="text-3xl font-bold text-yellow-900 tracking-wider">
                                {order.confirmationCode}
                              </p>
                            </div>
                            <button
                              onClick={() => copyToClipboard(order.confirmationCode, 'Confirmation code')}
                              className="p-3 hover:bg-yellow-100 rounded-lg transition-colors"
                              title="Copy confirmation code"
                            >
                              <Copy size={20} className="text-yellow-700" />
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Assigned Rider Info */}
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center gap-3">
                          {order.assignedRider!.image ? (
                          <img
                            src={order.assignedRider!.image}
                            alt={order.assignedRider!.name}
                            className="w-16 h-16 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-green-200 rounded-full flex items-center justify-center">
                            <User size={32} className="text-green-700" />
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="font-semibold text-green-900 mb-1">
                            ✅ Rider Assigned
                          </p>
                          <p className="font-medium text-gray-900">{order.assignedRider!.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <a
                              href={`tel:${order.assignedRider!.phone}`}
                              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                            >
                              <Phone size={14} />
                              {order.assignedRider!.phone}
                            </a>
                            <button
                              onClick={() => copyToClipboard(order.assignedRider!.phone, 'Phone number')}
                              className="p-1 hover:bg-green-100 rounded transition-colors"
                              title="Copy phone number"
                            >
                              <Copy size={14} className="text-gray-600" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    </div>
                  ) : (
                    /* Show available riders for selection */
                    <div>
                      <p className="text-sm text-gray-600 mb-4">
                        Select a rider to handle your delivery. You can contact them to negotiate delivery terms.
                      </p>

                      {loadingRiders ? (
                        <div className="text-center py-6">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                          <p className="text-sm text-gray-500">Loading available riders...</p>
                        </div>
                      ) : availableRiders.length === 0 ? (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                          <p className="text-yellow-800 font-medium">
                            No riders available at the moment
                          </p>
                          <p className="text-sm text-yellow-700 mt-1">
                            Please check back later or contact support
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {availableRiders.map((rider) => {
                            console.log('🔍 Rendering rider:', { id: rider._id, name: rider.name, fullRider: rider });
                            return (
                            <div
                              key={rider._id}
                              className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all"
                            >
                              <div className="flex items-start gap-3">
                                {rider.image ? (
                                  <img
                                    src={rider.image}
                                    alt={rider.name}
                                    className="w-12 h-12 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                                    <User size={24} className="text-gray-400" />
                                  </div>
                                )}

                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-gray-900">{rider.name}</h4>
                                  <div className="flex items-center gap-2 mt-1">
                                    <a
                                      href={`tel:${rider.phone}`}
                                      className="flex items-center gap-1 text-sm text-gray-600 hover:text-blue-600"
                                    >
                                      <Phone size={14} />
                                      {rider.phone}
                                    </a>
                                    <button
                                      onClick={(e) => {
                                        e.preventDefault();
                                        copyToClipboard(rider.phone, 'Phone number');
                                      }}
                                      className="p-1 hover:bg-gray-100 rounded transition-colors"
                                      title="Copy phone number"
                                    >
                                      <Copy size={14} className="text-gray-600" />
                                    </button>
                                  </div>
                                  <p className="text-xs text-gray-500 mt-1">
                                    {rider.riderType === 'bulk' ? '📦 Bulk Delivery' : '🚲 Small Quantity'}
                                  </p>
                                </div>

                                <Button
                                  size="sm"
                                  onClick={() => handleAssignRider(rider._id)}
                                  disabled={assigningRider !== null}
                                  className="flex-shrink-0"
                                >
                                  {assigningRider === rider._id ? 'Assigning...' : 'Assign Rider'}
                                </Button>
                              </div>
                            </div>
                          )})}
                        </div>
                      )}

                      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        <p className="text-xs text-blue-800">
                          💡 <strong>Tip:</strong> Call the rider to discuss delivery fee and timing before assigning them to your order.
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Order Summary */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-medium">{formatPrice(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Delivery Fee</span>
                  <span className="font-medium">
                    {order.deliveryFee === 0 ? (
                      <span className="text-green-600">Free</span>
                    ) : (
                      formatPrice(order.deliveryFee)
                    )}
                  </span>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-blue-600">{formatPrice(order.total)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard size={20} />
                  Payment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Method</span>
                  <span className="font-medium capitalize">{order.paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status</span>
                  <span className={`font-medium capitalize ${
                    order.paymentStatus === 'completed' ? 'text-green-600' :
                    order.paymentStatus === 'failed' ? 'text-red-600' :
                    order.paymentStatus === 'refunded' ? 'text-blue-600' :
                    'text-yellow-600'
                  }`}>
                    {order.paymentStatus}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
