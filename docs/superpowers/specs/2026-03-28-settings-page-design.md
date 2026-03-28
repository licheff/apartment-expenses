# Settings Page Design

**Date:** 2026-03-28
**Status:** Approved

## Summary

Consolidate the existing `ManageCategoriesDialog` and `ManagePaymentSourcesDialog` into a single dedicated `/settings` route. Add a Settings icon to the sidebar utility bar (replacing the logout button) and to the mobile bottom tab bar. Move the logout action into the Settings page.

## Routing & Sidebar

- Add `/settings` route in `App.tsx` pointing to new `src/pages/SettingsPage.tsx`
- In `Sidebar.tsx` (desktop):
  - Replace the logout `<Button>` in the bottom utility bar with a `<NavLink to="/settings">` using the `Settings` icon (lucide-react)
  - Theme toggle stays in place
  - Logout button removed from sidebar entirely
- In `Sidebar.tsx` (mobile bottom tab bar):
  - Add a 4th nav item: `{ to: '/settings', label: 'Настройки', icon: Settings }`
  - Same `flex-1` pattern as existing items

## SettingsPage (`src/pages/SettingsPage.tsx`)

The page uses the standard `<Header>` shell with the title "Настройки". It receives `signOut` as a prop (passed from `App.tsx`, same as `Layout`/`Sidebar` already receives it).

The page receives `signOut` as a prop. Since React Router `<Outlet>` does not pass props to child routes directly, `SettingsPage` is wrapped in a thin route component in `App.tsx` (e.g. `<Route path="/settings" element={<SettingsPage signOut={signOut} />} />`), the same pattern used for `AuthenticatedApp`.

Data is fetched directly inside the page via hooks — no prop drilling from `App.tsx`:
- `useApartments()` — for categories, rent amounts, and all mutation functions
- `usePaymentSources()` — for payment sources and mutation functions

### Sections

**1. Разходи по локация**
Inline version of the current `ManageCategoriesDialog` content:
- Tabs per apartment (same as dialog)
- Per apartment: category list with paid_by_me checkbox, end date popover, delete button
- Add new category input + button
- Rent amount input + save/remove button

**2. Начини на плащане**
Inline version of the current `ManagePaymentSourcesDialog` content:
- List of payment sources with delete button
- Add new payment source input + button

**3. Акаунт**
Small section at the bottom with a single "Изход" button calling `signOut`.

## Removals

- `ManageCategoriesDialog` component and its trigger (gear icon button in the expenses page header) are removed
- `ManagePaymentSourcesDialog` component and its trigger (CreditCard icon in the subscriptions page header) are removed
- `categoriesDialogOpen` state and related handlers removed from `AuthenticatedApp` in `App.tsx`
- Payment sources dialog state and trigger removed from `SubscriptionsPage.tsx`

## Data Flow

```
App.tsx
  └── Route /settings → SettingsPage (signOut prop)
        ├── useApartments() → categories, rent, mutations
        └── usePaymentSources() → sources, mutations
```

`SettingsPage` is self-contained. No shared state with other pages.

## Files Changed

| File | Change |
|------|--------|
| `src/App.tsx` | Add `/settings` route; remove `ManagePaymentSourcesDialog` import (already not here — it's in SubscriptionsPage) |
| `src/components/Sidebar.tsx` | Replace logout button with Settings NavLink; add Settings to mobile tab bar |
| `src/pages/SettingsPage.tsx` | New file |
| `src/App.tsx` (AuthenticatedApp) | Remove `categoriesDialogOpen` state, `ManageCategoriesDialog` usage, and gear icon button from header |
| `src/pages/SubscriptionsPage.tsx` | Remove `ManagePaymentSourcesDialog` usage and CreditCard trigger button |
| `src/components/ManageCategoriesDialog.tsx` | Delete |
| `src/components/ManagePaymentSourcesDialog.tsx` | Delete |
