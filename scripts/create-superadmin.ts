/**
 * Create Super Admin Script
 * Run with: npx tsx scripts/create-superadmin.ts
 */

import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || '';

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI is not defined in .env.local');
  process.exit(1);
}

// User Schema (simplified for script)
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String },
  role: { type: String, enum: ['sadmin', 'admin', 'worker', 'customer', 'support', 'rider'], default: 'customer' },
  emailVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  isBlocked: { type: Boolean, default: false },
  walletBalance: { type: Number, default: 0 },
  regtime: { type: Date, default: Date.now },
});

// Password hashing method
UserSchema.pre('save', async function() {
  if (this.isModified('password')) {
    // Only hash if password is plain text (not already hashed)
    if (this.password && !this.password.startsWith('$2')) {
      const bcrypt = await import('bcryptjs');
      const hashedPassword = await bcrypt.default.hash(this.password, 12);
      this.password = hashedPassword;
    }
  }
  return;
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function createSuperAdmin() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const email = 'mighty@gpower.biz';
    const password = 'Mighty';
    const name = 'Mighty Admin';

    // Check if super admin already exists
    const existingAdmin = await User.findOne({ email });

    if (existingAdmin) {
      console.log('⚠️  Super admin with this email already exists!');
      console.log('\n📋 Existing Admin Details:');
      console.log('   Email:', existingAdmin.email);
      console.log('   Name:', existingAdmin.name);
      console.log('   Role:', existingAdmin.role);
      console.log('   Email Verified:', existingAdmin.emailVerified);
      console.log('   Active:', existingAdmin.isActive);
      
      // Ask if user wants to update
      console.log('\n🔄 Updating existing admin...');
      existingAdmin.role = 'sadmin';
      existingAdmin.emailVerified = true;
      existingAdmin.isActive = true;
      existingAdmin.isBlocked = false;
      existingAdmin.name = name;
      await existingAdmin.save();
      
      console.log('✅ Super admin updated successfully!');
    } else {
      // Create new super admin
      const superAdmin = await User.create({
        email,
        password,
        name,
        role: 'sadmin',
        emailVerified: true, // Auto-verify super admin
        isActive: true,
        isBlocked: false,
        walletBalance: 0,
      });

      console.log('✅ Super admin created successfully!');
      console.log('\n📋 Super Admin Details:');
      console.log('   Email:', superAdmin.email);
      console.log('   Name:', superAdmin.name);
      console.log('   Role:', superAdmin.role);
      console.log('   Password:', password);
      console.log('   Email Verified:', superAdmin.emailVerified);
    }

    console.log('\n🔐 Login Credentials:');
    console.log('   Email: mighty@gpower.biz');
    console.log('   Password: Mighty');
    console.log('   Login URL: http://localhost:3000/admin/login');
    console.log('\n⚠️  IMPORTANT: Consider changing the password after first login for security!');

  } catch (error: any) {
    console.error('❌ Error creating super admin:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the script
createSuperAdmin();
