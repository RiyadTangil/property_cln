import { CrmService } from "@/server/services/crm.service";
import type { SessionUser } from "@/lib/auth";

export const CrmController = {
  create(user: SessionUser, kind: string, body: Record<string, unknown>) {
    return CrmService.createRecord(user, kind, body);
  },
  update(user: SessionUser, kind: string, id: number, body: Record<string, unknown>) {
    return CrmService.updateRecord(user, kind, id, body);
  },
  remove(user: SessionUser, kind: string, id: number) {
    return CrmService.deleteRecord(user, kind, id);
  },
};
