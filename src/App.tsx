import { useState, useCallback, useMemo, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { Toaster, toast } from 'sonner'

import { Header } from '@/components/Header'
import { LoginPage } from '@/components/LoginPage'
import { Button } from '@/components/ui/button'
import { YearSummaryStrip } from '@/components/YearSummaryStrip'
import { MonthIndicator } from '@/components/MonthIndicator'
import { YearComparisonChart } from '@/components/YearComparisonChart'
import { ExpenseTable } from '@/components/ExpenseTable'
import { AddExpenseDialog } from '@/components/AddExpenseDialog'
import { EditExpenseDialog } from '@/components/EditExpenseDialog'
import { CsvImportDialog } from '@/components/CsvImportDialog'
import { ManageCategoriesDialog } from '@/components/ManageCategoriesDialog'
import { YearlyExpensesSection } from '@/components/YearlyExpensesSection'
import { Skeleton } from '@/components/ui/skeleton'

import { useApartments } from '@/hooks/useApartments'
import { useAuth } from '@/hooks/useAuth'
import { useExpenses } from '@/hooks/useExpenses'
import { useExpenseSummary } from '@/hooks/useExpenseSummary'
import { useAvailableYears } from '@/hooks/useAvailableYears'
import { useRentPayments } from '@/hooks/useRentPayments'
import { useYearlyExpenses } from '@/hooks/useYearlyExpenses'
import { useTheme } from '@/hooks/useTheme'
import { exportToCsv } from '@/lib/csv-exporter'
import { supabase } from '@/lib/supabase'
import type { MonthRow } from '@/types'
import type { Theme } from '@/hooks/useTheme'

function App() {
  const { session, loading: authLoading, signIn, signOut } = useAuth()
  const { theme, setTheme } = useTheme()

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Skeleton className="h-8 w-32 rounded" />
      </div>
    )
  }

  if (!session) {
    return (
      <>
        <LoginPage onSignIn={signIn} />
        <Toaster position="bottom-right" />
      </>
    )
  }

  return (
    <>
      <AuthenticatedApp signOut={signOut} theme={theme} setTheme={setTheme} />
      <Toaster position="bottom-right" />
    </>
  )
}

function AuthenticatedApp({
  signOut,
  theme,
  setTheme,
}: {
  signOut: () => Promise<void>
  theme: Theme
  setTheme: (t: Theme) => void
}) {
  const {
    apartments, categories, loading: aptsLoading,
    addCategory, deleteCategory, toggleCategoryPaidByMe, updateRentAmount,
  } = useApartments()
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
    createBulkExpenses,
    deleteMonthExpenses,
    bulkUpsert,
    refetch: refetchExpenses,
  } = useExpenses(selectedApartmentId, selectedYear, currentCategories)

  // Yearly expenses (needed before summary)
  const {
    yearlyExpenses,
    yearlyTotal,
    createYearlyExpense,
    updateYearlyExpense,
    deleteYearlyExpense,
  } = useYearlyExpenses(selectedApartmentId, selectedYear)

  const summary = useExpenseSummary(
    monthRows,
    currentCategories,
    columnTotals,
    grandTotal,
    selectedYear,
    yearlyTotal,
  )

  // Previous year data for trend chart
  const previousYear = selectedYear - 1
  const {
    monthRows: prevMonthRows,
  } = useExpenses(selectedApartmentId, previousYear, currentCategories)

  const hasPrevData = prevMonthRows.some(r => r.total > 0)

  // Previous year totals for overview cards
  const prevYearTotal = useMemo(
    () => prevMonthRows.reduce((sum, r) => sum + r.total, 0),
    [prevMonthRows],
  )
  const prevYearAverage = useMemo(() => {
    const filled = prevMonthRows.filter(r => r.total > 0)
    return filled.length > 0 ? prevYearTotal / filled.length : 0
  }, [prevMonthRows, prevYearTotal])

  // Rent payments
  const currentApartment = apartments.find(a => a.id === selectedApartmentId)
  const { paidMonths, toggleMonth: toggleRentMonth } = useRentPayments(
    selectedApartmentId,
    selectedYear,
  )

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

  const handleBulkAddExpense = useCallback(
    async (rows: { category_id: string; year: number; month: number; amount: number }[]) => {
      const { error, count } = await createBulkExpenses(rows)
      if (error) {
        toast.error('Грешка при запазване')
      } else {
        toast.success(`Разходът е добавен за ${count} месеца`)
        refetchYears()
      }
      return { error, count }
    },
    [createBulkExpenses, refetchYears],
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

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.metaKey && e.key === 'a' && !addDialogOpen && !editDialogOpen && !importDialogOpen && !categoriesDialogOpen) {
        e.preventDefault()
        handleOpenAdd()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleOpenAdd, addDialogOpen, editDialogOpen, importDialogOpen, categoriesDialogOpen])

  const handleAddMonth = useCallback((month: number) => {
    setAddDialogMonth(month)
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
        onImport={() => setImportDialogOpen(true)}
        onExport={handleExport}
        onSettings={() => setCategoriesDialogOpen(true)}
        theme={theme}
        onThemeChange={setTheme}
        onSignOut={signOut}
      />

      <main className="mx-auto px-4 py-6 pb-24 space-y-6 max-w-[1000px]">
        {/* Summary Strip */}
        {isLoading ? (
          <Skeleton className="h-[80px] rounded-xl" />
        ) : (
          <YearSummaryStrip
            summary={summary}
            previousYear={hasPrevData ? previousYear : undefined}
            previousYearTotal={hasPrevData ? prevYearTotal : undefined}
            previousYearAverage={hasPrevData ? prevYearAverage : undefined}
            rentAmount={currentApartment?.rent_amount}
            paidMonths={paidMonths}
          />
        )}


        {/* Chart + Yearly Expenses side by side */}
        {isLoading ? (
          <Skeleton className="h-[320px] rounded-xl" />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <YearComparisonChart
                currentYear={selectedYear}
                currentMonthRows={monthRows}
                prevYear={previousYear}
                prevMonthRows={prevMonthRows}
              />
            </div>
            <YearlyExpensesSection
              yearlyExpenses={yearlyExpenses}
              yearlyTotal={yearlyTotal}
              year={selectedYear}
              onCreate={createYearlyExpense}
              onUpdate={updateYearlyExpense}
              onDelete={deleteYearlyExpense}
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
            hasRent={!!currentApartment?.rent_amount}
            paidMonths={paidMonths}
            onToggleRentMonth={toggleRentMonth}
          />
        )}
      </main>

      {/* Sticky Add button */}
      <div className="fixed bottom-6 right-6 z-10">
        <Button
          size="lg"
          className="rounded-full shadow-lg h-14 w-14 p-0"
          onClick={handleOpenAdd}
          title="Добави разход"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>

      {/* Dialogs */}
      <AddExpenseDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        categories={currentCategories}
        onSave={handleAddExpense}
        onBulkSave={handleBulkAddExpense}
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
        onTogglePaidByMe={toggleCategoryPaidByMe}
        onUpdateRentAmount={updateRentAmount}
      />
    </div>
  )
}

export default App
