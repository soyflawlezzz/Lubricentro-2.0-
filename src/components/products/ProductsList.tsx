import React, { useState, useMemo } from 'react';
import { Product } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { Search, Package, Plus, Edit2, Trash2, Tag } from 'lucide-react';
import { ProductFormModal } from './ProductFormModal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { useAuth } from '../../context/AuthContext';

interface ProductsListProps {
  products: Product[];
  onSaveProduct: (data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onUpdateProduct: (id: string, data: Partial<Product>) => Promise<void>;
  onDeleteProduct: (id: string) => Promise<void>;
  onClearAllProducts?: () => Promise<void>;
}

export const ProductsList: React.FC<ProductsListProps> = ({
  products,
  onSaveProduct,
  onUpdateProduct,
  onDeleteProduct,
  onClearAllProducts,
}) => {
  const { isAdmin } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isConfirmClearAllOpen, setIsConfirmClearAllOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.code.toLowerCase().includes(q) ||
          (p.category || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [products, searchTerm]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Productos & Precios
          </h1>
          <p className="text-xs text-slate-400">
            {filteredProducts.length} artículos en catálogo &bull; Control de stock y precios de mostrador
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {products.length > 0 && onClearAllProducts && (
            <button
              onClick={() => {
                console.log('Vaciar Catálogo button clicked');
                setIsConfirmClearAllOpen(true);
              }}
              disabled={isClearing}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-red-500/30 hover:border-red-500 text-red-400 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
              title="Eliminar todos los productos"
            >
              <Trash2 className="w-4 h-4" />
              <span>{isClearing ? 'Eliminando...' : 'Vaciar Catálogo'}</span>
            </button>
          )}
          <button
            onClick={() => {
              setEditingProduct(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all shadow-md shadow-red-950/40 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Nuevo Producto</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 shadow-md">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre, código Mann / Fram / Motul..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-red-500"
          />
        </div>
      </div>

      {/* Products Table */}
      {filteredProducts.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-500">
          <Package className="w-12 h-12 mx-auto text-slate-700 mb-3" />
          <h3 className="text-sm font-bold text-slate-300">
            No se encontraron productos
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Prueba ajustando los términos de búsqueda o categoría.
          </p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Código</th>
                  <th className="py-3.5 px-4">Producto</th>
                  <th className="py-3.5 px-4">Categoría</th>
                  <th className="py-3.5 px-4 text-right">Stock</th>
                  <th className="py-3.5 px-4 text-right">Precio Venta</th>
                  <th className="py-3.5 px-4 text-right">Costo</th>
                  <th className="py-3.5 px-4 text-center">Estado</th>
                  <th className="py-3.5 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-850/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-red-400">
                      {p.code}
                    </td>
                    <td className="py-3 px-4 font-semibold text-white">
                      {p.name}
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-[11px]">
                        {p.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold">
                      <span
                        className={
                          p.stock <= 5
                            ? 'text-amber-400'
                            : p.stock === 0
                            ? 'text-red-400'
                            : 'text-white'
                        }
                      >
                        {p.stock} un.
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400 text-sm">
                      {formatCurrency(p.price)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-400">
                      {p.cost ? formatCurrency(p.cost) : '-'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          p.status === 'activo'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setEditingProduct(p);
                            setIsModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                          title="Editar producto"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => setProductToDelete(p)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-950 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                            title="Eliminar producto (Sólo Administrador)"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Form */}
      <ProductFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingProduct(null);
        }}
        product={editingProduct}
        onSave={async (data) => {
          if (editingProduct) {
            await onUpdateProduct(editingProduct.id, data);
          } else {
            await onSaveProduct(data);
          }
        }}
      />

      {/* Confirm Deletion Dialog */}
      <ConfirmDialog
        isOpen={!!productToDelete}
        title="Eliminar Producto"
        message={`¿Estás seguro de que deseas eliminar permanentemente "${productToDelete?.name}" (${productToDelete?.code}) del catálogo?`}
        confirmText="Eliminar Producto"
        cancelText="Cancelar"
        danger={true}
        onConfirm={async () => {
          if (productToDelete) {
            await onDeleteProduct(productToDelete.id);
            setProductToDelete(null);
          }
        }}
        onCancel={() => setProductToDelete(null)}
      />

      {/* Confirm Clear All Dialog */}
      <ConfirmDialog
        isOpen={isConfirmClearAllOpen}
        title="Vaciar Catálogo de Productos"
        message={`¿Estás seguro de que deseas eliminar TODOS los ${products.length} artículos de la solapa de Productos & Precios? Esta acción no se puede deshacer.`}
        confirmText={isClearing ? 'Eliminando...' : 'Eliminar Todos'}
        cancelText="Cancelar"
        danger={true}
        onConfirm={async () => {
          if (onClearAllProducts) {
            setIsClearing(true);
            try {
              await onClearAllProducts();
              setIsConfirmClearAllOpen(false);
            } finally {
              setIsClearing(false);
            }
          }
        }}
        onCancel={() => {
          if (!isClearing) setIsConfirmClearAllOpen(false);
        }}
      />
    </div>
  );
};
