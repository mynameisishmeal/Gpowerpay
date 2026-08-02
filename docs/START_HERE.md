# 🚀 START HERE - GpowerPay Development

## 🚨 READ THIS FIRST

Before touching ANY code in this project, you **MUST** read:

### 1. **DEVELOPMENT_RULES.md** (MANDATORY)
**Location:** `/docs/DEVELOPMENT_RULES.md`

**Contains:**
- ✅ HARD RULE #1: Always scan codebase first
- ✅ How to understand existing patterns
- ✅ Common mistakes to avoid
- ✅ Checklist before writing code

### 2. **ROLE_MAPPING.md** (If working with auth)
**Location:** `/docs/ROLE_MAPPING.md`

**Contains:**
- ✅ Database role names vs actual meanings
- ✅ Why roles can't be changed
- ✅ Code examples for auth

### 3. **MEMORY_BANK.md** (For context)
**Location:** `/docs/MEMORY_BANK.md`

**Contains:**
- ✅ Project history and decisions
- ✅ What's been fixed
- ✅ Known issues and blockers

## Quick Start Workflow

### For ANY Task:

```bash
# 1. Read the rules
cat docs/DEVELOPMENT_RULES.md

# 2. Scan codebase for similar code
# Example: grep -r "requireAdmin" lib/

# 3. Check relevant documentation
cat docs/ROLE_MAPPING.md

# 4. Look at existing implementations
# Example: Check other API routes

# 5. THEN write code following patterns

# 6. Test and verify
npm run dev
```

## Key Project Facts

### ⚠️ CRITICAL CONSTRAINTS

1. **Shared Database with GpowerCRM**
   - DO NOT change role names
   - Role mapping: sadmin=superadmin, admin=support, worker=customer

2. **Dual Product Schema**
   - LegacyProduct (kilo market)
   - LegacyStock (carton market)
   - Use ProductService, not direct model access

3. **Composite Product IDs**
   - Format: "kilo-[objectId]" or "carton-[objectId]"
   - Always use string type, not ObjectId

## Common Tasks

### Adding New API Endpoint
1. ✅ Check existing API routes in `/api`
2. ✅ Look at auth patterns (`requireAdmin`, `requireCustomer`)
3. ✅ Review error handling pattern
4. ✅ Check response format pattern
5. ✅ Match pagination structure

### Working with Authentication
1. ✅ Read `ROLE_MAPPING.md`
2. ✅ Check `lib/serverAuth.ts` for helpers
3. ✅ Review `models/User.ts` for role enum
4. ✅ Use existing patterns (`requireAdmin`, etc.)

### Modifying User/Auth
1. ✅ Check User model schema
2. ✅ Verify role mappings
3. ✅ Test with different role types
4. ✅ Ensure GpowerCRM compatibility

### Working with Products
1. ✅ Use `ProductService`, not models directly
2. ✅ Understand dual schema (kilo + carton)
3. ✅ Handle composite IDs correctly
4. ✅ Check `ProductAdapter` for transformations

## File Structure Quick Reference

```
docs/
├── START_HERE.md           ← You are here
├── DEVELOPMENT_RULES.md    ← Read this FIRST
├── ROLE_MAPPING.md         ← Auth/role reference
└── MEMORY_BANK.md          ← Project history

lib/
├── serverAuth.ts           ← Auth helpers
├── services/               ← Business logic
│   ├── productService.ts   ← Product operations
│   ├── walletService.ts    ← Wallet operations
│   └── ...
└── store/                  ← Zustand stores

models/
├── User.ts                 ← User schema (role enum here!)
├── LegacyProduct.ts        ← Kilo products
├── LegacyStock.ts          ← Carton products
└── ...

src/app/
├── api/                    ← API routes
│   ├── admin/             ← Admin endpoints
│   └── ...
├── admin/                  ← Admin dashboard
└── ...
```

## Before You Start Coding

Ask yourself:

1. ❓ Have I read DEVELOPMENT_RULES.md?
2. ❓ Have I scanned for similar code?
3. ❓ Do I understand the legacy constraints?
4. ❓ Am I following existing patterns?
5. ❓ Have I checked the documentation?

If any answer is "no", **STOP** and do that first.

## Need Help?

1. Check `/docs` directory
2. Search codebase for similar implementations
3. Read inline comments in models and services
4. Review existing API routes for patterns

## Remember

> "Code is read 10x more than it's written"

Spend 5 minutes scanning before writing.

Save hours of fixing and frustration later.

---

**Welcome to GpowerPay! Now go read DEVELOPMENT_RULES.md** 📚
