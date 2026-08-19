'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Package, Eye, X, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCartStore } from '@/lib/store/cartStore';
import toast from 'react-hot-toast';

/**
 * Customer Orders History Page
 */

interface Order {
  _id: string;
  orderNumber: string;
  items: any[];
  total: number;
  status: string;
  deliveryStatus?: 'in_store' | 'on_the_way' | 'delivered';
  paymentStatus: string;
  deliveryOption: string;
  createdAt: string;
}

export default function OrdersPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [reorderingId, setReorderingId] = useState<string | null>(null);
  const addItem = useCartStore((state) => state.addItem);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/orders');
    } else if (status === 'authenticated' && (session?.user?.role as string) === 'rider') {
      router.push('/rider/dashboard');
    }
  }, [status, router, session]);

  useEffect(() => {
    if (session) {
      fetchOrders();
    }
  }, [session, page]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/orders?page=${page}&limit=10`);
      const data = await response.json();

      if (data.success) {
        setOrders(data.orders);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(price);
  };

  const getStatusColor = (status: string, deliveryStatus?: string) => {
    // Prioritize deliveryStatus if available
    const displayStatus = deliveryStatus || status;
    
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      in_store: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      on_the_way: 'bg-blue-100 text-blue-800',
      out_for_delivery: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[displayStatus] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string, deliveryStatus?: string) => {
    // Prioritize deliveryStatus if available
    if (deliveryStatus) {
      const labels: Record<string, string> = {
        in_store: 'In Store',
        on_the_way: 'On The Way',
        delivered: 'Delivered',
      };
      return labels[deliveryStatus] || deliveryStatus;
    }
    
    return status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  const handleReorder = (order: Order) => {
    setReorderingId(order._id);
    
    try {
      let itemsAdded = 0;
      
      // Add all items from the order to cart
      order.items.forEach((item: any) => {
        addItem({
          productId: item.productId,
          name: item.productName,
          price: item.price,
          quantity: item.quantity,
          marketType: item.marketType,
          image: item.image,
          maxQuantity: 999,
          inStock: true,
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
      setReorderingId(null);
    }
  };

  if ((session?.user?.role as string) === 'rider') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">Riders cannot view customer order history.</p>
          <Link href="/rider/dashboard">
            <Button>Go to Rider Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Orders</h1>
          <p className="text-gray-600">Track and manage your orders</p>
        </div>

        {orders.length === 0 ? (
          <Card className="text-center py-16">
            <CardContent>
              <Package size={80} className="text-gray-300 mx-auto mb-6" />
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                No orders yet
              </h2>
              <p className="text-gray-600 mb-8">
                Start shopping to create your first order!
              </p>
              <Link href="/products">
                <Button className="btn-modern">Browse Products</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order._id} className="card-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        Order #{order.orderNumber}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString('en-NG', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status, order.deliveryStatus)}`}>
                        {getStatusLabel(order.status, order.deliveryStatus)}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-4 mb-4">
                    <p className="text-sm text-gray-600 mb-2">
                      {order.items.length} {order.items.length === 1 ? 'item' : 'items'} • {' '}
                      {order.deliveryOption === 'home' ? 'Home Delivery' : 'Store Pickup'}
                    </p>
                    <p className="text-xl font-bold text-blue-600">
                      {formatPrice(order.total)}
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <Link href={`/orders/${order._id}`} className="flex-1">
                      <Button variant="outline" className="w-full">
                        <Eye size={16} className="mr-2" />
                        View Details
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      onClick={() => handleReorder(order)}
                      disabled={reorderingId === order._id}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    >
                      <RotateCcw size={16} className="mr-2" />
                      {reorderingId === order._id ? 'Adding...' : 'Reorder'}
                    </Button>
                    {order.status === 'pending' && (
                      <Button
                        variant="outline"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={async () => {
                          if (confirm('Are you sure you want to cancel this order?')) {
                            try {
                              const response = await fetch(`/api/orders/${order._id}`, {
                                method: 'DELETE',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ reason: 'Customer cancelled' }),
                              });
                              if (response.ok) {
                                toast.success('Order cancelled');
                                fetchOrders();
                              }
                            } catch (error) {
                              toast.error('Failed to cancel order');
                            }
                          }
                        }}
                      >
                        <X size={16} className="mr-2" />
                        Cancel
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                <Button
                  variant="outline"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <span className="flex items-center px-4">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
