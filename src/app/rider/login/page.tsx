'use client';

import { useState, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bike, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

export default function RiderLoginPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  // If already logged in as rider, redirect to dashboard
  useEffect(() => {
    if (status === 'authenticated' && (session?.user?.role as string) === 'rider') {
      window.location.href = '/rider/dashboard';
    }
  }, [status, session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Use 'rider-credentials' provider specifically for rider login
      const result = await signIn('rider-credentials', {
        email: formData.email.trim(),
        password: formData.password,
        redirect: false,
        callbackUrl: '/rider/dashboard',
      });

      if (result?.error) {
        if (result.error === 'Email not verified') {
          toast.error('Email not verified. A fresh verification link has been sent to your inbox. Please check your mail and spam too');
        } else {
          toast.error('Invalid email or password');
        }
        setIsLoading(false);
        return;
      }

      if (result?.ok) {
        toast.success('Welcome back!');
        // Full page navigation to cleanly load the session cookie
        window.location.href = '/rider/dashboard';
      }
    } catch (error) {
      console.error('Rider login error:', error);
      toast.error('Login failed. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-full mb-4">
            <Bike size={40} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Rider Portal</h1>
          <p className="text-gray-600 mt-2">Sign in to manage your deliveries</p>
        </div>

        {/* Login Card */}
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <Input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="rider@example.com"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <Link 
                    href="/forgot-password?type=rider" 
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Enter your password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>


            {/* Other Login Options */}
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-gray-600 text-center mb-3">Other Login Options</p>
              <div className="flex gap-3 justify-center">
                <Link 
                  href="/login"
                  className="text-sm text-blue-600 hover:underline font-medium"
                >
                  Customer Login
                </Link>
                <span className="text-gray-300">|</span>
                <Link 
                  href="/admin/login"
                  className="text-sm text-blue-600 hover:underline font-medium"
                >
                  Admin Login
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-gray-600 mt-6">
          Contact admin if you need help accessing your account
        </p>
      </div>
    </div>
  );
}
