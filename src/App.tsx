import { useState, useEffect } from 'react'
import { Home, Wallet } from 'lucide-react'
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

type TabType = 'personal' | 'ceraame' | 'jv'

export default function App() {
  const [tab, setTab] = useState<TabType>('personal')
  const [synced, setSynced] = useState(false)

  // Finanças pessoais
  const [expenses, setExpenses] = useLocalStorage<Expense[]>('fh_expenses', [])
  const [fixedExpenses, setFixedExpenses] = useLocalStorage<FixedExpense[]>('fh_fixed', [])
  const [categories, setCategories] = useLocalStorage<Category[]>('fh_categories', DEFAULT_CATEGORIES)
  const [personNames, setPersonNames] = useLocalStorage<PersonNames>('fh_names', {
    person1: 'Victor',
    person2: 'Erica',
  })

  // Empresa Ceraame
  const [ceraamEntries, setCeraamEntries] = useLocalStorage<BusinessEntry[]>('fh_ceraame', [])

  // Empresa JV
  const [jvEntries, setJvEntries] = useLocalStorage<BusinessEntry[]>('fh_jv', [])

  // ─── CARREGAR do Supabase ────────────────────────────────────────
  useEffect(() => {
    if (!hasSupabase || !supabase) return
    async function load() {
      try {
        const [
          { data: exp },
          { data: fixed },
          { data: cats },
          { data: ceraame },
          { data: jv },
          { data: settings },
        ] = await Promise.all([
          supabase!.from('expenses').select('*').order('created_at'),
          supabase!.from('fixed_expenses').select('*').order('created_at'),
          supabase!.from('categories').select('*'),
          supabase!.from('business_entries').select('*').eq('company', 'ceraame').order('created_at'),
          supabase!.from('business_entries').select('*').eq('company', 'jv').order('created_at'),
          supabase!.from('settings').select('*').eq('key', 'person_names').single(),
        ])

        if (exp?.length)    setExpenses(exp as Expense[])
        if (fixed?.length)  setFixedExpenses(fixed.map((f: any) => ({
          ...f, dayOfMonth: f.day_of_month,
          startYear: f.start_year, startMonth: f.start_month, createdAt: f.created_at,
        })))
        if (cats?.length)   setCategories(cats.map((c: any) => ({ ...c, isCustom: c.is_custom })))
        if (ceraame?.length) setCeraamEntries(ceraame.map((e: any) => ({ ...e, createdAt: e.created_at })))
        if (jv?.length)     setJvEntries(jv.map((e: any) => ({ ...e, createdAt: e.created_at })))
        if (settings?.value) setPersonNames(settings.value as PersonNames)

        setSynced(true)
      } catch (err) {
        console.warn('Erro ao carregar Supabase, usando localStorage', err)
      }
    }
    load()
  }, [])

  // ─── SALVAR no Supabase ──────────────────────────────────────────
  useEffect(() => {
    if (!hasSupabase || !supabase || !synced) return
    const t = setTimeout(async () => {
      try {
        if (expenses.length)
          await supabase!.from('expenses').upsert(expenses, { onConflict: 'id' })

        if (fixedExpenses.length)
          await supabase!.from('fixed_expenses').upsert(
            fixedExpenses.map(f => ({
              id: f.id, description: f.description, amount: f.amount,
              category_id: f.categoryId, payer: f.payer,
              day_of_month: f.dayOfMonth, active: f.active,
              start_year: f.startYear, start_month: f.startMonth,
              created_at: f.createdAt,
            })), { onConflict: 'id' }
          )

        if (categories.length)
          await supabase!.from('categories').upsert(
            categories.map(c => ({
              id: c.id, name: c.name, color: c.color,
              icon: c.icon, is_custom: c.isCustom ?? false,
            })), { onConflict: 'id' }
          )

        const allBusiness = [
          ...ceraamEntries.map(e => ({ ...e, company: 'ceraame', created_at: e.createdAt })),
          ...jvEntries.map(e => ({ ...e, company: 'jv', created_at: e.createdAt })),
        ]
        if (allBusiness.length)
          await supabase!.from('business_entries').upsert(allBusiness, { onConflict: 'id' })

        await supabase!.from('settings').upsert(
          { key: 'person_names', value: personNames, updated_at: new Date().toISOString() },
          { onConflict: 'key' }
        )
      } catch (err) {
        console.warn('Erro ao salvar:', err)
      }
    }, 1500)
    return () => clearTimeout(t)
  }, [expenses, fixedExpenses, categories, ceraamEntries, jvEntries, personNames, synced])

  // ─── HANDLERS PESSOAL ───────────────────────────────────────────
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

  // ─── HANDLERS EMPRESA (genérico) ────────────────────────────────
  function makeBusinessHandlers(
    entries: BusinessEntry[],
    setEntries: React.Dispatch<React.SetStateAction<BusinessEntry[]>>,
    company: string
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

  const ceraamHandlers = makeBusinessHandlers(ceraamEntries, setCeraamEntries, 'ceraame')
  const jvHandlers     = makeBusinessHandlers(jvEntries,    setJvEntries,     'jv')

  const TABS = [
    { key: 'personal' as TabType, label: 'Pessoal',         icon: '🏠', color: 'indigo' },
    { key: 'ceraame'  as TabType, label: 'Empresa Ceraame', icon: '🏢', color: 'teal'   },
    { key: 'jv'       as TabType, label: 'Empresa JV',      icon: '💼', color: 'violet' },
  ]

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

          {/* Status nuvem */}
          <div className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border flex-shrink-0 ${
            hasSupabase
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
              : 'bg-slate-100 border-slate-200 text-slate-500'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${hasSupabase ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
            <span className="hidden sm:block">{hasSupabase ? 'Nuvem' : 'Local'}</span>
          </div>
        </div>
      </header>

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
