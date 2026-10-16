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
  branchId: BranchId,
  callback: (orders: WorkOrder[]) => void,
  onError?: (err: any) => void
) {
  const collPath = 'workOrders';
  try {
    const q = collection(db, collPath);
    return onSnapshot(
      q,
      (snapshot) => {
        let list: WorkOrder[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as WorkOrder[];

        if (branchId && branchId !== 'todas') {
          list = list.filter((item) => item.branchId === branchId);
        }

        // Sort by createdAt desc
        list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
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

    // Also auto-create a reminder if next service date or KM is indicated
    if (data.nextServiceDate || data.nextServiceKm) {
      await createReminder({
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
      });
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
  branchId: BranchId,
  callback: (clients: Client[]) => void
) {
  const collPath = 'clients';
  try {
    return onSnapshot(
      collection(db, collPath),
      (snapshot) => {
        let list = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Client[];

        if (branchId && branchId !== 'todas') {
          list = list.filter((c) => c.branchId === branchId || !c.branchId);
        }

        list.sort((a, b) => (a.fullName || '').localeCompare(b.fullName || ''));
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
  branchId: BranchId,
  callback: (vehicles: Vehicle[]) => void
) {
  const collPath = 'vehicles';
  try {
    return onSnapshot(
      collection(db, collPath),
      (snapshot) => {
        let list = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Vehicle[];

        if (branchId && branchId !== 'todas') {
          list = list.filter((v) => v.branchId === branchId || !v.branchId);
        }

        list.sort((a, b) => (a.licensePlate || '').localeCompare(b.licensePlate || ''));
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

    // Optionally deduct stock if productId is present
    for (const item of data.items) {
      if (item.productId) {
        try {
          const pDoc = await getDoc(doc(db, 'products', item.productId));
          if (pDoc.exists()) {
            const currentStock = pDoc.data().stock || 0;
            await updateDoc(doc(db, 'products', item.productId), {
              stock: Math.max(0, currentStock - item.quantity),
              updatedAt: getNowIso(),
            });
          }
        } catch (e) {
          console.warn('Stock update skipped for item:', item.name);
        }
      }
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
  branchId: BranchId,
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

        if (branchId && branchId !== 'todas') {
          list = list.filter((b) => b.branchId === branchId);
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
// 8. REMINDERS (RECORDATORIOS)
// ========================
export function subscribeReminders(
  branchId: BranchId,
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

        if (branchId && branchId !== 'todas') {
          list = list.filter((r) => r.branchId === branchId);
        }

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
  try {
    return onSnapshot(
      doc(db, 'settings', 'general'),
      (snapshot) => {
        if (snapshot.exists()) {
          callback(snapshot.data() as CompanySettings);
        } else {
          // Initialize if missing
          setDoc(doc(db, 'settings', 'general'), DEFAULT_SETTINGS)
            .then(() => callback(DEFAULT_SETTINGS))
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
    // Automatically clear products catalog
    const prodSnap = await getDocs(collection(db, 'products'));
    if (!prodSnap.empty) {
      console.log('Clearing existing products catalog...');
      for (const d of prodSnap.docs) {
        await deleteDoc(d.ref);
      }
    }

    // Check settings
    const setSnap = await getDoc(doc(db, 'settings', 'general'));
    if (!setSnap.exists()) {
      await setDoc(doc(db, 'settings', 'general'), DEFAULT_SETTINGS);
    }

    // Check suppliers
    const suppSnap = await getDocs(collection(db, 'suppliers'));
    if (suppSnap.empty) {
      console.log('Seeding initial suppliers...');
      const createdSupplierMap: Record<string, string> = {};
      for (const supp of INITIAL_SUPPLIERS) {
        const ref = await addDoc(collection(db, 'suppliers'), {
          ...supp,
          createdAt: getNowIso(),
          updatedAt: getNowIso(),
        });
        createdSupplierMap[supp.name] = ref.id;
      }

      // Check invoices
      const invSnap = await getDocs(collection(db, 'invoices'));
      if (invSnap.empty) {
        console.log('Seeding initial invoices...');
        for (const inv of INITIAL_INVOICES) {
          await addDoc(collection(db, 'invoices'), {
            ...inv,
            supplierId: createdSupplierMap[inv.supplierName] || '',
            createdAt: getNowIso(),
            updatedAt: getNowIso(),
          });
        }
      }
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

