import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Check if Supabase is configured
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey)

let supabaseClient: ReturnType<typeof createClient> | null = null

if (isSupabaseConfigured) {
  supabaseClient = createClient(supabaseUrl!, supabaseAnonKey!, {
    auth: {
      persistSession: false, // We don't need auth for this app
    },
    realtime: {
      params: {
        eventsPerSecond: 10, // Limit real-time events
      },
    },
  })
}

// Export supabase client - return null if not configured instead of throwing
export const supabase = supabaseClient

// Database types
export interface DatabaseNote {
  id: string
  text: string
  author: string
  x: number
  y: number
  rotation: number
  color: string
  created_at: string
}

// Type for creating new notes (without id and created at)
export interface NewNote {
  text: string
  author: string
  x: number
  y: number
  rotation: number
  color: string
}

// Mock functions for development without Supabase
export const mockSupabase = {
  from: () => ({
    select: () => ({
      order: () => ({
        limit: () => Promise.resolve({ data: [], error: null })
      })
    }),
    insert: () => Promise.resolve({ error: null }),
    delete: () => ({
      eq: () => Promise.resolve({ error: null })
    })
  }),
  channel: () => ({
    on: () => ({ on: () => ({ subscribe: () => {} }) })
  }),
  removeChannel: () => {}
}

// Helper function to get supabase client safely
export const getSupabaseClient = () => {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your environment variables.')
  }
  return supabase!
}