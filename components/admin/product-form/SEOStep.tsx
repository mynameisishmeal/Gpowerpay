import { Input } from '@/components/ui/input';
import { useEffect } from 'react';

interface SEOStepProps {
  data: {
    name: string;
    slug: string;
    seo: {
      title: string;
      description: string;
      keywords: string[];
    };
    status: 'draft' | 'active' | 'inactive' | 'out_of_stock';
    isFeatured: boolean;
  };
  onChange: (field: string, value: any) => void;
  errors?: Record<string, string>;
}

/**
 * SEOStep Component
 * Step 5: SEO settings and publishing options
 */
export function SEOStep({ data, onChange, errors = {} }: SEOStepProps) {
  // Auto-generate slug from product name
  useEffect(() => {
    if (!data.slug && data.name) {
      const autoSlug = data.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      onChange('slug', autoSlug);
    }
  }, [data.name]);

  const updateSEO = (field: string, value: any) => {
    onChange('seo', {
      ...data.seo,
      [field]: value,
    });
  };

  const handleKeywordsChange = (value: string) => {
    const keywords = value.split(',').map((kw) => kw.trim()).filter(Boolean);
    updateSEO('keywords', keywords);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          SEO & Publishing
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          Optimize your product for search engines and set publishing options
        </p>
      </div>

      {/* URL Slug */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          URL Slug <span className="text-red-500">*</span>
        </label>
        <Input
          value={data.slug}
          onChange={(e) => {
            const slug = e.target.value
              .toLowerCase()
              .replace(/[^a-z0-9-]/g, '-')
              .replace(/-+/g, '-');
            onChange('slug', slug);
          }}
          placeholder="frozen-chicken-wings"
          className="h-11"
        />
        <p className="mt-1 text-xs text-gray-500">
          URL: /products/{data.slug || 'your-product-slug'}
        </p>
        {errors.slug && (
          <p className="mt-1 text-sm text-red-600">{errors.slug}</p>
        )}
      </div>

      {/* SEO Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          SEO Title
        </label>
        <Input
          value={data.seo.title}
          onChange={(e) => updateSEO('title', e.target.value)}
          placeholder="Leave blank to use product name"
          className="h-11"
          maxLength={60}
        />
        <p className="mt-1 text-xs text-gray-500">
          {data.seo.title.length}/60 characters (recommended)
        </p>
      </div>

      {/* SEO Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          SEO Meta Description
        </label>
        <textarea
          value={data.seo.description}
          onChange={(e) => updateSEO('description', e.target.value)}
          placeholder="Brief description for search results..."
          rows={3}
          className="w-full rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500"
          maxLength={160}
        />
        <p className="mt-1 text-xs text-gray-500">
          {data.seo.description.length}/160 characters (recommended)
        </p>
      </div>

      {/* SEO Keywords */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          SEO Keywords
        </label>
        <Input
          value={data.seo.keywords.join(', ')}
          onChange={(e) => handleKeywordsChange(e.target.value)}
          placeholder="frozen, chicken, wings, food"
          className="h-11"
        />
        <p className="mt-1 text-xs text-gray-500">
          Separate keywords with commas
        </p>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200 my-6" />

      {/* Publishing Status */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Publishing Status <span className="text-red-500">*</span>
        </label>
        <select
          value={data.status}
          onChange={(e) => onChange('status', e.target.value)}
          className="w-full h-11 rounded-lg border-gray-300"
        >
          <option value="draft">Draft (not visible to customers)</option>
          <option value="active">Active (visible and purchasable)</option>
          <option value="inactive">Inactive (not visible)</option>
        </select>
        <p className="mt-1 text-xs text-gray-500">
          Choose when customers can see and purchase this product
        </p>
      </div>

      {/* Featured Product */}
      <div className="border border-gray-200 rounded-lg p-4">
        <label className="flex items-start">
          <input
            type="checkbox"
            checked={data.isFeatured}
            onChange={(e) => onChange('isFeatured', e.target.checked)}
            className="mt-1 h-4 w-4 text-blue-600 rounded"
          />
          <div className="ml-3">
            <span className="text-sm font-medium text-gray-900">
              Feature this product
            </span>
            <p className="text-xs text-gray-500 mt-1">
              Featured products appear in special sections on the homepage
            </p>
          </div>
        </label>
      </div>

      {/* Preview Card */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-3">
          Search Engine Preview
        </h4>
        <div className="space-y-1">
          <p className="text-blue-600 text-sm">
            {data.seo.title || data.name || 'Product Title'}
          </p>
          <p className="text-green-700 text-xs">
            gpowerpay.com/products/{data.slug || 'product-slug'}
          </p>
          <p className="text-gray-600 text-xs">
            {data.seo.description || 'No meta description provided'}
          </p>
        </div>
      </div>
    </div>
  );
}
