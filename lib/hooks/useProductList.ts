import { useState, useEffect, useCallback } from 'react';
import { IProduct, IProductFilters, IPaginatedResponse } from '@/types';

/**
 * Custom hook for managing product list state
 * Handles fetching, filtering, sorting, and pagination
 */
export function useProductList(initialFilters: IProductFilters = {}) {
  const [products, setProducts] = useState<IProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<IProductFilters>(initialFilters);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [sortBy, setSortBy] = useState('createdAt-desc');

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Build query params
      const params = new URLSearchParams();

      // Add filters
      if (filters.category) params.append('category', filters.category);
      if (filters.minPrice) params.append('minPrice', filters.minPrice.toString());
      if (filters.maxPrice) params.append('maxPrice', filters.maxPrice.toString());
      if (filters.marketType) params.append('marketType', filters.marketType);
      if (filters.brand) params.append('brand', filters.brand);
      if (filters.search) params.append('search', filters.search);
      if (filters.isFeatured) params.append('isFeatured', 'true');
      if (filters.isNewArrival) params.append('isNewArrival', 'true');
      if (filters.inStock) params.append('inStock', 'true');

      // Add pagination
      params.append('page', pagination.page.toString());
      params.append('limit', pagination.limit.toString());

      // Add sorting
      const [field, order] = sortBy.split('-');
      params.append('sortBy', field);
      params.append('sortOrder', order);

      const response = await fetch(`/api/products?${params.toString()}`);
      const data: { success: boolean; data: IProduct[]; pagination: any } = await response.json();

      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }

      setProducts(data.data);
      setPagination(data.pagination);
    } catch (err: any) {
      setError(err.message || 'Failed to load products');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.limit, sortBy]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const updateFilters = (newFilters: Partial<IProductFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setPagination((prev) => ({ ...prev, page: 1 })); // Reset to first page
  };

  const resetFilters = () => {
    setFilters({});
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const updateSort = (newSort: string) => {
    setSortBy(newSort);
    setPagination((prev) => ({ ...prev, page: 1 })); // Reset to first page
  };

  const goToPage = (page: number) => {
    setPagination((prev) => ({ ...prev, page }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const nextPage = () => {
    if (pagination.hasNext) {
      goToPage(pagination.page + 1);
    }
  };

  const prevPage = () => {
    if (pagination.hasPrev) {
      goToPage(pagination.page - 1);
    }
  };

  return {
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
    refetch: fetchProducts,
  };
}
