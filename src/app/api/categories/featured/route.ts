import { NextRequest, NextResponse } from 'next/server';
import { CategoryService } from '@/lib/services/categoryService';

/**
 * GET /api/categories/featured - Get featured categories
 * Public endpoint
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get('limit')) || 6;

    const categories = await CategoryService.getFeaturedCategories(limit);

    return NextResponse.json({
      success: true,
      categories,
    });
  } catch (error) {
    console.error('Get featured categories error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch featured categories. Please try again.' },
      { status: 500 }
    );
  }
}
