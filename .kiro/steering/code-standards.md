---
inclusion: auto
---

# Gpowerpay Code Standards

## File Size Rule: Maximum 1000 Lines
**HARD RULE:** No file should exceed 1000 lines of code.

### Why This Rule?
- **Maintainability:** Smaller files are easier to understand and maintain
- **Modularity:** Forces proper separation of concerns
- **Testability:** Smaller modules are easier to test
- **Collaboration:** Reduces merge conflicts
- **Performance:** Faster IDE performance and code navigation

### How to Enforce:
1. **Break large components** into smaller sub-components
2. **Extract utilities** into separate files
3. **Separate concerns** (UI, logic, data fetching)
4. **Use composition** over large monolithic files
5. **Create hooks** for reusable logic
6. **Modularize API routes** by splitting handlers

### File Organization Patterns:

#### For Large React Components (>1000 lines):
```
components/
  ProductCatalog/
    index.tsx (main export, <200 lines)
    ProductCard.tsx
    ProductFilters.tsx
    ProductSort.tsx
    ProductPagination.tsx
    hooks/
      useProductFilters.ts
      useProductSearch.ts
    utils/
      productHelpers.ts
```

#### For Large API Routes (>1000 lines):
```
src/app/api/products/
  route.ts (main handlers, <200 lines)
  validators.ts
  services/
    productService.ts
    inventoryService.ts
    imageService.ts
  utils/
    productHelpers.ts
```

#### For Large Utility Files (>1000 lines):
```
lib/
  validation/
    index.ts (main exports)
    userValidation.ts
    productValidation.ts
    orderValidation.ts
```

### Refactoring Strategy:
When a file approaches 800 lines:
1. **Identify sections** that can be extracted
2. **Create separate files** with clear responsibilities
3. **Maintain a clear API** through index files
4. **Update imports** in dependent files
5. **Test thoroughly** after refactoring

### Code Review Checklist:
- [ ] No file exceeds 1000 lines
- [ ] Each file has a single, clear responsibility
- [ ] Related files are grouped in directories
- [ ] Index files provide clean exports
- [ ] Functions are small and focused (<50 lines recommended)

## Additional Standards:

### Naming Conventions:
- **Components:** PascalCase (e.g., `ProductCard.tsx`)
- **Hooks:** camelCase with `use` prefix (e.g., `useProductFilter.ts`)
- **Utilities:** camelCase (e.g., `formatPrice.ts`)
- **Constants:** UPPER_SNAKE_CASE (e.g., `MAX_PRODUCT_IMAGES`)
- **Types/Interfaces:** PascalCase with `I` prefix for interfaces (e.g., `IProduct`)

### Import Organization:
1. External libraries (React, Next.js, etc.)
2. Internal absolute imports (`@/components`, `@/lib`)
3. Relative imports (`./`, `../`)
4. Type imports (grouped separately)
5. CSS/Style imports (last)

### Function Size:
- **Target:** <50 lines per function
- **Maximum:** 100 lines per function
- **If larger:** Break into smaller helper functions

### Comment Policy:
- Write self-documenting code
- Add comments for complex business logic
- Use JSDoc for public APIs and components
- Explain "why" not "what"

### TypeScript:
- **Always use TypeScript** for type safety
- **Avoid `any`** - use proper types or `unknown`
- **Use interfaces** for object shapes
- **Use types** for unions, intersections, and utilities
- **Export types** from dedicated files when shared

### Testing:
- Unit tests for utilities and hooks
- Integration tests for API routes
- E2E tests for critical user flows
- Aim for >80% coverage on business logic

## Enforcement:
This rule is **mandatory** and will be checked during:
- Code reviews
- Pre-commit hooks (can be added)
- CI/CD pipeline checks (can be added)

**Violation = Refactoring Required**
