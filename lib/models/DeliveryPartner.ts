import mongoose from 'mongoose';

export interface IDeliveryPartner extends mongoose.Document {
  name: string;
  email: string;
  phone: string;
  partnerType: 'bulk' | 'small';
  isActive: boolean;
  image?: string;
  userId?: mongoose.Types.ObjectId; // Reference to User account
  
  // Review Statistics
  averageRating?: number;
  totalReviews?: number;
  
  // Location Tracking
  currentLocation?: {
    latitude: number;
    longitude: number;
    accuracy: number;
    lastUpdated: Date;
  };
  isLocationSharing?: boolean;
  
  createdAt: Date;
  updatedAt: Date;
}

const DeliveryPartnerSchema = new mongoose.Schema<IDeliveryPartner>(
  {
    name: {
      type: String,
      required: [true, 'Partner name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    partnerType: {
      type: String,
      enum: ['bulk', 'small'],
      required: [true, 'Partner type is required'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    image: {
      type: String,
      default: null,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    // Review Statistics
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalReviews: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Location Tracking
    currentLocation: {
      latitude: { type: Number },
      longitude: { type: Number },
      accuracy: { type: Number },
      lastUpdated: { type: Date },
    },
    isLocationSharing: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
DeliveryPartnerSchema.index({ partnerType: 1, isActive: 1 });

export default mongoose.models.DeliveryPartner || mongoose.model<IDeliveryPartner>('DeliveryPartner', DeliveryPartnerSchema);
