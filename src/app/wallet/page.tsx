'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  Wallet, TrendingUp, TrendingDown, 
  Filter, Download, RefreshCw 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FundWalletButton } from '@/components/wallet/FundWalletButton';

/**
 * Wallet Page - Transaction history and wallet management
 */

interface Transaction {
  _id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  reference: string;
  balanceBefore: number;
  balanceAfter: number;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
}

export default function WalletPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterType, setFilterType] = useState<'all' | 'credit' | 'debit'>('all');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/wallet');
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchWalletData();
    }
  }, [session, page, filterType]);

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      const [balanceRes, transactionsRes] = await Promise.all([
        fetch('/api/wallet/balance'),
        fetch(`/api/wallet/transactions?page=${page}&limit=20&type=${filterType !== 'all' ? filterType : ''}`),
      ]);

      const [balanceData, transactionsData] = await Promise.all([
        balanceRes.json(),
        transactionsRes.json(),
      ]);

      if (balanceData.success) {
        setBalance(balanceData.balance);
      }

      if (transactionsData.success) {
        setTransactions(transactionsData.transactions);
        setTotalPages(transactionsData.pagination.totalPages);
      }
    } catch (error) {
      console.error('Failed to fetch wallet data:', error);
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
    return new Date(date).toLocaleString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const exportTransactions = () => {
    // Create CSV content
    const headers = ['Date', 'Type', 'Description', 'Reference', 'Amount', 'Balance After'];
    const rows = transactions.map(txn => [
      new Date(txn.createdAt).toLocaleDateString(),
      txn.type,
      txn.description,
      txn.reference,
      txn.amount,
      txn.balanceAfter,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wallet-transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="animate-pulse space-y-6">
            <div className="h-32 bg-gray-200 rounded-lg" />
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-20 bg-gray-200 rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Wallet</h1>
          <p className="text-gray-600">Manage your wallet and view transaction history</p>
        </div>

        {/* Balance Card */}
        <Card className="card-shadow mb-8 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 mb-2">Available Balance</p>
                <p className="text-4xl font-bold mb-4">{formatPrice(balance)}</p>
                <div className="flex gap-3">
                  <FundWalletButton onSuccess={fetchWalletData} />
                  <Button 
                    variant="outline" 
                    className="bg-white/10 text-white border-white/20 hover:bg-white/20"
                    onClick={fetchWalletData}
                  >
                    <RefreshCw size={20} className="mr-2" />
                    Refresh
                  </Button>
                </div>
              </div>
              <div className="hidden md:block">
                <Wallet size={80} className="text-white/20" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filters and Actions */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-2">
            <Button
              variant={filterType === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setFilterType('all');
                setPage(1);
              }}
            >
              All
            </Button>
            <Button
              variant={filterType === 'credit' ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setFilterType('credit');
                setPage(1);
              }}
            >
              <TrendingUp size={16} className="mr-1" />
              Credits
            </Button>
            <Button
              variant={filterType === 'debit' ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setFilterType('debit');
                setPage(1);
              }}
            >
              <TrendingDown size={16} className="mr-1" />
              Debits
            </Button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={exportTransactions}
            disabled={transactions.length === 0}
          >
            <Download size={16} className="mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Transactions List */}
        <Card className="card-shadow">
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <div className="text-center py-16">
                <Wallet size={64} className="text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-2">No transactions yet</p>
                <p className="text-sm text-gray-400">
                  Your wallet transactions will appear here
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.map((txn) => (
                  <div
                    key={txn._id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className={`p-3 rounded-lg ${
                          txn.type === 'credit' ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          {txn.type === 'credit' ? (
                            <TrendingUp size={20} className="text-green-600" />
                          ) : (
                            <TrendingDown size={20} className="text-red-600" />
                          )}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-1">
                            <div>
                              <p className="font-medium text-gray-900">{txn.description}</p>
                              <p className="text-sm text-gray-500">{formatDate(txn.createdAt)}</p>
                            </div>
                            <p className={`text-lg font-bold ${
                              txn.type === 'credit' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {txn.type === 'credit' ? '+' : '-'}{formatPrice(txn.amount)}
                            </p>
                          </div>

                          <div className="flex items-center gap-4 mt-3 text-xs text-gray-600">
                            <span>Ref: {txn.reference}</span>
                            <span>•</span>
                            <span>Balance: {formatPrice(txn.balanceAfter)}</span>
                            <span className={`px-2 py-1 rounded-full ${
                              txn.status === 'completed' ? 'bg-green-100 text-green-800' :
                              txn.status === 'failed' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {txn.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <span className="flex items-center px-4 text-sm">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
