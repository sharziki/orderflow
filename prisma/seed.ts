/**
 * Seed Script - Creates a demo restaurant with full menu and sample orders
 * Run with: npx prisma db seed
 */

import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  // Check if demo restaurant already exists
  const existingTenant = await prisma.tenant.findUnique({
    where: { slug: 'demo-pizzeria' }
  })

  if (existingTenant) {
    console.log('⚠️  Demo restaurant already exists. Skipping seed.')
    return
  }

  // Create demo restaurant
  const tenant = await prisma.tenant.create({
    data: {
      slug: 'demo-pizzeria',
      name: 'Demo Pizzeria',
      email: 'demo@orderflow.io',
      phone: '(555) 123-4567',
      address: '123 Main Street',
      city: 'New York',
      state: 'NY',
      zip: '10001',
      timezone: 'America/New_York',
      template: 'modern',
      menuLayout: 'blu-bentonville',
      primaryColor: '#dc2626',
      secondaryColor: '#b91c1c',
      pickupEnabled: true,
      deliveryEnabled: true,
      scheduledOrdersEnabled: true,
      giftCardsEnabled: true,
      taxRate: 8.875,
      deliveryFee: 4.99,
      minOrderAmount: 15,
      platformFeePercent: 2.9,
      isActive: true,
      isOnboarded: true,
      businessHours: {
        monday: { open: '11:00', close: '22:00', closed: false },
        tuesday: { open: '11:00', close: '22:00', closed: false },
        wednesday: { open: '11:00', close: '22:00', closed: false },
        thursday: { open: '11:00', close: '22:00', closed: false },
        friday: { open: '11:00', close: '23:00', closed: false },
        saturday: { open: '12:00', close: '23:00', closed: false },
        sunday: { open: '12:00', close: '21:00', closed: false },
      },
    },
  })

  console.log(`✅ Created tenant: ${tenant.name} (${tenant.slug})`)

  // Create demo user (owner)
  const passwordHash = await bcrypt.hash('DemoPassword123!', 12)
  const user = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: 'demo@orderflow.io',
      passwordHash,
      name: 'Demo Owner',
      role: 'owner',
      emailVerified: true,
    },
  })

  console.log(`✅ Created user: ${user.email}`)

  // Create menu categories
  const categories = await Promise.all([
    prisma.category.create({
      data: { tenantId: tenant.id, name: '🍕 Pizzas', description: 'Our signature hand-tossed pizzas', sortOrder: 1 },
    }),
    prisma.category.create({
      data: { tenantId: tenant.id, name: '🥗 Salads', description: 'Fresh salads made daily', sortOrder: 2 },
    }),
    prisma.category.create({
      data: { tenantId: tenant.id, name: '🍝 Pasta', description: 'Classic Italian pasta dishes', sortOrder: 3 },
    }),
    prisma.category.create({
      data: { tenantId: tenant.id, name: '🍗 Wings', description: 'Crispy wings with your choice of sauce', sortOrder: 4 },
    }),
    prisma.category.create({
      data: { tenantId: tenant.id, name: '🥤 Drinks', description: 'Beverages and sodas', sortOrder: 5 },
    }),
    prisma.category.create({
      data: { tenantId: tenant.id, name: '🍰 Desserts', description: 'Sweet treats to finish your meal', sortOrder: 6 },
    }),
  ])

  console.log(`✅ Created ${categories.length} categories`)

  // Create menu items
  const menuItems = await Promise.all([
    // Pizzas
    prisma.menuItem.create({
      data: {
        tenantId: tenant.id, categoryId: categories[0].id,
        name: 'Margherita Pizza', description: 'Classic tomato sauce, fresh mozzarella, basil, and olive oil',
        price: 14.99, image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&h=600&fit=crop', sortOrder: 1,
      },
    }),
    prisma.menuItem.create({
      data: {
        tenantId: tenant.id, categoryId: categories[0].id,
        name: 'Pepperoni Pizza', description: 'Loaded with premium pepperoni and melted mozzarella',
        price: 16.99, image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=800&h=600&fit=crop', sortOrder: 2,
      },
    }),
    prisma.menuItem.create({
      data: {
        tenantId: tenant.id, categoryId: categories[0].id,
        name: 'BBQ Chicken Pizza', description: 'Grilled chicken, BBQ sauce, red onion, cilantro',
        price: 18.99, image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&h=600&fit=crop', sortOrder: 3,
      },
    }),
    prisma.menuItem.create({
      data: {
        tenantId: tenant.id, categoryId: categories[0].id,
        name: 'Meat Lovers Pizza', description: 'Pepperoni, sausage, bacon, ham, and ground beef',
        price: 19.99, image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&h=600&fit=crop', sortOrder: 4,
      },
    }),
    prisma.menuItem.create({
      data: {
        tenantId: tenant.id, categoryId: categories[0].id,
        name: 'Veggie Supreme', description: 'Bell peppers, mushrooms, onions, olives, tomatoes', price: 17.99, sortOrder: 5,
      },
    }),
    // Salads
    prisma.menuItem.create({
      data: {
        tenantId: tenant.id, categoryId: categories[1].id,
        name: 'Caesar Salad', description: 'Romaine, parmesan, croutons, caesar dressing',
        price: 9.99, image: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=800&h=600&fit=crop', sortOrder: 1,
      },
    }),
    prisma.menuItem.create({
      data: {
        tenantId: tenant.id, categoryId: categories[1].id,
        name: 'Garden Salad', description: 'Mixed greens, tomatoes, cucumbers, red onion', price: 8.99, sortOrder: 2,
      },
    }),
    prisma.menuItem.create({
      data: {
        tenantId: tenant.id, categoryId: categories[1].id,
        name: 'Greek Salad', description: 'Feta cheese, olives, cucumbers, tomatoes, red onion', price: 11.99, sortOrder: 3,
      },
    }),
    // Pasta
    prisma.menuItem.create({
      data: {
        tenantId: tenant.id, categoryId: categories[2].id,
        name: 'Spaghetti & Meatballs', description: 'Classic spaghetti with homemade meatballs and marinara',
        price: 15.99, image: 'https://images.unsplash.com/photo-1551892374-ecf8754cf8b0?w=800&h=600&fit=crop', sortOrder: 1,
      },
    }),
    prisma.menuItem.create({
      data: {
        tenantId: tenant.id, categoryId: categories[2].id,
        name: 'Fettuccine Alfredo', description: 'Creamy parmesan alfredo sauce with fettuccine', price: 14.99, sortOrder: 2,
      },
    }),
    prisma.menuItem.create({
      data: {
        tenantId: tenant.id, categoryId: categories[2].id,
        name: 'Chicken Parmesan', description: 'Breaded chicken breast with marinara and melted mozzarella', price: 17.99, sortOrder: 3,
      },
    }),
    // Wings
    prisma.menuItem.create({
      data: {
        tenantId: tenant.id, categoryId: categories[3].id,
        name: 'Buffalo Wings (10pc)', description: 'Classic buffalo sauce, served with ranch or blue cheese',
        price: 12.99, image: 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=800&h=600&fit=crop', sortOrder: 1,
      },
    }),
    prisma.menuItem.create({
      data: {
        tenantId: tenant.id, categoryId: categories[3].id,
        name: 'BBQ Wings (10pc)', description: 'Tangy BBQ sauce, finger-lickin good', price: 12.99, sortOrder: 2,
      },
    }),
    prisma.menuItem.create({
      data: {
        tenantId: tenant.id, categoryId: categories[3].id,
        name: 'Garlic Parmesan Wings (10pc)', description: 'Buttery garlic parmesan tossed wings', price: 13.99, sortOrder: 3,
      },
    }),
    // Drinks
    prisma.menuItem.create({
      data: { tenantId: tenant.id, categoryId: categories[4].id, name: 'Coca-Cola', description: '20oz bottle', price: 2.99, sortOrder: 1 },
    }),
    prisma.menuItem.create({
      data: { tenantId: tenant.id, categoryId: categories[4].id, name: 'Sprite', description: '20oz bottle', price: 2.99, sortOrder: 2 },
    }),
    prisma.menuItem.create({
      data: { tenantId: tenant.id, categoryId: categories[4].id, name: 'Bottled Water', description: '16.9oz', price: 1.99, sortOrder: 3 },
    }),
    // Desserts
    prisma.menuItem.create({
      data: {
        tenantId: tenant.id, categoryId: categories[5].id,
        name: 'Tiramisu', description: 'Classic Italian coffee-flavored dessert',
        price: 7.99, image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=800&h=600&fit=crop', sortOrder: 1,
      },
    }),
    prisma.menuItem.create({
      data: {
        tenantId: tenant.id, categoryId: categories[5].id,
        name: 'Cannoli', description: 'Crispy shell filled with sweet ricotta cream', price: 5.99, sortOrder: 2,
      },
    }),
    prisma.menuItem.create({
      data: {
        tenantId: tenant.id, categoryId: categories[5].id,
        name: 'Chocolate Lava Cake', description: 'Warm chocolate cake with molten center', price: 8.99, sortOrder: 3,
      },
    }),
  ])

  console.log(`✅ Created ${menuItems.length} menu items`)

  // Create sample orders
  const orders = await Promise.all([
    prisma.order.create({
      data: {
        tenantId: tenant.id, orderNumber: 'ORD-001', status: 'completed', type: 'pickup',
        customerName: 'John Smith', customerEmail: 'john@example.com', customerPhone: '(555) 111-2222',
        items: JSON.stringify([
          { name: 'Pepperoni Pizza', quantity: 1, price: 16.99 },
          { name: 'Coca-Cola', quantity: 2, price: 2.99 },
        ]),
        subtotal: 22.97, tax: 2.04, tip: 3.00, total: 28.01, paymentStatus: 'paid',
        completedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      },
    }),
    prisma.order.create({
      data: {
        tenantId: tenant.id, orderNumber: 'ORD-002', status: 'preparing', type: 'delivery',
        customerName: 'Jane Doe', customerEmail: 'jane@example.com', customerPhone: '(555) 333-4444',
        deliveryAddress: '456 Oak Avenue, Apt 2B, New York, NY 10002',
        items: JSON.stringify([
          { name: 'Meat Lovers Pizza', quantity: 1, price: 19.99 },
          { name: 'Buffalo Wings (10pc)', quantity: 1, price: 12.99 },
          { name: 'Tiramisu', quantity: 1, price: 7.99 },
        ]),
        subtotal: 40.97, tax: 3.64, tip: 6.00, deliveryFee: 4.99, total: 55.60, paymentStatus: 'paid',
      },
    }),
    prisma.order.create({
      data: {
        tenantId: tenant.id, orderNumber: 'ORD-003', status: 'pending', type: 'pickup',
        customerName: 'Bob Wilson', customerEmail: 'bob@example.com', customerPhone: '(555) 555-6666',
        items: JSON.stringify([
          { name: 'Caesar Salad', quantity: 2, price: 9.99 },
          { name: 'Spaghetti & Meatballs', quantity: 1, price: 15.99 },
        ]),
        subtotal: 35.97, tax: 3.19, tip: 5.00, total: 44.16, paymentStatus: 'paid',
      },
    }),
  ])

  console.log(`✅ Created ${orders.length} sample orders`)

  // Create a sample gift card
  const giftCard = await prisma.giftCard.create({
    data: {
      tenantId: tenant.id, code: 'DEMO-GIFT-2024',
      initialBalance: 50.00, currentBalance: 50.00,
      purchaserName: 'Demo User', purchaserEmail: 'demo@orderflow.io',
      recipientName: 'Test Customer', recipientEmail: 'customer@example.com',
      message: 'Enjoy your pizza!',
    },
  })

  console.log(`✅ Created gift card: ${giftCard.code}`)

  console.log('\n🎉 Seed complete!\n')
  console.log('📋 Demo Restaurant Details:')
  console.log('   URL:      /store/demo-pizzeria')
  console.log('   Email:    demo@orderflow.io')
  console.log('   Password: DemoPassword123!')
  console.log('\n🎁 Gift Card: DEMO-GIFT-2024 ($50.00)\n')
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
