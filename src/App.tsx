import { BrowserRouter, Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom'
import Layout from './components/Layout.tsx'
import RoleSelect from './pages/RoleSelect.tsx'
import CSKanban from './pages/CSKanban.tsx'
import ComercialKanban from './pages/ComercialKanban.tsx'
import CardCreate from './components/CardCreate.tsx'
import CardDetail from './pages/CardDetail.tsx'
import TechPanel from './pages/TechPanel.tsx'
import TechKanban from './pages/TechKanban.tsx'
import TechDashboard from './pages/TechDashboard.tsx'
import KanbanSelector from './components/KanbanSelector.tsx'
import type { Role } from './types.ts'
import { ArrowLeft } from 'lucide-react'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/login" replace />} />
          <Route path="login" element={<RoleSelect />} />
          <Route path="cs/kanban" element={<CSKanban />} />
          <Route path="cs/kanban/:kanbanId" element={<CSKanban />} />
          <Route path="comercial/kanban" element={<ComercialKanban />} />
          <Route path="comercial/kanban/:kanbanId" element={<ComercialKanban />} />
          <Route path="tech" element={<TechPanel />} />
          <Route path="tech/kanban" element={<TechKanbanList />} />
          <Route path="tech/kanban/:id" element={<TechKanbanPage />} />
          <Route path="tech/cs/kanban" element={<TechCSKanbanPage />} />
          <Route path="tech/cs/kanban/:id" element={<TechCSKanbanPage />} />
          <Route path="tech/comercial/kanban" element={<TechComercialKanbanPage />} />
          <Route path="tech/comercial/kanban/:id" element={<TechComercialKanbanPage />} />
          <Route path="tech/new" element={<CardCreate role="Tech" backPath="/tech" />} />
          <Route path="tech/card/:id" element={<CardDetail role="Tech" />} />
          <Route path="tech/dashboard" element={<TechDashboard />} />
          <Route path="cs/card/:id" element={<CardDetail role="CS" />} />
          <Route path="comercial/card/:id" element={<CardDetail role="Comercial" />} />
          <Route path="cs/criar/:kanbanId" element={<CSCardCreatePage />} />
          <Route path="comercial/criar/:kanbanId" element={<ComercialCardCreatePage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

function TechKanbanList() {
  const navigate = useNavigate()
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/tech')} className="p-1 hover:bg-surface-hover rounded">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-2xl font-bold">Kanbans - Tech</h2>
      </div>
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={() => navigate('/tech')}
          className="px-4 py-2 bg-surface border border-border rounded-lg hover:bg-surface-hover text-sm transition-colors"
        >
          Painel Geral
        </button>
        <button
          onClick={() => navigate('/tech/kanban')}
          className="px-4 py-2 bg-primary text-white rounded-lg text-sm transition-colors"
        >
          Tech
        </button>
        <button
          onClick={() => navigate('/tech/cs/kanban')}
          className="px-4 py-2 bg-surface border border-border rounded-lg hover:bg-surface-hover text-sm transition-colors"
        >
          CS
        </button>
        <button
          onClick={() => navigate('/tech/comercial/kanban')}
          className="px-4 py-2 bg-surface border border-border rounded-lg hover:bg-surface-hover text-sm transition-colors"
        >
          Comercial
        </button>
      </div>
      <KanbanSelector
        role="Tech"
        basePath="/tech/kanban"
        allowCreate={false}
        onSelect={(k) => navigate(`/tech/kanban/${k.id}`)}
      />
    </div>
  )
}

function TechKanbanPage() {
  const params = useParams()
  if (!params.id) return <Navigate to="/tech/kanban" replace />
  return <TechKanban kanbanId={params.id} />
}

function TechCSKanbanPage() {
  const params = useParams()
  const navigate = useNavigate()
  if (!params.id) return <CSKanbanSelectorRedirect navigate={navigate} role="CS" />
  return <TechKanban kanbanId={params.id} role="CS" />
}

function TechComercialKanbanPage() {
  const params = useParams()
  const navigate = useNavigate()
  if (!params.id) return <CSKanbanSelectorRedirect navigate={navigate} role="Comercial" />
  return <TechKanban kanbanId={params.id} role="Comercial" />
}

function CSKanbanSelectorRedirect({ navigate, role }: { navigate: (path: string) => void; role: Role }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/tech')} className="p-1 hover:bg-surface-hover rounded">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-2xl font-bold">Kanbans - {role}</h2>
      </div>
      <KanbanSelector
        role={role}
        basePath={`/tech/${role.toLowerCase()}/kanban`}
        allowCreate={false}
        onSelect={(k) => navigate(`/tech/${role.toLowerCase()}/kanban/${k.id}`)}
      />
    </div>
  )
}

function CSCardCreatePage() {
  const params = useParams()
  return <CardCreate role="CS" backPath="/cs/kanban" selectedKanbanId={params.kanbanId} />
}

function ComercialCardCreatePage() {
  const params = useParams()
  return <CardCreate role="Comercial" backPath="/comercial/kanban" selectedKanbanId={params.kanbanId} />
}

export default App
