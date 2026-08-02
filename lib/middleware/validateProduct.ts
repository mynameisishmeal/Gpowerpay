import { NextResponse } from 'next/server';
import { validateProduct } from '@/lib/utils/businessRules';
import { IProduct } from '@/types';

/**
 * Middleware to validate product data before save
 */
export function validateProductMiddleware(productData: Partial<IProduct>) {
  const validation = validateProduct(productData);

  if (!validation.valid) {
    return NextResponse.json(
      {
        success: false,
        error: 'Validation failed',
        errors: validation.errors,
      },
      { status: 400 }
    );
  }

  return null; // No errors
}
