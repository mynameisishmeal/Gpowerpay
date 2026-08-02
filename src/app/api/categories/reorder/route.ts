import { NextRequest, NextResponse } from 'next/server';
import { CategoryService } from '@/lib/services/categoryService';
import { reorderCategoriesSchema } from '@/lib/validation/categoryValidation';
import { requireAdmin } from '@/lib/serverAuth';

/**
 * POST /api/categories/reorder - Reorder categories (Admin only)
 */
export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const { error } = await requireAdmin();
    if (error) return error;

    const body = await request.json();

    // Validate input
    const validatedData = reorderCategoriesSchema.parse(body);

    // Reorder categories - map field names to match service expectation
    const reorderData = validatedData.categoryOrders.map(item => ({
      id: item.categoryId,
      order: item.newOrder
    }));
    await CategoryService.reorderCategories(reorderData);

    return NextResponse.json({
      success: true,
      message: 'Categories reordered successfully',
    });
  } catch (error: any) {
    console.error('Reorder categories error:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to reorder categories. Please try again.' },
      { status: 500 }
    );
  }
}
