import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  ClipboardList,
  Receipt,
  FileSpreadsheet,
  Users,
  Car,
  Wallet,
  Package,
  BellRing,
  BarChart3,
  Settings,
  X,
  Fuel,
  FileText,
  Building2,
  CalendarDays,
  CalendarClock,
} from 'lucide-react';

export type TabId =
  | 'dashboard'
  | 'appointments'
  | 'workOrders'
  | 'sales'
  | 'budgets'
  | 'clients'
  | 'vehicles'
  | 'cash'
  | 'products'
  | 'reminders'
  | 'reports'
  | 'settings'
  | 'invoices'
  | 'suppliers'
  | 'calendar';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: TabId;
  onSelectTab: (tab: TabId) => void;
  logoUrl?: string;
  companyName?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  activeTab,
  onSelectTab,
  logoUrl,
  companyName,
}) => {
  const { isAdmin, canAccessSupplierModules } = useAuth();

  const navItems = [
    { id: 'dashboard' as TabId, label: 'Inicio', icon: LayoutDashboard },
    { id: 'appointments' as TabId, label: 'Turnos de Service', icon: CalendarClock },
    { id: 'workOrders' as TabId, label: 'Órdenes de Trabajo', icon: ClipboardList },
    { id: 'sales' as TabId, label: 'Ventas & Remitos', icon: Receipt },
    { id: 'budgets' as TabId, label: 'Presupuestos', icon: FileSpreadsheet },
    { id: 'clients' as TabId, label: 'Clientes', icon: Users },
    { id: 'vehicles' as TabId, label: 'Vehículos & Historial', icon: Car },
    { id: 'reminders' as TabId, label: 'Próximos Services', icon: BellRing },
    { id: 'cash' as TabId, label: 'Caja', icon: Wallet },
    ...(canAccessSupplierModules
      ? [
          { id: 'invoices' as TabId, label: 'Facturas', icon: FileText },
          { id: 'suppliers' as TabId, label: 'Proveedores', icon: Building2 },
          { id: 'calendar' as TabId, label: 'Calendario Vencimientos', icon: CalendarDays },
        ]
      : []),
    ...(isAdmin
      ? [
          { id: 'products' as TabId, label: 'Productos & Precios', icon: Package },
          { id: 'reports' as TabId, label: 'Reportes', icon: BarChart3 },
          { id: 'settings' as TabId, label: 'Configuración', icon: Settings },
        ]
      : []),
  ];

  const handleSelect = (tab: TabId) => {
    onSelectTab(tab);
    onClose();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-950 border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Mobile Header in Drawer */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 lg:hidden">
            <img
              src={logoUrl || '/lubricentro-original-logo.png'}
              alt={companyName || 'Lubricentro 2.0'}
              className="h-8 max-h-8 w-auto max-w-[140px] object-contain drop-shadow-sm select-none"
            />
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 py-4 px-3 overflow-y-auto space-y-1">
          <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
            Gestión Operativa
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all text-left ${
                  isActive
                    ? 'bg-red-600 text-white shadow-lg shadow-red-950/50'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? 'text-white' : 'text-slate-400'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Footer info in sidebar */}
        <div className="p-4 border-t border-slate-900 bg-slate-950/80">
          <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800/80 text-xs text-slate-400">
            <div className="flex items-center justify-between font-bold text-slate-200 mb-1.5">
              <div className="flex items-center gap-1.5">
                <img
                  src={logoUrl || '/lubricentro-original-logo.png'}
                  alt="Logo"
                  className="h-4 max-h-4 w-auto max-w-[80px] object-contain"
                />
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-950 text-red-400 font-mono">
                v2.0 PWA
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Base central en tiempo real
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};
