'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ICategory } from '@/types';
import { useProductList } from '@/lib/hooks/useProductList';
import {
  ProductGrid,
  ProductFilters,
  ProductSort,
} from '@/components/products';
import { Pagination } from '@/components/ui/pagination';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X, ShoppingBag, Loader2, Lock } from 'lucide-react';
import { useCartStore } from '@/lib/store/cartStore';
import toast from 'react-hot-toast';

/**
 * Products Listing Page
 * Browse all products with filters, search, and sorting
 * REQUIRES LOGIN
 */

// Force dynamic rendering for pages with searchParams
export const dynamic = 'error';

export default function ProductsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [priceRange, setPriceRange] = useState({ min: 0, max: 100000 });
  const addItem = useCartStore((state) => state.addItem);

  // Initialize filters from URL params
  const initialFilters = {
    category: searchParams.get('category') || undefined,
    search: searchParams.get('search') || undefined,
    minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
    maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
    marketType: (searchParams.get('marketType') as 'kilo' | 'carton') || undefined,
    isFeatured: searchParams.get('featured') === 'true' ? true : undefined,
    isNewArrival: searchParams.get('new') === 'true' ? true : undefined,
    inStock: searchParams.get('inStock') === 'true' ? true : undefined,
  };

  // Call all hooks BEFORE any conditional returns
  const {
    products,
    loading,
    error,
    filters,
    pagination,
    sortBy,
    updateFilters,
    resetFilters,
    updateSort,
    goToPage,
    nextPage,
    prevPage,
  } = useProductList(initialFilters);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/products');
    }
  }, [status, router]);

  // Fetch categories and price range
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch categories
        const categoriesRes = await fetch('/api/categories');
        const categoriesData = await categoriesRes.json();
        if (categoriesData.success) {
          setCategories(categoriesData.categories);
        }

        // Fetch price range from all products
        const priceRes = await fetch('/api/products?page=1&limit=1000');
        const priceData = await priceRes.json();
        
        // Check if products exist and have data
        const productsList = priceData.products || priceData.data || [];
        
        if (priceData.success && productsList.length > 0) {
          const prices = productsList.flatMap((p: any) => {
            const priceList = [];
            if (p.pricing?.kilo?.price) priceList.push(p.pricing.kilo.price);
            if (p.pricing?.carton?.price) priceList.push(p.pricing.carton.price);
            return priceList;
          });
          
          if (prices.length > 0) {
            const min = Math.floor(Math.min(...prices) / 1000) * 1000;
            const max = Math.ceil(Math.max(...prices) / 1000) * 1000;
            setPriceRange({ min, max });
          }
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };
    fetchData();
  }, []);

  // Debounced search - auto search as user types
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== filters.search) {
        updateFilters({ search: searchQuery || undefined });
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Show loading while checking auth
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (status === 'unauthenticated') {
    return null;
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(price);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Our Products
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Quality frozen foods delivered straight to your doorstep
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8">
          <div className="max-w-md mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <Input
                type="text"
                placeholder="Search for products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            {searchQuery && (
              <p className="text-sm text-gray-500 mt-2 text-center">
                Searching for "{searchQuery}"...
              </p>
            )}
          </div>
        </div>

        {/* Category Filter */}
        {categories.length > 0 && (
          <div className="mb-8 flex flex-wrap gap-2">
            <Button
              variant={filters.category === undefined ? 'default' : 'outline'}
              onClick={() => updateFilters({ category: undefined })}
            >
              All Categories
            </Button>
            {categories.map((category) => (
              <Button
                key={category._id.toString()}
                variant={filters.category === category._id.toString() ? 'default' : 'outline'}
                onClick={() => updateFilters({ category: category._id.toString() })}
              >
                {category.name}
              </Button>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters - Sticky on desktop */}
          <aside className="lg:w-64 flex-shrink-0">
            <div className="lg:sticky lg:top-24">
              <ProductFilters
                categories={categories}
                filters={filters}
                onFiltersChange={updateFilters}
                onReset={resetFilters}
                priceRange={priceRange}
              />
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {/* Sort */}
            <div className="mb-6 flex items-center justify-between">
              <p className="text-gray-600">
                Showing {pagination.total} products
              </p>
              <ProductSort
                value={sortBy}
                onChange={updateSort}
              />
            </div>

            {/* Products Grid */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
              </div>
            ) : (
              <ProductGrid
                products={products}
                onAddToCart={(product) => {
                  const primaryMarket = product.availableMarkets[0] || 'kilo';
                  const pricing = product.pricing[primaryMarket];
                  const inventory = product.inventory[primaryMarket];
                  const marketType = primaryMarket as 'kilo' | 'carton';
                  
                  // Calculate max quantity based on inventory tracking
                  const maxQuantity = inventory.trackInventory ? inventory.stock : pricing.maxQuantity || 999;
                  
                  addItem({
                    productId: product._id.toString(),
                    name: product.name,
                    price: pricing.price,
                    quantity: 1,
                    marketType,
                    image: product.images?.find((img: any) => img.isPrimary)?.url,
                    maxQuantity: maxQuantity,
                    inStock: !inventory.trackInventory || inventory.stock > 0,
                  });
                  // Toast notification handled by cart store
                }}
              />
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                hasNext={pagination.hasNext}
                hasPrev={pagination.hasPrev}
                onPageChange={goToPage}
              />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
