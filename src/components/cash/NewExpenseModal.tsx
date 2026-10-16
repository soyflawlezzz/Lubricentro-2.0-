import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Expense, CompanySettings } from '../../types';
import { Modal } from '../common/Modal';
import { DollarSign, Check } from 'lucide-react';

interface NewExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveExpense: (data: Omit<Expense, 'id' | 'createdAt'>) => Promise<string>;
  settings?: CompanySettings;
}

export const NewExpenseModal: React.FC<NewExpenseModalProps> = ({
  isOpen,
  onClose,
  onSaveExpense,
  settings,
}) => {
  const { currentBranch, profile, user } = useAuth();

  const [concept, setConcept] = useState('');
  const [supplier, setSupplier] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState('Efectivo');
  const [branchId, setBranchId] = useState('escobar');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [observations, setObservations] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const activeBranch =
        profile?.branchId !== 'todas'
          ? profile?.branchId || 'escobar'
          : currentBranch !== 'todas'
          ? currentBranch
          : 'escobar';
      setBranchId(activeBranch);
      setConcept('');
      setSupplier('');
      setAmount(0);
      setPaymentMethod('Efectivo');
      setDate(new Date().toISOString().split('T')[0]);
      setObservations('');
      setFormError(null);
    }
  }, [isOpen, profile, currentBranch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!concept.trim()) {
      setFormError('Por favor ingresa el concepto del gasto.');
      return;
    }
    if (!amount || Number(amount) <= 0) {
      setFormError('Por favor ingresa un importe mayor a cero.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    try {
      await onSaveExpense({
        concept: concept.trim(),
        supplier: supplier.trim(),
        amount: Number(amount),
        paymentMethod,
        branchId,
        user: profile?.displayName || user?.displayName || 'Usuario',
        date,
        observations: observations.trim() || undefined,
        createdBy: profile?.displayName || user?.displayName || 'Usuario',
      });
      onClose();
    } catch (err: any) {
      console.error(err);
      setFormError(err.message || 'Error al registrar el egreso.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-red-500" />
          <span>Registrar Egreso / Gasto</span>
        </div>
      }
      subtitle="Impacta automáticamente en el saldo de caja y reportes"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {formError && (
          <div className="p-3 rounded-xl bg-red-950/70 border border-red-500/50 text-red-200 text-xs">
            {formError}
          </div>
        )}
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
            Concepto del Gasto *
          </label>
          <input
            type="text"
            required
            value={concept}
            onChange={(e) => setConcept(e.target.value)}
            placeholder="Ej: Compra de filtros, Repuestos urgentes, Pago de luz"
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-hidden focus:border-red-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
              Proveedor / Destinatario
            </label>
            <input
              type="text"
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              placeholder="Ej: Distribuidora Mann / YPF"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-hidden focus:border-red-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
              Importe ($ ARS) *
            </label>
            <input
              type="number"
              min="0.01"
              step="any"
              required
              value={amount || ''}
              onChange={(e) => setAmount(Number(e.target.value))}
              placeholder="0"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono font-bold text-red-400 focus:outline-hidden focus:border-red-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
              Medio de Pago
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden"
            >
              {(settings?.paymentMethods || [
                'Efectivo',
                'Transferencia Bancaria',
                'Débito',
                'Crédito',
                'Mercado Pago',
                'Otro',
              ]).map((pm) => (
                <option key={pm} value={pm}>
                  {pm}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
              Sucursal
            </label>
            <select
              value={branchId}
              disabled={profile?.role === 'USUARIO_SUCURSAL'}
              onChange={(e) => setBranchId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden"
            >
              <option value="escobar">Escobar</option>
              <option value="maschwitz">Ing. Maschwitz</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
              Fecha
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
            Observaciones (Opcional)
          </label>
          <textarea
            rows={2}
            value={observations}
            onChange={(e) => setObservations(e.target.value)}
            placeholder="Factura número, detalles del comprobante..."
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden"
          />
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg shadow-red-950/40 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            <span>{isSubmitting ? 'Registrando...' : 'Registrar Egreso'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
