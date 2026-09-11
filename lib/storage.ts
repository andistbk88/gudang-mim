import {
  Product,
  Motoris,
  OutboundRecord,
  ReturRecord,
  InboundRecord,
  OpnameRecord,
  StockCalculation,
  KartuStokRow,
} from '@/types/inventory';

export const DEFAULT_PRODUCTS: Product[] = [
  { sku: 'KS-BE-16R', kategori: 'Rokok', nama: 'Kapal Sakti Black 16', satuan: 'Bks', stokAwal: 309, batasMin: 400 },
  { sku: 'KZ-S-16R', kategori: 'Rokok', nama: 'Kazaas Slim 16', satuan: 'Bks', stokAwal: 226, batasMin: 400 },
  { sku: 'IGT-AP-280', kategori: 'Minuman', nama: 'Ichitan Apple 280ml', satuan: 'Btl', stokAwal: 100, batasMin: 500 },
  { sku: 'IGT-TH-300', kategori: 'Minuman', nama: 'Ichitan Thai Tea 300ml', satuan: 'Btl', stokAwal: 180, batasMin: 350 },
  { sku: 'SNK-CH-50', kategori: 'Snack', nama: 'Chiki Twist BBQ 50g', satuan: 'Bks', stokAwal: 250, batasMin: 200 }
];

export const DEFAULT_MOTORIS: Motoris[] = [
  { id: 'CJ-01', nama: 'Ilham Ramadhan', area: 'Cianjur Kota' },
  { id: 'CJ-02', nama: 'Indra Gunawan', area: 'Cianjur Selatan' },
  { id: 'SK-01', nama: 'Rudi Hartono', area: 'Sukabumi Timur' }
];

export function normalizeMotorisList(rawList: unknown): Motoris[] {
  if (!Array.isArray(rawList)) return [];
  const result: Motoris[] = [];
  const seenIds = new Set<string>();

  rawList.forEach((raw, idx) => {
    if (!raw || typeof raw !== 'object') return;
    const item = raw as Record<string, unknown>;

    // Support multiple field aliases
    const id = String(
      item.id ||
      item.idMotoris ||
      item.id_motoris ||
      item.kode ||
      item.kodeMotoris ||
      item.kode_motoris ||
      item.noId ||
      item.nip ||
      item.nik ||
      ''
    ).trim();

    const nama = String(
      item.nama ||
      item.namaSales ||
      item.nama_sales ||
      item.namaMotoris ||
      item.nama_motoris ||
      item.sales ||
      item.salesman ||
      item.namaLengkap ||
      ''
    ).trim();

    const area = String(
      item.area ||
      item.wilayah ||
      item.rayon ||
      item.rute ||
      item.areaKerja ||
      item.lokasi ||
      'General'
    ).trim();

    if (id || nama) {
      const finalId = id || `CJ-${String(idx + 1).padStart(2, '0')}`;
      const finalNama = nama || finalId;
      const finalArea = area || 'General';

      if (!seenIds.has(finalId)) {
        seenIds.add(finalId);
        result.push({ id: finalId, nama: finalNama, area: finalArea });
      }
    }
  });

  return result;
}

export function normalizeProductList(rawList: unknown): Product[] {
  if (!Array.isArray(rawList)) return [];
  const result: Product[] = [];
  const seenSkus = new Set<string>();

  rawList.forEach((raw, idx) => {
    if (!raw || typeof raw !== 'object') return;
    const item = raw as Record<string, unknown>;

    const sku = String(
      item.sku ||
      item.skuId ||
      item.kodeProduk ||
      item.kodeBarang ||
      item.kodeItem ||
      item.kode ||
      ''
    ).trim().toUpperCase();

    const nama = String(
      item.nama ||
      item.namaProduk ||
      item.namaBarang ||
      item.namaItem ||
      ''
    ).trim();

    const kategori = String(item.kategori || item.category || item.jenis || 'Umum').trim();
    const satuan = String(item.satuan || item.unit || item.kemasan || 'Pcs').trim();
    const stokAwal = Number(item.stokAwal !== undefined ? item.stokAwal : item.awal) || 0;
    const batasMin = Number(item.batasMin !== undefined ? item.batasMin : (item.min !== undefined ? item.min : 50)) || 0;

    if (sku || nama) {
      const finalSku = sku || `SKU-${String(idx + 1).padStart(3, '0')}`;
      const finalNama = nama || finalSku;

      if (!seenSkus.has(finalSku)) {
        seenSkus.add(finalSku);
        result.push({
          sku: finalSku,
          nama: finalNama,
          kategori,
          satuan,
          stokAwal,
          batasMin,
        });
      }
    }
  });

  return result;
}

export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function generateTxId(prefix: 'OUT' | 'RET' | 'IN' | 'OP'): string {
  const d = new Date();
  const dateStr = d.toISOString().slice(2, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 900) + 100;
  return `${prefix}-${dateStr}-${random}`;
}

export function parseLocalStartOfDay(dateStr?: string): number | null {
  if (!dateStr) return null;
  const parts = dateStr.split('T')[0].split('-');
  if (parts.length < 3) return null;
  return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), 0, 0, 0).getTime();
}

export function parseLocalEndOfDay(dateStr?: string): number | null {
  if (!dateStr) return null;
  const parts = dateStr.split('T')[0].split('-');
  if (parts.length < 3) return null;
  return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), 23, 59, 59).getTime();
}

export function isTimestampInRange(txDateStr: string, startTs: number | null, endTs: number | null): boolean {
  if (!startTs && !endTs) return true;
  if (!txDateStr) return false;
  const txTs = parseLocalStartOfDay(txDateStr);
  if (!txTs) return false;

  if (startTs && endTs) return txTs >= startTs && txTs <= endTs;
  if (startTs) return txTs >= startTs;
  if (endTs) return txTs <= endTs;
  return true;
}

export function calculateStockForProduct(
  sku: string,
  products: Product[],
  inbounds: InboundRecord[],
  outbounds: OutboundRecord[],
  returs: ReturRecord[],
  opnames: OpnameRecord[],
  filterStartDateStr?: string,
  filterEndDateStr?: string
): StockCalculation | null {
  const prod = products.find((p) => p.sku === sku);
  if (!prod) return null;

  const masterAwal = Number(prod.stokAwal) || 0;
  const batasMin = Number(prod.batasMin) || 0;

  const filterStartTs = parseLocalStartOfDay(filterStartDateStr);
  const filterEndTs = parseLocalEndOfDay(filterEndDateStr);

  let stokAwalPeriode = masterAwal;

  if (filterStartTs) {
    const inPrev = inbounds
      .filter((i) => i.sku === sku && (parseLocalStartOfDay(i.tanggal) || 0) < filterStartTs)
      .reduce((s, i) => s + Number(i.qty || 0), 0);

    const outPrev = outbounds
      .filter((o) => o.sku === sku && (parseLocalStartOfDay(o.tanggal) || 0) < filterStartTs)
      .reduce((s, o) => s + Number(o.qty || 0), 0);

    const retBagusPrev = returs
      .filter(
        (r) =>
          r.sku === sku &&
          (r.kondisi === 'Barang Bagus' || r.kondisi.includes('Bagus')) &&
          (parseLocalStartOfDay(r.tanggal) || 0) < filterStartTs
      )
      .reduce((s, r) => s + Number(r.qty || 0), 0);

    const opnamePrev = opnames
      .filter((op) => op.sku === sku && (parseLocalStartOfDay(op.tanggal) || 0) < filterStartTs)
      .reduce((s, op) => s + Number(op.selisih || 0), 0);

    stokAwalPeriode = masterAwal + inPrev - outPrev + retBagusPrev + opnamePrev;
  }

  const masuk = inbounds
    .filter((i) => i.sku === sku && isTimestampInRange(i.tanggal, filterStartTs, filterEndTs))
    .reduce((s, i) => s + Number(i.qty || 0), 0);

  const keluar = outbounds
    .filter((o) => o.sku === sku && isTimestampInRange(o.tanggal, filterStartTs, filterEndTs))
    .reduce((s, o) => s + Number(o.qty || 0), 0);

  const retBagus = returs
    .filter(
      (r) =>
        r.sku === sku &&
        (r.kondisi === 'Barang Bagus' || r.kondisi.includes('Bagus')) &&
        isTimestampInRange(r.tanggal, filterStartTs, filterEndTs)
    )
    .reduce((s, r) => s + Number(r.qty || 0), 0);

  const retRusak = returs
    .filter(
      (r) =>
        r.sku === sku &&
        (r.kondisi === 'Barang Rusak' || r.kondisi.includes('Rusak')) &&
        isTimestampInRange(r.tanggal, filterStartTs, filterEndTs)
    )
    .reduce((s, r) => s + Number(r.qty || 0), 0);

  const opnameDiff = opnames
    .filter((op) => op.sku === sku && isTimestampInRange(op.tanggal, filterStartTs, filterEndTs))
    .reduce((s, op) => s + Number(op.selisih || 0), 0);

  const terjualNet = Math.max(0, keluar - retBagus - retRusak);
  const stokAkhirPeriode = stokAwalPeriode + masuk - keluar + retBagus + opnameDiff;

  // Global total calculation to evaluate current real stock
  const allMasuk = inbounds.filter((i) => i.sku === sku).reduce((s, i) => s + Number(i.qty || 0), 0);
  const allKeluar = outbounds.filter((o) => o.sku === sku).reduce((s, o) => s + Number(o.qty || 0), 0);
  const allRetBagus = returs
    .filter((r) => r.sku === sku && (r.kondisi === 'Barang Bagus' || r.kondisi.includes('Bagus')))
    .reduce((s, r) => s + Number(r.qty || 0), 0);
  const allOpname = opnames.filter((op) => op.sku === sku).reduce((s, op) => s + Number(op.selisih || 0), 0);
  const stokTersediaSaatIni = masterAwal + allMasuk - allKeluar + allRetBagus + allOpname;

  const evalStock = filterStartDateStr ? stokAkhirPeriode : stokTersediaSaatIni;
  const status: 'AMAN' | 'ORDER' = evalStock <= batasMin ? 'ORDER' : 'AMAN';
  const defisit = evalStock <= batasMin ? Math.max(0, batasMin - evalStock) : 0;

  return {
    sku,
    nama: prod.nama,
    kategori: prod.kategori,
    satuan: prod.satuan,
    min: batasMin,
    stokAwal: masterAwal,
    stokAwalPeriode,
    stokAkhirPeriode,
    stokTersediaSaatIni,
    in: masuk,
    out: keluar,
    retBagus,
    retRusak,
    opname: opnameDiff,
    terjual: terjualNet,
    akhir: stokAkhirPeriode,
    defisit,
    status,
  };
}

export function calculateDailySummary(
  outbounds: OutboundRecord[],
  returs: ReturRecord[],
  inbounds: InboundRecord[],
  targetDate: string
): {
  totalLoading: number;
  totalReturBagus: number;
  totalReturRusak: number;
  totalInbound: number;
  totalTerjual: number;
} {
  const startTs = parseLocalStartOfDay(targetDate);
  const endTs = parseLocalEndOfDay(targetDate);

  let totalLoading = 0;
  let totalReturBagus = 0;
  let totalReturRusak = 0;
  let totalInbound = 0;

  outbounds.forEach((o) => {
    if (isTimestampInRange(o.tanggal, startTs, endTs)) {
      totalLoading += Number(o.qty || 0);
    }
  });

  returs.forEach((r) => {
    if (isTimestampInRange(r.tanggal, startTs, endTs)) {
      if (r.kondisi === 'Barang Bagus' || r.kondisi.includes('Bagus')) {
        totalReturBagus += Number(r.qty || 0);
      } else {
        totalReturRusak += Number(r.qty || 0);
      }
    }
  });

  inbounds.forEach((i) => {
    if (isTimestampInRange(i.tanggal, startTs, endTs)) {
      totalInbound += Number(i.qty || 0);
    }
  });

  const totalTerjual = Math.max(0, totalLoading - totalReturBagus - totalReturRusak);

  return {
    totalLoading,
    totalReturBagus,
    totalReturRusak,
    totalInbound,
    totalTerjual,
  };
}

export function getKartuStok(
  sku: string,
  products: Product[],
  inbounds: InboundRecord[],
  outbounds: OutboundRecord[],
  returs: ReturRecord[],
  opnames: OpnameRecord[],
  getMotorisLabel: (id: string) => string
): {
  product: Product;
  saldoAwal: number;
  totalTerjual: number;
  saldoAkhir: number;
  rows: KartuStokRow[];
} | null {
  const prod = products.find((p) => p.sku === sku);
  if (!prod) return null;

  interface EventItem {
    date: string;
    type: string;
    doc: string;
    in: number;
    out: number;
    colorClass: string;
  }

  const events: EventItem[] = [];

  inbounds
    .filter((i) => i.sku === sku)
    .forEach((i) => {
      events.push({
        date: i.tanggal,
        type: 'IN',
        doc: i.noBukti,
        in: Number(i.qty || 0),
        out: 0,
        colorClass: 'text-blue-600',
      });
    });

  outbounds
    .filter((o) => o.sku === sku)
    .forEach((o) => {
      events.push({
        date: o.tanggal,
        type: 'OUT',
        doc: `${o.noJalan} (${getMotorisLabel(o.idMotoris)})`,
        in: 0,
        out: Number(o.qty || 0),
        colorClass: 'text-amber-600',
      });
    });

  returs
    .filter((r) => r.sku === sku)
    .forEach((r) => {
      const isBagus = r.kondisi === 'Barang Bagus' || r.kondisi.includes('Bagus');
      const inVal = isBagus ? Number(r.qty || 0) : 0;
      events.push({
        date: r.tanggal,
        type: `RET (${r.kondisi})`,
        doc: `${r.noRetur} (${getMotorisLabel(r.idMotoris)})`,
        in: inVal,
        out: 0,
        colorClass: isBagus ? 'text-emerald-600' : 'text-rose-600',
      });
    });

  opnames
    .filter((op) => op.sku === sku)
    .forEach((op) => {
      const diff = Number(op.selisih || 0);
      events.push({
        date: op.tanggal,
        type: 'AUDIT',
        doc: op.ket || 'Stock Opname',
        in: diff > 0 ? diff : 0,
        out: diff < 0 ? Math.abs(diff) : 0,
        colorClass: 'text-purple-600',
      });
    });

  events.sort((a, b) => (parseLocalStartOfDay(a.date) || 0) - (parseLocalStartOfDay(b.date) || 0));

  let currentBalance = Number(prod.stokAwal || 0);
  let totalOut = 0;
  let totalRet = 0;

  const rows: KartuStokRow[] = events.map((ev) => {
    currentBalance = currentBalance + ev.in - ev.out;
    if (ev.type === 'OUT') totalOut += ev.out;
    if (ev.type.startsWith('RET') && ev.in > 0) totalRet += ev.in;

    return {
      tanggal: ev.date.split('T')[0],
      jenis: ev.type,
      keterangan: ev.doc,
      in: ev.in,
      out: ev.out,
      saldo: currentBalance,
      colorClass: ev.colorClass,
    };
  });

  const totalTerjual = Math.max(0, totalOut - totalRet);

  return {
    product: prod,
    saldoAwal: Number(prod.stokAwal || 0),
    totalTerjual,
    saldoAkhir: currentBalance,
    rows,
  };
}

export function exportToCSV(
  type: 'outbound' | 'retur' | 'inbound' | 'opname' | 'stok',
  dataPayload: {
    outbounds: OutboundRecord[];
    returs: ReturRecord[];
    inbounds: InboundRecord[];
    opnames?: OpnameRecord[];
    products: Product[];
    motoris: Motoris[];
    getProductName: (sku: string) => string;
    getMotorisName: (id: string) => string;
    calcs: StockCalculation[];
    filterStartDate?: string;
    filterEndDate?: string;
  }
): { success: boolean; message: string } {
  let headers: string[] = [];
  let rows: (string | number)[][] = [];
  const filename = `Laporan_${type.toUpperCase()}_Mahameru_${getTodayDateString()}.csv`;

  if (type === 'outbound') {
    headers = ['Tanggal', 'No Jalan', 'ID Motoris', 'Nama Motoris', 'Area', 'SKU', 'Nama Produk', 'Qty', 'Satuan', 'Keterangan'];
    rows = dataPayload.outbounds.map((r) => {
      const p = dataPayload.products.find((prod) => prod.sku === r.sku);
      const m = dataPayload.motoris.find((mot) => mot.id === r.idMotoris);
      return [
        r.tanggal.split('T')[0],
        r.noJalan,
        r.idMotoris,
        m?.nama || dataPayload.getMotorisName(r.idMotoris),
        m?.area || '-',
        r.sku,
        p?.nama || dataPayload.getProductName(r.sku),
        r.qty,
        p?.satuan || 'Pcs',
        r.ket || '-',
      ];
    });
  } else if (type === 'retur') {
    headers = ['Tanggal', 'No Retur', 'ID Motoris', 'Nama Motoris', 'SKU', 'Nama Produk', 'Qty', 'Kondisi', 'Keterangan'];
    rows = dataPayload.returs.map((r) => [
      r.tanggal.split('T')[0],
      r.noRetur,
      r.idMotoris,
      dataPayload.getMotorisName(r.idMotoris),
      r.sku,
      dataPayload.getProductName(r.sku),
      r.qty,
      r.kondisi,
      r.ket || '-',
    ]);
  } else if (type === 'inbound') {
    headers = ['Tanggal', 'No Bukti DO', 'Batch No', 'Exp Date', 'SKU', 'Nama Produk', 'Kategori', 'Qty', 'Satuan'];
    rows = dataPayload.inbounds.map((r) => {
      const p = dataPayload.products.find((prod) => prod.sku === r.sku);
      return [
        r.tanggal.split('T')[0],
        r.noBukti,
        r.batchNo || '-',
        r.expDate || '-',
        r.sku,
        p?.nama || dataPayload.getProductName(r.sku),
        p?.kategori || '-',
        r.qty,
        p?.satuan || 'Pcs',
      ];
    });
  } else if (type === 'opname') {
    headers = ['Tanggal', 'SKU', 'Nama Produk', 'Stok Sistem', 'Stok Fisik', 'Selisih (+/-)', 'Keterangan'];
    rows = (dataPayload.opnames || []).map((o) => [
      o.tanggal.split('T')[0],
      o.sku,
      dataPayload.getProductName(o.sku),
      o.stokSistem,
      o.stokFisik,
      o.selisih >= 0 ? `+${o.selisih}` : o.selisih,
      o.ket || '-',
    ]);
  } else if (type === 'stok') {
    headers = [
      'SKU',
      'Nama Produk',
      'Kategori',
      'Awal Periode',
      'Barang Masuk',
      'Loading Keluar',
      'Retur Bagus',
      'Retur Rusak',
      'Opname (+/-)',
      'Net Terjual',
      'Akhir Periode',
      'Satuan',
      'Status',
    ];
    rows = dataPayload.calcs.map((c) => [
      c.sku,
      c.nama,
      c.kategori,
      c.stokAwalPeriode,
      c.in,
      c.out,
      c.retBagus,
      c.retRusak,
      c.opname,
      c.terjual,
      c.stokAkhirPeriode,
      c.satuan,
      c.status,
    ]);
  }

  try {
    const csvContent = [headers.join(','), ...rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return { success: true, message: `File ${filename} berhasil diunduh.` };
  } catch {
    return { success: false, message: 'Gagal mengekspor data ke format CSV.' };
  }
}

export function exportBackupJSON(state: {
  products: Product[];
  motoris: Motoris[];
  outbound: OutboundRecord[];
  retur: ReturRecord[];
  inbound: InboundRecord[];
  opname: OpnameRecord[];
}): void {
  const jsonContent = JSON.stringify(
    {
      version: '2.0.FINAL.PRO',
      exportedAt: new Date().toISOString(),
      ...state,
    },
    null,
    2
  );

  const blob = new Blob([jsonContent], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `Backup_Database_Mahameru_${getTodayDateString()}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export const GOOGLE_APPS_SCRIPT_TEMPLATE = `/**
 * =========================================================================
 * BACKEND GOOGLE APPS SCRIPT - PT. MAHAMERU INSAN MANDIRI
 * Sistem Persediaan & Pergerakan Stok Multi-Motoris
 * =========================================================================
 * CARA DEPLOY:
 * 1. Buka spreadsheet Google Sheets Anda (bisa spreadsheet kosong).
 * 2. Klik menu 'Extensions' (Ekstensi) -> 'Apps Script'.
 * 3. Hapus semua kode default, paste seluruh kode ini.
 * 4. Klik tombol 'Deploy' (Terapkan) di kanan atas -> 'New deployment' (Penerapan baru).
 * 5. Pilih tipe: 'Web app' (Aplikasi web).
 * 6. Set 'Execute as': 'Me' (Saya).
 * 7. Set 'Who has access': 'Anyone' (Siapa saja). -> PENTING!
 * 8. Klik 'Deploy', izinkan akses (Authorize), lalu salin Web App URL.
 * 9. Paste Web App URL tersebut ke menu Setup Database di aplikasi.
 * =========================================================================
 */

var SHEET_CONFIG = {
  Master_Produk: {
    headers: ["sku", "nama", "kategori", "satuan", "stokAwal", "batasMin"],
    labels: ["SKU", "Nama Produk", "Kategori", "Satuan", "Stok Awal", "Batas Min"],
    keyCol: 0
  },
  Master_Motoris: {
    headers: ["id", "nama", "area"],
    labels: ["ID Motoris", "Nama Motoris", "Area"],
    keyCol: 0
  },
  Barang_Keluar: {
    headers: ["tanggal", "noJalan", "idMotoris", "sku", "qty", "ket"],
    labels: ["Tanggal", "No Surat Jalan", "ID Motoris", "SKU", "Qty", "Keterangan"],
    keyCol: 1
  },
  Retur: {
    headers: ["tanggal", "noRetur", "idMotoris", "sku", "qty", "kondisi", "ket"],
    labels: ["Tanggal", "No Retur", "ID Motoris", "SKU", "Qty", "Kondisi", "Keterangan"],
    keyCol: 1
  },
  Barang_Masuk: {
    headers: ["tanggal", "noBukti", "batchNo", "expDate", "sku", "qty"],
    labels: ["Tanggal", "No Bukti", "No Batch", "Exp Date", "SKU", "Qty"],
    keyCol: 1
  },
  Cek_Fisik: {
    headers: ["tanggal", "sku", "stokSistem", "stokFisik", "selisih", "ket"],
    labels: ["Tanggal", "SKU", "Stok Sistem", "Stok Fisik", "Selisih", "Keterangan"],
    keyCol: 1
  }
};

function findSheetFlexible(ss, targetName, aliases) {
  var sheet = ss.getSheetByName(targetName);
  if (sheet) return sheet;
  for (var i = 0; i < aliases.length; i++) {
    sheet = ss.getSheetByName(aliases[i]);
    if (sheet) return sheet;
  }
  var allSheets = ss.getSheets();
  var cleanTarget = targetName.toLowerCase().replace(/[^a-z0-9]/g, "");
  var cleanAliases = aliases.map(function(a) { return a.toLowerCase().replace(/[^a-z0-9]/g, ""); });
  for (var j = 0; j < allSheets.length; j++) {
    var sName = allSheets[j].getName().toLowerCase().replace(/[^a-z0-9]/g, "");
    if (sName === cleanTarget || cleanAliases.indexOf(sName) !== -1) {
      return allSheets[j];
    }
  }
  return null;
}

function getOrCreateSheet(ss, sheetName) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  var cfg = SHEET_CONFIG[sheetName];
  if (cfg && sheet.getLastRow() === 0) {
    sheet.appendRow(cfg.headers);
    var headerRange = sheet.getRange(1, 1, 1, cfg.headers.length);
    headerRange.setFontWeight("bold");
    headerRange.setBackground("#0b1e36");
    headerRange.setFontColor("#ffffff");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function initAllSheets(ss) {
  for (var name in SHEET_CONFIG) {
    getOrCreateSheet(ss, name);
  }
}

function rowObjectToArray(sheetName, obj) {
  var cfg = SHEET_CONFIG[sheetName];
  if (!cfg) return Object.values(obj || {});
  return cfg.headers.map(function(h) {
    var val = obj[h];
    if (val === undefined || val === null) {
      for (var k in obj) {
        if (k.toLowerCase() === h.toLowerCase()) {
          val = obj[k];
          break;
        }
      }
    }
    if (h === "qty" || h === "stokAwal" || h === "batasMin" || h === "stokSistem" || h === "stokFisik" || h === "selisih") {
      return Number(val) || 0;
    }
    return val !== undefined && val !== null ? String(val) : "";
  });
}

function normalizeHeaderName(rawHeader) {
  var h = String(rawHeader).trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  if (h === "sku" || h === "skuid" || h === "kodeproduk" || h === "kodebarang" || h === "kodeitem") return "sku";
  if (h === "nama" || h === "namaproduk" || h === "namamotoris" || h === "namasales" || h === "sales" || h === "salesman" || h === "namabarang" || h === "namalengkap") return "nama";
  if (h === "kategori" || h === "category" || h === "jenis") return "kategori";
  if (h === "satuan" || h === "unit" || h === "kemasan" || h === "uom") return "satuan";
  if (h === "stokawal" || h === "awal" || h === "saldoawal" || h === "stockawal") return "stokAwal";
  if (h === "batasmin" || h === "min" || h === "batasminimal" || h === "stokmin" || h === "minstok" || h === "buffer") return "batasMin";
  if (h === "id" || h === "idmotoris" || h === "motorisid" || h === "kode" || h === "kodemotoris" || h === "kodesales" || h === "idsales" || h === "noid" || h === "nip" || h === "nik") return "id";
  if (h === "area" || h === "wilayah" || h === "rayon" || h === "rute" || h === "areakerja" || h === "lokasi" || h === "zona") return "area";
  if (h === "tanggal" || h === "tgl" || h === "date") return "tanggal";
  if (h === "nojalan" || h === "nosuratjalan" || h === "suratjalan" || h === "noresi") return "noJalan";
  if (h === "noretur" || h === "nobuktiretur") return "noRetur";
  if (h === "nobukti" || h === "nodo" || h === "nosuratdo" || h === "noinbound") return "noBukti";
  if (h === "batchno" || h === "batch" || h === "nobatch" || h === "lot") return "batchNo";
  if (h === "expdate" || h === "expired" || h === "kadaluarsa" || h === "exp") return "expDate";
  if (h === "qty" || h === "jumlah" || h === "kuantitas" || h === "total" || h === "volume") return "qty";
  if (h === "kondisi" || h === "statuskondisi") return "kondisi";
  if (h === "ket" || h === "keterangan" || h === "catatan" || h === "note" || h === "deskripsi") return "ket";
  if (h === "stoksistem" || h === "sistem" || h === "stokkomputer") return "stokSistem";
  if (h === "stokfisik" || h === "fisik" || h === "real") return "stokFisik";
  if (h === "selisih" || h === "diff" || h === "variance") return "selisih";
  return String(rawHeader).trim();
}

function readSheetData(sheet, sheetName) {
  if (!sheet) return [];
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow <= 1 || lastCol === 0) return [];
  
  var data = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  var rawHeaders = data[0];
  var normalizedHeaders = rawHeaders.map(function(h) {
    return normalizeHeaderName(h);
  });

  var result = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var isEmpty = row.every(function(cell) { return cell === "" || cell === null; });
    if (isEmpty) continue;

    var obj = {};
    for (var j = 0; j < normalizedHeaders.length; j++) {
      var key = normalizedHeaders[j];
      var cellVal = row[j];
      if (cellVal instanceof Date) {
        var y = cellVal.getFullYear();
        var m = String(cellVal.getMonth() + 1).padStart(2, "0");
        var d = String(cellVal.getDate()).padStart(2, "0");
        cellVal = y + "-" + m + "-" + d;
      }
      if (key === "qty" || key === "stokAwal" || key === "batasMin" || key === "stokSistem" || key === "stokFisik" || key === "selisih") {
        cellVal = Number(cellVal) || 0;
      }
      obj[key] = cellVal;
    }
    result.push(obj);
  }
  return result;
}

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || "ping";
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  if (action === "ping") {
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Pong! PT Mahameru Inventory Cloud Online.",
      spreadsheetName: ss.getName(),
      timestamp: new Date().toISOString()
    })).setMimeType(ContentService.MimeType.JSON);
  }

  if (action === "initSheets") {
    initAllSheets(ss);
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Seluruh sheet berhasil disiapkan dengan format resmi."
    })).setMimeType(ContentService.MimeType.JSON);
  }

  if (action === "getAll") {
    var sheetProd = findSheetFlexible(ss, "Master_Produk", ["Produk", "Master Produk", "Data Produk", "Products", "Barang"]);
    var sheetMot = findSheetFlexible(ss, "Master_Motoris", ["Motoris", "Master Motoris", "Data Motoris", "Daftar Motoris", "Sales", "Sales Motoris", "Master Sales"]);
    var sheetOut = findSheetFlexible(ss, "Barang_Keluar", ["Barang Keluar", "Keluar", "Outbound", "Surat Jalan", "Muatan"]);
    var sheetRet = findSheetFlexible(ss, "Retur", ["Retur Motoris", "Barang Retur", "Retur Barang"]);
    var sheetIn = findSheetFlexible(ss, "Barang_Masuk", ["Barang Masuk", "Masuk", "Inbound", "Surat DO", "DO"]);
    var sheetOp = findSheetFlexible(ss, "Cek_Fisik", ["Cek Fisik", "Opname", "Stock Opname", "Audit"]);

    var payload = {
      status: "success",
      products: readSheetData(sheetProd, "Master_Produk"),
      motoris: readSheetData(sheetMot, "Master_Motoris"),
      outbound: readSheetData(sheetOut, "Barang_Keluar"),
      retur: readSheetData(sheetRet, "Retur"),
      inbound: readSheetData(sheetIn, "Barang_Masuk"),
      opname: readSheetData(sheetOp, "Cek_Fisik")
    };
    return ContentService.createTextOutput(JSON.stringify(payload))
      .setMimeType(ContentService.MimeType.JSON);
  }

  return ContentService.createTextOutput(JSON.stringify({
    status: "error",
    message: "Action tidak dikenal: " + action
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var data = {};
  try {
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: "Format JSON payload tidak valid: " + err.message
    })).setMimeType(ContentService.MimeType.JSON);
  }

  var action = data.action;
  var sheetName = data.sheet;

  if (action === "initSheets") {
    initAllSheets(ss);
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Struktur sheet berhasil diinisialisasi."
    })).setMimeType(ContentService.MimeType.JSON);
  }

  if (action === "syncAll") {
    initAllSheets(ss);
    var sheetsMap = {
      Master_Produk: data.products,
      Master_Motoris: data.motoris,
      Barang_Keluar: data.outbound,
      Retur: data.retur,
      Barang_Masuk: data.inbound,
      Cek_Fisik: data.opname
    };

    for (var sName in sheetsMap) {
      var rowsList = sheetsMap[sName];
      if (Array.isArray(rowsList)) {
        var targetSheet = getOrCreateSheet(ss, sName);
        var lastR = targetSheet.getLastRow();
        if (lastR > 1) {
          targetSheet.deleteRows(2, lastR - 1);
        }
        if (rowsList.length > 0) {
          var arrRows = rowsList.map(function(item) {
            return rowObjectToArray(sName, item);
          });
          targetSheet.getRange(2, 1, arrRows.length, arrRows[0].length).setValues(arrRows);
        }
      }
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Sinkronisasi seluruh database ke Google Sheets berhasil!"
    })).setMimeType(ContentService.MimeType.JSON);
  }

  if (!sheetName) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: "Nama sheet tidak disertakan."
    })).setMimeType(ContentService.MimeType.JSON);
  }

  var sheet = getOrCreateSheet(ss, sheetName);
  var cfg = SHEET_CONFIG[sheetName];

  // CREATE / APPEND MULTIPLE
  if (action === "appendRows" && Array.isArray(data.rows)) {
    if (data.rows.length > 0) {
      var arrs = data.rows.map(function(row) {
        return rowObjectToArray(sheetName, row);
      });
      sheet.getRange(sheet.getLastRow() + 1, 1, arrs.length, arrs[0].length).setValues(arrs);
    }
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      insertedCount: data.rows.length
    })).setMimeType(ContentService.MimeType.JSON);
  }

  // CREATE / APPEND SINGLE
  if (action === "appendRow") {
    var singleItem = data.rowData || (data.rows && data.rows[0]) || data.payload;
    if (singleItem) {
      var arr = rowObjectToArray(sheetName, singleItem);
      sheet.appendRow(arr);
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        inserted: singleItem
      })).setMimeType(ContentService.MimeType.JSON);
    }
  }

  // UPDATE RECORD
  if (action === "updateRow") {
    var searchKey = data.searchKey || (data.rowData && data.rowData.searchKey);
    var searchCol = Number(data.searchCol !== undefined ? data.searchCol : (data.rowData && data.rowData.searchCol));
    if (isNaN(searchCol)) {
      searchCol = cfg ? cfg.keyCol : 0;
    }
    var newRowObj = data.newRow || (data.rowData && data.rowData.newRow) || data.rowData;

    if (!searchKey && newRowObj) {
      searchKey = newRowObj.sku || newRowObj.id;
    }

    if (searchKey !== undefined && newRowObj) {
      var allRows = sheet.getDataRange().getValues();
      var updated = false;
      for (var r = 1; r < allRows.length; r++) {
        if (String(allRows[r][searchCol]) === String(searchKey)) {
          var updatedArr = rowObjectToArray(sheetName, newRowObj);
          sheet.getRange(r + 1, 1, 1, updatedArr.length).setValues([updatedArr]);
          updated = true;
          break;
        }
      }
      return ContentService.createTextOutput(JSON.stringify({
        status: updated ? "success" : "not_found",
        updated: updated,
        searchKey: searchKey
      })).setMimeType(ContentService.MimeType.JSON);
    }
  }

  // DELETE RECORD
  if (action === "deleteRow") {
    var delKey = data.searchKey || (data.rowData && data.rowData.searchKey);
    var delCol = Number(data.searchCol !== undefined ? data.searchCol : (data.rowData && data.rowData.searchCol));
    if (isNaN(delCol)) {
      delCol = cfg ? cfg.keyCol : 0;
    }
    var secKey = data.secondaryKey || (data.rowData && data.rowData.secondaryKey);
    var secCol = data.secondaryCol !== undefined ? Number(data.secondaryCol) : (data.rowData && data.rowData.secondaryCol !== undefined ? Number(data.rowData.secondaryCol) : null);

    var rows = sheet.getDataRange().getValues();
    var deleted = false;
    for (var i = rows.length - 1; i >= 1; i--) {
      var matchPrimary = String(rows[i][delCol]) === String(delKey);
      var matchSec = (secKey === undefined || secKey === null || secCol === null) ? true : String(rows[i][secCol]) === String(secKey);

      if (matchPrimary && matchSec) {
        sheet.deleteRow(i + 1);
        deleted = true;
        break;
      }
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      deleted: deleted,
      searchKey: delKey
    })).setMimeType(ContentService.MimeType.JSON);
  }

  return ContentService.createTextOutput(JSON.stringify({
    status: "error",
    message: "Action tidak dikenal: " + action
  })).setMimeType(ContentService.MimeType.JSON);
}
`;
