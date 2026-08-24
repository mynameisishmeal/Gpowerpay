'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Package, Menu, Heart, ShoppingBag, Wallet as WalletIcon, User as UserIcon, LayoutDashboard, ShoppingCart, Users, ChevronDown, Bike } from 'lucide-react';
import { UserStatus } from './UserStatus';
import { CartIcon } from '@/components/cart/CartIcon';
import { CartSlideOver } from '@/components/cart/CartSlideOver';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { LifeBuoy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { useWishlistStore } from '@/lib/store/wishlistStore';

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [adminDropdownOpen, setAdminDropdownOpen] = useState(false);
  const adminDropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const mobileButtonRef = useRef<HTMLButtonElement>(null);
  const { data: session } = useSession();
  const pathname = usePathname();
  const { fetchWishlist, getCount } = useWishlistStore();
  const wishlistCount = getCount();

  const isAdmin = session?.user?.role === 'sadmin' || session?.user?.role === 'admin';
  const isRider = session?.user?.role === 'rider';
  const isCustomer = session && !isAdmin && !isRider; // Regular customer

  useEffect(() => {
    // Only fetch wishlist for customers
    if (isCustomer) {
      fetchWishlist();
    }
  }, [session, isCustomer]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (adminDropdownRef.current && !adminDropdownRef.current.contains(event.target as Node)) {
        setAdminDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        mobileMenuRef.current && 
        !mobileMenuRef.current.contains(event.target as Node) &&
        mobileButtonRef.current &&
        !mobileButtonRef.current.contains(event.target as Node)
      ) {
        setMobileMenuOpen(false);
      }
    };

    if (mobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [mobileMenuOpen]);

  // Close menus on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setAdminDropdownOpen(false);
  }, [pathname, session]);

  const adminLinks = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/orders', label: 'Orders', icon: ShoppingCart },
    { href: '/admin/products', label: 'Products', icon: Package },
    { href: '/admin/riders', label: 'Riders', icon: Bike },
    { href: '/admin/users', label: 'Users', icon: Users },
  ];

  const getHomeHref = () => {
    if (isAdmin) return '/admin/dashboard';
    if (isRider) return '/rider/dashboard';
    if (isCustomer) return '/dashboard';
    return '/';
  };

  return (
    <>
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-[100] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 gap-2">
            {/* Logo */}
            <Link href={getHomeHref()} className="flex items-center gap-2 flex-shrink-0">
              <Image 
                src="/web-app-manifest-512x512.png" 
                alt="Gpowerpay Logo" 
                width={32} 
                height={32} 
                className="h-7 w-7 sm:h-8 sm:w-8 object-contain"
              />
              <span className="text-lg sm:text-xl font-bold text-gray-900">Gpowerpay</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-4 xl:gap-6">
              {/* Show Products link only for customers and non-logged in users */}
              {!isRider && (
                <Link
                  href="/products"
                  className="text-gray-700 hover:text-blue-600 transition-colors font-medium"
                >
                  Products
                </Link>
              )}
              
              {session && (
                <>
                  {/* Admin Dropdown */}
                  {isAdmin && (
                    <div 
                      className="relative" 
                      ref={adminDropdownRef}
                      onBlur={(e) => {
                        if (!e.currentTarget.contains(e.relatedTarget)) {
                          setAdminDropdownOpen(false);
                        }
                      }}
                    >
                      <button
                        onClick={() => setAdminDropdownOpen(!adminDropdownOpen)}
                        className="text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg transition-colors font-medium flex items-center gap-2"
                      >
                        <Package size={16} />
                        Admin
                        <ChevronDown size={14} className={`transition-transform ${adminDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {adminDropdownOpen && (
                        <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                          {adminLinks.map((link) => {
                            const Icon = link.icon;
                            return (
                              <Link
                                key={link.href}
                                href={link.href}
                                onClick={() => setAdminDropdownOpen(false)}
                                className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                              >
                                <Icon size={16} />
                                {link.label}
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Rider Dashboard Link */}
                  {isRider && (
                    <Link
                      href="/rider/dashboard"
                      className="text-white bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded-lg transition-colors font-medium flex items-center gap-2"
                    >
                      <Bike size={16} />
                      Dashboard
                    </Link>
                  )}
                  
                  {/* Customer-only links */}
                  {isCustomer && (
                    <>
                      <Link
                        href="/orders"
                        className="text-gray-700 hover:text-blue-600 transition-colors font-medium"
                      >
                        My Orders
                      </Link>
                      <Link
                        href="/wallet"
                        className="text-gray-700 hover:text-blue-600 transition-colors font-medium"
                      >
                        Wallet
                      </Link>
                      <Link
                        href="/profile"
                        className="text-gray-700 hover:text-blue-600 transition-colors font-medium"
                      >
                        Profile
                      </Link>
                      <Link
                        href="/profile/support"
                        className="text-gray-700 hover:text-blue-600 transition-colors font-medium"
                      >
                        Support
                      </Link>
                    </>
                  )}
                </>
              )}
            </div>

            {/* Right Side: Notifications + Wishlist + Cart + User Status */}
            <div className="hidden lg:flex items-center gap-2 xl:gap-4 flex-shrink-0">
              {session && (
                <>
                  <NotificationBell />
                  {/* Wishlist and Cart only for customers */}
                  {isCustomer && (
                    <>
                      <Link href="/wishlist" className="relative">
                        <Button variant="ghost" size="sm" className="relative">
                          <Heart size={20} />
                          {wishlistCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                              {wishlistCount}
                            </span>
                          )}
                        </Button>
                      </Link>
                      <CartIcon />
                    </>
                  )}
                </>
              )}
              {!session && <CartIcon />}
              <UserStatus />
            </div>

            {/* Mobile Menu Button */}
            <div className="lg:hidden flex items-center gap-1 flex-shrink-0">
              {session && (
                <>
                  <NotificationBell />
                  {/* Wishlist and Cart only for customers on mobile */}
                  {isCustomer && (
                    <>
                      <Link href="/wishlist">
                        <Button variant="ghost" size="sm" className="relative">
                          <Heart size={20} />
                          {wishlistCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center text-[10px]">
                              {wishlistCount}
                            </span>
                          )}
                        </Button>
                      </Link>
                      <CartIcon />
                    </>
                  )}
                </>
              )}
              {!session && <CartIcon />}
              <Button
                ref={mobileButtonRef}
                variant="outline"
                size="sm"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <Menu size={20} />
              </Button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div 
              ref={mobileMenuRef}
              className="lg:hidden py-4 border-t border-gray-200"
            >
              <div className="flex flex-col gap-4">
                {/* Products link only for non-riders */}
                {!isRider && (
                  <Link
                    href="/products"
                    className="text-gray-700 hover:text-blue-600 font-medium"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Products
                  </Link>
                )}
                
                {session && (
                  <>
                    {/* Admin Links for Mobile */}
                    {isAdmin && (
                      <>
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-3">Admin</div>
                        {adminLinks.map((link) => {
                          const Icon = link.icon;
                          return (
                            <Link
                              key={link.href}
                              href={link.href}
                              className="text-gray-700 hover:text-blue-600 font-medium flex items-center gap-2 px-3 py-2 hover:bg-blue-50 rounded"
                              onClick={() => setMobileMenuOpen(false)}
                            >
                              <Icon size={20} />
                              {link.label}
                            </Link>
                          );
                        })}
                        <div className="border-t border-gray-200 my-2"></div>
                      </>
                    )}
                    
                    {/* Rider Dashboard for Mobile */}
                    {isRider && (
                      <Link
                        href="/rider/dashboard"
                        className="text-white bg-green-600 hover:bg-green-700 px-3 py-2 rounded-lg font-medium flex items-center gap-2"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Bike size={20} />
                        Dashboard
                      </Link>
                    )}
                    
                    {/* Customer-only links on mobile */}
                    {isCustomer && (
                      <>
                        <Link
                          href="/orders"
                          className="text-gray-700 hover:text-blue-600 font-medium flex items-center gap-2"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <ShoppingBag size={20} />
                          My Orders
                        </Link>
                        <Link
                          href="/wallet"
                          className="text-gray-700 hover:text-blue-600 font-medium flex items-center gap-2"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <WalletIcon size={20} />
                          Wallet
                        </Link>
                        <Link
                          href="/profile"
                          className="text-gray-700 hover:text-blue-600 font-medium flex items-center gap-2"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <UserIcon size={20} />
                          Profile
                        </Link>
                        <Link
                          href="/profile/support"
                          className="text-gray-700 hover:text-blue-600 font-medium flex items-center gap-2"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <LifeBuoy size={20} />
                          Support
                        </Link>
                        <Link
                          href="/wishlist"
                          className="text-gray-700 hover:text-blue-600 font-medium flex items-center gap-2"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <Heart size={20} />
                          Wishlist {wishlistCount > 0 && `(${wishlistCount})`}
                        </Link>
                      </>
                    )}
                  </>
                )}
                <div className="pt-4 border-t border-gray-200">
                  <UserStatus />
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Cart Slide-over */}
      <CartSlideOver />
    </>
  );
}
