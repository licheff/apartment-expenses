# Settings Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Consolidate categories/rent settings and payment sources management into a single `/settings` page, accessible from the sidebar utility bar, replacing both modal dialogs.

**Architecture:** New `SettingsPage` component fetches its own data via `useApartments()` and `usePaymentSources()` hooks — no prop drilling. The two existing dialog components are deleted. The sidebar gains a Settings nav link (desktop utility bar + mobile tab bar), and logout moves inside the Settings page.

**Tech Stack:** React 19, TypeScript (strict), React Router, Tailwind CSS v4, Radix UI, lucide-react

---

## File Map

| File | Action |
|------|--------|
| `src/pages/SettingsPage.tsx` | Create |
| `src/App.tsx` | Modify — add `/settings` route, remove `ManageCategoriesDialog` usage |
| `src/components/Sidebar.tsx` | Modify — replace logout button with Settings NavLink, add to mobile tab bar |
| `src/pages/SubscriptionsPage.tsx` | Modify — remove `ManagePaymentSourcesDialog` usage |
| `src/components/ManageCategoriesDialog.tsx` | Delete |
| `src/components/ManagePaymentSourcesDialog.tsx` | Delete |

---

## Task 1: Create SettingsPage

**Files:**
- Create: `src/pages/SettingsPage.tsx`

- [ ] **Step 1: Create the file**

```tsx
import { useState } from 'react'
import { Plus, Trash2, CalendarClock, LogOut } from 'lucide-react'
import { Header } from '@/components/Header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { useApartments } from '@/hooks/useApartments'
import { usePaymentSources } from '@/hooks/usePaymentSources'

interface SettingsPageProps {
  signOut: () => Promise<void>
}

function getEndDateStatus(endDate: string | null): 'none' | 'ok' | 'soon' | 'expired' {
  if (!endDate) return 'none'
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const expiry = new Date(endDate)
  const diffDays = Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays < 0) return 'expired'
  if (diffDays <= 30) return 'soon'
  return 'ok'
}

const endDateIconClass: Record<ReturnType<typeof getEndDateStatus>, string> = {
  none: 'text-muted-foreground/40 hover:text-muted-foreground',
  ok: 'text-muted-foreground hover:text-foreground',
  soon: 'text-amber-500 hover:text-amber-600',
  expired: 'text-destructive hover:text-destructive/80',
}

export function SettingsPage({ signOut }: SettingsPageProps) {
  const {
    apartments,
    categories,
    addCategory,
    deleteCategory,
    toggleCategoryPaidByMe,
    updateCategoryEndDate,
    updateRentAmount,
  } = useApartments()

  const { paymentSources, create: createSource, remove: removeSource } = usePaymentSources()

  const [activeTab, setActiveTab] = useState(apartments[0]?.id ?? '')
  const [newCategoryName, setNewCategoryName] = useState('')
  const [deletingCategory, setDeletingCategory] = useState<string | null>(null)
  const [rentInputs, setRentInputs] = useState<Record<string, string>>({})
  const [newSourceName, setNewSourceName] = useState('')
  const [deletingSource, setDeletingSource] = useState<string | null>(null)

  if (!activeTab && apartments.length > 0) {
    setActiveTab(apartments[0].id)
  }

  const handleAddCategory = async () => {
    if (!newCategoryName.trim() || !activeTab) return
    await addCategory(activeTab, newCategoryName.trim())
    setNewCategoryName('')
  }

  const handleDeleteCategory = async (id: string) => {
    setDeletingCategory(id)
    await deleteCategory(id)
    setDeletingCategory(null)
  }

  const getRentInput = (apt: { id: string; rent_amount: number | null }) => {
    if (rentInputs[apt.id] !== undefined) return rentInputs[apt.id]
    return apt.rent_amount != null ? String(apt.rent_amount) : ''
  }

  const handleSaveRent = async (aptId: string) => {
    const val = rentInputs[aptId]
    const num = val ? Number(val) : null
    await updateRentAmount(aptId, num && num > 0 ? num : null)
    setRentInputs(prev => {
      const next = { ...prev }
      delete next[aptId]
      return next
    })
  }

  const handleAddSource = async () => {
    if (!newSourceName.trim()) return
    await createSource(newSourceName.trim())
    setNewSourceName('')
  }

  const handleDeleteSource = async (id: string) => {
    setDeletingSource(id)
    await removeSource(id)
    setDeletingSource(null)
  }

  return (
    <div>
      <Header title="Настройки" />

      <main className="mx-auto px-4 py-6 space-y-8 max-w-[600px]">
        {/* Section 1: Expenses by location */}
        <section className="space-y-4">
          <h2 className="text-base font-semibold">Разходи по локация</h2>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full">
              {apartments.map(apt => (
                <TabsTrigger key={apt.id} value={apt.id} className="flex-1">
                  {apt.name}
                </TabsTrigger>
              ))}
            </TabsList>

            {apartments.map(apt => {
              const aptCategories = categories[apt.id] ?? []
              return (
                <TabsContent key={apt.id} value={apt.id} className="space-y-4">
                  {/* Category list */}
                  <div className="space-y-2">
                    {aptCategories.map(cat => {
                      const status = getEndDateStatus(cat.end_date)
                      return (
                        <div
                          key={cat.id}
                          className="flex items-center justify-between rounded-md border px-3 py-2"
                        >
                          <span className="text-sm">{cat.name}</span>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5">
                              <Checkbox
                                id={`paid-${cat.id}`}
                                checked={cat.paid_by_me}
                                onCheckedChange={v => toggleCategoryPaidByMe(cat.id, v === true)}
                              />
                              <Label
                                htmlFor={`paid-${cat.id}`}
                                className="text-xs text-muted-foreground cursor-pointer"
                              >
                                Плащам аз
                              </Label>
                            </div>

                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className={`h-7 w-7 ${endDateIconClass[status]}`}
                                  title={cat.end_date ? `Изтича: ${cat.end_date}` : 'Задай дата на изтичане'}
                                >
                                  <CalendarClock className="h-3.5 w-3.5" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent align="end" className="w-auto p-0">
                                <Calendar
                                  mode="single"
                                  selected={cat.end_date ? new Date(cat.end_date + 'T00:00:00') : undefined}
                                  onSelect={date => {
                                    if (!date) return
                                    const y = date.getFullYear()
                                    const m = String(date.getMonth() + 1).padStart(2, '0')
                                    const d = String(date.getDate()).padStart(2, '0')
                                    updateCategoryEndDate(cat.id, `${y}-${m}-${d}`)
                                  }}
                                  defaultMonth={cat.end_date ? new Date(cat.end_date + 'T00:00:00') : undefined}
                                  initialFocus
                                />
                                {cat.end_date && (
                                  <div className="border-t p-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="w-full text-xs text-muted-foreground"
                                      onClick={() => updateCategoryEndDate(cat.id, null)}
                                    >
                                      Премахни датата
                                    </Button>
                                  </div>
                                )}
                              </PopoverContent>
                            </Popover>

                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => handleDeleteCategory(cat.id)}
                              disabled={deletingCategory === cat.id}
                              title="Изтрий категорията"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                    {aptCategories.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">Няма категории</p>
                    )}
                  </div>

                  <Separator />

                  {/* Add category */}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Нова категория..."
                      value={newCategoryName}
                      onChange={e => setNewCategoryName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
                    />
                    <Button onClick={handleAddCategory} disabled={!newCategoryName.trim()} size="sm">
                      <Plus className="h-4 w-4 mr-1" />
                      Добави
                    </Button>
                  </div>

                  <Separator />

                  {/* Rent amount */}
                  <div className="grid gap-2">
                    <Label className="text-sm">Месечен наем (EUR)</Label>
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        inputMode="decimal"
                        placeholder="Няма наем"
                        value={getRentInput(apt)}
                        onChange={e => setRentInputs(prev => ({ ...prev, [apt.id]: e.target.value }))}
                      />
                      <Button size="sm" onClick={() => handleSaveRent(apt.id)}>
                        Запази
                      </Button>
                    </div>
                    {apt.rent_amount != null && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-muted-foreground w-fit"
                        onClick={() => {
                          setRentInputs(prev => ({ ...prev, [apt.id]: '' }))
                          updateRentAmount(apt.id, null)
                        }}
                      >
                        Премахни наема
                      </Button>
                    )}
                  </div>
                </TabsContent>
              )
            })}
          </Tabs>
        </section>

        {/* Section 2: Payment methods */}
        <section className="space-y-4">
          <h2 className="text-base font-semibold">Начини на плащане</h2>

          <div className="space-y-2">
            {paymentSources.map(source => (
              <div
                key={source.id}
                className="flex items-center justify-between rounded-md border px-3 py-2"
              >
                <span className="text-sm">{source.name}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={() => handleDeleteSource(source.id)}
                  disabled={deletingSource === source.id}
                  title="Изтрий"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
            {paymentSources.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Няма добавени начини на плащане
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="Нов начин на плащане..."
              value={newSourceName}
              onChange={e => setNewSourceName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddSource()}
            />
            <Button onClick={handleAddSource} disabled={!newSourceName.trim()} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Добави
            </Button>
          </div>
        </section>

        {/* Section 3: Account */}
        <section className="space-y-4">
          <h2 className="text-base font-semibold">Акаунт</h2>
          <Button variant="outline" onClick={signOut} className="gap-2">
            <LogOut className="h-4 w-4" />
            Изход
          </Button>
        </section>
      </main>
    </div>
  )
}
```

---

## Task 2: Add `/settings` route in App.tsx

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Add SettingsPage import**

In `src/App.tsx`, add this import alongside the other page imports:

```tsx
import { SettingsPage } from '@/pages/SettingsPage'
```

- [ ] **Step 2: Add the route**

Inside the `<Route element={<Layout signOut={signOut} />}>` block, add the settings route after the subscriptions route:

```tsx
<Route path="/settings" element={<SettingsPage signOut={signOut} />} />
```

The full routes block becomes:

```tsx
<Routes>
  <Route element={<Layout signOut={signOut} />}>
    <Route index element={<OverviewPage />} />
    <Route path="/expenses" element={<AuthenticatedApp />} />
    <Route path="/subscriptions" element={<SubscriptionsPage />} />
    <Route path="/settings" element={<SettingsPage signOut={signOut} />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Route>
</Routes>
```

- [ ] **Step 3: Verify build passes**

```bash
npm run build
```

Expected: no TypeScript errors. The settings page is now reachable at `/settings` in the browser.

---

## Task 3: Update Sidebar

**Files:**
- Modify: `src/components/Sidebar.tsx`

The sidebar currently has:
- Desktop: nav links (Преглед, Разходи, Абонаменти) + bottom utility bar (ThemeToggleBulb + logout Button)
- Mobile: 3 NavLink items

Changes:
- Desktop utility bar: replace logout `<Button>` with a `<NavLink to="/settings">` using the `Settings` icon
- Mobile tab bar: add a 4th item for settings; remove the `signOut` prop (it's no longer used by Sidebar)

- [ ] **Step 1: Replace Sidebar contents**

On **desktop**: Settings icon lives in the utility bar (bottom, replacing logout). The main nav list stays as 3 items.
On **mobile**: Settings is a 4th tab in the bottom tab bar.

Replace `src/components/Sidebar.tsx` entirely with:

```tsx
import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Receipt, CreditCard, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ThemeToggleBulb } from '@licheff/dark-mode-switch'

const navItems = [
  { to: '/', label: 'Преглед', icon: LayoutDashboard, end: true },
  { to: '/expenses', label: 'Разходи', icon: Receipt, end: false },
  { to: '/subscriptions', label: 'Абонаменти', icon: CreditCard, end: false },
]

const mobileNavItems = [
  ...navItems,
  { to: '/settings', label: 'Настройки', icon: Settings, end: false },
]

export function Sidebar() {
  return (
    <>
      {/* Desktop sidebar — fixed, full height */}
      <aside className="hidden sm:fixed sm:inset-y-0 sm:left-0 sm:z-30 sm:flex sm:w-[220px] sm:flex-col bg-sidebar border-r border-sidebar-border">
        {/* App name */}
        <div className="px-4 py-5 border-b border-sidebar-border">
          <span className="text-lg font-bold tracking-tight text-sidebar-foreground">💸 Бюджетник</span>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                  isActive
                    ? 'bg-primary/8 text-sidebar-accent-foreground font-medium'
                    : 'text-sidebar-foreground hover:bg-primary/4',
                )
              }
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Bottom utility bar: theme toggle + settings icon */}
        <div className="px-3 py-4 border-t border-sidebar-border flex items-center gap-1">
          <ThemeToggleBulb className="text-sidebar-foreground hover:bg-primary/4 hover:text-sidebar-accent-foreground" />
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              cn(
                'ml-auto inline-flex h-9 w-9 items-center justify-center rounded-md transition-colors',
                isActive
                  ? 'bg-primary/8 text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground hover:bg-primary/4 hover:text-sidebar-accent-foreground',
              )
            }
            title="Настройки"
          >
            <Settings className="h-4 w-4" />
          </NavLink>
        </div>
      </aside>

      {/* Mobile bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 sm:hidden bg-background border-t flex" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {mobileNavItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'flex-1 flex flex-col items-center gap-1 pt-2.5 pb-4 text-xs transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground',
              )
            }
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </>
  )
}
```

- [ ] **Step 2: Remove `signOut` prop from Sidebar usages**

`Sidebar` no longer accepts `signOut`. Update `src/components/Layout.tsx`:

```tsx
import { Outlet } from 'react-router-dom'
import { Sidebar } from '@/components/Sidebar'

export function Layout() {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      {/* sm:pl-[220px] offsets the fixed sidebar on desktop; padding-bottom clears the mobile tab bar + safe area */}
      <div className="sm:pl-[220px] sm:pb-0" style={{ paddingBottom: 'calc(70px + env(safe-area-inset-bottom))' }}>
        <Outlet />
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Remove `signOut` prop from Layout usage in App.tsx**

In `src/App.tsx`, the `<Layout>` usage currently passes `signOut`. Update it:

```tsx
<Route element={<Layout />}>
```

Also remove the `LayoutProps` interface from `Layout.tsx` (it no longer has props) — the file in Step 2 above already omits it.

- [ ] **Step 4: Verify build passes**

```bash
npm run build
```

Expected: no TypeScript errors. Navigate to `/settings` in the browser — you should see the page with all three sections.

- [ ] **Step 5: Commit**

```bash
git add src/pages/SettingsPage.tsx src/App.tsx src/components/Sidebar.tsx src/components/Layout.tsx
git commit -m "feat: add Settings page with categories, payment sources, and logout"
```

---

## Task 4: Remove ManageCategoriesDialog from AuthenticatedApp

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Remove the import**

Delete this line from `src/App.tsx`:

```tsx
import { ManageCategoriesDialog } from '@/components/ManageCategoriesDialog'
```

- [ ] **Step 2: Remove `categoriesDialogOpen` state**

Delete this line from `AuthenticatedApp`:

```tsx
const [categoriesDialogOpen, setCategoriesDialogOpen] = useState(false)
```

- [ ] **Step 3: Remove `categoriesDialogOpen` from the keydown handler condition**

The `useEffect` keydown handler currently reads:

```tsx
if (e.metaKey && e.key === 'a' && !addDialogOpen && !editDialogOpen && !importDialogOpen && !categoriesDialogOpen) {
```

Change it to:

```tsx
if (e.metaKey && e.key === 'a' && !addDialogOpen && !editDialogOpen && !importDialogOpen) {
```

Also remove `categoriesDialogOpen` from the dependency array:

```tsx
}, [handleOpenAdd, addDialogOpen, editDialogOpen, importDialogOpen])
```

- [ ] **Step 4: Remove the Settings gear button from the header**

In the `<Header>` children block, delete these lines:

```tsx
<Button variant="ghost" size="icon" onClick={() => setCategoriesDialogOpen(true)} title="Категории">
  <Settings className="h-4 w-4" />
</Button>
```

- [ ] **Step 5: Remove `Settings` from lucide imports**

In `src/App.tsx`, the lucide import currently reads:

```tsx
import { ArrowDownUp, Upload, Download, Settings, Plus } from 'lucide-react'
```

Remove `Settings`:

```tsx
import { ArrowDownUp, Upload, Download, Plus } from 'lucide-react'
```

- [ ] **Step 6: Remove the ManageCategoriesDialog JSX block**

Delete this entire block from the dialogs section at the bottom of `AuthenticatedApp`'s return:

```tsx
<ManageCategoriesDialog
  open={categoriesDialogOpen}
  onOpenChange={setCategoriesDialogOpen}
  apartments={apartments}
  categories={categories}
  onAdd={addCategory}
  onDelete={deleteCategory}
  onTogglePaidByMe={toggleCategoryPaidByMe}
  onUpdateEndDate={updateCategoryEndDate}
  onUpdateRentAmount={updateRentAmount}
/>
```

- [ ] **Step 7: Verify build passes**

```bash
npm run build
```

Expected: no TypeScript errors.

---

## Task 5: Remove ManagePaymentSourcesDialog from SubscriptionsPage

**Files:**
- Modify: `src/pages/SubscriptionsPage.tsx`

- [ ] **Step 1: Remove the ManagePaymentSourcesDialog import**

Delete this line:

```tsx
import { ManagePaymentSourcesDialog } from '@/components/ManagePaymentSourcesDialog'
```

- [ ] **Step 2: Remove `CreditCard` from lucide imports**

`CreditCard` is only used by the trigger button being removed. The lucide import currently reads:

```tsx
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronRight, CreditCard, Plus } from 'lucide-react'
```

Remove `CreditCard`:

```tsx
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronRight, Plus } from 'lucide-react'
```

- [ ] **Step 3: Remove `create` and `remove` from the `usePaymentSources()` destructure**

The current line (around line 249) reads:

```tsx
const { paymentSources, create: createSource, remove: removeSource } = usePaymentSources()
```

`paymentSources` is still needed (passed to `AddSubscriptionDialog` and `EditSubscriptionDialog`). Change to:

```tsx
const { paymentSources } = usePaymentSources()
```

- [ ] **Step 4: Remove `sourcesOpen` state**

Delete this line:

```tsx
const [sourcesOpen, setSourcesOpen] = useState(false)
```

- [ ] **Step 5: Remove `sourcesOpen` from the keydown handler**

The handler currently reads:

```tsx
if (e.metaKey && e.key === 'a' && !addOpen && !editOpen && !sourcesOpen) {
```

Change to:

```tsx
if (e.metaKey && e.key === 'a' && !addOpen && !editOpen) {
```

Remove `sourcesOpen` from the dependency array too:

```tsx
}, [handleOpenAdd, addOpen, editOpen])
```

- [ ] **Step 6: Remove the CreditCard trigger button**

Delete the button that opens the payment sources dialog from the header actions area (around line 356–361):

```tsx
<Button variant="ghost" size="sm" onClick={() => setSourcesOpen(true)}>
  <CreditCard className="h-4 w-4 mr-1.5" />
  Начини на плащане
</Button>
```

- [ ] **Step 7: Remove the ManagePaymentSourcesDialog JSX block**

Delete this entire block from the dialogs section:

```tsx
<ManagePaymentSourcesDialog
  open={sourcesOpen}
  onOpenChange={setSourcesOpen}
  paymentSources={paymentSources}
  onCreate={createSource}
  onDelete={removeSource}
/>
```

- [ ] **Step 8: Verify build passes**

```bash
npm run build
```

Expected: no TypeScript errors.

---

## Task 6: Delete old dialog files and final commit

**Files:**
- Delete: `src/components/ManageCategoriesDialog.tsx`
- Delete: `src/components/ManagePaymentSourcesDialog.tsx`

- [ ] **Step 1: Delete both files**

```bash
rm src/components/ManageCategoriesDialog.tsx src/components/ManagePaymentSourcesDialog.tsx
```

- [ ] **Step 2: Verify build still passes**

```bash
npm run build
```

Expected: clean build with no errors.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "refactor: remove ManageCategoriesDialog and ManagePaymentSourcesDialog — consolidated into SettingsPage"
```

---

## Manual Smoke Test Checklist

After all tasks complete, verify in the browser:

- [ ] Navigating to `/settings` shows the page with three sections
- [ ] Sidebar (desktop): Settings icon is in the utility bar; no logout button
- [ ] Mobile: bottom tab bar has 4 items including Настройки
- [ ] Settings > Разходи по локация: tabs switch between apartments; categories show with paid_by_me, end date, delete; add category works; rent amount save/remove works
- [ ] Settings > Начини на плащане: list shows, add works, delete works
- [ ] Settings > Акаунт: Изход button signs out
- [ ] Expenses page: no gear icon in header; Cmd+A still opens add dialog
- [ ] Subscriptions page: no "Начини на плащане" button in header; adding/editing subscriptions still shows payment source dropdowns
