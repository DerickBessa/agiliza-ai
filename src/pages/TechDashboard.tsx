import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.ts'
import type { Card, Role } from '../types.ts'
import { ArrowLeft, Lock, Calendar, AlertTriangle, CheckCircle, XCircle, User } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const DASHBOARD_TOKEN_KEY = 'tech_dashboard_token'
const DASHBOARD_EXPIRY_KEY = 'tech_dashboard_expiry'

export default function TechDashboard() {
  const navigate = useNavigate()
  const [authenticated, setAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [error, setError] = useState('')
  const [cards, setCards] = useState<Card[]>([])
  const [month, setMonth] = useState(new Date().getMonth())
  const [year, setYear] = useState(new Date().getFullYear())
  const [isAnnual, setIsAnnual] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem(DASHBOARD_TOKEN_KEY)
    const expiry = localStorage.getItem(DASHBOARD_EXPIRY_KEY)
    if (token && expiry) {
      if (new Date().getTime() < parseInt(expiry)) {
        setAuthenticated(true)
        loadCards()
      } else {
        localStorage.removeItem(DASHBOARD_TOKEN_KEY)
        localStorage.removeItem(DASHBOARD_EXPIRY_KEY)
      }
    }
  }, [])

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

  function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (password === (import.meta.env.VITE_TECH_PASSWORD || 'tech2024')) {
      if (remember) {
        const expiry = new Date().getTime() + 7 * 24 * 60 * 60 * 1000
        localStorage.setItem(DASHBOARD_TOKEN_KEY, 'true')
        localStorage.setItem(DASHBOARD_EXPIRY_KEY, String(expiry))
      }
      setAuthenticated(true)
      loadCards()
    } else {
      setError('Senha incorreta!')
    }
  }

  if (!authenticated) {
    return (
      <div className="max-w-md mx-auto mt-20">
        <button onClick={() => navigate('/tech')} className="flex items-center gap-1 text-sm text-text-secondary hover:text-text mb-4">
          <ArrowLeft size={16} /> Voltar
        </button>
        <div className="bg-surface rounded-xl border border-border p-6">
          <div className="text-center mb-6">
            <Lock size={40} className="mx-auto text-primary mb-2" />
            <h2 className="text-xl font-bold">Dashboard Protegido</h2>
            <p className="text-sm text-text-secondary">Digite a senha para acessar</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError('') }}
                className="w-full px-3 py-2 border border-border-strong rounded-lg bg-surface focus:ring-2 focus:ring-primary outline-none"
                placeholder="Senha"
                autoFocus
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="rounded border-border-strong"
              />
              Lembrar por 7 dias
            </label>
            <button
              type="submit"
              className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
            >
              Acessar
            </button>
          </form>
        </div>
      </div>
    )
  }

  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
  ]

  function filterByPeriod(createdAt: string): boolean {
    const d = new Date(createdAt)
    if (isAnnual) return d.getFullYear() === year
    return d.getMonth() === month && d.getFullYear() === year
  }

  const maxPastMonths = 12
  const availableMonths: { month: number; year: number }[] = []
  const today = new Date()
  for (let i = 0; i < maxPastMonths; i++) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1)
    availableMonths.push({ month: d.getMonth(), year: d.getFullYear() })
  }

  const prevYear = () => setYear(y => y - 1)
  const nextYear = () => { if (year < new Date().getFullYear()) setYear(y => y + 1) }
  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  const aFazerCards = cards
    .filter(c => c.status === 'a_fazer')
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

  function getDaysWaiting(createdAt: string): number {
    return Math.floor((new Date().getTime() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24))
  }

  const periodCards = cards.filter(c => filterByPeriod(c.created_at))
  const approvedInPeriod = periodCards.filter(c => c.status === 'aprovado')
  const rejectedInPeriod = periodCards.filter(c => c.status === 'reprovado')

  const totalBugs = periodCards.filter(c => c.severity === 'bug').length
  const bugsApproved = periodCards.filter(c => c.severity === 'bug' && c.status === 'aprovado').length
  const totalMelhorias = periodCards.filter(c => c.severity === 'melhoria').length
  const melhoriasApproved = periodCards.filter(c => c.severity === 'melhoria' && c.status === 'aprovado').length
  const totalSugestoes = periodCards.filter(c => c.severity === 'sugestao').length
  const sugestoesApproved = periodCards.filter(c => c.severity === 'sugestao' && c.status === 'aprovado').length

  const devProductivity = periodCards
    .filter(c => c.resolved_by)
    .reduce((acc, card) => {
      const dev = card.resolved_by!
      if (!acc[dev]) acc[dev] = { approved: 0, rejected: 0, total: 0 }
      acc[dev].total++
      if (card.status === 'aprovado') acc[dev].approved++
      if (card.status === 'reprovado') acc[dev].rejected++
      return acc
    }, {} as Record<string, { approved: number; rejected: number; total: number }>)

  const sortedDevs = Object.entries(devProductivity).sort((a, b) => b[1].total - a[1].total)
  const maxTotal = Math.max(...sortedDevs.map(([, v]) => v.total), 1)

  return (
    <div className="max-w-5xl mx-auto">
      <button onClick={() => navigate('/tech')} className="flex items-center gap-1 text-sm text-text-secondary hover:text-text mb-4">
        <ArrowLeft size={16} /> Voltar
      </button>

      <h2 className="text-2xl font-bold mb-6">
        Dashboard {isAnnual ? `- ${year}` : `- ${months[month]} ${year}`}
      </h2>

      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => setIsAnnual(!isAnnual)}
          className="px-3 py-1.5 text-sm border border-border-strong rounded-lg hover:bg-surface-hover transition-colors"
        >
          {isAnnual ? 'Mensal' : 'Anual'}
        </button>
        {!isAnnual && (
          <div className="flex items-center gap-2">
            <button onClick={prevMonth} className="px-3 py-1.5 text-sm border border-border-strong rounded-lg hover:bg-surface-hover">&lt;</button>
            <span className="font-medium text-sm">{months[month]} {year}</span>
            <button onClick={nextMonth} disabled={month === today.getMonth() && year === today.getFullYear()} className="px-3 py-1.5 text-sm border border-border-strong rounded-lg hover:bg-surface-hover disabled:opacity-30">&gt;</button>
          </div>
        )}
        {isAnnual && (
          <div className="flex items-center gap-2">
            <button onClick={prevYear} className="px-3 py-1.5 text-sm border border-border-strong rounded-lg hover:bg-surface-hover">&lt;</button>
            <span className="font-medium text-sm">{year}</span>
            <button onClick={nextYear} disabled={year >= today.getFullYear()} className="px-3 py-1.5 text-sm border border-border-strong rounded-lg hover:bg-surface-hover disabled:opacity-30">&gt;</button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{periodCards.length}</p>
          <p className="text-sm text-text-secondary">Total Cards</p>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{approvedInPeriod.length}</p>
          <p className="text-sm text-text-secondary">Aprovados</p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">{rejectedInPeriod.length}</p>
          <p className="text-sm text-text-secondary">Reprovados</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface rounded-xl border border-border p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Calendar size={18} /> Idade dos Cards (A Fazer)
          </h3>
          {aFazerCards.length === 0 ? (
            <p className="text-sm text-text-muted text-center py-4">Nenhum card em A Fazer.</p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {aFazerCards.map((card) => {
                const days = getDaysWaiting(card.created_at)
                return (
                  <div key={card.id} className={`flex items-center justify-between text-sm p-2 rounded-lg ${days > 7 ? 'bg-red-50 dark:bg-red-900/20' : 'bg-muted'}`}>
                    <div className="flex items-center gap-2 min-w-0">
                      {days > 7 && <AlertTriangle size={14} className="text-red-500 shrink-0" />}
                      <span className="truncate">{card.title}</span>
                    </div>
                    <span className={`shrink-0 ml-2 font-medium ${days > 7 ? 'text-red-600 dark:text-red-400' : 'text-text-secondary'}`}>
                      {days}d
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="bg-surface rounded-xl border border-border p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <CheckCircle size={18} /> Produtividade por Desenvolvedor
          </h3>
          {sortedDevs.length === 0 ? (
            <p className="text-sm text-text-muted text-center py-4">Nenhum card resolvido no período.</p>
          ) : (
            <div className="space-y-4">
              {sortedDevs.map(([dev, stats]) => (
                <div key={dev}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium flex items-center gap-1"><User size={14} />{dev}</span>
                    <span className="text-text-secondary">{stats.approved} aprovado{stats.approved !== 1 ? 's' : ''} / {stats.rejected} rejeitado{stats.rejected !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex gap-1 h-6">
                    <div
                      className="bg-emerald-500 rounded-l transition-all"
                      style={{ width: `${(stats.approved / maxTotal) * 100}%`, minWidth: stats.approved > 0 ? '4px' : '0' }}
                      title={`${stats.approved} aprovados`}
                    />
                    {stats.rejected > 0 && (
                      <div
                        className="bg-red-500 rounded-r transition-all"
                        style={{ width: `${(stats.rejected / maxTotal) * 100}%`, minWidth: '4px' }}
                        title={`${stats.rejected} rejeitados`}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
