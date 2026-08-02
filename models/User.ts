import mongoose, { Schema, Model } from 'mongoose';
import { IUser } from '@/types';
import bcrypt from 'bcryptjs';

const UserSchema = new Schema<IUser>({
  unique_id: { type: Number, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: false }, // Optional for OAuth users
  firstname: { type: String },
  lastname: { type: String },
  phonenumber: { type: String },
  name: { type: String }, // Combined name for display
  profilePicture: { type: String },
  // IMPORTANT: Role names are legacy from GpowerCRM (shared database)
  // sadmin = superadmin, admin = support, worker = customer
  // rider = delivery rider (new role for Gpowerpay)
  // DO NOT CHANGE - will break GpowerCRM!
  role: { type: String, enum: ['sadmin', 'admin', 'worker', 'customer', 'support', 'rider'], default: 'customer' },
  permissions: {
    canViewInventory: { type: Boolean, default: false },
    canManageInventory: { type: Boolean, default: false },
    canViewCustomers: { type: Boolean, default: false },
    canManageCustomers: { type: Boolean, default: false },
    canViewFinance: { type: Boolean, default: false },
    canManageFinance: { type: Boolean, default: false },
    canViewAnalytics: { type: Boolean, default: false },
    canManageUsers: { type: Boolean, default: false }
  },
  city: { type: String },
  birthday: { type: Number },
  birthmonth: { type: Number },
  birthyear: { type: Number },
  gender: { type: String },
  country: { type: String },
  countrycode: { type: String },
  regtime: { type: Date, default: Date.now },
  
  // Gpower Pay specific fields
  walletBalance: { type: Number, default: 0 },
  addresses: [{
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    landmark: { type: String },
    phone: { type: String, required: true },
    isDefault: { type: Boolean, default: false },
  }],
  authProvider: { type: String, enum: ['local', 'google', 'facebook', 'apple'], default: 'local' },
  authProviderId: { type: String },
  emailVerified: { type: Boolean, default: false },
  phoneVerified: { type: Boolean, default: false },
  emailVerificationToken: { type: String },
  passwordResetToken: { type: String },
  passwordResetExpires: { type: Date },
  isActive: { type: Boolean, default: true },
  isBlocked: { type: Boolean, default: false },
  lastLogin: { type: Date },
});

// Indexes
UserSchema.index({ email: 1 });
UserSchema.index({ phonenumber: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ isActive: 1 });
UserSchema.index({ createdAt: -1 });

// Virtual: Full name
UserSchema.virtual('fullName').get(function() {
  return `${this.firstname || ''} ${this.lastname || ''}`.trim();
});

// Pre-save hook to hash password (only if it's plain text)
UserSchema.pre('save', async function() {
  if (this.isModified('password')) {
    // Only hash if password is plain text (not already hashed)
    if (this.password && !this.password.startsWith('$2')) {
      const hashedPassword = await bcrypt.hash(this.password as string, 10);
      this.password = hashedPassword;
    }
  }
  return;
});

// Method to compare password - supports both bcrypt hashed and plain text (legacy Gpower CRM)
// NOTE: This is a SHARED database with Gpower CRM - do NOT modify passwords
UserSchema.methods.comparePassword = async function(this: any, candidatePassword: string): Promise<boolean> {
  // Try bcrypt comparison first
  const isMatch = await bcrypt.compare(candidatePassword, this.password);
  
  if (isMatch) {
    return true;
  }
  
  // Fallback: check if password is plain text (legacy from Gpower CRM)
  // Bcrypt hashes always start with $2a$, $2b$, or $2y$
  if (!this.password.startsWith('$2')) {
    // Plain text comparison - DO NOT AUTO-UPGRADE (shared DB with Gpower CRM)
    return candidatePassword === this.password;
  }
  
  return false;
};

// Don't return password in JSON
UserSchema.methods.toJSON = function(): Record<string, any> {
  const obj = this.toObject();
  delete obj.password;
  delete obj.emailVerificationToken;
  delete obj.passwordResetToken;
  delete obj.passwordResetExpires;
  return obj;
};

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
