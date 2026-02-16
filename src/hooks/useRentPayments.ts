import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { RentPayment } from '@/types'

export function useRentPayments(apartmentId: string, year: number) {
  const [payments, setPayments] = useState<RentPayment[]>([])
  const [loading, setLoading] = useState(true)

  const fetchPayments = useCallback(async () => {
    if (!apartmentId) return
    setLoading(true)
    const { data } = await supabase
      .from('rent_payments')
      .select('*')
      .eq('apartment_id', apartmentId)
      .eq('year', year)
      .order('month')
    setPayments(data ?? [])
    setLoading(false)
  }, [apartmentId, year])

  useEffect(() => {
    fetchPayments()
  }, [fetchPayments])

  const toggleMonth = async (month: number) => {
    const existing = payments.find(p => p.month === month)
    if (existing) {
      await supabase.from('rent_payments').delete().eq('id', existing.id)
    } else {
      await supabase
        .from('rent_payments')
        .insert({ apartment_id: apartmentId, year, month })
    }
    await fetchPayments()
  }

  const paidMonths = payments.map(p => p.month)

  return { payments, paidMonths, loading, toggleMonth, refetch: fetchPayments }
}
