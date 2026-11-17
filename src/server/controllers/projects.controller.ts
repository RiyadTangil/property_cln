import { optNum, optStr, reqStr } from "@/server/http/api-handler";
import { ProjectsService } from "@/server/services/projects.service";
import type { SessionUser } from "@/lib/auth";

type RawBody = Record<string, unknown>;

export const ProjectsController = {
  // ---------------- Types ----------------
  createType(user: SessionUser, b: RawBody) {
    return ProjectsService.createType(user, {
      name: reqStr(b.name),
      description: optStr(b.description),
      icon: optStr(b.icon) ?? "fa-solid fa-city",
      pill: optStr(b.pill) ?? "is-neutral",
      sortOrder: optNum(b.sort_order ?? b.sortOrder) ?? 10,
      isActive: b.is_active === undefined && b.isActive === undefined ? true : Boolean(b.is_active ?? b.isActive),
    });
  },
  updateType(user: SessionUser, id: number, b: RawBody) {
    return ProjectsService.updateType(user, id, {
      name: b.name !== undefined ? reqStr(b.name) : undefined,
      description: b.description !== undefined ? optStr(b.description) : undefined,
      icon: optStr(b.icon) ?? undefined,
      pill: optStr(b.pill) ?? undefined,
      sortOrder: optNum(b.sort_order ?? b.sortOrder) ?? undefined,
      isActive: typeof (b.is_active ?? b.isActive) === "boolean" ? Boolean(b.is_active ?? b.isActive) : undefined,
    });
  },
  deleteType(user: SessionUser, id: number) {
    return ProjectsService.deleteType(user, id);
  },

  // ---------------- Categories ----------------
  createCategory(user: SessionUser, b: RawBody) {
    return ProjectsService.createCategory(user, {
      name: reqStr(b.name),
      projectTypeId: optNum(b.project_type_id ?? b.projectTypeId),
      description: optStr(b.description),
      sortOrder: optNum(b.sort_order ?? b.sortOrder) ?? 10,
      isActive: b.is_active === undefined && b.isActive === undefined ? true : Boolean(b.is_active ?? b.isActive),
    });
  },
  updateCategory(user: SessionUser, id: number, b: RawBody) {
    return ProjectsService.updateCategory(user, id, {
      name: b.name !== undefined ? reqStr(b.name) : undefined,
      projectTypeId: b.project_type_id !== undefined || b.projectTypeId !== undefined ? optNum(b.project_type_id ?? b.projectTypeId) : undefined,
      description: b.description !== undefined ? optStr(b.description) : undefined,
      sortOrder: optNum(b.sort_order ?? b.sortOrder) ?? undefined,
      isActive: typeof (b.is_active ?? b.isActive) === "boolean" ? Boolean(b.is_active ?? b.isActive) : undefined,
    });
  },
  deleteCategory(user: SessionUser, id: number) {
    return ProjectsService.deleteCategory(user, id);
  },

  // ---------------- Projects ----------------
  createProject(user: SessionUser, b: RawBody) {
    const rawParcels = b.land_parcel_ids ?? b.landParcelIds;
    const landParcelIds = Array.isArray(rawParcels) ? rawParcels.map(Number).filter(Boolean) : [];
    return ProjectsService.createProject(user, {
      name: reqStr(b.name),
      projectTypeId: optNum(b.project_type_id ?? b.projectTypeId),
      projectCategoryId: optNum(b.project_category_id ?? b.projectCategoryId),
      managerId: optNum(b.manager_id ?? b.managerId),
      managerName: optStr(b.manager_name ?? b.managerName),
      clientName: optStr(b.client_name ?? b.clientName),
      priority: optStr(b.priority) ?? "medium",
      status: optStr(b.status) ?? "planning",
      startDate: optStr(b.start_date ?? b.startDate),
      expectedCompletionDate: optStr(b.expected_completion_date ?? b.expectedCompletionDate),
      actualCompletionDate: optStr(b.actual_completion_date ?? b.actualCompletionDate),
      progress: optNum(b.progress) ?? 0,
      description: optStr(b.description),
      currency: optStr(b.currency) ?? "BDT",
      location: optStr(b.location) ?? "Dhaka",
      city: optStr(b.city),
      country: optStr(b.country) ?? "BD",
      latitude: optNum(b.latitude),
      longitude: optNum(b.longitude),
      landParcelIds,
      budget: optNum(b.budget) ?? 0,
    });
  },
  updateProject(user: SessionUser, id: number, b: RawBody) {
    return ProjectsService.updateProject(user, id, {
      name: b.name !== undefined ? reqStr(b.name) : undefined,
      projectTypeId: b.project_type_id !== undefined || b.projectTypeId !== undefined ? optNum(b.project_type_id ?? b.projectTypeId) : undefined,
      projectCategoryId: b.project_category_id !== undefined || b.projectCategoryId !== undefined ? optNum(b.project_category_id ?? b.projectCategoryId) : undefined,
      managerId: optNum(b.manager_id ?? b.managerId) ?? undefined,
      managerName: b.manager_name !== undefined || b.managerName !== undefined ? optStr(b.manager_name ?? b.managerName) : undefined,
      clientName: b.client_name !== undefined || b.clientName !== undefined ? optStr(b.client_name ?? b.clientName) : undefined,
      priority: optStr(b.priority) ?? undefined,
      status: optStr(b.status) ?? undefined,
      startDate: b.start_date !== undefined || b.startDate !== undefined ? optStr(b.start_date ?? b.startDate) : undefined,
      expectedCompletionDate: b.expected_completion_date !== undefined || b.expectedCompletionDate !== undefined ? optStr(b.expected_completion_date ?? b.expectedCompletionDate) : undefined,
      actualCompletionDate: b.actual_completion_date !== undefined || b.actualCompletionDate !== undefined ? optStr(b.actual_completion_date ?? b.actualCompletionDate) : undefined,
      progress: optNum(b.progress) ?? undefined,
      description: b.description !== undefined ? optStr(b.description) : undefined,
      currency: optStr(b.currency) ?? undefined,
      location: optStr(b.location) ?? undefined,
      city: optStr(b.city) ?? undefined,
      country: optStr(b.country) ?? undefined,
      latitude: optNum(b.latitude) ?? undefined,
      longitude: optNum(b.longitude) ?? undefined,
      budget: optNum(b.budget) ?? undefined,
    });
  },
  deleteProject(user: SessionUser, id: number) {
    return ProjectsService.deleteProject(user, id);
  },

  // ---------------- Buildings ----------------
  createBuilding(user: SessionUser, b: RawBody) {
    return ProjectsService.createBuilding(user, {
      name: reqStr(b.name),
      buildingType: optStr(b.building_type ?? b.buildingType) ?? "residential",
      status: optStr(b.status) ?? "under_construction",
      projectId: optNum(b.project_id ?? b.projectId),
      landParcelId: optNum(b.land_parcel_id ?? b.landParcelId),
      ownerName: optStr(b.owner_name ?? b.ownerName),
      developerName: optStr(b.developer_name ?? b.developerName),
      description: optStr(b.description),
      isActive: b.is_active === undefined && b.isActive === undefined ? true : Boolean(b.is_active ?? b.isActive),
      location: optStr(b.location),
      city: optStr(b.city),
      district: optStr(b.district),
      state: optStr(b.state),
      postalCode: optStr(b.postal_code ?? b.postalCode),
      country: optStr(b.country) ?? "BD",
      latitude: optNum(b.latitude),
      longitude: optNum(b.longitude),
      floorsAbove: optNum(b.floors_above ?? b.floorsAbove) ?? 0,
      floorsBelow: optNum(b.floors_below ?? b.floorsBelow) ?? 0,
      totalUnits: optNum(b.total_units ?? b.totalUnits) ?? 0,
      landArea: optNum(b.land_area ?? b.landArea),
      builtArea: optNum(b.built_area ?? b.builtArea),
      lifts: optNum(b.lifts) ?? 0,
      parkingSpaces: optNum(b.parking_spaces ?? b.parkingSpaces) ?? 0,
      hasGenerator: Boolean(b.has_generator ?? b.hasGenerator),
      hasSecurity: Boolean(b.has_security ?? b.hasSecurity),
      hasFireSafety: Boolean(b.has_fire_safety ?? b.hasFireSafety),
      amenities: optStr(b.amenities),
      constructionStartDate: optStr(b.construction_start_date ?? b.constructionStartDate),
      completionDate: optStr(b.completion_date ?? b.completionDate),
      handoverDate: optStr(b.handover_date ?? b.handoverDate),
      occupancyDate: optStr(b.occupancy_date ?? b.occupancyDate),
      constructionCost: optNum(b.construction_cost ?? b.constructionCost),
      currentValue: optNum(b.current_value ?? b.currentValue),
    });
  },
  updateBuilding(user: SessionUser, id: number, b: RawBody) {
    return ProjectsService.updateBuilding(user, id, {
      name: b.name !== undefined ? reqStr(b.name) : undefined,
      buildingType: optStr(b.building_type ?? b.buildingType) ?? undefined,
      status: optStr(b.status) ?? undefined,
      projectId: optNum(b.project_id ?? b.projectId),
      landParcelId: optNum(b.land_parcel_id ?? b.landParcelId),
      ownerName: optStr(b.owner_name ?? b.ownerName),
      developerName: optStr(b.developer_name ?? b.developerName),
      description: optStr(b.description),
      location: optStr(b.location),
      city: optStr(b.city),
      floorsAbove: optNum(b.floors_above ?? b.floorsAbove) ?? undefined,
      floorsBelow: optNum(b.floors_below ?? b.floorsBelow) ?? undefined,
      totalUnits: optNum(b.total_units ?? b.totalUnits) ?? undefined,
    });
  },
  deleteBuilding(user: SessionUser, id: number) {
    return ProjectsService.deleteBuilding(user, id);
  },

  // ---------------- Templates & Setup ----------------
  createWbsTemplate(user: SessionUser, b: RawBody) {
    return ProjectsService.createWbsTemplate(user, {
      name: reqStr(b.name),
      description: optStr(b.description),
      projectTypeId: optNum(b.project_type_id ?? b.projectTypeId),
      projectCategoryId: optNum(b.project_category_id ?? b.projectCategoryId),
      isDefault: Boolean(b.is_default ?? b.isDefault),
    });
  },
  createCbsTemplate(user: SessionUser, b: RawBody) {
    return ProjectsService.createCbsTemplate(user, {
      name: reqStr(b.name),
      description: optStr(b.description),
      projectTypeId: optNum(b.project_type_id ?? b.projectTypeId),
      projectCategoryId: optNum(b.project_category_id ?? b.projectCategoryId),
      isDefault: Boolean(b.is_default ?? b.isDefault),
    });
  },
  createEstimateTemplate(user: SessionUser, b: RawBody) {
    return ProjectsService.createEstimateTemplate(user, {
      name: reqStr(b.name),
      estimateStage: reqStr(b.estimate_stage ?? b.estimateStage, "control_budget"),
      cbsTemplateId: optNum(b.cbs_template_id ?? b.cbsTemplateId),
      wbsTemplateId: optNum(b.wbs_template_id ?? b.wbsTemplateId),
      currency: optStr(b.currency) ?? "BDT",
      rateDate: optStr(b.rate_date ?? b.rateDate),
      projectTypeId: optNum(b.project_type_id ?? b.projectTypeId),
      projectCategoryId: optNum(b.project_category_id ?? b.projectCategoryId),
      isDefault: Boolean(b.is_default ?? b.isDefault),
    });
  },
  createItpTemplate(user: SessionUser, b: RawBody) {
    return ProjectsService.createItpTemplate(user, {
      name: reqStr(b.name),
      description: optStr(b.description),
      projectTypeId: optNum(b.project_type_id ?? b.projectTypeId),
      projectCategoryId: optNum(b.project_category_id ?? b.projectCategoryId),
      isDefault: Boolean(b.is_default ?? b.isDefault),
    });
  },
  createTaskTemplate(user: SessionUser, b: RawBody) {
    return ProjectsService.createTaskTemplate(user, {
      parentId: optNum(b.parent_id ?? b.parentId),
      name: reqStr(b.name),
      category: optStr(b.category),
      estimatedCost: optNum(b.estimated_cost ?? b.estimatedCost) ?? 0,
      description: optStr(b.description),
      isDefault: Boolean(b.is_default ?? b.isDefault),
      isActive: b.is_active === undefined && b.isActive === undefined ? true : Boolean(b.is_active ?? b.isActive),
    });
  },
  updateTaskTemplate(user: SessionUser, id: number, b: RawBody) {
    return ProjectsService.updateTaskTemplate(user, id, {
      name: b.name !== undefined ? reqStr(b.name) : undefined,
      category: b.category !== undefined ? optStr(b.category) : undefined,
      estimatedCost: b.estimated_cost !== undefined || b.estimatedCost !== undefined ? optNum(b.estimated_cost ?? b.estimatedCost) ?? 0 : undefined,
      description: b.description !== undefined ? optStr(b.description) : undefined,
      isDefault: typeof (b.is_default ?? b.isDefault) === "boolean" ? Boolean(b.is_default ?? b.isDefault) : undefined,
      isActive: typeof (b.is_active ?? b.isActive) === "boolean" ? Boolean(b.is_active ?? b.isActive) : undefined,
    });
  },
  createParameter(user: SessionUser, b: RawBody) {
    return ProjectsService.createParameter(user, {
      key: reqStr(b.key),
      label: reqStr(b.label),
      helpText: optStr(b.help_text ?? b.helpText),
      group: optStr(b.group) ?? "GENERAL",
      unit: optStr(b.unit),
      dataType: optStr(b.data_type ?? b.dataType) ?? "decimal",
      minValue: optNum(b.min_value ?? b.minValue),
      maxValue: optNum(b.max_value ?? b.maxValue),
      defaultValue: optNum(b.default_value ?? b.defaultValue),
      projectTypeId: optNum(b.project_type_id ?? b.projectTypeId),
      projectCategoryId: optNum(b.project_category_id ?? b.projectCategoryId),
      isRequired: Boolean(b.is_required ?? b.isRequired),
      isActive: b.is_active === undefined && b.isActive === undefined ? true : Boolean(b.is_active ?? b.isActive),
    });
  },
  updateParameter(user: SessionUser, id: number, b: RawBody) {
    return ProjectsService.updateParameter(user, id, {
      key: b.key !== undefined ? reqStr(b.key) : undefined,
      label: b.label !== undefined ? reqStr(b.label) : undefined,
      helpText: optStr(b.help_text ?? b.helpText),
      group: optStr(b.group) ?? undefined,
      unit: optStr(b.unit),
      dataType: optStr(b.data_type ?? b.dataType) ?? undefined,
      minValue: optNum(b.min_value ?? b.minValue),
      maxValue: optNum(b.max_value ?? b.maxValue),
      defaultValue: optNum(b.default_value ?? b.defaultValue),
      isRequired: typeof (b.is_required ?? b.isRequired) === "boolean" ? Boolean(b.is_required ?? b.isRequired) : undefined,
      isActive: typeof (b.is_active ?? b.isActive) === "boolean" ? Boolean(b.is_active ?? b.isActive) : undefined,
    });
  },
  createCostBreakdownItem(user: SessionUser, b: RawBody) {
    return ProjectsService.createCostBreakdownItem(user, {
      parentId: optNum(b.parent_id ?? b.parentId),
      code: reqStr(b.code),
      name: reqStr(b.name),
      costType: optStr(b.cost_type ?? b.costType) ?? "direct",
      accountLabel: optStr(b.account_label ?? b.accountLabel),
      description: optStr(b.description),
      isGroup: Boolean(b.is_group ?? b.isGroup),
      isActive: b.is_active === undefined && b.isActive === undefined ? true : Boolean(b.is_active ?? b.isActive),
    });
  },
  updateCostBreakdownItem(user: SessionUser, id: number, b: RawBody) {
    return ProjectsService.updateCostBreakdownItem(user, id, {
      code: b.code !== undefined ? reqStr(b.code) : undefined,
      name: b.name !== undefined ? reqStr(b.name) : undefined,
      costType: optStr(b.cost_type ?? b.costType) ?? undefined,
      accountLabel: b.account_label !== undefined || b.accountLabel !== undefined ? optStr(b.account_label ?? b.accountLabel) : undefined,
      description: b.description !== undefined ? optStr(b.description) : undefined,
      isActive: typeof (b.is_active ?? b.isActive) === "boolean" ? Boolean(b.is_active ?? b.isActive) : undefined,
    });
  },
  createInspectionChecklist(user: SessionUser, b: RawBody) {
    const items = Array.isArray(b.items) ? b.items.map(String).filter(Boolean) : [];
    return ProjectsService.createInspectionChecklist(user, {
      name: reqStr(b.name),
      inspectionType: optStr(b.inspection_type ?? b.inspectionType),
      description: optStr(b.description),
      items,
      isActive: b.is_active === undefined && b.isActive === undefined ? true : Boolean(b.is_active ?? b.isActive),
    });
  },
  updateInspectionChecklist(user: SessionUser, id: number, b: RawBody) {
    const items = Array.isArray(b.items) ? b.items.map(String).filter(Boolean) : undefined;
    return ProjectsService.updateInspectionChecklist(user, id, {
      name: b.name !== undefined ? reqStr(b.name) : undefined,
      inspectionType: optStr(b.inspection_type ?? b.inspectionType),
      description: optStr(b.description),
      items,
      isActive: typeof (b.is_active ?? b.isActive) === "boolean" ? Boolean(b.is_active ?? b.isActive) : undefined,
    });
  },
};
