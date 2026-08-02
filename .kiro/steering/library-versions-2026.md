---
inclusion: auto
---

# Library Documentation Rule (2026)

**CRITICAL RULE:** Before making ANY changes involving libraries, packages, or frameworks, ALWAYS search for and reference their 2026 documentation to ensure compatibility and up-to-date usage patterns.

## Libraries in This Codebase

### Core Framework
- **Next.js 16.2.10** (Released 2025)
  - App Router (stable)
  - Turbopack bundler
  - Server Components by default
  - File-based routing in `src/app/`

### Authentication
- **NextAuth.js v5.0.0-beta.32** (Major Breaking Changes from v4)
  - ⚠️ **NO MORE `getServerSession`** - Use `auth()` from root auth.ts
  - ⚠️ **NO MORE `NextAuthOptions`** - Use `AuthOptions`
  - New pattern: Export `{ handlers, auth, signIn, signOut }` from `NextAuth(config)`
  - Route handlers: `export const { GET, POST } = handlers;`

### Database
- **Mongoose 9.8.0** (Major Changes from v8)
  - ⚠️ **NO MORE `next` callback in hooks** - Use `async function()` without next parameter
  - Pre-save hooks: `Schema.pre('save', async function() { ... })` (NO next!)
  - Proper pattern: `return` early or throw errors directly

### Validation
- **Zod 4.4.3** (Breaking Changes from v3)
  - ⚠️ **`.partial()` CANNOT be used on schemas with refinements**
  - Solution: Manually define optional fields OR use `.deepPartial()`
  - Use explicit optional fields for update schemas

### UI Components
- **Tailwind CSS 4** (Major version update)
- **React 19.2.4** (Latest)
- **Lucide React 1.25.0** (Icon library)

## Before Making Changes Checklist

1. ✅ Check library version in package.json
2. ✅ Search for "[Library Name] 2026 documentation"
3. ✅ Verify API patterns match current version
4. ✅ Check for breaking changes from previous versions
5. ✅ Test the change before committing

## Common Migration Patterns

### NextAuth v4 → v5
```typescript
// ❌ OLD (v4)
import { getServerSession } from 'next-auth';
const session = await getServerSession(authOptions);

// ✅ NEW (v5)
import { auth } from '@/auth';
const session = await auth();
```

### Mongoose v8 → v9
```typescript
// ❌ OLD (v8)
Schema.pre('save', async function(next) {
  // ... logic
  next();
});

// ✅ NEW (v9)
Schema.pre('save', async function() {
  // ... logic (just return)
});
```

### Zod v3 → v4
```typescript
// ❌ OLD (v3)
export const updateSchema = createSchema.partial();

// ✅ NEW (v4) - If schema has refinements
export const updateSchema = z.object({
  field1: z.string().optional(),
  field2: z.number().optional(),
  // ... manually list all fields as optional
});
```

## Error Resolution Strategy

When encountering errors:
1. Read the FULL error message
2. Check if it mentions a missing export or deprecated API
3. Search for the library's migration guide
4. Update the code pattern to match current version
5. Never assume old patterns still work

## Documentation Sources

- **Next.js:** https://nextjs.org/docs (check version in URL)
- **NextAuth.js v5:** https://authjs.dev/getting-started/introduction
- **Mongoose:** https://mongoosejs.com/docs/guide.html
- **Zod:** https://zod.dev/
- **React 19:** https://react.dev/

---

**Remember:** This codebase uses CURRENT 2026 versions. Always verify compatibility!
