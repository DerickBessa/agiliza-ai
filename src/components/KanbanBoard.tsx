import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase.ts'
import type { Role, Card } from '../types.ts'
import { Plus, Bug, Lightbulb, AlertTriangle, ArrowUpCircle, MinusCircle } from 'lucide-react'

interface Props {
  role: Role
  createPath: string
  cardDetailPath: string
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
  a_fazer: 'bg-gray-100 dark:bg-gray-800',
  em_progresso: 'bg-blue-100 dark:bg-blue-900',
  concluido: 'bg-green-100 dark:bg-green-900',
  aprovado: 'bg-emerald-100 dark:bg-emerald-900',
  reprovado: 'bg-red-100 dark:bg-red-900',
}

const severityIcons: Record<string, React.ReactNode> = {
  Blocker: <AlertTriangle size={16} className="text-red-500" />,
  Major: <ArrowUpCircle size={16} className="text-orange-500" />,
  Minor: <MinusCircle size={16} className="text-yellow-500" />,
}

export default function KanbanBoard({ role, createPath, cardDetailPath }: Props) {
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
  }, [role])

  async function loadCards() {
    const { data } = await supabase
      .from('cards')
      .select('*, systems(name)')
      .eq('role', role)
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
          <div key={status} className={`rounded-xl p-3 ${statusColors[status]}`}>
            <h3 className="font-semibold text-sm mb-3 text-center">{statusLabels[status]} ({grouped[status]?.length || 0})</h3>
            <div className="space-y-3">
              {grouped[status]?.map((card) => (
                <Link
                  key={card.id}
                  to={`${cardDetailPath}/${card.id}`}
                  className="block bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{card.system_name || 'Sistema'}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      {card.type === 'Bug' ? <Bug size={14} className="text-red-500" /> : <Lightbulb size={14} className="text-amber-500" />}
                      {severityIcons[card.severity]}
                    </div>
                  </div>
                  <p className="text-sm font-medium leading-tight line-clamp-2">{card.title}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                    <span>{new Date(card.created_at).toLocaleDateString('pt-BR')}</span>
                    <span>{card.area}</span>
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
