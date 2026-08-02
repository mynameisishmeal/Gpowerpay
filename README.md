# Gpower Pay

**Gpower Pay** is an online store and delivery platform for Gpower Frozen Foods, built with Next.js 16, TypeScript, and MongoDB.

## Features

- 🛒 **E-commerce Store** - Browse and purchase frozen food products
- 📦 **Order Management** - Track orders from placement to delivery
- 🚴 **Delivery System** - Rider dashboard with order assignment and confirmation
- 💰 **Wallet System** - Digital wallet with Paystack payment integration
- ⭐ **Reviews & Ratings** - Customer reviews for products and riders
- 👥 **Multi-role Access** - Customer, Admin, Rider, and Support roles
- 📱 **Responsive Design** - Mobile-friendly interface

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** NextAuth.js v5
- **Payments:** Paystack
- **Styling:** Tailwind CSS
- **State Management:** Zustand
- **UI Components:** Radix UI, Lucide Icons

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- MongoDB database
- Paystack account (for payments)

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Set up environment variables (see `.env.local.example`)

4. Run the development server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

Create a `.env.local` file with:

```
MONGODB_URI=your_mongodb_connection_string
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=your_paystack_public_key
PAYSTACK_SECRET_KEY=your_paystack_secret_key
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Project Structure

```
├── src/app/              # Next.js App Router pages
├── components/           # React components
├── lib/                  # Utilities, services, models
├── models/               # Mongoose schemas
├── public/               # Static assets
└── types/                # TypeScript type definitions
```

## Key Roles

- **Customer** - Browse products, place orders, manage wallet
- **Admin/Support** - Manage products, orders, users, riders
- **Rider** - Accept deliveries, confirm orders, manage location
- **Super Admin** - Full system access

## License

Private - Gpower Frozen Foods

## Support

For support, contact the development team.
