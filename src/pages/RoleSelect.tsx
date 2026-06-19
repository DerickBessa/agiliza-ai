import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Headset, ShoppingBag, Wrench } from 'lucide-react'
import PasswordModal from '../components/PasswordModal.tsx'

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000

function getStoredToken(key: string): string | null {
  const raw = localStorage.getItem(key)
  if (!raw) return null
  try {
    const { expiresAt } = JSON.parse(raw)
    if (Date.now() > expiresAt) {
      localStorage.removeItem(key)
      return null
    }
    return raw
  } catch {
    localStorage.removeItem(key)
    return null
  }
}

const cardBase = 'flex flex-col items-center gap-4 p-8 bg-surface rounded-2xl border border-border flex-1 cursor-pointer select-none'
const cardStyle: React.CSSProperties = {
  transition: 'all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
  boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
}

type ModalState = 'cs' | 'comercial' | 'tech' | null

export default function RoleSelect() {
  const navigate = useNavigate()
  const [modal, setModal] = useState<ModalState>(null)

  useEffect(() => {
    if (getStoredToken('cs_access_token')) navigate('/cs/kanban')
    else if (getStoredToken('comercial_access_token')) navigate('/comercial/kanban')
    else if (getStoredToken('tech_access_token')) navigate('/tech')
  }, [])

  function handleSuccess(role: 'CS' | 'Comercial' | 'Tech', remember: boolean) {
    const tokenKey = role === 'CS' ? 'cs_access_token' : role === 'Comercial' ? 'comercial_access_token' : 'tech_access_token'
    const path = role === 'Tech' ? '/tech' : `/${role.toLowerCase()}/kanban`
    setModal(null)
    if (remember) {
      localStorage.setItem(tokenKey, JSON.stringify({ expiresAt: Date.now() + SEVEN_DAYS_MS }))
    }
    navigate(path)
  }

  const modalConfig: Record<string, { title: string; description: string; password: string; color: string }> = {
    cs: {
      title: 'Acesso CS',
      description: 'Digite a senha para acessar o painel de Suporte ao Cliente.',
      password: import.meta.env.VITE_CS_PASSWORD,
      color: 'purple',
    },
    comercial: {
      title: 'Acesso Comercial',
      description: 'Digite a senha para acessar o painel de Vendas e Negócios.',
      password: import.meta.env.VITE_COMERCIAL_PASSWORD,
      color: 'green',
    },
    tech: {
      title: 'Acesso Tech',
      description: 'Digite a senha para acessar o painel da equipe técnica.',
      password: import.meta.env.VITE_TECH_PASSWORD,
      color: 'blue',
    },
  }

  return (
    <div className="fixed inset-0 z-0 bg-gradient-to-br from-primary-light to-page text-text flex flex-col items-center justify-center p-4">
      <div className="text-center mb-10">
        <h1 className="text-4xl md:text-5xl font-bold text-primary mb-2">Agiliza AI</h1>
        <p className="text-text-secondary text-lg">Selecione seu papel</p>
      </div>
      <div className="flex flex-col md:flex-row gap-6 w-full max-w-2xl">
        {/* CS */}
        <button
          onClick={() => setModal('cs')}
          className={cardBase}
          style={cardStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 16px 32px rgba(147,51,234,0.35)'
            e.currentTarget.style.transform = 'translate(-10px, -10px)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,0.1)'
            e.currentTarget.style.transform = 'translate(0, 0)'
          }}
        >
          <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
            <Headset size={32} className="text-purple-600 dark:text-purple-400" />
          </div>
          <span className="text-xl font-semibold">CS</span>
          <span className="text-sm text-text-secondary">Suporte ao Cliente</span>
        </button>

        {/* Comercial */}
        <button
          onClick={() => setModal('comercial')}
          className={cardBase}
          style={cardStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 16px 32px rgba(34,197,94,0.35)'
            e.currentTarget.style.transform = 'translate(10px, -10px)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,0.1)'
            e.currentTarget.style.transform = 'translate(0, 0)'
          }}
        >
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
            <ShoppingBag size={32} className="text-green-600 dark:text-green-400" />
          </div>
          <span className="text-xl font-semibold">Comercial</span>
          <span className="text-sm text-text-secondary">Vendas e Negócios</span>
        </button>

        {/* Tech */}
        <button
          onClick={() => setModal('tech')}
          className={cardBase}
          style={cardStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 16px 32px rgba(59,130,246,0.35)'
            e.currentTarget.style.transform = 'translate(0, -10px)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,0.1)'
            e.currentTarget.style.transform = 'translate(0, 0)'
          }}
        >
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
            <Wrench size={32} className="text-blue-600 dark:text-blue-400" />
          </div>
          <span className="text-xl font-semibold">Tech</span>
          <span className="text-sm text-text-secondary">Time Técnico</span>
        </button>
      </div>

      {modal && (
        <PasswordModal
          open={true}
          onClose={() => setModal(null)}
          onSuccess={(remember) => handleSuccess(
            modal === 'cs' ? 'CS' : modal === 'comercial' ? 'Comercial' : 'Tech',
            remember
          )}
          title={modalConfig[modal].title}
          description={modalConfig[modal].description}
          correctPassword={modalConfig[modal].password}
        />
      )}
    </div>
  )
}
