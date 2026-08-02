# 🔐 Roles & Permissions - Gpowerpay

## Role Overview

Gpowerpay has **3 admin roles** with distinct permissions:

```
┌─────────────────────────────────────────────┐
│         GPOWERPAY ROLE HIERARCHY            │
└─────────────────────────────────────────────┘

            ┌──────────────┐
            │ Super Admin  │ (Full Control)
            └──────┬───────┘
                   │
                   │ creates & manages
                   ↓
            ┌──────────────┐
            │   Support    │ (Operations)
            └──────┬───────┘
                   │
                   │ assigns deliveries to
                   ↓
            ┌──────────────┐
            │    Rider     │ (Delivery)
            └──────────────┘
```

---

## 1. 👑 Super Admin

### Access Level: **FULL SYSTEM ACCESS**

### Core Responsibilities
- Overall system management
- Financial oversight
- User management (Support users)
- System configuration
- Critical operations

### Permissions

#### ✅ Orders Management
- View all orders
- Update order status
- Assign/reassign riders
- Cancel orders
- **Delete orders** ⚠️
- Process refunds
- Edit delivery information
- View financial details
- Export order data

#### ✅ Rider Management
- Add new riders
- Edit rider details
- View rider performance
- Suspend/activate riders
- **Delete riders** ⚠️
- Manage rider payments
- View rider locations
- Access rider analytics

#### ✅ Customer Management
- View all customers
- View customer order history
- **Adjust wallet balance** 💰
- **Block/unblock customers** ⚠️
- Export customer data
- View customer analytics

#### ✅ Products & Inventory
- Add/edit products
- Update product prices
- Manage stock quantities
- Activate/deactivate products
- Upload product images
- Manage categories
- Bulk operations

#### ✅ Support User Management
- **Create Support accounts** 👥
- Edit Support user details
- Deactivate Support users
- Reset Support passwords
- View Support activity logs

#### ✅ Delivery Zones
- Create delivery zones
- Edit zone details
- Set delivery fees
- Activate/deactivate zones
- Manage zone areas

#### ✅ Reports & Analytics
- Full access to all reports
- Sales reports
- Financial reports
- Rider performance reports
- Customer analytics
- Export all data

#### ✅ System Configuration
- App settings
- Payment gateway settings
- Email/SMS configuration
- Order settings
- Delivery settings
- Notification templates
- System security settings

#### ✅ Security
- Enable 2FA for own account
- IP whitelist configuration
- View audit logs
- Manage API keys

---

## 2. 🎧 Support

### Access Level: **OPERATIONAL ACCESS**

### Core Responsibilities
- Day-to-day operations
- Order fulfillment
- Customer service
- Rider coordination
- Product management

### Permissions

#### ✅ Orders Management
- View all orders
- Update order status
- Assign riders to orders
- Cancel orders (with reason)
- Edit delivery information
- Add admin notes
- Send customer notifications
- Print receipts

#### ❌ Orders Restrictions
- **Cannot delete orders**
- **Cannot process refunds** (Super Admin only)

#### ✅ Rider Management
- Add new riders
- Edit rider details
- View rider performance
- Suspend riders (temporary)
- Assign orders to riders
- Send notifications to riders
- View rider locations

#### ❌ Rider Restrictions
- **Cannot delete riders**
- **Cannot modify rider payment rates**

#### ✅ Customer Management
- View all customers
- View customer profiles
- View order history
- Send notifications to customers

#### ❌ Customer Restrictions
- **Cannot adjust wallet balance**
- **Cannot block/unblock customers**
- **Cannot delete customers**

#### ✅ Products & Inventory
- Add/edit products
- Update product prices
- Manage stock quantities
- Activate/deactivate products
- Upload product images
- Manage categories

#### ✅ Delivery Zones
- View delivery zones
- View zone details

#### ❌ Zone Restrictions
- **Cannot create/edit/delete zones**

#### ✅ Reports (Limited)
- View sales reports
- View order reports
- View rider performance
- View customer reports

#### ❌ Report Restrictions
- **Cannot access financial reports**
- **Cannot export sensitive data**

#### ❌ System Configuration
- **No access to system settings**
- **Cannot manage Support users**
- **Cannot configure payments**
- **Cannot modify system security**

---

## 3. 🏍️ Rider

### Access Level: **DELIVERY ACCESS**

### Core Responsibilities
- Pick up orders
- Deliver to customers
- Update delivery status
- Communicate with customers

### Permissions

#### ✅ Deliveries
- View assigned deliveries only
- View delivery details
- View customer delivery address
- View customer phone number
- Update delivery status:
  - Picked up
  - On the way
  - Delivered
- Add delivery notes
- View navigation to customer

#### ✅ Profile
- View own profile
- Update own password
- View own delivery history
- View own earnings
- View own performance metrics

#### ❌ Restrictions
- **Cannot view other riders' deliveries**
- **Cannot assign deliveries**
- **Cannot view orders not assigned to them**
- **Cannot access customer wallet info**
- **Cannot cancel orders**
- **Cannot modify prices or products**
- **Cannot view financial reports**
- **No admin panel access**

---

## Permission Matrix

| Feature | Super Admin | Support | Rider |
|---------|-------------|---------|-------|
| **Orders** | | | |
| View orders | ✅ All | ✅ All | ✅ Assigned only |
| Update status | ✅ | ✅ | ✅ Delivery status |
| Assign riders | ✅ | ✅ | ❌ |
| Cancel orders | ✅ | ✅ | ❌ |
| Delete orders | ✅ | ❌ | ❌ |
| Refunds | ✅ | ❌ | ❌ |
| **Riders** | | | |
| Add riders | ✅ | ✅ | ❌ |
| Edit riders | ✅ | ✅ | ✅ Own profile |
| Delete riders | ✅ | ❌ | ❌ |
| View performance | ✅ | ✅ | ✅ Own only |
| Manage payments | ✅ | ❌ | ❌ |
| **Customers** | | | |
| View customers | ✅ | ✅ | ❌ |
| Adjust wallet | ✅ | ❌ | ❌ |
| Block/unblock | ✅ | ❌ | ❌ |
| **Products** | | | |
| Add/edit products | ✅ | ✅ | ❌ |
| Update prices | ✅ | ✅ | ❌ |
| Manage inventory | ✅ | ✅ | ❌ |
| **Zones** | | | |
| Create zones | ✅ | ❌ | ❌ |
| Edit zones | ✅ | ❌ | ❌ |
| View zones | ✅ | ✅ | ❌ |
| **Reports** | | | |
| Sales reports | ✅ | ✅ | ❌ |
| Financial reports | ✅ | ❌ | ❌ |
| Rider reports | ✅ | ✅ | ✅ Own only |
| **System** | | | |
| Manage Support users | ✅ | ❌ | ❌ |
| System settings | ✅ | ❌ | ❌ |
| Payment config | ✅ | ❌ | ❌ |
| View audit logs | ✅ | ❌ | ❌ |

---

## Authentication

### Login Portals

**Admin Login** (`/admin/login`)
- For Super Admin and Support users
- Email + Password
- 2FA (recommended for Super Admin)
- Session management
- Activity logging

**Rider Login** (`/rider/login`)
- For Rider users
- Email + Password OR Phone + OTP
- Mobile-friendly interface
- Location tracking enabled

---

## Security Rules

### Super Admin
- ✅ 2FA strongly recommended
- ✅ IP whitelist optional
- ✅ All actions logged
- ✅ Password change required every 90 days
- ✅ Cannot be deleted (except by another Super Admin)

### Support
- ✅ Strong password required
- ✅ All actions logged
- ✅ Can be deactivated by Super Admin
- ✅ Limited to operational features
- ✅ No financial access

### Rider
- ✅ GPS location required when on delivery
- ✅ Can only update assigned deliveries
- ✅ Cannot view sensitive customer data
- ✅ Performance tracked
- ✅ Can be suspended by Support or Super Admin

---

## Initial Setup

### First Super Admin
Created during system installation:
```
Email: admin@gpowerpay.com
Password: (set during setup)
Role: superadmin
```

### Adding Support Users
Only Super Admin can create Support accounts:
1. Login as Super Admin
2. Navigate to Settings → Support Users
3. Click "Add Support User"
4. Fill in details + set temporary password
5. Support user receives email to set permanent password

### Adding Riders
Super Admin or Support can add riders:
1. Navigate to Riders → Add Rider
2. Fill in rider details
3. Upload documents
4. Set initial status
5. Rider receives login credentials

---

## Best Practices

### For Super Admin
- Enable 2FA immediately
- Use strong, unique passwords
- Don't share admin credentials
- Review audit logs regularly
- Limit number of Super Admin accounts
- Monitor Support user activities

### For Support
- Check orders regularly
- Assign riders efficiently
- Respond to customer issues quickly
- Keep product information updated
- Monitor rider performance

### For Riders
- Keep app updated
- Enable GPS when on delivery
- Update delivery status promptly
- Communicate with customers
- Report issues immediately

---

**Document Version**: 1.0  
**Last Updated**: July 21, 2026  
**Roles**: Super Admin, Support, Rider
