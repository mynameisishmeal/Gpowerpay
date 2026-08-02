import mongoose, { Schema, Model } from 'mongoose';
import { IProduct, MarketType } from '@/types';

// Sub-schemas for better organization
const PricingSchema = new Schema({
  kilo: {
    price: { type: Number, required: true, min: 0 },
    compareAtPrice: { type: Number, min: 0 },
    minQuantity: { type: Number, default: 1, min: 1 },
    maxQuantity: { type: Number, min: 1 },
  },
  carton: {
    price: { type: Number, required: true, min: 0 },
    compareAtPrice: { type: Number, min: 0 },
    minQuantity: { type: Number, default: 1, min: 1 },
    maxQuantity: { type: Number, min: 1 },
    unitsPerCarton: { type: Number, required: true, min: 1 },
  },
}, { _id: false });

const InventorySchema = new Schema({
  kilo: {
    stock: { type: Number, default: 0, min: 0 },
    lowStockThreshold: { type: Number, default: 10, min: 0 },
    trackInventory: { type: Boolean, default: true },
  },
  carton: {
    stock: { type: Number, default: 0, min: 0 },
    lowStockThreshold: { type: Number, default: 5, min: 0 },
    trackInventory: { type: Boolean, default: true },
  },
}, { _id: false });

const ProductImageSchema = new Schema({
  url: { type: String, required: true },
  alt: { type: String },
  isPrimary: { type: Boolean, default: false },
  order: { type: Number, default: 0 },
}, { _id: false });

const ProductSEOSchema = new Schema({
  metaTitle: { 
    type: String,
    maxlength: [60, 'Meta title cannot exceed 60 characters'],
  },
  metaDescription: { 
    type: String,
    maxlength: [160, 'Meta description cannot exceed 160 characters'],
  },
  metaKeywords: [{ type: String }],
  slug: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true,
    index: true,
  },
}, { _id: false });

const DimensionsSchema = new Schema({
  length: { type: Number, min: 0 },
  width: { type: Number, min: 0 },
  height: { type: Number, min: 0 },
}, { _id: false });

// Main Product Schema
const ProductSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [200, 'Product name cannot exceed 200 characters'],
      index: 'text',
    },
    shortDescription: {
      type: String,
      maxlength: [250, 'Short description cannot exceed 250 characters'],
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
    },
    
    tags: [{
      type: String,
      trim: true,
      lowercase: true,
    }],
    
    // Pricing & Market
    pricing: {
      type: PricingSchema,
      required: true,
    },
    inventory: {
      type: InventorySchema,
      required: true,
    },
    availableMarkets: [{
      type: String,
      enum: ['kilo', 'carton'],
      required: true,
    }],
    
    // Media
    images: {
      type: [ProductImageSchema],
      validate: {
        validator: function(images: any[]) {
          return images && images.length > 0;
        },
        message: 'At least one product image is required',
      },
    },
    videoUrl: {
      type: String,
    },
    
    // SEO
    seo: {
      type: ProductSEOSchema,
      required: true,
    },
    
    // Product Details
    brand: {
      type: String,
      trim: true,
      index: true,
    },
    sku: {
      type: String,
      unique: true,
      sparse: true,
      uppercase: true,
      trim: true,
    },
    barcode: {
      type: String,
      unique: true,
      sparse: true,
    },
    weight: {
      type: Number,
      min: 0,
    },
    dimensions: DimensionsSchema,
    
    // Status & Visibility
    status: {
      type: String,
      enum: ['draft', 'active', 'inactive', 'out_of_stock'],
      default: 'draft',
      index: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
    isNewArrival: {
      type: Boolean,
      default: false,
      index: true,
    },
    
    // Sales & Performance
    salesCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    viewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    
    // Related Products
    relatedProducts: [{
      type: Schema.Types.ObjectId,
      ref: 'Product',
    }],
    
    // Timestamps & Audit
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'AdminUser',
    },
    publishedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for common queries
ProductSchema.index({ status: 1, isFeatured: 1 });
ProductSchema.index({ status: 1, isNewArrival: 1 });
ProductSchema.index({ brand: 1, status: 1 });
ProductSchema.index({ 'pricing.kilo.price': 1 });
ProductSchema.index({ 'pricing.carton.price': 1 });
ProductSchema.index({ createdAt: -1 });
ProductSchema.index({ salesCount: -1 });
ProductSchema.index({ averageRating: -1 });

// Text index for search
ProductSchema.index({ 
  name: 'text', 
  description: 'text', 
  tags: 'text',
  brand: 'text',
});

// Pre-save middleware: Generate slug
ProductSchema.pre('save', function (next: any) {
  if (!this.seo.slug || this.isModified('name')) {
    this.seo.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
  
  // Set publishedAt when status changes to active
  if (this.isModified('status') && this.status === 'active' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  
  // Ensure at least one primary image
  if (this.images && this.images.length > 0) {
    const hasPrimary = this.images.some(img => img.isPrimary);
    if (!hasPrimary) {
      this.images[0].isPrimary = true;
    }
  }
  
  next();
});

// Virtual: Primary Image
ProductSchema.virtual('primaryImage').get(function() {
  return this.images?.find(img => img.isPrimary) || this.images?.[0];
});

// Virtual: Is In Stock
ProductSchema.virtual('isInStock').get(function() {
  const kiloInStock = !this.inventory.kilo.trackInventory || this.inventory.kilo.stock > 0;
  const cartonInStock = !this.inventory.carton.trackInventory || this.inventory.carton.stock > 0;
  return kiloInStock || cartonInStock;
});

// Virtual: Is Low Stock
ProductSchema.virtual('isLowStock').get(function() {
  const kiloLow = this.inventory.kilo.trackInventory && 
    this.inventory.kilo.stock <= this.inventory.kilo.lowStockThreshold;
  const cartonLow = this.inventory.carton.trackInventory && 
    this.inventory.carton.stock <= this.inventory.carton.lowStockThreshold;
  return kiloLow || cartonLow;
});

// Method: Get price for market type
ProductSchema.methods.getPriceForMarket = function(marketType: MarketType) {
  return this.pricing[marketType].price;
};

// Method: Check stock availability
ProductSchema.methods.checkStockAvailability = function(marketType: MarketType, quantity: number) {
  const inventoryData = this.inventory[marketType];
  
  if (!inventoryData.trackInventory) {
    return true;
  }
  
  return inventoryData.stock >= quantity;
};

// Method: Decrement stock
ProductSchema.methods.decrementStock = async function(marketType: MarketType, quantity: number) {
  const inventoryData = this.inventory[marketType];
  
  if (inventoryData.trackInventory) {
    if (inventoryData.stock < quantity) {
      throw new Error(`Insufficient stock for ${marketType}. Available: ${inventoryData.stock}, Requested: ${quantity}`);
    }
    
    inventoryData.stock -= quantity;
    
    // Update status if out of stock
    if (inventoryData.stock === 0) {
      const otherMarket = marketType === 'kilo' ? 'carton' : 'kilo';
      const otherInStock = !this.inventory[otherMarket].trackInventory || 
        this.inventory[otherMarket].stock > 0;
      
      if (!otherInStock) {
        this.status = 'out_of_stock';
      }
    }
    
    await this.save();
  }
};

// Static method: Get featured products
ProductSchema.statics.getFeatured = function(limit = 10) {
  return this.find({ status: 'active', isFeatured: true })
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Static method: Get new arrivals
ProductSchema.statics.getNewArrivals = function(limit = 10) {
  return this.find({ status: 'active', isNewArrival: true })
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Ensure virtuals are included in JSON
ProductSchema.set('toJSON', { virtuals: true });
ProductSchema.set('toObject', { virtuals: true });

// Export model
const Product: Model<IProduct> = 
  mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);

export default Product;
