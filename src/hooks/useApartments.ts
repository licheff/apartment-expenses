import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Apartment, Category } from '@/types'

export function useApartments() {
  const [apartments, setApartments] = useState<Apartment[]>([])
  const [categories, setCategories] = useState<Record<string, Category[]>>({})
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [aptRes, catRes] = await Promise.all([
      supabase.from('apartments').select('*').order('name'),
      supabase.from('categories').select('*').order('sort_order'),
    ])

    if (aptRes.data) setApartments(aptRes.data)

    if (catRes.data) {
      const grouped: Record<string, Category[]> = {}
      for (const cat of catRes.data) {
        if (!grouped[cat.apartment_id]) grouped[cat.apartment_id] = []
        grouped[cat.apartment_id].push(cat)
      }
      setCategories(grouped)
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const addCategory = async (apartmentId: string, name: string) => {
    const existing = categories[apartmentId] ?? []
    const maxOrder = existing.reduce((max, c) => Math.max(max, c.sort_order), 0)
    const { error } = await supabase
      .from('categories')
      .insert({ apartment_id: apartmentId, name, sort_order: maxOrder + 1 })
    if (!error) await fetchData()
    return { error }
  }

  const deleteCategory = async (categoryId: string) => {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', categoryId)
    if (!error) await fetchData()
    return { error }
  }

  return { apartments, categories, loading, refetch: fetchData, addCategory, deleteCategory }
}
