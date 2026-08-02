import mongoose, { Schema, Model } from 'mongoose';

/**
 * Legacy Stock Model - Carton products from stocks collection
 */

export interface ILegacyStock {
  _id: string;
  stockname: string;
  email?: string;
  stockprice: number;
  stockquantity: number;
  stockweight?: number;
  stockimage?: string;
  regtime?: Date;
  __v?: number;
}

const LegacyStockSchema = new Schema<ILegacyStock>({
  stockname: { type: String, required: true },
  email: { type: String },
  stockprice: { type: Number, required: true },
  stockquantity: { type: Number, required: true },
  stockweight: { type: Number, default: 10 },
  stockimage: { type: String },
  regtime: { type: Date },
}, {
  collection: 'stocks', // Use existing stocks collection
  timestamps: false,
});

const LegacyStock: Model<ILegacyStock> = 
  mongoose.models.LegacyStock || mongoose.model<ILegacyStock>('LegacyStock', LegacyStockSchema);

export default LegacyStock;
