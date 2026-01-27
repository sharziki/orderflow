/**
 * Seed script for Blu Fish House menu items
 * Run with: npx tsx lib/seed.ts
 *
 * Note: This script uses Supabase for database operations
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { createId } from '@paralleldrive/cuid2'

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') })
config({ path: resolve(process.cwd(), '.env') })

import { supabase } from './supabase'

// Image path helper - maps to local images
const img = (name: string) => `/images/menu/${name}`

// Curated web images for items without local photos
const webImg = {
  // Appetizers
  bbqShrimp: "https://images.unsplash.com/photo-1559742811-822873691df8?w=800&h=600&fit=crop", // BBQ shrimp
  coconutShrimp: "https://images.unsplash.com/photo-1626804475297-41608ea09aeb?w=800&h=600&fit=crop", // coconut shrimp
  yellowtailCarpaccio: "https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?w=800&h=600&fit=crop", // fish carpaccio
  
  // Soups
  lobsterBisque: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&h=600&fit=crop", // creamy soup
  gumbo: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=800&h=600&fit=crop", // gumbo
  
  // Sandwiches
  poboy: "https://images.unsplash.com/photo-1619096252214-ef06c45683e3?w=800&h=600&fit=crop", // po'boy sandwich
  
  // Sushi Rolls - variety of beautiful sushi images
  sushiRoll1: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800&h=600&fit=crop", // sushi roll
  sushiRoll2: "https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=800&h=600&fit=crop", // premium sushi
  sushiRoll3: "https://images.unsplash.com/photo-1611143669185-af224c5e3252?w=800&h=600&fit=crop", // sushi platter
  sushiRoll4: "https://images.unsplash.com/photo-1553621042-f6e147245754?w=800&h=600&fit=crop", // maki roll
  sushiRoll5: "https://images.unsplash.com/photo-1562802378-063ec186a863?w=800&h=600&fit=crop", // sushi roll close
  spicyRoll: "https://images.unsplash.com/photo-1617196034183-421b4917c92d?w=800&h=600&fit=crop", // spicy tuna roll
  eelRoll: "https://images.unsplash.com/photo-1580822184713-fc5400e7fe10?w=800&h=600&fit=crop", // eel/unagi roll
  spiderRoll: "https://images.unsplash.com/photo-1559410545-0bdcd187e0a6?w=800&h=600&fit=crop", // soft shell crab roll
  tempuraRoll: "https://images.unsplash.com/photo-1617196035303-039a00085100?w=800&h=600&fit=crop", // tempura roll
  handRoll: "https://images.unsplash.com/photo-1582450871972-ab5ca641643d?w=800&h=600&fit=crop", // hand roll/temaki
  
  // Nigiri & Sashimi
  yellowtailNigiri: "https://images.unsplash.com/photo-1583623025817-d180a2221d0a?w=800&h=600&fit=crop", // yellowtail nigiri
  mackerelNigiri: "https://images.unsplash.com/photo-1615361200141-f45040f367be?w=800&h=600&fit=crop", // mackerel sushi
  flukeNigiri: "https://images.unsplash.com/photo-1534482421-64566f976cfa?w=800&h=600&fit=crop", // white fish nigiri
  salmonRoe: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800&h=600&fit=crop", // ikura/salmon roe
  tobiko: "https://images.unsplash.com/photo-1607301405390-d831c242f59b?w=800&h=600&fit=crop", // tobiko
  whiteTunaSashimi: "https://images.unsplash.com/photo-1535399831218-d5bd36d1a6b3?w=800&h=600&fit=crop", // white tuna
  yellowtailSashimi: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800&h=600&fit=crop", // yellowtail sashimi
  shrimpSashimi: "https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=800&h=600&fit=crop", // shrimp/ebi
  mackerelSashimi: "https://images.unsplash.com/photo-1580822184713-fc5400e7fe10?w=800&h=600&fit=crop", // mackerel
  eelSashimi: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800&h=600&fit=crop", // unagi
  
  // Starters & Salads
  squidSalad: "https://images.unsplash.com/photo-1559847844-5315695dadae?w=800&h=600&fit=crop", // squid/calamari salad
  crudoMartini: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800&h=600&fit=crop", // seafood crudo
  chirashi: "https://images.unsplash.com/photo-1580822184713-fc5400e7fe10?w=800&h=600&fit=crop", // chirashi bowl
  
  // Platters
  sushiPlatter: "https://images.unsplash.com/photo-1553621042-f6e147245754?w=800&h=600&fit=crop", // sushi platter
  sushiBoat: "https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=800&h=600&fit=crop", // sushi boat
  
  // Entrees
  shrimpGrits: "https://images.unsplash.com/photo-1633504581786-316c8002b1b9?w=800&h=600&fit=crop", // shrimp and grits
  pokeBowl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=600&fit=crop", // poke bowl
  
  // House Specialties
  seafoodTower: "https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=800&h=600&fit=crop", // seafood tower
  clambake: "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&h=600&fit=crop", // clambake/seafood boil
  popcornShrimp: "https://images.unsplash.com/photo-1626804475297-41608ea09aeb?w=800&h=600&fit=crop", // fried shrimp
  
  // Go Blu Kits
  sushiKit: "https://images.unsplash.com/photo-1553621042-f6e147245754?w=800&h=600&fit=crop", // sushi making
  pokeKit: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=600&fit=crop", // poke ingredients
  
  // Sides
  hushPuppies: "https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=800&h=600&fit=crop", // hush puppies/fried
}

// Secondary/hover images by category - beautiful close-ups and alternate angles
const hoverImg = {
  // Sushi & Rolls - close-ups and plating shots
  sushi1: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800&h=600&fit=crop",
  sushi2: "https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=800&h=600&fit=crop",
  sushi3: "https://images.unsplash.com/photo-1611143669185-af224c5e3252?w=800&h=600&fit=crop",
  sushi4: "https://images.unsplash.com/photo-1553621042-f6e147245754?w=800&h=600&fit=crop",
  sushi5: "https://images.unsplash.com/photo-1562802378-063ec186a863?w=800&h=600&fit=crop",
  sushi6: "https://images.unsplash.com/photo-1617196034183-421b4917c92d?w=800&h=600&fit=crop",
  sushi7: "https://images.unsplash.com/photo-1580822184713-fc5400e7fe10?w=800&h=600&fit=crop",
  sushi8: "https://images.unsplash.com/photo-1559410545-0bdcd187e0a6?w=800&h=600&fit=crop",
  
  // Seafood - grilled, plated, raw
  seafood1: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=800&h=600&fit=crop",
  seafood2: "https://images.unsplash.com/photo-1535399831218-d5bd36d1a6b3?w=800&h=600&fit=crop",
  seafood3: "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&h=600&fit=crop",
  seafood4: "https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=800&h=600&fit=crop",
  seafood5: "https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?w=800&h=600&fit=crop",
  seafood6: "https://images.unsplash.com/photo-1559742811-822873691df8?w=800&h=600&fit=crop",
  
  // Fish fillets & steaks
  fish1: "https://images.unsplash.com/photo-1510130387422-82bed34b37e9?w=800&h=600&fit=crop",
  fish2: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=600&fit=crop",
  fish3: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800&h=600&fit=crop",
  fish4: "https://images.unsplash.com/photo-1485921325833-c519f76c4927?w=800&h=600&fit=crop",
  
  // Shrimp & shellfish
  shrimp1: "https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=800&h=600&fit=crop",
  shrimp2: "https://images.unsplash.com/photo-1559742811-822873691df8?w=800&h=600&fit=crop",
  shrimp3: "https://images.unsplash.com/photo-1626804475297-41608ea09aeb?w=800&h=600&fit=crop",
  
  // Tacos & sandwiches
  taco1: "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=800&h=600&fit=crop",
  taco2: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&h=600&fit=crop",
  sandwich1: "https://images.unsplash.com/photo-1619096252214-ef06c45683e3?w=800&h=600&fit=crop",
  
  // Soups & salads
  soup1: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&h=600&fit=crop",
  salad1: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&h=600&fit=crop",
  salad2: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&h=600&fit=crop",
  
  // Pasta & rice
  pasta1: "https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=800&h=600&fit=crop",
  pasta2: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800&h=600&fit=crop",
  risotto1: "https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=800&h=600&fit=crop",
  
  // Fried items
  fried1: "https://images.unsplash.com/photo-1562967914-608f82629710?w=800&h=600&fit=crop",
  fried2: "https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=800&h=600&fit=crop",
  
  // Sides
  chips1: "https://images.unsplash.com/photo-1518013431117-eb1465fa5752?w=800&h=600&fit=crop",
  veggies1: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&h=600&fit=crop",
  rice1: "https://images.unsplash.com/photo-1516684732162-798a0062be99?w=800&h=600&fit=crop",
  
  // Lobster & crab
  lobster1: "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&h=600&fit=crop",
  crab1: "https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=800&h=600&fit=crop",
}

async function main() {
  console.log('Seeding Blu Fish House menu items...')

  // Clear existing data
  console.log('Clearing existing data...')
  await (supabase.from('order_items') as any).delete().neq('id', '')
  await (supabase.from('orders') as any).delete().neq('id', '')
  await (supabase.from('customers') as any).delete().neq('id', '')
  await (supabase.from('menu_items') as any).delete().neq('id', '')

  const menuItems = [
    // ═══════════════════════════════════════════════════════════════════════════
    // POPULAR ITEMS
    // ═══════════════════════════════════════════════════════════════════════════
    {
      name: "Shaggy Dog Roll",
      description: "Tempura shrimp, crab, avocado / Shredded crab, eel sauce, spicy mayo on top",
      price: 17.00,
      category: "Popular",
      image: img("Shaggy Dog Roll.webp"),
      available: true
    },
    {
      name: "Blu Fin Tuna Stack",
      description: "Sushi quality Blue Fin Tuna layered over fresh snow crab, cucumber, avocado, and sushi rice. Topped with roasted sesame seed, spicy mayo and eel sauce.",
      price: 19.00,
      category: "Popular",
      image: img("Blue Fin Tuna Stack.webp"),
      available: true
    },
    {
      name: "Maryland Crab Cakes",
      description: "2 freshly made crab cakes grilled or fried. Served with Blu's roasted red pepper aioli.",
      price: 19.00,
      category: "Popular",
      image: img("Maryland Crab Cakes .webp"),
      available: true
    },
    {
      name: "Fried Calamari",
      description: "Fried Calamari, carrots, zucchini, and red bell peppers. Served with our homemade cocktail sauce.",
      price: 17.00,
      category: "Popular",
      image: img("Fried Calamari.webp"),
      available: true
    },
    {
      name: "Fish Taco",
      description: "Grilled, Fried or Blackened with cabbage, pico and Mexican crema.",
      price: 7.00,
      category: "Popular",
      image: img("Fish Taco.webp"),
      available: true
    },
    {
      name: "Seafood Risotto",
      description: "Shrimp, mussels, parmesan, wine, cream, portobello mushrooms.",
      price: 22.00,
      category: "Popular",
      image: img("Seafood Rissotto.webp"),
      available: true
    },
    {
      name: "Aoi Japanese Nachos",
      description: "Tuna and Salmon poke, wonton chips, jalapeños, sesame seeds, wasabi peas, onion, tobiko, spicy mayo, eel sauce",
      price: 18.00,
      category: "Popular",
      image: img("Aoi Japanese Nachos .webp"),
      available: true
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // APPETIZERS
    // ═══════════════════════════════════════════════════════════════════════════
    {
      name: "Shrimp Cocktail (GF)",
      description: "5 Wild Gulf shrimp served with house cocktail sauce • Gluten-Free.",
      price: 15.00,
      category: "Appetizers",
      image: img("Shrimp Cocktail (GF).webp"),
      available: true
    },
    {
      name: "Blue Fin Tuna Carpaccio",
      description: "Blue Fin Tuna slices served in a lemon and extra virgin olive oil blend then topped with capers and microgreens • Gluten-Free.",
      price: 22.00,
      category: "Appetizers",
      image: img("Blue Fin Tuna Carpaccio.webp"),
      available: true
    },
    {
      name: "Smoked Salmon Dip",
      description: "House smoked King Salmon Dip served with Pita bread & cucumber • Gluten-Free upon request.",
      price: 14.00,
      category: "Appetizers",
      image: img("Smoked Salmon.webp"),
      available: true
    },
    {
      name: "Fried Lobster Ravioli",
      description: "Hand rolled pasta made fresh daily, stuffed with fresh, steamed lobster and tossed in Blu's creamy Vodka sauce then fried to perfection.",
      price: 21.00,
      category: "Appetizers",
      image: img("Homemade Lobster Raviolis.webp"),
      available: true
    },
    {
      name: "New Orleans BBQ Shrimp",
      description: "8 Jumbo Wild Gulf Shrimp sauteed and served in Blu's creamy BBQ sauce with toast points on the side.",
      price: 21.00,
      category: "Appetizers",
      image: webImg.bbqShrimp,
      available: true
    },
    {
      name: "Crab Stuffed Wild Jumbo Prawns",
      description: "3 Wild Jumbo Prawns stuffed with Maryland Blue Crab, tossed in panko breadcrumbs and fried. Topped and served with Blu's roasted red pepper aioli.",
      price: 19.00,
      category: "Appetizers",
      image: img("Crab Stuffed Wild Jumbo Prawns.webp"),
      available: true
    },
    {
      name: "Wild Coconut Shrimp",
      description: "5 Wild Gulf Coconut Shrimp. Served with Blu's maple-chile sauce.",
      price: 16.00,
      category: "Appetizers",
      image: webImg.coconutShrimp,
      available: true
    },
    {
      name: "Steamed Clams",
      description: "Fresh, cold-water Clams lightly steamed in a lemon, white wine and garlic sauce. Served with freshly baked bread for dipping.",
      price: 19.00,
      category: "Appetizers",
      image: img("Little Neck Clams .webp"),
      available: true
    },
    {
      name: "Steamed Mussels",
      description: "Fresh, cold-water Mussels lightly steamed in a lemon, white wine and garlic sauce. Served with freshly baked bread for dipping.",
      price: 16.00,
      category: "Appetizers",
      image: img("Mussels.webp"),
      available: true
    },
    {
      name: "Grilled Maine Scallops (GF)",
      description: "3 Jumbo dayboat Scallops. Served with Blu's honey-wasabi sauce. • Gluten-Free.",
      price: 35.00,
      category: "Appetizers",
      image: img("Grilled Maine Scallops (GF).webp"),
      available: true
    },
    {
      name: "Tempura Veggies",
      description: "Served with Asian dipping sauce.",
      price: 13.00,
      category: "Appetizers",
      image: img("Tempura Veggies .webp"),
      available: true
    },
    {
      name: "Blue Crab Hush Puppies",
      description: "5 Blue Crab stuffed Hush Puppies. Served with our homemade Honey mustard sauce.",
      price: 11.00,
      category: "Appetizers",
      image: img("Blue Crab Hush Puppies.webp"),
      available: true
    },
    {
      name: "Edamame",
      description: "Edamame sautéed with fresh garlic & soy sauce.",
      price: 6.00,
      category: "Appetizers",
      image: img("Edamame.webp"),
      available: true
    },
    {
      name: "Yellowtail Carpaccio",
      description: "Japanese Yellowtail slices served in a lemon and extra virgin olive oil blend then topped with capers and microgreens • Gluten-Free.",
      price: 22.00,
      category: "Appetizers",
      image: webImg.yellowtailCarpaccio,
      available: true
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // SANDWICHES/TACOS
    // ═══════════════════════════════════════════════════════════════════════════
    {
      name: "Florida Grouper Sandwich",
      description: "House slaw, roasted pepper aioli • Grilled, Fried or Blackened with hand-cut chips & fresh baked daily.",
      price: 21.00,
      category: "Sandwiches/Tacos",
      image: img("Florida Grouper Sandwich.webp"),
      available: true
    },
    {
      name: "Lobster Roll",
      description: "Live Maine lobster",
      price: 28.00,
      category: "Sandwiches/Tacos",
      image: img("Lobster Roll.webp"),
      available: true
    },
    {
      name: "Blu's Classic Southern Po' Boy's",
      description: "Served with lettuce, tomato and red pepper aioli.",
      price: 18.00,
      category: "Sandwiches/Tacos",
      image: webImg.poboy,
      available: true
    },
    {
      name: "Chicken Taco",
      description: "Grilled, Fried or Blackened with cabbage, pico and Mexican crema.",
      price: 7.00,
      category: "Sandwiches/Tacos",
      image: img("Chicken Taco.webp"),
      available: true
    },
    {
      name: "Veggie Taco",
      description: "Grilled, Fried or Blackened with cabbage, pico and Mexican crema.",
      price: 6.00,
      category: "Sandwiches/Tacos",
      image: img("Veggies.webp"),
      available: true
    },
    {
      name: "Wild Shrimp Taco",
      description: "Grilled, Fried or Blackened with cabbage, pico and Mexican crema.",
      price: 8.00,
      category: "Sandwiches/Tacos",
      image: img("Wild Shrimp Taco.webp"),
      available: true
    },
    {
      name: "Carne Asada Taco",
      description: "Grilled, Fried or Blackened with cabbage, pico and Mexican crema.",
      price: 8.00,
      category: "Sandwiches/Tacos",
      image: img("Carne Asada Taco.webp"),
      available: true
    },
    {
      name: "Original Fish Sandwich",
      description: "LTO, tartare sauce, cheese, cod",
      price: 17.00,
      category: "Sandwiches/Tacos",
      image: img("Original Fish Sandwich.webp"),
      available: true
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // SOUP/SALAD
    // ═══════════════════════════════════════════════════════════════════════════
    {
      name: "Clam Chowder",
      description: "Cup or Bowl • Made from scratch with fresh clams.",
      price: 7.00,
      category: "Soup/Salad",
      image: img("Clam Chowder.webp"),
      available: true
    },
    {
      name: "Lobster Bisque",
      description: "Cup or Bowl",
      price: 9.00,
      category: "Soup/Salad",
      image: webImg.lobsterBisque,
      available: true
    },
    {
      name: "Gumbo",
      description: "Cup or Bowl",
      price: 8.00,
      category: "Soup/Salad",
      image: webImg.gumbo,
      available: true
    },
    {
      name: "Miso Soup (V, GF)",
      description: "Vegetarian and Gluten-Free",
      price: 4.00,
      category: "Soup/Salad",
      image: img("Miso Soup (V, GF).webp"),
      available: true
    },
    {
      name: "Blu House Salad",
      description: "Organic baby greens, avocado, tomato, bacon, eggs, croutons",
      price: 14.00,
      category: "Soup/Salad",
      image: img("Side Salad.webp"),
      available: true
    },
    {
      name: "Caesar Salad",
      description: "Romaine, croutons, parmesan, garlic, Anchovie dressing",
      price: 13.00,
      category: "Soup/Salad",
      image: img("Ceasar Salad.webp"),
      available: true
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // CATCH OF THE DAY
    // ═══════════════════════════════════════════════════════════════════════════
    {
      name: "Ahi Tuna",
      description: "Grilled, Fried or Blackened with your choice of 2 sides.",
      price: 41.00,
      category: "Catch Of The Day",
      image: img("Ahi Tuna.webp"),
      available: true
    },
    {
      name: "Salmon",
      description: "Grilled, Fried or Blackened with your choice of 2 sides.",
      price: 32.00,
      category: "Catch Of The Day",
      image: img("Salmon.webp"),
      available: true
    },
    {
      name: "Red Snapper",
      description: "Grilled, Fried or Blackened with your choice of 2 sides.",
      price: 27.00,
      category: "Catch Of The Day",
      image: img("Red Snapper Whole.webp"),
      available: true
    },
    {
      name: "Swordfish",
      description: "Grilled, Fried or Blackened with your choice of 2 sides.",
      price: 28.00,
      category: "Catch Of The Day",
      image: img("Swordfish.webp"),
      available: true
    },
    {
      name: "Arkansas Catfish",
      description: "Grilled, Fried or Blackened with your choice of 2 sides.",
      price: 18.00,
      category: "Catch Of The Day",
      image: img("Catfish.webp"),
      available: true
    },
    {
      name: "Florida Grouper",
      description: "Grilled, Fried or Blackened with your choice of 2 sides.",
      price: 29.00,
      category: "Catch Of The Day",
      image: img("Florida Grouper.webp"),
      available: true
    },
    {
      name: "Day Boat Scallops",
      description: "Grilled, Fried or Blackened with your choice of 2 sides.",
      price: 39.00,
      category: "Catch Of The Day",
      image: img("Grilled Maine Scallops (GF).webp"),
      available: true
    },
    {
      name: "Wild Jumbo Shrimp",
      description: "Grilled, Fried or Blackened with your choice of 2 sides.",
      price: 22.00,
      category: "Catch Of The Day",
      image: img("Wild Jumbo Shrimp.webp"),
      available: true
    },
    {
      name: "Mahi-Mahi",
      description: "Grilled, Fried or Blackened with your choice of 2 sides.",
      price: 26.00,
      category: "Catch Of The Day",
      image: img("Mahi-Mahi.webp"),
      available: true
    },
    {
      name: "Halibut",
      description: "Grilled, Fried or Blackened with your choice of 2 sides.",
      price: 32.00,
      category: "Catch Of The Day",
      image: img("Halibut.webp"),
      available: true
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // PAELLAS
    // ═══════════════════════════════════════════════════════════════════════════
    {
      name: "Shrimp & Mussels Paella",
      description: "Spanish rice, saffron, peas, homemade seafood stock",
      price: 32.00,
      category: "Paellas",
      image: img("Mussels.webp"),
      available: true
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // HOUSE ROLLS
    // ═══════════════════════════════════════════════════════════════════════════
    {
      name: "Toro Avocado Roll",
      description: "Tempura shrimp, spicy crab, avocado, jalapeño / Toro tartare, crunchies, eel sauce & spicy mayo on top",
      price: 19.00,
      category: "House Rolls",
      image: img("Toro Avocado Roll.webp"),
      available: true
    },
    {
      name: "Blu Roll",
      description: "Smoked salmon, soft shell crab, jalapeño, avocado / Masago, eel, sauce, spicy mayo scallions, sesame seeds on top",
      price: 20.00,
      category: "House Rolls",
      image: img("Blu Roll.webp"),
      available: true
    },
    {
      name: "Alination Roll",
      description: "Fresh lobster, cucumber, avocado, jalapeño / #1 Ahi, yuzu, tobiko on top",
      price: 20.00,
      category: "House Rolls",
      image: webImg.sushiRoll1,
      available: true
    },
    {
      name: "Flaming Blu Roll",
      description: "Tempura shrimp, spicy crab, avocado / Eel, ebi, avocado, smoked salmon, eel sauce, spicy mayo on top. We light it up at your table.",
      price: 20.00,
      category: "House Rolls",
      image: webImg.sushiRoll2,
      available: true
    },
    {
      name: "Anya Roll",
      description: "Snow crab, avocado, cucumber, jalapeño / Yellowtail, avocado, wasabi yuzu on top",
      price: 20.00,
      category: "House Rolls",
      image: img("Anya Roll.webp"),
      available: true
    },
    {
      name: "Spicy Blu Roll",
      description: "Spicy salmon, spicy yellowtail, avocado, cucumber / Spicy tuna on top, crunchies, spicy mayo, eel sauce",
      price: 19.00,
      category: "House Rolls",
      image: webImg.spicyRoll,
      available: true
    },
    {
      name: "Duner Roll",
      description: "#1 Ahi Tuna, cucumber, jalapeño, avocado / Masago, salmon, fresh lemon on top",
      price: 18.00,
      category: "House Rolls",
      image: img("Duner Roll.webp"),
      available: true
    },
    {
      name: "Snow Roll",
      description: "Snow crab, shrimp, avocado, spicy mayo / Rolled in sesame",
      price: 15.00,
      category: "House Rolls",
      image: img("Snow Roll.webp"),
      available: true
    },
    {
      name: "MarketPlace Roll",
      description: "#1 Ahi tuna, salmon, crab, cucumber, avocado / Tuna, salmon, yellowtail on top",
      price: 20.00,
      category: "House Rolls",
      image: img("MarketPlace Roll.webp"),
      available: true
    },
    {
      name: "Salmon Lover Roll",
      description: "Salmon, mango, avocado / Salmon, scallions, yuzu on top",
      price: 18.00,
      category: "House Rolls",
      image: img("Salmon.webp"),
      available: true
    },
    {
      name: "Tokyo Fresh",
      description: "Salmon, tuna, crab, cucumber, avocado, soy paper / Salmon, yellowtail, avocado, scallions, yuzu on top (no rice)",
      price: 25.00,
      category: "House Rolls",
      image: webImg.sushiRoll3,
      available: true
    },
    {
      name: "Midori",
      description: "Eel, crab, tempura shrimp, soy paper / Avocado, eel sauce on top",
      price: 18.00,
      category: "House Rolls",
      image: webImg.eelRoll,
      available: true
    },
    {
      name: "Okinawa Roll",
      description: "Yellowtail, avocado, spicy crab / Salmon, tuna, scallions, yuzu on top",
      price: 19.00,
      category: "House Rolls",
      image: webImg.sushiRoll4,
      available: true
    },
    {
      name: "Honey Roll",
      description: "Tuna, avocado, cucumber / Tuna, honey-wasabi sauce on top",
      price: 18.00,
      category: "House Rolls",
      image: webImg.sushiRoll5,
      available: true
    },
    {
      name: "Tropical Roll",
      description: "Coconut shrimp, mango, avocado / Spicy tuna, coconut flakes, eel sauce on top",
      price: 18.00,
      category: "House Rolls",
      image: webImg.tempuraRoll,
      available: true
    },
    {
      name: "Tiger Roll",
      description: "Tempura shrimp, lobster, avocado / Ebi, avocado, eel sauce, spicy sauce on top",
      price: 20.00,
      category: "House Rolls",
      image: webImg.sushiRoll1,
      available: true
    },
    {
      name: "Jen Jen",
      description: "Tempura shrimp, avocado, cream cheese / Spicy crab, eel sauce, crunchies on top",
      price: 19.00,
      category: "House Rolls",
      image: webImg.tempuraRoll,
      available: true
    },
    {
      name: "DTR Roll",
      description: "Tempura shrimp, spicy tuna, avocado, soy paper / Tuna, white tuna, crispy jalapeño, eel sauce, on top",
      price: 20.00,
      category: "House Rolls",
      image: webImg.spicyRoll,
      available: true
    },
    {
      name: "Spoke",
      description: "Tuna, salmon, yellowtail, snow crab / Eel, avocado, crispy jalapeño, eel sauce on top",
      price: 20.00,
      category: "House Rolls",
      image: webImg.sushiRoll2,
      available: true
    },
    {
      name: "Blu Magic Roll",
      description: "CHEF'S SURPRISE -- Tempura fried roll with cream cheese, crab, avocado • Chef's choice of fish and sauces.",
      price: 19.00,
      category: "House Rolls",
      image: webImg.tempuraRoll,
      available: true
    },
    {
      name: "Blu's Choice Roll",
      description: "Leave it up to the chef",
      price: 22.00,
      category: "House Rolls",
      image: webImg.sushiRoll3,
      available: true
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // CUT ROLLS
    // ═══════════════════════════════════════════════════════════════════════════
    {
      name: "California Roll",
      description: "With sesame seeds",
      price: 8.00,
      category: "Cut Rolls",
      image: img("California Roll.webp"),
      available: true
    },
    {
      name: "Golden California Roll",
      description: "With sesame seeds",
      price: 11.00,
      category: "Cut Rolls",
      image: img("Golden California Roll.webp"),
      available: true
    },
    {
      name: "Spicy Roll",
      description: "Cucumber, scallions, with your choice of Tuna, Salmon, Yellowtail or Crab.",
      price: 8.00,
      category: "Cut Rolls",
      image: webImg.spicyRoll,
      available: true
    },
    {
      name: "Rainbow Roll",
      description: "Crab, avocado, cucumber • Tuna, eel, salmon, yellowtail, avocado on top.",
      price: 20.00,
      category: "Cut Rolls",
      image: img("Rainbow Roll.webp"),
      available: true
    },
    {
      name: "Eel Roll",
      description: "Eel, avocado, cucumber, eel sauce.",
      price: 10.00,
      category: "Cut Rolls",
      image: webImg.eelRoll,
      available: true
    },
    {
      name: "Tekkamaki Roll",
      description: "Made with your choice of Tuna, Salmon, Yellowtail, Veggie, Avocado or Cucumber.",
      price: 5.00,
      category: "Cut Rolls",
      image: webImg.sushiRoll4,
      available: true
    },
    {
      name: "Philly Roll",
      description: "House smoked wild salmon, avocado, cream cheese.",
      price: 10.00,
      category: "Cut Rolls",
      image: img("Philly Roll.webp"),
      available: true
    },
    {
      name: "Spider Roll",
      description: "Tempura soft shell crab, avocado, cucumber, scallions, eel sauce",
      price: 17.00,
      category: "Cut Rolls",
      image: webImg.spiderRoll,
      available: true
    },
    {
      name: "Crunchy Tempura Shrimp Roll",
      description: "Tempura shrimp, avocado, crab, crunch.",
      price: 10.00,
      category: "Cut Rolls",
      image: webImg.tempuraRoll,
      available: true
    },
    {
      name: "Alaskan Roll",
      description: "Crab, salmon, avocado.",
      price: 15.00,
      category: "Cut Rolls",
      image: img("Alaskan Roll.webp"),
      available: true
    },
    {
      name: "Miami Roll",
      description: "Tuna, avocado",
      price: 15.00,
      category: "Cut Rolls",
      image: img("Miami Roll.webp"),
      available: true
    },
    {
      name: "Hand Roll Combo",
      description: "Choose 2: Spicy tuna*, yellowtail*, crab or salmon",
      price: 20.00,
      category: "Cut Rolls",
      image: webImg.handRoll,
      available: true
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // NIGIRI
    // ═══════════════════════════════════════════════════════════════════════════
    {
      name: "Tuna Nigiri",
      description: "Premium sushi-grade tuna",
      price: 9.00,
      category: "Nigiri",
      image: img("Tuna Nigiri.webp"),
      available: true
    },
    {
      name: "White Tuna Nigiri",
      description: "Premium white tuna",
      price: 9.00,
      category: "Nigiri",
      image: img("White Tuna Nigiri.webp"),
      available: true
    },
    {
      name: "Salmon Belly Nigiri",
      description: "Rich, fatty salmon belly",
      price: 7.00,
      category: "Nigiri",
      image: img("Salmon Belly Sashimi.webp"),
      available: true
    },
    {
      name: "Yellowtail Nigiri",
      description: "Fresh yellowtail",
      price: 7.00,
      category: "Nigiri",
      image: webImg.yellowtailNigiri,
      available: true
    },
    {
      name: "Shrimp Nigiri",
      description: "Cooked shrimp",
      price: 7.00,
      category: "Nigiri",
      image: img("Shrimp Nigiri.webp"),
      available: true
    },
    {
      name: "Octopus Nigiri",
      description: "Tender octopus",
      price: 7.00,
      category: "Nigiri",
      image: img("Spanish Octopus (Tako).webp"),
      available: true
    },
    {
      name: "Mackerel Nigiri",
      description: "Fresh mackerel",
      price: 7.00,
      category: "Nigiri",
      image: webImg.mackerelNigiri,
      available: true
    },
    {
      name: "Eel Nigiri",
      description: "Grilled freshwater eel",
      price: 7.00,
      category: "Nigiri",
      image: img("Eel Nigiri.webp"),
      available: true
    },
    {
      name: "Scallop Nigiri",
      description: "Sweet sea scallop",
      price: 9.00,
      category: "Nigiri",
      image: img("Scallop Nigiri.webp"),
      available: true
    },
    {
      name: "Fluke Nigiri",
      description: "Delicate fluke",
      price: 8.00,
      category: "Nigiri",
      image: webImg.flukeNigiri,
      available: true
    },
    {
      name: "Snow Crab Nigiri",
      description: "Sweet snow crab",
      price: 8.00,
      category: "Nigiri",
      image: img("Snow Crab.webp"),
      available: true
    },
    {
      name: "Sweet Shrimp Nigiri",
      description: "Raw sweet shrimp",
      price: 17.00,
      category: "Nigiri",
      image: img("Sweet Shrimp Nigiri.webp"),
      available: true
    },
    {
      name: "Salmon Roe Nigiri",
      description: "Fresh salmon roe",
      price: 12.00,
      category: "Nigiri",
      image: webImg.salmonRoe,
      available: true
    },
    {
      name: "Flying Fish Roe Nigiri",
      description: "Colorful tobiko",
      price: 7.00,
      category: "Nigiri",
      image: webImg.tobiko,
      available: true
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // SASHIMI (from House Rolls section)
    // ═══════════════════════════════════════════════════════════════════════════
    {
      name: "Tuna Sashimi",
      description: "5 pieces of premium tuna",
      price: 20.00,
      category: "Sashimi",
      image: img("Bluefin Tuna.webp"),
      available: true
    },
    {
      name: "White Tuna Sashimi",
      description: "5 pieces",
      price: 18.00,
      category: "Sashimi",
      image: webImg.whiteTunaSashimi,
      available: true
    },
    {
      name: "Salmon Belly Sashimi",
      description: "5 pieces",
      price: 18.00,
      category: "Sashimi",
      image: img("Salmon Belly Sashimi.webp"),
      available: true
    },
    {
      name: "Yellowtail Sashimi",
      description: "5 pieces",
      price: 18.00,
      category: "Sashimi",
      image: webImg.yellowtailSashimi,
      available: true
    },
    {
      name: "Shrimp Sashimi",
      description: "5 pieces",
      price: 14.00,
      category: "Sashimi",
      image: webImg.shrimpSashimi,
      available: true
    },
    {
      name: "Octopus Sashimi",
      description: "5 pieces",
      price: 18.00,
      category: "Sashimi",
      image: img("Spanish Octopus (Tako).webp"),
      available: true
    },
    {
      name: "Mackerel Sashimi",
      description: "5 pieces",
      price: 15.00,
      category: "Sashimi",
      image: webImg.mackerelSashimi,
      available: true
    },
    {
      name: "Eel Sashimi",
      description: "5 pieces",
      price: 17.00,
      category: "Sashimi",
      image: webImg.eelSashimi,
      available: true
    },
    {
      name: "Scallop Sashimi",
      description: "5 pieces",
      price: 20.00,
      category: "Sashimi",
      image: img("Scallop Nigiri.webp"),
      available: true
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // BLU SUSHI STARTERS
    // ═══════════════════════════════════════════════════════════════════════════
    {
      name: "Sea Salt Edamame",
      description: "Steamed soybeans with sea salt",
      price: 7.00,
      category: "Blu Sushi Starters",
      image: img("Sea Salt Edamame .webp"),
      available: true
    },
    {
      name: "Garlic-Soy Edamame",
      description: "Steamed soybeans with garlic and soy sauce",
      price: 8.00,
      category: "Blu Sushi Starters",
      image: img("Edamame.webp"),
      available: true
    },
    {
      name: "Seaweed Salad",
      description: "Fresh seaweed with sesame dressing",
      price: 7.00,
      category: "Blu Sushi Starters",
      image: img("Seaweed Salad.webp"),
      available: true
    },
    {
      name: "Ika (Squid) Salad",
      description: "Marinated squid salad",
      price: 8.00,
      category: "Blu Sushi Starters",
      image: webImg.squidSalad,
      available: true
    },
    {
      name: "Crudo Martini",
      description: "Salmon, tuna, yellowtail, crab, seaweed salad, lettuce, ponzu sauce.",
      price: 20.00,
      category: "Blu Sushi Starters",
      image: webImg.crudoMartini,
      available: true
    },
    {
      name: "Blu Chirashi",
      description: "Sashimi with ika, seaweed & cucumber salad over sushi rice with housemade ponzu.",
      price: 26.00,
      category: "Blu Sushi Starters",
      image: webImg.chirashi,
      available: true
    },
    {
      name: "Blue Fin Tuna Stack",
      description: "Sushi rice, snow crab, cucumber, avocado, spicy sauce, eel sauce",
      price: 19.00,
      category: "Blu Sushi Starters",
      image: img("Blue Fin Tuna Stack.webp"),
      available: true
    },
    {
      name: "Salmon Stack",
      description: "Sushi rice, snow crab, cucumber, avocado, spicy sauce, eel sauce",
      price: 19.00,
      category: "Blu Sushi Starters",
      image: img("Salmon.webp"),
      available: true
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // PERFECT FOR SHARING
    // ═══════════════════════════════════════════════════════════════════════════
    {
      name: "Chef's Choice Platter - Nigiri",
      description: "Assorted fresh nigiri selected by our chef",
      price: 21.00,
      category: "Perfect For Sharing",
      image: img("Chef's Choice Platter- Nigiri.webp"),
      available: true
    },
    {
      name: "Chef's Choice Platter - Sashimi",
      description: "Assorted fresh sashimi selected by our chef",
      price: 25.00,
      category: "Perfect For Sharing",
      image: img("Chef's Choice Platter- Sashimi.webp"),
      available: true
    },
    {
      name: "Lil' Blu",
      description: "ROLLS: California / Spicy Tuna* / Shaggy Dog | NIGIRI: Shrimp / Salmon",
      price: 44.00,
      category: "Perfect For Sharing",
      image: webImg.sushiPlatter,
      available: true
    },
    {
      name: "Small Sushi Boat",
      description: "18 Sashimi pieces, rainbow roll, yellowtail nigiri",
      price: 61.00,
      category: "Perfect For Sharing",
      image: webImg.sushiBoat,
      available: true
    },
    {
      name: "Large Sushi Boat (Pre-Order Please)",
      description: "18 Sashimi pieces, 10 nigiri pieces, chef choice roll, seaweed salad, 3 miso soups",
      price: 105.00,
      category: "Perfect For Sharing",
      image: webImg.sushiBoat,
      available: true
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // ENTRÉES
    // ═══════════════════════════════════════════════════════════════════════════
    {
      name: "New Orleans BBQ Shrimp & Grits",
      description: "Wild shrimp",
      price: 21.00,
      category: "Entrées",
      image: webImg.shrimpGrits,
      available: true
    },
    {
      name: "Fish N' Chips",
      description: "Beer battered / House chips, tartar sauce",
      price: 18.00,
      category: "Entrées",
      image: img("Fish N' Chips.webp"),
      available: true
    },
    {
      name: "Chicken Breast",
      description: "Grilled, fried or blackened / 2 sides",
      price: 18.00,
      category: "Entrées",
      image: img("Chicken Breast.webp"),
      available: true
    },
    {
      name: "Hawaiian Poke Bowl",
      description: "Sushi rice, cucumbers, scallions, taro chips, avocado, sesame seeds",
      price: 15.00,
      category: "Entrées",
      image: webImg.pokeBowl,
      available: true
    },
    {
      name: "Veggie Only",
      description: "Vegetarian option",
      price: 17.00,
      category: "Entrées",
      image: img("Veggies.webp"),
      available: true
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // PASTA
    // ═══════════════════════════════════════════════════════════════════════════
    {
      name: "Cajun Alfredo Pasta",
      description: "Shrimp, sausage, fish, parmesan",
      price: 23.00,
      category: "Pasta",
      image: img("Cajun Alfredo Pasta.webp"),
      available: true
    },
    {
      name: "Alfredo Pasta",
      description: "Your choice of no protein or Salmon, Shrimp, Chicken, or Veg.",
      price: 16.00,
      category: "Pasta",
      image: img("Alfredo.webp"),
      available: true
    },
    {
      name: "Seafood Linguine",
      description: "Shrimp, clams, mussels, crab, fish, garlic, parsley, tomato, extra virgin olive oil.",
      price: 31.00,
      category: "Pasta",
      image: img("Seafood Linguine.webp"),
      available: true
    },
    {
      name: "Lobster Mac N' Cheese",
      description: "Sharp cheddar, cream, parmesan & fresh lobster.",
      price: 21.00,
      category: "Pasta",
      image: img("Lobster Mac N' Cheese.webp"),
      available: true
    },
    {
      name: "Homemade Lobster Ravioli",
      description: "Vodka sauce. Topped with wild shrimp",
      price: 29.00,
      category: "Pasta",
      image: img("Homemade Lobster Raviolis.webp"),
      available: true
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // HOUSE SPECIALTIES
    // ═══════════════════════════════════════════════════════════════════════════
    {
      name: "Chilled Seafood Tower",
      description: "Clams, Mussels, Wild Jumbo Shrimp, Alaskan Snow Crab, Maine Lobster, Oysters and Maine Scallops steamed, seasoned and chilled. Served with freshly made avocado salsa, homemade cocktail sauce, horseradish, butter & lemons.",
      price: 129.00,
      category: "House Specialties",
      image: webImg.seafoodTower,
      available: true
    },
    {
      name: '"Seattle" Clambake',
      description: "Crab legs, Wild Shrimp, Clams and Mussels steamed and seasoned to perfection. Served with corn on the cob, potatoes, lemons, butter, and our Homemade cocktail sauce.",
      price: 64.00,
      category: "House Specialties",
      image: webImg.clambake,
      available: true
    },
    {
      name: '"Maine" Clambake',
      description: "Lobster, Wild Shrimp, Clams and Mussels steamed and seasoned to perfection. Served with corn on the cob, potatoes, lemons, butter, and our Homemade cocktail sauce.",
      price: 79.00,
      category: "House Specialties",
      image: img("Live Maine Lobsters.webp"),
      available: true
    },
    {
      name: "Live Maine Lobster",
      description: "Fresh live Maine lobster",
      price: 49.00,
      category: "House Specialties",
      image: img("Live Maine Lobsters.webp"),
      available: true
    },
    {
      name: "Alaskan Crab Legs",
      description: "Succulent Alaskan crab legs",
      price: 45.00,
      category: "House Specialties",
      image: img("Snow Crab.webp"),
      available: true
    },
    {
      name: "Wild Gulf Shrimp Peel N' Eat",
      description: "Creole spiced, served warm with house cocktail sauce.",
      price: 18.00,
      category: "House Specialties",
      image: img("Large Wild Gulf Shrimps .webp"),
      available: true
    },
    {
      name: "Wild Gulf Popcorn Shrimp",
      description: "Battered and fried, served warm with house cocktail sauce.",
      price: 18.00,
      category: "House Specialties",
      image: webImg.popcornShrimp,
      available: true
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // GO BLU
    // ═══════════════════════════════════════════════════════════════════════════
    {
      name: "Bento Box",
      description: 'Spicy Tuna Roll, Sushi Rice, 3 Jumbo Royal Red Shrimp, Ika Salad, Edamame, Ginger & Wasabi. Boxes rotate weekly. Available from 11:00 am - 2:00 pm (Tuesday-Friday) only.',
      price: 19.99,
      category: "Go BLU",
      image: img("Bento Box .webp"),
      available: true
    },
    {
      name: "DIY Sushi Kit",
      description: 'Includes 2 rolling mats, Edamame, Wasabi, Ginger, Spicy Mayo, Eel Sauce, and everything you need to make 4 rolls (2 California Rolls, 1 Shrimp Tempura Roll, and 1 Salmon-Avocado Roll. Rotating rolls every week. "PICK UP FOR SATURDAYS ONLY"',
      price: 45.00,
      category: "Go BLU",
      image: webImg.sushiKit,
      available: true
    },
    {
      name: "Poke Kit for 2",
      description: "Your choice of Salmon or Tuna, Rice, Seaweed Salad, Carrots, Cucumbers, Homemade Poke Sauce, Wonton Chips, Scallions, Sesame Seeds & Wasabi. $14.99 each bowl!",
      price: 29.98,
      category: "Go BLU",
      image: webImg.pokeKit,
      available: true
    },
    {
      name: "BBQ Shrimp and Grits Kit for 2",
      description: "Includes our homemade BBQ sauce, Spices, Jumbo Royal Red Shrimp and everything you need to make Blu's Recipe. $19/per person!",
      price: 38.00,
      category: "Go BLU",
      image: webImg.shrimpGrits,
      available: true
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // FRESH FISH MARKET
    // ═══════════════════════════════════════════════════════════════════════════
    {
      name: "Bluefin Tuna (Market)",
      description: "Our sushi grade tuna has a mild, delicate flavor with a meaty texture. Perfectly versatile for enjoying it raw or simply seared. It is high in omega-3 fatty acids which promotes heart health and reduces cholesterol.",
      price: 34.95,
      category: "Fresh Fish Market",
      image: img("Bluefin Tuna.webp"),
      available: true
    },
    {
      name: "Swordfish (Market)",
      description: "Our wild caught Swordfish come from the rich waters of the George's Banks making them deliciously fatty with a mild, slightly sweet taste. They call it the Steak of the Sea.",
      price: 22.95,
      category: "Fresh Fish Market",
      image: img("Swordfish.webp"),
      available: true
    },
    {
      name: "Icelandic Cod (Market)",
      description: "We get our wild caught Icelandic cod in fresh from the deep, cold waters off Iceland. It is a white flaky fish with a uniquely mild, sweet flavor.",
      price: 22.50,
      category: "Fresh Fish Market",
      image: img("Icelandic Cod.webp"),
      available: true
    },
    {
      name: "Haddock (Market)",
      description: "Haddock is one of the most popular and common whitefish in North America. Once cooked, it has a firm and tender texture with a mild, slightly sweet flavor.",
      price: 17.95,
      category: "Fresh Fish Market",
      image: img("Haddock.webp"),
      available: true
    },
    {
      name: "Amberjack (Market)",
      description: "Off the Florida coast is the highly sought after Amberjack. It's known for its firm but flaky texture as well as it's mild, sweet and buttery flavor.",
      price: 23.95,
      category: "Fresh Fish Market",
      image: img("Amberjack.webp"),
      available: true
    },
    {
      name: "Corvina (Market)",
      description: "Corvina holds up great to lemon which is why they call it The King of Ceviche. It comes from the warm waters of Panama which makes is a light, chunky, mild fish.",
      price: 24.50,
      category: "Fresh Fish Market",
      image: img("Corvina.webp"),
      available: true
    },
    {
      name: "Catfish (Market)",
      description: "Fried Catfish is a southern staple. Crispy on the outside and moist on the inside, what's not to love about this flavorful fish?",
      price: 12.95,
      category: "Fresh Fish Market",
      image: img("Catfish.webp"),
      available: true
    },
    {
      name: "Salmon (Market)",
      description: "This salmon is flown in fresh from the icy, clear waters of the North Atlantic. Showcasing it's beautiful marbling when raw and it's rich, oily, and aromatic flavor when cooked. It is a kitchen essential and a weeknight favorite dish.",
      price: 18.95,
      category: "Fresh Fish Market",
      image: img("Salmon.webp"),
      available: true
    },
    {
      name: "Snow Crab (Market)",
      description: 'Referred to as "queen crabs" they are often preferred over King Crab because of their distinctly sweet flavor and tender, flaky, snow-white meat.',
      price: 19.75,
      category: "Fresh Fish Market",
      image: img("Snow Crab.webp"),
      available: true
    },
    {
      name: "Spanish Octopus (Tako) (Market)",
      description: "Fresh, steamed and prepared at our premises. Ready to grill or add to dishes.",
      price: 25.95,
      category: "Fresh Fish Market",
      image: img("Spanish Octopus (Tako).webp"),
      available: true
    },
    {
      name: "Mussels (Market)",
      description: "Surprisingly one of the easiest seafoods to prepare are mussels. Their subtle taste makes them an excellent addition to many dishes. They are slightly firmer than a scallop but softer than a clam with a mild ocean flavor and faintly sweet, mushroom-like undertones.",
      price: 10.95,
      category: "Fresh Fish Market",
      image: img("Mussels.webp"),
      available: true
    },
    {
      name: "Little Neck Clams (Market)",
      description: "Fresh little neck clams",
      price: 13.95,
      category: "Fresh Fish Market",
      image: img("Little Neck Clams .webp"),
      available: true
    },
    {
      name: "Halibut (Market)",
      description: "King of the flatfish! Halibut it one of the least fishy flavors you can get which is why it's unique ability to convert non-fish eaters is so remarkable. It has a beautiful white, glossy flesh and gentle flavor making it one of the most sought-after types of fish in seafood.",
      price: 25.50,
      category: "Fresh Fish Market",
      image: img("Halibut .webp"),
      available: true
    },
    {
      name: "Live Maine Lobsters (Market)",
      description: "Live or steamed",
      price: 25.95,
      category: "Fresh Fish Market",
      image: img("Live Maine Lobsters.webp"),
      available: true
    },
    {
      name: "Black Bass (Market)",
      description: "Black bass has a savory, slightly nutty and sweet flavor often described as a cross between trout and sea bass. The flesh is white, tender, and flaky, with a firm texture that holds up well to various cooking methods.",
      price: 13.95,
      category: "Fresh Fish Market",
      image: img("Black Bass.webp"),
      available: true
    },
    {
      name: "Calamari (Market)",
      description: "In its most popular form, squid, is paired with lemon, flour, salt and pepper then fried to become the well-known appetizer, Calamari. It's known for its firm, mildly sweet flesh, and chewy texture. It also lends itself to hot and fast cooking methods such as grilling, broiling, or sauteing as well as eaten raw such as in sushi.",
      price: 12.95,
      category: "Fresh Fish Market",
      image: img("Calamari.webp"),
      available: true
    },
    {
      name: "Smoked Salmon (Market)",
      description: "Blu's Special Smoked Salmon. Our fresh, wild caught, Salmon is filleted in house then marinated for 24 hours infusing it with flavor and giving it the melt in your mouth texture. Then we spend all day smoking it over apple wood chunks and glazing it to give it the perfect, caramelized smoky flavor that you can only get here at Blu.",
      price: 28.95,
      category: "Fresh Fish Market",
      image: img("Smoked Salmon.webp"),
      available: true
    },
    {
      name: "Maine Lobster Tails (Market)",
      description: "6 oz",
      price: 19.95,
      category: "Fresh Fish Market",
      image: img("Maine Lobster Tails .webp"),
      available: true
    },
    {
      name: "Red Snapper Whole (Market)",
      description: "Flown in fresh from the coast of Florida. Red Snapper has a firm texture and a sweet, nutty flavor that lends itself well to everything from hot chilies to subtle herbs.",
      price: 14.95,
      category: "Fresh Fish Market",
      image: img("Red Snapper Whole.webp"),
      available: true
    },
    {
      name: "Grouper - Florida (Market)",
      description: "Grouper is renowned for its delicious flavor. It is firm, yet tender, with a texture that is often described as succulent and flaky. It has a very mild flavor with slightly sweet undertones, giving it a unique and delightful taste.",
      price: 24.95,
      category: "Fresh Fish Market",
      image: img("Grouper - Florida.webp"),
      available: true
    },
    {
      name: "Mahi-Mahi (Market)",
      description: 'It is not surprising that this incredibly versatile fish is one of the most popular around the world. Mahi Mahi lends itself to a ton of different dishes and recipes that span a wide variety of different cooking techniques. It has a mild and slightly sweet flavor with a moderately firm texture. In terms of "fishiness", it is stronger than halibut, but not as fishy tasting as swordfish.',
      price: 19.95,
      category: "Fresh Fish Market",
      image: img("Mahi-Mahi.webp"),
      available: true
    },
    {
      name: "Large Wild Gulf Shrimps (Market)",
      description: "16 to 20 per pound",
      price: 16.95,
      category: "Fresh Fish Market",
      image: img("Large Wild Gulf Shrimps .webp"),
      available: true
    },
    {
      name: "Medium Wild Gulf Shrimp (Market)",
      description: "31 to 35 per pound",
      price: 14.95,
      category: "Fresh Fish Market",
      image: img("Medium Wild Gulf Shrimp.webp"),
      available: true
    },
    {
      name: "Canadian King Organic Salmon (Market)",
      description: "Premium organic salmon from Canada",
      price: 25.95,
      category: "Fresh Fish Market",
      image: img("Canadian King Organic Salmon .webp"),
      available: true
    },
    {
      name: "Oysters (Market)",
      description: "Fresh oysters",
      price: 3.25,
      category: "Fresh Fish Market",
      image: img("Oysters.webp"),
      available: true
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // SIDES
    // ═══════════════════════════════════════════════════════════════════════════
    {
      name: "House-Cut Chips",
      description: "Freshly cut house chips",
      price: 6.00,
      category: "Sides",
      image: img("House-Cut Chips.webp"),
      available: true
    },
    {
      name: "Hush Puppies",
      description: "Classic Southern hush puppies",
      price: 6.00,
      category: "Sides",
      image: webImg.hushPuppies,
      available: true
    },
    {
      name: "House Pineapple Slaw",
      description: "House-made pineapple coleslaw",
      price: 6.00,
      category: "Sides",
      image: img("House Pineapple Slaw.webp"),
      available: true
    },
    {
      name: "Veggies",
      description: "Fresh seasonal vegetables",
      price: 6.00,
      category: "Sides",
      image: img("Veggies.webp"),
      available: true
    },
    {
      name: "Side Salad",
      description: "Fresh garden salad",
      price: 6.00,
      category: "Sides",
      image: img("Side Salad.webp"),
      available: true
    },
    {
      name: "Rice Pilaf",
      description: "Seasoned rice pilaf",
      price: 6.00,
      category: "Sides",
      image: img("Rice Pilaf.webp"),
      available: true
    },
    {
      name: "Mash Potatoes",
      description: "Creamy mashed potatoes",
      price: 6.00,
      category: "Sides",
      image: img("Mash Potatoes .webp"),
      available: true
    },
    {
      name: "Sushi Rice",
      description: "Seasoned sushi rice",
      price: 4.50,
      category: "Sides",
      image: img("Sushi Rice.webp"),
      available: true
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // BACK TO SCHOOL FAMILY MEALS
    // ═══════════════════════════════════════════════════════════════════════════
    {
      name: "Grilled Catfish Meal",
      description: "Grilled catfish, caper dill sauce, mash potatoes & roasted carrots. (Feeds 4–6)",
      price: 79.00,
      category: "Back To School Family Meals",
      image: img("Catfish.webp"),
      available: true
    },
    {
      name: "Panko Crusted Shrimp Meal",
      description: "Panko crusted shrimp, house fries, coleslaw. (feeds 4-6)",
      price: 79.00,
      category: "Back To School Family Meals",
      image: img("Wild Jumbo Shrimp.webp"),
      available: true
    },
    {
      name: "Parmesan Crusted Snapper Meal",
      description: "Parmesan crusted snapper, lobster cream sauce, jasmine rice, zucchini n squash medley. (feeds 4-6)",
      price: 79.00,
      category: "Back To School Family Meals",
      image: img("Red Snapper Whole.webp"),
      available: true
    },
    {
      name: "Chicken Alfredo Meal",
      description: "Chicken Alfredo, side salad & toast points. (feeds 4-6)",
      price: 79.00,
      category: "Back To School Family Meals",
      image: img("Alfredo Pasta.webp"),
      available: true
    },
    {
      name: "Shrimp n Grits Meal",
      description: "Shrimp n grits & a side salad. (feeds 4-6)",
      price: 79.00,
      category: "Back To School Family Meals",
      image: webImg.shrimpGrits,
      available: true
    },
  ]

  // Add IDs and timestamps to menu items
  const now = new Date().toISOString()
  const menuItemsWithIds = menuItems.map((item) => ({
    id: createId(),
    ...item,
    createdAt: now,
    updatedAt: now
  }))

  // Insert menu items
  console.log(`Inserting ${menuItemsWithIds.length} menu items...`)
  const { error } = await (supabase
    .from('menu_items') as any)
    .insert(menuItemsWithIds)

  if (error) {
    console.error('Error seeding menu items:', error)
    process.exit(1)
  }

  console.log(`✅ Successfully seeded ${menuItems.length} Blu Fish House menu items!`)
  
  // Print category breakdown
  const categories = menuItems.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  console.log('\n📊 Category breakdown:')
  Object.entries(categories).forEach(([cat, count]) => {
    console.log(`   ${cat}: ${count} items`)
  })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
