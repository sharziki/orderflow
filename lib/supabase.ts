import { createClient } from '@supabase/supabase-js'

let supabaseClient: ReturnType<typeof createClient> | null = null
let isConfigured = false

function getSupabaseClient(): ReturnType<typeof createClient> | null {
  if (supabaseClient) {
    return supabaseClient
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('[Supabase] Not configured - running in demo mode')
    isConfigured = false
    return null
  }

  try {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey)
    isConfigured = true
    console.log('[Supabase] Client created successfully')
    return supabaseClient
  } catch (error) {
    console.error('[Supabase] Error creating client:', error)
    isConfigured = false
    return null
  }
}

// Check if Supabase is configured
export function isSupabaseConfigured(): boolean {
  getSupabaseClient() // Trigger initialization check
  return isConfigured
}

// Mock response for when Supabase is not configured
const mockResponse = {
  data: null,
  error: { message: 'Supabase not configured - running in demo mode' },
  count: null,
  status: 503,
  statusText: 'Service Unavailable'
}

// Mock channel for realtime subscriptions
const mockChannel = {
  on: function() { return this },
  subscribe: function() { return this },
  unsubscribe: () => Promise.resolve(),
}

// Create a mock client that returns empty data
const mockClient = {
  from: () => ({
    select: () => Promise.resolve({ data: [], error: null }),
    insert: () => Promise.resolve(mockResponse),
    update: () => Promise.resolve(mockResponse),
    delete: () => Promise.resolve(mockResponse),
    upsert: () => Promise.resolve(mockResponse),
    eq: function() { return this },
    neq: function() { return this },
    gt: function() { return this },
    lt: function() { return this },
    gte: function() { return this },
    lte: function() { return this },
    like: function() { return this },
    ilike: function() { return this },
    is: function() { return this },
    in: function() { return this },
    order: function() { return this },
    limit: function() { return this },
    range: function() { return this },
    single: () => Promise.resolve({ data: null, error: null }),
    maybeSingle: () => Promise.resolve({ data: null, error: null }),
  }),
  auth: {
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    getUser: () => Promise.resolve({ data: { user: null }, error: null }),
    signIn: () => Promise.resolve(mockResponse),
    signOut: () => Promise.resolve({ error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
  },
  storage: {
    from: () => ({
      upload: () => Promise.resolve(mockResponse),
      download: () => Promise.resolve(mockResponse),
      getPublicUrl: () => ({ data: { publicUrl: '' } }),
      list: () => Promise.resolve({ data: [], error: null }),
      remove: () => Promise.resolve(mockResponse),
    }),
  },
  channel: () => mockChannel,
  removeChannel: () => Promise.resolve(),
  rpc: () => Promise.resolve({ data: null, error: null }),
}

// Lazy initialization with fallback to mock
export const supabase = new Proxy({} as ReturnType<typeof createClient>, {
  get(_target, prop) {
    const client = getSupabaseClient()
    if (!client) {
      // Return mock client methods
      const value = (mockClient as any)[prop]
      return typeof value === 'function' ? value.bind(mockClient) : value
    }
    const value = (client as any)[prop]
    return typeof value === 'function' ? value.bind(client) : value
  }
})
