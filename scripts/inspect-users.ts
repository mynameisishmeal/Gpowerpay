import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

interface IUser {
  _id: mongoose.Types.ObjectId;
  email: string;
  password?: string;
  name: string;
  phone?: string;
  role?: string;
  authProvider?: string;
  authProviderId?: string;
  emailVerified?: boolean;
  isActive?: boolean;
  isBlocked?: boolean;
  walletBalance?: number;
  createdAt: Date;
  updatedAt: Date;
}

const MONGODB_URI = process.env.MONGODB_URI || 
  'mongodb://tellerco:LzNEYZfY9AyyblTE@ac-esumrbm-shard-00-00.hynpbrc.mongodb.net:27017,ac-esumrbm-shard-00-01.hynpbrc.mongodb.net:27017,ac-esumrbm-shard-00-02.hynpbrc.mongodb.net:27017/mfvpos?ssl=true&replicaSet=atlas-pb8n5v-shard-0&authSource=admin&appName=inspect-users';

async function inspectUsers() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB\n');

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection is undefined');
    }
    
    // Check users collection
    const usersCollection = db.collection('users');
    
    console.log('=== USERS COLLECTION (' + (await usersCollection.countDocuments()) + ' documents) ===\n');
    
    const allUsers = await usersCollection.find({}).toArray() as IUser[];
    
    console.log('All users in collection:');
    console.table(allUsers.map(u => ({
      email: u.email,
      name: u.name,
      role: u.role || 'customer',
      authProvider: u.authProvider || 'local',
      emailVerified: u.emailVerified,
      isActive: u.isActive,
      isBlocked: u.isBlocked,
      walletBalance: u.walletBalance,
      createdAt: u.createdAt?.toISOString().split('T')[0]
    })));
    
    console.log('\n--- SUMMARY ---');
    console.log(`Total users: ${allUsers.length}`);
    console.log(`Verified: ${allUsers.filter(u => u.emailVerified).length}`);
    console.log(`Active: ${allUsers.filter(u => u.isActive).length}`);
    console.log(`Blocked: ${allUsers.filter(u => u.isBlocked).length}`);
    console.log(`Local auth: ${allUsers.filter(u => u.authProvider === 'local').length}`);
    console.log(`Google auth: ${allUsers.filter(u => u.authProvider === 'google').length}`);
    console.log(`Facebook auth: ${allUsers.filter(u => u.authProvider === 'facebook').length}`);
    
    // Check for duplicate emails
    const emails = allUsers.map(u => u.email.toLowerCase());
    const duplicates = emails.filter((email, index) => emails.indexOf(email) !== index);
    if (duplicates.length > 0) {
      console.log('\n⚠️ DUPLICATE EMAILS:', [...new Set(duplicates)]);
    }
    
    // Check adminusers collection
    const adminUsersCollection = db.collection('adminusers');
    console.log('\n=== ADMINUSERS COLLECTION (' + (await adminUsersCollection.countDocuments()) + ' documents) ===\n');
    
    const allAdminUsers = await adminUsersCollection.find({}).toArray();
    if (allAdminUsers.length > 0) {
      console.log('All admin users:');
      console.table(allAdminUsers.map(u => ({
        email: u.email,
        fullName: u.fullName,
        role: u.role,
        isActive: u.isActive,
        twoFactorEnabled: u.twoFactorEnabled,
        createdAt: u.createdAt?.toISOString().split('T')[0]
      })));
    } else {
      console.log('⚠️ NO ADMIN USERS IN adminusers COLLECTION - Admin users are in users collection!');
    }
    
    await mongoose.disconnect();
    console.log('\nConnection closed');
  } catch (error) {
    console.error('Error:', error);
  }
}

inspectUsers();
