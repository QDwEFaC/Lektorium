import { CaptureDialog } from "@/components/capture-dialog";
import { CreateTaxonomyDialog } from "@/components/create-taxonomy-dialog";
import { EmptyState } from "@/components/empty-state";
import { SubjectTree } from "@/components/subject-tree";
import { listTaxonomy } from "@/lib/vault";

export const dynamic = "force-dynamic";

export default async function LecturesPage() {
  const tree = await listTaxonomy();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Предметы и лекции
          </h1>
          <p className="text-sm text-muted-foreground">
            Папки в{" "}
            <code className="rounded bg-muted px-1">
              vault/Лекции/предмет/модуль
            </code>
            .
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <CreateTaxonomyDialog kind="subject" />
          <CaptureDialog />
        </div>
      </div>

      {tree.length === 0 ? (
        <EmptyState
          title="Пока пусто"
          description="Создай предмет без ссылки или сохрани материал из URL."
          action={<CreateTaxonomyDialog kind="subject" triggerVariant="default" />}
        />
      ) : (
        <SubjectTree tree={tree} />
      )}
    </div>
  );
}
