# skills/typescript.md

**Purpose:** Avoid TypeScript strict-mode build errors specific to this project.

## Rules

1. **Unused variables are build errors** — always clean up imports and callbacks when removing features
2. **JSX comments are compiled** — `{/* ... balance ... */}` referencing an undeclared variable is a build error even if it looks like a comment. Delete commented-out JSX blocks entirely.
3. Run `npm run build` after any refactor to catch type errors before committing

## Common Patterns

**Optional chaining before number operations:**
```tsx
// Bad — `value` might be undefined
const total = monthRow.expenses[cat.id] * 12

// Good
const total = (monthRow.expenses[cat.id] ?? 0) * 12
```

**Guard before rendering expense delete button:**
```tsx
const hasExpense = monthRow.expenseIds[cat.id] != null
{hasExpense && <Button onClick={() => handleDelete(cat.id)}>...</Button>}
```

## Anti-patterns

- Don't leave `_unusedVar` renames as a workaround — remove the variable entirely
- Don't leave commented JSX that references removed variables
- Don't use `as any` to suppress errors — fix the type instead
