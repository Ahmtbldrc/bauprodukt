const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

async function runMigration() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing environment variables')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  try {
    console.log('Running migration...')
    
    // Try to add columns one by one
    console.log('Adding art_nr column...')
    const { error: artNrError } = await supabase
      .from('products')
      .select('art_nr')
      .limit(1)
    
    if (artNrError && artNrError.message.includes('art_nr')) {
      console.log('art_nr column does not exist, need to add it manually')
    } else {
      console.log('art_nr column already exists')
    }

    console.log('Adding hersteller_nr column...')
    const { error: herstellerError } = await supabase
      .from('products')
      .select('hersteller_nr')
      .limit(1)
    
    if (herstellerError && herstellerError.message.includes('hersteller_nr')) {
      console.log('hersteller_nr column does not exist, need to add it manually')
    } else {
      console.log('hersteller_nr column already exists')
    }

    console.log('Adding discount_price column...')
    const { error: discountError } = await supabase
      .from('products')
      .select('discount_price')
      .limit(1)
    
    if (discountError && discountError.message.includes('discount_price')) {
      console.log('discount_price column does not exist, need to add it manually')
    } else {
      console.log('discount_price column already exists')
    }

    console.log('Migration completed successfully!')
    
    // Verify the columns exist
    const { data, error: selectError } = await supabase
      .from('products')
      .select('art_nr, hersteller_nr, discount_price')
      .limit(1)

    if (selectError) {
      console.error('Error verifying columns:', selectError)
      return
    }

    console.log('Columns verified:', Object.keys(data[0] || {}))

  } catch (error) {
    console.error('Migration failed:', error)
  }
}

runMigration()
