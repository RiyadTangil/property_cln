// Tier 4B & 4C — Clients, Owners, Agreements, Sales & Payments DTOs

export interface CreateClientRecordDto {
  clientType?: string;
  name: string;
  fatherName?: string | null;
  motherName?: string | null;
  occupation?: string | null;
  nid?: string | null;
  dateOfBirth?: string | null;
  registrationNo?: string | null;
  bin?: string | null;
  authorizedPerson?: string | null;
  authorizedDesignation?: string | null;
  officeAddress?: string | null;
  mobile?: string | null;
  alternateMobile?: string | null;
  email?: string | null;
  tin?: string | null;
  presentAddress?: string | null;
  permanentAddress?: string | null;
  notes?: string | null;
  isActive?: boolean;
}

export interface CreatePropertyOwnerDto {
  name: string;
  nid?: string | null;
  tin?: string | null;
  fatherName?: string | null;
  motherName?: string | null;
  dateOfBirth?: string | null;
  occupation?: string | null;
  mobile?: string | null;
  alternateMobile?: string | null;
  email?: string | null;
  presentAddress?: string | null;
  permanentAddress?: string | null;
  notes?: string | null;
  isActive?: boolean;
}

export interface CreateApartmentSaleDto {
  projectId?: number | null;
  customerId?: number | null;
  salesPersonId?: number | null;
  saleDate: string;
  agreementDate?: string | null;
  expectedHandoverDate?: string | null;
  paymentPlanType?: string;
  otherCharges?: number;
  totalAmount?: number;
  terms?: string | null;
  note?: string | null;
}
