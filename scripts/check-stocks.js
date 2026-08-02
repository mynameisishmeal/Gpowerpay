/**
 * Check stocks collection structure
 */

require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

async function checkStocks() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    const db = mongoose.connection.db;
    const stocksCollection = db.collection('stocks');

    const total = await stocksCollection.countDocuments({});
    console.log(`📊 Total items in stocks collection: ${total}\n`);

    const samples = await stocksCollection.find({}).limit(5).toArray();
    console.log('First 5 stock items:\n');
    samples.forEach((item, i) => {
      console.log(`${i + 1}.`, JSON.stringify(item, null, 2));
      console.log('');
    });

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkStocks();
