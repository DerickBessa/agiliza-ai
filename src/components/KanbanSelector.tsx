import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.ts'
import type { Role, Kanban } from '../types.ts'
import { Plus, Trash2, Columns } from 'lucide-react'

interface Props {
  role: Role
  basePath: string
  allowDelete?: boolean
  onSelect?: (kanban: Kanban) => void
}

export default function KanbanSelector({ role, basePath, allowDelete, onSelect }: Props) {
  const navigate = useNavigate()
  const [kanbans, setKanbans] = useState<Kanban[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')

  useEffect(() => {
    loadKanbans()
    const channel = supabase.channel('kanbans')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'kanbans', filter: `role=eq.${role}` },
        () => loadKanbans()
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [role])

  async function loadKanbans() {
    const { data } = await supabase
      .from('kanbans')
      .select('*')
      .eq('role', role)
      .order('created_at')
    if (data) setKanbans(data)
  }

  async function handleCreate() {
    if (!newName.trim()) return
    const { error } = await supabase.from('kanbans').insert({ name: newName.trim(), role })
    if (!error) {
      setNewName('')
      setShowCreate(false)
      loadKanbans()
    }
  }

  async function handleDelete(kanban: Kanban, e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirm(`Deletar kanban "${kanban.name}"? Todos os cards associados serão deletados.`)) return
    const { error } = await supabase.from('kanbans').delete().eq('id', kanban.id)
    if (!error) loadKanbans()
  }

  function handleSelect(kanban: Kanban) {
    if (onSelect) {
      onSelect(kanban)
    } else {
      navigate(`${basePath}/${kanban.id}`)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">{role} - Kanbans</h2>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors text-sm"
        >
          <Plus size={18} />
          Novo Kanban
        </button>
      </div>

      {showCreate && (
        <div className="flex gap-2 mb-6">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            className="flex-1 px-3 py-2 border border-border-strong rounded-lg bg-surface focus:ring-2 focus:ring-primary outline-none"
            placeholder="Nome do novo kanban"
            autoFocus
          />
          <button
            onClick={handleCreate}
            disabled={!newName.trim()}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-50 transition-colors"
          >
            Criar
          </button>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {kanbans.map((kanban) => (
          <button
            key={kanban.id}
            onClick={() => handleSelect(kanban)}
            className="flex items-center gap-4 p-6 bg-surface rounded-xl border border-border hover:shadow-md transition-shadow text-left group"
          >
            <div className="w-12 h-12 bg-primary-light dark:bg-primary-dark/30 rounded-xl flex items-center justify-center shrink-0">
              <Columns size={24} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold">{kanban.name}</p>
              <p className="text-sm text-text-muted">{new Date(kanban.created_at).toLocaleDateString('pt-BR')}</p>
            </div>
            {allowDelete && (
              <button
                onClick={(e) => handleDelete(kanban, e)}
                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                title="Deletar kanban"
              >
                <Trash2 size={16} />
              </button>
            )}
          </button>
        ))}
      </div>

      {kanbans.length === 0 && !showCreate && (
        <p className="text-center py-12 text-text-secondary">
          Nenhum kanban encontrado. Crie um novo para começar.
        </p>
      )}
    </div>
  )
}
