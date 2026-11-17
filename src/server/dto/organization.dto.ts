export interface CreateCompanyDto {
  code: string;
  name: string;
  legalName: string | null;
  incorporationDate: string | null;
  registrationNumber: string | null;
  tin: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string;
  currency: string;
  timezone: string;
  fyStartMonth: number;
  fyStartDay: number;
  isDefault: boolean;
  isActive: boolean;
}

export interface UpdateCompanyDto {
  isActive?: boolean;
  isDefault?: boolean;
}

export interface CreateBranchDto {
  companyId?: number | null;
  code: string;
  name: string;
  type: string;
  openedOn: string | null;
  phone: string | null;
  email: string | null;
  managerName: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string;
  isActive: boolean;
}

export interface UpdateBranchDto {
  isActive?: boolean;
}

export interface BulkCreateDepartmentItemDto {
  code: string;
  name: string;
  branchId: number | null;
  parentId: number | null;
  headName: string | null;
  email?: string | null;
}

export interface CreateDepartmentDto {
  companyId?: number | null;
  code: string;
  name: string;
  branchId: number | null;
  parentId: number | null;
  headName: string | null;
  email: string | null;
  phone: string | null;
  description: string | null;
  isActive: boolean;
}

export type CreateDepartmentInput =
  | { items: BulkCreateDepartmentItemDto[]; companyId?: number | null }
  | CreateDepartmentDto;

export interface UpdateDepartmentDto {
  isActive?: boolean;
}

export interface BulkCreateDesignationItemDto {
  code: string;
  name: string;
  departmentId: number | null;
  employmentType: string;
  grade: string | null;
  isManagerial: boolean;
  isActive?: boolean;
}

export interface CreateDesignationDto {
  code: string;
  name: string;
  departmentId: number | null;
  employmentType: string;
  grade: string | null;
  description: string | null;
  isManagerial: boolean;
  isActive: boolean;
}

export type CreateDesignationInput =
  | { items: BulkCreateDesignationItemDto[] }
  | CreateDesignationDto;

export interface UpdateDesignationDto {
  isActive?: boolean;
}

export interface CreateFiscalYearDto {
  companyId?: number | null;
  code: string;
  name: string;
  startDate: string;
  endDate: string;
  periodCadence: string;
  hasAdjustmentPeriod: boolean;
  isCurrent: boolean;
  status: string;
  notes: string | null;
}

export interface UpdateFiscalYearDto {
  status?: string;
  isCurrent?: boolean;
}

export interface CreateHolidayDto {
  companyId?: number | null;
  name: string;
  type: string;
  startDate: string;
  endDate: string;
  color: string;
  description: string | null;
  appliesTo: string;
  isRecurring: boolean;
  isPaid: boolean;
  isActive: boolean;
}

export interface UpdateHolidayDto {
  isActive?: boolean;
}

export interface CreateShiftDto {
  companyId?: number | null;
  code: string;
  name: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  graceInMinutes: number;
  graceOutMinutes: number;
  fullDayMinutes: number;
  halfDayMinutes: number;
  workingDays: string;
  appliesTo: string;
  description: string | null;
  isDefault: boolean;
  isActive: boolean;
}

export interface UpdateShiftDto {
  isActive?: boolean;
  isDefault?: boolean;
}
