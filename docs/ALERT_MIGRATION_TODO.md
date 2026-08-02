# Alert/Confirm Migration TODO

## ✅ Completed
- [x] Created `useAlert` hook and `AlertProvider`
- [x] Added `AlertProvider` to root layout
- [x] Updated `components/wallet/FundWalletButton.tsx` (5 alerts replaced)
- [x] Created documentation

## 📋 Files to Migrate

### Customer-Facing Components (HIGH PRIORITY)

1. **src/app/cart/page.tsx** - 1 confirm
   - Line 99: Clear cart confirmation

2. **src/app/orders/[id]/page.tsx** - 1 confirm
   - Line 89: Cancel order confirmation

3. **src/app/orders/page.tsx** - 1 confirm
   - Line 218: Cancel order confirmation

4. **src/app/profile/page.tsx** - 1 confirm
   - Line 203: Delete address confirmation

5. **src/app/wishlist/page.tsx** - 1 confirm
   - Line 67: Clear wishlist confirmation

6. **components/reviews/ReviewList.tsx** - 2 alerts
   - Line 66: Login required
   - Line 82: Vote error

### Admin Components (LOWER PRIORITY)

7. **src/app/admin/categories/page.tsx** - 3 alerts, 1 confirm
   - Line 103: Delete confirmation
   - Line 115, 119: Delete errors
   - Line 145, 149: Save errors

8. **src/app/admin/products/page.tsx** - 4 alerts, 2 confirms
   - Line 149: Bulk delete confirmation
   - Line 168: Delete confirmation
   - Line 142: Bulk update error
   - Line 163: Bulk delete error
   - Line 178, 182: Delete errors

9. **src/app/admin/products/[id]/edit/page.tsx** - 4 alerts
   - Line 193, 198: Load errors
   - Line 304, 308: Update errors

10. **src/app/admin/products/new/page.tsx** - 2 alerts
    - Line 239, 243: Create errors

## Summary
- **Total Files**: 10
- **Total Replacements**: 27
  - Customer-facing: 8 (5 confirms, 3 alerts)
  - Admin: 19 (3 confirms, 16 alerts)

## Next Steps
1. Start with customer-facing components (files 1-6)
2. Then migrate admin components (files 7-10)
3. Test each component after migration
4. Remove this TODO file when complete
