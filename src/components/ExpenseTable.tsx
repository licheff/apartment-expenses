import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { Category, MonthRow } from '@/types'
import { formatCurrency } from '@/lib/constants'
import { cn } from '@/lib/utils'

interface ExpenseTableProps {
  categories: Category[]
  monthRows: MonthRow[]
  columnTotals: Record<string, number>
  grandTotal: number
  onEditRow: (month: number) => void
  onDeleteRow: (month: number) => void
  hasRent?: boolean
  paidMonths?: number[]
  onToggleRentMonth?: (month: number) => void
}

export function ExpenseTable({
  categories,
  monthRows,
  columnTotals,
  grandTotal,
  onEditRow,
  onDeleteRow,
  hasRent = false,
  paidMonths = [],
  onToggleRentMonth,
}: ExpenseTableProps) {
  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Месец</TableHead>
            {hasRent && (
              <TableHead className="w-[60px] text-center">Наем</TableHead>
            )}
            {categories.map(cat => (
              <TableHead
                key={cat.id}
                className={cn(
                  'text-right min-w-[100px]',
                  !cat.paid_by_me && 'italic text-muted-foreground',
                )}
              >
                {cat.name}
                {!cat.paid_by_me && (
                  <span className="text-[10px] block font-normal not-italic">наемател</span>
                )}
              </TableHead>
            ))}
            <TableHead className="text-right min-w-[100px] font-bold">Общо</TableHead>
            <TableHead className="w-[80px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {monthRows.map(row => {
            const hasData = row.total > 0
            const isPaid = paidMonths.includes(row.month)
            return (
              <TableRow key={row.month} className={hasData ? '' : 'text-muted-foreground'}>
                <TableCell className="font-medium">{row.monthName}</TableCell>
                {hasRent && (
                  <TableCell className="text-center">
                    <Checkbox
                      checked={isPaid}
                      onCheckedChange={() => onToggleRentMonth?.(row.month)}
                    />
                  </TableCell>
                )}
                {categories.map(cat => (
                  <TableCell
                    key={cat.id}
                    className={cn(
                      'text-right tabular-nums',
                      !cat.paid_by_me && 'text-muted-foreground italic',
                    )}
                  >
                    {row.expenses[cat.id] != null
                      ? formatCurrency(row.expenses[cat.id])
                      : '-'}
                  </TableCell>
                ))}
                <TableCell className="text-right font-semibold tabular-nums">
                  {hasData ? formatCurrency(row.total) : '-'}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => onEditRow(row.month)}
                      title="Редактирай"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    {hasData && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => onDeleteRow(row.month)}
                        title="Изтрий"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell className="font-bold">Общо</TableCell>
            {hasRent && <TableCell />}
            {categories.map(cat => (
              <TableCell
                key={cat.id}
                className={cn(
                  'text-right font-bold tabular-nums',
                  !cat.paid_by_me && 'text-muted-foreground italic font-normal',
                )}
              >
                {formatCurrency(columnTotals[cat.id] ?? 0)}
              </TableCell>
            ))}
            <TableCell className="text-right font-bold tabular-nums">
              {formatCurrency(grandTotal)}
            </TableCell>
            <TableCell />
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  )
}
