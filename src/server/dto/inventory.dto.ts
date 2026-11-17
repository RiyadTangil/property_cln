// Inventory (Tier 2C) DTOs

export interface UpdateInventoryUnitDto {
  floorId?: number;
  unitNumber?: string;
  name?: string | null;
  unitType?: string;
  status?: string;
  facing?: string | null;
  bedrooms?: number;
  bathrooms?: number;
  balconies?: number;
  parkingSlots?: number;
  carpetArea?: number | null;
  builtArea?: number | null;
  superArea?: number | null;
  price?: number | null;
  ratePerSqft?: number | null;
  handoverDate?: string | null;
  ownerName?: string | null;
  customerName?: string | null;
  features?: string | null;
  description?: string | null;
  isCorner?: boolean;
}
