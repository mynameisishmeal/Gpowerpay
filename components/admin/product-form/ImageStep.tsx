import { ImageManager } from '@/components/admin/ImageManager';

interface ProductImage {
  url: string;
  alt: string;
  isPrimary: boolean;
  order?: number;
}

interface ImageStepProps {
  data: {
    images: ProductImage[];
  };
  onChange: (field: string, value: any) => void;
}

/**
 * ImageStep Component
 * Step 4: Product images upload and management
 */
export function ImageStep({ data, onChange }: ImageStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Product Images
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          Add high-quality images to showcase your product. The primary image appears first in listings.
        </p>
      </div>

      <ImageManager
        images={data.images}
        onChange={(images) => onChange('images', images)}
      />
    </div>
  );
}
