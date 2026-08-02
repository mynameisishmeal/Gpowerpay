/**
 * Fix Product Names in Orders
 * Fetches actual product names and updates orders
 * Run with: node scripts/fix-product-names.js
 */

require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

// Order Schema
const OrderSchema = new mongoose.Schema({
  orderNumber: String,
  items: [{
    productId: String,
    productName: String,
    price: Number,
    quantity: Number,
  }],
}, { strict: false });

// Product Schema
const ProductSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  name: String,
}, { strict: false });

const Order = mongoose.models.Order || mongoose.model('Order', OrderSchema);
const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

async function fixProductNames() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to database');

    // Find all orders with items that have "Product" as the name
    const ordersWithGenericNames = await Order.find({
      'items.productName': 'Product'
    });

    console.log(`📦 Found ${ordersWithGenericNames.length} orders with generic product names`);

    if (ordersWithGenericNames.length === 0) {
      console.log('✅ All orders have proper product names!');
      await mongoose.disconnect();
      process.exit(0);
    }

    let updated = 0;
    for (const order of ordersWithGenericNames) {
      let orderUpdated = false;
      
      for (let i = 0; i < order.items.length; i++) {
        const item = order.items[i];
        
        if (item.productName === 'Product' && item.productId) {
          // Fetch the actual product
          try {
            const product = await Product.findById(item.productId);
            
            if (product && product.name) {
              console.log(`  → Updating ${order.orderNumber}: "${item.productName}" → "${product.name}"`);
              order.items[i].productName = product.name;
              orderUpdated = true;
            } else {
              console.log(`  ⚠️ Product ${item.productId} not found for order ${order.orderNumber}`);
            }
          } catch (err) {
            console.log(`  ⚠️ Error fetching product ${item.productId}:`, err.message);
          }
        }
      }
      
      if (orderUpdated) {
        await order.save();
        updated++;
        console.log(`✅ Updated order ${order.orderNumber}`);
      }
    }

    console.log(`\n🎉 Successfully updated ${updated} orders with correct product names!`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

fixProductNames();
