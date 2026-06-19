import { useParams } from 'react-router-dom'
import CardCreate from '../components/CardCreate.tsx'

export default function CSCardCreate() {
  const { kanbanId } = useParams()
  return <CardCreate role="CS" backPath={kanbanId ? `/cs/kanban/${kanbanId}` : '/cs/kanban'} selectedKanbanId={kanbanId} />
}
