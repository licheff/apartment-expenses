import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { ArrowDownUp, Upload, Download, Settings, Plus } from 'lucide-react'
import { Toaster, toast } from 'sonner'

import { Layout } from '@/components/Layout'
import { Header } from '@/components/Header'
import { ApartmentTabs } from '@/components/ApartmentTabs'
import { YearSelector } from '@/components/YearSelector'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LoginPage } from '@/components/LoginPage'
import { Button } from '@/components/ui/button'
import { YearSummaryStrip } from '@/components/YearSummaryStrip'
import { YearComparisonChart } from '@/components/YearComparisonChart'
import { ExpenseTable } from '@/components/ExpenseTable'
import { AddExpenseDialog } from '@/components/AddExpenseDialog'
import { EditExpenseDialog } from '@/components/EditExpenseDialog'
import { CsvImportDialog } from '@/components/CsvImportDialog'
import { ManageCategoriesDialog } from '@/components/ManageCategoriesDialog'
import { YearlyExpensesSection } from '@/components/YearlyExpensesSection'
import { Skeleton } from '@/components/ui/skeleton'

import { OverviewPage } from '@/pages/OverviewPage'
import { SubscriptionsPage } from '@/pages/SubscriptionsPage'

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
      <Routes>
        <Route element={<Layout signOut={signOut} theme={theme} onThemeChange={setTheme} />}>
          <Route index element={<OverviewPage />} />
          <Route path="/expenses" element={<AuthenticatedApp />} />
          <Route path="/subscriptions" element={<SubscriptionsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
      <Toaster position="bottom-right" />
    </>
  )
}

// Expense tracker view — all expense state lives here
function AuthenticatedApp() {
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
    deleteExpense,
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

  const handleDeleteExpense = useCallback(
    async (id: string) => {
      const { error } = await deleteExpense(id)
      if (error) {
        toast.error('Грешка при изтриване')
      } else {
        toast.success('Разходът е изтрит')
      }
      return { error }
    },
    [deleteExpense],
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

  // Hide mobile add button on scroll down, show on scroll up or after idle
  const [showMobileAdd, setShowMobileAdd] = useState(true)
  const lastScrollY = useRef(0)
  const scrollTimer = useRef<ReturnType<typeof setTimeout>>(null)

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      const scrollingUp = y < lastScrollY.current
      lastScrollY.current = y

      if (scrollingUp || y < 10) {
        setShowMobileAdd(true)
        if (scrollTimer.current) clearTimeout(scrollTimer.current)
      } else {
        setShowMobileAdd(false)
        if (scrollTimer.current) clearTimeout(scrollTimer.current)
        scrollTimer.current = setTimeout(() => setShowMobileAdd(true), 800)
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (scrollTimer.current) clearTimeout(scrollTimer.current)
    }
  }, [])

  const editMonthRow: MonthRow | null = useMemo(
    () => (editMonth !== null ? monthRows.find(r => r.month === editMonth) ?? null : null),
    [editMonth, monthRows],
  )

  const isLoading = aptsLoading || expensesLoading

  return (
    <div>
      <Header>
        {(apartments.length > 0 || years.length > 0) && (
          <div className="flex items-center gap-3">
            {apartments.length > 0 && (
              <ApartmentTabs
                apartments={apartments}
                selected={selectedApartmentId}
                onSelect={setSelectedApartmentId}
              />
            )}
            {years.length > 0 && (
              <YearSelector
                years={years}
                selected={selectedYear}
                onSelect={setSelectedYear}
              />
            )}
            <div className="flex items-center gap-1 sm:ml-auto">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" title="Импорт / Експорт">
                    <ArrowDownUp className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setImportDialogOpen(true)}>
                    <Upload className="h-4 w-4 mr-2" />
                    Импорт CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExport}>
                    <Download className="h-4 w-4 mr-2" />
                    Експорт CSV
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="ghost" size="icon" onClick={() => setCategoriesDialogOpen(true)} title="Категории">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
            <Button
              size="sm"
              className="hidden sm:inline-flex"
              onClick={handleOpenAdd}
            >
              Добави
              <kbd className="ml-0 text-[11px] opacity-60 font-sans pt-1">⌘A</kbd>
            </Button>
          </div>
        )}
      </Header>

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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
            hasRent={!!currentApartment?.rent_amount}
            paidMonths={paidMonths}
            onToggleRentMonth={toggleRentMonth}
          />
        )}
      </main>

      {/* Mobile-only sticky add button — positioned above the bottom tab bar (bottom-16) */}
      <div
        className={`fixed bottom-16 left-0 right-0 z-10 p-4 sm:hidden transition-transform duration-200 ${
          showMobileAdd ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <Button className="w-full" size="lg" onClick={handleOpenAdd}>
          <Plus className="h-5 w-5" />
          Добави разход
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
        onDeleteExpense={handleDeleteExpense}
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
