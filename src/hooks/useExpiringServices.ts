import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export interface ExpiringService {
  id: string
  name: string
  end_date: string        // "YYYY-MM-DD"
  apartment_name: string
  daysUntil: number       // negative = already expired
}

export function useExpiringServices() {
  const [services, setServices] = useState<ExpiringService[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)

    const { data, error } = await supabase
      .from('categories')
      .select('id, name, end_date, apartments(name)')
      .not('end_date', 'is', null)
      .order('end_date', { ascending: true })

    if (!error && data) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      setServices(
        data.map(row => {
          const expiry = new Date(row.end_date as string)
          const daysUntil = Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
          const apt = Array.isArray(row.apartments) ? row.apartments[0] as { name: string } | undefined : row.apartments as { name: string } | null
          return {
            id: row.id,
            name: row.name,
            end_date: row.end_date as string,
            apartment_name: apt?.name ?? '',
            daysUntil,
          }
        }),
      )
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    fetch()
  }, [fetch])

  return { services, loading }
}
