import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider, useToast } from './components/common/Toast';
import { LoginView } from './components/auth/LoginView';
import { Header } from './components/layout/Header';
import { Sidebar, TabId } from './components/layout/Sidebar';
import { Dashboard } from './components/dashboard/Dashboard';
import { WorkOrdersList } from './components/workOrders/WorkOrdersList';
import { WorkOrderForm } from './components/workOrders/WorkOrderForm';
import { WorkOrderDetailModal } from './components/workOrders/WorkOrderDetailModal';
import { SalesList } from './components/sales/SalesList';
import { NewSaleModal } from './components/sales/NewSaleModal';
import { DeliveryNoteModal } from './components/sales/DeliveryNoteModal';
import { BudgetsList } from './components/budgets/BudgetsList';
import { BudgetFormModal } from './components/budgets/BudgetFormModal';
import { BudgetDetailModal } from './components/budgets/BudgetDetailModal';
import { ClientsList } from './components/clients/ClientsList';
import { VehiclesList } from './components/vehicles/VehiclesList';
import { CashManagement } from './components/cash/CashManagement';
import { ProductsList } from './components/products/ProductsList';
import { RemindersList } from './components/reminders/RemindersList';
import { ReportsView } from './components/reports/ReportsView';
import { SettingsView } from './components/settings/SettingsView';
import { InvoicesList } from './components/invoices/InvoicesList';
import { SuppliersList } from './components/suppliers/SuppliersList';
import { InvoicesCalendar } from './components/invoices/InvoicesCalendar';
import { AppointmentsCalendar } from './components/appointments/AppointmentsCalendar';
import { AppointmentFormModal } from './components/appointments/AppointmentFormModal';
import {
  WorkOrder,
  WorkOrderType,
  WorkOrderStatus,
  Sale,
  Budget,
  Client,
  Vehicle,
  Product,
  Expense,
  Reminder,
  CompanySettings,
  Supplier,
  Invoice,
  ServiceAppointment,
} from './types';
import {
  subscribeWorkOrders,
  createWorkOrder,
  updateWorkOrderStatus,
  subscribeSales,
  createSale,
  subscribeBudgets,
  createBudget,
  updateBudget,
  subscribeClients,
  createClient,
  updateClient,
  subscribeVehicles,
  createVehicle,
  subscribeProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  subscribeExpenses,
  createExpense,
  subscribeReminders,
  updateReminderStatus,
  subscribeSettings,
  updateSettings,
  subscribeInvoices,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  subscribeSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  subscribeAppointments,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  clearCatalogAndInvoicesDatabase,
  clearProductsCatalog,
} from './services/db';
import { Fuel, Loader2 } from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { user, profile, loading, currentBranch, isAdmin, canAccessSupplierModules } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Database states
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [settings, setSettings] = useState<CompanySettings>();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [appointments, setAppointments] = useState<ServiceAppointment[]>([]);

  // Guard against unauthorized tab access
  // Modules FACTURAS, PROVEEDORES, CALENDARIO DE VENCIMIENTOS are STRICTLY restricted
  // to: Lubricentro (Admin), Fede (Admin), and the Google Owner account.
  useEffect(() => {
    if (
      !canAccessSupplierModules &&
      (activeTab === 'invoices' || activeTab === 'suppliers' || activeTab === 'calendar')
    ) {
      setActiveTab('dashboard');
      return;
    }
    if (
      !isAdmin &&
      (activeTab === 'products' || activeTab === 'reports' || activeTab === 'settings')
    ) {
      setActiveTab('dashboard');
    }
  }, [isAdmin, canAccessSupplierModules, activeTab]);

  // Modals state
  const [isWorkOrderFormOpen, setIsWorkOrderFormOpen] = useState(false);
  const [workOrderInitialType, setWorkOrderInitialType] = useState<WorkOrderType>('aceite_filtro');
  const [workOrderPresetData, setWorkOrderPresetData] = useState<Partial<WorkOrder> | undefined>();

  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null);

  const [isNewSaleOpen, setIsNewSaleOpen] = useState(false);
  const [activeRemitoSale, setActiveRemitoSale] = useState<Sale | null>(null);

  const [isNewBudgetOpen, setIsNewBudgetOpen] = useState(false);
  const [activeBudgetModal, setActiveBudgetModal] = useState<Budget | null>(null);
  const [appointmentFromWorkOrder, setAppointmentFromWorkOrder] = useState<WorkOrder | null>(null);

  // Subscribe to real-time collections when user is authenticated
  useEffect(() => {
    if (!user) return;

    const unsubOrders = subscribeWorkOrders(currentBranch, setWorkOrders);
    const unsubSales = subscribeSales(currentBranch, setSales);
    const unsubBudgets = subscribeBudgets(currentBranch, setBudgets);
    const unsubClients = subscribeClients(currentBranch, setClients);
    const unsubVehicles = subscribeVehicles(currentBranch, setVehicles);
    const unsubProducts = subscribeProducts(setProducts);
    const unsubExpenses = subscribeExpenses(currentBranch, setExpenses);
    const unsubReminders = subscribeReminders(currentBranch, setReminders);
    const unsubSettings = subscribeSettings(setSettings);
    const unsubAppointments = subscribeAppointments(setAppointments);

    // Only subscribe to invoices and suppliers if Lubricentro, Fede, or Google Owner Account
    let unsubInvoices: (() => void) | undefined;
    let unsubSuppliers: (() => void) | undefined;
    if (canAccessSupplierModules) {
      unsubInvoices = subscribeInvoices(setInvoices);
      unsubSuppliers = subscribeSuppliers(setSuppliers);
    }

    return () => {
      unsubOrders && unsubOrders();
      unsubSales && unsubSales();
      unsubBudgets && unsubBudgets();
      unsubClients && unsubClients();
      unsubVehicles && unsubVehicles();
      unsubProducts && unsubProducts();
      unsubExpenses && unsubExpenses();
      unsubReminders && unsubReminders();
      unsubSettings && unsubSettings();
      unsubAppointments && unsubAppointments();
      unsubInvoices && unsubInvoices();
      unsubSuppliers && unsubSuppliers();
    };
  }, [user, currentBranch, canAccessSupplierModules]);

  // Handle Work Order Creation (also creates/updates Vehicle and Client if new)
  const handleSaveWorkOrder = async (orderData: Omit<WorkOrder, 'id'>) => {
    try {
      const orderId = await createWorkOrder(orderData);

      // Check if client exists, otherwise create
      let matchedClient = clients.find(
        (c) => c.fullName.trim().toLowerCase() === orderData.clientName.trim().toLowerCase()
      );
      if (!matchedClient) {
        const newClientId = await createClient({
          fullName: orderData.clientName,
          phone: orderData.clientPhone,
          whatsapp: orderData.clientWhatsapp,
          branchId: orderData.branchId,
          active: true,
        });
        matchedClient = {
          id: newClientId,
          fullName: orderData.clientName,
          phone: orderData.clientPhone,
          whatsapp: orderData.clientWhatsapp,
          branchId: orderData.branchId,
          active: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }

      // Check if vehicle exists, otherwise create
      const matchedVehicle = vehicles.find(
        (v) => v.licensePlate.trim().toUpperCase() === orderData.licensePlate.trim().toUpperCase()
      );
      if (!matchedVehicle) {
        await createVehicle({
          licensePlate: orderData.licensePlate,
          brand: orderData.vehicleBrand,
          model: orderData.vehicleModel,
          year: orderData.vehicleYear,
          currentKm: orderData.currentKm,
          lastServiceKm: orderData.lastServiceKm,
          clientId: matchedClient.id,
          clientName: orderData.clientName,
          branchId: orderData.branchId,
          active: true,
        });
      }

      // If converted from budget, link budget
      if (orderData.notes && orderData.notes.includes('Convertido de Presupuesto #')) {
        const match = orderData.notes.match(/Presupuesto #([A-Z0-9-]+)/);
        if (match && match[1]) {
          const bMatch = budgets.find((b) => b.budgetNumber === match[1]);
          if (bMatch) {
            await updateBudget(bMatch.id, {
              status: 'convertido_ot',
              convertedWorkOrderId: orderId,
            });
          }
        }
      }

      showToast(`Orden #${orderData.orderNumber} creada con éxito`, 'success');
      setWorkOrderPresetData(undefined);
      setActiveTab('workOrders');
    } catch (err: any) {
      console.error(err);
      showToast('Error al crear la orden de trabajo', 'error');
    }
  };

  const handleUpdateOrderStatus = async (
    orderId: string,
    newStatus: WorkOrderStatus,
    note?: string
  ) => {
    try {
      await updateWorkOrderStatus(
        orderId,
        newStatus,
        profile?.displayName || user?.displayName || 'Usuario',
        note
      );
      showToast(`Estado actualizado a ${newStatus}`, 'success');

      // Update local state if currently viewing in detail modal
      if (selectedWorkOrder && selectedWorkOrder.id === orderId) {
        setSelectedWorkOrder((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
    } catch (err) {
      showToast('Error al actualizar estado', 'error');
    }
  };

  // Convert budget to OT
  const handleConvertToWorkOrder = async (budget: Budget) => {
    setActiveBudgetModal(null);
    await updateBudget(budget.id, { status: 'convertido_ot' });

    setWorkOrderPresetData({
      type: 'mecanica_integral',
      clientName: budget.clientName,
      clientPhone: budget.clientPhone,
      clientWhatsapp: budget.clientWhatsapp || budget.clientPhone,
      licensePlate: budget.licensePlate,
      vehicleBrand: budget.vehicleBrand,
      vehicleModel: budget.vehicleModel,
      vehicleYear: budget.vehicleYear || new Date().getFullYear(),
      total: budget.total,
      notes: `Convertido de Presupuesto #${budget.budgetNumber}. ${budget.observations || ''}`.trim(),
      servicesSelected: budget.items.map((i) => i.description),
    });
    setWorkOrderInitialType('mecanica_integral');
    setIsWorkOrderFormOpen(true);
    setActiveTab('workOrders');
    showToast(`Presupuesto #${budget.budgetNumber} migrado a Órdenes de Trabajo`, 'success');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100 p-4">
        <div className="mb-4">
          {settings?.logoUrl ? (
            <img
              src={settings.logoUrl}
              alt="Lubricentro 2.0"
              className="h-16 w-auto max-w-[220px] object-contain mx-auto animate-pulse select-none"
            />
          ) : (
            <img
              src="/lubricentro-logo.svg"
              alt="Lubricentro 2.0"
              className="h-16 w-auto max-w-[220px] object-contain mx-auto animate-pulse select-none"
            />
          )}
        </div>
        <p className="text-xs text-slate-400 mt-2 flex items-center gap-2">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-red-500" />
          <span>Iniciando sistema central en tiempo real...</span>
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <LoginView
        logoUrl={settings?.logoUrl}
        companyName={settings?.companyName}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-red-600 selection:text-white">
      {/* Top Header */}
      <Header
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        activeTab={activeTab}
        logoUrl={settings?.logoUrl}
        companyName={settings?.companyName}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Responsive Sidebar */}
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          activeTab={activeTab}
          onSelectTab={(tab) => setActiveTab(tab)}
          logoUrl={settings?.logoUrl}
          companyName={settings?.companyName}
        />

        {/* Main Workspace Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'dashboard' && (
              <Dashboard
                workOrders={workOrders}
                sales={sales}
                expenses={expenses}
                reminders={reminders}
                invoices={invoices}
                onNavigate={(tab) => setActiveTab(tab)}
                onOpenNewWorkOrder={(type) => {
                  setWorkOrderPresetData(undefined);
                  setWorkOrderInitialType(type);
                  setIsWorkOrderFormOpen(true);
                }}
                onOpenNewSale={() => setIsNewSaleOpen(true)}
                onOpenNewExpense={() => setActiveTab('cash')}
              />
            )}

            {activeTab === 'appointments' && (
              <AppointmentsCalendar
                appointments={appointments}
                clients={clients}
                vehicles={vehicles}
                settings={settings}
                onSaveAppointment={async (data) => {
                  const id = await createAppointment(data);
                  showToast('Turno agendado con éxito', 'success');
                  return id;
                }}
                onUpdateAppointment={async (id, data) => {
                  await updateAppointment(id, data);
                  showToast('Turno actualizado', 'success');
                }}
                onDeleteAppointment={async (id) => {
                  await deleteAppointment(id);
                  showToast('Turno eliminado', 'info');
                }}
                onConvertToWorkOrder={(app) => {
                  setWorkOrderInitialType('mecanica_integral');
                  setWorkOrderPresetData({
                    type: app.serviceType === 'aceite_filtro' ? 'aceite_filtro' : 'mecanica_integral',
                    clientName: app.clientName,
                    clientPhone: app.clientPhone,
                    clientWhatsapp: app.clientWhatsapp,
                    licensePlate: app.licensePlate,
                    vehicleBrand: app.vehicleBrand,
                    vehicleModel: app.vehicleModel,
                    vehicleYear: app.vehicleYear,
                    branchId: (app.branchId === 'ambas' ? (currentBranch === 'todas' ? 'escobar' : currentBranch) : app.branchId) as any,
                    notes: `Turno agendado el ${app.date} a las ${app.time}hs. Servicio: ${app.serviceType}. ${app.notes || ''}`.trim(),
                  });
                  setIsWorkOrderFormOpen(true);
                  setActiveTab('workOrders');
                  showToast('Turno transferido a la nueva Orden de Trabajo', 'info');
                }}
              />
            )}

            {activeTab === 'workOrders' && (
              <WorkOrdersList
                workOrders={workOrders}
                onOpenOrder={(order) => setSelectedWorkOrder(order)}
                onScheduleAppointment={(order) => setAppointmentFromWorkOrder(order)}
                onNewOrder={(type) => {
                  setWorkOrderPresetData(undefined);
                  setWorkOrderInitialType(type);
                  setIsWorkOrderFormOpen(true);
                }}
              />
            )}

            {activeTab === 'sales' && (
              <SalesList
                sales={sales}
                onNewSale={() => setIsNewSaleOpen(true)}
                onViewRemito={(sale) => setActiveRemitoSale(sale)}
              />
            )}

            {activeTab === 'budgets' && (
              <BudgetsList
                budgets={budgets}
                onNewBudget={() => setIsNewBudgetOpen(true)}
                onViewBudget={(b) => setActiveBudgetModal(b)}
                onConvertToWorkOrder={handleConvertToWorkOrder}
              />
            )}

            {activeTab === 'clients' && (
              <ClientsList
                clients={clients}
                vehicles={vehicles}
                workOrders={workOrders}
                onSaveClient={async (data) => {
                  await createClient(data);
                  showToast('Cliente guardado correctamente', 'success');
                }}
                onUpdateClient={async (id, data) => {
                  await updateClient(id, data);
                  showToast('Cliente actualizado correctamente', 'success');
                }}
                onSelectVehiclePlate={(plate) => {
                  setActiveTab('vehicles');
                }}
              />
            )}

            {activeTab === 'vehicles' && (
              <VehiclesList
                vehicles={vehicles}
                workOrders={workOrders}
                budgets={budgets}
                sales={sales}
                onOpenWorkOrder={(o) => setSelectedWorkOrder(o)}
              />
            )}

            {activeTab === 'cash' && (
              <CashManagement
                workOrders={workOrders}
                sales={sales}
                expenses={expenses}
                onSaveExpense={async (data) => {
                  const id = await createExpense(data);
                  showToast('Egreso registrado correctamente', 'success');
                  return id;
                }}
                settings={settings}
              />
            )}

            {activeTab === 'products' && isAdmin && (
              <ProductsList
                products={products}
                onSaveProduct={async (data) => {
                  await createProduct(data);
                  showToast('Producto añadido al catálogo', 'success');
                }}
                onUpdateProduct={async (id, data) => {
                  await updateProduct(id, data);
                  showToast('Producto actualizado', 'success');
                }}
                onDeleteProduct={async (id) => {
                  try {
                    await deleteProduct(id);
                    showToast('Producto eliminado del catálogo', 'info');
                  } catch (err: any) {
                    console.error('Error al eliminar producto:', err);
                    showToast('No se pudo eliminar el producto.', 'error');
                  }
                }}
                onClearAllProducts={async () => {
                  try {
                    await clearProductsCatalog();
                    showToast('Se eliminaron todos los productos del catálogo', 'info');
                  } catch (err) {
                    showToast('Error al vaciar el catálogo de productos', 'error');
                  }
                }}
              />
            )}

            {activeTab === 'reminders' && (
              <RemindersList
                reminders={reminders}
                onUpdateStatus={async (id, status) => {
                  await updateReminderStatus(id, status);
                  showToast('Recordatorio actualizado', 'success');
                }}
                settings={settings}
              />
            )}

            {activeTab === 'reports' && isAdmin && (
              <ReportsView
                workOrders={workOrders}
                sales={sales}
                expenses={expenses}
                budgets={budgets}
              />
            )}

            {activeTab === 'invoices' && canAccessSupplierModules && (
              <InvoicesList
                invoices={invoices}
                suppliers={suppliers}
                onSaveInvoice={async (data) => {
                  const id = await createInvoice(data);
                  showToast('Factura guardada correctamente', 'success');
                  return id;
                }}
                onUpdateInvoice={async (id, data) => {
                  await updateInvoice(id, data);
                  showToast('Factura actualizada', 'success');
                }}
                onDeleteInvoice={async (id) => {
                  try {
                    await deleteInvoice(id);
                    showToast('Factura eliminada', 'info');
                  } catch (err) {
                    showToast('Error al eliminar la factura', 'error');
                  }
                }}
                onNavigateToCalendar={() => setActiveTab('calendar')}
                onNavigateToSuppliers={() => setActiveTab('suppliers')}
              />
            )}

            {activeTab === 'suppliers' && canAccessSupplierModules && (
              <SuppliersList
                suppliers={suppliers}
                invoices={invoices}
                onSaveSupplier={async (data) => {
                  const id = await createSupplier(data);
                  showToast('Proveedor guardado correctamente', 'success');
                  return id;
                }}
                onUpdateSupplier={async (id, data) => {
                  await updateSupplier(id, data);
                  showToast('Proveedor actualizado', 'success');
                }}
                onDeleteSupplier={async (id) => {
                  try {
                    await deleteSupplier(id);
                    showToast('Proveedor eliminado', 'info');
                  } catch (err) {
                    showToast('Error al eliminar el proveedor', 'error');
                  }
                }}
                onOpenNewInvoiceForSupplier={() => setActiveTab('invoices')}
                onViewInvoice={() => setActiveTab('invoices')}
                onToggleInvoicePaid={async (inv) => {
                  const newStatus = inv.status === 'pagada' ? 'pendiente' : 'pagada';
                  await updateInvoice(inv.id, {
                    status: newStatus,
                    paymentDate: newStatus === 'pagada' ? new Date().toISOString().split('T')[0] : undefined,
                  });
                  showToast(
                    newStatus === 'pagada' ? 'Factura marcada como pagada' : 'Factura marcada como pendiente',
                    'success'
                  );
                }}
              />
            )}

            {activeTab === 'calendar' && canAccessSupplierModules && (
              <InvoicesCalendar
                invoices={invoices}
                suppliers={suppliers}
                onSaveInvoice={async (data) => {
                  const id = await createInvoice(data);
                  showToast('Factura guardada correctamente', 'success');
                  return id;
                }}
                onUpdateInvoice={async (id, data) => {
                  await updateInvoice(id, data);
                  showToast('Factura actualizada', 'success');
                }}
                onDeleteInvoice={async (id) => {
                  await deleteInvoice(id);
                  showToast('Factura eliminada', 'info');
                }}
                onNavigateToInvoices={() => setActiveTab('invoices')}
              />
            )}

            {activeTab === 'settings' && isAdmin && (
              <SettingsView
                settings={settings}
                onSaveSettings={async (data) => {
                  await updateSettings(data);
                  showToast('Configuración guardada correctamente', 'success');
                }}
                onClearDatabase={async () => {
                  await clearCatalogAndInvoicesDatabase();
                  setProducts([]);
                  setInvoices([]);
                  setSuppliers([]);
                  showToast('Se limpiaron los productos, facturas y proveedores con éxito', 'info');
                }}
              />
            )}
          </div>
        </main>
      </div>

      {/* Global Modals */}
      {/* 1. New Work Order Form */}
      <WorkOrderForm
        isOpen={isWorkOrderFormOpen}
        onClose={() => {
          setIsWorkOrderFormOpen(false);
          setWorkOrderPresetData(undefined);
        }}
        onSave={handleSaveWorkOrder}
        initialType={workOrderInitialType}
        clients={clients}
        vehicles={vehicles}
        products={products}
        settings={settings}
        presetData={workOrderPresetData}
        workOrders={workOrders}
        budgets={budgets}
        sales={sales}
      />

      {/* 2. Work Order Details / Status / Print Sheet */}
      <WorkOrderDetailModal
        isOpen={!!selectedWorkOrder}
        onClose={() => setSelectedWorkOrder(null)}
        order={selectedWorkOrder}
        onUpdateStatus={handleUpdateOrderStatus}
        onScheduleAppointment={(order) => setAppointmentFromWorkOrder(order)}
        settings={settings}
      />

      {/* Schedule Shift Linked Directly to Work Order */}
      {appointmentFromWorkOrder && (
        <AppointmentFormModal
          isOpen={!!appointmentFromWorkOrder}
          onClose={() => setAppointmentFromWorkOrder(null)}
          presetWorkOrder={appointmentFromWorkOrder}
          clients={clients}
          vehicles={vehicles}
          settings={settings}
          onSave={async (data) => {
            const id = await createAppointment(data);
            showToast(
              `Turno agendado y vinculado a la OT #${appointmentFromWorkOrder.orderNumber}`,
              'success'
            );
            setAppointmentFromWorkOrder(null);
            setActiveTab('appointments');
            return id;
          }}
        />
      )}

      {/* 3. New Sale Counter Modal */}
      <NewSaleModal
        isOpen={isNewSaleOpen}
        onClose={() => setIsNewSaleOpen(false)}
        products={products}
        onSaveSale={async (data) => {
          const id = await createSale(data);
          showToast('Venta registrada con éxito', 'success');
          return id;
        }}
        onCreated={(completeSale) => {
          setActiveRemitoSale(completeSale);
        }}
      />

      {/* 4. Commercial Delivery Note (Remito) */}
      <DeliveryNoteModal
        isOpen={!!activeRemitoSale}
        onClose={() => setActiveRemitoSale(null)}
        sale={activeRemitoSale}
        settings={settings}
      />

      {/* 5. New Budget Form */}
      <BudgetFormModal
        isOpen={isNewBudgetOpen}
        onClose={() => setIsNewBudgetOpen(false)}
        clients={clients}
        vehicles={vehicles}
        products={products}
        onSaveBudget={async (data) => {
          const id = await createBudget(data);
          showToast('Presupuesto creado con éxito', 'success');
          setActiveBudgetModal({
            id,
            ...data,
            createdAt: new Date().toISOString(),
          });
          return id;
        }}
      />

      {/* 6. Budget Details / Print Sheet */}
      <BudgetDetailModal
        isOpen={!!activeBudgetModal}
        onClose={() => setActiveBudgetModal(null)}
        budget={activeBudgetModal}
        onConvertToWorkOrder={handleConvertToWorkOrder}
        settings={settings}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <MainAppContent />
      </ToastProvider>
    </AuthProvider>
  );
}
