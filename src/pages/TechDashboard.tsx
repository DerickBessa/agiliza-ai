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

function escapeHtml(s: string): string {
  return s.replace(/[&<>"]/g, (c: string) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] || c)
}

interface PrintData {
  title: string
  totalCards: number
  approvedCards: number
  rejectedCards: number
  approvalRate: string
  monthTrend: { name: string; total: number; aprovados: number; reprovados: number }[]
  statusData: { name: string; value: number; color: string }[]
  systemData: { name: string; value: number }[]
  devData: { name: string; aprovados: number; reprovados: number; total: number }[]
  severity: { key: string; label: string; total: number; approved: number }[]
  aFazerCards: { id: string; title: string; system: string; area: string; days: number }[]
  reportByDev: { dev: string; cards: { title: string; system: string; date: string }[] }[]
  generatedAt: string
}

function generatePrintHTML(data: PrintData): string {
  const maxTrend = Math.max(...data.monthTrend.map(m => m.total), 1)
  const maxSystem = Math.max(...data.systemData.map(s => s.value), 1)
  const statusTotal = data.statusData.reduce((s, d) => s + d.value, 0)

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Relat\u00f3rio Agiliza AI</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#111;background:#fff;line-height:1.5;padding:20px}
@page{margin:12mm 15mm;size:A4}
.report{max-width:1000px;margin:0 auto}
h1{font-size:22px;color:#ea580c;margin-bottom:2px}
.sub{font-size:14px;color:#6b7280;margin-bottom:4px}
.meta{font-size:11px;color:#9ca3af;margin-bottom:24px}
.sec-title{font-size:14px;font-weight:600;color:#1f2937;margin-top:24px;margin-bottom:4px}
.sec-desc{font-size:11px;color:#6b7280;margin-bottom:10px}
.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:20px}
.kpi{border:1px solid #e5e7eb;border-radius:8px;padding:12px;text-align:center}
.kpi-val{font-size:22px;font-weight:700;color:#1f2937}
.kpi-lbl{font-size:11px;color:#6b7280;margin-top:2px}
.kpi-g .kpi-val{color:#16a34a}
.kpi-r .kpi-val{color:#dc2626}
.kpi-a .kpi-val{color:#d97706}
.trend{display:flex;align-items:flex-end;gap:4px;height:200px;margin-bottom:4px}
.tc{flex:1;display:flex;flex-direction:column;align-items:center;height:100%;justify-content:flex-end}
.tb{display:flex;gap:2px;width:100%;justify-content:center;align-items:flex-end;height:180px}
.tb-bar{width:8px;border-radius:2px 2px 0 0;min-height:2px}
.tb-o{background:#ea580c}
.tb-g{background:#22c55e}
.tb-r{background:#ef4444}
.tl{font-size:9px;color:#6b7280;margin-top:3px}
.tleg{display:flex;gap:16px;justify-content:center;font-size:11px;color:#6b7280;margin-top:4px}
.tleg span{display:flex;align-items:center;gap:4px}
.tleg i{display:inline-block;width:10px;height:10px;border-radius:2px}
.hr{display:flex;align-items:center;gap:8px;margin-bottom:5px}
.hl{width:120px;font-size:11px;color:#374151;text-align:right;flex-shrink:0}
.ht{flex:1;height:18px;background:#f3f4f6;border-radius:3px;overflow:hidden}
.hf{height:100%;background:#3b82f6;border-radius:3px}
.hv{width:32px;font-size:11px;color:#6b7280;text-align:right;flex-shrink:0}
.st{flex:1;height:18px;background:#f3f4f6;border-radius:3px;overflow:hidden;display:flex}
.sg{height:100%;background:#22c55e}
.sr{height:100%;background:#ef4444}
.sv{width:60px;font-size:11px;color:#6b7280;text-align:right;flex-shrink:0}
.srow{display:flex;align-items:center;gap:8px;margin-bottom:4px}
.sdot{width:10px;height:10px;border-radius:50%;flex-shrink:0}
.sname{flex:1;font-size:11px;color:#374151}
.spct{font-size:11px;color:#6b7280}
.sgrd{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.scrd{border:1px solid #e5e7eb;border-radius:8px;padding:12px;text-align:center}
.sp{font-size:20px;font-weight:700;color:#1f2937}
.sl{font-size:11px;color:#6b7280;margin-top:2px}
.sc{font-size:10px;color:#9ca3af;margin-top:1px}
.sbar{height:4px;background:#f3f4f6;border-radius:2px;margin-top:8px;overflow:hidden}
.sbf{height:100%;border-radius:2px}
table{width:100%;border-collapse:collapse;font-size:11px}
th{text-align:left;padding:6px 8px;border-bottom:2px solid #e5e7eb;color:#6b7280;font-weight:600;font-size:10px;text-transform:uppercase}
td{padding:5px 8px;border-bottom:1px solid #f3f4f6;color:#374151}
tr.hl td{background:#fef2f2;color:#dc2626;font-weight:500}
.ds{border:1px solid #e5e7eb;border-radius:6px;padding:10px;margin-bottom:8px}
.dh{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;font-size:12px;font-weight:600;color:#1f2937}
.db{font-size:10px;background:#fef3c7;color:#d97706;padding:1px 6px;border-radius:10px}
.dc{display:flex;justify-content:space-between;align-items:center;font-size:11px;padding:4px 6px;background:#f9fafb;border-radius:4px;margin-bottom:3px}
.dsSys{color:#6b7280;font-weight:500}
.dsDt{color:#9ca3af}
.footer{text-align:center;font-size:10px;color:#9ca3af;margin-top:24px;padding-top:12px;border-top:1px solid #e5e7eb}
.na{text-align:center;padding:24px;color:#9ca3af;font-size:12px}
</style>
</head>
<body>
<div class="report">
  <div style="text-align:center;margin-bottom:20px">
    <h1>Agiliza AI</h1>
    <div class="sub">Relat\u00f3rio de Gest\u00e3o ${data.title}</div>
    <div class="meta">Gerado em ${data.generatedAt} \u2014 Dados consolidados de todas as equipes (CS, Comercial, Tech)</div>
  </div>

  <div class="kpis">
    <div class="kpi"><div class="kpi-val">${data.totalCards}</div><div class="kpi-lbl">Total de Cards</div></div>
    <div class="kpi kpi-g"><div class="kpi-val">${data.approvedCards}</div><div class="kpi-lbl">Aprovados</div></div>
    <div class="kpi kpi-r"><div class="kpi-val">${data.rejectedCards}</div><div class="kpi-lbl">Reprovados</div></div>
    <div class="kpi kpi-a"><div class="kpi-val">${data.approvalRate}</div><div class="kpi-lbl">Taxa de Aprova\u00e7\u00e3o</div></div>
  </div>

  <div class="sec-title">1. Tend\u00eancia Mensal</div>
  <div class="sec-desc">Evolu\u00e7\u00e3o do volume de cards nos \u00faltimos 12 meses, incluindo total de cards criados, aprovados e reprovados por m\u00eas.</div>
  ${data.monthTrend.every(m => m.total === 0) ? '<div class="na">Sem dados no per\u00edodo.</div>' : `
  <div class="trend">
    ${data.monthTrend.map(m => `
      <div class="tc">
        <div class="tb">
          <div class="tb-bar tb-o" style="height:${Math.max((m.total / maxTrend) * 100, 2)}%"></div>
          <div class="tb-bar tb-g" style="height:${Math.max((m.aprovados / maxTrend) * 100, 2)}%"></div>
          <div class="tb-bar tb-r" style="height:${Math.max((m.reprovados / maxTrend) * 100, 2)}%"></div>
        </div>
        <div class="tl">${m.name}</div>
      </div>
    `).join('')}
  </div>
  <div class="tleg">
    <span><i style="background:#ea580c"></i> Total</span>
    <span><i style="background:#22c55e"></i> Aprovados</span>
    <span><i style="background:#ef4444"></i> Reprovados</span>
  </div>`}

  <div class="sec-title">2. Distribui\u00e7\u00e3o por Status</div>
  <div class="sec-desc">Propor\u00e7\u00e3o de cards em cada etapa do fluxo de trabalho.</div>
  ${data.statusData.length === 0 ? '<div class="na">Sem dados no per\u00edodo.</div>' : `
  ${data.statusData.map(s => `
    <div class="srow">
      <div class="sdot" style="background:${s.color}"></div>
      <div class="sname">${s.name}</div>
      <div class="spct">${s.value} (${Math.round((s.value / statusTotal) * 100)}%)</div>
    </div>
  `).join('')}
  <div style="display:flex;height:12px;border-radius:6px;overflow:hidden;margin-top:8px">
    ${data.statusData.map(s => `<div style="flex:${s.value};background:${s.color};min-width:2px"></div>`).join('')}
  </div>`}

  <div class="sec-title">3. Cards por Sistema</div>
  <div class="sec-desc">Distribui\u00e7\u00e3o das demandas entre os sistemas da plataforma.</div>
  ${data.systemData.length === 0 ? '<div class="na">Sem dados no per\u00edodo.</div>' : data.systemData.map(s => `
    <div class="hr">
      <div class="hl">${escapeHtml(s.name)}</div>
      <div class="ht"><div class="hf" style="width:${Math.max((s.value / maxSystem) * 100, 2)}%"></div></div>
      <div class="hv">${s.value}</div>
    </div>
  `).join('')}

  <div class="sec-title">4. Produtividade por Desenvolvedor</div>
  <div class="sec-desc">Cards aprovados vs reprovados por desenvolvedor no per\u00edodo.</div>
  ${data.devData.length === 0 ? '<div class="na">Nenhum card resolvido no per\u00edodo.</div>' : data.devData.map(d => `
    <div class="hr">
      <div class="hl">${escapeHtml(d.name)}</div>
      <div class="st">
        <div class="sg" style="width:${d.total > 0 ? Math.max((d.aprovados / d.total) * 100, d.aprovados > 0 ? 2 : 0) : 0}%"></div>
        <div class="sr" style="width:${d.total > 0 ? Math.max((d.reprovados / d.total) * 100, d.reprovados > 0 ? 2 : 0) : 0}%"></div>
      </div>
      <div class="sv">${d.aprovados}/${d.reprovados}</div>
    </div>
  `).join('')}

  <div class="sec-title">5. Taxa de Resolu\u00e7\u00e3o por Tipo</div>
  <div class="sec-desc">Percentual de cards resolvidos por categoria.</div>
  ${data.severity.length === 0 ? '<div class="na">Sem dados no per\u00edodo.</div>' : `
  <div class="sgrd">
    ${data.severity.map(s => {
      const pct = s.total > 0 ? Math.round((s.approved / s.total) * 100) : 0
      const sevColor = s.key === 'bug' ? '#dc2626' : s.key === 'melhoria' ? '#2563eb' : '#d97706'
      return `
    <div class="scrd">
      <div class="sp">${s.total > 0 ? pct + '%' : '-'}</div>
      <div class="sl">${s.label}s</div>
      <div class="sc">${s.approved}/${s.total} resolvidos</div>
      <div class="sbar"><div class="sbf" style="width:${pct}%;background:${sevColor}"></div></div>
    </div>`
    }).join('')}
  </div>`}

  <div class="sec-title">6. Cards Aguardando \u2014 Tempo de Espera</div>
  <div class="sec-desc">Cards em "A Fazer" n\u00e3o iniciados. Dias acima de 7 destacados em vermelho.</div>
  ${data.aFazerCards.length === 0 ? '<div class="na">Nenhum card em A Fazer no per\u00edodo.</div>' : `
  <div style="margin-bottom:6px;font-size:11px;color:#6b7280">${data.aFazerCards.length} card${data.aFazerCards.length !== 1 ? 's' : ''} aguardando \u2014 M\u00e9dia de ${Math.round(data.aFazerCards.reduce((s, c) => s + c.days, 0) / data.aFazerCards.length)} dias de espera</div>
  <table>
    <thead><tr><th>T\u00edtulo</th><th>Sistema</th><th>\u00c1rea</th><th style="text-align:right">Dias</th></tr></thead>
    <tbody>
      ${data.aFazerCards.map(c => `
      <tr${c.days > 7 ? ' class="hl"' : ''}>
        <td>${escapeHtml(c.title)}</td>
        <td>${escapeHtml(c.system)}</td>
        <td>${escapeHtml(c.area)}</td>
        <td style="text-align:right;font-weight:600">${c.days}d</td>
      </tr>`).join('')}
    </tbody>
  </table>`}

  <div class="sec-title">7. Cards Aprovados por Desenvolvedor</div>
  <div class="sec-desc">Rela\u00e7\u00e3o detalhada de cards aprovados no per\u00edodo, agrupados por respons\u00e1vel.</div>
  ${data.reportByDev.length === 0 ? '<div class="na">Nenhum card aprovado no per\u00edodo.</div>' : data.reportByDev.map(r => `
    <div class="ds">
      <div class="dh"><span>${escapeHtml(r.dev)}</span><span class="db">${r.cards.length} card${r.cards.length !== 1 ? 's' : ''}</span></div>
      ${r.cards.map(c => `
      <div class="dc">
        <div><span class="dsSys">${escapeHtml(c.system)}</span> \u2014 ${escapeHtml(c.title)}</div>
        <div class="dsDt">${c.date}</div>
      </div>`).join('')}
    </div>
  `).join('')}

  <div class="footer">Agiliza AI \u2014 Relat\u00f3rio gerado automaticamente em ${data.generatedAt}<br>Dados sujeitos a altera\u00e7\u00f5es conforme novos cards s\u00e3o criados ou atualizados.</div>
</div>
</body>
</html>`
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
    const title = isAnnual ? `Anual - ${year}` : `${monthNames[month]} ${year}`
    const approvalRate = periodCards.length > 0 ? `${Math.round((approvedCards.length / periodCards.length) * 100)}%` : '-'
    const severityItems = (['bug', 'melhoria', 'sugestao'] as const).map(sev => ({
      key: sev, label: SEVERITY_LABELS[sev],
      total: severityTotals[sev], approved: severityApproved[sev],
    }))
    const aFazerPrint = aFazerCards.map(c => ({
      id: c.id, title: c.title, system: c.system_name || 'N/A', area: c.area,
      days: getDaysWaiting(c.created_at),
    }))
    const reportDevs = reportByDev.map(([dev, cards]) => ({
      dev,
      cards: cards.map(c => ({ title: c.title, system: c.system_name || 'N/A', date: new Date(c.created_at).toLocaleDateString('pt-BR') }))
    }))
    const printData: PrintData = {
      title, totalCards: periodCards.length, approvedCards: approvedCards.length,
      rejectedCards: rejectedCards.length, approvalRate, monthTrend: [...monthTrend],
      statusData: [...statusData], systemData: [...systemData], devData: [...devData],
      severity: severityItems, aFazerCards: aFazerPrint, reportByDev: reportDevs,
      generatedAt: new Date().toLocaleString('pt-BR'),
    }
    const html = generatePrintHTML(printData)
    const win = window.open('', '_blank')
    if (win) {
      win.document.write(html)
      win.document.close()
      setTimeout(() => { win.focus(); win.print() }, 500)
    } else {
      alert('Pop-up bloqueado. Permita pop-ups para imprimir o relatório.')
    }
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
              @page { margin: 15mm; size: A4; }
              .no-print { display: none !important; }
              [data-print] { position: fixed !important; inset: 0 !important; background: white !important; color: black !important; width: 100% !important; overflow: visible !important; }
              [data-print] * { color: black !important; }
              [data-print] .chart-container { break-inside: avoid; page-break-inside: avoid; }
              [data-print] .report-section { break-inside: avoid; page-break-inside: avoid; }
              [data-print] .report-header { margin-bottom: 20px; }
              [data-print] .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
              [data-print] .severity-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px; }
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
          `}</style>
          <div className="max-w-5xl mx-auto p-6">
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

            <div className="text-center mb-8 report-header">
              <h1 className="text-3xl font-bold text-primary">Agiliza AI</h1>
              <p className="text-lg text-gray-500 mt-1">Relatório de Gestão {isAnnual ? `Anual - ${year}` : `${monthNames[month]} ${year}`}</p>
              <p className="text-sm text-gray-400 mt-1">Relatório gerado em {new Date().toLocaleDateString('pt-BR')} — Dados consolidados de todas as equipes (CS, Comercial, Tech)</p>
            </div>

            <div className="kpi-grid grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              <div className="text-center p-5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                <p className="text-3xl font-bold text-gray-700 dark:text-gray-200">{periodCards.length}</p>
                <p className="text-sm font-medium text-gray-500 mt-1">Total de Cards</p>
                <p className="text-xs text-gray-400 mt-1">Demandas registradas no período</p>
              </div>
              <div className="text-center p-5 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">{approvedCards.length}</p>
                <p className="text-sm font-medium text-gray-500 mt-1">Aprovados</p>
                <p className="text-xs text-gray-400 mt-1">Cards concluídos e aprovados</p>
              </div>
              <div className="text-center p-5 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                <p className="text-3xl font-bold text-red-600 dark:text-red-400">{rejectedCards.length}</p>
                <p className="text-sm font-medium text-gray-500 mt-1">Reprovados</p>
                <p className="text-xs text-gray-400 mt-1">Cards que não atenderam aos critérios</p>
              </div>
              <div className="text-center p-5 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">{periodCards.length > 0 ? `${Math.round((approvedCards.length / periodCards.length) * 100)}%` : '-'}</p>
                <p className="text-sm font-medium text-gray-500 mt-1">Taxa de Aprovação</p>
                <p className="text-xs text-gray-400 mt-1">Percentual de cards aprovados</p>
              </div>
            </div>

            <div className="report-section bg-surface rounded-xl border border-border p-6 mb-6 chart-container">
              <h3 className="text-lg font-semibold mb-1">1. Tendência Mensal</h3>
              <p className="text-sm text-text-secondary mb-4">
                Evolução do volume de cards nos últimos 12 meses, incluindo total de cards criados, aprovados e reprovados por mês.
                Este gráfico permite visualizar a sazonalidade das demandas e a efetividade das entregas ao longo do tempo.
              </p>
              {monthTrend.every(m => m.total === 0) ? (
                <p className="text-sm text-text-muted text-center py-8">Sem dados no período.</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="report-section bg-surface rounded-xl border border-border p-6 chart-container">
                <h3 className="text-lg font-semibold mb-1">2. Distribuição por Status</h3>
                <p className="text-sm text-text-secondary mb-4">
                  Proporção de cards em cada etapa do fluxo de trabalho. A visualização ajuda a identificar gargalos — 
                  por exemplo, uma concentração alta em "Em Progresso" pode indicar sobrecarga da equipe, 
                  enquanto muitos cards "A Fazer" sugerem baixa priorização.
                </p>
                {statusData.length === 0 ? (
                  <p className="text-sm text-text-muted text-center py-8">Sem dados no período.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }: PieLabelRenderProps) => `${name || ''} ${((percent || 0) * 100).toFixed(0)}%`}>
                        {statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: colors.tooltipBg, borderColor: colors.tooltipBorder, borderRadius: 8 }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="report-section bg-surface rounded-xl border border-border p-6 chart-container">
                <h3 className="text-lg font-semibold mb-1">3. Cards por Sistema</h3>
                <p className="text-sm text-text-secondary mb-4">
                  Distribuição das demandas entre os sistemas da plataforma. Este gráfico permite identificar quais
                  sistemas concentram mais solicitações e podem necessitar de maior atenção ou investimento em melhorias.
                </p>
                {systemData.length === 0 ? (
                  <p className="text-sm text-text-muted text-center py-8">Sem dados no período.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={Math.max(220, systemData.length * 50)}>
                    <BarChart data={systemData} layout="vertical" margin={{ left: 90 }}>
                      <CartesianGrid stroke={colors.grid} strokeDasharray="3 3" />
                      <XAxis type="number" tick={{ fill: colors.text, fontSize: 12 }} />
                      <YAxis type="category" dataKey="name" tick={{ fill: colors.text, fontSize: 12 }} width={85} />
                      <Tooltip contentStyle={{ background: colors.tooltipBg, borderColor: colors.tooltipBorder, borderRadius: 8 }} />
                      <Bar dataKey="value" name="Cards" fill={PALETTE[1]} radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="report-section bg-surface rounded-xl border border-border p-6 mb-6 chart-container">
              <h3 className="text-lg font-semibold mb-1">4. Produtividade por Desenvolvedor</h3>
              <p className="text-sm text-text-secondary mb-4">
                Desempenho individual dos desenvolvedores, medido pela quantidade de cards aprovados e reprovados no período.
                Cards reprovados não indicam necessariamente baixa performance — podem refletir desalinhamento de requisitos
                ou critérios de aceite mais rigorosos. Use este dado para orientar feedbacks e plano de desenvolvimento.
              </p>
              {devData.length === 0 ? (
                <p className="text-sm text-text-muted text-center py-8">Nenhum card resolvido no período.</p>
              ) : (
                <ResponsiveContainer width="100%" height={Math.max(220, devData.length * 55)}>
                  <BarChart data={devData} layout="vertical" margin={{ left: 100 }}>
                    <CartesianGrid stroke={colors.grid} strokeDasharray="3 3" />
                    <XAxis type="number" tick={{ fill: colors.text, fontSize: 12 }} />
                    <YAxis type="category" dataKey="name" tick={{ fill: colors.text, fontSize: 12 }} width={95} />
                    <Tooltip contentStyle={{ background: colors.tooltipBg, borderColor: colors.tooltipBorder, borderRadius: 8 }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="aprovados" name="Aprovados" fill={PALETTE[2]} radius={[0, 4, 4, 0]} stackId="a" />
                    <Bar dataKey="reprovados" name="Reprovados" fill={PALETTE[5]} radius={[0, 4, 4, 0]} stackId="a" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6 report-section">
              {(['bug', 'melhoria', 'sugestao'] as const).map(sev => {
                const total = severityTotals[sev]
                const approved = severityApproved[sev]
                const labels: Record<string, string> = {
                  bug: 'Bugs relatados vs resolvidos. A taxa de resolução de bugs é um indicador direto da qualidade e agilidade da equipe de desenvolvimento.',
                  melhoria: 'Melhorias solicitadas versus atendidas. Reflete a capacidade da equipe de evoluir o produto com base em feedbacks.',
                  sugestao: 'Sugestões acatadas versus propostas. Demonstra o nível de abertura a contribuições e inovação contínua.',
                }
                return (
                  <div key={sev} className="text-center p-5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                    <p className="text-2xl font-bold text-gray-700 dark:text-gray-200">{total > 0 ? `${Math.round((approved / total) * 100)}%` : '-'}</p>
                    <p className="text-sm font-medium text-gray-500 mt-1">{SEVERITY_LABELS[sev]}s</p>
                    <p className="text-xs text-gray-400 mt-1">{approved}/{total} resolvidos</p>
                    <p className="text-xs text-gray-400 mt-2 leading-relaxed">{labels[sev]}</p>
                  </div>
                )
              })}
            </div>

            <div className="report-section bg-surface rounded-xl border border-border p-6 mb-6">
              <h3 className="text-lg font-semibold mb-1">5. Cards Aguardando — Tempo de Espera</h3>
              <p className="text-sm text-text-secondary mb-4">
                Cards atualmente na etapa "A Fazer" que ainda não foram iniciados. Dias de espera elevados (acima de 7 dias,
                destacados em vermelho) podem indicar necessidade de revisão de prioridades ou realocação de recursos.
              </p>
              {aFazerCards.length === 0 ? (
                <p className="text-sm text-text-muted text-center py-4">Nenhum card em A Fazer no período.</p>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-3 text-sm text-text-secondary">
                    <span className="font-medium">{aFazerCards.length} card{aFazerCards.length !== 1 ? 's' : ''} aguardando</span>
                    <span className="text-xs">— Média de {aFazerCards.length > 0 ? Math.round(aFazerCards.reduce((s, c) => s + getDaysWaiting(c.created_at), 0) / aFazerCards.length) : 0} dias de espera</span>
                  </div>
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {aFazerCards.map(card => {
                      const days = getDaysWaiting(card.created_at)
                      return (
                        <div key={card.id} className={`flex items-center justify-between text-sm p-3 rounded-lg ${days > 7 ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800' : 'bg-muted'}`}>
                          <div className="flex items-center gap-2 min-w-0">
                            {days > 7 && <AlertTriangle size={14} className="text-red-500 shrink-0" />}
                            <span className="truncate font-medium">{card.title}</span>
                            <span className="text-xs text-text-muted">{card.system_name}</span>
                            <span className="text-xs text-text-muted">({card.area})</span>
                          </div>
                          <span className={`shrink-0 ml-2 font-medium ${days > 7 ? 'text-red-600 dark:text-red-400' : 'text-text-secondary'}`}>{days}d</span>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
            </div>

            <div className="report-section bg-surface rounded-xl border border-border p-6 mb-6">
              <h3 className="text-lg font-semibold mb-1">6. Cards Aprovados por Desenvolvedor</h3>
              <p className="text-sm text-text-secondary mb-4">
                Relação detalhada de todos os cards aprovados no período, agrupados por desenvolvedor responsável.
                Útil para relatórios de desempenho individuais e reconhecimento de resultados.
              </p>
              {reportByDev.length === 0 ? (
                <p className="text-center py-8 text-text-muted">Nenhum card aprovado no período.</p>
              ) : (
                <div className="space-y-6">
                  {reportByDev.map(([dev, devCards]) => (
                    <div key={dev} className="border border-border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium flex items-center gap-2">
                          <User size={16} className="text-primary" />
                          {dev}
                        </h4>
                        <span className="text-sm bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-medium">{devCards.length} card{devCards.length !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="space-y-2">
                        {devCards.map(card => (
                          <div key={card.id} className="flex items-center justify-between text-sm bg-muted rounded-lg p-2.5">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-xs text-text-secondary shrink-0 font-medium">{card.system_name || 'N/A'}</span>
                              <span className="text-xs text-text-muted">|</span>
                              <span className="truncate">{card.title}</span>
                            </div>
                            <span className="text-xs text-text-muted shrink-0 ml-2">{new Date(card.created_at).toLocaleDateString('pt-BR')}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="text-center text-xs text-gray-400 mt-8 pb-4 border-t border-gray-200 dark:border-gray-700 pt-4">
              <p>Agiliza AI — Relatório gerado automaticamente em {new Date().toLocaleString('pt-BR')}</p>
              <p className="mt-1">Dados sujeitos a alterações conforme novos cards são criados ou atualizados.</p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
