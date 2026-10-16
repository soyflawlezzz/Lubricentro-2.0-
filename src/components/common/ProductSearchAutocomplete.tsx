import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Product } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { Search, ChevronDown, Check, X, Package, Tag } from 'lucide-react';

interface ProductSearchAutocompleteProps {
  products: Product[];
  value: string;
  codeValue?: string;
  placeholder?: string;
  onSelectProduct: (product: Product) => void;
  onChangeText: (text: string) => void;
  onChangeCode?: (code: string) => void;
  className?: string;
  required?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
}

export const ProductSearchAutocomplete: React.FC<ProductSearchAutocompleteProps> = ({
  products,
  value,
  codeValue,
  placeholder = 'Buscar por Código (ej: W712, 8100) o Nombre / Marca...',
  onSelectProduct,
  onChangeText,
  onChangeCode,
  className = '',
  required = false,
  disabled = false,
  autoFocus = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close when clicked outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter products by typed search query (by code OR name OR category)
  const filteredProducts = useMemo(() => {
    const q = (value || '').trim().toLowerCase();
    const codeQ = (codeValue || '').trim().toLowerCase();

    if (!q && !codeQ) {
      // Show first 15 products if empty
      return products.slice(0, 15);
    }

    return products
      .filter((p) => {
        const name = (p.name || '').toLowerCase();
        const code = (p.code || '').toLowerCase();
        const cat = (p.category || '').toLowerCase();

        const matchText = q ? name.includes(q) || code.includes(q) || cat.includes(q) : true;
        const matchCode = codeQ ? code.includes(codeQ) : true;

        return matchText && matchCode;
      })
      .slice(0, 20);
  }, [products, value, codeValue]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1 < filteredProducts.length ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : filteredProducts.length - 1));
    } else if (e.key === 'Enter') {
      if (filteredProducts.length > 0 && highlightedIndex >= 0) {
        e.preventDefault();
        handleSelect(filteredProducts[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleSelect = (product: Product) => {
    onSelectProduct(product);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <div className="relative flex items-center">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
          <Search className="w-3.5 h-3.5" />
        </div>

        <input
          ref={inputRef}
          type="text"
          value={value}
          required={required}
          disabled={disabled}
          autoFocus={autoFocus}
          onChange={(e) => {
            onChangeText(e.target.value);
            setIsOpen(true);
            setHighlightedIndex(0);
          }}
          onFocus={() => {
            setIsOpen(true);
            setHighlightedIndex(0);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full pl-9 pr-14 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-red-500 transition-colors"
        />

        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {value && (
            <button
              type="button"
              onClick={() => {
                onChangeText('');
                if (onChangeCode) onChangeCode('');
                inputRef.current?.focus();
              }}
              className="p-1 text-slate-500 hover:text-slate-300 rounded cursor-pointer"
              title="Borrar texto"
            >
              <X className="w-3 h-3" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            disabled={disabled}
            className="p-1 text-slate-500 hover:text-slate-300 rounded cursor-pointer"
            title="Ver catálogo de productos"
          >
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1 max-h-72 overflow-y-auto bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl divide-y divide-slate-800/60 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="p-2 bg-slate-900/90 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between sticky top-0 z-10 backdrop-blur-xs">
            <span className="flex items-center gap-1">
              <Package className="w-3 h-3 text-red-400" />
              Sugerencias del Catálogo ({filteredProducts.length})
            </span>
            <span className="text-[9px] text-slate-500">Busca por Código o Nombre</span>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-500">
              <p>No se encontraron productos para "{value}".</p>
              <p className="text-[11px] text-slate-600 mt-1">
                Puedes continuar escribiendo para ingresar un concepto manual.
              </p>
            </div>
          ) : (
            filteredProducts.map((p, idx) => {
              const isSelected = idx === highlightedIndex;
              return (
                <button
                  key={p.id}
                  type="button"
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  onClick={() => handleSelect(p)}
                  className={`w-full text-left px-3 py-2.5 flex items-center justify-between gap-3 text-xs transition-colors cursor-pointer ${
                    isSelected ? 'bg-red-600/15 border-l-2 border-red-500' : 'hover:bg-slate-900'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono font-bold text-red-400 bg-red-950/40 px-1.5 py-0.5 rounded border border-red-800/40 text-[11px]">
                        {p.code}
                      </span>
                      <span className="font-semibold text-white truncate">{p.name}</span>
                    </div>

                    <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                      <span className="px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-400 flex items-center gap-1">
                        <Tag className="w-2.5 h-2.5" />
                        {p.category}
                      </span>
                      {p.stock !== undefined && (
                        <span
                          className={`text-[10px] ${
                            p.stock <= 3
                              ? 'text-red-400 font-bold'
                              : p.stock <= 10
                              ? 'text-amber-400'
                              : 'text-slate-400'
                          }`}
                        >
                          Stock: {p.stock} u.
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-mono font-black text-emerald-400 text-xs sm:text-sm block">
                      {formatCurrency(p.price)}
                    </span>
                    {p.cost > 0 && (
                      <span className="text-[10px] font-mono text-slate-500 block">
                        Costo: {formatCurrency(p.cost)}
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
