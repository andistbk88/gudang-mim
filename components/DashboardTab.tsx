'use client';

import React, { useState, useMemo } from 'react';
import {
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Box,
  AlertTriangle,
  Truck,
  ShoppingBag,
  ArrowRight,
  Search,
} from 'lucide-react';
import { StockCalculation, ActiveTab } from '@/types/inventory';

interface DashboardTabProps {
  activeDate: string;
  onChangeDate: (date: string) => void;
  onSetToday: () => void;
  stockCalcs: StockCalculation[];
  totalLoadingToday: number;
  totalTerjualToday: number;
  onNavigateTab: (tab: ActiveTab) => void;
  onOpenKartuStok: (sku: string) => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  activeDate,
  onChangeDate,
  onSetToday,
  stockCalcs,
  totalLoadingToday,
  totalTerjualToday,
  onNavigateTab,
  onOpenKartuStok,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ORDER' | 'AMAN'>('ALL');

  const navigateDay = (offset: number) => {
    const current = new Date(activeDate || new Date());
    current.setDate(current.getDate() + offset);
    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, '0');
    const day = String(current.getDate()).padStart(2, '0');
    onChangeDate(`${year}-${month}-${day}`);
  };

  const totalSku = stockCalcs.length;
  const totalOrder = stockCalcs.filter((c) => c.status === 'ORDER').length;

  const filteredCalcs = useMemo(() => {
    return stockCalcs.filter((c) => {
      if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        c.sku.toLowerCase().includes(term) ||
        c.nama.toLowerCase().includes(term) ||
        c.kategori.toLowerCase().includes(term)
      );
    });
  }, [stockCalcs, statusFilter, searchTerm]);

  return (
    <section id="tabDashboard" className="space-y-6">
      {/* Date Position Banner */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3 self-start md:self-center">
          <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-xl">
            <CalendarClock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800">Posisi Tanggal Sistem</h2>
            <p className="text-[11px] text-slate-500">Stok Awal = Akumulasi Saldo Berjalan Kemarin</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-stretch md:self-auto justify-end">
          <button
            type="button"
            onClick={() => navigateDay(-1)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-semibold hover:bg-slate-100 flex items-center shadow-xs transition active:scale-95 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4 mr-0.5" /> H-1
          </button>

          <input
            type="date"
            id="dashActiveDate"
            value={activeDate}
            onChange={(e) => onChangeDate(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-bold text-[#0b1e36] outline-none focus:border-[#c29b38] shadow-xs bg-white"
          />

          <button
            type="button"
            onClick={() => navigateDay(1)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-semibold hover:bg-slate-100 flex items-center shadow-xs transition active:scale-95 cursor-pointer"
          >
            H+1 <ChevronRight className="w-4 h-4 ml-0.5" />
          </button>

          <button
            type="button"
            onClick={onSetToday}
            className="px-3 py-1.5 rounded-lg bg-[#0b1e36] text-white hover:bg-[#163155] text-xs font-bold shadow-xs transition active:scale-95 cursor-pointer"
          >
            Hari Ini
          </button>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total SKU */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition">
            <Box className="w-12 h-12 text-[#0b1e36]" />
          </div>
          <p className="text-xs font-semibold text-slate-500 uppercase relative z-10">Total SKU Aktif</p>
          <h3 id="dashTotalSku" className="text-3xl font-black text-[#0b1e36] mt-1 relative z-10">
            {totalSku}
          </h3>
        </div>

        {/* Perlu Order */}
        <div
          onClick={() => setStatusFilter(statusFilter === 'ORDER' ? 'ALL' : 'ORDER')}
          className={`bg-white p-5 rounded-xl border border-rose-200 shadow-sm bg-rose-50/30 relative overflow-hidden group cursor-pointer transition ${
            statusFilter === 'ORDER' ? 'ring-2 ring-rose-500' : ''
          }`}
          title="Klik untuk filter produk kritis"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition">
            <AlertTriangle className="w-12 h-12 text-rose-600" />
          </div>
          <p className="text-xs font-semibold text-rose-600 uppercase relative z-10">Perlu Order</p>
          <h3 id="dashTotalOrder" className="text-3xl font-black text-rose-600 mt-1 relative z-10">
            {totalOrder}
          </h3>
        </div>

        {/* Keluar Hari Ini */}
        <div className="bg-white p-5 rounded-xl border border-amber-200 shadow-sm bg-amber-50/30 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition">
            <Truck className="w-12 h-12 text-amber-600" />
          </div>
          <p className="text-xs font-semibold text-amber-700 uppercase relative z-10">Keluar Hari Ini</p>
          <h3 id="dashTotalKeluar" className="text-3xl font-black text-amber-600 mt-1 relative z-10">
            {totalLoadingToday.toLocaleString()}
          </h3>
        </div>

        {/* Terjual Net */}
        <div className="bg-white p-5 rounded-xl border border-emerald-200 shadow-sm bg-emerald-50/30 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition">
            <ShoppingBag className="w-12 h-12 text-emerald-600" />
          </div>
          <p className="text-xs font-semibold text-emerald-700 uppercase relative z-10">Terjual (Net)</p>
          <h3 id="dashTotalTerjual" className="text-3xl font-black text-emerald-600 mt-1 relative z-10">
            {totalTerjualToday.toLocaleString()}
          </h3>
        </div>
      </div>

      {/* Main Stock Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
          <div>
            <h2 className="font-bold text-slate-800 text-sm">Kondisi Persediaan Harian</h2>
            <p className="text-[10px] text-slate-500 mt-0.5">
              Pantau stok harian berdasarkan tanggal sistem aktif. Klik baris produk untuk membuka Kartu Stok.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Search filter */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari SKU / nama..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-2.5 py-1 text-xs border border-slate-300 rounded-lg outline-none focus:border-[#c29b38] bg-white w-36 sm:w-44"
              />
            </div>

            {/* Quick Status Pill */}
            <div className="flex bg-slate-200/70 p-0.5 rounded-lg text-[10px] font-semibold">
              <button
                type="button"
                onClick={() => setStatusFilter('ALL')}
                className={`px-2 py-1 rounded-md transition cursor-pointer ${
                  statusFilter === 'ALL' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-600'
                }`}
              >
                Semua
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('ORDER')}
                className={`px-2 py-1 rounded-md transition cursor-pointer ${
                  statusFilter === 'ORDER' ? 'bg-rose-600 text-white shadow-xs' : 'text-rose-700'
                }`}
              >
                Kritis
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('AMAN')}
                className={`px-2 py-1 rounded-md transition cursor-pointer ${
                  statusFilter === 'AMAN' ? 'bg-emerald-600 text-white shadow-xs' : 'text-emerald-700'
                }`}
              >
                Aman
              </button>
            </div>

            <button
              onClick={() => onNavigateTab('tabLaporan')}
              className="text-xs font-bold text-[#c29b38] hover:text-[#dfb753] transition flex items-center gap-1 shrink-0 ml-1 cursor-pointer active:scale-95"
            >
              <span>Rekap</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto max-h-[500px]">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-100 text-slate-600 uppercase text-[10px] font-bold shadow-xs sticky top-0 z-10">
              <tr>
                <th className="py-3 px-4">SKU / Nama Produk</th>
                <th className="py-3 px-3">Kategori</th>
                <th className="py-3 px-3 text-right text-indigo-900 bg-indigo-100/50">Stok Awal</th>
                <th className="py-3 px-3 text-right text-blue-700">Masuk</th>
                <th className="py-3 px-3 text-right text-amber-700">Keluar</th>
                <th className="py-3 px-3 text-right text-[#0b1e36] bg-slate-200/50">Stok Akhir</th>
                <th className="py-3 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody id="dashStockTableBody" className="divide-y divide-slate-100 font-medium">
              {filteredCalcs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    Tidak ada produk yang cocok dengan pencarian / filter
                  </td>
                </tr>
              ) : (
                filteredCalcs.map((c) => (
                  <tr
                    key={c.sku}
                    onClick={() => onOpenKartuStok(c.sku)}
                    className="hover:bg-slate-50 transition cursor-pointer"
                    title="Klik untuk melihat Kartu Stok"
                  >
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-800">{c.nama}</div>
                      <div className="text-[10px] font-mono text-slate-400">{c.sku}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          c.kategori === 'Rokok'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {c.kategori}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-indigo-950 bg-indigo-50/40">
                      {c.stokAwalPeriode}
                    </td>
                    <td className="py-3 px-3 text-right font-semibold text-blue-600">{c.in}</td>
                    <td className="py-3 px-3 text-right font-semibold text-amber-600">{c.out}</td>
                    <td className="py-3 px-3 text-right font-black text-slate-800 bg-slate-100">
                      {c.stokAkhirPeriode} <span className="text-xs font-normal text-slate-400">{c.satuan}</span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      {c.status === 'ORDER' ? (
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
                          ⚠️ ORDER
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                          ✅ AMAN
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};
