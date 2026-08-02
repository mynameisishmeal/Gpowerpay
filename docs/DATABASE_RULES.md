# 🚨 CRITICAL DATABASE RULES - READ THIS FIRST

## Overview
**Gpowerpay SHARES a MongoDB database with Gpower CRM**. Both applications access the same collections and data.

---

## ⛔ HARD RULES - NEVER BREAK THESE

### 1. **DO NOT CREATE NEW COLLECTIONS**
- ❌ NEVER create: `adminusers`, `paycustomers`, `payproducts`, etc.
- ✅ USE EXISTING: `users`, `products`, `orders`, `categories`, etc.
- **Why**: Gpower CRM created these collections. They are the source of truth.

### 2. **DO NOT MODIFY EXISTING DATA WITHOUT PERMISSION**
- ❌ NEVER auto-upgrade passwords (plain text → bcrypt)
- ❌ NEVER change existing field structures
- ❌ NEVER delete or rename existing fields
- ✅ READ data as-is and work with what exists
- **Why**: Gpower CRM depends on this data structure. Breaking it breaks production.

### 3. **DO NOT ALTER AUTHENTICATION FORMATS**
- ❌ NEVER force password hashing on existing plain-text passwords
- ✅ Support BOTH bcrypt AND plain-text passwords for authentication
- **Why**: Gpower CRM uses plain-text passwords. We must support their format.

### 4. **ADDITIVE ONLY - NO DESTRUCTIVE CHANGES**
- ✅ You CAN add NEW fields to existing collections (e.g., `walletBalance`, `emailVerified`)
- ✅ You CAN add NEW optional fields
- ❌ NEVER remove or rename existing fields
- ❌ NEVER change existing field types
- **Why**: Gpower CRM will continue to use existing fields. Don't break their app.

---

## 📋 Architecture

```
┌─────────────────────────────────────────┐
│         SHARED MONGODB DATABASE         │
│                                         │
│  Collections (owned by Gpower CRM):    │
│  • users                                │
│  • products                             │
│  • categories                           │
│  • orders (added by Gpowerpay)         │
│  • reviews (added by Gpowerpay)        │
│  • riders (may be added later)         │
└─────────────────────────────────────────┘
           ↗                    ↖
    ┌──────────┐          ┌──────────────┐
    │  Gpower  │          │  Gpowerpay   │
    │   CRM    │          │ (Self-Checkout)│
    │  (Admin) │          │  (Customers) │
    └──────────┘          └──────────────┘
```

### Data Flow
- **Gpower CRM** → Creates products, manages inventory, creates admin users
- **Gpowerpay** → Customers browse products, place orders, write reviews
- **Both** → Read from same `users` collection (with different roles)

---

## 🔐 User/Authentication Model

### Shared `users` Collection
```javascript
{
  email: "user@example.com",
  password: "@PlainText123",        // ⚠️ Plain text from Gpower CRM
  role: "sadmin" | "admin" | "worker" | "customer" | "support",
  firstname: "John",
  lastname: "Doe",
  phonenumber: "1234567890",
  
  // Gpowerpay-specific fields (additive)
  walletBalance: 0,                // ✅ New field - OK
  emailVerified: false,            // ✅ New field - OK
  addresses: [],                   // ✅ New field - OK
  authProvider: "local",           // ✅ New field - OK
}
```

### Authentication Logic (MUST SUPPORT BOTH)
```typescript
// ✅ CORRECT - Support both formats
async comparePassword(candidatePassword: string): Promise<boolean> {
  // Try bcrypt first
  const isMatch = await bcrypt.compare(candidatePassword, this.password);
  if (isMatch) return true;
  
  // Fallback: plain text comparison (Gpower CRM legacy)
  if (!this.password.startsWith('$2')) {
    return candidatePassword === this.password; // ✅ DO NOT MODIFY
  }
  
  return false;
}

// ❌ WRONG - Auto-upgrade breaks Gpower CRM
async comparePassword(candidatePassword: string): Promise<boolean> {
  const isMatch = await bcrypt.compare(candidatePassword, this.password);
  if (isMatch) return true;
  
  if (!this.password.startsWith('$2')) {
    if (candidatePassword === this.password) {
      this.password = await bcrypt.hash(candidatePassword, 10); // ❌ NEVER DO THIS
      await this.save();
      return true;
    }
  }
  
  return false;
}
```

---

## 📦 Products Collection

### Structure (Created by Gpower CRM)
```javascript
{
  name: "Product Name",
  cartonPrice: 1000,
  kiloPrice: 50,
  quantityInStock: 100,
  category: ObjectId("..."),
  description: "...",
  images: ["url1", "url2"],
  // ... other fields created by Gpower CRM
  
  // Gpowerpay can ADD (not modify):
  reviews: [],              // ✅ New field - OK
  averageRating: 0,         // ✅ New field - OK
  totalReviews: 0,          // ✅ New field - OK
}
```

### Rules
- ✅ READ product data
- ✅ ADD new fields (reviews, ratings)
- ❌ NEVER change `cartonPrice`, `kiloPrice`, `quantityInStock`
- ❌ NEVER delete products
- **Why**: Gpower CRM manages inventory. We only display it.

---

## 🛒 Orders Collection

### Who Owns This?
**Gpowerpay creates this collection** for customer self-checkout orders.

### Structure
```javascript
{
  orderId: "GP-20240101-001",
  customerId: ObjectId("..."),      // Reference to users collection
  customerPhone: "1234567890",
  items: [{
    productId: ObjectId("..."),     // Reference to products
    productName: "...",
    price: 1000,
    quantity: 2,
    marketType: "carton" | "kilo",
  }],
  subtotal: 2000,
  deliveryFee: 500,
  total: 2500,
  deliveryOption: "home" | "pickup",
  deliveryAddress: {...},
  paymentMethod: "wallet" | "paystack" | "split",
  status: "pending" | "confirmed" | "processing" | "completed" | "cancelled",
  createdAt: Date,
}
```

### Rules
- ✅ Gpowerpay CREATES and MANAGES orders
- ✅ Gpower CRM can READ orders to fulfill them
- ❌ Don't assume Gpower CRM will modify order structure

---

## 🚦 When Adding New Features

### Before You Code - Ask These Questions:
1. **Does this collection already exist in Gpower CRM?**
   - YES → Use it, don't create a new one
   - NO → Safe to create (e.g., `orders`, `reviews`, `wishlists`)

2. **Am I modifying existing data?**
   - YES → STOP. Get approval first.
   - NO → Proceed carefully.

3. **Am I changing authentication behavior?**
   - YES → STOP. Must support Gpower CRM's format.
   - NO → Proceed.

4. **Am I adding fields to existing collections?**
   - Make them OPTIONAL and NON-BREAKING
   - Add defaults so Gpower CRM can ignore them

---

## 📝 Examples

### ✅ GOOD: Adding New Customer-Only Feature
```typescript
// Adding wishlist collection (doesn't exist in Gpower CRM)
const WishlistSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  products: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
  createdAt: { type: Date, default: Date.now }
});

// ✅ NEW collection, customer-facing only, doesn't affect CRM
```

### ❌ BAD: Creating Duplicate Collection
```typescript
// ❌ WRONG - This breaks shared database model
const PayCustomerSchema = new Schema({
  email: String,
  password: String,
  // ... duplicating users collection
});

// Use the existing 'users' collection instead!
```

### ✅ GOOD: Adding Field to Existing Collection
```typescript
// Adding walletBalance to users (optional, non-breaking)
UserSchema.add({
  walletBalance: { type: Number, default: 0 } // ✅ Optional, has default
});

// Gpower CRM won't use it, won't break their app
```

### ❌ BAD: Modifying Existing Field
```typescript
// ❌ WRONG - Changing password field behavior
UserSchema.pre('save', async function() {
  // Force hash all passwords
  this.password = await bcrypt.hash(this.password, 10);
});

// This breaks Gpower CRM's plain-text passwords!
```

---

## 🔧 Migration Strategy (If Ever Needed)

If you ever need to migrate data (e.g., hash all passwords):

1. **COORDINATE WITH GPOWER CRM TEAM**
2. Update BOTH applications simultaneously
3. Test on staging database first
4. Have rollback plan ready
5. Schedule during maintenance window

**NEVER migrate data in Gpowerpay alone!**

---

## 📞 When In Doubt

**ASK THE USER BEFORE:**
- Creating new collections
- Modifying existing collections
- Changing authentication logic
- Altering data formats
- Running migration scripts

**REMEMBER:** This is production data used by TWO applications. Break one, break both.

---

## 🎯 Summary

| Action | Gpowerpay | Gpower CRM | Rule |
|--------|-----------|------------|------|
| Create `users` | ❌ | ✅ | Use existing |
| Create `products` | ❌ | ✅ | Use existing |
| Create `orders` | ✅ | Read-only | Gpowerpay owns |
| Add `walletBalance` to users | ✅ | Ignores | Optional field OK |
| Hash plain-text passwords | ❌ | N/A | Support both formats |
| Delete users | ❌ | ❌ | Coordinate first |
| Update product prices | ❌ | ✅ | CRM manages inventory |

---

**Last Updated:** 2026-01-23
**Next Review:** Before any schema changes
