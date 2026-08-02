'use client';

export const dynamic = 'error';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Search, Filter, Eye, Clock, CheckCircle, XCircle, Package, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

interface Order {
  _id: string;
  orderNumber: string;
  customerEmail: string;
  customerPhone: string;
  items: any[];
  total: number;
  status: string;
  paymentStatus: string;
  deliveryOption: string;
  deliveryStatus?: 'in_store' | 'on_the_way' | 'delivered';
  assignedRider?: {
    name: string;
    phone: string;
  };
  createdAt: string;
}

export default function AdminOrdersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status: authStatus } = useSession();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      router.push('/admin/login');
      return;
    }

    if (session?.user?.role !== 'sadmin' && session?.user?.role !== 'admin' && session?.user?.role !== 'support') {
      router.push('/');
      return;
    }

    fetchOrders();
  }, [authStatus, session, page, statusFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(searchQuery && { search: searchQuery }),
      });

      const response = await fetch(`/api/admin/orders?${params}`);
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchOrders();
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(price);
  };

  const getDeliveryStatusBadge = (status?: string) => {
    if (!status || status === 'in_store') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          📦 In Store
        </span>
      );
    }
    
    if (status === 'on_the_way') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          🚚 On The Way
        </span>
      );
    }
    
    if (status === 'delivered') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          ✅ Delivered
        </span>
      );
    }
    
    return null;
  };

  if (authStatus === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Orders Management</h1>
              <p className="text-gray-600 mt-1">Manage and track all customer orders</p>
            </div>
            <Link href="/admin/dashboard">
              <Button variant="outline">Back to Dashboard</Button>
            </Link>
          </div>

          {/* Filters and Search */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Search */}
                <form onSubmit={handleSearch} className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <Input
                      type="text"
                      placeholder="Search by order #, email, or phone..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </form>

                {/* Status Filter */}
                <div className="flex items-center gap-2">
                  <Filter size={20} className="text-gray-400" />
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setPage(1);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Orders</option>
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <Button onClick={fetchOrders} className="btn-modern">
                  Apply Filters
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Orders Table */}
        <Card>
          <CardHeader>
            <CardTitle>Orders ({orders.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <div className="text-center py-12">
                <Package size={64} className="text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No orders found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b">
                    <tr className="text-left">
                      <th className="pb-3 text-sm font-semibold text-gray-600">Order #</th>
                      <th className="pb-3 text-sm font-semibold text-gray-600">Customer</th>
                      <th className="pb-3 text-sm font-semibold text-gray-600">Items</th>
                      <th className="pb-3 text-sm font-semibold text-gray-600">Total</th>
                      <th className="pb-3 text-sm font-semibold text-gray-600">Delivery Status</th>
                      <th className="pb-3 text-sm font-semibold text-gray-600">Payment</th>
                      <th className="pb-3 text-sm font-semibold text-gray-600">Delivery</th>
                      <th className="pb-3 text-sm font-semibold text-gray-600">Rider</th>
                      <th className="pb-3 text-sm font-semibold text-gray-600">Date</th>
                      <th className="pb-3 text-sm font-semibold text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {orders.map((order) => (
                      <tr key={order._id} className="hover:bg-gray-50">
                        <td className="py-4">
                          <span className="font-medium text-gray-900">#{order.orderNumber}</span>
                        </td>
                        <td className="py-4">
                          <div>
                            <p className="text-sm text-gray-900">{order.customerEmail}</p>
                            <p className="text-xs text-gray-500">{order.customerPhone}</p>
                          </div>
                        </td>
                        <td className="py-4 text-gray-600">{order.items.length} items</td>
                        <td className="py-4 font-semibold text-gray-900">
                          {formatPrice(order.total)}
                        </td>
                        <td className="py-4">
                          {order.deliveryOption === 'home' ? (
                            getDeliveryStatusBadge(order.deliveryStatus)
                          ) : (
                            <span className="text-xs text-gray-500">Store Pickup</span>
                          )}
                        </td>
                        <td className="py-4">
                          <span
                            className={`text-xs px-2 py-1 rounded ${
                              order.paymentStatus === 'completed' || order.paymentStatus === 'paid'
                                ? 'bg-green-100 text-green-800'
                                : order.paymentStatus === 'failed'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {order.paymentStatus}
                          </span>
                        </td>
                        <td className="py-4 text-sm text-gray-600 capitalize">
                          {order.deliveryOption}
                        </td>
                        <td className="py-4 text-sm text-gray-600">
                          {order.assignedRider ? (
                            <span className="text-green-600 font-medium">✓ Assigned</span>
                          ) : (
                            <span className="text-gray-400">Not assigned</span>
                          )}
                        </td>
                        <td className="py-4 text-sm text-gray-600">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-4">
                          <Link href={`/admin/orders/${order._id}`}>
                            <Button variant="outline" size="sm">
                              <Eye size={16} className="mr-1" />
                              View
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-6 border-t">
                <p className="text-sm text-gray-600">
                  Page {page} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setPage(page + 1)}
                    disabled={page === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

