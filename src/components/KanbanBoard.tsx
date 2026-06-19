import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase.ts'
import type { Role, Card } from '../types.ts'
import { Plus, Bug, Lightbulb, AlertTriangle, ArrowUpCircle, MinusCircle, Trash2, User } from 'lucide-react'

interface Props {
  role: Role
  kanbanId: string
  createPath: string
  cardDetailPath: string
  onDeleteCard?: (card: Card) => void
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

export default function KanbanBoard({ role, kanbanId, createPath, cardDetailPath, onDeleteCard }: Props) {
  const [cards, setCards] = useState<Card[]>([])

  useEffect(() => {
    loadCards()
    const channel = supabase.channel('cards-realtime')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'cards', filter: `role=eq.${role}` },
        () => loadCards()
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [role, kanbanId])

  async function loadCards() {
    let query = supabase
      .from('cards')
      .select('*, systems(name)')
      .eq('role', role)
    if (kanbanId) {
      query = query.eq('kanban_id', kanbanId)
    }
    const { data } = await query.order('created_at', { ascending: false })
    if (data) {
      setCards(data.map((c) => ({
        ...c,
        system_name: c.systems?.name,
        system_id: c.system_id,
      })))
    }
  }

  async function handleDelete(card: Card, e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm(`Deletar card "${card.title}"? Esta ação não pode ser desfeita.`)) return
    const { error } = await supabase.from('cards').delete().eq('id', card.id)
    if (!error) {
      loadCards()
      onDeleteCard?.(card)
    }
  }

  const grouped = statusOrder.reduce((acc, status) => {
    acc[status] = cards.filter((c) => c.status === status)
    return acc
  }, {} as Record<string, Card[]>)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Kanban - {role}</h2>
        <Link
          to={createPath}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors text-sm"
        >
          <Plus size={18} />
          Novo Card
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {statusOrder.map((status) => (
          <div key={status} className={`rounded-xl p-3 border border-border/50 shadow-sm ${statusColors[status]}`}>
            <h3 className="font-semibold text-sm mb-3 text-center">{statusLabels[status]} ({grouped[status]?.length || 0})</h3>
            <div className="space-y-3">
              {grouped[status]?.map((card) => (
                <Link
                  key={card.id}
                  to={`${cardDetailPath}/${card.id}`}
                  className="block bg-surface rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow border border-border relative group"
                >
                  {(card.status === 'aprovado' || card.status === 'reprovado') && (
                    <button
                      onClick={(e) => handleDelete(card, e)}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Deletar card"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="text-xs font-medium text-text-secondary">{card.system_name || 'Sistema'}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      {tipoIcons[card.severity] || <Bug size={14} className="text-gray-400" />}
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
