import { FollowUpList } from "@/components/follow-ups/follow-up-list";

export default function FollowUpsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Relances</h1>
        <p className="text-muted-foreground">
          Gérez vos relances et suivis de candidatures
        </p>
      </div>

      <FollowUpList />
    </div>
  );
}
