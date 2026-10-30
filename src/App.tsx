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
import { GlobalSearchModal } from './components/common/GlobalSearchModal';
import { sendAdminNotification } from './services/adminNotification';
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
import { DEFAULT_SETTINGS } from './services/seedData';
import { DigitalPassportModal } from './components/stickers/DigitalPassportModal';
import { ServiceStickerModal } from './components/stickers/ServiceStickerModal';
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
  updateVehicle,
  deleteVehicle,
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
  getVehiclePassportData,
  fetchDirectClientsAndVehicles,
  restoreSampleData,
} from './services/db';
import { Loader2 } from 'lucide-react';

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
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(new Date());

  const handleManualPullData = async () => {
    try {
      const { clients: freshClients, vehicles: freshVehicles } = await fetchDirectClientsAndVehicles();
      setClients(freshClients);
      setVehicles(freshVehicles);
      setLastSyncTime(new Date());
      showToast(`Pull manual exitoso: ${freshClients.length} clientes y ${freshVehicles.length} vehículos sincronizados desde Firebase.`, 'success');
      return { clientsCount: freshClients.length, vehiclesCount: freshVehicles.length };
    } catch (err) {
      showToast('Error al realizar el pull manual de datos desde Firebase.', 'error');
      throw err;
    }
  };

  const handleRestoreSampleData = async () => {
    try {
      const res = await restoreSampleData();
      setLastSyncTime(new Date());
      showToast(`Restauración exitosa: ${res.clientsCount} clientes, ${res.vehiclesCount} vehículos y ${res.budgetsCount} presupuestos creados en la base de datos.`, 'success');
    } catch (err) {
      showToast('Error al restaurar los datos de muestra.', 'error');
      throw err;
    }
  };

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
  const [budgetToEdit, setBudgetToEdit] = useState<Budget | null>(null);
  const [activeBudgetModal, setActiveBudgetModal] = useState<Budget | null>(null);
  const [appointmentFromWorkOrder, setAppointmentFromWorkOrder] = useState<WorkOrder | null>(null);
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);

  const handleUpdateBudget = async (id: string, data: Partial<Budget>) => {
    try {
      await updateBudget(id, data);
      showToast('Presupuesto modificado y actualizado correctamente', 'success');
      setBudgetToEdit(null);
    } catch (err) {
      showToast('Error al actualizar el presupuesto', 'error');
      throw err;
    }
  };

  // Sticker & Digital Passport states
  const [passportPlate, setPassportPlate] = useState<string | null>(null);
  const [passportOrders, setPassportOrders] = useState<WorkOrder[]>([]);
  const [passportVehicle, setPassportVehicle] = useState<Vehicle | undefined>(undefined);
  const [activeStickerModal, setActiveStickerModal] = useState<{
    order?: WorkOrder | null;
    vehicle?: Vehicle | null;
  } | null>(null);

  const handleOpenPassport = async (plate: string) => {
    const normPlate = plate.trim().toUpperCase();
    if (!normPlate) return;
    setPassportPlate(normPlate);
    try {
      const data = await getVehiclePassportData(normPlate);
      setPassportOrders(data.workOrders);
      setPassportVehicle(data.vehicle);
    } catch (err) {
      console.error('Error fetching passport data:', err);
    }
  };

  // Inspect URL query parameters for public QR scan (e.g. ?passport=AB123CD)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const plate = params.get('passport') || params.get('qr') || params.get('patente');
    if (plate) {
      handleOpenPassport(plate.trim().toUpperCase());
    }
  }, []);

  // Subscribe to real-time collections when user is authenticated
  useEffect(() => {
    if (!user) return;

    const notifySync = () => setLastSyncTime(new Date());

    const unsubOrders = subscribeWorkOrders(currentBranch, (data) => {
      setWorkOrders(data);
      notifySync();
    });
    const unsubSales = subscribeSales(currentBranch, (data) => {
      setSales(data);
      notifySync();
    });
    const unsubBudgets = subscribeBudgets(currentBranch, (data) => {
      setBudgets(data);
      notifySync();
    });
    const unsubClients = subscribeClients(currentBranch, (data) => {
      setClients(data);
      notifySync();
    });
    const unsubVehicles = subscribeVehicles(currentBranch, (data) => {
      setVehicles(data);
      notifySync();
    });
    const unsubProducts = subscribeProducts((data) => {
      setProducts(data);
      notifySync();
    });
    const unsubExpenses = subscribeExpenses(currentBranch, (data) => {
      setExpenses(data);
      notifySync();
    });
    const unsubReminders = subscribeReminders(currentBranch, (data) => {
      setReminders(data);
      notifySync();
    });
    const unsubSettings = subscribeSettings((data) => {
      setSettings(data);
      notifySync();
    });
    const unsubAppointments = subscribeAppointments((data) => {
      setAppointments(data);
      notifySync();
    });

    // Only subscribe to invoices and suppliers if Lubricentro, Fede, or Google Owner Account
    let unsubInvoices: (() => void) | undefined;
    let unsubSuppliers: (() => void) | undefined;
    if (canAccessSupplierModules) {
      unsubInvoices = subscribeInvoices((data) => {
        setInvoices(data);
        notifySync();
      });
      unsubSuppliers = subscribeSuppliers((data) => {
        setSuppliers(data);
        notifySync();
      });
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

  // Handle Work Order Creation (automatically creates/updates Vehicle and Client permanently in DB)
  const handleSaveWorkOrder = async (orderData: Omit<WorkOrder, 'id'>) => {
    try {
      const orderId = await createWorkOrder(orderData);

      // Trigger asynchronous Admin WhatsApp Notification
      sendAdminNotification({
        type: 'new_ot',
        workOrder: { ...orderData, id: orderId },
        userName: profile?.displayName || user?.displayName || 'Usuario',
        settings,
      });

      // Launch background auxiliary Client, Vehicle, and Budget tasks to ensure full persistence without blocking modal response
      (async () => {
        try {
          // 1. CLIENT SYNCHRONIZATION
          let matchedClient = orderData.clientId
            ? clients.find((c) => c.id === orderData.clientId)
            : undefined;

          if (!matchedClient) {
            const cleanName = orderData.clientName.trim().toLowerCase();
            matchedClient = clients.find(
              (c) => c.fullName.trim().toLowerCase() === cleanName
            );
          }

          if (!matchedClient && (orderData.clientPhone || orderData.clientWhatsapp)) {
            const cleanPhone = (orderData.clientPhone || '').trim();
            const cleanWa = (orderData.clientWhatsapp || '').trim();
            matchedClient = clients.find(
              (c) =>
                (cleanPhone && c.phone === cleanPhone) ||
                (cleanWa && c.whatsapp === cleanWa)
            );
          }

          let targetClientId = matchedClient?.id;

          if (matchedClient) {
            // Update existing client record with latest contact info & active status
            await updateClient(matchedClient.id, {
              fullName: orderData.clientName.trim() || matchedClient.fullName,
              phone: orderData.clientPhone.trim() || matchedClient.phone,
              whatsapp: orderData.clientWhatsapp.trim() || matchedClient.whatsapp,
              branchId: orderData.branchId || matchedClient.branchId,
              active: true,
            });
          } else {
            // Create new client record in CLIENTES collection
            targetClientId = await createClient({
              fullName: orderData.clientName.trim(),
              phone: orderData.clientPhone.trim(),
              whatsapp: orderData.clientWhatsapp.trim() || orderData.clientPhone.trim(),
              branchId: orderData.branchId,
              active: true,
            });
          }

          // 2. VEHICLE SYNCHRONIZATION
          let matchedVehicle = orderData.vehicleId
            ? vehicles.find((v) => v.id === orderData.vehicleId)
            : undefined;

          if (!matchedVehicle) {
            const cleanPlate = orderData.licensePlate.trim().toUpperCase();
            matchedVehicle = vehicles.find(
              (v) => (v.licensePlate || '').trim().toUpperCase() === cleanPlate
            );
          }

          let targetVehicleId = matchedVehicle?.id;

          const newKm = Number(orderData.currentKm) || 0;
          const newLastServiceKm = Number(orderData.lastServiceKm) || newKm;

          if (matchedVehicle) {
            // Update existing vehicle in VEHICULOS & HISTORIAL collection with latest KM and service details
            await updateVehicle(matchedVehicle.id, {
              licensePlate: orderData.licensePlate.trim().toUpperCase(),
              brand: orderData.vehicleBrand.trim() || matchedVehicle.brand,
              model: orderData.vehicleModel.trim() || matchedVehicle.model,
              year: Number(orderData.vehicleYear) || matchedVehicle.year,
              currentKm: newKm > 0 ? newKm : matchedVehicle.currentKm,
              lastServiceKm: newLastServiceKm > 0 ? newLastServiceKm : matchedVehicle.lastServiceKm,
              clientId: targetClientId || matchedVehicle.clientId,
              clientName: orderData.clientName.trim() || matchedVehicle.clientName,
              branchId: orderData.branchId || matchedVehicle.branchId,
              active: true,
            });
          } else if (targetClientId) {
            // Create new vehicle record in VEHICULOS & HISTORIAL collection
            targetVehicleId = await createVehicle({
              licensePlate: orderData.licensePlate.trim().toUpperCase(),
              brand: orderData.vehicleBrand.trim(),
              model: orderData.vehicleModel.trim(),
              year: Number(orderData.vehicleYear) || new Date().getFullYear(),
              currentKm: newKm,
              lastServiceKm: newLastServiceKm,
              clientId: targetClientId,
              clientName: orderData.clientName.trim(),
              branchId: orderData.branchId,
              active: true,
            });
          }

          // 3. LINK GENERATED CLIENT / VEHICLE IDs TO WORK ORDER
          if (targetClientId || targetVehicleId) {
            await updateWorkOrder(orderId, {
              ...(targetClientId ? { clientId: targetClientId } : {}),
              ...(targetVehicleId ? { vehicleId: targetVehicleId } : {}),
            });
          }

          // 4. BUDGET LINK
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
        } catch (auxErr) {
          console.warn('Background work order auxiliary sync warning:', auxErr);
        }
      })();

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
          <img
            src={settings?.logoUrl || '/lubricentro-original-logo.png'}
            alt="Lubricentro 2.0"
            className="h-18 w-auto max-w-[240px] object-contain mx-auto animate-pulse select-none drop-shadow-md"
          />
        </div>
        <p className="text-xs text-slate-400 mt-2 flex items-center gap-2">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-red-500" />
          <span>Iniciando sistema central en tiempo real...</span>
        </p>
      </div>
    );
  }

  if (!user) {
    if (passportPlate) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 selection:bg-red-600 selection:text-white">
          <DigitalPassportModal
            isOpen={!!passportPlate}
            onClose={() => setPassportPlate(null)}
            licensePlate={passportPlate}
            vehicle={passportVehicle}
            workOrders={passportOrders}
            settings={settings}
          />
        </div>
      );
    }

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
        onOpenGlobalSearch={() => setIsGlobalSearchOpen(true)}
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
                products={products}
                onOpenOrder={(order) => setSelectedWorkOrder(order)}
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
                onNewBudget={() => {
                  setBudgetToEdit(null);
                  setIsNewBudgetOpen(true);
                }}
                onViewBudget={(b) => setActiveBudgetModal(b)}
                onConvertToWorkOrder={handleConvertToWorkOrder}
                onEditBudget={(b) => {
                  setBudgetToEdit(b);
                  setIsNewBudgetOpen(true);
                }}
              />
            )}

            {activeTab === 'clients' && (
              <ClientsList
                clients={clients}
                vehicles={vehicles}
                workOrders={workOrders}
                onSaveClient={async (clientData, vehiclesData) => {
                  const clientId = await createClient(clientData);
                  if (vehiclesData && vehiclesData.length > 0) {
                    await Promise.all(
                      vehiclesData.map((veh) =>
                        createVehicle({
                          ...veh,
                          clientId,
                          clientName: clientData.fullName,
                        })
                      )
                    );
                  }
                  showToast('Cliente y vehículos guardados correctamente', 'success');

                  sendAdminNotification({
                    type: 'new_client',
                    client: { ...clientData, id: clientId },
                    userName: profile?.displayName || user?.displayName || 'Usuario',
                    settings,
                  });
                }}
                onUpdateClient={async (id, clientData, vehiclesData) => {
                  await updateClient(id, clientData);
                  if (vehiclesData && vehiclesData.length > 0) {
                    await Promise.all(
                      vehiclesData.map((veh) => {
                        const existing = vehicles.find(
                          (v) => (v.licensePlate || '').trim().toUpperCase() === veh.licensePlate.trim().toUpperCase()
                        );
                        if (existing) {
                          return updateVehicle(existing.id, {
                            ...veh,
                            clientId: id,
                            clientName: clientData.fullName || existing.clientName,
                          });
                        } else {
                          return createVehicle({
                            ...veh,
                            clientId: id,
                            clientName: clientData.fullName || '',
                          });
                        }
                      })
                    );
                  }
                  showToast('Cliente actualizado correctamente', 'success');
                }}
                onSaveVehicle={async (vData) => {
                  await createVehicle(vData);
                  showToast(`Vehículo patente ${vData.licensePlate} guardado`, 'success');
                }}
                onUpdateVehicle={async (vId, vData) => {
                  await updateVehicle(vId, vData);
                  showToast(`Vehículo actualizado`, 'success');
                }}
                onDeleteVehicle={async (vId) => {
                  await deleteVehicle(vId);
                  showToast('Vehículo eliminado', 'info');
                }}
                onSelectVehiclePlate={(plate) => {
                  setActiveTab('vehicles');
                }}
                onOpenSticker={(v) => setActiveStickerModal({ vehicle: v })}
                onOpenPassport={(plate) => handleOpenPassport(plate)}
              />
            )}

            {activeTab === 'vehicles' && (
              <VehiclesList
                vehicles={vehicles}
                workOrders={workOrders}
                budgets={budgets}
                sales={sales}
                onOpenWorkOrder={(o) => setSelectedWorkOrder(o)}
                onOpenSticker={(v) => setActiveStickerModal({ vehicle: v })}
                onOpenPassport={(plate) => handleOpenPassport(plate)}
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
                clientsCount={clients.length}
                vehiclesCount={vehicles.length}
                workOrdersCount={workOrders.length}
                budgetsCount={budgets.length}
                appointmentsCount={appointments.length}
                lastSyncTime={lastSyncTime}
                onManualPullData={handleManualPullData}
                onRestoreSampleData={handleRestoreSampleData}
                onSaveSettings={async (data) => {
                  setSettings((prev) => (prev ? { ...prev, ...data } : { ...DEFAULT_SETTINGS, ...data }));
                  await updateSettings(data);
                  showToast('Configuración guardada correctamente', 'success');
                }}
                onClearDatabase={async () => {
                  await clearCatalogAndInvoicesDatabase();
                  setWorkOrders([]);
                  setSales([]);
                  setBudgets([]);
                  setClients([]);
                  setVehicles([]);
                  setProducts([]);
                  setExpenses([]);
                  setReminders([]);
                  setAppointments([]);
                  setInvoices([]);
                  setSuppliers([]);
                  showToast('Se reiniciaron todos los datos de la base de datos a cero.', 'info');
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
      {selectedWorkOrder && (
        <WorkOrderDetailModal
          isOpen={!!selectedWorkOrder}
          onClose={() => setSelectedWorkOrder(null)}
          order={selectedWorkOrder}
          onUpdateStatus={handleUpdateOrderStatus}
          onScheduleAppointment={(order) => setAppointmentFromWorkOrder(order)}
          onOpenSticker={(order) => setActiveStickerModal({ order })}
          onOpenPassport={(plate) => handleOpenPassport(plate)}
          settings={settings}
        />
      )}

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

          sendAdminNotification({
            type: 'new_sale',
            sale: { ...data, id },
            userName: profile?.displayName || user?.displayName || 'Usuario',
            settings,
          });

          return id;
        }}
        onCreated={(completeSale) => {
          setActiveRemitoSale(completeSale);
        }}
      />

      {/* 4. Commercial Delivery Note (Remito) */}
      {activeRemitoSale && (
        <DeliveryNoteModal
          isOpen={!!activeRemitoSale}
          onClose={() => setActiveRemitoSale(null)}
          sale={activeRemitoSale}
          settings={settings}
        />
      )}

      {/* 5. New or Edit Budget Form */}
      <BudgetFormModal
        isOpen={isNewBudgetOpen}
        onClose={() => {
          setIsNewBudgetOpen(false);
          setBudgetToEdit(null);
        }}
        clients={clients}
        vehicles={vehicles}
        products={products}
        budgetToEdit={budgetToEdit}
        onUpdateBudget={handleUpdateBudget}
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
      {activeBudgetModal && (
        <BudgetDetailModal
          isOpen={!!activeBudgetModal}
          onClose={() => setActiveBudgetModal(null)}
          budget={activeBudgetModal}
          onConvertToWorkOrder={handleConvertToWorkOrder}
          onEditBudget={(b) => {
            setActiveBudgetModal(null);
            setBudgetToEdit(b);
            setIsNewBudgetOpen(true);
          }}
          settings={settings}
        />
      )}

      {/* 7. Quick Universal Search (Ctrl + K) */}
      <GlobalSearchModal
        isOpen={isGlobalSearchOpen}
        onClose={() => setIsGlobalSearchOpen(false)}
        vehicles={vehicles}
        clients={clients}
        workOrders={workOrders}
        onOpenOrder={(order) => {
          setSelectedWorkOrder(order);
          setIsGlobalSearchOpen(false);
        }}
        onNewOrderForVehicle={(veh) => {
          setWorkOrderInitialType('aceite_filtro');
          setWorkOrderPresetData({
            licensePlate: veh.licensePlate,
            vehicleBrand: veh.brand,
            vehicleModel: veh.model,
            vehicleYear: veh.year,
            currentKm: veh.currentKm,
            lastServiceKm: veh.lastServiceKm,
            clientName: veh.clientName,
            branchId: veh.branchId as any,
          });
          setIsWorkOrderFormOpen(true);
          setIsGlobalSearchOpen(false);
        }}
      />

      {/* 8. Digital Passport Modal */}
      {passportPlate && (
        <DigitalPassportModal
          isOpen={!!passportPlate}
          onClose={() => setPassportPlate(null)}
          licensePlate={passportPlate}
          vehicle={passportVehicle || vehicles.find((v) => (v.licensePlate || '').trim().toUpperCase() === passportPlate)}
          workOrders={passportOrders.length > 0 ? passportOrders : workOrders}
          settings={settings}
          onOpenSticker={() => {
            const matchedVeh = passportVehicle || vehicles.find((v) => (v.licensePlate || '').trim().toUpperCase() === passportPlate);
            const matchedOrder = passportOrders[0] || workOrders.find((w) => (w.licensePlate || '').trim().toUpperCase() === passportPlate);
            setActiveStickerModal({ vehicle: matchedVeh, order: matchedOrder });
          }}
        />
      )}

      {/* 9. Service Sticker QR Generator Modal */}
      {activeStickerModal && (
        <ServiceStickerModal
          isOpen={!!activeStickerModal}
          onClose={() => setActiveStickerModal(null)}
          order={activeStickerModal.order}
          vehicle={activeStickerModal.vehicle}
          settings={settings}
          onOpenPassport={(plate) => handleOpenPassport(plate)}
        />
      )}
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
