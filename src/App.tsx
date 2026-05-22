import { useState, useEffect } from 'react'
import { Wallet, CloudOff, Cloud, AlertCircle } from 'lucide-react'
import { Category, Expense, FixedExpense, BusinessEntry, BusinessStatus, PersonNames } from './types'
import { useLocalStorage } from './hooks/useLocalStorage'
import { supabase, hasSupabase } from './lib/supabase'
import PersonalFinances from './components/PersonalFinances'
import BusinessFinances from './components/BusinessFinances'

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'moradia',      name: 'Moradia',      color: '#6366f1', icon: '🏠' },
  { id: 'alimentacao',  name: 'Alimentação',  color: '#f97316', icon: '🍽️' },
  { id: 'transporte',   name: 'Transporte',   color: '#06b6d4', icon: '🚗' },
  { id: 'saude',        name: 'Saúde',        color: '#22c55e', icon: '🏥' },
  { id: 'lazer',        name: 'Lazer',        color: '#ec4899', icon: '🎮' },
  { id: 'educacao',     name: 'Educação',     color: '#eab308', icon: '📚' },
  { id: 'vestuario',    name: 'Vestuário',    color: '#8b5cf6', icon: '👗' },
  { id: 'outros',       name: 'Outros',       color: '#64748b', icon: '💼' },
]

function genId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

// ─── MAPEAMENTO APP ↔ SUPABASE ───────────────────────────────────────────────
function expenseToDb(e: Expense) {
  return {
    id: e.id,
    description: e.description,
    amount: e.amount,
    date: e.date,
    category_id: e.categoryId,
    payer: e.payer,
    created_at: e.createdAt,
    installments: e.installments ?? null,
    installment_number: e.installmentNumber ?? null,
    installment_group_id: e.installmentGroupId ?? null,
  }
}

function expenseFromDb(e: any): Expense {
  return {
    id: e.id,
    description: e.description,
    amount: Number(e.amount),
    date: e.date,
    categoryId: e.category_id,
    payer: e.payer,
    createdAt: e.created_at,
    installments: e.installments ?? undefined,
    installmentNumber: e.installment_number ?? undefined,
    installmentGroupId: e.installment_group_id ?? undefined,
  }
}

function fixedToDb(f: FixedExpense) {
  return {
    id: f.id,
    description: f.description,
    amount: f.amount,
    category_id: f.categoryId,
    payer: f.payer,
    day_of_month: f.dayOfMonth,
    active: f.active,
    start_year: f.startYear,
    start_month: f.startMonth,
    created_at: f.createdAt,
  }
}

function fixedFromDb(f: any): FixedExpense {
  return {
    id: f.id,
    description: f.description,
    amount: Number(f.amount),
    categoryId: f.category_id,
    payer: f.payer,
    dayOfMonth: f.day_of_month,
    active: f.active,
    startYear: f.start_year,
    startMonth: f.start_month,
    createdAt: f.created_at,
  }
}

function categoryToDb(c: Category) {
  return { id: c.id, name: c.name, color: c.color, icon: c.icon, is_custom: c.isCustom ?? false }
}

function categoryFromDb(c: any): Category {
  return { id: c.id, name: c.name, color: c.color, icon: c.icon, isCustom: c.is_custom }
}

function businessToDb(e: BusinessEntry, company: string) {
  return {
    id: e.id,
    description: e.description,
    type: e.type,
    amount: e.amount,
    date: e.date,
    client: e.client,
    status: e.status,
    company,
    created_at: e.createdAt,
  }
}

function businessFromDb(e: any): BusinessEntry {
  return {
    id: e.id,
    description: e.description,
    type: e.type,
    amount: Number(e.amount),
    date: e.date,
    client: e.client,
    status: e.status,
    createdAt: e.created_at,
  }
}
// ─────────────────────────────────────────────────────────────────────────────

type TabType = 'personal' | 'ceraame' | 'jv'
type SyncStatus = 'idle' | 'saving' | 'saved' | 'error'

export default function App() {
  const [tab, setTab] = useState<TabType>('personal')
  const [synced, setSynced] = useState(false)
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle')
  const [syncError, setSyncError] = useState<string | null>(null)

  // Finanças pessoais
  const [expenses, setExpenses] = useLocalStorage<Expense[]>('fh_expenses', [])
  const [fixedExpenses, setFixedExpenses] = useLocalStorage<FixedExpense[]>('fh_fixed', [])
  const [categories, setCategories] = useLocalStorage<Category[]>('fh_categories', DEFAULT_CATEGORIES)
  const [personNames, setPersonNames] = useLocalStorage<PersonNames>('fh_names', {
    person1: 'Victor',
    person2: 'Erica',
  })

  // Empresas
  const [ceraamEntries, setCeraamEntries] = useLocalStorage<BusinessEntry[]>('fh_ceraame', [])
  const [jvEntries, setJvEntries] = useLocalStorage<BusinessEntry[]>('fh_jv', [])

  // ─── CARREGAR do Supabase ────────────────────────────────────────────────
  useEffect(() => {
    if (!hasSupabase || !supabase) return
    async function load() {
      try {
        const [
          { data: exp, error: e1 },
          { data: fixed, error: e2 },
          { data: cats, error: e3 },
          { data: ceraame, error: e4 },
          { data: jv, error: e5 },
          { data: settings },
        ] = await Promise.all([
          supabase!.from('expenses').select('*').order('created_at'),
          supabase!.from('fixed_expenses').select('*').order('created_at'),
          supabase!.from('categories').select('*'),
          supabase!.from('business_entries').select('*').eq('company', 'ceraame').order('created_at'),
          supabase!.from('business_entries').select('*').eq('company', 'jv').order('created_at'),
          supabase!.from('settings').select('*').eq('key', 'person_names').maybeSingle(),
        ])

        if (e1) console.warn('expenses load error:', e1.message)
        if (e2) console.warn('fixed load error:', e2.message)
        if (e3) console.warn('categories load error:', e3.message)
        if (e4) console.warn('ceraame load error:', e4.message)
        if (e5) console.warn('jv load error:', e5.message)

        if (exp?.length)     setExpenses(exp.map(expenseFromDb))
        if (fixed?.length)   setFixedExpenses(fixed.map(fixedFromDb))
        if (cats?.length)    setCategories(cats.map(categoryFromDb))
        if (ceraame?.length) setCeraamEntries(ceraame.map(businessFromDb))
        if (jv?.length)      setJvEntries(jv.map(businessFromDb))
        if (settings?.value) setPersonNames(settings.value as PersonNames)
      } catch (err: any) {
        console.warn('Erro ao carregar Supabase:', err)
      } finally {
        setSynced(true) // sempre libera o save, mesmo se falhou o load
      }
    }
    load()
  }, [])

  // ─── SALVAR no Supabase ──────────────────────────────────────────────────
  useEffect(() => {
    if (!hasSupabase || !supabase || !synced) return
    setSyncStatus('saving')
    const t = setTimeout(async () => {
      try {
        const results = await Promise.all([
          expenses.length
            ? supabase!.from('expenses').upsert(expenses.map(expenseToDb), { onConflict: 'id' }).then(r => r)
            : Promise.resolve({ error: null }),
          fixedExpenses.length
            ? supabase!.from('fixed_expenses').upsert(fixedExpenses.map(fixedToDb), { onConflict: 'id' }).then(r => r)
            : Promise.resolve({ error: null }),
          categories.length
            ? supabase!.from('categories').upsert(categories.map(categoryToDb), { onConflict: 'id' }).then(r => r)
            : Promise.resolve({ error: null }),
          (() => {
            const allBusiness = [
              ...ceraamEntries.map(e => businessToDb(e, 'ceraame')),
              ...jvEntries.map(e => businessToDb(e, 'jv')),
            ]
            return allBusiness.length
              ? supabase!.from('business_entries').upsert(allBusiness, { onConflict: 'id' }).then(r => r)
              : Promise.resolve({ error: null })
          })(),
          supabase!.from('settings').upsert(
            { key: 'person_names', value: personNames, updated_at: new Date().toISOString() },
            { onConflict: 'key' }
          ).then(r => r),
        ])

        const errors = results.map(r => r?.error).filter(Boolean)
        if (errors.length) {
          console.error('Supabase save errors:', errors)
          setSyncError((errors as any[]).map((e: any) => e.message).join('; '))
          setSyncStatus('error')
        } else {
          setSyncError(null)
          setSyncStatus('saved')
          setTimeout(() => setSyncStatus('idle'), 2000)
        }
      } catch (err: any) {
        console.error('Erro ao salvar:', err)
        setSyncError(err.message)
        setSyncStatus('error')
      }
    }, 1500)
    return () => clearTimeout(t)
  }, [expenses, fixedExpenses, categories, ceraamEntries, jvEntries, personNames, synced])

  // ─── HANDLERS PESSOAL ────────────────────────────────────────────────────
  function addExpenses(list: Omit<Expense, 'id' | 'createdAt'>[]) {
    const now = new Date().toISOString()
    setExpenses(prev => [...prev, ...list.map(e => ({ ...e, id: genId(), createdAt: now }))])
  }
  function deleteExpense(id: string) {
    setExpenses(prev => prev.filter(e => e.id !== id))
    supabase?.from('expenses').delete().eq('id', id)
  }
  function deleteInstallmentGroup(groupId: string) {
    setExpenses(prev => prev.filter(e => e.installmentGroupId !== groupId))
    supabase?.from('expenses').delete().eq('installment_group_id', groupId)
  }
  function addFixed(f: Omit<FixedExpense, 'id' | 'createdAt'>) {
    setFixedExpenses(prev => [...prev, { ...f, id: genId(), createdAt: new Date().toISOString() }])
  }
  function deleteFixed(id: string) {
    setFixedExpenses(prev => prev.filter(f => f.id !== id))
    supabase?.from('fixed_expenses').delete().eq('id', id)
  }
  function toggleFixed(id: string) {
    setFixedExpenses(prev => prev.map(f => {
      if (f.id !== id) return f
      const updated = { ...f, active: !f.active }
      supabase?.from('fixed_expenses').update({ active: updated.active }).eq('id', id)
      return updated
    }))
  }
  function addCategory(c: Omit<Category, 'id'>) {
    setCategories(prev => [...prev, { ...c, id: genId() }])
  }

  // ─── HANDLERS EMPRESA (genérico) ─────────────────────────────────────────
  function makeBusinessHandlers(
    setEntries: React.Dispatch<React.SetStateAction<BusinessEntry[]>>,
  ) {
    return {
      onAdd: (e: Omit<BusinessEntry, 'id' | 'createdAt'>) => {
        setEntries(prev => [...prev, { ...e, id: genId(), createdAt: new Date().toISOString() }])
      },
      onDelete: (id: string) => {
        setEntries(prev => prev.filter(e => e.id !== id))
        supabase?.from('business_entries').delete().eq('id', id)
      },
      onUpdateStatus: (id: string, status: BusinessStatus) => {
        setEntries(prev => prev.map(e => e.id === id ? { ...e, status } : e))
        supabase?.from('business_entries').update({ status }).eq('id', id)
      },
    }
  }

  const ceraamHandlers = makeBusinessHandlers(setCeraamEntries)
  const jvHandlers     = makeBusinessHandlers(setJvEntries)

  const TABS = [
    { key: 'personal' as TabType, label: 'Pessoal',         icon: '🏠', color: 'indigo' },
    { key: 'ceraame'  as TabType, label: 'Empresa Ceraame', icon: '🏢', color: 'teal'   },
    { key: 'jv'       as TabType, label: 'Empresa JV',      icon: '💼', color: 'violet' },
  ]

  // Status do sync em nuvem
  const cloudBadge = () => {
    if (!hasSupabase) return (
      <div className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border bg-slate-100 border-slate-200 text-slate-500 flex-shrink-0">
        <CloudOff size={13} />
        <span className="hidden sm:block">Local</span>
      </div>
    )
    if (syncStatus === 'error') return (
      <div className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border bg-red-50 border-red-200 text-red-600 flex-shrink-0" title={syncError ?? ''}>
        <AlertCircle size={13} />
        <span className="hidden sm:block">Erro sync</span>
      </div>
    )
    if (syncStatus === 'saving') return (
      <div className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border bg-amber-50 border-amber-200 text-amber-600 flex-shrink-0">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse flex-shrink-0" />
        <span className="hidden sm:block">Salvando…</span>
      </div>
    )
    if (syncStatus === 'saved') return (
      <div className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border bg-emerald-50 border-emerald-200 text-emerald-700 flex-shrink-0">
        <Cloud size={13} />
        <span className="hidden sm:block">Salvo ✓</span>
      </div>
    )
    return (
      <div className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border bg-emerald-50 border-emerald-200 text-emerald-700 flex-shrink-0">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
        <span className="hidden sm:block">Nuvem</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 mesh-bg">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur-sm shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-3">
          {/* Logo */}
          <div className="flex items-center gap-2 mr-1 flex-shrink-0">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-teal-500 flex items-center justify-center shadow-sm">
              <Wallet size={14} className="text-white" />
            </div>
            <span className="font-semibold text-slate-800 text-sm hidden md:block tracking-tight">FinanceHub</span>
          </div>

          {/* Tabs */}
          <nav className="flex gap-1 flex-1 overflow-x-auto">
            {TABS.map(({ key, label, icon, color }) => {
              const active = tab === key
              const colorMap: Record<string, string> = {
                indigo: 'bg-indigo-600 text-white shadow-sm',
                teal:   'bg-teal-600 text-white shadow-sm',
                violet: 'bg-violet-600 text-white shadow-sm',
              }
              return (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap flex-shrink-0 ${
                    active
                      ? colorMap[color]
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                  }`}
                >
                  <span>{icon}</span>
                  <span className="hidden sm:block">{label}</span>
                </button>
              )
            })}
          </nav>

          {cloudBadge()}
        </div>
      </header>

      {/* Banner de erro persistente */}
      {syncStatus === 'error' && syncError && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-2 text-center text-xs text-red-600">
          ⚠️ Erro ao salvar na nuvem: {syncError}
        </div>
      )}

      <main className="max-w-5xl mx-auto px-4 py-6">
        {tab === 'personal' && (
          <PersonalFinances
            expenses={expenses}
            fixedExpenses={fixedExpenses}
            categories={categories}
            personNames={personNames}
            onAddExpenses={addExpenses}
            onDeleteExpense={deleteExpense}
            onDeleteInstallmentGroup={deleteInstallmentGroup}
            onAddCategory={addCategory}
            onUpdatePersonNames={setPersonNames}
            onAddFixed={addFixed}
            onDeleteFixed={deleteFixed}
            onToggleFixed={toggleFixed}
          />
        )}
        {tab === 'ceraame' && (
          <BusinessFinances
            entries={ceraamEntries}
            companyName="Empresa Ceraame"
            accentColor="teal"
            {...ceraamHandlers}
          />
        )}
        {tab === 'jv' && (
          <BusinessFinances
            entries={jvEntries}
            companyName="Empresa JV"
            accentColor="violet"
            {...jvHandlers}
          />
        )}
      </main>
    </div>
  )
}
