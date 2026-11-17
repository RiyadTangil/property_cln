import { notFound } from "next/navigation";
import { ProjectsService } from "@/server/services/projects.service";
import { TemplateDetailClient } from "@/components/projects/TemplateDetailClient";

export const dynamic = "force-dynamic";

export default async function ItpTemplateDetailPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!id || Number.isNaN(id)) notFound();
  try {
    const data = await ProjectsService.getTemplateDetailData("itp", id);
    return <TemplateDetailClient kind="itp" template={data.template} items={data.items} />;
  } catch {
    notFound();
  }
}
