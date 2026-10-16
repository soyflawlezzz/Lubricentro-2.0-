import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { BranchId } from '../../types';
import {
  Menu,
  Shield,
  MapPin,
  LogOut,
  Download,
  Fuel,
  Wrench,
  ChevronDown,
} from 'lucide-react';
import { formatBranchName } from '../../utils/formatters';

interface HeaderProps {
  onToggleSidebar: () => void;
  activeTab: string;
  logoUrl?: string;
  companyName?: string;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar, logoUrl, companyName }) => {
  const { user, profile, isAdmin, currentBranch, setCurrentBranch, logout } = useAuth();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstallable(false);
    }
    setDeferredPrompt(null);
  };

  return (
    <header className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 text-slate-100">
      <div className="flex items-center justify-between px-4 lg:px-6 h-16">
        {/* Left: Mobile hamburger & Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-850 focus:outline-hidden"
            aria-label="Abrir menú"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-3">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={companyName || 'Lubricentro 2.0'}
                className="h-9 max-h-9 w-auto max-w-[170px] object-contain drop-shadow-sm select-none"
              />
            ) : (
              <img
                src="/lubricentro-logo.svg"
                alt="Lubricentro 2.0"
                className="h-9 max-h-9 w-auto max-w-[160px] object-contain drop-shadow-sm select-none"
              />
            )}
            <div className="hidden sm:block border-l border-slate-800 pl-2.5">
              <p className="text-[10px] text-slate-400 font-semibold tracking-tight">
                Escobar &bull; Maschwitz
              </p>
            </div>
          </div>
        </div>

        {/* Center / Right: Branch selector (Admin) or Fixed Branch indicator */}
        <div className="flex items-center gap-2 sm:gap-4">
          {isAdmin ? (
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl px-2 sm:px-3 py-1.5 text-xs sm:text-sm shadow-inner">
              <MapPin className="w-3.5 h-3.5 text-red-500 mr-1.5 shrink-0" />
              <span className="hidden md:inline text-slate-400 text-xs mr-2 font-medium">
                Sucursal:
              </span>
              <select
                value={currentBranch}
                onChange={(e) => setCurrentBranch(e.target.value as BranchId)}
                className="bg-transparent text-white font-semibold focus:outline-hidden cursor-pointer"
              >
                <option value="todas" className="bg-slate-900 text-white">
                  Todas las Sucursales
                </option>
                <option value="escobar" className="bg-slate-900 text-white">
                  Escobar
                </option>
                <option value="maschwitz" className="bg-slate-900 text-white">
                  Ing. Maschwitz
                </option>
              </select>
            </div>
          ) : (
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-200">
              <MapPin className="w-3.5 h-3.5 text-red-500 mr-1.5" />
              <span>{formatBranchName(profile?.branchId || currentBranch)}</span>
            </div>
          )}

          {/* PWA Install Button if available */}
          {isInstallable && (
            <button
              onClick={handleInstallClick}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 text-xs font-semibold transition-all shadow-sm"
              title="Instalar aplicación en tu dispositivo"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Instalar App</span>
            </button>
          )}

          {/* User profile dropdown / info */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
            <div className="hidden lg:flex flex-col text-right">
              <span className="text-xs font-bold text-white leading-tight">
                {profile?.displayName || user?.displayName || 'Usuario'}
              </span>
              <span className="text-[10px] text-red-400 font-semibold tracking-wide">
                {isAdmin ? 'ADMINISTRADOR' : 'SUCURSAL'}
              </span>
            </div>

            <button
              onClick={() => logout()}
              className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-950/20 transition-colors"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
