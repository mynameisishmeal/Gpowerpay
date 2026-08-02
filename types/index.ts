import { Document } from 'mongoose';
import { ObjectId } from 'mongodb';

// ============================================
// USER TYPES (CUSTOMERS)
// ============================================

export interface IAddress {
  _id?: ObjectId;
  street: string;
  city: string;
  state: string;
  landmark?: string;
  phone: string;
  isDefault: boolean;
}

export interface IUser extends Document {
  _id: ObjectId;
  unique_id?: number;
  email: string;
  password?: string;
  name?: string;
  firstname?: string;
  lastname?: string;
  phonenumber?: string;
  profilePicture?: string;
  role: 'sadmin' | 'admin' | 'worker' | 'customer' | 'support' | 'rider';
  
  // Gpower CRM fields
  permissions?: {
    canViewInventory: boolean;
    canManageInventory: boolean;
    canViewCustomers: boolean;
    canManageCustomers: boolean;
    canViewFinance: boolean;
    canManageFinance: boolean;
    canViewAnalytics: boolean;
    canManageUsers: boolean;
  };
  city?: string;
  birthday?: number;
  birthmonth?: number;
  birthyear?: number;
  gender?: string;
  country?: string;
  countrycode?: string;
  regtime?: Date;
  
  // Gpower Pay fields
  walletBalance?: number;
  addresses?: IAddress[];
  authProvider?: 'local' | 'google' | 'facebook' | 'apple';
  authProviderId?: string;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  emailVerificationToken?: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  isActive?: boolean;
  isBlocked?: boolean;
  lastLogin?: Date;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// ============================================
// ADMIN USER TYPES
// ============================================

export interface IAdminUser extends Document {
  _id: ObjectId;
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  profilePicture?: string;
  
  // Role
  role: 'superadmin' | 'support';
  
  // Security
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  ipWhitelist?: string[];
  
  // Status
  isActive: boolean;
  lastLogin?: Date;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  createdBy?: ObjectId;
  
  // Methods
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// ============================================
// RIDER TYPES
// ============================================

export interface IEmergencyContact {
  name: string;
  phone: string;
  relationship: string;
}

export interface IRider extends Document {
  _id: ObjectId;
  fullName: string;
  email: string;
  phone: string;
  password: string;
  profilePhoto?: string;
  
  // Identification
  idNumber: string;
  licenseNumber?: string;
  
  // Vehicle
  vehicleType: 'motorcycle' | 'bike' | 'car';
  vehiclePlateNumber: string;
  
  // Address
  homeAddress: string;
  city: string;
  state: string;
  emergencyContact: IEmergencyContact;
  
  // Bank Details
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  
  // Status
  status: 'available' | 'on_delivery' | 'offline' | 'suspended';
  
  // Performance Metrics
  totalDeliveries: number;
  completedDeliveries: number;
  cancelledDeliveries: number;
  averageRating: number;
  onTimeDeliveryRate: number;
  
  // Financial
  totalEarnings: number;
  pendingPayment: number;
  paymentPerDelivery: number;
  
  // Verification
  emailVerified: boolean;
  phoneVerified: boolean;
  documentsVerified: boolean;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  lastActive?: Date;
  addedBy?: ObjectId;
  
  // Methods
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// ============================================
// NEXTAUTH TYPES
// ============================================

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role?: 'customer' | 'sadmin' | 'admin' | 'worker' | 'support' | 'rider';
  image?: string;
  emailVerified?: boolean;
}

declare module 'next-auth' {
  interface Session {
    user?: SessionUser;
  }
  
  interface User extends SessionUser {}
}

declare module 'next-auth/jwt' {
  interface JWT extends SessionUser {}
}

// ============================================
// CATEGORY TYPES
// ============================================

export interface ICategory extends Document {
  _id: ObjectId;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  
  // Hierarchy
  parent?: ObjectId | ICategory;
  ancestors: ObjectId[];
  level: number;
  order: number;
  
  // SEO
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
  
  // Status
  isActive: boolean;
  isFeatured: boolean;
  
  // Stats
  productCount: number;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  createdBy?: ObjectId;
}

// ============================================
// PRODUCT TYPES
// ============================================

export type MarketType = 'kilo' | 'carton';

export interface IPricing {
  kilo: {
    price: number;
    compareAtPrice?: number;
    minQuantity: number;
    maxQuantity?: number;
  };
  carton: {
    price: number;
    compareAtPrice?: number;
    minQuantity: number;
    maxQuantity?: number;
    unitsPerCarton: number; // e.g., 12 packs per carton
  };
}

export interface IInventory {
  kilo: {
    stock: number;
    lowStockThreshold: number;
    trackInventory: boolean;
  };
  carton: {
    stock: number;
    lowStockThreshold: number;
    trackInventory: boolean;
  };
}

export interface IProductImage {
  url: string;
  alt?: string;
  isPrimary: boolean;
  order: number;
}

export interface IProductSEO {
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
  slug: string;
}

export interface IProduct extends Document {
  _id: ObjectId;
  name: string;
  shortDescription?: string;
  description: string;
  
  // Categorization
  category: ObjectId | ICategory;
  tags: string[];
  
  // Pricing & Market
  pricing: IPricing;
  inventory: IInventory;
  availableMarkets: MarketType[]; // ['kilo', 'carton'] or one of them
  
  // Media
  images: IProductImage[];
  videoUrl?: string;
  
  // SEO
  seo: IProductSEO;
  
  // Product Details
  brand?: string;
  sku?: string;
  barcode?: string;
  weight?: number; // in grams
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  
  // Status & Visibility
  status: 'draft' | 'active' | 'inactive' | 'out_of_stock';
  isFeatured: boolean;
  isNewArrival: boolean;
  
  // Sales & Performance
  salesCount: number;
  viewCount: number;
  averageRating: number;
  reviewCount: number;
  
  // Related Products
  relatedProducts: ObjectId[];
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  createdBy?: ObjectId;
  publishedAt?: Date;
}

// ============================================
// PRODUCT FILTER & SEARCH TYPES
// ============================================

export interface IProductFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  marketType?: MarketType;
  brand?: string;
  tags?: string[];
  status?: string;
  isFeatured?: boolean;
  isNewArrival?: boolean;
  inStock?: boolean;
  search?: string;
}

export interface IProductSort {
  field: 'createdAt' | 'name' | 'price' | 'salesCount' | 'averageRating';
  order: 'asc' | 'desc';
}

export interface IPaginationParams {
  page: number;
  limit: number;
}

export interface IPaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
