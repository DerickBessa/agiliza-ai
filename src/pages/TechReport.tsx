import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.ts'
import type { Card } from '../types.ts'
import { ArrowLeft, Printer } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function TechReport() {
  const navigate = useNavigate()
  const [cards, setCards] = useState<Card[]>([])
  const [month, setMonth] = useState(new Date().getMonth())
  const [year, setYear] = useState(new Date().getFullYear())
  const [isAnnual, setIsAnnual] = useState(false)

  useEffect(() => { loadCards() }, [])

  async function loadCards() {
    const { data } = await supabase
      .from('cards')
      .select('*, systems(name)')
      .eq('role', 'Tech')
      .order('created_at', { ascending: false })
    if (data) {
      setCards(data.map((c) => ({ ...c, system_name: c.systems?.name })))
    }
  }

  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
  ]

  function filterByPeriod(card: Card): boolean {
    const d = new Date(card.created_at)
    if (isAnnual) {
      return d.getFullYear() === year
    }
    return d.getMonth() === month && d.getFullYear() === year
  }

  function isApprovedInPeriod(card: Card): boolean {
    if (!filterByPeriod(card)) return false
    return card.status === 'aprovado'
  }

  const approvedCards = cards.filter(isApprovedInPeriod)

  const byDeveloper = approvedCards.reduce((acc, card) => {
    const dev = card.resolved_by || 'Sem responsável'
    if (!acc[dev]) acc[dev] = []
    acc[dev].push(card)
    return acc
  }, {} as Record<string, Card[]>)

  const sortedDevelopers = Object.entries(byDeveloper).sort((a, b) => b[1].length - a[1].length)

  const prevYear = () => { setYear(y => y - 1) }
  const nextYear = () => { if (year < new Date().getFullYear()) setYear(y => y + 1) }
  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  const totalCardsInPeriod = cards.filter(filterByPeriod).length
  const approvedCount = approvedCards.length

  const periodCards = cards.filter(filterByPeriod)
  const totalBugs = periodCards.filter(c => c.severity === 'bug').length
  const bugsApproved = periodCards.filter(c => c.severity === 'bug' && c.status === 'aprovado').length
  const totalMelhorias = periodCards.filter(c => c.severity === 'melhoria').length
  const melhoriasApproved = periodCards.filter(c => c.severity === 'melhoria' && c.status === 'aprovado').length
  const totalSugestoes = periodCards.filter(c => c.severity === 'sugestao').length
  const sugestoesApproved = periodCards.filter(c => c.severity === 'sugestao' && c.status === 'aprovado').length

  return (
    <div className="max-w-4xl mx-auto">
      <button onClick={() => navigate('/tech')} className="flex items-center gap-1 text-sm text-text-secondary hover:text-text mb-4">
        <ArrowLeft size={16} /> Voltar
      </button>

      <div className="bg-surface rounded-xl border border-border p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">
            {isAnnual ? `Relatório Anual - ${year}` : `Relatório Mensal - ${months[month]} ${year}`}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className="px-3 py-1.5 text-sm border border-border-strong rounded-lg hover:bg-surface-hover transition-colors"
            >
              {isAnnual ? 'Mensal' : 'Anual'}
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors text-sm"
            >
              <Printer size={16} /> Imprimir
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4 mb-6">
          {!isAnnual && (
            <div className="flex items-center gap-2">
              <button onClick={prevMonth} className="px-3 py-1.5 text-sm border border-border-strong rounded-lg hover:bg-surface-hover">&lt;</button>
              <span className="font-medium text-sm">{months[month]} {year}</span>
              <button onClick={nextMonth} disabled={month === new Date().getMonth() && year === new Date().getFullYear()} className="px-3 py-1.5 text-sm border border-border-strong rounded-lg hover:bg-surface-hover disabled:opacity-30">&gt;</button>
            </div>
          )}
          {isAnnual && (
            <div className="flex items-center gap-2">
              <button onClick={prevYear} className="px-3 py-1.5 text-sm border border-border-strong rounded-lg hover:bg-surface-hover">&lt;</button>
              <span className="font-medium text-sm">{year}</span>
              <button onClick={nextYear} disabled={year >= new Date().getFullYear()} className="px-3 py-1.5 text-sm border border-border-strong rounded-lg hover:bg-surface-hover disabled:opacity-30">&gt;</button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{totalCardsInPeriod}</p>
            <p className="text-sm text-text-secondary">Total Cards</p>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{approvedCount}</p>
            <p className="text-sm text-text-secondary">Aprovados</p>
          </div>
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{totalCardsInPeriod > 0 ? Math.round((approvedCount / totalCardsInPeriod) * 100) : 0}%</p>
            <p className="text-sm text-text-secondary">Taxa de Aprovação</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">{totalBugs > 0 ? `${Math.round((bugsApproved / totalBugs) * 100)}%` : '-'}</p>
            <p className="text-sm text-text-secondary">Bugs relatados / resolvidos ({bugsApproved}/{totalBugs})</p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{totalMelhorias > 0 ? `${Math.round((melhoriasApproved / totalMelhorias) * 100)}%` : '-'}</p>
            <p className="text-sm text-text-secondary">Melhorias solicitadas / atendidas ({melhoriasApproved}/{totalMelhorias})</p>
          </div>
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{totalSugestoes > 0 ? `${Math.round((sugestoesApproved / totalSugestoes) * 100)}%` : '-'}</p>
            <p className="text-sm text-text-secondary">Sugestões acatadas / propostas ({sugestoesApproved}/{totalSugestoes})</p>
          </div>
        </div>

        {sortedDevelopers.length === 0 ? (
          <p className="text-center py-8 text-text-muted">Nenhum card aprovado no período.</p>
        ) : (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Cards Aprovados por Desenvolvedor</h3>
            {sortedDevelopers.map(([dev, devCards]) => (
              <div key={dev} className="border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">{dev}</h4>
                  <span className="text-sm text-text-secondary">{devCards.length} card{devCards.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="space-y-2">
                  {devCards.map((card) => (
                    <div key={card.id} className="flex items-center justify-between text-sm bg-muted rounded-lg p-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs text-text-secondary shrink-0">{card.system_name || 'N/A'}</span>
                        <span className="truncate">{card.title}</span>
                      </div>
                      <span className="text-xs text-text-muted shrink-0 ml-2">
                        {new Date(card.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
