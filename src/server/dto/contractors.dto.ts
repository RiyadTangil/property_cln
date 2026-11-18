// Contractors (Tier 3B) DTOs

export interface CreateContractorDto {
  name: string;
  displayName?: string | null;
  contractorType?: string;
  trade?: string | null;
  status?: string;
  contactPerson?: string | null;
  phone?: string | null;
  email?: string | null;
  addressLine?: string | null;
  city?: string | null;
  tradeLicense?: string | null;
  defaultRetentionPercent?: number;
  defaultSecurityDepositPercent?: number;
  defaultTdsPercent?: number;
  defaultVatPercent?: number;
  taxNumber?: string | null;
  vatNumber?: string | null;
  bankName?: string | null;
  bankBranch?: string | null;
  bankAccountNo?: string | null;
  notes?: string | null;
}

export interface CreateContractorWorkOrderDto {
  contractorId: number;
  projectId?: number | null;
  orderDate: string;
  engagementType?: string;
  pricingMethod?: string;
  title: string;
  scope?: string | null;
  startDate?: string | null;
  completionDate?: string | null;
  defectLiabilityDays?: number;
  retentionPercent?: number;
  tdsPercent?: number;
  vatPercent?: number;
  advanceRecoveryPercent?: number;
  contractValue?: number;
}

export interface CreateContractorPaymentDto {
  contractorId: number;
  projectId?: number | null;
  kind?: string;
  paymentDate: string;
  amount: number;
  method?: string;
  reference?: string | null;
  notes?: string | null;
}
