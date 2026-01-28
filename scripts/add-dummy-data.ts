import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Random helpers
const randomPick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min: number, max: number) => parseFloat((Math.random() * (max - min) + min).toFixed(2));

// Sample data
const firstNames = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'David', 'Elizabeth', 'William', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen', 'Emma', 'Oliver', 'Ava', 'Liam', 'Sophia', 'Noah', 'Isabella', 'Ethan', 'Mia', 'Lucas'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White', 'Harris'];
const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'icloud.com', 'hotmail.com', 'proton.me'];

const orderStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'];
const paymentStatuses = ['pending', 'paid', 'failed', 'refunded'];

function generatePhone(): string {
  return `(${randomInt(200, 999)}) ${randomInt(100, 999)}-${randomInt(1000, 9999)}`;
}

function generateEmail(firstName: string, lastName: string): string {
  const formats = [
    () => `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${randomPick(domains)}`,
    () => `${firstName.toLowerCase()}${randomInt(1, 999)}@${randomPick(domains)}`,
    () => `${firstName[0].toLowerCase()}${lastName.toLowerCase()}@${randomPick(domains)}`,
  ];
  return randomPick(formats)();
}

function generateOrderNumber(): string {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  return `${randomPick(letters.split(''))}${randomPick(letters.split(''))}${randomInt(1000, 9999)}`;
}

function generateGiftCardCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array(16).fill(0).map(() => chars[Math.floor(Math.random() * chars.length)]).join('').match(/.{4}/g)!.join('-');
}

async function addDummyData() {
  console.log('🎁 Adding dummy orders and gift cards...\n');

  // Find the tenant
  const tenant = await prisma.tenant.findUnique({
    where: { slug: 'blu-bentonville' },
    include: { menuItems: true }
  });

  if (!tenant) {
    console.error('❌ Tenant blu-bentonville not found. Run seed-blu.ts first.');
    process.exit(1);
  }

  console.log(`Found tenant: ${tenant.name} (${tenant.id})\n`);

  // Get existing data counts
  const existingOrders = await prisma.order.count({ where: { tenantId: tenant.id } });
  const existingGiftCards = await prisma.giftCard.count({ where: { tenantId: tenant.id } });
  console.log(`Existing orders: ${existingOrders}`);
  console.log(`Existing gift cards: ${existingGiftCards}\n`);

  // Create 15 new orders with varying amounts and dates
  console.log('📦 Creating orders...');
  const orders = [];
  
  for (let i = 0; i < 15; i++) {
    const firstName = randomPick(firstNames);
    const lastName = randomPick(lastNames);
    const customerName = `${firstName} ${lastName}`;
    const customerEmail = generateEmail(firstName, lastName);
    const customerPhone = generatePhone();
    
    // Random items (1-5 items per order)
    const numItems = randomInt(1, 5);
    const orderItems = [];
    let subtotal = 0;
    
    for (let j = 0; j < numItems; j++) {
      const menuItem = randomPick(tenant.menuItems);
      const quantity = randomInt(1, 3);
      const itemTotal = menuItem.price * quantity;
      subtotal += itemTotal;
      
      orderItems.push({
        id: menuItem.id,
        name: menuItem.name,
        price: menuItem.price,
        quantity,
        total: itemTotal,
        modifiers: [],
      });
    }

    // Calculate totals
    const taxRate = tenant.taxRate / 100;
    const tax = parseFloat((subtotal * taxRate).toFixed(2));
    const tip = randomPick([0, 0, 0, 3, 5, 7, 10, 15, 20]); // Sometimes no tip
    const total = parseFloat((subtotal + tax + tip).toFixed(2));

    // Random date within last 30 days
    const daysAgo = randomInt(0, 30);
    const hoursAgo = randomInt(0, 23);
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - daysAgo);
    createdAt.setHours(createdAt.getHours() - hoursAgo);

    // Determine status based on age
    let status = 'completed';
    let paymentStatus = 'paid';
    if (daysAgo === 0 && hoursAgo < 2) {
      status = randomPick(['pending', 'confirmed', 'preparing', 'ready']);
      paymentStatus = status === 'pending' ? 'pending' : 'paid';
    } else if (daysAgo === 0 && hoursAgo < 6) {
      status = randomPick(['ready', 'completed']);
    }
    if (Math.random() < 0.05) {
      status = 'cancelled';
      paymentStatus = 'refunded';
    }

    const order = await prisma.order.create({
      data: {
        tenantId: tenant.id,
        orderNumber: generateOrderNumber(),
        status,
        type: randomPick(['pickup', 'pickup', 'pickup', 'delivery']), // Mostly pickup
        customerName,
        customerEmail,
        customerPhone,
        items: orderItems,
        subtotal,
        tax,
        tip,
        deliveryFee: 0,
        discount: 0,
        total,
        paymentStatus,
        createdAt,
        updatedAt: createdAt,
        completedAt: status === 'completed' ? createdAt : null,
      }
    });

    orders.push(order);
    console.log(`  ✅ ${order.orderNumber} - $${total.toFixed(2)} (${status}) - ${customerName}`);
  }

  // Create 10 gift cards with varying amounts
  console.log('\n🎁 Creating gift cards...');
  const giftCardAmounts = [25, 50, 75, 100, 150, 200, 250, 500];
  
  for (let i = 0; i < 10; i++) {
    const purchaserFirst = randomPick(firstNames);
    const purchaserLast = randomPick(lastNames);
    const recipientFirst = randomPick(firstNames);
    const recipientLast = randomPick(lastNames);
    
    const initialBalance = randomPick(giftCardAmounts);
    // Some gift cards have been partially used
    const usedAmount = Math.random() < 0.4 ? randomFloat(0, initialBalance * 0.7) : 0;
    const currentBalance = parseFloat((initialBalance - usedAmount).toFixed(2));
    
    // Random creation date within last 90 days
    const daysAgo = randomInt(0, 90);
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - daysAgo);

    // Some expire in a year
    const expiresAt = Math.random() < 0.7 ? new Date(createdAt.getTime() + 365 * 24 * 60 * 60 * 1000) : null;
    
    // Some are deactivated
    const isActive = Math.random() > 0.1;

    const messages = [
      'Happy Birthday! 🎂',
      'Enjoy your meal! 🐟',
      'Thank you for everything!',
      'Congratulations on your promotion!',
      'Have a great anniversary dinner!',
      'Merry Christmas! 🎄',
      'Happy Holidays!',
      'Just because you\'re awesome!',
      null, // No message
    ];

    const giftCard = await prisma.giftCard.create({
      data: {
        tenantId: tenant.id,
        code: generateGiftCardCode(),
        initialBalance,
        currentBalance,
        purchaserName: `${purchaserFirst} ${purchaserLast}`,
        purchaserEmail: generateEmail(purchaserFirst, purchaserLast),
        recipientName: `${recipientFirst} ${recipientLast}`,
        recipientEmail: generateEmail(recipientFirst, recipientLast),
        message: randomPick(messages),
        isActive,
        expiresAt,
        createdAt,
        updatedAt: createdAt,
      }
    });

    const usedNote = usedAmount > 0 ? ` (${currentBalance.toFixed(2)} remaining)` : '';
    const activeNote = !isActive ? ' [INACTIVE]' : '';
    console.log(`  ✅ ${giftCard.code} - $${initialBalance}${usedNote}${activeNote}`);
  }

  // Final counts
  const finalOrders = await prisma.order.count({ where: { tenantId: tenant.id } });
  const finalGiftCards = await prisma.giftCard.count({ where: { tenantId: tenant.id } });

  console.log('\n\n🎉 Done!');
  console.log(`   Total orders: ${finalOrders} (added ${finalOrders - existingOrders})`);
  console.log(`   Total gift cards: ${finalGiftCards} (added ${finalGiftCards - existingGiftCards})`);
}

addDummyData()
  .catch((e) => {
    console.error('❌ Failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
