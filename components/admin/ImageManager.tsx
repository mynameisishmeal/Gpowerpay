import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Upload,
  X,
  Star,
  Image as ImageIcon,
  AlertCircle,
  Check,
  MoveUp,
  MoveDown,
  ExternalLink,
} from 'lucide-react';
import {
  validateImageUrl,
  getFilenameFromUrl,
  IMAGE_UPLOAD_CONFIG,
} from '@/lib/utils/imageUtils';

interface ProductImage {
  url: string;
  alt: string;
  isPrimary: boolean;
  order?: number;
}

interface ImageManagerProps {
  images: ProductImage[];
  onChange: (images: ProductImage[]) => void;
  maxImages?: number;
}

/**
 * ImageManager Component
 * Comprehensive image management with validation, reordering, and previews
 */
export function ImageManager({
  images,
  onChange,
  maxImages = IMAGE_UPLOAD_CONFIG.maxImages,
}: ImageManagerProps) {
  const [urlInput, setUrlInput] = useState('');
  const [altInput, setAltInput] = useState('');
  const [urlError, setUrlError] = useState('');
  const [validatingUrl, setValidatingUrl] = useState(false);
  const [uploading, setUploading] = useState(false);

  const addImage = async () => {
    setUrlError('');

    // Validate URL format
    const validation = validateImageUrl(urlInput);
    if (!validation.valid) {
      setUrlError(validation.error || 'Invalid image URL');
      return;
    }

    // Check max images limit
    if (images.length >= maxImages) {
      setUrlError(`Maximum ${maxImages} images allowed`);
      return;
    }

    // Check for duplicate URL
    if (images.some((img) => img.url === urlInput.trim())) {
      setUrlError('This image URL is already added');
      return;
    }

    setValidatingUrl(true);

    // Try to load the image to verify it exists
    const img = new window.Image();
    img.onload = () => {
      const newImage: ProductImage = {
        url: urlInput.trim(),
        alt: altInput.trim() || 'Product image',
        isPrimary: images.length === 0, // First image is primary
        order: images.length,
      };

      onChange([...images, newImage]);
      setUrlInput('');
      setAltInput('');
      setValidatingUrl(false);
    };

    img.onerror = () => {
      setUrlError('Failed to load image. Please check the URL.');
      setValidatingUrl(false);
    };

    img.src = urlInput.trim();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      setUrlError('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUrlError('Image size must be less than 5MB');
      return;
    }

    if (images.length >= maxImages) {
      setUrlError(`Maximum ${maxImages} images allowed`);
      return;
    }

    setUploading(true);
    setUrlError('');

    try {
      // Create FormData
      const formData = new FormData();
      formData.append('file', file);

      // Upload to API
      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success && data.url) {
        const newImage: ProductImage = {
          url: data.url,
          alt: altInput.trim() || file.name.replace(/\.[^/.]+$/, ''),
          isPrimary: images.length === 0,
          order: images.length,
        };

        onChange([...images, newImage]);
        setAltInput('');
        
        // Reset file input
        e.target.value = '';
      } else {
        setUrlError(data.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUrlError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    const updated = images.filter((_, i) => i !== index);
    
    // Reorder remaining images
    const reordered = updated.map((img, i) => ({
      ...img,
      order: i,
    }));

    // If we removed the primary image, make the first image primary
    if (reordered.length > 0 && !reordered.some((img) => img.isPrimary)) {
      reordered[0].isPrimary = true;
    }

    onChange(reordered);
  };

  const setPrimary = (index: number) => {
    const updated = images.map((img, i) => ({
      ...img,
      isPrimary: i === index,
    }));
    onChange(updated);
  };

  const updateAlt = (index: number, alt: string) => {
    const updated = images.map((img, i) =>
      i === index ? { ...img, alt } : img
    );
    onChange(updated);
  };

  const moveUp = (index: number) => {
    if (index === 0) return;

    const updated = [...images];
    const temp = updated[index];
    updated[index] = updated[index - 1];
    updated[index - 1] = temp;

    // Update order values
    const reordered = updated.map((img, i) => ({
      ...img,
      order: i,
    }));

    onChange(reordered);
  };

  const moveDown = (index: number) => {
    if (index === images.length - 1) return;

    const updated = [...images];
    const temp = updated[index];
    updated[index] = updated[index + 1];
    updated[index + 1] = temp;

    // Update order values
    const reordered = updated.map((img, i) => ({
      ...img,
      order: i,
    }));

    onChange(reordered);
  };

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-medium mb-1">Image Guidelines</p>
            <ul className="list-disc list-inside space-y-1 text-blue-800">
              <li>Recommended size: 1200×1200px</li>
              <li>Minimum size: 300×300px</li>
              <li>Formats: JPG, PNG, WebP, GIF</li>
              <li>Maximum: {maxImages} images per product</li>
              <li>First image is the primary display image</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Add Image Form */}
      <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
        <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
          <Upload size={18} />
          Add New Image
        </h4>
        
        <div className="space-y-4">
          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Image File
            </label>
            <div className="flex items-center gap-3">
              <label className="flex-1 cursor-pointer">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-400 transition-colors bg-white">
                  <div className="flex items-center justify-center gap-2 text-gray-600">
                    <Upload size={20} />
                    <span className="text-sm font-medium">
                      {uploading ? 'Uploading...' : 'Click to upload or drag & drop'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 text-center mt-1">
                    JPG, PNG, WebP, GIF up to 5MB
                  </p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={uploading || images.length >= maxImages}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 text-gray-500">OR</span>
            </div>
          </div>

          {/* URL Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Image URL
            </label>
            <div className="flex gap-2">
              <Input
                value={urlInput}
                onChange={(e) => {
                  setUrlInput(e.target.value);
                  setUrlError('');
                }}
                placeholder="https://example.com/image.jpg"
                className="h-11 flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => window.open(urlInput, '_blank')}
                disabled={!urlInput.trim()}
                title="Preview URL in new tab"
              >
                <ExternalLink size={16} />
              </Button>
            </div>
            {urlError && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle size={14} />
                {urlError}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Alt Text (for SEO & accessibility)
            </label>
            <Input
              value={altInput}
              onChange={(e) => setAltInput(e.target.value)}
              placeholder="Descriptive text for the image"
              className="h-11"
              maxLength={125}
            />
            <p className="mt-1 text-xs text-gray-500">
              {altInput.length}/125 characters
            </p>
          </div>

          <Button
            type="button"
            onClick={addImage}
            disabled={!urlInput.trim() || validatingUrl || images.length >= maxImages}
            className="btn-modern w-full"
          >
            {validatingUrl ? (
              <>
                <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                Validating...
              </>
            ) : (
              <>
                <Upload size={16} className="mr-2" />
                Add from URL ({images.length}/{maxImages})
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Image Gallery */}
      {images.length > 0 ? (
        <div>
          <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
            <ImageIcon size={18} />
            Uploaded Images ({images.length})
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {images.map((image, index) => (
              <div
                key={index}
                className="relative border-2 rounded-lg p-3 bg-white transition-all hover:border-blue-300"
                style={{
                  borderColor: image.isPrimary ? '#3b82f6' : '#e5e7eb',
                }}
              >
                {/* Primary Badge */}
                {image.isPrimary && (
                  <div className="absolute top-2 left-2 bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded flex items-center gap-1 z-10 shadow-md">
                    <Star size={12} fill="white" />
                    Primary
                  </div>
                )}

                {/* Remove Button */}
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 z-10 shadow-md transition-colors"
                  title="Remove image"
                >
                  <X size={14} />
                </button>

                {/* Image Preview */}
                <div className="relative w-full h-48 mb-3 bg-gray-100 rounded overflow-hidden">
                  <Image
                    src={image.url}
                    alt={image.alt}
                    fill
                    className="object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLElement;
                      target.style.display = 'none';
                      if (target.parentElement) {
                        target.parentElement.classList.add('flex', 'items-center', 'justify-center');
                        target.parentElement.innerHTML = `
                          <div class="text-center">
                            <svg width="48" height="48" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" class="mx-auto text-red-400">
                              <circle cx="12" cy="12" r="10"/>
                              <line x1="12" y1="8" x2="12" y2="12"/>
                              <line x1="12" y1="16" x2="12.01" y2="16"/>
                            </svg>
                            <p class="text-sm text-red-600 mt-2">Failed to load</p>
                          </div>
                        `;
                      }
                    }}
                  />
                </div>

                {/* Image Info */}
                <div className="mb-3 text-xs text-gray-500 truncate">
                  {getFilenameFromUrl(image.url)}
                </div>

                {/* Alt Text Input */}
                <div className="mb-3">
                  <Input
                    value={image.alt}
                    onChange={(e) => updateAlt(index, e.target.value)}
                    placeholder="Alt text"
                    className="text-sm h-9"
                    maxLength={125}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  {!image.isPrimary && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setPrimary(index)}
                      className="flex-1"
                      title="Set as primary image"
                    >
                      <Star size={14} className="mr-1" />
                      Set Primary
                    </Button>
                  )}

                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => moveUp(index)}
                      disabled={index === 0}
                      title="Move up"
                    >
                      <MoveUp size={14} />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => moveDown(index)}
                      disabled={index === images.length - 1}
                      title="Move down"
                    >
                      <MoveDown size={14} />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
          <ImageIcon size={56} className="mx-auto text-gray-400 mb-3" />
          <p className="text-gray-600 mb-1 font-medium">No images added yet</p>
          <p className="text-sm text-gray-500">
            Add at least one image to showcase your product
          </p>
        </div>
      )}
    </div>
  );
}
