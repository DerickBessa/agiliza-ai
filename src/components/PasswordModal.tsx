import { useState, useEffect, useRef } from 'react'
import { Lock, X, Eye, EyeOff } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
  onSuccess: (remember: boolean) => void
  title: string
  description: string
  correctPassword: string
}

export default function PasswordModal({ open, onClose, onSuccess, title, description, correctPassword }: Props) {
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setPassword('')
      setError('')
      setRemember(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!open) return
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password === correctPassword) {
      onSuccess(remember)
      setPassword('')
      setError('')
    } else {
      setError('Senha incorreta. Tente novamente.')
      setPassword('')
      inputRef.current?.focus()
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative bg-surface rounded-2xl shadow-2xl border border-border w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 pb-0">
          <div className="w-10 h-10 bg-primary-light dark:bg-primary-dark/30 rounded-xl flex items-center justify-center">
            <Lock size={20} className="text-primary" />
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-surface-hover rounded-lg transition-colors text-text-secondary hover:text-text"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-4">
          <h2 className="text-lg font-semibold mb-1">{title}</h2>
          <p className="text-sm text-text-secondary mb-4">{description}</p>

          <form onSubmit={handleSubmit}>
            <div className="relative">
              <input
                ref={inputRef}
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError('') }}
                className={`w-full px-3 py-2.5 pr-10 border rounded-xl bg-surface focus:ring-2 focus:ring-primary outline-none text-sm transition-colors ${error ? 'border-red-500' : 'border-border-strong'}`}
                placeholder="Digite a senha"
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {error && (
              <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                <span>⚠</span> {error}
              </p>
            )}

            <label className="flex items-center gap-2 mt-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="w-4 h-4 rounded border-border-strong text-primary focus:ring-primary"
              />
              <span className="text-sm text-text-secondary">Lembrar por 7 dias</span>
            </label>

            <div className="flex gap-2 mt-4 justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-text-secondary hover:bg-surface-hover rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-sm font-medium bg-primary text-white rounded-xl hover:bg-primary-hover transition-colors"
              >
                Entrar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
