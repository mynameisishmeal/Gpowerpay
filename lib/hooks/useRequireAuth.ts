import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

type UserRole = 'customer' | 'sadmin' | 'admin' | 'worker' | 'support' | 'rider';

interface UseRequireAuthOptions {
  requiredRole?: UserRole | UserRole[];
  redirectTo?: string;
}

/**
 * Custom hook to protect client components and pages
 * Redirects to login if not authenticated or if user doesn't have required role
 * 
 * @param options - Configuration options
 * @param options.requiredRole - Required role(s) to access the component
 * @param options.redirectTo - Custom redirect URL (defaults to /login or /admin/login)
 * 
 * @example
 * // Protect a customer page
 * useRequireAuth({ requiredRole: 'customer' });
 * 
 * @example
 * // Protect an admin page (allow both sadmin and support)
 * useRequireAuth({ requiredRole: ['sadmin', 'support'] });
 */
export function useRequireAuth(options: UseRequireAuthOptions = {}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { requiredRole, redirectTo } = options;
  const [callbackUrl, setCallbackUrl] = useState('/');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCallbackUrl(window.location.pathname);
    }
  }, []);

  useEffect(() => {
    if (status === 'loading') return;

    // Not authenticated
    if (status === 'unauthenticated') {
      const defaultRedirect = requiredRole && ['sadmin', 'admin', 'support'].includes(requiredRole as any)
        ? '/admin/login' 
        : '/login';
      
      const redirect = redirectTo || defaultRedirect;
      router.push(`${redirect}?callbackUrl=${encodeURIComponent(callbackUrl)}`);
      return;
    }

    // Check role if specified
    if (requiredRole && session?.user) {
      const userRole = session.user.role;
      const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];

      if (!allowedRoles.includes(userRole as UserRole) && userRole !== undefined) {
        // Redirect to appropriate page based on user's actual role
        if (userRole === 'customer') {
          router.push('/');
        } else if (userRole !== undefined && ['sadmin', 'admin', 'support'].includes(userRole)) {
          router.push('/admin/dashboard');
        } else if (userRole === 'rider') {
          router.push('/rider/dashboard');
        } else if (userRole !== undefined) {
          router.push('/login');
        }
      }
    }
  }, [status, session, requiredRole, redirectTo, router, callbackUrl]);

  return {
    session,
    status,
    isAuthenticated: status === 'authenticated',
    isLoading: status === 'loading',
    user: session?.user,
  };
}
