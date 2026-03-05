
import type { User, Area, Task, AreaId, Role, InventoryItem, InventoryCategory, InventoryTransaction, InventoryOrder, InventoryOrderItem, Menu, MenuItem, Ingredient, DailyClosing, AttendanceRecord, WorkerType, ContractType } from './types';
import { addDays, startOfWeek, set, subDays } from 'date-fns';

export const areas: Area[] = [
  { id: 'servicio', comedorId: 'comedor-1', nombre: 'Servicio', color: '#FF6B6B', responsable: 'user-admin-1', descripcion: 'Atención al cliente y servicio de mesas.', activa: true },
  { id: 'cocina', comedorId: 'comedor-1', nombre: 'Cocina', color: '#4ECDC4', responsable: 'user-admin-1', descripcion: 'Preparación de alimentos.', activa: true },
  { id: 'limpieza', comedorId: 'comedor-1', nombre: 'Limpieza', color: '#45B7D1', responsable: 'user-admin-2', descripcion: 'Mantenimiento y limpieza de instalaciones.', activa: true },
  { id: 'almacen', comedorId: 'comedor-1', nombre: 'Almacén', color: '#96CEB4', responsable: 'user-admin-2', descripcion: 'Gestión de inventario y suministros.', activa: true },
  { id: 'equipos', comedorId: 'comedor-1', nombre: 'Equipos', color: '#FFEAA7', responsable: 'user-admin-1', descripcion: 'Mantenimiento de equipos de cocina.', activa: true },
  { id: 'administracion', comedorId: 'comedor-1', nombre: 'Administración', color: '#DDA0DD', responsable: 'user-superadmin-1', descripcion: 'Gestión general y administrativa.', activa: true },
  { id: 'operaciones', comedorId: 'comedor-1', nombre: 'Operaciones', color: '#F79F79', responsable: 'user-superadmin-1', descripcion: 'Coordinación de operaciones diarias.', activa: true },
  { id: 'rrhh', comedorId: 'comedor-1', nombre: 'RRHH', color: '#A2D2FF', responsable: 'user-superadmin-1', descripcion: 'Gestión de Recursos Humanos.', activa: true },
];

export const users: User[] = [
  {
    id: 'user-superadmin-1',
    userId: 'user-superadmin-1',
    email: 'arvecladu@gmail.com',
    name: 'Super Admin',
    cedula: 'V-12345678',
    phone: '0412-1234567',
    address: 'Av. Principal, Edificio Central, Piso 10',
    role: 'superadmin',
    area: 'administracion',
    isActive: true,
    creationDate: '2023-01-01T12:00:00Z',
    createdBy: 'system',
    lastAccess: '2024-05-30T10:00:00Z',
    avatarUrl: 'https://i.pravatar.cc/150?u=superadmin',
    workerType: 'empleado',
    contractType: 'indeterminado',
  },
  {
    id: 'user-admin-1',
    userId: 'user-admin-1',
    email: 'erika.esquivel0603@gmail.com',
    name: 'Erika Esquivel',
    cedula: 'V-87654321',
    phone: '0414-9876543',
    role: 'admin',
    area: 'cocina',
    isActive: true,
    creationDate: '2023-02-15T12:00:00Z',
    contractEndDate: new Date('2025-02-15T12:00:00Z'),
    createdBy: 'user-superadmin-1',
    lastAccess: '2024-05-30T11:00:00Z',
    avatarUrl: 'https://i.pravatar.cc/150?u=erika',
    workerType: 'empleado',
    contractType: 'determinado',
  },
  {
    id: 'user-admin-2',
    userId: 'user-admin-2',
    email: 'admin2@comedor.com',
    name: 'Luis Pérez',
    cedula: 'V-11223344',
    phone: '0424-1122334',
    role: 'admin',
    area: 'limpieza',
    isActive: true,
    creationDate: '2023-03-20T12:00:00Z',
    createdBy: 'user-superadmin-1',
    lastAccess: '2024-05-29T09:00:00Z',
    avatarUrl: 'https://i.pravatar.cc/150?u=admin2',
    workerType: 'empleado',
    contractType: 'indeterminado',
  },
  {
    id: 'user-comun-1',
    userId: 'user-comun-1',
    email: 'carlos@comedor.com',
    name: 'Carlos Ruiz',
    cedula: 'V-22334455',
    phone: '0416-2233445',
    role: 'comun',
    area: 'cocina',
    isActive: true,
    creationDate: '2023-04-10T12:00:00Z',
    createdBy: 'user-admin-1',
    lastAccess: '2024-05-30T08:30:00Z',
    avatarUrl: 'https://i.pravatar.cc/150?u=carlos',
    workerType: 'obrero',
    contractType: 'indeterminado',
  },
  {
    id: 'user-comun-2',
    userId: 'user-comun-2',
    email: 'maria@comedor.com',
    name: 'María Fernández',
    cedula: 'V-33445566',
    phone: '0412-3344556',
    role: 'comun',
    area: 'servicio',
    isActive: true,
    creationDate: '2023-04-11T12:00:00Z',
    createdBy: 'user-admin-1',
    lastAccess: '2024-05-30T14:00:00Z',
    avatarUrl: 'https://i.pravatar.cc/150?u=maria',
    workerType: 'obrero',
    contractType: 'indeterminado',
  },
  {
    id: 'user-comun-3',
    userId: 'user-comun-3',
    email: 'jose@comedor.com',
    name: 'José Martínez',
    cedula: 'V-44556677',
    phone: '0414-4455667',
    role: 'comun',
    area: 'limpieza',
    isActive: true,
    creationDate: '2024-05-01T12:00:00Z',
    contractEndDate: new Date('2024-08-01T12:00:00Z'),
    createdBy: 'user-admin-2',
    lastAccess: '2024-05-28T16:00:00Z',
    avatarUrl: 'https://i.pravatar.cc/150?u=jose',
    workerType: 'obrero',
    contractType: 'prueba',
  },
];

export const tasks: Task[] = [
  {
    id: 'task-1', comedorId: 'comedor-1',
    titulo: 'Limpieza profunda de la cocina',
    descripcion: 'Realizar una limpieza exhaustiva de todas las superficies, equipos y suelos de la cocina principal.',
    area: 'cocina',
    asignadoA: 'user-comun-1',
    creadoPor: 'user-admin-1',
    estado: 'en-progreso',
    prioridad: 'alta',
    periodicidad: 'semanal',
    fechaCreacion: new Date('2024-05-28T10:00:00Z'),
    fechaVencimiento: new Date('2024-06-05T23:59:00Z'),
    tiempoEstimado: 240,
    checklist: [
      { item: 'Limpiar hornos', completado: true },
      { item: 'Desinfectar mesas de trabajo', completado: true },
      { item: 'Barrer y fregar suelos', completado: false },
    ],
    evidencias: [],
    comentarios: [],
    tags: ['limpieza', 'cocina'],
    recurrente: true,
  },
  {
    id: 'task-2', comedorId: 'comedor-1',
    titulo: 'Inventario de almacén seco',
    descripcion: 'Contar y registrar todas las existencias en el almacén de productos secos.',
    area: 'almacen',
    asignadoA: 'user-comun-3',
    creadoPor: 'user-admin-2',
    estado: 'pendiente',
    prioridad: 'media',
    periodicidad: 'mensual',
    fechaCreacion: new Date('2024-05-29T11:00:00Z'),
    fechaVencimiento: new Date('2024-06-10T23:59:00Z'),
    tiempoEstimado: 120,
    checklist: [],
    evidencias: [],
    comentarios: [],
    tags: ['inventario'],
    recurrente: true,
  },
  {
    id: 'task-3', comedorId: 'comedor-1',
    titulo: 'Servir almuerzo',
    descripcion: 'Atender a los comensales durante el servicio de almuerzo.',
    area: 'servicio',
    asignadoA: 'user-comun-2',
    creadoPor: 'user-admin-1',
    estado: 'completada',
    prioridad: 'urgente',
    periodicidad: 'diaria',
    fechaCreacion: new Date('2024-05-29T12:00:00Z'),
    fechaVencimiento: new Date('2024-05-29T15:00:00Z'),
    fechaCompletado: new Date('2024-05-29T14:30:00Z'),
    tiempoEstimado: 180,
    checklist: [],
    evidencias: [],
    comentarios: [],
    tags: ['servicio'],
    recurrente: true,
  },
  {
    id: 'task-4', comedorId: 'comedor-1',
    titulo: 'Revisión de extintores',
    descripcion: 'Verificar la fecha de caducidad y la presión de todos los extintores del comedor.',
    area: 'equipos',
    asignadoA: 'user-admin-2',
    creadoPor: 'user-superadmin-1',
    estado: 'pendiente',
    prioridad: 'alta',
    periodicidad: 'quincenal',
    fechaCreacion: new Date('2024-05-25T09:00:00Z'),
    fechaVencimiento: new Date('2024-06-02T17:00:00Z'),
    tiempoEstimado: 60,
    checklist: [],
    evidencias: [],
    comentarios: [],
    tags: ['seguridad', 'mantenimiento'],
    recurrente: true,
  },
  {
    id: 'task-5', comedorId: 'comedor-1',
    titulo: 'Preparar Mise en Place para cena',
    descripcion: 'Cortar vegetales, preparar salsas y aderezos para el servicio de la cena.',
    area: 'cocina',
    asignadoA: 'user-comun-1',
    creadoPor: 'user-admin-1',
    estado: 'pendiente',
    prioridad: 'urgente',
    periodicidad: 'diaria',
    fechaCreacion: new Date('2024-05-30T16:00:00Z'),
    fechaVencimiento: new Date('2024-05-30T18:00:00Z'),
    tiempoEstimado: 90,
    checklist: [],
    evidencias: [],
    comentarios: [],
    tags: ['cocina', 'preparacion'],
    recurrente: true,
  },
];

export const stats = {
  total: 25,
  completadas: 18,
  pendientes: 7,
  eficiencia: (18 / 25) * 100,
  chartData: [
    { name: 'Carlos R.', eficiencia: 90 },
    { name: 'María F.', eficiencia: 75 },
    { name: 'José M.', eficiencia: 85 },
    { name: 'Erika E.', eficiencia: 95 },
  ],
  pieData: [
    { name: 'Cocina', value: 8, fill: 'hsl(var(--chart-1))' },
    { name: 'Servicio', value: 6, fill: 'hsl(var(--chart-2))' },
    { name: 'Limpieza', value: 5, fill: 'hsl(var(--chart-3))' },
    { name: 'Almacén', value: 4, fill: 'hsl(var(--chart-4))' },
    { name: 'Equipos', value: 2, fill: 'hsl(var(--chart-5))' },
  ],
};


export const inventoryCategories: InventoryCategory[] = [
  { id: 'carnes', nombre: 'Carnes' },
  { id: 'viveres', nombre: 'Víveres' },
  { id: 'verduras', nombre: 'Verduras' },
  { id: 'frutas', nombre: 'Frutas' },
  { id: 'descartables', nombre: 'Descartables' },
  { id: 'oficina', nombre: 'Material de Oficina' },
];

export const inventoryItems: InventoryItem[] = [
  {
    id: 'inv-1', comedorId: 'comedor-1',
    codigo: 'PRO-001',
    nombre: 'Pechuga de Pollo',
    categoriaId: 'carnes',
    cantidad: 25,
    unidadReceta: 'kg',
    unidadCompra: 'kg',
    factorConversion: 1,
    stockMinimo: 10,
    fechaCreacion: new Date('2023-01-10T10:00:00Z'),
    ultimaActualizacion: new Date('2024-05-30T12:30:00Z'),
    proveedor: 'Avícola La Granja',
    costoUnitario: 5.50,
  },
  {
    id: 'inv-2', comedorId: 'comedor-1',
    codigo: 'VIV-001',
    nombre: 'Arroz Grano Largo',
    categoriaId: 'viveres',
    cantidad: 50,
    unidadReceta: 'kg',
    unidadCompra: 'kg',
    factorConversion: 1,
    stockMinimo: 20,
    fechaCreacion: new Date('2023-01-10T10:00:00Z'),
    ultimaActualizacion: new Date('2024-05-28T15:00:00Z'),
    proveedor: 'Distribuidora 24/7',
    costoUnitario: 1.20,
  },
  {
    id: 'inv-3', comedorId: 'comedor-1',
    codigo: 'VER-001',
    nombre: 'Tomates',
    categoriaId: 'verduras',
    cantidad: 15,
    unidadReceta: 'kg',
    unidadCompra: 'kg',
    factorConversion: 1,
    stockMinimo: 5,
    fechaCreacion: new Date('2023-01-10T10:00:00Z'),
    ultimaActualizacion: new Date('2024-05-31T09:00:00Z'),
    proveedor: 'Finca El Sol',
    costoUnitario: 2.10,
  },
  {
    id: 'inv-3a', comedorId: 'comedor-1',
    codigo: 'VER-002',
    nombre: 'Cebolla',
    categoriaId: 'verduras',
    cantidad: 20,
    unidadReceta: 'kg',
    unidadCompra: 'kg',
    factorConversion: 1,
    stockMinimo: 8,
    fechaCreacion: new Date('2023-01-10T10:00:00Z'),
    ultimaActualizacion: new Date('2024-05-31T09:05:00Z'),
    proveedor: 'Finca El Sol',
    costoUnitario: 1.50,
  },
  {
    id: 'inv-4', comedorId: 'comedor-1',
    codigo: 'FRU-001',
    nombre: 'Manzanas Fuji',
    categoriaId: 'frutas',
    cantidad: 30,
    unidadReceta: 'kg',
    unidadCompra: 'kg',
    factorConversion: 1,
    stockMinimo: 10,
    fechaCreacion: new Date('2023-01-10T10:00:00Z'),
    ultimaActualizacion: new Date('2024-05-29T14:00:00Z'),
    proveedor: 'Finca El Sol',
    costoUnitario: 1.80,
  },
  {
    id: 'inv-5', comedorId: 'comedor-1',
    codigo: 'DES-001',
    nombre: 'Servilletas de Papel',
    categoriaId: 'descartables',
    cantidad: 10,
    unidadReceta: 'unidad',
    unidadCompra: 'paquete',
    factorConversion: 50,
    stockMinimo: 5,
    fechaCreacion: new Date('2023-01-10T10:00:00Z'),
    ultimaActualizacion: new Date('2024-05-25T11:00:00Z'),
    proveedor: 'Papelera Nacional',
    costoUnitario: 3.00,
  },
  {
    id: 'inv-6', comedorId: 'comedor-1',
    codigo: 'OFI-001',
    nombre: 'Resma de Papel Bond',
    categoriaId: 'oficina',
    cantidad: 5,
    unidadReceta: 'unidad',
    unidadCompra: 'caja',
    factorConversion: 10,
    stockMinimo: 2,
    fechaCreacion: new Date('2023-01-10T10:00:00Z'),
    ultimaActualizacion: new Date('2024-05-20T10:00:00Z'),
    proveedor: 'OficinaTotal',
    costoUnitario: 25.00,
  },
  {
    id: 'inv-7', comedorId: 'comedor-1',
    codigo: 'PRO-002',
    nombre: 'Carne Molida de Res',
    categoriaId: 'carnes',
    cantidad: 20,
    unidadReceta: 'kg',
    unidadCompra: 'kg',
    factorConversion: 1,
    stockMinimo: 8,
    fechaCreacion: new Date('2023-01-10T10:00:00Z'),
    ultimaActualizacion: new Date('2024-05-30T13:00:00Z'),
    proveedor: 'Carnicería Central',
    costoUnitario: 7.20,
  },
  {
    id: 'inv-8', comedorId: 'comedor-1',
    codigo: 'PRO-003',
    nombre: 'Chuleta de Cerdo',
    categoriaId: 'carnes',
    cantidad: 15,
    unidadReceta: 'kg',
    unidadCompra: 'kg',
    factorConversion: 1,
    stockMinimo: 10,
    fechaCreacion: new Date('2023-02-15T10:00:00Z'),
    ultimaActualizacion: new Date('2024-05-30T13:00:00Z'),
    proveedor: 'Carnicería Central',
    costoUnitario: 8.50,
  },
  {
    id: 'inv-9', comedorId: 'comedor-1',
    codigo: 'PRO-004',
    nombre: 'Filete de Pescado',
    categoriaId: 'carnes',
    cantidad: 12,
    unidadReceta: 'kg',
    unidadCompra: 'kg',
    factorConversion: 1,
    stockMinimo: 5,
    fechaCreacion: new Date('2023-03-20T10:00:00Z'),
    ultimaActualizacion: new Date('2024-05-30T13:00:00Z'),
    proveedor: 'Pescadería del Puerto',
    costoUnitario: 9.00,
  },
];

export const inventoryTransactions: InventoryTransaction[] = [
  { transactionId: 'txn-1', comedorId: 'comedor-1', itemId: 'inv-1', type: 'salida', quantity: 5, date: new Date(), reason: 'Uso en Producción', destinationArea: 'cocina' },
  { transactionId: 'txn-2', comedorId: 'comedor-1', itemId: 'inv-2', type: 'salida', quantity: 10, date: new Date(), reason: 'Uso en Producción', destinationArea: 'cocina' },
  { transactionId: 'txn-3', comedorId: 'comedor-1', itemId: 'inv-3', type: 'salida', quantity: 8, date: new Date(), reason: 'Uso en Producción', destinationArea: 'cocina' },
  { transactionId: 'txn-4', comedorId: 'comedor-1', itemId: 'inv-1', type: 'salida', quantity: 3, date: new Date(), reason: 'Uso en Producción', destinationArea: 'cocina' },
  { transactionId: 'txn-5', comedorId: 'comedor-1', itemId: 'inv-5', type: 'salida', quantity: 2, date: new Date(), reason: 'Uso en Producción', destinationArea: 'servicio' },
  { transactionId: 'txn-6', comedorId: 'comedor-1', itemId: 'inv-7', type: 'salida', quantity: 10, date: new Date(), reason: 'Uso en Producción', destinationArea: 'cocina' },
  { transactionId: 'txn-7', comedorId: 'comedor-1', itemId: 'inv-2', type: 'salida', quantity: 15, date: new Date(), reason: 'Uso en Producción', destinationArea: 'cocina' },
  { transactionId: 'txn-8', comedorId: 'comedor-1', itemId: 'inv-3', type: 'salida', quantity: 5, date: new Date(), reason: 'Vencimiento' },
  { transactionId: 'txn-9', comedorId: 'comedor-1', itemId: 'inv-4', type: 'salida', quantity: 12, date: new Date(), reason: 'Uso en Producción', destinationArea: 'servicio' },
  { transactionId: 'txn-10', comedorId: 'comedor-1', itemId: 'inv-1', type: 'salida', quantity: 4, date: new Date(), reason: 'Uso en Producción', destinationArea: 'cocina' },
  { transactionId: 'txn-11', comedorId: 'comedor-1', itemId: 'inv-5', type: 'salida', quantity: 3, date: new Date(), reason: 'Uso en Producción', destinationArea: 'servicio' },
  { transactionId: 'txn-12', comedorId: 'comedor-1', itemId: 'inv-6', type: 'salida', quantity: 1, date: new Date(), reason: 'Uso en Producción', destinationArea: 'administracion' },
  { transactionId: 'txn-13', comedorId: 'comedor-1', itemId: 'inv-7', type: 'salida', quantity: 5, date: new Date(), reason: 'Uso en Producción', destinationArea: 'cocina' },
  { transactionId: 'txn-14', comedorId: 'comedor-1', itemId: 'inv-2', type: 'salida', quantity: 20, date: new Date(), reason: 'Uso en Producción', destinationArea: 'cocina' },
  { transactionId: 'txn-15', comedorId: 'comedor-1', itemId: 'inv-3', type: 'salida', quantity: 2, date: new Date(), reason: 'Mal Estado / Daño' },
];


export const inventoryOrders: InventoryOrder[] = [
  {
    orderId: 'ord-1', comedorId: 'comedor-1',
    fechaPedido: new Date('2024-05-20'),
    fechaEntregaEstimada: new Date('2024-05-25'),
    proveedor: 'Avícola La Granja',
    items: [
      { itemId: 'inv-1', nombre: 'Pechuga de Pollo', quantity: 20, unit: 'kg', costo: 110.00 },
      { itemId: 'inv-7', nombre: 'Carne Molida de Res', quantity: 15, unit: 'kg', costo: 108.00 },
    ],
    estado: 'completado',
    costoTotal: 218.00,
    creadoPor: 'user-admin-1',
  },
  {
    orderId: 'ord-2', comedorId: 'comedor-1',
    fechaPedido: new Date('2024-05-28'),
    fechaEntregaEstimada: new Date('2024-06-02'),
    proveedor: 'Distribuidora 24/7',
    items: [
      { itemId: 'inv-2', nombre: 'Arroz Grano Largo', quantity: 50, unit: 'kg', costo: 60.00 },
    ],
    estado: 'pendiente',
    costoTotal: 60.00,
    creadoPor: 'user-admin-2',
  },
];


const menuItems: MenuItem[] = [
  {
    id: 'menu-item-1',
    name: 'Sopa de Lentejas',
    category: 'entrada',
    ingredients: [
      { inventoryItemId: 'inv-3a', quantity: 0.05, wasteFactor: 0.1 }, // Cebolla
      { inventoryItemId: 'inv-3', quantity: 0.05, wasteFactor: 0.1 }, // Tomate
    ],
  },
  {
    id: 'menu-item-2',
    name: 'Pollo al Horno',
    category: 'proteico',
    ingredients: [
      { inventoryItemId: 'inv-1', quantity: 0.25, wasteFactor: 0.05 }, // Pechuga de Pollo
    ],
  },
  {
    id: 'menu-item-3',
    name: 'Arroz Blanco',
    category: 'acompanante1',
    ingredients: [
      { inventoryItemId: 'inv-2', quantity: 0.1, wasteFactor: 0 }, // Arroz
    ],
  },
  {
    id: 'menu-item-4',
    name: 'Ensalada Fresca',
    category: 'acompanante2',
    ingredients: [
      { inventoryItemId: 'inv-3', quantity: 0.08, wasteFactor: 0.15 }, // Tomates
    ],
  },
  {
    id: 'menu-item-5',
    name: 'Plátano Maduro Frito',
    category: 'acompanante3',
    ingredients: [],
  },
  {
    id: 'menu-item-6',
    name: 'Jugo de Manzana',
    category: 'bebida',
    ingredients: [
      { inventoryItemId: 'inv-4', quantity: 0.3, wasteFactor: 0.2 }, // Manzanas
    ],
  },
  {
    id: 'menu-item-7',
    name: 'Fruta Picada',
    category: 'postre',
    ingredients: [
      { inventoryItemId: 'inv-4', quantity: 0.1, wasteFactor: 0.2 }, // Manzanas
    ],
  },
];

const carneAsadaItems: MenuItem[] = [
  { id: 'ca-1', name: 'Consomé de Pollo', category: 'entrada', ingredients: [] },
  { id: 'ca-2', name: 'Carne Asada', category: 'proteico', ingredients: [{ inventoryItemId: 'inv-7', quantity: 0.28, wasteFactor: 0.1 }] },
  { id: 'ca-3', name: 'Arroz con Maíz', category: 'acompanante1', ingredients: [{ inventoryItemId: 'inv-2', quantity: 0.1, wasteFactor: 0 }] },
  { id: 'ca-4', name: 'Ensalada Rusa', category: 'acompanante2', ingredients: [] },
  { id: 'ca-5', name: 'Papas Fritas', category: 'acompanante3', ingredients: [] },
  { id: 'ca-6', name: 'Jugo de Papelón con Limón', category: 'bebida', ingredients: [] },
  { id: 'ca-7', name: 'Quesillo', category: 'postre', ingredients: [] },
];


const startOfThisWeek = startOfWeek(new Date(), { weekStartsOn: 1 }); // Monday

export const weeklyMenus: Menu[] = [
  {
    id: 'menu-1', comedorId: 'comedor-1',
    date: addDays(startOfThisWeek, 0), // Lunes
    pax: 150,
    items: menuItems,
  },
  {
    id: 'menu-2', comedorId: 'comedor-1',
    date: addDays(startOfThisWeek, 1), // Martes
    pax: 160,
    items: carneAsadaItems,
  },
  {
    id: 'menu-3', comedorId: 'comedor-1',
    date: addDays(startOfThisWeek, 2), // Miércoles
    pax: 140,
    items: menuItems,
  },
  {
    id: 'menu-4', comedorId: 'comedor-1',
    date: addDays(startOfThisWeek, 3), // Jueves
    pax: 155,
    items: carneAsadaItems,
  },
  {
    id: 'menu-5', comedorId: 'comedor-1',
    date: addDays(startOfThisWeek, 4), // Viernes
    pax: 170,
    items: menuItems,
  },
];


export const dailyMenu: Menu = {
  id: 'menu-1', comedorId: 'comedor-1',
  date: new Date(),
  pax: 150,
  items: menuItems,
};


export const dailyClosings: DailyClosing[] = [
  {
    closingId: 'closing-1',
    comedorId: 'comedor-1',
    date: addDays(startOfThisWeek, 0),
    plannedMenuId: 'menu-1',
    executedPax: 145,
    executedItems: [
      { name: 'Sopa de Lentejas', category: 'entrada' },
      { name: 'Pollo al Horno', category: 'proteico' },
      { name: 'Arroz Blanco', category: 'acompanante1' },
      { name: 'Ensalada de Tomate', category: 'acompanante2' }, // Cambio aquí
      { name: 'Jugo de Manzana', category: 'bebida' },
      { name: 'Fruta Picada', category: 'postre' },
    ],
    variations: 'Se cambió la "Ensalada Fresca" por "Ensalada de Tomate" debido a falta de lechuga. No se sirvió el 3er acompañante.',
    closedBy: 'user-admin-1',
  }
];

const today = new Date();
const yesterday = subDays(today, 1);
const twoDaysAgo = subDays(today, 2);
const threeDaysAgo = subDays(today, 3);


export const attendanceRecords: AttendanceRecord[] = [
  // Today
  { id: 'att-1', comedorId: 'comedor-1', userId: 'user-admin-1', checkIn: set(today, { hours: 7, minutes: 58, seconds: 10 }), checkOut: set(today, { hours: 17, minutes: 5, seconds: 2 }), status: 'presente' },
  { id: 'att-2', comedorId: 'comedor-1', userId: 'user-comun-1', checkIn: set(today, { hours: 8, minutes: 12, seconds: 45 }), status: 'retardo' },
  { id: 'att-3', comedorId: 'comedor-1', userId: 'user-comun-2', checkIn: set(today, { hours: 8, minutes: 3, seconds: 11 }), checkOut: set(today, { hours: 17, minutes: 1, seconds: 15 }), status: 'presente' },
  { id: 'att-4', comedorId: 'comedor-1', userId: 'user-comun-3', status: 'ausente', checkIn: set(today, { hours: 0, minutes: 0, seconds: 0 }) }, // Ausente

  // Yesterday
  { id: 'att-5', comedorId: 'comedor-1', userId: 'user-admin-1', checkIn: set(yesterday, { hours: 7, minutes: 55, seconds: 10 }), checkOut: set(yesterday, { hours: 17, minutes: 2, seconds: 2 }), status: 'presente' },
  { id: 'att-6', comedorId: 'comedor-1', userId: 'user-admin-2', status: 'ausente', checkIn: set(yesterday, { hours: 0, minutes: 0, seconds: 0 }) },
  { id: 'att-7', comedorId: 'comedor-1', userId: 'user-comun-1', checkIn: set(yesterday, { hours: 8, minutes: 1, seconds: 45 }), checkOut: set(yesterday, { hours: 17, minutes: 10, seconds: 12 }), status: 'presente' },
  { id: 'att-8', comedorId: 'comedor-1', userId: 'user-comun-2', checkIn: set(yesterday, { hours: 8, minutes: 20, seconds: 11 }), checkOut: set(yesterday, { hours: 17, minutes: 3, seconds: 15 }), status: 'retardo' },
  { id: 'att-9', comedorId: 'comedor-1', userId: 'user-comun-3', checkIn: set(yesterday, { hours: 7, minutes: 59, seconds: 50 }), checkOut: set(yesterday, { hours: 17, minutes: 0, seconds: 1 }), status: 'presente' },

  // Two days ago
  { id: 'att-10', comedorId: 'comedor-1', userId: 'user-admin-1', checkIn: set(twoDaysAgo, { hours: 8, minutes: 0, seconds: 10 }), checkOut: set(twoDaysAgo, { hours: 17, minutes: 1, seconds: 2 }), status: 'presente' },
  { id: 'att-11', comedorId: 'comedor-1', userId: 'user-admin-2', checkIn: set(twoDaysAgo, { hours: 8, minutes: 5, seconds: 10 }), checkOut: set(twoDaysAgo, { hours: 17, minutes: 8, seconds: 2 }), status: 'presente' },
  { id: 'att-12', comedorId: 'comedor-1', userId: 'user-comun-1', checkIn: set(twoDaysAgo, { hours: 8, minutes: 3, seconds: 45 }), checkOut: set(twoDaysAgo, { hours: 17, minutes: 0, seconds: 12 }), status: 'presente' },
  { id: 'att-13', comedorId: 'comedor-1', userId: 'user-comun-2', checkIn: set(twoDaysAgo, { hours: 8, minutes: 0, seconds: 11 }), checkOut: set(twoDaysAgo, { hours: 16, minutes: 55, seconds: 15 }), status: 'presente' },
  { id: 'att-14', comedorId: 'comedor-1', userId: 'user-comun-3', status: 'ausente', checkIn: set(twoDaysAgo, { hours: 0, minutes: 0, seconds: 0 }) },

  // Three days ago
  { id: 'att-15', comedorId: 'comedor-1', userId: 'user-admin-2', checkIn: set(threeDaysAgo, { hours: 8, minutes: 25, seconds: 10 }), checkOut: set(threeDaysAgo, { hours: 17, minutes: 8, seconds: 2 }), status: 'retardo' },
  { id: 'att-16', comedorId: 'comedor-1', userId: 'user-comun-1', status: 'ausente', checkIn: set(threeDaysAgo, { hours: 0, minutes: 0, seconds: 0 }) },
];
