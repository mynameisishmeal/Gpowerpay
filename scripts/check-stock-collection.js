/**
 * Check stock collection structure
 */

require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

async function checkStock() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    const db = mongoose.connection.db;
    const stockCollection = db.collection('stock');

    const totalStock = await stockCollection.countDocuments({});
    console.log(`📊 Total items in stock collection: ${totalStock}\n`);

    if (totalStock > 0) {
      const sampleStock = await stockCollection.findOne({});
      console.log('Sample stock item:');
      console.log(JSON.stringify(sampleStock, null, 2));
      console.log('\n');

      // Get all stock items
      const allStock = await stockCollection.find({}).limit(5).toArray();
      console.log('First 5 stock items:');
      allStock.forEach((item, i) => {
        console.log(`${i + 1}.`, JSON.stringify(item, null, 2));
      });
    } else {
      console.log('⚠️ Stock collection is empty');
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkStock();
