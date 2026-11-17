// Projects & Buildings (Tier 2B) DTOs

export interface CreateProjectTypeDto {
  name: string;
  description?: string | null;
  icon?: string;
  pill?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface UpdateProjectTypeDto {
  name?: string;
  description?: string | null;
  icon?: string;
  pill?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface CreateProjectCategoryDto {
  name: string;
  projectTypeId?: number | null;
  description?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}

export interface UpdateProjectCategoryDto {
  name?: string;
  projectTypeId?: number | null;
  description?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}

export interface CreateProjectDto {
  name: string;
  projectTypeId?: number | null;
  projectCategoryId?: number | null;
  managerId?: number | null;
  managerName?: string | null;
  clientName?: string | null;
  priority?: string;
  status?: string;
  startDate?: string | null;
  expectedCompletionDate?: string | null;
  actualCompletionDate?: string | null;
  progress?: number;
  description?: string | null;
  currency?: string;
  location?: string;
  city?: string | null;
  country?: string;
  latitude?: number | null;
  longitude?: number | null;
  landParcelIds?: number[];
  budget?: number;
}

export interface UpdateProjectDto {
  name?: string;
  projectTypeId?: number | null;
  projectCategoryId?: number | null;
  managerId?: number | null;
  managerName?: string | null;
  clientName?: string | null;
  priority?: string;
  status?: string;
  startDate?: string | null;
  expectedCompletionDate?: string | null;
  actualCompletionDate?: string | null;
  progress?: number;
  description?: string | null;
  currency?: string;
  location?: string;
  city?: string | null;
  country?: string;
  latitude?: number | null;
  longitude?: number | null;
  budget?: number;
}

export interface CreateBuildingDto {
  name: string;
  buildingType?: string;
  status?: string;
  projectId?: number | null;
  landParcelId?: number | null;
  ownerName?: string | null;
  developerName?: string | null;
  description?: string | null;
  isActive?: boolean;
  location?: string | null;
  city?: string | null;
  district?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  floorsAbove?: number;
  floorsBelow?: number;
  totalUnits?: number;
  landArea?: number | null;
  builtArea?: number | null;
  lifts?: number;
  parkingSpaces?: number;
  hasGenerator?: boolean;
  hasSecurity?: boolean;
  hasFireSafety?: boolean;
  amenities?: string | null;
  constructionStartDate?: string | null;
  completionDate?: string | null;
  handoverDate?: string | null;
  occupancyDate?: string | null;
  constructionCost?: number | null;
  currentValue?: number | null;
}

export type UpdateBuildingDto = Partial<CreateBuildingDto>;

export interface CreateProjectTaskDto {
  parentId?: number | null;
  title: string;
  category?: string | null;
  status?: string;
  assigneeNames?: string | null;
  startDate?: string | null;
  dueDate?: string | null;
  color?: string | null;
  description?: string | null;
  estimatedCost?: number;
}

export interface CreateProjectTeamDto {
  name: string;
  departmentName?: string | null;
  leadName?: string | null;
  type?: string;
  memberNames?: string | null;
}

export interface CreateProjectCostDto {
  category: string;
  costDate: string;
  amount: number;
  notes?: string | null;
}

export interface CreateProjectConsumptionDto {
  buildingId?: number | null;
  projectTaskId?: number | null;
  materialName: string;
  costCode?: string | null;
  qtyUsed: number;
  wastage?: number;
  uom?: string;
  unitCost?: number;
  consumptionDate?: string | null;
  notes?: string | null;
}

export interface CreateBreakdownTemplateDto {
  name: string;
  description?: string | null;
  projectTypeId?: number | null;
  projectCategoryId?: number | null;
  isDefault?: boolean;
}

export interface CreateEstimateTemplateDto {
  name: string;
  estimateStage: string;
  cbsTemplateId?: number | null;
  wbsTemplateId?: number | null;
  currency?: string;
  rateDate?: string | null;
  projectTypeId?: number | null;
  projectCategoryId?: number | null;
  isDefault?: boolean;
}

export interface CreateTaskTemplateDto {
  parentId?: number | null;
  name: string;
  category?: string | null;
  estimatedCost?: number;
  description?: string | null;
  isDefault?: boolean;
  isActive?: boolean;
}

export interface UpdateTaskTemplateDto extends Partial<CreateTaskTemplateDto> {}

export interface CreateProjectParameterDto {
  key: string;
  label: string;
  helpText?: string | null;
  group?: string;
  unit?: string | null;
  dataType?: string;
  minValue?: number | null;
  maxValue?: number | null;
  defaultValue?: number | null;
  projectTypeId?: number | null;
  projectCategoryId?: number | null;
  isRequired?: boolean;
  isActive?: boolean;
}

export interface UpdateProjectParameterDto extends Partial<CreateProjectParameterDto> {}

export interface CreateCostBreakdownItemDto {
  parentId?: number | null;
  code: string;
  name: string;
  costType?: string;
  accountLabel?: string | null;
  description?: string | null;
  isGroup?: boolean;
  isActive?: boolean;
}

export interface UpdateCostBreakdownItemDto extends Partial<CreateCostBreakdownItemDto> {}

export interface CreateInspectionChecklistDto {
  name: string;
  inspectionType?: string | null;
  description?: string | null;
  items?: string[];
  isActive?: boolean;
}

export interface UpdateInspectionChecklistDto extends Partial<CreateInspectionChecklistDto> {}
