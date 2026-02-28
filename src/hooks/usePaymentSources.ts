import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { PaymentSource } from '@/types'

export function usePaymentSources() {
  const [paymentSources, setPaymentSources] = useState<PaymentSource[]>([])
  const [loading, setLoading] = useState(true)

  const fetchSources = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('payment_sources')
      .select('*')
      .order('sort_order')

    setPaymentSources(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchSources()
  }, [fetchSources])

  const create = async (name: string) => {
    const { data, error } = await supabase
      .from('payment_sources')
      .insert({ name, sort_order: paymentSources.length })
      .select()
      .single()

    if (!error && data) await fetchSources()
    return { data, error }
  }

  const remove = async (id: string) => {
    const { error } = await supabase
      .from('payment_sources')
      .delete()
      .eq('id', id)

    if (!error) await fetchSources()
    return { error }
  }

  return { paymentSources, loading, create, remove, refetch: fetchSources }
}
