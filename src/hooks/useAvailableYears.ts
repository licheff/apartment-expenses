import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Category } from '@/types'

export function useAvailableYears(categories: Category[]) {
  const [years, setYears] = useState<number[]>([])
  const categoryIds = categories.map(c => c.id)

  const fetchYears = useCallback(async () => {
    if (categoryIds.length === 0) {
      setYears([new Date().getFullYear()])
      return
    }

    const { data } = await supabase
      .from('expenses')
      .select('year')
      .in('category_id', categoryIds)

    if (data) {
      const uniqueYears = [...new Set(data.map(d => d.year))].sort((a, b) => b - a)
      if (uniqueYears.length === 0) {
        uniqueYears.push(new Date().getFullYear())
      }
      setYears(uniqueYears)
    } else {
      setYears([new Date().getFullYear()])
    }
  }, [categoryIds.join(',')])

  useEffect(() => {
    fetchYears()
  }, [fetchYears])

  return { years, refetch: fetchYears }
}
