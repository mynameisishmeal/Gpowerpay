import LegacyProduct from '@/models/LegacyProduct';
import LegacyStock from '@/models/LegacyStock';

/**
 * Populate product names for order items
 * Handles both kilo (LegacyProduct) and carton (LegacyStock) products
 */
export async function populateOrderItemNames(items: any[]) {
  return Promise.all(
    items.map(async (item) => {
      // Skip if already has a proper product name
      if (item.productName && item.productName !== 'Product') {
        return item;
      }

      try {
        let productName = null;

        // Check if it's a kilo product (productId starts with "kilo-")
        if (item.productId.startsWith('kilo-')) {
          const actualId = item.productId.replace('kilo-', '');
          const product = await LegacyProduct.findById(actualId).select('productname').lean();
          if (product?.productname) {
            productName = product.productname;
          }
        }
        // Check if it's a carton product (productId starts with "carton-")
        else if (item.productId.startsWith('carton-')) {
          const actualId = item.productId.replace('carton-', '');
          const stock = await LegacyStock.findById(actualId).select('stockname').lean();
          if (stock?.stockname) {
            productName = stock.stockname;
          }
        }

        return {
          ...item,
          productName: productName || item.productName || 'Product Name Not Available',
        };
      } catch (err) {
        console.error(`❌ Error fetching product ${item.productId}:`, err);
        return {
          ...item,
          productName: item.productName || 'Product Name Not Available',
        };
      }
    })
  );
}

/**
 * Populate product names for a single order
 */
export async function populateOrderProductNames(order: any) {
  const itemsWithNames = await populateOrderItemNames(order.items);
  return {
    ...order,
    items: itemsWithNames,
  };
}

/**
 * Populate product names for multiple orders
 */
export async function populateOrdersProductNames(orders: any[]) {
  return Promise.all(
    orders.map((order) => populateOrderProductNames(order))
  );
}
