import { Routes, Route, Navigate } from 'react-router-dom'
import RoleSelect from './pages/RoleSelect.tsx'
import CSCardCreate from './pages/CSCardCreate.tsx'
import CSKanban from './pages/CSKanban.tsx'
import ComercialCardCreate from './pages/ComercialCardCreate.tsx'
import ComercialKanban from './pages/ComercialKanban.tsx'
import TechPanel from './pages/TechPanel.tsx'
import TechKanban from './pages/TechKanban.tsx'
import CardDetail from './pages/CardDetail.tsx'
import Layout from './components/Layout.tsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RoleSelect />} />
      <Route element={<Layout />}>
        {/* CS routes */}
        <Route path="/cs/criar" element={<CSCardCreate />} />
        <Route path="/cs/criar/:kanbanId" element={<CSCardCreate />} />
        <Route path="/cs/kanban" element={<CSKanban />} />
        <Route path="/cs/kanban/:kanbanId" element={<CSKanban />} />
        <Route path="/cs/card/:id" element={<CardDetail role="CS" />} />

        {/* Comercial routes */}
        <Route path="/comercial/criar" element={<ComercialCardCreate />} />
        <Route path="/comercial/criar/:kanbanId" element={<ComercialCardCreate />} />
        <Route path="/comercial/kanban" element={<ComercialKanban />} />
        <Route path="/comercial/kanban/:kanbanId" element={<ComercialKanban />} />
        <Route path="/comercial/card/:id" element={<CardDetail role="Comercial" />} />

        {/* Tech routes */}
        <Route path="/tech" element={<TechPanel />} />
        <Route path="/tech/kanban" element={<TechKanban />} />
        <Route path="/tech/kanban/:kanbanId" element={<TechKanban />} />
        <Route path="/tech/card/:id" element={<CardDetail role="Tech" />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
