// Construction / BOQ (Tier 3A) DTOs

export interface CreateBoqScopeDto {
  code: string;
  name: string;
  discipline?: string;
  coverage?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}

export interface CreateBoqDto {
  projectId?: number | null;
  scopeId?: number | null;
  version?: string;
  title: string;
  effectiveDate?: string | null;
  measurementStandard?: string;
  currency?: string;
  taxPercent?: number;
  contingencyPercent?: number;
  areaBasis?: string | null;
  areaValue?: number | null;
  areaUom?: string | null;
  notes?: string | null;
}

export interface CreateResourceItemDto {
  code: string;
  name: string;
  kind?: string;
  trade?: string | null;
  uom?: string;
  standardRate?: number;
  description?: string | null;
  isActive?: boolean;
}

export interface CreateResourceAnalysisDto {
  code: string;
  name: string;
  outputQty?: number;
  outputUom?: string;
  overheadPercent?: number;
  profitPercent?: number;
  costCode?: string | null;
  linesJson?: string;
  unitRate?: number;
}
