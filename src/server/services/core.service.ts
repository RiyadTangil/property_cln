import { prisma } from "@/lib/prisma";

export const CoreService = {
  async getShellData() {
    const [companyRecord, projects] = await Promise.all([
      prisma.company.findFirst({ where: { isActive: true } }),
      prisma.project.findMany({
        orderBy: { id: "asc" },
        select: { id: true, code: true, name: true, status: true },
      }),
    ]);

    const company = companyRecord ?? {
      id: 1,
      name: "E-Hishabi ERP",
      branch: "HQ",
      fiscalYear: "FY 1 Jul – 30 Jun",
    };

    return { company, projects };
  },

  async getDashboardData() {
    const [projects, parcelCount, ownedParcelCount] = await Promise.all([
      prisma.project.findMany({ orderBy: { id: "asc" } }),
      prisma.landParcel.count(),
      prisma.landParcel.count({ where: { stage: "owned" } }),
    ]);

    return { projects, parcelCount, ownedParcelCount };
  },

  async getCatchAllProjects(isProjectsList: boolean) {
    return isProjectsList
      ? prisma.project.findMany({ orderBy: { id: "asc" } })
      : [];
  },
};
