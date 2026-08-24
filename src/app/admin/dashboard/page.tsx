'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Package,
  ShoppingCart,
  Users,
  Wallet,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  DollarSign,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

interface DashboardStats {
  orders: {
    total: number;
    pending: number;
    processing: number;
    completed: number;
    cancelled: number;
    todayCount: number;
    todayRevenue: number;
  };
  users: {
    total: number;
    verified: number;
    unverified: number;
    newToday: number;
  };
  products: {
    total: number;
    inStock: number;
    lowStock: number;
    outOfStock: number;
  };
  revenue: {
    total: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
  wallet: {
    totalBalance: number;
    totalCredits: number;
    totalDebits: number;
    todayTransactions: number;
  };
}

interface RecentOrder {
  _id: string;
  orderNumber: string;
  customerEmail: string;
  total: number;
  status: string;
  createdAt: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
      return;
    }

    if (session?.user?.role !== 'sadmin' && session?.user?.role !== 'admin' && session?.user?.role !== 'support') {
      router.push('/');
      return;
    }

    fetchDashboardData();
  }, [status, session]);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, ordersRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/orders?limit=5&page=1'),
      ]);

      const [statsData, ordersData] = await Promise.all([
        statsRes.json(),
        ordersRes.json(),
      ]);

      if (statsData.success) {
        setStats(statsData.stats);
      }

      if (ordersData.success) {
        setRecentOrders(ordersData.orders);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
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

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Failed to load dashboard data</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back, {session?.user?.name}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Revenue Card */}
          <Card className="card-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Revenue
              </CardTitle>
              <DollarSign className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {formatPrice(stats.revenue.total)}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Today: {formatPrice(stats.revenue.today)}
              </p>
              <div className="flex items-center mt-2 text-sm text-green-600">
                <TrendingUp size={16} className="mr-1" />
                <span>This month: {formatPrice(stats.revenue.thisMonth)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Orders Card */}
          <Card className="card-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Orders
              </CardTitle>
              <ShoppingCart className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {stats.orders.total}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Pending: {stats.orders.pending}
              </p>
              <div className="flex items-center mt-2 text-sm text-blue-600">
                <Clock size={16} className="mr-1" />
                <span>Today: {stats.orders.todayCount} orders</span>
              </div>
            </CardContent>
          </Card>

          {/* Users Card */}
          <Card className="card-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Users
              </CardTitle>
              <Users className="h-5 w-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {stats.users.total}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Verified: {stats.users.verified}
              </p>
              <div className="flex items-center mt-2 text-sm text-purple-600">
                <TrendingUp size={16} className="mr-1" />
                <span>New today: {stats.users.newToday}</span>
              </div>
            </CardContent>
          </Card>

          {/* Products Card */}
          <Card className="card-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Products
              </CardTitle>
              <Package className="h-5 w-5 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {stats.products.total}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                In Stock: {stats.products.inStock}
              </p>
              {stats.products.lowStock > 0 && (
                <div className="flex items-center mt-2 text-sm text-orange-600">
                  <TrendingDown size={16} className="mr-1" />
                  <span>Low stock: {stats.products.lowStock}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Order Status Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Order Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-yellow-600" />
                  <span className="text-sm text-gray-600">Pending</span>
                </div>
                <span className="font-semibold text-gray-900">
                  {stats.orders.pending}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Package size={16} className="text-blue-600" />
                  <span className="text-sm text-gray-600">Processing</span>
                </div>
                <span className="font-semibold text-gray-900">
                  {stats.orders.processing}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-600" />
                  <span className="text-sm text-gray-600">Completed</span>
                </div>
                <span className="font-semibold text-gray-900">
                  {stats.orders.completed}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <XCircle size={16} className="text-red-600" />
                  <span className="text-sm text-gray-600">Cancelled</span>
                </div>
                <span className="font-semibold text-gray-900">
                  {stats.orders.cancelled}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Wallet Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Wallet Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Total Balance</p>
                <p className="text-xl font-bold text-gray-900">
                  {formatPrice(stats.wallet.totalBalance)}
                </p>
              </div>
              <div className="border-t pt-3">
                <p className="text-sm text-gray-600 mb-2">Transactions</p>
                <div className="space-y-1">
                  <p className="text-xs text-green-600">
                    Credits: {formatPrice(stats.wallet.totalCredits)}
                  </p>
                  <p className="text-xs text-red-600">
                    Debits: {formatPrice(stats.wallet.totalDebits)}
                  </p>
                  <p className="text-xs text-gray-600">
                    Today: {stats.wallet.todayTransactions} transactions
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link
                href="/admin/products/new"
                className="block w-full p-2 text-sm text-center bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              >
                Add New Product
              </Link>
              <Link
                href="/admin/orders"
                className="block w-full p-2 text-sm text-center bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition"
              >
                View All Orders
              </Link>
              <Link
                href="/admin/users"
                className="block w-full p-2 text-sm text-center bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition"
              >
                Manage Users
              </Link>

            </CardContent>
          </Card>
        </div>

        {/* Recent Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Orders</CardTitle>
            <Link
              href="/admin/orders"
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              View All
            </Link>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No recent orders</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b">
                    <tr className="text-left">
                      <th className="pb-3 text-sm font-medium text-gray-600">Order #</th>
                      <th className="pb-3 text-sm font-medium text-gray-600">Customer</th>
                      <th className="pb-3 text-sm font-medium text-gray-600">Total</th>
                      <th className="pb-3 text-sm font-medium text-gray-600">Status</th>
                      <th className="pb-3 text-sm font-medium text-gray-600">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {recentOrders.map((order) => (
                      <tr key={order._id} className="hover:bg-gray-50">
                        <td className="py-3">
                          <Link
                            href={`/admin/orders/${order._id}`}
                            className="text-blue-600 hover:underline font-medium"
                          >
                            #{order.orderNumber}
                          </Link>
                        </td>
                        <td className="py-3 text-gray-900">{order.customerEmail}</td>
                        <td className="py-3 font-semibold text-gray-900">
                          {formatPrice(order.total)}
                        </td>
                        <td className="py-3">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                              order.status
                            )}`}
                          >
                            {order.status}
                          </span>
                        </td>
                        <td className="py-3 text-gray-600 text-sm">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
