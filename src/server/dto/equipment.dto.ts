// Equipment & Fleet (Tier 3C) DTOs

export interface CreateEquipmentCategoryDto {
  code: string;
  name: string;
  equipmentClass?: string;
  requiresOperatorCertification?: boolean;
  defaultHourlyRate?: number;
  defaultDailyRate?: number;
  defaultRateBasis?: string;
  usefulLifeYears?: number;
  serviceIntervalHours?: number;
  salvagePercent?: number;
  description?: string | null;
  isActive?: boolean;
}

export interface CreateEquipmentDto {
  code?: string;
  name: string;
  equipmentClass?: string;
  categoryId?: number | null;
  make?: string | null;
  model?: string | null;
  yearOfManufacture?: number | null;
  serialNo?: string | null;
  fuelType?: string;
  registrationNo?: string | null;
  ownershipType?: string;
  acquiredOn?: string | null;
  acquisitionCost?: number;
  rateBasis?: string;
  internalHourlyRate?: number;
  internalDailyRate?: number;
  meterType?: string;
  currentHourMeter?: number;
  currentOdometer?: number;
  custodianName?: string | null;
  operatorName?: string | null;
  currentLocation?: string | null;
  projectId?: number | null;
  status?: string;
  remarks?: string | null;
}
