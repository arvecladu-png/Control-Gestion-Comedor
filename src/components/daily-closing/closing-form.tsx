'use client';

import { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PlusCircle, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import { Separator } from '@/components/ui/separator';
import type { Menu, DailyClosing, MenuItemCategory, ExecutedIngredient, InventoryItem, MenuItem } from '@/lib/types';
import { categoryDisplay } from './category-display';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const formSchema = z.object({
  executedPax: z.coerce.number().int().min(1, 'Debe ser al menos 1 PAX'),
  variations: z.string().optional(),
  lastServiceTime: z.string().optional(),
  incidencesCount: z.coerce.number().int().min(0).default(0),
  executedItems: z.array(z.object({
    name: z.string().min(1, 'El nombre es obligatorio.'),
    category: z.string({ required_error: 'La categoría es obligatoria.' }),
    ingredients: z.array(z.object({
      inventoryItemId: z.string(),
      name: z.string(),
      executedQuantity: z.coerce.number().min(0),
      unit: z.string(),
    })).optional(),
  })).min(1, 'Debe haber al menos un plato ejecutado.'),
});

type FormValues = z.infer<typeof formSchema>;

interface ClosingFormProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (data: Omit<DailyClosing, 'closingId' | 'plannedMenuId' | 'closedBy' | 'date'>) => void;
  plannedMenu: Menu | null;
  existingClosing?: DailyClosing | null;
}

export function ClosingForm({ isOpen, onOpenChange, onSave, plannedMenu, existingClosing }: ClosingFormProps) {
  const firestore = useFirestore();
  const { data: inventoryItems } = useCollection<InventoryItem>(
    useMemoFirebase(() => query(collection(firestore, 'inventory')), [firestore])
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      executedPax: 0,
      executedItems: [{ name: '', category: '', ingredients: [] }],
      variations: '',
      lastServiceTime: '13:45',
      incidencesCount: 0,
    },
  });

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: 'executedItems',
  });

  useEffect(() => {
    if (isOpen && inventoryItems && plannedMenu) {
      // Map all planned items with their full ingredient lists
      const plannedItemsWithIngredients = plannedMenu.items.map(pItem => {
        // Find if this item exists in the existing closing (to preserve typed values)
        const existingItem = existingClosing?.executedItems.find(ei => ei.name === pItem.name);

        const ingredients = pItem.ingredients?.map(ing => {
          const invItem = inventoryItems.find(i => i.id === ing.inventoryItemId);

          // If we have an existing closing, try to find the actual quantity spent
          const existingIng = existingItem?.ingredients?.find(ei => ei.inventoryItemId === ing.inventoryItemId);
          const executedQuantity = existingIng?.executedQuantity !== undefined
            ? existingIng.executedQuantity
            : 0; // Default to 0 if not previously saved

          return {
            inventoryItemId: ing.inventoryItemId,
            name: invItem?.nombre || 'Insumo desconocido',
            executedQuantity: executedQuantity,
            unit: invItem?.unidadReceta || '',
          };
        }) || [];

        return {
          name: pItem.name,
          category: pItem.category,
          ingredients
        };
      });

      form.reset({
        executedPax: existingClosing?.executedPax || plannedMenu.pax,
        executedItems: plannedItemsWithIngredients,
        variations: existingClosing?.variations || '',
        lastServiceTime: existingClosing?.lastServiceTime || '13:45',
        incidencesCount: existingClosing?.incidencesCount || 0,
      });
    }
  }, [isOpen, inventoryItems, plannedMenu, existingClosing, form]);
  const onSubmit = (values: FormValues) => {
    const castedValues = {
      ...values,
      executedItems: values.executedItems.map(item => ({
        ...item,
        category: item.category as MenuItemCategory
      }))
    };
    onSave({
      ...castedValues,
      comedorId: existingClosing?.comedorId || plannedMenu?.comedorId || ''
    } as any);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {existingClosing ? 'Editar' : 'Registrar'} Cierre Diario
            {plannedMenu?.date && ` - ${plannedMenu.date instanceof Date ? format(plannedMenu.date, 'dd/MM/yyyy') : format(plannedMenu.date.toDate(), 'dd/MM/yyyy')}`}
          </DialogTitle>
          <DialogDescription>
            Registra los datos reales del servicio del día para compararlos con la planificación.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-6">
            <FormField
              control={form.control}
              name="executedPax"
              render={({ field }) => (
                <FormItem className="w-48">
                  <FormLabel>Comensales Reales (PAX)</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            <div className="space-y-6">
              <h3 className="text-lg font-medium">Menú Realmente Ejecutado</h3>
              {fields.map((item, index) => (
                <div key={item.id} className="border rounded-md px-4 pb-4 space-y-4">
                  <div className="flex items-end gap-2 py-4 border-b">
                    <FormField
                      control={form.control}
                      name={`executedItems.${index}.name`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel>Nombre del Plato</FormLabel>
                          <FormControl>
                            <Input placeholder="Ej: Pollo Frito" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`executedItems.${index}.category`}
                      render={({ field }) => (
                        <FormItem className="w-48">
                          <FormLabel>Categoría</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Categoría" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.entries(categoryDisplay).map(([key, { label }]) => (
                                <SelectItem key={key} value={key}>{label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="px-1">
                    <p className="text-xs text-muted-foreground mb-3 italic font-medium flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-primary/40 animate-pulse" />
                      Detalle de Insumos (Planificado para {plannedMenu?.pax || 0} personas)
                    </p>
                    <div className="rounded-md border p-0 overflow-hidden bg-slate-50/30">
                      <Table>
                        <TableHeader className="bg-slate-100/50">
                          <TableRow>
                            <TableHead className="py-2 text-xs font-bold text-slate-700">Insumos</TableHead>
                            <TableHead className="py-2 text-xs font-bold text-slate-700 text-center w-[60px]">Unid.</TableHead>
                            <TableHead className="text-right py-2 text-xs font-bold text-slate-700">Cant. Estándar</TableHead>
                            <TableHead className="text-right py-2 text-xs font-bold text-slate-700 w-[100px]">Cant. Real</TableHead>
                            <TableHead className="text-right py-2 text-xs font-bold text-slate-700 w-[100px]">Desviación</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody className="bg-white">
                          {form.watch(`executedItems.${index}.ingredients`)?.map((ing, ingIndex) => {
                            // Calculate planned quantity based on ORIGINAL planned pax
                            const menuItem = plannedMenu?.items.find(i => i.name === item.name);
                            const recipeIng = menuItem?.ingredients.find(ri => ri.inventoryItemId === ing.inventoryItemId);

                            let plannedQty = 0;
                            if (recipeIng && plannedMenu) {
                              const rawWaste = recipeIng.wasteFactor || 0;
                              // Normalize: if >= 1, treat as percentage (e.g. 10 -> 0.1)
                              const wasteFactor = rawWaste >= 1 ? rawWaste / 100 : rawWaste;
                              const safeWaste = Math.max(0, Math.min(0.99, wasteFactor));
                              const perPax = recipeIng.quantity / (1 - safeWaste);
                              plannedQty = perPax * plannedMenu.pax;
                            }

                            const realQty = form.watch(`executedItems.${index}.ingredients.${ingIndex}.executedQuantity`) || 0;
                            const variation = realQty - plannedQty;
                            const hasVariation = plannedQty > 0 && Math.abs(variation) > 0.001;

                            return (
                              <TableRow key={ing.inventoryItemId || ingIndex} className="hover:bg-slate-50/50">
                                <TableCell className="py-2 text-sm font-medium">
                                  {ing.name}
                                </TableCell>
                                <TableCell className="py-2 text-center text-xs text-muted-foreground uppercase font-semibold">
                                  {ing.unit}
                                </TableCell>
                                <TableCell className="py-2 text-right font-mono text-xs text-slate-600">
                                  {plannedQty > 0 ? plannedQty.toFixed(2) : '0.00'}
                                </TableCell>
                                <TableCell className="py-2 text-right">
                                  <FormField
                                    control={form.control}
                                    name={`executedItems.${index}.ingredients.${ingIndex}.executedQuantity`}
                                    render={({ field }) => (
                                      <FormItem className="space-y-0">
                                        <FormControl>
                                          <Input
                                            type="number"
                                            step="0.01"
                                            className="h-8 text-right font-mono text-sm px-2 w-[85px] bg-white border-primary/20 focus-visible:ring-primary/30"
                                            {...field}
                                            onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                                          />
                                        </FormControl>
                                      </FormItem>
                                    )}
                                  />
                                </TableCell>
                                <TableCell className={cn(
                                  "py-2 text-right font-mono text-xs font-bold",
                                  !hasVariation ? "text-slate-400" : variation > 0 ? "text-orange-600 bg-orange-50/50" : "text-green-600 bg-green-50/50"
                                )}>
                                  {hasVariation ? (variation > 0 ? `+${variation.toFixed(2)}` : variation.toFixed(2)) : '0.00'}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              ))}

              <Button type="button" variant="outline" size="sm" onClick={() => append({ name: '', category: '' as MenuItemCategory, ingredients: [] })}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Añadir Plato
              </Button>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="lastServiceTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hora Último Servicio</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="incidencesCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cant. Incidencias</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="variations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Variaciones u Observaciones (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Indique si algún plato fue diferente o hubo algún cambio..."
                      className="h-24 resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit">Guardar Cierre</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
