/**
 * Migration Script: Convert old product schema to new schema
 * Run with: node scripts/migrate-products-simple.js
 */

require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in .env.local');
  process.exit(1);
}

async function migrateProducts() {
  try {
    console.log('🔄 Starting product migration...\n');
    console.log('Connecting to:', MONGODB_URI.replace(/\/\/.*@/, '//***:***@'));
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    const db = mongoose.connection.db;
    const productsCollection = db.collection('products');
    const categoriesCollection = db.collection('categories');

    // Find all products with old schema
    const oldProducts = await productsCollection.find({
      productname: { $exists: true }
    }).toArray();

    console.log(`📊 Found ${oldProducts.length} products with old schema\n`);

    if (oldProducts.length === 0) {
      console.log('✅ No products to migrate!');
      await mongoose.disconnect();
      process.exit(0);
    }

    // Show sample
    console.log('Sample old product:');
    console.log(JSON.stringify(oldProducts[0], null, 2));
    console.log('\n');

    // Get or create default category
    let defaultCategory = await categoriesCollection.findOne({ name: 'Uncategorized' });
    
    if (!defaultCategory) {
      console.log('📦 Creating default category...');
      const result = await categoriesCollection.insertOne({
        name: 'Uncategorized',
        slug: 'uncategorized',
        description: 'Products pending categorization',
        status: 'active',
        productCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      defaultCategory = { _id: result.insertedId };
      console.log('✅ Default category created\n');
    }

    // Migrate each product
    let successCount = 0;

    for (const oldProduct of oldProducts) {
      try {
        console.log(`Migrating: ${oldProduct.productname}...`);

        const slug = oldProduct.productname
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');

        const newProduct = {
          name: oldProduct.productname,
          shortDescription: `${oldProduct.productname} - Quality frozen food`,
          description: `High quality ${oldProduct.productname}. Fresh and carefully preserved.`,
          category: defaultCategory._id,
          tags: ['frozen', 'imported'],
          pricing: {
            kilo: {
              price: oldProduct.productprice || 0,
              compareAtPrice: oldProduct.productprice ? oldProduct.productprice * 1.2 : 0,
              minQuantity: 1,
              maxQuantity: 100,
            },
            carton: {
              price: oldProduct.productprice ? oldProduct.productprice * 12 : 0,
              compareAtPrice: oldProduct.productprice ? oldProduct.productprice * 12 * 1.2 : 0,
              minQuantity: 1,
              maxQuantity: 20,
              unitsPerCarton: 12,
            },
          },
          inventory: {
            kilo: { stock: 100, lowStockThreshold: 10, trackInventory: true },
            carton: { stock: 20, lowStockThreshold: 5, trackInventory: true },
          },
          availableMarkets: ['kilo', 'carton'],
          images: [
            {
              url: '/images/products/placeholder.jpg',
              alt: oldProduct.productname,
              isPrimary: true,
              order: 0,
            },
          ],
          seo: {
            slug: slug,
            metaTitle: oldProduct.productname,
            metaDescription: `Buy ${oldProduct.productname} online`,
            metaKeywords: ['frozen', oldProduct.productname],
          },
          brand: 'Gpower',
          weight: oldProduct.productweight || 1,
          status: 'active',
          isFeatured: false,
          isNewArrival: false,
          salesCount: 0,
          viewCount: 0,
          averageRating: 0,
          reviewCount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          publishedAt: new Date(),
        };

        // Update the product
        await productsCollection.updateOne(
          { _id: oldProduct._id },
          { 
            $set: newProduct,
            $unset: { 
              unique_id: '', 
              email: '', 
              password: '', 
              productprice: '', 
              productname: '', 
              productweight: '' 
            }
          }
        );

        successCount++;
        console.log(`✅ Migrated!\n`);

      } catch (error) {
        console.error(`❌ Failed:`, error.message);
        console.log('\n');
      }
    }

    // Update category count
    await categoriesCollection.updateOne(
      { _id: defaultCategory._id },
      { $set: { productCount: successCount } }
    );

    console.log('\n=== Migration Complete ===');
    console.log(`✅ Successfully migrated: ${successCount} products`);
    console.log('==========================\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrateProducts();
