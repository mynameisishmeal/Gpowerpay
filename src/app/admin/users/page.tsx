'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Search, Filter, CheckCircle, XCircle, Mail, Phone, Wallet, Loader2, Users, KeyRound, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface User {
  _id: string;
  email: string;
  name: string;
  phone?: string;
  emailVerified: boolean;
  walletBalance: number;
  isActive: boolean;
  isBlocked: boolean;
  createdAt: string;
  lastLogin?: string;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();
  
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [verifiedFilter, setVerifiedFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [resetPasswordUserId, setResetPasswordUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [isActivating, setIsActivating] = useState<string | null>(null);

  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      router.push('/admin/login');
      return;
    }

    if (session?.user?.role !== 'sadmin' && session?.user?.role !== 'admin' && session?.user?.role !== 'support') {
      router.push('/');
      return;
    }

    fetchUsers();
  }, [authStatus, session, page, verifiedFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(verifiedFilter !== 'all' && { verified: verifiedFilter }),
        ...(searchQuery && { search: searchQuery }),
      });

      const response = await fetch(`/api/admin/users?${params}`);
      const data = await response.json();

      if (data.success) {
        setUsers(data.users);
        setTotalPages(data.pagination.totalPages);
        setTotalUsers(data.pagination.total);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(price);
  };

  const handleActivateEmail = async (userId: string) => {
    try {
      setIsActivating(userId);
      const res = await fetch(`/api/admin/users/${userId}/activate-email`, {
        method: 'PUT',
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Email activated successfully');
        fetchUsers();
      } else {
        toast.error(data.error || 'Failed to activate email');
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to activate email');
    } finally {
      setIsActivating(null);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPasswordUserId || !newPassword) return;

    try {
      setIsResettingPassword(true);
      const res = await fetch(`/api/admin/users/${resetPasswordUserId}/reset-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Password reset successfully');
        setResetPasswordUserId(null);
        setNewPassword('');
      } else {
        toast.error(data.error || 'Failed to reset password');
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to reset password');
    } finally {
      setIsResettingPassword(false);
    }
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
              <h1 className="text-3xl font-bold text-gray-900">Users Management</h1>
              <p className="text-gray-600 mt-1">Manage customer accounts</p>
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
                      placeholder="Search by name, email, or phone..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </form>

                {/* Verified Filter */}
                <div className="flex items-center gap-2">
                  <Filter size={20} className="text-gray-400" />
                  <select
                    value={verifiedFilter}
                    onChange={(e) => {
                      setVerifiedFilter(e.target.value);
                      setPage(1);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Users</option>
                    <option value="true">Verified</option>
                    <option value="false">Unverified</option>
                  </select>
                </div>

                <Button onClick={fetchUsers} className="btn-modern">
                  Apply Filters
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Users ({totalUsers} total)</CardTitle>
          </CardHeader>
          <CardContent>
            {users.length === 0 ? (
              <div className="text-center py-12">
                <Users size={64} className="text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No users found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b">
                    <tr className="text-left">
                      <th className="pb-3 text-sm font-semibold text-gray-600">User</th>
                      <th className="pb-3 text-sm font-semibold text-gray-600">Contact</th>
                      <th className="pb-3 text-sm font-semibold text-gray-600">Status</th>
                      <th className="pb-3 text-sm font-semibold text-gray-600">Wallet</th>
                      <th className="pb-3 text-sm font-semibold text-gray-600">Joined</th>
                      <th className="pb-3 text-sm font-semibold text-gray-600">Last Login</th>
                      {session?.user?.role === 'sadmin' && (
                        <th className="pb-3 text-sm font-semibold text-gray-600">Actions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {users.map((user) => (
                      <tr key={user._id} className="hover:bg-gray-50">
                        <td className="py-4">
                          <div>
                            <p className="font-medium text-gray-900">{user.name}</p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                          </div>
                        </td>
                        <td className="py-4">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Mail size={14} />
                              {user.emailVerified ? (
                                <CheckCircle size={14} className="text-green-600" />
                              ) : (
                                <XCircle size={14} className="text-red-600" />
                              )}
                            </div>
                            {user.phone && (
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Phone size={14} />
                                <span>{user.phone}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-4">
                          <div className="flex flex-col gap-1">
                            {user.isActive ? (
                              <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-green-100 text-green-800 w-fit">
                                <CheckCircle size={12} />
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-gray-100 text-gray-800 w-fit">
                                <XCircle size={12} />
                                Inactive
                              </span>
                            )}
                            {user.isBlocked && (
                              <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-red-100 text-red-800 w-fit">
                                <XCircle size={12} />
                                Blocked
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4">
                          <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                            <Wallet size={16} className="text-blue-600" />
                            {formatPrice(user.walletBalance)}
                          </div>
                        </td>
                        <td className="py-4 text-sm text-gray-600">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-4 text-sm text-gray-600">
                          {user.lastLogin
                            ? new Date(user.lastLogin).toLocaleDateString()
                            : 'Never'}
                        </td>
                        {session?.user?.role === 'sadmin' && (
                          <td className="py-4">
                            <div className="flex gap-2">
                              {!user.emailVerified && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleActivateEmail(user._id)}
                                  disabled={isActivating === user._id}
                                >
                                  {isActivating === user._id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <UserCheck className="h-4 w-4 mr-1 text-green-600" />
                                  )}
                                  Activate
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setResetPasswordUserId(user._id)}
                              >
                                <KeyRound className="h-4 w-4 mr-1 text-blue-600" />
                                Reset
                              </Button>
                            </div>
                          </td>
                        )}
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

      {/* Reset Password Dialog */}
      <Dialog open={!!resetPasswordUserId} onOpenChange={(open) => !open && setResetPasswordUserId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset User Password</DialogTitle>
            <DialogDescription>
              Enter a new password for this user. They will be able to log in with this new password immediately.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleResetPassword} className="space-y-4 pt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <Input
                type="text"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setResetPasswordUserId(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isResettingPassword} isLoading={isResettingPassword} loadingText="Resetting...">
                Reset Password
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

