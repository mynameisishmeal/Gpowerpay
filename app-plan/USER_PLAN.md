# 🛒 Gpowerpay - Customer (User) App Plan

## 📋 Executive Summary

**Gpowerpay Customer App** is the user-facing e-commerce application for Gpower Frozen Foods that allows customers to:
- Register/Login with social auth or email/password
- Fund a digital wallet via Paystack
- Browse and purchase frozen food products (by Kilo or Carton)
- Choose Home Delivery or Pickup at Store
- Make payments from wallet balance
- Track orders and delivery via riders
- View transaction history

**Target Audience**: Ages 25+ (User-friendly interface is critical)

**Related Documentation**: See ADMIN_PLAN.md for admin features and rider management

---

## 🎯 Core Features

### 1. 👤 Authentication System

#### Login Options
- **Social Authentication**:
  - Google OAuth
- **Traditional Auth**:
  - Email & Password
- **Session Management**:
  - JWT-based authentication
  - Secure session handling
  - Remember me functionality
  - Password reset via email

#### User Profile
- Personal Information (Name, Email, Phone, Address)
- Profile Picture
- Default Delivery Address
- Order History
- Transaction History
- Wallet Balance Display

---

### 2. 💰 Digital Wallet System

#### Wallet Features
- **Real-time Balance Display**: Prominently shown on dashboard
- **Funding via Paystack**:
  - Card Payment (Visa, Mastercard, Verve)
  - Bank Transfer
  - USSD
  - Mobile Money
- **Minimum Funding**: ₦500
- **Maximum Balance**: ₦500,000 (configurable)
- **Transaction History**:
  - Wallet funding records
  - Purchase deductions
  - Timestamps and reference numbers
- **Auto-reload Option**: Notify when balance is low

#### Payment Flow Scenarios

**Scenario 1: Sufficient Balance**
- Direct deduction from wallet
- Instant order confirmation

**Scenario 2: Insufficient Balance**
- Show deficit amount clearly
- **Option A**: Fund wallet first, then purchase
- **Option B**: Quick top-up (redirect to Paystack for exact deficit)
- **Option C**: Split payment (use wallet balance + card for remainder)

---

### 3. 🛍️ Shopping Experience

#### Product Catalog

**Two Market Types**:

**1. Kilo Market** (Products - sold by weight)
- Product name
- Price per kilo (₦/kg)
- Available quantity in kilos
- Product image
- Product description
- Weight selector (0.5kg, 1kg, 2kg, 5kg, custom)

**2. Carton Market** (Stock - sold in cartons)
- Stock name
- Price per carton
- Available quantity (cartons in stock)
- Weight per carton
- Product image
- Carton size (number of pieces)

#### Market Switching
- **Toggle Button**: Easy switch between Kilo and Carton markets
- **Visual Indicator**: Clear indication of current market
- **Persistent Selection**: Remember last selected market
- **Combined View Option**: See both markets in tabs

#### Product Display
- **Grid View**: 2 columns on mobile, 3-4 on tablet, 4-6 on desktop
- **List View**: Alternative detailed view
- **Search Bar**: Search by product name
- **Filter Options**:
  - Price range slider
  - Availability (in stock only)
  - Sort by: Name, Price (Low-High/High-Low), Newest
- **Product Card Design**:
  - Large product image (at least 200x200px)
  - Product name (bold, 18px+ font)
  - Price (prominent, 24px+ font)
  - Stock status indicator (Green: In Stock, Red: Out of Stock)
  - Quick "Add to Cart" button (large, 48px height)
  - Heart icon (Add to Favorites)

---

### 4. 🛒 Shopping Cart

#### Cart Features
- **Floating Cart Icon**: Shows item count badge (always visible)
- **Cart Preview**: Quick slide-in panel from right
- **Full Cart Page**: Detailed cart view with all items

#### Cart Items Display
- Product image thumbnail (80x80px)
- Product name
- Market type indicator badge (Kilo/Carton)
- Unit price
- Quantity selector (+/- buttons, large touch targets)
- Subtotal per item
- Remove button (trash icon)

#### Cart Summary
- **Subtotal**: Sum of all items
- **Delivery Fee**: Based on location (₦0 for self-pickup)
- **Discount**: If applicable (promo code or loyalty)
- **Total Amount**: Clear, prominent display (32px font, bold)
- **Proceed to Checkout** button (disabled if cart empty)

#### Cart Management
- Update quantities in real-time
- Remove individual items
- Clear entire cart (with confirmation)
- Save for later (optional)
- Share cart link (optional)

---

### 5. 💳 Checkout Process

#### Step 1: Review Cart
- Final review of all items
- Edit quantities if needed
- Apply promo code

#### Step 2: Delivery Information

**Important**: This is where users choose their delivery option BEFORE payment.

- **Delivery Option Selection** (Required - shown first):
  - ✅ **Home Delivery** - Delivery fee applies based on location
  - ✅ **Pickup at Store** - Free, no delivery fee
  
- **If Home Delivery Selected**:
  - Select from saved addresses
  - Add new address (form with validation)
  - Address fields: Street, City, State, Landmark, Phone
  - Delivery Date: Select preferred delivery date (calendar picker)
  - Show calculated delivery fee based on location
  
- **If Pickup at Store Selected**:
  - Show store address and operating hours
  - Select preferred pickup date
  - Optional: Phone number for pickup notification
  - No delivery fee (₦0)

#### Step 3: Payment Method
- **Wallet Balance Display**: Show current balance prominently
- **Payment Method Selection**:
  - Option 1: Pay from Wallet (if sufficient balance)
  - Option 2: Quick Top-up (if insufficient, show exact amount needed)
  - Option 3: Direct Paystack Payment (card/bank transfer)
  - Option 4: Split Payment (wallet + card)

#### Step 4: Order Confirmation
- Auto-generated order number (e.g., GP12345)
- Order summary with all details
- Estimated delivery time
- Payment receipt
- Downloadable/Printable invoice
- Share order details option

---

### 6. 📦 Order Management

#### Order Tracking

**Order Status Flow**:
1. **Pending**: Order just placed, awaiting processing
2. **Processing**: Order is being prepared
3. **Out for Delivery**: Order dispatched to customer
4. **Delivered**: Order successfully delivered
5. **Cancelled**: Order cancelled by customer or admin

#### Order History Page
- List of all past orders (newest first)
- Filter by:
  - Date range (Today, This Week, This Month, Custom)
  - Order status
  - Payment method
- Search by order number
- Pagination (20 orders per page)

#### Order Details View
- Order number and date
- Items purchased (with images)
- Quantities and prices
- Total amount paid
- Payment method used
- Delivery address
- Current status with timeline
- Delivery date & time
- Delivery person contact (if assigned)

#### Order Actions
- **View Receipt**: Download PDF or print
- **Reorder**: Add all items to cart again
- **Rate Order**: 5-star rating + optional review
- **Report Issue**: Contact customer support
- **Cancel Order**: (Only if status is Pending)

---

## 🎨 User Interface Design Principles

### For Ages 25+ (User-Friendly Focus)

#### Typography
- **Large, Readable Fonts**: Minimum 16px for body text
- **Clear Hierarchy**: Obvious headings (24px minimum)
- **High Contrast**: Dark text (#1e293b) on light backgrounds (#ffffff)
- **Sans-serif Fonts**: Clean, modern (Inter, Roboto, System UI)
- **Line Height**: 1.6 for body text (improved readability)

#### Navigation
- **Fixed Bottom Navigation** (Mobile):
  - Home 🏠
  - Shop 🛍️
  - Cart 🛒 (with badge)
  - Wallet 💰
  - Profile 👤
- **Desktop Navigation**: Top horizontal navbar
- **Clear Labels**: Icons + Text labels (not icons alone)
- **Large Touch Targets**: Minimum 44px × 44px (iOS standard)
- **Active State**: Clear visual indicator of current page

#### Colors
- **Primary Color**: Blue (#3b82f6) - Trust, professionalism
- **Success Color**: Green (#10b981) - Wallet funding, confirmations
- **Warning Color**: Orange (#f59e0b) - Low balance alerts
- **Error Color**: Red (#ef4444) - Errors, out of stock
- **Neutral Grays**: For backgrounds (#f8fafc) and borders (#e2e8f0)

#### Buttons
- **Large CTAs**: Prominent "Add to Cart", "Checkout" buttons (48px+ height)
- **Clear States**: 
  - Default: Solid color
  - Hover: Slightly darker + subtle shadow
  - Active: Pressed state
  - Disabled: Grayed out with reduced opacity
- **Loading Indicators**: Spinner or progress bar during actions
- **Success Feedback**: Checkmark animation + toast notification

#### Forms
- **Single Column Layout**: One field at a time on mobile
- **Large Input Fields**: Minimum 48px height for easy tapping
- **Clear Labels**: Above inputs, always visible (not placeholder-only)
- **Helpful Placeholders**: Example text inside fields
- **Inline Validation**: Real-time error messages below fields
- **Show/Hide Password**: Eye icon toggle for password fields
- **Error States**: Red border + error message
- **Success States**: Green checkmark when valid

#### Feedback & Notifications
- **Toast Notifications**: 
  - Success: Green with checkmark
  - Error: Red with X icon
  - Info: Blue with info icon
  - Auto-dismiss after 5 seconds
- **Loading States**: 
  - Skeleton screens for content loading
  - Spinners for button actions
- **Empty States**: 
  - Helpful messages when no data
  - Call-to-action to add content
- **Error States**: 
  - Clear error messages
  - Suggested solutions
  - Retry button when applicable

#### Accessibility
- **ARIA Labels**: For screen readers on all interactive elements
- **Keyboard Navigation**: Full support with visible focus indicators
- **Alt Text**: Descriptive text for all images
- **Color Independence**: Don't rely only on color to convey information
- **Sufficient Contrast**: WCAG AA compliance (4.5:1 minimum)

---

## 🔐 Security Considerations

### Authentication Security
- ✅ Password hashing with bcrypt (12 rounds)
- ✅ JWT tokens with short expiry (15 mins access, 7 days refresh)
- ✅ HTTP-only cookies for refresh tokens
- ✅ Rate limiting on auth endpoints (5 attempts per 15 mins)
- ✅ Email verification required before first purchase
- ✅ Strong password requirements:
  - Minimum 8 characters
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
  - Special character recommended

### Payment Security
- ✅ Never store card details (handled entirely by Paystack)
- ✅ Verify all Paystack webhooks with signature validation
- ✅ Use Paystack test keys in development environment
- ✅ Log all transactions to database
- ✅ Implement transaction reconciliation (daily)
- ✅ PCI DSS compliance through Paystack
- ✅ SSL/TLS encryption for all payment pages

### Data Protection
- ✅ Encrypt sensitive data at rest (wallet balance, addresses)
- ✅ HTTPS only (force SSL redirect)
- ✅ Sanitize all user inputs (prevent XSS attacks)
- ✅ Prevent SQL/NoSQL injection with parameterized queries
- ✅ CORS configuration (whitelist frontend domain)
- ✅ CSP (Content Security Policy) headers
- ✅ Regular security audits

### Wallet Security
- ✅ Transaction atomicity (prevent double spending)
- ✅ Complete audit trail for all wallet operations
- ✅ Balance verification before any deduction
- ✅ Rollback mechanism for failed orders
- ✅ Daily reconciliation reports
- ✅ Alert system for suspicious activities

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS + Gpower Theme
- **UI Components**: Custom components + Shadcn-style
- **Icons**: Lucide React
- **State Management**: React Context + Zustand (for cart)
- **Forms**: React Hook Form + Zod validation
- **HTTP Client**: Fetch API with error handling

### Backend
- **API**: Next.js API Routes (App Router)
- **Database**: MongoDB + Mongoose ODM
- **Authentication**: NextAuth.js v5
- **Payment Gateway**: Paystack SDK
- **File Upload**: Cloudinary for product images
- **Email Service**: Resend or SendGrid
- **SMS**: Termii or Africa's Talking (for OTP)

### DevOps
- **Hosting**: Vercel (Frontend + API)
- **Database**: MongoDB Atlas (M10 or higher for production)
- **CDN**: Cloudinary for images
- **Monitoring**: Vercel Analytics + Sentry for errors
- **CI/CD**: GitHub Actions + Vercel auto-deploy

---

## 📊 Success Metrics

### User Engagement Metrics
- Daily Active Users (DAU)
- Monthly Active Users (MAU)
- Average session duration (target: 5+ minutes)
- Cart abandonment rate (target: <60%)
- Checkout completion rate (target: >70%)
- Bounce rate (target: <40%)

### Business Metrics
- Total orders per day/week/month
- Average order value (AOV)
- Wallet funding conversion rate
- Repeat purchase rate
- Customer lifetime value (CLV)
- Revenue per user

### Technical Metrics
- Page load time (target: <3 seconds)
- API response time (target: <500ms)
- Error rate (target: <1%)
- Uptime (target: 99.9%+)
- Mobile usage percentage
- Conversion funnel drop-off points

---

## 🎯 Future Enhancements

### Phase 4: Short-term (1-3 months post-launch)
- ⭐ Product ratings and reviews system
- 🔔 Push notifications (order updates, promotions)
- 🎁 Referral program (invite friends, earn wallet credit)
- 📍 Location-based delivery fees
- 📦 Live order tracking with map
- 💬 Live chat customer support
- 🏷️ Promo codes and discount system
- 📧 Email marketing integration

### Phase 5: Medium-term (3-6 months)
- 📱 Native mobile apps (React Native - iOS & Android)
- 🔄 Subscription model (weekly/monthly auto-deliveries)
- 🎯 AI-powered personalized recommendations
- 📊 Customer spending analytics dashboard
- 🎁 Loyalty points program
- 🔔 Stock alerts for favorite items
- 🌟 Badges and achievement system
- 📸 Product image reviews from customers

### Phase 6: Long-term (6-12 months)
- 🤝 B2B wholesale portal
- 🌍 Multi-language support (Yoruba, Igbo, Hausa)
- 💱 Multi-currency support
- 🚚 Integration with third-party logistics
- 📸 AR product preview
- 🎮 Gamification (challenges, leaderboards)
- 🔗 Alternative payment methods (USSD, bank transfer)
- 🎁 Gift cards and vouchers

---

**Document Version**: 1.0  
**Last Updated**: July 21, 2026  
**Status**: Planning Phase  
**Next Review**: Start of Week 1 Development
