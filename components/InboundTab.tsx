'use client';

import React, { useState } from 'react';
import { ArrowDownToDot, Plus, Trash2, Save, Search, Printer } from 'lucide-react';
import {
  Product,
  InboundRecord,
  InboundCartItem,
} from '@/types/inventory';
import { generateTxId } from '@/lib/storage';

interface InboundTabProps {
  products: Product[];
  inboundRecords: InboundRecord[];
  activeDate: string;
  onSaveInbound: (records: InboundRecord[]) => void;
  onDeleteRecord: (index: number, noBukti: string) => void;
  onPrintSlip?: (noBukti: string) => void;
  onRequestConfirm: (
    title: string,
    message: string,
    type: 'danger' | 'warning' | 'info',
    onConfirm: () => void
  ) => void;
}

export const InboundTab: React.FC<InboundTabProps> = ({
  products,
  inboundRecords,
  activeDate,
  onSaveInbound,
  onDeleteRecord,
  onPrintSlip,
  onRequestConfirm,
}) => {
  const [tanggal, setTanggal] = useState(activeDate);
  const [noBuktiInput, setNoBuktiInput] = useState('');
  const [selectedSku, setSelectedSku] = useState(products[0]?.sku || '');
  const [batchNo, setBatchNo] = useState('');
  const [expDate, setExpDate] = useState('');
  const [qtyInput, setQtyInput] = useState<string>('');
  const [cart, setCart] = useState<InboundCartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddItem = () => {
    const qty = Number(qtyInput);
    if (!selectedSku || qty <= 0) return;

    const prod = products.find((p) => p.sku === selectedSku);
    if (!prod) return;

    setCart((prev) => [
      ...prev,
      {
        sku: prod.sku,
        nama: prod.nama,
        satuan: prod.satuan,
        qty,
        batchNo: batchNo || '-',
        expDate: expDate || '-',
      },
    ]);

    setQtyInput('');
    setBatchNo('');
    setExpDate('');
  };

  const handleRemoveCartItem = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmitCart = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0 || isSubmitting) return;

    setIsSubmitting(true);
    const finalNoBukti = noBuktiInput.trim() || generateTxId('IN');

    const newRecords: InboundRecord[] = cart.map((item) => ({
      tanggal: tanggal || activeDate,
      noBukti: finalNoBukti,
      batchNo: item.batchNo,
      expDate: item.expDate,
      sku: item.sku,
      qty: item.qty,
    }));

    onSaveInbound(newRecords);
    setCart([]);
    setNoBuktiInput('');
    setIsSubmitting(false);
  };

  const filteredRecords = inboundRecords
    .map((record, originalIndex) => ({ record, originalIndex }))
    .filter(({ record }) => {
      if (!searchTerm) return true;
      const prod = products.find((p) => p.sku === record.sku);
      const str = `${record.noBukti} ${record.sku} ${record.batchNo || ''} ${prod?.nama || ''}`.toLowerCase();
      return str.includes(searchTerm.toLowerCase());
    });

  return (
    <section id="tabInbound" className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Form: Inbound Cart */}
        <div className="lg:col-span-1 bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col h-auto">
          <div className="border-b border-slate-100 pb-3 mb-4 shrink-0">
            <h2 className="text-base font-bold text-[#0b1e36] flex items-center gap-2">
              <ArrowDownToDot className="w-5 h-5 text-blue-500" />
              Barang Masuk (Inbound)
            </h2>
            <p className="text-[11px] text-slate-500 mt-1">
              Terima pasokan stok baru dari Pabrik / Supplier
            </p>
          </div>

          <form onSubmit={handleSubmitCart} className="space-y-4 flex flex-col">
            <div className="shrink-0 space-y-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Tanggal Terima
                </label>
                <input
                  type="date"
                  required
                  value={tanggal}
                  onChange={(e) => setTanggal(e.target.value)}
                  className="w-full text-xs sm:text-sm border border-slate-300 rounded-md px-2.5 py-1.5 focus:ring-1 focus:ring-blue-500 outline-none bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  No. Surat Jalan / DO Pabrik
                </label>
                <input
                  type="text"
                  placeholder="Contoh: DO-PBRK-2609-001"
                  value={noBuktiInput}
                  onChange={(e) => setNoBuktiInput(e.target.value)}
                  className="w-full text-xs sm:text-sm border border-slate-300 rounded-md px-2.5 py-1.5 focus:ring-1 focus:ring-blue-500 outline-none bg-white"
                />
                <p className="text-[9px] text-slate-400 mt-0.5 leading-tight">
                  Kosongkan jika ingin digenerate sistem otomatis (IN-xxxx)
                </p>
              </div>
            </div>

            {/* Tambah Item Inbound */}
            <div className="p-3 bg-blue-50/50 border border-blue-200 rounded-lg space-y-3 shrink-0">
              <div className="flex items-center justify-between border-b border-blue-200 pb-1.5">
                <h3 className="text-[11px] font-bold text-blue-800 uppercase tracking-wider">
                  Tambah Item Masuk
                </h3>
              </div>

              <div>
                <select
                  value={selectedSku}
                  onChange={(e) => setSelectedSku(e.target.value)}
                  className="w-full text-xs sm:text-sm border border-blue-300 rounded-md px-2.5 py-1.5 focus:ring-1 focus:ring-blue-500 outline-none bg-white"
                >
                  {products.map((p) => (
                    <option key={p.sku} value={p.sku}>
                      {p.nama} ({p.sku})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Batch No (Opsional)"
                  value={batchNo}
                  onChange={(e) => setBatchNo(e.target.value)}
                  className="w-full text-xs border border-blue-300 rounded-md px-2.5 py-1.5 focus:ring-1 focus:ring-blue-500 outline-none bg-white"
                />
                <input
                  type="date"
                  title="Expired Date"
                  value={expDate}
                  onChange={(e) => setExpDate(e.target.value)}
                  className="w-full text-xs border border-blue-300 rounded-md px-2.5 py-1.5 focus:ring-1 focus:ring-blue-500 outline-none bg-white"
                />
              </div>

              <div className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  placeholder="Jumlah Qty Masuk..."
                  value={qtyInput}
                  onChange={(e) => setQtyInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddItem();
                    }
                  }}
                  className="w-full text-xs sm:text-sm border border-blue-300 rounded-md px-2.5 py-1.5 focus:ring-1 focus:ring-blue-500 outline-none bg-white"
                />
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="active:scale-95 bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 rounded-md text-xs transition flex items-center shadow-xs shrink-0 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Daftar Penerimaan */}
            <div className="flex-1 border border-slate-200 rounded-lg bg-white overflow-hidden flex flex-col min-h-[120px]">
              <div className="bg-slate-100 border-b border-slate-200 px-3 py-2 text-[11px] font-bold text-slate-700 flex justify-between items-center">
                <span>Daftar Penerimaan</span>
                <span className="bg-blue-600 text-white px-2 py-0.5 rounded text-[9px] font-semibold">
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
                          </span>{' '}
                          | Batch: {item.batchNo} | Exp: {item.expDate}
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
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-lg text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <Save className="w-4 h-4" /> Simpan Data Penerimaan
              </button>
            </div>
          </form>
        </div>

        {/* Right Table: Riwayat Inbound */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/70">
            <div>
              <h2 className="font-bold text-slate-800 text-sm">Riwayat Barang Masuk</h2>
              <p className="text-[10px] text-slate-500">Log penambahan stok dari gudang pabrik.</p>
            </div>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari DO/SKU..."
                className="pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 w-40 sm:w-52 bg-white"
              />
            </div>
          </div>

          <div className="overflow-x-auto flex-1 max-h-[600px]">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 uppercase text-[10px] font-bold border-b shadow-xs sticky top-0 z-10">
                <tr>
                  <th className="py-3 px-4">No. DO / Bukti</th>
                  <th className="py-3 px-3">Tanggal</th>
                  <th className="py-3 px-3">SKU & Item</th>
                  <th className="py-3 px-3">BCH / Exp Date</th>
                  <th className="py-3 px-3 text-right">Qty</th>
                  <th className="py-3 px-3 text-center no-print">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-400">
                      Belum ada data barang masuk
                    </td>
                  </tr>
                ) : (
                  [...filteredRecords].reverse().map(({ record, originalIndex }) => {
                    const prod = products.find((p) => p.sku === record.sku);
                    return (
                      <tr key={`${record.noBukti}-${record.sku}-${originalIndex}`} className="hover:bg-slate-50 transition">
                        <td className="py-2.5 px-4 font-bold text-[#0b1e36] font-mono">
                          {record.noBukti}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">{record.tanggal}</td>
                        <td className="py-2.5 px-3">
                          <div className="font-medium text-slate-800">{prod?.nama || record.sku}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{record.sku}</div>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-mono text-[11px] text-slate-600">
                            {record.batchNo || '-'}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Exp: {record.expDate || '-'}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-right font-black text-blue-700">
                          {record.qty}
                        </td>
                        <td className="py-2.5 px-3 text-center no-print">
                          <div className="flex items-center justify-center gap-1">
                            {onPrintSlip && (
                              <button
                                type="button"
                                onClick={() => onPrintSlip(record.noBukti)}
                                title="Cetak Bukti Penerimaan DO"
                                className="p-1 bg-slate-100 text-slate-600 hover:text-white hover:bg-[#0b1e36] rounded transition cursor-pointer active:scale-95"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() =>
                                onRequestConfirm(
                                  'Hapus Penerimaan DO?',
                                  `Hapus transaksi DO ${record.noBukti} (${record.sku})? Data akan dihapus permanen.`,
                                  'danger',
                                  () => onDeleteRecord(originalIndex, record.noBukti)
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
