# 👨‍💼 Gpowerpay - Admin Management System Plan

## 📋 Executive Summary

**Gpowerpay Admin System** is the administrative panel for managing the Gpowerpay e-commerce platform.

**Key Capabilities**:
- Role-based access control (Super Admin, Admin, Manager)
- Order management and assignment
- Rider management and tracking
- User management
- Product and inventory management
- Delivery zone and fee configuration
- Financial reports and analytics
- Real-time dashboard

**Related Documentation**: See USER_PLAN.md for customer app features

---

## 🎯 Core Admin Features

### 1. 🔐 Role-Based Authentication System

#### User Roles

**Super Admin** (Highest Level)
- Full system access
- Create/manage Support users
- System configuration
- Financial oversight
- Delete orders and users
- Access to all reports
- Manage riders
- Full control over all features

**Support**
- Manage orders (view, update, assign)
- Manage riders (add, edit, assign to orders)
- Manage products and inventory
- Manage customers
- View reports
- Cannot delete orders or users
- Cannot access system configuration
- Cannot manage other Support users or Super Admins

**Rider** (Mobile/Web Access)
- View assigned deliveries only
- Update delivery status
- Mark orders as delivered
- View delivery history
- Navigation to customer location
- Cannot view other riders' deliveries
- Cannot manage orders or customers

#### Authentication Features
- Email/Password login for Super Admin and Support users
- Separate rider login portal
- Two-factor authentication (2FA) for Super Admin (recommended)
- Session timeout after inactivity
- Password strength requirements
- Activity logging for all actions
- IP whitelist for Super Admin (optional)

---

### 2. 📦 Order Management System

#### Order Dashboard
- **Order Overview**:
  - Total orders today/week/month
  - Pending orders (requires action)
  - Processing orders
  - Out for delivery
  - Delivered orders
  - Cancelled orders
  
- **Real-time Updates**:
  - New order notifications (sound + badge)
  - Auto-refresh every 30 seconds
  - WebSocket for instant updates (optional)

#### Order List View
- **Filters**:
  - Order status (All, Pending, Processing, Out for Delivery, Delivered, Cancelled)
  - Date range
  - Payment method (Wallet, Paystack, Split)
  - Delivery type (Home Delivery, Store Pickup)
  - Assigned rider
  - Customer name or order number search
  
- **Sort Options**:
  - Order date (newest/oldest)
  - Total amount (high/low)
  - Status
  
- **Display Information**:
  - Order number
  - Customer name and phone
  - Order total
  - Payment status
  - Order status (with color badges)
  - Delivery type
  - Assigned rider (if applicable)
  - Order date/time
  - Quick actions (View, Edit, Assign Rider)

#### Order Detail View
- **Customer Information**:
  - Name, email, phone
  - Delivery address (if home delivery)
  - Customer order history link
  
- **Order Items**:
  - Product name and image
  - Market type (Kilo/Carton)
  - Quantity
  - Unit price
  - Subtotal
  
- **Pricing Breakdown**:
  - Subtotal
  - Delivery fee
  - Discount (if any)
  - Total amount
  
- **Payment Information**:
  - Payment method
  - Payment status
  - Transaction reference
  - Payment date/time
  - Wallet transaction details
  
- **Delivery Information**:
  - Delivery option (Home/Pickup)
  - Delivery address (full details)
  - Preferred delivery date
  - Assigned rider (with contact)
  - Delivery status timeline
  
- **Order Actions** (Role-based):
  - **Super Admin**: All actions including delete and refund
  - **Support**: Update status, assign rider, edit address, add notes, cancel order
  - **Rider**: View details, update delivery status only

#### Order Status Management
- **Status Flow**:
  ```
  Pending → Processing → Out for Delivery → Delivered
                ↓
            Cancelled (with reason)
  ```
  
- **Status Actions**:
  - **Pending**: New order, awaiting confirmation
    - Action: Confirm and move to Processing
  - **Processing**: Order is being prepared
    - Action: Assign rider, move to Out for Delivery
  - **Out for Delivery**: Rider has picked up order
    - Action: Rider marks as Delivered
  - **Delivered**: Order successfully delivered
    - Action: Archive (auto after 30 days)
  - **Cancelled**: Order cancelled
    - Action: Process refund if paid
    
- **Status Change Notifications**:
  - Email to customer
  - SMS notification (optional)
  - Push notification (if app installed)
  - Update order timeline

#### Rider Assignment
- **Assignment Interface**:
  - List of available riders
  - Show rider status (Available, On Delivery, Offline)
  - Show rider location (if tracking enabled)
  - Show rider current delivery count
  - One-click assignment
  
- **Auto-Assignment** (Optional):
  - Based on delivery zone
  - Based on rider availability
  - Based on rider rating
  - Round-robin assignment

---

### 3. 🏍️ Rider Management System

#### Rider Registration
- **Add New Rider** (Super Admin or Support):
  - Full name
  - Email address
  - Phone number
  - ID/License number
  - Vehicle type (Motorcycle, Bike, Car)
  - Vehicle plate number
  - Profile photo
  - Home address
  - Emergency contact
  - Bank details (for payments)
  
- **Verification**:
  - Email verification
  - Phone verification (OTP)
  - Document verification (ID, license)
  - Background check (optional)
  - Trial period (first 10 deliveries)

#### Rider Dashboard
- **Rider List View**:
  - All riders with status indicators
  - Filter by: Status (Active, Inactive, Suspended)
  - Search by name, phone, or ID
  - Sort by: Rating, Total deliveries, Name
  
- **Rider Card Display**:
  - Profile photo
  - Name and contact info
  - Status badge (Available, On Delivery, Offline)
  - Current deliveries count
  - Total completed deliveries
  - Average rating (⭐ stars)
  - On-time delivery rate
  - Quick actions (View, Edit, Suspend, Delete)

#### Rider Detail View
- **Personal Information**:
  - Full details (editable)
  - Profile photo
  - Contact information
  - Vehicle details
  
- **Performance Metrics**:
  - Total deliveries completed
  - Success rate (%)
  - Average delivery time
  - Customer ratings (average + breakdown)
  - On-time delivery rate
  - Cancelled deliveries
  - Customer complaints
  
- **Delivery History**:
  - List of all deliveries
  - Filter by date range, status
  - View delivery details
  - Customer feedback
  
- **Financial Information**:
  - Total earnings
  - Pending payments
  - Payment history
  - Bank account details
  
- **Actions**:
  - **Super Admin**: Edit, suspend, deactivate, delete, reset password, view location
  - **Support**: Edit, suspend (temporary), view location, send notification
  - **Rider**: View own details only

#### Rider Status Management
- **Status Types**:
  - **Available**: Ready to accept deliveries
  - **On Delivery**: Currently delivering order(s)
  - **Offline**: Not available
  - **Suspended**: Temporarily blocked
  
- **Status Controls**:
  - Riders can set their own status (Available/Offline)
  - Admin can override status
  - Auto-set to "On Delivery" when order assigned
  - Auto-set to "Available" after delivery completion

#### Rider Performance Tracking
- **Metrics Dashboard**:
  - Total deliveries (today, week, month)
  - Average delivery time
  - On-time percentage
  - Customer rating distribution
  - Revenue generated
  
- **Leaderboard** (Optional):
  - Top performers
  - Most deliveries
  - Highest ratings
  - Fastest delivery times
  - Gamification badges

#### Rider Payments
- **Payment Tracking**:
  - Deliveries completed
  - Payment per delivery (configurable)
  - Bonuses (optional)
  - Total earnings
  - Pending payouts
  
- **Payment Processing**:
  - Manual payout initiation
  - Automatic weekly/monthly payouts
  - Payment history with receipts
  - Export payment reports

---

### 4. 👥 Customer Management

#### Customer List
- **Display Information**:
  - Customer name
  - Email and phone
  - Total orders
  - Total spent
  - Wallet balance
  - Registration date
  - Last order date
  - Status (Active, Inactive, Blocked)
  
- **Filters & Search**:
  - Search by name, email, phone
  - Filter by status
  - Sort by total spent, orders, registration date
  
- **Actions**:
  - **Super Admin**: Full access, adjust wallet balance, block/unblock
  - **Support**: View details, view history, send notifications
  - Cannot adjust wallet or block users (Super Admin only)

#### Customer Detail View
- **Profile Information**:
  - Full details
  - Profile picture
  - Contact information
  - Saved addresses
  
- **Order History**:
  - All orders with details
  - Total orders count
  - Total amount spent
  - Average order value
  - Favorite products
  
- **Wallet Information**:
  - Current balance
  - Total funded
  - Total spent
  - Transaction history
  - Manual adjustment (Super Admin)
  
- **Activity Log**:
  - Login history
  - Order activity
  - Payment activity
  - Support tickets

---

### 5. 📦 Product & Inventory Management

#### Product Management (Kilo Market)
- **Product List**:
  - Product name and image
  - Price per kilo
  - Available quantity
  - Category
  - Status (Active/Inactive)
  - Last updated
  
- **Add/Edit Product**:
  - Product name
  - Description
  - Price per kilo
  - Available quantity (in kilos)
  - Product image upload
  - Category selection
  - Active/Inactive toggle
  
- **Bulk Actions**:
  - Update prices
  - Update quantities
  - Activate/Deactivate multiple
  - Export product list

#### Stock Management (Carton Market)
- **Stock List**:
  - Stock name and image
  - Price per carton
  - Available cartons
  - Pieces per carton
  - Category
  - Status (Active/Inactive)
  
- **Add/Edit Stock**:
  - Stock name
  - Description
  - Price per carton
  - Available cartons
  - Pieces per carton
  - Weight per carton
  - Stock image upload
  - Category selection
  - Active/Inactive toggle

#### Inventory Alerts
- **Low Stock Alerts**:
  - Set minimum threshold
  - Email notifications
  - Dashboard notifications
  - Auto-hide from customer app when out of stock

---

### 6. 🗺️ Delivery Zone & Fee Management

#### Delivery Zones
- **Zone Configuration**:
  - Zone name (e.g., "Lagos Mainland", "Lagos Island")
  - List of areas/landmarks
  - Delivery fee for zone
  - Estimated delivery time
  - Active/Inactive status
  
- **Zone List View**:
  - All configured zones
  - Delivery fee per zone
  - Edit/Delete zones
  
- **Default Settings**:
  - Default delivery fee
  - Free delivery threshold (e.g., orders over ₦20,000)
  - Maximum delivery distance

#### Store Pickup Configuration
- **Store Information**:
  - Store address
  - Operating hours
  - Contact phone
  - Pickup instructions
  - Display on customer app

---

### 7. 📊 Reports & Analytics

#### Sales Reports
- **Overview Dashboard**:
  - Total revenue (today, week, month, year)
  - Total orders
  - Average order value
  - Top selling products
  - Revenue by market type (Kilo vs Carton)
  
- **Detailed Reports**:
  - Sales by date range
  - Sales by product
  - Sales by customer
  - Sales by payment method
  - Sales by delivery type
  
- **Export Options**:
  - PDF export
  - Excel/CSV export
  - Custom date range
  - Filter by criteria

#### Financial Reports
- **Revenue Tracking**:
  - Total revenue
  - Revenue by channel (Wallet, Paystack)
  - Delivery fees collected
  - Discounts given
  - Net revenue
  
- **Wallet Reports**:
  - Total wallet funding
  - Total wallet spending
  - Outstanding wallet balance
  - Top wallet users
  
- **Payment Gateway Reports**:
  - Paystack transactions
  - Success rate
  - Failed transactions
  - Transaction fees

#### Order Reports
- **Order Analytics**:
  - Total orders by status
  - Average order processing time
  - Delivery success rate
  - Cancellation rate and reasons
  - Peak order times
  
- **Customer Reports**:
  - New customers
  - Repeat customers
  - Customer lifetime value
  - Churn rate

#### Rider Reports
- **Performance Reports**:
  - Total deliveries by rider
  - Average delivery time
  - On-time delivery rate
  - Customer ratings by rider
  - Revenue per rider
  
- **Efficiency Reports**:
  - Deliveries per hour
  - Average distance per delivery
  - Fuel efficiency (optional)

---

### 8. ⚙️ System Configuration

#### General Settings
- **App Settings**:
  - App name and logo
  - Primary color scheme
  - Contact information
  - Terms and conditions
  - Privacy policy
  
- **Email Settings**:
  - Email provider (Resend, SendGrid)
  - Email templates
  - Notification preferences
  
- **SMS Settings**:
  - SMS provider (Termii, Africa's Talking)
  - SMS templates
  - SMS balance

#### Payment Settings
- **Paystack Configuration**:
  - Public key
  - Secret key
  - Webhook URL
  - Test mode toggle
  
- **Wallet Settings**:
  - Minimum funding amount
  - Maximum wallet balance
  - Transaction fees (if any)

#### Order Settings
- **Order Configuration**:
  - Minimum order value
  - Order number prefix
  - Auto-cancel unpaid orders after X hours
  - Allow order cancellation by customer
  
- **Delivery Settings**:
  - Enable home delivery
  - Enable store pickup
  - Maximum delivery days ahead
  - Delivery time slots

---

### 9. 🔔 Notifications & Communication

#### Admin Notifications
- **Order Notifications**:
  - New order alert (sound + popup)
  - Payment confirmation
  - Order cancellation
  - Delivery completion
  
- **System Notifications**:
  - Low stock alerts
  - Failed payments
  - Rider status changes
  - Customer complaints

#### Customer Communication
- **Send Notifications**:
  - Broadcast to all customers
  - Targeted to specific segments
  - Schedule notifications
  - Email, SMS, Push options
  
- **Templates**:
  - Order confirmation
  - Order status updates
  - Delivery notifications
  - Promotional messages

---

### 10. 🔒 Security & Access Control

#### Admin User Management
- **Add Users** (Super Admin only):
  - Create new Support accounts
  - Cannot create other Super Admins
  - Assign Support role
  
- **Manage Support Users** (Super Admin only):
  - View all Support users
  - Edit Support user details
  - Deactivate Support users
  - Reset Support passwords

#### Activity Logging
- **Audit Trail**:
  - All admin actions logged
  - User who performed action
  - Timestamp
  - IP address
  - Action details
  
- **Security Reports**:
  - Failed login attempts
  - Suspicious activity
  - Permission changes
  - Data exports

---

## 🎨 Admin UI Design

### Dashboard Layout
- **Top Navigation**:
  - Logo
  - Quick stats
  - Notifications bell
  - Admin profile dropdown
  
- **Side Navigation**:
  - Dashboard
  - Orders
  - Riders
  - Customers
  - Products
  - Stock
  - Reports
  - Settings
  - Logout

### Color Coding
- **Order Status**:
  - Pending: Orange (#f59e0b)
  - Processing: Blue (#3b82f6)
  - Out for Delivery: Purple (#9333ea)
  - Delivered: Green (#10b981)
  - Cancelled: Red (#ef4444)
  
- **Rider Status**:
  - Available: Green
  - On Delivery: Blue
  - Offline: Gray
  - Suspended: Red

### Responsive Design
- Desktop-first approach
- Tablet support for order management
- Mobile view for rider app
- Touch-friendly controls

---

## 🗄️ Additional Database Collections

### Riders Collection
```typescript
interface IRider {
  _id: ObjectId;
  
  // Personal Info
  fullName: string;
  email: string;
  phone: string;
  password: string; // hashed
  profilePhoto?: string;
  
  // Identification
  idNumber: string;
  licenseNumber?: string;
  
  // Vehicle
  vehicleType: 'motorcycle' | 'bike' | 'car';
  vehiclePlateNumber: string;
  
  // Address
  homeAddress: string;
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  
  // Bank Details
  bankName: string;
  accountNumber: string;
  accountName: string;
  
  // Status
  status: 'available' | 'on_delivery' | 'offline' | 'suspended';
  
  // Performance
  totalDeliveries: number;
  completedDeliveries: number;
  cancelledDeliveries: number;
  averageRating: number;
  onTimeDeliveryRate: number;
  
  // Financial
  totalEarnings: number;
  pendingPayment: number;
  
  // Verification
  emailVerified: boolean;
  phoneVerified: boolean;
  documentsVerified: boolean;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  lastActive: Date;
}
```

### Admin Users Collection
```typescript
interface IAdminUser {
  _id: ObjectId;
  
  // Credentials
  email: string; // unique
  password: string; // hashed
  
  // Profile
  fullName: string;
  phone?: string;
  profilePicture?: string;
  
  // Role & Permissions
  role: 'superadmin' | 'admin' | 'manager';
  permissions: string[]; // custom permissions
  
  // Security
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  ipWhitelist?: string[];
  
  // Status
  isActive: boolean;
  lastLogin?: Date;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}
```

### Delivery Zones Collection
```typescript
interface IDeliveryZone {
  _id: ObjectId;
  
  // Zone Info
  zoneName: string; // e.g., "Lagos Mainland"
  areas: string[]; // list of areas in this zone
  
  // Pricing
  deliveryFee: number;
  
  // Settings
  estimatedDeliveryTime: string; // e.g., "1-2 hours"
  isActive: boolean;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 🚀 Admin Development Priority

### Phase 1: Essential Admin Features (Week 1-2)
1. Admin authentication and roles
2. Order management dashboard
3. Basic order actions (view, update status)
4. Rider management (add, view, assign)

### Phase 2: Advanced Features (Week 3-4)
1. Customer management
2. Product/inventory management
3. Delivery zones configuration
4. Basic reports

### Phase 3: Analytics & Optimization (Week 5+)
1. Advanced analytics dashboard
2. Automated notifications
3. Performance tracking
4. Security enhancements

---

## 📱 Rider Mobile App (Future)

**Separate React Native App** for riders:
- View assigned deliveries
- Navigation to customer
- Update delivery status
- Mark as delivered
- View earnings
- Chat with customer (optional)

---

**Document Version**: 1.0  
**Last Updated**: July 21, 2026  
**Status**: Planning Phase  
**Next Steps**: Finalize admin workflow and begin implementation
