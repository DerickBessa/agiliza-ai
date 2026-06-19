import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase.ts'
import type { Card } from '../types.ts'
import { Bug, Lightbulb, AlertTriangle, ArrowUpCircle, MinusCircle, Filter, Search, PlayCircle, CheckCircle } from 'lucide-react'

const statusLabels: Record<string, string> = {
  a_fazer: 'A Fazer',
  em_progresso: 'Em Progresso',
  concluido: 'Concluído',
  aprovado: 'Aprovado',
  reprovado: 'Reprovado',
}

const statusColors: Record<string, string> = {
  a_fazer: 'bg-gray-100 dark:bg-gray-800',
  em_progresso: 'bg-blue-100 dark:bg-blue-900',
  concluido: 'bg-green-100 dark:bg-green-900',
  aprovado: 'bg-emerald-100 dark:bg-emerald-900',
  reprovado: 'bg-red-100 dark:bg-red-900',
}

const severityScore: Record<string, number> = { Blocker: 0, Major: 1, Minor: 2 }
const typeScore: Record<string, number> = { Bug: 0, 'Inovação': 1 }

function sortCards(cards: Card[]) {
  return [...cards].sort((a, b) => {
    const statusOrder = ['a_fazer', 'em_progresso', 'concluido', 'aprovado', 'reprovado']
    const si = statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status)
    if (si !== 0) return si
    const sDiff = severityScore[a.severity] - severityScore[b.severity]
    if (sDiff !== 0) return sDiff
    const tDiff = typeScore[a.type] - typeScore[b.type]
    if (tDiff !== 0) return tDiff
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  })
}

export default function TechPanel() {
  const [cards, setCards] = useState<Card[]>([])
  const [systems, setSystems] = useState<{ id: string; name: string }[]>([])
  const [filterSystem, setFilterSystem] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [search, setSearch] = useState('')
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => {
    loadCards()
    loadSystems()
    const channel = supabase.channel('tech-cards')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cards' }, () => loadCards())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  async function loadCards() {
    const { data } = await supabase.from('cards').select('*, systems(name)').order('created_at', { ascending: true })
    if (data) {
      setCards(data.map((c) => ({
        ...c,
        system_name: c.systems?.name,
        system_id: c.system_id,
      })))
    }
  }

  async function loadSystems() {
    const { data } = await supabase.from('systems').select('id, name').order('name')
    if (data) setSystems(data)
  }

  async function updateStatus(cardId: string, status: string) {
    setUpdating(cardId)
    await supabase.from('cards').update({ status, updated_at: new Date().toISOString() }).eq('id', cardId)
    setUpdating(null)
    loadCards()
  }

  const filtered = sortCards(cards).filter((card) => {
    if (filterSystem && card.system_id !== filterSystem) return false
    if (filterType && card.type !== filterType) return false
    if (filterStatus && card.status !== filterStatus) return false
    if (search && !card.title.toLowerCase().includes(search.toLowerCase()) && !card.description.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const getRoleColor = (role: string) => {
    if (role === 'CS') return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
    if (role === 'Comercial') return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
    return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Painel Tech</h2>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-6">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-1 text-sm text-gray-500"><Filter size={16} /> Filtros:</div>
          <select value={filterSystem} onChange={(e) => setFilterSystem(e.target.value)} className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800">
            <option value="">Todos os sistemas</option>
            {systems.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800">
            <option value="">Todos os tipos</option>
            <option value="Bug">Bug</option>
            <option value="Inovação">Inovação</option>
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800">
            <option value="">Todos os status</option>
            {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <div className="flex items-center gap-1 flex-1 min-w-[200px]">
            <Search size={16} className="text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar..." className="flex-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800" />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {filtered.map((card) => (
          <div key={card.id} className={`rounded-xl p-4 border border-gray-200 dark:border-gray-700 ${statusColors[card.status]}`}>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className={`px-1.5 py-0.5 text-xs font-medium rounded ${getRoleColor(card.role)}`}>{card.role}</span>
                  <span className={`px-1.5 py-0.5 text-xs font-medium rounded ${card.type === 'Bug' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300'}`}>
                    {card.type === 'Bug' ? <><Bug size={12} className="inline mr-1" />Bug</> : <><Lightbulb size={12} className="inline mr-1" />Inovação</>}
                  </span>
                  <span className={`px-1.5 py-0.5 text-xs font-medium rounded flex items-center gap-1 ${card.severity === 'Blocker' ? 'bg-red-100 text-red-700' : card.severity === 'Major' ? 'bg-orange-100 text-orange-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {card.severity === 'Blocker' ? <AlertTriangle size={12} /> : card.severity === 'Major' ? <ArrowUpCircle size={12} /> : <MinusCircle size={12} />}
                    {card.severity}
                  </span>
                  <span className="text-xs text-gray-400">{statusLabels[card.status]}</span>
                </div>
                <Link to={`/tech/card/${card.id}`} className="text-base font-semibold hover:text-purple-600 dark:hover:text-purple-400">{card.title}</Link>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">{card.description}</p>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                  <span>{card.system_name}</span>
                  <span>{card.area}</span>
                  <span>{new Date(card.created_at).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                {card.status === 'a_fazer' && (
                  <button onClick={() => updateStatus(card.id, 'em_progresso')} disabled={updating === card.id} className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
                    <PlayCircle size={16} /> Iniciar
                  </button>
                )}
                {card.status === 'em_progresso' && (
                  <button onClick={() => updateStatus(card.id, 'concluido')} disabled={updating === card.id} className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors">
                    <CheckCircle size={16} /> Concluir
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-center py-12 text-gray-500">Nenhum card encontrado.</p>
        )}
      </div>
    </div>
  )
}
