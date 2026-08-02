import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Product from '@/models/Product';

/**
 * GET /api/products/search
 * Enhanced product search with MongoDB text search and autocomplete
 */
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const autocomplete = searchParams.get('autocomplete') === 'true';
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!query.trim()) {
      return NextResponse.json({
        success: false,
        error: 'Search query is required',
      }, { status: 400 });
    }

    // Autocomplete mode: Return simple suggestions
    if (autocomplete) {
      const suggestions = await Product.find(
        {
          $text: { $search: query },
          status: 'active',
        },
        {
          score: { $meta: 'textScore' },
          name: 1,
          'seo.slug': 1,
          'images.url': 1,
          'images.isPrimary': 1,
        }
      )
        .sort({ score: { $meta: 'textScore' } })
        .limit(limit);

      const results = suggestions.map((product) => {
        const primaryImage = product.images?.find((img: any) => img.isPrimary) || product.images?.[0];
        return {
          _id: product._id,
          name: product.name,
          slug: product.seo.slug,
          image: primaryImage?.url,
        };
      });

      return NextResponse.json({
        success: true,
        results,
        count: results.length,
      });
    }

    // Full search mode: Return detailed results with filters
    const category = searchParams.get('category');
    const minPrice = parseFloat(searchParams.get('minPrice') || '0');
    const maxPrice = parseFloat(searchParams.get('maxPrice') || '999999');
    const brand = searchParams.get('brand');
    const inStock = searchParams.get('inStock') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const pageLimit = parseInt(searchParams.get('limit') || '20');

    // Build search filter
    const filter: any = {
      $text: { $search: query },
      status: 'active',
    };

    // Additional filters
    if (category) {
      filter.category = category;
    }

    if (brand) {
      filter.brand = { $regex: new RegExp(brand, 'i') };
    }

    if (minPrice > 0 || maxPrice < 999999) {
      filter.$or = [
        {
          'pricing.kilo.price': { $gte: minPrice, $lte: maxPrice },
        },
        {
          'pricing.carton.price': { $gte: minPrice, $lte: maxPrice },
        },
      ];
    }

    if (inStock) {
      filter.$or = [
        {
          'inventory.kilo.trackInventory': false,
        },
        {
          'inventory.kilo.trackInventory': true,
          'inventory.kilo.stock': { $gt: 0 },
        },
        {
          'inventory.carton.trackInventory': false,
        },
        {
          'inventory.carton.trackInventory': true,
          'inventory.carton.stock': { $gt: 0 },
        },
      ];
    }

    // Execute search with pagination
    const skip = (page - 1) * pageLimit;

    const [products, total] = await Promise.all([
      Product.find(filter, {
        score: { $meta: 'textScore' },
      })
        .populate('category', 'name slug')
        .sort({ score: { $meta: 'textScore' }, salesCount: -1 })
        .skip(skip)
        .limit(pageLimit)
        .lean(),
      Product.countDocuments(filter),
    ]);

    return NextResponse.json({
      success: true,
      data: products,
      pagination: {
        page,
        limit: pageLimit,
        total,
        totalPages: Math.ceil(total / pageLimit),
        hasNext: page < Math.ceil(total / pageLimit),
        hasPrev: page > 1,
      },
      query: {
        searchTerm: query,
        category,
        brand,
        priceRange: { min: minPrice, max: maxPrice },
        inStock,
      },
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to search products',
      },
      { status: 500 }
    );
  }
}
