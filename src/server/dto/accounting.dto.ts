export interface CreateChartAccountDto {
  companyId?: number | null;
  parentId: number | null;
  code: string;
  name: string;
  accountType: string;
  normalBalance: string;
  openingBalance: number;
  currency: string | null;
  isGroup: boolean;
  isActive: boolean;
  description: string | null;
}

export interface UpdateChartAccountDto {
  parentId?: number | null;
  code?: string;
  name?: string;
  accountType?: string;
  normalBalance?: string;
  openingBalance?: number;
  currency?: string | null;
  isGroup?: boolean;
  isActive?: boolean;
  description?: string | null;
}

export interface CreateAccountHeadDto {
  companyId?: number | null;
  type: string;
  name: string;
  accountId: number;
  defaultCostCode: string | null;
  description: string | null;
  isActive: boolean;
}

export interface UpdateAccountHeadDto {
  type?: string;
  name?: string;
  accountId?: number;
  defaultCostCode?: string | null;
  description?: string | null;
  isActive?: boolean;
}

export interface CreateBankAccountDto {
  companyId?: number | null;
  name: string;
  shortName: string | null;
  accountName: string | null;
  accountNumber: string | null;
  branch: string | null;
  routingNumber: string | null;
  swift: string | null;
  isActive: boolean;
}

export interface UpdateBankAccountDto {
  name?: string;
  shortName?: string | null;
  accountName?: string | null;
  accountNumber?: string | null;
  branch?: string | null;
  routingNumber?: string | null;
  swift?: string | null;
  isActive?: boolean;
}

export interface CreateLenderDto {
  companyId?: number | null;
  name: string;
  lenderType: string;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  bankId: number | null;
  notes: string | null;
  isActive: boolean;
}

export interface UpdateLenderDto {
  name?: string;
  lenderType?: string;
  contactPerson?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  bankId?: number | null;
  notes?: string | null;
  isActive?: boolean;
}
