import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase.ts'
import type { Role, Card, Comment, Feedback } from '../types.ts'
import { Bug, Lightbulb, AlertTriangle, ArrowUpCircle, MinusCircle, Send, ArrowLeft, CheckCircle, XCircle, MessageCircle, Trash2, User, Save } from 'lucide-react'

interface Props {
  role: Role
}

const tipoLabels: Record<string, string> = {
  bug: 'Bug',
  melhoria: 'Melhoria',
  sugestao: 'Sugestão',
}

const tipoColors: Record<string, string> = {
  bug: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  melhoria: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  sugestao: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
}

export default function CardDetail({ role }: Props) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [card, setCard] = useState<Card | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showReprovarForm, setShowReprovarForm] = useState(false)
  const [resolvedBy, setResolvedBy] = useState('')
  const [savingResolved, setSavingResolved] = useState(false)

  useEffect(() => {
    if (!id) return
    loadCard()
    loadComments()
    loadFeedbacks()
  }, [id])

  useEffect(() => {
    const channel = supabase.channel(`card-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comments', filter: `card_id=eq.${id}` }, () => loadComments())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [id])

  async function loadCard() {
    const { data } = await supabase.from('cards').select('*, systems(name)').eq('id', id).single()
    if (data) {
      setCard({ ...data, system_name: data.systems?.name })
      setResolvedBy(data.resolved_by || '')
    }
  }

  async function loadComments() {
    const { data } = await supabase.from('comments').select('*').eq('card_id', id).order('created_at')
    if (data) setComments(data)
  }

  async function loadFeedbacks() {
    const { data } = await supabase.from('feedbacks').select('*').eq('card_id', id).order('created_at', { ascending: false })
    if (data) setFeedbacks(data)
  }

  async function handleAddComment() {
    if (!newComment.trim()) return
    setSubmitting(true)
    const { error } = await supabase.from('comments').insert({
      card_id: id,
      role,
      content: newComment.trim(),
    })
    setSubmitting(false)
    if (!error) {
      setNewComment('')
      loadComments()
    }
  }

  async function handleSaveResolvedBy() {
    setSavingResolved(true)
    await supabase.from('cards').update({ resolved_by: resolvedBy }).eq('id', id)
    setSavingResolved(false)
  }

  async function handleApprove() {
    await supabase.from('cards').update({ status: 'aprovado', updated_at: new Date().toISOString() }).eq('id', id)
    const { error } = await supabase.from('feedbacks').insert({
      card_id: id,
      type: 'aprovado',
    })
    if (!error) { loadFeedbacks(); loadCard() }
  }

  async function handleReprovar() {
    await supabase.from('cards').update({ status: 'reprovado', updated_at: new Date().toISOString() }).eq('id', id)
    const { error } = await supabase.from('feedbacks').insert({
      card_id: id,
      type: 'reprovado',
    })
    if (!error) {
      loadFeedbacks()
      loadCard()
      setShowReprovarForm(true)
    }
  }

  async function handleDeleteCard() {
    if (!card) return
    if (!confirm(`Deletar card "${card.title}"? Esta ação não pode ser desfeita.`)) return
    const { error } = await supabase.from('cards').delete().eq('id', card.id)
    if (!error) navigate(-1)
  }

  async function handleNewCardFromReprovar() {
    const title = prompt('Título do novo card (relacionado a este):')
    if (!title) return
    const description = prompt('Descrição:')
    if (!description) return
    const { error } = await supabase.from('cards').insert({
      role: card?.role || role,
      title,
      description,
      system_id: card?.system_id,
      area: card?.area || '',
      type: card?.type || 'Bug',
      severity: card?.severity || 'bug',
      status: 'a_fazer',
      parent_card_id: id,
    })
    if (!error) {
      alert('Novo card criado!')
      setShowReprovarForm(false)
      navigate(-1)
    }
  }

  if (!card) return <div className="text-center py-12 text-text-secondary">Carregando...</div>

  const statusLabels: Record<string, string> = { a_fazer: 'A Fazer', em_progresso: 'Em Progresso', concluido: 'Concluído', aprovado: 'Aprovado', reprovado: 'Reprovado' }

  return (
    <div className="max-w-3xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-text-secondary hover:text-text mb-4">
        <ArrowLeft size={16} /> Voltar
      </button>

      <div className="bg-surface rounded-xl border border-border p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 text-xs font-medium rounded ${card.status === 'concluido' || card.status === 'aprovado' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : card.status === 'reprovado' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>
              {statusLabels[card.status]}
            </span>
            <span className={`px-2 py-0.5 text-xs font-medium rounded ${card.type === 'Bug' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300'}`}>
              {card.type === 'Bug' ? <><Bug size={12} className="inline mr-1" />Bug</> : <><Lightbulb size={12} className="inline mr-1" />Inovação</>}
            </span>
            <span className={`px-2 py-0.5 text-xs font-medium rounded ${tipoColors[card.severity] || 'bg-gray-100 text-gray-600'}`}>
              {tipoLabels[card.severity] || card.severity}
            </span>
          </div>
          <span className="text-xs text-text-muted">{new Date(card.created_at).toLocaleString('pt-BR')}</span>
        </div>

        <h2 className="text-xl font-bold mb-2">{card.title}</h2>
        <p className="text-text mb-4 whitespace-pre-wrap">{card.description}</p>

        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
          <div><span className="text-text-secondary">Sistema:</span> <span className="font-medium">{card.system_name || 'N/A'}</span></div>
          <div><span className="text-text-secondary">Rota:</span> <span className="font-medium">{card.area}</span></div>
          <div><span className="text-text-secondary">Papel:</span> <span className="font-medium">{card.role}</span></div>
          <div><span className="text-text-secondary">Tipo de Tarefa:</span> <span className="font-medium">{tipoLabels[card.severity] || card.severity}</span></div>
          {card.parent_card_id && (
            <div><span className="text-text-secondary">Card relacionado:</span> <Link to={`/${card.role.toLowerCase()}/card/${card.parent_card_id}`} className="text-primary hover:underline">Ver original</Link></div>
          )}
        </div>

        {card.photo_url && (
          <div className="mb-4">
            <img src={card.photo_url} alt="Anexo" className="max-h-80 rounded-lg object-contain bg-muted" />
          </div>
        )}
        {card.video_url && (
          <div className="mb-4">
            <video src={card.video_url} controls className="max-h-80 rounded-lg bg-muted w-full" />
          </div>
        )}

        <div className="mb-4 p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-2">
            <User size={14} className="text-text-secondary" />
            <span className="text-sm font-medium text-text-secondary">Responsável:</span>
            <input
              value={resolvedBy}
              onChange={(e) => setResolvedBy(e.target.value)}
              className="flex-1 px-2 py-1 text-sm bg-surface border border-border-strong rounded-lg focus:ring-2 focus:ring-primary outline-none"
              placeholder="Nome do desenvolvedor"
            />
            <button
              onClick={handleSaveResolvedBy}
              disabled={savingResolved}
              className="p-1.5 bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-50 transition-colors"
            >
              <Save size={14} />
            </button>
          </div>
        </div>

        {feedbacks.length > 0 && (
          <div className="mb-4 p-3 bg-muted rounded-lg">
            <p className="text-sm font-medium">
              {feedbacks[0].type === 'aprovado' ? (
                <span className="text-green-600 dark:text-green-400"><CheckCircle size={16} className="inline mr-1" />Aprovado</span>
              ) : (
                <span className="text-red-600 dark:text-red-400"><XCircle size={16} className="inline mr-1" />Reprovado</span>
              )}
            </p>
          </div>
        )}

        <div className="flex gap-2">
          {(card.status === 'aprovado' || card.status === 'reprovado') && (
            <button onClick={handleDeleteCard} className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors">
              <Trash2 size={16} /> Deletar Card
            </button>
          )}
          {(role === 'CS' || role === 'Comercial') && card.status === 'concluido' && feedbacks.length === 0 && (
            <>
              <button onClick={handleApprove} className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 transition-colors">
                <CheckCircle size={16} /> Aprovar
              </button>
              <button onClick={handleReprovar} className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors">
                <XCircle size={16} /> Reprovar
              </button>
            </>
          )}
          {showReprovarForm && (
            <button onClick={handleNewCardFromReprovar} className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white text-sm rounded-lg hover:bg-primary-hover transition-colors">
              Criar Card Relacionado
            </button>
          )}
        </div>
      </div>

      <div className="bg-surface rounded-xl border border-border p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2"><MessageCircle size={18} /> Comentários ({comments.length})</h3>
        <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
          {comments.map((c) => (
            <div key={c.id} className="p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2 text-xs text-text-secondary mb-1">
                <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${c.role === 'CS' ? 'bg-purple-100 text-purple-700' : c.role === 'Comercial' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{c.role}</span>
                <span>{new Date(c.created_at).toLocaleString('pt-BR')}</span>
              </div>
              <p className="text-sm">{c.content}</p>
            </div>
          ))}
          {comments.length === 0 && <p className="text-sm text-text-muted text-center py-4">Nenhum comentário ainda.</p>}
        </div>
        <div className="flex gap-2">
          <input
            value={newComment} onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
            className="flex-1 px-3 py-2 border border-border-strong rounded-lg bg-surface focus:ring-2 focus:ring-primary outline-none text-sm"
            placeholder="Adicionar comentário..."
          />
          <button
            onClick={handleAddComment}
            disabled={submitting || !newComment.trim()}
            className="px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-50 transition-colors"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
