import { notFound } from "next/navigation";
import { ProjectsService } from "@/server/services/projects.service";
import { TemplateDetailClient } from "@/components/projects/TemplateDetailClient";

export const dynamic = "force-dynamic";

export default async function CbsTemplateDetailPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!id || Number.isNaN(id)) notFound();
  try {
    const data = await ProjectsService.getTemplateDetailData("cbs", id);
    return <TemplateDetailClient kind="cbs" template={data.template} items={data.items} />;
  } catch {
    notFound();
  }
}
