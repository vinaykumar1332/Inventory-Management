# Admin Feature Refactoring Guide

## What Changed

The admin feature has been restructured from a scattered layout to a **self-contained feature module**:

### Old Structure
```
src/
├── pages/admin/
│   └── AdminPage.tsx
├── features/admin/
│   ├── UserSheet.tsx
│   ├── ResetDemo.tsx
│   └── ClearAppData.tsx
```

### New Structure  
```
src/features/admin/
├── config.ts              # Admin feature config (roles, features)
├── types.ts               # Admin-specific types
├── api.ts                 # Admin API wrapper
├── components/
│   ├── UserSheet.tsx      # Create/edit users
│   ├── ResetDemo.tsx      # Reset demo data
│   ├── ClearAppData.tsx   # Clear offline cache
│   └── index.ts           # Export all components
├── pages/
│   └── AdminPage.tsx      # Main admin page
└── index.ts               # Export everything
```

## Key Benefits

1. **Self-Contained**: Everything about admin is in one folder
2. **Clear Exports**: `import { AdminPage } from '@/features/admin'`
3. **Type-Safe**: Dedicated types file for admin-specific interfaces
4. **API Layer**: `admin/api.ts` wraps mockApi and can be migrated to real backend later
5. **Easy to Test**: All components are co-located

## How to Import

### ✅ Good (New Way)
```tsx
import { AdminPage } from '@/features/admin'
import { UserSheet, ResetDemoDialog } from '@/features/admin'
import { adminApi } from '@/features/admin'
```

### ❌ Old Way (Still Works, Don't Use)
```tsx
import AdminPage from '@/pages/admin/AdminPage'
import { UserSheet } from '@/features/admin/UserSheet'
```

## Next Steps for Other Features

Apply the same pattern to:
- Dashboard
- Inventory
- Bills
- Reports
- Sites
- Approvals
- etc.

Each should have:
```
src/features/{name}/
├── config.ts
├── types.ts
├── api.ts
├── components/
│   └── index.ts
├── pages/
│   └── [Page].tsx
└── index.ts
```

## API Migration Path

When ready to use real backend API instead of mock:

**Before (in api.ts):**
```ts
export const adminApi = {
  listUsers: () => mockApi.getUsers(),
  createUser: (input) => mockApi.createUser(input),
}
```

**After (real API):**
```ts
export const adminApi = {
  listUsers: async () => {
    const res = await apiFetch<BackendUser[]>('/api/accounts/users/')
    return res.map(mapBackendUser)
  },
  createUser: async (input) => {
    return await apiFetch('/api/accounts/users/', {
      method: 'POST',
      body: JSON.stringify(input),
    })
  },
}
```

No component changes needed — they import from `adminApi` which handles the switch.
