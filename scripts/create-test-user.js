const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://ccwpzfbdkxgcnmalphap.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjd3B6ZmJka3hnY25tYWxwaGFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwODY5NTUsImV4cCI6MjA2NzY2Mjk1NX0.Ad7vk5PWhJYpcsdcB6NPp4FD_G2LJxgJ8ompzo8kRHw'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function createTestUser() {
  try {
    console.log('Creating test user...')
    
    // Create user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: 'test@bauprodukt.com',
      password: 'test123',
      options: {
        data: {
          first_name: 'Test',
          last_name: 'User',
          full_name: 'Test User',
        }
      }
    })

    if (authError) {
      console.error('Auth error:', authError)
      return
    }

    console.log('User created:', authData.user?.id)
    console.log('Test user created successfully!')
    console.log('Email: test@bauprodukt.com')
    console.log('Password: test123')

  } catch (error) {
    console.error('Error:', error)
  }
}

createTestUser()
