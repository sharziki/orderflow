import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

interface ImportItem {
  name: string
  description?: string
  price: number | string
  categoryId?: string
  categoryName?: string
  image?: string
  variants?: Array<{ name: string; price: number }>
  allergens?: string[]
  calories?: number
  isAvailable?: boolean
}

interface ImportError {
  row: number
  name?: string
  error: string
}

// POST /api/menu/import - Import menu items from CSV or JSON
export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const contentType = req.headers.get('content-type') || ''
    let items: ImportItem[] = []

    if (contentType.includes('application/json')) {
      const body = await req.json()
      
      if (body.csv && typeof body.csv === 'string') {
        // Parse CSV from JSON body
        items = parseCSV(body.csv)
      } else if (body.items && Array.isArray(body.items)) {
        // Direct JSON array
        items = body.items
      } else if (Array.isArray(body)) {
        // Body is the array directly
        items = body
      } else {
        return NextResponse.json({ 
          error: 'Request must contain csv string or items array' 
        }, { status: 400 })
      }
    } else if (contentType.includes('text/csv')) {
      const csvText = await req.text()
      items = parseCSV(csvText)
    } else {
      return NextResponse.json({ 
        error: 'Content-Type must be application/json or text/csv' 
      }, { status: 400 })
    }

    if (items.length === 0) {
      return NextResponse.json({ error: 'No items to import' }, { status: 400 })
    }

    // Get existing categories for this tenant
    const existingCategories = await prisma.category.findMany({
      where: { tenantId: session.tenantId },
      select: { id: true, name: true },
    })
    const categoryMap = new Map(existingCategories.map(c => [c.name.toLowerCase(), c.id]))

    const errors: ImportError[] = []
    const createdItems: string[] = []
    const createdCategories: string[] = []

    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      const row = i + 1

      // Validate required fields
      if (!item.name) {
        errors.push({ row, error: 'name is required' })
        continue
      }

      const price = typeof item.price === 'string' ? parseFloat(item.price) : item.price
      if (isNaN(price) || price < 0) {
        errors.push({ row, name: item.name, error: 'valid price is required' })
        continue
      }

      // Resolve category
      let categoryId = item.categoryId

      if (!categoryId && item.categoryName) {
        // Check if category exists (case-insensitive)
        const existingId = categoryMap.get(item.categoryName.toLowerCase())
        
        if (existingId) {
          categoryId = existingId
        } else {
          // Create new category
          try {
            const maxOrder = await prisma.category.aggregate({
              where: { tenantId: session.tenantId },
              _max: { sortOrder: true },
            })

            const newCategory = await prisma.category.create({
              data: {
                tenantId: session.tenantId,
                name: item.categoryName,
                sortOrder: (maxOrder._max.sortOrder || 0) + 1,
                isActive: true,
              },
            })
            categoryId = newCategory.id
            categoryMap.set(item.categoryName.toLowerCase(), categoryId)
            createdCategories.push(item.categoryName)
          } catch (catError) {
            errors.push({ row, name: item.name, error: `Failed to create category: ${item.categoryName}` })
            continue
          }
        }
      }

      if (!categoryId) {
        errors.push({ row, name: item.name, error: 'categoryId or categoryName is required' })
        continue
      }

      // Verify category belongs to tenant
      const categoryBelongsToTenant = await prisma.category.findFirst({
        where: { id: categoryId, tenantId: session.tenantId },
      })

      if (!categoryBelongsToTenant) {
        errors.push({ row, name: item.name, error: 'Category not found or not owned by tenant' })
        continue
      }

      // Get sort order
      const maxItemOrder = await prisma.menuItem.aggregate({
        where: { categoryId },
        _max: { sortOrder: true },
      })

      // Create the menu item
      try {
        await prisma.menuItem.create({
          data: {
            tenantId: session.tenantId,
            categoryId,
            name: item.name,
            description: item.description || null,
            price,
            image: item.image || null,
            variants: item.variants || undefined,
            allergens: item.allergens || [],
            calories: item.calories || null,
            isAvailable: item.isAvailable ?? true,
            sortOrder: (maxItemOrder._max.sortOrder || 0) + 1,
          },
        })
        createdItems.push(item.name)
      } catch (createError) {
        errors.push({ row, name: item.name, error: 'Failed to create item' })
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        itemsCreated: createdItems.length,
        categoriesCreated: createdCategories.length,
        errorsCount: errors.length,
      },
      createdItems,
      createdCategories,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error('Error importing menu items:', error)
    return NextResponse.json({ error: 'Failed to import menu items' }, { status: 500 })
  }
}

/**
 * Parse CSV text into ImportItem array
 * Expected columns: name, description, price, categoryName (or categoryId), image
 */
function parseCSV(csvText: string): ImportItem[] {
  const lines = csvText.trim().split('\n')
  if (lines.length < 2) return []

  // Parse header row
  const headerLine = lines[0]
  const headers = parseCSVLine(headerLine).map(h => h.toLowerCase().trim())

  const items: ImportItem[] = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    const values = parseCSVLine(line)
    const item: Record<string, string> = {}

    headers.forEach((header, index) => {
      if (values[index] !== undefined) {
        item[header] = values[index]
      }
    })

    // Map to ImportItem
    const importItem: ImportItem = {
      name: item.name || item.item_name || '',
      description: item.description || item.desc || undefined,
      price: parseFloat(item.price || '0'),
      categoryId: item.categoryid || item.category_id || undefined,
      categoryName: item.categoryname || item.category_name || item.category || undefined,
      image: item.image || item.image_url || undefined,
    }

    // Parse allergens if present (comma-separated)
    if (item.allergens) {
      importItem.allergens = item.allergens.split(',').map(a => a.trim()).filter(Boolean)
    }

    // Parse calories if present
    if (item.calories) {
      importItem.calories = parseInt(item.calories, 10) || undefined
    }

    if (importItem.name) {
      items.push(importItem)
    }
  }

  return items
}

/**
 * Parse a single CSV line, handling quoted values
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const nextChar = line[i + 1]

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"'
        i++
      } else {
        // Toggle quote mode
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }

  result.push(current.trim())
  return result
}
