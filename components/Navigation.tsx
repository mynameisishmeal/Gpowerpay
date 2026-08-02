'use client';

import Link from 'next/link';
import { Home, ShoppingCart, Package, Users, BarChart3, Settings, UserPlus, ChevronDown, Printer, Menu, X, LogOut, CreditCard, TrendingDown, Bell, Receipt, Shield } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Navigation() {
  const router = useRouter();
  const [role, setRole] = useState<string>('');
  const [permissions, setPermissions] = useState<any>({});
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      setRole(user.role || '');
      setPermissions(user.permissions || {});
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('userId');
    localStorage.removeItem('userEmail');
    router.push('/login');
  };

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  return (
    <nav className="glass sticky top-0 z-50 border-b border-gray-200">
      <div className="max-w-full mx-auto px-4">
        <div className="flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Package className="h-6 w-6 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">Gpower CRM</span>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1 flex-wrap">
            <Link href="/dashboard" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-all text-gray-700 font-medium">
              <Home className="h-4 w-4" />
              <span>Dashboard</span>
            </Link>
            
            <Link href="/sell/mixed" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-all text-gray-700 font-medium">
              <ShoppingCart className="h-4 w-4" />
              <span>Sell</span>
            </Link>
            
            <Link href="/sales/history" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-all text-gray-700 font-medium">
              <BarChart3 className="h-4 w-4" />
              <span>Sales</span>
            </Link>
            
            {(role === 'sadmin' || permissions.canViewInventory) && (
              <div className="relative group">
                <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-all text-gray-700 font-medium">
                  <Package className="h-4 w-4" />
                  <span>Inventory</span>
                  <ChevronDown className="h-4 w-4" />
                </button>
                <div className="absolute left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                  <Link href="/stock" className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 rounded-t-lg">
                    <Package className="h-4 w-4" />
                    <span>Stock (Cartons)</span>
                  </Link>
                  <Link href="/products" className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 rounded-b-lg">
                    <Package className="h-4 w-4" />
                    <span>Products (Kilos)</span>
                  </Link>
                </div>
              </div>
            )}

            {(role === 'sadmin' || permissions.canViewCustomers) && (
              <Link href="/customers" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-all text-gray-700 font-medium">
                <UserPlus className="h-4 w-4" />
                <span>Customers</span>
              </Link>
            )}

            {(role === 'sadmin' || permissions.canViewFinance) && (
              <div className="relative group">
                <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-all text-gray-700 font-medium">
                  <BarChart3 className="h-4 w-4" />
                  <span>Finance</span>
                  <ChevronDown className="h-4 w-4" />
                </button>
                <div className="absolute left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                  <Link href="/credits" className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 rounded-t-lg">
                    <CreditCard className="h-4 w-4" />
                    <span>Credits</span>
                  </Link>
                  <Link href="/expenses" className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 rounded-b-lg">
                    <TrendingDown className="h-4 w-4" />
                    <span>Expenses</span>
                  </Link>
                </div>
              </div>
            )}
            
            {role === 'sadmin' && (
              <>
                <div className="relative group">
                  <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-all text-gray-700 font-medium">
                    <Users className="h-4 w-4" />
                    <span>Users</span>
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  <div className="absolute left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                    <Link href="/users" className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 rounded-t-lg">
                      <Users className="h-4 w-4" />
                      <span>Manage Users</span>
                    </Link>
                    <Link href="/users/permissions" className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 rounded-b-lg">
                      <Shield className="h-4 w-4" />
                      <span>Permissions</span>
                    </Link>
                  </div>
                </div>
                
                <Link href="/analytics" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-all text-gray-700 font-medium">
                  <BarChart3 className="h-4 w-4" />
                  <span>Analytics</span>
                </Link>

                <div className="relative group">
                  <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-all text-gray-700 font-medium">
                    <Settings className="h-4 w-4" />
                    <span>Settings</span>
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  <div className="absolute left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                    <Link href="/settings/profile" className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50">
                      <Settings className="h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                    <Link href="/settings/receipt" className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50">
                      <Receipt className="h-4 w-4" />
                      <span>Receipt</span>
                    </Link>
                    <Link href="/settings/alerts" className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 rounded-b-lg">
                      <Bell className="h-4 w-4" />
                      <span>Alerts</span>
                    </Link>
                  </div>
                </div>
              </>
            )}

            {(role === 'sadmin' || permissions.canViewAnalytics) && role !== 'sadmin' && (
              <Link href="/analytics" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-all text-gray-700 font-medium">
                <BarChart3 className="h-4 w-4" />
                <span>Analytics</span>
              </Link>
            )}

            {(role === 'sadmin' || permissions.canManageUsers) && role !== 'sadmin' && (
              <Link href="/users" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-all text-gray-700 font-medium">
                <Users className="h-4 w-4" />
                <span>Users</span>
              </Link>
            )}
            
            <Link href="/printers" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-all text-gray-700 font-medium">
              <Printer className="h-4 w-4" />
              <span>Printer</span>
            </Link>
            
            {role !== 'sadmin' && (
              <Link href="/settings/profile" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-all text-gray-700 font-medium">
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </Link>
            )}

            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-100 transition-all text-red-600 font-medium"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-all"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 top-16 bg-white z-40 overflow-y-auto">
            <div className="py-4 px-4">
            <div className="flex flex-col space-y-2">
              <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-all text-gray-700 font-medium">
                <Home className="h-4 w-4" />
                <span>Dashboard</span>
              </Link>
              
              <Link href="/sell/mixed" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-all text-gray-700 font-medium">
                <ShoppingCart className="h-4 w-4" />
                <span>Sell</span>
              </Link>
              
              <Link href="/sales/history" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-all text-gray-700 font-medium">
                <BarChart3 className="h-4 w-4" />
                <span>Sales</span>
              </Link>
              
              {(role === 'sadmin' || permissions.canViewInventory) && (
                <>
                  <Link href="/stock" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-all text-gray-700 font-medium">
                    <Package className="h-4 w-4" />
                    <span>Stock (Cartons)</span>
                  </Link>
                  
                  <Link href="/products" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-all text-gray-700 font-medium">
                    <Package className="h-4 w-4" />
                    <span>Products (Kilos)</span>
                  </Link>
                </>
              )}

              {(role === 'sadmin' || permissions.canViewCustomers) && (
                <Link href="/customers" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-all text-gray-700 font-medium">
                  <UserPlus className="h-4 w-4" />
                  <span>Customers</span>
                </Link>
              )}

              {(role === 'sadmin' || permissions.canViewFinance) && (
                <>
                  <Link href="/credits" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-all text-gray-700 font-medium">
                    <CreditCard className="h-4 w-4" />
                    <span>Credits</span>
                  </Link>

                  <Link href="/expenses" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-all text-gray-700 font-medium">
                    <TrendingDown className="h-4 w-4" />
                    <span>Expenses</span>
                  </Link>
                </>
              )}
              
              {role === 'sadmin' && (
                <>
                  <Link href="/users" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-all text-gray-700 font-medium">
                    <Users className="h-4 w-4" />
                    <span>Manage Users</span>
                  </Link>

                  <Link href="/users/permissions" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-all text-gray-700 font-medium">
                    <Shield className="h-4 w-4" />
                    <span>Permissions</span>
                  </Link>
                  
                  <Link href="/analytics" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-all text-gray-700 font-medium">
                    <BarChart3 className="h-4 w-4" />
                    <span>Analytics</span>
                  </Link>

                  <Link href="/settings/receipt" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-all text-gray-700 font-medium">
                    <Receipt className="h-4 w-4" />
                    <span>Receipt Settings</span>
                  </Link>

                  <Link href="/settings/alerts" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-all text-gray-700 font-medium">
                    <Bell className="h-4 w-4" />
                    <span>Alert Settings</span>
                  </Link>
                </>
              )}

              {(role === 'sadmin' || permissions.canViewAnalytics) && role !== 'sadmin' && (
                <Link href="/analytics" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-all text-gray-700 font-medium">
                  <BarChart3 className="h-4 w-4" />
                  <span>Analytics</span>
                </Link>
              )}

              {(role === 'sadmin' || permissions.canManageUsers) && role !== 'sadmin' && (
                <Link href="/users" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-all text-gray-700 font-medium">
                  <Users className="h-4 w-4" />
                  <span>Users</span>
                </Link>
              )}
              
              <Link href="/printers" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-all text-gray-700 font-medium">
                <Printer className="h-4 w-4" />
                <span>Printer</span>
              </Link>
              
              {role !== 'sadmin' && (
                <Link href="/settings/profile" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-all text-gray-700 font-medium">
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </Link>
              )}

              <button 
                onClick={() => { setMobileMenuOpen(false); handleLogout(); }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-100 transition-all text-red-600 font-medium w-full text-left"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
