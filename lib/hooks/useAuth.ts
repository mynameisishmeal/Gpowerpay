import { useSession } from 'next-auth/react';
import { SessionUser } from '@/types';

export function useAuth() {
  const { data: session, status } = useSession();
  
  return {
    user: session?.user as SessionUser | undefined,
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
    isCustomer: session?.user?.role === 'customer',
    isSuperAdmin: session?.user?.role === 'sadmin',
    isSupport: session?.user?.role === 'support',
    isRider: session?.user?.role === 'rider',
    isAdmin: session?.user?.role === 'sadmin' || session?.user?.role === 'admin' || session?.user?.role === 'support',
  };
}
