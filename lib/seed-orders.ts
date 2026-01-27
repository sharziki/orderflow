/**
 * Seed script for dummy orders
 * Run with: npx ts-node lib/seed-orders.ts
 * 
 * Note: This script uses Supabase for database operations
 */

import { supabase } from './supabase'

async function main() {
  console.log('Seeding dummy orders...')

  // Get existing menu items
  const { data: menuItemsData, error: menuError } = await supabase
    .from('menu_items')
    .select('*')

  const menuItems = (menuItemsData || []) as any[]

  if (menuError || menuItems.length === 0) {
    console.error('No menu items found! Please run seed.ts first.')
    return
  }

  // Create dummy customers
  const customers = [
    { name: 'John Doe', email: 'john.doe@example.com', phone: '+1-555-0101' },
    { name: 'Jane Smith', email: 'jane.smith@example.com', phone: '+1-555-0102' },
    { name: 'Bob Wilson', email: 'bob.wilson@example.com', phone: '+1-555-0103' },
    { name: 'Sarah Johnson', email: 'sarah.johnson@example.com', phone: '+1-555-0104' },
    { name: 'Mike Brown', email: 'mike.brown@example.com', phone: '+1-555-0105' },
  ]

  const { data: createdCustomers, error: customerError } = await (supabase
    .from('customers') as any)
    .upsert(customers, { onConflict: 'email' })
    .select()

  if (customerError) {
    console.error('Error creating customers:', customerError)
    return
  }

  console.log(`Created ${createdCustomers?.length || 0} customers`)

  // Helper to calculate order totals
  const calculateOrderTotal = (items: { price: number; quantity: number }[]) => {
    const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    const tax = totalAmount * 0.06
    const stripeFee = (totalAmount + tax) * 0.029 + 0.30
    const finalAmount = totalAmount + tax + stripeFee
    return { totalAmount, tax, stripeFee, finalAmount }
  }

  // Create some dummy orders
  const orderData = [
    {
      customer_id: createdCustomers[0].id,
      order_type: 'PICKUP',
      status: 'PENDING',
      notes: 'Please add extra napkins',
    },
    {
      customer_id: createdCustomers[1].id,
      order_type: 'PICKUP',
      status: 'CONFIRMED',
    },
    {
      customer_id: createdCustomers[2].id,
      order_type: 'PICKUP',
      status: 'PREPARING',
    },
    {
      customer_id: createdCustomers[3].id,
      order_type: 'PICKUP',
      status: 'READY',
    },
  ]

  for (let i = 0; i < orderData.length; i++) {
    const orderItems = [
      { price: menuItems[i % menuItems.length].price, quantity: 2 },
      { price: menuItems[(i + 1) % menuItems.length].price, quantity: 1 },
    ]
    const totals = calculateOrderTotal(orderItems)

    const { data: order, error: orderError } = await (supabase
      .from('orders') as any)
      .insert({
        ...orderData[i],
        total_amount: totals.totalAmount,
        tax: totals.tax,
        stripe_fee: totals.stripeFee,
        final_amount: totals.finalAmount,
      })
      .select()
      .single()

    if (orderError) {
      console.error('Error creating order:', orderError)
      continue
    }

    // Create order items
    const items = [
      {
        order_id: order.id,
        menu_item_id: menuItems[i % menuItems.length].id,
        quantity: 2,
        price: menuItems[i % menuItems.length].price,
      },
      {
        order_id: order.id,
        menu_item_id: menuItems[(i + 1) % menuItems.length].id,
        quantity: 1,
        price: menuItems[(i + 1) % menuItems.length].price,
      },
    ]

    await (supabase
      .from('order_items') as any)
      .insert(items)
  }

  console.log('✅ Successfully created dummy orders across all Kanban stages!')
}

main()
  .catch((e) => {
    console.error('Error seeding orders:', e)
    process.exit(1)
  })
