'use client';

import { useState, useEffect, use, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowLeft, Package, MapPin, User, Phone, Truck, CheckCircle, Loader2, Copy } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useConfirm } from '@/lib/hooks/useConfirm';
import toast from 'react-hot-toast';

interface Order {
  _id: string;
  orderNumber: string;
  confirmationCode: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: any[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: string;
  deliveryOption: 'home' | 'pickup';
  deliveryType?: 'bulk' | 'small';
  deliveryStatus?: 'in_store' | 'on_the_way' | 'rider_delivered' | 'sadmin_delivered' | 'delivered' | 'disputed';
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
  paymentStatus: string;
  createdAt: string;
}

export default function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showCodeDialog, setShowCodeDialog] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const { confirm, ConfirmDialog: HookConfirmDialog } = useConfirm();

  const { id } = use(params);

  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      router.push('/admin/login');
      return;
    }

    if (session?.user?.role !== 'sadmin' && session?.user?.role !== 'admin') {
      router.push('/');
      return;
    }

    fetchOrder();
  }, [authStatus, session, id, router, fetchOrder]);

  const fetchOrder = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/orders/${id}`);
      const data = await response.json();

      if (data.success) {
        setOrder(data.order);
      } else {
        toast.error('Order not found');
        router.push('/admin/orders');
      }
    } catch (error) {
      console.error('Failed to fetch order:', error);
      toast.error('Failed to load order');
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  const updateDeliveryStatus = async (newStatus: 'in_store' | 'on_the_way' | 'sadmin_delivered') => {
    if (!order) return;

    // If marking as delivered, require confirmation code verification
    if (newStatus === 'sadmin_delivered') {
      setShowCodeDialog(true);
      return;
    }

    // For other statuses, just confirm
    const confirmed = await confirm({
      title: 'Update Order Status',
      message: `Are you sure you want to update status to "${newStatus.replace('_', ' ')}"?`,
    });
    
    if (!confirmed) return;

    await performStatusUpdate(newStatus);
  };

  const handleDeliveredWithCode = async () => {
    if (!order) return;

    // Validate code
    if (verificationCode !== order.confirmationCode) {
      toast.error('Invalid confirmation code. Please check and try again.');
      return;
    }

    setShowCodeDialog(false);
    setVerificationCode('');
    await performStatusUpdate('sadmin_delivered');
  };

  const performStatusUpdate = async (newStatus: 'in_store' | 'on_the_way' | 'sadmin_delivered') => {
    if (!order) return;

    setUpdating(true);
    try {
      const response = await fetch(`/api/orders/${order._id}/delivery-status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deliveryStatus: newStatus }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update status');
      }

      toast.success('Delivery status updated successfully');
      fetchOrder(); // Refresh order
    } catch (error: any) {
      toast.error(error.message || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(price);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success(`${label} copied to clipboard!`);
    }).catch(() => {
      toast.error('Failed to copy');
    });
  };

  if (authStatus === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package size={64} className="text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Order not found</p>
          <Link href="/admin/orders">
            <Button className="mt-4">Back to Orders</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Link href="/admin/orders" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6">
          <ArrowLeft size={20} className="mr-2" />
          Back to Orders
        </Link>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Order #{order.orderNumber}</h1>
          <p className="text-gray-600 mt-1">
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
            <div className="mt-4 inline-flex items-center gap-3 bg-yellow-50 border-2 border-yellow-400 rounded-lg px-4 py-3">
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-xs text-yellow-800 font-medium mb-0.5">Confirmation Code</p>
                  <p className="text-2xl font-bold text-yellow-900 tracking-wider font-mono">{order.confirmationCode}</p>
                </div>
                <button
                  onClick={() => copyToClipboard(order.confirmationCode, 'Confirmation code')}
                  className="p-2 hover:bg-yellow-100 rounded transition-colors"
                  title="Copy confirmation code"
                >
                  <Copy size={20} className="text-yellow-700" />
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle>Order Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="divide-y">
                  {order.items.map((item: any, index: number) => (
                    <div key={index} className="py-4 first:pt-0 last:pb-0 flex gap-4">
                      {item.image && (
                        <Image
                          src={item.image}
                          alt={item.productName}
                          width={80}
                          height={80}
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
                          <span className="font-semibold">{formatPrice(item.subtotal)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Customer & Delivery Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Customer Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User size={20} />
                    Customer Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="font-medium">{order.customerName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{order.customerEmail}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium">{order.customerPhone}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Delivery Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin size={20} />
                    Delivery Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {order.deliveryOption === 'home' ? (
                    <>
                      <div>
                        <p className="text-sm text-gray-500">Type</p>
                        <p className="font-medium">
                          Home Delivery {order.deliveryType && `(${order.deliveryType === 'bulk' ? 'Bulk' : 'Small Quantity'})`}
                        </p>
                      </div>
                      {order.deliveryAddress && (
                        <>
                          <div>
                            <p className="text-sm text-gray-500">Address</p>
                            <p className="font-medium">{order.deliveryAddress.street}</p>
                            <p className="text-sm">{order.deliveryAddress.city}, {order.deliveryAddress.state}</p>
                          </div>
                          {order.deliveryAddress.landmark && (
                            <p className="text-sm text-gray-500">Landmark: {order.deliveryAddress.landmark}</p>
                          )}
                        </>
                      )}
                    </>
                  ) : (
                    <div>
                      <p className="text-sm text-gray-500">Type</p>
                      <p className="font-medium">Store Pickup</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Assigned Rider */}
            {order.assignedRider && (
              <Card className="border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-900">
                    <Truck size={20} />
                    Assigned Delivery Partner
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    {order.assignedRider!.image ? (
                      <Image
                        src={order.assignedRider!.image}
                        alt={order.assignedRider!.name}
                        width={64}
                        height={64}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-green-200 rounded-full flex items-center justify-center">
                        <User size={32} className="text-green-700" />
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-gray-900">{order.assignedRider!.name}</p>
                      <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                        <Phone size={14} />
                        <a href={`tel:${order.assignedRider!.phone}`} className="hover:text-blue-600">
                          {order.assignedRider!.phone}
                        </a>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Order Summary */}
            <Card>
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
                <div className="border-t pt-3">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-blue-600">{formatPrice(order.total)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Status */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Status</CardTitle>
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
                    'text-yellow-600'
                  }`}>
                    {order.paymentStatus}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Delivery Status Management */}
            {order.deliveryOption === 'home' && (
              <Card>
                <CardHeader>
                  <CardTitle>Update Delivery Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Rider Verification Link */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                    <p className="text-xs text-blue-800 font-medium mb-2">🚴 Rider Verification</p>
                    <Link href="/rider/verify" target="_blank">
                      <Button variant="outline" size="sm" className="w-full text-blue-600 border-blue-300">
                        Open Rider Verification Page
                      </Button>
                    </Link>
                  </div>

                  <div className="space-y-2">
                    <Button
                      onClick={() => updateDeliveryStatus('in_store')}
                      disabled={updating || order.deliveryStatus === 'in_store'}
                      className={`w-full ${order.deliveryStatus === 'in_store' ? 'bg-yellow-500' : ''}`}
                      variant={order.deliveryStatus === 'in_store' ? 'default' : 'outline'}
                    >
                      {order.deliveryStatus === 'in_store' && <CheckCircle size={16} className="mr-2" />}
                      📦 In Store
                    </Button>
                    
                    <Button
                      onClick={() => updateDeliveryStatus('on_the_way')}
                      disabled={updating || order.deliveryStatus === 'on_the_way'}
                      className={`w-full ${order.deliveryStatus === 'on_the_way' ? 'bg-blue-500' : ''}`}
                      variant={order.deliveryStatus === 'on_the_way' ? 'default' : 'outline'}
                    >
                      {order.deliveryStatus === 'on_the_way' && <CheckCircle size={16} className="mr-2" />}
                      🚚 On The Way
                    </Button>
                    
                    <Button
                      onClick={() => updateDeliveryStatus('sadmin_delivered')}
                      disabled={updating || order.deliveryStatus === 'sadmin_delivered' || order.deliveryStatus === 'delivered'}
                      className={`w-full ${order.deliveryStatus === 'sadmin_delivered' ? 'bg-green-500' : ''}`}
                      variant={order.deliveryStatus === 'sadmin_delivered' ? 'default' : 'outline'}
                    >
                      {order.deliveryStatus === 'sadmin_delivered' && <CheckCircle size={16} className="mr-2" />}
                      ✅ Mark as Delivered (Admin)
                    </Button>
                  </div>

                  <p className="text-xs text-gray-500 mt-3">
                    Current Status: <strong className="capitalize">
                      {order.deliveryStatus === 'sadmin_delivered' ? 'Admin Marked Delivered (Awaiting Rider)' :
                       order.deliveryStatus === 'rider_delivered' ? 'Rider Marked Delivered (Awaiting Customer/Admin)' :
                       order.deliveryStatus?.replace('_', ' ') || 'In Store'}
                    </strong>
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Confirmation Code Dialog for Delivered Status */}
        <ConfirmDialog
          isOpen={showCodeDialog}
          onClose={() => {
            setShowCodeDialog(false);
            setVerificationCode('');
          }}
          onConfirm={handleDeliveredWithCode}
          title="Verify Delivery"
          message="Please enter the customer's 6-digit confirmation code to mark this order as delivered."
          confirmText="Mark as Delivered"
          cancelText="Cancel"
        >
          <div className="mt-4 space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Confirmation Code
            </label>
            <Input
              type="text"
              placeholder="Enter 6-digit code"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              maxLength={6}
              className="text-center text-2xl font-bold tracking-widest font-mono"
              autoFocus
            />
            <p className="text-xs text-gray-500 text-center">
              Expected code: <span className="font-mono font-semibold">{order?.confirmationCode || '------'}</span>
            </p>
          </div>
        </ConfirmDialog>

        <HookConfirmDialog />
      </div>
    </div>
  );
}
