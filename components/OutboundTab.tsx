'use client';

import React, { useState } from 'react';
import { Truck, Plus, Trash2, Printer, Save, Search } from 'lucide-react';
import {
  Product,
  Motoris,
  OutboundRecord,
  OutboundCartItem,
  StockCalculation,
} from '@/types/inventory';
import { generateTxId } from '@/lib/storage';

interface OutboundTabProps {
  products: Product[];
  motoris: Motoris[];
  outboundRecords: OutboundRecord[];
  stockCalcs: StockCalculation[];
  activeDate: string;
  onSaveOutbound: (records: OutboundRecord[]) => void;
  onDeleteRecord: (index: number, noJalan: string) => void;
  onPrintSlip: (noJalan: string) => void;
  onRequestConfirm: (
    title: string,
    message: string,
    type: 'danger' | 'warning' | 'info',
    onConfirm: () => void
  ) => void;
  onOpenMasterMotoris?: () => void;
}

export const OutboundTab: React.FC<OutboundTabProps> = ({
  products,
  motoris,
  outboundRecords,
  stockCalcs,
  activeDate,
  onSaveOutbound,
  onDeleteRecord,
  onPrintSlip,
  onRequestConfirm,
  onOpenMasterMotoris,
}) => {
  const [tanggal, setTanggal] = useState(activeDate);
  const [selectedMotoris, setSelectedMotoris] = useState(motoris[0]?.id || '');
  const [keterangan, setKeterangan] = useState('');
  const [selectedSku, setSelectedSku] = useState(products[0]?.sku || '');

  // Derived valid motoris without synchronous useEffect setState
  const activeMotoris = motoris.some((m) => m.id === selectedMotoris)
    ? selectedMotoris
    : (motoris[0]?.id || '');

  const [qtyInput, setQtyInput] = useState<string>('');
  const [cart, setCart] = useState<OutboundCartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedProduct = products.find((p) => p.sku === selectedSku);
  const selectedCalc = stockCalcs.find((c) => c.sku === selectedSku);
  const stokSistemAvailable = selectedCalc ? selectedCalc.stokTersediaSaatIni : 0;

  const handleAddItem = () => {
    const qty = Number(qtyInput);
    if (!selectedSku || qty <= 0) return;

    const prod = products.find((p) => p.sku === selectedSku);
    if (!prod) return;

    const inCartQty = cart
      .filter((x) => x.sku === selectedSku)
      .reduce((sum, item) => sum + item.qty, 0);
    const totalRequested = qty + inCartQty;

    const pushItem = () => {
      setCart((prev) => [
        ...prev,
        {
          sku: prod.sku,
          nama: prod.nama,
          satuan: prod.satuan,
          qty,
          ket: keterangan,
        },
      ]);
      setQtyInput('');
    };

    if (totalRequested > stokSistemAvailable) {
      onRequestConfirm(
        'Peringatan Defisit Stok',
        `Total Qty yang akan dikeluarkan (${totalRequested}) melebihi stok gudang tersedia (${stokSistemAvailable}). Tetap tambahkan ke keranjang muatan?`,
        'warning',
        pushItem
      );
    } else {
      pushItem();
    }
  };

  const handleRemoveCartItem = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmitCart = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0 || isSubmitting) return;

    setIsSubmitting(true);
    const noJalan = generateTxId('OUT');

    const newRecords: OutboundRecord[] = cart.map((item) => ({
      tanggal: tanggal || activeDate,
      noJalan,
      idMotoris: activeMotoris,
      sku: item.sku,
      qty: item.qty,
      ket: keterangan || 'Loading Pagi',
    }));

    onSaveOutbound(newRecords);
    setCart([]);
    setKeterangan('');
    setIsSubmitting(false);
    onPrintSlip(noJalan);
  };

  const filteredRecords = outboundRecords
    .map((record, originalIndex) => ({ record, originalIndex }))
    .filter(({ record }) => {
      if (!searchTerm) return true;
      const mot = motoris.find((m) => m.id === record.idMotoris);
      const prod = products.find((p) => p.sku === record.sku);
      const str = `${record.noJalan} ${record.sku} ${record.idMotoris} ${mot?.nama || ''} ${prod?.nama || ''}`.toLowerCase();
      return str.includes(searchTerm.toLowerCase());
    });

  return (
    <section id="tabOutbound" className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Form: Keranjang Muatan */}
        <div className="lg:col-span-1 bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col h-auto">
          <div className="border-b border-slate-100 pb-3 mb-4 shrink-0">
            <h2 className="text-base font-bold text-[#0b1e36] flex items-center gap-2">
              <Truck className="w-5 h-5 text-amber-500" />
              Loading Pagi (Outbound)
            </h2>
            <p className="text-[11px] text-slate-500 mt-1">
              Keluarkan barang untuk sales motoris (Sistem Keranjang)
            </p>
          </div>

          <form onSubmit={handleSubmitCart} className="space-y-4 flex flex-col">
            {/* Header Form: Tanggal & Motoris */}
            <div className="shrink-0 space-y-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Tanggal</label>
                  <input
                    type="date"
                    required
                    value={tanggal}
                    onChange={(e) => setTanggal(e.target.value)}
                    className="w-full text-xs sm:text-sm border border-slate-300 rounded-md px-2.5 py-1.5 focus:ring-1 focus:ring-[#c29b38] outline-none bg-white"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-semibold text-slate-700">Sales Motoris</label>
                    {onOpenMasterMotoris && (
                      <button
                        type="button"
                        onClick={onOpenMasterMotoris}
                        className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold hover:underline cursor-pointer"
                        title="Buka kelola Master Data Sales Motoris"
                      >
                        + Kelola ({motoris.length})
                      </button>
                    )}
                  </div>
                  {motoris.length === 0 ? (
                    <div className="p-2 bg-amber-50 border border-amber-200 rounded text-amber-800 text-[10px] space-y-1">
                      <p className="font-semibold">Data motoris kosong!</p>
                      {onOpenMasterMotoris && (
                        <button
                          type="button"
                          onClick={onOpenMasterMotoris}
                          className="font-bold text-indigo-700 underline text-xs block cursor-pointer"
                        >
                          + Tambah / Pulihkan Motoris
                        </button>
                      )}
                    </div>
                  ) : (
                    <select
                      required
                      value={activeMotoris}
                      onChange={(e) => setSelectedMotoris(e.target.value)}
                      className="w-full text-xs sm:text-sm border border-slate-300 rounded-md px-2.5 py-1.5 focus:ring-1 focus:ring-[#c29b38] outline-none bg-white"
                    >
                      {motoris.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.id} - {m.nama} ({m.area})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Keterangan Dokumen
                </label>
                <input
                  type="text"
                  placeholder="Catatan opsional..."
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  className="w-full text-xs sm:text-sm border border-slate-300 rounded-md px-2.5 py-1.5 focus:ring-1 focus:ring-[#c29b38] outline-none bg-white"
                />
              </div>
            </div>

            {/* Tambah Item ke Keranjang */}
            <div className="p-3 bg-amber-50/50 border border-amber-200 rounded-lg space-y-3 shrink-0">
              <div className="flex items-center justify-between border-b border-amber-200 pb-1.5">
                <h3 className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Tambah Item</h3>
              </div>

              <div>
                <select
                  value={selectedSku}
                  onChange={(e) => setSelectedSku(e.target.value)}
                  className="w-full text-xs sm:text-sm border border-amber-300 rounded-md px-2.5 py-1.5 focus:ring-1 focus:ring-amber-500 outline-none bg-white"
                >
                  {products.map((p) => (
                    <option key={p.sku} value={p.sku}>
                      {p.nama} ({p.sku})
                    </option>
                  ))}
                </select>

                <div className="mt-1 flex justify-between text-[10px] text-amber-800 font-medium px-1">
                  <span>
                    Stok Sistem: <strong className="text-[#0b1e36]">{stokSistemAvailable}</strong>
                  </span>
                  <span>
                    Satuan: <strong>{selectedProduct?.satuan || '-'}</strong>
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  placeholder="Jumlah Qty..."
                  value={qtyInput}
                  onChange={(e) => setQtyInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddItem();
                    }
                  }}
                  className="w-full text-xs sm:text-sm border border-amber-300 rounded-md px-2.5 py-1.5 focus:ring-1 focus:ring-amber-500 outline-none bg-white"
                />
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="active:scale-95 bg-amber-500 hover:bg-amber-600 text-white font-bold px-4 rounded-md text-xs transition flex items-center shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Daftar Muatan (Keranjang) */}
            <div className="flex-1 border border-slate-200 rounded-lg bg-white overflow-hidden flex flex-col min-h-[120px]">
              <div className="bg-slate-100 border-b border-slate-200 px-3 py-2 text-[11px] font-bold text-slate-700 flex justify-between items-center">
                <span>Daftar Muatan</span>
                <span className="bg-[#0b1e36] text-white px-2 py-0.5 rounded text-[9px] font-semibold">
                  {cart.length} Item ({cart.reduce((s, i) => s + i.qty, 0)} Qty)
                </span>
              </div>
              <div className="p-2 overflow-y-auto space-y-1.5 flex-1 max-h-40 bg-slate-50">
                {cart.length === 0 ? (
                  <div className="text-center py-4 text-slate-400 text-[11px] italic">
                    Keranjang kosong. Tambahkan item di atas.
                  </div>
                ) : (
                  cart.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between bg-white border border-slate-200 p-2 rounded-md shadow-xs"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="font-bold text-slate-800 text-[11px] truncate">
                          {item.nama} <span className="font-normal text-slate-400">({item.sku})</span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-semibold mt-0.5">
                          <span className="text-[#0b1e36]">
                            {item.qty} {item.satuan}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveCartItem(idx)}
                        className="text-rose-500 p-1.5 hover:bg-rose-50 rounded-md transition cursor-pointer active:scale-95"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2 shrink-0 border-t border-slate-100">
              <button
                type="submit"
                disabled={cart.length === 0 || isSubmitting}
                className="w-full bg-[#0b1e36] hover:bg-[#163155] text-white font-bold py-2.5 px-4 rounded-lg text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <Save className="w-4 h-4" /> Simpan Transaksi & Cetak
              </button>
            </div>
          </form>
        </div>

        {/* Right Table: Riwayat Loading Pagi */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/70">
            <div>
              <h2 className="font-bold text-slate-800 text-sm">Riwayat Loading Pagi</h2>
              <p className="text-[10px] text-slate-500">Log pengeluaran barang kanvas.</p>
            </div>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari Dokumen..."
                className="pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#c29b38] w-40 sm:w-52 bg-white"
              />
            </div>
          </div>

          <div className="overflow-x-auto flex-1 max-h-[600px]">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 uppercase text-[10px] font-bold border-b shadow-xs sticky top-0 z-10">
                <tr>
                  <th className="py-3 px-4">No. Jalan</th>
                  <th className="py-3 px-3">Tanggal</th>
                  <th className="py-3 px-3">Motoris</th>
                  <th className="py-3 px-3">SKU & Item</th>
                  <th className="py-3 px-3 text-right">Qty</th>
                  <th className="py-3 px-3 text-center no-print">Slip</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-400">
                      Belum ada data transaksi loading pagi
                    </td>
                  </tr>
                ) : (
                  [...filteredRecords].reverse().map(({ record, originalIndex }) => {
                    const mot = motoris.find((m) => m.id === record.idMotoris);
                    const prod = products.find((p) => p.sku === record.sku);
                    return (
                      <tr key={`${record.noJalan}-${record.sku}-${originalIndex}`} className="hover:bg-slate-50 transition">
                        <td className="py-2.5 px-4 font-bold text-[#0b1e36] font-mono">
                          {record.noJalan}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">{record.tanggal}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-700">
                          {mot?.nama || record.idMotoris}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-medium text-slate-800">{prod?.nama || record.sku}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{record.sku}</div>
                        </td>
                        <td className="py-2.5 px-3 text-right font-black text-amber-700">
                          {record.qty}
                        </td>
                        <td className="py-2.5 px-3 text-center no-print">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => onPrintSlip(record.noJalan)}
                              title="Cetak Group DO"
                              className="p-1 bg-slate-100 text-slate-600 hover:text-white hover:bg-[#0b1e36] rounded transition cursor-pointer active:scale-95"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                onRequestConfirm(
                                  'Hapus Transaksi?',
                                  `Hapus record ${record.noJalan} (${record.sku})? Data akan dihapus permanen.`,
                                  'danger',
                                  () => onDeleteRecord(originalIndex, record.noJalan)
                                )
                              }
                              title="Hapus"
                              className="p-1 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer active:scale-95"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
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
