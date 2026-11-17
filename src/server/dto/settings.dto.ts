export interface CreateUserDto {
  name: string;
  email: string;
  password: string;
  passwordConfirmation: string;
  jobTitle: string | null;
  phone: string | null;
  roleName: string;
  isSuperAdmin: boolean;
  isActive: boolean;
}

export interface UpdateUserDto {
  isActive?: boolean;
  role?: string;
}

export interface CreateRoleDto {
  name: string;
  scope: string;
}

export interface UpdateRoleDto {
  permissions?: string[];
  name?: string;
  scope?: string;
}

export interface UpdateCodeSequenceDto {
  id: number;
  label?: string;
  prefix: string;
  suffix: string;
  separator: string;
  padding: number;
  nextNumber: number;
  yearInCode: boolean;
  resetYearly: boolean;
}

export interface CreateDocumentDto {
  title: string;
  category: string;
  module: string;
  expiryDate: string | null;
  fileSize: string;
  fileUrl: string;
}

export interface CreateInvoiceTemplateDto {
  name: string;
  type: string;
  paper: string;
  orientation: string;
  isDefault: boolean;
  isActive: boolean;
  blocksJson: string;
}

export interface CreateMfsServiceDto {
  name: string;
  shortName: string | null;
  accountName: string | null;
  accountNumber: string | null;
  accountType: string | null;
  isActive: boolean;
}

export interface UpdateMfsServiceDto {
  id: number;
  name?: string;
  shortName?: string | null;
  accountName?: string | null;
  accountNumber?: string | null;
  accountType?: string | null;
  isActive?: boolean;
}

export interface UpdateAppSettingDto {
  appName: string;
  appTagline: string;
  footerText: string;
  contactEmail: string;
  contactPhone: string;
  website: string;
  contactAddress: string;
  primaryColor: string;
}

export interface UpdateProfilePasswordDto {
  mode: "password";
  currentPassword: string;
  newPassword: string;
  passwordConfirmation: string;
}

export interface UpdateProfileInfoDto {
  mode: "profile";
  theme?: string;
  navLayout?: string;
  sidebarColor?: string;
  name?: string;
  email?: string;
  username?: string;
  jobTitle?: string | null;
  phone?: string | null;
  timezone?: string;
  dateFormat?: string;
  timeFormat?: string;
}

export type UpdateProfileDto = UpdateProfilePasswordDto | UpdateProfileInfoDto;
