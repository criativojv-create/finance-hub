import { useState, useMemo } from 'react'
import {
  Plus, ChevronLeft, ChevronRight, Trash2, Tag,
  TrendingDown, User, PieChart as PieIcon,
  RefreshCw, Calendar, CreditCard, ToggleLeft, ToggleRight, AlertCircle
} from 'lucide-react'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts'
import { Category, Expense, FixedExpense, PersonNames } from '../types'
import AddExpenseModal from './AddExpenseModal'
import AddCategoryModal from './AddCategoryModal'

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const MONTHS_SHORT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

type TabView = 'monthly' | 'fixed' | 'future'
type ExpenseMode = 'normal' | 'fixed' | 'installment'

interface DisplayExpense extends Expense {
  _isFixed?: boolean
  _fixedId?: string
}

interface Props {
  expenses: Expense[]
  fixedExpenses: FixedExpense[]
  categories: Category[]
  personNames: PersonNames
  onAddExpenses: (list: Omit<Expense, 'id' | 'createdAt'>[]) => void
  onDeleteExpense: (id: string) => void
  onDeleteInstallmentGroup: (groupId: string) => void
  onAddCategory: (c: Omit<Category, 'id'>) => void
  onUpdatePersonNames: (names: PersonNames) => void
  onAddFixed: (f: Omit<FixedExpense, 'id' | 'createdAt'>) => void
  onDeleteFixed: (id: string) => void
  onToggleFixed: (id: string) => void
}

function clampDay(day: number, year: number, month: number) {
  return Math.min(day, new Date(year, month + 1, 0).getDate())
}

function virtualFixed(f: FixedExpense, year: number, month: number): DisplayExpense {
  const day = clampDay(f.dayOfMonth, year, month)
  const mm = String(month + 1).padStart(2, '0')
  const dd = String(day).padStart(2, '0')
  return {
    id: `vf-${f.id}-${year}-${month}`,
    description: f.description,
    amount: f.amount,
    date: `${year}-${mm}-${dd}`,
    categoryId: f.categoryId,
    payer: f.payer,
    createdAt: f.createdAt,
    _isFixed: true,
    _fixedId: f.id,
  }
}

export default function PersonalFinances({
  expenses, fixedExpenses, categories, personNames,
  onAddExpenses, onDeleteExpense, onDeleteInstallmentGroup, onAddCategory,
  onUpdatePersonNames, onAddFixed, onDeleteFixed, onToggleFixed,
}: Props) {
  const today = new Date()
  const [month, setMonth] = useState(today.getMonth())
  const [year, setYear] = useState(today.getFullYear())
  const [tabView, setTabView] = useState<TabView>('monthly')
  const [showAddExpense, setShowAddExpense] = useState(false)
  const [addExpenseMode, setAddExpenseMode] = useState<ExpenseMode>('normal')
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [chartType, setChartType] = useState<'pie' | 'bar'>('pie')
  const [editingName, setEditingName] = useState<'person1' | 'person2' | null>(null)
  const [nameInput, setNameInput] = useState('')

  function openAdd(mode: ExpenseMode = 'normal') {
    setAddExpenseMode(mode)
    setShowAddExpense(true)
  }

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  // Fixed expenses applicable for a given month/year
  function getFixedForMonth(y: number, m: number): DisplayExpense[] {
    return fixedExpenses
      .filter(f => f.active && (y > f.startYear || (y === f.startYear && m >= f.startMonth)))
      .map(f => virtualFixed(f, y, m))
  }

  // Regular expenses for current month
  const regularFiltered = useMemo(() =>
    expenses.filter(e => {
      const d = new Date(e.date + 'T12:00:00')
      return d.getMonth() === month && d.getFullYear() === year
    }), [expenses, month, year])

  // All display expenses = regular + virtual fixed
  const allFiltered = useMemo<DisplayExpense[]>(() => {
    const fixed = getFixedForMonth(year, month)
    return [...regularFiltered as DisplayExpense[], ...fixed]
  }, [regularFiltered, fixedExpenses, year, month])

  const total = allFiltered.reduce((s, e) => s + e.amount, 0)

  const byCategory = useMemo(() => {
    const map: Record<string, number> = {}
    allFiltered.forEach(e => { map[e.categoryId] = (map[e.categoryId] || 0) + e.amount })
    return categories
      .map(c => ({ ...c, total: map[c.id] || 0 }))
      .filter(c => c.total > 0)
      .sort((a, b) => b.total - a.total)
  }, [allFiltered, categories])

  const byPerson = useMemo(() => {
    let p1 = 0, p2 = 0, both = 0
    allFiltered.forEach(e => {
      if (e.payer === 'person1') p1 += e.amount
      else if (e.payer === 'person2') p2 += e.amount
      else both += e.amount
    })
    return { person1: p1 + both / 2, person2: p2 + both / 2 }
  }, [allFiltered])

  function startEditName(key: 'person1' | 'person2') {
    setEditingName(key)
    setNameInput(personNames[key])
  }
  function saveName() {
    if (!editingName || !nameInput.trim()) return
    onUpdatePersonNames({ ...personNames, [editingName]: nameInput.trim() })
    setEditingName(null)
  }

  const getCat = (id: string) => categories.find(c => c.id === id)

  // Future months: next 4 months from today
  const futureMonths = useMemo(() =>
    Array.from({ length: 4 }, (_, i) => {
      const d = new Date(today.getFullYear(), today.getMonth() + i + 1, 1)
      return { month: d.getMonth(), year: d.getFullYear() }
    }), [])

  const totalFixedMonthly = fixedExpenses
    .filter(f => f.active)
    .reduce((s, f) => s + f.amount, 0)

  const TABS = [
    { key: 'monthly' as TabView, label: 'Este Mês', icon: Calendar },
    { key: 'fixed' as TabView,   label: 'Despesas Fixas', icon: RefreshCw },
    { key: 'future' as TabView,  label: 'Lançamentos Futuros', icon: CreditCard },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-semibold text-2xl text-slate-900 tracking-tight">Finanças Pessoais</h2>
          <p className="text-sm text-slate-500 mt-0.5">Controle de gastos do casal</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setShowAddCategory(true)} className="btn-secondary">
            <Tag size={15} /> Categoria
          </button>
          <button onClick={() => openAdd('fixed')} className="btn-secondary">
            <RefreshCw size={15} /> Nova Fixa
          </button>
          <button onClick={() => openAdd('normal')} className="btn-primary">
            <Plus size={15} /> Novo Gasto
          </button>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 bg-slate-100 rounded-2xl p-1">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTabView(key)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-sm font-medium transition-all duration-200 ${
              tabView === key
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Icon size={14} />
            <span className="hidden sm:block">{label}</span>
          </button>
        ))}
      </div>

      {/* ─── TAB: ESTE MÊS ─── */}
      {tabView === 'monthly' && (
        <div className="space-y-5">
          {/* Month nav */}
          <div className="card p-4 flex items-center justify-between">
            <button onClick={prevMonth} className="btn-ghost p-2"><ChevronLeft size={18} /></button>
            <div className="text-center">
              <p className="font-semibold text-xl text-slate-900">{MONTHS[month]}</p>
              <p className="text-sm text-slate-500">{year}</p>
            </div>
            <button onClick={nextMonth} className="btn-ghost p-2"><ChevronRight size={18} /></button>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card p-5 space-y-1 animate-slide-up stagger-1 relative overflow-hidden">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wide">
                <TrendingDown size={14} className="text-slate-400" /> Total do Mês
              </div>
              <p className="number-display text-2xl font-bold text-slate-900">{fmt(total)}</p>
              <p className="text-xs text-slate-400">{allFiltered.length} lançamento(s)</p>
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-slate-300 to-transparent" />
            </div>

            <div className="card p-5 space-y-1 animate-slide-up stagger-2 relative overflow-hidden">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wide">
                <User size={14} className="text-indigo-500" />
                {editingName === 'person1' ? (
                  <input className="bg-transparent border-b border-indigo-400 text-indigo-600 text-xs outline-none w-20"
                    value={nameInput} onChange={e => setNameInput(e.target.value)}
                    onBlur={saveName} onKeyDown={e => e.key === 'Enter' && saveName()} autoFocus />
                ) : (
                  <button onClick={() => startEditName('person1')} className="hover:text-indigo-600 transition-colors">
                    {personNames.person1}
                  </button>
                )}
              </div>
              <p className="number-display text-2xl font-bold text-indigo-600">{fmt(byPerson.person1)}</p>
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-400 to-transparent" />
            </div>

            <div className="card p-5 space-y-1 animate-slide-up stagger-3 relative overflow-hidden">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wide">
                <User size={14} className="text-violet-500" />
                {editingName === 'person2' ? (
                  <input className="bg-transparent border-b border-violet-400 text-violet-600 text-xs outline-none w-20"
                    value={nameInput} onChange={e => setNameInput(e.target.value)}
                    onBlur={saveName} onKeyDown={e => e.key === 'Enter' && saveName()} autoFocus />
                ) : (
                  <button onClick={() => startEditName('person2')} className="hover:text-violet-600 transition-colors">
                    {personNames.person2}
                  </button>
                )}
              </div>
              <p className="number-display text-2xl font-bold text-violet-600">{fmt(byPerson.person2)}</p>
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-400 to-transparent" />
            </div>
          </div>

          {/* Chart + breakdown */}
          {byCategory.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-slate-700 text-sm flex items-center gap-2">
                    <PieIcon size={15} className="text-indigo-500" /> Por Categoria
                  </h3>
                  <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
                    {(['pie', 'bar'] as const).map(t => (
                      <button key={t} onClick={() => setChartType(t)}
                        className={`px-3 py-1 rounded-md text-xs font-medium transition-all duration-200 ${
                          chartType === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                        }`}>
                        {t === 'pie' ? 'Pizza' : 'Barras'}
                      </button>
                    ))}
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  {chartType === 'pie' ? (
                    <PieChart>
                      <Pie data={byCategory} dataKey="total" nameKey="name" cx="50%" cy="50%" outerRadius={85} paddingAngle={3}>
                        {byCategory.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Pie>
                      <Tooltip formatter={(v: number) => fmt(v)}
                        contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', color: '#1e293b', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} />
                    </PieChart>
                  ) : (
                    <BarChart data={byCategory} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `R$${v}`} />
                      <Tooltip formatter={(v: number) => fmt(v)}
                        contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', color: '#1e293b', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} />
                      <Bar dataKey="total" radius={[6, 6, 0, 0]}>
                        {byCategory.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Bar>
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>

              <div className="card p-5">
                <h3 className="font-semibold text-slate-700 text-sm mb-4">Resumo por Categoria</h3>
                <div className="space-y-3 max-h-52 overflow-y-auto pr-1">
                  {byCategory.map(cat => (
                    <div key={cat.id} className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                      <span className="text-sm text-slate-600 flex-1">{cat.icon} {cat.name}</span>
                      <span className="number-display text-sm font-semibold text-slate-900">{fmt(cat.total)}</span>
                      <span className="text-xs font-medium text-slate-400 w-10 text-right">
                        {total > 0 ? Math.round((cat.total / total) * 100) : 0}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Expense list */}
          <div className="card overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-700 text-sm">Todas as Despesas</h3>
            </div>
            {allFiltered.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-4xl mb-3 opacity-30">💸</div>
                <p className="text-slate-400 text-sm">Nenhuma despesa neste mês</p>
                <button onClick={() => openAdd()} className="btn-primary mt-4 mx-auto">
                  <Plus size={15} /> Adicionar gasto
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {allFiltered
                  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                  .map(expense => {
                    const cat = getCat(expense.categoryId)
                    const isInstallment = !!(expense.installments && expense.installments > 1)
                    return (
                      <div key={expense.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors group">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                          style={{ backgroundColor: `${cat?.color}15` }}>
                          {cat?.icon || '💰'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="text-sm font-medium text-slate-800 truncate">{expense.description}</p>
                            {expense._isFixed && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex-shrink-0">
                                <RefreshCw size={9} /> Fixa
                              </span>
                            )}
                            {isInstallment && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 flex-shrink-0">
                                <CreditCard size={9} /> {expense.installmentNumber}/{expense.installments}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400">
                            {cat?.name} · {new Date(expense.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="number-display text-sm font-bold text-slate-900">{fmt(expense.amount)}</p>
                          <p className="text-xs text-slate-400">
                            {expense.payer === 'both' ? 'Ambos' : expense.payer === 'person1' ? personNames.person1 : personNames.person2}
                          </p>
                        </div>
                        {expense._isFixed ? (
                          <button
                            onClick={() => setTabView('fixed')}
                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all duration-200"
                            title="Gerenciar em Despesas Fixas"
                          >
                            <RefreshCw size={14} />
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              if (expense.installmentGroupId) {
                                if (confirm(`Excluir todas as ${expense.installments} parcelas?`)) {
                                  onDeleteInstallmentGroup(expense.installmentGroupId)
                                }
                              } else {
                                onDeleteExpense(expense.id)
                              }
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-all duration-200"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    )
                  })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── TAB: DESPESAS FIXAS ─── */}
      {tabView === 'fixed' && (
        <div className="space-y-5">
          {/* Summary */}
          <div className="grid grid-cols-2 gap-4">
            <div className="card p-5 relative overflow-hidden">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Total Mensal Fixo</p>
              <p className="number-display text-2xl font-bold text-slate-900">{fmt(totalFixedMonthly)}</p>
              <p className="text-xs text-slate-400 mt-1">{fixedExpenses.filter(f => f.active).length} ativa(s)</p>
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-400 to-transparent" />
            </div>
            <div className="card p-5 relative overflow-hidden">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Pausadas</p>
              <p className="number-display text-2xl font-bold text-slate-500">
                {fixedExpenses.filter(f => !f.active).length}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {fmt(fixedExpenses.filter(f => !f.active).reduce((s, f) => s + f.amount, 0))}/mês pausados
              </p>
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-slate-300 to-transparent" />
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-semibold text-slate-700 text-sm">Recorrências Cadastradas</h3>
              <button onClick={() => openAdd('fixed')} className="btn-primary py-1.5 text-xs">
                <Plus size={13} /> Nova Fixa
              </button>
            </div>

            {fixedExpenses.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-4xl mb-3 opacity-30">🔄</div>
                <p className="text-slate-400 text-sm">Nenhuma despesa fixa cadastrada</p>
                <p className="text-slate-300 text-xs mt-1">Aluguel, streaming, planos mensais...</p>
                <button onClick={() => openAdd('fixed')} className="btn-primary mt-4 mx-auto">
                  <Plus size={15} /> Criar primeira fixa
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {fixedExpenses
                  .sort((a, b) => b.amount - a.amount)
                  .map(fixed => {
                    const cat = getCat(fixed.categoryId)
                    return (
                      <div key={fixed.id} className={`flex items-center gap-3 px-4 py-3.5 transition-colors group ${fixed.active ? 'hover:bg-slate-50' : 'opacity-50 bg-slate-50/50'}`}>
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                          style={{ backgroundColor: `${cat?.color}15` }}>
                          {cat?.icon || '🔄'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800 truncate">{fixed.description}</p>
                          <p className="text-xs text-slate-400">
                            {cat?.name} · Dia {fixed.dayOfMonth} · {fixed.payer === 'both' ? 'Ambos' : fixed.payer === 'person1' ? personNames.person1 : personNames.person2}
                          </p>
                        </div>
                        <p className="number-display text-sm font-bold text-slate-900 flex-shrink-0">{fmt(fixed.amount)}</p>
                        <button
                          onClick={() => onToggleFixed(fixed.id)}
                          className="flex-shrink-0 text-slate-400 hover:text-slate-600 transition-colors"
                          title={fixed.active ? 'Pausar' : 'Ativar'}
                        >
                          {fixed.active
                            ? <ToggleRight size={24} className="text-emerald-500" />
                            : <ToggleLeft size={24} />}
                        </button>
                        <button
                          onClick={() => onDeleteFixed(fixed.id)}
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-all duration-200"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )
                  })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── TAB: LANÇAMENTOS FUTUROS ─── */}
      {tabView === 'future' && (
        <div className="space-y-5">
          {/* Info banner */}
          <div className="flex items-start gap-3 bg-indigo-50 border border-indigo-100 rounded-2xl px-4 py-3">
            <AlertCircle size={16} className="text-indigo-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-indigo-700">
              Previsão dos próximos 4 meses — inclui parcelas programadas e despesas fixas ativas.
            </p>
          </div>

          {futureMonths.map(({ month: fm, year: fy }) => {
            // Regular future expenses (including installments)
            const futureRegular = expenses.filter(e => {
              const d = new Date(e.date + 'T12:00:00')
              return d.getMonth() === fm && d.getFullYear() === fy
            }) as DisplayExpense[]

            // Virtual fixed expenses for that month
            const futureFixed = getFixedForMonth(fy, fm)

            const all: DisplayExpense[] = [
              ...futureRegular,
              ...futureFixed,
            ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

            const monthTotal = all.reduce((s, e) => s + e.amount, 0)

            return (
              <div key={`${fy}-${fm}`} className="card overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center">
                      <span className="text-xs font-bold text-indigo-700">{MONTHS_SHORT[fm]}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">{MONTHS[fm]} {fy}</p>
                      <p className="text-xs text-slate-400">{all.length} lançamento(s)</p>
                    </div>
                  </div>
                  <p className="number-display font-bold text-lg text-slate-900">{fmt(monthTotal)}</p>
                </div>

                {all.length === 0 ? (
                  <p className="text-slate-400 text-sm px-5 py-4">Nenhum lançamento previsto.</p>
                ) : (
                  <>
                    <div className="divide-y divide-slate-50">
                      {all.map(e => {
                        const cat = getCat(e.categoryId)
                        const isInstallment = !!(e.installments && e.installments > 1)
                        return (
                          <div key={e.id} className="flex items-center gap-3 px-4 py-3">
                            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                              style={{ backgroundColor: `${cat?.color}15` }}>
                              {cat?.icon || '💰'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <p className="text-sm font-medium text-slate-700 truncate">{e.description}</p>
                                {e._isFixed && (
                                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex-shrink-0">
                                    <RefreshCw size={9} /> Fixa
                                  </span>
                                )}
                                {isInstallment && (
                                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 flex-shrink-0">
                                    <CreditCard size={9} /> {e.installmentNumber}/{e.installments}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-400">
                                {cat?.name} · Dia {new Date(e.date + 'T12:00:00').getDate()}
                              </p>
                            </div>
                            <p className="number-display text-sm font-bold text-slate-800 flex-shrink-0">{fmt(e.amount)}</p>
                          </div>
                        )
                      })}
                    </div>

                    {/* Total a pagar no final */}
                    <div className="flex items-center justify-between px-5 py-3.5 bg-indigo-50 border-t border-indigo-100">
                      <div className="flex items-center gap-2">
                        <TrendingDown size={15} className="text-indigo-500" />
                        <span className="text-sm font-semibold text-indigo-700">Total a pagar</span>
                        <span className="text-xs text-indigo-400">{all.length} lançamento(s)</span>
                      </div>
                      <p className="number-display text-lg font-bold text-indigo-700">{fmt(monthTotal)}</p>
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      )}

      {showAddExpense && (
        <AddExpenseModal
          categories={categories}
          personNames={personNames}
          initialMode={addExpenseMode}
          onAddExpenses={onAddExpenses}
          onAddFixed={onAddFixed}
          onClose={() => setShowAddExpense(false)}
        />
      )}
      {showAddCategory && (
        <AddCategoryModal onAdd={onAddCategory} onClose={() => setShowAddCategory(false)} />
      )}
    </div>
  )
}
