'use client';

import React, { useState, useEffect } from 'react';
import { ClipboardCheck, Save, Search, Trash2 } from 'lucide-react';
import { Product, OpnameRecord, StockCalculation } from '@/types/inventory';

interface OpnameTabProps {
  products: Product[];
  opnameRecords: OpnameRecord[];
  stockCalcs: StockCalculation[];
  activeDate: string;
  onSaveOpname: (record: OpnameRecord) => void;
  onDeleteRecord: (index: number, sku: string) => void;
  onRequestConfirm: (
    title: string,
    message: string,
    type: 'danger' | 'warning' | 'info',
    onConfirm: () => void
  ) => void;
}

export const OpnameTab: React.FC<OpnameTabProps> = ({
  products,
  opnameRecords,
  stockCalcs,
  activeDate,
  onSaveOpname,
  onDeleteRecord,
  onRequestConfirm,
}) => {
  const [tanggal, setTanggal] = useState(activeDate);
  const [selectedSku, setSelectedSku] = useState(products[0]?.sku || '');
  const [stokFisikInput, setStokFisikInput] = useState<string>('');
  const [keterangan, setKeterangan] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const effectiveSku = selectedSku || (products[0]?.sku ?? '');
  const selectedCalc = stockCalcs.find((c) => c.sku === effectiveSku);
  const stokSistem = selectedCalc ? selectedCalc.stokTersediaSaatIni : 0;

  // Diff calculation
  const calcDiff = () => {
    if (stokFisikInput === '' || stokFisikInput === null) {
      return { text: '0', class: 'text-slate-700' };
    }
    const fisVal = Number(stokFisikInput);
    const diff = fisVal - stokSistem;

    if (diff > 0) {
      return { text: `+${diff} (Surplus)`, class: 'text-emerald-600' };
    } else if (diff < 0) {
      return { text: `${diff} (Defisit)`, class: 'text-rose-600' };
    } else {
      return { text: '0 (Klop)', class: 'text-indigo-600' };
    }
  };

  const diffBadge = calcDiff();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!effectiveSku || stokFisikInput === '') return;

    const stokFisik = Number(stokFisikInput);
    const selisih = stokFisik - stokSistem;
    const ket = keterangan.trim() || (selisih === 0 ? 'Klop Fisik' : 'Audit Fisik');

    const record: OpnameRecord = {
      tanggal: tanggal || activeDate,
      sku: effectiveSku,
      stokSistem,
      stokFisik,
      selisih,
      ket,
    };

    onSaveOpname(record);
    setStokFisikInput('');
    setKeterangan('');
  };

  const filteredRecords = opnameRecords
    .map((record, originalIndex) => ({ record, originalIndex }))
    .filter(({ record }) => {
      if (!searchTerm) return true;
      const prod = products.find((p) => p.sku === record.sku);
      const str = `${record.sku} ${record.ket || ''} ${prod?.nama || ''}`.toLowerCase();
      return str.includes(searchTerm.toLowerCase());
    });

  return (
    <section id="tabOpname" className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Form: Form Cek Fisik */}
        <div className="lg:col-span-1 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="border-b border-slate-100 pb-3 mb-4">
            <h2 className="text-base font-bold text-[#0b1e36] flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-purple-600" />
              Audit Cek Fisik
            </h2>
            <p className="text-[11px] text-slate-500 mt-1">
              Sinkronisasi stok buku dengan stok gudang aktual.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Tanggal Cek
              </label>
              <input
                type="date"
                required
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="w-full text-xs sm:text-sm border border-slate-300 rounded-md px-3 py-2 outline-none focus:ring-1 focus:ring-purple-500 bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Produk (SKU)
              </label>
              <select
                required
                value={effectiveSku}
                onChange={(e) => setSelectedSku(e.target.value)}
                className="w-full text-xs sm:text-sm border border-slate-300 rounded-md px-3 py-2 outline-none focus:ring-1 focus:ring-purple-500 bg-white"
              >
                {products.map((p) => (
                  <option key={p.sku} value={p.sku}>
                    {p.nama} ({p.sku})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Stok Sistem (Buku)
                </label>
                <input
                  type="number"
                  readOnly
                  value={stokSistem}
                  className="w-full text-xs sm:text-sm bg-slate-100 border border-slate-200 rounded-md px-3 py-2 text-slate-500 font-bold outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Stok Fisik Aktual
                </label>
                <input
                  type="number"
                  required
                  placeholder="Hasil hitung..."
                  value={stokFisikInput}
                  onChange={(e) => setStokFisikInput(e.target.value)}
                  className="w-full text-xs sm:text-sm border border-slate-300 rounded-md px-3 py-2 outline-none focus:ring-1 focus:ring-purple-500 bg-white"
                />
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600">Selisih (+/-):</span>
              <span className={`text-sm font-black ${diffBadge.class}`}>
                {diffBadge.text}
              </span>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Keterangan / Berita Acara
              </label>
              <input
                type="text"
                placeholder="Penyebab selisih..."
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
                className="w-full text-xs sm:text-sm border border-slate-300 rounded-md px-3 py-2 outline-none focus:ring-1 focus:ring-purple-500 bg-white"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-purple-700 hover:bg-purple-800 text-white font-bold py-2.5 px-4 rounded-lg text-sm transition flex items-center justify-center gap-2 shadow-xs active:scale-95 cursor-pointer"
            >
              <Save className="w-4 h-4" /> Simpan Audit (Adjust Stok)
            </button>
          </form>
        </div>

        {/* Right Table: Histori Opname */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/70">
            <div>
              <h2 className="font-bold text-slate-800 text-sm">Histori Cek Fisik Gudang</h2>
              <p className="text-[10px] text-slate-500">Log penyesuaian audit fisik.</p>
            </div>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari Audit..."
                className="pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500 w-40 sm:w-52 bg-white"
              />
            </div>
          </div>

          <div className="overflow-x-auto flex-1 max-h-[600px]">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 uppercase text-[10px] font-bold border-b shadow-xs sticky top-0 z-10">
                <tr>
                  <th className="py-3 px-4">Tanggal</th>
                  <th className="py-3 px-3">SKU & Item</th>
                  <th className="py-3 px-3 text-right">Sys</th>
                  <th className="py-3 px-3 text-right">Fisik</th>
                  <th className="py-3 px-3 text-center">Selisih</th>
                  <th className="py-3 px-3">Berita Acara</th>
                  <th className="py-3 px-2 text-center no-print">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-400">
                      Belum ada histori audit cek fisik
                    </td>
                  </tr>
                ) : (
                  [...filteredRecords].reverse().map(({ record, originalIndex }) => {
                    const prod = products.find((p) => p.sku === record.sku);
                    return (
                      <tr key={`${record.sku}-${record.tanggal}-${originalIndex}`} className="hover:bg-slate-50 transition">
                        <td className="py-2.5 px-4 text-slate-600">{record.tanggal}</td>
                        <td className="py-2.5 px-3">
                          <div className="font-medium text-slate-800">{prod?.nama || record.sku}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{record.sku}</div>
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-500">{record.stokSistem}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-800">
                          {record.stokFisik}
                        </td>
                        <td
                          className={`py-2.5 px-3 text-center font-black ${
                            record.selisih > 0
                              ? 'text-emerald-600'
                              : record.selisih < 0
                              ? 'text-rose-600'
                              : 'text-slate-500'
                          }`}
                        >
                          {record.selisih > 0 ? `+${record.selisih}` : record.selisih}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 text-[11px] truncate max-w-[150px]">
                          {record.ket || '-'}
                        </td>
                        <td className="py-2.5 px-2 text-center no-print">
                          <button
                            type="button"
                            onClick={() =>
                              onRequestConfirm(
                                'Hapus Audit Fisik?',
                                `Hapus audit SKU ${record.sku} pada tanggal ${record.tanggal}?`,
                                'danger',
                                () => onDeleteRecord(originalIndex, record.sku)
                              )
                            }
                            title="Hapus"
                            className="p-1 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer active:scale-95"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
};
