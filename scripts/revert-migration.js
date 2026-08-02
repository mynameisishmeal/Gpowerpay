/**
 * REVERT Migration: Convert back to old schema
 * Run with: node scripts/revert-migration.js
 */

require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

async function revertMigration() {
  try {
    console.log('🔄 Reverting migration...\n');
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    const db = mongoose.connection.db;
    const productsCollection = db.collection('products');

    // Find all products with NEW schema (has 'name' field)
    const newProducts = await productsCollection.find({
      name: { $exists: true },
      pricing: { $exists: true }
    }).toArray();

    console.log(`📊 Found ${newProducts.length} products to revert\n`);

    if (newProducts.length === 0) {
      console.log('✅ No products to revert!');
      await mongoose.disconnect();
      process.exit(0);
    }

    let successCount = 0;
    let counter = 1;

    for (const newProduct of newProducts) {
      try {
        console.log(`Reverting: ${newProduct.name}...`);

        const oldProduct = {
          unique_id: counter++,
          email: 'recovered@gpower.com',
          password: 'recovered',
          productprice: newProduct.pricing?.kilo?.price || 0,
          productname: newProduct.name,
          productweight: newProduct.weight || 0,
        };

        // Update back to old schema
        await productsCollection.updateOne(
          { _id: newProduct._id },
          { 
            $set: oldProduct,
            $unset: { 
              name: '',
              shortDescription: '',
              description: '',
              category: '',
              tags: '',
              pricing: '',
              inventory: '',
              availableMarkets: '',
              images: '',
              seo: '',
              brand: '',
              weight: '',
              status: '',
              isFeatured: '',
              isNewArrival: '',
              salesCount: '',
              viewCount: '',
              averageRating: '',
              reviewCount: '',
              createdAt: '',
              updatedAt: '',
              publishedAt: ''
            }
          }
        );

        successCount++;
        console.log(`✅ Reverted!\n`);

      } catch (error) {
        console.error(`❌ Failed:`, error.message);
      }
    }

    console.log('\n=== Revert Complete ===');
    console.log(`✅ Successfully reverted: ${successCount} products`);
    console.log('==========================\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Revert failed:', error);
    process.exit(1);
  }
}

revertMigration();
