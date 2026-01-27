// This file previously exported Prisma client
// Prisma has been removed - use Supabase directly via @/lib/supabase
// 
// Example usage:
// import { supabase } from '@/lib/supabase'
// const { data, error } = await supabase.from('table_name').select('*')

// Stub export to prevent build errors - will throw at runtime if used
export const prisma = new Proxy({} as any, {
  get() {
    throw new Error(
      'Prisma has been removed. Please migrate to Supabase.\n' +
      'Import from @/lib/supabase instead and use Supabase queries.\n' +
      'Example: import { supabase } from "@/lib/supabase"'
    )
  }
})
