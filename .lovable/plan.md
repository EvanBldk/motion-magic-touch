

## Fix: Profile page scroll overflow

**Problem**: The `<main>` element in `AppLayout.tsx` uses `flex flex-1 flex-col` without `overflow-y-auto`, so tall page content gets clipped. Profile's container also lacks explicit scroll overflow.

**Solution** — single line change in `src/pages/Profile.tsx`:

Add `overflow-y-auto` to the root div (line ~137). The container already has `flex flex-1 flex-col p-4 md:p-8 pb-24 md:pb-8`, just needs the overflow class:

```
<div className="flex flex-1 flex-col p-4 md:p-8 pb-24 md:pb-8 overflow-y-auto">
```

This matches the scroll pattern and ensures all cards (Mobilité, Objectifs, Diagnostics, Progression link, Dark mode, Déconnexion) are reachable.

**Files modified**: `src/pages/Profile.tsx` only (one CSS class addition).

