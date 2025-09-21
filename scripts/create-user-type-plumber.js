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

async function createUserTypePlumber() {
  try {
    console.log('Creating user type: plumber...')

    const payload = {
      name: 'Plumber',
      slug: 'plumber',
      description: 'Plumber user type',
      permissions: {},
      is_active: true,
    }

    const { data, error } = await supabase
      .from('roles')
      .upsert([payload], { onConflict: 'slug' })
      .select()
      .single()

    if (error) {
      console.error('Insert/upsert error:', error)
      process.exit(1)
    }

    console.log('✅ User type ensured:', data)
    console.log('Done.')
  } catch (err) {
    console.error('Unexpected error:', err)
    process.exit(1)
  }
}

createUserTypePlumber()


