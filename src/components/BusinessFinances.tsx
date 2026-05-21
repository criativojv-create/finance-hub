import { useState, useMemo } from 'react'
import {
  Plus, ChevronLeft, ChevronRight, Trash2,
  TrendingUp, Clock, AlertTriangle, CheckCircle, X
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { BusinessEntry, BusinessStatus } from '../types'
import AddBusinessModal from './AddBusinessModal'

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

const MONTHS     = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const MONTHS_FULL = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

interface Props {
  entries: BusinessEntry[]
  onAdd: (e: Omit<BusinessEntry, 'id' | 'createdAt'>) => void
  onDelete: (id: string) => void
  onUpdateStatus: (id: string, status: BusinessStatus) => void
}

export default function BusinessFinances({ entries, onAdd, onDelete, onUpdateStatus }: Props) {
  const today = new Date()
  const [month, setMonth] = useState(today.getMonth())
  const [year, setYear] = useState(today.getFullYear())
  const [showAdd, setShowAdd] = useState(false)
  const [filterStatus, setFilterStatus] = useState<BusinessStatus | 'all'>('all')
  const [editingStatus, setEditingStatus] = useState<string | null>(null)

  const allMonth = useMemo(() =>
    entries.filter(e => {
      const d = new Date(e.date + 'T12:00:00')
      return d.getMonth() === month && d.getFullYear() === year
    }), [entries, month, year])

  const filtered = useMemo(() =>
    allMonth.filter(e => filterStatus === 'all' || e.status === filterStatus),
    [allMonth, filterStatus])

  const totalRevenue = allMonth.reduce((s, e) => s + e.amount, 0)
  const totalPaid    = allMonth.filter(e => e.status === 'paid').reduce((s, e) => s + e.amount, 0)
  const totalPending = allMonth.filter(e => e.status === 'pending').reduce((s, e) => s + e.amount, 0)
  const totalOverdue = allMonth.filter(e => e.status === 'overdue').reduce((s, e) => s + e.amount, 0)

  const chartData = useMemo(() =>
    Array.from({ length: 6 }, (_, i) => {
      const d = new Date(year, month - 5 + i, 1)
      const m = d.getMonth(), y = d.getFullYear()
      const me = entries.filter(e => {
        const ed = new Date(e.date + 'T12:00:00')
        return ed.getMonth() === m && ed.getFullYear() === y
      })
      return {
        name: MONTHS[m],
        recebido: me.filter(e => e.status === 'paid').reduce((s, e) => s + e.amount, 0),
        pendente: me.filter(e => e.status === 'pending').reduce((s, e) => s + e.amount, 0),
      }
    }), [entries, month, year])

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  const statusBadge = (s: BusinessStatus) => {
    if (s === 'paid')    return <span className="badge-paid"><CheckCircle size={11} />Pago</span>
    if (s === 'pending') return <span className="badge-pending"><Clock size={11} />Pendente</span>
    return <span className="badge-overdue"><AlertTriangle size={11} />Atrasado</span>
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-semibold text-2xl text-slate-900 tracking-tight">Empresa</h2>
          <p className="text-sm text-slate-500 mt-0.5">Gestão de entradas e serviços</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary bg-teal-600 hover:bg-teal-700">
          <Plus size={15} /> Nova Entrada
        </button>
      </div>

      {/* Month Navigator */}
      <div className="card p-4 flex items-center justify-between">
        <button onClick={prevMonth} className="btn-ghost p-2">
          <ChevronLeft size={18} />
        </button>
        <div className="text-center">
          <p className="font-semibold text-xl text-slate-900">{MONTHS_FULL[month]}</p>
          <p className="text-sm text-slate-500">{year}</p>
        </div>
        <button onClick={nextMonth} className="btn-ghost p-2">
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5 space-y-1 animate-slide-up stagger-1 relative overflow-hidden">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wide">
            <TrendingUp size={14} className="text-teal-500" />
            Total
          </div>
          <p className="number-display text-xl font-bold text-slate-900">{fmt(totalRevenue)}</p>
          <p className="text-xs text-slate-400">{allMonth.length} entrada(s)</p>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-teal-400 to-transparent" />
        </div>

        <div className="card p-5 space-y-1 animate-slide-up stagger-2 relative overflow-hidden">
          <div className="flex items-center gap-2 text-emerald-600 text-xs font-semibold uppercase tracking-wide">
            <CheckCircle size={14} />
            Recebido
          </div>
          <p className="number-display text-xl font-bold text-emerald-700">{fmt(totalPaid)}</p>
          <p className="text-xs text-slate-400">{allMonth.filter(e => e.status === 'paid').length} pago(s)</p>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-400 to-transparent" />
        </div>

        <div className="card p-5 space-y-1 animate-slide-up stagger-3 relative overflow-hidden">
          <div className="flex items-center gap-2 text-amber-600 text-xs font-semibold uppercase tracking-wide">
            <Clock size={14} />
            Pendente
          </div>
          <p className="number-display text-xl font-bold text-amber-700">{fmt(totalPending)}</p>
          <p className="text-xs text-slate-400">{allMonth.filter(e => e.status === 'pending').length} pendente(s)</p>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-400 to-transparent" />
        </div>

        <div className="card p-5 space-y-1 animate-slide-up stagger-4 relative overflow-hidden">
          <div className="flex items-center gap-2 text-red-600 text-xs font-semibold uppercase tracking-wide">
            <AlertTriangle size={14} />
            Atrasado
          </div>
          <p className="number-display text-xl font-bold text-red-700">{fmt(totalOverdue)}</p>
          <p className="text-xs text-slate-400">{allMonth.filter(e => e.status === 'overdue').length} atrasado(s)</p>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-400 to-transparent" />
        </div>
      </div>

      {/* Chart */}
      <div className="card p-5 animate-slide-up stagger-2">
        <h3 className="font-semibold text-slate-700 text-sm mb-4">Histórico 6 meses</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `R$${v}`} />
            <Tooltip
              formatter={(v: number) => fmt(v)}
              contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', color: '#1e293b', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
            />
            <Bar dataKey="recebido" name="Recebido" fill="#14b8a6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="pendente" name="Pendente" fill="#f59e0b" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Filter + List */}
      <div className="card overflow-hidden animate-slide-up stagger-3">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="font-semibold text-slate-700 text-sm">Transações</h3>
          <div className="flex gap-1 bg-slate-100 rounded-xl p-1 text-xs">
            {(['all', 'paid', 'pending', 'overdue'] as const).map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all duration-200 ${
                  filterStatus === s
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {s === 'all' ? 'Todos' : s === 'paid' ? 'Pagos' : s === 'pending' ? 'Pendentes' : 'Atrasados'}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-4xl mb-3 opacity-30">📊</div>
            <p className="text-slate-400 text-sm">Nenhuma entrada encontrada</p>
            <button onClick={() => setShowAdd(true)} className="btn-primary mt-4 mx-auto bg-teal-600 hover:bg-teal-700">
              <Plus size={15} /> Adicionar entrada
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {filtered
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map(entry => (
                <div key={entry.id} className="flex items-center gap-4 px-4 py-3.5 hover:bg-slate-50 transition-colors group">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${
                    entry.type === 'service' ? 'bg-teal-50' : 'bg-indigo-50'
                  }`}>
                    {entry.type === 'service' ? '⚙️' : '📦'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{entry.description}</p>
                    <p className="text-xs text-slate-400">
                      {entry.client} · {new Date(entry.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <p className="number-display text-sm font-bold text-slate-900">{fmt(entry.amount)}</p>

                    {editingStatus === entry.id ? (
                      <div className="flex gap-1">
                        {(['paid', 'pending', 'overdue'] as BusinessStatus[]).map(s => (
                          <button
                            key={s}
                            onClick={() => { onUpdateStatus(entry.id, s); setEditingStatus(null) }}
                            className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all ${
                              s === 'paid'    ? 'bg-emerald-600 text-white' :
                              s === 'pending' ? 'bg-amber-500 text-white'  : 'bg-red-500 text-white'
                            }`}
                          >
                            {s === 'paid' ? '✓' : s === 'pending' ? '⏳' : '⚠'}
                          </button>
                        ))}
                        <button onClick={() => setEditingStatus(null)} className="btn-ghost p-1">
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setEditingStatus(entry.id)} className="hover:opacity-80 transition-opacity">
                        {statusBadge(entry.status)}
                      </button>
                    )}

                    <button
                      onClick={() => onDelete(entry.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-all duration-200"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {showAdd && <AddBusinessModal onAdd={onAdd} onClose={() => setShowAdd(false)} />}
    </div>
  )
}
