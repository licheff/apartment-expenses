import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { YearlyExpense } from '@/types'

export function useYearlyExpenses(apartmentId: string, year: number) {
  const [yearlyExpenses, setYearlyExpenses] = useState<YearlyExpense[]>([])
  const [loading, setLoading] = useState(true)

  const fetchYearly = useCallback(async () => {
    if (!apartmentId) return
    setLoading(true)
    const { data } = await supabase
      .from('yearly_expenses')
      .select('*')
      .eq('apartment_id', apartmentId)
      .eq('year', year)
      .order('name')
    setYearlyExpenses(data ?? [])
    setLoading(false)
  }, [apartmentId, year])

  useEffect(() => {
    fetchYearly()
  }, [fetchYearly])

  const createYearlyExpense = async (name: string, amount: number) => {
    const { error } = await supabase
      .from('yearly_expenses')
      .upsert(
        {
          apartment_id: apartmentId,
          year,
          name,
          amount,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'apartment_id,year,name' },
      )
    if (!error) await fetchYearly()
    return { error }
  }

  const updateYearlyExpense = async (id: string, amount: number) => {
    const { error } = await supabase
      .from('yearly_expenses')
      .update({ amount, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (!error) await fetchYearly()
    return { error }
  }

  const deleteYearlyExpense = async (id: string) => {
    const { error } = await supabase
      .from('yearly_expenses')
      .delete()
      .eq('id', id)
    if (!error) await fetchYearly()
    return { error }
  }

  const yearlyTotal = yearlyExpenses.reduce((sum, e) => sum + Number(e.amount), 0)

  return {
    yearlyExpenses,
    yearlyTotal,
    loading,
    createYearlyExpense,
    updateYearlyExpense,
    deleteYearlyExpense,
    refetch: fetchYearly,
  }
}
