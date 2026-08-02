# 🧪 Gpowerpay Testing Checklist

## 🔐 Authentication & User Management

### Customer Authentication
- [ ] Customer can register with email/password
- [ ] Customer can login with email/password
- [ ] Customer can login with Google OAuth
- [ ] Email verification works and sends verification emails
- [ ] Forgot password functionality works
- [ ] Customer can view/edit profile
- [ ] Customer session persists correctly

### Rider Authentication
- [ ] Rider can login at `/rider/login`
- [ ] Rider dashboard loads correctly at `/rider/dashboard`
- [ ] Rider can see assigned orders
- [ ] Rider can mark orders as delivered with confirmation code
- [ ] Public verification page works at `/rider/verify`

### Admin Authentication
- [ ] Admin can login at `/admin/login`
- [ ] Super admin has full access
- [ ] Regular admin has appropriate permissions
- [ ] Admin dashboard loads all statistics

### Login Pages Cross-Links
- [ ] Customer login shows links to Rider & Admin login
- [ ] Rider login shows links to Customer & Admin login
- [ ] Admin login shows links to Customer & Rider login

---

## 🛒 Shopping & Cart

### Product Browsing
- [ ] Products display correctly on `/products`
- [ ] Can filter by kilo/carton market
- [ ] Search functionality works
- [ ] Product images load correctly
- [ ] Featured products show on homepage
- [ ] New arrivals show on homepage

### Cart Functionality
- [ ] Can add products to cart
- [ ] Cart icon shows correct item count
- [ ] Cart slide-over displays items
- [ ] Can update quantities in cart
- [ ] Can remove items from cart
- [ ] Cart persists across page reloads
- [ ] Stock limits are enforced (if tracked)

### Wishlist
- [ ] Can add products to wishlist
- [ ] Wishlist icon shows correct count
- [ ] Can view wishlist page
- [ ] Can remove from wishlist
- [ ] Can add wishlist items to cart

---

## 💰 Wallet & Payments

### Wallet Management
- [ ] Wallet page loads correctly at `/wallet`
- [ ] Current balance displays correctly
- [ ] Can fund wallet via Paystack
- [ ] Funding amount is credited correctly
- [ ] Transaction history displays correctly
- [ ] Can filter transactions by type

### Payment Methods
- [ ] **Wallet payment**: Full amount debited from wallet
- [ ] **Split payment**: Available wallet balance debited, rest via Paystack
- [ ] **Paystack payment**: No wallet debit, full Paystack payment
- [ ] Insufficient wallet balance shows error
- [ ] Payment reference is unique and tracked

---

## 📦 Orders & Checkout

### Checkout Process
- [ ] Delivery option selection works (home/pickup)
- [ ] Home delivery shows address form
- [ ] Pickup shows date picker
- [ ] Phone number validation works (required for home delivery)
- [ ] Delivery date/pickup date selection works
- [ ] Order summary shows correct totals
- [ ] Payment method selection works

### Order Creation
- [ ] Order is created successfully
- [ ] Order gets unique order number (GPO-xxxxx)
- [ ] 6-digit confirmation code is generated
- [ ] Order status starts as "pending"
- [ ] Delivery status starts as "in_store"
- [ ] Customer receives order confirmation email
- [ ] Email shows confirmation code
- [ ] Email link uses MongoDB `_id` (not orderNumber)

### Order Viewing
- [ ] Customer can view orders at `/orders`
- [ ] Order detail page loads at `/orders/[id]`
- [ ] Confirmation code displays prominently
- [ ] Copy confirmation code button works
- [ ] Product names display correctly (not "Product×1")
- [ ] Order status shows correctly
- [ ] Delivery status shows correctly

---

## 🚚 Delivery & Riders

### Admin - Rider Management
- [ ] Can create new riders at `/admin/riders`
- [ ] Can edit existing riders
- [ ] Can set rider email and password
- [ ] Password eye icon toggles visibility
- [ ] Can set rider type (small/bulk)
- [ ] Can set rider status (active/inactive)
- [ ] User account is created automatically for riders

### Admin - Order Management
- [ ] Can view all orders at `/admin/orders`
- [ ] Can view order details at `/admin/orders/[id]`
- [ ] Can assign rider to order
- [ ] Correct rider assigns (not always first rider)
- [ ] Can change delivery status
- [ ] **Marking as delivered requires confirmation code**
- [ ] Wrong code shows error
- [ ] Correct code marks order as delivered

### Rider - Order Management
- [ ] Rider sees only their assigned orders in dashboard
- [ ] Can mark order as delivered from dashboard
- [ ] Requires confirmation code verification
- [ ] Public verification page works without login

### Notifications (Order Updates)
- [ ] Customer notified when order placed
- [ ] Customer notified when rider assigned
- [ ] Customer notified when delivery status changes
- [ ] Customer notified when order delivered
- [ ] Email notifications sent for all events
- [ ] In-app notifications show in bell icon

---

## 🔔 Notification System

### Notification Bell
- [ ] Bell icon shows in navbar for logged-in users
- [ ] Unread count displays correctly
- [ ] Bell turns blue when unread notifications exist
- [ ] Clicking bell opens dropdown
- [ ] Dropdown shows last 10 notifications
- [ ] Auto-refreshes every 30 seconds

### Notification Actions
- [ ] Clicking notification marks it as read **immediately**
- [ ] Clicking notification navigates to order page
- [ ] Can delete individual notifications
- [ ] Can mark all as read
- [ ] Optimistic updates work (no delay)

### Notifications Page
- [ ] Full page at `/notifications` works
- [ ] Shows up to 50 notifications
- [ ] Can mark individual as read
- [ ] Can mark all as read
- [ ] Can delete notifications
- [ ] Time ago format displays correctly

---

## 🎨 UI/UX

### Navigation
- [ ] Navbar shows on all pages
- [ ] Cart icon works
- [ ] Wishlist icon works (logged in)
- [ ] Notification bell works (logged in)
- [ ] User dropdown menu works
- [ ] Mobile menu works on small screens
- [ ] Admin dropdown shows for admin users

### Responsive Design
- [ ] Homepage looks good on mobile
- [ ] Products page responsive
- [ ] Cart slide-over works on mobile
- [ ] Checkout works on mobile
- [ ] Admin pages work on desktop
- [ ] Notification dropdown works on mobile

### Error Handling
- [ ] 404 pages display correctly
- [ ] Error messages show for failed actions
- [ ] Loading states show during async operations
- [ ] Toast notifications work
- [ ] Form validation errors display

---

## 👨‍💼 Admin Features

### Dashboard
- [ ] Statistics load correctly
- [ ] Recent orders display
- [ ] Charts/graphs work (if any)

### Product Management
- [ ] Can create new products
- [ ] Can edit existing products
- [ ] Can delete products
- [ ] Can upload product images
- [ ] Kilo vs Carton pricing works
- [ ] Inventory tracking works

### Order Management
- [ ] Can view all orders
- [ ] Can filter orders by status
- [ ] Can search orders
- [ ] Can update order status
- [ ] Can assign riders
- [ ] Can mark delivered (with code)

### User Management
- [ ] Can view all users
- [ ] Can activate/deactivate users
- [ ] Can view user details

---

## 🐛 Known Issues to Check

### High Priority
- [ ] Next.js 15 params Promise issue (already fixed for notifications)
- [ ] Check all other `[id]` routes for same issue
- [ ] Mongoose deprecation warnings (`new` option)

### Medium Priority
- [ ] Email "from" name shows as "Gpowerpay" (already fixed)
- [ ] Facebook login removed (already done)
- [ ] Product names show correctly (already fixed)

### Low Priority
- [ ] Console logs for debugging (can be removed later)
- [ ] Unused code cleanup
- [ ] Performance optimization

---

## 🔍 Testing Scenarios

### End-to-End Order Flow (Customer)
1. Register/Login
2. Browse products
3. Add items to cart
4. Go to checkout
5. Enter delivery details
6. Fund wallet (if needed)
7. Select payment method
8. Place order
9. Check email for confirmation
10. Click email link to view order
11. Copy confirmation code
12. Check notifications

### End-to-End Order Flow (Admin)
1. Login as admin
2. View pending orders
3. Assign rider to order
4. Update delivery status to "on_the_way"
5. Verify confirmation code
6. Mark as delivered

### End-to-End Order Flow (Rider)
1. Login as rider
2. View assigned orders
3. Note confirmation code
4. Meet customer and verify code
5. Mark as delivered

---

## 📝 Test Data Needed

- [ ] At least 3 test customers
- [ ] At least 2 test riders (1 small, 1 bulk)
- [ ] At least 1 admin user
- [ ] At least 10 test products (mix of kilo/carton)
- [ ] Test orders in various states

---

## ✅ Sign Off

### Tested By:
- [ ] Developer: _____________
- [ ] QA/Tester: _____________
- [ ] Product Owner: _____________

### Date: _______________

### Critical Bugs Found:
1. 
2. 
3. 

### Notes:


