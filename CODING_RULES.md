# Gpowerpay Coding Rules

## 🚫 HARD RULES - NEVER BREAK THESE

### 1. NO Native JavaScript Dialogs
**NEVER use `alert()`, `confirm()`, or `prompt()`**

❌ **BAD:**
```typescript
if (confirm('Are you sure?')) {
  deleteItem();
}

alert('Action completed!');
```

✅ **GOOD:**
```typescript
import { useConfirm } from '@/lib/hooks/useConfirm';

const { confirm, ConfirmDialog } = useConfirm();

const handleDelete = async () => {
  const confirmed = await confirm({
    title: 'Delete Item',
    message: 'Are you sure you want to delete this item?',
    confirmText: 'Delete',
    cancelText: 'Cancel',
    variant: 'danger',
  });
  
  if (confirmed) {
    deleteItem();
  }
};

return (
  <>
    <button onClick={handleDelete}>Delete</button>
    <ConfirmDialog />
  </>
);
```

**Why?**
- Native dialogs are ugly and break the UI
- They block the entire browser window
- They can't be styled or branded
- They create inconsistent UX

**Alternatives:**
- Use `useConfirm()` hook for confirmations
- Use `toast` from `react-hot-toast` for notifications
- Create custom modal components for complex interactions

### 2. Use Toast Notifications for Feedback
**ALWAYS use `react-hot-toast` for user feedback**

✅ **GOOD:**
```typescript
import toast from 'react-hot-toast';

// Success
toast.success('Item added to cart!');

// Error
toast.error('Failed to save changes');

// Info
toast('Processing your request...');

// Loading
toast.loading('Uploading file...');
```

### 3. Consistent Confirmation Dialog Usage

**When to use ConfirmDialog:**
- Deleting data
- Clearing forms or carts
- Canceling unsaved changes
- Irreversible actions
- Logout/sign out

**Props:**
- `title` - Short action title (e.g., "Delete Account")
- `message` - Detailed explanation
- `confirmText` - Action button text (e.g., "Delete", "Clear", "Remove")
- `cancelText` - Cancel button text (default: "Cancel")
- `variant` - Visual style:
  - `'danger'` - Red (for destructive actions)
  - `'warning'` - Yellow (for caution)
  - `'info'` - Blue (for information)

## 📋 Other Best Practices

### File Naming
- Components: `PascalCase.tsx` (e.g., `UserProfile.tsx`)
- Utilities: `camelCase.ts` (e.g., `formatPrice.ts`)
- API routes: `route.ts` in appropriate folder

### Component Structure
```typescript
'use client'; // Only if using hooks/client features

import { } from 'react';
import { } from 'next';
import { } from 'lucide-react';
import { } from '@/components/ui';
import { } from '@/lib';

// Types/Interfaces
interface Props {
  // ...
}

// Component
export function ComponentName({ }: Props) {
  // Hooks
  // State
  // Effects
  // Handlers
  // Render
}
```

### Error Handling
- Always show user-friendly error messages
- Log errors to console for debugging
- Use try-catch blocks for async operations
- Handle loading and error states in UI

### Accessibility
- Use semantic HTML
- Add ARIA labels where needed
- Ensure keyboard navigation works
- Test with screen readers when possible

## 🎨 UI/UX Standards

### Colors
- Primary: Blue (#667eea)
- Success: Green
- Warning: Yellow
- Danger: Red
- Use Tailwind color classes consistently

### Spacing
- Use Tailwind spacing scale (4px increments)
- Consistent padding/margins across similar components
- Mobile-first responsive design

### Typography
- Headings: `text-2xl`, `text-xl`, `text-lg`
- Body: `text-base`, `text-sm`
- Labels: `text-sm font-medium`
- Captions: `text-xs text-gray-500`

## 📝 Code Quality

### DRY (Don't Repeat Yourself)
- Extract reusable components
- Create utility functions
- Use custom hooks for shared logic

### Type Safety
- Always use TypeScript types
- Avoid `any` type unless absolutely necessary
- Define interfaces for props and data structures

### Performance
- Use `'use client'` only when necessary
- Lazy load large components
- Optimize images with Next.js Image component
- Memoize expensive calculations

---

**Remember:** These rules exist to maintain consistency, quality, and user experience across the entire application. If you think a rule should be changed, discuss it with the team first.
