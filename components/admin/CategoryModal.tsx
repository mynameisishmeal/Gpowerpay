import { useState, useEffect } from 'react';
import { ICategory } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CategoryFormData) => void;
  category?: ICategory | null;
  parentId?: string;
  categories: ICategory[];
}

export interface CategoryFormData {
  name: string;
  slug: string;
  description: string;
  parent: string;
  status: 'active' | 'inactive';
  isFeatured: boolean;
  seo: {
    title: string;
    description: string;
    keywords: string[];
  };
}

/**
 * CategoryModal Component
 * Modal for adding/editing categories
 */
export function CategoryModal({
  isOpen,
  onClose,
  onSubmit,
  category,
  parentId,
  categories,
}: CategoryModalProps) {
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    slug: '',
    description: '',
    parent: parentId || '',
    status: 'active',
    isFeatured: false,
    seo: {
      title: '',
      description: '',
      keywords: [],
    },
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        slug: category.slug,
        description: category.description || '',
        parent: typeof category.parent === 'string' 
          ? category.parent 
          : (category.parent && typeof category.parent === 'object' && '_id' in category.parent) 
            ? category.parent._id.toString() 
            : '',
        status: category.isActive ? 'active' : 'inactive',
        isFeatured: category.isFeatured || false,
        seo: {
          title: category.metaTitle || '',
          description: category.metaDescription || '',
          keywords: category.metaKeywords || [],
        },
      });
    } else if (parentId) {
      setFormData((prev) => ({ ...prev, parent: parentId }));
    }
  }, [category, parentId]);

  // Auto-generate slug from name
  useEffect(() => {
    if (!category && formData.name && !formData.slug) {
      const autoSlug = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setFormData((prev) => ({ ...prev, slug: autoSlug }));
    }
  }, [formData.name, category]);

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (errors[field]) {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  const updateSEO = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      seo: {
        ...prev.seo,
        [field]: value,
      },
    }));
  };

  const handleKeywordsChange = (value: string) => {
    const keywords = value.split(',').map((kw) => kw.trim()).filter(Boolean);
    updateSEO('keywords', keywords);
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Category name is required';
    }
    if (!formData.slug.trim()) {
      newErrors.slug = 'URL slug is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  if (!isOpen) return null;

  // Get eligible parent categories (exclude self and descendants)
  const eligibleParents = categories.filter((cat) => {
    if (category && cat._id.toString() === category._id.toString()) {
      return false; // Can't be parent of itself
    }
    // Check depth - max 3 levels (parent can only be level 0 or 1)
    const parentDepth = cat.ancestors?.length || 0;
    return parentDepth < 2;
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">
            {category ? 'Edit Category' : 'Add Category'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Category Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category Name <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="e.g., Frozen Chicken"
              className="h-11"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* URL Slug */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              URL Slug <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.slug}
              onChange={(e) => {
                const slug = e.target.value
                  .toLowerCase()
                  .replace(/[^a-z0-9-]/g, '-')
                  .replace(/-+/g, '-');
                handleChange('slug', slug);
              }}
              placeholder="frozen-chicken"
              className="h-11"
            />
            {errors.slug && (
              <p className="mt-1 text-sm text-red-600">{errors.slug}</p>
            )}
          </div>

          {/* Parent Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Parent Category (Optional)
            </label>
            <select
              value={formData.parent}
              onChange={(e) => handleChange('parent', e.target.value)}
              className="w-full h-11 rounded-lg border-gray-300"
            >
              <option value="">None (Top Level)</option>
              {eligibleParents.map((cat) => (
                <option key={cat._id.toString()} value={cat._id.toString()}>
                  {cat.ancestors && cat.ancestors.length > 0 ? '→ ' : ''}
                  {cat.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Maximum 3 levels deep
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Brief description of this category..."
              rows={3}
              className="w-full rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500"
              maxLength={500}
            />
            <p className="mt-1 text-xs text-gray-500">
              {formData.description.length}/500 characters
            </p>
          </div>

          {/* SEO Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              SEO Title
            </label>
            <Input
              value={formData.seo.title}
              onChange={(e) => updateSEO('title', e.target.value)}
              placeholder="Leave blank to use category name"
              className="h-11"
              maxLength={60}
            />
          </div>

          {/* SEO Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              SEO Meta Description
            </label>
            <textarea
              value={formData.seo.description}
              onChange={(e) => updateSEO('description', e.target.value)}
              placeholder="Brief description for search results..."
              rows={2}
              className="w-full rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500"
              maxLength={160}
            />
          </div>

          {/* SEO Keywords */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              SEO Keywords
            </label>
            <Input
              value={formData.seo.keywords.join(', ')}
              onChange={(e) => handleKeywordsChange(e.target.value)}
              placeholder="frozen, chicken, meat"
              className="h-11"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => handleChange('status', e.target.value)}
              className="w-full h-11 rounded-lg border-gray-300"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Featured */}
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={formData.isFeatured}
              onChange={(e) => handleChange('isFeatured', e.target.checked)}
              className="h-4 w-4 text-blue-600 rounded"
            />
            <label className="ml-2 text-sm text-gray-700">
              Feature this category on homepage
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="btn-modern">
              {category ? 'Update Category' : 'Create Category'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
