import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { SubscriptionPriceChange } from '@/types'

export function useSubscriptionPriceChanges(subscriptionId: string | null) {
  const [priceChanges, setPriceChanges] = useState<SubscriptionPriceChange[]>([])
  const [loading, setLoading] = useState(false)

  const fetchChanges = useCallback(async () => {
    if (!subscriptionId) {
      setPriceChanges([])
      return
    }
    setLoading(true)
    const { data } = await supabase
      .from('subscription_price_changes')
      .select('*')
      .eq('subscription_id', subscriptionId)
      .order('effective_from', { ascending: false })

    setPriceChanges((data as SubscriptionPriceChange[]) ?? [])
    setLoading(false)
  }, [subscriptionId])

  useEffect(() => {
    fetchChanges()
  }, [fetchChanges])

  const recordPriceChange = async (input: {
    amount: number
    previous_amount: number | null
    effective_from: string
  }) => {
    if (!subscriptionId) return { error: new Error('No subscription') }

    const { data, error } = await supabase
      .from('subscription_price_changes')
      .insert({ subscription_id: subscriptionId, ...input })
      .select()
      .single()

    if (!error && data) await fetchChanges()
    return { data, error }
  }

  return { priceChanges, loading, recordPriceChange, refetch: fetchChanges }
}
