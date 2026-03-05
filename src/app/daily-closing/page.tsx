'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  ArrowLeft,
  FileCheck,
  Users,
  Clock,
  AlertTriangle,
  CalendarDays,
  ArrowRight,
  ChevronDown,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useCollection, useFirestore, useMemoFirebase, useUser, addDocumentNonBlocking } from '@/firebase';
import { collection, query, where, Timestamp, orderBy, limit } from 'firebase/firestore';
import type { Menu, DailyClosing, User } from '@/lib/types';
import { format, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { ClosingForm } from '@/components/daily-closing/closing-form';
import { useToast } from '@/components/ui/toast';

export default function DailyClosingPage() {
  const [isFormOpen, setFormOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedMenuId, setSelectedMenuId] = useState<string>('');
  const firestore = useFirestore();
  const { user: authUser } = useUser();
  const { toast } = useToast();

  const dayStart = useMemo(() => {
    const d = new Date(selectedDate);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [selectedDate]);

  const dayEnd = useMemo(() => {
    const d = new Date(selectedDate);
    d.setHours(23, 59, 59, 999);
    return d;
  }, [selectedDate]);

  const menuQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'menus'),
      where('date', '>=', Timestamp.fromDate(dayStart)),
      where('date', '<=', Timestamp.fromDate(dayEnd))
    );
  }, [firestore, dayStart, dayEnd]);

  const { data: dayMenus, isLoading: isLoadingMenu } = useCollection<Menu>(menuQuery);

  // Fetch recent closings (last 7)
  const recentClosingsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'dailyClosings'),
      orderBy('date', 'desc'),
      limit(7)
    );
  }, [firestore]);
  const { data: recentClosings, isLoading: isLoadingRecent } = useCollection<DailyClosing>(recentClosingsQuery);

  const selectedDayClosing = (recentClosings || []).find(c => {
    const cDate = c.date instanceof Timestamp ? c.date.toDate() : new Date(c.date);
    return format(cDate, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
  });

  const activePlannedMenu = useMemo(() => {
    if (!dayMenus || dayMenus.length === 0) return null;
    if (selectedMenuId) return dayMenus.find(m => m.id === selectedMenuId) || dayMenus[0];
    // Prioritize 'almuerzo' if multiple menus exist
    return dayMenus.find(m => m.time === 'almuerzo') || dayMenus[0];
  }, [dayMenus, selectedMenuId]);

  useEffect(() => {
    if (dayMenus && dayMenus.length > 0 && !selectedMenuId) {
      setSelectedMenuId(dayMenus.find(m => m.time === 'almuerzo')?.id || dayMenus[0].id || '');
    }
  }, [dayMenus, selectedMenuId]);

  const handleSaveClosing = (data: any) => {
    if (!firestore || !authUser) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo conectar a la base de datos.' });
      return;
    }

    const closingData = {
      ...data,
      date: Timestamp.fromDate(selectedDate),
      plannedMenuId: activePlannedMenu?.id || null,
      closedBy: authUser.uid,
    };

    addDocumentNonBlocking(collection(firestore, 'dailyClosings'), closingData);

    toast({
      title: 'Cierre Registrado',
      description: `El cierre para el ${format(selectedDate, 'dd/MM/yyyy')} ha sido guardado correctamente.`,
    });

    setFormOpen(false);
  };


  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {/* Botón Volver a Reportes (Visible siempre) */}
          <Button variant="ghost" size="icon" asChild>
            <Link href="/reports">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="font-headline text-2xl font-bold md:text-3xl">
              Cierres Diarios
            </h1>
            <p className="text-gray-500">
              Resumen operativo y cierre de jornada.
            </p>
          </div>
        </div>
        <div className="flex gap-4 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground ml-1">Fecha de Cierre</label>
            <Input
              type="date"
              className="w-40"
              value={format(selectedDate, 'yyyy-MM-dd')}
              onChange={(e) => {
                const newDate = new Date(e.target.value);
                newDate.setMinutes(newDate.getMinutes() + newDate.getTimezoneOffset());
                setSelectedDate(newDate);
                setSelectedMenuId(''); // Reset menu when date changes
              }}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground ml-1">Menú Planificado</label>
            <Select value={selectedMenuId} onValueChange={setSelectedMenuId} disabled={!dayMenus || dayMenus.length === 0}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder={isLoadingMenu ? "Cargando..." : "Sin planificación"} />
              </SelectTrigger>
              <SelectContent>
                {dayMenus?.map(m => (
                  <SelectItem key={m.id} value={m.id || ''}>
                    {m.time ? m.time.charAt(0).toUpperCase() + m.time.slice(1) : 'Menú'} (PAX: {m.pax})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            className="gap-2 bg-green-600 hover:bg-green-700 text-white"
            onClick={() => setFormOpen(true)}
            disabled={!activePlannedMenu}
          >
            <FileCheck className="h-4 w-4" />
            Realizar Cierre
          </Button>
        </div>
      </div>

      {/* Tarjetas de Resumen del Día Actual */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-l-4 border-l-blue-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Comidas Servidas
            </CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{selectedDayClosing?.executedPax || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {activePlannedMenu ? `De ${activePlannedMenu.pax} planificadas (${Math.round((selectedDayClosing?.executedPax || 0) / activePlannedMenu.pax * 100)}% de ejecución)` : 'Sin planificación para este día'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Hora Último Servicio
            </CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{selectedDayClosing?.lastServiceTime || '--:--'}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {selectedDayClosing ? 'Último servicio registrado' : 'Sin cierre para hoy'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Incidencias
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{selectedDayClosing?.incidencesCount || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {selectedDayClosing?.incidencesCount ? 'Reportes registrados' : 'Sin incidencias reportadas'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Sección de Cierres Recientes (Ejemplo Visual) */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Cierres de la Semana</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingRecent ? (
              <div className="p-8 text-center text-muted-foreground">Cargando cierres...</div>
            ) : recentClosings && recentClosings.length > 0 ? (
              recentClosings.map((cierre, i) => {
                const dateObj = cierre.date instanceof Timestamp ? cierre.date.toDate() : new Date(cierre.date);
                const isToday = format(dateObj, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                const isYesterday = format(dateObj, 'yyyy-MM-dd') === format(new Date(Date.now() - 86400000), 'yyyy-MM-dd');

                let label = format(dateObj, 'EEEE', { locale: es });
                if (isToday) label = 'Hoy';
                if (isYesterday) label = 'Ayer';

                return (
                  <div
                    key={cierre.id || i}
                    className="flex items-center justify-between p-4 border rounded-lg bg-gray-50 hover:bg-white hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-white border flex items-center justify-center font-bold text-gray-600 text-xs shadow-sm">
                        {format(dateObj, 'dd MMM', { locale: es }).split(' ')[0]}
                      </div>
                      <div>
                        <p className="font-medium text-sm capitalize">{label}</p>
                        <p className="text-xs text-gray-500">
                          {cierre.executedPax} platos servidos
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge
                        variant="secondary"
                        className="bg-green-100 text-green-700"
                      >
                        Completado
                      </Badge>
                      <Link href={`/daily-closing/report?date=${format(dateObj, 'yyyy-MM-dd')}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <ArrowRight className="h-4 w-4 text-gray-400" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-muted-foreground italic border-2 border-dashed rounded-lg">
                No hay cierres registrados recientemente.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Panel Informativo */}
        <Card className="col-span-3 bg-slate-50 border-dashed">
          <CardHeader>
            <CardTitle className="text-base text-slate-700">
              Información Importante
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600 space-y-2">
            <p>
              • Recuerda realizar el cierre antes de las 16:00 horas para que se
              refleje en el reporte diario.
            </p>
            <p>
              • Si hubo incidencias con el inventario, deben registrarse primero
              en el módulo de Inventario antes de cerrar caja.
            </p>
          </CardContent>
        </Card>
      </div>

      <ClosingForm
        isOpen={isFormOpen}
        onOpenChange={setFormOpen}
        plannedMenu={activePlannedMenu}
        onSave={handleSaveClosing}
      />
    </div>
  );
}
