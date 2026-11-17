import { prisma } from "@/lib/prisma";
import {
  convertToSqft,
  PAYMENT_TYPES,
  PIPELINE_STAGES,
  sqftToKatha,
} from "@/lib/land";
import { formatCode } from "@/lib/csv";
import { allocateSequenceCode, recordAudit } from "@/lib/tier0";
import { ServiceError } from "@/server/http/api-handler";
import type { SessionUser } from "@/lib/auth";
import type {
  CreateAgreementDto,
  CreateOwnerDto,
  CreateParcelDto,
  CreatePaymentDto,
  CreateProposalDto,
  UpdateAgreementDto,
  UpdateOwnerDto,
  UpdateParcelDto,
  UpdatePaymentDto,
  UpdateProposalDto,
} from "@/server/dto/land.dto";

export const LandService = {
  // ---------------- Parcels ----------------
  async listParcels() {
    return prisma.landParcel.findMany({
      include: { project: true },
      orderBy: { id: "desc" },
    });
  },

  async listBankParcels() {
    return prisma.landParcel.findMany({
      where: { stage: { in: ["owned", "registered"] } },
      include: { project: true },
      orderBy: { id: "desc" },
    });
  },

  async getParcelsPageData(filters: {
    search?: string;
    stage?: string;
    land_type?: string;
    district?: string;
    project_id?: string;
    view?: string;
  }) {
    const search = (filters.search ?? "").trim();
    const stage = (filters.stage ?? "").trim();
    const land_type = (filters.land_type ?? "").trim();
    const district = (filters.district ?? "").trim();
    const project_id = (filters.project_id ?? "").trim();
    const view = (filters.view ?? "").trim();

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { code: { contains: search } },
        { title: { contains: search } },
        { mouza: { contains: search } },
        { district: { contains: search } },
      ];
    }
    if (stage) {
      where.stage = stage;
    } else if (view === "bank") {
      where.stage = { in: ["owned", "registered"] };
    } else if (view === "pipeline") {
      where.stage = { notIn: ["owned", "rejected", "dropped"] };
    }
    if (land_type) where.landType = land_type;
    if (district) where.district = { contains: district };
    if (project_id) where.projectId = Number(project_id);

    const [parcels, allParcelsForCounts, projects] = await Promise.all([
      prisma.landParcel.findMany({
        where,
        include: { project: { select: { id: true, name: true } } },
        orderBy: { id: "desc" },
      }),
      prisma.landParcel.groupBy({
        by: ["stage"],
        _count: { _all: true },
      }),
      prisma.project.findMany({
        orderBy: { id: "asc" },
        select: { id: true, name: true },
      }),
    ]);

    const stageCounts: Record<string, number> = {};
    for (const s of PIPELINE_STAGES) stageCounts[s.value] = 0;
    for (const row of allParcelsForCounts) {
      stageCounts[row.stage] = row._count._all;
    }

    return {
      parcels,
      stageCounts,
      projects,
      filters: { search, stage, land_type, district, project_id, view },
    };
  },

  async getParcelDetailPageData(id: number) {
    const [parcel, projects] = await Promise.all([
      prisma.landParcel.findUnique({
        where: { id },
        include: {
          project: { select: { id: true, name: true } },
          proposals: { orderBy: { id: "desc" } },
          agreements: {
            include: { owner: { select: { id: true, name: true } } },
            orderBy: { id: "desc" },
          },
          payments: {
            include: { owner: { select: { id: true, name: true } } },
            orderBy: { id: "desc" },
          },
        },
      }),
      prisma.project.findMany({
        orderBy: { id: "asc" },
        select: { id: true, name: true },
      }),
    ]);

    if (!parcel) return null;
    return { parcel, projects };
  },

  async getLandBankPageData(filters: {
    search?: string;
    land_type?: string;
    district?: string;
    project_id?: string;
  }) {
    const search = (filters.search ?? "").trim();
    const land_type = (filters.land_type ?? "").trim();
    const district = (filters.district ?? "").trim();
    const project_id = (filters.project_id ?? "").trim();

    const where: Record<string, unknown> = {
      stage: { in: ["owned", "registered"] },
    };
    if (land_type) where.landType = land_type;
    if (district) where.district = { contains: district };
    if (project_id) where.projectId = Number(project_id);
    if (search) {
      where.OR = [
        { code: { contains: search } },
        { title: { contains: search } },
        { mouza: { contains: search } },
        { district: { contains: search } },
      ];
    }

    const [parcels, allOwned, projects] = await Promise.all([
      prisma.landParcel.findMany({
        where,
        include: { project: { select: { id: true, name: true } } },
        orderBy: { id: "desc" },
      }),
      prisma.landParcel.findMany({
        where: { stage: { in: ["owned", "registered"] } },
        select: { areaSqft: true, bookValue: true, projectId: true },
      }),
      prisma.project.findMany({
        orderBy: { id: "asc" },
        select: { id: true, name: true },
      }),
    ]);

    const totalSqft = allOwned.reduce((sum, p) => sum + p.areaSqft, 0);
    const totalBookValue = allOwned.reduce((sum, p) => sum + p.bookValue, 0);
    const unallocatedCount = allOwned.filter((p) => !p.projectId).length;

    return {
      parcels,
      stats: {
        ownedCount: allOwned.length,
        totalKatha: sqftToKatha(totalSqft),
        totalSqft,
        totalBookValue,
        unallocatedCount,
      },
      projects,
      filters: { search, land_type, district, project_id },
    };
  },

  async getParcel(id: number) {
    const parcel = await prisma.landParcel.findUnique({
      where: { id },
      include: {
        project: true,
        proposals: { orderBy: { id: "desc" } },
        agreements: { include: { owner: true }, orderBy: { id: "desc" } },
        payments: { include: { owner: true }, orderBy: { id: "desc" } },
      },
    });
    if (!parcel) throw new ServiceError(404, "Not found");
    return parcel;
  },

  async createParcel(user: SessionUser, dto: CreateParcelDto) {
    if (
      !dto.mouza ||
      !dto.district ||
      !dto.landType ||
      !Number.isFinite(dto.areaValue) ||
      dto.areaValue <= 0
    ) {
      throw new ServiceError(400, "Mouza, District, Land Type, and positive Area are required.");
    }
    if (dto.source === "broker" && !dto.brokerName) {
      throw new ServiceError(400, "Broker Name is required when Source is Broker / agent.");
    }

    const code = await allocateSequenceCode("land_parcel", "LAND");
    const areaSqft = convertToSqft(dto.areaValue, dto.areaUnit);

    const parcel = await prisma.landParcel.create({
      data: {
        code,
        title: dto.title,
        landType: dto.landType,
        stage: "prospect",
        mouza: dto.mouza,
        jlNo: dto.jlNo,
        mouzaMapSheet: dto.mouzaMapSheet,
        division: dto.division,
        district: dto.district,
        upazila: dto.upazila,
        unionWard: dto.unionWard,
        policeStation: dto.policeStation,
        road: dto.road,
        postalCode: dto.postalCode,
        addressLine: dto.addressLine,
        latitude: dto.latitude,
        longitude: dto.longitude,
        areaValue: dto.areaValue,
        areaUnit: dto.areaUnit,
        areaSqft,
        boundaryNorth: dto.boundaryNorth,
        boundarySouth: dto.boundarySouth,
        boundaryEast: dto.boundaryEast,
        boundaryWest: dto.boundaryWest,
        frontageFeet: dto.frontageFeet,
        roadWidthFeet: dto.roadWidthFeet,
        currentUse: dto.currentUse,
        isCornerPlot: dto.isCornerPlot,
        source: dto.source,
        brokerName: dto.brokerName,
        brokerContact: dto.brokerContact,
        remarks: dto.remarks,
      },
    });

    await recordAudit(user.name, "created", parcel.title || parcel.code, "LandParcel", ["code", "mouza", "district", "landType"], user.id);
    return parcel;
  },

  async updateParcel(user: SessionUser, id: number, dto: UpdateParcelDto) {
    const data: Record<string, unknown> = {};
    if (dto.stage !== undefined) data.stage = dto.stage;
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.remarks !== undefined) data.remarks = dto.remarks;
    if (dto.projectId !== undefined) data.projectId = dto.projectId;
    if (dto.areaValue !== undefined && dto.areaUnit !== undefined) {
      if (Number.isFinite(dto.areaValue) && dto.areaValue > 0) {
        data.areaValue = dto.areaValue;
        data.areaUnit = dto.areaUnit;
        data.areaSqft = convertToSqft(dto.areaValue, dto.areaUnit);
      }
    }

    const parcel = await prisma.landParcel.update({
      where: { id },
      data,
      include: { project: true },
    });

    await recordAudit(user.name, "updated", parcel.title || parcel.code, "LandParcel", Object.keys(data), user.id);
    return parcel;
  },

  async deleteParcel(user: SessionUser, id: number) {
    const deleted = await prisma.landParcel.delete({ where: { id } });
    await recordAudit(user.name, "deleted", deleted.title || deleted.code, "LandParcel", ["id"], user.id);
    return deleted;
  },

  // ---------------- Owners ----------------
  async listOwners() {
    return prisma.landOwner.findMany({ orderBy: { id: "desc" } });
  },

  async getOwnersPageData(filters: {
    search?: string;
    kind?: string;
    district?: string;
    status?: string;
    flag?: string;
  }) {
    const search = (filters.search ?? "").trim();
    const kind = (filters.kind ?? "").trim();
    const district = (filters.district ?? "").trim();
    const status = (filters.status ?? "").trim();
    const flag = (filters.flag ?? "").trim();

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { nid: { contains: search } },
        { phone: { contains: search } },
        { code: { contains: search } },
      ];
    }
    if (kind) where.kind = kind;
    if (district) where.district = { contains: district };
    if (status === "active") where.isActive = true;
    if (status === "inactive") where.isActive = false;

    let owners = await prisma.landOwner.findMany({
      where,
      orderBy: { id: "desc" },
    });

    if (flag === "no_payout") {
      owners = owners.filter((o) => !o.bankAccountNo && !o.mfsNumber);
    } else if (flag === "blocked") {
      owners = owners.filter(
        (o) =>
          (o.isMinor && !o.guardianName) ||
          (o.isDeceased && !o.successionCertificateNo)
      );
    }

    return {
      owners,
      filters: { search, kind, district, status, flag },
    };
  },

  async createOwner(user: SessionUser, dto: CreateOwnerDto) {
    if (!dto.name) throw new ServiceError(400, "Full Name is required.");
    if ((dto.kind === "individual" || dto.kind === "heir_group") && !dto.fatherName) {
      throw new ServiceError(400, "Father's Name is required for individuals and heirs.");
    }
    if ((dto.kind === "company" || dto.kind === "trust") && !dto.registrationNumber) {
      throw new ServiceError(400, "Registration / Incorporation No. is required.");
    }
    if (dto.isMinor && !dto.guardianName) {
      throw new ServiceError(400, "Guardian Name is required when owner is a minor.");
    }
    if ((dto.isDeceased || dto.kind === "heir_group") && !dto.successionCertificateNo) {
      throw new ServiceError(400, "Succession Certificate No. is required.");
    }

    if (dto.nid) {
      const existing = await prisma.landOwner.findUnique({ where: { nid: dto.nid } });
      if (existing) {
        throw new ServiceError(409, `A landowner with NID ${dto.nid} is already filed (${existing.code}).`);
      }
    }

    const code = await allocateSequenceCode("land_owner", "OWN");

    const owner = await prisma.landOwner.create({
      data: {
        code,
        kind: dto.kind,
        name: dto.name,
        nid: dto.nid,
        tin: dto.tin,
        fatherName: dto.fatherName,
        motherName: dto.motherName,
        spouseName: dto.spouseName,
        registrationNumber: dto.registrationNumber,
        dateOfBirth: dto.dateOfBirth,
        isMinor: dto.isMinor,
        isDeceased: dto.isDeceased,
        guardianName: dto.guardianName,
        guardianNid: dto.guardianNid,
        guardianRelation: dto.guardianRelation,
        successionCertificateNo: dto.successionCertificateNo,
        successionDate: dto.successionDate,
        dateOfDeath: dto.dateOfDeath,
        phone: dto.phone,
        alternatePhone: dto.alternatePhone,
        email: dto.email,
        addressLine1: dto.addressLine1,
        village: dto.village,
        postOffice: dto.postOffice,
        policeStation: dto.policeStation,
        upazila: dto.upazila,
        district: dto.district,
        postalCode: dto.postalCode,
        bankName: dto.bankName,
        bankBranch: dto.bankBranch,
        bankAccountName: dto.bankAccountName,
        bankAccountNo: dto.bankAccountNo,
        routingNumber: dto.routingNumber,
        mfsProvider: dto.mfsProvider,
        mfsNumber: dto.mfsNumber,
        notes: dto.notes,
        isActive: dto.isActive,
      },
    });

    await recordAudit(user.name, "created", owner.name, "LandOwner", ["code", "kind", "name"], user.id);
    return owner;
  },

  async updateOwner(user: SessionUser, id: number, dto: UpdateOwnerDto) {
    const data: Record<string, unknown> = {};
    if (typeof dto.isActive === "boolean") data.isActive = dto.isActive;
    const owner = await prisma.landOwner.update({ where: { id }, data });
    await recordAudit(user.name, "updated", owner.name, "LandOwner", Object.keys(data), user.id);
    return owner;
  },

  async deleteOwner(user: SessionUser, id: number) {
    const deleted = await prisma.landOwner.delete({ where: { id } });
    await recordAudit(user.name, "deleted", deleted.name, "LandOwner", ["id"], user.id);
    return deleted;
  },

  // ---------------- Proposals ----------------
  async listProposals() {
    return prisma.landProposal.findMany({
      include: { parcel: true },
      orderBy: { id: "desc" },
    });
  },

  async getProposalsPageData(filters: {
    from?: string;
    to?: string;
    search?: string;
    status?: string;
  }) {
    const from = (filters.from ?? "").trim();
    const to = (filters.to ?? "").trim();
    const search = (filters.search ?? "").trim();
    const status = (filters.status ?? "").trim();

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (from || to) {
      where.proposalDate = {
        ...(from ? { gte: from } : {}),
        ...(to ? { lte: to } : {}),
      };
    }
    if (search) {
      where.OR = [
        { code: { contains: search } },
        { parcel: { code: { contains: search } } },
        { parcel: { mouza: { contains: search } } },
        { parcel: { title: { contains: search } } },
      ];
    }

    const [proposals, parcels] = await Promise.all([
      prisma.landProposal.findMany({
        where,
        include: {
          parcel: {
            select: { id: true, code: true, title: true, mouza: true, areaSqft: true },
          },
        },
        orderBy: { id: "desc" },
      }),
      prisma.landParcel.findMany({
        orderBy: { id: "desc" },
        select: { id: true, code: true, title: true, mouza: true, areaSqft: true },
      }),
    ]);

    return {
      proposals,
      parcels,
      filters: { from, to, search, status },
    };
  },

  async createProposal(user: SessionUser, dto: CreateProposalDto) {
    if (!dto.parcelId || !dto.proposalDate || !Number.isFinite(dto.totalValue) || dto.totalValue <= 0) {
      throw new ServiceError(400, "Land parcel, proposal date, and positive total value are required.");
    }

    const last = await prisma.landProposal.findFirst({ orderBy: { id: "desc" }, select: { id: true } });
    const code = formatCode("PRP", (last?.id ?? 0) + 1);

    const proposal = await prisma.landProposal.create({
      data: {
        code,
        parcelId: dto.parcelId,
        proposalDate: dto.proposalDate,
        ratePerKatha: Number.isFinite(dto.ratePerKatha) ? dto.ratePerKatha : 0,
        totalValue: dto.totalValue,
        status: dto.status,
        remarks: dto.remarks,
      },
      include: { parcel: true },
    });

    if (dto.status === "approved") {
      await prisma.landParcel.update({ where: { id: dto.parcelId }, data: { stage: "proposal_approved" } });
    } else if (dto.status === "submitted" || dto.status === "under_review") {
      await prisma.landParcel.update({ where: { id: dto.parcelId }, data: { stage: "proposal_submitted" } });
    }

    await recordAudit(user.name, "created", proposal.code, "LandProposal", ["parcelId", "totalValue"], user.id);
    return proposal;
  },

  async updateProposal(user: SessionUser, id: number, dto: UpdateProposalDto) {
    const proposal = await prisma.landProposal.update({
      where: { id },
      data: { status: dto.status },
    });

    if (dto.status === "approved") {
      await prisma.landParcel.update({ where: { id: proposal.parcelId }, data: { stage: "proposal_approved" } });
    } else if (dto.status === "submitted") {
      await prisma.landParcel.update({ where: { id: proposal.parcelId }, data: { stage: "proposal_submitted" } });
    }

    await recordAudit(user.name, "updated", proposal.code, "LandProposal", ["status"], user.id);
    return proposal;
  },

  async deleteProposal(user: SessionUser, id: number) {
    const deleted = await prisma.landProposal.delete({ where: { id } });
    await recordAudit(user.name, "deleted", deleted.code, "LandProposal", ["id"], user.id);
    return deleted;
  },

  // ---------------- Agreements ----------------
  async listAgreements() {
    return prisma.landAgreement.findMany({
      include: { parcel: true, owner: true },
      orderBy: { id: "desc" },
    });
  },

  async getAgreementsPageData(filters: {
    from?: string;
    to?: string;
    search?: string;
    status?: string;
    type?: string;
    flag?: string;
  }) {
    const from = (filters.from ?? "").trim();
    const to = (filters.to ?? "").trim();
    const search = (filters.search ?? "").trim();
    const status = (filters.status ?? "").trim();
    const type = (filters.type ?? "").trim();
    const flag = (filters.flag ?? "").trim();

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (type) where.type = type;
    if (from || to) {
      where.agreementDate = {
        ...(from ? { gte: from } : {}),
        ...(to ? { lte: to } : {}),
      };
    }
    if (flag === "unsettled_advance") {
      where.advanceAmount = { gt: 0 };
      where.advanceSettled = false;
    }
    if (search) {
      where.OR = [
        { code: { contains: search } },
        { parcel: { code: { contains: search } } },
        { parcel: { mouza: { contains: search } } },
        { owner: { name: { contains: search } } },
      ];
    }

    const [agreements, parcels, owners] = await Promise.all([
      prisma.landAgreement.findMany({
        where,
        include: {
          parcel: { select: { id: true, code: true, title: true, mouza: true } },
          owner: { select: { id: true, code: true, name: true } },
        },
        orderBy: { id: "desc" },
      }),
      prisma.landParcel.findMany({
        orderBy: { id: "desc" },
        select: { id: true, code: true, title: true, mouza: true },
      }),
      prisma.landOwner.findMany({
        orderBy: { id: "desc" },
        select: { id: true, code: true, name: true },
      }),
    ]);

    return {
      agreements,
      parcels,
      owners,
      filters: { from, to, search, status, type, flag },
    };
  },

  async createAgreement(user: SessionUser, dto: CreateAgreementDto) {
    if (
      !dto.parcelId ||
      !dto.agreementDate ||
      !Number.isFinite(dto.agreedPrice) ||
      dto.agreedPrice <= 0
    ) {
      throw new ServiceError(400, "Land parcel, agreement date, and positive agreed price are required.");
    }

    const last = await prisma.landAgreement.findFirst({ orderBy: { id: "desc" }, select: { id: true } });
    const code = formatCode("AGR", (last?.id ?? 0) + 1);

    const agreement = await prisma.landAgreement.create({
      data: {
        code,
        parcelId: dto.parcelId,
        ownerId: dto.ownerId,
        type: dto.type,
        status: dto.status,
        agreementDate: dto.agreementDate,
        expiryDate: dto.expiryDate,
        agreedPrice: dto.agreedPrice,
        advanceAmount: Number.isFinite(dto.advanceAmount) ? dto.advanceAmount : 0,
        advanceSettled: dto.advanceSettled,
        notes: dto.notes,
      },
      include: { parcel: true, owner: true },
    });

    if (dto.status === "active" || dto.status === "completed") {
      await prisma.landParcel.update({ where: { id: dto.parcelId }, data: { stage: "agreement_signed" } });
    }

    await recordAudit(user.name, "created", agreement.code, "LandAgreement", ["parcelId", "agreedPrice"], user.id);
    return agreement;
  },

  async updateAgreement(user: SessionUser, id: number, dto: UpdateAgreementDto) {
    const data: Record<string, unknown> = {};
    if (typeof dto.status === "string") data.status = dto.status;
    if (typeof dto.advanceSettled === "boolean") data.advanceSettled = dto.advanceSettled;

    const agreement = await prisma.landAgreement.update({ where: { id }, data });
    await recordAudit(user.name, "updated", agreement.code, "LandAgreement", Object.keys(data), user.id);
    return agreement;
  },

  async deleteAgreement(user: SessionUser, id: number) {
    const deleted = await prisma.landAgreement.delete({ where: { id } });
    await recordAudit(user.name, "deleted", deleted.code, "LandAgreement", ["id"], user.id);
    return deleted;
  },

  // ---------------- Payments ----------------
  async listPayments() {
    return prisma.landPayment.findMany({
      include: { parcel: true, owner: true, agreement: true },
      orderBy: { id: "desc" },
    });
  },

  async getPaymentsPageData(filters: {
    from?: string;
    to?: string;
    search?: string;
    direction?: string;
    type?: string;
    status?: string;
  }) {
    const from = (filters.from ?? "").trim();
    const to = (filters.to ?? "").trim();
    const search = (filters.search ?? "").trim();
    const direction = (filters.direction ?? "").trim();
    const type = (filters.type ?? "").trim();
    const status = (filters.status ?? "").trim();

    const where: Record<string, unknown> = {};
    if (direction) where.direction = direction;
    if (type) where.type = type;
    if (status) where.status = status;
    if (from || to) {
      where.paymentDate = {
        ...(from ? { gte: from } : {}),
        ...(to ? { lte: to } : {}),
      };
    }
    if (search) {
      where.OR = [
        { voucherNo: { contains: search } },
        { chequeNo: { contains: search } },
        { transactionReference: { contains: search } },
        { parcel: { code: { contains: search } } },
        { owner: { name: { contains: search } } },
      ];
    }

    const [payments, parcels, owners] = await Promise.all([
      prisma.landPayment.findMany({
        where,
        include: {
          parcel: { select: { id: true, code: true, title: true, mouza: true } },
          owner: { select: { id: true, name: true } },
        },
        orderBy: { id: "desc" },
      }),
      prisma.landParcel.findMany({
        orderBy: { id: "desc" },
        select: { id: true, code: true, title: true, mouza: true },
      }),
      prisma.landOwner.findMany({
        orderBy: { id: "desc" },
        select: { id: true, code: true, name: true },
      }),
    ]);

    return {
      payments,
      parcels,
      owners,
      filters: { from, to, search, direction, type, status },
    };
  },

  async createPayment(user: SessionUser, dto: CreatePaymentDto) {
    if (!dto.parcelId || !dto.paymentDate || !Number.isFinite(dto.grossAmount) || dto.grossAmount <= 0) {
      throw new ServiceError(400, "Land parcel, payment date, and positive gross amount are required.");
    }
    if (dto.method === "cheque" && !dto.chequeNo) {
      throw new ServiceError(400, "Cheque No. is required for cheque payments.");
    }

    const typeMeta = PAYMENT_TYPES.find((t) => t.value === dto.type);
    const direction = typeMeta?.direction ?? "payout";
    const safeTax = Number.isFinite(dto.taxDeducted) ? dto.taxDeducted : 0;
    const safeOther = Number.isFinite(dto.otherDeduction) ? dto.otherDeduction : 0;
    const netAmount = Math.max(0, Number((dto.grossAmount - safeTax - safeOther).toFixed(2)));

    const last = await prisma.landPayment.findFirst({ orderBy: { id: "desc" }, select: { id: true } });
    const voucherNo = formatCode("LPV", (last?.id ?? 0) + 1);

    const payment = await prisma.landPayment.create({
      data: {
        voucherNo,
        parcelId: dto.parcelId,
        ownerId: dto.ownerId,
        agreementId: dto.agreementId,
        direction,
        type: dto.type,
        paymentDate: dto.paymentDate,
        grossAmount: dto.grossAmount,
        taxDeducted: safeTax,
        otherDeduction: safeOther,
        netAmount,
        method: dto.method,
        accountName: dto.accountName,
        bankName: dto.bankName,
        chequeNo: dto.chequeNo,
        chequeDate: dto.chequeDate,
        transactionReference: dto.transactionReference,
        narration: dto.narration,
        status: dto.status,
      },
      include: { parcel: true, owner: true },
    });

    if (dto.status === "posted" && direction === "payout") {
      const nextStage = dto.type === "final_settlement" ? "owned" : "payment_in_progress";
      await prisma.landParcel.update({
        where: { id: dto.parcelId },
        data: { bookValue: { increment: dto.grossAmount }, stage: nextStage },
      });
    }

    await recordAudit(user.name, "created", payment.voucherNo, "LandPayment", ["parcelId", "grossAmount", "method"], user.id);
    return payment;
  },

  async updatePayment(user: SessionUser, id: number, dto: UpdatePaymentDto) {
    const existing = await prisma.landPayment.findUnique({ where: { id } });
    if (!existing) throw new ServiceError(404, "Not found");

    const payment = await prisma.landPayment.update({
      where: { id },
      data: { status: dto.status },
    });

    if (existing.status !== "posted" && dto.status === "posted" && existing.direction === "payout") {
      await prisma.landParcel.update({
        where: { id: existing.parcelId },
        data: {
          bookValue: { increment: existing.grossAmount },
          stage: existing.type === "final_settlement" ? "owned" : "payment_in_progress",
        },
      });
    }

    await recordAudit(user.name, "updated", payment.voucherNo, "LandPayment", ["status"], user.id);
    return payment;
  },

  async deletePayment(user: SessionUser, id: number) {
    const existing = await prisma.landPayment.findUnique({ where: { id } });
    if (existing && existing.status === "posted" && existing.direction === "payout") {
      await prisma.landParcel.update({
        where: { id: existing.parcelId },
        data: { bookValue: { decrement: existing.grossAmount } },
      });
    }
    await prisma.landPayment.delete({ where: { id } });
    if (existing) {
      await recordAudit(user.name, "deleted", existing.voucherNo, "LandPayment", ["id"], user.id);
    }
  },
};
