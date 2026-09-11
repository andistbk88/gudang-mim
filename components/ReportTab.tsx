'use client';

import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Printer,
  BookOpen,
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

interface ReportTabProps {
  products: Product[];
  motoris: Motoris[];
  outboundRecords: OutboundRecord[];
  returRecords: ReturRecord[];
  inboundRecords: InboundRecord[];
  opnameRecords: OpnameRecord[];
  onOpenKartuStok: (sku: string) => void;
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
  onShowToast,
}) => {
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');
  const [filterKategori, setFilterKategori] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
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

  const sums = useMemo(() => {
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

  const handleExportCSV = () => {
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
  };

  return (
    <section id="tabLaporan" className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Header Title & Actions */}
        <div className="p-5 border-b bg-slate-50/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-extrabold text-[#0b1e36]">Rekap Mutasi Stok Lanjutan</h2>
            <p className="text-xs text-slate-500">Filter berdasarkan rentang waktu mutasi dan kategori.</p>
          </div>
          <div className="flex gap-2 no-print">
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
              <Printer className="w-4 h-4" /> Cetak PDF
            </button>
          </div>
        </div>

        {/* Printable Header Banner for Paper Output */}
        <div className="print-only p-4 border-b-2 border-[#0b1e36]">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="font-black text-xl text-[#0b1e36] uppercase">
                PT. Mahameru Insan Mandiri
              </h1>
              <p className="text-xs text-slate-600 font-semibold">
                Laporan Rekapitulasi Mutasi Persediaan & Stok Gudang
              </p>
            </div>
            <div className="text-right text-xs text-slate-600">
              <p>Periode: {filterStartDate || 'Awal'} s/d {filterEndDate || 'Hari Ini'}</p>
              <p>Kategori: {filterKategori === 'ALL' ? 'Semua' : filterKategori}</p>
            </div>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="px-5 py-4 border-b flex flex-col lg:flex-row justify-between gap-4 text-xs no-print">
          <div className="flex flex-wrap items-center gap-2 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
            <input
              type="date"
              value={filterStartDate}
              onChange={(e) => setFilterStartDate(e.target.value)}
              className="border border-slate-300 rounded px-2 py-1.5 outline-none focus:border-[#c29b38] bg-white text-xs"
            />
            <span className="text-slate-400 font-medium">s/d</span>
            <input
              type="date"
              value={filterEndDate}
              onChange={(e) => setFilterEndDate(e.target.value)}
              className="border border-slate-300 rounded px-2 py-1.5 outline-none focus:border-[#c29b38] bg-white text-xs"
            />
            <div className="h-6 w-px bg-slate-300 mx-1"></div>
            <button
              onClick={() => setPeriodPreset('today')}
              className="px-2.5 py-1 text-slate-600 font-semibold hover:bg-white hover:shadow-xs rounded transition cursor-pointer"
            >
              Hari Ini
            </button>
            <button
              onClick={() => setPeriodPreset('month')}
              className="px-2.5 py-1 text-slate-600 font-semibold hover:bg-white hover:shadow-xs rounded transition cursor-pointer"
            >
              Bulan Ini
            </button>
            <button
              onClick={() => setPeriodPreset('all')}
              className="px-2.5 py-1 text-[#0b1e36] font-bold hover:bg-white hover:shadow-xs rounded transition cursor-pointer"
            >
              Semua
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              placeholder="Cari SKU / Nama..."
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              className="border border-slate-300 rounded-lg px-3 py-1.5 outline-none focus:border-[#c29b38] bg-white text-xs w-36 sm:w-48 shadow-xs"
            />

            <select
              value={filterKategori}
              onChange={(e) => setFilterKategori(e.target.value)}
              className="border border-slate-300 rounded-lg px-3 py-1.5 outline-none focus:border-[#c29b38] bg-slate-50 shadow-xs cursor-pointer"
            >
              <option value="ALL">Semua Kategori</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-slate-300 rounded-lg px-3 py-1.5 outline-none focus:border-[#c29b38] bg-slate-50 shadow-xs cursor-pointer"
            >
              <option value="ALL">Semua Status</option>
              <option value="AMAN">Stok Aman</option>
              <option value="ORDER">Perlu Order</option>
            </select>
          </div>
        </div>

        {/* Table Area */}
        <div className="overflow-x-auto max-h-[60vh]">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-100 text-slate-700 uppercase text-[10px] font-bold border-b shadow-xs sticky top-0 z-10">
              <tr>
                <th className="py-3 px-4">Kode SKU</th>
                <th className="py-3 px-3">Nama Produk</th>
                <th className="py-3 px-2 text-right bg-indigo-100/60 text-indigo-900">Awal</th>
                <th className="py-3 px-2 text-right text-blue-700">Masuk</th>
                <th className="py-3 px-2 text-right text-amber-700">Keluar</th>
                <th className="py-3 px-2 text-right text-emerald-700">Retur (Bgs)</th>
                <th className="py-3 px-2 text-right text-rose-700">Retur (Rsk)</th>
                <th className="py-3 px-2 text-right text-purple-700">Opname</th>
                <th className="py-3 px-2 text-right text-emerald-900 bg-emerald-50">Net Jual</th>
                <th className="py-3 px-3 text-right bg-slate-200/80 font-black text-[#0b1e36]">Akhir</th>
                <th className="py-3 px-3 text-center no-print">Kartu</th>
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
                  <tr key={c.sku} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-700">{c.sku}</td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-800">{c.nama}</div>
                      <span className="text-[10px] text-slate-400">{c.kategori}</span>
                    </td>
                    <td className="py-3 px-2 text-right font-bold text-indigo-950 bg-indigo-50/50">
                      {c.stokAwalPeriode}
                    </td>
                    <td className="py-3 px-2 text-right font-semibold text-blue-600">{c.in}</td>
                    <td className="py-3 px-2 text-right font-semibold text-amber-600">{c.out}</td>
                    <td className="py-3 px-2 text-right font-semibold text-emerald-600">{c.retBagus}</td>
                    <td className="py-3 px-2 text-right font-semibold text-rose-600">{c.retRusak}</td>
                    <td className="py-3 px-2 text-right font-semibold text-purple-600">
                      {c.opname > 0 ? `+${c.opname}` : c.opname}
                    </td>
                    <td className="py-3 px-2 text-right font-bold text-emerald-900 bg-emerald-50/50">
                      {c.terjual}
                    </td>
                    <td className="py-3 px-3 text-right font-black text-[#0b1e36] bg-slate-100/80">
                      {c.stokAkhirPeriode}{' '}
                      <span className="text-xs font-normal text-slate-400 block sm:inline">
                        {c.satuan}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center no-print">
                      <button
                        onClick={() => onOpenKartuStok(c.sku)}
                        title="Buka Kartu Stok"
                        className="p-1.5 bg-slate-200 hover:bg-[#0b1e36] hover:text-white rounded transition text-slate-600"
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
                  <td colSpan={2} className="py-3 px-4 text-right font-black text-slate-700 uppercase tracking-wider">
                    TOTAL KESELURUHAN
                  </td>
                  <td className="py-3 px-2 text-right font-black text-indigo-950 bg-indigo-100/50">
                    {sums.awal.toLocaleString()}
                  </td>
                  <td className="py-3 px-2 text-right font-black text-blue-700">
                    {sums.in.toLocaleString()}
                  </td>
                  <td className="py-3 px-2 text-right font-black text-amber-700">
                    {sums.out.toLocaleString()}
                  </td>
                  <td className="py-3 px-2 text-right font-black text-emerald-700">
                    {sums.retBgs.toLocaleString()}
                  </td>
                  <td className="py-3 px-2 text-right font-black text-rose-700">
                    {sums.retRsk.toLocaleString()}
                  </td>
                  <td className="py-3 px-2 text-right font-black text-purple-700">-</td>
                  <td className="py-3 px-2 text-right font-black text-emerald-900 bg-emerald-100/50">
                    {sums.net.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-right font-black text-[#0b1e36] bg-slate-200 text-sm">
                    {sums.akhir.toLocaleString()}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </section>
  );
};
