# skills/main.md

Index of implementation skills for this project. Each file covers a specific domain.

| Skill | File | When to use |
|-------|------|-------------|
| Git commits | [skills/git.md](git.md) | Writing commit messages |
| Dialog layout | [skills/dialogs.md](dialogs.md) | Adding or modifying modal dialogs |
| Amount inputs | [skills/amount-input.md](amount-input.md) | Any numeric/currency input field |
| Currency | [skills/currency.md](currency.md) | Storing, formatting, or converting amounts |
| Business logic | [skills/business-logic.md](business-logic.md) | paid_by_me, rent, expense upserts |
| Automation | [skills/automation.md](automation.md) | Bill parsing pipeline, adding providers |
| UI patterns | [skills/ui.md](ui.md) | Tables, badges, responsive layout |
| TypeScript | [skills/typescript.md](typescript.md) | Avoiding strict-mode build errors |

---

## Planned Features

Consider these when making architectural decisions:

- **Detailed location summaries** — per-location breakdowns beyond the current apartment switcher
- **Outlier analysis** — detecting unusual months or categories
- **Subscription-based expenses** — recurring costs that don't need manual monthly entry (different from one-time yearly expenses)
- **More automated providers for location 142** — same trigger architecture, just needs new `providers` rows
