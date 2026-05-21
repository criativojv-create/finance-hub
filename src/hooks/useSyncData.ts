import { useEffect } from 'react'
import { supabase, hasSupabase } from '../lib/supabase'
import type { Expense, FixedExpense, Category, BusinessEntry, PersonNames } from '../types'

export function useSyncData(
  expenses: Expense[],
  fixedExpenses: FixedExpense[],
  categories: Category[],
  businessEntries: BusinessEntry[],
  personNames: PersonNames,
) {
  useEffect(() => {
    if (!hasSupabase || !supabase) return

    const syncData = async () => {
      try {
        // Sync expenses
        if (expenses.length > 0) {
          const formatted = expenses.map(e => ({
            ...e,
            created_at: e.createdAt,
          }))
          await supabase!
            .from('expenses')
            .upsert(formatted, { onConflict: 'id' })
        }

        // Sync fixed expenses
        if (fixedExpenses.length > 0) {
          const formatted = fixedExpenses.map(f => ({
            ...f,
            day_of_month: f.dayOfMonth,
            start_year: f.startYear,
            start_month: f.startMonth,
            created_at: f.createdAt,
          }))
          await supabase!
            .from('fixed_expenses')
            .upsert(formatted, { onConflict: 'id' })
        }

        // Sync categories
        if (categories.length > 0) {
          const formatted = categories.map(c => ({
            ...c,
            is_custom: c.isCustom,
          }))
          await supabase!
            .from('categories')
            .upsert(formatted, { onConflict: 'id' })
        }

        // Sync business entries
        if (businessEntries.length > 0) {
          const formatted = businessEntries.map(e => ({
            ...e,
            created_at: e.createdAt,
          }))
          await supabase!
            .from('business_entries')
            .upsert(formatted, { onConflict: 'id' })
        }

        // Sync person names
        await supabase!
          .from('settings')
          .upsert({ key: 'person_names', value: personNames }, { onConflict: 'key' })

        console.log('✅ Data synced to Supabase')
      } catch (err) {
        console.error('Sync error:', err)
      }
    }

    // Sync após 2 segundos (debounce)
    const timeout = setTimeout(syncData, 2000)
    return () => clearTimeout(timeout)
  }, [expenses, fixedExpenses, categories, businessEntries, personNames])
}
