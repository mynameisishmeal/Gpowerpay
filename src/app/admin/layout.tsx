'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';

/**
 * Admin Layout - Simplified
 * Just handles auth, no separate nav
 */

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();

  // Protect admin routes
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
      return;
    }

    // Check if user has admin role (sadmin or admin)
    if (status === 'authenticated' && session?.user?.role) {
      const role = session.user.role;
      if (!['sadmin', 'admin'].includes(role)) {
        router.push('/');
        return;
      }
    }
  }, [status, session, router]);

  // Don't show layout on login page
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  // Show loading while checking auth
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated or not admin
  if (status === 'unauthenticated' || !session?.user?.role || !['sadmin', 'admin'].includes(session.user.role)) {
    return null;
  }

  return <>{children}</>;
}
