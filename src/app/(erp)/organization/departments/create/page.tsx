import React from "react";
import { prisma } from "@/lib/prisma";
import CreateDepartmentForm from "@/components/organization/CreateDepartmentForm";

export const dynamic = "force-dynamic";

export default async function CreateDepartmentPage() {
  const [branches, parents] = await Promise.all([
    prisma.branch.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.department.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return <CreateDepartmentForm branches={branches} parents={parents} />;
}
