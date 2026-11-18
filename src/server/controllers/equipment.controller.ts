import { optNum, optStr, reqStr } from "@/server/http/api-handler";
import { EquipmentService } from "@/server/services/equipment.service";
import type { SessionUser } from "@/lib/auth";

type RawBody = Record<string, unknown>;

export const EquipmentController = {
  createCategory(user: SessionUser, b: RawBody) {
    return EquipmentService.createCategory(user, {
      code: reqStr(b.code),
      name: reqStr(b.name),
      equipmentClass: optStr(b.equipment_class ?? b.equipmentClass) ?? "heavy_plant",
      requiresOperatorCertification: Boolean(b.requires_operator_certification),
      defaultHourlyRate: optNum(b.default_hourly_rate) ?? 0,
      defaultDailyRate: optNum(b.default_daily_rate) ?? 0,
      defaultRateBasis: optStr(b.default_rate_basis) ?? "hourly",
      usefulLifeYears: optNum(b.useful_life_years) ?? 10,
      serviceIntervalHours: optNum(b.service_interval_hours) ?? 250,
      salvagePercent: optNum(b.salvage_percent) ?? 10,
      description: optStr(b.description),
      isActive: b.is_active === undefined ? true : Boolean(b.is_active),
    });
  },
  createEquipment(user: SessionUser, b: RawBody) {
    return EquipmentService.createEquipment(user, {
      code: optStr(b.code) ?? undefined,
      name: reqStr(b.name),
      equipmentClass: optStr(b.equipment_class ?? b.equipmentClass) ?? "heavy_plant",
      categoryId: optNum(b.equipment_category_id ?? b.categoryId),
      make: optStr(b.make),
      model: optStr(b.model),
      yearOfManufacture: optNum(b.year_of_manufacture),
      serialNo: optStr(b.serial_no),
      fuelType: optStr(b.fuel_type) ?? "diesel",
      registrationNo: optStr(b.registration_no),
      ownershipType: optStr(b.ownership_type) ?? "owned",
      acquiredOn: optStr(b.acquired_on),
      acquisitionCost: optNum(b.acquisition_cost) ?? 0,
      rateBasis: optStr(b.rate_basis) ?? "hourly",
      internalHourlyRate: optNum(b.internal_hourly_rate) ?? 0,
      internalDailyRate: optNum(b.internal_daily_rate) ?? 0,
      meterType: optStr(b.meter_type) ?? "hours",
      currentHourMeter: optNum(b.current_hour_meter) ?? 0,
      currentOdometer: optNum(b.current_odometer) ?? 0,
      custodianName: optStr(b.custodian_name),
      operatorName: optStr(b.operator_name),
      currentLocation: optStr(b.current_location),
      projectId: optNum(b.project_id),
      status: optStr(b.status) ?? "available",
      remarks: optStr(b.remarks),
    });
  },
  updateEquipment(user: SessionUser, id: number, b: RawBody) {
    return EquipmentService.updateEquipment(user, id, {
      name: b.name !== undefined ? reqStr(b.name) : undefined,
      equipmentClass: optStr(b.equipment_class ?? b.equipmentClass) ?? undefined,
      categoryId: optNum(b.equipment_category_id ?? b.categoryId),
      make: optStr(b.make),
      model: optStr(b.model),
      ownershipType: optStr(b.ownership_type) ?? undefined,
      internalHourlyRate: optNum(b.internal_hourly_rate) ?? undefined,
      internalDailyRate: optNum(b.internal_daily_rate) ?? undefined,
      currentLocation: optStr(b.current_location),
      status: optStr(b.status) ?? undefined,
      remarks: optStr(b.remarks),
    });
  },
};
