import { NextRequest, NextResponse } from 'next/server';
import { CategoryService } from '@/lib/services/categoryService';
import { createCategorySchema, categoryFilterSchema } from '@/lib/validation/categoryValidation';
import { requireAdmin } from '@/lib/serverAuth';

/**
 * GET /api/categories - Get all categories
 * Public endpoint
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const filters = {
      parent: searchParams.get('parent') || undefined,
      isActive: searchParams.get('isActive') === 'true' ? true : 
                searchParams.get('isActive') === 'false' ? false : undefined,
      isFeatured: searchParams.get('isFeatured') === 'true' ? true : undefined,
      search: searchParams.get('search') || undefined,
    };

    // Validate filters
    const validatedFilters = categoryFilterSchema.parse(filters);

    let categories;

    if (validatedFilters.search) {
      // Search categories
      categories = await CategoryService.searchCategories(validatedFilters.search);
    } else if (validatedFilters.parent !== undefined) {
      if (validatedFilters.parent === null || validatedFilters.parent === 'null') {
        // Get top-level categories
        categories = await CategoryService.getTopLevelCategories();
      } else {
        // Get categories by parent
        categories = await CategoryService.getCategoriesByParent(validatedFilters.parent);
      }
    } else {
      // Get all categories
      const includeInactive = searchParams.get('includeInactive') === 'true';
      categories = await CategoryService.getAllCategories(includeInactive);
    }

    return NextResponse.json({
      success: true,
      categories,
    });
  } catch (error: any) {
    console.error('Get categories error:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid filters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch categories. Please try again.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/categories - Create new category (Admin only)
 */
export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const { session, error } = await requireAdmin();
    if (error) return error;

    const body = await request.json();

    // Validate input
    const validatedData = createCategorySchema.parse(body);

    // Create category
    const category = await CategoryService.createCategory(
      validatedData as any,
      session!.user!.id
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Category created successfully',
        category,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create category error:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    if (
      error.message === 'Parent category not found' ||
      error.message.includes('Maximum category depth')
    ) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create category. Please try again.' },
      { status: 500 }
    );
  }
}
