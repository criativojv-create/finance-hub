import { useState, useEffect } from 'react'
import { Home, Building2, Wallet } from 'lucide-react'
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

export default function App() {
  const [tab, setTab] = useState<'personal' | 'business'>('personal')
  const [synced, setSynced] = useState(false)

  const [expenses, setExpenses] = useLocalStorage<Expense[]>('fh_expenses', [])
  const [fixedExpenses, setFixedExpenses] = useLocalStorage<FixedExpense[]>('fh_fixed', [])
  const [categories, setCategories] = useLocalStorage<Category[]>('fh_categories', DEFAULT_CATEGORIES)
  const [businessEntries, setBusinessEntries] = useLocalStorage<BusinessEntry[]>('fh_business', [])
  const [personNames, setPersonNames] = useLocalStorage<PersonNames>('fh_names', {
    person1: 'Victor',
    person2: 'Erica',
  })

  // ─── CARREGAR dados do Supabase ao iniciar ───────────────────────
  useEffect(() => {
    if (!hasSupabase || !supabase) return
    async function loadFromSupabase() {
      try {
        const [
          { data: exp },
          { data: fixed },
          { data: cats },
          { data: biz },
          { data: settings },
        ] = await Promise.all([
          supabase!.from('expenses').select('*').order('created_at'),
          supabase!.from('fixed_expenses').select('*').order('created_at'),
          supabase!.from('categories').select('*'),
          supabase!.from('business_entries').select('*').order('created_at'),
          supabase!.from('settings').select('*').eq('key', 'person_names').single(),
        ])

        if (exp && exp.length > 0) setExpenses(exp as Expense[])
        if (fixed && fixed.length > 0) setFixedExpenses(fixed.map((f: any) => ({
          ...f,
          dayOfMonth: f.day_of_month,
          startYear: f.start_year,
          startMonth: f.start_month,
          createdAt: f.created_at,
        })) as FixedExpense[])
        if (cats && cats.length > 0) setCategories(cats.map((c: any) => ({
          ...c,
          isCustom: c.is_custom,
        })) as Category[])
        if (biz && biz.length > 0) setBusinessEntries(biz.map((e: any) => ({
          ...e,
          createdAt: e.created_at,
        })) as BusinessEntry[])
        if (settings?.value) setPersonNames(settings.value as PersonNames)

        setSynced(true)
        console.log('✅ Dados carregados do Supabase')
      } catch (err) {
        console.warn('Erro ao carregar do Supabase, usando localStorage', err)
        setSynced(false)
      }
    }
    loadFromSupabase()
  }, [])

  // ─── SALVAR no Supabase após cada mudança ────────────────────────
  useEffect(() => {
    if (!hasSupabase || !supabase || !synced) return
    const t = setTimeout(async () => {
      try {
        if (expenses.length > 0)
          await supabase!.from('expenses').upsert(expenses, { onConflict: 'id' })

        if (fixedExpenses.length > 0)
          await supabase!.from('fixed_expenses').upsert(
            fixedExpenses.map(f => ({
              id: f.id, description: f.description, amount: f.amount,
              category_id: f.categoryId, payer: f.payer,
              day_of_month: f.dayOfMonth, active: f.active,
              start_year: f.startYear, start_month: f.startMonth,
              created_at: f.createdAt,
            })),
            { onConflict: 'id' }
          )

        if (categories.length > 0)
          await supabase!.from('categories').upsert(
            categories.map(c => ({
              id: c.id, name: c.name, color: c.color,
              icon: c.icon, is_custom: c.isCustom ?? false,
            })),
            { onConflict: 'id' }
          )

        if (businessEntries.length > 0)
          await supabase!.from('business_entries').upsert(
            businessEntries.map(e => ({
              id: e.id, description: e.description, type: e.type,
              amount: e.amount, date: e.date, client: e.client,
              status: e.status, created_at: e.createdAt,
            })),
            { onConflict: 'id' }
          )

        await supabase!.from('settings').upsert(
          { key: 'person_names', value: personNames, updated_at: new Date().toISOString() },
          { onConflict: 'key' }
        )
        console.log('✅ Dados salvos no Supabase')
      } catch (err) {
        console.warn('Erro ao salvar no Supabase:', err)
      }
    }, 1500)
    return () => clearTimeout(t)
  }, [expenses, fixedExpenses, categories, businessEntries, personNames, synced])

  // ─── HANDLERS ───────────────────────────────────────────────────
  function addExpenses(list: Omit<Expense, 'id' | 'createdAt'>[]) {
    const now = new Date().toISOString()
    setExpenses(prev => [...prev, ...list.map(e => ({ ...e, id: genId(), createdAt: now }))])
  }
  function deleteExpense(id: string) {
    setExpenses(prev => prev.filter(e => e.id !== id))
    if (hasSupabase && supabase) supabase.from('expenses').delete().eq('id', id)
  }
  function deleteInstallmentGroup(groupId: string) {
    setExpenses(prev => prev.filter(e => e.installmentGroupId !== groupId))
    if (hasSupabase && supabase) supabase.from('expenses').delete().eq('installment_group_id', groupId)
  }
  function addFixed(f: Omit<FixedExpense, 'id' | 'createdAt'>) {
    setFixedExpenses(prev => [...prev, { ...f, id: genId(), createdAt: new Date().toISOString() }])
  }
  function deleteFixed(id: string) {
    setFixedExpenses(prev => prev.filter(f => f.id !== id))
    if (hasSupabase && supabase) supabase.from('fixed_expenses').delete().eq('id', id)
  }
  function toggleFixed(id: string) {
    setFixedExpenses(prev => prev.map(f => {
      if (f.id !== id) return f
      const updated = { ...f, active: !f.active }
      if (hasSupabase && supabase) supabase.from('fixed_expenses').update({ active: updated.active }).eq('id', id)
      return updated
    }))
  }
  function addCategory(c: Omit<Category, 'id'>) {
    setCategories(prev => [...prev, { ...c, id: genId() }])
  }
  function addBusiness(e: Omit<BusinessEntry, 'id' | 'createdAt'>) {
    setBusinessEntries(prev => [...prev, { ...e, id: genId(), createdAt: new Date().toISOString() }])
  }
  function deleteBusiness(id: string) {
    setBusinessEntries(prev => prev.filter(e => e.id !== id))
    if (hasSupabase && supabase) supabase.from('business_entries').delete().eq('id', id)
  }
  function updateBusinessStatus(id: string, status: BusinessStatus) {
    setBusinessEntries(prev => prev.map(e => e.id === id ? { ...e, status } : e))
    if (hasSupabase && supabase) supabase.from('business_entries').update({ status }).eq('id', id)
  }

  return (
    <div className="min-h-screen bg-slate-50 mesh-bg">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur-sm shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-4">
          <div className="flex items-center gap-2 mr-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-teal-500 flex items-center justify-center shadow-sm">
              <Wallet size={14} className="text-white" />
            </div>
            <span className="font-semibold text-slate-800 text-sm hidden sm:block tracking-tight">FinanceHub</span>
          </div>

          <nav className="flex gap-1 flex-1">
            <button
              onClick={() => setTab('personal')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                tab === 'personal'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
              }`}
            >
              <Home size={15} />
              <span className="hidden sm:block">Pessoal</span>
            </button>
            <button
              onClick={() => setTab('business')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                tab === 'business'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
              }`}
            >
              <Building2 size={15} />
              <span className="hidden sm:block">Empresa</span>
            </button>
          </nav>

          {/* Status de sincronização */}
          <div className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border ${
            hasSupabase
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
              : 'bg-slate-100 border-slate-200 text-slate-500'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${hasSupabase ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
            <span className="hidden sm:block">{hasSupabase ? 'Salvando na nuvem' : 'Modo local'}</span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {tab === 'personal' ? (
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
        ) : (
          <BusinessFinances
            entries={businessEntries}
            onAdd={addBusiness}
            onDelete={deleteBusiness}
            onUpdateStatus={updateBusinessStatus}
          />
        )}
      </main>
    </div>
  )
}
