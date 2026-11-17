export interface CreateUnitOfMeasureDto {
  companyId?: number | null;
  code: string;
  name: string;
  isBase: boolean;
  baseUnitId: number | null;
  factor: number;
  isActive: boolean;
}

export interface UpdateUnitOfMeasureDto {
  code?: string;
  name?: string;
  isBase?: boolean;
  baseUnitId?: number | null;
  factor?: number;
  isActive?: boolean;
}

export interface CreateProductCategoryDto {
  companyId?: number | null;
  code: string;
  name: string;
  parentId: number | null;
  description: string | null;
  isActive: boolean;
}

export interface UpdateProductCategoryDto {
  code?: string;
  name?: string;
  parentId?: number | null;
  description?: string | null;
  isActive?: boolean;
}

export interface CreateWarehouseDto {
  companyId?: number | null;
  code: string;
  name: string;
  type: string;
  branchId: number | null;
  projectId: number | null;
  managerName: string | null;
  address: string | null;
  isDefault: boolean;
  isActive: boolean;
}

export interface UpdateWarehouseDto {
  code?: string;
  name?: string;
  type?: string;
  branchId?: number | null;
  projectId?: number | null;
  managerName?: string | null;
  address?: string | null;
  isDefault?: boolean;
  isActive?: boolean;
}

export interface CreateProductDto {
  companyId?: number | null;
  code?: string | null;
  name: string;
  type: string;
  categoryId: number | null;
  baseUomId: number | null;
  sku: string | null;
  barcode: string | null;
  costPrice: number;
  salePrice: number;
  reorderLevel: number;
  priceInclusive: boolean;
  description: string | null;
  isSellable: boolean;
  isPurchasable: boolean;
  isPinnedPos: boolean;
  isActive: boolean;
}

export type CreateProductInput =
  | { items: CreateProductDto[]; companyId?: number | null }
  | CreateProductDto;

export interface UpdateProductDto {
  code?: string;
  name?: string;
  type?: string;
  categoryId?: number | null;
  baseUomId?: number | null;
  sku?: string | null;
  barcode?: string | null;
  costPrice?: number;
  salePrice?: number;
  reorderLevel?: number;
  onHand?: number;
  priceInclusive?: boolean;
  description?: string | null;
  isSellable?: boolean;
  isPurchasable?: boolean;
  isPinnedPos?: boolean;
  isActive?: boolean;
}
