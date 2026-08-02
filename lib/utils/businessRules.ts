import { IProduct, MarketType } from '@/types';

/**
 * Business Rules & Validation Utilities
 * Core business logic for products and pricing
 */

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validate product pricing rules
 */
export function validatePricing(product: Partial<IProduct>): ValidationResult {
  const errors: string[] = [];

  if (!product.pricing || !product.availableMarkets) {
    return { valid: false, errors: ['Missing pricing or market data'] };
  }

  // Check kilo pricing
  if (product.availableMarkets.includes('kilo')) {
    if (!product.pricing.kilo.price || product.pricing.kilo.price <= 0) {
      errors.push('Kilo price must be greater than 0');
    }
    if (product.pricing.kilo.compareAtPrice && product.pricing.kilo.compareAtPrice <= product.pricing.kilo.price) {
      errors.push('Kilo compare price must be higher than selling price');
    }
    if (product.pricing.kilo.maxQuantity && product.pricing.kilo.maxQuantity < product.pricing.kilo.minQuantity) {
      errors.push('Kilo max quantity must be greater than min quantity');
    }
  }

  // Check carton pricing
  if (product.availableMarkets.includes('carton')) {
    if (!product.pricing.carton.price || product.pricing.carton.price <= 0) {
      errors.push('Carton price must be greater than 0');
    }
    if (product.pricing.carton.compareAtPrice && product.pricing.carton.compareAtPrice <= product.pricing.carton.price) {
      errors.push('Carton compare price must be higher than selling price');
    }
    if (!product.pricing.carton.unitsPerCarton || product.pricing.carton.unitsPerCarton < 1) {
      errors.push('Units per carton must be at least 1');
    }
    if (product.pricing.carton.maxQuantity && product.pricing.carton.maxQuantity < product.pricing.carton.minQuantity) {
      errors.push('Carton max quantity must be greater than min quantity');
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate inventory rules
 */
export function validateInventory(product: Partial<IProduct>): ValidationResult {
  const errors: string[] = [];

  if (!product.inventory || !product.availableMarkets) {
    return { valid: false, errors: ['Missing inventory or market data'] };
  }

  // Kilo inventory
  if (product.availableMarkets.includes('kilo') && product.inventory.kilo.trackInventory) {
    if (product.inventory.kilo.stock < 0) {
      errors.push('Kilo stock cannot be negative');
    }
    if (product.inventory.kilo.lowStockThreshold < 0) {
      errors.push('Kilo low stock threshold cannot be negative');
    }
  }

  // Carton inventory
  if (product.availableMarkets.includes('carton') && product.inventory.carton.trackInventory) {
    if (product.inventory.carton.stock < 0) {
      errors.push('Carton stock cannot be negative');
    }
    if (product.inventory.carton.lowStockThreshold < 0) {
      errors.push('Carton low stock threshold cannot be negative');
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Check if product is in stock for a market
 */
export function isInStock(product: IProduct, market: MarketType, quantity: number = 1): boolean {
  const inventory = product.inventory[market];
  
  if (!inventory.trackInventory) return true;
  
  return inventory.stock >= quantity;
}

/**
 * Check if product has low stock
 */
export function hasLowStock(product: IProduct, market: MarketType): boolean {
  const inventory = product.inventory[market];
  
  if (!inventory.trackInventory) return false;
  
  return inventory.stock > 0 && inventory.stock <= inventory.lowStockThreshold;
}

/**
 * Calculate discount percentage
 */
export function calculateDiscount(price: number, compareAtPrice: number): number {
  if (!compareAtPrice || compareAtPrice <= price) return 0;
  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
}

/**
 * Validate market availability
 */
export function validateMarketAvailability(product: Partial<IProduct>): ValidationResult {
  const errors: string[] = [];

  if (!product.availableMarkets || product.availableMarkets.length === 0) {
    errors.push('At least one market type must be selected');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Check if product slug is unique (to be called with DB check)
 */
export function validateSlugFormat(slug: string): ValidationResult {
  const errors: string[] = [];

  if (!slug || !slug.trim()) {
    errors.push('Slug is required');
  }

  if (!/^[a-z0-9-]+$/.test(slug)) {
    errors.push('Slug can only contain lowercase letters, numbers, and hyphens');
  }

  if (slug.startsWith('-') || slug.endsWith('-')) {
    errors.push('Slug cannot start or end with a hyphen');
  }

  if (slug.includes('--')) {
    errors.push('Slug cannot contain consecutive hyphens');
  }

  if (slug.length < 3) {
    errors.push('Slug must be at least 3 characters long');
  }

  if (slug.length > 100) {
    errors.push('Slug cannot exceed 100 characters');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Comprehensive product validation
 */
export function validateProduct(product: Partial<IProduct>): ValidationResult {
  const allErrors: string[] = [];

  // Validate pricing
  const pricingResult = validatePricing(product);
  if (!pricingResult.valid) {
    allErrors.push(...pricingResult.errors);
  }

  // Validate inventory
  const inventoryResult = validateInventory(product);
  if (!inventoryResult.valid) {
    allErrors.push(...inventoryResult.errors);
  }

  // Validate market availability
  const marketResult = validateMarketAvailability(product);
  if (!marketResult.valid) {
    allErrors.push(...marketResult.errors);
  }

  // Validate slug if present
  if (product.seo?.slug) {
    const slugResult = validateSlugFormat(product.seo.slug);
    if (!slugResult.valid) {
      allErrors.push(...slugResult.errors);
    }
  }

  // Validate images
  if (product.images && product.images.length === 0) {
    allErrors.push('At least one product image is required');
  }

  return { valid: allErrors.length === 0, errors: allErrors };
}

/**
 * Business rule: Auto-update product status based on stock
 */
export function getAutoStatus(product: IProduct): IProduct['status'] {
  // If manually set to draft or inactive, keep it
  if (product.status === 'draft' || product.status === 'inactive') {
    return product.status;
  }

  // Check if any market has stock
  const hasStock = product.availableMarkets.some((market) => {
    const inv = product.inventory[market];
    return !inv.trackInventory || inv.stock > 0;
  });

  return hasStock ? 'active' : 'out_of_stock';
}

/**
 * Calculate total available stock value
 */
export function calculateStockValue(product: IProduct): number {
  let total = 0;

  if (product.availableMarkets.includes('kilo') && product.inventory.kilo.trackInventory) {
    total += product.inventory.kilo.stock * product.pricing.kilo.price;
  }

  if (product.availableMarkets.includes('carton') && product.inventory.carton.trackInventory) {
    total += product.inventory.carton.stock * product.pricing.carton.price;
  }

  return total;
}

/**
 * Check if price is competitive (has discount)
 */
export function isCompetitivePrice(product: IProduct, market: MarketType): boolean {
  const pricing = product.pricing[market];
  return (pricing.compareAtPrice || 0) > pricing.price;
}
