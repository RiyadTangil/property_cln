import { prisma } from "@/lib/prisma";

export const CoreService = {
  async getShellData() {
    const [companyRecord, projects, appSetting] = await Promise.all([
      prisma.company.findFirst({ where: { isActive: true } }),
      prisma.project.findMany({
        orderBy: { id: "asc" },
        select: { id: true, code: true, name: true, status: true },
      }),
      prisma.appSetting.findFirst(),
    ]);

    const company = companyRecord ?? {
      id: 1,
      name: "E-Hishabi ERP",
      branch: "HQ",
      fiscalYear: "FY 1 Jul – 30 Jun",
    };

    const rawColor = appSetting?.primaryColor?.trim() || "#00c292";
    const primaryColor = /^#[0-9a-fA-F]{3,8}$/.test(rawColor) ? rawColor : "#00c292";

    return {
      company,
      projects,
      primaryColor,
      appName: appSetting?.appName || "e-Hishabi ERP",
      footerText:
        appSetting?.footerText || appSetting?.appTagline || "Real Estate & Development Suite",
    };
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
