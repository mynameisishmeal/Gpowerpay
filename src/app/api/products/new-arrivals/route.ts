import { NextRequest, NextResponse } from 'next/server';
import { ProductService } from '@/lib/services/productService';

/**
 * GET /api/products/new-arrivals - Get new arrival products
 * Public endpoint
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get('limit')) || 10;

    const products = await ProductService.getNewArrivals(limit);

    return NextResponse.json({
      success: true,
      products,
    });
  } catch (error) {
    console.error('Get new arrivals error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch new arrivals. Please try again.' },
      { status: 500 }
    );
  }
}
