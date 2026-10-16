import React, { useState, useEffect } from 'react';
import { Product } from '../../types';
import { Modal } from '../common/Modal';
import { Package, Check } from 'lucide-react';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product | null;
  onSave: (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  product,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [category, setCategory] = useState('Aceites');
  const [price, setPrice] = useState<number>(0);
  const [cost, setCost] = useState<number>(0);
  const [stock, setStock] = useState<number>(10);
  const [status, setStatus] = useState<'activo' | 'inactivo'>('activo');
  const [branchId, setBranchId] = useState('ambas');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      if (product) {
        setName(product.name || '');
        setCode(product.code || '');
        setCategory(product.category || 'Aceites');
        setPrice(product.price || 0);
        setCost(product.cost || 0);
        setStock(product.stock || 0);
        setStatus(product.status || 'activo');
        setBranchId(product.branchId || 'ambas');
      } else {
        setName('');
        setCode('');
        setCategory('Aceites');
        setPrice(0);
        setCost(0);
        setStock(10);
        setStatus('activo');
        setBranchId('ambas');
      }
    }
  }, [isOpen, product]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim() || price <= 0) {
      setErrorMessage('Por favor ingresa nombre, código y un precio de venta mayor a 0.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await onSave({
        name: name.trim(),
        code: code.trim().toUpperCase(),
        category,
        price: Number(price),
        cost: Number(cost),
        stock: Number(stock),
        status,
        branchId,
      });
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err?.message || 'Error al guardar el producto en el catálogo.');
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
          <Package className="w-5 h-5 text-red-500" />
          <span>{product ? 'Editar Producto' : 'Nuevo Producto / Repuesto'}</span>
        </div>
      }
      subtitle="Catálogo de productos, lubricantes, fluidos y filtros"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/50 text-red-300 text-xs">
            {errorMessage}
          </div>
        )}
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
            Nombre del Producto *
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Aceite Motul 8100 5W40 (5L) / Filtro Mann W712"
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-hidden focus:border-red-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
              Código / SKU *
            </label>
            <input
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Ej: MOT-5W40-5L"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm font-mono font-bold text-red-400 uppercase focus:outline-hidden focus:border-red-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
              Categoría
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-hidden"
            >
              <option value="Aceites">Aceites</option>
              <option value="Filtros">Filtros</option>
              <option value="Fluidos y Químicos">Fluidos y Químicos</option>
              <option value="Aditivos">Aditivos</option>
              <option value="Repuestos">Repuestos</option>
              <option value="Accesorios">Accesorios</option>
              <option value="Otros">Otros</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
              Precio de Venta ($) *
            </label>
            <input
              type="number"
              min="0"
              step="any"
              required
              value={price || ''}
              onChange={(e) => setPrice(Number(e.target.value))}
              placeholder="0"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm font-mono font-bold text-emerald-400 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
              Costo de Compra ($)
            </label>
            <input
              type="number"
              min="0"
              step="any"
              value={cost || ''}
              onChange={(e) => setCost(Number(e.target.value))}
              placeholder="0"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm font-mono text-slate-300 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
              Stock Inicial
            </label>
            <input
              type="number"
              min="0"
              value={stock}
              onChange={(e) => setStock(Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm font-mono text-white focus:outline-hidden"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
              Disponibilidad de Sucursal
            </label>
            <select
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden"
            >
              <option value="ambas">Ambas Sucursales</option>
              <option value="escobar">Escobar</option>
              <option value="maschwitz">Ing. Maschwitz</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
              Estado
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden"
            >
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo / Pausado</option>
            </select>
          </div>
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
            <span>{isSubmitting ? 'Guardando...' : 'Guardar Producto'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
