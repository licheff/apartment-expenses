# skills/dialogs.md

**Purpose:** Consistent modal dialog structure across the app.

## Rules

1. Always `p-0 gap-0 overflow-hidden` on `DialogContent` — never let Radix/shadcn add default padding
2. Use `<DialogHeader>`, `<DialogBody>`, `<DialogFooter>` from `@/components/ui/dialog` — styles are baked in
3. `DialogHeader` renders: `px-6 pt-[max(1.5rem,env(safe-area-inset-top))] pb-4 border-b` (sm: `pt-6`) — accounts for OS status bar on mobile
4. `DialogBody` renders: `px-6 py-4 flex flex-col gap-4 max-h-[60vh] overflow-y-auto`
5. `DialogFooter` renders: `px-6 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] border-t flex items-center gap-2` (sm: `py-4`) — accounts for home indicator on mobile
6. Footer buttons: Cancel (`variant="outline"`) + Save (`flex-1`) on the right
7. For destructive actions: add a Delete button with `mr-auto` to push it left

## Template

```tsx
<DialogContent className="sm:max-w-[400px] p-0 gap-0 overflow-hidden">
  <DialogHeader>
    <DialogTitle className="text-xl font-semibold">Title</DialogTitle>
  </DialogHeader>

  <DialogBody>
    {/* content */}
  </DialogBody>

  <DialogFooter>
    <Button variant="outline" onClick={() => onOpenChange(false)}>Отказ</Button>
    <Button className="flex-1" onClick={handleSave}>Запази</Button>
  </DialogFooter>
</DialogContent>
```

## Overriding DialogBody layout

For dialogs with special layouts (e.g. centered amount input), pass `className` to override specific defaults:

```tsx
{/* flex-1 min-h-0 expands body to fill height on mobile; max-h-none removes the 60vh cap */}
<DialogBody className="flex-1 min-h-0 max-h-none gap-8 items-center">
```

## Anti-patterns

- Don't add padding classes directly to `DialogHeader`, `DialogBody`, or `DialogFooter` — they're already set
- Don't add `p-4` or `p-6` directly to `DialogContent` — kills the border-flush header
- Don't inline delete actions in a table row — always use a modal
