import LegacyProduct from '@/models/LegacyProduct';
import LegacyStock from '@/models/LegacyStock';
import Category from '@/models/Category';
import connectDB from '@/lib/mongodb';
import { IProductFilters, IPaginationParams, IPaginatedResponse, IProduct } from '@/types';
import { ProductAdapter } from '@/lib/adapters/productAdapter';

/**
 * Product Service Layer
 * Handles business logic for product operations
 * ADAPTED TO WORK WITH DUAL LEGACY SCHEMA (products + stocks)
 */

export class ProductService {
  /**
   * Get all products with filters and pagination
   * MERGES BOTH products (kilo) AND stocks (carton) collections
   */
  static async getProducts(
    filters: IProductFilters = {},
    pagination: IPaginationParams = { page: 1, limit: 20 }
  ): Promise<IPaginatedResponse<IProduct>> {
    await connectDB();

    console.log('📦 ProductService.getProducts called (DUAL LEGACY MODE)');
    console.log('Filters received:', JSON.stringify(filters, null, 2));
    console.log('Pagination received:', pagination);

    // Determine which collections to query based on marketType filter
    const shouldQueryKilo = !filters.marketType || filters.marketType === 'kilo';
    const shouldQueryCarton = !filters.marketType || filters.marketType === 'carton';

    console.log(`🔍 Query strategy: kilo=${shouldQueryKilo}, carton=${shouldQueryCarton}`);

    let allProducts: IProduct[] = [];
    let totalCount = 0;

    // Query KILO products if needed
    if (shouldQueryKilo) {
      const kiloQuery = ProductAdapter.buildKiloQuery(filters);
      console.log('Kilo query:', JSON.stringify(kiloQuery, null, 2));
      
      const [kiloProducts, kiloCount] = await Promise.all([
        LegacyProduct.find(kiloQuery).sort({ productname: 1 }).lean(),
        LegacyProduct.countDocuments(kiloQuery),
      ]);

      console.log(`✅ Found ${kiloProducts.length} kilo products`);
      
      const converted = kiloProducts.map(p => ProductAdapter.kiloToNewFormat(p)) as any[];
      allProducts = allProducts.concat(converted);
      totalCount += kiloCount;
    }

    // Query CARTON stocks if needed
    if (shouldQueryCarton) {
      const cartonQuery = ProductAdapter.buildCartonQuery(filters);
      console.log('Carton query:', JSON.stringify(cartonQuery, null, 2));
      
      const [cartonStocks, cartonCount] = await Promise.all([
        LegacyStock.find(cartonQuery).sort({ stockname: 1 }).lean(),
        LegacyStock.countDocuments(cartonQuery),
      ]);

      console.log(`✅ Found ${cartonStocks.length} carton stocks`);
      
      const converted = cartonStocks.map(s => ProductAdapter.cartonToNewFormat(s)) as any[];
      allProducts = allProducts.concat(converted);
      totalCount += cartonCount;
    }

    // Sort combined results by name
    allProducts.sort((a, b) => a.name.localeCompare(b.name));

    console.log(`📊 Total products before pagination: ${allProducts.length}`);

    // Apply pagination to combined results
    const page = Math.max(1, pagination.page);
    const limit = Math.min(1000, Math.max(1, pagination.limit));
    const skip = (page - 1) * limit;

    const paginatedProducts = allProducts.slice(skip, skip + limit);

    console.log(`📄 After pagination: returning ${paginatedProducts.length} products (page ${page})`);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);

    return {
      data: paginatedProducts,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Get single product by ID or slug
   */
  static async getProduct(identifier: string): Promise<IProduct | null> {
    await connectDB();

    console.log('🔍 ProductService.getProduct - identifier:', identifier);

    // Check if it's a composite ID (kilo-xxx or carton-xxx)
    const compositeIdMatch = identifier.match(/^(kilo|carton)-([0-9a-fA-F]{24})$/);
    
    if (compositeIdMatch) {
      const [, marketType, objectId] = compositeIdMatch;
      console.log('📦 Composite ID detected:', { marketType, objectId });
      
      if (marketType === 'kilo') {
        const kiloProduct = await LegacyProduct.findById(objectId).lean();
        if (kiloProduct) {
          console.log('✅ Found kilo product:', kiloProduct.productname);
          return ProductAdapter.kiloToNewFormat(kiloProduct) as any;
        }
      } else if (marketType === 'carton') {
        const cartonStock = await LegacyStock.findById(objectId).lean();
        if (cartonStock) {
          console.log('✅ Found carton stock:', cartonStock.stockname);
          return ProductAdapter.cartonToNewFormat(cartonStock) as any;
        }
      }
      
      console.log('❌ Product not found for composite ID');
      return null;
    }
    
    // Check if identifier is a valid ObjectId
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(identifier);
    
    // Try kilo products first
    const kiloQuery = isValidObjectId 
      ? { $or: [{ _id: identifier }, { productname: { $regex: new RegExp(`^${identifier}$`, 'i') } }] }
      : { productname: { $regex: new RegExp(`^${identifier.replace(/-/g, ' ')}$`, 'i') } };
    
    const kiloProduct = await LegacyProduct.findOne(kiloQuery).lean();

    if (kiloProduct) {
      console.log('✅ Found kilo product by query:', kiloProduct.productname);
      return ProductAdapter.kiloToNewFormat(kiloProduct) as any;
    }

    // Try carton stocks
    const cartonQuery = isValidObjectId
      ? { $or: [{ _id: identifier }, { stockname: { $regex: new RegExp(`^${identifier}$`, 'i') } }] }
      : { stockname: { $regex: new RegExp(`^${identifier.replace(/-/g, ' ')}$`, 'i') } };
    
    const cartonStock = await LegacyStock.findOne(cartonQuery).lean();

    if (cartonStock) {
      console.log('✅ Found carton stock by query:', cartonStock.stockname);
      return ProductAdapter.cartonToNewFormat(cartonStock) as any;
    }

    console.log('❌ Product not found');
    return null;
  }

  /**
   * Create new product
   */
  static async createProduct(data: Partial<IProduct>, createdBy: string): Promise<IProduct> {
    await connectDB();

    // Validate category exists
    if (data.category) {
      const category = await Category.findById(data.category);
      if (!category) {
        throw new Error('Category not found');
      }
    }

    // NOTE: Create/Update/Delete operations not supported with legacy schema
    throw new Error('Product creation not supported with legacy database schema');
  }

  /**
   * Update product
   */
  static async updateProduct(
    productId: string,
    data: Partial<IProduct>
  ): Promise<IProduct | null> {
    await connectDB();

    console.log('🔧 ProductService.updateProduct - productId:', productId);

    // Check if it's a composite ID (kilo-xxx or carton-xxx)
    const compositeIdMatch = productId.match(/^(kilo|carton)-([0-9a-fA-F]{24})$/);
    
    if (compositeIdMatch) {
      const [, marketType, objectId] = compositeIdMatch;
      console.log('📦 Updating legacy product:', { marketType, objectId });
      
      if (marketType === 'kilo') {
        // Update kilo product in LegacyProduct collection
        const updateData: any = {};
        
        if (data.name) updateData.productname = data.name;
        if (data.description) updateData.productdescription = data.description;
        if (data.brand) updateData.productbrand = data.brand;
        if (data.pricing?.kilo?.price) updateData.productprice = data.pricing.kilo.price;
        if (data.inventory?.kilo?.stock !== undefined) updateData.productquantity = data.inventory.kilo.stock;
        if (data.images && data.images.length > 0) {
          updateData.productimage = data.images[0].url;
        }
        
        const updated = await LegacyProduct.findByIdAndUpdate(
          objectId,
          { $set: updateData },
          { new: true }
        ).lean();
        
        if (updated) {
          console.log('✅ Kilo product updated');
          return ProductAdapter.kiloToNewFormat(updated) as any;
        }
      } else if (marketType === 'carton') {
        // Update carton stock in LegacyStock collection
        const updateData: any = {};
        
        if (data.name) updateData.stockname = data.name;
        if (data.pricing?.carton?.price) updateData.stockprice = data.pricing.carton.price;
        if (data.inventory?.carton?.stock !== undefined) updateData.stockquantity = data.inventory.carton.stock;
        if (data.images && data.images.length > 0) {
          updateData.stockimage = data.images[0].url;
          console.log('📸 Setting stockimage to:', data.images[0].url);
        }
        
        console.log('📝 Update data for carton:', updateData);
        
        const updated = await LegacyStock.findByIdAndUpdate(
          objectId,
          { $set: updateData },
          { new: true, strict: false }
        ).lean();
        
        if (updated) {
          console.log('✅ Carton stock updated:', updated);
          
          // Verify the stockimage was actually saved
          const verification = await LegacyStock.findById(objectId).lean();
          console.log('🔍 Verification query result:', verification);
          
          return ProductAdapter.cartonToNewFormat(updated) as any;
        }
      }
    }

    console.log('❌ Product not found for update');
    return null;
  }

  /**
   * Delete product
   */
  static async deleteProduct(productId: string): Promise<boolean> {
    await connectDB();

    // NOTE: Delete not supported with legacy schema
    throw new Error('Product deletion not supported with legacy database schema');
  }

  /**
   * Increment product view count
   */
  static async incrementViewCount(productId: string): Promise<void> {
    // NOTE: View count tracking not supported with legacy schema
    // This is a no-op
    return;
  }

  /**
   * Get featured products
   * NOTE: Legacy DB doesn't have featured/new flags, returning first products as featured
   */
  static async getFeaturedProducts(limit = 10): Promise<IProduct[]> {
    await connectDB();
    
    // Get mix of kilo and carton products as "featured"
    const kiloProducts = await LegacyProduct.find().sort({ productname: 1 }).limit(Math.ceil(limit / 2)).lean();
    const cartonProducts = await LegacyStock.find({ stockquantity: { $gt: 0 } }).sort({ stockname: 1 }).limit(Math.floor(limit / 2)).lean();
    
    const featured: any[] = [
      ...kiloProducts.map(p => ProductAdapter.kiloToNewFormat(p)),
      ...cartonProducts.map(s => ProductAdapter.cartonToNewFormat(s)),
    ];
    
    return featured.slice(0, limit) as IProduct[];
  }

  /**
   * Get new arrivals
   * NOTE: Legacy DB doesn't have new arrival flags, returning recent products
   */
  static async getNewArrivals(limit = 10): Promise<IProduct[]> {
    await connectDB();
    
    // Get mix of kilo and carton products sorted by regtime/name
    const kiloProducts = await LegacyProduct.find().sort({ productname: -1 }).limit(Math.ceil(limit / 2)).lean();
    const cartonProducts = await LegacyStock.find({ stockquantity: { $gt: 0 } }).sort({ regtime: -1 }).limit(Math.floor(limit / 2)).lean();
    
    const newArrivals: any[] = [
      ...kiloProducts.map(p => ProductAdapter.kiloToNewFormat(p)),
      ...cartonProducts.map(s => ProductAdapter.cartonToNewFormat(s)),
    ];
    
    return newArrivals.slice(0, limit) as IProduct[];
  }

  /**
   * Get related products
   */
  static async getRelatedProducts(
    productId: string,
    limit = 6
  ): Promise<IProduct[]> {
    await connectDB();

    // NOTE: Related products not fully supported with legacy schema
    // Return some random products as related
    const kiloProducts = await LegacyProduct.find().limit(limit).lean();
    return kiloProducts.map(p => ProductAdapter.kiloToNewFormat(p)) as any[];
  }

  /**
   * Get products by category (including subcategories)
   */
  static async getProductsByCategory(
    categoryId: string,
    pagination: IPaginationParams = { page: 1, limit: 20 }
  ): Promise<IPaginatedResponse<IProduct>> {
    await connectDB();

    // Get category and its descendants
    const category = await Category.findById(categoryId);
    if (!category) {
      throw new Error('Category not found');
    }

    const descendants = await Category.find({ ancestors: { $in: [categoryId] } } as any);
    const categoryIds = [categoryId, ...descendants.map(d => d._id)];

    return this.getProducts(
      { category: { $in: categoryIds } as any, status: 'active' },
      pagination
    );
  }

  /**
   * Update product stock after sale
   */
  static async updateStockAfterSale(
    productId: string,
    marketType: 'kilo' | 'carton',
    quantity: number
  ): Promise<void> {
    await connectDB();

    // NOTE: Stock management not supported with legacy schema
    // This is a no-op
    return;
  }
}
