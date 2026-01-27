import { createClient } from '@supabase/supabase-js'

let supabaseClient: ReturnType<typeof createClient> | null = null

function getSupabaseClient() {
  if (supabaseClient) {
    return supabaseClient
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  console.log('[Supabase] Initializing client:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey,
    urlValue: supabaseUrl?.substring(0, 30) + '...',
  })

  if (!supabaseUrl || !supabaseAnonKey) {
    const error = new Error(
      '[Supabase] Missing required environment variables. ' +
      'Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in your environment. ' +
      `Current state: URL=${!!supabaseUrl}, Key=${!!supabaseAnonKey}`
    )
    console.error(error.message)
    throw error
  }

  try {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey)
    console.log('[Supabase] Client created successfully')
    return supabaseClient
  } catch (error) {
    console.error('[Supabase] Error creating client:', error)
    throw error
  }
}

// Lazy initialization - only validates when actually used, not at import time
export const supabase = new Proxy({} as ReturnType<typeof createClient>, {
  get(_target, prop) {
    const client = getSupabaseClient()
    const value = (client as any)[prop]
    return typeof value === 'function' ? value.bind(client) : value
  }
})
