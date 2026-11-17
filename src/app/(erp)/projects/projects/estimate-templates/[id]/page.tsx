import { notFound } from "next/navigation";
import { ProjectsService } from "@/server/services/projects.service";
import { TemplateDetailClient } from "@/components/projects/TemplateDetailClient";

export const dynamic = "force-dynamic";

export default async function EstimateTemplateDetailPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!id || Number.isNaN(id)) notFound();
  try {
    const data = await ProjectsService.getTemplateDetailData("estimate", id);
    return <TemplateDetailClient kind="estimate" template={data.template} items={data.items} parameters={data.parameters ?? []} />;
  } catch {
    notFound();
  }
}
