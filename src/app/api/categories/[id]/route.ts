import { NextRequest, NextResponse } from 'next/server';
import { CategoryService } from '@/lib/services/categoryService';
import { updateCategorySchema } from '@/lib/validation/categoryValidation';
import { requireAdmin } from '@/lib/serverAuth';

/**
 * GET /api/categories/[id] - Get single category by ID or slug
 * Public endpoint
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const includeDescendants = searchParams.get('includeDescendants') === 'true';

    if (includeDescendants) {
      const result = await CategoryService.getCategoryWithDescendants(id);
      
      if (!result) {
        return NextResponse.json(
          { error: 'Category not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        ...result,
      });
    }

    const category = await CategoryService.getCategory(id);

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      category,
    });
  } catch (error) {
    console.error('Get category error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch category. Please try again.' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/categories/[id] - Update category (Admin only)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check admin authentication
    const { error } = await requireAdmin();
    if (error) return error;

    const { id } = await params;
    const body = await request.json();

    // Validate input
    const validatedData = updateCategorySchema.parse(body);

    // Update category
    const category = await CategoryService.updateCategory(id, validatedData as any);

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Category updated successfully',
      category,
    });
  } catch (error: any) {
    console.error('Update category error:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    if (
      error.message === 'Parent category not found' ||
      error.message.includes('Maximum category depth') ||
      error.message.includes('cannot be its own parent') ||
      error.message.includes('Circular reference')
    ) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update category. Please try again.' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/categories/[id] - Delete category (Admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check admin authentication
    const { error } = await requireAdmin();
    if (error) return error;

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const deleteProducts = searchParams.get('deleteProducts') === 'true';

    const deleted = await CategoryService.deleteCategory(id, deleteProducts);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete category error:', error);

    if (
      error.message.includes('Cannot delete category with subcategories') ||
      error.message.includes('Cannot delete category with') ||
      error.message.includes('product')
    ) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to delete category. Please try again.' },
      { status: 500 }
    );
  }
}
