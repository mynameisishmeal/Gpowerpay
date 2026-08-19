import { NextRequest, NextResponse } from 'next/server';
import { ProductService } from '@/lib/services/productService';
import { productFilterSchema, createProductSchema } from '@/lib/validation/productValidation';
import { requireAdmin } from '@/lib/serverAuth';

/**
 * GET /api/products - Get all products with filters
 * Public endpoint for customers, requires auth for admin filters
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters - use || undefined to convert null to undefined
    const filters = {
      category: searchParams.get('category') || undefined,
      minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
      maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
      marketType: searchParams.get('marketType') || undefined, // Fixed: converts null to undefined
      brand: searchParams.get('brand') || undefined,
      tags: searchParams.get('tags')?.split(',') || undefined,
      status: searchParams.get('status') || undefined,
      isFeatured: searchParams.get('isFeatured') === 'true' ? true : undefined,
      isNewArrival: searchParams.get('isNewArrival') === 'true' ? true : undefined,
      inStock: searchParams.get('inStock') === 'true' ? true : undefined,
      search: searchParams.get('search') || undefined,
    };

    const pagination = {
      page: Number(searchParams.get('page')) || 1,
      limit: Math.min(Number(searchParams.get('limit')) || 20, 1000), // Cap at 1000
    };

    // Validate filters
    const validatedFilters = productFilterSchema.parse({ ...filters, ...pagination });

    // Get products
    const result = await ProductService.getProducts(validatedFilters as any, pagination);
    
    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error('❌ Get products error:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    if (error.name === 'ZodError') {
      console.error('Zod errors:', JSON.stringify(error.errors, null, 2));
    }
    console.error('=== END ERROR ===\n');
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid filters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch products. Please try again.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/products - Create new product (Admin only)
 */
export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const { session, error } = await requireAdmin();
    if (error) return error;

    const body = await request.json();

    // Validate input
    const validatedData = createProductSchema.parse(body);

    // Create product
    const product = await ProductService.createProduct(
      validatedData as any,
      session!.user!.id
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Product created successfully',
        product,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create product error:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    if (error.message === 'Category not found') {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create product. Please try again.' },
      { status: 500 }
    );
  }
}
