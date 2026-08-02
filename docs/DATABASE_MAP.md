# MFVPOS_TEST Database Schema Map

**Database:** `mfvpos_test` (cloned from production `mfvpos`)  
**Generated:** 2026-08-01  
**Purpose:** Test database for Gpowerpay development (safe to modify)

---

## 🗂️ COLLECTIONS SUMMARY (23 total)

| Collection | Documents | Purpose |
|------------|-----------|---------|
| **sales** | 42,939 | Sales transactions (legacy GpowerCRM) |
| **credits** | 589 | Credit records |
| **customers** | 121 | Customer records (legacy GpowerCRM) |
| **stocks** | 94 | **CARTON products** - items sold by carton |
| **products** | 23 | **KILO products** - items sold by kilogram |
| **users** | 13 | User accounts (shared with GpowerCRM) |
| **businesstypeconfigs** | 5 | Business configuration |
| **orders** | 4 | E-commerce orders (Gpowerpay) |
| **wallets** | 4 | User wallet balances |
| **categories** | 1 | Product categories |
| **reviews** | 1 | Product reviews |
| **settings** | 1 | System settings |
| **wishlists** | 1 | User wishlists |
| **+printers** | 1 | Printer config (legacy name) |
| **adminusers** | 0 | Admin users (empty) |
| **expenses** | 0 | Expense records (empty) |
| **printers** | 0 | Printer config (empty) |
| **riders** | 0 | Delivery riders (empty) |
| **sessions** | 0 | Session storage (empty) |
| **tenants** | 0 | Multi-tenancy (empty) |
| **verificationtokens** | 0 | Email verification tokens (empty) |

---

## 📦 KEY COLLECTIONS DETAILED

### 🔴 **products** (23 docs) - KILO ITEMS

**Purpose:** Items sold by KILOGRAM (e.g., loose fish, meat)  
**Composite ID format:** `kilo-{ObjectId}`

**Key Fields:**
- `productname` - Product name
- `productprice` - Price per kilo
- `productweight` - Weight per unit
- `productquantity` - Inventory quantity
- `productimage` - Image URL (NEW - added for Gpowerpay)
- `productdescription` - Description (NEW)
- `productbrand` - Brand name (NEW)
- `regtime` - Registration timestamp

**Indexes:**
- `productname_1`
- `regtime_-1` 
- `category_1` (legacy, unused)
- Text search on `name`

---

### 🔵 **stocks** (94 docs) - CARTON ITEMS

**Purpose:** Items sold by CARTON (e.g., boxed goods, bulk items)  
**Composite ID format:** `carton-{ObjectId}`

**Key Fields:**
- `stockname` - Stock/product name
- `stockprice` - Price per carton
- `stockquantity` - Number of cartons in stock
- `stockweight` - Weight per carton (units per carton)
- `stockimage` - Image URL (NEW - added for Gpowerpay)
- `regtime` - Registration timestamp

**Indexes:**
- `stockname_1`
- `stockquantity_1`
- `regtime_-1`

---

### 👤 **users** (13 docs)

**Purpose:** User accounts (SHARED with GpowerCRM - DO NOT BREAK!)

**IMPORTANT:** Role names are legacy from GpowerCRM:
- `sadmin` = Super Admin
- `admin` = Support/Admin  
- `worker` = Customer (legacy name)
- `customer` = Customer (new name)
- `support` = Support role

**Key Fields:**
- `unique_id` - Numeric ID
- `email` - Email (unique)
- `password` - Plain text OR bcrypt (mixed - legacy compatibility)
- `name` - Display name
- `firstname`, `lastname` - Name parts
- `phonenumber` - Phone
- `role` - User role (see above)
- `walletBalance` - Wallet balance (Gpowerpay)
- `addresses` - Delivery addresses array (Gpowerpay)
- `emailVerified` - Email verification status
- `isActive` - Account active flag
- `isBlocked` - Account blocked flag
- `authProvider` - 'local', 'google', 'facebook', 'apple'
- `regtime` - Registration date

**Indexes:**
- `email_1` (unique)
- `phone_1` (sparse)
- `role_1`
- `isActive_1`

**⚠️ WARNING:** Passwords are MIXED (plain text + bcrypt) for legacy GpowerCRM compatibility. DO NOT auto-upgrade passwords!

---

### 🛒 **orders** (4 docs)

**Purpose:** E-commerce orders (Gpowerpay only, not GpowerCRM)

**Key Fields:**
- `orderNumber` - Unique order number
- `customerId` - User ID
- `items` - Array of order items
- `totalAmount` - Total order amount
- `paymentMethod` - Payment method
- `paymentStatus` - 'pending', 'paid', 'failed'
- `status` - Order status
- `shippingAddress` - Delivery address
- `createdAt` - Order date

**Indexes:**
- `orderNumber_1` (unique)
- `customerId_1_createdAt_-1`
- `status_1_createdAt_-1`

---

### 💰 **sales** (42,939 docs)

**Purpose:** Sales transactions (legacy GpowerCRM POS system)

**Key Fields:**
- `sale_no` - Sale number
- `sharedid` - Transaction group ID
- `productname` - Product sold
- `quantity` - Quantity sold
- `saleprice` - Price per unit
- `total` - Total amount
- `seller` - Salesperson name
- `customerName` - Customer name
- `customerId` - Customer ID (if linked)
- `saledate` - Sale date
- `paymentmethod` - Payment method
- `saletype` - 'kilo' or 'carton'
- `regtime` - Registration time

**Indexes:**
- `saledate_-1`
- `seller_1_saledate_-1`
- `customerId_1`

---

### 👥 **customers** (121 docs)

**Purpose:** Customer records (legacy GpowerCRM, separate from users)

**Key Fields:**
- `name` - Customer name (unique, case-insensitive)
- `email` - Email address
- `phone` - Phone number
- `address` - Physical address
- `totalPurchases` - Lifetime purchase amount
- `lastPurchaseDate` - Last purchase date
- `createdAt` - Customer creation date

**Indexes:**
- `name_1` (unique, case-insensitive collation)
- `email_1`
- Text search on `name`

**Note:** This is separate from `users` collection - customers may not have user accounts.

---

### 💳 **credits** (589 docs)

**Purpose:** Credit/debt records for customers

**Key Fields:**
- Customer credit information
- Transaction history
- Balance tracking

---

### 💵 **wallets** (4 docs)

**Purpose:** User wallet balances (Gpowerpay)

**Key Fields:**
- `userId` - User ID (unique)
- `balance` - Current balance
- `transactions` - Array of transaction history
  - `reference` - Unique transaction reference
  - `amount` - Transaction amount
  - `type` - 'credit', 'debit'
  - `description` - Transaction description
  - `createdAt` - Transaction date

**Indexes:**
- `userId_1` (unique)
- `transactions.reference_1` (unique, sparse)

---

### ⭐ **reviews** (1 doc)

**Purpose:** Product reviews

**Key Fields:**
- `productId` - Product ID
- `customerId` - Customer ID
- `rating` - 1-5 star rating
- `comment` - Review text
- `status` - 'pending', 'approved', 'rejected'
- `createdAt` - Review date

**Indexes:**
- `productId_1_customerId_1` (unique)
- `productId_1_status_1_createdAt_-1`

---

### 🗂️ **categories** (1 doc)

**Purpose:** Product categories (legacy, mostly unused in Gpowerpay)

**Key Fields:**
- `name` - Category name
- `slug` - URL slug (unique)
- `parent` - Parent category ID
- `ancestors` - Array of ancestor IDs
- `order` - Display order
- `isActive` - Active flag
- `isFeatured` - Featured flag

**Note:** Categories were removed from Gpowerpay admin (user sells frozen foods only, no categories needed).

---

### ❤️ **wishlists** (1 doc)

**Purpose:** User wishlist

**Key Fields:**
- `userId` - User ID (unique)
- `customerId` - Customer ID
- `customerEmail` - Customer email
- `items` - Array of wishlist items
  - `productId` - Product ID
  - `addedAt` - Date added

**Indexes:**
- `userId_1` (unique)
- `customerId_1`
- `items.productId_1`

---

### ⚙️ **businesstypeconfigs** (5 docs)

**Purpose:** Business configuration settings

---

### 🔧 **settings** (1 doc)

**Purpose:** System-wide settings

---

## 🚨 IMPORTANT NOTES

### Legacy Schema Compatibility

1. **SHARED DATABASE:** This database is shared between:
   - Gpowerpay (e-commerce app - this codebase)
   - GpowerCRM (legacy POS/CRM system)

2. **DO NOT MODIFY:**
   - User passwords (mixed plain text + bcrypt)
   - Role names (sadmin, admin, worker)
   - Collection structures for: sales, customers, credits
   - Any fields used by GpowerCRM

3. **Dual Product System:**
   - `products` collection = **KILO items** (sold by weight)
   - `stocks` collection = **CARTON items** (sold by box/carton)
   - Use composite IDs: `kilo-{ObjectId}` or `carton-{ObjectId}`

4. **New Fields Added for Gpowerpay:**
   - `products.productimage` - Image URL
   - `products.productdescription` - Description
   - `products.productbrand` - Brand
   - `stocks.stockimage` - Image URL

### Adapter Pattern

The codebase uses `ProductAdapter` to convert legacy schema to new format:
- `ProductAdapter.kiloToNewFormat()` - Converts products → IProduct
- `ProductAdapter.cartonToNewFormat()` - Converts stocks → IProduct

### Database Connections

- **Production:** `mongodb://...@.../mfvpos` (used by GpowerCRM - DO NOT TOUCH)
- **Test:** `mongodb://...@.../mfvpos_test` (safe clone for development)

---

## 📝 FIELD NAME MAPPING

### Products (Kilo) → IProduct

| Legacy Field | New Field | Type |
|--------------|-----------|------|
| `productname` | `name` | string |
| `productprice` | `pricing.kilo.price` | number |
| `productweight` | `weight` | number |
| `productquantity` | `inventory.kilo.stock` | number |
| `productimage` | `images[0].url` | string |
| `productdescription` | `description` | string |
| `productbrand` | `brand` | string |
| `regtime` | `createdAt` | Date |

### Stocks (Carton) → IProduct

| Legacy Field | New Field | Type |
|--------------|-----------|------|
| `stockname` | `name` | string |
| `stockprice` | `pricing.carton.price` | number |
| `stockquantity` | `inventory.carton.stock` | number |
| `stockweight` | `pricing.carton.unitsPerCarton` | number |
| `stockimage` | `images[0].url` | string |
| `regtime` | `createdAt` | Date |

---

## 🔍 COMMON QUERIES

### Get all users (not just customers)
```typescript
User.find({}) // Don't filter by role
```

### Get kilo product by ID
```typescript
LegacyProduct.findById(objectId)
// Composite ID: kilo-{objectId}
```

### Get carton product by ID
```typescript
LegacyStock.findById(objectId)
// Composite ID: carton-{objectId}
```

### Update product image (kilo)
```typescript
LegacyProduct.findByIdAndUpdate(
  objectId,
  { $set: { productimage: url } },
  { new: true, strict: false }
)
```

### Update product image (carton)
```typescript
LegacyStock.findByIdAndUpdate(
  objectId,
  { $set: { stockimage: url } },
  { new: true, strict: false }
)
```

---

**Last Updated:** August 1, 2026  
**Maintained By:** AI Assistant for Gpowerpay Development
