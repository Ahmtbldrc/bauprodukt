const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://ccwpzfbdkxgcnmalphap.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjd3B6ZmJka3hnY25tYWxwaGFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwODY5NTUsImV4cCI6MjA2NzY2Mjk1NX0.Ad7vk5PWhJYpcsdcB6NPp4FD_G2LJxgJ8ompzo8kRHw'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkProfiles() {
  try {
    console.log('Checking profiles...')
    
    // Get all profiles
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')

    if (error) {
      console.error('Error fetching profiles:', error)
      return
    }

    console.log('Found profiles:', profiles)

    // Get all roles
    const { data: roles, error: rolesError } = await supabase
      .from('roles')
      .select('*')

    if (rolesError) {
      console.error('Error fetching roles:', rolesError)
      return
    }

    console.log('Found roles:', roles)

  } catch (error) {
    console.error('Error:', error)
  }
}

checkProfiles()
