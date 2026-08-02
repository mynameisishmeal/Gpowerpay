# ⚡ Quick Start Guide - Gpowerpay

## 🎯 What is Gpowerpay?

A customer-facing e-commerce app where users can:
- Login with Google/Facebook or Email
- Fund a digital wallet via Paystack
- Buy frozen foods by Kilo or Carton
- Pay from wallet balance
- Track orders in real-time

**Target Users**: Ages 25+ (user-friendly design is key!)

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| **README.md** | Overview and navigation |
| **APP_PLAN.md** | Complete feature specifications (⭐ Start here!) |
| **DATABASE_SCHEMA.md** | All database models and relationships |
| **DEVELOPMENT_PHASES.md** | 9-week timeline with detailed tasks |
| **QUICK_START.md** | This file - quick reference |

---

## 🏗️ Project Structure

```
gpowerpay/
├── src/
│   ├── app/                  # Next.js 16 App Router
│   │   ├── (auth)/          # Auth pages (login, register)
│   │   ├── shop/            # Shop pages (products, cart)
│   │   ├── wallet/          # Wallet pages
│   │   ├── checkout/        # Checkout flow
│   │   ├── orders/          # Order history & details
│   │   ├── profile/         # User profile
│   │   └── api/             # API routes
│   ├── components/          # React components
│   │   ├── ui/             # UI components (button, card, etc.)
│   │   ├── cart/           # Cart components
│   │   ├── products/       # Product components
│   │   └── wallet/         # Wallet components
│   └── lib/                 # Utilities
│       ├── db.ts           # MongoDB connection
│       ├── auth.ts         # Auth helpers
│       └── paystack.ts     # Paystack helpers
├── models/                  # Mongoose models
│   ├── User.ts
│   ├── Order.ts
│   ├── WalletTransaction.ts
│   ├── Product.ts (existing)
│   └── Stock.ts (existing)
└── app-plan/               # This folder
```

---

## 🚀 Development Timeline

### Phase 1: MVP (4 weeks)
- **Week 1**: Authentication & User Profile
- **Week 2**: Product Catalog & Shopping Cart
- **Week 3**: Wallet & Paystack Integration
- **Week 4**: Checkout & Orders

### Phase 2: Enhanced (3 weeks)
- **Week 5**: Social Authentication (Google, Facebook)
- **Week 6**: Advanced Order Features (tracking, receipts)
- **Week 7**: UX Improvements (search, favorites)

### Phase 3: Launch (2 weeks)
- **Week 8**: Testing & Optimization
- **Week 9**: Production Deployment & Launch 🎉

---

## 🔑 Key Features Breakdown

### Authentication
- Email/Password registration
- Google OAuth
- Facebook OAuth
- Profile management
- Password reset

### Digital Wallet
- **Fund**: Via Paystack (card, bank transfer, USSD)
- **Pay**: From wallet balance
- **Track**: Transaction history
- **Smart**: Shows deficit, offers quick top-up

### Shopping
- **Kilo Market**: Buy by weight (0.5kg, 1kg, 2kg, etc.)
- **Carton Market**: Buy by carton
- **Toggle**: Easy switch between markets
- **Search**: Find products quickly
- **Filters**: Price, availability, category

### Cart & Checkout
- Add/remove items
- Update quantities
- See total with delivery fee
- 4-step checkout process
- Multiple payment options

### Orders
- Track status (Pending → Delivered)
- View history
- Download receipts
- Reorder with one click
- Rate and review

---

## 🗄️ Database Collections

| Collection | Purpose |
|------------|---------|
| **users** | Customer accounts, wallet balance, addresses |
| **orders** | Customer orders with items & delivery info |
| **walletTransactions** | Audit trail for wallet activities |
| **products** | Existing - items sold by kilo |
| **stock** | Existing - items sold by carton |

---

## 🔌 Key API Endpoints

### Authentication
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`

### Wallet
- `GET /api/wallet/balance`
- `POST /api/wallet/fund/initialize`
- `POST /api/wallet/fund/verify`
- `GET /api/wallet/transactions`

### Products
- `GET /api/products` (kilo market)
- `GET /api/stock` (carton market)
- `GET /api/products/search`

### Cart
- `GET /api/cart`
- `POST /api/cart/add`
- `PUT /api/cart/update/:itemId`
- `DELETE /api/cart/remove/:itemId`

### Orders
- `POST /api/orders/checkout`
- `GET /api/orders`
- `GET /api/orders/:orderNumber`

---

## 💰 Payment Flow Scenarios

### Scenario 1: Wallet Has Enough Balance
```
Cart Total: ₦5,000
Wallet: ₦10,000
→ Pay from wallet ✅
→ New Balance: ₦5,000
```

### Scenario 2: Wallet Insufficient
```
Cart Total: ₦8,000
Wallet: ₦3,000
→ Show options:
   A) Add ₦5,000 to wallet
   B) Pay ₦8,000 via card
   C) Use ₦3,000 wallet + ₦5,000 card (split)
```

### Scenario 3: Empty Wallet
```
Cart Total: ₦6,000
Wallet: ₦0
→ Redirect to fund wallet
→ Return and auto-complete order
```

---

## 🎨 Design Guidelines

### Typography
- Body: 16px minimum
- Headings: 24px+ 
- Font: Inter or system-ui

### Colors
- Primary: Blue (#3b82f6)
- Success: Green (#10b981)
- Warning: Orange (#f59e0b)
- Error: Red (#ef4444)

### Buttons
- Height: 48px minimum
- Clear hover states
- Loading indicators
- Success animations

### Forms
- Large input fields (48px height)
- Labels above inputs
- Inline validation
- Show/hide password toggle

---

## 🔐 Security Checklist

- [ ] Passwords hashed with bcrypt (12 rounds)
- [ ] JWT tokens with short expiry
- [ ] HTTP-only cookies for refresh tokens
- [ ] Rate limiting on auth endpoints
- [ ] Email verification required
- [ ] Paystack webhook verification
- [ ] Transaction atomicity for wallet
- [ ] HTTPS only (force SSL)
- [ ] Input sanitization
- [ ] CORS configured

---

## 📊 Success Metrics

### User Engagement
- Daily Active Users (DAU)
- Cart abandonment rate (<60%)
- Checkout completion rate (>70%)

### Business
- Total orders per day
- Average order value (AOV)
- Wallet funding conversion
- Repeat purchase rate

### Technical
- Page load time (<3s)
- API response time (<500ms)
- Error rate (<1%)
- Uptime (99.9%+)

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 16, Tailwind CSS, Lucide React
- **Backend**: Next.js API Routes, MongoDB, Mongoose
- **Auth**: NextAuth.js v5
- **Payment**: Paystack
- **Hosting**: Vercel
- **Database**: MongoDB Atlas

---

## 📝 Next Steps

1. ✅ Review APP_PLAN.md for complete details
2. ⏳ Set up development environment
3. ⏳ Start Week 1: Authentication
4. ⏳ Deploy MVP by end of Week 4

---

## 💡 Tips for Development

### Week 1 (Auth)
- Use NextAuth.js v5 for easier social auth later
- Store wallet balance in User model
- Hash passwords with bcrypt

### Week 2 (Shop & Cart)
- Use React Context for cart state
- Persist cart in localStorage
- Add loading states everywhere

### Week 3 (Wallet)
- Test Paystack in sandbox mode first
- Verify webhooks with signature
- Log all transactions

### Week 4 (Checkout)
- Validate inventory before order
- Use database transactions for atomicity
- Generate unique order numbers

---

## 🤝 Questions?

Refer to the detailed documentation:
- **Features**: See APP_PLAN.md
- **Database**: See DATABASE_SCHEMA.md
- **Timeline**: See DEVELOPMENT_PHASES.md

---

**Ready to build? Let's start with Week 1! 🚀**
