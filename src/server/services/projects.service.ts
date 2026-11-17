import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/lib/auth";
import { ServiceError } from "@/server/http/api-handler";
import { allocateSequenceCode, recordAudit } from "@/lib/tier0";
import type {
  CreateBreakdownTemplateDto,
  CreateBuildingDto,
  CreateCostBreakdownItemDto,
  CreateEstimateTemplateDto,
  CreateInspectionChecklistDto,
  CreateProjectCategoryDto,
  CreateProjectConsumptionDto,
  CreateProjectCostDto,
  CreateProjectDto,
  CreateProjectParameterDto,
  CreateProjectTaskDto,
  CreateProjectTeamDto,
  CreateProjectTypeDto,
  CreateTaskTemplateDto,
  UpdateBuildingDto,
  UpdateCostBreakdownItemDto,
  UpdateInspectionChecklistDto,
  UpdateProjectCategoryDto,
  UpdateProjectDto,
  UpdateProjectParameterDto,
  UpdateProjectTypeDto,
  UpdateTaskTemplateDto,
} from "@/server/dto";

const COMPANY_ID = 1;

export const ProjectsService = {
  // ---------------- Project Types ----------------
  async getTypesPageData(search?: string, status?: string) {
    const where: Record<string, unknown> = { companyId: COMPANY_ID };
    if (search) where.name = { contains: search };
    if (status === "active") where.isActive = true;
    if (status === "inactive") where.isActive = false;

    const types = await prisma.projectType.findMany({
      where,
      include: { _count: { select: { categories: true, projects: true } } },
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    });
    return { types };
  },

  async createType(user: SessionUser, dto: CreateProjectTypeDto) {
    if (!dto.name.trim()) throw new ServiceError(400, "Name is required");
    const row = await prisma.projectType.create({
      data: {
        companyId: COMPANY_ID,
        name: dto.name.trim(),
        description: dto.description ?? null,
        icon: dto.icon || "fa-solid fa-city",
        pill: dto.pill || "is-neutral",
        sortOrder: dto.sortOrder ?? 10,
        isActive: dto.isActive ?? true,
        isBuiltin: false,
        createdBy: user.name,
      },
    });
    await recordAudit(user.name, "created", row.name, "ProjectType", [], user.id);
    return row;
  },

  async updateType(user: SessionUser, id: number, dto: UpdateProjectTypeDto) {
    const existing = await prisma.projectType.findUnique({ where: { id } });
    if (!existing) throw new ServiceError(404, "Project type not found");
    const row = await prisma.projectType.update({
      where: { id },
      data: {
        name: dto.name !== undefined ? dto.name.trim() : undefined,
        description: dto.description,
        icon: dto.icon,
        pill: dto.pill,
        sortOrder: dto.sortOrder,
        isActive: dto.isActive,
      },
    });
    await recordAudit(user.name, "updated", row.name, "ProjectType", [], user.id);
    return row;
  },

  async deleteType(user: SessionUser, id: number) {
    const existing = await prisma.projectType.findUnique({ where: { id } });
    if (!existing) throw new ServiceError(404, "Project type not found");
    if (existing.isBuiltin) throw new ServiceError(400, "Built-in project types cannot be deleted");
    await prisma.projectType.delete({ where: { id } });
    await recordAudit(user.name, "deleted", existing.name, "ProjectType", [], user.id);
    return { ok: true };
  },

  // ---------------- Project Categories ----------------
  async getCategoriesPageData(search?: string, projectTypeId?: number, status?: string) {
    const where: Record<string, unknown> = { companyId: COMPANY_ID };
    if (search) where.name = { contains: search };
    if (projectTypeId) where.projectTypeId = projectTypeId;
    if (status === "active") where.isActive = true;
    if (status === "inactive") where.isActive = false;

    const [categories, types] = await Promise.all([
      prisma.projectCategory.findMany({
        where,
        include: {
          projectType: { select: { id: true, name: true } },
          _count: { select: { projects: true } },
        },
        orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
      }),
      prisma.projectType.findMany({ where: { companyId: COMPANY_ID }, orderBy: [{ sortOrder: "asc" }, { id: "asc" }] }),
    ]);
    return { categories, types };
  },

  async createCategory(user: SessionUser, dto: CreateProjectCategoryDto) {
    if (!dto.name.trim()) throw new ServiceError(400, "Name is required");
    const row = await prisma.projectCategory.create({
      data: {
        companyId: COMPANY_ID,
        name: dto.name.trim(),
        projectTypeId: dto.projectTypeId ?? null,
        description: dto.description ?? null,
        sortOrder: dto.sortOrder ?? 10,
        isActive: dto.isActive ?? true,
        isBuiltin: false,
        createdBy: user.name,
      },
    });
    await recordAudit(user.name, "created", row.name, "ProjectCategory", [], user.id);
    return row;
  },

  async updateCategory(user: SessionUser, id: number, dto: UpdateProjectCategoryDto) {
    const existing = await prisma.projectCategory.findUnique({ where: { id } });
    if (!existing) throw new ServiceError(404, "Project category not found");
    const row = await prisma.projectCategory.update({
      where: { id },
      data: {
        name: dto.name !== undefined ? dto.name.trim() : undefined,
        projectTypeId: dto.projectTypeId,
        description: dto.description,
        sortOrder: dto.sortOrder,
        isActive: dto.isActive,
      },
    });
    await recordAudit(user.name, "updated", row.name, "ProjectCategory", [], user.id);
    return row;
  },

  async deleteCategory(user: SessionUser, id: number) {
    const existing = await prisma.projectCategory.findUnique({ where: { id } });
    if (!existing) throw new ServiceError(404, "Project category not found");
    if (existing.isBuiltin) throw new ServiceError(400, "Built-in categories cannot be deleted");
    await prisma.projectCategory.delete({ where: { id } });
    await recordAudit(user.name, "deleted", existing.name, "ProjectCategory", [], user.id);
    return { ok: true };
  },

  // ---------------- Projects ----------------
  async getProjectsPageData(opts: {
    search?: string;
    projectTypeId?: number;
    priority?: string;
    status?: string;
    manager?: string;
  }) {
    const where: Record<string, unknown> = { companyId: COMPANY_ID };
    if (opts.search) {
      where.OR = [
        { name: { contains: opts.search } },
        { code: { contains: opts.search } },
        { location: { contains: opts.search } },
      ];
    }
    if (opts.projectTypeId) where.projectTypeId = opts.projectTypeId;
    if (opts.priority) where.priority = opts.priority;
    if (opts.status) where.status = opts.status;
    if (opts.manager) where.managerName = opts.manager;

    const [projects, allProjects, types] = await Promise.all([
      prisma.project.findMany({
        where,
        include: {
          projectType: { select: { id: true, name: true, icon: true, pill: true } },
          projectCategory: { select: { id: true, name: true } },
          _count: { select: { buildings: true, tasks: true } },
        },
        orderBy: { id: "desc" },
      }),
      prisma.project.findMany({ where: { companyId: COMPANY_ID }, select: { status: true, managerName: true } }),
      prisma.projectType.findMany({ where: { companyId: COMPANY_ID, isActive: true }, orderBy: [{ sortOrder: "asc" }, { id: "asc" }] }),
    ]);

    const statusCounts: Record<string, number> = { planning: 0, active: 0, on_hold: 0, completed: 0, cancelled: 0 };
    const managerSet = new Set<string>();
    for (const p of allProjects) {
      const k = p.status.toLowerCase().replace(/\s+/g, "_");
      if (k in statusCounts) statusCounts[k] += 1;
      if (p.managerName) managerSet.add(p.managerName);
    }

    return { projects, types, statusCounts, managers: Array.from(managerSet) };
  },

  async getProjectCreateData() {
    const [types, categories, parcels, wbsTemplates, cbsTemplates, estimateTemplates] = await Promise.all([
      prisma.projectType.findMany({ where: { companyId: COMPANY_ID, isActive: true }, orderBy: [{ sortOrder: "asc" }, { id: "asc" }] }),
      prisma.projectCategory.findMany({ where: { companyId: COMPANY_ID, isActive: true }, orderBy: [{ sortOrder: "asc" }, { id: "asc" }] }),
      prisma.landParcel.findMany({ where: { companyId: COMPANY_ID }, select: { id: true, code: true, title: true, mouza: true }, orderBy: { id: "desc" } }),
      prisma.wbsTemplate.findMany({ where: { companyId: COMPANY_ID }, select: { id: true, name: true, projectTypeId: true, projectCategoryId: true, isDefault: true } }),
      prisma.cbsTemplate.findMany({ where: { companyId: COMPANY_ID }, select: { id: true, name: true, projectTypeId: true, projectCategoryId: true, isDefault: true } }),
      prisma.estimateTemplate.findMany({ where: { companyId: COMPANY_ID }, select: { id: true, name: true, projectTypeId: true, projectCategoryId: true, isDefault: true } }),
    ]);
    return { types, categories, parcels, wbsTemplates, cbsTemplates, estimateTemplates };
  },

  async getProjectDetailData(id: number) {
    const [project, allProjects, buildings, types, categories, taskTemplates] = await Promise.all([
      prisma.project.findUnique({
        where: { id },
        include: {
          projectType: true,
          projectCategory: true,
          parcels: true,
          warehouses: true,
          buildings: true,
          tasks: { orderBy: { id: "desc" } },
          teams: { orderBy: { id: "desc" } },
          costs: { orderBy: { id: "desc" } },
          consumptions: { include: { building: { select: { id: true, name: true } } }, orderBy: { id: "desc" } },
        },
      }),
      prisma.project.findMany({ where: { companyId: COMPANY_ID }, select: { id: true, code: true, name: true }, orderBy: { id: "desc" } }),
      prisma.building.findMany({ where: { companyId: COMPANY_ID }, select: { id: true, name: true, projectId: true } }),
      prisma.projectType.findMany({ where: { companyId: COMPANY_ID, isActive: true }, orderBy: [{ sortOrder: "asc" }, { id: "asc" }] }),
      prisma.projectCategory.findMany({ where: { companyId: COMPANY_ID, isActive: true }, orderBy: [{ sortOrder: "asc" }, { id: "asc" }] }),
      prisma.taskTemplate.findMany({ where: { companyId: COMPANY_ID, isActive: true }, orderBy: { sortOrder: "asc" } }),
    ]);
    if (!project) throw new ServiceError(404, "Project not found");
    return { project, allProjects, buildings, types, categories, taskTemplates };
  },

  async createProject(user: SessionUser, dto: CreateProjectDto) {
    if (!dto.name.trim()) throw new ServiceError(400, "Project name is required");
    const code = await allocateSequenceCode("project", "PRJ");
    const row = await prisma.project.create({
      data: {
        companyId: COMPANY_ID,
        code,
        name: dto.name.trim(),
        projectTypeId: dto.projectTypeId ?? null,
        projectCategoryId: dto.projectCategoryId ?? null,
        managerId: dto.managerId ?? null,
        managerName: dto.managerName ?? null,
        clientName: dto.clientName ?? null,
        priority: dto.priority || "medium",
        status: dto.status || "planning",
        startDate: dto.startDate ?? null,
        expectedCompletionDate: dto.expectedCompletionDate ?? null,
        actualCompletionDate: dto.actualCompletionDate ?? null,
        progress: dto.progress ?? 0,
        completionPct: dto.progress ?? 0,
        description: dto.description ?? null,
        currency: dto.currency || "BDT",
        location: dto.location || "Dhaka",
        city: dto.city ?? null,
        country: dto.country || "BD",
        latitude: dto.latitude ?? null,
        longitude: dto.longitude ?? null,
        phase: dto.status || "Planning",
        handoverDate: dto.expectedCompletionDate || "TBD",
        budget: dto.budget ?? 0,
        createdBy: user.name,
      },
    });
    if (dto.landParcelIds && dto.landParcelIds.length > 0) {
      await prisma.landParcel.updateMany({
        where: { id: { in: dto.landParcelIds } },
        data: { projectId: row.id },
      });
    }
    await recordAudit(user.name, "created", row.name, "Project", [], user.id);
    return row;
  },

  async updateProject(user: SessionUser, id: number, dto: UpdateProjectDto) {
    const existing = await prisma.project.findUnique({ where: { id } });
    if (!existing) throw new ServiceError(404, "Project not found");
    const row = await prisma.project.update({
      where: { id },
      data: {
        name: dto.name !== undefined ? dto.name.trim() : undefined,
        projectTypeId: dto.projectTypeId,
        projectCategoryId: dto.projectCategoryId,
        managerId: dto.managerId,
        managerName: dto.managerName,
        clientName: dto.clientName,
        priority: dto.priority,
        status: dto.status,
        startDate: dto.startDate,
        expectedCompletionDate: dto.expectedCompletionDate,
        actualCompletionDate: dto.actualCompletionDate,
        progress: dto.progress,
        completionPct: dto.progress,
        description: dto.description,
        currency: dto.currency,
        location: dto.location,
        city: dto.city,
        country: dto.country,
        latitude: dto.latitude,
        longitude: dto.longitude,
        budget: dto.budget,
      },
    });
    await recordAudit(user.name, "updated", row.name, "Project", [], user.id);
    return row;
  },

  async deleteProject(user: SessionUser, id: number) {
    const existing = await prisma.project.findUnique({ where: { id } });
    if (!existing) throw new ServiceError(404, "Project not found");
    await prisma.project.delete({ where: { id } });
    await recordAudit(user.name, "deleted", existing.name, "Project", [], user.id);
    return { ok: true };
  },

  async createProjectTask(user: SessionUser, projectId: number, dto: CreateProjectTaskDto) {
    if (!dto.title.trim()) throw new ServiceError(400, "Task title is required");
    const row = await prisma.projectTask.create({
      data: {
        projectId,
        parentId: dto.parentId ?? null,
        title: dto.title.trim(),
        category: dto.category ?? null,
        status: dto.status || "new",
        assigneeNames: dto.assigneeNames ?? null,
        startDate: dto.startDate ?? null,
        dueDate: dto.dueDate ?? null,
        color: dto.color ?? null,
        description: dto.description ?? null,
        estimatedCost: dto.estimatedCost ?? 0,
      },
    });
    await recordAudit(user.name, "created", row.title, "ProjectTask", [], user.id);
    return row;
  },

  async updateProjectTask(user: SessionUser, taskId: number, status: string) {
    const row = await prisma.projectTask.update({ where: { id: taskId }, data: { status } });
    await recordAudit(user.name, "updated", row.title, "ProjectTask", [], user.id);
    return row;
  },

  async deleteProjectTask(user: SessionUser, taskId: number) {
    const existing = await prisma.projectTask.findUnique({ where: { id: taskId } });
    if (!existing) throw new ServiceError(404, "Task not found");
    await prisma.projectTask.delete({ where: { id: taskId } });
    await recordAudit(user.name, "deleted", existing.title, "ProjectTask", [], user.id);
    return { ok: true };
  },

  async createProjectTeam(user: SessionUser, projectId: number, dto: CreateProjectTeamDto) {
    if (!dto.name.trim()) throw new ServiceError(400, "Team name is required");
    const row = await prisma.projectTeam.create({
      data: {
        projectId,
        name: dto.name.trim(),
        departmentName: dto.departmentName ?? null,
        leadName: dto.leadName ?? null,
        type: dto.type || "site",
        memberNames: dto.memberNames ?? null,
      },
    });
    await recordAudit(user.name, "created", row.name, "ProjectTeam", [], user.id);
    return row;
  },

  async createProjectCost(user: SessionUser, projectId: number, dto: CreateProjectCostDto) {
    const row = await prisma.projectCost.create({
      data: {
        projectId,
        category: dto.category || "other",
        costDate: dto.costDate,
        amount: dto.amount || 0,
        notes: dto.notes ?? null,
      },
    });
    await prisma.project.update({
      where: { id: projectId },
      data: { actualCost: { increment: dto.amount || 0 } },
    });
    await recordAudit(user.name, "created", `${dto.category} (${dto.amount})`, "ProjectCost", [], user.id);
    return row;
  },

  async createProjectConsumption(user: SessionUser, projectId: number, dto: CreateProjectConsumptionDto) {
    if (!dto.materialName.trim()) throw new ServiceError(400, "Material name is required");
    const row = await prisma.projectConsumption.create({
      data: {
        projectId,
        buildingId: dto.buildingId ?? null,
        projectTaskId: dto.projectTaskId ?? null,
        materialName: dto.materialName.trim(),
        costCode: dto.costCode ?? null,
        qtyUsed: dto.qtyUsed || 0,
        wastage: dto.wastage ?? 0,
        uom: dto.uom || "Unit",
        unitCost: dto.unitCost ?? 0,
        consumptionDate: dto.consumptionDate ?? null,
        notes: dto.notes ?? null,
      },
    });
    await recordAudit(user.name, "created", row.materialName, "ProjectConsumption", [], user.id);
    return row;
  },

  // ---------------- Buildings ----------------
  async getBuildingsPageData(search?: string, buildingType?: string, status?: string) {
    const where: Record<string, unknown> = { companyId: COMPANY_ID };
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { code: { contains: search } },
        { location: { contains: search } },
      ];
    }
    if (buildingType) where.buildingType = buildingType;
    if (status) where.status = status;

    const [buildings, allBuildings] = await Promise.all([
      prisma.building.findMany({
        where,
        include: {
          project: { select: { id: true, code: true, name: true } },
          landParcel: { select: { id: true, code: true, title: true } },
          _count: { select: { floors: true, units: true } },
        },
        orderBy: { id: "desc" },
      }),
      prisma.building.findMany({ where: { companyId: COMPANY_ID }, select: { status: true } }),
    ]);

    const statusCounts: Record<string, number> = {
      under_construction: 0,
      completed: 0,
      handover: 0,
      occupied: 0,
      maintenance: 0,
    };
    for (const b of allBuildings) {
      if (b.status in statusCounts) statusCounts[b.status] += 1;
    }
    return { buildings, statusCounts };
  },

  async getBuildingCreateData() {
    const [projects, parcels] = await Promise.all([
      prisma.project.findMany({ where: { companyId: COMPANY_ID }, select: { id: true, code: true, name: true }, orderBy: { id: "desc" } }),
      prisma.landParcel.findMany({ where: { companyId: COMPANY_ID }, select: { id: true, code: true, title: true, mouza: true }, orderBy: { id: "desc" } }),
    ]);
    return { projects, parcels };
  },

  async getBuildingDetailData(id: number) {
    const building = await prisma.building.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, code: true, name: true } },
        landParcel: { select: { id: true, code: true, title: true, mouza: true } },
        floors: {
          include: { units: { orderBy: { unitNumber: "asc" } } },
          orderBy: { floorNumber: "asc" },
        },
        units: { orderBy: { unitNumber: "asc" } },
      },
    });
    if (!building) throw new ServiceError(404, "Building not found");
    return { building };
  },

  async createFloor(
    user: SessionUser,
    buildingId: number,
    data: { floorNumber: number; name?: string | null; floorType?: string; unitsPlanned?: number; area?: number | null; height?: number | null; description?: string | null }
  ) {
    const row = await prisma.buildingFloor.create({
      data: {
        buildingId,
        floorNumber: data.floorNumber,
        name: data.name ?? (data.floorNumber === 0 ? "Ground Floor" : data.floorNumber < 0 ? `Basement ${Math.abs(data.floorNumber)}` : `Floor ${data.floorNumber}`),
        floorType: data.floorType || "residential",
        unitsPlanned: data.unitsPlanned ?? 0,
        area: data.area ?? null,
        height: data.height ?? null,
        description: data.description ?? null,
      },
      include: { units: true },
    });
    await recordAudit(user.name, "created", row.name || `Floor ${row.floorNumber}`, "BuildingFloor", [], user.id);
    return row;
  },

  async bulkCreateFloors(
    user: SessionUser,
    buildingId: number,
    data: { fromFloor: number; toFloor: number; floorType?: string; unitsPlanned?: number; area?: number | null; height?: number | null }
  ) {
    const existing = await prisma.buildingFloor.findMany({ where: { buildingId }, select: { floorNumber: true } });
    const existingNums = new Set(existing.map((f) => f.floorNumber));
    const created = [];
    const start = Math.min(data.fromFloor, data.toFloor);
    const end = Math.max(data.fromFloor, data.toFloor);
    for (let n = start; n <= end; n++) {
      if (existingNums.has(n)) continue;
      const row = await prisma.buildingFloor.create({
        data: {
          buildingId,
          floorNumber: n,
          name: n === 0 ? "Ground Floor" : n < 0 ? `Basement ${Math.abs(n)}` : `Floor ${n}`,
          floorType: data.floorType || "residential",
          unitsPlanned: data.unitsPlanned ?? 0,
          area: data.area ?? null,
          height: data.height ?? null,
        },
        include: { units: true },
      });
      created.push(row);
    }
    await recordAudit(user.name, "created", `${created.length} floors (${start}..${end})`, "BuildingFloor", [], user.id);
    return created;
  },

  async deleteFloor(user: SessionUser, floorId: number) {
    const existing = await prisma.buildingFloor.findUnique({ where: { id: floorId } });
    if (!existing) throw new ServiceError(404, "Floor not found");
    await prisma.buildingFloor.delete({ where: { id: floorId } });
    await recordAudit(user.name, "deleted", existing.name || `Floor ${existing.floorNumber}`, "BuildingFloor", [], user.id);
    return { ok: true };
  },

  async createUnit(
    user: SessionUser,
    buildingId: number,
    data: {
      floorId: number;
      unitNumber: string;
      name?: string | null;
      unitType?: string;
      status?: string;
      facing?: string | null;
      bedrooms?: number;
      bathrooms?: number;
      balconies?: number;
      parkingSlots?: number;
      carpetArea?: number | null;
      builtArea?: number | null;
      superArea?: number | null;
      price?: number | null;
      ratePerSqft?: number | null;
      handoverDate?: string | null;
      ownerName?: string | null;
      customerName?: string | null;
      features?: string | null;
      description?: string | null;
      isCorner?: boolean;
    }
  ) {
    if (!data.unitNumber.trim()) throw new ServiceError(400, "Unit number is required");
    const row = await prisma.buildingUnit.create({
      data: {
        buildingId,
        floorId: data.floorId,
        unitNumber: data.unitNumber.trim(),
        name: data.name ?? null,
        unitType: data.unitType || "apartment",
        status: data.status || "available",
        facing: data.facing ?? null,
        bedrooms: data.bedrooms ?? 0,
        bathrooms: data.bathrooms ?? 0,
        balconies: data.balconies ?? 0,
        parkingSlots: data.parkingSlots ?? 0,
        carpetArea: data.carpetArea ?? null,
        builtArea: data.builtArea ?? null,
        superArea: data.superArea ?? null,
        price: data.price ?? null,
        ratePerSqft: data.ratePerSqft ?? null,
        handoverDate: data.handoverDate ?? null,
        ownerName: data.ownerName ?? null,
        customerName: data.customerName ?? null,
        features: data.features ?? null,
        description: data.description ?? null,
        isCorner: data.isCorner ?? false,
      },
    });
    await recordAudit(user.name, "created", row.unitNumber, "BuildingUnit", [], user.id);
    return row;
  },

  async bulkGenerateUnits(
    user: SessionUser,
    buildingId: number,
    data: { floorIds: number[]; unitsPerFloor: number; prefix?: string; unitType?: string; bedrooms?: number; bathrooms?: number; builtArea?: number | null; price?: number | null }
  ) {
    const floors = await prisma.buildingFloor.findMany({
      where: { buildingId, ...(data.floorIds.length ? { id: { in: data.floorIds } } : {}) },
      orderBy: { floorNumber: "asc" },
    });
    const created = [];
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    for (const fl of floors) {
      for (let i = 0; i < Math.max(1, data.unitsPerFloor); i++) {
        const suffix = letters[i] || String(i + 1);
        const unitNumber = `${data.prefix || ""}${fl.floorNumber}${suffix}`;
        const row = await prisma.buildingUnit.create({
          data: {
            buildingId,
            floorId: fl.id,
            unitNumber,
            unitType: data.unitType || "apartment",
            status: "available",
            bedrooms: data.bedrooms ?? 0,
            bathrooms: data.bathrooms ?? 0,
            builtArea: data.builtArea ?? null,
            price: data.price ?? null,
          },
        });
        created.push(row);
      }
    }
    await recordAudit(user.name, "created", `${created.length} units`, "BuildingUnit", [], user.id);
    return created;
  },

  async deleteUnit(user: SessionUser, unitId: number) {
    const existing = await prisma.buildingUnit.findUnique({ where: { id: unitId } });
    if (!existing) throw new ServiceError(404, "Unit not found");
    await prisma.buildingUnit.delete({ where: { id: unitId } });
    await recordAudit(user.name, "deleted", existing.unitNumber, "BuildingUnit", [], user.id);
    return { ok: true };
  },

  async getTemplateDetailData(kind: "wbs" | "cbs" | "estimate" | "itp", id: number) {
    if (kind === "wbs") {
      const [template, taskTemplates] = await Promise.all([
        prisma.wbsTemplate.findUnique({
          where: { id },
          include: { projectType: { select: { name: true } }, projectCategory: { select: { name: true } } },
        }),
        prisma.taskTemplate.findMany({ where: { companyId: COMPANY_ID }, orderBy: [{ sortOrder: "asc" }, { id: "asc" }] }),
      ]);
      if (!template) throw new ServiceError(404, "WBS template not found");
      return { template, items: taskTemplates };
    }
    if (kind === "cbs") {
      const [template, cbsItems] = await Promise.all([
        prisma.cbsTemplate.findUnique({
          where: { id },
          include: { projectType: { select: { name: true } }, projectCategory: { select: { name: true } } },
        }),
        prisma.costBreakdownItem.findMany({ where: { companyId: COMPANY_ID }, orderBy: [{ sortOrder: "asc" }, { id: "asc" }] }),
      ]);
      if (!template) throw new ServiceError(404, "CBS template not found");
      return { template, items: cbsItems };
    }
    if (kind === "estimate") {
      const [template, parameters, cbsItems] = await Promise.all([
        prisma.estimateTemplate.findUnique({
          where: { id },
          include: {
            projectType: { select: { name: true } },
            projectCategory: { select: { name: true } },
            cbsTemplate: { select: { name: true } },
            wbsTemplate: { select: { name: true } },
          },
        }),
        prisma.projectParameter.findMany({ where: { companyId: COMPANY_ID }, orderBy: [{ sortOrder: "asc" }, { id: "asc" }] }),
        prisma.costBreakdownItem.findMany({ where: { companyId: COMPANY_ID, isGroup: false }, take: 50, orderBy: [{ sortOrder: "asc" }, { id: "asc" }] }),
      ]);
      if (!template) throw new ServiceError(404, "Estimate template not found");
      return { template, parameters, items: cbsItems };
    }
    const template = await prisma.itpTemplate.findUnique({
      where: { id },
      include: { projectType: { select: { name: true } }, projectCategory: { select: { name: true } } },
    });
    if (!template) throw new ServiceError(404, "ITP template not found");
    return { template, items: [] };
  },

  async createBuilding(user: SessionUser, dto: CreateBuildingDto) {
    if (!dto.name.trim()) throw new ServiceError(400, "Building name is required");
    const count = await prisma.building.count();
    const code = `BLD-${String(count + 1).padStart(4, "0")}`;
    const row = await prisma.building.create({
      data: {
        companyId: COMPANY_ID,
        code,
        name: dto.name.trim(),
        buildingType: dto.buildingType || "residential",
        status: dto.status || "under_construction",
        projectId: dto.projectId ?? null,
        landParcelId: dto.landParcelId ?? null,
        ownerName: dto.ownerName ?? null,
        developerName: dto.developerName ?? null,
        description: dto.description ?? null,
        isActive: dto.isActive ?? true,
        location: dto.location ?? null,
        city: dto.city ?? null,
        district: dto.district ?? null,
        state: dto.state ?? null,
        postalCode: dto.postalCode ?? null,
        country: dto.country || "BD",
        latitude: dto.latitude ?? null,
        longitude: dto.longitude ?? null,
        floorsAbove: dto.floorsAbove ?? 0,
        floorsBelow: dto.floorsBelow ?? 0,
        totalUnits: dto.totalUnits ?? 0,
        landArea: dto.landArea ?? null,
        builtArea: dto.builtArea ?? null,
        lifts: dto.lifts ?? 0,
        parkingSpaces: dto.parkingSpaces ?? 0,
        hasGenerator: dto.hasGenerator ?? false,
        hasSecurity: dto.hasSecurity ?? false,
        hasFireSafety: dto.hasFireSafety ?? false,
        amenities: dto.amenities ?? null,
        constructionStartDate: dto.constructionStartDate ?? null,
        completionDate: dto.completionDate ?? null,
        handoverDate: dto.handoverDate ?? null,
        occupancyDate: dto.occupancyDate ?? null,
        constructionCost: dto.constructionCost ?? null,
        currentValue: dto.currentValue ?? null,
        source: "Manual",
        createdBy: user.name,
      },
    });
    await recordAudit(user.name, "created", row.name, "Building", [], user.id);
    return row;
  },

  async updateBuilding(user: SessionUser, id: number, dto: UpdateBuildingDto) {
    const existing = await prisma.building.findUnique({ where: { id } });
    if (!existing) throw new ServiceError(404, "Building not found");
    const row = await prisma.building.update({ where: { id }, data: dto });
    await recordAudit(user.name, "updated", row.name, "Building", [], user.id);
    return row;
  },

  async deleteBuilding(user: SessionUser, id: number) {
    const existing = await prisma.building.findUnique({ where: { id } });
    if (!existing) throw new ServiceError(404, "Building not found");
    await prisma.building.delete({ where: { id } });
    await recordAudit(user.name, "deleted", existing.name, "Building", [], user.id);
    return { ok: true };
  },

  // ---------------- WBS / CBS / Estimate / ITP Templates ----------------
  async getTemplateOptions() {
    const [types, categories] = await Promise.all([
      prisma.projectType.findMany({ where: { companyId: COMPANY_ID, isActive: true }, orderBy: [{ sortOrder: "asc" }, { id: "asc" }] }),
      prisma.projectCategory.findMany({ where: { companyId: COMPANY_ID, isActive: true }, orderBy: [{ sortOrder: "asc" }, { id: "asc" }] }),
    ]);
    return { types, categories };
  },

  async getWbsTemplatesPageData() {
    const [templates, opts] = await Promise.all([
      prisma.wbsTemplate.findMany({
        where: { companyId: COMPANY_ID },
        include: { projectType: { select: { id: true, name: true } }, projectCategory: { select: { id: true, name: true } } },
        orderBy: { id: "asc" },
      }),
      this.getTemplateOptions(),
    ]);
    return { templates, ...opts };
  },

  async createWbsTemplate(user: SessionUser, dto: CreateBreakdownTemplateDto) {
    if (!dto.name.trim()) throw new ServiceError(400, "Name is required");
    const row = await prisma.wbsTemplate.create({
      data: {
        companyId: COMPANY_ID,
        name: dto.name.trim(),
        description: dto.description ?? null,
        projectTypeId: dto.projectTypeId ?? null,
        projectCategoryId: dto.projectCategoryId ?? null,
        isDefault: dto.isDefault ?? false,
      },
    });
    await recordAudit(user.name, "created", row.name, "WbsTemplate", [], user.id);
    return row;
  },

  async deleteWbsTemplate(user: SessionUser, id: number) {
    const existing = await prisma.wbsTemplate.findUnique({ where: { id } });
    if (!existing) throw new ServiceError(404, "WBS template not found");
    await prisma.wbsTemplate.delete({ where: { id } });
    await recordAudit(user.name, "deleted", existing.name, "WbsTemplate", [], user.id);
    return { ok: true };
  },

  async getCbsTemplatesPageData() {
    const [templates, opts] = await Promise.all([
      prisma.cbsTemplate.findMany({
        where: { companyId: COMPANY_ID },
        include: { projectType: { select: { id: true, name: true } }, projectCategory: { select: { id: true, name: true } } },
        orderBy: { id: "asc" },
      }),
      this.getTemplateOptions(),
    ]);
    return { templates, ...opts };
  },

  async createCbsTemplate(user: SessionUser, dto: CreateBreakdownTemplateDto) {
    if (!dto.name.trim()) throw new ServiceError(400, "Name is required");
    const row = await prisma.cbsTemplate.create({
      data: {
        companyId: COMPANY_ID,
        name: dto.name.trim(),
        description: dto.description ?? null,
        projectTypeId: dto.projectTypeId ?? null,
        projectCategoryId: dto.projectCategoryId ?? null,
        isDefault: dto.isDefault ?? false,
      },
    });
    await recordAudit(user.name, "created", row.name, "CbsTemplate", [], user.id);
    return row;
  },

  async deleteCbsTemplate(user: SessionUser, id: number) {
    const existing = await prisma.cbsTemplate.findUnique({ where: { id } });
    if (!existing) throw new ServiceError(404, "CBS template not found");
    await prisma.cbsTemplate.delete({ where: { id } });
    await recordAudit(user.name, "deleted", existing.name, "CbsTemplate", [], user.id);
    return { ok: true };
  },

  async getEstimateTemplatesPageData() {
    const [templates, cbsTemplates, wbsTemplates, opts] = await Promise.all([
      prisma.estimateTemplate.findMany({
        where: { companyId: COMPANY_ID },
        include: {
          projectType: { select: { id: true, name: true } },
          projectCategory: { select: { id: true, name: true } },
          cbsTemplate: { select: { id: true, name: true } },
          wbsTemplate: { select: { id: true, name: true } },
        },
        orderBy: { id: "asc" },
      }),
      prisma.cbsTemplate.findMany({ where: { companyId: COMPANY_ID }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
      prisma.wbsTemplate.findMany({ where: { companyId: COMPANY_ID }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
      this.getTemplateOptions(),
    ]);
    return { templates, cbsTemplates, wbsTemplates, ...opts };
  },

  async createEstimateTemplate(user: SessionUser, dto: CreateEstimateTemplateDto) {
    if (!dto.name.trim()) throw new ServiceError(400, "Name is required");
    const row = await prisma.estimateTemplate.create({
      data: {
        companyId: COMPANY_ID,
        name: dto.name.trim(),
        estimateStage: dto.estimateStage || "control_budget",
        cbsTemplateId: dto.cbsTemplateId ?? null,
        wbsTemplateId: dto.wbsTemplateId ?? null,
        currency: dto.currency || "BDT",
        rateDate: dto.rateDate ?? null,
        projectTypeId: dto.projectTypeId ?? null,
        projectCategoryId: dto.projectCategoryId ?? null,
        isDefault: dto.isDefault ?? false,
      },
    });
    await recordAudit(user.name, "created", row.name, "EstimateTemplate", [], user.id);
    return row;
  },

  async deleteEstimateTemplate(user: SessionUser, id: number) {
    const existing = await prisma.estimateTemplate.findUnique({ where: { id } });
    if (!existing) throw new ServiceError(404, "Estimate template not found");
    await prisma.estimateTemplate.delete({ where: { id } });
    await recordAudit(user.name, "deleted", existing.name, "EstimateTemplate", [], user.id);
    return { ok: true };
  },

  async getItpTemplatesPageData() {
    const [templates, opts] = await Promise.all([
      prisma.itpTemplate.findMany({
        where: { companyId: COMPANY_ID },
        include: { projectType: { select: { id: true, name: true } }, projectCategory: { select: { id: true, name: true } } },
        orderBy: { id: "asc" },
      }),
      this.getTemplateOptions(),
    ]);
    return { templates, ...opts };
  },

  async createItpTemplate(user: SessionUser, dto: CreateBreakdownTemplateDto) {
    if (!dto.name.trim()) throw new ServiceError(400, "Name is required");
    const row = await prisma.itpTemplate.create({
      data: {
        companyId: COMPANY_ID,
        name: dto.name.trim(),
        description: dto.description ?? null,
        projectTypeId: dto.projectTypeId ?? null,
        projectCategoryId: dto.projectCategoryId ?? null,
        isDefault: dto.isDefault ?? false,
      },
    });
    await recordAudit(user.name, "created", row.name, "ItpTemplate", [], user.id);
    return row;
  },

  async deleteItpTemplate(user: SessionUser, id: number) {
    const existing = await prisma.itpTemplate.findUnique({ where: { id } });
    if (!existing) throw new ServiceError(404, "ITP template not found");
    await prisma.itpTemplate.delete({ where: { id } });
    await recordAudit(user.name, "deleted", existing.name, "ItpTemplate", [], user.id);
    return { ok: true };
  },

  // ---------------- Task Templates ----------------
  async getTaskTemplatesPageData() {
    const rows = await prisma.taskTemplate.findMany({
      where: { companyId: COMPANY_ID },
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    });
    return { rows };
  },

  async createTaskTemplate(user: SessionUser, dto: CreateTaskTemplateDto) {
    if (!dto.name.trim()) throw new ServiceError(400, "Name is required");
    const row = await prisma.taskTemplate.create({
      data: {
        companyId: COMPANY_ID,
        parentId: dto.parentId ?? null,
        name: dto.name.trim(),
        category: dto.category ?? null,
        estimatedCost: dto.estimatedCost ?? 0,
        description: dto.description ?? null,
        isDefault: dto.isDefault ?? false,
        isActive: dto.isActive ?? true,
      },
    });
    await recordAudit(user.name, "created", row.name, "TaskTemplate", [], user.id);
    return row;
  },

  async updateTaskTemplate(user: SessionUser, id: number, dto: UpdateTaskTemplateDto) {
    const existing = await prisma.taskTemplate.findUnique({ where: { id } });
    if (!existing) throw new ServiceError(404, "Task template not found");
    const row = await prisma.taskTemplate.update({ where: { id }, data: dto });
    await recordAudit(user.name, "updated", row.name, "TaskTemplate", [], user.id);
    return row;
  },

  async deleteTaskTemplate(user: SessionUser, id: number) {
    const existing = await prisma.taskTemplate.findUnique({ where: { id } });
    if (!existing) throw new ServiceError(404, "Task template not found");
    await prisma.taskTemplate.delete({ where: { id } });
    await recordAudit(user.name, "deleted", existing.name, "TaskTemplate", [], user.id);
    return { ok: true };
  },

  // ---------------- Project Parameters ----------------
  async getParametersPageData() {
    const [parameters, opts] = await Promise.all([
      prisma.projectParameter.findMany({
        where: { companyId: COMPANY_ID },
        include: { projectType: { select: { id: true, name: true } }, projectCategory: { select: { id: true, name: true } } },
        orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
      }),
      this.getTemplateOptions(),
    ]);
    return { parameters, ...opts };
  },

  async createParameter(user: SessionUser, dto: CreateProjectParameterDto) {
    if (!dto.key.trim() || !dto.label.trim()) throw new ServiceError(400, "Key and label are required");
    const row = await prisma.projectParameter.create({
      data: {
        companyId: COMPANY_ID,
        key: dto.key.trim(),
        label: dto.label.trim(),
        helpText: dto.helpText ?? null,
        group: dto.group || "GENERAL",
        unit: dto.unit ?? null,
        dataType: dto.dataType || "decimal",
        minValue: dto.minValue ?? null,
        maxValue: dto.maxValue ?? null,
        defaultValue: dto.defaultValue ?? null,
        projectTypeId: dto.projectTypeId ?? null,
        projectCategoryId: dto.projectCategoryId ?? null,
        appliesTo: "All project types",
        isRequired: dto.isRequired ?? false,
        isActive: dto.isActive ?? true,
      },
    });
    await recordAudit(user.name, "created", row.key, "ProjectParameter", [], user.id);
    return row;
  },

  async updateParameter(user: SessionUser, id: number, dto: UpdateProjectParameterDto) {
    const existing = await prisma.projectParameter.findUnique({ where: { id } });
    if (!existing) throw new ServiceError(404, "Parameter not found");
    const row = await prisma.projectParameter.update({ where: { id }, data: dto });
    await recordAudit(user.name, "updated", row.key, "ProjectParameter", [], user.id);
    return row;
  },

  async deleteParameter(user: SessionUser, id: number) {
    const existing = await prisma.projectParameter.findUnique({ where: { id } });
    if (!existing) throw new ServiceError(404, "Parameter not found");
    await prisma.projectParameter.delete({ where: { id } });
    await recordAudit(user.name, "deleted", existing.key, "ProjectParameter", [], user.id);
    return { ok: true };
  },

  // ---------------- Cost Breakdown Structure ----------------
  async getCostBreakdownPageData(search?: string, costType?: string, status?: string) {
    const where: Record<string, unknown> = { companyId: COMPANY_ID };
    if (search) {
      where.OR = [{ code: { contains: search } }, { name: { contains: search } }];
    }
    if (costType) where.costType = costType;
    if (status === "active") where.isActive = true;
    if (status === "inactive") where.isActive = false;

    const [items, allItems] = await Promise.all([
      prisma.costBreakdownItem.findMany({
        where,
        orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
      }),
      prisma.costBreakdownItem.findMany({ where: { companyId: COMPANY_ID }, select: { isGroup: true, isActive: true, accountLabel: true } }),
    ]);

    const stats = {
      total: allItems.length,
      groups: allItems.filter((i) => i.isGroup).length,
      postable: allItems.filter((i) => !i.isGroup && i.isActive).length,
      unmapped: allItems.filter((i) => !i.accountLabel).length,
    };

    return { items, stats };
  },

  async createCostBreakdownItem(user: SessionUser, dto: CreateCostBreakdownItemDto) {
    if (!dto.code.trim() || !dto.name.trim()) throw new ServiceError(400, "Code and name are required");
    const row = await prisma.costBreakdownItem.create({
      data: {
        companyId: COMPANY_ID,
        parentId: dto.parentId ?? null,
        code: dto.code.trim(),
        name: dto.name.trim(),
        costType: dto.costType || "direct",
        accountLabel: dto.accountLabel ?? null,
        description: dto.description ?? null,
        isGroup: dto.isGroup ?? false,
        isActive: dto.isActive ?? true,
      },
    });
    await recordAudit(user.name, "created", `${row.code} ${row.name}`, "CostBreakdownItem", [], user.id);
    return row;
  },

  async updateCostBreakdownItem(user: SessionUser, id: number, dto: UpdateCostBreakdownItemDto) {
    const existing = await prisma.costBreakdownItem.findUnique({ where: { id } });
    if (!existing) throw new ServiceError(404, "CBS item not found");
    const row = await prisma.costBreakdownItem.update({ where: { id }, data: dto });
    await recordAudit(user.name, "updated", `${row.code} ${row.name}`, "CostBreakdownItem", [], user.id);
    return row;
  },

  async deleteCostBreakdownItem(user: SessionUser, id: number) {
    const existing = await prisma.costBreakdownItem.findUnique({ where: { id } });
    if (!existing) throw new ServiceError(404, "CBS item not found");
    await prisma.costBreakdownItem.delete({ where: { id } });
    await recordAudit(user.name, "deleted", `${existing.code} ${existing.name}`, "CostBreakdownItem", [], user.id);
    return { ok: true };
  },

  // ---------------- Inspection Checklists ----------------
  async getInspectionChecklistsPageData(q?: string) {
    const where: Record<string, unknown> = { companyId: COMPANY_ID };
    if (q) where.name = { contains: q };
    const checklists = await prisma.inspectionChecklist.findMany({ where, orderBy: { id: "desc" } });
    return { checklists };
  },

  async createInspectionChecklist(user: SessionUser, dto: CreateInspectionChecklistDto) {
    if (!dto.name.trim()) throw new ServiceError(400, "Checklist name is required");
    const row = await prisma.inspectionChecklist.create({
      data: {
        companyId: COMPANY_ID,
        name: dto.name.trim(),
        inspectionType: dto.inspectionType ?? null,
        description: dto.description ?? null,
        itemsJson: JSON.stringify(dto.items ?? []),
        isActive: dto.isActive ?? true,
      },
    });
    await recordAudit(user.name, "created", row.name, "InspectionChecklist", [], user.id);
    return row;
  },

  async updateInspectionChecklist(user: SessionUser, id: number, dto: UpdateInspectionChecklistDto) {
    const existing = await prisma.inspectionChecklist.findUnique({ where: { id } });
    if (!existing) throw new ServiceError(404, "Checklist not found");
    const row = await prisma.inspectionChecklist.update({
      where: { id },
      data: {
        name: dto.name,
        inspectionType: dto.inspectionType,
        description: dto.description,
        itemsJson: dto.items ? JSON.stringify(dto.items) : undefined,
        isActive: dto.isActive,
      },
    });
    await recordAudit(user.name, "updated", row.name, "InspectionChecklist", [], user.id);
    return row;
  },

  async deleteInspectionChecklist(user: SessionUser, id: number) {
    const existing = await prisma.inspectionChecklist.findUnique({ where: { id } });
    if (!existing) throw new ServiceError(404, "Checklist not found");
    await prisma.inspectionChecklist.delete({ where: { id } });
    await recordAudit(user.name, "deleted", existing.name, "InspectionChecklist", [], user.id);
    return { ok: true };
  },
};
