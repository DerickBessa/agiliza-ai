import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.ts'
import type { Card, Kanban } from '../types.ts'
import { Plus, Bug, Lightbulb, ArrowUpCircle, Columns, BarChart3, X, GripVertical, User } from 'lucide-react'

interface DragItem {
  cardId: string
  fromStatus: string
  fromKanbanId: string
}

const statusOrder = ['a_fazer', 'em_progresso', 'concluido', 'aprovado', 'reprovado']
const statusLabels: Record<string, string> = {
  a_fazer: 'A Fazer',
  em_progresso: 'Em Progresso',
  concluido: 'Concluído',
  aprovado: 'Aprovado',
  reprovado: 'Reprovado',
}
const statusColors: Record<string, string> = {
  a_fazer: 'bg-gray-100/20 dark:bg-gray-800/30',
  em_progresso: 'bg-blue-100/20 dark:bg-blue-900/35',
  concluido: 'bg-green-100/20 dark:bg-green-900/35',
  aprovado: 'bg-emerald-100/20 dark:bg-emerald-900/35',
  reprovado: 'bg-red-100/20 dark:bg-red-900/35',
}

const tipoIcons: Record<string, React.ReactNode> = {
  bug: <Bug size={14} className="text-red-500" />,
  melhoria: <ArrowUpCircle size={14} className="text-blue-500" />,
  sugestao: <Lightbulb size={14} className="text-amber-500" />,
}

const roleColors: Record<string, string> = {
  Tech: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  CS: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  Comercial: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
}

export default function TechPanel() {
  const navigate = useNavigate()
  const [kanbans, setKanbans] = useState<Kanban[]>([])
  const [cards, setCards] = useState<Card[]>([])
  const [selectedKanban, setSelectedKanban] = useState<string>('')
  const [dragging, setDragging] = useState<DragItem | null>(null)

  useEffect(() => {
    loadKanbans()
    loadCards()
    const channel = supabase.channel('tech-cards')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cards' }, () => loadCards())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  async function loadKanbans() {
    const { data } = await supabase.from('kanbans').select('*').order('created_at')
    if (data) setKanbans(data)
  }

  async function loadCards() {
    const { data } = await supabase
      .from('cards')
      .select('*, systems(name)')
      .order('created_at', { ascending: false })
    if (data) {
      setCards(data.map((c) => ({
        ...c,
        system_name: c.systems?.name,
        system_id: c.system_id,
      })))
    }
  }

  const filteredCards = selectedKanban ? cards.filter((c) => String(c.kanban_id) === selectedKanban) : cards

  const grouped = statusOrder.reduce((acc, status) => {
    acc[status] = filteredCards.filter((c) => c.status === status)
    return acc
  }, {} as Record<string, Card[]>)

  function handleDragStart(cardId: string, fromStatus: string, fromKanbanId: string) {
    setDragging({ cardId, fromStatus, fromKanbanId })
  }

  async function handleDrop(onStatus: string) {
    if (!dragging) return
    await supabase.from('cards').update({ status: onStatus, updated_at: new Date().toISOString() }).eq('id', dragging.cardId)
    setDragging(null)
    loadCards()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h2 className="text-2xl font-bold">Tech Panel</h2>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => navigate('/tech/kanban')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-surface border border-border-strong rounded-lg hover:bg-surface-hover text-sm transition-colors"
          >
            <Columns size={16} /> Kanbans
          </button>
          <Link
            to="/tech/dashboard"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-surface border border-border-strong rounded-lg hover:bg-surface-hover text-sm transition-colors"
          >
            <BarChart3 size={16} /> Dashboard
          </Link>
          <Link
            to="/tech/new"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors text-sm"
          >
            <Plus size={16} /> Novo Card
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <button
          onClick={() => setSelectedKanban('')}
          className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${!selectedKanban ? 'bg-primary text-white' : 'bg-muted hover:bg-surface-hover'}`}
        >
          Todos
        </button>
        {kanbans.map((k) => (
          <button
            key={k.id}
            onClick={() => setSelectedKanban(k.id)}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${selectedKanban === k.id ? 'bg-primary text-white' : 'bg-muted hover:bg-surface-hover'}`}
          >
            <Columns size={14} className="inline mr-1" />{k.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {statusOrder.map((status) => (
          <div
            key={status}
            className={`rounded-xl p-3 border border-border/50 shadow-sm ${statusColors[status]}`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(status)}
          >
            <h3 className="font-semibold text-sm mb-3 text-center">{statusLabels[status]} ({grouped[status]?.length || 0})</h3>
            <div className="space-y-3 min-h-[60px]">
              {grouped[status]?.map((card) => (
                <Link
                  key={card.id}
                  to={`/tech/card/${card.id}`}
                  draggable
                  onDragStart={() => handleDragStart(card.id, card.status, String(card.kanban_id))}
                  className="block bg-surface rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow border border-border cursor-grab active:cursor-grabbing"
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`px-1 py-0.5 text-xs font-medium rounded ${roleColors[card.role] || 'bg-gray-100 text-gray-600'}`}>{card.role}</span>
                      <span className="text-xs font-medium text-text-secondary">{card.system_name || 'Sistema'}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {tipoIcons[card.severity] || <Bug size={14} className="text-gray-400" />}
                      <GripVertical size={12} className="text-text-muted" />
                    </div>
                  </div>
                  <p className="text-sm font-medium leading-tight line-clamp-2">{card.title}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-text-muted">
                    <span>{new Date(card.created_at).toLocaleDateString('pt-BR')}</span>
                    <span>{card.area}</span>
                    {card.resolved_by && (
                      <span className="flex items-center gap-0.5 max-w-24 truncate" title={card.resolved_by}><User size={10} />{card.resolved_by}</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
