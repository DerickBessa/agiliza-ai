import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import type { Role } from '../types.ts'
import { ArrowLeft, Moon, Sun, LogOut, BarChart3 } from 'lucide-react'

function useRoleFromPath(pathname: string): Role | null {
  if (pathname === '/' || pathname === '/login') return null
  if (pathname.startsWith('/cs')) return 'CS'
  if (pathname.startsWith('/comercial')) return 'Comercial'
  if (pathname.startsWith('/tech')) return 'Tech'
  return null
}

export default function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const isRoot = location.pathname === '/' || location.pathname === '/login'
  const role: Role | null = useRoleFromPath(location.pathname)
  const [dark, setDark] = useState(() => localStorage.getItem('dark') !== 'false')

  const toggleDark = () => {
    const next = !dark
    setDark(next)
    localStorage.setItem('dark', next.toString())
    document.documentElement.classList.toggle('dark', next)
  }

  return (
    <div className="min-h-screen bg-page text-text transition-colors">
      <header className="bg-surface border-b border-border px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          {!isRoot && (
            <button onClick={() => navigate(-1)} className="p-1 hover:bg-surface-hover rounded">
              <ArrowLeft size={20} />
            </button>
          )}
          <Link to="/" className="font-bold text-lg text-primary">Agiliza AI</Link>
          {!isRoot && <span className="text-sm text-text-secondary ml-2">| {role}</span>}
        </div>
        {!isRoot && (
          <div className="flex items-center gap-2">
            {role === 'CS' && (
              <div className="flex gap-2 text-sm">
                <Link to="/cs/kanban" className={`px-3 py-1.5 rounded ${location.pathname.startsWith('/cs/kanban') ? 'bg-primary-light text-primary-dark' : 'hover:bg-surface-hover'}`}>Kanbans</Link>
                <Link to="/cs/criar" className={`px-3 py-1.5 rounded ${location.pathname.startsWith('/cs/criar') ? 'bg-primary-light text-primary-dark' : 'hover:bg-surface-hover'}`}>Novo Card</Link>
              </div>
            )}
            {role === 'Comercial' && (
              <div className="flex gap-2 text-sm">
                <Link to="/comercial/kanban" className={`px-3 py-1.5 rounded ${location.pathname.startsWith('/comercial/kanban') ? 'bg-primary-light text-primary-dark' : 'hover:bg-surface-hover'}`}>Kanbans</Link>
                <Link to="/comercial/criar" className={`px-3 py-1.5 rounded ${location.pathname.startsWith('/comercial/criar') ? 'bg-primary-light text-primary-dark' : 'hover:bg-surface-hover'}`}>Novo Card</Link>
              </div>
            )}
            {role === 'Tech' && (
              <div className="flex gap-2 text-sm items-center">
                <Link to="/tech" className={`px-3 py-1.5 rounded ${location.pathname === '/tech' ? 'bg-primary-light text-primary-dark' : 'hover:bg-surface-hover'}`}>Painel</Link>
                <Link to="/tech/kanban" className={`px-3 py-1.5 rounded ${location.pathname.startsWith('/tech/kanban') && !location.pathname.includes('/cs/') && !location.pathname.includes('/comercial/') ? 'bg-primary-light text-primary-dark' : 'hover:bg-surface-hover'}`}>Kanban Tech</Link>
                <Link to="/tech/cs/kanban" className={`px-3 py-1.5 rounded ${location.pathname.includes('/tech/cs/') ? 'bg-primary-light text-primary-dark' : 'hover:bg-surface-hover'}`}>Kanban CS</Link>
                <Link to="/tech/comercial/kanban" className={`px-3 py-1.5 rounded ${location.pathname.includes('/tech/comercial/') ? 'bg-primary-light text-primary-dark' : 'hover:bg-surface-hover'}`}>Kanban Comercial</Link>
                <Link to="/tech/dashboard" className={`px-3 py-1.5 rounded flex items-center gap-1 ${location.pathname.startsWith('/tech/dashboard') ? 'bg-primary-light text-primary-dark' : 'hover:bg-surface-hover'}`}><BarChart3 size={14} /> Dashboard</Link>
              </div>
            )}
            {role && (
              <button
                onClick={() => {
                  localStorage.removeItem('tech_access_token')
                  localStorage.removeItem('cs_access_token')
                  localStorage.removeItem('comercial_access_token')
                  localStorage.removeItem('tech_dashboard_token')
                  localStorage.removeItem('tech_dashboard_expiry')
                  navigate('/login')
                }}
                className="p-2 hover:bg-surface-hover rounded text-text-secondary hover:text-text transition-colors"
                title="Sair"
              >
                <LogOut size={18} />
              </button>
            )}
            <button onClick={toggleDark} className="p-2 hover:bg-surface-hover rounded">
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        )}
        {isRoot && (
          <div className="flex items-center gap-2">
            <button onClick={toggleDark} className="p-2 hover:bg-surface-hover rounded">
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        )}
      </header>
      <main className="max-w-6xl mx-auto p-4">
        <Outlet />
      </main>
    </div>
  )
}
