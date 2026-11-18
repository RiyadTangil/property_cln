import { EquipmentCategoriesClient } from "@/components/equipment/EquipmentCategoriesClient";
import { EquipmentService } from "@/server/services/equipment.service";

export const dynamic = "force-dynamic";

export default async function EquipmentCategoriesPage() {
  const { categories } = await EquipmentService.getCategoriesPageData();
  return <EquipmentCategoriesClient initialCategories={categories} />;
}
