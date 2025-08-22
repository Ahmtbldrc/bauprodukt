require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase environment variables are missing')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createSampleVariants() {
  console.log('🎨 Creating sample variants...\n')

  try {
    // Get a product to add variants to
    console.log('📋 Getting a product...')
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, slug')
      .limit(1)

    if (productsError) {
      console.error('❌ Error fetching products:', productsError)
      return
    }

    if (!products || products.length === 0) {
      console.error('❌ No products found')
      return
    }

    const product = products[0]
    console.log(`✅ Using product: ${product.name} (${product.id})`)

    // Create sample variants
    const sampleVariants = [
      {
        product_id: product.id,
        sku: `${product.slug}-red`,
        title: 'Rot (Red)',
        price: 299.99,
        compare_at_price: 349.99,
        stock_quantity: 25,
        track_inventory: true,
        continue_selling_when_out_of_stock: false,
        is_active: true,
        position: 0
      },
      {
        product_id: product.id,
        sku: `${product.slug}-blue`,
        title: 'Blau (Blue)',
        price: 299.99,
        compare_at_price: 349.99,
        stock_quantity: 30,
        track_inventory: true,
        continue_selling_when_out_of_stock: false,
        is_active: true,
        position: 1
      },
      {
        product_id: product.id,
        sku: `${product.slug}-white`,
        title: 'Weiß (White)',
        price: 299.99,
        compare_at_price: 349.99,
        stock_quantity: 40,
        track_inventory: true,
        continue_selling_when_out_of_stock: false,
        is_active: true,
        position: 2
      }
    ]

    console.log('📋 Creating variants...')
    const { data: createdVariants, error: createError } = await supabase
      .from('product_variants')
      .insert(sampleVariants)
      .select('*')

    if (createError) {
      console.error('❌ Error creating variants:', createError)
      return
    }

    console.log('✅ Variants created successfully:')
    createdVariants.forEach((variant, index) => {
      console.log(`   ${index + 1}. ${variant.sku} - ${variant.title} - Price: ${variant.price}`)
    })

    // Verify variants were created
    console.log('\n📋 Verifying variants...')
    const { data: verifyVariants, error: verifyError } = await supabase
      .from('product_variants_detailed')
      .select('*')
      .eq('product_id', product.id)

    if (verifyError) {
      console.error('❌ Error verifying variants:', verifyError)
    } else {
      console.log('✅ Verified variants:')
      console.log(`   Count: ${verifyVariants?.length || 0}`)
      if (verifyVariants && verifyVariants.length > 0) {
        verifyVariants.forEach((variant, index) => {
          console.log(`   ${index + 1}. ${variant.sku} - ${variant.title} - Price: ${variant.price}`)
        })
      }
    }

    console.log('\n✅ Sample variants created successfully!')

  } catch (error) {
    console.error('❌ Script failed:', error)
  }
}

createSampleVariants()
  .then(() => {
    console.log('\n✅ Script completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Script failed:', error)
    process.exit(1)
  })
