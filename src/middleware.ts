import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: Record<string, unknown>) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const { pathname } = request.nextUrl
  
  // Define protected routes
  const protectedRoutes = {
    admin: [
      '/api/waitlist',
      '/api/audit',
      '/api/products/admin'  // Admin-specific product operations
    ],
    authenticated: [
      '/api/orders',
      '/api/favorites',
      '/api/cart/user'
    ]
  }
  
  // Check if route requires admin access
  const requiresAdmin = protectedRoutes.admin.some(route => pathname.startsWith(route))
  
  // Check if route requires authentication
  const requiresAuth = requiresAdmin || 
    protectedRoutes.authenticated.some(route => pathname.startsWith(route))
  
  // Special handling for product endpoints
  const isProductEndpoint = pathname.startsWith('/api/products')
  const isProductModification = request.method === 'POST' || 
                                request.method === 'PUT' || 
                                request.method === 'DELETE' ||
                                request.method === 'PATCH'
  
  // Product modifications require admin access
  if (isProductEndpoint && isProductModification) {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    // Check admin role for product modifications
    const { data: profile } = await supabase
      .from('profiles')
      .select('role:roles(slug)')
      .eq('user_id', session.user.id)
      .single()
    
    if ((profile?.role as unknown as { slug: string } | null)?.slug !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required for product modifications' },
        { status: 403 }
      )
    }
    
    // Add user info to headers
    response.headers.set('x-user-id', session.user.id)
    response.headers.set('x-user-email', session.user.email || '')
    response.headers.set('x-user-role', 'admin')
    
    return response
  }
  
  if (requiresAuth) {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    if (requiresAdmin) {
      // Check admin role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role:roles(slug)')
        .eq('user_id', session.user.id)
        .single()
      
      if ((profile?.role as unknown as { slug: string } | null)?.slug !== 'admin') {
        return NextResponse.json(
          { error: 'Admin access required' },
          { status: 403 }
        )
      }
      
      // Add admin info to headers
      response.headers.set('x-user-id', session.user.id)
      response.headers.set('x-user-email', session.user.email || '')
      response.headers.set('x-user-role', 'admin')
      
      return response
    }
    
    // For authenticated routes (non-admin)
    response.headers.set('x-user-id', session.user.id)
    response.headers.set('x-user-email', session.user.email || '')
    response.headers.set('x-user-role', 'user')
    
    return response
  }
  
  // For public product GET requests, check if user is admin to determine what to show
  if (isProductEndpoint && request.method === 'GET') {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (session) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role:roles(slug)')
        .eq('user_id', session.user.id)
        .single()
      
      response.headers.set('x-user-id', session.user.id)
      response.headers.set('x-user-email', session.user.email || '')
      response.headers.set('x-user-role', (profile?.role as unknown as { slug: string } | null)?.slug === 'admin' ? 'admin' : 'user')
      
      return response
    }
  }
  
  return response
}

export const config = {
  matcher: [
    '/api/products/:path*',
    '/api/waitlist/:path*',
    '/api/audit/:path*',
    '/api/orders/:path*',
    '/api/favorites/:path*',
    '/api/cart/user/:path*'
  ]
}