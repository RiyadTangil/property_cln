import { ProjectsService } from "@/server/services/projects.service";
import { TaskTemplatesClient } from "@/components/projects/TaskTemplatesClient";

export const dynamic = "force-dynamic";

export default async function TaskTemplatesPage() {
  const { rows } = await ProjectsService.getTaskTemplatesPageData();
  return <TaskTemplatesClient rows={rows} />;
}
