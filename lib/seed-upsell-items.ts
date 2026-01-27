/**
 * Seed script for upsell items (drinks, sides, desserts)
 * Run with: npx tsx lib/seed-upsell-items.ts
 */

import { supabase } from './supabase'

async function main() {
  console.log('Seeding upsell items...')

  const now = new Date().toISOString()
  const upsellItems = [
    // Drinks
    {
      id: 'upsell-drink-1',
      name: 'Fresh Lemonade',
      description: 'Homemade with real lemons',
      price: 3.99,
      category: 'Drinks',
      image: 'https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=800&h=600&fit=crop',
      available: true,
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'upsell-drink-2',
      name: 'Sweet Tea',
      description: 'Southern-style sweet tea',
      price: 2.99,
      category: 'Drinks',
      image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=800&h=600&fit=crop',
      available: true,
      createdAt: now,
      updatedAt: now
    },
    // Sides
    {
      id: 'upsell-side-1',
      name: 'Cajun Fries',
      description: 'Crispy fries with Cajun seasoning',
      price: 4.99,
      category: 'Sides',
      image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=800&h=600&fit=crop',
      available: true,
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'upsell-side-2',
      name: 'Mac & Cheese',
      description: 'Creamy homemade mac and cheese',
      price: 5.99,
      category: 'Sides',
      image: 'https://images.unsplash.com/photo-1543339494-b4cd4f7ba686?w=800&h=600&fit=crop',
      available: true,
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'upsell-side-3',
      name: 'Hush Puppies',
      description: 'Golden fried cornmeal balls',
      price: 4.49,
      category: 'Sides',
      image: 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=800&h=600&fit=crop',
      available: true,
      createdAt: now,
      updatedAt: now
    },
    // Desserts
    {
      id: 'upsell-dessert-1',
      name: 'Key Lime Pie',
      description: 'Tangy and sweet Florida classic',
      price: 6.99,
      category: 'Desserts',
      image: 'https://images.unsplash.com/photo-1519915028121-7d3463d5b1ff?w=800&h=600&fit=crop',
      available: true,
      createdAt: now,
      updatedAt: now
    }
  ]

  // Insert upsell items
  for (const item of upsellItems) {
    const { data, error } = await (supabase
      .from('menu_items') as any)
      .upsert(item, { onConflict: 'id' })

    if (error) {
      console.error(`Error upserting ${item.name}:`, error)
    } else {
      console.log(`✓ Added/Updated: ${item.name}`)
    }
  }

  console.log('✓ Upsell items seeded successfully!')
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error seeding upsell items:', error)
    process.exit(1)
  })
