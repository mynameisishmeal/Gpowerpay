'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Mail, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';

export function EmailVerificationBanner() {
  const { data: session } = useSession();
  const [dismissed, setDismissed] = useState(false);
  const [resending, setResending] = useState(false);

  // Don't show if user is not logged in or email is verified
  if (!session?.user || session.user.emailVerified || dismissed) {
    return null;
  }

  const handleResend = async () => {
    setResending(true);
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Verification email sent! Please check your inbox.');
      } else {
        toast.error(data.error || 'Failed to send verification email');
      }
    } catch (error) {
      toast.error('Failed to send verification email');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="bg-yellow-50 border-b border-yellow-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <Mail size={20} className="text-yellow-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-yellow-800">
                <strong>Please verify your email address.</strong> Check your inbox for a verification link.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleResend}
              disabled={resending}
              className="bg-white hover:bg-yellow-100 text-yellow-800 border-yellow-300"
            >
              {resending ? 'Sending...' : 'Resend Email'}
            </Button>
            <button
              onClick={() => setDismissed(true)}
              className="p-1 hover:bg-yellow-100 rounded text-yellow-600"
              aria-label="Dismiss"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
