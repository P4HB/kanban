import KanbanBoard from "@/components/board/kanban-board";

export default function BoardPage({ params }: { params: { projectId: string } }) {
  return <KanbanBoard projectId={params.projectId} />;
}
