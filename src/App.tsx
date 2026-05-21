import { useState } from 'react'
import { Home, Building2, Wallet, HelpCircle } from 'lucide-react'
import { Category, Expense, FixedExpense, BusinessEntry, BusinessStatus, PersonNames } from './types'
import { useLocalStorage } from './hooks/useLocalStorage'
import { useSyncData } from './hooks/useSyncData'
import PersonalFinances from './components/PersonalFinances'
import BusinessFinances from './components/BusinessFinances'
import SupabaseStatus from './components/SupabaseStatus'

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

  const [expenses, setExpenses] = useLocalStorage<Expense[]>('fh_expenses', [])
  const [fixedExpenses, setFixedExpenses] = useLocalStorage<FixedExpense[]>('fh_fixed', [])
  const [categories, setCategories] = useLocalStorage<Category[]>('fh_categories', DEFAULT_CATEGORIES)
  const [businessEntries, setBusinessEntries] = useLocalStorage<BusinessEntry[]>('fh_business', [])
  const [personNames, setPersonNames] = useLocalStorage<PersonNames>('fh_names', {
    person1: 'Victor',
    person2: 'Erica',
  })

  // Expenses (suporta array para parcelamentos)
  function addExpenses(list: Omit<Expense, 'id' | 'createdAt'>[]) {
    const now = new Date().toISOString()
    setExpenses(prev => [
      ...prev,
      ...list.map(e => ({ ...e, id: genId(), createdAt: now })),
    ])
  }
  function deleteExpense(id: string) {
    setExpenses(prev => prev.filter(e => e.id !== id))
  }
  function deleteInstallmentGroup(groupId: string) {
    setExpenses(prev => prev.filter(e => e.installmentGroupId !== groupId))
  }

  // Fixed expenses
  function addFixed(f: Omit<FixedExpense, 'id' | 'createdAt'>) {
    setFixedExpenses(prev => [...prev, { ...f, id: genId(), createdAt: new Date().toISOString() }])
  }
  function deleteFixed(id: string) {
    setFixedExpenses(prev => prev.filter(f => f.id !== id))
  }
  function toggleFixed(id: string) {
    setFixedExpenses(prev => prev.map(f => f.id === id ? { ...f, active: !f.active } : f))
  }

  // Categories
  function addCategory(c: Omit<Category, 'id'>) {
    setCategories(prev => [...prev, { ...c, id: genId() }])
  }

  // Business
  function addBusiness(e: Omit<BusinessEntry, 'id' | 'createdAt'>) {
    setBusinessEntries(prev => [...prev, { ...e, id: genId(), createdAt: new Date().toISOString() }])
  }
  function deleteBusiness(id: string) {
    setBusinessEntries(prev => prev.filter(e => e.id !== id))
  }
  function updateBusinessStatus(id: string, status: BusinessStatus) {
    setBusinessEntries(prev => prev.map(e => e.id === id ? { ...e, status } : e))
  }

  // Sincronizar com Supabase automaticamente
  useSyncData(expenses, fixedExpenses, categories, businessEntries, personNames)

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

          {/* Status + Help */}
          <div className="flex items-center gap-2 ml-auto">
            <SupabaseStatus />
            <a
              href="https://github.com/victorcosta/finance-app/blob/main/SUPABASE_SETUP.md"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-ghost p-1.5 text-slate-500 hover:text-slate-700"
              title="Configurar Supabase"
            >
              <HelpCircle size={16} />
            </a>
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
