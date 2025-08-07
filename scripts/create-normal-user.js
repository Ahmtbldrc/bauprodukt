const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://ccwpzfbdkxgcnmalphap.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjd3B6ZmJka3hnY25tYWxwaGFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwODY5NTUsImV4cCI6MjA2NzY2Mjk1NX0.Ad7vk5PWhJYpcsdcB6NPp4FD_G2LJxgJ8ompzo8kRHw'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function createNormalUser() {
  try {
    console.log('Creating normal user...')
    
    // Create user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: 'user@bauprodukt.com',
      password: 'user123',
      options: {
        data: {
          first_name: 'Normal',
          last_name: 'User',
          full_name: 'Normal User',
        }
      }
    })

    if (authError) {
      console.error('Auth error:', authError)
      return
    }

    console.log('User created:', authData.user?.id)

    // Get user role
    const { data: userRole, error: roleError } = await supabase
      .from('roles')
      .select('*')
      .eq('slug', 'user')
      .single()

    if (roleError) {
      console.error('Role fetch error:', roleError)
      return
    }

    console.log('User role found:', userRole.id)

    // Create profile for normal user
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert({
        user_id: authData.user.id,
        first_name: 'Normal',
        last_name: 'User',
        role_id: userRole.id,
        is_active: true,
      })
      .select()
      .single()

    if (profileError) {
      console.error('Profile creation error:', profileError)
      return
    }

    console.log('Normal user created successfully!')
    console.log('Email: user@bauprodukt.com')
    console.log('Password: user123')
    console.log('Role: User')

  } catch (error) {
    console.error('Error:', error)
  }
}

createNormalUser()
