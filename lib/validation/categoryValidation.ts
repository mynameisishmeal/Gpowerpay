import { z } from 'zod';

/**
 * Category Validation Schemas
 * Using Zod for runtime validation
 */

// Create category validation
export const createCategorySchema = z.object({
  name: z.string()
    .min(2, 'Category name must be at least 2 characters')
    .max(100, 'Category name must be 100 characters or less'),
  
  slug: z.string()
    .min(1, 'Slug is required')
    .max(100, 'Slug must be 100 characters or less')
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens')
    .optional(),
  
  description: z.string()
    .max(500, 'Description must be 500 characters or less')
    .optional(),
  
  image: z.string().url('Invalid image URL').optional(),
  
  parent: z.string().optional().nullable(),
  
  order: z.number().int().min(0).default(0),
  
  metaTitle: z.string()
    .max(60, 'Meta title must be 60 characters or less')
    .optional(),
  
  metaDescription: z.string()
    .max(160, 'Meta description must be 160 characters or less')
    .optional(),
  
  metaKeywords: z.array(z.string()).optional(),
  
  isActive: z.boolean().default(true),
  
  isFeatured: z.boolean().default(false),
});

// Update category validation (all fields optional) - FIXED for Zod v4
export const updateCategorySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  slug: z.string().regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().max(500).optional(),
  image: z.string().url().optional(),
  parent: z.string().optional().nullable(),
  order: z.number().int().min(0).optional(),
  metaTitle: z.string().max(60).optional(),
  metaDescription: z.string().max(160).optional(),
  metaKeywords: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
});

// Category ID validation
export const categoryIdSchema = z.object({
  id: z.string().min(1, 'Category ID is required'),
});

// Category filter validation
export const categoryFilterSchema = z.object({
  parent: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  search: z.string().optional(),
});

// Reorder categories validation
export const reorderCategoriesSchema = z.object({
  categoryOrders: z.array(z.object({
    categoryId: z.string(),
    newOrder: z.number().int().min(0),
  })),
});

// Export types
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CategoryFilterInput = z.infer<typeof categoryFilterSchema>;
export type ReorderCategoriesInput = z.infer<typeof reorderCategoriesSchema>;
