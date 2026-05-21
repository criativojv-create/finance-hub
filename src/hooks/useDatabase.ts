import { useState, useEffect } from 'react'
import { hasSupabase } from '../lib/supabase'
import * as db from '../lib/database'
import type { Expense, FixedExpense, Category, BusinessEntry, PersonNames } from '../types'

/**
 * Hook que sincroniza com Supabase ou localStorage
 * Se Supabase não estiver configurado, usa localStorage como fallback
 */

export function useExpenses(localStorageKey: string, initialValue: Expense[]) {
  const [data, setData] = useState<Expense[]>(initialValue)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (hasSupabase) {
      setLoading(true)
      db.getExpenses()
        .then(expenses => setData(expenses || initialValue))
        .finally(() => setLoading(false))
    }
  }, [])

  return [data, setData, loading] as const
}

export function useFixedExpenses(localStorageKey: string, initialValue: FixedExpense[]) {
  const [data, setData] = useState<FixedExpense[]>(initialValue)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (hasSupabase) {
      setLoading(true)
      db.getFixedExpenses()
        .then(fixed => setData(fixed || initialValue))
        .finally(() => setLoading(false))
    }
  }, [])

  return [data, setData, loading] as const
}

export function useCategories(localStorageKey: string, initialValue: Category[]) {
  const [data, setData] = useState<Category[]>(initialValue)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (hasSupabase) {
      setLoading(true)
      db.getCategories()
        .then(cats => {
          if (cats && cats.length > 0) {
            setData(cats)
          } else {
            setData(initialValue)
          }
        })
        .finally(() => setLoading(false))
    }
  }, [])

  return [data, setData, loading] as const
}

export function useBusinessEntries(localStorageKey: string, initialValue: BusinessEntry[]) {
  const [data, setData] = useState<BusinessEntry[]>(initialValue)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (hasSupabase) {
      setLoading(true)
      db.getBusinessEntries()
        .then(entries => setData(entries || initialValue))
        .finally(() => setLoading(false))
    }
  }, [])

  return [data, setData, loading] as const
}

export function usePersonNames(localStorageKey: string, initialValue: PersonNames) {
  const [data, setData] = useState<PersonNames>(initialValue)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (hasSupabase) {
      setLoading(true)
      db.getPersonNames()
        .then(names => {
          if (names) setData(names)
        })
        .finally(() => setLoading(false))
    }
  }, [])

  return [data, setData, loading] as const
}
