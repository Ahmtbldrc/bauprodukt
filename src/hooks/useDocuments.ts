import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export interface Document {
  id: string
  title: string
  file_url: string
  file_type?: string
  file_size?: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface DocumentsResponse {
  data: Document[]
  error?: string
}

export function useDocuments(productId: string) {
  const [data, setData] = useState<DocumentsResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDocuments = async () => {
    if (!productId) return

    try {
      setIsLoading(true)
      setError(null)
      
      console.log('Fetching documents for product:', productId)

      const { data: documents, error: fetchError } = await supabase
        .from('product_documents')
        .select('*')
        .eq('product_id', productId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (fetchError) {
        console.error('Supabase fetch error:', fetchError)
        throw fetchError
      }

      console.log('Fetched documents:', documents)
      setData({ data: documents || [] })
    } catch (err) {
      console.error('Error fetching documents:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch documents')
      setData({ data: [], error: err instanceof Error ? err.message : 'Failed to fetch documents' })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchDocuments()
  }, [productId])

  return {
    data,
    isLoading,
    error,
    refetch: fetchDocuments
  }
}
