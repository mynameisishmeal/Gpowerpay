'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User, Mail, Phone, Calendar, Shield, Settings, Loader2 } from 'lucide-react';
import { useEffect } from 'react';
import toast from 'react-hot-toast';

export default function RiderProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

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
  }, [status, session, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href="/rider/dashboard"
          className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft size={18} className="mr-1.5" />
          Back to Dashboard
        </Link>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
            <p className="text-gray-600 mt-1">Manage your account information</p>
          </div>
          <Link href="/rider/settings">
            <Button variant="outline">
              <Settings size={16} className="mr-2" />
              Account Settings
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <Card className="border-0 shadow-sm overflow-hidden h-full">
              <div className="bg-gradient-to-br from-blue-600 to-blue-800 h-32 relative"></div>
              <CardContent className="pt-0 relative text-center pb-8">
                <div className="w-24 h-24 bg-white rounded-full mx-auto -mt-12 mb-4 flex items-center justify-center shadow-md border-4 border-white">
                  {session.user.image ? (
                    <img
                      src={session.user.image}
                      alt={session.user.name || 'User'}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-3xl font-bold">
                      {session.user.name?.charAt(0) || 'R'}
                    </div>
                  )}
                </div>
                <h2 className="text-xl font-bold text-gray-900">{session.user.name}</h2>
                <div className="flex items-center justify-center gap-1.5 mt-2 text-sm text-blue-600 font-medium bg-blue-50 w-max mx-auto px-3 py-1 rounded-full">
                  <Shield size={14} />
                  Delivery Partner
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-2 space-y-6">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-lg font-bold flex items-center">
                  <User size={18} className="mr-2 text-blue-600" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row gap-2 sm:items-center justify-between py-2 border-b border-gray-50">
                    <div className="flex items-center text-gray-500 w-1/3">
                      <User size={16} className="mr-2" />
                      <span className="text-sm font-medium">Full Name</span>
                    </div>
                    <div className="text-sm font-semibold text-gray-900 sm:w-2/3 sm:text-right">
                      {session.user.name}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 sm:items-center justify-between py-2 border-b border-gray-50">
                    <div className="flex items-center text-gray-500 w-1/3">
                      <Mail size={16} className="mr-2" />
                      <span className="text-sm font-medium">Email Address</span>
                    </div>
                    <div className="text-sm font-semibold text-gray-900 sm:w-2/3 sm:text-right">
                      {session.user.email}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 sm:items-center justify-between py-2 border-b border-gray-50">
                    <div className="flex items-center text-gray-500 w-1/3">
                      <Phone size={16} className="mr-2" />
                      <span className="text-sm font-medium">Phone Number</span>
                    </div>
                    <div className="text-sm font-semibold text-gray-900 sm:w-2/3 sm:text-right">
                      {(session.user as any).phonenumber || 'Not provided'}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 sm:items-center justify-between py-2">
                    <div className="flex items-center text-gray-500 w-1/3">
                      <Shield size={16} className="mr-2" />
                      <span className="text-sm font-medium">Account Role</span>
                    </div>
                    <div className="text-sm font-semibold text-gray-900 sm:w-2/3 sm:text-right uppercase">
                      {session.user.role}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
