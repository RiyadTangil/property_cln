import { HrService } from "@/server/services/hr.service";
import type { SessionUser } from "@/lib/auth";

export const HrController = {
  create(user: SessionUser, kind: string, body: Record<string, unknown>) {
    return HrService.createRecord(user, kind, body);
  },
  update(user: SessionUser, kind: string, id: number, body: Record<string, unknown>) {
    return HrService.updateRecord(user, kind, id, body);
  },
  remove(user: SessionUser, kind: string, id: number) {
    return HrService.deleteRecord(user, kind, id);
  },
};
