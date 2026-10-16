/**
 * Utility for parsing CSV / Excel-exported price lists and Google Drive / Google Sheets links
 */

export interface ParsedPriceItem {
  code: string;
  name: string;
  category: string;
  cost: number;
  price: number;
  stock: number;
  status: 'activo' | 'inactivo';
  rawRow: Record<string, string>;
}

export interface ParseResult {
  items: ParsedPriceItem[];
  totalRows: number;
  skippedRows: number;
  delimiter: string;
  headers: string[];
  detectedColumns: {
    codeCol?: string;
    nameCol?: string;
    categoryCol?: string;
    costCol?: string;
    priceCol?: string;
    stockCol?: string;
  };
}

/**
 * Normalizes text for header detection (lowercase, no accents, no symbols)
 */
function normalizeHeader(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Parses numeric currency / numbers in both US (1234.56) and Latin America (1.234,56 or 1234,56)
 */
export function parseNumberField(val: any): number {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;

  let s = String(val).trim();
  if (!s) return 0;

  // Remove currency symbols, spaces, quotes
  s = s.replace(/[$€£ARS\s"']/gi, '').trim();

  // If format is like 1.234,56 (dot thousands, comma decimal)
  if (s.includes('.') && s.includes(',')) {
    if (s.lastIndexOf(',') > s.lastIndexOf('.')) {
      // 1.234,56 -> 1234.56
      s = s.replace(/\./g, '').replace(',', '.');
    } else {
      // 1,234.56 -> 1234.56
      s = s.replace(/,/g, '');
    }
  } else if (s.includes(',')) {
    // Check if comma is decimal (e.g. 1500,50 or 50,0)
    s = s.replace(',', '.');
  }

  const num = parseFloat(s);
  return isNaN(num) ? 0 : Math.round(num * 100) / 100;
}

/**
 * Auto-detect delimiter from CSV snippet
 */
function detectDelimiter(text: string): string {
  const firstLines = text.split(/\r?\n/).slice(0, 5).join('\n');
  const counts = {
    ';': (firstLines.match(/;/g) || []).length,
    ',': (firstLines.match(/,/g) || []).length,
    '\t': (firstLines.match(/\t/g) || []).length,
  };

  if (counts[';'] > counts[','] && counts[';'] > counts['\t']) return ';';
  if (counts['\t'] > counts[','] && counts['\t'] > counts[';']) return '\t';
  return ',';
}

/**
 * Splits CSV line respecting quotation marks
 */
function parseCsvLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"' || char === "'") {
      if (inQuotes && nextChar === char) {
        current += char;
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Extracts Google Sheets export CSV URL from standard Google Drive / Sheets link
 */
export function extractGoogleSheetsExportUrl(url: string): string | null {
  if (!url || !url.trim()) return null;
  const cleanUrl = url.trim();

  // Pattern 1: https://docs.google.com/spreadsheets/d/{ID}/edit...
  const sheetsRegex = /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/;
  const sheetsMatch = cleanUrl.match(sheetsRegex);
  if (sheetsMatch && sheetsMatch[1]) {
    const sheetId = sheetsMatch[1];
    // Check if gid is specified
    const gidMatch = cleanUrl.match(/[#&?]gid=([0-9]+)/);
    const gid = gidMatch ? gidMatch[1] : '0';
    return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&id=${sheetId}&gid=${gid}`;
  }

  // Pattern 2: published to web: https://docs.google.com/spreadsheets/d/e/2PACX-.../pub...
  if (cleanUrl.includes('/spreadsheets/d/e/') && cleanUrl.includes('/pub')) {
    if (cleanUrl.includes('output=csv')) return cleanUrl;
    return cleanUrl.split('?')[0] + '?output=csv';
  }

  // Pattern 3: Google Drive file download: https://drive.google.com/file/d/{ID}/view...
  const driveFileRegex = /\/file\/d\/([a-zA-Z0-9-_]+)/;
  const driveMatch = cleanUrl.match(driveFileRegex);
  if (driveMatch && driveMatch[1]) {
    const fileId = driveMatch[1];
    return `https://drive.google.com/uc?export=download&id=${fileId}`;
  }

  // If already a direct CSV URL
  if (cleanUrl.endsWith('.csv') || cleanUrl.includes('format=csv') || cleanUrl.includes('output=csv')) {
    return cleanUrl;
  }

  return null;
}

/**
 * Parses full CSV text into structured products list
 */
export function parsePriceListCsv(
  csvText: string,
  options?: {
    defaultMarginPercent?: number; // e.g. 40 means price = cost * 1.40 if price is missing/0
    defaultCategory?: string;
  }
): ParseResult {
  const marginPercent = options?.defaultMarginPercent ?? 40;
  const defaultCategory = options?.defaultCategory || 'Repuestos';

  const rawLines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (rawLines.length === 0) {
    return {
      items: [],
      totalRows: 0,
      skippedRows: 0,
      delimiter: ',',
      headers: [],
      detectedColumns: {},
    };
  }

  const delimiter = detectDelimiter(csvText);

  // Find header line (first line that matches code/desc/cost/price concepts)
  let headerIndex = -1;
  let headers: string[] = [];

  for (let i = 0; i < Math.min(rawLines.length, 10); i++) {
    const candidateHeaders = parseCsvLine(rawLines[i], delimiter);
    const normalized = candidateHeaders.map(normalizeHeader);
    const hasCode = normalized.some((h) =>
      ['codigo', 'code', 'cod', 'referencia', 'ref', 'articulo', 'art', 'item', 'partnumber'].includes(h)
    );
    const hasName = normalized.some((h) =>
      ['descripcion', 'description', 'detalle', 'nombre', 'producto', 'denominacion', 'repuesto', 'concepto'].includes(h)
    );
    const hasPriceOrCost = normalized.some((h) =>
      ['costo', 'cost', 'precio', 'price', 'pvp', 'importe', 'pcosto', 'pventa'].includes(h)
    );

    if ((hasCode && hasName) || (hasName && hasPriceOrCost) || (hasCode && hasPriceOrCost)) {
      headerIndex = i;
      headers = candidateHeaders;
      break;
    }
  }

  // Fallback: use first line as headers
  if (headerIndex === -1) {
    headerIndex = 0;
    headers = parseCsvLine(rawLines[0], delimiter);
  }

  const normalizedHeaders = headers.map(normalizeHeader);

  // Identify column indices
  let codeIdx = -1;
  let nameIdx = -1;
  let categoryIdx = -1;
  let costIdx = -1;
  let priceIdx = -1;
  let stockIdx = -1;

  normalizedHeaders.forEach((h, idx) => {
    if (codeIdx === -1 && ['codigo', 'code', 'cod', 'referencia', 'ref', 'articulo', 'art', 'partnumber', 'sku'].includes(h)) {
      codeIdx = idx;
    } else if (nameIdx === -1 && ['descripcion', 'description', 'detalle', 'nombre', 'producto', 'denominacion', 'repuesto', 'concepto', 'titulo'].includes(h)) {
      nameIdx = idx;
    } else if (categoryIdx === -1 && ['categoria', 'category', 'rubro', 'familia', 'tipo', 'clasificacion', 'grupo'].includes(h)) {
      categoryIdx = idx;
    } else if (costIdx === -1 && ['costo', 'cost', 'preciocosto', 'pcosto', 'costounitario', 'compra'].includes(h)) {
      costIdx = idx;
    } else if (priceIdx === -1 && ['precio', 'price', 'precioventa', 'pventa', 'pvp', 'publico', 'venta', 'mostrador'].includes(h)) {
      priceIdx = idx;
    } else if (stockIdx === -1 && ['stock', 'cantidad', 'cant', 'existencia', 'disponible', 'unidades'].includes(h)) {
      stockIdx = idx;
    }
  });

  // If cost was found but price wasn't, or vice-versa
  if (priceIdx === -1 && costIdx !== -1) {
    // If only one price column exists called "precio"
    normalizedHeaders.forEach((h, idx) => {
      if (h.includes('precio') && idx !== costIdx) priceIdx = idx;
    });
  }

  const detectedColumns = {
    codeCol: codeIdx !== -1 ? headers[codeIdx] : undefined,
    nameCol: nameIdx !== -1 ? headers[nameIdx] : undefined,
    categoryCol: categoryIdx !== -1 ? headers[categoryIdx] : undefined,
    costCol: costIdx !== -1 ? headers[costIdx] : undefined,
    priceCol: priceIdx !== -1 ? headers[priceIdx] : undefined,
    stockCol: stockIdx !== -1 ? headers[stockIdx] : undefined,
  };

  const items: ParsedPriceItem[] = [];
  let skippedRows = 0;

  for (let i = headerIndex + 1; i < rawLines.length; i++) {
    const line = rawLines[i].trim();
    if (!line) continue;

    const cols = parseCsvLine(line, delimiter);
    const rawRow: Record<string, string> = {};
    headers.forEach((h, idx) => {
      rawRow[h] = cols[idx] || '';
    });

    let code = codeIdx !== -1 ? (cols[codeIdx] || '').trim() : '';
    let name = nameIdx !== -1 ? (cols[nameIdx] || '').trim() : '';
    let category = categoryIdx !== -1 ? (cols[categoryIdx] || '').trim() : '';
    let cost = costIdx !== -1 ? parseNumberField(cols[costIdx]) : 0;
    let price = priceIdx !== -1 ? parseNumberField(cols[priceIdx]) : 0;
    let stock = stockIdx !== -1 ? parseInt(cols[stockIdx], 10) : 10;
    if (isNaN(stock)) stock = 10;

    // If code is empty but name has something, fallback or skip
    if (!code && !name) {
      skippedRows++;
      continue;
    }

    if (!code && name) {
      // Auto-generate code slug
      code = name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10).toUpperCase();
    }

    if (!name && code) {
      name = `Artículo ${code}`;
    }

    // Auto-calculate price if missing or zero
    if (price <= 0 && cost > 0) {
      price = Math.round(cost * (1 + marginPercent / 100));
    } else if (cost <= 0 && price > 0) {
      // Calculate estimated cost
      cost = Math.round(price / (1 + marginPercent / 100));
    }

    // Infer category if empty
    if (!category) {
      const lowerName = name.toLowerCase();
      const lowerCode = code.toLowerCase();
      if (lowerName.includes('aceite') || lowerName.includes('motul') || lowerName.includes('helix') || lowerName.includes('total') || lowerName.includes('castrol') || lowerName.includes('elaion') || lowerName.includes('valvoline')) {
        category = 'Aceites';
      } else if (lowerName.includes('filtro') || lowerCode.startsWith('w') || lowerCode.startsWith('c') || lowerCode.startsWith('ph')) {
        category = 'Filtros';
      } else if (lowerName.includes('refrigerante') || lowerName.includes('freno') || lowerName.includes('liquido') || lowerName.includes('fluido')) {
        category = 'Líquidos';
      } else if (lowerName.includes('mano de obra') || lowerName.includes('servicio') || lowerName.includes('alineacion') || lowerName.includes('balanceo')) {
        category = 'Mano de Obra';
      } else {
        category = defaultCategory;
      }
    }

    items.push({
      code: code.toUpperCase().trim(),
      name: name.trim(),
      category: category.trim(),
      cost,
      price,
      stock,
      status: 'activo',
      rawRow,
    });
  }

  return {
    items,
    totalRows: rawLines.length - (headerIndex + 1),
    skippedRows,
    delimiter,
    headers,
    detectedColumns,
  };
}

/**
 * Generates sample CSV content for download or template preview
 */
export function generateSampleCsv(): string {
  return [
    'Codigo;Descripcion;Categoria;Costo;Precio;Stock',
    'MOT-8100-5W40;Motul 8100 X-cess 5W-40 4L;Aceites;38500;54000;12',
    'HELIX-HX7-10W40;Shell Helix HX7 10W-40 4L;Aceites;28000;39500;16',
    'ELAION-F50-5W40;YPF Elaion F50 5W-40 4L;Aceites;31000;43000;14',
    'W712-52;Filtro de Aceite Mann W712/52;Filtros;9200;13500;25',
    'C29198;Filtro de Aire Mann C29198;Filtros;11400;16800;20',
    'CU2545;Filtro Habitaculo Mann CU2545;Filtros;8500;12500;18',
    'WK853;Filtro de Combustible Mann WK853;Filtros;14500;21000;10',
    'LQF-DOT4;Liquido de Frenos DOT 4 Bosch 500ml;Liquidos;4200;6500;30',
    'LQC-ORG;Refrigerante Organico Puro Tir 1L;Liquidos;5100;7800;25',
    'REP-PF-VW;Pastillas de Freno Delanteras VW Gol/Suran;Repuestos;22000;34000;8',
    'REP-BIE-FORD;Bieleta Delantera Ford Focus II/III;Repuestos;15000;23500;12',
    'SRV-CAMBIO-ACEITE;Mano de Obra Cambio de Aceite y Filtros;Mano de Obra;0;12000;99',
    'SRV-REVISION-TREN;Revision General de Tren Delantero y Frenos;Mano de Obra;0;15000;99',
  ].join('\n');
}
