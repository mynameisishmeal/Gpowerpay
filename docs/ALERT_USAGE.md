# Alert Dialog Usage Guide

Replace all `alert()` and `confirm()` calls with the new `useAlert()` hook.

## Setup

The `AlertProvider` is already added to the root layout, so you can use `useAlert()` in any component.

## Import

```tsx
import { useAlert } from '@/lib/hooks/useAlert';
```

## Usage Examples

### 1. Basic Alert (replaces `alert()`)

**Before:**
```tsx
alert('User not found');
```

**After:**
```tsx
const { showAlert } = useAlert();

showAlert({
  message: 'User not found',
});
```

### 2. Typed Alerts

```tsx
const { showAlert } = useAlert();

// Success alert
showAlert({
  type: 'success',
  message: 'Order placed successfully!',
});

// Error alert
showAlert({
  type: 'error',
  message: 'Payment failed. Please try again.',
});

// Warning alert
showAlert({
  type: 'warning',
  message: 'Minimum funding amount is ₦500',
});

// Info alert (default)
showAlert({
  type: 'info',
  message: 'Your session will expire in 5 minutes',
});
```

### 3. Custom Title and Button

```tsx
showAlert({
  title: 'Account Created',
  message: 'Welcome to Gpowerpay! Your account has been created successfully.',
  type: 'success',
  confirmText: 'Get Started',
});
```

### 4. Confirm Dialog (replaces `confirm()`)

**Before:**
```tsx
if (confirm('Are you sure you want to delete this item?')) {
  deleteItem();
}
```

**After:**
```tsx
const { showConfirm } = useAlert();

const confirmed = await showConfirm({
  title: 'Delete Item',
  message: 'Are you sure you want to delete this item? This action cannot be undone.',
  type: 'warning',
  confirmText: 'Delete',
  cancelText: 'Cancel',
});

if (confirmed) {
  deleteItem();
}
```

### 5. With Callbacks

```tsx
showAlert({
  message: 'Are you sure you want to logout?',
  type: 'warning',
  showCancel: true,
  confirmText: 'Logout',
  onConfirm: async () => {
    await signOut();
  },
  onCancel: () => {
    console.log('Logout cancelled');
  },
});
```

## Alert Options

```tsx
interface AlertOptions {
  title?: string;           // Alert title (default: based on type)
  message: string;          // Alert message (required)
  type?: 'info' | 'success' | 'warning' | 'error';  // Alert type (default: 'info')
  confirmText?: string;     // Confirm button text (default: 'OK')
  cancelText?: string;      // Cancel button text (default: 'Cancel')
  onConfirm?: () => void | Promise<void>;  // Callback when confirmed
  onCancel?: () => void;    // Callback when cancelled
  showCancel?: boolean;     // Show cancel button (default: false)
}
```

## Alert Types and Default Titles

- `info` → "Information" (blue icon)
- `success` → "Success" (green checkmark icon)
- `warning` → "Warning" (yellow alert icon)
- `error` → "Error" (red X icon)

## Migration Checklist

Search and replace these patterns in your codebase:

1. `alert(` → Use `showAlert({ message: `
2. `confirm(` → Use `await showConfirm({ message: `
3. `window.alert(` → Use `showAlert({ message: `
4. `window.confirm(` → Use `await showConfirm({ message: `

## Files Already Updated

- ✅ `components/wallet/FundWalletButton.tsx`

## Files to Update

Find all `alert()` and `confirm()` calls:
```bash
grep -r "alert(" --include="*.tsx" --include="*.ts"
grep -r "confirm(" --include="*.tsx" --include="*.ts"
```

Common locations:
- Order cancellation confirmations
- Delete confirmations
- Form validation errors
- Payment error messages
- Login/logout confirmations
