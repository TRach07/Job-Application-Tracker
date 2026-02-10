import { KanbanBoard } from "@/components/applications/kanban-board";

export default function ApplicationsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Candidatures</h1>
          <p className="text-muted-foreground">
            Gérez vos candidatures en drag & drop
          </p>
        </div>
      </div>

      <KanbanBoard />
    </div>
  );
}
