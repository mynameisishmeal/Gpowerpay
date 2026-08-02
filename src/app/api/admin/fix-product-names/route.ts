import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import LegacyProduct from '@/models/LegacyProduct';
import LegacyStock from '@/models/LegacyStock';
import { requireAdmin } from '@/lib/serverAuth';

/**
 * POST /api/admin/fix-product-names
 * Fix orders that have "Product" as the product name
 */
export async function POST() {
  try {
    // Verify admin auth
    const { error } = await requireAdmin();
    if (error) return error;

    await connectDB();

    // Find all orders with items that have "Product" as the name
    const ordersWithGenericNames = await Order.find({
      'items.productName': 'Product'
    });

    console.log(`📦 Found ${ordersWithGenericNames.length} orders with generic product names`);

    if (ordersWithGenericNames.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'All orders already have proper product names!',
        updated: 0,
      });
    }

    const updates = [];
    let updated = 0;

    for (const order of ordersWithGenericNames) {
      let orderUpdated = false;
      
      for (let i = 0; i < order.items.length; i++) {
        const item = order.items[i];
        
        if (item.productName === 'Product' && item.productId) {
          let productName = null;
          
          try {
            // Check if it's a kilo product (productId starts with "kilo-")
            if (item.productId.startsWith('kilo-')) {
              const actualId = item.productId.replace('kilo-', '');
              const product = await LegacyProduct.findById(actualId);
              if (product && product.productname) {
                productName = product.productname;
              }
            }
            // Check if it's a carton product (productId starts with "carton-")
            else if (item.productId.startsWith('carton-')) {
              const actualId = item.productId.replace('carton-', '');
              const stock = await LegacyStock.findById(actualId);
              if (stock && stock.stockname) {
                productName = stock.stockname;
              }
            }
            // Fallback: try both collections with the raw ID
            else {
              const product = await LegacyProduct.findById(item.productId);
              if (product && product.productname) {
                productName = product.productname;
              } else {
                const stock = await LegacyStock.findById(item.productId);
                if (stock && stock.stockname) {
                  productName = stock.stockname;
                }
              }
            }
            
            if (productName) {
              console.log(`  → Updating ${order.orderNumber}: "${item.productName}" → "${productName}"`);
              order.items[i].productName = productName;
              orderUpdated = true;
              
              updates.push({
                orderNumber: order.orderNumber,
                oldName: 'Product',
                newName: productName,
              });
            } else {
              console.log(`  ⚠️ Product ${item.productId} not found in products or stocks collection`);
            }
          } catch (err: any) {
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

    return NextResponse.json({
      success: true,
      message: `Successfully updated ${updated} orders with correct product names`,
      updated,
      updates,
    });
  } catch (error: any) {
    console.error('❌ Fix product names failed:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fix product names' },
      { status: 500 }
    );
  }
}
