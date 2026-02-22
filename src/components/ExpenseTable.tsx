import { ChevronRight } from 'lucide-react'
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
            <TableHead className="w-[40px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {monthRows.map(row => {
            const hasData = row.total > 0
            const isPaid = paidMonths.includes(row.month)
            return (
              <TableRow
                key={row.month}
                className={cn(
                  'cursor-pointer',
                  !hasData && 'text-muted-foreground',
                )}
                onClick={() => onEditRow(row.month)}
              >
                <TableCell className="font-medium">{row.monthName}</TableCell>
                {hasRent && (
                  <TableCell className="text-center" onClick={e => e.stopPropagation()}>
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
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
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
