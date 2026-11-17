import { optNum, optStr, reqStr } from "@/server/http/api-handler";
import { LandService } from "@/server/services/land.service";
import type { SessionUser } from "@/lib/auth";

type RawBody = Record<string, unknown>;

export const LandController = {
  // ---------------- Parcels ----------------
  listParcels() {
    return LandService.listParcels();
  },

  listBankParcels() {
    return LandService.listBankParcels();
  },

  getParcel(id: number) {
    return LandService.getParcel(id);
  },

  createParcel(user: SessionUser, body: RawBody) {
    return LandService.createParcel(user, {
      title: optStr(body.title),
      landType: reqStr(body.land_type ?? body.landType),
      mouza: reqStr(body.mouza),
      jlNo: optStr(body.jl_no ?? body.jlNo),
      mouzaMapSheet: optStr(body.mouza_map_sheet ?? body.mouzaMapSheet),
      division: optStr(body.division),
      district: reqStr(body.district),
      upazila: optStr(body.upazila),
      unionWard: optStr(body.union_ward ?? body.unionWard),
      policeStation: optStr(body.police_station ?? body.policeStation),
      road: optStr(body.road),
      postalCode: optStr(body.postal_code ?? body.postalCode),
      addressLine: optStr(body.address_line ?? body.addressLine),
      latitude: optNum(body.latitude),
      longitude: optNum(body.longitude),
      areaValue: Number(body.area_value ?? body.areaValue),
      areaUnit: reqStr(body.area_unit ?? body.areaUnit, "katha"),
      boundaryNorth: optStr(body.boundary_north ?? body.boundaryNorth),
      boundarySouth: optStr(body.boundary_south ?? body.boundarySouth),
      boundaryEast: optStr(body.boundary_east ?? body.boundaryEast),
      boundaryWest: optStr(body.boundary_west ?? body.boundaryWest),
      frontageFeet: optNum(body.frontage_feet ?? body.frontageFeet),
      roadWidthFeet: optNum(body.road_width_feet ?? body.roadWidthFeet),
      currentUse: optStr(body.current_use ?? body.currentUse),
      isCornerPlot: Boolean(body.is_corner_plot ?? body.isCornerPlot),
      source: optStr(body.source),
      brokerName: optStr(body.broker_name ?? body.brokerName),
      brokerContact: optStr(body.broker_contact ?? body.brokerContact),
      remarks: optStr(body.remarks),
    });
  },

  updateParcel(user: SessionUser, id: number, body: RawBody) {
    return LandService.updateParcel(user, id, {
      stage: typeof body.stage === "string" ? body.stage : undefined,
      title: typeof body.title === "string" ? optStr(body.title) : undefined,
      remarks: typeof body.remarks === "string" ? optStr(body.remarks) : undefined,
      projectId:
        body.projectId !== undefined
          ? body.projectId
            ? Number(body.projectId)
            : null
          : undefined,
      areaValue: body.areaValue !== undefined ? Number(body.areaValue) : undefined,
      areaUnit: body.areaUnit !== undefined ? String(body.areaUnit) : undefined,
    });
  },

  deleteParcel(user: SessionUser, id: number) {
    return LandService.deleteParcel(user, id);
  },

  // ---------------- Owners ----------------
  listOwners() {
    return LandService.listOwners();
  },

  createOwner(user: SessionUser, body: RawBody) {
    return LandService.createOwner(user, {
      kind: reqStr(body.kind, "individual"),
      name: reqStr(body.name),
      nid: optStr(body.nid),
      tin: optStr(body.tin),
      fatherName: optStr(body.father_name ?? body.fatherName),
      motherName: optStr(body.mother_name ?? body.motherName),
      spouseName: optStr(body.spouse_name ?? body.spouseName),
      registrationNumber: optStr(body.registration_number ?? body.registrationNumber),
      dateOfBirth: optStr(body.date_of_birth ?? body.dateOfBirth),
      isMinor: Boolean(body.is_minor ?? body.isMinor),
      isDeceased: Boolean(body.is_deceased ?? body.isDeceased),
      guardianName: optStr(body.guardian_name ?? body.guardianName),
      guardianNid: optStr(body.guardian_nid ?? body.guardianNid),
      guardianRelation: optStr(body.guardian_relation ?? body.guardianRelation),
      successionCertificateNo: optStr(
        body.succession_certificate_no ?? body.successionCertificateNo
      ),
      successionDate: optStr(body.succession_date ?? body.successionDate),
      dateOfDeath: optStr(body.date_of_death ?? body.dateOfDeath),
      phone: optStr(body.phone),
      alternatePhone: optStr(body.alternate_phone ?? body.alternatePhone),
      email: optStr(body.email),
      addressLine1: optStr(body.address_line1 ?? body.addressLine1),
      village: optStr(body.village),
      postOffice: optStr(body.post_office ?? body.postOffice),
      policeStation: optStr(body.police_station ?? body.policeStation),
      upazila: optStr(body.upazila),
      district: optStr(body.district),
      postalCode: optStr(body.postal_code ?? body.postalCode),
      bankName: optStr(body.bank_name ?? body.bankName),
      bankBranch: optStr(body.bank_branch ?? body.bankBranch),
      bankAccountName: optStr(body.bank_account_name ?? body.bankAccountName),
      bankAccountNo: optStr(body.bank_account_no ?? body.bankAccountNo),
      routingNumber: optStr(body.routing_number ?? body.routingNumber),
      mfsProvider: optStr(body.mfs_provider ?? body.mfsProvider),
      mfsNumber: optStr(body.mfs_number ?? body.mfsNumber),
      notes: optStr(body.notes),
      isActive:
        body.is_active === undefined && body.isActive === undefined
          ? true
          : Boolean(body.is_active ?? body.isActive),
    });
  },

  updateOwner(user: SessionUser, id: number, body: RawBody) {
    const activeVal = body.isActive ?? body.is_active;
    return LandService.updateOwner(user, id, {
      isActive: activeVal !== undefined ? Boolean(activeVal) : undefined,
    });
  },

  deleteOwner(user: SessionUser, id: number) {
    return LandService.deleteOwner(user, id);
  },

  // ---------------- Proposals ----------------
  listProposals() {
    return LandService.listProposals();
  },

  createProposal(user: SessionUser, body: RawBody) {
    return LandService.createProposal(user, {
      parcelId: Number(body.parcelId),
      proposalDate: reqStr(body.proposalDate),
      ratePerKatha: Number(body.ratePerKatha),
      totalValue: Number(body.totalValue),
      status: reqStr(body.status, "submitted"),
      remarks: optStr(body.remarks),
    });
  },

  updateProposal(user: SessionUser, id: number, body: RawBody) {
    return LandService.updateProposal(user, id, {
      status: reqStr(body.status),
    });
  },

  deleteProposal(user: SessionUser, id: number) {
    return LandService.deleteProposal(user, id);
  },

  // ---------------- Agreements ----------------
  listAgreements() {
    return LandService.listAgreements();
  },

  createAgreement(user: SessionUser, body: RawBody) {
    return LandService.createAgreement(user, {
      parcelId: Number(body.parcelId),
      ownerId: optNum(body.ownerId),
      type: reqStr(body.type, "sale_agreement"),
      status: reqStr(body.status, "active"),
      agreementDate: reqStr(body.agreementDate),
      expiryDate: optStr(body.expiryDate),
      agreedPrice: Number(body.agreedPrice),
      advanceAmount: Number(body.advanceAmount ?? 0),
      advanceSettled: Boolean(body.advanceSettled),
      notes: optStr(body.notes),
    });
  },

  updateAgreement(user: SessionUser, id: number, body: RawBody) {
    return LandService.updateAgreement(user, id, {
      status: typeof body.status === "string" ? body.status : undefined,
      advanceSettled:
        typeof body.advanceSettled === "boolean" ? body.advanceSettled : undefined,
    });
  },

  deleteAgreement(user: SessionUser, id: number) {
    return LandService.deleteAgreement(user, id);
  },

  // ---------------- Payments ----------------
  listPayments() {
    return LandService.listPayments();
  },

  createPayment(user: SessionUser, body: RawBody) {
    return LandService.createPayment(user, {
      parcelId: Number(body.parcelId),
      ownerId: optNum(body.ownerId),
      agreementId: optNum(body.agreementId),
      type: reqStr(body.type, "advance"),
      paymentDate: reqStr(body.paymentDate ?? body.payment_date),
      grossAmount: Number(body.grossAmount ?? body.gross_amount),
      taxDeducted: Number(body.taxDeducted ?? body.tax_deducted ?? 0),
      otherDeduction: Number(body.otherDeduction ?? body.other_deduction ?? 0),
      method: reqStr(body.method, "bank_transfer"),
      accountName: optStr(body.accountName ?? body.account_name),
      bankName: optStr(body.bankName ?? body.bank_name),
      chequeNo: optStr(body.chequeNo ?? body.cheque_no),
      chequeDate: optStr(body.chequeDate ?? body.cheque_date),
      transactionReference: optStr(
        body.transactionReference ?? body.transaction_reference
      ),
      narration: optStr(body.narration),
      status: reqStr(body.status, "posted"),
    });
  },

  updatePayment(user: SessionUser, id: number, body: RawBody) {
    return LandService.updatePayment(user, id, {
      status: reqStr(body.status),
    });
  },

  deletePayment(user: SessionUser, id: number) {
    return LandService.deletePayment(user, id);
  },
};
