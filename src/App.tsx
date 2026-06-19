import { BrowserRouter, Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom'
import Layout from './components/Layout.tsx'
import RoleSelect from './pages/RoleSelect.tsx'
import CSKanban from './pages/CSKanban.tsx'
import ComercialKanban from './pages/ComercialKanban.tsx'
import CardCreate from './components/CardCreate.tsx'
import CardDetail from './pages/CardDetail.tsx'
import TechPanel from './pages/TechPanel.tsx'
import TechKanban from './pages/TechKanban.tsx'
import TechReport from './pages/TechReport.tsx'
import TechDashboard from './pages/TechDashboard.tsx'
import KanbanSelector from './components/KanbanSelector.tsx'
import type { Role } from './types.ts'

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
          <Route path="tech/new" element={<CardCreate role="Tech" backPath="/tech" />} />
          <Route path="tech/card/:id" element={<CardDetail role="Tech" />} />
          <Route path="tech/relatorio" element={<TechReport />} />
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
    <KanbanSelector
      role="Tech"
      basePath="/tech/kanban"
      onSelect={(k) => navigate(`/tech/kanban/${k.id}`)}
    />
  )
}

function TechKanbanPage() {
  const params = useParams()
  if (!params.id) return <Navigate to="/tech/kanban" replace />
  return <TechKanban kanbanId={params.id} />
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
