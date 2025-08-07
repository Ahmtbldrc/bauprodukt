const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://ccwpzfbdkxgcnmalphap.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjd3B6ZmJka3hnY25tYWxwaGFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwODY5NTUsImV4cCI6MjA2NzY2Mjk1NX0.Ad7vk5PWhJYpcsdcB6NPp4FD_G2LJxgJ8ompzo8kRHw'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function createAdminUser() {
  try {
    console.log('Creating admin user...')
    
    // 1. Create user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: 'admin@bauprodukt.com',
      password: 'admin123',
      options: {
        data: {
          first_name: 'Admin',
          last_name: 'User',
          full_name: 'Admin User',
        }
      }
    })

    if (authError) {
      console.error('Auth error:', authError)
      return
    }

    console.log('User created:', authData.user?.id)

    // 2. Get admin role
    const { data: adminRole, error: roleError } = await supabase
      .from('roles')
      .select('*')
      .eq('slug', 'admin')
      .single()

    if (roleError) {
      console.error('Role fetch error:', roleError)
      return
    }

    console.log('Admin role found:', adminRole.id)

    // 3. Create profile with admin role
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert({
        user_id: authData.user.id,
        first_name: 'Admin',
        last_name: 'User',
        role_id: adminRole.id,
        is_active: true,
      })
      .select()
      .single()

    if (profileError) {
      console.error('Profile creation error:', profileError)
      return
    }

    console.log('Admin profile created:', profileData)
    console.log('Admin user created successfully!')
    console.log('Email: admin@bauprodukt.com')
    console.log('Password: admin123')

  } catch (error) {
    console.error('Error:', error)
  }
}

createAdminUser()
