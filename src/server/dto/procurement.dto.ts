// Procurement, Suppliers & Store Movements (Tier 3D) DTOs

export interface CreateSupplierDto {
  supplierType?: string;
  companyName: string;
  displayName?: string | null;
  status?: string;
  openingBalance?: number;
  creditLimit?: number;
  creditDays?: number;
  businessCategory?: string | null;
  industry?: string | null;
  tradeLicense?: string | null;
  website?: string | null;
  defaultCurrency?: string;
  defaultPaymentMethod?: string;
  leadTimeDays?: number;
  notes?: string | null;
}

export interface CreateVendorDto {
  name: string;
  displayName?: string | null;
  vendorType?: string;
  category?: string | null;
  status?: string;
  contactPerson?: string | null;
  phone?: string | null;
  email?: string | null;
  city?: string | null;
  country?: string;
  defaultCurrency?: string;
  openingBalance?: number;
  creditLimit?: number;
  creditDays?: number;
  tradeLicense?: string | null;
  taxNumber?: string | null;
  notes?: string | null;
}
