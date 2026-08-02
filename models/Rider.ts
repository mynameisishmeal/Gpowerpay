import mongoose, { Schema, Model } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IRider, IEmergencyContact } from '@/types';

// Emergency Contact subdocument schema
const EmergencyContactSchema = new Schema<IEmergencyContact>({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  relationship: { type: String, required: true },
}, { _id: false });

// Rider schema
const RiderSchema = new Schema<IRider>(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
    },
    profilePhoto: {
      type: String,
    },
    
    // Identification
    idNumber: {
      type: String,
      required: [true, 'ID number is required'],
      trim: true,
    },
    licenseNumber: {
      type: String,
      trim: true,
    },
    
    // Vehicle
    vehicleType: {
      type: String,
      enum: ['motorcycle', 'bike', 'car'],
      required: [true, 'Vehicle type is required'],
    },
    vehiclePlateNumber: {
      type: String,
      required: [true, 'Vehicle plate number is required'],
      trim: true,
      uppercase: true,
    },
    
    // Address
    homeAddress: {
      type: String,
      required: [true, 'Home address is required'],
    },
    city: {
      type: String,
      required: [true, 'City is required'],
    },
    state: {
      type: String,
      required: [true, 'State is required'],
    },
    emergencyContact: {
      type: EmergencyContactSchema,
      required: [true, 'Emergency contact is required'],
    },
    
    // Bank Details
    bankName: {
      type: String,
    },
    accountNumber: {
      type: String,
    },
    accountName: {
      type: String,
    },
    
    // Status
    status: {
      type: String,
      enum: ['available', 'on_delivery', 'offline', 'suspended'],
      default: 'offline',
    },
    
    // Performance Metrics
    totalDeliveries: {
      type: Number,
      default: 0,
      min: 0,
    },
    completedDeliveries: {
      type: Number,
      default: 0,
      min: 0,
    },
    cancelledDeliveries: {
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
    onTimeDeliveryRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    
    // Financial
    totalEarnings: {
      type: Number,
      default: 0,
      min: 0,
    },
    pendingPayment: {
      type: Number,
      default: 0,
      min: 0,
    },
    paymentPerDelivery: {
      type: Number,
      default: 500, // Default ₦500 per delivery
      min: 0,
    },
    
    // Verification
    emailVerified: {
      type: Boolean,
      default: false,
    },
    phoneVerified: {
      type: Boolean,
      default: false,
    },
    documentsVerified: {
      type: Boolean,
      default: false,
    },
    
    // Last Active
    lastActive: {
      type: Date,
    },
    
    // Added By (Admin who added this rider)
    addedBy: {
      type: Schema.Types.ObjectId,
      ref: 'AdminUser',
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

// Indexes
RiderSchema.index({ email: 1 });
RiderSchema.index({ phone: 1 });
RiderSchema.index({ status: 1 });
RiderSchema.index({ createdAt: -1 });
RiderSchema.index({ status: 1, totalDeliveries: -1 }); // For assignment logic

// Hash password before saving
RiderSchema.pre('save', async function () {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return;
  
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare password
RiderSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Update last active on status change to available
RiderSchema.pre('save', function (next: any) {
  if (this.isModified('status') && this.status === 'available') {
    this.lastActive = new Date();
  }
  next();
});

// Don't return password in JSON responses
RiderSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

// Create or get existing model
const Rider: Model<IRider> =
  mongoose.models.Rider || mongoose.model<IRider>('Rider', RiderSchema);

export default Rider;
