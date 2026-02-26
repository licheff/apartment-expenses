# skills/git.md

**Purpose:** Consistent commit messages across the project.

## Rules

1. Format: `type: short description` — lowercase, no period, under 72 chars
2. One logical change per commit — don't bundle unrelated fixes
3. If a commit touches both UI and a bug fix, split it
4. Body is optional; use it only when the *why* isn't obvious from the title

## Types

| Type | When to use |
|------|-------------|
| `feat` | New user-facing feature or behaviour |
| `fix` | Bug fix |
| `style` | Visual/UI change with no logic change (spacing, colours, layout) |
| `refactor` | Code restructure with no behaviour change |
| `data` | Database migrations, Supabase schema changes, SQL scripts |
| `chore` | Dependencies, config, tooling, non-app files |
| `docs` | Changes to CLAUDE.md, skills/*.md, auto.md, README |

## Examples

```
feat: add individual expense delete to edit dialog
fix: normalize iOS comma as decimal separator in amount inputs
style: replace edit/delete icons with chevron in expense table
data: add sync_bill_to_expense trigger with month offset
chore: install shadcn badge component
docs: add git commit conventions to skills/git.md
```
