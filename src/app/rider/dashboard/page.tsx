'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Bike, Package, CheckCircle, MapPin, Phone, User, LogOut, Loader2, Truck, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { signOut } from 'next-auth/react';
import Link from 'next/link';

interface Order {
  _id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: {
    street: string;
    city: string;
    state: string;
    landmark?: string;
  };
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    marketType: string;
    price: number;
    subtotal: number;
  }>;
  total: number;
  deliveryStatus: string;
  deliveryType: string;
  createdAt: string;
}

export default function RiderDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Dialog state
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [enteredCode, setEnteredCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/rider/login');
      return;
    }

    if (status === 'authenticated' && session?.user?.role !== 'rider') {
      toast.error('Access denied');
      router.push('/');
      return;
    }

    if (status === 'authenticated') {
      fetchMyOrders();
    }
  }, [status, session]);

  const fetchMyOrders = async () => {
    try {
      const response = await fetch('/api/rider/my-orders');
      const data = await response.json();

      if (response.ok) {
        setOrders(data.orders || []);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const openConfirmDialog = (order: Order) => {
    setSelectedOrder(order);
    setEnteredCode('');
    setShowConfirmDialog(true);
  };

  const closeConfirmDialog = () => {
    setShowConfirmDialog(false);
    setSelectedOrder(null);
    setEnteredCode('');
    setSubmitting(false);
  };

  const handleMarkDelivered = async () => {
    if (!selectedOrder || !enteredCode) {
      toast.error('Please enter the confirmation code');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`/api/rider/mark-delivered`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          orderId: selectedOrder._id, 
          confirmationCode: enteredCode 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to mark as delivered');
      }

      toast.success('Order marked as delivered!');
      closeConfirmDialog();
      fetchMyOrders();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkPickedUp = async (orderId: string) => {
    try {
      const response = await fetch(`/api/rider/orders/${orderId}/pickup`, {
        method: 'POST',
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to mark order as picked up');
      }

      toast.success('Order marked as picked up! You are on the way to customer.', {
        icon: '🚚',
      });
      fetchMyOrders();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(price);
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    );
  }

  const activeOrders = orders.filter(o => o.deliveryStatus !== 'delivered');
  const completedOrders = orders.filter(o => o.deliveryStatus === 'delivered');

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Rider Dashboard</h1>
              <p className="text-gray-600 mt-1">Welcome back, {session?.user?.name}!</p>
            </div>
            <div className="flex gap-3">
              <Link href="/rider/profile">
                <Button variant="outline">
                  <User size={16} className="mr-2" />
                  Profile
                </Button>
              </Link>
              <Link href="/rider/verify">
                <Button variant="outline">
                  <Package size={16} className="mr-2" />
                  Verify Order
                </Button>
              </Link>
              <Button variant="outline" onClick={() => signOut({ callbackUrl: '/rider/login' })}>
                <LogOut size={16} className="mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Deliveries</p>
                  <p className="text-3xl font-bold text-blue-600">{activeOrders.length}</p>
                </div>
                <Bike size={40} className="text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Completed Today</p>
                  <p className="text-3xl font-bold text-green-600">{completedOrders.length}</p>
                </div>
                <CheckCircle size={40} className="text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Orders</p>
                  <p className="text-3xl font-bold text-gray-900">{orders.length}</p>
                </div>
                <Package size={40} className="text-gray-900" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Orders */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Active Deliveries</CardTitle>
          </CardHeader>
          <CardContent>
            {activeOrders.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No active deliveries</p>
            ) : (
              <div className="space-y-4">
                {activeOrders.map((order) => (
                  <div key={order._id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">Order #{order.orderNumber}</h3>
                        <p className="text-sm text-gray-600">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        order.deliveryStatus === 'on_the_way' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {order.deliveryStatus.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <User size={16} className="text-gray-400" />
                        <span>{order.customerName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Phone size={16} className="text-gray-400" />
                        <a href={`tel:${order.customerPhone}`} className="text-blue-600 hover:underline">
                          {order.customerPhone}
                        </a>
                      </div>
                      <div className="flex items-start gap-2 text-sm">
                        <MapPin size={16} className="text-gray-400 mt-0.5" />
                        <span>{order.deliveryAddress.street}, {order.deliveryAddress.city}</span>
                      </div>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded p-3 mb-4">
                      <p className="text-xs font-medium text-amber-800 mb-1">📝 Delivery Instructions:</p>
                      <p className="text-sm text-amber-900">
                        Ask the customer for their confirmation code before marking as delivered.
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t gap-2 flex-wrap">
                      <span className="font-semibold">{formatPrice(order.total)}</span>
                      <div className="flex items-center gap-2">
                        <Link href={`/rider/orders/${order._id}`}>
                          <Button size="sm" variant="outline">
                            <Eye size={14} className="mr-1.5" />
                            View Details
                          </Button>
                        </Link>
                        {order.deliveryStatus === 'on_the_way' ? (
                          <Button
                            size="sm"
                            onClick={() => openConfirmDialog(order)}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            <CheckCircle size={14} className="mr-1.5" />
                            Mark as Delivered
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleMarkPickedUp(order._id)}
                            className="bg-amber-600 hover:bg-amber-700 text-white"
                          >
                            <Truck size={14} className="mr-1.5" />
                            Mark as Picked Up
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Completed Orders */}
        {completedOrders.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Completed Deliveries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {completedOrders.map((order) => (
                  <div key={order._id} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">Order #{order.orderNumber}</h3>
                        <p className="text-sm text-gray-600">{order.customerName}</p>
                      </div>
                      <div className="text-right">
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                          Delivered
                        </span>
                        <p className="text-sm text-gray-600 mt-1">{formatPrice(order.total)}</p>
                        <Link href={`/rider/orders/${order._id}`} className="inline-block mt-2">
                          <Button size="sm" variant="ghost" className="h-7 text-xs text-blue-600 hover:text-blue-800 p-0">
                            View Details →
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={closeConfirmDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Confirm Delivery</DialogTitle>
            <DialogDescription>
              Verify the order items with the customer, then ask for their confirmation code.
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4 py-4">
              {/* Order Summary */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-blue-900">Order Number:</span>
                  <span className="font-bold text-blue-900">{selectedOrder.orderNumber}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-blue-900">Customer:</span>
                  <span className="font-semibold text-blue-900">{selectedOrder.customerName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-blue-900">Phone:</span>
                  <a 
                    href={`tel:${selectedOrder.customerPhone}`}
                    className="font-semibold text-blue-600 hover:underline"
                  >
                    {selectedOrder.customerPhone}
                  </a>
                </div>
              </div>

              {/* Order Items - THIS IS WHAT THE RIDER NEEDS! */}
              <div className="border rounded-lg">
                <div className="bg-gray-50 px-4 py-3 border-b">
                  <h4 className="font-semibold text-gray-900">Order Items ({selectedOrder.items.length})</h4>
                  <p className="text-xs text-gray-600 mt-1">Verify these items with the customer before confirming delivery</p>
                </div>
                <div className="divide-y">
                  {selectedOrder.items.map((item, index) => (
                    <div key={index} className="p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 text-lg">
                            {item.productName && item.productName !== 'Product' 
                              ? item.productName 
                              : `Product ID: ${item.productId}`}
                          </p>
                          <div className="flex gap-4 mt-2 text-sm text-gray-600">
                            <span>Qty: <strong className="text-gray-900">{item.quantity}</strong></span>
                            <span>•</span>
                            <span>Type: <strong className="text-gray-900 capitalize">{item.marketType}</strong></span>
                            <span>•</span>
                            <span>Price: <strong className="text-gray-900">{formatPrice(item.price)}</strong></span>
                          </div>
                          <div className="mt-1 text-sm font-medium text-gray-900">
                            Subtotal: {formatPrice(item.subtotal)}
                          </div>
                        </div>
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-600 flex-shrink-0">
                          <span className="text-lg">✓</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery Address */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <MapPin size={16} />
                  Delivery Address
                </h4>
                <p className="text-sm text-gray-700">
                  {selectedOrder.deliveryAddress.street}<br />
                  {selectedOrder.deliveryAddress.city}, {selectedOrder.deliveryAddress.state}
                  {selectedOrder.deliveryAddress.landmark && (
                    <>
                      <br />
                      <span className="text-gray-600">Landmark: {selectedOrder.deliveryAddress.landmark}</span>
                    </>
                  )}
                </p>
              </div>

              {/* Total Amount */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium text-green-900">Total Amount:</span>
                  <span className="text-2xl font-bold text-green-900">{formatPrice(selectedOrder.total)}</span>
                </div>
              </div>

              {/* Confirmation Code Input */}
              <div className="border-t pt-4">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3">
                  <p className="text-sm font-medium text-amber-900">
                    ⚠️ After verifying all items, ask the customer for their 6-digit confirmation code
                  </p>
                </div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter Confirmation Code
                </label>
                <Input
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={enteredCode}
                  onChange={(e) => setEnteredCode(e.target.value.toUpperCase())}
                  className="text-center text-xl font-mono tracking-widest"
                  maxLength={6}
                  autoFocus
                />
              </div>
            </div>
          )}

          <div className="flex gap-2 justify-end mt-4">
            <Button variant="outline" onClick={closeConfirmDialog} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleMarkDelivered} disabled={submitting || !enteredCode}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Confirming...
                </>
              ) : (
                'Confirm Delivery'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
