import { useState } from 'react'
import { X, Plus } from 'lucide-react'
import { Category } from '../types'

const COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#06b6d4', '#3b82f6',
]

const ICONS = ['🏷️', '🎯', '🛍️', '🎮', '📚', '🏋️', '🐾', '🎨', '✈️', '💄', '🍷', '🔧', '💊', '🎸', '🏠', '💻']

interface Props {
  onAdd: (category: Omit<Category, 'id'>) => void
  onClose: () => void
}

export default function AddCategoryModal({ onAdd, onClose }: Props) {
  const [name, setName] = useState('')
  const [color, setColor] = useState(COLORS[0])
  const [icon, setIcon] = useState(ICONS[0])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    onAdd({ name: name.trim(), color, icon, isCustom: true })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl w-full max-w-sm animate-slide-up shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h3 className="font-semibold text-lg text-slate-900">Nova Categoria</h3>
          <button onClick={onClose} className="btn-ghost p-2 rounded-lg">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="label">Nome da categoria</label>
            <input
              className="input"
              placeholder="Ex: Academia, Pets, Streaming..."
              value={name}
              onChange={e => setName(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div>
            <label className="label">Ícone</label>
            <div className="grid grid-cols-8 gap-1.5">
              {ICONS.map(ic => (
                <button
                  key={ic}
                  type="button"
                  onClick={() => setIcon(ic)}
                  className={`aspect-square rounded-xl text-lg flex items-center justify-center transition-all duration-200 border ${
                    icon === ic
                      ? 'bg-indigo-50 border-indigo-300 ring-2 ring-indigo-200'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Cor</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  style={{ backgroundColor: c }}
                  className={`w-8 h-8 rounded-full transition-all duration-200 ${
                    color === c
                      ? 'ring-2 ring-offset-2 ring-slate-400 scale-110'
                      : 'hover:scale-110'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">
              Cancelar
            </button>
            <button type="submit" className="btn-primary flex-1 justify-center">
              <Plus size={16} />
              Criar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
