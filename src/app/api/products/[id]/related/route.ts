import { NextRequest, NextResponse } from 'next/server';
import { ProductService } from '@/lib/services/productService';

/**
 * GET /api/products/[id]/related - Get related products
 * Public endpoint
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get('limit')) || 6;

    const products = await ProductService.getRelatedProducts(id, limit);

    return NextResponse.json({
      success: true,
      products,
    });
  } catch (error) {
    console.error('Get related products error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch related products. Please try again.' },
      { status: 500 }
    );
  }
}
