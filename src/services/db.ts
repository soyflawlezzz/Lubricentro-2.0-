import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { handleFirestoreError, OperationType } from '../firebase/errors';
import {
  WorkOrder,
  Client,
  Vehicle,
  Product,
  Sale,
  Budget,
  Expense,
  Reminder,
  CompanySettings,
  UserProfile,
  WorkOrderStatus,
  BranchId,
  Supplier,
  Invoice,
  ServiceAppointment,
} from '../types';
import {
  DEFAULT_SETTINGS,
  INITIAL_PRODUCTS,
  INITIAL_SERVICES,
  INITIAL_SUPPLIERS,
  INITIAL_INVOICES,
} from './seedData';
import {
  getCachedClients,
  saveCachedClients,
  getCachedVehicles,
  saveCachedVehicles,
  getCachedWorkOrders,
  saveCachedWorkOrders,
} from './localCache';

// Helper for date formatting
export const getNowIso = () => new Date().toISOString();

/**
 * Strips undefined fields recursively to prevent Firestore from crashing
 */
export function cleanFirestoreData<T extends Record<string, any>>(data: T): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) {
      continue;
    } else if (value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      result[key] = cleanFirestoreData(value);
    } else if (Array.isArray(value)) {
      result[key] = value.map((item) =>
        item !== null && typeof item === 'object' && !(item instanceof Date)
          ? cleanFirestoreData(item)
          : item === undefined ? null : item
      );
    } else {
      result[key] = value;
    }
  }
  return result;
}

// ========================
// 1. WORK ORDERS
// ========================
export function subscribeWorkOrders(
  branchId: BranchId | undefined,
  callback: (orders: WorkOrder[]) => void,
  onError?: (err: any) => void
) {
  const collPath = 'workOrders';

  // Serve instantly from IndexedDB cache for zero latency startup
  getCachedWorkOrders()
    .then((cached) => {
      if (cached && cached.length > 0) {
        cached.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        callback(cached);
      }
    })
    .catch((err) => console.warn('IndexedDB work orders read warning:', err));

  try {
    const q = collection(db, collPath);
    return onSnapshot(
      q,
      (snapshot) => {
        let list: WorkOrder[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as WorkOrder[];

        // Sort by createdAt desc
        list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

        // Save fresh snapshot to IndexedDB cache
        saveCachedWorkOrders(list);

        callback(list);
      },
      (error) => {
        if (onError) onError(error);
        handleFirestoreError(error, OperationType.LIST, collPath);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, collPath);
  }
}

export async function createWorkOrder(data: Omit<WorkOrder, 'id'>): Promise<string> {
  const collPath = 'workOrders';
  try {
    const cleanData = cleanFirestoreData({
      ...data,
      createdAt: data.createdAt || getNowIso(),
      updatedAt: getNowIso(),
    });
    const docRef = await addDoc(collection(db, collPath), cleanData);

    // Also auto-create a reminder in background if next service date or KM is indicated
    if (data.nextServiceDate || data.nextServiceKm) {
      createReminder({
        workOrderId: docRef.id,
        clientName: data.clientName,
        clientWhatsapp: data.clientWhatsapp,
        clientPhone: data.clientPhone,
        licensePlate: data.licensePlate,
        vehicleInfo: `${data.vehicleBrand} ${data.vehicleModel}`,
        estimatedDate: data.nextServiceDate,
        estimatedKm: data.nextServiceKm,
        status: 'pendiente',
        branchId: data.branchId,
        createdAt: getNowIso(),
      }).catch((err) => console.warn('Background reminder creation warning:', err));
    }

    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, collPath);
  }
}

export async function updateWorkOrderStatus(
  orderId: string,
  newStatus: WorkOrderStatus,
  currentUser: string,
  note?: string
) {
  const path = `workOrders/${orderId}`;
  try {
    const docRef = doc(db, 'workOrders', orderId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) throw new Error('Orden de trabajo no encontrada');
    const currentData = snap.data() as WorkOrder;

    const newHistory = [
      ...(currentData.statusHistory || []),
      {
        status: newStatus,
        user: currentUser,
        timestamp: getNowIso(),
        note: note || `Estado actualizado a ${newStatus}`,
      },
    ];

    await updateDoc(docRef, {
      status: newStatus,
      statusHistory: newHistory,
      updatedAt: getNowIso(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function updateWorkOrder(orderId: string, updates: Partial<WorkOrder>) {
  const path = `workOrders/${orderId}`;
  try {
    const docRef = doc(db, 'workOrders', orderId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: getNowIso(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteWorkOrder(orderId: string) {
  const path = `workOrders/${orderId}`;
  try {
    await deleteDoc(doc(db, 'workOrders', orderId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ========================
// 2. CLIENTS
// ========================
export function subscribeClients(
  branchId: BranchId | undefined,
  callback: (clients: Client[]) => void
) {
  const collPath = 'clients';

  // Read instantly from local IndexedDB cache for zero latency (<0.05s) startup
  getCachedClients()
    .then((cached) => {
      if (cached && cached.length > 0) {
        const list = cached
          .filter((c) => c.active !== false)
          .sort((a, b) => (a.fullName || '').localeCompare(b.fullName || ''));
        callback(list);
      }
    })
    .catch((err) => console.warn('IndexedDB clients read warning:', err));

  try {
    return onSnapshot(
      collection(db, collPath),
      (snapshot) => {
        let list = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Client[];

        // Keep active clients
        list = list.filter((c) => c.active !== false);

        list.sort((a, b) => (a.fullName || '').localeCompare(b.fullName || ''));

        // Persist fresh snapshot to IndexedDB cache
        saveCachedClients(list);

        callback(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, collPath);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, collPath);
  }
}

export async function createClient(data: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const collPath = 'clients';
  try {
    const cleanData = cleanFirestoreData({
      ...data,
      active: true,
      createdAt: getNowIso(),
      updatedAt: getNowIso(),
    });
    const docRef = await addDoc(collection(db, collPath), cleanData);
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, collPath);
    throw error;
  }
}

export async function updateClient(clientId: string, updates: Partial<Client>) {
  const path = `clients/${clientId}`;
  try {
    await updateDoc(doc(db, 'clients', clientId), cleanFirestoreData({
      ...updates,
      updatedAt: getNowIso(),
    }));
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteClient(clientId: string) {
  const path = `clients/${clientId}`;
  try {
    // Soft delete
    await updateDoc(doc(db, 'clients', clientId), {
      active: false,
      updatedAt: getNowIso(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// ========================
// 3. VEHICLES
// ========================
export function subscribeVehicles(
  branchId: BranchId | undefined,
  callback: (vehicles: Vehicle[]) => void
) {
  const collPath = 'vehicles';

  // Read instantly from local IndexedDB cache for zero latency (<0.05s) startup
  getCachedVehicles()
    .then((cached) => {
      if (cached && cached.length > 0) {
        const list = cached
          .filter((v) => v.active !== false)
          .sort((a, b) => (a.licensePlate || '').localeCompare(b.licensePlate || ''));
        callback(list);
      }
    })
    .catch((err) => console.warn('IndexedDB vehicles read warning:', err));

  try {
    return onSnapshot(
      collection(db, collPath),
      (snapshot) => {
        let list = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Vehicle[];

        list = list.filter((v) => v.active !== false);

        list.sort((a, b) => (a.licensePlate || '').localeCompare(b.licensePlate || ''));

        // Persist fresh snapshot to IndexedDB cache
        saveCachedVehicles(list);

        callback(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, collPath);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, collPath);
  }
}

export async function createVehicle(data: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const collPath = 'vehicles';
  try {
    const cleanData = cleanFirestoreData({
      ...data,
      licensePlate: data.licensePlate.trim().toUpperCase(),
      active: true,
      createdAt: getNowIso(),
      updatedAt: getNowIso(),
    });
    const docRef = await addDoc(collection(db, collPath), cleanData);
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, collPath);
    throw error;
  }
}

/**
 * Fetches vehicle record and all historical work orders for the QR passport scan.
 */
export async function getVehiclePassportData(licensePlate: string): Promise<{ vehicle?: Vehicle; workOrders: WorkOrder[] }> {
  try {
    const cleanPlate = (licensePlate || '').trim().toUpperCase();
    if (!cleanPlate) return { workOrders: [] };

    let vehicle: Vehicle | undefined;
    try {
      const vehSnap = await getDocs(
        query(collection(db, 'vehicles'), where('licensePlate', '==', cleanPlate))
      );
      if (!vehSnap.empty) {
        vehicle = { id: vehSnap.docs[0].id, ...(vehSnap.docs[0].data() as Omit<Vehicle, 'id'>) };
      }
    } catch (e) {
      console.warn('Vehicle query warning:', e);
    }

    const workOrders: WorkOrder[] = [];
    try {
      const ordersSnap = await getDocs(
        query(collection(db, 'workOrders'), where('licensePlate', '==', cleanPlate))
      );
      ordersSnap.docs.forEach((d) => {
        workOrders.push({ id: d.id, ...(d.data() as Omit<WorkOrder, 'id'>) });
      });
    } catch (e) {
      console.warn('Work orders query warning:', e);
    }

    // Fallback scan if query missed any non-normalized uppercase plate
    if (workOrders.length === 0) {
      try {
        const woAllSnap = await getDocs(collection(db, 'workOrders'));
        woAllSnap.docs.forEach((d) => {
          const data = d.data() as WorkOrder;
          if (data.licensePlate && data.licensePlate.trim().toUpperCase() === cleanPlate) {
            workOrders.push({ ...data, id: d.id });
          }
        });
      } catch (err) {
        console.warn('Fallback wo query warning:', err);
      }
    }

    workOrders.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

    return { vehicle, workOrders };
  } catch (err) {
    console.error('Error fetching vehicle passport data:', err);
    return { workOrders: [] };
  }
}

export async function updateVehicle(vehicleId: string, updates: Partial<Vehicle>) {
  const path = `vehicles/${vehicleId}`;
  try {
    const cleanUpdates = cleanFirestoreData({
      ...updates,
      ...(updates.licensePlate ? { licensePlate: updates.licensePlate.trim().toUpperCase() } : {}),
      updatedAt: getNowIso(),
    });
    await updateDoc(doc(db, 'vehicles', vehicleId), cleanUpdates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
    throw error;
  }
}

export async function deleteVehicle(vehicleId: string) {
  const path = `vehicles/${vehicleId}`;
  try {
    await deleteDoc(doc(db, 'vehicles', vehicleId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    throw error;
  }
}

// ========================
// 4. PRODUCTS & STOCK
// ========================
export function subscribeProducts(
  callback: (products: Product[]) => void
) {
  const collPath = 'products';
  try {
    return onSnapshot(
      collection(db, collPath),
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Product[];
        list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        callback(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, collPath);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, collPath);
  }
}

export async function createProduct(data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const collPath = 'products';
  try {
    const docRef = await addDoc(collection(db, collPath), {
      ...data,
      code: data.code.toUpperCase().trim(),
      createdAt: getNowIso(),
      updatedAt: getNowIso(),
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, collPath);
  }
}

export async function updateProduct(productId: string, updates: Partial<Product>) {
  const path = `products/${productId}`;
  try {
    await updateDoc(doc(db, 'products', productId), {
      ...updates,
      updatedAt: getNowIso(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteProduct(productId: string) {
  const path = `products/${productId}`;
  try {
    await deleteDoc(doc(db, 'products', productId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ========================
// 5. SALES & REMITOS
// ========================
export function subscribeSales(
  branchId: BranchId,
  callback: (sales: Sale[]) => void
) {
  const collPath = 'sales';
  try {
    return onSnapshot(
      collection(db, collPath),
      (snapshot) => {
        let list = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Sale[];

        if (branchId && branchId !== 'todas') {
          list = list.filter((s) => s.branchId === branchId);
        }

        list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        callback(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, collPath);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, collPath);
  }
}

export async function createSale(data: Omit<Sale, 'id' | 'createdAt'>): Promise<string> {
  const collPath = 'sales';
  try {
    const cleanData = cleanFirestoreData({
      ...data,
      createdAt: getNowIso(),
    });
    const docRef = await addDoc(collection(db, collPath), cleanData);

    // Concurrently deduct stock in background
    if (data.items && data.items.length > 0) {
      Promise.all(
        data.items
          .filter((item) => item.productId)
          .map(async (item) => {
            try {
              const pDoc = await getDoc(doc(db, 'products', item.productId!));
              if (pDoc.exists()) {
                const currentStock = pDoc.data().stock || 0;
                await updateDoc(doc(db, 'products', item.productId!), {
                  stock: Math.max(0, currentStock - item.quantity),
                  updatedAt: getNowIso(),
                });
              }
            } catch (e) {
              console.warn('Stock update skipped for item:', item.name);
            }
          })
      ).catch((e) => console.warn('Background stock deduction warning:', e));
    }

    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, collPath);
  }
}

// ========================
// 6. BUDGETS (PRESUPUESTOS)
// ========================
export function subscribeBudgets(
  branchId: BranchId | undefined,
  callback: (budgets: Budget[]) => void
) {
  const collPath = 'budgets';
  try {
    return onSnapshot(
      collection(db, collPath),
      (snapshot) => {
        let list = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Budget[];

        list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        callback(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, collPath);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, collPath);
  }
}

export async function createBudget(data: Omit<Budget, 'id' | 'createdAt'>): Promise<string> {
  const collPath = 'budgets';
  try {
    const cleanData = cleanFirestoreData({
      ...data,
      createdAt: getNowIso(),
    });
    const docRef = await addDoc(collection(db, collPath), cleanData);
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, collPath);
    throw error;
  }
}

export async function updateBudget(budgetId: string, updates: Partial<Budget>) {
  const path = `budgets/${budgetId}`;
  try {
    await updateDoc(doc(db, 'budgets', budgetId), cleanFirestoreData(updates));
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
    throw error;
  }
}

export async function deleteBudget(budgetId: string) {
  const path = `budgets/${budgetId}`;
  try {
    await deleteDoc(doc(db, 'budgets', budgetId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ========================
// 7. EXPENSES (EGRESOS)
// ========================
export function subscribeExpenses(
  branchId: BranchId,
  callback: (expenses: Expense[]) => void
) {
  const collPath = 'expenses';
  try {
    return onSnapshot(
      collection(db, collPath),
      (snapshot) => {
        let list = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Expense[];

        if (branchId && branchId !== 'todas') {
          list = list.filter((e) => e.branchId === branchId);
        }

        list.sort((a, b) => (b.date || b.createdAt || '').localeCompare(a.date || a.createdAt || ''));
        callback(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, collPath);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, collPath);
  }
}

export async function createExpense(data: Omit<Expense, 'id' | 'createdAt'>): Promise<string> {
  const collPath = 'expenses';
  try {
    const cleanData = cleanFirestoreData({
      ...data,
      createdAt: getNowIso(),
    });
    const docRef = await addDoc(collection(db, collPath), cleanData);
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, collPath);
    throw error;
  }
}

export async function deleteExpense(expenseId: string) {
  const path = `expenses/${expenseId}`;
  try {
    await deleteDoc(doc(db, 'expenses', expenseId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ========================
// 8. REMINDERS (RECORDATORIOS / PRÓXIMOS SERVICES)
// ========================
export function subscribeReminders(
  branchId: BranchId | undefined,
  callback: (reminders: Reminder[]) => void
) {
  const collPath = 'reminders';
  try {
    return onSnapshot(
      collection(db, collPath),
      (snapshot) => {
        let list = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Reminder[];

        list.sort((a, b) => (a.estimatedDate || '').localeCompare(b.estimatedDate || ''));
        callback(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, collPath);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, collPath);
  }
}

export async function createReminder(data: Omit<Reminder, 'id'>): Promise<string> {
  const collPath = 'reminders';
  try {
    const docRef = await addDoc(collection(db, collPath), data);
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, collPath);
  }
}

export async function updateReminderStatus(reminderId: string, status: Reminder['status']) {
  const path = `reminders/${reminderId}`;
  try {
    await updateDoc(doc(db, 'reminders', reminderId), { status });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteReminder(reminderId: string) {
  const path = `reminders/${reminderId}`;
  try {
    await deleteDoc(doc(db, 'reminders', reminderId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ========================
// 9. SETTINGS & INITIAL SEEDING
// ========================
export function subscribeSettings(callback: (settings: CompanySettings) => void) {
  const docPath = 'settings/general';

  // Immediately notify from local storage if available for instant UI responsiveness
  try {
    const cached = localStorage.getItem('lubricentro_settings');
    if (cached) {
      callback({ ...DEFAULT_SETTINGS, ...JSON.parse(cached) });
    }
  } catch (e) {
    console.error('Error loading cached settings:', e);
  }

  try {
    return onSnapshot(
      doc(db, 'settings', 'general'),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as CompanySettings;
          const merged = { ...DEFAULT_SETTINGS, ...data };
          if (merged.email === 'contacto@lubricentro20.com') merged.email = '';
          if (merged.commercialInfo && merged.commercialInfo.includes('30-71829340-8')) merged.commercialInfo = '';
          try {
            localStorage.setItem('lubricentro_settings', JSON.stringify(merged));
          } catch (e) {}
          callback(merged);
        } else {
          // Initialize if missing
          setDoc(doc(db, 'settings', 'general'), DEFAULT_SETTINGS)
            .then(() => {
              try {
                localStorage.setItem('lubricentro_settings', JSON.stringify(DEFAULT_SETTINGS));
              } catch (e) {}
              callback(DEFAULT_SETTINGS);
            })
            .catch((e) => console.error('Error seeding settings:', e));
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, docPath);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, docPath);
  }
}

export async function updateSettings(settings: Partial<CompanySettings>) {
  const path = 'settings/general';

  // Save to local cache immediately
  try {
    const cached = localStorage.getItem('lubricentro_settings');
    const existing = cached ? JSON.parse(cached) : DEFAULT_SETTINGS;
    const merged = { ...existing, ...settings };
    localStorage.setItem('lubricentro_settings', JSON.stringify(merged));
  } catch (e) {
    console.error('Error caching settings to localStorage:', e);
  }

  try {
    await setDoc(doc(db, 'settings', 'general'), cleanFirestoreData(settings), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
    throw error;
  }
}

// ========================
// 10. SUPPLIERS (PROVEEDORES)
// ========================
export function subscribeSuppliers(
  callback: (suppliers: Supplier[]) => void,
  onError?: (err: any) => void
) {
  const collPath = 'suppliers';
  try {
    return onSnapshot(
      collection(db, collPath),
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Supplier[];
        list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        callback(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, collPath);
        onError?.(error);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, collPath);
  }
}

export async function createSupplier(
  data: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const collPath = 'suppliers';
  try {
    const cleanData = cleanFirestoreData({
      ...data,
      createdAt: getNowIso(),
      updatedAt: getNowIso(),
    });
    const docRef = await addDoc(collection(db, collPath), cleanData);
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, collPath);
    throw error;
  }
}

export async function updateSupplier(supplierId: string, data: Partial<Supplier>) {
  const path = `suppliers/${supplierId}`;
  try {
    await updateDoc(doc(db, 'suppliers', supplierId), cleanFirestoreData({
      ...data,
      updatedAt: getNowIso(),
    }));
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
    throw error;
  }
}

export async function deleteSupplier(supplierId: string) {
  const path = `suppliers/${supplierId}`;
  try {
    await deleteDoc(doc(db, 'suppliers', supplierId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ========================
// 11. INVOICES (FACTURAS DE PROVEEDORES)
// ========================
export function subscribeInvoices(
  callback: (invoices: Invoice[]) => void,
  onError?: (err: any) => void
) {
  const collPath = 'invoices';
  try {
    return onSnapshot(
      collection(db, collPath),
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Invoice[];
        // Sort by dueDate asc (upcoming/due first)
        list.sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''));
        callback(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, collPath);
        onError?.(error);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, collPath);
  }
}

export async function createInvoice(
  data: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const collPath = 'invoices';
  try {
    const cleanData = cleanFirestoreData({
      ...data,
      createdAt: getNowIso(),
      updatedAt: getNowIso(),
    });
    const docRef = await addDoc(collection(db, collPath), cleanData);
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, collPath);
    throw error;
  }
}

export async function updateInvoice(invoiceId: string, data: Partial<Invoice>) {
  const path = `invoices/${invoiceId}`;
  try {
    await updateDoc(doc(db, 'invoices', invoiceId), cleanFirestoreData({
      ...data,
      updatedAt: getNowIso(),
    }));
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
    throw error;
  }
}

export async function deleteInvoice(invoiceId: string) {
  const path = `invoices/${invoiceId}`;
  try {
    await deleteDoc(doc(db, 'invoices', invoiceId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Initialize seed data if database is empty
export async function seedInitialDatabaseIfEmpty() {
  try {
    // Check settings
    const setSnap = await getDoc(doc(db, 'settings', 'general'));
    if (!setSnap.exists()) {
      await setDoc(doc(db, 'settings', 'general'), DEFAULT_SETTINGS);
    }

    // Auto seed sample clients and budgets if clients database is empty
    const clientsSnap = await getDocs(collection(db, 'clients'));
    if (clientsSnap.empty) {
      console.log('Database empty: Seeding sample clients and budgets...');
      await restoreSampleData();
    }
  } catch (e) {
    console.warn('Database seed check complete or pending permissions:', e);
  }
}

// ========================
// 12. SERVICE APPOINTMENTS / TURNOS DE SERVICE
// ========================
export function subscribeAppointments(
  callback: (appointments: ServiceAppointment[]) => void
) {
  const q = query(collection(db, 'appointments'), orderBy('date', 'asc'));

  return onSnapshot(
    q,
    (snap) => {
      const appointments: ServiceAppointment[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<ServiceAppointment, 'id'>),
      }));
      callback(appointments);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, 'appointments');
    }
  );
}

export async function createAppointment(
  data: Omit<ServiceAppointment, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  try {
    const now = getNowIso();
    const cleanData = cleanFirestoreData({
      ...data,
      createdAt: now,
      updatedAt: now,
    });
    const docRef = await addDoc(collection(db, 'appointments'), cleanData);
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'appointments');
    throw error;
  }
}

export async function updateAppointment(
  id: string,
  data: Partial<ServiceAppointment>
): Promise<void> {
  try {
    const docRef = doc(db, 'appointments', id);
    await updateDoc(docRef, cleanFirestoreData({
      ...data,
      updatedAt: getNowIso(),
    }));
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `appointments/${id}`);
    throw error;
  }
}

export async function deleteAppointment(id: string): Promise<void> {
  try {
    const docRef = doc(db, 'appointments', id);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `appointments/${id}`);
    throw error;
  }
}

export async function clearProductsCatalog() {
  try {
    const snap = await getDocs(collection(db, 'products'));
    console.log(`Clearing products catalog: found ${snap.docs.length} products to delete.`);
    const docs = snap.docs;
    for (let i = 0; i < docs.length; i += 500) {
      const batch = writeBatch(db);
      const chunk = docs.slice(i, i + 500);
      for (const d of chunk) {
        batch.delete(d.ref);
      }
      await batch.commit();
    }
    console.log('Products catalog cleared successfully.');
  } catch (error) {
    console.error('Error clearing products catalog:', error);
    handleFirestoreError(error, OperationType.DELETE, 'products');
    throw error;
  }
}

// Function to empty products, invoices, suppliers, budgets, sales, workOrders and services so the user can start from zero
export async function clearCatalogAndInvoicesDatabase() {
  try {
    const collectionsToClear = [
      'products',
      'invoices',
      'suppliers',
      'budgets',
      'sales',
      'workOrders',
      'clients',
      'vehicles',
      'expenses',
      'reminders',
      'appointments',
    ];

    for (const colName of collectionsToClear) {
      const snap = await getDocs(collection(db, colName));
      const docs = snap.docs;
      for (let i = 0; i < docs.length; i += 500) {
        const batch = writeBatch(db);
        const chunk = docs.slice(i, i + 500);
        for (const d of chunk) {
          batch.delete(d.ref);
        }
        await batch.commit();
      }
    }

    // Reset servicesCatalog in settings to empty array
    const setRef = doc(db, 'settings', 'general');
    const setSnap = await getDoc(setRef);
    if (setSnap.exists()) {
      await updateDoc(setRef, { servicesCatalog: [] });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, 'catalog-reset');
  }
}

// Direct hard pull from Firestore for Clients and Vehicles
export async function fetchDirectClientsAndVehicles(): Promise<{
  clients: Client[];
  vehicles: Vehicle[];
}> {
  try {
    const clientsSnap = await getDocs(collection(db, 'clients'));
    const clients: Client[] = clientsSnap.docs
      .map((d) => ({ id: d.id, ...d.data() } as Client))
      .filter((c) => c.active !== false)
      .sort((a, b) => (a.fullName || '').localeCompare(b.fullName || ''));

    const vehiclesSnap = await getDocs(collection(db, 'vehicles'));
    const vehicles: Vehicle[] = vehiclesSnap.docs
      .map((d) => ({ id: d.id, ...d.data() } as Vehicle))
      .filter((v) => v.active !== false)
      .sort((a, b) => (a.licensePlate || '').localeCompare(b.licensePlate || ''));

    // Cache pulled data locally in IndexedDB
    saveCachedClients(clients).catch((e) => console.warn('Cache client write error:', e));
    saveCachedVehicles(vehicles).catch((e) => console.warn('Cache vehicle write error:', e));

    return { clients, vehicles };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'clients-vehicles-pull');
    throw error;
  }
}

/**
 * Restores initial sample Clients, Vehicles, Budgets, and Appointments to Firestore
 */
export async function restoreSampleData(): Promise<{
  clientsCount: number;
  vehiclesCount: number;
  budgetsCount: number;
}> {
  try {
    const now = getNowIso();
    const todayStr = now.split('T')[0];

    // 1. Create Sample Clients
    const client1Id = await createClient({
      fullName: 'Juan Carlos Pérez',
      documentNumber: '28492019',
      phone: '1164884571',
      whatsapp: '5491164884571',
      email: 'jcperez@gmail.com',
      address: 'Av. San Martín 450, Belén de Escobar',
      notes: 'Cliente habitual. Prefiere aceite sintético Shell Helix 5W30.',
      branchId: 'escobar',
      active: true,
    });

    const client2Id = await createClient({
      fullName: 'María Laura González',
      documentNumber: '32901844',
      phone: '1154329876',
      whatsapp: '5491154329876',
      email: 'mlaurag@hotmail.com',
      address: 'Calle Mendoza 1220, Ing. Maschwitz',
      notes: 'Consultó por presupuestos de suspensión y frenos.',
      branchId: 'maschwitz',
      active: true,
    });

    const client3Id = await createClient({
      fullName: 'Esteban Rodríguez',
      documentNumber: '30192833',
      phone: '1133221100',
      whatsapp: '5491133221100',
      address: 'Calle Tapia de Cruz 890, Escobar',
      branchId: 'escobar',
      active: true,
    });

    const client4Id = await createClient({
      fullName: 'Transporte Rápido S.A.',
      documentNumber: '30-71234567-8',
      phone: '1164884571',
      whatsapp: '5491164884571',
      email: 'logistica@transporterapido.com',
      address: 'Colectora Este KM 48, Escobar',
      notes: 'Flotas comerciales. Requiere factura A.',
      branchId: 'escobar',
      active: true,
    });

    // 2. Create Sample Vehicles
    await createVehicle({
      licensePlate: 'AF123JK',
      brand: 'Volkswagen',
      model: 'Amarok 2.0 TDI Comfortline',
      year: 2022,
      currentKm: 65400,
      lastServiceKm: 55000,
      clientId: client1Id,
      clientName: 'Juan Carlos Pérez',
      branchId: 'escobar',
      active: true,
    });

    await createVehicle({
      licensePlate: 'AA987ZZ',
      brand: 'Ford',
      model: 'Ranger 3.2 Limited 4x4',
      year: 2020,
      currentKm: 82100,
      lastServiceKm: 70000,
      clientId: client2Id,
      clientName: 'María Laura González',
      branchId: 'maschwitz',
      active: true,
    });

    await createVehicle({
      licensePlate: 'AB456CD',
      brand: 'Toyota',
      model: 'Hilux SRV 2.8 TDI',
      year: 2021,
      currentKm: 94500,
      lastServiceKm: 85000,
      clientId: client3Id,
      clientName: 'Esteban Rodríguez',
      branchId: 'escobar',
      active: true,
    });

    await createVehicle({
      licensePlate: 'AC789EF',
      brand: 'Mercedes-Benz',
      model: 'Sprinter 311 CDI Furgón',
      year: 2019,
      currentKm: 145000,
      lastServiceKm: 135000,
      clientId: client4Id,
      clientName: 'Transporte Rápido S.A.',
      branchId: 'escobar',
      active: true,
    });

    // 3. Create Sample Budgets
    await createBudget({
      budgetNumber: 'P-00101',
      clientName: 'Juan Carlos Pérez',
      clientPhone: '1164884571',
      clientWhatsapp: '5491164884571',
      licensePlate: 'AF123JK',
      vehicleBrand: 'Volkswagen',
      vehicleModel: 'Amarok 2.0 TDI',
      vehicleYear: 2022,
      items: [
        {
          id: 'bitem-1',
          description: 'Service Completo Aceite Sintético 5W30 + Filtros (Aceite, Aire, Combustible, Habitáculo)',
          quantity: 1,
          unitPrice: 68500,
          totalPrice: 68500,
          category: 'aceite_filtro',
        },
        {
          id: 'bitem-2',
          description: 'Revisión y Cambio de Pastillas de Freno Delanteras',
          quantity: 1,
          unitPrice: 32000,
          totalPrice: 32000,
          category: 'mecanica',
        },
      ],
      total: 100500,
      status: 'pendiente',
      observations: 'Presupuesto enviado por WhatsApp. Pendiente de confirmación de turno.',
      branchId: 'escobar',
    });

    await createBudget({
      budgetNumber: 'P-00102',
      clientName: 'María Laura González',
      clientPhone: '1154329876',
      clientWhatsapp: '5491154329876',
      licensePlate: 'AA987ZZ',
      vehicleBrand: 'Ford',
      vehicleModel: 'Ranger 3.2 Limited',
      vehicleYear: 2020,
      items: [
        {
          id: 'bitem-3',
          description: 'Cambio de Amortiguadores Delanteros y Bieletas de Estabilizadora',
          quantity: 1,
          unitPrice: 84000,
          totalPrice: 84000,
          category: 'mecanica',
        },
        {
          id: 'bitem-4',
          description: 'Alineación 3D Computarizada y Balanceo de las 4 Ruedas',
          quantity: 1,
          unitPrice: 18000,
          totalPrice: 18000,
          category: 'mecanica',
        },
      ],
      total: 102000,
      status: 'aprobado',
      observations: 'Aprobado por cliente vía WhatsApp. Programando fecha de trabajo.',
      branchId: 'maschwitz',
    });

    await createBudget({
      budgetNumber: 'P-00103',
      clientName: 'Esteban Rodríguez',
      clientPhone: '1133221100',
      clientWhatsapp: '5491133221100',
      licensePlate: 'AB456CD',
      vehicleBrand: 'Toyota',
      vehicleModel: 'Hilux SRV 2.8',
      vehicleYear: 2021,
      items: [
        {
          id: 'bitem-5',
          description: 'Kit de Distribución + Bomba de Agua + Correa Poly-V y Tensor',
          quantity: 1,
          unitPrice: 125000,
          totalPrice: 125000,
          category: 'mecanica',
        },
        {
          id: 'bitem-6',
          description: 'Reemplazo Aceite de Diferencial Trasero y Delantero (75W90 Synthetic)',
          quantity: 1,
          unitPrice: 42000,
          totalPrice: 42000,
          category: 'aceite_filtro',
        },
      ],
      total: 167000,
      status: 'pendiente',
      observations: 'Cotización solicitada para service de los 95.000 KM.',
      branchId: 'escobar',
    });

    // 4. Create Sample Appointments
    await createAppointment({
      clientName: 'María Laura González',
      clientPhone: '1154329876',
      clientWhatsapp: '5491154329876',
      licensePlate: 'AA987ZZ',
      vehicleBrand: 'Ford',
      vehicleModel: 'Ranger 3.2',
      vehicleYear: 2020,
      date: todayStr,
      time: '10:30',
      serviceType: 'mecanica_integral',
      status: 'confirmado',
      branchId: 'maschwitz',
      notes: 'Presupuesto #P-00102 aprobado. Realización de cambio de amortiguadores.',
    });

    await createAppointment({
      clientName: 'Juan Carlos Pérez',
      clientPhone: '1164884571',
      clientWhatsapp: '5491164884571',
      licensePlate: 'AF123JK',
      vehicleBrand: 'Volkswagen',
      vehicleModel: 'Amarok 2.0 TDI',
      vehicleYear: 2022,
      date: todayStr,
      time: '15:00',
      serviceType: 'aceite_filtro',
      status: 'pendiente',
      branchId: 'escobar',
      notes: 'Service de aceite y filtros + revisión de pastillas de freno.',
    });

    return { clientsCount: 4, vehiclesCount: 4, budgetsCount: 3 };
  } catch (error) {
    console.error('Error restoring sample data:', error);
    throw error;
  }
}
