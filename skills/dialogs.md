# skills/dialogs.md

**Purpose:** Consistent modal dialog structure across the app.

## Rules

1. Never use default shadcn dialog padding — always `p-0 gap-0` on `DialogContent`
2. Header: `px-6 pt-6 pb-4 border-b`
3. Content area: `px-6 py-4 flex flex-col gap-4 max-h-[60vh] overflow-y-auto`
4. Footer: `px-6 py-4 border-t flex items-center gap-2`
5. Footer buttons: Cancel (`variant="outline"`) + Save (`flex-1`) on the right
6. For destructive actions: add a Delete button with `mr-auto` to push it left

## Template

```tsx
<DialogContent className="sm:max-w-[400px] p-0 gap-0 overflow-hidden">
  <DialogHeader className="px-6 pt-6 pb-4 border-b">
    <DialogTitle className="text-xl font-semibold">Title</DialogTitle>
  </DialogHeader>

  <div className="px-6 py-4 flex flex-col gap-4 max-h-[60vh] overflow-y-auto">
    {/* content */}
  </div>

  <div className="px-6 py-4 border-t flex items-center gap-2">
    <Button variant="outline" onClick={() => onOpenChange(false)}>Отказ</Button>
    <Button className="flex-1" onClick={handleSave}>Запази</Button>
  </div>
</DialogContent>
```

## Anti-patterns

- Don't add `p-4` or `p-6` directly to `DialogContent` — kills the border-flush header
- Don't inline delete actions in a table row — always use a modal
