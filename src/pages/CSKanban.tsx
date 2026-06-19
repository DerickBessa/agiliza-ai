import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.ts'
import type { Kanban } from '../types.ts'
import KanbanBoard from '../components/KanbanBoard.tsx'
import KanbanSelector from '../components/KanbanSelector.tsx'

export default function CSKanban() {
  const { kanbanId } = useParams()
  const navigate = useNavigate()
  const [kanban, setKanban] = useState<Kanban | null>(null)

  useEffect(() => {
    if (kanbanId) {
      supabase.from('kanbans').select('*').eq('id', kanbanId).single().then(({ data }) => {
        if (data) setKanban(data)
        else navigate('/cs/kanban')
      })
    } else {
      setKanban(null)
    }
  }, [kanbanId])

  if (!kanbanId) {
    return (
      <KanbanSelector
        role="CS"
        basePath="/cs/kanban"
        onSelect={(k) => navigate(`/cs/kanban/${k.id}`)}
      />
    )
  }

  if (!kanban) return null

  return (
    <div>
      <div className="mb-4">
        <button
          onClick={() => navigate('/cs/kanban')}
          className="text-sm text-text-secondary hover:text-text transition-colors"
        >
          ← Todos os kanbans
        </button>
      </div>
      <KanbanBoard
        role="CS"
        kanbanId={kanbanId}
        createPath={`/cs/criar/${kanbanId}`}
        cardDetailPath="/cs/card"
      />
    </div>
  )
}
