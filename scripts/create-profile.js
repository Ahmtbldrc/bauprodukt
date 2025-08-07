const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://ccwpzfbdkxgcnmalphap.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjd3B6ZmJka3hnY25tYWxwaGFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwODY5NTUsImV4cCI6MjA2NzY2Mjk1NX0.Ad7vk5PWhJYpcsdcB6NPp4FD_G2LJxgJ8ompzo8kRHw'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function createProfile() {
  try {
    console.log('Creating profile for test user...')
    
    // Get admin role
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

    // Create profile for test user
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert({
        user_id: 'be91d1b0-8058-4b49-afe9-1f959811ae75', // Test user ID
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

    console.log('Profile created successfully!')
    console.log('Profile data:', profileData)
    console.log('Email: test@bauprodukt.com')
    console.log('Password: test123')
    console.log('Role: Admin')

  } catch (error) {
    console.error('Error:', error)
  }
}

createProfile()
