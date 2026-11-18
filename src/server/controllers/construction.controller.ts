import { optNum, optStr, reqStr } from "@/server/http/api-handler";
import { ConstructionService } from "@/server/services/construction.service";
import type { SessionUser } from "@/lib/auth";

type RawBody = Record<string, unknown>;

export const ConstructionController = {
  createScope(user: SessionUser, b: RawBody) {
    return ConstructionService.createBoqScope(user, {
      code: reqStr(b.code),
      name: reqStr(b.name),
      discipline: optStr(b.discipline) ?? "civil",
      coverage: optStr(b.coverage),
      sortOrder: optNum(b.sort_order ?? b.sortOrder) ?? 10,
      isActive: b.is_active === undefined && b.isActive === undefined ? true : Boolean(b.is_active ?? b.isActive),
    });
  },
  createBoq(user: SessionUser, b: RawBody) {
    return ConstructionService.createBoq(user, {
      projectId: optNum(b.project_id ?? b.projectId),
      scopeId: optNum(b.scope_id ?? b.scopeId),
      version: optStr(b.version) ?? "v1.0",
      title: reqStr(b.title),
      effectiveDate: optStr(b.effective_date ?? b.effectiveDate),
      measurementStandard: optStr(b.measurement_standard ?? b.measurementStandard) ?? "BNBC",
      currency: optStr(b.currency) ?? "BDT",
      taxPercent: optNum(b.tax_percent ?? b.taxPercent) ?? 0,
      contingencyPercent: optNum(b.contingency_percent ?? b.contingencyPercent) ?? 0,
      areaBasis: optStr(b.area_basis ?? b.areaBasis),
      areaValue: optNum(b.area_value ?? b.areaValue),
      areaUom: optStr(b.area_uom ?? b.areaUom),
      notes: optStr(b.notes),
    });
  },
  createResource(user: SessionUser, b: RawBody) {
    return ConstructionService.createResource(user, {
      code: reqStr(b.code),
      name: reqStr(b.name),
      kind: optStr(b.kind) ?? "labour",
      trade: optStr(b.trade),
      uom: optStr(b.uom) ?? "Day",
      standardRate: optNum(b.standard_rate ?? b.standardRate) ?? 0,
      description: optStr(b.description),
      isActive: b.is_active === undefined && b.isActive === undefined ? true : Boolean(b.is_active ?? b.isActive),
    });
  },
  createRateAnalysis(user: SessionUser, b: RawBody) {
    return ConstructionService.createRateAnalysis(user, {
      code: reqStr(b.code),
      name: reqStr(b.name),
      outputQty: optNum(b.output_qty ?? b.outputQty) ?? 1,
      outputUom: optStr(b.output_uom ?? b.outputUom) ?? "CFT",
      overheadPercent: optNum(b.overhead_percent ?? b.overheadPercent) ?? 10,
      profitPercent: optNum(b.profit_percent ?? b.profitPercent) ?? 10,
      costCode: optStr(b.cost_code ?? b.costCode),
      linesJson: typeof b.linesJson === "string" ? b.linesJson : JSON.stringify(b.lines ?? []),
      unitRate: optNum(b.unit_rate ?? b.unitRate) ?? 0,
    });
  },
};
