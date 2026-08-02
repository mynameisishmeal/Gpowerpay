# Gpowerpay Database Collections Summary

**Database**: `mfvpos` (shared with another app)  
**Total Collections**: 16  
**Total Documents**: 42,815  
**Last Updated**: July 22, 2026

---

## 🔴 CRITICAL COLLECTIONS (In Active Use)

### 1. **sales** - 42,008 documents
Sales transactions from POS system
```javascript
{
  productname: string,      // Product sold
  productprice: string,      // Price as string (e.g., "38000.00")
  productquantity: string,   // Quantity as string
  producttotal: string,      // Total as string
  paymentmethod: string,     // "cash", "transfer", "card"
  saledate: string,          // Format: "3-7-2025"
  seller: string,            // User email
  sharedid: string,          // Transaction group ID
  saletype: string,          // "Cartons" or "Kilos"
  regtime: Date
}
```

### 2. **products** - 21 documents (KILO PRODUCTS)
Legacy kilo products
```javascript
{
  productname: string,       // e.g., "Kg Panla"
  productprice: number,      // e.g., 2500
  productweight: number,     // Weight in kg
  email: string,            
  unique_id: number
}
```

### 3. **stocks** - 80 documents (CARTON PRODUCTS)
Legacy carton products with inventory tracking
```javascript
{
  stockname: string,         // e.g., "CRT OROBO"
  stockprice: number,        // e.g., 58000
  stockquantity: number,     // ACTUAL INVENTORY COUNT
  stockweight: number,       // Weight per carton (default: 10)
  email: string,
  regtime: Date
}
```

### 4. **customers** - 113 documents
Customer records with purchase history
```javascript
{
  name: string,              // e.g., "IYA AYO"
  phone: string,             // e.g., "07039370751"
  email: string,
  address: string,
  totalPurchases: number,    // Lifetime value
  lastPurchaseDate: Date,
  createdAt: Date
}
```

### 5. **credits** - 577 documents
Credit/debt tracking for customers
```javascript
{
  customerId: ObjectId,
  customerName: string,
  saleId: string,           // Links to sale sharedid
  amount: number,           // Total credit amount
  amountPaid: number,       // Amount already paid
  amountRemaining: number,  // Outstanding balance
  status: string,           // "paid", "partial", "unpaid"
  saleDate: string,
  payments: [{
    amount: number,
    paymentDate: string,
    paymentMethod: string
  }]
}
```

### 6. **users** - 8 documents
Admin/staff user accounts
```javascript
{
  unique_id: number,
  email: string,
  password: string,         // ⚠️ Plain text (security issue)
  firstname: string,
  lastname: string,
  phonenumber: string,
  role: string,            // "sadmin", "admin", "worker"
  permissions: {
    canViewInventory: boolean,
    canManageInventory: boolean,
    canViewCustomers: boolean,
    // ... more permissions
  },
  regtime: Date
}
```

---

## 🟡 CONFIGURATION COLLECTIONS

### 7. **settings** - 1 document
Store settings and receipt configuration
```javascript
{
  storeName: string,
  storeAddress: string,
  receiptFooter: string,
  receiptDisclaimer: string,
  lowStockThreshold: number,
  inventoryAlertsEnabled: boolean,
  paperWidth: number,        // 58mm
  showCustomer: boolean,
  showDateTime: boolean,
  // ... receipt formatting options
}
```

### 8. **businesstypeconfigs** - 5 documents
Business type templates (frozen_foods, restaurant, retail, etc.)
```javascript
{
  businessType: string,
  displayName: string,
  defaultSettings: {
    taxSettings: { enabled, rate, inclusive },
    defaultUnits: ["kg", "cartons", "pieces"],
    paymentMethods: ["cash", "transfer", "card"],
    salesTypes: ["retail", "wholesale"]
  },
  workflows: { salesFlow, inventoryFlow, reportingFlow }
}
```

### 9. **categories** - 1 document
Product categories (currently only "Uncategorized")
```javascript
{
  name: string,
  slug: string,
  description: string,
  status: string,
  productCount: number
}
```

### 10. ** printers** - 1 document (note: space in name)
Bluetooth printer configuration
```javascript
{
  email: string,
  serviceUUID: string,
  characteristicUUID: string
}
```

---

## 🔵 EMPTY COLLECTIONS (Reserved/Unused)

- **expenses** - 0 documents
- **riders** - 0 documents  
- **sessions** - 0 documents
- **tenants** - 0 documents
- **printers** - 0 documents (separate from " printers")
- **adminusers** - 0 documents

---

## 🔑 KEY RELATIONSHIPS

```
users (seller email)
  └─> sales (seller field)
       └─> customers (via customer name/phone)
            └─> credits (customerId)

products (kilo) ─┐
                 ├─> sales (productname match)
stocks (carton) ─┘

businesstypeconfigs
  └─> settings (applies business rules)
```

---

## ⚠️ IMPORTANT NOTES

1. **Shared Database**: This DB is used by another application - DO NOT migrate or alter existing schema
2. **Dual Product System**: 
   - `products` = kilo items (21)
   - `stocks` = carton items (80)
3. **String Numbers**: Sales data stores numbers as strings (e.g., `"38000.00"`)
4. **No Foreign Keys**: Relationships are by name/email matching (not ObjectId refs)
5. **Plain Text Passwords**: Users collection stores passwords in plain text ⚠️
6. **Sale Grouping**: `sharedid` field groups line items into single transactions

---

## 🎯 INTEGRATION STRATEGY

### For E-commerce Platform:

1. **Products**: Merge `products` + `stocks` collections
2. **Inventory**: Use `stockquantity` for cartons, assume unlimited for kilos
3. **Customers**: Map to new customer auth system
4. **Sales**: Read-only analytics/history
5. **Credits**: Customer credit management
6. **Users**: Map to admin users (migrate to secure auth)

### Adapter Pattern:
- LegacyProduct model → products collection
- LegacyStock model → stocks collection
- ProductAdapter → converts to unified interface
- Never write new schema to these collections
