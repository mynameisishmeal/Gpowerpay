# GpowerPay Development Rules

## 🚨 HARD RULE #1: ALWAYS SCAN CODEBASE FIRST

**Before writing ANY code, you MUST:**

1. **Search the codebase** for similar implementations
2. **Read existing code** to understand patterns and conventions
3. **Check documentation** in `/docs` directory
4. **Look for type definitions** to understand data structures
5. **Review existing API routes** to understand auth patterns
6. **Examine models** to understand database schema

### Why This Rule Exists

- **Consistency**: Follow existing patterns instead of creating new ones
- **Context**: Understand legacy constraints (e.g., shared GpowerCRM database)
- **Avoid Breaking Changes**: Don't modify things that work across multiple systems
- **Save Time**: Don't reinvent what already exists
- **Prevent Repetition**: Stop making the same mistakes repeatedly

### How to Follow This Rule

#### ❌ DON'T DO THIS:
```typescript
// Writing code without checking existing patterns
export async function requireAdmin() {
  return requireAuth(['superadmin', 'support']); // Wrong roles!
}
```

#### ✅ DO THIS:
```typescript
// 1. First, search for existing auth helpers
// 2. Check User model for actual role names
// 3. Read ROLE_MAPPING.md documentation
// 4. Then write code that matches existing patterns

export async function requireAdmin() {
  return requireAuth(['sadmin', 'admin']); // Correct!
}
```

### Examples of Required Scanning

#### Example 1: Adding New API Endpoint
```bash
# Before creating /api/orders route, scan:
1. Check existing /api/orders routes
2. Look at /api/admin/orders for auth patterns
3. Read Order model schema
4. Check how other routes handle pagination
5. Then write new code matching those patterns
```

#### Example 2: Adding New Role Check
```bash
# Before adding role checks, scan:
1. Read docs/ROLE_MAPPING.md
2. Check models/User.ts for role enum
3. Look at lib/serverAuth.ts for helpers
4. Review how other pages check roles
5. Then implement using existing patterns
```

#### Example 3: Working with Products
```bash
# Before modifying product logic, scan:
1. Check if using dual schema (LegacyProduct + LegacyStock)
2. Read ProductService to understand composite IDs
3. Check ProductAdapter for data transformation
4. Look at existing product routes
5. Then write code that fits the architecture
```

## Hard Rule #2: Read Documentation First

Before starting ANY task:

1. ✅ Check `/docs` directory for relevant guides
2. ✅ Read `MEMORY_BANK.md` for context
3. ✅ Review `ROLE_MAPPING.md` if working with auth
4. ✅ Check inline comments in models and services

**Files to Always Check:**
- `docs/MEMORY_BANK.md` - Project context and history
- `docs/ROLE_MAPPING.md` - Role mapping and auth
- `docs/DEVELOPMENT_RULES.md` - This file
- Inline comments in models (`models/User.ts`, etc.)
- Service layer documentation (`lib/services/`)

## Hard Rule #3: Understand Legacy Constraints

This app has **SPECIAL CONSTRAINTS** that you MUST respect:

### Database Shared with GpowerCRM
```typescript
// ❌ NEVER DO THIS:
role: { type: String, enum: ['superadmin', 'admin', 'customer'] }
// This breaks GpowerCRM!

// ✅ ALWAYS DO THIS:
role: { type: String, enum: ['sadmin', 'admin', 'worker', 'customer'] }
// Preserves GpowerCRM compatibility
```

### Dual Product Schema (LegacyProduct + LegacyStock)
```typescript
// ❌ NEVER DO THIS:
const product = await Product.findById(productId);
// Product model doesn't exist!

// ✅ ALWAYS DO THIS:
const product = await ProductService.getProduct(productId);
// Handles both LegacyProduct (kilo) and LegacyStock (carton)
```

### Composite Product IDs
```typescript
// ❌ NEVER DO THIS:
productId: mongoose.Types.ObjectId
// Breaks with composite IDs!

// ✅ ALWAYS DO THIS:
productId: string // Supports "kilo-xxx" and "carton-xxx"
```

## Hard Rule #4: Follow Existing Patterns

### Authentication Pattern
```typescript
// ✅ Correct pattern (found in existing code)
const { session, error } = await requireAdmin();
if (error) return error;
```

### API Response Pattern
```typescript
// ✅ Correct pattern (found in existing code)
return NextResponse.json({
  success: true,
  data: result,
  pagination: { page, limit, total, totalPages }
});
```

### Error Handling Pattern
```typescript
// ✅ Correct pattern (found in existing code)
try {
  // ... code
} catch (error: any) {
  console.error('Operation error:', error);
  return NextResponse.json(
    { error: error.message || 'Operation failed' },
    { status: 500 }
  );
}
```

## Hard Rule #5: Check Type Definitions

Before using any data structure:

1. ✅ Check `/types/index.ts` for interface definitions
2. ✅ Look at model schemas for actual database structure
3. ✅ Review existing API responses for expected formats

```typescript
// ❌ DON'T GUESS:
interface Product {
  id: string;
  name: string;
  // ... guessing the structure
}

// ✅ CHECK TYPES FIRST:
import { IProduct } from '@/types';
// Now you know the exact structure!
```

## Hard Rule #6: Verify Before Claiming Done

Before saying "task complete":

1. ✅ Test the actual functionality
2. ✅ Check console for errors
3. ✅ Verify API returns expected structure
4. ✅ Ensure no breaking changes
5. ✅ Confirm it works with existing data

```typescript
// ❌ DON'T DO THIS:
"I've updated the code, it should work now"

// ✅ DO THIS:
"I've updated the code and verified:
- API returns correct structure
- No console errors
- Works with existing test data
- Follows existing patterns"
```

## Hard Rule #7: Document Breaking Changes

If you MUST make a breaking change:

1. ✅ Document WHY it's necessary
2. ✅ List what will break
3. ✅ Provide migration path
4. ✅ Get explicit approval before proceeding

```markdown
## Breaking Change Proposal

**Why**: Current auth system doesn't support X
**What Breaks**: All existing admin API routes
**Migration**: Update all requireAdmin() calls to...
**Alternative**: Could we do Y instead?

AWAITING APPROVAL BEFORE PROCEEDING
```

## Violation Consequences

Violating these rules leads to:

1. ❌ Breaking existing functionality
2. ❌ Creating inconsistent code
3. ❌ Repeating same mistakes
4. ❌ Frustrating the developer
5. ❌ Wasting time with fixes

## Summary Checklist

Before writing ANY code:

- [ ] Scanned codebase for similar implementations
- [ ] Read relevant documentation
- [ ] Checked model schemas
- [ ] Reviewed existing API patterns
- [ ] Understood legacy constraints
- [ ] Know the exact role names and mappings
- [ ] Verified type definitions
- [ ] Ready to follow existing patterns

## Remember

**CODE IS READ 10X MORE THAN IT'S WRITTEN**

Take 5 minutes to scan and understand before writing.

It saves hours of fixing and frustration later.

---

Last Updated: January 2025
