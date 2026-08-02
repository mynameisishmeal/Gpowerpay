'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  User, Wallet, Package, MapPin, 
  CreditCard, TrendingUp, Clock, CheckCircle 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FundWalletButton } from '@/components/wallet/FundWalletButton';

/**
 * User Dashboard - Overview of profile, wallet, orders, and addresses
 */

interface DashboardData {
  user: {
    name: string;
    email: string;
    phone?: string;
    profilePicture?: string;
  };
  wallet: {
    balance: number;
    totalCredits: number;
    totalDebits: number;
  };
  orders: {
    total: number;
    pending: number;
    completed: number;
    cancelled: number;
  };
  recentTransactions: any[];
  recentOrders: any[];
  savedAddresses: any[];
}

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/dashboard');
    }
    // Redirect admin users to admin dashboard
    if (status === 'authenticated' && session?.user?.role && ['sadmin', 'admin', 'worker'].includes(session.user.role)) {
      router.push('/admin/dashboard');
    }
  }, [status, session, router]);

  useEffect(() => {
    if (session) {
      fetchDashboardData();
    }
  }, [session]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [walletRes, ordersRes, transactionsRes, profileRes] = await Promise.all([
        fetch('/api/wallet'),
        fetch('/api/orders?page=1&limit=5'),
        fetch('/api/wallet/transactions?page=1&limit=5'),
        fetch('/api/user/profile'),
      ]);

      const [walletData, ordersData, transactionsData, profileData] = await Promise.all([
        walletRes.json(),
        ordersRes.json(),
        transactionsRes.json(),
        profileRes.json(),
      ]);

      // Calculate order statistics
      const orderStats = {
        total: ordersData.pagination?.total || 0,
        pending: 0,
        completed: 0,
        cancelled: 0,
      };

      ordersData.orders?.forEach((order: any) => {
        if (order.status === 'pending' || order.status === 'processing') {
          orderStats.pending++;
        } else if (order.status === 'delivered') {
          orderStats.completed++;
        } else if (order.status === 'cancelled') {
          orderStats.cancelled++;
        }
      });

      setData({
        user: {
          name: session?.user?.name || '',
          email: session?.user?.email || '',
          phone: profileData.user?.phone,
          profilePicture: profileData.user?.profilePicture,
        },
        wallet: {
          balance: walletData.wallet?.balance || 0,
          totalCredits: walletData.wallet?.totalCredits || 0,
          totalDebits: walletData.wallet?.totalDebits || 0,
        },
        orders: orderStats,
        recentTransactions: transactionsData.transactions || [],
        recentOrders: ordersData.orders || [],
        savedAddresses: profileData.user?.addresses || [],
      });
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

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-NG', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="animate-pulse space-y-6">
            <div className="h-10 bg-gray-200 rounded w-1/4" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg" />
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[1, 2].map((i) => (
                <div key={i} className="h-64 bg-gray-200 rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {data.user.name}!
          </h1>
          <p className="text-gray-600">Here's what's happening with your account</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Wallet Balance */}
          <Card className="card-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Wallet size={24} className="text-green-600" />
                </div>
                <FundWalletButton onSuccess={fetchDashboardData} />
              </div>
              <p className="text-sm text-gray-600 mb-1">Wallet Balance</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatPrice(data.wallet.balance)}
              </p>
              <Link href="/wallet" className="text-sm text-blue-600 hover:underline mt-2 inline-block">
                View transactions →
              </Link>
            </CardContent>
          </Card>

          {/* Total Orders */}
          <Card className="card-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Package size={24} className="text-blue-600" />
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-1">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{data.orders.total}</p>
              <div className="flex gap-4 mt-2 text-xs">
                <span className="text-yellow-600">{data.orders.pending} pending</span>
                <span className="text-green-600">{data.orders.completed} completed</span>
              </div>
            </CardContent>
          </Card>

          {/* Saved Addresses */}
          <Card className="card-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <MapPin size={24} className="text-purple-600" />
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-1">Saved Addresses</p>
              <p className="text-2xl font-bold text-gray-900">
                {data.savedAddresses.length}
              </p>
              <Link href="/profile" className="text-sm text-blue-600 hover:underline mt-2 inline-block">
                Manage addresses →
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Recent Orders */}
          <Card className="card-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold">Recent Orders</CardTitle>
                <Link href="/orders">
                  <Button variant="outline" size="sm">View All</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {data.recentOrders.length === 0 ? (
                <div className="text-center py-8">
                  <Package size={48} className="text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No orders yet</p>
                  <Link href="/products">
                    <Button className="mt-4 btn-modern">Start Shopping</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {data.recentOrders.map((order: any) => (
                    <div key={order._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium text-gray-900">#{order.orderNumber}</p>
                          <p className="text-xs text-gray-500">{formatDate(order.createdAt)}</p>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                          order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600">
                          {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                        </p>
                        <p className="font-semibold text-blue-600">{formatPrice(order.total)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          <Card className="card-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold">Recent Transactions</CardTitle>
                <Link href="/wallet">
                  <Button variant="outline" size="sm">View All</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {data.recentTransactions.length === 0 ? (
                <div className="text-center py-8">
                  <CreditCard size={48} className="text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No transactions yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {data.recentTransactions.map((txn: any) => (
                    <div key={txn._id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${
                            txn.type === 'credit' ? 'bg-green-100' : 'bg-red-100'
                          }`}>
                            {txn.type === 'credit' ? (
                              <TrendingUp size={16} className="text-green-600" />
                            ) : (
                              <TrendingUp size={16} className="text-red-600 rotate-180" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{txn.description}</p>
                            <p className="text-xs text-gray-500">{formatDate(txn.createdAt)}</p>
                          </div>
                        </div>
                        <p className={`font-semibold ${
                          txn.type === 'credit' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {txn.type === 'credit' ? '+' : '-'}{formatPrice(txn.amount)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="card-shadow">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link href="/products">
                <Button variant="outline" className="w-full h-24 flex flex-col gap-2">
                  <Package size={24} />
                  <span>Browse Products</span>
                </Button>
              </Link>
              <Link href="/orders">
                <Button variant="outline" className="w-full h-24 flex flex-col gap-2">
                  <Clock size={24} />
                  <span>Track Orders</span>
                </Button>
              </Link>
              <Link href="/profile">
                <Button variant="outline" className="w-full h-24 flex flex-col gap-2">
                  <User size={24} />
                  <span>Edit Profile</span>
                </Button>
              </Link>
              <Link href="/wallet">
                <Button variant="outline" className="w-full h-24 flex flex-col gap-2">
                  <Wallet size={24} />
                  <span>Wallet History</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
