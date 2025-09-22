require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing environment variables')
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl)
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? 'SET' : 'NOT SET')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function createPlumberUser() {
  try {
    console.log('Creating plumber user...')

    // 1) Create auth user
    const email = 'plumber@bauprodukt.com'
    const password = 'plumber123'

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: 'Plumber',
          last_name: 'User',
          full_name: 'Plumber User',
        },
      },
    })

    if (authError) {
      console.error('Auth error:', authError)
      process.exit(1)
    }

    console.log('User created:', authData.user?.id)

    // 2) Fetch plumber role
    const { data: plumberRole, error: roleError } = await supabase
      .from('roles')
      .select('*')
      .eq('slug', 'plumber')
      .single()

    if (roleError || !plumberRole) {
      console.error('Role fetch error:', roleError || 'Role not found')
      process.exit(1)
    }

    console.log('Plumber role found:', plumberRole.id)

    // 3) Create profile with plumber role
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert({
        user_id: authData.user.id,
        first_name: 'Plumber',
        last_name: 'User',
        role_id: plumberRole.id,
        is_active: true,
      })
      .select()
      .single()

    if (profileError) {
      console.error('Profile creation error:', profileError)
      process.exit(1)
    }

    console.log('✅ Plumber profile created:', profileData)
    console.log('Email:', email)
    console.log('Password:', password)
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

createPlumberUser()



