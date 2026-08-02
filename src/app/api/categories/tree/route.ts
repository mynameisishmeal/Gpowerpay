import { NextRequest, NextResponse } from 'next/server';
import { CategoryService } from '@/lib/services/categoryService';

/**
 * GET /api/categories/tree - Get category tree structure
 * Public endpoint
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parentId = searchParams.get('parent') || null;

    const tree = await CategoryService.getCategoryTree(parentId);

    return NextResponse.json({
      success: true,
      tree,
    });
  } catch (error) {
    console.error('Get category tree error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch category tree. Please try again.' },
      { status: 500 }
    );
  }
}
