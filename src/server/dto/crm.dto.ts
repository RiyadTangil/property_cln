// Tier 4A — CRM DTOs

export interface CreateCrmLeadDto {
  firstName: string;
  lastName?: string | null;
  organisationName?: string | null;
  email?: string | null;
  phone?: string | null;
  mobile?: string | null;
  city?: string | null;
  country?: string;
  source?: string;
  sourceDetail?: string | null;
  status?: string;
  priority?: string;
  score?: number;
  interest?: string | null;
  expectedValue?: number;
  ownerId?: number | null;
  nextFollowUpOn?: string | null;
  branchId?: number | null;
  projectIdsJson?: string;
  unitIdsJson?: string;
  notes?: string | null;
}

export interface CreateCrmCustomerDto {
  code?: string;
  kind?: string;
  organisationName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  type?: string;
  lifecycleStage?: string;
  email?: string | null;
  phone?: string | null;
  mobile?: string | null;
  website?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string;
  socialProfilesJson?: string;
  industry?: string | null;
  source?: string | null;
  branchId?: number | null;
  taxNumber?: string | null;
  registrationNumber?: string | null;
  creditLimit?: number;
  ownerId?: number | null;
  notes?: string | null;
  isActive?: boolean;
}
