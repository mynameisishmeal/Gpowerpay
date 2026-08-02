import { NextRequest, NextResponse } from 'next/server';
import { ProductService } from '@/lib/services/productService';
import { updateProductSchema } from '@/lib/validation/productValidation';
import { requireAdmin } from '@/lib/serverAuth';

/**
 * GET /api/products/[id] - Get single product by ID or slug
 * Public endpoint
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const product = await ProductService.getProduct(id);

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Increment view count (async, don't wait)
    ProductService.incrementViewCount(product._id.toString()).catch(console.error);

    return NextResponse.json({
      success: true,
      product,
    });
  } catch (error) {
    console.error('Get product error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product. Please try again.' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/products/[id] - Update product (Admin only)
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
    const validatedData = updateProductSchema.parse(body);

    // Update product
    const product = await ProductService.updateProduct(id, validatedData as any);

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Product updated successfully',
      product,
    });
  } catch (error: any) {
    console.error('Update product error:', error);

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
      { error: 'Failed to update product. Please try again.' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/products/[id] - Delete product (Admin only)
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

    const deleted = await ProductService.deleteProduct(id);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    console.error('Delete product error:', error);
    return NextResponse.json(
      { error: 'Failed to delete product. Please try again.' },
      { status: 500 }
    );
  }
}
