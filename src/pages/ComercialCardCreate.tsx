import { useParams } from 'react-router-dom'
import CardCreate from '../components/CardCreate.tsx'

export default function ComercialCardCreate() {
  const { kanbanId } = useParams()
  return <CardCreate role="Comercial" backPath={kanbanId ? `/comercial/kanban/${kanbanId}` : '/comercial/kanban'} selectedKanbanId={kanbanId} />
}
