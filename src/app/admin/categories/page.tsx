'use client';

import { useState, useEffect } from 'react';
import { ICategory } from '@/types';
import { CategoryTree } from '@/components/admin/CategoryTree';
import { CategoryModal, CategoryFormData } from '@/components/admin/CategoryModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Plus,
  Search,
  Download,
  RefreshCw,
  FolderTree,
  List,
} from 'lucide-react';

/**
 * Admin Categories Management Page
 * Manage category hierarchy with tree view
 */
export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<ICategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'tree' | 'list'>('tree');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ICategory | null>(null);
  const [parentId, setParentId] = useState<string>('');

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    // Filter categories based on search
    if (search.trim()) {
      const filtered = categories.filter((cat) =>
        cat.name.toLowerCase().includes(search.toLowerCase())
      );
      setFilteredCategories(filtered);
    } else {
      setFilteredCategories(categories);
    }
  }, [search, categories]);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/categories?includeInactive=true');
      const data = await response.json();

      if (data.success) {
        setCategories(data.categories);
        setFilteredCategories(data.categories);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    setEditingCategory(null);
    setParentId('');
    setIsModalOpen(true);
  };

  const handleAddChild = (parentCategoryId: string) => {
    setEditingCategory(null);
    setParentId(parentCategoryId);
    setIsModalOpen(true);
  };

  const handleEdit = (category: ICategory) => {
    setEditingCategory(category);
    setParentId('');
    setIsModalOpen(true);
  };

  const handleDelete = async (category: ICategory) => {
    const hasProducts = category.productCount && category.productCount > 0;
    const hasChildren = categories.some((cat) => {
      const parent = typeof cat.parent === 'string' 
        ? cat.parent 
        : (cat.parent as any)?._id?.toString();
      return parent === category._id.toString();
    });

    let confirmMessage = `Delete "${category.name}"?`;
    if (hasChildren) {
      confirmMessage += '\n\nThis category has subcategories. They will also be deleted.';
    }
    if (hasProducts) {
      confirmMessage += `\n\nThis category has ${category.productCount} products. They will be moved to "Uncategorized".`;
    }
    confirmMessage += '\n\nThis action cannot be undone.';

    if (!confirm(confirmMessage)) return;

    try {
      const response = await fetch(`/api/categories/${category._id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        fetchCategories();
      } else {
        alert(result.error || 'Failed to delete category');
      }
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Failed to delete category');
    }
  };

  const handleModalSubmit = async (data: CategoryFormData) => {
    try {
      const url = editingCategory
        ? `/api/categories/${editingCategory._id}`
        : '/api/categories';
      
      const method = editingCategory ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        setIsModalOpen(false);
        setEditingCategory(null);
        setParentId('');
        fetchCategories();
      } else {
        alert(result.error || 'Failed to save category');
      }
    } catch (error) {
      console.error('Save failed:', error);
      alert('Failed to save category');
    }
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Slug', 'Status', 'Featured', 'Product Count', 'Parent'];
    const rows = categories.map((cat) => [
      cat.name,
      cat.slug,
      cat.isActive ? 'Active' : 'Inactive',
      cat.isFeatured ? 'Yes' : 'No',
      cat.productCount || 0,
      typeof cat.parent === 'object' ? (cat.parent as any)?.name || '' : '',
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `categories-${Date.now()}.csv`;
    a.click();
  };

  const getCategoryStats = () => {
    const total = categories.length;
    const active = categories.filter((cat) => cat.isActive).length;
    const featured = categories.filter((cat) => cat.isFeatured).length;
    const topLevel = categories.filter((cat) => !cat.parent).length;

    return { total, active, featured, topLevel };
  };

  const stats = getCategoryStats();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Categories</h1>
              <p className="text-gray-600">Manage your product category hierarchy</p>
            </div>
            <Button onClick={handleAddNew} className="btn-modern">
              <Plus size={18} className="mr-2" />
              Add Category
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-sm text-gray-600">Total Categories</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-sm text-gray-600">Featured</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.featured}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-sm text-gray-600">Top Level</p>
              <p className="text-2xl font-bold text-blue-600">{stats.topLevel}</p>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex items-center justify-between gap-4">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search categories..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode(viewMode === 'tree' ? 'list' : 'tree')}
              >
                {viewMode === 'tree' ? (
                  <>
                    <List size={16} className="mr-2" />
                    List View
                  </>
                ) : (
                  <>
                    <FolderTree size={16} className="mr-2" />
                    Tree View
                  </>
                )}
              </Button>
              <Button variant="outline" size="sm" onClick={fetchCategories}>
                <RefreshCw size={16} className="mr-2" />
                Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={exportToCSV}>
                <Download size={16} className="mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>

        {/* Category Tree/List */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          {loading ? (
            <div className="text-center py-12">
              <RefreshCw size={48} className="animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading categories...</p>
            </div>
          ) : filteredCategories.length > 0 ? (
            <CategoryTree
              categories={filteredCategories}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onAddChild={handleAddChild}
            />
          ) : (
            <div className="text-center py-12">
              <FolderTree size={48} className="text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">
                {search ? 'No categories found matching your search' : 'No categories yet'}
              </p>
              {!search && (
                <Button onClick={handleAddNew} className="btn-modern">
                  <Plus size={18} className="mr-2" />
                  Create Your First Category
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Category Modal */}
      <CategoryModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingCategory(null);
          setParentId('');
        }}
        onSubmit={handleModalSubmit}
        category={editingCategory}
        parentId={parentId}
        categories={categories}
      />
    </div>
  );
}
