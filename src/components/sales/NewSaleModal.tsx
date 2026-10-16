import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Product, Sale, SaleItem } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { Modal } from '../common/Modal';
import { ProductSearchAutocomplete } from '../common/ProductSearchAutocomplete';
import { ShoppingCart, Plus, Trash2, Check, ArrowRight } from 'lucide-react';

interface NewSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onSaveSale: (saleData: Omit<Sale, 'id' | 'createdAt'>) => Promise<string>;
  onCreated: (createdSale: Sale) => void;
}

export const NewSaleModal: React.FC<NewSaleModalProps> = ({
  isOpen,
  onClose,
  products,
  onSaveSale,
  onCreated,
}) => {
  const { currentBranch, profile, user } = useAuth();

  const [branchId, setBranchId] = useState<string>('escobar');
  const [clientName, setClientName] = useState('Consumidor Final');
  const [clientPhone, setClientPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Efectivo');
  const [items, setItems] = useState<SaleItem[]>([
    { name: '', code: '', quantity: 1, unitPrice: 0, total: 0 },
  ]);
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
      setClientName('Consumidor Final');
      setClientPhone('');
      setPaymentMethod('Efectivo');
      setItems([{ name: '', code: '', quantity: 1, unitPrice: 0, total: 0 }]);
      setFormError(null);
    }
  }, [isOpen, profile, currentBranch]);

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      { name: '', code: '', quantity: 1, unitPrice: 0, total: 0 },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      setItems((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handleProductSelect = (index: number, prod: Product) => {
    setItems((prev) => {
      const copy = [...prev];
      const qty = copy[index]?.quantity || 1;
      copy[index] = {
        productId: prod.id,
        name: prod.name,
        code: prod.code,
        quantity: qty,
        unitPrice: prod.price,
        total: qty * prod.price,
      };
      return copy;
    });
  };

  const handleItemChange = (
    index: number,
    field: keyof SaleItem,
    value: any
  ) => {
    setItems((prev) => {
      const copy = [...prev];
      const item = { ...copy[index], [field]: value };

      if (field === 'quantity' || field === 'unitPrice') {
        const qty = field === 'quantity' ? Number(value) : item.quantity;
        const price = field === 'unitPrice' ? Number(value) : item.unitPrice;
        item.total = qty * price;
      }

      copy[index] = item;
      return copy;
    });
  };

  const grandTotal = items.reduce((sum, item) => sum + (item.total || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validItems = items.filter((i) => i.name.trim() && i.quantity > 0);
    if (validItems.length === 0) {
      setFormError('Agrega al menos un producto válido con descripción a la venta.');
      return;
    }

    if (grandTotal <= 0) {
      setFormError('El total de la venta debe ser mayor a $0.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    try {
      const saleNumber = `REM-${Date.now().toString().slice(-6)}`;
      const newSaleData = {
        saleNumber,
        items: validItems,
        total: grandTotal,
        paymentMethod,
        branchId,
        clientName: clientName.trim() || 'Consumidor Final',
        clientPhone: clientPhone.trim() || undefined,
        createdBy: profile?.displayName || user?.displayName || 'Caja',
      };

      const docId = await onSaveSale(newSaleData);

      const completeSale: Sale = {
        ...newSaleData,
        id: docId,
        createdAt: new Date().toISOString(),
      };

      onClose();
      onCreated(completeSale);
    } catch (err: any) {
      console.error(err);
      setFormError(err.message || 'Error al registrar la venta en la base de datos.');
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
          <ShoppingCart className="w-5 h-5 text-emerald-400" />
          <span>Nueva Venta de Mostrador & Remito</span>
        </div>
      }
      subtitle="Venta directa de aceites, fluidos, filtros y productos varios"
      maxWidth="4xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {formError && (
          <div className="p-3 rounded-xl bg-red-950/70 border border-red-500/50 text-red-200 text-xs">
            {formError}
          </div>
        )}
        {/* Branch & Client Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
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

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
              Cliente (Opcional)
            </label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Consumidor Final / Nombre"
              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-red-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
              Teléfono (Opcional)
            </label>
            <input
              type="text"
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
              placeholder="Ej: 11 4455-6677"
              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-red-500"
            />
          </div>
        </div>

        {/* Products Table (PRODUCTO | CÓDIGO | CANTIDAD | TOTAL) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Detalle de Productos a Vender
            </h3>
            <span className="text-xs text-slate-500">
              Puedes seleccionar del catálogo o escribir uno manual
            </span>
          </div>

          <div className="space-y-2.5">
            {items.map((item, index) => (
              <div
                key={index}
                className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-center gap-2"
              >
                {/* Select from catalog with smart search or type */}
                <div className="w-full sm:flex-1">
                  <ProductSearchAutocomplete
                    products={products}
                    value={item.name}
                    codeValue={item.code}
                    required
                    placeholder="Buscar por Código o Nombre / Marca..."
                    onChangeText={(text) => handleItemChange(index, 'name', text)}
                    onChangeCode={(code) => handleItemChange(index, 'code', code)}
                    onSelectProduct={(prod) => handleProductSelect(index, prod)}
                  />
                </div>

                {/* Code */}
                <div className="w-full sm:w-28">
                  <input
                    type="text"
                    value={item.code}
                    onChange={(e) => handleItemChange(index, 'code', e.target.value)}
                    placeholder="Código"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 font-mono focus:outline-hidden"
                  />
                </div>

                {/* Quantity */}
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

                {/* Unit Price */}
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

                {/* Total */}
                <div className="w-28 text-right font-mono font-bold text-xs sm:text-sm text-emerald-400">
                  {formatCurrency(item.total)}
                </div>

                {/* Remove button */}
                <button
                  type="button"
                  disabled={items.length === 1}
                  onClick={() => handleRemoveItem(index)}
                  className="p-2 text-slate-500 hover:text-red-400 disabled:opacity-30 cursor-pointer"
                  title="Eliminar fila"
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
            <span>+ Añadir Otro Producto</span>
          </button>
        </div>

        {/* Footer: Payment Method & Grand Total */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="w-full sm:w-auto">
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
              Medio de Pago
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-hidden focus:border-red-500"
            >
              <option value="Efectivo">Efectivo</option>
              <option value="Transferencia Bancaria">Transferencia Bancaria</option>
              <option value="Débito">Débito</option>
              <option value="Crédito">Crédito</option>
              <option value="Mercado Pago">Mercado Pago</option>
              <option value="Otro">Otro</option>
            </select>
          </div>

          <div className="text-right w-full sm:w-auto">
            <span className="text-xs font-bold text-slate-400 uppercase block">
              Total General
            </span>
            <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
              {formatCurrency(grandTotal)}
            </span>
          </div>
        </div>

        {/* Actions */}
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
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-emerald-950/50 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            <span>{isSubmitting ? 'Registrando...' : 'Registrar Venta y Generar Remito'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
