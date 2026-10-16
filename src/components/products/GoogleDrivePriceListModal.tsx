import React, { useState, useMemo } from 'react';
import { Product, CompanySettings } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { Modal } from '../common/Modal';
import {
  parsePriceListCsv,
  extractGoogleSheetsExportUrl,
  generateSampleCsv,
  ParsedPriceItem,
} from '../../utils/csvParser';
import {
  Upload,
  Link,
  FileSpreadsheet,
  RefreshCw,
  Check,
  AlertTriangle,
  ArrowRight,
  Download,
  Info,
  CheckCircle2,
  FileText,
} from 'lucide-react';

interface GoogleDrivePriceListModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  settings?: CompanySettings;
  onSaveSettings?: (settings: Partial<CompanySettings>) => Promise<void>;
  onBatchSyncProducts: (
    itemsToUpdate: Array<{ id: string; data: Partial<Product> }>,
    itemsToCreate: Array<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>
  ) => Promise<{ updated: number; created: number; errors: number }>;
}

export const GoogleDrivePriceListModal: React.FC<GoogleDrivePriceListModalProps> = ({
  isOpen,
  onClose,
  products,
  settings,
  onSaveSettings,
  onBatchSyncProducts,
}) => {
  const [activeTab, setActiveTab] = useState<'url' | 'file' | 'paste'>('url');
  const [driveUrl, setDriveUrl] = useState(settings?.googleDrivePriceListUrl || '');
  const [pastedText, setPastedText] = useState('');
  const [selectedFileName, setSelectedFileName] = useState('');
  const [fileContent, setFileContent] = useState('');

  // Config options
  const [marginPercent, setMarginPercent] = useState<number>(
    settings?.defaultPriceMarginPercent ?? 40
  );
  const [updateCosts, setUpdateCosts] = useState(true);
  const [updatePrices, setUpdatePrices] = useState(true);
  const [createMissing, setCreateMissing] = useState(true);
  const [saveAsDefaultUrl, setSaveAsDefaultUrl] = useState(true);

  // States
  const [isLoading, setIsLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [parsedItems, setParsedItems] = useState<ParsedPriceItem[] | null>(null);
  const [importSummary, setImportSummary] = useState<{
    updated: number;
    created: number;
    errors: number;
  } | null>(null);

  // Map of existing products by normalized code
  const existingByCode = useMemo(() => {
    const map = new Map<string, Product>();
    products.forEach((p) => {
      if (p.code) {
        map.set(p.code.trim().toUpperCase(), p);
      }
    });
    return map;
  }, [products]);

  // Breakdown of preview
  const previewAnalysis = useMemo(() => {
    if (!parsedItems) return null;

    let toUpdate = 0;
    let toCreate = 0;
    const previewList: Array<{
      item: ParsedPriceItem;
      existing?: Product;
      action: 'update' | 'create';
    }> = [];

    parsedItems.forEach((item) => {
      const match = existingByCode.get(item.code);
      if (match) {
        toUpdate++;
        previewList.push({ item, existing: match, action: 'update' });
      } else {
        toCreate++;
        previewList.push({ item, action: 'create' });
      }
    });

    return {
      total: parsedItems.length,
      toUpdate,
      toCreate,
      previewList: previewList.slice(0, 15),
    };
  }, [parsedItems, existingByCode]);

  // Load CSV from Drive/Sheets URL
  const handleFetchDriveUrl = async () => {
    if (!driveUrl.trim()) {
      setErrorMessage('Ingresa la URL de la planilla de Google Drive o Google Sheets.');
      return;
    }

    setErrorMessage(null);
    setSyncStatus('Conectando y descargando datos de Google Drive...');
    setIsLoading(true);

    try {
      const exportUrl = extractGoogleSheetsExportUrl(driveUrl);
      if (!exportUrl) {
        throw new Error(
          'La URL no parece ser un enlace válido de Google Sheets o Google Drive. Asegúrate de copiar el enlace del documento.'
        );
      }

      let csvText = '';
      try {
        const response = await fetch(exportUrl);
        if (!response.ok) {
          throw new Error(`Error HTTP ${response.status}`);
        }
        csvText = await response.text();
      } catch (fetchErr: any) {
        // In case of CORS restriction from Google Docs
        throw new Error(
          'No se pudo acceder directamente al enlace debido a las políticas de privacidad de Google. Por favor, asegúrate de que el documento esté compartido como "Cualquier persona con el enlace puede ver" (Lector) o descarga el archivo como CSV y súbelo en la pestaña "Subir Archivo CSV".'
        );
      }

      if (!csvText || csvText.includes('<!DOCTYPE html>') || csvText.includes('<html')) {
        throw new Error(
          'El archivo recibido no parece ser una tabla CSV válida. Verifica que el enlace esté público con acceso de lectura.'
        );
      }

      const result = parsePriceListCsv(csvText, { defaultMarginPercent: marginPercent });
      if (result.items.length === 0) {
        throw new Error(
          'No se encontraron filas con códigos o nombres de productos válidos en el archivo.'
        );
      }

      setParsedItems(result.items);
      setSyncStatus(`¡Se detectaron ${result.items.length} productos en la lista!`);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Error al obtener la lista de precios.');
      setParsedItems(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFileName(file.name);
    setErrorMessage(null);
    setIsLoading(true);
    setSyncStatus('Procesando archivo local...');

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setFileContent(text);
      try {
        const result = parsePriceListCsv(text, { defaultMarginPercent: marginPercent });
        if (result.items.length === 0) {
          setErrorMessage(
            'No se encontraron artículos legibles. Revisa que contenga columnas como Código, Descripción, Costo o Precio.'
          );
          setParsedItems(null);
        } else {
          setParsedItems(result.items);
          setSyncStatus(`¡Se detectaron ${result.items.length} productos en el archivo!`);
        }
      } catch (err: any) {
        setErrorMessage('Error al interpretar el formato CSV/Excel del archivo.');
      } finally {
        setIsLoading(false);
      }
    };
    reader.onerror = () => {
      setErrorMessage('Error al leer el archivo seleccionado.');
      setIsLoading(false);
    };
    reader.readAsText(file);
  };

  // Handle direct paste
  const handleProcessPastedText = () => {
    if (!pastedText.trim()) {
      setErrorMessage('Pega el contenido copiado de tu planilla antes de procesar.');
      return;
    }
    setErrorMessage(null);
    setIsLoading(true);
    try {
      const result = parsePriceListCsv(pastedText, { defaultMarginPercent: marginPercent });
      if (result.items.length === 0) {
        setErrorMessage(
          'No se encontraron productos válidos. Asegúrate de incluir encabezados como Código, Descripción, Costo o Precio.'
        );
        setParsedItems(null);
      } else {
        setParsedItems(result.items);
        setSyncStatus(`¡Se procesaron ${result.items.length} productos pegados!`);
      }
    } catch (err: any) {
      setErrorMessage('Error al procesar el texto.');
    } finally {
      setIsLoading(false);
    }
  };

  // Apply sync to database
  const handleConfirmSync = async () => {
    if (!parsedItems || parsedItems.length === 0) return;

    setIsLoading(true);
    setErrorMessage(null);
    setSyncStatus('Actualizando base de datos interna de repuestos y productos...');

    try {
      const itemsToUpdate: Array<{ id: string; data: Partial<Product> }> = [];
      const itemsToCreate: Array<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>> = [];

      parsedItems.forEach((item) => {
        const existing = existingByCode.get(item.code);
        if (existing) {
          if (updateCosts || updatePrices) {
            const updates: Partial<Product> = {
              name: item.name || existing.name,
              category: item.category || existing.category,
            };
            if (updateCosts && item.cost > 0) updates.cost = item.cost;
            if (updatePrices && item.price > 0) updates.price = item.price;
            itemsToUpdate.push({ id: existing.id, data: updates });
          }
        } else if (createMissing) {
          itemsToCreate.push({
            name: item.name,
            code: item.code,
            category: item.category,
            cost: item.cost,
            price: item.price,
            stock: item.stock,
            minStock: 2,
            status: 'activo',
            branchId: 'ambas',
          });
        }
      });

      const result = await onBatchSyncProducts(itemsToUpdate, itemsToCreate);

      // Save default URL to settings if chosen
      if (saveAsDefaultUrl && driveUrl.trim() && onSaveSettings) {
        await onSaveSettings({
          googleDrivePriceListUrl: driveUrl.trim(),
          defaultPriceMarginPercent: marginPercent,
          lastPriceListSyncDate: new Date().toISOString(),
        });
      }

      setImportSummary(result);
      setSyncStatus('¡Sincronización completada con éxito!');
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Error al guardar los cambios en la base de datos.');
    } finally {
      setIsLoading(false);
    }
  };

  // Download template
  const handleDownloadSample = () => {
    const csvData = generateSampleCsv();
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'plantilla_lista_precios_lubricentro.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
          <span>Importar & Sincronizar Lista de Precios desde Google Drive</span>
        </div>
      }
      subtitle="Actualiza masivamente los códigos, descripciones, costos y precios de venta del catálogo"
      maxWidth="4xl"
    >
      <div className="space-y-5">
        {/* Success Alert */}
        {importSummary && (
          <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm text-emerald-300">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>¡Base de datos actualizada con éxito!</span>
            </div>
            <div className="text-xs text-emerald-300/90 grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 font-mono">
              <div className="bg-emerald-900/40 p-2 rounded-xl border border-emerald-700/40">
                <strong>{importSummary.updated}</strong> productos actualizados
              </div>
              <div className="bg-emerald-900/40 p-2 rounded-xl border border-emerald-700/40">
                <strong>{importSummary.created}</strong> nuevos repuestos añadidos
              </div>
              <div className="bg-emerald-900/40 p-2 rounded-xl border border-emerald-700/40">
                <strong>{products.length + importSummary.created}</strong> total en catálogo
              </div>
            </div>
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => {
                  setImportSummary(null);
                  setParsedItems(null);
                  onClose();
                }}
                className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all cursor-pointer"
              >
                Cerrar y Ver Productos
              </button>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold">Atención:</strong>
              <span>{errorMessage}</span>
            </div>
          </div>
        )}

        {/* Method Tabs */}
        {!importSummary && (
          <>
            <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-2">
              <button
                type="button"
                onClick={() => setActiveTab('url')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  activeTab === 'url'
                    ? 'bg-red-600 text-white shadow-md shadow-red-950/40'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                <Link className="w-3.5 h-3.5" />
                <span>Enlace de Google Drive / Sheets</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('file')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  activeTab === 'file'
                    ? 'bg-red-600 text-white shadow-md shadow-red-950/40'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Subir Archivo CSV / Excel</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('paste')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  activeTab === 'paste'
                    ? 'bg-red-600 text-white shadow-md shadow-red-950/40'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Pegar Texto Directo</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadSample}
                className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>Descargar Modelo CSV</span>
              </button>
            </div>

            {/* TAB 1: Google Drive URL */}
            {activeTab === 'url' && (
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Enlace de Compartir de Google Sheets o Google Drive
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="url"
                    value={driveUrl}
                    onChange={(e) => setDriveUrl(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5.../edit?usp=sharing"
                    className="flex-1 px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-red-500"
                  />
                  <button
                    type="button"
                    onClick={handleFetchDriveUrl}
                    disabled={isLoading || !driveUrl.trim()}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-emerald-950/40"
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    <span>{isLoading ? 'Sincronizando...' : 'Leer y Analizar'}</span>
                  </button>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 text-[11px] text-slate-400 flex items-start gap-2">
                  <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-semibold text-slate-300">
                      ¿Cómo obtener el enlace de Google Sheets?
                    </span>
                    <p>
                      En Google Sheets haz clic en <strong>Compartir</strong> &rarr; Cambia a{' '}
                      <strong>"Cualquier persona con el enlace"</strong> como Lector &rarr; Haz clic en{' '}
                      <strong>Copiar enlace</strong> y pégalo aquí. El sistema detectará automáticamente los
                      encabezados de <em>Código, Descripción, Costo y Precio</em>.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: File Upload */}
            {activeTab === 'file' && (
              <div className="p-5 rounded-2xl bg-slate-950 border border-dashed border-slate-700 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center mx-auto text-red-500">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Selecciona o arrastra tu archivo CSV / Excel exportado
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Formatos compatibles: .csv, .tsv, .txt delimitados por coma o punto y coma
                  </p>
                </div>

                <input
                  type="file"
                  id="csv-file-input"
                  accept=".csv,.txt,.tsv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <label
                  htmlFor="csv-file-input"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  <span>{selectedFileName || 'Elegir archivo del equipo...'}</span>
                </label>
              </div>
            )}

            {/* TAB 3: Paste Direct */}
            {activeTab === 'paste' && (
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Pegar celdas copiadas de Google Sheets o Excel
                </label>
                <textarea
                  rows={4}
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder="Codigo	Descripcion	Categoria	Costo	Precio
MOT-8100	Motul 8100 5W40	Aceites	38500	54000
W712/52	Filtro Aceite Mann	Filtros	9200	13500..."
                  className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white font-mono placeholder-slate-600 focus:outline-hidden focus:border-red-500"
                />
                <button
                  type="button"
                  onClick={handleProcessPastedText}
                  disabled={isLoading || !pastedText.trim()}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-bold transition-all cursor-pointer"
                >
                  Procesar Texto Pegado
                </button>
              </div>
            )}

            {/* Sync Options */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Reglas de Actualización y Márgenes
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <label className="flex items-center gap-2 cursor-pointer p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:bg-slate-900">
                  <input
                    type="checkbox"
                    checked={updateCosts}
                    onChange={(e) => setUpdateCosts(e.target.checked)}
                    className="accent-red-600 w-4 h-4 rounded"
                  />
                  <span className="text-slate-300 font-medium">Actualizar Costos ($)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:bg-slate-900">
                  <input
                    type="checkbox"
                    checked={updatePrices}
                    onChange={(e) => setUpdatePrices(e.target.checked)}
                    className="accent-red-600 w-4 h-4 rounded"
                  />
                  <span className="text-slate-300 font-medium">Actualizar Precios Venta</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:bg-slate-900">
                  <input
                    type="checkbox"
                    checked={createMissing}
                    onChange={(e) => setCreateMissing(e.target.checked)}
                    className="accent-red-600 w-4 h-4 rounded"
                  />
                  <span className="text-slate-300 font-medium">Crear Productos Nuevos</span>
                </label>

                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-2">
                  <span className="text-slate-400 text-[11px] font-medium leading-tight">
                    Margen de ganancia sugerido:
                  </span>
                  <div className="flex items-center gap-1 font-mono">
                    <input
                      type="number"
                      min="0"
                      max="300"
                      value={marginPercent}
                      onChange={(e) => setMarginPercent(Number(e.target.value))}
                      className="w-12 px-1.5 py-0.5 bg-slate-950 border border-slate-700 rounded text-center text-xs font-bold text-emerald-400"
                    />
                    <span className="text-slate-400 text-xs">%</span>
                  </div>
                </div>
              </div>

              {activeTab === 'url' && (
                <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={saveAsDefaultUrl}
                    onChange={(e) => setSaveAsDefaultUrl(e.target.checked)}
                    className="accent-red-600 w-3.5 h-3.5 rounded"
                  />
                  <span>Guardar esta URL de Google Drive como enlace predeterminado en Configuración</span>
                </label>
              )}
            </div>

            {/* PREVIEW SECTION */}
            {previewAnalysis && (
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <span>Vista Previa de Cambios</span>
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] text-slate-300">
                        {previewAnalysis.total} filas leídas
                      </span>
                    </h3>
                  </div>

                  <div className="flex items-center gap-3 text-xs font-mono">
                    <span className="text-amber-400">
                      ● {previewAnalysis.toUpdate} para actualizar
                    </span>
                    <span className="text-emerald-400">
                      ● {previewAnalysis.toCreate} nuevos a dar de alta
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto max-h-60 rounded-xl border border-slate-800 bg-slate-900/60">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider sticky top-0 border-b border-slate-800">
                      <tr>
                        <th className="py-2 px-3">Acción</th>
                        <th className="py-2 px-3">Código</th>
                        <th className="py-2 px-3">Descripción</th>
                        <th className="py-2 px-3">Categoría</th>
                        <th className="py-2 px-3 text-right">Nuevo Costo</th>
                        <th className="py-2 px-3 text-right">Nuevo Precio Venta</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-200">
                      {previewAnalysis.previewList.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-850/40">
                          <td className="py-2 px-3">
                            {row.action === 'update' ? (
                              <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                                Actualizar
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                                Nuevo
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 font-mono font-bold text-red-400">
                            {row.item.code}
                          </td>
                          <td className="py-2 px-3 font-medium text-white">
                            {row.item.name}
                          </td>
                          <td className="py-2 px-3 text-slate-400">
                            {row.item.category}
                          </td>
                          <td className="py-2 px-3 text-right font-mono">
                            {row.item.cost > 0 ? formatCurrency(row.item.cost) : '-'}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-emerald-400">
                            {row.item.price > 0 ? formatCurrency(row.item.price) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {previewAnalysis.total > 15 && (
                  <p className="text-[11px] text-slate-500 text-center">
                    Mostrando primeros 15 artículos de un total de {previewAnalysis.total}
                  </p>
                )}

                {/* Confirm Sync Button */}
                <div className="pt-2 flex justify-end gap-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setParsedItems(null)}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Descartar
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmSync}
                    disabled={isLoading}
                    className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg shadow-red-950/50 transition-all cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>
                      {isLoading
                        ? 'Aplicando cambios...'
                        : `Confirmar e Importar ${previewAnalysis.total} Productos`}
                    </span>
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
};
