import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import type { Role } from '../types.ts'
import { ArrowLeft, Moon, Sun } from 'lucide-react'

export default function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const role = location.pathname.startsWith('/cs') ? 'CS' : location.pathname.startsWith('/comercial') ? 'Comercial' : 'Tech'
  const [dark, setDark] = useState(() => localStorage.getItem('dark') === 'true')

  const toggleDark = () => {
    const next = !dark
    setDark(next)
    localStorage.setItem('dark', next.toString())
    document.documentElement.classList.toggle('dark', next)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
            <ArrowLeft size={20} />
          </button>
          <Link to="/" className="font-bold text-lg text-primary">Agiliza AI</Link>
          <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">| {role}</span>
        </div>
        <div className="flex items-center gap-3">
          {role === 'CS' && (
            <div className="flex gap-2 text-sm">
              <Link to="/cs/kanban" className={`px-3 py-1.5 rounded ${location.pathname === '/cs/kanban' ? 'bg-primary-light text-primary-dark dark:text-primary' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>Kanban</Link>
              <Link to="/cs/criar" className={`px-3 py-1.5 rounded ${location.pathname === '/cs/criar' ? 'bg-primary-light text-primary-dark dark:text-primary' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>Novo Card</Link>
            </div>
          )}
          {role === 'Comercial' && (
            <div className="flex gap-2 text-sm">
              <Link to="/comercial/kanban" className={`px-3 py-1.5 rounded ${location.pathname === '/comercial/kanban' ? 'bg-primary-light text-primary-dark dark:text-primary' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>Kanban</Link>
              <Link to="/comercial/criar" className={`px-3 py-1.5 rounded ${location.pathname === '/comercial/criar' ? 'bg-primary-light text-primary-dark dark:text-primary' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>Novo Card</Link>
            </div>
          )}
          <button onClick={toggleDark} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </header>
      <main className="max-w-6xl mx-auto p-4">
        <Outlet />
      </main>
    </div>
  )
}
