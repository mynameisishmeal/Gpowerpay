import { Input } from '@/components/ui/input';
import { ICategory } from '@/types';

interface BasicInfoStepProps {
  data: {
    name: string;
    shortDescription: string;
    description: string;
    brand: string;
    sku: string;
    tags: string[];
  };
  categories: ICategory[];
  onChange: (field: string, value: any) => void;
  errors?: Record<string, string>;
}

/**
 * BasicInfoStep Component
 * Step 1: Basic product information
 */
export function BasicInfoStep({
  data,
  categories,
  onChange,
  errors = {},
}: BasicInfoStepProps) {
  const handleTagsChange = (value: string) => {
    const tags = value.split(',').map((tag) => tag.trim()).filter(Boolean);
    onChange('tags', tags);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Basic Information
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          Enter the basic details about your product
        </p>
      </div>

      {/* Product Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Product Name <span className="text-red-500">*</span>
        </label>
        <Input
          value={data.name}
          onChange={(e) => onChange('name', e.target.value)}
          placeholder="e.g., Frozen Chicken Wings"
          className="h-11"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name}</p>
        )}
      </div>

      {/* Brand */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Brand (Optional)
        </label>
        <Input
          value={data.brand}
          onChange={(e) => onChange('brand', e.target.value)}
          placeholder="e.g., Farm Fresh"
          className="h-11"
        />
      </div>

      {/* SKU */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          SKU (Optional)
        </label>
        <Input
          value={data.sku}
          onChange={(e) => onChange('sku', e.target.value.toUpperCase())}
          placeholder="e.g., CW-001"
          className="h-11"
        />
        <p className="mt-1 text-xs text-gray-500">
          Stock Keeping Unit - leave blank to auto-generate
        </p>
      </div>

      {/* Short Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Short Description
        </label>
        <Input
          value={data.shortDescription}
          onChange={(e) => onChange('shortDescription', e.target.value)}
          placeholder="Brief product description (shown in listing)"
          className="h-11"
          maxLength={250}
        />
        <p className="mt-1 text-xs text-gray-500">
          {data.shortDescription.length}/250 characters
        </p>
      </div>

      {/* Full Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Full Description <span className="text-red-500">*</span>
        </label>
        <textarea
          value={data.description}
          onChange={(e) => onChange('description', e.target.value)}
          placeholder="Detailed product description..."
          rows={6}
          className="w-full rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500"
          maxLength={5000}
        />
        <p className="mt-1 text-xs text-gray-500">
          {data.description.length}/5000 characters
        </p>
        {errors.description && (
          <p className="mt-1 text-sm text-red-600">{errors.description}</p>
        )}
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tags (Optional)
        </label>
        <Input
          value={data.tags.join(', ')}
          onChange={(e) => handleTagsChange(e.target.value)}
          placeholder="e.g., frozen, chicken, wings"
          className="h-11"
        />
        <p className="mt-1 text-xs text-gray-500">
          Separate tags with commas for better search
        </p>
      </div>
    </div>
  );
}
