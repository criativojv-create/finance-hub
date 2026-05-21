import { supabase, hasSupabase } from './supabase'
import type { Expense, FixedExpense, Category, BusinessEntry, PersonNames } from '../types'

// EXPENSES
export async function getExpenses(): Promise<Expense[]> {
  if (!hasSupabase || !supabase) return []
  try {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  } catch (err) {
    console.error('Error fetching expenses:', err)
    return []
  }
}

export async function addExpense(expense: Omit<Expense, 'id' | 'createdAt'>): Promise<Expense | null> {
  if (!hasSupabase || !supabase) return null
  try {
    const { data, error } = await supabase
      .from('expenses')
      .insert([{ ...expense, created_at: new Date().toISOString() }])
      .select()
      .single()
    if (error) throw error
    return data as Expense
  } catch (err) {
    console.error('Error adding expense:', err)
    return null
  }
}

export async function deleteExpense(id: string): Promise<boolean> {
  if (!hasSupabase || !supabase) return false
  try {
    const { error } = await supabase.from('expenses').delete().eq('id', id)
    if (error) throw error
    return true
  } catch (err) {
    console.error('Error deleting expense:', err)
    return false
  }
}

export async function deleteExpensesByGroup(groupId: string): Promise<boolean> {
  if (!hasSupabase || !supabase) return false
  try {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('installment_group_id', groupId)
    if (error) throw error
    return true
  } catch (err) {
    console.error('Error deleting expense group:', err)
    return false
  }
}

// FIXED EXPENSES
export async function getFixedExpenses(): Promise<FixedExpense[]> {
  if (!hasSupabase || !supabase) return []
  try {
    const { data, error } = await supabase
      .from('fixed_expenses')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  } catch (err) {
    console.error('Error fetching fixed expenses:', err)
    return []
  }
}

export async function addFixedExpense(fixed: Omit<FixedExpense, 'id' | 'createdAt'>): Promise<FixedExpense | null> {
  if (!hasSupabase || !supabase) return null
  try {
    const { data, error } = await supabase
      .from('fixed_expenses')
      .insert([{ ...fixed, created_at: new Date().toISOString() }])
      .select()
      .single()
    if (error) throw error
    return data as FixedExpense
  } catch (err) {
    console.error('Error adding fixed expense:', err)
    return null
  }
}

export async function deleteFixedExpense(id: string): Promise<boolean> {
  if (!hasSupabase || !supabase) return false
  try {
    const { error } = await supabase.from('fixed_expenses').delete().eq('id', id)
    if (error) throw error
    return true
  } catch (err) {
    console.error('Error deleting fixed expense:', err)
    return false
  }
}

export async function toggleFixedExpense(id: string, active: boolean): Promise<boolean> {
  if (!hasSupabase || !supabase) return false
  try {
    const { error } = await supabase
      .from('fixed_expenses')
      .update({ active })
      .eq('id', id)
    if (error) throw error
    return true
  } catch (err) {
    console.error('Error toggling fixed expense:', err)
    return false
  }
}

// CATEGORIES
export async function getCategories(): Promise<Category[]> {
  if (!hasSupabase || !supabase) return []
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name')
    if (error) throw error
    return data || []
  } catch (err) {
    console.error('Error fetching categories:', err)
    return []
  }
}

export async function addCategory(category: Omit<Category, 'id'>): Promise<Category | null> {
  if (!hasSupabase || !supabase) return null
  try {
    const { data, error } = await supabase
      .from('categories')
      .insert([category])
      .select()
      .single()
    if (error) throw error
    return data as Category
  } catch (err) {
    console.error('Error adding category:', err)
    return null
  }
}

// BUSINESS ENTRIES
export async function getBusinessEntries(): Promise<BusinessEntry[]> {
  if (!hasSupabase || !supabase) return []
  try {
    const { data, error } = await supabase
      .from('business_entries')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  } catch (err) {
    console.error('Error fetching business entries:', err)
    return []
  }
}

export async function addBusinessEntry(entry: Omit<BusinessEntry, 'id' | 'createdAt'>): Promise<BusinessEntry | null> {
  if (!hasSupabase || !supabase) return null
  try {
    const { data, error } = await supabase
      .from('business_entries')
      .insert([{ ...entry, created_at: new Date().toISOString() }])
      .select()
      .single()
    if (error) throw error
    return data as BusinessEntry
  } catch (err) {
    console.error('Error adding business entry:', err)
    return null
  }
}

export async function deleteBusinessEntry(id: string): Promise<boolean> {
  if (!hasSupabase || !supabase) return false
  try {
    const { error } = await supabase.from('business_entries').delete().eq('id', id)
    if (error) throw error
    return true
  } catch (err) {
    console.error('Error deleting business entry:', err)
    return false
  }
}

export async function updateBusinessStatus(id: string, status: string): Promise<boolean> {
  if (!hasSupabase || !supabase) return false
  try {
    const { error } = await supabase
      .from('business_entries')
      .update({ status })
      .eq('id', id)
    if (error) throw error
    return true
  } catch (err) {
    console.error('Error updating business status:', err)
    return false
  }
}

// PERSON NAMES
export async function getPersonNames(): Promise<PersonNames | null> {
  if (!hasSupabase || !supabase) return null
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'person_names')
      .single()
    if (error) throw error
    return data?.value || null
  } catch (err) {
    console.error('Error fetching person names:', err)
    return null
  }
}

export async function updatePersonNames(names: PersonNames): Promise<boolean> {
  if (!hasSupabase || !supabase) return false
  try {
    const { error } = await supabase
      .from('settings')
      .upsert({ key: 'person_names', value: names }, { onConflict: 'key' })
    if (error) throw error
    return true
  } catch (err) {
    console.error('Error updating person names:', err)
    return false
  }
}
