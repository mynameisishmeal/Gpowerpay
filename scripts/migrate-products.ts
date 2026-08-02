/**
 * Migration Script: Convert old product schema to new schema
 * Run with: npx tsx scripts/migrate-products.ts
 */

import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

import mongoose from 'mongoose';
import connectDB from '../lib/mongodb';

// Old schema interface
interface OldProduct {
  _id: string;
  unique_id: number;
  email?: string;
  password?: string;
  productprice: number;
  productname: string;
  productweight?: number;
}

async function migrateProducts() {
  try {
    console.log('🔄 Starting product migration...\n');
    
    await connectDB();
    
    // Get raw collection (bypass Mongoose model)
    const db = mongoose.connection.db;
    const productsCollection = db?.collection('products');
    
    if (!productsCollection) {
      throw new Error('Products collection not found');
    }

    // Find all products with old schema
    const oldProducts = await productsCollection.find({
      productname: { $exists: true } // Old schema indicator
    }).toArray();

    console.log(`📊 Found ${oldProducts.length} products with old schema\n`);

    if (oldProducts.length === 0) {
      console.log('✅ No products to migrate. All products are already using new schema.');
      process.exit(0);
    }

    // Show sample old product
    console.log('Sample old product:');
    console.log(JSON.stringify(oldProducts[0], null, 2));
    console.log('\n');

    // Get or create a default category
    const categoriesCollection = db?.collection('categories');
    let defaultCategory = await categoriesCollection?.findOne({ name: 'Uncategorized' });
    
    if (!defaultCategory) {
      console.log('📦 Creating default category...');
      const result = await categoriesCollection?.insertOne({
        name: 'Uncategorized',
        slug: 'uncategorized',
        description: 'Products pending categorization',
        status: 'active',
        productCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      if (!result?.insertedId) {
        throw new Error('Failed to create default category');
      }
      defaultCategory = { _id: result.insertedId };
      console.log('✅ Default category created\n');
    }

    // Migrate each product
    let successCount = 0;
    let errorCount = 0;

    for (const oldProduct of oldProducts as unknown as OldProduct[]) {
      try {
        console.log(`Migrating: ${oldProduct.productname}...`);

        const newProduct = {
          // Basic info
          name: oldProduct.productname,
          shortDescription: `${oldProduct.productname} - Quality frozen food`,
          description: `High quality ${oldProduct.productname}. Fresh and carefully preserved.`,
          
          // Category
          category: defaultCategory._id,
          tags: ['frozen', 'imported'],
          
          // Pricing - Convert old single price to new dual pricing
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
          
          // Inventory
          inventory: {
            kilo: {
              stock: 100,
              lowStockThreshold: 10,
              trackInventory: true,
            },
            carton: {
              stock: 20,
              lowStockThreshold: 5,
              trackInventory: true,
            },
          },
          
          // Available markets
          availableMarkets: ['kilo', 'carton'],
          
          // Images - placeholder
          images: [
            {
              url: '/images/products/placeholder.jpg',
              alt: oldProduct.productname,
              isPrimary: true,
              order: 0,
            },
          ],
          
          // SEO
          seo: {
            slug: oldProduct.productname
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/^-|-$/g, ''),
            metaTitle: oldProduct.productname,
            metaDescription: `Buy ${oldProduct.productname} online`,
            metaKeywords: ['frozen', oldProduct.productname],
          },
          
          // Product details
          brand: 'Gpower',
          weight: oldProduct.productweight || 1,
          
          // Status
          status: 'active',
          isFeatured: false,
          isNewArrival: false,
          
          // Stats
          salesCount: 0,
          viewCount: 0,
          averageRating: 0,
          reviewCount: 0,
          
          // Timestamps
          createdAt: new Date(),
          updatedAt: new Date(),
          publishedAt: new Date(),
        };

        // Update the product
        await productsCollection.updateOne(
          { _id: new mongoose.Types.ObjectId(oldProduct._id) },
          { $set: newProduct, $unset: { unique_id: '', email: '', password: '', productprice: '', productname: '', productweight: '' } }
        );

        successCount++;
        console.log(`✅ Migrated: ${oldProduct.productname}\n`);

      } catch (error) {
        errorCount++;
        console.error(`❌ Failed to migrate ${oldProduct.productname}:`, error);
        console.log('\n');
      }
    }

    // Update category product count
    await categoriesCollection?.updateOne(
      { _id: defaultCategory._id },
      { $set: { productCount: successCount } }
    );

    console.log('\n=== Migration Complete ===');
    console.log(`✅ Successfully migrated: ${successCount} products`);
    console.log(`❌ Failed: ${errorCount} products`);
    console.log('==========================\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateProducts();
