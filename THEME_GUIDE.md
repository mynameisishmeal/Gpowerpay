# 🎨 Gpower Theme System

This Next.js app includes the complete Gpower CRM styling system with modern UI components and pre-built themes.

## 📁 File Structure

```
├── src/app/
│   ├── globals.css          # Main global styles
│   ├── themes.css           # 8 pre-built theme presets
│   ├── responsive.css       # Mobile-first responsive utilities
│   └── layout.tsx           # Root layout with styles imported
├── components/
│   ├── Navigation.tsx       # Full navigation with role-based access
│   ├── Toast.tsx           # Toast notification system
│   ├── ConfirmModal.tsx    # Confirmation modal
│   ├── SearchableSelect.tsx # Searchable dropdown component
│   └── ui/
│       ├── button.tsx      # Button component with variants
│       ├── card.tsx        # Card component
│       ├── input.tsx       # Input component
│       └── table.tsx       # Table component
└── lib/
    └── utils.ts            # Utility functions (cn for class merging)
```

## 🎨 Available Themes

The app includes 8 professionally designed themes in `src/app/themes.css`:

1. **Modern Blue** - Professional & Clean
2. **Dark Slate** - Modern Dark
3. **Emerald Green** - Fresh & Vibrant
4. **Purple Luxury** - Premium Feel
5. **Orange Energy** - Bold & Dynamic
6. **Minimal Gray** - Ultra Clean
7. **Teal Ocean** - Calm & Professional
8. **Rose Pink** - Soft & Modern

### How to Apply a Theme

The themes use CSS variables defined with Tailwind's `@theme` directive. To apply a theme, copy the desired theme's CSS variables from `themes.css` into your `globals.css` or import it directly.

## 🎯 Global Styles Features

### Glass Effect
```tsx
<nav className="glass">...</nav>
```

### Card Shadows
```tsx
<div className="card-shadow">...</div>
```

### Modern Buttons
```tsx
<button className="btn-modern">Click Me</button>
```

### Animations
```tsx
<div className="animate-fade-in-up">Content</div>
<div className="animate-slide-in">Notification</div>
```

### Custom Scrollbar
Automatically styled for a modern look across the entire app.

## 🔧 UI Components

### Button Component

```tsx
import { Button } from "@/components/ui/button";

// Variants
<Button variant="default">Default</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Outline</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>

// Sizes
<Button size="default">Default</Button>
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
<Button size="icon">Icon</Button>
```

### Card Component

```tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description goes here</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Card content</p>
  </CardContent>
</Card>
```

### Navigation Component

```tsx
import Navigation from "@/components/Navigation";

// Add to your layout or page
<Navigation />
```

Features:
- Role-based access control (sadmin, user with permissions)
- Mobile responsive with hamburger menu
- Dropdown menus for grouped items
- Logout functionality
- Uses Lucide React icons

### Toast Notifications

```tsx
import { Toast } from "@/components/Toast";

<Toast 
  message="Operation successful!" 
  type="success" 
/>
```

## 📱 Responsive Utilities

Mobile-first utilities are available in `responsive.css`:

```tsx
<div className="mobile-hide">Hidden on mobile</div>
<div className="mobile-stack">Stacks on mobile</div>
<div className="tablet-full">Full width on tablet</div>
<div className="print-hide">Hidden when printing</div>
```

## 🎨 Icons

The app uses [Lucide React](https://lucide.dev/) for icons:

```tsx
import { Home, ShoppingCart, Package, Users } from "lucide-react";

<Home className="h-4 w-4" />
<ShoppingCart className="h-6 w-6 text-blue-600" />
```

## 🛠️ Installed Dependencies

- `@radix-ui/react-slot` - Primitive for accessible components
- `class-variance-authority` - Component variants
- `clsx` - Conditional classNames utility
- `lucide-react` - Icon library
- `tailwind-merge` - Merge Tailwind classes

## 🚀 Getting Started

1. **Run the development server:**
   ```bash
   npm run dev
   ```

2. **Browse the themes:**
   - Open `src/app/themes.css` to see all available themes
   - Copy your preferred theme into `globals.css` or create a theme switcher

3. **Use the components:**
   - Import components from `@/components/ui/`
   - Check the example usage in `src/app/page.tsx`

4. **Customize:**
   - Modify colors in `globals.css`
   - Add new components in `components/ui/`
   - Adjust responsive breakpoints in `responsive.css`

## 💡 Tips

- All components use the `cn()` utility from `lib/utils.ts` for conditional className merging
- The Navigation component uses localStorage for user authentication state
- Card shadows have hover effects for better UX
- Forms automatically have focus states with blue rings
- Print styles are optimized for receipts and reports

## 🎯 Next Steps

1. Choose and apply a theme from `themes.css`
2. Set up your authentication system to work with the Navigation component
3. Create pages for dashboard, sales, inventory, etc.
4. Customize the color scheme to match your brand
5. Add more UI components as needed

Enjoy building with Gpower CRM! 🚀
