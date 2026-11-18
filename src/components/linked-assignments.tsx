import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { assignmentHref } from "@/lib/links";
import type { Assignment } from "@/lib/types";

export function LinkedAssignments({
  assignments,
  emptyDescription,
}: {
  assignments: Assignment[];
  emptyDescription: string;
}) {
  if (assignments.length === 0) {
    return (
      <EmptyState
        title="Ещё не привязано"
        description={emptyDescription}
      />
    );
  }
  return (
    <div className="space-y-2">
      {assignments.map((assignment) => (
        <Link
          key={assignment.slug}
          href={assignmentHref(assignment.slug)}
          className="block rounded-lg border px-3 py-2 hover:bg-muted/60"
        >
          <p className="text-sm font-medium">{assignment.title}</p>
          <div className="mt-1">
            <StatusBadge status={assignment.status} />
          </div>
        </Link>
      ))}
    </div>
  );
}
