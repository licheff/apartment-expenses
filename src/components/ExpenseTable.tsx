import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
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

interface ExpenseTableProps {
  categories: Category[]
  monthRows: MonthRow[]
  columnTotals: Record<string, number>
  grandTotal: number
  onEditRow: (month: number) => void
  onDeleteRow: (month: number) => void
}

export function ExpenseTable({
  categories,
  monthRows,
  columnTotals,
  grandTotal,
  onEditRow,
  onDeleteRow,
}: ExpenseTableProps) {
  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Месец</TableHead>
            {categories.map(cat => (
              <TableHead key={cat.id} className="text-right min-w-[100px]">
                {cat.name}
              </TableHead>
            ))}
            <TableHead className="text-right min-w-[100px] font-bold">Общо</TableHead>
            <TableHead className="w-[80px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {monthRows.map(row => {
            const hasData = row.total > 0
            return (
              <TableRow key={row.month} className={hasData ? '' : 'text-muted-foreground'}>
                <TableCell className="font-medium">{row.monthName}</TableCell>
                {categories.map(cat => (
                  <TableCell key={cat.id} className="text-right tabular-nums">
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
            {categories.map(cat => (
              <TableCell key={cat.id} className="text-right font-bold tabular-nums">
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
