'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { User, LogOut, UserCircle, ShieldCheck, Settings, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * UserStatus Component
 * Shows current user info and role in the navbar
 */
export function UserStatus() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg animate-pulse">
        <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
        <div className="w-24 h-4 bg-gray-300 rounded"></div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="flex items-center gap-2">
        <Link href="/login">
          <Button variant="outline" size="sm">
            <User size={16} className="mr-2" />
            Sign In
          </Button>
        </Link>
        <Link href="/register">
          <Button size="sm" className="btn-modern">
            Register
          </Button>
        </Link>
      </div>
    );
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'sadmin':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'admin':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'worker':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'support':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'rider':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'customer':
      default:
        return 'bg-purple-100 text-purple-800 border-purple-200';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'sadmin':
      case 'admin':
      case 'worker':
      case 'support':
        return <ShieldCheck size={14} />;
      case 'rider':
        return <Settings size={14} />;
      default:
        return <UserCircle size={14} />;
    }
  };

  // Get dashboard link based on role
  const getDashboardLink = (role: string) => {
    switch (role) {
      case 'sadmin':
      case 'admin':
      case 'support':
        return '/admin/dashboard';
      case 'rider':
        return '/rider/dashboard';
      default:
        return '/dashboard';
    }
  };

  const isEmailVerified = (session?.user as any)?.emailVerified;

  return (
    <div className="flex items-center gap-2">
      {/* User Info - Compact on small screens - Clickable */}
      <Link href={getDashboardLink(session.user.role || 'customer')}>
        <div className="flex items-center gap-2 px-2 py-1.5 bg-white border border-gray-200 rounded-lg relative z-10 hover:bg-gray-50 transition-colors cursor-pointer">
          <div className="flex items-center gap-2">
            {session.user.image ? (
              <img
                src={session.user.image}
                alt={session.user.name || 'User'}
                className="w-7 h-7 rounded-full object-cover"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center">
                <User size={14} className="text-blue-600" />
              </div>
            )}
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-xs font-medium text-gray-900 truncate max-w-[80px] sm:max-w-[120px]">
                  {session.user.name || session.user.email}
                </span>
                {/* Email Verification Status Indicator */}
                {isEmailVerified ? (
                  <CheckCircle2 
                    size={12} 
                    className="text-green-600 flex-shrink-0" 
                    aria-label="Email verified"
                  />
                ) : (
                  <AlertCircle 
                    size={12} 
                    className="text-yellow-600 flex-shrink-0" 
                    aria-label="Email not verified"
                  />
                )}
              </div>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded border inline-flex items-center gap-1 w-fit ${getRoleColor(
                  session.user.role || 'customer'
                )}`}
              >
                {getRoleIcon(session.user.role || 'customer')}
                <span className="hidden sm:inline">{session.user.role || 'customer'}</span>
              </span>
            </div>
          </div>
        </div>
      </Link>

      {/* Sign Out Button - Icon only on mobile */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => signOut({ callbackUrl: '/' })}
        className="hover:bg-red-50 hover:text-red-600 hover:border-red-200 bg-white relative z-10 px-2 sm:px-3"
      >
        <LogOut size={16} className="sm:mr-2" />
        <span className="hidden sm:inline">Sign Out</span>
      </Button>
    </div>
  );
}
