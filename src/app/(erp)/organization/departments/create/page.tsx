import React from "react";
import { OrganizationService } from "@/server/services/organization.service";
import CreateDepartmentForm from "@/components/organization/CreateDepartmentForm";

export const dynamic = "force-dynamic";

export default async function CreateDepartmentPage() {
  const { branches, parents } = await OrganizationService.getCreateDepartmentPageData();

  return <CreateDepartmentForm branches={branches} parents={parents} />;
}
