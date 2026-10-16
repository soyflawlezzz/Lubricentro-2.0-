import React from 'react';
import { WorkOrderStatus, WorkOrderType } from '../../types';

export const StatusBadge: React.FC<{ status: WorkOrderStatus }> = ({ status }) => {
  switch (status) {
    case 'pendiente':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
          ● Pendiente
        </span>
      );
    case 'en_proceso':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
          ⚙ En proceso
        </span>
      );
    case 'a_entregar':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
          ★ A entregar
        </span>
      );
    case 'entregada':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          ✓ Entregada
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300">
          {status}
        </span>
      );
  }
};

export const TypeBadge: React.FC<{ type: WorkOrderType }> = ({ type }) => {
  if (type === 'aceite_filtro') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
        🛢 Cambio Aceite / Filtro
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
      🔧 Mecánica Integral
    </span>
  );
};

export const BranchBadge: React.FC<{ branchId: string }> = ({ branchId }) => {
  if (branchId === 'escobar') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-rose-950 text-rose-300 border border-rose-800/40">
        Escobar
      </span>
    );
  }
  if (branchId === 'maschwitz') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-cyan-950 text-cyan-300 border border-cyan-800/40">
        Ing. Maschwitz
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-800 text-slate-300">
      {branchId}
    </span>
  );
};
