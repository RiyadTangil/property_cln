import React from "react";
import { OrganizationService } from "@/server/services/organization.service";
import CreateDesignationForm from "@/components/organization/CreateDesignationForm";

export const dynamic = "force-dynamic";

export default async function CreateDesignationPage() {
  const { departments } = await OrganizationService.getCreateDesignationPageData();

  return <CreateDesignationForm departments={departments} />;
}
