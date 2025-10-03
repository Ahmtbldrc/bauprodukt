import { useQuery } from '@tanstack/react-query'
import { supabasePlumberClient } from '@/lib/supabase'
import type { PlumberProtocol } from '@/types/database'

// Get protocol by calculation_id
export function usePlumberProtocol(calculationId?: string) {
  return useQuery({
    queryKey: ['plumber-protocol', calculationId],
    queryFn: async () => {
      if (!calculationId) return null
      
      const { data: { session } } = await supabasePlumberClient.auth.getSession()
      if (!session?.access_token) throw new Error('Not authenticated')

      const response = await fetch(`/api/plumber-protocols?calculation_id=${calculationId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch protocol')
      }

      const result = await response.json()
      return result.data
    },
    enabled: !!calculationId,
  })
}

// Get multiple protocols by calculation IDs (for batch checking)
export function usePlumberProtocols(calculationIds: string[]) {
  return useQuery({
    queryKey: ['plumber-protocols', calculationIds],
    queryFn: async () => {
      if (calculationIds.length === 0) return {}
      
      const { data: { session } } = await supabasePlumberClient.auth.getSession()
      if (!session?.access_token) return {}

      // Fetch all protocols for the user
      const supabase = supabasePlumberClient
      const { data: protocols, error } = await supabase
        .from('plumber_protocols')
        .select('id, plumber_calculation_id')
        .in('plumber_calculation_id', calculationIds) as { data: Pick<PlumberProtocol, 'id' | 'plumber_calculation_id'>[] | null; error: any }

      if (error) {
        console.error('Error fetching protocols:', error)
        return {}
      }

      // Create a map of calculation_id -> protocol_id
      const protocolMap: Record<string, string> = {}
      protocols?.forEach((protocol) => {
        if (protocol.plumber_calculation_id) {
          protocolMap[protocol.plumber_calculation_id] = protocol.id
        }
      })

      return protocolMap
    },
    enabled: calculationIds.length > 0,
  })
}

