import mongoose, { Schema, Model } from 'mongoose';

/**
 * Legacy Product Model - Works with existing database schema
 * Maps old schema to new interface for compatibility
 */

export interface ILegacyProduct {
  _id: string;
  unique_id: number;
  email?: string;
  password?: string;
  productprice: number;
  productname: string;
  productweight?: number;
  productimage?: string;
  productdescription?: string;
  productbrand?: string;
  productquantity?: number;
  __v?: number;
}

const LegacyProductSchema = new Schema<ILegacyProduct>({
  unique_id: { type: Number },
  email: { type: String },
  password: { type: String },
  productprice: { type: Number, required: true },
  productname: { type: String, required: true },
  productweight: { type: Number, default: 0 },
  productimage: { type: String },
  productdescription: { type: String },
  productbrand: { type: String },
  productquantity: { type: Number },
}, {
  collection: 'products', // Use existing collection
  timestamps: false,
});

const LegacyProduct: Model<ILegacyProduct> = 
  mongoose.models.LegacyProduct || mongoose.model<ILegacyProduct>('LegacyProduct', LegacyProductSchema);

export default LegacyProduct;
