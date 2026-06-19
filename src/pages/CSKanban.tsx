import KanbanBoard from '../components/KanbanBoard.tsx'

export default function CSKanban() {
  return <KanbanBoard role="CS" createPath="/cs/criar" cardDetailPath="/cs/card" />
}
