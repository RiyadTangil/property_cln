export interface CreateParcelDto {
  title: string | null;
  landType: string;
  mouza: string;
  jlNo: string | null;
  mouzaMapSheet: string | null;
  division: string | null;
  district: string;
  upazila: string | null;
  unionWard: string | null;
  policeStation: string | null;
  road: string | null;
  postalCode: string | null;
  addressLine: string | null;
  latitude: number | null;
  longitude: number | null;
  areaValue: number;
  areaUnit: string;
  boundaryNorth: string | null;
  boundarySouth: string | null;
  boundaryEast: string | null;
  boundaryWest: string | null;
  frontageFeet: number | null;
  roadWidthFeet: number | null;
  currentUse: string | null;
  isCornerPlot: boolean;
  source: string | null;
  brokerName: string | null;
  brokerContact: string | null;
  remarks: string | null;
}

export interface UpdateParcelDto {
  stage?: string;
  title?: string | null;
  remarks?: string | null;
  projectId?: number | null;
  areaValue?: number;
  areaUnit?: string;
}

export interface CreateOwnerDto {
  kind: string;
  name: string;
  nid: string | null;
  tin: string | null;
  fatherName: string | null;
  motherName: string | null;
  spouseName: string | null;
  registrationNumber: string | null;
  dateOfBirth: string | null;
  isMinor: boolean;
  isDeceased: boolean;
  guardianName: string | null;
  guardianNid: string | null;
  guardianRelation: string | null;
  successionCertificateNo: string | null;
  successionDate: string | null;
  dateOfDeath: string | null;
  phone: string | null;
  alternatePhone: string | null;
  email: string | null;
  addressLine1: string | null;
  village: string | null;
  postOffice: string | null;
  policeStation: string | null;
  upazila: string | null;
  district: string | null;
  postalCode: string | null;
  bankName: string | null;
  bankBranch: string | null;
  bankAccountName: string | null;
  bankAccountNo: string | null;
  routingNumber: string | null;
  mfsProvider: string | null;
  mfsNumber: string | null;
  notes: string | null;
  isActive: boolean;
}

export interface UpdateOwnerDto {
  isActive?: boolean;
}

export interface CreateProposalDto {
  parcelId: number;
  proposalDate: string;
  ratePerKatha: number;
  totalValue: number;
  status: string;
  remarks: string | null;
}

export interface UpdateProposalDto {
  status: string;
}

export interface CreateAgreementDto {
  parcelId: number;
  ownerId: number | null;
  type: string;
  status: string;
  agreementDate: string;
  expiryDate: string | null;
  agreedPrice: number;
  advanceAmount: number;
  advanceSettled: boolean;
  notes: string | null;
}

export interface UpdateAgreementDto {
  status?: string;
  advanceSettled?: boolean;
}

export interface CreatePaymentDto {
  parcelId: number;
  ownerId: number | null;
  agreementId: number | null;
  type: string;
  paymentDate: string;
  grossAmount: number;
  taxDeducted: number;
  otherDeduction: number;
  method: string;
  accountName: string | null;
  bankName: string | null;
  chequeNo: string | null;
  chequeDate: string | null;
  transactionReference: string | null;
  narration: string | null;
  status: string;
}

export interface UpdatePaymentDto {
  status: string;
}
