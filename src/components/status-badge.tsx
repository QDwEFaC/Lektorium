import { Badge } from "@/components/ui/badge";
import { STATUS_LABEL, type AssignmentStatus } from "@/lib/types";

export function StatusBadge({ status }: { status: AssignmentStatus }) {
  if (status === "done") {
    return <Badge variant="secondary">{STATUS_LABEL[status]}</Badge>;
  }
  if (status === "review") {
    return (
      <Badge className="border-primary/25 bg-primary/10 text-primary">
        {STATUS_LABEL[status]}
      </Badge>
    );
  }
  if (status === "in-progress") {
    return <Badge>{STATUS_LABEL[status]}</Badge>;
  }
  return <Badge variant="outline">{STATUS_LABEL[status]}</Badge>;
}
