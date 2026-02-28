import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Subscription, CreateSubscriptionInput } from '@/types'
import { monthlyEquivalent } from '@/lib/subscriptions'

export function useSubscriptions() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)

  const fetchSubscriptions = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('subscriptions')
      .select('*, payment_source:payment_sources(*)')
      .order('created_at')

    setSubscriptions((data as Subscription[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchSubscriptions()
  }, [fetchSubscriptions])

  const create = async (input: CreateSubscriptionInput) => {
    const { data, error } = await supabase
      .from('subscriptions')
      .insert(input)
      .select('*, payment_source:payment_sources(*)')
      .single()

    if (!error && data) await fetchSubscriptions()
    return { data, error }
  }

  const update = async (id: string, input: Partial<CreateSubscriptionInput>) => {
    const { data, error } = await supabase
      .from('subscriptions')
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*, payment_source:payment_sources(*)')
      .single()

    if (!error && data) await fetchSubscriptions()
    return { data, error }
  }

  const remove = async (id: string) => {
    const { error } = await supabase
      .from('subscriptions')
      .delete()
      .eq('id', id)

    if (!error) await fetchSubscriptions()
    return { error }
  }

  const toggleActive = async (id: string, isActive: boolean) => {
    return update(id, { is_active: isActive })
  }

  // Derived values — computed from active subscriptions only
  const activeSubscriptions = subscriptions.filter(s => s.is_active)
  const totalPerMonth = activeSubscriptions.reduce(
    (sum, s) => sum + monthlyEquivalent(s.amount, s.billing_cycle),
    0,
  )
  const totalPerYear = totalPerMonth * 12

  return {
    subscriptions,
    activeSubscriptions,
    totalPerMonth,
    totalPerYear,
    loading,
    create,
    update,
    remove,
    toggleActive,
    refetch: fetchSubscriptions,
  }
}
