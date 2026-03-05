
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { WeeklyPlan, Ingredient, InventoryItem, UnitOfMeasure, Menu } from './types';

export interface IngredientSummary {
  id: string;
  name: string;
  unit: UnitOfMeasure;
  netQuantity: number;
  grossQuantity: number;
  cost: number;
}

export function generateWeeklyPlanName(startDate: Date): string {
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);
  return `Plan del ${format(startDate, 'dd MMMM', { locale: es })} al ${format(endDate, 'dd MMMM, yyyy', { locale: es })}`;
}

export function calculateIngredientSummary(plan: WeeklyPlan, inventory: InventoryItem[]): IngredientSummary[] {
  const summary = new Map<string, IngredientSummary>();

  plan.menus.forEach(menu => {
    if (!menu) return;

    menu.items.forEach(item => {
      item.ingredients.forEach(ingredient => {
        const inventoryItem = inventory.find(inv => inv.id === ingredient.inventoryItemId);
        if (!inventoryItem) return;

        const rawWaste = ingredient.wasteFactor || 0;
        const wasteFactor = rawWaste >= 1 ? rawWaste / 100 : rawWaste;
        const safeWaste = Math.max(0, Math.min(0.99, wasteFactor));

        const netQuantityPerPax = ingredient.quantity;
        const grossQuantityPerPax = netQuantityPerPax / (1 - safeWaste);

        const totalNetQuantity = netQuantityPerPax * menu.pax;
        const totalGrossQuantity = grossQuantityPerPax * menu.pax;
        const costPerRecipeUnit = (inventoryItem.costoUnitario || 0) / (inventoryItem.factorConversion || 1);
        const cost = totalGrossQuantity * costPerRecipeUnit;

        const existing = summary.get(inventoryItem.id);
        if (existing) {
          existing.netQuantity += totalNetQuantity;
          existing.grossQuantity += totalGrossQuantity;
          existing.cost += cost;
        } else {
          summary.set(inventoryItem.id, {
            id: inventoryItem.id,
            name: inventoryItem.nombre,
            unit: inventoryItem.unidadReceta,
            netQuantity: totalNetQuantity,
            grossQuantity: totalGrossQuantity,
            cost,
          });
        }
      });
    });
  });

  return Array.from(summary.values());
}

export function exportSummaryToCSV(summary: IngredientSummary[]) {
  const headers = ['Ingrediente', 'Cantidad Neta', 'Cantidad Bruta (con Desecho)', 'Unidad', 'Costo Estimado'];
  const rows = summary.map(item => [
    item.name,
    item.netQuantity.toFixed(2),
    item.grossQuantity.toFixed(2),
    item.unit,
    `$${item.cost.toFixed(2)}`,
  ]);

  const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', 'lista_de_compras.csv');
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
