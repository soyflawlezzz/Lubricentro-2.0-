import React from 'react';
import { DamageMark } from '../../types';
import { ShieldCheck, CheckCircle2, AlertTriangle, XCircle, MinusCircle, Gauge } from 'lucide-react';

export interface InspectionItemDef {
  key: string;
  name: string;
  icon: string;
  description: string;
}

export const INSPECTION_ITEMS: InspectionItemDef[] = [
  {
    key: 'motor',
    name: 'Motor',
    icon: '🏎️',
    description: 'Estado general, fugas de aceite/compresión, mangueras y correas',
  },
  {
    key: 'fluidos',
    name: 'Fluidos',
    icon: '💧',
    description: 'Nivel y calidad de aceite, refrigerante, frenos y dirección',
  },
  {
    key: 'amortiguadores',
    name: 'Amortiguadores',
    icon: '🛠️',
    description: 'Fugas de fluido hidráulico, rebote, bujes y cazoletas',
  },
  {
    key: 'pastillas_frenos',
    name: 'Pastillas de Frenos',
    icon: '🛑',
    description: 'Espesor de material de fricción, estado de discos y cáliper',
  },
  {
    key: 'caja_automatica',
    name: 'Caja Automática',
    icon: '⚙️',
    description: 'Nivel de fluido ATF, pérdidas, cambios suaves y acoplamiento',
  },
];

export type InspectionStatus = 'optimo' | 'atencion' | 'defectuoso' | 'no_revisado';

interface CarInspectionCanvasProps {
  damages: DamageMark[];
  onChange: (damages: DamageMark[]) => void;
  readOnly?: boolean;
}

export const CarInspectionCanvas: React.FC<CarInspectionCanvasProps> = ({
  damages,
  onChange,
  readOnly = false,
}) => {
  // Helper to parse stored mark for an item key
  const getItemMark = (key: string) => {
    return damages.find((d) => d.id === `insp-${key}`);
  };

  const getStatusFromMark = (mark?: DamageMark): InspectionStatus => {
    if (!mark) return 'no_revisado';
    if (mark.type === 'otro') return 'optimo';
    if (mark.type === 'rayon') return 'atencion';
    if (mark.type === 'golpe') return 'defectuoso';
    return 'no_revisado';
  };

  const getNotesFromMark = (mark?: DamageMark): string => {
    if (!mark) return '';
    // Description format: "Status | Note" or just Note
    const parts = mark.description.split(' | ');
    return parts.length > 1 ? parts.slice(1).join(' | ') : mark.description;
  };

  const handleUpdateItemStatus = (key: string, status: InspectionStatus, existingNotes?: string) => {
    if (readOnly) return;

    const itemId = `insp-${key}`;
    const currentNotes = existingNotes !== undefined ? existingNotes : getNotesFromMark(getItemMark(key));

    if (status === 'no_revisado' && !currentNotes) {
      // Remove mark
      onChange(damages.filter((d) => d.id !== itemId));
      return;
    }

    let markType: DamageMark['type'] = 'otro';
    let statusLabel = 'Bueno / Óptimo';

    if (status === 'optimo') {
      markType = 'otro';
      statusLabel = 'Bueno / Óptimo';
    } else if (status === 'atencion') {
      markType = 'rayon';
      statusLabel = 'Atención / Medir';
    } else if (status === 'defectuoso') {
      markType = 'golpe';
      statusLabel = 'Requiere Cambio / Defectuoso';
    } else {
      markType = 'parabrisas_picado';
      statusLabel = 'No inspeccionado';
    }

    const fullDesc = currentNotes.trim() ? `${statusLabel} | ${currentNotes.trim()}` : statusLabel;

    const newMark: DamageMark = {
      id: itemId,
      view: 'frontal',
      x: 50,
      y: 50,
      type: markType,
      description: fullDesc,
    };

    const filtered = damages.filter((d) => d.id !== itemId);
    onChange([...filtered, newMark]);
  };

  const handleUpdateNotes = (key: string, notes: string) => {
    if (readOnly) return;
    const currentMark = getItemMark(key);
    const currentStatus = getStatusFromMark(currentMark);
    handleUpdateItemStatus(key, currentStatus, notes);
  };

  // Count summary
  const totalChecked = damages.filter((d) => d.id.startsWith('insp-')).length;

  return (
    <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 sm:p-5 text-slate-100 space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-850">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-red-500" />
            <h4 className="text-xs sm:text-sm font-bold text-white tracking-tight uppercase">
              Inspección Visual Técnica
            </h4>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Estado de los 5 puntos esenciales: Motor, Fluidos, Amortiguadores, Pastillas de frenos y Caja automática
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`text-xs px-3 py-1 rounded-full font-bold flex items-center gap-1.5 border ${
              totalChecked > 0
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-slate-900 text-slate-400 border-slate-800'
            }`}
          >
            <Gauge className="w-3.5 h-3.5" />
            <span>{totalChecked} / 5 Puntos Inspeccionados</span>
          </span>
        </div>
      </div>

      {/* 5 Inspection Points Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {INSPECTION_ITEMS.map((item) => {
          const mark = getItemMark(item.key);
          const currentStatus = getStatusFromMark(mark);
          const currentNotes = getNotesFromMark(mark);

          return (
            <div
              key={item.key}
              className={`p-3.5 rounded-xl border transition-all ${
                currentStatus === 'optimo'
                  ? 'bg-emerald-950/20 border-emerald-500/40'
                  : currentStatus === 'atencion'
                  ? 'bg-amber-950/20 border-amber-500/40'
                  : currentStatus === 'defectuoso'
                  ? 'bg-red-950/20 border-red-500/40'
                  : 'bg-slate-900/60 border-slate-800'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl select-none">{item.icon}</span>
                  <div>
                    <h5 className="text-xs font-bold text-white">{item.name}</h5>
                    <p className="text-[10px] text-slate-400">{item.description}</p>
                  </div>
                </div>
              </div>

              {/* Status Buttons */}
              <div className="grid grid-cols-4 gap-1 mb-2">
                <button
                  type="button"
                  disabled={readOnly}
                  onClick={() => handleUpdateItemStatus(item.key, 'optimo')}
                  className={`py-1.5 px-1 rounded-lg text-[10px] font-bold flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                    currentStatus === 'optimo'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                  title="Bueno / Óptimo"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Óptimo</span>
                </button>

                <button
                  type="button"
                  disabled={readOnly}
                  onClick={() => handleUpdateItemStatus(item.key, 'atencion')}
                  className={`py-1.5 px-1 rounded-lg text-[10px] font-bold flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                    currentStatus === 'atencion'
                      ? 'bg-amber-600 text-white shadow-md'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                  title="Atención / Medir"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-300" />
                  <span>Atención</span>
                </button>

                <button
                  type="button"
                  disabled={readOnly}
                  onClick={() => handleUpdateItemStatus(item.key, 'defectuoso')}
                  className={`py-1.5 px-1 rounded-lg text-[10px] font-bold flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                    currentStatus === 'defectuoso'
                      ? 'bg-red-600 text-white shadow-md'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                  title="Requiere Cambio / Defectuoso"
                >
                  <XCircle className="w-3.5 h-3.5 text-red-300" />
                  <span>Reemplazo</span>
                </button>

                <button
                  type="button"
                  disabled={readOnly}
                  onClick={() => handleUpdateItemStatus(item.key, 'no_revisado')}
                  className={`py-1.5 px-1 rounded-lg text-[10px] font-bold flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                    currentStatus === 'no_revisado'
                      ? 'bg-slate-800 text-slate-300 border border-slate-700'
                      : 'bg-slate-900 text-slate-500 hover:text-slate-300 border border-slate-800'
                  }`}
                  title="No inspeccionado"
                >
                  <MinusCircle className="w-3.5 h-3.5" />
                  <span>N/A</span>
                </button>
              </div>

              {/* Custom Observations input */}
              {!readOnly ? (
                <input
                  type="text"
                  value={currentNotes}
                  onChange={(e) => handleUpdateNotes(item.key, e.target.value)}
                  placeholder="Observaciones o estado específico..."
                  className="w-full px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg text-[11px] text-white placeholder-slate-600 focus:outline-hidden focus:border-red-500"
                />
              ) : (
                currentNotes && (
                  <div className="text-[11px] text-slate-300 bg-slate-900/80 px-2 py-1 rounded border border-slate-800">
                    <span className="text-slate-400 font-semibold">Nota: </span>
                    {currentNotes}
                  </div>
                )
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
