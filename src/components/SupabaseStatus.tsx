import { Database, AlertCircle, CheckCircle } from 'lucide-react'
import { hasSupabase } from '../lib/supabase'

export default function SupabaseStatus() {
  if (hasSupabase) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium">
        <CheckCircle size={13} />
        Supabase Conectado
      </div>
    )
  }

  return (
    <div className="group relative">
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 text-xs font-medium cursor-help">
        <AlertCircle size={13} />
        Dados Locais
      </div>
      <div className="absolute top-full mt-2 right-0 hidden group-hover:block z-50 bg-white border border-slate-200 rounded-xl shadow-lg p-4 w-64">
        <p className="text-xs font-semibold text-slate-900 mb-2">Usando localStorage</p>
        <p className="text-xs text-slate-600 mb-3">
          Os dados estão salvos apenas neste navegador. Para sincronizar na nuvem, conecte ao Supabase.
        </p>
        <a
          href="/SUPABASE_SETUP.md"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold"
        >
          Guia de Setup →
        </a>
      </div>
    </div>
  )
}
