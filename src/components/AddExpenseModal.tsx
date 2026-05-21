import { useState } from 'react'
import { X, Plus, RefreshCw, CreditCard, ShoppingBag } from 'lucide-react'
import { Category, Expense, FixedExpense, Payer, PersonNames } from '../types'

type ExpenseMode = 'normal' | 'fixed' | 'installment'

interface Props {
  categories: Category[]
  personNames: PersonNames
  initialMode?: ExpenseMode
  onAddExpenses: (expenses: Omit<Expense, 'id' | 'createdAt'>[]) => void
  onAddFixed: (fixed: Omit<FixedExpense, 'id' | 'createdAt'>) => void
  onClose: () => void
}

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

export default function AddExpenseModal({
  categories, personNames, initialMode = 'normal',
  onAddExpenses, onAddFixed, onClose,
}: Props) {
  const [mode, setMode] = useState<ExpenseMode>(initialMode)
  const [form, setForm] = useState({
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    categoryId: categories[0]?.id || '',
    payer: 'both' as Payer,
    installmentsCount: 2,
    dayOfMonth: 5,
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.description || !form.amount || !form.categoryId) return
    const amount = parseFloat(form.amount)
    const today = new Date()

    if (mode === 'fixed') {
      onAddFixed({
        description: form.description,
        amount,
        categoryId: form.categoryId,
        payer: form.payer,
        dayOfMonth: form.dayOfMonth,
        active: true,
        startYear: today.getFullYear(),
        startMonth: today.getMonth(),
      })
    } else if (mode === 'installment') {
      const groupId = Math.random().toString(36).slice(2)
      const base = new Date(form.date + 'T12:00:00')
      const list = Array.from({ length: form.installmentsCount }, (_, i) => {
        const d = new Date(base.getFullYear(), base.getMonth() + i, base.getDate())
        return {
          description: form.description,
          amount,
          date: d.toISOString().split('T')[0],
          categoryId: form.categoryId,
          payer: form.payer,
          installments: form.installmentsCount,
          installmentNumber: i + 1,
          installmentGroupId: groupId,
        } as Omit<Expense, 'id' | 'createdAt'>
      })
      onAddExpenses(list)
    } else {
      onAddExpenses([{
        description: form.description,
        amount,
        date: form.date,
        categoryId: form.categoryId,
        payer: form.payer,
      }])
    }
    onClose()
  }

  const MODES = [
    { value: 'normal' as ExpenseMode,      label: 'Normal',    Icon: ShoppingBag, desc: 'Gasto único'  },
    { value: 'fixed' as ExpenseMode,       label: 'Fixa',      Icon: RefreshCw,   desc: 'Todo mês'    },
    { value: 'installment' as ExpenseMode, label: 'Parcelada', Icon: CreditCard,  desc: 'Em parcelas' },
  ]

  const totalInstallment = form.amount
    ? parseFloat(form.amount) * form.installmentsCount
    : 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl w-full max-w-md animate-slide-up shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div>
            <h3 className="font-semibold text-lg text-slate-900">Novo Gasto</h3>
            <p className="text-xs text-slate-400 mt-0.5">Adicionar despesa</p>
          </div>
          <button onClick={onClose} className="btn-ghost p-2 rounded-lg">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Mode selector */}
          <div>
            <label className="label">Tipo</label>
            <div className="grid grid-cols-3 gap-2">
              {MODES.map(({ value, label, Icon, desc }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setMode(value)}
                  className={`py-3 px-2 rounded-xl text-center transition-all duration-200 border ${
                    mode === value
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-200 hover:bg-indigo-50'
                  }`}
                >
                  <Icon size={16} className="mx-auto mb-1" />
                  <div className="text-xs font-semibold">{label}</div>
                  <div className={`text-xs mt-0.5 ${mode === value ? 'text-indigo-200' : 'text-slate-400'}`}>{desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Descrição</label>
            <input
              className="input"
              placeholder={
                mode === 'fixed' ? 'Ex: Aluguel, Netflix, Energia...'
                : mode === 'installment' ? 'Ex: Celular, TV, Móveis...'
                : 'Ex: Supermercado, Farmácia...'
              }
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              required
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">
                {mode === 'installment' ? 'Valor / parcela (R$)' : 'Valor (R$)'}
              </label>
              <input
                className="input number-display"
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                required
              />
            </div>

            {mode === 'fixed' ? (
              <div>
                <label className="label">Dia do mês</label>
                <input
                  className="input number-display"
                  type="number"
                  min="1"
                  max="28"
                  value={form.dayOfMonth}
                  onChange={e => setForm(f => ({ ...f, dayOfMonth: Math.min(28, Math.max(1, parseInt(e.target.value) || 1)) }))}
                />
              </div>
            ) : (
              <div>
                <label className="label">
                  {mode === 'installment' ? 'Data 1ª parcela' : 'Data'}
                </label>
                <input
                  className="input"
                  type="date"
                  value={form.date}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  required
                />
              </div>
            )}
          </div>

          {/* Installments count */}
          {mode === 'installment' && (
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="label">Nº de parcelas</label>
                  <input
                    className="input number-display w-28"
                    type="number"
                    min="2"
                    max="60"
                    value={form.installmentsCount}
                    onChange={e => setForm(f => ({ ...f, installmentsCount: Math.max(2, parseInt(e.target.value) || 2) }))}
                    required
                  />
                </div>
                <div className="flex-1 text-right">
                  <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-1">Total</p>
                  <p className="number-display text-lg font-bold text-indigo-700">{fmt(totalInstallment)}</p>
                </div>
              </div>
              <p className="text-xs text-indigo-600 font-medium">
                {form.installmentsCount}× de {fmt(parseFloat(form.amount || '0'))} —{' '}
                {form.date
                  ? `de ${new Date(form.date + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })} até ${
                      new Date(
                        new Date(form.date + 'T12:00:00').getFullYear(),
                        new Date(form.date + 'T12:00:00').getMonth() + form.installmentsCount - 1,
                        1
                      ).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
                    }`
                  : '—'}
              </p>
            </div>
          )}

          {mode === 'fixed' && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
              <p className="text-xs text-emerald-700 font-medium">
                ♻️ Esta despesa será cobrada todo mês no dia <strong>{form.dayOfMonth}</strong>. Você pode pausar ou excluir a qualquer momento.
              </p>
            </div>
          )}

          <div>
            <label className="label">Categoria</label>
            <select
              className="input"
              value={form.categoryId}
              onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}
            >
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Quem paga</label>
            <div className="grid grid-cols-3 gap-2">
              {([
                { value: 'person1', label: personNames.person1 },
                { value: 'person2', label: personNames.person2 },
                { value: 'both',    label: 'Ambos' },
              ] as { value: Payer; label: string }[]).map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, payer: opt.value }))}
                  className={`py-2 px-3 rounded-xl text-sm font-medium transition-all duration-200 border truncate ${
                    form.payer === opt.value
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">
              Cancelar
            </button>
            <button type="submit" className="btn-primary flex-1 justify-center">
              <Plus size={16} />
              {mode === 'fixed'
                ? 'Criar Fixa'
                : mode === 'installment'
                ? `Parcelar ${form.installmentsCount}×`
                : 'Adicionar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
