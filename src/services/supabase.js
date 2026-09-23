import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Las variables de entorno VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY no están configuradas. ' +
    'Crea un archivo .env.local con estos valores.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Utilidades para debugging (opcional)
export const logSupabaseError = (error) => {
  if (error) {
    console.error('Supabase Error:', error.message)
    console.error('Details:', error)
  }
}

export const logSupabaseData = (data, label = 'Data') => {
  console.log(`✓ ${label}:`, data)
}