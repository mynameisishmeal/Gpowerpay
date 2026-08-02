'use client';

import { ReactNode } from 'react';
import { useRequireAuth } from '@/lib/hooks/useRequireAuth';
import { Loader2 } from 'lucide-react';

type UserRole = 'customer' | 'sadmin' | 'admin' | 'worker' | 'support' | 'rider';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: UserRole | UserRole[];
  redirectTo?: string;
  fallback?: ReactNode;
}

/**
 * Protected Route Component
 * Wraps content that requires authentication and optional role checking
 * Shows loading state while checking authentication
 * 
 * @example
 * // Protect customer content
 * <ProtectedRoute requiredRole="customer">
 *   <CustomerDashboard />
 * </ProtectedRoute>
 * 
 * @example
 * // Protect admin content (allow multiple roles)
 * <ProtectedRoute requiredRole={['sadmin', 'support']}>
 *   <AdminPanel />
 * </ProtectedRoute>
 * 
 * @example
 * // Custom loading fallback
 * <ProtectedRoute 
 *   requiredRole="customer"
 *   fallback={<CustomLoader />}
 * >
 *   <Content />
 * </ProtectedRoute>
 */
export function ProtectedRoute({
  children,
  requiredRole,
  redirectTo,
  fallback,
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useRequireAuth({
    requiredRole,
    redirectTo,
  });

  // Show loading state
  if (isLoading) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      )
    );
  }

  // Show nothing while redirecting (middleware will redirect)
  if (!isAuthenticated) {
    return null;
  }

  // Render protected content
  return <>{children}</>;
}
