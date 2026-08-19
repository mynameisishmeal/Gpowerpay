'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { IProduct, ICategory } from '@/types';
import { DataTable } from '@/components/admin/DataTable';
import { BulkActions } from '@/components/admin/BulkActions';
import { Pagination } from '@/components/ui/pagination';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { StockBadge } from '@/components/products/StockBadge';
import { formatPrice, formatDate } from '@/lib/utils/formatters';
import { useConfirm } from '@/lib/hooks/useConfirm';
import toast from 'react-hot-toast';
import {
  Search,
  Plus,
  Filter,
  Download,
  Edit,
  Trash2,
  Package,
} from 'lucide-react';

/**
 * Admin Products Management Page
 * Manage all products with bulk operations
 */
export default function AdminProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<IProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const { confirm, ConfirmDialog } = useConfirm();

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Sorting
  const [sortKey, setSortKey] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Fetch products
  useEffect(() => {
    fetchProducts();
  }, [page, search, statusFilter, sortKey, sortDirection]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        sortBy: sortKey,
        sortOrder: sortDirection,
        includeInactive: 'true',
      });

      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);

      const response = await fetch(`/api/products?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setProducts(data.data);
        setTotal(data.pagination.total);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (key: string, direction: 'asc' | 'desc') => {
    setSortKey(key);
    setSortDirection(direction);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(products.map((p) => p._id.toString())));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
  };

  const handleBulkUpdate = async (updates: any) => {
    if (selectedIds.size === 0) return;

    try {
      const promises = Array.from(selectedIds).map((id) =>
        fetch(`/api/products/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        })
      );

      await Promise.all(promises);
      setSelectedIds(new Set());
      toast.success('Products updated successfully');
      fetchProducts();
    } catch (error) {
      console.error('Bulk update failed:', error);
      toast.error('Failed to update products');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;

    const confirmed = await confirm({
      title: 'Delete Products',
      message: `Delete ${selectedIds.size} products? This cannot be undone.`,
      confirmText: 'Delete',
      variant: 'danger'
    });

    if (!confirmed) return;

    try {
      const promises = Array.from(selectedIds).map((id) =>
        fetch(`/api/products/${id}`, { method: 'DELETE' })
      );

      await Promise.all(promises);
      setSelectedIds(new Set());
      toast.success('Products deleted successfully');
      fetchProducts();
    } catch (error) {
      console.error('Bulk delete failed:', error);
      toast.error('Failed to delete products');
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: 'Delete Product',
      message: 'Delete this product? This cannot be undone.',
      confirmText: 'Delete',
      variant: 'danger'
    });
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Product deleted successfully');
        fetchProducts();
      } else {
        toast.error('Failed to delete product');
      }
    } catch (error) {
      console.error('Delete failed:', error);
      toast.error('Failed to delete product');
    }
  };

  const exportToCSV = () => {
    // Simple CSV export
    const headers = ['Name', 'Status', 'Price', 'Market Type', 'Stock'];
    const rows = products.map((p) => {
      const isKilo = p.availableMarkets.includes('kilo');
      const isCarton = p.availableMarkets.includes('carton');
      const price = isKilo ? p.pricing.kilo.price : p.pricing.carton.price;
      const stock = isKilo ? p.inventory.kilo.stock : p.inventory.carton.stock;
      const marketType = isKilo ? 'Kilo' : 'Carton';
      
      return [
        p.name,
        p.status,
        price,
        marketType,
        stock,
      ];
    });

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `products-${Date.now()}.csv`;
    a.click();
  };

  const columns = [
    {
      key: 'select',
      label: '', // Empty string instead of JSX checkbox
      render: (product: IProduct) => (
        <input
          type="checkbox"
          checked={selectedIds.has(product._id.toString())}
          onChange={(e) => handleSelectOne(product._id.toString(), e.target.checked)}
          className="rounded"
        />
      ),
      width: '50px',
    },
    {
      key: 'image',
      label: 'Image',
      render: (product: IProduct) => {
        const primaryImage = product.images?.find((img) => img.isPrimary) || product.images?.[0];
        return primaryImage ? (
          <Image
            src={primaryImage.url}
            alt={product.name}
            width={50}
            height={50}
            className="rounded object-cover"
          />
        ) : (
          <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
            <Package size={20} className="text-gray-400" />
          </div>
        );
      },
      width: '80px',
    },
    {
      key: 'name',
      label: 'Product Name',
      sortable: true,
      render: (product: IProduct) => (
        <div>
          <Link
            href={`/admin/products/${product._id}/edit`}
            className="font-medium text-blue-600 hover:underline"
          >
            {product.name}
          </Link>
          {product.brand && (
            <p className="text-xs text-gray-500">Brand: {product.brand}</p>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (product: IProduct) => {
        const statusColors: Record<string, string> = {
          active: 'bg-green-100 text-green-800',
          draft: 'bg-gray-100 text-gray-800',
          inactive: 'bg-red-100 text-red-800',
          out_of_stock: 'bg-yellow-100 text-yellow-800',
        };
        return (
          <span
            className={`px-2 py-1 text-xs font-medium rounded-full ${
              statusColors[product.status] || 'bg-gray-100 text-gray-800'
            }`}
          >
            {product.status.replace('_', ' ')}
          </span>
        );
      },
    },
    {
      key: 'price',
      label: 'Price',
      sortable: true,
      render: (product: IProduct) => {
        // Show the correct price based on available market
        if (product.availableMarkets.includes('kilo') && product.pricing.kilo.price > 0) {
          return (
            <div>
              <div>{formatPrice(product.pricing.kilo.price)}</div>
              <div className="text-xs text-gray-500">per Kilo</div>
            </div>
          );
        } else if (product.availableMarkets.includes('carton') && product.pricing.carton.price > 0) {
          return (
            <div>
              <div>{formatPrice(product.pricing.carton.price)}</div>
              <div className="text-xs text-gray-500">per Carton</div>
            </div>
          );
        }
        return formatPrice(0);
      },
    },
    {
      key: 'stock',
      label: 'Market Type',
      render: (product: IProduct) => {
        const isKilo = product.availableMarkets.includes('kilo');
        const isCarton = product.availableMarkets.includes('carton');
        
        return (
          <div className="space-y-1">
            {isKilo && (
              <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                Kilo
              </span>
            )}
            {isCarton && (
              <span className="inline-block px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                Carton
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'createdAt',
      label: 'Created',
      sortable: true,
      render: (product: IProduct) => formatDate(product.createdAt),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (product: IProduct) => (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/admin/products/${product._id}/edit`)}
          >
            <Edit size={14} />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDelete(product._id.toString())}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 size={14} />
          </Button>
        </div>
      ),
      width: '120px',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Products</h1>
              <p className="text-gray-600">Manage your product catalog</p>
            </div>
            <Link href="/admin/products/new">
              <Button className="btn-modern">
                <Plus size={18} className="mr-2" />
                Add Product
              </Button>
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search products..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full h-10 rounded-lg border-gray-300 text-sm"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="inactive">Inactive</option>
                <option value="out_of_stock">Out of Stock</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <p className="text-sm text-gray-600">
              {total} products found
            </p>
            <Button variant="outline" size="sm" onClick={exportToCSV}>
              <Download size={16} className="mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedIds.size > 0 && (
          <div className="mb-4">
            <BulkActions
              selectedCount={selectedIds.size}
              onActivate={() => handleBulkUpdate({ status: 'active' })}
              onDeactivate={() => handleBulkUpdate({ status: 'inactive' })}
              onFeature={() => handleBulkUpdate({ isFeatured: true })}
              onUnfeature={() => handleBulkUpdate({ isFeatured: false })}
              onDelete={handleBulkDelete}
            />
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <DataTable
            columns={columns}
            data={products}
            onSort={handleSort}
            sortKey={sortKey}
            sortDirection={sortDirection}
            loading={loading}
            emptyMessage="No products found"
          />
        </div>

        {/* Pagination */}
        {!loading && products.length > 0 && (
          <div className="mt-6">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
              hasNext={page < totalPages}
              hasPrev={page > 1}
            />
          </div>
        )}
      </div>
      <ConfirmDialog />
    </div>
  );
}
