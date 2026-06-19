import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase.ts'
import type { Card, Kanban } from '../types.ts'
import { Plus, Bug, Lightbulb, ArrowUpCircle, Columns, GripVertical, User } from 'lucide-react'

interface DragItem {
  cardId: string
  fromStatus: string
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

interface Props {
  kanbanId: string
}

export default function TechKanban({ kanbanId }: Props) {
  const [cards, setCards] = useState<Card[]>([])
  const [kanban, setKanban] = useState<Kanban | null>(null)
  const [dragging, setDragging] = useState<DragItem | null>(null)

  useEffect(() => {
    loadKanban()
    loadCards()
  }, [kanbanId])

  async function loadKanban() {
    const { data } = await supabase.from('kanbans').select('*').eq('id', kanbanId).single()
    if (data) setKanban(data)
  }

  async function loadCards() {
    const { data } = await supabase
      .from('cards')
      .select('*, systems(name)')
      .eq('role', 'Tech')
      .eq('kanban_id', kanbanId)
      .order('created_at', { ascending: false })
    if (data) {
      setCards(data.map((c) => ({
        ...c,
        system_name: c.systems?.name,
        system_id: c.system_id,
      })))
    }
  }

  const grouped = statusOrder.reduce((acc, status) => {
    acc[status] = cards.filter((c) => c.status === status)
    return acc
  }, {} as Record<string, Card[]>)

  function handleDragStart(cardId: string, fromStatus: string) {
    setDragging({ cardId, fromStatus })
  }

  async function handleDrop(onStatus: string) {
    if (!dragging) return
    await supabase.from('cards').update({ status: onStatus, updated_at: new Date().toISOString() }).eq('id', dragging.cardId)
    setDragging(null)
    loadCards()
  }

  if (!kanban) return <div className="text-center py-12 text-text-secondary">Carregando...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2"><Columns size={20} /> {kanban.name}</h2>
        <Link
          to={`/tech/new?kanban=${kanbanId}`}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors text-sm"
        >
          <Plus size={16} /> Novo Card
        </Link>
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
                  onDragStart={() => handleDragStart(card.id, card.status)}
                  className="block bg-surface rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow border border-border cursor-grab active:cursor-grabbing"
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="text-xs font-medium text-text-secondary">{card.system_name || 'Sistema'}</span>
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
                      <span className="flex items-center gap-0.5"><User size={10} />{card.resolved_by}</span>
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
