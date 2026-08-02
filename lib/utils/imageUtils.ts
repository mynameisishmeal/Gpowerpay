/**
 * Image Utility Functions
 * Helpers for image validation, optimization, and management
 */

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
}

export interface ImageDimensions {
  width: number;
  height: number;
}

/**
 * Validate image URL
 */
export function validateImageUrl(url: string): ImageValidationResult {
  if (!url || !url.trim()) {
    return { valid: false, error: 'Image URL is required' };
  }

  // Check if valid URL
  try {
    new URL(url);
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }

  // Check image extension
  const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
  const hasValidExtension = validExtensions.some((ext) =>
    url.toLowerCase().includes(ext)
  );

  if (!hasValidExtension) {
    return {
      valid: false,
      error: 'URL must point to an image file (jpg, png, gif, webp, svg)',
    };
  }

  return { valid: true };
}

/**
 * Check if image URL is accessible
 */
export async function checkImageAccessibility(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Get image dimensions from URL
 */
export function getImageDimensions(url: string): Promise<ImageDimensions> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    img.src = url;
  });
}

/**
 * Generate thumbnail URL (placeholder for CDN integration)
 */
export function getThumbnailUrl(url: string, size: 'sm' | 'md' | 'lg' = 'md'): string {
  // For now, return original URL
  // In production, this would use a CDN or image service
  // e.g., Cloudinary: url.replace('/upload/', '/upload/w_300,h_300,c_fill/')
  return url;
}

/**
 * Optimize image URL for performance (placeholder)
 */
export function optimizeImageUrl(
  url: string,
  options?: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'jpg' | 'png';
  }
): string {
  // Placeholder for future CDN integration
  // This would transform the URL to include optimization parameters
  return url;
}

/**
 * Generate placeholder image URL
 */
export function getPlaceholderImage(
  width: number = 400,
  height: number = 400,
  text: string = 'Product'
): string {
  return `https://via.placeholder.com/${width}x${height}/e2e8f0/64748b?text=${encodeURIComponent(
    text
  )}`;
}

/**
 * Extract filename from URL
 */
export function getFilenameFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    return pathname.substring(pathname.lastIndexOf('/') + 1);
  } catch {
    return 'image';
  }
}

/**
 * Check if URL is from allowed domains (security)
 */
export function isAllowedImageDomain(url: string): boolean {
  const allowedDomains = [
    'via.placeholder.com',
    'images.unsplash.com',
    'picsum.photos',
    'cloudinary.com',
    'amazonaws.com',
    'googleusercontent.com',
    // Add your CDN/storage domains here
  ];

  try {
    const urlObj = new URL(url);
    return allowedDomains.some((domain) =>
      urlObj.hostname.includes(domain)
    );
  } catch {
    return false;
  }
}

/**
 * Sort images by order and primary flag
 */
export function sortImages<T extends { order?: number; isPrimary?: boolean }>(
  images: T[]
): T[] {
  return [...images].sort((a, b) => {
    // Primary image comes first
    if (a.isPrimary && !b.isPrimary) return -1;
    if (!a.isPrimary && b.isPrimary) return 1;

    // Then sort by order
    const orderA = a.order ?? 0;
    const orderB = b.order ?? 0;
    return orderA - orderB;
  });
}

/**
 * Validate image dimensions
 */
export async function validateImageDimensions(
  url: string,
  minWidth: number = 300,
  minHeight: number = 300
): Promise<ImageValidationResult> {
  try {
    const dimensions = await getImageDimensions(url);

    if (dimensions.width < minWidth || dimensions.height < minHeight) {
      return {
        valid: false,
        error: `Image must be at least ${minWidth}x${minHeight}px (current: ${dimensions.width}x${dimensions.height}px)`,
      };
    }

    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: 'Failed to validate image dimensions',
    };
  }
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Generate image alt text from product name
 */
export function generateAltText(
  productName: string,
  variant?: string
): string {
  let alt = productName;
  if (variant) {
    alt += ` - ${variant}`;
  }
  return alt;
}

/**
 * Image upload configuration (for future use)
 */
export const IMAGE_UPLOAD_CONFIG = {
  maxFileSize: 5 * 1024 * 1024, // 5MB
  allowedFormats: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  maxImages: 10,
  minDimensions: {
    width: 300,
    height: 300,
  },
  recommendedDimensions: {
    width: 1200,
    height: 1200,
  },
  thumbnailSizes: {
    small: { width: 150, height: 150 },
    medium: { width: 400, height: 400 },
    large: { width: 800, height: 800 },
  },
};

/**
 * Placeholder for future cloud upload function
 * This would integrate with services like:
 * - Cloudinary
 * - AWS S3
 * - Google Cloud Storage
 * - Azure Blob Storage
 */
export async function uploadImageToCloud(
  file: File
): Promise<{ url: string; publicId: string }> {
  // TODO: Implement actual cloud upload
  // For now, return a placeholder
  throw new Error('Cloud upload not yet implemented');
}
