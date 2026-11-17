import { optNum, optStr, reqStr } from "@/server/http/api-handler";
import { PosService } from "@/server/services/pos.service";
import type { SessionUser } from "@/lib/auth";

type RawBody = Record<string, unknown>;

export const PosController = {
  // ---------------- Units of Measure ----------------
  listUnits() {
    return PosService.listUnits();
  },

  createUnit(user: SessionUser, b: RawBody) {
    return PosService.createUnit(user, {
      companyId: optNum(b.company_id ?? b.companyId),
      code: reqStr(b.code).toUpperCase(),
      name: reqStr(b.name),
      isBase: b.is_base === undefined && b.isBase === undefined ? true : Boolean(b.is_base ?? b.isBase),
      baseUnitId: optNum(b.base_unit_id ?? b.baseUnitId),
      factor: Number(b.factor ?? 1) || 1,
      isActive:
        b.is_active === undefined && b.isActive === undefined
          ? true
          : Boolean(b.is_active ?? b.isActive),
    });
  },

  updateUnit(user: SessionUser, id: number, b: RawBody) {
    const activeVal = b.isActive ?? b.is_active;
    const baseVal = b.isBase ?? b.is_base;
    return PosService.updateUnit(user, id, {
      code: b.code !== undefined ? reqStr(b.code).toUpperCase() : undefined,
      name: b.name !== undefined ? reqStr(b.name) : undefined,
      isBase: typeof baseVal === "boolean" ? baseVal : undefined,
      baseUnitId: b.base_unit_id !== undefined || b.baseUnitId !== undefined ? optNum(b.base_unit_id ?? b.baseUnitId) : undefined,
      factor: b.factor !== undefined ? Number(b.factor) || 1 : undefined,
      isActive: typeof activeVal === "boolean" ? activeVal : undefined,
    });
  },

  deleteUnit(user: SessionUser, id: number) {
    return PosService.deleteUnit(user, id);
  },

  // ---------------- Product Categories ----------------
  listCategories() {
    return PosService.listCategories();
  },

  createCategory(user: SessionUser, b: RawBody) {
    return PosService.createCategory(user, {
      companyId: optNum(b.company_id ?? b.companyId),
      code: reqStr(b.code).toUpperCase(),
      name: reqStr(b.name),
      parentId: optNum(b.parent_id ?? b.parentId),
      description: optStr(b.description),
      isActive:
        b.is_active === undefined && b.isActive === undefined
          ? true
          : Boolean(b.is_active ?? b.isActive),
    });
  },

  updateCategory(user: SessionUser, id: number, b: RawBody) {
    const activeVal = b.isActive ?? b.is_active;
    return PosService.updateCategory(user, id, {
      code: b.code !== undefined ? reqStr(b.code).toUpperCase() : undefined,
      name: b.name !== undefined ? reqStr(b.name) : undefined,
      parentId: b.parent_id !== undefined || b.parentId !== undefined ? optNum(b.parent_id ?? b.parentId) : undefined,
      description: b.description !== undefined ? optStr(b.description) : undefined,
      isActive: typeof activeVal === "boolean" ? activeVal : undefined,
    });
  },

  deleteCategory(user: SessionUser, id: number) {
    return PosService.deleteCategory(user, id);
  },

  // ---------------- Warehouses ----------------
  listWarehouses() {
    return PosService.listWarehouses();
  },

  createWarehouse(user: SessionUser, b: RawBody) {
    return PosService.createWarehouse(user, {
      companyId: optNum(b.company_id ?? b.companyId),
      code: reqStr(b.code).toUpperCase(),
      name: reqStr(b.name),
      type: reqStr(b.type, "central"),
      branchId: optNum(b.branch_id ?? b.branchId),
      projectId: optNum(b.project_id ?? b.projectId),
      managerName: optStr(b.manager_name ?? b.managerName),
      address: optStr(b.address),
      isDefault: Boolean(b.is_default ?? b.isDefault),
      isActive:
        b.is_active === undefined && b.isActive === undefined
          ? true
          : Boolean(b.is_active ?? b.isActive),
    });
  },

  updateWarehouse(user: SessionUser, id: number, b: RawBody) {
    const activeVal = b.isActive ?? b.is_active;
    const defVal = b.isDefault ?? b.is_default;
    return PosService.updateWarehouse(user, id, {
      code: b.code !== undefined ? reqStr(b.code).toUpperCase() : undefined,
      name: b.name !== undefined ? reqStr(b.name) : undefined,
      type: b.type !== undefined ? reqStr(b.type) : undefined,
      branchId: b.branch_id !== undefined || b.branchId !== undefined ? optNum(b.branch_id ?? b.branchId) : undefined,
      projectId: b.project_id !== undefined || b.projectId !== undefined ? optNum(b.project_id ?? b.projectId) : undefined,
      managerName: b.manager_name !== undefined || b.managerName !== undefined ? optStr(b.manager_name ?? b.managerName) : undefined,
      address: b.address !== undefined ? optStr(b.address) : undefined,
      isDefault: typeof defVal === "boolean" ? defVal : undefined,
      isActive: typeof activeVal === "boolean" ? activeVal : undefined,
    });
  },

  deleteWarehouse(user: SessionUser, id: number) {
    return PosService.deleteWarehouse(user, id);
  },

  // ---------------- Products ----------------
  listProducts() {
    return PosService.listProducts();
  },

  createProduct(user: SessionUser, b: RawBody) {
    const companyId = optNum(b.company_id ?? b.companyId);
    if (Array.isArray(b.items)) {
      return PosService.createProduct(user, {
        companyId,
        items: (b.items as RawBody[]).map((item) => ({
          code: optStr(item.code)?.toUpperCase() ?? null,
          name: reqStr(item.name),
          type: reqStr(item.type, "stockable"),
          categoryId: optNum(item.category_id ?? item.categoryId),
          baseUomId: optNum(item.base_uom_id ?? item.baseUomId),
          sku: optStr(item.sku),
          barcode: optStr(item.barcode),
          costPrice: Number(item.cost_price ?? item.costPrice ?? 0) || 0,
          salePrice: Number(item.sale_price ?? item.salePrice ?? 0) || 0,
          reorderLevel: Number(item.reorder_level ?? item.reorderLevel ?? 0) || 0,
          priceInclusive: Boolean(item.price_inclusive ?? item.priceInclusive),
          description: optStr(item.description),
          isSellable: item.is_sellable === undefined ? true : Boolean(item.is_sellable),
          isPurchasable: item.is_purchasable === undefined ? true : Boolean(item.is_purchasable),
          isPinnedPos: false,
          isActive: item.is_active === undefined ? true : Boolean(item.is_active),
        })),
      });
    }

    return PosService.createProduct(user, {
      companyId,
      code: optStr(b.code)?.toUpperCase() ?? null,
      name: reqStr(b.name),
      type: reqStr(b.type, "stockable"),
      categoryId: optNum(b.category_id ?? b.categoryId),
      baseUomId: optNum(b.base_uom_id ?? b.baseUomId),
      sku: optStr(b.sku),
      barcode: optStr(b.barcode),
      costPrice: Number(b.cost_price ?? b.costPrice ?? 0) || 0,
      salePrice: Number(b.sale_price ?? b.salePrice ?? 0) || 0,
      reorderLevel: Number(b.reorder_level ?? b.reorderLevel ?? 0) || 0,
      priceInclusive: Boolean(b.price_inclusive ?? b.priceInclusive),
      description: optStr(b.description),
      isSellable: b.is_sellable === undefined && b.isSellable === undefined ? true : Boolean(b.is_sellable ?? b.isSellable),
      isPurchasable: b.is_purchasable === undefined && b.isPurchasable === undefined ? true : Boolean(b.is_purchasable ?? b.isPurchasable),
      isPinnedPos: Boolean(b.is_pinned_pos ?? b.isPinnedPos),
      isActive:
        b.is_active === undefined && b.isActive === undefined
          ? true
          : Boolean(b.is_active ?? b.isActive),
    });
  },

  updateProduct(user: SessionUser, id: number, b: RawBody) {
    const activeVal = b.isActive ?? b.is_active;
    const sellVal = b.isSellable ?? b.is_sellable;
    const purchVal = b.isPurchasable ?? b.is_purchasable;
    const pinVal = b.isPinnedPos ?? b.is_pinned_pos;
    const inclVal = b.priceInclusive ?? b.price_inclusive;
    return PosService.updateProduct(user, id, {
      code: b.code !== undefined ? reqStr(b.code).toUpperCase() : undefined,
      name: b.name !== undefined ? reqStr(b.name) : undefined,
      type: b.type !== undefined ? reqStr(b.type) : undefined,
      categoryId: b.category_id !== undefined || b.categoryId !== undefined ? optNum(b.category_id ?? b.categoryId) : undefined,
      baseUomId: b.base_uom_id !== undefined || b.baseUomId !== undefined ? optNum(b.base_uom_id ?? b.baseUomId) : undefined,
      sku: b.sku !== undefined ? optStr(b.sku) : undefined,
      barcode: b.barcode !== undefined ? optStr(b.barcode) : undefined,
      costPrice: b.cost_price !== undefined || b.costPrice !== undefined ? Number(b.cost_price ?? b.costPrice ?? 0) : undefined,
      salePrice: b.sale_price !== undefined || b.salePrice !== undefined ? Number(b.sale_price ?? b.salePrice ?? 0) : undefined,
      reorderLevel: b.reorder_level !== undefined || b.reorderLevel !== undefined ? Number(b.reorder_level ?? b.reorderLevel ?? 0) : undefined,
      onHand: b.on_hand !== undefined || b.onHand !== undefined ? Number(b.on_hand ?? b.onHand ?? 0) : undefined,
      priceInclusive: typeof inclVal === "boolean" ? inclVal : undefined,
      description: b.description !== undefined ? optStr(b.description) : undefined,
      isSellable: typeof sellVal === "boolean" ? sellVal : undefined,
      isPurchasable: typeof purchVal === "boolean" ? purchVal : undefined,
      isPinnedPos: typeof pinVal === "boolean" ? pinVal : undefined,
      isActive: typeof activeVal === "boolean" ? activeVal : undefined,
    });
  },

  deleteProduct(user: SessionUser, id: number) {
    return PosService.deleteProduct(user, id);
  },
};
