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

async function checkDatabase() {
  try {
    console.log('Checking database structure...')
    
    // Check if orders table exists
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .limit(1)
    
    if (ordersError) {
      console.error('Orders table error:', ordersError)
    } else {
      console.log('✅ Orders table exists')
      console.log('Orders count:', orders?.length || 0)
    }
    
    // Check if order_items table exists
    const { data: orderItems, error: orderItemsError } = await supabase
      .from('order_items')
      .select('*')
      .limit(1)
    
    if (orderItemsError) {
      console.error('Order items table error:', orderItemsError)
    } else {
      console.log('✅ Order items table exists')
      console.log('Order items count:', orderItems?.length || 0)
    }
    
    // Check if products table exists
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .limit(1)
    
    if (productsError) {
      console.error('Products table error:', productsError)
    } else {
      console.log('✅ Products table exists')
      console.log('Products count:', products?.length || 0)
    }
    
  } catch (error) {
    console.error('Database check error:', error)
  }
}

checkDatabase()
