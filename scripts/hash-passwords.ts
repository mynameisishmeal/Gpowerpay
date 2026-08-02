/**
 * Script to hash plain-text passwords in the database
 * Run once to migrate from Gpower CRM plain-text passwords to bcrypt hashed passwords
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

import connectDB from '../lib/mongodb';
import User from '../models/User';
import bcrypt from 'bcryptjs';

async function hashPasswords() {
  try {
    await connectDB();
    console.log('Connected to MongoDB');

    // Find all users with plain-text passwords (passwords that don't start with $2)
    const users = await User.find({});
    
    let updated = 0;
    let skipped = 0;

    for (const user of users) {
      // Check if password is already hashed (bcrypt hashes start with $2a$, $2b$, or $2y$)
      if (user.password && !user.password.startsWith('$2')) {
        console.log(`Hashing password for user: ${user.email}`);
        
        // Hash the plain-text password
        const hashedPassword = await bcrypt.hash(user.password, 10);
        
        // Update directly without triggering the pre-save hook
        await User.updateOne(
          { _id: user._id },
          { $set: { password: hashedPassword } }
        );
        
        updated++;
      } else {
        skipped++;
      }
    }

    console.log(`\n✅ Password migration complete!`);
    console.log(`   Updated: ${updated} users`);
    console.log(`   Skipped: ${skipped} users (already hashed)`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error hashing passwords:', error);
    process.exit(1);
  }
}

hashPasswords();
