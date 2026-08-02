import { ILegacyProduct } from '@/models/LegacyProduct';
import { ILegacyStock } from '@/models/LegacyStock';
import { IProduct } from '@/types';

/**
 * Product Adapter - Converts legacy DB schema to new application interface
 * Handles BOTH products (kilo) and stocks (carton) collections
 */

export class ProductAdapter {
  /**
   * Convert legacy KILO product to new product interface
   */
  static kiloToNewFormat(legacy: ILegacyProduct): Partial<IProduct> {
    const slug = legacy.productname
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const price = Number(legacy.productprice) || 0;

    return {
      _id: `kilo-${legacy._id}` as any,
      name: legacy.productname,
      shortDescription: `${legacy.productname} - Sold by kilogram`,
      description: `High quality ${legacy.productname}. Fresh and carefully preserved. Available for purchase by the kilogram.`,
      
      category: null as any,
      tags: ['frozen', 'kilo'],
      
      // Kilo product - only kilo pricing available
      pricing: {
        kilo: {
          price: price,
          compareAtPrice: price * 1.2,
          minQuantity: 1,
          maxQuantity: 100,
        },
        carton: {
          price: 0, // Not available in carton
          compareAtPrice: 0,
          minQuantity: 0,
          maxQuantity: 0,
          unitsPerCarton: 0,
        },
      },
      
      inventory: {
        kilo: {
          stock: 100,
          lowStockThreshold: 10,
          trackInventory: false,
        },
        carton: {
          stock: 0,
          lowStockThreshold: 0,
          trackInventory: false,
        },
      },
      
      availableMarkets: ['kilo'], // Only kilo available
      
      images: [
        {
          url: legacy.productimage || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI2Y4ZjlmYSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM5Y2ExYWEiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5Qcm9kdWN0IEltYWdlPC90ZXh0Pjwvc3ZnPg==',
          alt: legacy.productname,
          isPrimary: true,
          order: 0,
        },
      ],
      
      seo: {
        slug: slug,
        metaTitle: legacy.productname,
        metaDescription: `Buy ${legacy.productname} by the kilo online`,
        metaKeywords: ['frozen', 'kilo', legacy.productname],
      },
      
      brand: 'Gpower',
      weight: legacy.productweight || 1,
      status: 'active',
      isFeatured: false,
      isNewArrival: false,
      salesCount: 0,
      viewCount: 0,
      averageRating: 0,
      reviewCount: 0,
      relatedProducts: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Convert legacy CARTON stock to new product interface
   */
  static cartonToNewFormat(legacy: ILegacyStock): Partial<IProduct> {
    const slug = legacy.stockname
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const price = Number(legacy.stockprice) || 0;
    const quantity = Number(legacy.stockquantity) || 0;

    return {
      _id: `carton-${legacy._id}` as any,
      name: legacy.stockname,
      shortDescription: `${legacy.stockname} - Sold by carton`,
      description: `High quality ${legacy.stockname}. Fresh and carefully preserved. Available for purchase by the carton.`,
      
      category: null as any,
      tags: ['frozen', 'carton'],
      
      // Carton product - only carton pricing available
      pricing: {
        kilo: {
          price: 0, // Not available in kilo
          compareAtPrice: 0,
          minQuantity: 0,
          maxQuantity: 0,
        },
        carton: {
          price: price,
          compareAtPrice: price * 1.15,
          minQuantity: 1,
          maxQuantity: 50,
          unitsPerCarton: legacy.stockweight || 10,
        },
      },
      
      inventory: {
        kilo: {
          stock: 0,
          lowStockThreshold: 0,
          trackInventory: false,
        },
        carton: {
          stock: quantity,
          lowStockThreshold: 5,
          trackInventory: true, // Track carton inventory
        },
      },
      
      availableMarkets: ['carton'], // Only carton available
      
      images: [
        {
          url: legacy.stockimage || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI2Y4ZjlmYSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM5Y2ExYWEiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5Qcm9kdWN0IEltYWdlPC90ZXh0Pjwvc3ZnPg==',
          alt: legacy.stockname,
          isPrimary: true,
          order: 0,
        },
      ],
      
      seo: {
        slug: slug,
        metaTitle: legacy.stockname,
        metaDescription: `Buy ${legacy.stockname} by the carton online`,
        metaKeywords: ['frozen', 'carton', legacy.stockname],
      },
      
      brand: 'Gpower',
      weight: legacy.stockweight || 10,
      status: quantity > 0 ? 'active' : 'out_of_stock',
      isFeatured: false,
      isNewArrival: false,
      salesCount: 0,
      viewCount: 0,
      averageRating: 0,
      reviewCount: 0,
      relatedProducts: [],
      createdAt: legacy.regtime || new Date(),
      updatedAt: legacy.regtime || new Date(),
    };
  }

  /**
   * Build query for legacy KILO products schema
   */
  static buildKiloQuery(filters: any): any {
    const query: any = {};

    // Price filter
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      query.productprice = {};
      if (filters.minPrice !== undefined) {
        query.productprice.$gte = filters.minPrice;
      }
      if (filters.maxPrice !== undefined) {
        query.productprice.$lte = filters.maxPrice;
      }
    }

    // Text search on product name
    if (filters.search) {
      query.productname = { $regex: filters.search, $options: 'i' };
    }

    return query;
  }

  /**
   * Build query for legacy CARTON stocks schema
   */
  static buildCartonQuery(filters: any): any {
    const query: any = {};

    // Price filter
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      query.stockprice = {};
      if (filters.minPrice !== undefined) {
        query.stockprice.$gte = filters.minPrice;
      }
      if (filters.maxPrice !== undefined) {
        query.stockprice.$lte = filters.maxPrice;
      }
    }

    // Text search on stock name
    if (filters.search) {
      query.stockname = { $regex: filters.search, $options: 'i' };
    }

    // Stock filter - only show in-stock items if requested
    if (filters.inStock) {
      query.stockquantity = { $gt: 0 };
    }

    return query;
  }
}
