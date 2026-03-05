

import { Timestamp, FieldValue } from 'firebase/firestore';

export type Role = 'superadmin' | 'admin' | 'comun';
export type AreaId = 'servicio' | 'cocina' | 'limpieza' | 'almacen' | 'equipos' | 'administracion' | 'operaciones' | 'rrhh';
export type TaskStatus = 'pendiente' | 'en-progreso' | 'completada' | 'verificada' | 'rechazada';
export type TaskPriority = 'baja' | 'media' | 'alta' | 'urgente';
export type TaskPeriodicity = 'diaria' | 'semanal' | 'quincenal' | 'mensual' | 'unica';
export type WorkerType = 'obrero' | 'empleado';
export type ContractType = 'determinado' | 'indeterminado' | 'prueba';
export type ModuleId = 'dashboard' | 'tasks' | 'menus' | 'daily-closing' | 'inventory' | 'inventory-history' | 'attendance' | 'recognition' | 'reports' | 'stats' | 'users' | 'share' | 'settings' | 'comedores' | 'help';

export interface Comedor {
  id: string;
  nombre: string;
  slug: string; // Para URLs amigables
  direccion?: string;
  ciudad?: string;
  estado?: string;
  telefono?: string;
  logoUrl?: string;
  isActive: boolean;
  creationDate: Timestamp | Date | FieldValue;
  config?: {
    timezone?: string;
    currency?: string;
    allowSelfCheckIn?: boolean;
  };
}

export interface User {
  id: string;
  userId?: string;
  comedorId?: string; // ID del comedor al que pertenece (obligatorio para no superadmins)
  email: string;
  name: string;
  role: Role;
  area?: AreaId;
  areas?: AreaId[]; // Admins can have multiple areas
  modules?: ModuleId[]; // Admins can have access to specific modules
  isActive?: boolean;
  creationDate?: Timestamp | Date | string | FieldValue;
  createdBy?: string;
  lastAccess?: Timestamp | Date | string | FieldValue;
  cedula?: string;
  rif?: string;
  phone?: string;
  address?: string;
  contractEndDate?: Timestamp | Date | FieldValue;
  avatarUrl?: string;
  workerType?: WorkerType;
  contractType?: ContractType;
  department?: string;
  position?: string;
  permissions?: string[];
  active?: boolean;
  createdAt?: string | Date | FieldValue;
  updatedAt?: string | Date | FieldValue;
  lastLogin?: string | Date | FieldValue;
  nombres?: string;
  apellidos?: string;
  fechaIngreso?: Timestamp | Date | string | FieldValue;
  diasContrato?: number;
  fechaNacimiento?: Timestamp | Date | string | FieldValue;
  // Personal Details
  gender?: 'M' | 'F' | 'Other';
  civilStatus?: 'Single' | 'Married' | 'Divorced' | 'Widowed' | 'Cohabiting';
  nationality?: string;

  // Dotación / Uniforms
  shirtSize?: string;
  pantsSize?: string;
  shoeSize?: string;

  // Medical
  bloodType?: string;
  allergies?: string; // Comma separated or string
  diseases?: string;

  // Emergency Contact
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;

  // Financial
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountType?: 'Savings' | 'Current';

  // Wages & Benefits (Venezuela specific)
  baseSalary?: number;
  foodAllocation?: number; // Cestaticket
  otherBonuses?: number;
}

export interface Area {
  id: AreaId;
  comedorId: string;
  nombre: string;
  color: string;
  responsable: string; // userId
  descripcion: string;
  activa: boolean;
}

export interface ChecklistItem {
  item: string;
  completado: boolean;
  fechaCompletado?: Date;
}

export interface Evidence {
  url: string;
  nombreArchivo: string;
  fechaSubida: Date;
  usuario: string; // userId
  descripcion: string;
}

export interface Comment {
  usuario: string; // userId
  mensaje: string;
  fecha: Date;
  tipo: 'comentario' | 'advertencia' | 'elogio';
}

export interface Task {
  id: string; // Document ID from Firestore
  comedorId: string;
  titulo: string;
  descripcion: string;
  area: AreaId;
  asignadoA: string; // userId
  creadoPor: string; // userId
  estado: TaskStatus;
  prioridad: TaskPriority;
  periodicidad: TaskPeriodicity;
  fechaCreacion: Timestamp | Date;
  fechaVencimiento: Timestamp | Date;
  fechaCompletado?: Timestamp | Date;
  proximaEjecucion?: Timestamp | Date;
  checklist: ChecklistItem[];
  evidencias: Evidence[];
  comentarios: Comment[];
  tiempoEstimado: number; // in minutes
  tags: string[];
  recurrente: boolean;
  padreId?: string;
}

export interface Stats {
  periodo: string; // YYYY-MM
  comedorId: string;
  totalTareas: number;
  tareasCompletadas: number;
  tareasPendientes: number;
  tareasRetrasadas: number;
  eficienciaGeneral: number; // percentage
  porArea: Record<AreaId, { total: number; completadas: number; eficiencia: number }>;
  porUsuario: Record<string, { // userId
    totalAsignadas: number;
    completadas: number;
    eficiencia: number;
    tiempoPromedio: number;
  }>;
  tendenciaMensual: number;
  areasCriticas: AreaId[];
  usuariosDestacados: string[]; // userIds
}

// INVENTORY TYPES
export type InventoryCategoryId = 'carnes' | 'viveres' | 'verduras' | 'frutas' | 'descartables' | 'oficina';
export type UnitOfMeasure = 'kg' | 'g' | 'lt' | 'ml' | 'unidad' | 'paquete' | 'caja';

export interface InventoryCategory {
  id: InventoryCategoryId;
  nombre: string;
}

export interface InventoryItem {
  id: string;
  comedorId: string;
  codigo: string; // Unique business logic identifier
  nombre: string;
  descripcion?: string;
  categoriaId: InventoryCategoryId;
  subCategoria?: string;
  cantidad: number; // In recipe units
  unidadReceta: UnitOfMeasure;
  unidadCompra?: UnitOfMeasure;
  factorConversion?: number; // How many recipe units are in one purchase unit
  stockMinimo: number;
  fechaCreacion: Timestamp | Date;
  ultimaActualizacion: Timestamp | Date;
  proveedor?: string;
  costoUnitario?: number; // Cost per purchase unit
}


export type InventoryTransactionType = 'entrada' | 'salida' | 'ajuste-positivo' | 'ajuste-negativo';

export interface InventoryTransaction {
  transactionId: string;
  comedorId: string;
  itemId: string;
  type: InventoryTransactionType;
  quantity: number;
  date: Timestamp | Date;
  documentNumber?: string;
  supplier?: string;
  reason?: string; // e.g., 'Uso en Producción', 'Vencimiento'
  destinationArea?: AreaId;
  costoUnitario?: number;
}


export interface InventoryReportData {
  'ID de Artículo': string;
  'Nombre': string;
  'Categoría': string;
  'Cantidad Actual': number;
  'Unidad': string;
  'Stock Mínimo': number;
  'Costo Unitario'?: number;
  'Valor Total': number;
  'Estado': 'OK' | 'Bajo Stock';
  'Última Actualización': string;
}

export type OrderStatus = 'pendiente' | 'completado' | 'cancelado';

export interface InventoryOrderItem {
  itemId: string;
  nombre: string;
  quantity: number;
  unit: UnitOfMeasure;
  costo: number;
}

export interface InventoryOrder {
  orderId: string;
  comedorId: string;
  fechaPedido: Date;
  fechaEntregaEstimada: Date;
  proveedor: string;
  items: InventoryOrderItem[];
  estado: OrderStatus;
  costoTotal: number;
  creadoPor: string; // userId
}

// MENU TYPES
export type MenuItemCategory = 'entrada' | 'proteico' | 'acompanante1' | 'acompanante2' | 'acompanante3' | 'bebida' | 'postre';
export type MealType = 'desayuno' | 'almuerzo' | 'cena' | 'merienda' | 'especial' | 'otro';

export interface Ingredient {
  inventoryItemId: string; // link to InventoryItem
  quantity: number; // quantity per person
  wasteFactor: number; // percentage (0 to 1)
}

export interface MenuItem {
  id: string;
  name: string;
  category: MenuItemCategory;
  ingredients: Ingredient[];
}

export interface Menu {
  id: string;
  comedorId: string;
  name?: string;
  date: Timestamp | Date;
  time?: MealType;
  pax: number; // number of people
  items: MenuItem[];
}

export interface MenuReportData {
  'Fecha Menú': string;
  Plato: string;
  Categoría: string;
  PAX: number;
  Ingrediente: string;
  'Cant. Neta / Persona': number;
  'Cant. Bruta / Persona': number;
  'Total Requerido': number;
  Unidad: string;
}

export interface MenuImportRow {
  date: Date;
  pax: number;
  time: MealType;
  itemName: string;
  itemCategory: string;
  ingredientName: string;
  ingredientQuantity: number;
  ingredientWasteFactor: number;
}


// DAILY CLOSING TYPES
export interface ExecutedIngredient {
  inventoryItemId: string;
  name: string;
  executedQuantity: number; // total quantity used for the day
  unit: string;
}

export interface DailyClosingItem {
  name: string;
  category: MenuItemCategory;
  ingredients?: ExecutedIngredient[];
}

export interface DailyClosing {
  id?: string;
  closingId?: string;
  comedorId: string;
  date: Timestamp | Date;
  plannedMenuId: string | null;
  executedPax: number;
  executedItems: DailyClosingItem[];
  variations: string;
  closedBy: string; // userId
  lastServiceTime?: string;
  incidencesCount?: number;
}

// ATTENDANCE TYPES
export type AttendanceStatus = 'presente' | 'ausente' | 'retardo' | 'fuera-de-horario' | 'justificado' | 'no-justificado' | 'vacaciones' | 'dia-libre';
export type LeaveType = 'justificado' | 'no-justificado' | 'vacaciones';

export interface AttendanceRecord {
  id: string;
  comedorId: string;
  userId: string;
  checkIn: Timestamp | Date;
  checkOut?: Timestamp | Date;
  status: AttendanceStatus;
  leaveType?: LeaveType;
}

export interface ConsolidatedRecord {
  userId: string;
  userName: string;
  attendedDays: number;
  absentDays: number;
  freeDays: number;
  justifiedRestDays: number;
  totalHours: number;
}

export interface LeaveRecord {
  leaveId: string;
  comedorId: string;
  userId: string;
  startDate: Date;
  endDate: Date;
  type: LeaveType;
  reason: string;
  approvedBy?: string; // admin or superadmin userId
}

export interface DayOff {
  id: string;
  comedorId: string;
  userId: string;
  weekStartDate: string; // YYYY-MM-DD
  date: string; // YYYY-MM-DD
}

export interface WeeklyPlan {
  id: string;
  comedorId: string;
  startDate: Date;
  name: string;
  menus: (Menu | null)[];
}

// --- EVALUATION TYPES ---
export interface EvaluationCriterion {
  id: string;
  comedorId: string;
  name: string;
  description: string;
  maxPoints: number;
  isActive: boolean;
}

export interface EvaluationScore {
  criterionId: string;
  score: number;
  comment?: string;
}

export interface MonthlyEvaluation {
  id: string; // e.g., {userId}_{period}
  comedorId: string;
  userId: string;
  period: string; // YYYY-MM
  scores: EvaluationScore[];
  totalScore: number;
  evaluatorId: string;
  evaluationDate: Timestamp | Date;
}

// --- CONTRACT TEMPLATE TYPES ---
export interface ContractTemplate {
  id: string;
  comedorId: string;
  name: string;
  description?: string;
  content: string; // HTML or rich text content with placeholders
  contractType: ContractType;
  createdBy: string;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
  isActive: boolean;
  placeholders: string[]; // List of available placeholders like {{nombre}}, {{cedula}}, etc.
}

export interface GeneratedContract {
  id: string;
  comedorId: string;
  templateId: string;
  userId: string; // Employee ID
  generatedContent: string; // Final HTML content with filled placeholders
  generatedBy: string; // Admin who generated it
  generatedAt: Timestamp | Date;
  contractDate: Timestamp | Date;
  status: 'draft' | 'signed' | 'archived';
  signedAt?: Timestamp | Date;
  pdfUrl?: string; // URL to stored PDF if uploaded
}
