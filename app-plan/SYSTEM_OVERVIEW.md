# 🌐 Gpowerpay System Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    GPOWERPAY PLATFORM                        │
└─────────────────────────────────────────────────────────────┘

┌──────────────────────┐              ┌──────────────────────┐
│   CUSTOMER APP       │              │    ADMIN SYSTEM      │
│   (USER_PLAN.md)     │              │  (ADMIN_PLAN.md)     │
├──────────────────────┤              ├──────────────────────┤
│ • Shop Products      │              │ • Manage Orders      │
│ • Fund Wallet        │◄────────────►│ • Manage Riders      │
│ • Add to Cart        │   Shared DB  │ • Assign Deliveries  │
│ • Checkout           │              │ • View Reports       │
│ • Track Orders       │              │ • Manage Users       │
│ • View History       │              │ • Configure System   │
└──────────────────────┘              └──────────────────────┘
          │                                      │
          │                                      │
          └──────────────┬───────────────────────┘
                         │
                    ┌────▼────┐
                    │ MongoDB │
                    │ Database│
                    └─────────┘
```

---

## User Roles & Access

### Customer Roles
| Role | Access Level | Description |
|------|--------------|-------------|
| **Customer** | User App | Shop, order, pay, track deliveries |

### Admin Roles
| Role | Access Level | Key Permissions |
|------|--------------|-----------------|
| **Super Admin** | Full Access | Everything + manage Support users + financial control |
| **Support** | High Access | Orders, riders, products, customers (no system config) |
| **Rider** | Mobile/Web | View assigned deliveries, update status |

---

## Key Workflows

### Customer Purchase Flow
```
1. Browse Products (Kilo or Carton Market)
   ↓
2. Add Items to Cart
   ↓
3. Go to Checkout
   ↓
4. Choose Delivery Option:
   ├─→ Home Delivery (select address, pay delivery fee)
   └─→ Store Pickup (free, select pickup time)
   ↓
5. Payment:
   ├─→ Wallet (if sufficient balance)
   ├─→ Quick Top-up (if insufficient)
   └─→ Paystack Direct Payment
   ↓
6. Order Confirmed → Tracking Number
   ↓
7. Admin Assigns Rider (if home delivery)
   ↓
8. Rider Delivers Order
   ↓
9. Customer Receives & Can Rate Order
```

### Admin Order Management Flow
```
1. New Order Alert (Customer places order)
   ↓
2. Admin Reviews Order
   ↓
3. Update Status → "Processing"
   ↓
4. If Home Delivery:
   ├─→ Select Available Rider
   ├─→ Assign Order to Rider
   └─→ Rider Notified
   ↓
5. Update Status → "Out for Delivery"
   ↓
6. Rider Delivers Order
   ↓
7. Rider Marks as "Delivered"
   ↓
8. Customer Notified
   ↓
9. Order Archived
```

---

## Database Collections Summary

| Collection | Purpose | Key Fields |
|------------|---------|------------|
| **users** | Customer accounts | email, walletBalance, addresses |
| **adminUsers** | Admin accounts | email, role (superadmin/support), permissions |
| **riders** | Delivery personnel | name, status, vehicle, performance |
| **orders** | Customer orders | items, payment, delivery, riderId |
| **walletTransactions** | Wallet audit trail | userId, type, amount, balance |
| **products** | Items by kilo | name, price/kg, quantity |
| **stock** | Items by carton | name, price/carton, quantity |
| **deliveryZones** | Delivery areas | zoneName, deliveryFee, areas |

---

## Payment Scenarios

### Scenario 1: Wallet Has Sufficient Balance
```
Cart: ₦8,000
Wallet: ₦10,000
Action: Deduct ₦8,000 from wallet
Result: Order placed, Wallet: ₦2,000
```

### Scenario 2: Wallet Insufficient
```
Cart: ₦8,000
Wallet: ₦3,000
Options Shown:
  A) Add ₦5,000 to wallet (quick top-up)
  B) Pay ₦8,000 via Paystack card
  C) Use ₦3,000 wallet + ₦5,000 card (split)
```

### Scenario 3: Empty Wallet
```
Cart: ₦6,000
Wallet: ₦0
Action: Redirect to fund wallet via Paystack
Result: After funding, auto-complete order
```

---

## Delivery Options

### Home Delivery
- Customer selects delivery address
- Delivery fee calculated based on zone
- Admin assigns available rider
- Rider picks up and delivers
- Customer tracks in real-time
- Estimated time: 1-4 hours

### Store Pickup
- Customer selects pickup time
- No delivery fee (₦0)
- Store address shown
- Customer picks up order
- Order ready notification sent
- No rider assignment needed

---

## Features Comparison

| Feature | Customer App | Admin System |
|---------|--------------|--------------|
| Authentication | ✅ Email + Social | ✅ Email Only |
| Dashboard | ✅ Wallet & Orders | ✅ Analytics |
| Products | ✅ Browse & Buy | ✅ Manage |
| Orders | ✅ Place & Track | ✅ Manage & Assign |
| Wallet | ✅ Fund & Spend | ✅ View & Adjust (SA) |
| Riders | ❌ | ✅ Manage |
| Reports | ❌ | ✅ Full Analytics |
| Settings | ✅ Profile | ✅ System Config |

---

## Technology Stack

### Frontend
- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS + Gpower Theme
- **Icons**: Lucide React
- **State**: React Context + Zustand
- **Forms**: React Hook Form + Zod

### Backend
- **API**: Next.js API Routes
- **Database**: MongoDB + Mongoose
- **Auth**: NextAuth.js v5
- **Payments**: Paystack
- **Email**: Resend/SendGrid

### Infrastructure
- **Hosting**: Vercel
- **Database**: MongoDB Atlas
- **CDN**: Cloudinary
- **Monitoring**: Vercel Analytics

---

## Security Measures

### Authentication
- ✅ Bcrypt password hashing (12 rounds)
- ✅ JWT with short expiry
- ✅ HTTP-only cookies for refresh tokens
- ✅ Rate limiting on login attempts
- ✅ Email verification required
- ✅ 2FA for admin users (recommended)

### Payment
- ✅ Paystack handles all card data
- ✅ Webhook signature verification
- ✅ Transaction logging
- ✅ Balance validation before deduction

### Data Protection
- ✅ HTTPS only
- ✅ Input sanitization
- ✅ CORS configuration
- ✅ CSP headers
- ✅ Role-based access control

---

## Development Timeline

### Phase 1: MVP (4 Weeks)
- Week 1: Authentication (Customer + Admin)
- Week 2: Products & Cart
- Week 3: Wallet & Paystack
- Week 4: Checkout & Orders

### Phase 2: Enhanced (3 Weeks)
- Week 5: Social Auth + Rider Management
- Week 6: Advanced Orders + Assignment
- Week 7: UX + Reports

### Phase 3: Launch (2 Weeks)
- Week 8: Testing & Optimization
- Week 9: Production Deployment

---

## Success Metrics

### Customer App
- Daily Active Users
- Order Completion Rate (>70%)
- Cart Abandonment (<60%)
- Average Order Value

### Admin System
- Average Order Processing Time
- Rider Utilization Rate
- Delivery Success Rate (>95%)
- Customer Satisfaction

---

## API Endpoints Summary

### Customer Endpoints
- `/api/auth/*` - Authentication
- `/api/products` - Browse products
- `/api/cart/*` - Cart management
- `/api/wallet/*` - Wallet operations
- `/api/orders/*` - Order management

### Admin Endpoints
- `/api/admin/auth/*` - Admin login
- `/api/admin/orders/*` - Order management
- `/api/admin/riders/*` - Rider management
- `/api/admin/customers/*` - Customer management
- `/api/admin/reports/*` - Analytics

---

## Future Enhancements

### Short-term (1-3 months)
- Product reviews & ratings
- Push notifications
- Referral program
- Promo codes

### Medium-term (3-6 months)
- Mobile apps (React Native)
- Subscription deliveries
- AI recommendations
- Loyalty program

### Long-term (6-12 months)
- B2B portal
- Multi-language
- AR product preview
- Advanced analytics

---

**For detailed information, see:**
- **USER_PLAN.md** - Complete customer app specs
- **ADMIN_PLAN.md** - Complete admin system specs
- **DATABASE_SCHEMA.md** - Full database design
- **DEVELOPMENT_PHASES.md** - Detailed timeline

---

**Document Version**: 1.0  
**Last Updated**: July 21, 2026  
**Status**: System Overview Complete
