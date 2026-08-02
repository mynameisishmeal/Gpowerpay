/**
 * List all collections in database
 */

require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

async function listCollections() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();

    console.log('📚 Collections in database:\n');
    
    for (const collection of collections) {
      const count = await db.collection(collection.name).countDocuments({});
      console.log(`- ${collection.name}: ${count} documents`);
      
      if (count > 0 && count < 50) {
        const sample = await db.collection(collection.name).findOne({});
        console.log(`  Sample:`, JSON.stringify(sample, null, 2).substring(0, 200) + '...\n');
      }
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

listCollections();
