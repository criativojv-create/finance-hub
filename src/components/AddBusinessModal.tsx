import { useState } from 'react'
import { X, Plus } from 'lucide-react'
import { BusinessEntry, BusinessStatus, BusinessType } from '../types'

interface Props {
  onAdd: (entry: Omit<BusinessEntry, 'id' | 'createdAt'>) => void
  onClose: () => void
}

export default function AddBusinessModal({ onAdd, onClose }: Props) {
  const [form, setForm] = useState({
    description: '',
    type: 'service' as BusinessType,
    amount: '',
    date: new Date().toISOString().split('T')[0],
    client: '',
    status: 'pending' as BusinessStatus,
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.description || !form.amount || !form.client) return
    onAdd({
      description: form.description,
      type: form.type,
      amount: parseFloat(form.amount),
      date: form.date,
      client: form.client,
      status: form.status,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl w-full max-w-md animate-slide-up shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div>
            <h3 className="font-semibold text-lg text-slate-900">Nova Entrada</h3>
            <p className="text-xs text-slate-400 mt-0.5">Registrar serviço ou produto</p>
          </div>
          <button onClick={onClose} className="btn-ghost p-2 rounded-lg">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="label">Descrição</label>
            <input
              className="input"
              placeholder="Ex: Desenvolvimento de site, Produto X..."
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              required
              autoFocus
            />
          </div>

          <div>
            <label className="label">Cliente</label>
            <input
              className="input"
              placeholder="Nome do cliente ou empresa"
              value={form.client}
              onChange={e => setForm(f => ({ ...f, client: e.target.value }))}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Valor (R$)</label>
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
            <div>
              <label className="label">Data</label>
              <input
                className="input"
                type="date"
                value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                required
              />
            </div>
          </div>

          <div>
            <label className="label">Tipo</label>
            <div className="grid grid-cols-2 gap-2">
              {([
                { value: 'service', label: '⚙️ Serviço' },
                { value: 'product', label: '📦 Produto' },
              ] as { value: BusinessType; label: string }[]).map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, type: opt.value }))}
                  className={`py-2 px-3 rounded-xl text-sm font-medium transition-all duration-200 border ${
                    form.type === opt.value
                      ? 'bg-teal-600 border-teal-600 text-white shadow-sm'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Status</label>
            <div className="grid grid-cols-3 gap-2">
              {([
                { value: 'paid',    label: '✓ Pago' },
                { value: 'pending', label: '⏳ Pendente' },
                { value: 'overdue', label: '⚠ Atrasado' },
              ] as { value: BusinessStatus; label: string }[]).map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, status: opt.value }))}
                  className={`py-2 px-3 rounded-xl text-xs font-medium transition-all duration-200 border ${
                    form.status === opt.value
                      ? opt.value === 'paid'
                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                        : opt.value === 'pending'
                        ? 'bg-amber-500 border-amber-500 text-white shadow-sm'
                        : 'bg-red-500 border-red-500 text-white shadow-sm'
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
            <button type="submit" className="btn-primary flex-1 justify-center bg-teal-600 hover:bg-teal-700">
              <Plus size={16} />
              Adicionar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
