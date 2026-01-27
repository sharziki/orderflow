import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Blu Bentonville Menu Data - Full extraction from official menu
const menuData = {
  tenant: {
    slug: 'blu-bentonville',
    name: 'Blu Fish House',
    email: 'orders@blubentonville.com',
    phone: '(479) 268-4609',
    address: '607 SE 5th St',
    city: 'Bentonville',
    state: 'AR',
    zip: '72712',
    timezone: 'America/Chicago',
    primaryColor: '#1e3a5f',
    secondaryColor: '#0ea5e9',
    template: 'modern',
    taxRate: 9.75, // Arkansas sales tax
    pickupEnabled: true,
    deliveryEnabled: false,
    isActive: true,
    isOnboarded: true,
  },
  categories: [
    { name: 'Popular', description: 'Customer favorites', sortOrder: 0 },
    { name: 'Family Meals', description: 'Back to School specials - Feeds 4-6', sortOrder: 1 },
    { name: 'Appetizers', description: 'Start your meal right', sortOrder: 2 },
    { name: 'Sandwiches & Tacos', description: 'Hand-held favorites', sortOrder: 3 },
    { name: 'Soup & Salad', description: 'Fresh and light options', sortOrder: 4 },
    { name: 'Catch of the Day', description: 'Fresh fish - Grilled, Fried, or Blackened with 2 sides', sortOrder: 5 },
    { name: 'Entrées', description: 'Signature dishes', sortOrder: 6 },
    { name: 'Pasta', description: 'House-made pasta dishes', sortOrder: 7 },
    { name: 'House Specialties', description: 'Chef\'s showcase', sortOrder: 8 },
    { name: 'Sushi Starters', description: 'Japanese appetizers', sortOrder: 9 },
    { name: 'Sushi Platters', description: 'Perfect for sharing', sortOrder: 10 },
    { name: 'Sashimi', description: 'Fresh sliced fish - 5 pieces each', sortOrder: 11 },
    { name: 'Cut Rolls', description: 'Classic and specialty rolls', sortOrder: 12 },
    { name: 'Go BLU', description: 'Quick lunch specials & DIY kits', sortOrder: 13 },
    { name: 'Fresh Fish Market', description: 'Premium fresh fish by the pound', sortOrder: 14 },
    { name: 'Sides', description: 'Perfect accompaniments', sortOrder: 15 },
  ],
  menuItems: {
    'Popular': [
      { name: 'Fish Taco', price: 7.00, description: 'Grilled, Fried or Blackened with cabbage, pico and Mexican crema', image: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=600' },
      { name: 'Blu Fin Tuna Stack', price: 19.00, description: 'Sushi quality Blue Fin Tuna layered over fresh snow crab, cucumber, avocado, and sushi rice. Topped with roasted sesame seed, spicy mayo and eel sauce.', image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600' },
      { name: 'Maryland Crab Cakes', price: 19.00, description: '2 freshly made crab cakes grilled or fried. Served with Blu\'s roasted red pepper aioli.', image: 'https://images.unsplash.com/photo-1559737558-2f5a35f4523b?w=600' },
      { name: 'Seafood Risotto', price: 22.00, description: 'Shrimp, mussels, parmesan, wine, cream, portobello mushrooms.', image: 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=600' },
      { name: 'Aoi Japanese Nachos', price: 18.00, description: 'Tuna and Salmon poke, wonton chips, jalapeños, sesame seeds, wasabi peas, onion, tobiko, spicy mayo, eel sauce', image: 'https://images.unsplash.com/photo-1553621042-f6e147245754?w=600' },
      { name: 'Fried Calamari', price: 17.00, description: 'Fried Calamari, carrots, zucchini, and red bell peppers. Served with our homemade cocktail sauce.', image: 'https://images.unsplash.com/photo-1604909052743-94e838986d24?w=600' },
    ],
    'Family Meals': [
      { name: 'Grilled Catfish Meal', price: 79.00, description: 'Grilled catfish, caper dill sauce, mash potatoes & roasted carrots. Feeds 4-6', image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600' },
      { name: 'Panko Crusted Shrimp Meal', price: 79.00, description: 'Panko crusted shrimp, house fries, coleslaw. Feeds 4-6', image: 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=600' },
      { name: 'Parmesan Crusted Snapper Meal', price: 79.00, description: 'Parmesan crusted snapper, lobster cream sauce, jasmine rice, zucchini n squash medley. Feeds 4-6', image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600' },
      { name: 'Chicken Alfredo Meal', price: 79.00, description: 'Chicken Alfredo, side salad & toast points. Feeds 4-6', image: 'https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=600' },
      { name: 'Shrimp n Grits Meal', price: 79.00, description: 'Shrimp n grits & a side salad. Feeds 4-6', image: 'https://images.unsplash.com/photo-1623653387945-2fd25214f8fc?w=600' },
    ],
    'Appetizers': [
      { name: 'Shrimp Cocktail', price: 15.00, description: '5 Wild Gulf shrimp served with house cocktail sauce. Gluten-Free.', image: 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=600' },
      { name: 'Smoked Salmon Dip', price: 14.00, description: 'House smoked King Salmon Dip served with Pita bread & cucumber. Gluten-Free upon request.', image: 'https://images.unsplash.com/photo-1485921325833-c519f76c4927?w=600' },
      { name: 'Aoi Japanese Nachos', price: 18.00, description: 'Tuna and Salmon poke, wonton chips, jalapeños, sesame seeds, wasabi peas, onion, tobiko, spicy mayo, eel sauce', image: 'https://images.unsplash.com/photo-1553621042-f6e147245754?w=600' },
      { name: 'Fried Lobster Ravioli', price: 21.00, description: 'Hand rolled pasta made fresh daily, stuffed with fresh, steamed lobster and tossed in Blu\'s creamy Vodka sauce then fried to perfection.', image: 'https://images.unsplash.com/photo-1587740908075-9e245070dfaa?w=600' },
      { name: 'New Orleans BBQ Shrimp', price: 21.00, description: '8 Jumbo Wild Gulf Shrimp sauteed and served in Blu\'s creamy BBQ sauce with toast points on the side.', image: 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=600' },
      { name: 'Crab Stuffed Wild Jumbo Prawns', price: 19.00, description: '3 Wild Jumbo Prawns stuffed with Maryland Blue Crab, tossed in panko breadcrumbs and fried. Topped with Blu\'s roasted red pepper aioli.', image: 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=600' },
      { name: 'Wild Coconut Shrimp', price: 16.00, description: '5 Wild Gulf Coconut Shrimp. Served with Blu\'s maple-chile sauce.', image: 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=600' },
      { name: 'Fried Calamari', price: 17.00, description: 'Fried Calamari, carrots, zucchini, and red bell peppers. Served with our homemade cocktail sauce.', image: 'https://images.unsplash.com/photo-1604909052743-94e838986d24?w=600' },
      { name: 'Steamed Clams', price: 19.00, description: 'Fresh, cold-water Clams lightly steamed in a lemon, white wine and garlic sauce. Served with freshly baked bread for dipping.', image: 'https://images.unsplash.com/photo-1560717789-0ac7c58ac90a?w=600' },
      { name: 'Steamed Mussels', price: 16.00, description: 'Fresh, cold-water Mussels lightly steamed in a lemon, white wine and garlic sauce. Served with freshly baked bread for dipping.', image: 'https://images.unsplash.com/photo-1560717789-0ac7c58ac90a?w=600' },
      { name: 'Grilled Maine Scallops', price: 35.00, description: '3 Jumbo dayboat Scallops. Served with Blu\'s honey-wasabi sauce. Gluten-Free.', image: 'https://images.unsplash.com/photo-1580217593608-61931cefc821?w=600' },
      { name: 'Maryland Crab Cakes', price: 19.00, description: '2 freshly made crab cakes grilled or fried. Served with Blu\'s roasted red pepper aioli.', image: 'https://images.unsplash.com/photo-1559737558-2f5a35f4523b?w=600' },
      { name: 'Tempura Veggies', price: 13.00, description: 'Served with Asian dipping sauce.', image: 'https://images.unsplash.com/photo-1587301669253-5d6a79e5e7b8?w=600' },
      { name: 'Blue Crab Hush Puppies', price: 11.00, description: '5 Blue Crab stuffed Hush Puppies. Served with our homemade Honey mustard sauce.', image: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=600' },
      { name: 'Edamame', price: 6.00, description: 'Edamame sautéed with fresh garlic & soy sauce.', image: 'https://images.unsplash.com/photo-1564894809611-1742fc40ed80?w=600' },
      { name: 'Blu Fin Tuna Stack', price: 19.00, description: 'Sushi quality Blue Fin Tuna layered over fresh snow crab, cucumber, avocado, and sushi rice. Topped with roasted sesame seed, spicy mayo and eel sauce.', image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600' },
    ],
    'Sandwiches & Tacos': [
      { name: 'Florida Grouper Sandwich', price: 21.00, description: 'House slaw, roasted pepper aioli. Grilled, Fried or Blackened with hand-cut chips & fresh baked daily bread.', image: 'https://images.unsplash.com/photo-1521305916504-4a1121188589?w=600' },
      { name: 'Lobster Roll', price: 28.00, description: 'Live Maine lobster', image: 'https://images.unsplash.com/photo-1559742811-822873691df8?w=600' },
      { name: 'Blu\'s Classic Southern Po\' Boy', price: 18.00, description: 'Served with lettuce, tomato and red pepper aioli.', image: 'https://images.unsplash.com/photo-1521305916504-4a1121188589?w=600' },
      { name: 'Fish Taco', price: 7.00, description: 'Grilled, Fried or Blackened with cabbage, pico and Mexican crema.', image: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=600' },
      { name: 'Chicken Taco', price: 7.00, description: 'Grilled, Fried or Blackened with cabbage, pico and Mexican crema.', image: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=600' },
      { name: 'Veggie Taco', price: 6.00, description: 'Grilled, Fried or Blackened with cabbage, pico and Mexican crema.', image: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=600' },
      { name: 'Wild Shrimp Taco', price: 8.00, description: 'Grilled, Fried or Blackened with cabbage, pico and Mexican crema.', image: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=600' },
      { name: 'Carne Asada Taco', price: 8.00, description: 'Grilled, Fried or Blackened with cabbage, pico and Mexican crema.', image: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=600' },
      { name: 'Original Fish Sandwich', price: 17.00, description: 'LTO, tartare sauce, cheese, cod', image: 'https://images.unsplash.com/photo-1521305916504-4a1121188589?w=600' },
    ],
    'Soup & Salad': [
      { name: 'Clam Chowder', price: 7.00, description: 'Cup or Bowl. Made from scratch with fresh clams.', image: 'https://images.unsplash.com/photo-1588566565463-180a5b2090d2?w=600' },
      { name: 'Lobster Bisque', price: 9.00, description: 'Cup or Bowl', image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600' },
      { name: 'Gumbo', price: 8.00, description: 'Cup or Bowl', image: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=600' },
      { name: 'Miso Soup', price: 4.00, description: 'Vegan, Gluten-Free', image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600' },
      { name: 'Blu House Salad', price: 14.00, description: 'Organic baby greens, avocado, tomato, bacon, eggs, croutons', image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600' },
      { name: 'Caesar Salad', price: 13.00, description: 'Romaine, croutons, parmesan, garlic, Anchovie dressing', image: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=600' },
    ],
    'Catch of the Day': [
      { name: 'Ahi Tuna', price: 41.00, description: 'Grilled, Fried or Blackened with your choice of 2 sides.', image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600' },
      { name: 'Salmon', price: 32.00, description: 'Grilled, Fried or Blackened with your choice of 2 sides.', image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=600' },
      { name: 'Red Snapper', price: 27.00, description: 'Grilled, Fried or Blackened with your choice of 2 sides.', image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600' },
      { name: 'Swordfish', price: 28.00, description: 'Grilled, Fried or Blackened with your choice of 2 sides.', image: 'https://images.unsplash.com/photo-1485921325833-c519f76c4927?w=600' },
      { name: 'Arkansas Catfish', price: 18.00, description: 'Grilled, Fried or Blackened with your choice of 2 sides.', image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600' },
      { name: 'Florida Grouper', price: 29.00, description: 'Grilled, Fried or Blackened with your choice of 2 sides.', image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600' },
      { name: 'Day Boat Scallops', price: 39.00, description: 'Grilled, Fried or Blackened with your choice of 2 sides.', image: 'https://images.unsplash.com/photo-1580217593608-61931cefc821?w=600' },
      { name: 'Wild Jumbo Shrimp', price: 22.00, description: 'Grilled, Fried or Blackened with your choice of 2 sides.', image: 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=600' },
      { name: 'Mahi-Mahi', price: 26.00, description: 'Grilled, Fried or Blackened with your choice of 2 sides.', image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600' },
      { name: 'Halibut', price: 32.00, description: 'Grilled, Fried or Blackened with your choice of 2 sides.', image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600' },
      { name: 'Shrimp & Mussels Paella', price: 32.00, description: 'Spanish rice, saffron, peas, homemade seafood stock', image: 'https://images.unsplash.com/photo-1534080564583-6be75777b70a?w=600' },
    ],
    'Entrées': [
      { name: 'New Orleans BBQ Shrimp & Grits', price: 21.00, description: 'Wild shrimp', image: 'https://images.unsplash.com/photo-1623653387945-2fd25214f8fc?w=600' },
      { name: 'Fish N\' Chips', price: 18.00, description: 'Beer battered, house chips, tartar sauce', image: 'https://images.unsplash.com/photo-1579208030886-b937da0925dc?w=600' },
      { name: 'Chicken Breast', price: 18.00, description: 'Grilled, fried or blackened with 2 sides', image: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=600' },
      { name: 'Hawaiian Poke Bowl', price: 15.00, description: 'Sushi rice, cucumbers, scallions, taro chips, avocado, sesame seeds', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600' },
      { name: 'Seafood Risotto', price: 22.00, description: 'Shrimp, mussels, parmesan, wine, cream, portobello mushrooms.', image: 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=600' },
      { name: 'Veggie Risotto', price: 17.00, description: 'Parmesan, wine, cream, portobello mushrooms', image: 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=600' },
    ],
    'Pasta': [
      { name: 'Cajun Alfredo Pasta', price: 23.00, description: 'Shrimp, sausage, fish, parmesan', image: 'https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=600' },
      { name: 'Homemade Lobster Raviolis', price: 29.00, description: 'Creamy vodka sauce, topped with grilled wild shrimp', image: 'https://images.unsplash.com/photo-1587740908075-9e245070dfaa?w=600' },
      { name: 'Lobster Mac N\' Cheese', price: 21.00, description: 'Cheddar, cream, parmesan & fresh lobster.', image: 'https://images.unsplash.com/photo-1543339494-b4cd4f7ba686?w=600' },
      { name: 'Seafood Linguine', price: 31.00, description: 'Shrimp, clams, mussels, crab, fish, garlic, parsley, tomato, extra virgin olive oil.', image: 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=600' },
      { name: 'Alfredo Pasta', price: 16.00, description: 'Your choice of no protein or Salmon, Shrimp, Chicken, or Veg.', image: 'https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=600' },
    ],
    'House Specialties': [
      { name: 'Chilled Seafood Tower', price: 129.00, description: 'Clams, Mussels, Wild Jumbo Shrimp, Alaskan Snow Crab, Maine Lobster, Oysters and Maine Scallops steamed, seasoned and chilled. Served with freshly made avocado salsa, homemade cocktail sauce, horseradish, butter & lemons.', image: 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=600' },
      { name: '"Seattle" Clambake', price: 64.00, description: 'Crab legs, Wild Shrimp, Clams and Mussels steamed and seasoned to perfection. Served with corn on the cob, potatoes, lemons, butter, and our Homemade cocktail sauce.', image: 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=600' },
      { name: '"Maine" Clambake', price: 79.00, description: 'Lobster, Wild Shrimp, Clams and Mussels steamed and seasoned to perfection. Served with corn on the cob, potatoes, lemons, butter, and our Homemade cocktail sauce.', image: 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=600' },
      { name: 'Live Maine Lobster', price: 49.00, description: 'Fresh live Maine lobster', image: 'https://images.unsplash.com/photo-1559737558-2f5a35f4523b?w=600' },
      { name: 'Alaskan Crab Legs', price: 45.00, description: 'Fresh Alaskan crab legs', image: 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=600' },
      { name: 'Wild Gulf Shrimp Peel N\' Eat', price: 18.00, description: 'Creole spiced, served warm with house cocktail sauce.', image: 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=600' },
      { name: 'Wild Gulf Popcorn Shrimp', price: 18.00, description: 'Battered and fried, served warm with house cocktail sauce.', image: 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=600' },
    ],
    'Sushi Starters': [
      { name: 'Sea Salt Edamame', price: 7.00, description: 'Lightly salted soybeans', image: 'https://images.unsplash.com/photo-1564894809611-1742fc40ed80?w=600' },
      { name: 'Garlic-Soy Edamame', price: 8.00, description: 'Edamame with garlic and soy', image: 'https://images.unsplash.com/photo-1564894809611-1742fc40ed80?w=600' },
      { name: 'Miso Soup', price: 4.00, description: 'Vegan, Gluten-Free', image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600' },
      { name: 'Seaweed Salad', price: 7.00, description: 'Traditional Japanese seaweed salad', image: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=600' },
      { name: 'Blu Chirashi', price: 26.00, description: 'Sashimi with ika, seaweed & cucumber salad over sushi rice with housemade ponzu.', image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600' },
      { name: 'Ika (Squid) Salad', price: 8.00, description: 'Fresh squid salad', image: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=600' },
      { name: 'Crudo Martini', price: 20.00, description: 'Salmon, tuna, yellowtail, crab, seaweed salad, lettuce, ponzu sauce.', image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600' },
      { name: 'Blue Fin Tuna Stack', price: 19.00, description: 'Sushi rice, snow crab, cucumber, avocado, spicy sauce, eel sauce', image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600' },
      { name: 'Salmon Stack', price: 19.00, description: 'Sushi rice, snow crab, cucumber, avocado, spicy sauce, eel sauce', image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600' },
    ],
    'Sushi Platters': [
      { name: 'Chef\'s Choice Platter - Nigiri', price: 21.00, description: 'Chef\'s selection of fresh nigiri', image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600' },
      { name: 'Chef\'s Choice Platter - Sashimi', price: 25.00, description: 'Chef\'s selection of fresh sashimi', image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600' },
      { name: 'Lil\' Blu', price: 44.00, description: 'ROLLS: California / Spicy Tuna / Shaggy Dog | NIGIRI: Shrimp / Salmon', image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600' },
      { name: 'Small Sushi Boat', price: 61.00, description: '18 Sashimi pieces, rainbow roll, yellowtail nigiri', image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600' },
      { name: 'Large Sushi Boat (Pre-Order)', price: 105.00, description: '18 Sashimi pieces, 10 nigiri pieces, chef choice roll, seaweed salad, 3 miso soups', image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600' },
    ],
    'Sashimi': [
      { name: 'Tuna Sashimi', price: 20.00, description: '5 pieces of fresh tuna', image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600' },
      { name: 'White Tuna Sashimi', price: 18.00, description: '5 pieces of white tuna', image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600' },
      { name: 'Salmon Belly Sashimi', price: 18.00, description: '5 pieces of salmon belly', image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600' },
      { name: 'Yellowtail Sashimi', price: 18.00, description: '5 pieces of yellowtail', image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600' },
      { name: 'Shrimp Sashimi', price: 14.00, description: '5 pieces of shrimp', image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600' },
      { name: 'Octopus Sashimi', price: 18.00, description: '5 pieces of octopus', image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600' },
      { name: 'Mackerel Sashimi', price: 15.00, description: '5 pieces of mackerel', image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600' },
      { name: 'Eel Sashimi', price: 17.00, description: '5 pieces of eel', image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600' },
      { name: 'Scallop Sashimi', price: 20.00, description: '5 pieces of scallop', image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600' },
    ],
    'Cut Rolls': [
      { name: 'California Roll', price: 8.00, description: 'With sesame seeds', image: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=600' },
      { name: 'Golden California Roll', price: 11.00, description: 'With sesame seeds, tempura style', image: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=600' },
      { name: 'Spicy Roll', price: 8.00, description: 'Cucumber, scallions, with your choice of Tuna, Salmon, Yellowtail or Crab.', image: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=600' },
      { name: 'Rainbow Roll', price: 20.00, description: 'Crab, avocado, cucumber with Tuna, eel, salmon, yellowtail, avocado on top.', image: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=600' },
      { name: 'Eel Roll', price: 10.00, description: 'Eel, avocado, cucumber, eel sauce.', image: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=600' },
      { name: 'Tekkamaki Roll', price: 5.00, description: 'Made with your choice of Tuna, Salmon, Yellowtail, Veggie, Avocado or Cucumber.', image: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=600' },
      { name: 'Philly Roll', price: 10.00, description: 'House smoked wild salmon, avocado, cream cheese.', image: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=600' },
      { name: 'Spider Roll', price: 17.00, description: 'Tempura soft shell crab, avocado, cucumber, scallions, eel sauce', image: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=600' },
      { name: 'Crunchy Tempura Shrimp Roll', price: 10.00, description: 'Tempura shrimp, avocado, crab, crunch.', image: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=600' },
      { name: 'Alaskan Roll', price: 15.00, description: 'Crab, salmon, avocado.', image: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=600' },
      { name: 'Miami Roll', price: 15.00, description: 'Tuna, avocado', image: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=600' },
      { name: 'Hand Roll Combo', price: 20.00, description: 'Choose 2: Spicy tuna, yellowtail, crab or salmon', image: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=600' },
    ],
    'Go BLU': [
      { name: 'Bento Box', price: 19.99, description: 'Spicy Tuna Roll, Sushi Rice, 3 Jumbo Royal Red Shrimp, Ika Salad, Edamame, Ginger & Wasabi. Available 11am-2pm Tue-Fri.', image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600' },
      { name: 'DIY Sushi Kit', price: 45.00, description: 'Includes 2 rolling mats, Edamame, Wasabi, Ginger, Spicy Mayo, Eel Sauce, and everything for 4 rolls. Saturdays only pickup.', image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600' },
      { name: 'Poke Kit for 2', price: 29.98, description: 'Your choice of Salmon or Tuna, Rice, Seaweed Salad, Carrots, Cucumbers, Homemade Poke Sauce, Wonton Chips, Scallions, Sesame Seeds & Wasabi.', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600' },
      { name: 'BBQ Shrimp and Grits Kit for 2', price: 38.00, description: 'Includes our homemade BBQ sauce, Spices, Jumbo Royal Red Shrimp and everything you need to make Blu\'s Recipe.', image: 'https://images.unsplash.com/photo-1623653387945-2fd25214f8fc?w=600' },
    ],
    'Fresh Fish Market': [
      { name: 'Bluefin Tuna (per lb)', price: 34.95, description: 'Sushi grade tuna with mild, delicate flavor and meaty texture. High in omega-3 fatty acids.', image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600' },
      { name: 'Swordfish (per lb)', price: 22.95, description: 'Wild caught from George\'s Banks. Deliciously fatty with mild, sweet taste. The Steak of the Sea.', image: 'https://images.unsplash.com/photo-1485921325833-c519f76c4927?w=600' },
      { name: 'Icelandic Cod (per lb)', price: 22.50, description: 'Wild caught from deep, cold waters off Iceland. White flaky fish with mild, sweet flavor.', image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600' },
      { name: 'Haddock (per lb)', price: 17.95, description: 'Firm and tender texture with mild, slightly sweet flavor.', image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600' },
      { name: 'Amberjack (per lb)', price: 23.95, description: 'From Florida coast. Firm but flaky texture with mild, sweet and buttery flavor.', image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600' },
      { name: 'Corvina (per lb)', price: 24.50, description: 'The King of Ceviche. Light, chunky, mild fish from Panama.', image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600' },
      { name: 'Walleye (per lb)', price: 22.50, description: 'Freshwater fish from Lake Winnipeg, Canada. Subtle, sweet flavor.', image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600' },
      { name: 'Catfish (per lb)', price: 12.95, description: 'Southern staple. Crispy outside, moist inside.', image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600' },
      { name: 'Salmon (per lb)', price: 18.95, description: 'Fresh from North Atlantic. Beautiful marbling with rich, oily, aromatic flavor.', image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=600' },
      { name: 'Snow Crab (per lb)', price: 19.75, description: 'Sweet flavor with tender, flaky, snow-white meat.', image: 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=600' },
      { name: 'Mussels (per lb)', price: 10.95, description: 'Mild ocean flavor with faintly sweet, mushroom-like undertones.', image: 'https://images.unsplash.com/photo-1560717789-0ac7c58ac90a?w=600' },
      { name: 'Little Neck Clams (per lb)', price: 13.95, description: 'Fresh little neck clams', image: 'https://images.unsplash.com/photo-1560717789-0ac7c58ac90a?w=600' },
      { name: 'Maine Scallops (per lb)', price: 39.95, description: 'Pillowy white shellfish with buttery and rich sweet ocean flavor.', image: 'https://images.unsplash.com/photo-1580217593608-61931cefc821?w=600' },
      { name: 'Monkfish (per lb)', price: 17.95, description: 'The "poor man\'s lobster" - similar taste and texture at affordable cost.', image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600' },
      { name: 'Halibut (per lb)', price: 25.50, description: 'King of flatfish! Beautiful white, glossy flesh with gentle flavor.', image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600' },
      { name: 'Live Maine Lobsters (per lb)', price: 25.95, description: 'Live or steamed', image: 'https://images.unsplash.com/photo-1559737558-2f5a35f4523b?w=600' },
      { name: 'Chilean Seabass (per lb)', price: 39.95, description: 'Mild, delicate flavor with buttery, tender, flaky texture. One of the most sought-after fish.', image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600' },
      { name: 'Calamari (per lb)', price: 12.95, description: 'Firm, mildly sweet flesh with chewy texture. Perfect for frying.', image: 'https://images.unsplash.com/photo-1604909052743-94e838986d24?w=600' },
      { name: 'Smoked Salmon (per lb)', price: 28.95, description: 'Blu\'s Special Smoked Salmon. Marinated 24 hours, smoked over apple wood.', image: 'https://images.unsplash.com/photo-1485921325833-c519f76c4927?w=600' },
      { name: 'Maine Lobster Tails (6 oz)', price: 19.95, description: '6 oz Maine Lobster Tails', image: 'https://images.unsplash.com/photo-1559737558-2f5a35f4523b?w=600' },
      { name: 'Red Snapper Whole (per lb)', price: 14.95, description: 'Fresh from Florida. Firm texture with sweet, nutty flavor.', image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600' },
      { name: 'Grouper - Florida (per lb)', price: 24.95, description: 'Firm yet tender with succulent, flaky texture and slightly sweet undertones.', image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600' },
      { name: 'Mahi-Mahi (per lb)', price: 19.95, description: 'Mild, slightly sweet flavor with moderately firm texture.', image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600' },
      { name: 'Large Wild Gulf Shrimps (per lb)', price: 16.95, description: '16-20 per pound', image: 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=600' },
      { name: 'Medium Wild Gulf Shrimp (per lb)', price: 14.95, description: '31-35 per pound', image: 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=600' },
      { name: 'Canadian King Organic Salmon (per lb)', price: 25.95, description: 'Premium organic salmon from Canada', image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=600' },
      { name: 'Oysters (each)', price: 3.25, description: 'Fresh oysters', image: 'https://images.unsplash.com/photo-1560717789-0ac7c58ac90a?w=600' },
      { name: 'Lump Crab Meat (per lb)', price: 39.50, description: 'Premium lump crab meat', image: 'https://images.unsplash.com/photo-1559737558-2f5a35f4523b?w=600' },
    ],
    'Sides': [
      { name: 'House-Cut Chips', price: 6.00, description: 'Fresh hand-cut chips', image: 'https://images.unsplash.com/photo-1576107232684-1279f390859f?w=600' },
      { name: 'Hush Puppies', price: 6.00, description: 'Southern-style hush puppies', image: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=600' },
      { name: 'House Pineapple Slaw', price: 6.00, description: 'Fresh coleslaw with pineapple', image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600' },
      { name: 'Veggies', price: 6.00, description: 'Seasonal vegetables', image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600' },
      { name: 'Side Salad', price: 6.00, description: 'Fresh garden salad', image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600' },
      { name: 'Rice Pilaf', price: 6.00, description: 'Seasoned rice pilaf', image: 'https://images.unsplash.com/photo-1516714435131-44d6b64dc6a2?w=600' },
      { name: 'Mash Potatoes', price: 6.00, description: 'Creamy mashed potatoes', image: 'https://images.unsplash.com/photo-1600326145359-3a44909d1a39?w=600' },
      { name: 'Sushi Rice', price: 4.50, description: 'Japanese-style sushi rice', image: 'https://images.unsplash.com/photo-1516714435131-44d6b64dc6a2?w=600' },
    ],
  }
};

async function seed() {
  console.log('🐟 Seeding Blu Bentonville menu...\n');

  // Delete existing tenant if exists
  const existingTenant = await prisma.tenant.findUnique({
    where: { slug: 'blu-bentonville' }
  });

  if (existingTenant) {
    console.log('Deleting existing tenant...');
    await prisma.tenant.delete({ where: { id: existingTenant.id } });
  }

  // Create tenant
  console.log('Creating tenant: Blu Fish House...');
  const tenant = await prisma.tenant.create({
    data: menuData.tenant
  });
  console.log(`✅ Tenant created: ${tenant.id}\n`);

  // Create admin user
  console.log('Creating admin user...');
  const passwordHash = await bcrypt.hash('BluAdmin2024!', 10);
  await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: 'admin@blubentonville.com',
      passwordHash,
      name: 'Blu Admin',
      role: 'owner',
      emailVerified: true,
    }
  });
  console.log('✅ Admin user created: admin@blubentonville.com\n');

  // Create categories
  console.log('Creating categories...');
  const categoryMap: Record<string, string> = {};
  
  for (const cat of menuData.categories) {
    const category = await prisma.category.create({
      data: {
        tenantId: tenant.id,
        name: cat.name,
        description: cat.description,
        sortOrder: cat.sortOrder,
        isActive: true,
      }
    });
    categoryMap[cat.name] = category.id;
    console.log(`  ✅ ${cat.name}`);
  }
  console.log('');

  // Create menu items
  console.log('Creating menu items...');
  let totalItems = 0;
  
  for (const [categoryName, items] of Object.entries(menuData.menuItems)) {
    const categoryId = categoryMap[categoryName];
    if (!categoryId) {
      console.log(`  ⚠️  Category not found: ${categoryName}`);
      continue;
    }
    
    console.log(`\n  📂 ${categoryName}:`);
    let sortOrder = 0;
    
    for (const item of items) {
      await prisma.menuItem.create({
        data: {
          tenantId: tenant.id,
          categoryId,
          name: item.name,
          description: item.description || null,
          price: item.price,
          image: item.image || null,
          isAvailable: true,
          sortOrder: sortOrder++,
        }
      });
      console.log(`    ✅ ${item.name} - $${item.price.toFixed(2)}`);
      totalItems++;
    }
  }

  console.log(`\n\n🎉 Seeding complete!`);
  console.log(`   Tenant: ${tenant.name} (${tenant.slug})`);
  console.log(`   Categories: ${Object.keys(categoryMap).length}`);
  console.log(`   Menu Items: ${totalItems}`);
  console.log(`\n   Admin Login:`);
  console.log(`   Email: admin@blubentonville.com`);
  console.log(`   Password: BluAdmin2024!`);
  console.log(`\n   Access at: http://localhost:3000/${tenant.slug}`);
}

seed()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
