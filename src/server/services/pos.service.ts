import { prisma } from "@/lib/prisma";
import { recordAudit } from "@/lib/tier0";
import { ServiceError } from "@/server/http/api-handler";
import type { SessionUser } from "@/lib/auth";
import type {
  CreateProductCategoryDto,
  CreateProductInput,
  CreateUnitOfMeasureDto,
  CreateWarehouseDto,
  UpdateProductCategoryDto,
  UpdateProductDto,
  UpdateUnitOfMeasureDto,
  UpdateWarehouseDto,
} from "@/server/dto/pos.dto";

function formatDateEnGb(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

async function resolveDefaultCompanyId(): Promise<number> {
  const company = await prisma.company.findFirst({ orderBy: { id: "asc" } });
  return company?.id ?? 1;
}

export const PosService = {
  // ---------------- Units of Measure ----------------
  async listUnits() {
    return prisma.unitOfMeasure.findMany({
      include: { baseUnit: { select: { id: true, code: true, name: true } } },
      orderBy: { id: "asc" },
    });
  },

  async getUnitsPageData() {
    const rows = await prisma.unitOfMeasure.findMany({
      include: { baseUnit: { select: { id: true, code: true, name: true } } },
      orderBy: { id: "asc" },
    });

    const units = rows.map((u) => ({
      id: u.id,
      code: u.code,
      name: u.name,
      isBase: u.isBase,
      baseUnitId: u.baseUnitId,
      baseUnitCode: u.baseUnit?.code ?? null,
      factor: u.factor,
      isActive: u.isActive,
      createdBy: u.createdBy,
      createdAt: formatDateEnGb(u.createdAt),
    }));

    const baseUnits = rows
      .filter((u) => u.isBase)
      .map((u) => ({ id: u.id, code: u.code, name: u.name }));

    return { units, baseUnits };
  },

  async createUnit(user: SessionUser, dto: CreateUnitOfMeasureDto) {
    if (!dto.code || !dto.name) {
      throw new ServiceError(400, "Unit Code and Name are required.");
    }
    const exists = await prisma.unitOfMeasure.findUnique({ where: { code: dto.code } });
    if (exists) {
      throw new ServiceError(409, `Unit code ${dto.code} already exists.`);
    }
    const companyId = dto.companyId ?? (await resolveDefaultCompanyId());
    const unit = await prisma.unitOfMeasure.create({
      data: {
        companyId,
        code: dto.code,
        name: dto.name,
        isBase: dto.isBase,
        baseUnitId: dto.isBase ? null : dto.baseUnitId,
        factor: dto.isBase ? 1 : dto.factor || 1,
        isActive: dto.isActive,
        createdBy: user.name,
      },
    });
    await recordAudit(user.name, "created", `${unit.code} — ${unit.name}`, "UnitOfMeasure", ["code", "name"], user.id);
    return unit;
  },

  async updateUnit(user: SessionUser, id: number, dto: UpdateUnitOfMeasureDto) {
    const data: Record<string, unknown> = {};
    if (dto.code !== undefined) data.code = dto.code;
    if (dto.name !== undefined) data.name = dto.name;
    if (typeof dto.isBase === "boolean") {
      data.isBase = dto.isBase;
      if (dto.isBase) {
        data.baseUnitId = null;
        data.factor = 1;
      }
    }
    if (dto.baseUnitId !== undefined && !dto.isBase) data.baseUnitId = dto.baseUnitId;
    if (dto.factor !== undefined && !dto.isBase) data.factor = dto.factor;
    if (typeof dto.isActive === "boolean") data.isActive = dto.isActive;

    const updated = await prisma.unitOfMeasure.update({ where: { id }, data });
    await recordAudit(user.name, "updated", updated.code, "UnitOfMeasure", Object.keys(data), user.id);
    return updated;
  },

  async deleteUnit(user: SessionUser, id: number) {
    const deleted = await prisma.unitOfMeasure.delete({ where: { id } });
    await recordAudit(user.name, "deleted", deleted.code, "UnitOfMeasure", ["id"], user.id);
    return deleted;
  },

  // ---------------- Product Categories ----------------
  async listCategories() {
    return prisma.productCategory.findMany({
      include: { parent: { select: { id: true, name: true } }, _count: { select: { products: true } } },
      orderBy: { name: "asc" },
    });
  },

  async getCategoriesPageData() {
    const rows = await prisma.productCategory.findMany({
      include: {
        parent: { select: { id: true, name: true } },
        _count: { select: { products: true } },
      },
      orderBy: { name: "asc" },
    });

    return {
      categories: rows.map((c) => ({
        id: c.id,
        code: c.code,
        name: c.name,
        parentId: c.parentId,
        parentName: c.parent?.name ?? null,
        productsCount: c._count.products,
        description: c.description,
        isActive: c.isActive,
        createdBy: c.createdBy,
        createdAt: formatDateEnGb(c.createdAt),
      })),
    };
  },

  async createCategory(user: SessionUser, dto: CreateProductCategoryDto) {
    if (!dto.code || !dto.name) {
      throw new ServiceError(400, "Category Code and Name are required.");
    }
    const exists = await prisma.productCategory.findUnique({ where: { code: dto.code } });
    if (exists) {
      throw new ServiceError(409, `Category code ${dto.code} already exists.`);
    }
    const companyId = dto.companyId ?? (await resolveDefaultCompanyId());
    const cat = await prisma.productCategory.create({
      data: {
        companyId,
        code: dto.code,
        name: dto.name,
        parentId: dto.parentId,
        description: dto.description,
        isActive: dto.isActive,
        createdBy: user.name,
      },
    });
    await recordAudit(user.name, "created", cat.name, "ProductCategory", ["code", "name"], user.id);
    return cat;
  },

  async updateCategory(user: SessionUser, id: number, dto: UpdateProductCategoryDto) {
    const data: Record<string, unknown> = {};
    if (dto.code !== undefined) data.code = dto.code;
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.parentId !== undefined) data.parentId = dto.parentId;
    if (dto.description !== undefined) data.description = dto.description;
    if (typeof dto.isActive === "boolean") data.isActive = dto.isActive;

    const updated = await prisma.productCategory.update({ where: { id }, data });
    await recordAudit(user.name, "updated", updated.name, "ProductCategory", Object.keys(data), user.id);
    return updated;
  },

  async deleteCategory(user: SessionUser, id: number) {
    const deleted = await prisma.productCategory.delete({ where: { id } });
    await recordAudit(user.name, "deleted", deleted.name, "ProductCategory", ["id"], user.id);
    return deleted;
  },

  // ---------------- Warehouses ----------------
  async listWarehouses() {
    return prisma.warehouse.findMany({
      include: {
        branch: { select: { id: true, name: true } },
        project: { select: { id: true, code: true, name: true } },
      },
      orderBy: { id: "asc" },
    });
  },

  async getWarehousesPageData() {
    const [rows, branches, projects] = await Promise.all([
      prisma.warehouse.findMany({
        include: {
          branch: { select: { id: true, name: true } },
          project: { select: { id: true, code: true, name: true } },
        },
        orderBy: { id: "asc" },
      }),
      prisma.branch.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
      prisma.project.findMany({ orderBy: { name: "asc" }, select: { id: true, code: true, name: true } }),
    ]);

    return {
      warehouses: rows.map((w) => ({
        id: w.id,
        code: w.code,
        name: w.name,
        type: w.type,
        branchId: w.branchId,
        branchName: w.branch?.name ?? null,
        projectId: w.projectId,
        projectName: w.project ? `${w.project.name} (${w.project.code})` : null,
        managerName: w.managerName,
        address: w.address,
        isDefault: w.isDefault,
        isActive: w.isActive,
        createdBy: w.createdBy,
        createdAt: formatDateEnGb(w.createdAt),
      })),
      branches,
      projects,
    };
  },

  async createWarehouse(user: SessionUser, dto: CreateWarehouseDto) {
    if (!dto.code || !dto.name) {
      throw new ServiceError(400, "Warehouse Code and Name are required.");
    }
    const exists = await prisma.warehouse.findUnique({ where: { code: dto.code } });
    if (exists) {
      throw new ServiceError(409, `Warehouse code ${dto.code} already exists.`);
    }
    const companyId = dto.companyId ?? (await resolveDefaultCompanyId());
    const count = await prisma.warehouse.count();
    const isDefault = count === 0 ? true : dto.isDefault;
    if (isDefault && count > 0) {
      await prisma.warehouse.updateMany({ where: { companyId }, data: { isDefault: false } });
    }
    const wh = await prisma.warehouse.create({
      data: {
        companyId,
        code: dto.code,
        name: dto.name,
        type: dto.type || "central",
        branchId: dto.branchId,
        projectId: dto.projectId,
        managerName: dto.managerName,
        address: dto.address,
        isDefault,
        isActive: dto.isActive,
        createdBy: user.name,
      },
    });
    await recordAudit(user.name, "created", wh.name, "Warehouse", ["code", "name", "type"], user.id);
    return wh;
  },

  async updateWarehouse(user: SessionUser, id: number, dto: UpdateWarehouseDto) {
    const data: Record<string, unknown> = {};
    if (dto.code !== undefined) data.code = dto.code;
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.branchId !== undefined) data.branchId = dto.branchId;
    if (dto.projectId !== undefined) data.projectId = dto.projectId;
    if (dto.managerName !== undefined) data.managerName = dto.managerName;
    if (dto.address !== undefined) data.address = dto.address;
    if (typeof dto.isDefault === "boolean") {
      if (dto.isDefault) {
        await prisma.warehouse.updateMany({ data: { isDefault: false } });
      }
      data.isDefault = dto.isDefault;
    }
    if (typeof dto.isActive === "boolean") data.isActive = dto.isActive;

    const updated = await prisma.warehouse.update({ where: { id }, data });
    await recordAudit(user.name, "updated", updated.name, "Warehouse", Object.keys(data), user.id);
    return updated;
  },

  async deleteWarehouse(user: SessionUser, id: number) {
    const deleted = await prisma.warehouse.delete({ where: { id } });
    await recordAudit(user.name, "deleted", deleted.name, "Warehouse", ["id"], user.id);
    return deleted;
  },

  // ---------------- Products ----------------
  async listProducts() {
    return prisma.product.findMany({
      include: {
        category: { select: { id: true, name: true } },
        baseUom: { select: { id: true, code: true, name: true } },
      },
      orderBy: { name: "asc" },
    });
  },

  async getProductsPageData(filters: {
    search?: string;
    category_id?: string;
    type?: string;
    status?: string;
  }) {
    const search = (filters.search ?? "").trim();
    const category_id = (filters.category_id ?? "").trim();
    const type = (filters.type ?? "").trim();
    const status = (filters.status ?? "").trim();

    const where: Record<string, unknown> = {};
    if (category_id) where.categoryId = Number(category_id);
    if (type) where.type = type;
    if (status === "active") where.isActive = true;
    if (status === "inactive") where.isActive = false;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { code: { contains: search } },
        { sku: { contains: search } },
        { barcode: { contains: search } },
      ];
    }

    const [rows, allCount, noBarcodeCount, pinnedCount, categories, units, warehouses] =
      await Promise.all([
        prisma.product.findMany({
          where,
          include: {
            category: { select: { id: true, name: true } },
            baseUom: { select: { id: true, code: true, name: true } },
          },
          orderBy: { name: "asc" },
        }),
        prisma.product.count(),
        prisma.product.count({ where: { isActive: true, OR: [{ barcode: null }, { barcode: "" }] } }),
        prisma.product.count({ where: { isPinnedPos: true } }),
        prisma.productCategory.findMany({
          include: { parent: { select: { name: true } } },
          orderBy: { name: "asc" },
        }),
        prisma.unitOfMeasure.findMany({
          orderBy: { id: "asc" },
          select: { id: true, code: true, name: true },
        }),
        prisma.warehouse.findMany({
          where: { isActive: true },
          orderBy: { name: "asc" },
          select: { id: true, name: true },
        }),
      ]);

    return {
      products: rows.map((p) => ({
        id: p.id,
        code: p.code,
        name: p.name,
        type: p.type,
        categoryId: p.categoryId,
        categoryName: p.category?.name ?? null,
        baseUomId: p.baseUomId,
        uomCode: p.baseUom?.code ?? "NOS",
        sku: p.sku,
        barcode: p.barcode,
        costPrice: p.costPrice,
        salePrice: p.salePrice,
        reorderLevel: p.reorderLevel,
        onHand: p.onHand,
        priceInclusive: p.priceInclusive,
        description: p.description,
        isSellable: p.isSellable,
        isPurchasable: p.isPurchasable,
        isPinnedPos: p.isPinnedPos,
        isActive: p.isActive,
        createdBy: p.createdBy,
        createdAt: formatDateEnGb(p.createdAt),
      })),
      totalCount: allCount,
      noBarcodeCount,
      pinnedCount,
      categories: categories.map((c) => ({
        id: c.id,
        label: c.parent ? `${c.parent.name} › ${c.name}` : c.name,
      })),
      units,
      warehouses,
      filters: { search, category_id, type, status },
    };
  },

  async getBulkProductsPageData() {
    const [categories, units] = await Promise.all([
      prisma.productCategory.findMany({
        include: { parent: { select: { name: true } } },
        orderBy: { name: "asc" },
      }),
      prisma.unitOfMeasure.findMany({
        orderBy: { id: "asc" },
        select: { id: true, code: true, name: true },
      }),
    ]);

    return {
      categories: categories.map((c) => ({
        id: c.id,
        label: c.parent ? `${c.parent.name} › ${c.name}` : c.name,
      })),
      units,
    };
  },

  async getProductBatchesPageData(id: number) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: { baseUom: { select: { code: true } } },
    });
    if (!product) return null;
    return {
      id: product.id,
      code: product.code,
      name: product.name,
      onHand: product.onHand,
      uomCode: product.baseUom?.code ?? "NOS",
    };
  },

  async createProduct(user: SessionUser, input: CreateProductInput) {
    const companyId = input.companyId ?? (await resolveDefaultCompanyId());

    if ("items" in input) {
      let count = await prisma.product.count();
      const created = [];
      for (const item of input.items) {
        if (!item.name || !item.name.trim()) continue;
        count++;
        const code =
          item.code && item.code.trim()
            ? item.code.trim().toUpperCase()
            : `PRD-${String(count).padStart(4, "0")}`;
        const prod = await prisma.product.create({
          data: {
            companyId,
            code,
            name: item.name.trim(),
            type: item.type || "stockable",
            categoryId: item.categoryId,
            baseUomId: item.baseUomId,
            sku: item.sku,
            barcode: item.barcode,
            costPrice: item.costPrice || 0,
            salePrice: item.salePrice || 0,
            reorderLevel: item.reorderLevel || 0,
            priceInclusive: item.priceInclusive,
            description: item.description,
            isSellable: item.isSellable,
            isPurchasable: item.isPurchasable,
            isPinnedPos: false,
            isActive: item.isActive,
            createdBy: user.name,
          },
        });
        created.push(prod);
      }
      if (created.length > 0) {
        await recordAudit(user.name, "created", `${created.length} products`, "Product", ["bulk"], user.id);
      }
      return { created };
    }

    if (!input.name) {
      throw new ServiceError(400, "Product Name is required.");
    }
    const count = await prisma.product.count();
    const code =
      input.code && input.code.trim()
        ? input.code.trim().toUpperCase()
        : `PRD-${String(count + 1).padStart(4, "0")}`;

    const prod = await prisma.product.create({
      data: {
        companyId,
        code,
        name: input.name,
        type: input.type || "stockable",
        categoryId: input.categoryId,
        baseUomId: input.baseUomId,
        sku: input.sku,
        barcode: input.barcode,
        costPrice: input.costPrice || 0,
        salePrice: input.salePrice || 0,
        reorderLevel: input.reorderLevel || 0,
        priceInclusive: input.priceInclusive,
        description: input.description,
        isSellable: input.isSellable,
        isPurchasable: input.isPurchasable,
        isPinnedPos: input.isPinnedPos,
        isActive: input.isActive,
        createdBy: user.name,
      },
    });
    await recordAudit(user.name, "created", prod.name, "Product", ["code", "name", "type"], user.id);
    return prod;
  },

  async updateProduct(user: SessionUser, id: number, dto: UpdateProductDto) {
    const data: Record<string, unknown> = {};
    if (dto.code !== undefined) data.code = dto.code;
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.categoryId !== undefined) data.categoryId = dto.categoryId;
    if (dto.baseUomId !== undefined) data.baseUomId = dto.baseUomId;
    if (dto.sku !== undefined) data.sku = dto.sku;
    if (dto.barcode !== undefined) data.barcode = dto.barcode;
    if (dto.costPrice !== undefined) data.costPrice = dto.costPrice;
    if (dto.salePrice !== undefined) data.salePrice = dto.salePrice;
    if (dto.reorderLevel !== undefined) data.reorderLevel = dto.reorderLevel;
    if (dto.onHand !== undefined) data.onHand = dto.onHand;
    if (typeof dto.priceInclusive === "boolean") data.priceInclusive = dto.priceInclusive;
    if (dto.description !== undefined) data.description = dto.description;
    if (typeof dto.isSellable === "boolean") data.isSellable = dto.isSellable;
    if (typeof dto.isPurchasable === "boolean") data.isPurchasable = dto.isPurchasable;
    if (typeof dto.isPinnedPos === "boolean") data.isPinnedPos = dto.isPinnedPos;
    if (typeof dto.isActive === "boolean") data.isActive = dto.isActive;

    const updated = await prisma.product.update({ where: { id }, data });
    await recordAudit(user.name, "updated", updated.name, "Product", Object.keys(data), user.id);
    return updated;
  },

  async deleteProduct(user: SessionUser, id: number) {
    const deleted = await prisma.product.delete({ where: { id } });
    await recordAudit(user.name, "deleted", deleted.name, "Product", ["id"], user.id);
    return deleted;
  },
};
