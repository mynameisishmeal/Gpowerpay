import { z } from 'zod';

/**
 * Product Validation Schemas
 * Using Zod for runtime validation
 */

// Pricing validation
const pricingSchema = z.object({
  kilo: z.object({
    price: z.number().min(0, 'Kilo price must be positive'),
    compareAtPrice: z.number().min(0).optional(),
    minQuantity: z.number().min(1).transform(val => Math.floor(val)).default(1),
    maxQuantity: z.number().min(1).transform(val => Math.floor(val)).optional(),
  }),
  carton: z.object({
    price: z.number().min(0, 'Carton price must be positive'),
    compareAtPrice: z.number().min(0).optional(),
    minQuantity: z.number().min(1).transform(val => Math.floor(val)).default(1),
    maxQuantity: z.number().min(1).transform(val => Math.floor(val)).optional(),
    unitsPerCarton: z.number().min(1, 'Units per carton must be at least 1').transform(val => Math.floor(val)),
  }),
});

// Inventory validation
const inventorySchema = z.object({
  kilo: z.object({
    stock: z.number().min(0).transform(val => Math.floor(val)).default(0),
    lowStockThreshold: z.number().min(0).transform(val => Math.floor(val)).default(10),
    trackInventory: z.boolean().default(true),
  }),
  carton: z.object({
    stock: z.number().min(0).transform(val => Math.floor(val)).default(0),
    lowStockThreshold: z.number().min(0).transform(val => Math.floor(val)).default(5),
    trackInventory: z.boolean().default(true),
  }),
});

// Product image validation
const productImageSchema = z.object({
  url: z.string().url('Invalid image URL'),
  alt: z.string().optional(),
  isPrimary: z.boolean().default(false),
  order: z.number().min(0).transform(val => Math.floor(val)).default(0),
});

// SEO validation
const seoSchema = z.object({
  metaTitle: z.string().max(60, 'Meta title must be 60 characters or less').optional(),
  metaDescription: z.string().max(160, 'Meta description must be 160 characters or less').optional(),
  metaKeywords: z.array(z.string()).optional(),
  slug: z.string().min(1, 'Slug is required')
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
});

// Dimensions validation
const dimensionsSchema = z.object({
  length: z.number().min(0),
  width: z.number().min(0),
  height: z.number().min(0),
}).optional();

// Create product validation
export const createProductSchema = z.object({
  name: z.string()
    .min(2, 'Product name must be at least 2 characters')
    .max(200, 'Product name must be 200 characters or less'),
  
  shortDescription: z.string()
    .max(250, 'Short description must be 250 characters or less')
    .optional(),
  
  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(5000, 'Description must be 5000 characters or less'),
  
  category: z.string().min(1, 'Category is required'),
  
  tags: z.array(z.string()).default([]),
  
  pricing: pricingSchema,
  
  inventory: inventorySchema,
  
  availableMarkets: z.array(z.enum(['kilo', 'carton']))
    .min(1, 'At least one market type is required'),
  
  images: z.array(productImageSchema)
    .min(1, 'At least one image is required')
    .max(10, 'Maximum 10 images allowed'),
  
  videoUrl: z.string().url('Invalid video URL').optional(),
  
  seo: seoSchema,
  
  brand: z.string().max(100).optional(),
  
  sku: z.string()
    .max(50)
    .regex(/^[A-Z0-9-]+$/, 'SKU must contain only uppercase letters, numbers, and hyphens')
    .optional(),
  
  barcode: z.string().max(50).optional(),
  
  weight: z.number().min(0).optional(),
  
  dimensions: dimensionsSchema,
  
  status: z.enum(['draft', 'active', 'inactive', 'out_of_stock']).default('draft'),
  
  isFeatured: z.boolean().default(false),
  
  isNewArrival: z.boolean().default(false),
  
  relatedProducts: z.array(z.string()).default([]),
}).refine(
  (data) => {
    // Validate that available markets match pricing
    const hasKilo = data.availableMarkets.includes('kilo');
    const hasCarton = data.availableMarkets.includes('carton');
    
    if (hasKilo && data.pricing.kilo.price <= 0) {
      return false;
    }
    
    if (hasCarton && data.pricing.carton.price <= 0) {
      return false;
    }
    
    return true;
  },
  {
    message: 'Pricing must be set for all available markets',
  }
);

// Update product validation (all fields optional)
export const updateProductSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  shortDescription: z.string().max(250).optional(),
  description: z.string().min(1).max(5000).optional(),
  category: z.string().optional(),
  brand: z.string().optional(),
  sku: z.string().optional(),
  tags: z.array(z.string()).optional(),
  availableMarkets: z.array(z.enum(['kilo', 'carton'])).optional(),
  pricing: pricingSchema.optional(),
  inventory: inventorySchema.optional(),
  images: z.array(productImageSchema).optional(),
  slug: z.string().optional(),
  seo: seoSchema.partial().optional(),
  status: z.enum(['draft', 'active', 'inactive', 'out_of_stock']).optional(),
  isFeatured: z.boolean().optional(),
  isNewArrival: z.boolean().optional(),
  relatedProducts: z.array(z.string()).optional(),
});

// Product filter validation
export const productFilterSchema = z.object({
  category: z.string().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  marketType: z.string().optional(), // Changed from enum to accept comma-separated values
  brand: z.string().optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(['draft', 'active', 'inactive', 'out_of_stock']).optional(),
  isFeatured: z.coerce.boolean().optional(),
  isNewArrival: z.coerce.boolean().optional(),
  inStock: z.coerce.boolean().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(1000).default(20), // Increased to 1000
  sortBy: z.enum(['createdAt', 'name', 'price', 'salesCount', 'averageRating']).optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Product ID validation
export const productIdSchema = z.object({
  id: z.string().min(1, 'Product ID is required'),
});

// Bulk operations validation
export const bulkProductOperationSchema = z.object({
  productIds: z.array(z.string()).min(1, 'At least one product ID is required'),
  operation: z.enum(['delete', 'activate', 'deactivate', 'feature', 'unfeature']),
});

// Stock update validation
export const updateStockSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  marketType: z.enum(['kilo', 'carton']),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  operation: z.enum(['add', 'subtract', 'set']),
});

// Export types
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductFilterInput = z.infer<typeof productFilterSchema>;
export type BulkProductOperationInput = z.infer<typeof bulkProductOperationSchema>;
export type UpdateStockInput = z.infer<typeof updateStockSchema>;
