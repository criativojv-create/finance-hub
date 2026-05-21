import { supabase, hasSupabase } from './supabase'

export async function initializeDatabase() {
  if (!hasSupabase || !supabase) return false

  try {
    console.log('Initializing Supabase tables...')

    // Test connection
    const { error } = await supabase.from('expenses').select('count', { count: 'exact', head: true })
    if (error) {
      console.warn('⚠️ Tables not found. Follow SQL_SETUP.md to create them.')
      return false
    }

    console.log('✅ Supabase tables initialized')
    return true
  } catch (err) {
    console.warn('Could not initialize Supabase:', err)
    return false
  }
}
