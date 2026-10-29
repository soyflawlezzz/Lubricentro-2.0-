import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Budget, BudgetItem, Client, Vehicle, Product } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { Modal } from '../common/Modal';
import { ProductSearchAutocomplete } from '../common/ProductSearchAutocomplete';
import { FileSpreadsheet, Plus, Trash2, Check } from 'lucide-react';

interface BudgetFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: Client[];
  vehicles: Vehicle[];
  products: Product[];
  onSaveBudget: (budgetData: Omit<Budget, 'id' | 'createdAt'>) => Promise<string>;
  budgetToEdit?: Budget | null;
  onUpdateBudget?: (id: string, budgetData: Partial<Budget>) => Promise<void>;
}

export const BudgetFormModal: React.FC<BudgetFormModalProps> = ({
  isOpen,
  onClose,
  clients,
  vehicles,
  products,
  onSaveBudget,
  budgetToEdit,
  onUpdateBudget,
}) => {
  const { currentBranch, profile, user } = useAuth();

  const [branchId, setBranchId] = useState<string>('escobar');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [vehicleBrand, setVehicleBrand] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [laborCost, setLaborCost] = useState<number>(0);
  const [observations, setObservations] = useState('');
  const [items, setItems] = useState<BudgetItem[]>([
    { id: '1', description: '', code: '', quantity: 1, unitPrice: 0, total: 0 },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (budgetToEdit) {
        setBranchId(budgetToEdit.branchId || 'escobar');
        setClientName(budgetToEdit.clientName || '');
        setClientPhone(budgetToEdit.clientPhone || budgetToEdit.clientWhatsapp || '');
        setLicensePlate(budgetToEdit.licensePlate || '');
        setVehicleBrand(budgetToEdit.vehicleBrand || '');
        setVehicleModel(budgetToEdit.vehicleModel || '');
        setLaborCost(budgetToEdit.laborCost || 0);
        setObservations(budgetToEdit.observations || '');
        setItems(
          budgetToEdit.items && budgetToEdit.items.length > 0
            ? budgetToEdit.items
            : [{ id: '1', description: '', code: '', quantity: 1, unitPrice: 0, total: 0 }]
        );
      } else {
        const activeBranch =
          profile?.branchId !== 'todas'
            ? profile?.branchId || 'escobar'
            : currentBranch !== 'todas'
            ? currentBranch
            : 'escobar';
        setBranchId(activeBranch);
        setClientName('');
        setClientPhone('');
        setLicensePlate('');
        setVehicleBrand('');
        setVehicleModel('');
        setLaborCost(0);
        setObservations('');
        setItems([{ id: '1', description: '', code: '', quantity: 1, unitPrice: 0, total: 0 }]);
      }
    }
  }, [isOpen, budgetToEdit, profile, currentBranch]);

  // Autocomplete vehicle/client if license plate matched
  const handlePlateChange = (plateVal: string) => {
    const clean = plateVal.toUpperCase();
    setLicensePlate(clean);

    const matchVehicle = vehicles.find(
      (v) => v.licensePlate.trim().toUpperCase() === clean.trim()
    );
    if (matchVehicle) {
      setVehicleBrand(matchVehicle.brand);
      setVehicleModel(matchVehicle.model);
      const matchClient = clients.find((c) => c.id === matchVehicle.clientId);
      if (matchClient) {
        setClientName(matchClient.fullName);
        setClientPhone(matchClient.phone || matchClient.whatsapp);
      }
    }
  };

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: Math.random().toString(),
        description: '',
        code: '',
        quantity: 1,
        unitPrice: 0,
        total: 0,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      setItems((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handleSelectProduct = (index: number, product: Product) => {
    setItems((prev) => {
      const copy = [...prev];
      const currentQty = copy[index]?.quantity || 1;
      const unitPrice = product.price || 0;
      copy[index] = {
        ...copy[index],
        description: product.name,
        code: product.code,
        unitPrice,
        total: currentQty * unitPrice,
      };
      return copy;
    });
  };

  const handleItemChange = (index: number, field: keyof BudgetItem, val: any) => {
    setItems((prev) => {
      const copy = [...prev];
      const item = { ...copy[index], [field]: val };
      if (field === 'quantity' || field === 'unitPrice') {
        const qty = field === 'quantity' ? Number(val) : item.quantity;
        const price = field === 'unitPrice' ? Number(val) : item.unitPrice;
        item.total = qty * price;
      }
      copy[index] = item;
      return copy;
    });
  };

  const subtotal = items.reduce((sum, item) => sum + (item.total || 0), 0);
  const total = subtotal + Number(laborCost || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !licensePlate.trim()) {
      alert('Por favor ingresa el cliente y la patente del vehículo.');
      return;
    }

    const validItems = items.filter((i) => i.description.trim());
    if (validItems.length === 0) {
      alert('Ingresa al menos un trabajo o repuesto.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (budgetToEdit?.id && onUpdateBudget) {
        await onUpdateBudget(budgetToEdit.id, {
          clientName: clientName.trim(),
          clientPhone: clientPhone.trim(),
          clientWhatsapp: clientPhone.trim(),
          licensePlate: licensePlate.trim().toUpperCase(),
          vehicleBrand: vehicleBrand.trim(),
          vehicleModel: vehicleModel.trim(),
          items: validItems,
          laborCost: Number(laborCost) || 0,
          subtotal,
          total,
          observations: observations.trim(),
          branchId,
        });
      } else {
        const budgetNumber = `PRE-${Date.now().toString().slice(-6)}`;
        await onSaveBudget({
          budgetNumber,
          clientName: clientName.trim(),
          clientPhone: clientPhone.trim(),
          clientWhatsapp: clientPhone.trim(),
          licensePlate: licensePlate.trim().toUpperCase(),
          vehicleBrand: vehicleBrand.trim(),
          vehicleModel: vehicleModel.trim(),
          items: validItems,
          laborCost: Number(laborCost) || 0,
          subtotal,
          total,
          observations: observations.trim(),
          branchId,
          status: 'pendiente',
          createdBy: profile?.displayName || user?.displayName || 'Usuario',
        });
      }
      onClose();
    } catch (err: any) {
      console.error('Error al guardar presupuesto:', err);
      alert(`Error al guardar el presupuesto: ${err?.message || 'Error de conexión o permisos'}`);
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
          <FileSpreadsheet className="w-5 h-5 text-red-500" />
          <span>{budgetToEdit ? `Modificar Presupuesto #${budgetToEdit.budgetNumber}` : 'Nuevo Presupuesto para Cliente'}</span>
        </div>
      }
      subtitle={budgetToEdit ? 'Actualiza los trabajos, repuestos o valores de esta cotización' : 'Genera una cotización formal que luego puedes convertir en OT y enviar por WhatsApp'}
      maxWidth="4xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Branch, Client & Vehicle info */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                Cliente *
              </label>
              <input
                type="text"
                required
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Nombre y Apellido / Razón Social"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-hidden focus:border-red-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                Teléfono / WhatsApp *
              </label>
              <input
                type="text"
                required
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                placeholder="011 5566-7788"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-hidden focus:border-red-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-800/80">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                Patente *
              </label>
              <input
                type="text"
                required
                value={licensePlate}
                onChange={(e) => handlePlateChange(e.target.value)}
                placeholder="AA123BB"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm font-mono font-bold text-red-400 uppercase focus:outline-hidden focus:border-red-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                Marca
              </label>
              <input
                type="text"
                value={vehicleBrand}
                onChange={(e) => setVehicleBrand(e.target.value)}
                placeholder="Ej: Ford"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-hidden focus:border-red-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                Modelo
              </label>
              <input
                type="text"
                value={vehicleModel}
                onChange={(e) => setVehicleModel(e.target.value)}
                placeholder="Ej: Ranger"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-hidden focus:border-red-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                Sucursal
              </label>
              <select
                value={branchId}
                disabled={profile?.role === 'USUARIO_SUCURSAL'}
                onChange={(e) => setBranchId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-hidden focus:border-red-500"
              >
                <option value="escobar">Escobar</option>
                <option value="maschwitz">Ing. Maschwitz</option>
              </select>
            </div>
          </div>
        </div>

        {/* Dynamic Items */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Trabajos, Servicios y Repuestos
            </h3>
          </div>

          <div className="space-y-2">
            {items.map((item, index) => (
              <div
                key={item.id}
                className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-center gap-2"
              >
                <div className="w-full sm:flex-1">
                  <ProductSearchAutocomplete
                    products={products}
                    value={item.description}
                    codeValue={item.code}
                    required
                    placeholder="Buscar por Código o Nombre / Repuesto..."
                    onChangeText={(text) => handleItemChange(index, 'description', text)}
                    onChangeCode={(code) => handleItemChange(index, 'code', code)}
                    onSelectProduct={(product) => handleSelectProduct(index, product)}
                  />
                </div>
                <div className="w-full sm:w-28">
                  <input
                    type="text"
                    value={item.code}
                    onChange={(e) => handleItemChange(index, 'code', e.target.value)}
                    placeholder="Código"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 font-mono focus:outline-hidden"
                  />
                </div>
                <div className="w-24">
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) =>
                      handleItemChange(index, 'quantity', Math.max(1, Number(e.target.value)))
                    }
                    placeholder="Cant"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-center font-bold text-white font-mono focus:outline-hidden"
                  />
                </div>
                <div className="w-28">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={item.unitPrice}
                    onChange={(e) =>
                      handleItemChange(index, 'unitPrice', Number(e.target.value))
                    }
                    placeholder="P. Unit"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-slate-200 focus:outline-hidden"
                  />
                </div>
                <div className="w-28 text-right font-mono font-bold text-xs sm:text-sm text-emerald-400">
                  {formatCurrency(item.total)}
                </div>
                <button
                  type="button"
                  disabled={items.length === 1}
                  onClick={() => handleRemoveItem(index)}
                  className="p-2 text-slate-500 hover:text-red-400 disabled:opacity-30 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleAddItem}
            className="mt-3 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>+ Añadir Línea de Trabajo</span>
          </button>
        </div>

        {/* Labor Cost, Observations & Total */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                Mano de Obra Especializada ($ ARS)
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={laborCost || ''}
                onChange={(e) => setLaborCost(Number(e.target.value))}
                placeholder="0"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white font-mono focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                Observaciones del Presupuesto
              </label>
              <textarea
                rows={2}
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                placeholder="Tiempo estimado de trabajo, condiciones, etc."
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-hidden"
              />
            </div>
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-slate-800">
            <div className="text-xs text-slate-400">
              Subtotal: <strong>{formatCurrency(subtotal)}</strong> &bull; Mano de obra:{' '}
              <strong>{formatCurrency(laborCost)}</strong>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-slate-400 uppercase block">
                Total Presupuestado
              </span>
              <span className="text-2xl font-black text-emerald-400 font-mono">
                {formatCurrency(total)}
              </span>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting || total <= 0}
            className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-red-950/50 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            <span>{isSubmitting ? 'Guardando...' : 'Generar Presupuesto'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
