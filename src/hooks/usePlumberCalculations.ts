import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { PlumberCalculation, Database } from '@/types/database'

type PlumberCalculationInsert = Database['public']['Tables']['plumber_calculations']['Insert']
type PlumberCalculationUpdate = Database['public']['Tables']['plumber_calculations']['Update']

// Get auth headers helper
async function getAuthHeaders() {
  const { supabasePlumberClient } = await import('@/lib/supabase')
  const { data: { session } } = await supabasePlumberClient.auth.getSession()
  
  if (!session?.access_token) {
    throw new Error('Nicht authentifiziert')
  }
  
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`
  }
}

// API helper functions
async function fetchCalculations(options?: {
  orderBy?: 'created_at' | 'updated_at' | 'name' | 'total_lu'
  ascending?: boolean
  limit?: number
  offset?: number
  search?: string
  method?: 'm1' | 'm2'
  dn?: string
}) {
  const params = new URLSearchParams()
  if (options?.orderBy) params.set('orderBy', options.orderBy)
  if (options?.ascending !== undefined) params.set('ascending', options.ascending.toString())
  if (options?.limit) params.set('limit', options.limit.toString())
  if (options?.offset !== undefined) params.set('offset', options.offset.toString())
  if (options?.search) params.set('search', options.search)
  if (options?.method) params.set('method', options.method)
  if (options?.dn) params.set('dn', options.dn)

  const headers = await getAuthHeaders()
  const response = await fetch(`/api/plumber-calculations?${params.toString()}`, { headers })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Fehler beim Abrufen')
  }
  const result = await response.json()
  return result.data as PlumberCalculation[]
}

async function fetchCalculation(id: string) {
  const headers = await getAuthHeaders()
  const response = await fetch(`/api/plumber-calculations/${id}`, { headers })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Fehler beim Abrufen')
  }
  const result = await response.json()
  return result.data as PlumberCalculation
}

async function createCalculation(calculation: Omit<PlumberCalculationInsert, 'user_id'>) {
  const headers = await getAuthHeaders()
  const response = await fetch('/api/plumber-calculations', {
    method: 'POST',
    headers,
    body: JSON.stringify(calculation)
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Fehler beim Erstellen')
  }
  const result = await response.json()
  return result.data as PlumberCalculation
}

async function updateCalculation(id: string, updates: PlumberCalculationUpdate) {
  const headers = await getAuthHeaders()
  const response = await fetch(`/api/plumber-calculations/${id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(updates)
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Fehler beim Aktualisieren')
  }
  const result = await response.json()
  return result.data as PlumberCalculation
}

async function deleteCalculation(id: string) {
  const headers = await getAuthHeaders()
  const response = await fetch(`/api/plumber-calculations/${id}`, {
    method: 'DELETE',
    headers
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Fehler beim Löschen')
  }
}

async function deleteCalculationsBulk(ids: string[]) {
  const headers = await getAuthHeaders()
  const response = await fetch('/api/plumber-calculations/bulk', {
    method: 'DELETE',
    headers,
    body: JSON.stringify({ ids })
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Fehler beim Löschen')
  }
}

async function fetchCalculationStats() {
  const headers = await getAuthHeaders()
  const response = await fetch('/api/plumber-calculations/stats', { headers })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Fehler beim Abrufen der Statistiken')
  }
  const result = await response.json()
  return result.data
}

async function duplicateCalculation(id: string, newName?: string) {
  const headers = await getAuthHeaders()
  const response = await fetch(`/api/plumber-calculations/duplicate/${id}`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ newName })
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Fehler beim Duplizieren')
  }
  const result = await response.json()
  return result.data as PlumberCalculation
}

/**
 * Hook for fetching all calculations
 */
export function usePlumberCalculations(options?: {
  orderBy?: 'created_at' | 'updated_at' | 'name' | 'total_lu'
  ascending?: boolean
  limit?: number
  offset?: number
}) {
  return useQuery({
    queryKey: ['plumber-calculations', options],
    queryFn: () => fetchCalculations(options),
  })
}

/**
 * Hook for fetching a single calculation
 */
export function usePlumberCalculation(id: string | null) {
  return useQuery({
    queryKey: ['plumber-calculation', id],
    queryFn: () => fetchCalculation(id!),
    enabled: !!id,
  })
}

/**
 * Hook for creating a calculation
 */
export function useCreatePlumberCalculation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (calculation: Omit<PlumberCalculationInsert, 'user_id'>) =>
      createCalculation(calculation),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plumber-calculations'] })
      queryClient.invalidateQueries({ queryKey: ['plumber-calculation-stats'] })
    },
  })
}

/**
 * Hook for updating a calculation
 */
export function useUpdatePlumberCalculation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: PlumberCalculationUpdate }) =>
      updateCalculation(id, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['plumber-calculations'] })
      queryClient.invalidateQueries({ queryKey: ['plumber-calculation', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['plumber-calculation-stats'] })
    },
  })
}

/**
 * Hook for deleting a calculation
 */
export function useDeletePlumberCalculation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteCalculation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plumber-calculations'] })
      queryClient.invalidateQueries({ queryKey: ['plumber-calculation-stats'] })
    },
  })
}

/**
 * Hook for bulk deleting calculations
 */
export function useDeletePlumberCalculationsBulk() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (ids: string[]) => deleteCalculationsBulk(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plumber-calculations'] })
      queryClient.invalidateQueries({ queryKey: ['plumber-calculation-stats'] })
    },
  })
}

/**
 * Hook for searching calculations
 */
export function useSearchPlumberCalculations(searchTerm: string) {
  return useQuery({
    queryKey: ['plumber-calculations-search', searchTerm],
    queryFn: () => fetchCalculations({ search: searchTerm, orderBy: 'created_at', ascending: false }),
    enabled: searchTerm.length > 0,
  })
}

/**
 * Hook for getting calculation statistics
 */
export function usePlumberCalculationStats() {
  return useQuery({
    queryKey: ['plumber-calculation-stats'],
    queryFn: () => fetchCalculationStats(),
  })
}

/**
 * Hook for getting calculations by method
 */
export function usePlumberCalculationsByMethod(method: 'm1' | 'm2') {
  return useQuery({
    queryKey: ['plumber-calculations-by-method', method],
    queryFn: () => fetchCalculations({ method, orderBy: 'created_at', ascending: false }),
  })
}

/**
 * Hook for getting calculations by DN
 */
export function usePlumberCalculationsByDN(dn: string) {
  return useQuery({
    queryKey: ['plumber-calculations-by-dn', dn],
    queryFn: () => fetchCalculations({ dn, orderBy: 'created_at', ascending: false }),
    enabled: dn.length > 0,
  })
}

/**
 * Hook for getting recent calculations
 */
export function useRecentPlumberCalculations(limit = 5) {
  return useQuery({
    queryKey: ['plumber-calculations-recent', limit],
    queryFn: () => fetchCalculations({ orderBy: 'created_at', ascending: false, limit }),
  })
}

/**
 * Hook for duplicating a calculation
 */
export function useDuplicatePlumberCalculation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, newName }: { id: string; newName?: string }) =>
      duplicateCalculation(id, newName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plumber-calculations'] })
      queryClient.invalidateQueries({ queryKey: ['plumber-calculation-stats'] })
    },
  })
}

