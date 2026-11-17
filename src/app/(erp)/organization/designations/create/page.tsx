import React from "react";
import { prisma } from "@/lib/prisma";
import CreateDesignationForm from "@/components/organization/CreateDesignationForm";

export const dynamic = "force-dynamic";

export default async function CreateDesignationPage() {
  const departments = await prisma.department.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return <CreateDesignationForm departments={departments} />;
}
