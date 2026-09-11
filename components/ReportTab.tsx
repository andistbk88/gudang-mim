'use client';

import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Printer,
  BookOpen,
  ArrowDownToDot,
  Truck,
  BarChart3,
  Search,
  RotateCcw,
} from 'lucide-react';
import {
  Product,
  OutboundRecord,
  ReturRecord,
  InboundRecord,
  OpnameRecord,
  Motoris,
} from '@/types/inventory';
import { calculateStockForProduct, exportToCSV } from '@/lib/storage';

type SubReportType = 'mutasi' | 'masuk' | 'keluar';

interface ReportTabProps {
  products: Product[];
  motoris: Motoris[];
  outboundRecords: OutboundRecord[];
  returRecords: ReturRecord[];
  inboundRecords: InboundRecord[];
  opnameRecords: OpnameRecord[];
  onOpenKartuStok: (sku: string) => void;
  onPrintSlip?: (type: 'outbound' | 'retur' | 'inbound', docId: string) => void;
  onShowToast: (message: string, type: 'info' | 'success' | 'error') => void;
}

export const ReportTab: React.FC<ReportTabProps> = ({
  products,
  motoris,
  outboundRecords,
  returRecords,
  inboundRecords,
  opnameRecords,
  onOpenKartuStok,
  onPrintSlip,
  onShowToast,
}) => {
  const [subReport, setSubReport] = useState<SubReportType>('mutasi');

  // Filter States
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');
  const [filterKategori, setFilterKategori] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterMotoris, setFilterMotoris] = useState<string>('ALL');
  const [filterSearch, setFilterSearch] = useState<string>('');

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.kategori) set.add(p.kategori);
    });
    return Array.from(set);
  }, [products]);

  const setPeriodPreset = (preset: 'today' | 'month' | 'all') => {
    const d = new Date();
    const format = (dt: Date) => {
      const year = dt.getFullYear();
      const month = String(dt.getMonth() + 1).padStart(2, '0');
      const day = String(dt.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    if (preset === 'today') {
      const today = format(d);
      setFilterStartDate(today);
      setFilterEndDate(today);
    } else if (preset === 'month') {
      const firstDay = format(new Date(d.getFullYear(), d.getMonth(), 1));
      const today = format(d);
      setFilterStartDate(firstDay);
      setFilterEndDate(today);
    } else {
      setFilterStartDate('');
      setFilterEndDate('');
    }
  };

  // 1. REKAP MUTASI CALCULATIONS
  const calculatedRows = useMemo(() => {
    return products
      .map((p) =>
        calculateStockForProduct(
          p.sku,
          products,
          inboundRecords,
          outboundRecords,
          returRecords,
          opnameRecords,
          filterStartDate || undefined,
          filterEndDate || undefined
        )
      )
      .filter((c): c is NonNullable<typeof c> => c !== null)
      .filter((c) => {
        if (filterKategori !== 'ALL' && c.kategori !== filterKategori) return false;
        if (filterStatus !== 'ALL' && c.status !== filterStatus) return false;
        if (filterSearch) {
          const s = filterSearch.toLowerCase();
          if (!c.sku.toLowerCase().includes(s) && !c.nama.toLowerCase().includes(s)) {
            return false;
          }
        }
        return true;
      });
  }, [
    products,
    inboundRecords,
    outboundRecords,
    returRecords,
    opnameRecords,
    filterStartDate,
    filterEndDate,
    filterKategori,
    filterStatus,
    filterSearch,
  ]);

  const sumsMutasi = useMemo(() => {
    return calculatedRows.reduce(
      (acc, c) => ({
        awal: acc.awal + c.stokAwalPeriode,
        in: acc.in + c.in,
        out: acc.out + c.out,
        retBgs: acc.retBgs + c.retBagus,
        retRsk: acc.retRsk + c.retRusak,
        opname: acc.opname + c.opname,
        net: acc.net + c.terjual,
        akhir: acc.akhir + c.stokAkhirPeriode,
      }),
      { awal: 0, in: 0, out: 0, retBgs: 0, retRsk: 0, opname: 0, net: 0, akhir: 0 }
    );
  }, [calculatedRows]);

  // 2. LAPORAN STOK MASUK (INBOUND)
  const filteredInbound = useMemo(() => {
    return inboundRecords.filter((rec) => {
      const recDate = rec.tanggal.split('T')[0];
      if (filterStartDate && recDate < filterStartDate) return false;
      if (filterEndDate && recDate > filterEndDate) return false;

      const prod = products.find((p) => p.sku === rec.sku);
      if (filterKategori !== 'ALL' && prod?.kategori !== filterKategori) return false;

      if (filterSearch) {
        const s = filterSearch.toLowerCase();
        const matchDO = rec.noBukti.toLowerCase().includes(s);
        const matchSKU = rec.sku.toLowerCase().includes(s);
        const matchNama = prod?.nama.toLowerCase().includes(s) || false;
        const matchBatch = rec.batchNo ? rec.batchNo.toLowerCase().includes(s) : false;
        if (!matchDO && !matchSKU && !matchNama && !matchBatch) return false;
      }
      return true;
    });
  }, [inboundRecords, filterStartDate, filterEndDate, filterKategori, filterSearch, products]);

  const sumsInbound = useMemo(() => {
    const totalQty = filteredInbound.reduce((s, r) => s + Number(r.qty || 0), 0);
    const uniqueDO = new Set(filteredInbound.map((r) => r.noBukti)).size;
    const uniqueSKU = new Set(filteredInbound.map((r) => r.sku)).size;
    return { totalQty, uniqueDO, uniqueSKU };
  }, [filteredInbound]);

  // 3. LAPORAN STOK KELUAR (OUTBOUND)
  const filteredOutbound = useMemo(() => {
    return outboundRecords.filter((rec) => {
      const recDate = rec.tanggal.split('T')[0];
      if (filterStartDate && recDate < filterStartDate) return false;
      if (filterEndDate && recDate > filterEndDate) return false;

      if (filterMotoris !== 'ALL' && rec.idMotoris !== filterMotoris) return false;

      const prod = products.find((p) => p.sku === rec.sku);
      if (filterKategori !== 'ALL' && prod?.kategori !== filterKategori) return false;

      if (filterSearch) {
        const s = filterSearch.toLowerCase();
        const mot = motoris.find((m) => m.id === rec.idMotoris);
        const matchNoJalan = rec.noJalan.toLowerCase().includes(s);
        const matchSKU = rec.sku.toLowerCase().includes(s);
        const matchNama = prod?.nama.toLowerCase().includes(s) || false;
        const matchMot = mot ? mot.nama.toLowerCase().includes(s) || mot.area.toLowerCase().includes(s) : false;
        const matchKet = rec.ket ? rec.ket.toLowerCase().includes(s) : false;
        if (!matchNoJalan && !matchSKU && !matchNama && !matchMot && !matchKet) return false;
      }
      return true;
    });
  }, [outboundRecords, filterStartDate, filterEndDate, filterMotoris, filterKategori, filterSearch, products, motoris]);

  const sumsOutbound = useMemo(() => {
    const totalQty = filteredOutbound.reduce((s, r) => s + Number(r.qty || 0), 0);
    const uniqueJalan = new Set(filteredOutbound.map((r) => r.noJalan)).size;
    const uniqueMotoris = new Set(filteredOutbound.map((r) => r.idMotoris)).size;
    return { totalQty, uniqueJalan, uniqueMotoris };
  }, [filteredOutbound]);

  // CSV Export Handler
  const handleExportCSV = () => {
    if (subReport === 'mutasi') {
      const res = exportToCSV('stok', {
        outbounds: outboundRecords,
        returs: returRecords,
        inbounds: inboundRecords,
        opnames: opnameRecords,
        products,
        motoris,
        getProductName: (sku) => products.find((p) => p.sku === sku)?.nama || sku,
        getMotorisName: (id) => motoris.find((m) => m.id === id)?.nama || id,
        calcs: calculatedRows,
        filterStartDate: filterStartDate || undefined,
        filterEndDate: filterEndDate || undefined,
      });
      onShowToast(res.message, res.success ? 'success' : 'error');
    } else if (subReport === 'masuk') {
      const res = exportToCSV('inbound', {
        outbounds: [],
        returs: [],
        inbounds: filteredInbound,
        opnames: [],
        products,
        motoris,
        getProductName: (sku) => products.find((p) => p.sku === sku)?.nama || sku,
        getMotorisName: (id) => motoris.find((m) => m.id === id)?.nama || id,
        calcs: [],
        filterStartDate: filterStartDate || undefined,
        filterEndDate: filterEndDate || undefined,
      });
      onShowToast(res.message, res.success ? 'success' : 'error');
    } else {
      const res = exportToCSV('outbound', {
        outbounds: filteredOutbound,
        returs: [],
        inbounds: [],
        opnames: [],
        products,
        motoris,
        getProductName: (sku) => products.find((p) => p.sku === sku)?.nama || sku,
        getMotorisName: (id) => motoris.find((m) => m.id === id)?.nama || id,
        calcs: [],
        filterStartDate: filterStartDate || undefined,
        filterEndDate: filterEndDate || undefined,
      });
      onShowToast(res.message, res.success ? 'success' : 'error');
    }
  };

  const reportTitle =
    subReport === 'mutasi'
      ? 'Rekap Mutasi Stok Lanjutan'
      : subReport === 'masuk'
      ? 'Laporan Penerimaan Stok Masuk (DO)'
      : 'Laporan Pengeluaran Stok Keluar (Loading)';

  const printOfficialTitle =
    subReport === 'mutasi'
      ? 'LAPORAN REKAPITULASI MUTASI PERSEDIAAN & STOK GUDANG'
      : subReport === 'masuk'
      ? 'LAPORAN PENERIMAAN BARANG MASUK DARI SUPPLIER / PABRIK (INBOUND)'
      : 'LAPORAN PENGELUARAN MUATAN BARANG KELUAR / LOADING SALES (OUTBOUND)';

  return (
    <section id="tabLaporan" className="space-y-6">
      {/* Sub-Report Navigation Pills (No-Print) */}
      <div className="bg-white rounded-xl border border-slate-200 p-2 shadow-xs flex flex-wrap items-center justify-between gap-2 no-print">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSubReport('mutasi')}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              subReport === 'mutasi'
                ? 'bg-[#0b1e36] text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-[#dfb753]" /> Rekap Mutasi Stok
          </button>

          <button
            type="button"
            onClick={() => setSubReport('masuk')}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              subReport === 'masuk'
                ? 'bg-blue-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <ArrowDownToDot className="w-3.5 h-3.5 text-blue-300" /> Laporan Stok Masuk (Inbound)
          </button>

          <button
            type="button"
            onClick={() => setSubReport('keluar')}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              subReport === 'keluar'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Truck className="w-3.5 h-3.5 text-amber-200" /> Laporan Stok Keluar (Outbound)
          </button>
        </div>

        <div className="text-[11px] text-slate-500 font-medium px-2 hidden sm:block">
          Sistem Laporan Pergudangan PT. Mahameru
        </div>
      </div>

      {/* Main Report Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Header Title & Actions */}
        <div className="p-5 border-b bg-slate-50/80 flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
          <div>
            <h2 className="text-lg font-extrabold text-[#0b1e36] flex items-center gap-2">
              {subReport === 'mutasi' && <BarChart3 className="w-5 h-5 text-[#c29b38]" />}
              {subReport === 'masuk' && <ArrowDownToDot className="w-5 h-5 text-blue-600" />}
              {subReport === 'keluar' && <Truck className="w-5 h-5 text-amber-600" />}
              {reportTitle}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {subReport === 'mutasi' && 'Rekapitulasi komprehensif stok awal, mutasi masuk/keluar, retur, dan stok akhir.'}
              {subReport === 'masuk' && 'Rincian transaksi penerimaan barang dari pabrik/supplier berdasarkan Surat Jalan/DO.'}
              {subReport === 'keluar' && 'Rincian pengeluaran muatan barang yang dibawa armada motoris/sales.'}
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleExportCSV}
              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition active:scale-95 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" /> Export CSV
            </button>
            <button
              onClick={() => window.print()}
              className="px-3 py-2 bg-[#0b1e36] hover:bg-[#163155] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition active:scale-95 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-[#dfb753]" /> Cetak PDF / Print
            </button>
          </div>
        </div>

        {/* Printable Official Header (KOP SURAT) for Paper / PDF Output */}
        <div className="print-only p-4 border-b-2 border-[#0b1e36] mb-4">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 border-2 border-[#0b1e36] rounded-lg flex items-center justify-center font-black text-lg text-[#0b1e36]">
                MIM
              </div>
              <div>
                <h1 className="font-black text-xl text-[#0b1e36] uppercase leading-tight">
                  PT. Mahameru Insan Mandiri
                </h1>
                <p className="text-xs text-slate-600 font-semibold">
                  Distribution Hub & Logistik Pergudangan
                </p>
                <h2 className="font-extrabold text-sm text-slate-800 uppercase tracking-wide mt-1">
                  {printOfficialTitle}
                </h2>
              </div>
            </div>
            <div className="text-right text-xs text-slate-600">
              <p className="font-semibold">
                Periode: {filterStartDate || 'Awal'} s/d {filterEndDate || 'Hari Ini'}
              </p>
              {subReport === 'keluar' && filterMotoris !== 'ALL' && (
                <p>Motoris: {motoris.find((m) => m.id === filterMotoris)?.nama || filterMotoris}</p>
              )}
              <p>Kategori: {filterKategori === 'ALL' ? 'Semua Kategori' : filterKategori}</p>
              <p className="text-[10px] text-slate-400 mt-1">
                Dicetak pada: {new Date().toLocaleString('id-ID')}
              </p>
            </div>
          </div>
        </div>

        {/* Summary Metric Cards */}
        {subReport === 'masuk' && (
          <div className="p-4 bg-blue-50/50 border-b border-slate-200 grid grid-cols-3 gap-3 text-center no-print">
            <div className="bg-white p-3 rounded-lg border border-blue-200 shadow-xs">
              <span className="block text-[10px] text-slate-400 uppercase font-bold">Total Transaksi DO</span>
              <span className="block text-base sm:text-lg font-black text-blue-900">{sumsInbound.uniqueDO} Dokumen</span>
            </div>
            <div className="bg-white p-3 rounded-lg border border-blue-200 shadow-xs">
              <span className="block text-[10px] text-slate-400 uppercase font-bold">Total Qty Diterima</span>
              <span className="block text-base sm:text-lg font-black text-blue-700">{sumsInbound.totalQty.toLocaleString()} Unit</span>
            </div>
            <div className="bg-white p-3 rounded-lg border border-blue-200 shadow-xs">
              <span className="block text-[10px] text-slate-400 uppercase font-bold">Variasi Produk Masuk</span>
              <span className="block text-base sm:text-lg font-black text-slate-800">{sumsInbound.uniqueSKU} SKU</span>
            </div>
          </div>
        )}

        {subReport === 'keluar' && (
          <div className="p-4 bg-amber-50/50 border-b border-slate-200 grid grid-cols-3 gap-3 text-center no-print">
            <div className="bg-white p-3 rounded-lg border border-amber-200 shadow-xs">
              <span className="block text-[10px] text-slate-400 uppercase font-bold">Total Surat Jalan</span>
              <span className="block text-base sm:text-lg font-black text-amber-900">{sumsOutbound.uniqueJalan} Dokumen</span>
            </div>
            <div className="bg-white p-3 rounded-lg border border-amber-200 shadow-xs">
              <span className="block text-[10px] text-slate-400 uppercase font-bold">Total Qty Muatan Keluar</span>
              <span className="block text-base sm:text-lg font-black text-amber-700">{sumsOutbound.totalQty.toLocaleString()} Unit</span>
            </div>
            <div className="bg-white p-3 rounded-lg border border-amber-200 shadow-xs">
              <span className="block text-[10px] text-slate-400 uppercase font-bold">Motoris Bertugas</span>
              <span className="block text-base sm:text-lg font-black text-slate-800">{sumsOutbound.uniqueMotoris} Orang</span>
            </div>
          </div>
        )}

        {/* Filter Controls (No-Print) */}
        <div className="px-5 py-3 border-b flex flex-col lg:flex-row justify-between gap-3 text-xs no-print bg-slate-50/40">
          <div className="flex flex-wrap items-center gap-2 bg-white p-1.5 rounded-lg border border-slate-200 shadow-xs">
            <input
              type="date"
              value={filterStartDate}
              onChange={(e) => setFilterStartDate(e.target.value)}
              className="border border-slate-300 rounded px-2 py-1 outline-none focus:border-[#c29b38] bg-white text-xs"
            />
            <span className="text-slate-400 font-medium">s/d</span>
            <input
              type="date"
              value={filterEndDate}
              onChange={(e) => setFilterEndDate(e.target.value)}
              className="border border-slate-300 rounded px-2 py-1 outline-none focus:border-[#c29b38] bg-white text-xs"
            />
            <div className="h-5 w-px bg-slate-200 mx-1"></div>
            <button
              onClick={() => setPeriodPreset('today')}
              className="px-2 py-1 text-slate-600 font-semibold hover:bg-slate-100 rounded transition cursor-pointer"
            >
              Hari Ini
            </button>
            <button
              onClick={() => setPeriodPreset('month')}
              className="px-2 py-1 text-slate-600 font-semibold hover:bg-slate-100 rounded transition cursor-pointer"
            >
              Bulan Ini
            </button>
            <button
              onClick={() => setPeriodPreset('all')}
              className="px-2 py-1 text-[#0b1e36] font-bold hover:bg-slate-100 rounded transition cursor-pointer"
            >
              Semua
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
              <input
                type="text"
                placeholder={
                  subReport === 'mutasi'
                    ? 'Cari SKU / Nama...'
                    : subReport === 'masuk'
                    ? 'Cari No DO/SKU/Nama...'
                    : 'Cari No Jalan/Motoris/SKU...'
                }
                value={filterSearch}
                onChange={(e) => setFilterSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg outline-none focus:border-[#c29b38] bg-white text-xs w-44 sm:w-56 shadow-xs"
              />
            </div>

            {subReport === 'keluar' && (
              <select
                value={filterMotoris}
                onChange={(e) => setFilterMotoris(e.target.value)}
                className="border border-slate-300 rounded-lg px-2.5 py-1.5 outline-none focus:border-[#c29b38] bg-white shadow-xs cursor-pointer text-xs"
              >
                <option value="ALL">Semua Motoris</option>
                {motoris.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nama} ({m.area})
                  </option>
                ))}
              </select>
            )}

            <select
              value={filterKategori}
              onChange={(e) => setFilterKategori(e.target.value)}
              className="border border-slate-300 rounded-lg px-2.5 py-1.5 outline-none focus:border-[#c29b38] bg-white shadow-xs cursor-pointer text-xs"
            >
              <option value="ALL">Semua Kategori</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            {subReport === 'mutasi' && (
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border border-slate-300 rounded-lg px-2.5 py-1.5 outline-none focus:border-[#c29b38] bg-white shadow-xs cursor-pointer text-xs"
              >
                <option value="ALL">Semua Status</option>
                <option value="AMAN">Stok Aman</option>
                <option value="ORDER">Perlu Order</option>
              </select>
            )}
          </div>
        </div>

        {/* 1. VIEW TABEL REKAP MUTASI */}
        {subReport === 'mutasi' && (
          <div className="overflow-x-auto max-h-[60vh]">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-100 text-slate-700 uppercase text-[10px] font-bold border-b shadow-xs sticky top-0 z-10 print:bg-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Kode SKU</th>
                  <th className="py-2.5 px-3">Nama Produk</th>
                  <th className="py-2.5 px-2 text-right bg-indigo-100/60 text-indigo-900">Awal</th>
                  <th className="py-2.5 px-2 text-right text-blue-700">Masuk</th>
                  <th className="py-2.5 px-2 text-right text-amber-700">Keluar</th>
                  <th className="py-2.5 px-2 text-right text-emerald-700">Retur (Bgs)</th>
                  <th className="py-2.5 px-2 text-right text-rose-700">Retur (Rsk)</th>
                  <th className="py-2.5 px-2 text-right text-purple-700">Opname</th>
                  <th className="py-2.5 px-2 text-right text-emerald-900 bg-emerald-50">Net Jual</th>
                  <th className="py-2.5 px-3 text-right bg-slate-200/80 font-black text-[#0b1e36]">Akhir</th>
                  <th className="py-2.5 px-2 text-center no-print">Kartu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {calculatedRows.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="text-center py-8 text-slate-400">
                      Tidak ada data persediaan sesuai filter
                    </td>
                  </tr>
                ) : (
                  calculatedRows.map((c) => (
                    <tr key={c.sku} className="hover:bg-slate-50 transition border-b border-slate-100">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-700">{c.sku}</td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-800">{c.nama}</div>
                        <span className="text-[10px] text-slate-400">{c.kategori}</span>
                      </td>
                      <td className="py-2.5 px-2 text-right font-bold text-indigo-950 bg-indigo-50/50">
                        {c.stokAwalPeriode}
                      </td>
                      <td className="py-2.5 px-2 text-right font-semibold text-blue-600">{c.in}</td>
                      <td className="py-2.5 px-2 text-right font-semibold text-amber-600">{c.out}</td>
                      <td className="py-2.5 px-2 text-right font-semibold text-emerald-600">{c.retBagus}</td>
                      <td className="py-2.5 px-2 text-right font-semibold text-rose-600">{c.retRusak}</td>
                      <td className="py-2.5 px-2 text-right font-semibold text-purple-600">
                        {c.opname > 0 ? `+${c.opname}` : c.opname}
                      </td>
                      <td className="py-2.5 px-2 text-right font-bold text-emerald-900 bg-emerald-50/50">
                        {c.terjual}
                      </td>
                      <td className="py-2.5 px-3 text-right font-black text-[#0b1e36] bg-slate-100/80">
                        {c.stokAkhirPeriode}{' '}
                        <span className="text-[10px] font-normal text-slate-400 block sm:inline">
                          {c.satuan}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-center no-print">
                        <button
                          onClick={() => onOpenKartuStok(c.sku)}
                          title="Buka Kartu Stok"
                          className="p-1.5 bg-slate-200 hover:bg-[#0b1e36] hover:text-white rounded transition text-slate-600 cursor-pointer active:scale-95"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {calculatedRows.length > 0 && (
                <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300 text-xs">
                  <tr>
                    <td colSpan={2} className="py-3 px-3 text-right font-black text-slate-700 uppercase tracking-wider">
                      TOTAL KESELURUHAN
                    </td>
                    <td className="py-3 px-2 text-right font-black text-indigo-950 bg-indigo-100/50">
                      {sumsMutasi.awal.toLocaleString()}
                    </td>
                    <td className="py-3 px-2 text-right font-black text-blue-700">
                      {sumsMutasi.in.toLocaleString()}
                    </td>
                    <td className="py-3 px-2 text-right font-black text-amber-700">
                      {sumsMutasi.out.toLocaleString()}
                    </td>
                    <td className="py-3 px-2 text-right font-black text-emerald-700">
                      {sumsMutasi.retBgs.toLocaleString()}
                    </td>
                    <td className="py-3 px-2 text-right font-black text-rose-700">
                      {sumsMutasi.retRsk.toLocaleString()}
                    </td>
                    <td className="py-3 px-2 text-right font-black text-purple-700">-</td>
                    <td className="py-3 px-2 text-right font-black text-emerald-900 bg-emerald-100/50">
                      {sumsMutasi.net.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right font-black text-[#0b1e36] bg-slate-200 text-sm">
                      {sumsMutasi.akhir.toLocaleString()}
                    </td>
                    <td className="no-print"></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}

        {/* 2. VIEW TABEL LAPORAN STOK MASUK (INBOUND) */}
        {subReport === 'masuk' && (
          <div className="overflow-x-auto max-h-[60vh]">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-100 text-slate-700 uppercase text-[10px] font-bold border-b shadow-xs sticky top-0 z-10 print:bg-slate-200">
                <tr>
                  <th className="py-2.5 px-3">No</th>
                  <th className="py-2.5 px-3">No. DO / Bukti</th>
                  <th className="py-2.5 px-3">Tanggal</th>
                  <th className="py-2.5 px-3">Kode SKU</th>
                  <th className="py-2.5 px-3">Deskripsi Produk</th>
                  <th className="py-2.5 px-3">Batch & Exp Date</th>
                  <th className="py-2.5 px-3 text-right font-bold text-blue-700">Qty Masuk</th>
                  <th className="py-2.5 px-3 text-center">Satuan</th>
                  <th className="py-2.5 px-3 text-center no-print">Slip</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredInbound.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-8 text-slate-400">
                      Tidak ada riwayat stok masuk sesuai filter periode ini
                    </td>
                  </tr>
                ) : (
                  filteredInbound.map((rec, idx) => {
                    const prod = products.find((p) => p.sku === rec.sku);
                    return (
                      <tr key={`${rec.noBukti}-${rec.sku}-${idx}`} className="hover:bg-slate-50 transition border-b border-slate-100">
                        <td className="py-2 px-3 text-slate-500">{idx + 1}</td>
                        <td className="py-2 px-3 font-mono font-bold text-[#0b1e36]">{rec.noBukti}</td>
                        <td className="py-2 px-3 text-slate-600">{rec.tanggal}</td>
                        <td className="py-2 px-3 font-mono font-semibold text-slate-700">{rec.sku}</td>
                        <td className="py-2 px-3">
                          <div className="font-semibold text-slate-800">{prod?.nama || rec.sku}</div>
                          <span className="text-[10px] text-slate-400">{prod?.kategori || '-'}</span>
                        </td>
                        <td className="py-2 px-3 text-slate-600">
                          <span className="font-mono text-xs">{rec.batchNo || '-'}</span>
                          {rec.expDate && <span className="block text-[10px] text-slate-400">Exp: {rec.expDate}</span>}
                        </td>
                        <td className="py-2 px-3 text-right font-black text-blue-700 text-sm">{rec.qty}</td>
                        <td className="py-2 px-3 text-center text-slate-600">{prod?.satuan || 'Pcs'}</td>
                        <td className="py-2 px-3 text-center no-print">
                          {onPrintSlip && (
                            <button
                              type="button"
                              onClick={() => onPrintSlip('inbound', rec.noBukti)}
                              title="Cetak Bukti Penerimaan DO"
                              className="p-1 bg-slate-100 text-slate-600 hover:text-white hover:bg-[#0b1e36] rounded transition cursor-pointer active:scale-95"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              {filteredInbound.length > 0 && (
                <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300 text-xs">
                  <tr>
                    <td colSpan={6} className="py-3 px-4 text-right font-black text-slate-700 uppercase tracking-wider">
                      TOTAL VOLUME STOK MASUK
                    </td>
                    <td className="py-3 px-3 text-right font-black text-blue-800 text-sm">
                      {sumsInbound.totalQty.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-center text-slate-600">Unit / Pcs</td>
                    <td className="no-print"></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}

        {/* 3. VIEW TABEL LAPORAN STOK KELUAR (OUTBOUND) */}
        {subReport === 'keluar' && (
          <div className="overflow-x-auto max-h-[60vh]">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-100 text-slate-700 uppercase text-[10px] font-bold border-b shadow-xs sticky top-0 z-10 print:bg-slate-200">
                <tr>
                  <th className="py-2.5 px-3">No</th>
                  <th className="py-2.5 px-3">No. Surat Jalan</th>
                  <th className="py-2.5 px-3">Tanggal</th>
                  <th className="py-2.5 px-3">Motoris & Area</th>
                  <th className="py-2.5 px-3">Kode SKU</th>
                  <th className="py-2.5 px-3">Deskripsi Produk</th>
                  <th className="py-2.5 px-3 text-right font-bold text-amber-700">Qty Keluar</th>
                  <th className="py-2.5 px-3 text-center">Satuan</th>
                  <th className="py-2.5 px-3">Keterangan</th>
                  <th className="py-2.5 px-3 text-center no-print">Slip</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredOutbound.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center py-8 text-slate-400">
                      Tidak ada riwayat stok keluar sesuai filter periode ini
                    </td>
                  </tr>
                ) : (
                  filteredOutbound.map((rec, idx) => {
                    const prod = products.find((p) => p.sku === rec.sku);
                    const mot = motoris.find((m) => m.id === rec.idMotoris);
                    return (
                      <tr key={`${rec.noJalan}-${rec.sku}-${idx}`} className="hover:bg-slate-50 transition border-b border-slate-100">
                        <td className="py-2 px-3 text-slate-500">{idx + 1}</td>
                        <td className="py-2 px-3 font-mono font-bold text-[#0b1e36]">{rec.noJalan}</td>
                        <td className="py-2 px-3 text-slate-600">{rec.tanggal}</td>
                        <td className="py-2 px-3">
                          <div className="font-bold text-slate-800">{mot?.nama || rec.idMotoris}</div>
                          <span className="text-[10px] text-slate-500 font-medium">{mot?.area || '-'}</span>
                        </td>
                        <td className="py-2 px-3 font-mono font-semibold text-slate-700">{rec.sku}</td>
                        <td className="py-2 px-3">
                          <div className="font-semibold text-slate-800">{prod?.nama || rec.sku}</div>
                          <span className="text-[10px] text-slate-400">{prod?.kategori || '-'}</span>
                        </td>
                        <td className="py-2 px-3 text-right font-black text-amber-700 text-sm">{rec.qty}</td>
                        <td className="py-2 px-3 text-center text-slate-600">{prod?.satuan || 'Pcs'}</td>
                        <td className="py-2 px-3 text-slate-500 text-xs">{rec.ket || '-'}</td>
                        <td className="py-2 px-3 text-center no-print">
                          {onPrintSlip && (
                            <button
                              type="button"
                              onClick={() => onPrintSlip('outbound', rec.noJalan)}
                              title="Cetak Surat Jalan"
                              className="p-1 bg-slate-100 text-slate-600 hover:text-white hover:bg-[#0b1e36] rounded transition cursor-pointer active:scale-95"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              {filteredOutbound.length > 0 && (
                <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300 text-xs">
                  <tr>
                    <td colSpan={6} className="py-3 px-4 text-right font-black text-slate-700 uppercase tracking-wider">
                      TOTAL VOLUME STOK KELUAR
                    </td>
                    <td className="py-3 px-3 text-right font-black text-amber-800 text-sm">
                      {sumsOutbound.totalQty.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-center text-slate-600">Unit / Pcs</td>
                    <td colSpan={2} className="no-print"></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}

        {/* Printable Official Signature Block for All Reports */}
        <div className="print-only p-6 pt-10 border-t-2 border-slate-300 page-break-inside-avoid">
          <div className="grid grid-cols-3 text-center">
            <div>
              <p className="text-xs font-semibold text-slate-600 mb-16">
                Dibuat Oleh,<br />
                <span className="font-normal text-[10px] text-slate-400">Admin Logistik & Inventori</span>
              </p>
              <p className="font-bold text-xs text-slate-800 border-t border-slate-400 mx-6 pt-1.5">
                ( ..................................... )
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-600 mb-16">
                Diperiksa Oleh,<br />
                <span className="font-normal text-[10px] text-slate-400">Supervisor Operasional Lapangan</span>
              </p>
              <p className="font-bold text-xs text-slate-800 border-t border-slate-400 mx-6 pt-1.5">
                ( ..................................... )
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-600 mb-16">
                Diketahui Oleh,<br />
                <span className="font-normal text-[10px] text-slate-400">Pimpinan Hub / Branch Manager</span>
              </p>
              <p className="font-bold text-xs text-slate-800 border-t border-slate-400 mx-6 pt-1.5">
                ( ..................................... )
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
