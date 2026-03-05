'use client';

import React, { Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { format, isValid } from 'date-fns';
import { es } from 'date-fns/locale';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { useToast } from '@/components/ui/toast';
import { AlertTriangle, ArrowUp, ArrowDown, Minus, Download, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { inventoryItems } from '@/lib/placeholder-data';
import type { Menu, MenuItem, DailyClosingItem } from '@/lib/types';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useCollection, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, Timestamp, doc } from 'firebase/firestore';
import { ClosingForm } from '@/components/daily-closing/closing-form';
import { useUser } from '@/firebase/auth/use-user';
import { updateDocumentNonBlocking } from '@/firebase/firestore-operations';


type IngredientConsumption = {
  ingredientId: string;
  ingredientName: string;
  unit: string;
  planned: number;
  executed: number;
  difference: number;
};

function ReportContent() {
  const searchParams = useSearchParams();
  const [isEditFormOpen, setEditFormOpen] = React.useState(false);
  const dateParam = searchParams.get('date');
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user: authUser } = useUser();

  const closingDate = useMemo(() => {
    if (!dateParam) return null;
    const date = new Date(dateParam);
    // Adjust for timezone offset that might be added by new Date()
    date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
    return isValid(date) ? date : null;
  }, [dateParam]);

  const closingsQuery = useMemoFirebase(() => {
    if (!firestore || !closingDate) return null;
    const start = Timestamp.fromDate(closingDate);
    const end = Timestamp.fromDate(new Date(closingDate.getTime() + 24 * 60 * 60 * 1000 - 1));
    return query(
      collection(firestore, 'dailyClosings'),
      where('date', '>=', start),
      where('date', '<=', end)
    );
  }, [firestore, closingDate]);

  const { data: closings, isLoading: isLoadingClosings, error: closingsError } = useCollection<any>(closingsQuery);
  const selectedClosing = closings?.[0];

  // Try to get menu by ID first
  const plannedMenuByIdRef = useMemoFirebase(() => {
    if (!firestore || !selectedClosing?.plannedMenuId) return null;
    return doc(firestore, 'menus', selectedClosing.plannedMenuId);
  }, [firestore, selectedClosing?.plannedMenuId]);

  const { data: menuById, isLoading: isLoadingMenuById, error: menuByIdError } = useDoc<Menu>(plannedMenuByIdRef);

  // Fallback: search by date if ID is missing or not found
  const fallbackMenuQuery = useMemoFirebase(() => {
    if (!firestore || !closingDate || (selectedClosing?.plannedMenuId && menuById)) return null;
    const start = Timestamp.fromDate(closingDate);
    const end = Timestamp.fromDate(new Date(closingDate.getTime() + 24 * 60 * 60 * 1000 - 1));
    return query(
      collection(firestore, 'menus'),
      where('date', '>=', start),
      where('date', '<=', end)
    );
  }, [firestore, closingDate, selectedClosing?.plannedMenuId, menuById]);

  const { data: fallbackMenus, isLoading: isLoadingFallback } = useCollection<Menu>(fallbackMenuQuery);

  const plannedMenu = menuById || (fallbackMenus && fallbackMenus.length > 0 ? fallbackMenus[0] : null);

  const isLoadingMenu = (selectedClosing && !plannedMenu && (isLoadingMenuById || isLoadingFallback));
  const menuError = menuByIdError || (selectedClosing && !plannedMenu && !isLoadingMenu ? { message: 'No se encontró el menú planificado para esta fecha.' } : null);

  const isLoading = isLoadingClosings || isLoadingMenu;

  const { ingredientConsumption, plannedOnlyItems, executedOnlyItems } = useMemo(() => {
    if (!plannedMenu || !selectedClosing) {
      return { ingredientConsumption: [], plannedOnlyItems: [], executedOnlyItems: [] };
    }

    const { executedPax, executedItems } = selectedClosing;
    const plannedPax = plannedMenu.pax;

    const consumptionMap = new Map<string, IngredientConsumption>();

    const processIngredients = (menuItems: (MenuItem[] | DailyClosingItem[]), pax: number, type: 'planned' | 'executed') => {
      for (const item of menuItems) {
        // If we are processing executed items and they have custom ingredients, use them
        if (type === 'executed' && 'ingredients' in item && item.ingredients && item.ingredients.length > 0) {
          for (const ing of (item as any).ingredients) {
            let entry = consumptionMap.get(ing.inventoryItemId);
            if (!entry) {
              entry = {
                ingredientId: ing.inventoryItemId,
                ingredientName: ing.name,
                unit: ing.unit,
                planned: 0,
                executed: 0,
                difference: 0
              };
            }
            entry.executed += ing.executedQuantity;
            consumptionMap.set(ing.inventoryItemId, entry);
          }
          continue;
        }

        const fullMenuItem = plannedMenu.items.find(i => i.name === item.name);
        if (!fullMenuItem || !fullMenuItem.ingredients) continue;

        for (const ingredient of fullMenuItem.ingredients) {
          const invItem = inventoryItems.find(i => i.id === ingredient.inventoryItemId);
          if (!invItem) continue;

          const rawWaste = ingredient.wasteFactor || 0;
          // Normalize: if >= 1, treat as percentage (e.g. 10 -> 0.1)
          const wasteFactor = rawWaste >= 1 ? rawWaste / 100 : rawWaste;
          const safeWaste = Math.max(0, Math.min(0.99, wasteFactor));

          const grossQuantity = ingredient.quantity / (1 - safeWaste);
          const totalQuantity = grossQuantity * pax;

          let entry = consumptionMap.get(invItem.id);
          if (!entry) {
            entry = {
              ingredientId: invItem.id,
              ingredientName: invItem.nombre,
              unit: invItem.unidadReceta,
              planned: 0,
              executed: 0,
              difference: 0
            };
          }
          entry[type] += totalQuantity;
          consumptionMap.set(invItem.id, entry);
        }
      }
    };

    processIngredients(plannedMenu.items, plannedPax, 'planned');
    processIngredients(executedItems, executedPax, 'executed');

    for (const entry of consumptionMap.values()) {
      entry.difference = entry.executed - entry.planned;
    }

    return {
      ingredientConsumption: Array.from(consumptionMap.values()),
      plannedOnlyItems: plannedMenu.items.filter(pItem => !(executedItems || []).some((eItem: any) => eItem.name === pItem.name)),
      executedOnlyItems: (executedItems || []).filter((eItem: any) => !plannedMenu.items.some(pItem => pItem.name === eItem.name))
    };

  }, [plannedMenu, selectedClosing]);


  if (isLoadingClosings) {
    return <div className="flex items-center justify-center h-full p-8"><p>Cargando datos de cierre...</p></div>;
  }

  if (closingsError) {
    return (
      <div className="p-8 text-center text-destructive">
        <AlertTriangle className="h-10 w-10 mx-auto mb-2" />
        <p>Error al cargar cierres: {closingsError.message}</p>
      </div>
    );
  }

  if (selectedClosing && isLoadingMenu) {
    return <div className="flex items-center justify-center h-full p-8"><p>Cargando menú planificado...</p></div>;
  }

  if (menuError) {
    return (
      <div className="p-8 text-center text-destructive">
        <AlertTriangle className="h-10 w-10 mx-auto mb-2" />
        <p>Error al cargar menú: {menuError.message}</p>
      </div>
    );
  }

  if (!closingDate) {
    return <div className="p-8 text-center text-muted-foreground">Fecha no especificada.</div>;
  }

  if (!selectedClosing || !plannedMenu) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold">No se encontraron datos de cierre</h2>
        <p className="text-muted-foreground max-w-md mt-2">
          No pudimos encontrar un cierre diario o un menú planificado para la fecha seleccionada ({format(closingDate, 'PPP', { locale: es })}).
        </p>
        <Button asChild className="mt-4">
          <Link href="/daily-closing">Volver a Cierres</Link>
        </Button>
      </div>
    );
  }

  const { executedPax, executedItems, variations } = selectedClosing;
  const plannedPax = plannedMenu.pax;

  const handleExport = () => {
    if (!plannedMenu || !selectedClosing || !closingDate) return;

    const data = ingredientConsumption.map(ing => ({
      'Fecha': format(closingDate, 'dd/MM/yyyy'),
      'Ingrediente': ing.ingredientName,
      'Unidad': ing.unit,
      'Planificado': parseFloat(ing.planned.toFixed(2)),
      'Ejecutado': parseFloat(ing.executed.toFixed(2)),
      'Desviación': parseFloat(ing.difference.toFixed(2))
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Cierre");

    // Adjust column widths
    const wscols = [
      { wch: 12 }, // Fecha
      { wch: 30 }, // Ingrediente
      { wch: 8 },  // Unidad
      { wch: 12 }, // Planificado
      { wch: 12 }, // Ejecutado
      { wch: 12 }  // Desviación
    ];
    worksheet['!cols'] = wscols;

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(blob, `Cierre_${format(closingDate, 'yyyy-MM-dd')}.xlsx`);
  };

  const handleUpdateClosing = async (data: any) => {
    if (!firestore || !selectedClosing?.id) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo identificar el registro para actualizar.' });
      return;
    }

    try {
      const docRef = doc(firestore, 'dailyClosings', selectedClosing.id);
      await updateDocumentNonBlocking(docRef, data);

      toast({
        title: 'Cierre Actualizado',
        description: 'Los cambios se han guardado correctamente.',
      });
      setEditFormOpen(false);
    } catch (error) {
      console.error('Error updating closing:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron guardar los cambios.' });
    }
  };

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-headline text-2xl font-bold md:text-3xl">
            Reporte Comparativo de Cierre
          </h1>
          <p className="text-muted-foreground">
            Análisis de desviaciones para el {format(closingDate, 'EEEE, dd MMMM, yyyy', { locale: es })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setEditFormOpen(true)} className="gap-2">
            <Edit className="h-4 w-4" />
            Editar Cierre
          </Button>
          <Button onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Exportar a Excel
          </Button>
          <Button asChild variant="outline">
            <Link href="/daily-closing">Volver</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Resumen de Desviaciones</CardTitle>
            <CardDescription>Diferencias clave entre lo planificado y lo ejecutado.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-md">
              <span className="font-medium">PAX (Comensales)</span>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Plan: {plannedPax}</span>
                <span className="font-bold">Ejec: {executedPax}</span>
                <Badge variant={executedPax > plannedPax ? 'destructive' : 'secondary'}>
                  {((executedPax - plannedPax) / plannedPax * 100).toFixed(1)}%
                </Badge>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-2">Platos No Servidos (Planificados)</h4>
              {plannedOnlyItems.length > 0 ? (
                plannedOnlyItems.map(item => <Badge key={item.id} variant="destructive" className="mr-1">{item.name}</Badge>)
              ) : <p className="text-xs text-muted-foreground">Ninguno</p>}
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-2">Platos Extras (No Planificados)</h4>
              {executedOnlyItems.length > 0 ? (
                executedOnlyItems.map((item: any) => <Badge key={item.name} variant="secondary" className="mr-1">{item.name}</Badge>)
              ) : <p className="text-xs text-muted-foreground">Ninguno</p>}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Observaciones del Cierre</CardTitle>
            <CardDescription>Notas sobre las variaciones ocurridas durante el servicio.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground italic">"{variations}"</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Análisis de Consumo de Ingredientes</CardTitle>
          <CardDescription>Comparación detallada del consumo de materia prima planificado vs. el real.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ingrediente</TableHead>
                <TableHead className="text-right">Planificado</TableHead>
                <TableHead className="text-right">Ejecutado</TableHead>
                <TableHead className="text-right">Desviación</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ingredientConsumption.map(ing => (
                <TableRow key={ing.ingredientId} className={cn(ing.difference > 0 ? 'bg-red-50 dark:bg-red-900/20' : ing.difference < 0 ? 'bg-green-50 dark:bg-green-900/20' : '')}>
                  <TableCell className="font-medium">{ing.ingredientName}</TableCell>
                  <TableCell className="text-right font-mono text-xs">{ing.planned.toFixed(2)} {ing.unit}</TableCell>
                  <TableCell className="text-right font-mono text-xs">{ing.executed.toFixed(2)} {ing.unit}</TableCell>
                  <TableCell className={cn("text-right font-mono font-bold text-xs", ing.difference > 0 ? 'text-red-600' : ing.difference < 0 ? 'text-green-600' : 'text-muted-foreground')}>
                    <div className="flex items-center justify-end gap-2">
                      {ing.difference > 0.01 ? <ArrowUp className="h-4 w-4" /> : ing.difference < -0.01 ? <ArrowDown className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
                      <span>{ing.difference.toFixed(2)} {ing.unit}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <ClosingForm
        isOpen={isEditFormOpen}
        onOpenChange={setEditFormOpen}
        plannedMenu={plannedMenu}
        existingClosing={selectedClosing}
        onSave={handleUpdateClosing}
      />
    </main>
  );
}


export default function DailyClosingReportPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-full"><p>Inicializando reporte...</p></div>}>
      <ReportContent />
    </Suspense>
  );
}
