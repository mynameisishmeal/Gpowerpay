# 🗄️ Database Schema - Gpowerpay

## Database Overview

**Database**: MongoDB (NoSQL)  
**ODM**: Mongoose  
**Connection**: MongoDB Atlas (Cloud)

---

## Collections

### 1. Users Collection

Stores customer account information, wallet balance, and addresses.

```typescript
interface IUser {
  _id: ObjectId;
  email: string; // unique, required
  password?: string; // hashed with bcrypt, null for social auth
  name: string; // required
  phone?: string;
  profilePicture?: string; // URL to image
  
  // Role (for system)
  role: 'customer'; // Always customer for this collection
  
  // Authentication
  authProvider: 'local' | 'google' | 'facebook' | 'apple';
  authProviderId?: string; // ID from social provider
  
  // Wallet
  walletBalance: number; // default: 0, in Naira
  
  // Addresses
  addresses: [{
    _id: ObjectId;
    street: string;
    city: string;
    state: string;
    landmark?: string;
    phone: string;
    isDefault: boolean; // default: false
  }];
  
  // Verification
  emailVerified: boolean; // default: false
  phoneVerified: boolean; // default: false
  emailVerificationToken?: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  
  // Account Status
  isActive: boolean; // default: true
  isBlocked: boolean; // default: false (admin can block users)
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
}
```

**Indexes**:
- `email`: unique
- `phone`: sparse (optional field)
- `authProviderId`: sparse
- `createdAt`: desc
- `isActive`: asc
- `isBlocked`: asc

---

### 2. Wallet Transactions Collection

Audit trail for all wallet activities (funding, deductions, refunds).

```typescript
interface IWalletTransaction {
  _id: ObjectId;
  userId: ObjectId; // ref: Users
  
  // Transaction Details
  type: 'credit' | 'debit' | 'refund';
  amount: number; // in Naira
  balanceBefore: number;
  balanceAfter: number;
  
  // Description
  description: string; // e.g., 'Wallet funding', 'Order payment', 'Refund for order #GP12345'
  
  // Payment Details
  paymentMethod?: 'paystack' | 'wallet' | 'admin';
  paystackReference?: string; // Paystack transaction reference
  
  // Status
  status: 'pending' | 'successful' | 'failed';
  
  // Related Order (if applicable)
  orderId?: ObjectId; // ref: Orders
  
  // Metadata
  metadata?: any; // Additional data from Paystack
  
  // Timestamps
  createdAt: Date;
}
```

**Indexes**:
- `userId`: asc
- `type`: asc
- `status`: asc
- `createdAt`: desc
- Compound: `{userId: 1, createdAt: -1}`

---

### 3. Orders Collection

Stores customer orders with items, payment, and delivery information.

```typescript
interface IOrder {
  _id: ObjectId;
  orderNumber: string; // unique, e.g., 'GP12345'
  
  // Customer Info
  userId: ObjectId; // ref: Users
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  
  // Order Items
  items: [{
    productId: ObjectId; // ref: Product or Stock
    productName: string;
    marketType: 'kilo' | 'carton';
    unitPrice: number;
    quantity: number;
    subtotal: number;
  }];
  
  // Pricing
  subtotal: number; // sum of item subtotals
  deliveryFee: number;
  discount: number; // default: 0
  totalAmount: number; // subtotal + deliveryFee - discount
  
  // Payment
  paymentMethod: 'wallet' | 'paystack' | 'split';
  paymentStatus: 'paid' | 'pending' | 'failed';
  paystackReference?: string;
  walletTransactionId?: ObjectId; // ref: WalletTransactions
  
  // Delivery
  deliveryAddress: {
    street: string;
    city: string;
    state: string;
    landmark?: string;
    phone: string;
  };
  deliveryOption: 'home_delivery' | 'store_pickup';
  deliveryDate?: Date; // preferred delivery date
  deliveryZoneId?: ObjectId; // ref: DeliveryZones
  
  // Rider Assignment (for home delivery)
  riderId?: ObjectId; // ref: Riders
  riderName?: string; // cached for quick display
  riderPhone?: string; // cached for quick display
  assignedAt?: Date; // when rider was assigned
  pickedUpAt?: Date; // when rider picked up order
  
  // Order Status
  orderStatus: 'pending' | 'processing' | 'out_for_delivery' | 'delivered' | 'cancelled';
  cancellationReason?: string; // if cancelled
  
  // Timestamps
  orderDate: Date;
  deliveredAt?: Date;
  cancelledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Notes
  customerNotes?: string;
  adminNotes?: string; // internal notes for admins
  riderNotes?: string; // notes from rider
}
```

**Indexes**:
- `orderNumber`: unique
- `userId`: asc
- `orderStatus`: asc
- `orderDate`: desc
- `createdAt`: desc
- Compound: `{userId: 1, orderDate: -1}`
- Compound: `{orderStatus: 1, orderDate: -1}`

---

### 4. Products Collection (Existing - Kilos)

Enhanced version of existing Product collection.

```typescript
interface IProduct {
  _id: ObjectId;
  unique_id?: number; // legacy field
  email?: string; // legacy field
  
  // Product Info
  productname: string; // required, indexed
  productprice: number; // price per kilo, required
  productquantity: number; // available kilos, default: 0
  productweight: number; // weight per unit, required
  
  // New Fields for Customer App
  productImage?: string; // URL to product image
  productDescription?: string;
  category?: string; // e.g., 'Chicken', 'Fish', 'Beef'
  isActive: boolean; // default: true (for hiding products)
  
  // Timestamps
  regtime: Date; // default: Date.now, indexed
}
```

**Indexes**:
- `productname`: asc
- `regtime`: desc
- Compound: `{productname: 1, regtime: -1}`
- `isActive`: asc (for filtering active products)

---

### 5. Stock Collection (Existing - Cartons)

Enhanced version of existing Stock collection.

```typescript
interface IStock {
  _id: ObjectId;
  email?: string; // legacy field
  
  // Stock Info
  stockname: string; // required, indexed
  stockprice: number; // price per carton, required
  stockquantity: number; // available cartons, required, indexed
  stockweight: number; // weight per carton, required
  
  // New Fields for Customer App
  piecesPerCarton?: number; // number of items in a carton
  stockImage?: string; // URL to stock image
  stockDescription?: string;
  category?: string; // e.g., 'Chicken Cartons', 'Fish Cartons'
  isActive: boolean; // default: true
  
  // Timestamps
  regtime: Date; // default: Date.now, indexed
}
```

**Indexes**:
- `stockname`: asc
- `stockquantity`: asc
- `regtime`: desc
- Compound: `{stockname: 1, regtime: -1}`
- `isActive`: asc

---

### 6. Admin Users Collection

Stores Super Admin and Support user accounts with role-based permissions.

```typescript
interface IAdminUser {
  _id: ObjectId;
  
  // Credentials
  email: string; // unique, required
  password: string; // hashed with bcrypt, required
  
  // Profile
  fullName: string; // required
  phone?: string;
  profilePicture?: string; // URL to image
  
  // Role
  role: 'superadmin' | 'support';
  
  // Security
  twoFactorEnabled: boolean; // default: false
  twoFactorSecret?: string;
  ipWhitelist?: string[]; // optional IP restrictions (for superadmin)
  
  // Status
  isActive: boolean; // default: true
  lastLogin?: Date;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  createdBy?: ObjectId; // ref: AdminUsers (Super Admin who created this user)
}
```

**Indexes**:
- `email`: unique
- `role`: asc
- `isActive`: asc
- `createdAt`: desc

**Roles**:
- **superadmin**: Full system access, manage Support users, financial control
- **support**: Manage orders, riders, products, customers (cannot modify system settings or other users)

---

### 7. Riders Collection

Stores rider information for delivery personnel.

```typescript
interface IRider {
  _id: ObjectId;
  
  // Personal Info
  fullName: string; // required
  email: string; // unique, required
  phone: string; // unique, required
  password: string; // hashed with bcrypt, required
  profilePhoto?: string; // URL to image
  
  // Identification
  idNumber: string; // required
  licenseNumber?: string; // optional
  
  // Vehicle
  vehicleType: 'motorcycle' | 'bike' | 'car'; // required
  vehiclePlateNumber: string; // required
  
  // Address
  homeAddress: string;
  city: string;
  state: string;
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  
  // Bank Details (for payments)
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  
  // Status
  status: 'available' | 'on_delivery' | 'offline' | 'suspended';
  
  // Performance Metrics
  totalDeliveries: number; // default: 0
  completedDeliveries: number; // default: 0
  cancelledDeliveries: number; // default: 0
  averageRating: number; // default: 0
  onTimeDeliveryRate: number; // default: 0 (percentage)
  
  // Financial
  totalEarnings: number; // default: 0
  pendingPayment: number; // default: 0
  paymentPerDelivery: number; // configurable
  
  // Verification
  emailVerified: boolean; // default: false
  phoneVerified: boolean; // default: false
  documentsVerified: boolean; // default: false (admin verifies)
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  lastActive?: Date;
  addedBy?: ObjectId; // ref: AdminUsers (which admin added this rider)
}
```

**Indexes**:
- `email`: unique
- `phone`: unique
- `status`: asc
- `createdAt`: desc
- Compound: `{status: 1, totalDeliveries: -1}` (for assignment logic)

---

### 8. Delivery Zones Collection

Stores delivery zone configurations and fees.

```typescript
interface IDeliveryZone {
  _id: ObjectId;
  
  // Zone Info
  zoneName: string; // required, e.g., "Lagos Mainland"
  zoneCode?: string; // optional code, e.g., "LM1"
  areas: string[]; // list of areas/landmarks in this zone
  
  // Pricing
  deliveryFee: number; // required, fee for this zone
  
  // Settings
  estimatedDeliveryTime: string; // e.g., "1-2 hours", "Same day"
  maxDeliveryDistance?: number; // in km (optional)
  isActive: boolean; // default: true
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}
```

**Indexes**:
- `zoneName`: asc
- `zoneCode`: unique, sparse
- `isActive`: asc

---

### 6. Cart Collection (Optional - Can use Session Storage)

Persistent cart storage in database (alternative to localStorage).

```typescript
interface ICart {
  _id: ObjectId;
  userId: ObjectId; // ref: Users
  
  // Cart Items
  items: [{
    productId: ObjectId; // ref: Product or Stock
    productName: string;
    marketType: 'kilo' | 'carton';
    unitPrice: number;
    quantity: number;
    subtotal: number;
  }];
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date; // auto-delete after 30 days
}
```

**Indexes**:
- `userId`: unique
- `expiresAt`: asc (for TTL auto-deletion)

---

## Relationships

### User → Orders
- One-to-Many: A user can have multiple orders
- Reference: `Order.userId` → `User._id`

### User → Wallet Transactions
- One-to-Many: A user can have multiple wallet transactions
- Reference: `WalletTransaction.userId` → `User._id`

### Order → Wallet Transaction
- One-to-One: An order can have one wallet transaction
- Reference: `Order.walletTransactionId` → `WalletTransaction._id`

### Order Items → Products/Stock
- Many-to-One: Order items reference products or stock
- Reference: `Order.items[].productId` → `Product._id` or `Stock._id`

---

## Data Validation Rules

### Users
- Email must be unique and valid format
- Password minimum 8 characters (if not social auth)
- Phone must be valid Nigerian format (optional)
- At least one address required before first order

### Wallet Transactions
- Amount must be positive
- `balanceAfter` must equal `balanceBefore + amount` (credit) or `balanceBefore - amount` (debit)
- Cannot debit more than available balance

### Orders
- Order number must be unique and auto-generated
- Total amount must match: `subtotal + deliveryFee - discount`
- Cannot create order with out-of-stock items
- Delivery address required for home delivery

### Products & Stock
- Price must be positive
- Quantity cannot be negative
- Name must be unique (case-insensitive)

---

## Indexes Strategy

### Performance Optimization
- Index frequently queried fields (userId, orderNumber, orderStatus)
- Compound indexes for common query patterns
- TTL indexes for auto-cleanup (cart, expired tokens)

### Query Examples

**Get user's order history**:
```javascript
db.orders.find({ userId: ObjectId("...") }).sort({ orderDate: -1 })
// Uses index: {userId: 1, orderDate: -1}
```

**Get wallet transactions**:
```javascript
db.walletTransactions.find({ userId: ObjectId("...") }).sort({ createdAt: -1 })
// Uses index: {userId: 1, createdAt: -1}
```

**Get active products**:
```javascript
db.products.find({ isActive: true, productquantity: { $gt: 0 } })
// Uses index: {isActive: 1}
```

---

## Migration Plan

### Phase 1: Add New Fields to Existing Collections
- Add `isActive`, `productImage`, `productDescription`, `category` to Products
- Add `isActive`, `stockImage`, `stockDescription`, `piecesPerCarton`, `category` to Stock
- Set default `isActive: true` for all existing records

### Phase 2: Create New Collections
- Create Users collection with indexes
- Create Orders collection with indexes
- Create WalletTransactions collection with indexes
- Create Cart collection (optional)

### Phase 3: Data Seeding
- Create initial admin/test users
- Add product images to existing products
- Set up default categories

---

**Document Version**: 1.0  
**Last Updated**: July 21, 2026  
**Status**: Schema Design Complete
