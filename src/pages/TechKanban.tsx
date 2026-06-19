import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase.ts'
import type { Card } from '../types.ts'
import { Bug, Lightbulb, AlertTriangle, ArrowUpCircle, MinusCircle } from 'lucide-react'

const statusOrder = ['a_fazer', 'em_progresso', 'concluido', 'aprovado', 'reprovado']
const statusLabels: Record<string, string> = {
  a_fazer: 'A Fazer',
  em_progresso: 'Em Progresso',
  concluido: 'Concluído',
  aprovado: 'Aprovado',
  reprovado: 'Reprovado',
}

const severityIcons: Record<string, React.ReactNode> = {
  Blocker: <AlertTriangle size={16} className="text-red-500" />,
  Major: <ArrowUpCircle size={16} className="text-orange-500" />,
  Minor: <MinusCircle size={16} className="text-yellow-500" />,
}

export default function TechKanban() {
  const [cards, setCards] = useState<Card[]>([])
  const [dragging, setDragging] = useState<string | null>(null)
  const dragRef = useRef<string | null>(null)

  useEffect(() => {
    loadCards()
    const channel = supabase.channel('tech-kanban')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cards' }, () => loadCards())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

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

  async function updateStatus(cardId: string, newStatus: string) {
    await supabase.from('cards').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', cardId)
    loadCards()
  }

  function handleDragStart(cardId: string) {
    dragRef.current = cardId
    setDragging(cardId)
  }

  function handleDragEnd() {
    dragRef.current = null
    setDragging(null)
  }

  function handleDrop(status: string) {
    const cardId = dragRef.current
    if (cardId) {
      updateStatus(cardId, status)
    }
    dragRef.current = null
    setDragging(null)
  }

  const grouped = statusOrder.reduce((acc, status) => {
    acc[status] = cards.filter((c) => c.status === status)
    return acc
  }, {} as Record<string, Card[]>)

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Kanban Geral - Tech</h2>
      <p className="text-text-secondary text-sm mb-6">Arraste os cards entre as colunas para alterar o status</p>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {statusOrder.map((status) => (
          <div
            key={status}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(status)}
            className={`rounded-xl p-3 min-h-[200px] transition-colors ${status === 'a_fazer' ? 'bg-gray-100 dark:bg-gray-800' : status === 'em_progresso' ? 'bg-blue-100 dark:bg-blue-900' : status === 'concluido' ? 'bg-green-100 dark:bg-green-900' : status === 'aprovado' ? 'bg-emerald-100 dark:bg-emerald-900' : 'bg-red-100 dark:bg-red-900'}`}
          >
            <h3 className="font-semibold text-sm mb-3 text-center">{statusLabels[status]} ({grouped[status]?.length || 0})</h3>
            <div className="space-y-3">
              {grouped[status]?.map((card) => (
                <div
                  key={card.id}
                  draggable
                  onDragStart={() => handleDragStart(card.id)}
                  onDragEnd={handleDragEnd}
                  className={`bg-surface rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow border border-border cursor-grab active:cursor-grabbing ${dragging === card.id ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="text-xs font-medium text-text-secondary">{card.system_name || 'Sistema'}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      {card.type === 'Bug' ? <Bug size={14} className="text-red-500" /> : <Lightbulb size={14} className="text-amber-500" />}
                      {severityIcons[card.severity]}
                    </div>
                  </div>
                  <p className="text-sm font-medium leading-tight line-clamp-2">{card.title}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-text-muted">
                    <span className={`px-1 py-0.5 rounded text-xs font-medium ${card.role === 'CS' ? 'bg-purple-100 text-purple-700' : card.role === 'Comercial' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{card.role}</span>
                    <span>{card.area}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
