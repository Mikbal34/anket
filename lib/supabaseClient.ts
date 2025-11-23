import { createClient } from '@supabase/supabase-js'

// Hızlı kurulum için direkt buraya yazdık
const supabaseUrl = 'https://ncuaorjpyrnpqmpieoze.supabase.co'
const supabaseAnonKey = 'sb_publishable_C7Mbq7ac6m5dV5D2czX03A_t387eFto'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
