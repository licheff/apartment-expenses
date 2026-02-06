import { useCallback, useState } from 'react'
import { Upload } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { Apartment, Category } from '@/types'
import { parseGoogleSheetsCsv, type ParseResult } from '@/lib/csv-parser'
import { MONTH_NAMES } from '@/lib/constants'

interface CsvImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  apartments: Apartment[]
  categories: Record<string, Category[]>
  onImport: (
    apartmentId: string,
    data: { categoryId: string; year: number; month: number; amount: number }[]
  ) => Promise<void>
}

export function CsvImportDialog({
  open,
  onOpenChange,
  apartments,
  categories,
  onImport,
}: CsvImportDialogProps) {
  const [parseResult, setParseResult] = useState<ParseResult | null>(null)
  const [selectedApartment, setSelectedApartment] = useState('')
  const [importing, setImporting] = useState(false)

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      const result = parseGoogleSheetsCsv(text)
      setParseResult(result)
    }
    reader.readAsText(file, 'UTF-8')
  }, [])

  const handleImport = async () => {
    if (!parseResult || !selectedApartment) return

    const aptCategories = categories[selectedApartment] ?? []
    const categoryMap = new Map<string, string>()
    for (const cat of aptCategories) {
      categoryMap.set(cat.name, cat.id)
    }

    const data = parseResult.expenses
      .filter(e => categoryMap.has(e.categoryName))
      .map(e => ({
        categoryId: categoryMap.get(e.categoryName)!,
        year: e.year,
        month: e.month,
        amount: e.amount,
      }))

    setImporting(true)
    await onImport(selectedApartment, data)
    setImporting(false)
    setParseResult(null)
    setSelectedApartment('')
    onOpenChange(false)
  }

  const previewRows = parseResult?.expenses.slice(0, 20) ?? []
  const unmatchedCategories = parseResult
    ? parseResult.categoryNames.filter(name => {
        const aptCats = categories[selectedApartment] ?? []
        return !aptCats.some(c => c.name === name)
      })
    : []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Импорт от CSV</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* File upload */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer rounded-md border border-dashed p-6 hover:bg-muted/50 transition-colors">
              <Upload className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {parseResult
                  ? `${parseResult.expenses.length} записа от ${parseResult.years.join(', ')}`
                  : 'Избери CSV файл'}
              </span>
              <input type="file" accept=".csv" onChange={handleFile} className="hidden" />
            </label>
          </div>

          {/* Apartment selection */}
          {parseResult && (
            <div className="grid gap-2">
              <label className="text-sm font-medium">Апартамент</label>
              <Select value={selectedApartment} onValueChange={setSelectedApartment}>
                <SelectTrigger>
                  <SelectValue placeholder="Избери апартамент" />
                </SelectTrigger>
                <SelectContent>
                  {apartments.map(apt => (
                    <SelectItem key={apt.id} value={apt.id}>
                      {apt.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Unmatched categories warning */}
          {selectedApartment && unmatchedCategories.length > 0 && (
            <div className="rounded-md bg-yellow-50 p-3 text-sm text-yellow-800">
              Категориите <strong>{unmatchedCategories.join(', ')}</strong> не съвпадат
              и ще бъдат пропуснати.
            </div>
          )}

          {/* Preview */}
          {parseResult && previewRows.length > 0 && (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Година</TableHead>
                    <TableHead>Месец</TableHead>
                    <TableHead>Категория</TableHead>
                    <TableHead className="text-right">Сума</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewRows.map((row, i) => (
                    <TableRow key={i}>
                      <TableCell>{row.year}</TableCell>
                      <TableCell>{MONTH_NAMES[row.month]}</TableCell>
                      <TableCell>{row.categoryName}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {row.amount.toFixed(2)} €
                      </TableCell>
                    </TableRow>
                  ))}
                  {parseResult.expenses.length > 20 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        ... и още {parseResult.expenses.length - 20} записа
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отказ
          </Button>
          <Button
            onClick={handleImport}
            disabled={!parseResult || !selectedApartment || importing}
          >
            {importing ? 'Импортиране...' : 'Импортирай'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
