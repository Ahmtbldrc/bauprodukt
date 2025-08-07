require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function createSampleVariants() {
  try {
    console.log('Creating sample variants...')

    // First, let's get some existing products
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name')
      .limit(5)

    if (productsError) {
      console.error('Error fetching products:', productsError)
      return
    }

    console.log('Found products:', products)

    // Check if attributes already exist
    const { data: existingAttributes } = await supabase
      .from('product_attributes')
      .select('*')

    if (!existingAttributes || existingAttributes.length === 0) {
      console.log('No attributes found. Please run the migration first.')
      return
    }

    console.log('Found existing attributes:', existingAttributes)

    // Get attribute values
    const { data: attributeValues } = await supabase
      .from('product_attribute_values')
      .select('*')

    console.log('Found attribute values:', attributeValues)

    // Create variants for each product
    for (const product of products) {
      console.log(`Creating variants for product: ${product.name}`)

      // Create variants with different combinations
      const variants = [
        {
          product_id: product.id,
          sku: `${product.id}-red-small-plastic`,
          title: 'Rot, Klein, Kunststoff',
          price: 29.99,
          compare_at_price: 39.99,
          stock_quantity: 10,
          position: 1
        },
        {
          product_id: product.id,
          sku: `${product.id}-blue-medium-metal`,
          title: 'Blau, Mittel, Metall',
          price: 49.99,
          compare_at_price: null,
          stock_quantity: 5,
          position: 2
        },
        {
          product_id: product.id,
          sku: `${product.id}-green-large-wood`,
          title: 'Grün, Groß, Holz',
          price: 79.99,
          compare_at_price: 89.99,
          stock_quantity: 3,
          position: 3
        }
      ]

      for (const variant of variants) {
        const { data: createdVariant, error: variantError } = await supabase
          .from('product_variants')
          .insert(variant)
          .select('*')
          .single()

        if (variantError) {
          console.error(`Error creating variant ${variant.sku}:`, variantError)
          continue
        }

        console.log(`Created variant: ${variant.sku}`)

        // Add attribute values to variant
        const variantAttributeValues = []
        
        // Get attribute values from the database
        const { data: allAttributeValues } = await supabase
          .from('product_attribute_values')
          .select('*')

        // Find color attribute values
        const colorAttribute = existingAttributes.find(attr => attr.name === 'color')
        const sizeAttribute = existingAttributes.find(attr => attr.name === 'size')
        const materialAttribute = existingAttributes.find(attr => attr.name === 'material')

        if (colorAttribute) {
          const redValue = allAttributeValues?.find(val => val.attribute_id === colorAttribute.id && val.value === 'red')
          const blueValue = allAttributeValues?.find(val => val.attribute_id === colorAttribute.id && val.value === 'blue')
          const greenValue = allAttributeValues?.find(val => val.attribute_id === colorAttribute.id && val.value === 'green')

          if (variant.sku.includes('red') && redValue) {
            variantAttributeValues.push({ variant_id: createdVariant.id, attribute_value_id: redValue.id })
          } else if (variant.sku.includes('blue') && blueValue) {
            variantAttributeValues.push({ variant_id: createdVariant.id, attribute_value_id: blueValue.id })
          } else if (variant.sku.includes('green') && greenValue) {
            variantAttributeValues.push({ variant_id: createdVariant.id, attribute_value_id: greenValue.id })
          }
        }

        if (sizeAttribute) {
          const smallValue = allAttributeValues?.find(val => val.attribute_id === sizeAttribute.id && val.value === 'small')
          const mediumValue = allAttributeValues?.find(val => val.attribute_id === sizeAttribute.id && val.value === 'medium')
          const largeValue = allAttributeValues?.find(val => val.attribute_id === sizeAttribute.id && val.value === 'large')

          if (variant.sku.includes('small') && smallValue) {
            variantAttributeValues.push({ variant_id: createdVariant.id, attribute_value_id: smallValue.id })
          } else if (variant.sku.includes('medium') && mediumValue) {
            variantAttributeValues.push({ variant_id: createdVariant.id, attribute_value_id: mediumValue.id })
          } else if (variant.sku.includes('large') && largeValue) {
            variantAttributeValues.push({ variant_id: createdVariant.id, attribute_value_id: largeValue.id })
          }
        }

        if (materialAttribute) {
          const plasticValue = allAttributeValues?.find(val => val.attribute_id === materialAttribute.id && val.value === 'plastic')
          const metalValue = allAttributeValues?.find(val => val.attribute_id === materialAttribute.id && val.value === 'metal')
          const woodValue = allAttributeValues?.find(val => val.attribute_id === materialAttribute.id && val.value === 'wood')

          if (variant.sku.includes('plastic') && plasticValue) {
            variantAttributeValues.push({ variant_id: createdVariant.id, attribute_value_id: plasticValue.id })
          } else if (variant.sku.includes('metal') && metalValue) {
            variantAttributeValues.push({ variant_id: createdVariant.id, attribute_value_id: metalValue.id })
          } else if (variant.sku.includes('wood') && woodValue) {
            variantAttributeValues.push({ variant_id: createdVariant.id, attribute_value_id: woodValue.id })
          }
        }

        if (variantAttributeValues.length > 0) {
          const { error: attributesError } = await supabase
            .from('variant_attribute_values')
            .insert(variantAttributeValues)

          if (attributesError) {
            console.error(`Error adding attributes to variant ${variant.sku}:`, attributesError)
          } else {
            console.log(`Added ${variantAttributeValues.length} attributes to variant ${variant.sku}`)
          }
        }

        if (attributeValues.length > 0) {
          const { error: attributesError } = await supabase
            .from('variant_attribute_values')
            .insert(attributeValues)

          if (attributesError) {
            console.error(`Error adding attributes to variant ${variant.sku}:`, attributesError)
          } else {
            console.log(`Added ${attributeValues.length} attributes to variant ${variant.sku}`)
          }
        }
      }
    }

    console.log('Sample variants created successfully!')
  } catch (error) {
    console.error('Error creating sample variants:', error)
  }
}

createSampleVariants()
