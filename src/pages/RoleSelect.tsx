import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Headset, ShoppingBag, Wrench } from 'lucide-react'
import PasswordModal from '../components/PasswordModal.tsx'

const TECH_TOKEN_KEY = 'tech_access_token'
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000

function getStoredToken(): string | null {
  const raw = localStorage.getItem(TECH_TOKEN_KEY)
  if (!raw) return null
  try {
    const { expiresAt } = JSON.parse(raw)
    if (Date.now() > expiresAt) {
      localStorage.removeItem(TECH_TOKEN_KEY)
      return null
    }
    return raw
  } catch {
    localStorage.removeItem(TECH_TOKEN_KEY)
    return null
  }
}

export default function RoleSelect() {
  const navigate = useNavigate()
  const [techModalOpen, setTechModalOpen] = useState(false)

  useEffect(() => {
    const token = getStoredToken()
    if (token) {
      navigate('/tech')
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-light to-page flex flex-col items-center justify-center p-4">
      <div className="text-center mb-10">
        <h1 className="text-4xl md:text-5xl font-bold text-primary mb-2">Agiliza AI</h1>
        <p className="text-text-secondary text-lg">Selecione seu papel</p>
      </div>
      <div className="flex flex-col md:flex-row gap-6 w-full max-w-2xl">
        <button
          onClick={() => navigate('/cs/kanban')}
          className="flex flex-col items-center gap-4 p-8 bg-surface rounded-2xl shadow-lg hover:shadow-xl transition-shadow border border-border flex-1 cursor-pointer"
        >
          <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
            <Headset size={32} className="text-purple-600 dark:text-purple-400" />
          </div>
          <span className="text-xl font-semibold">CS</span>
          <span className="text-sm text-text-secondary">Suporte ao Cliente</span>
        </button>
        <button
          onClick={() => navigate('/comercial/kanban')}
          className="flex flex-col items-center gap-4 p-8 bg-surface rounded-2xl shadow-lg hover:shadow-xl transition-shadow border border-border flex-1 cursor-pointer"
        >
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
            <ShoppingBag size={32} className="text-green-600 dark:text-green-400" />
          </div>
          <span className="text-xl font-semibold">Comercial</span>
          <span className="text-sm text-text-secondary">Vendas e Negócios</span>
        </button>
        <button
          onClick={() => setTechModalOpen(true)}
          className="flex flex-col items-center gap-4 p-8 bg-surface rounded-2xl shadow-lg hover:shadow-xl transition-shadow border border-border flex-1 cursor-pointer"
        >
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
            <Wrench size={32} className="text-blue-600 dark:text-blue-400" />
          </div>
          <span className="text-xl font-semibold">Tech</span>
          <span className="text-sm text-text-secondary">Time Técnico</span>
        </button>
      </div>

      <PasswordModal
        open={techModalOpen}
        onClose={() => setTechModalOpen(false)}
        onSuccess={(remember) => {
          setTechModalOpen(false)
          if (remember) {
            localStorage.setItem(TECH_TOKEN_KEY, JSON.stringify({ expiresAt: Date.now() + SEVEN_DAYS_MS }))
          }
          navigate('/tech')
        }}
        title="Acesso Tech"
        description="Digite a senha para acessar o painel da equipe técnica."
        correctPassword="tech2024"
      />
    </div>
  )
}
