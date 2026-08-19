'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Shield,
  Settings as SettingsIcon
} from 'lucide-react';
import toast from 'react-hot-toast';

// Change Email Schema
const changeEmailSchema = z.object({
  newEmail: z.string().email('Please enter a valid email address'),
  currentPassword: z.string().min(1, 'Current password is required'),
});

type ChangeEmailFormData = z.infer<typeof changeEmailSchema>;

// Change Password Schema
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

export default function AdminSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showEmailPassword, setShowEmailPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const emailForm = useForm<ChangeEmailFormData>({
    resolver: zodResolver(changeEmailSchema),
  });

  const passwordForm = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
  });

  // Redirect if not authenticated or not admin
  if (status === 'unauthenticated') {
    router.push('/admin/login');
    return null;
  }

  if (status === 'authenticated' && !['sadmin', 'admin', 'support'].includes(session?.user?.role || '')) {
    router.push('/');
    return null;
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
      </div>
    );
  }

  const isEmailVerified = (session?.user as any)?.emailVerified;

  const onChangeEmail = async (data: ChangeEmailFormData) => {
    setIsChangingEmail(true);

    try {
      const response = await fetch('/api/user/change-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to change email');
      }

      toast.success('Email updated! Please check your new email to verify it.');
      emailForm.reset();
      
      // Sign out after email change
      setTimeout(() => {
        router.push('/admin/login?message=email_changed');
      }, 2000);
    } catch (error: any) {
      toast.error(error.message || 'Failed to change email');
    } finally {
      setIsChangingEmail(false);
    }
  };

  const onChangePassword = async (data: ChangePasswordFormData) => {
    setIsChangingPassword(true);

    try {
      const response = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.code === 'EMAIL_NOT_VERIFIED') {
          toast.error('Please verify your email before changing your password', {
            icon: '⚠️',
            duration: 5000,
          });
        } else {
          throw new Error(result.error || 'Failed to change password');
        }
        return;
      }

      toast.success('Password changed successfully! Please sign in with your new password.');
      passwordForm.reset();
      
      // Sign out after password change
      setTimeout(() => {
        router.push('/admin/login?message=password_changed');
      }, 2000);
    } catch (error: any) {
      toast.error(error.message || 'Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <SettingsIcon className="h-8 w-8 text-blue-500" />
            <h1 className="text-3xl font-bold text-white">Admin Settings</h1>
          </div>
          <p className="text-gray-400">Manage your admin account email and password</p>
        </div>

        {/* Email Verification Warning */}
        {!isEmailVerified && (
          <Card className="mb-6 border-yellow-600 bg-yellow-900/20">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-yellow-400">Email Not Verified</h3>
                  <p className="text-sm text-yellow-300 mt-1">
                    Please verify your email address. You won't be able to change your password until your email is verified.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 border-yellow-600 text-yellow-400 hover:bg-yellow-900/30"
                    onClick={async () => {
                      try {
                        const response = await fetch('/api/auth/resend-verification', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ email: session?.user?.email }),
                        });
                        const result = await response.json();
                        if (response.ok) {
                          toast.success('Verification email sent!');
                        } else {
                          throw new Error(result.error);
                        }
                      } catch (error: any) {
                        toast.error(error.message || 'Failed to resend verification email');
                      }
                    }}
                  >
                    Resend Verification Email
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Change Email */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Mail className="h-5 w-5 text-blue-500" />
                Change Email
              </CardTitle>
              <CardDescription className="text-gray-400">
                Update your email address. You'll need to verify the new email.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={emailForm.handleSubmit(onChangeEmail)} className="space-y-4">
                {/* Current Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Current Email
                  </label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="email"
                      value={session?.user?.email || ''}
                      disabled
                      className="bg-gray-700 border-gray-600 text-gray-300"
                    />
                    {isEmailVerified && (
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                    )}
                  </div>
                </div>

                {/* New Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    New Email
                  </label>
                  <Input
                    type="email"
                    placeholder="newemail@example.com"
                    {...emailForm.register('newEmail')}
                    disabled={isChangingEmail}
                    className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-500"
                  />
                  {emailForm.formState.errors.newEmail && (
                    <p className="mt-1 text-sm text-red-400">
                      {emailForm.formState.errors.newEmail.message}
                    </p>
                  )}
                </div>

                {/* Current Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Current Password
                  </label>
                  <div className="relative">
                    <Input
                      type={showEmailPassword ? 'text' : 'password'}
                      placeholder="Enter your current password"
                      {...emailForm.register('currentPassword')}
                      disabled={isChangingEmail}
                      className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-500 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowEmailPassword(!showEmailPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 focus:outline-none"
                    >
                      {showEmailPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {emailForm.formState.errors.currentPassword && (
                    <p className="mt-1 text-sm text-red-400">
                      {emailForm.formState.errors.currentPassword.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={isChangingEmail}
                >
                  {isChangingEmail ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update Email'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Change Password */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Lock className="h-5 w-5 text-blue-500" />
                Change Password
              </CardTitle>
              <CardDescription className="text-gray-400">
                Update your password. Email verification required.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={passwordForm.handleSubmit(onChangePassword)} className="space-y-4">
                {/* Current Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Current Password
                  </label>
                  <div className="relative">
                    <Input
                      type={showCurrentPassword ? 'text' : 'password'}
                      placeholder="Enter current password"
                      {...passwordForm.register('currentPassword')}
                      disabled={isChangingPassword || !isEmailVerified}
                      className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-500 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                      disabled={!isEmailVerified}
                    >
                      {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {passwordForm.formState.errors.currentPassword && (
                    <p className="mt-1 text-sm text-red-400">
                      {passwordForm.formState.errors.currentPassword.message}
                    </p>
                  )}
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <Input
                      type={showNewPassword ? 'text' : 'password'}
                      placeholder="Enter new password (min 8 characters)"
                      {...passwordForm.register('newPassword')}
                      disabled={isChangingPassword || !isEmailVerified}
                      className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-500 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                      disabled={!isEmailVerified}
                    >
                      {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {passwordForm.formState.errors.newPassword && (
                    <p className="mt-1 text-sm text-red-400">
                      {passwordForm.formState.errors.newPassword.message}
                    </p>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Re-enter new password"
                      {...passwordForm.register('confirmPassword')}
                      disabled={isChangingPassword || !isEmailVerified}
                      className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-500 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                      disabled={!isEmailVerified}
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {passwordForm.formState.errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-400">
                      {passwordForm.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={isChangingPassword || !isEmailVerified}
                >
                  {isChangingPassword ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : !isEmailVerified ? (
                    <>
                      <Shield className="mr-2 h-4 w-4" />
                      Verify Email Required
                    </>
                  ) : (
                    'Update Password'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Security Notice */}
        <Card className="mt-6 border-blue-600 bg-blue-900/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-blue-500 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-400">Security Notice</h3>
                <ul className="text-sm text-blue-300 mt-2 space-y-1 list-disc list-inside">
                  <li>Changing your email will log you out and require re-verification</li>
                  <li>Changing your password will log you out of all devices</li>
                  <li>Email verification is required before changing your password</li>
                  <li>As an admin, keep your credentials extra secure</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
