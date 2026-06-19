import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.ts'
import type { Card } from '../types.ts'
import { ArrowLeft, Lock, AlertTriangle, User, FileText, Printer, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell,
  ResponsiveContainer, type PieLabelRenderProps,
} from 'recharts'

const DASHBOARD_TOKEN_KEY = 'tech_dashboard_token'
const DASHBOARD_EXPIRY_KEY = 'tech_dashboard_expiry'

const PALETTE = ['#ea580c', '#3b82f6', '#22c55e', '#f59e0b', '#a855f7', '#ef4444', '#06b6d4', '#ec4899']
const STATUS_COLORS: Record<string, string> = { a_fazer: '#3b82f6', em_progresso: '#f59e0b', concluido: '#a855f7', aprovado: '#22c55e', reprovado: '#ef4444' }
const STATUS_LABELS: Record<string, string> = { a_fazer: 'A Fazer', em_progresso: 'Em Progresso', concluido: 'Concluído', aprovado: 'Aprovado', reprovado: 'Reprovado' }
const SEVERITY_LABELS: Record<string, string> = { bug: 'Bug', melhoria: 'Melhoria', sugestao: 'Sugestão' }

function chartColors() {
  const d = document.documentElement.classList.contains('dark')
  return { text: d ? '#e5e7eb' : '#374151', muted: d ? '#6b7280' : '#9ca3af', grid: d ? '#374151' : '#e5e7eb', tooltipBg: d ? '#1f2937' : '#fff', tooltipBorder: d ? '#374151' : '#e5e7eb' }
}

const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

function getDaysWaiting(createdAt: string): number {
  return Math.floor((new Date().getTime() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24))
}

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
  const [showReport, setShowReport] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem(DASHBOARD_TOKEN_KEY)
    const expiry = localStorage.getItem(DASHBOARD_EXPIRY_KEY)
    if (token && expiry && new Date().getTime() < parseInt(expiry)) {
      setAuthenticated(true)
      loadCards()
    }
  }, [])

  async function loadCards() {
    const { data } = await supabase
      .from('cards')
      .select('*, systems(name)')
      .eq('role', 'Tech')
      .order('created_at', { ascending: false })
    if (data) setCards(data.map((c) => ({ ...c, system_name: c.systems?.name })))
  }

  function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (password === import.meta.env.VITE_TECH_PASSWORD) {
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

  const colors = chartColors()

  function filterByPeriod(createdAt: string): boolean {
    const d = new Date(createdAt)
    return isAnnual ? d.getFullYear() === year : d.getMonth() === month && d.getFullYear() === year
  }

  const periodCards = cards.filter(c => filterByPeriod(c.created_at))
  const approvedCards = periodCards.filter(c => c.status === 'aprovado')
  const rejectedCards = periodCards.filter(c => c.status === 'reprovado')
  const aFazerCards = [...periodCards.filter(c => c.status === 'a_fazer')].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

  const monthsBack = 12
  const monthTrend: { name: string; total: number; aprovados: number; reprovados: number }[] = []
  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(year, month - i, 1)
    const m = d.getMonth()
    const y = d.getFullYear()
    const label = monthNames[m].slice(0, 3)
    const inRange = cards.filter(c => {
      const cd = new Date(c.created_at)
      return cd.getMonth() === m && cd.getFullYear() === y
    })
    monthTrend.push({
      name: label,
      total: inRange.length,
      aprovados: inRange.filter(c => c.status === 'aprovado').length,
      reprovados: inRange.filter(c => c.status === 'reprovado').length,
    })
  }

  const statusData = Object.entries(
    periodCards.reduce((acc, c) => { acc[c.status] = (acc[c.status] || 0) + 1; return acc }, {} as Record<string, number>)
  ).map(([status, count]) => ({ name: STATUS_LABELS[status] || status, value: count, color: STATUS_COLORS[status] || '#6b7280' }))

  const systemData = Object.entries(
    periodCards.reduce((acc, c) => { const s = c.system_name || 'Sem sistema'; acc[s] = (acc[s] || 0) + 1; return acc }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8)

  const devData = Object.entries(
    periodCards.filter(c => c.resolved_by).reduce((acc, c) => {
      const dev = c.resolved_by!
      if (!acc[dev]) acc[dev] = { aprovados: 0, reprovados: 0, total: 0 }
      acc[dev].total++
      if (c.status === 'aprovado') acc[dev].aprovados++
      if (c.status === 'reprovado') acc[dev].reprovados++
      return acc
    }, {} as Record<string, { aprovados: number; reprovados: number; total: number }>)
  ).map(([name, v]) => ({ name, ...v })).sort((a, b) => b.total - a.total)

  const severityTotals = { bug: 0, melhoria: 0, sugestao: 0 }
  const severityApproved = { bug: 0, melhoria: 0, sugestao: 0 }
  periodCards.forEach(c => {
    if (c.severity === 'bug' || c.severity === 'melhoria' || c.severity === 'sugestao') {
      severityTotals[c.severity]++
      if (c.status === 'aprovado') severityApproved[c.severity]++
    }
  })

  const reportByDev = Object.entries(
    approvedCards.reduce((acc, c) => {
      const dev = c.resolved_by || 'Sem responsável'
      if (!acc[dev]) acc[dev] = []
      acc[dev].push(c)
      return acc
    }, {} as Record<string, Card[]>)
  ).sort((a, b) => b[1].length - a[1].length)

  function handlePrint() {
    window.print()
  }

  const today = new Date()
  const prevYear = () => setYear(y => y - 1)
  const nextYear = () => { if (year < today.getFullYear()) setYear(y => y + 1) }
  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1) } else setMonth(m => m - 1) }
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1) } else setMonth(m => m + 1) }

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
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="rounded border-border-strong" />
              Lembrar por 7 dias
            </label>
            <button type="submit" className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors">Acessar</button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="no-print">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/tech')} className="flex items-center gap-1 text-sm text-text-secondary hover:text-text">
              <ArrowLeft size={16} /> Voltar
            </button>
            <h2 className="text-2xl font-bold ml-2">Dashboard {isAnnual ? `- ${year}` : `- ${monthNames[month]} ${year}`}</h2>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => setIsAnnual(!isAnnual)} className="px-3 py-1.5 text-sm border border-border-strong rounded-lg hover:bg-surface-hover transition-colors">
              {isAnnual ? 'Mensal' : 'Anual'}
            </button>
            {!isAnnual ? (
              <div className="flex items-center gap-1">
                <button onClick={prevMonth} className="px-2 py-1.5 text-sm border border-border-strong rounded-lg hover:bg-surface-hover">&lt;</button>
                <span className="font-medium text-sm px-2">{monthNames[month]} {year}</span>
                <button onClick={nextMonth} disabled={month === today.getMonth() && year === today.getFullYear()} className="px-2 py-1.5 text-sm border border-border-strong rounded-lg hover:bg-surface-hover disabled:opacity-30">&gt;</button>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <button onClick={prevYear} className="px-2 py-1.5 text-sm border border-border-strong rounded-lg hover:bg-surface-hover">&lt;</button>
                <span className="font-medium text-sm px-2">{year}</span>
                <button onClick={nextYear} disabled={year >= today.getFullYear()} className="px-2 py-1.5 text-sm border border-border-strong rounded-lg hover:bg-surface-hover disabled:opacity-30">&gt;</button>
              </div>
            )}
            <button onClick={() => setShowReport(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors text-sm">
              <FileText size={16} /> Relatório
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{periodCards.length}</p>
            <p className="text-sm text-text-secondary">Total Cards</p>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{approvedCards.length}</p>
            <p className="text-sm text-text-secondary">Aprovados</p>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">{rejectedCards.length}</p>
            <p className="text-sm text-text-secondary">Reprovados</p>
          </div>
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{periodCards.length > 0 ? `${Math.round((approvedCards.length / periodCards.length) * 100)}%` : '-'}</p>
            <p className="text-sm text-text-secondary">Taxa de Aprovação</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-surface rounded-xl border border-border p-6">
            <h3 className="font-semibold mb-4 text-sm">Tendência Mensal</h3>
            {monthTrend.every(m => m.total === 0) ? (
              <p className="text-sm text-text-muted text-center py-8">Sem dados no período.</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={monthTrend}>
                  <CartesianGrid stroke={colors.grid} strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fill: colors.text, fontSize: 12 }} />
                  <YAxis tick={{ fill: colors.text, fontSize: 12 }} />
                  <Tooltip contentStyle={{ background: colors.tooltipBg, borderColor: colors.tooltipBorder, borderRadius: 8, fontSize: 13 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="total" name="Total" fill={PALETTE[0]} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="aprovados" name="Aprovados" fill={PALETTE[2]} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="reprovados" name="Reprovados" fill={PALETTE[5]} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="bg-surface rounded-xl border border-border p-6">
            <h3 className="font-semibold mb-4 text-sm">Distribuição por Status</h3>
            {statusData.length === 0 ? (
              <p className="text-sm text-text-muted text-center py-8">Sem dados no período.</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }: PieLabelRenderProps) => `${name || ''} ${((percent || 0) * 100).toFixed(0)}%`}>
                    {statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: colors.tooltipBg, borderColor: colors.tooltipBorder, borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-surface rounded-xl border border-border p-6">
            <h3 className="font-semibold mb-4 text-sm flex items-center gap-2"><User size={16} /> Produtividade por Desenvolvedor</h3>
            {devData.length === 0 ? (
              <p className="text-sm text-text-muted text-center py-8">Nenhum card resolvido no período.</p>
            ) : (
              <ResponsiveContainer width="100%" height={Math.max(200, devData.length * 50)}>
                <BarChart data={devData} layout="vertical" margin={{ left: 80 }}>
                  <CartesianGrid stroke={colors.grid} strokeDasharray="3 3" />
                  <XAxis type="number" tick={{ fill: colors.text, fontSize: 12 }} />
                  <YAxis type="category" dataKey="name" tick={{ fill: colors.text, fontSize: 12 }} width={75} />
                  <Tooltip contentStyle={{ background: colors.tooltipBg, borderColor: colors.tooltipBorder, borderRadius: 8 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="aprovados" name="Aprovados" fill={PALETTE[2]} radius={[0, 4, 4, 0]} stackId="a" />
                  <Bar dataKey="reprovados" name="Reprovados" fill={PALETTE[5]} radius={[0, 4, 4, 0]} stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="bg-surface rounded-xl border border-border p-6">
            <h3 className="font-semibold mb-4 text-sm">Cards por Sistema</h3>
            {systemData.length === 0 ? (
              <p className="text-sm text-text-muted text-center py-8">Sem dados no período.</p>
            ) : (
              <ResponsiveContainer width="100%" height={Math.max(200, systemData.length * 45)}>
                <BarChart data={systemData} layout="vertical" margin={{ left: 80 }}>
                  <CartesianGrid stroke={colors.grid} strokeDasharray="3 3" />
                  <XAxis type="number" tick={{ fill: colors.text, fontSize: 12 }} />
                  <YAxis type="category" dataKey="name" tick={{ fill: colors.text, fontSize: 12 }} width={75} />
                  <Tooltip contentStyle={{ background: colors.tooltipBg, borderColor: colors.tooltipBorder, borderRadius: 8 }} />
                  <Bar dataKey="value" name="Cards" fill={PALETTE[1]} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          {(['bug', 'melhoria', 'sugestao'] as const).map(sev => {
            const total = severityTotals[sev]
            const approved = severityApproved[sev]
            const bgMap: Record<string, string> = { bug: 'bg-red-50 dark:bg-red-900/20', melhoria: 'bg-blue-50 dark:bg-blue-900/20', sugestao: 'bg-amber-50 dark:bg-amber-900/20' }
            const txtMap: Record<string, string> = { bug: 'text-red-600 dark:text-red-400', melhoria: 'text-blue-600 dark:text-blue-400', sugestao: 'text-amber-600 dark:text-amber-400' }
            return (
              <div key={sev} className={`${bgMap[sev]} rounded-lg p-4 text-center`}>
                <p className={`text-2xl font-bold ${txtMap[sev]}`}>{total > 0 ? `${Math.round((approved / total) * 100)}%` : '-'}</p>
                <p className="text-sm text-text-secondary">{SEVERITY_LABELS[sev]}s resolvidos ({approved}/{total})</p>
              </div>
            )
          })}
        </div>

        <div className="bg-surface rounded-xl border border-border p-6 mb-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2"><AlertTriangle size={18} /> Cards A Fazer — Tempo de Espera</h3>
          {aFazerCards.length === 0 ? (
            <p className="text-sm text-text-muted text-center py-4">Nenhum card em A Fazer.</p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {aFazerCards.map(card => {
                const days = getDaysWaiting(card.created_at)
                return (
                  <div key={card.id} className={`flex items-center justify-between text-sm p-2 rounded-lg ${days > 7 ? 'bg-red-50 dark:bg-red-900/20' : 'bg-muted'}`}>
                    <div className="flex items-center gap-2 min-w-0">
                      {days > 7 && <AlertTriangle size={14} className="text-red-500 shrink-0" />}
                      <span className="truncate">{card.title}</span>
                      <span className="text-xs text-text-muted">{card.system_name}</span>
                    </div>
                    <span className={`shrink-0 ml-2 font-medium ${days > 7 ? 'text-red-600 dark:text-red-400' : 'text-text-secondary'}`}>{days}d</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {showReport && (
        <div className="fixed inset-0 z-50 bg-white dark:bg-gray-900 overflow-y-auto" data-print>
          <style>{`
            @media print {
              .no-print { display: none !important; }
              [data-print] { position: fixed !important; inset: 0 !important; background: white !important; color: black !important; }
              [data-print] * { color: black !important; }
            }
          `}</style>
          <div className="max-w-4xl mx-auto p-6">
            <div className="flex items-center justify-between mb-6 no-print">
              <h2 className="text-2xl font-bold">Relatório {isAnnual ? `Anual - ${year}` : `- ${monthNames[month]} ${year}`}</h2>
              <div className="flex items-center gap-2">
                <button onClick={handlePrint} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors text-sm">
                  <Printer size={16} /> Imprimir
                </button>
                <button onClick={() => setShowReport(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-8">
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-2xl font-bold">{periodCards.length}</p>
                <p className="text-sm text-gray-500">Total Cards</p>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{approvedCards.length}</p>
                <p className="text-sm text-gray-500">Aprovados</p>
              </div>
              <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <p className="text-2xl font-bold text-red-600">{rejectedCards.length}</p>
                <p className="text-sm text-gray-500">Reprovados</p>
              </div>
              <div className="text-center p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                <p className="text-2xl font-bold text-amber-600">{periodCards.length > 0 ? `${Math.round((approvedCards.length / periodCards.length) * 100)}%` : '-'}</p>
                <p className="text-sm text-gray-500">Aprovação</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-8">
              {(['bug', 'melhoria', 'sugestao'] as const).map(sev => {
                const total = severityTotals[sev]
                const approved = severityApproved[sev]
                return (
                  <div key={sev} className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-2xl font-bold">{total > 0 ? `${Math.round((approved / total) * 100)}%` : '-'}</p>
                    <p className="text-sm text-gray-500">{SEVERITY_LABELS[sev]}s ({approved}/{total})</p>
                  </div>
                )
              })}
            </div>

            {reportByDev.length === 0 ? (
              <p className="text-center py-8 text-gray-400">Nenhum card aprovado no período.</p>
            ) : (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Cards Aprovados por Desenvolvedor</h3>
                {reportByDev.map(([dev, devCards]) => (
                  <div key={dev} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium flex items-center gap-1"><User size={16} /> {dev}</h4>
                      <span className="text-sm text-gray-500">{devCards.length} card{devCards.length !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="space-y-2">
                      {devCards.map(card => (
                        <div key={card.id} className="flex items-center justify-between text-sm bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-xs text-gray-400 shrink-0">{card.system_name || 'N/A'}</span>
                            <span className="truncate">{card.title}</span>
                          </div>
                          <span className="text-xs text-gray-400 shrink-0 ml-2">{new Date(card.created_at).toLocaleDateString('pt-BR')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
