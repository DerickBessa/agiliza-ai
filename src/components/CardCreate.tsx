import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.ts'
import type { Role, System } from '../types.ts'
import { Upload, Send } from 'lucide-react'

interface Props {
  role: Role
  backPath: string
}

export default function CardCreate({ role, backPath }: Props) {
  const navigate = useNavigate()
  const [systems, setSystems] = useState<System[]>([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState('')
  const [systemId, setSystemId] = useState('')
  const [area, setArea] = useState('')
  const [type, setType] = useState<'Bug' | 'Inovação'>('Bug')
  const [severity, setSeverity] = useState<'Blocker' | 'Major' | 'Minor'>('Minor')
  const [newSystem, setNewSystem] = useState('')
  const [showNewSystem, setShowNewSystem] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadSystems()
  }, [])

  async function loadSystems() {
    const { data } = await supabase.from('systems').select('*').order('name')
    if (data) setSystems(data)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !description.trim()) {
      alert('Título e descrição são obrigatórios!')
      return
    }
    let finalSystemId = systemId

    if (showNewSystem && newSystem.trim()) {
      const { data, error } = await supabase.from('systems').insert({ name: newSystem.trim() }).select().single()
      if (error) { alert('Erro ao criar sistema: ' + error.message); return }
      if (data) finalSystemId = data.id
    }

    if (!finalSystemId) {
      alert('Selecione ou crie um sistema!')
      return
    }

    setSubmitting(true)

    let photoUrl: string | null = null
    if (photo) {
      const fileExt = photo.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`
      const { error: uploadError } = await supabase.storage.from('card-photos').upload(fileName, photo)
      if (uploadError) {
        alert('Erro ao fazer upload: ' + uploadError.message)
        setSubmitting(false)
        return
      }
      const { data: urlData } = supabase.storage.from('card-photos').getPublicUrl(fileName)
      photoUrl = urlData.publicUrl
    }

    const { error } = await supabase.from('cards').insert({
      role,
      title: title.trim(),
      description: description.trim(),
      photo_url: photoUrl,
      system_id: finalSystemId,
      area: area.trim(),
      type,
      severity,
      status: 'a_fazer',
    })

    setSubmitting(false)
    if (error) {
      alert('Erro ao criar card: ' + error.message)
    } else {
      navigate(backPath)
    }
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setPhoto(file)
      const reader = new FileReader()
      reader.onload = (ev) => setPhotoPreview(ev.target?.result as string)
      reader.readAsDataURL(file)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold">Novo Card - {role}</h2>

      <div>
        <label className="block text-sm font-medium mb-1">Título *</label>
        <input
          value={title} onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 outline-none"
          placeholder="Título do card"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Descrição do Problema *</label>
        <textarea
          value={description} onChange={(e) => setDescription(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 outline-none min-h-[100px]"
          placeholder="Descreva o problema..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Foto/Print (opcional)</label>
        <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
          <Upload size={18} />
          <span>{photo ? photo.name : 'Selecionar arquivo'}</span>
          <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
        </label>
        {photoPreview && (
          <img src={photoPreview} alt="Preview" className="mt-2 max-h-48 rounded-lg object-contain" />
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Sistema Afetado *</label>
        <div className="flex gap-2 mb-2">
          <button
            type="button"
            onClick={() => setShowNewSystem(false)}
            className={`px-3 py-1 text-sm rounded ${!showNewSystem ? 'bg-purple-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
          >
            Existente
          </button>
          <button
            type="button"
            onClick={() => setShowNewSystem(true)}
            className={`px-3 py-1 text-sm rounded ${showNewSystem ? 'bg-purple-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
          >
            Novo Sistema
          </button>
        </div>
        {showNewSystem ? (
          <input
            value={newSystem} onChange={(e) => setNewSystem(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 outline-none"
            placeholder="Nome do novo sistema"
          />
        ) : (
          <select
            value={systemId} onChange={(e) => setSystemId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 outline-none"
          >
            <option value="">Selecione um sistema</option>
            {systems.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Área do Sistema *</label>
        <input
          value={area} onChange={(e) => setArea(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 outline-none"
          placeholder="Ex: Módulo financeiro, Relatórios, etc."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Tipo *</label>
          <select
            value={type} onChange={(e) => setType(e.target.value as 'Bug' | 'Inovação')}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 outline-none"
          >
            <option value="Bug">Bug</option>
            <option value="Inovação">Inovação</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Severidade *</label>
          <select
            value={severity} onChange={(e) => setSeverity(e.target.value as 'Blocker' | 'Major' | 'Minor')}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 outline-none"
          >
            <option value="Blocker">Blocker</option>
            <option value="Major">Major</option>
            <option value="Minor">Minor</option>
          </select>
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
      >
        <Send size={18} />
        {submitting ? 'Enviando...' : 'Criar Card'}
      </button>
    </form>
  )
}
