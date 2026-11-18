import { SalesService } from "@/server/services/sales.service";
import type { SessionUser } from "@/lib/auth";

export const SalesController = {
  create(user: SessionUser, kind: string, body: Record<string, unknown>) {
    return SalesService.createRecord(user, kind, body);
  },
  update(user: SessionUser, kind: string, id: number, body: Record<string, unknown>) {
    return SalesService.updateRecord(user, kind, id, body);
  },
  remove(user: SessionUser, kind: string, id: number) {
    return SalesService.deleteRecord(user, kind, id);
  },
};
