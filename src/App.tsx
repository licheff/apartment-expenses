import { useState, useCallback, useMemo } from 'react'
import { Toaster, toast } from 'sonner'

import { Header } from '@/components/Header'
import { OverviewCards } from '@/components/OverviewCards'
import { ExpenseTable } from '@/components/ExpenseTable'
import { AddExpenseDialog } from '@/components/AddExpenseDialog'
import { EditExpenseDialog } from '@/components/EditExpenseDialog'
import { CategoryComparisonChart } from '@/components/CategoryComparisonChart'
import { MonthlyTrendChart } from '@/components/MonthlyTrendChart'
import { CsvImportDialog } from '@/components/CsvImportDialog'
import { ManageCategoriesDialog } from '@/components/ManageCategoriesDialog'
import { Skeleton } from '@/components/ui/skeleton'

import { useApartments } from '@/hooks/useApartments'
import { useExpenses } from '@/hooks/useExpenses'
import { useExpenseSummary } from '@/hooks/useExpenseSummary'
import { useAvailableYears } from '@/hooks/useAvailableYears'
import { exportToCsv } from '@/lib/csv-exporter'
import { supabase } from '@/lib/supabase'
import type { MonthRow } from '@/types'

function App() {
  const { apartments, categories, loading: aptsLoading, addCategory, deleteCategory } = useApartments()
  const [selectedApartmentId, setSelectedApartmentId] = useState('')
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [addDialogMonth, setAddDialogMonth] = useState<number | undefined>()
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editMonth, setEditMonth] = useState<number | null>(null)
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [categoriesDialogOpen, setCategoriesDialogOpen] = useState(false)

  // Set default apartment once loaded
  if (!selectedApartmentId && apartments.length > 0) {
    setSelectedApartmentId(apartments[0].id)
  }

  const currentCategories = categories[selectedApartmentId] ?? []
  const { years, refetch: refetchYears } = useAvailableYears(currentCategories)

  const {
    monthRows,
    columnTotals,
    grandTotal,
    loading: expensesLoading,
    createExpense,
    deleteMonthExpenses,
    bulkUpsert,
    refetch: refetchExpenses,
  } = useExpenses(selectedApartmentId, selectedYear, currentCategories)

  const summary = useExpenseSummary(
    monthRows,
    currentCategories,
    columnTotals,
    grandTotal,
    selectedYear,
  )

  // Previous year data for trend chart
  const previousYear = selectedYear - 1
  const {
    monthRows: prevMonthRows,
  } = useExpenses(selectedApartmentId, previousYear, currentCategories)

  const hasPrevData = prevMonthRows.some(r => r.total > 0)

  // Handlers
  const handleAddExpense = useCallback(
    async (categoryId: string, month: number, amount: number, year: number) => {
      const { error } = await createExpense(categoryId, month, amount, year)
      if (error) {
        toast.error('Грешка при запазване')
      } else {
        toast.success('Разходът е добавен')
        refetchYears()
      }
    },
    [createExpense, refetchYears],
  )

  const handleEditRow = useCallback((month: number) => {
    setEditMonth(month)
    setEditDialogOpen(true)
  }, [])

  const handleEditSave = useCallback(
    async (entries: { categoryId: string; amount: number }[]) => {
      if (editMonth === null) return
      const rows = entries.map(e => ({
        category_id: e.categoryId,
        year: selectedYear,
        month: editMonth,
        amount: e.amount,
      }))
      const { error } = await bulkUpsert(rows)
      if (error) {
        toast.error('Грешка при запазване')
      } else {
        toast.success('Данните са обновени')
      }
    },
    [editMonth, selectedYear, bulkUpsert],
  )

  const handleDeleteRow = useCallback(
    async (month: number) => {
      const { error } = await deleteMonthExpenses(month)
      if (error) {
        toast.error('Грешка при изтриване')
      } else {
        toast.success('Записите за месеца са изтрити')
      }
    },
    [deleteMonthExpenses],
  )

  const handleExport = useCallback(() => {
    const apt = apartments.find(a => a.id === selectedApartmentId)
    if (!apt) return
    exportToCsv(apt.name, selectedYear, currentCategories, monthRows, columnTotals, grandTotal)
    toast.success('CSV файлът е експортиран')
  }, [apartments, selectedApartmentId, selectedYear, currentCategories, monthRows, columnTotals, grandTotal])

  const handleImport = useCallback(
    async (
      _apartmentId: string,
      data: { categoryId: string; year: number; month: number; amount: number }[],
    ) => {
      const rows = data.map(d => ({
        category_id: d.categoryId,
        year: d.year,
        month: d.month,
        amount: d.amount,
        updated_at: new Date().toISOString(),
      }))

      const { error } = await supabase
        .from('expenses')
        .upsert(rows, { onConflict: 'category_id,year,month' })

      if (error) {
        toast.error('Грешка при импортиране')
      } else {
        toast.success(`${data.length} записа са импортирани`)
        refetchExpenses()
        refetchYears()
      }
    },
    [refetchExpenses, refetchYears],
  )

  const handleOpenAdd = useCallback(() => {
    setAddDialogMonth(undefined)
    setAddDialogOpen(true)
  }, [])

  const editMonthRow: MonthRow | null = useMemo(
    () => (editMonth !== null ? monthRows.find(r => r.month === editMonth) ?? null : null),
    [editMonth, monthRows],
  )

  const isLoading = aptsLoading || expensesLoading

  return (
    <div className="min-h-screen bg-background">
      <Header
        apartments={apartments}
        selectedApartmentId={selectedApartmentId}
        onSelectApartment={setSelectedApartmentId}
        years={years}
        selectedYear={selectedYear}
        onSelectYear={setSelectedYear}
        onAdd={handleOpenAdd}
        onImport={() => setImportDialogOpen(true)}
        onExport={handleExport}
        onSettings={() => setCategoriesDialogOpen(true)}
      />

      <main className="mx-auto px-4 py-6 space-y-6 max-w-[1000px]">
        {/* Overview Section */}
        {isLoading ? (
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[100px] rounded-xl" />
            ))}
          </div>
        ) : (
          <OverviewCards summary={summary} />
        )}

        {/* Charts */}
        {!isLoading && (
          <div className="grid gap-4 md:grid-cols-2">
            <CategoryComparisonChart
              categories={currentCategories}
              monthRows={monthRows}
            />
            <MonthlyTrendChart
              currentYear={selectedYear}
              currentMonthRows={monthRows}
              previousYear={hasPrevData ? previousYear : undefined}
              previousMonthRows={hasPrevData ? prevMonthRows : undefined}
            />
          </div>
        )}

        {/* Expense Table */}
        {isLoading ? (
          <Skeleton className="h-[400px] rounded-xl" />
        ) : (
          <ExpenseTable
            categories={currentCategories}
            monthRows={monthRows}
            columnTotals={columnTotals}
            grandTotal={grandTotal}
            onEditRow={handleEditRow}
            onDeleteRow={handleDeleteRow}
          />
        )}
      </main>

      {/* Dialogs */}
      <AddExpenseDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        categories={currentCategories}
        onSave={handleAddExpense}
        defaultMonth={addDialogMonth}
        defaultYear={selectedYear}
      />

      <EditExpenseDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        categories={currentCategories}
        monthRow={editMonthRow}
        onSave={handleEditSave}
      />

      <CsvImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        apartments={apartments}
        categories={categories}
        onImport={handleImport}
      />

      <ManageCategoriesDialog
        open={categoriesDialogOpen}
        onOpenChange={setCategoriesDialogOpen}
        apartments={apartments}
        categories={categories}
        onAdd={addCategory}
        onDelete={deleteCategory}
      />

      <Toaster position="bottom-right" />
    </div>
  )
}

export default App
