'use client';

import React, { useState } from 'react';
import {
  X,
  Database,
  Cloud,
  Save,
  Wifi,
  DownloadCloud,
  UploadCloud,
  ShoppingCart,
  MessageCircle,
  Printer,
  Trash2,
  PlusSquare,
  UserPlus,
  HelpCircle,
  AlertTriangle,
  FileCode,
  Copy,
  Check,
  Pencil,
  FileSpreadsheet,
} from 'lucide-react';
import {
  Product,
  Motoris,
  StockCalculation,
  OutboundRecord,
  ReturRecord,
  KartuStokRow,
} from '@/types/inventory';
import { GOOGLE_APPS_SCRIPT_TEMPLATE } from '@/lib/storage';

/* =========================================================
   1. MASTER DATA MODAL
========================================================= */
interface MasterDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  motoris: Motoris[];
  onAddProduct: (product: Product) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (sku: string) => void;
  onAddMotoris: (motoris: Motoris) => void;
  onUpdateMotoris: (motoris: Motoris) => void;
  onDeleteMotoris: (id: string) => void;
  onRequestConfirm: (
    title: string,
    message: string,
    type: 'danger' | 'warning' | 'info',
    onConfirm: () => void
  ) => void;
}

export const MasterDataModal: React.FC<MasterDataModalProps> = ({
  isOpen,
  onClose,
  products,
  motoris,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onAddMotoris,
  onUpdateMotoris,
  onDeleteMotoris,
  onRequestConfirm,
}) => {
  const [subtab, setSubtab] = useState<'prod' | 'motoris'>('prod');

  // Edit states
  const [editingSku, setEditingSku] = useState<string | null>(null);
  const [editingMotId, setEditingMotId] = useState<string | null>(null);

  // Product form state
  const [sku, setSku] = useState('');
  const [nama, setNama] = useState('');
  const [kategori, setKategori] = useState('Rokok');
  const [satuan, setSatuan] = useState('Bks');
  const [stokAwal, setStokAwal] = useState('');
  const [batasMin, setBatasMin] = useState('');

  // Motoris form state
  const [motId, setMotId] = useState('');
  const [motNama, setMotNama] = useState('');
  const [motArea, setMotArea] = useState('General');

  if (!isOpen) return null;

  const handleStartEditProduct = (p: Product) => {
    setEditingSku(p.sku);
    setSku(p.sku);
    setNama(p.nama);
    setKategori(p.kategori);
    setSatuan(p.satuan);
    setStokAwal(String(p.stokAwal));
    setBatasMin(String(p.batasMin));
  };

  const handleCancelEditProduct = () => {
    setEditingSku(null);
    setSku('');
    setNama('');
    setStokAwal('');
    setBatasMin('');
  };

  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sku.trim() || !nama.trim()) return;

    if (editingSku) {
      onUpdateProduct({
        sku: editingSku,
        nama: nama.trim(),
        kategori,
        satuan: satuan.trim() || 'Pcs',
        stokAwal: Number(stokAwal) || 0,
        batasMin: Number(batasMin) || 0,
      });
      handleCancelEditProduct();
    } else {
      onAddProduct({
        sku: sku.trim().toUpperCase(),
        nama: nama.trim(),
        kategori,
        satuan: satuan.trim() || 'Pcs',
        stokAwal: Number(stokAwal) || 0,
        batasMin: Number(batasMin) || 0,
      });
      setSku('');
      setNama('');
      setStokAwal('');
      setBatasMin('');
    }
  };

  const handleStartEditMotoris = (m: Motoris) => {
    setEditingMotId(m.id);
    setMotId(m.id);
    setMotNama(m.nama);
    setMotArea(m.area);
  };

  const handleCancelEditMotoris = () => {
    setEditingMotId(null);
    setMotId('');
    setMotNama('');
    setMotArea('General');
  };

  const handleMotorisSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!motId.trim() || !motNama.trim()) return;

    if (editingMotId) {
      onUpdateMotoris({
        id: editingMotId,
        nama: motNama.trim(),
        area: motArea.trim() || 'General',
      });
      handleCancelEditMotoris();
    } else {
      onAddMotoris({
        id: motId.trim().toUpperCase(),
        nama: motNama.trim(),
        area: motArea.trim() || 'General',
      });
      setMotId('');
      setMotNama('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 no-print">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
        <div className="px-5 py-3 bg-[#0b1e36] text-white flex justify-between items-center shadow-sm">
          <h3 className="font-bold text-sm flex items-center gap-2">
            <Database className="w-4 h-4 text-[#c29b38]" /> Kelola Master Data
          </h3>
          <button onClick={onClose} className="text-slate-300 hover:text-white transition p-1 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Subtabs */}
        <div className="bg-slate-100 px-5 py-2 border-b flex gap-2">
          <button
            onClick={() => setSubtab('prod')}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer active:scale-95 ${
              subtab === 'prod'
                ? 'bg-white shadow-xs text-[#0b1e36] border border-slate-200'
                : 'text-slate-500 hover:bg-white hover:shadow-xs border border-transparent'
            }`}
          >
            Produk (SKU)
          </button>
          <button
            onClick={() => setSubtab('motoris')}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer active:scale-95 ${
              subtab === 'motoris'
                ? 'bg-white shadow-xs text-[#0b1e36] border border-slate-200'
                : 'text-slate-500 hover:bg-white hover:shadow-xs border border-transparent'
            }`}
          >
            Sales Motoris
          </button>
        </div>

        {/* Subtab Content */}
        <div className="p-6 overflow-y-auto flex-1 text-xs sm:text-sm bg-slate-50">
          {subtab === 'prod' ? (
            <div className="space-y-5">
              <form
                onSubmit={handleProductSubmit}
                className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-4"
              >
                <div className="flex items-center justify-between border-b pb-2">
                  <h4 className="font-bold text-xs text-[#0b1e36] flex items-center gap-1.5">
                    <PlusSquare className="w-4 h-4 text-[#0b1e36]" />{' '}
                    {editingSku ? `Edit Master Produk: ${editingSku}` : 'Tambah Master Produk'}
                  </h4>
                  {editingSku && (
                    <button
                      type="button"
                      onClick={handleCancelEditProduct}
                      className="text-xs text-slate-500 hover:text-slate-800 underline font-semibold"
                    >
                      Batal Edit
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Kode SKU
                    </label>
                    <input
                      type="text"
                      required
                      disabled={!!editingSku}
                      placeholder="KS-BE-16R"
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                      className="w-full border border-slate-300 rounded-md px-2.5 py-1.5 uppercase outline-none focus:ring-1 focus:ring-[#c29b38] bg-white disabled:bg-slate-100 disabled:text-slate-500"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Nama Produk
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Kapal Sakti Black 16"
                      value={nama}
                      onChange={(e) => setNama(e.target.value)}
                      className="w-full border border-slate-300 rounded-md px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-[#c29b38] bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Kategori
                    </label>
                    <select
                      value={kategori}
                      onChange={(e) => setKategori(e.target.value)}
                      className="w-full border border-slate-300 rounded-md px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-[#c29b38] bg-white"
                    >
                      <option value="Rokok">Rokok</option>
                      <option value="Minuman">Minuman</option>
                      <option value="Snack">Snack</option>
                      <option value="Sembako">Sembako</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Satuan
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Bks / Btl / Slop"
                      value={satuan}
                      onChange={(e) => setSatuan(e.target.value)}
                      className="w-full border border-slate-300 rounded-md px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-[#c29b38] bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Stok Pembukaan
                    </label>
                    <input
                      type="number"
                      required
                      placeholder="100"
                      value={stokAwal}
                      onChange={(e) => setStokAwal(e.target.value)}
                      className="w-full border border-slate-300 rounded-md px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-[#c29b38] bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Safety Min (PO)
                    </label>
                    <input
                      type="number"
                      required
                      placeholder="400"
                      value={batasMin}
                      onChange={(e) => setBatasMin(e.target.value)}
                      className="w-full border border-slate-300 rounded-md px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-[#c29b38] bg-white"
                    />
                  </div>
                  <div>
                    <button
                      type="submit"
                      className="w-full bg-[#0b1e36] hover:bg-[#163155] text-white px-3 py-2 rounded-md font-bold transition flex items-center justify-center gap-1 active:scale-95 shadow-xs cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" /> {editingSku ? 'Perbarui SKU' : 'Simpan SKU'}
                    </button>
                  </div>
                </div>
              </form>

              {/* Master Products Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 border-b border-slate-200">
                    <tr>
                      <th className="p-3 text-[10px] uppercase font-bold text-slate-500">SKU</th>
                      <th className="p-3 text-[10px] uppercase font-bold text-slate-500">Nama Produk</th>
                      <th className="p-3 text-[10px] uppercase font-bold text-slate-500 text-center">Satuan</th>
                      <th className="p-3 text-[10px] uppercase font-bold text-slate-500 text-right">Master Awal</th>
                      <th className="p-3 text-[10px] uppercase font-bold text-slate-500 text-right">Batas Min</th>
                      <th className="p-3 text-[10px] uppercase font-bold text-slate-500 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {products.map((p) => (
                      <tr key={p.sku} className="hover:bg-slate-50 transition">
                        <td className="p-3 font-mono font-bold text-[#0b1e36]">{p.sku}</td>
                        <td className="p-3">
                          <div className="font-semibold text-slate-800">{p.nama}</div>
                          <div className="text-[10px] text-slate-400">{p.kategori}</div>
                        </td>
                        <td className="p-3 text-center text-slate-600">{p.satuan}</td>
                        <td className="p-3 text-right font-bold text-slate-800">{p.stokAwal}</td>
                        <td className="p-3 text-right font-bold text-rose-600">{p.batasMin}</td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleStartEditProduct(p)}
                              title="Edit Produk"
                              className="p-1 text-slate-400 hover:text-indigo-600 transition"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() =>
                                onRequestConfirm(
                                  'Hapus SKU Master?',
                                  `Hapus master SKU ${p.sku} (${p.nama})?`,
                                  'danger',
                                  () => onDeleteProduct(p.sku)
                                )
                              }
                              title="Hapus Produk"
                              className="p-1 text-slate-400 hover:text-rose-600 transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <form
                onSubmit={handleMotorisSubmit}
                className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between border-b pb-2">
                  <h4 className="font-bold text-xs text-[#0b1e36] flex items-center gap-1.5">
                    <UserPlus className="w-4 h-4 text-[#0b1e36]" />{' '}
                    {editingMotId ? `Edit Sales Motoris: ${editingMotId}` : 'Tambah Sales Motoris'}
                  </h4>
                  {editingMotId && (
                    <button
                      type="button"
                      onClick={handleCancelEditMotoris}
                      className="text-xs text-slate-500 hover:text-slate-800 underline font-semibold"
                    >
                      Batal Edit
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap sm:flex-nowrap gap-3 items-end">
                  <div className="w-full sm:w-1/4">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      ID Motoris
                    </label>
                    <input
                      type="text"
                      required
                      disabled={!!editingMotId}
                      placeholder="CJ-0X"
                      value={motId}
                      onChange={(e) => setMotId(e.target.value)}
                      className="w-full border border-slate-300 rounded-md px-2.5 py-1.5 uppercase outline-none focus:ring-1 focus:ring-[#c29b38] bg-white disabled:bg-slate-100 disabled:text-slate-500"
                    />
                  </div>
                  <div className="w-full sm:w-2/4">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Nama Sales
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Nama sales motoris..."
                      value={motNama}
                      onChange={(e) => setMotNama(e.target.value)}
                      className="w-full border border-slate-300 rounded-md px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-[#c29b38] bg-white"
                    />
                  </div>
                  <div className="w-full sm:w-1/4">
                    <button
                      type="submit"
                      className="w-full bg-[#0b1e36] hover:bg-[#163155] text-white px-3 py-2 rounded-md font-bold transition flex items-center justify-center gap-1 active:scale-95 shadow-xs cursor-pointer"
                    >
                      {editingMotId ? <Save className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
                      {editingMotId ? 'Perbarui' : 'Tambah'}
                    </button>
                  </div>
                </div>
              </form>

              {/* Master Motoris Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 border-b border-slate-200">
                    <tr>
                      <th className="p-3 text-[10px] uppercase font-bold text-slate-500">ID</th>
                      <th className="p-3 text-[10px] uppercase font-bold text-slate-500">Nama Sales Motoris</th>
                      <th className="p-3 text-[10px] uppercase font-bold text-slate-500">Wilayah / Area</th>
                      <th className="p-3 text-[10px] uppercase font-bold text-slate-500 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {motoris.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50 transition">
                        <td className="p-3 font-mono font-bold text-[#0b1e36]">{m.id}</td>
                        <td className="p-3 font-semibold text-slate-800">{m.nama}</td>
                        <td className="p-3 text-slate-500">{m.area}</td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleStartEditMotoris(m)}
                              title="Edit Motoris"
                              className="p-1 text-slate-400 hover:text-indigo-600 transition"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() =>
                                onRequestConfirm(
                                  'Hapus Motoris?',
                                  `Hapus master motoris ${m.id} (${m.nama})?`,
                                  'danger',
                                  () => onDeleteMotoris(m.id)
                                )
                              }
                              title="Hapus Motoris"
                              className="p-1 text-slate-400 hover:text-rose-600 transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* =========================================================
   2. SETTINGS & SINKRONISASI MODAL
========================================================= */
interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  scriptUrl: string;
  onSaveUrl: (url: string) => void;
  onTestPing: () => void;
  onForceDownload: () => void;
  onSyncAllToSheet?: () => void;
  onInitSheets?: () => void;
  onExportBackup: () => void;
  onImportBackup: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRequestConfirm: (
    title: string,
    message: string,
    type: 'danger' | 'warning' | 'info',
    onConfirm: () => void
  ) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  scriptUrl,
  onSaveUrl,
  onTestPing,
  onForceDownload,
  onSyncAllToSheet,
  onInitSheets,
  onExportBackup,
  onImportBackup,
  onRequestConfirm,
}) => {
  const [urlInput, setUrlInput] = useState(scriptUrl);
  const [showCode, setShowCode] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_TEMPLATE).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleForceDownloadClick = () => {
    onRequestConfirm(
      'Timpa Data Lokal?',
      'Tindakan ini akan mengunduh paksa database dari Google Sheets dan menimpa data yang ada di browser ini. Lanjutkan?',
      'warning',
      onForceDownload
    );
  };

  const handleSyncAllClick = () => {
    if (!onSyncAllToSheet) return;
    onRequestConfirm(
      'Unggah Semua Data ke Google Sheets?',
      'Tindakan ini akan mengunggah seluruh produk, motoris, dan seluruh riwayat transaksi lokal Anda ke spreadsheet Google Sheets. Data di sheet akan disesuaikan dengan data aplikasi ini. Lanjutkan?',
      'info',
      onSyncAllToSheet
    );
  };

  const handleInitSheetsClick = () => {
    if (!onInitSheets) return;
    onRequestConfirm(
      'Inisialisasi Tabel di Google Sheets?',
      'Aplikasi akan membuat/memformat 6 sheet resmi (Master_Produk, Master_Motoris, Barang_Keluar, Retur, Barang_Masuk, Cek_Fisik) dengan baris judul rapi di Google Sheets Anda. Lanjutkan?',
      'info',
      onInitSheets
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 no-print">
      <div className="bg-white rounded-xl max-w-xl w-full shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
        <div className="px-5 py-3 bg-[#0b1e36] text-white flex justify-between items-center shrink-0">
          <h3 className="font-bold text-sm flex items-center gap-2">
            <Cloud className="w-4 h-4 text-[#c29b38]" /> Setup Database (Google Sheets)
          </h3>
          <button onClick={onClose} className="text-slate-300 hover:text-white transition cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 text-sm bg-slate-50 overflow-y-auto flex-1">
          <div>
            <label className="block font-bold text-slate-700 text-xs mb-1.5">
              Web App URL (Google Apps Script)
            </label>
            <input
              type="url"
              placeholder="https://script.google.com/macros/s/.../exec"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono outline-none focus:ring-1 focus:ring-[#c29b38] bg-white shadow-inner"
            />
            <p className="text-[10px] text-slate-500 mt-1.5 leading-tight">
              Kosongkan jika hanya ingin memakai mode Local Storage (offline). Masukkan Web App URL dari deployment Google Apps Script untuk sinkronisasi live CRUD.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200">
            <button
              onClick={() => onSaveUrl(urlInput.trim())}
              className="bg-[#0b1e36] text-white px-3.5 py-2 rounded-lg text-xs font-bold shadow-xs transition hover:bg-[#163155] flex items-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" /> Simpan URL
            </button>
            <button
              onClick={onTestPing}
              className="bg-[#c29b38] text-[#0b1e36] px-3.5 py-2 rounded-lg text-xs font-bold shadow-xs transition hover:bg-[#dfb753] flex items-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <Wifi className="w-3.5 h-3.5" /> Tes Koneksi
            </button>
            <button
              onClick={handleForceDownloadClick}
              className="bg-slate-200 text-slate-700 px-3.5 py-2 rounded-lg text-xs font-bold shadow-xs transition hover:bg-slate-300 flex items-center gap-1.5 active:scale-95 cursor-pointer"
              title="Unduh seluruh database dari Google Sheets ke browser"
            >
              <DownloadCloud className="w-3.5 h-3.5 text-blue-600" /> Unduh dari Sheets
            </button>
            {onSyncAllToSheet && (
              <button
                onClick={handleSyncAllClick}
                className="bg-emerald-600 text-white px-3.5 py-2 rounded-lg text-xs font-bold shadow-xs transition hover:bg-emerald-700 flex items-center gap-1.5 active:scale-95 cursor-pointer"
                title="Unggah seluruh data master & transaksi saat ini ke Google Sheets"
              >
                <UploadCloud className="w-3.5 h-3.5" /> Unggah Semua (Sync All)
              </button>
            )}
            {onInitSheets && (
              <button
                onClick={handleInitSheetsClick}
                className="bg-indigo-600 text-white px-3.5 py-2 rounded-lg text-xs font-bold shadow-xs transition hover:bg-indigo-700 flex items-center gap-1.5 active:scale-95 cursor-pointer"
                title="Format tabel & judul 6 sheet secara otomatis"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" /> Format Otomatis Sheet
              </button>
            )}
          </div>

          {/* Backup & Restore Section */}
          <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-3">
            <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider">
              Cadangan & Pemulihan (JSON)
            </h4>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onExportBackup}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-semibold flex items-center gap-1 transition cursor-pointer active:scale-95"
              >
                <DownloadCloud className="w-3.5 h-3.5 text-blue-600" /> Ekspor Backup JSON
              </button>

              <label className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-semibold flex items-center gap-1 transition cursor-pointer active:scale-95">
                <Save className="w-3.5 h-3.5 text-emerald-600" /> Pulihkan dari JSON
                <input
                  type="file"
                  accept=".json"
                  onChange={onImportBackup}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Google Apps Script Accordion */}
          <div className="pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setShowCode(!showCode)}
              className="text-xs font-bold text-[#0b1e36] flex items-center gap-1.5 hover:underline"
            >
              <FileCode className="w-4 h-4 text-[#c29b38]" />
              {showCode ? 'Sembunyikan Template Apps Script' : 'Lihat Kode Template Google Apps Script'}
            </button>

            {showCode && (
              <div className="mt-3 bg-slate-900 text-slate-100 rounded-lg p-3 text-[11px] font-mono relative max-h-56 overflow-y-auto">
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="absolute top-2 right-2 p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs flex items-center gap-1"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Tersalin' : 'Salin'}
                </button>
                <pre>{GOOGLE_APPS_SCRIPT_TEMPLATE}</pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* =========================================================
   3. AUTO-PO (SARAN ORDER KRITIS) MODAL
========================================================= */
interface AutoPOModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderItems: StockCalculation[];
  onShowToast: (message: string, type: 'info' | 'success' | 'error') => void;
}

export const AutoPOModal: React.FC<AutoPOModalProps> = ({
  isOpen,
  onClose,
  orderItems,
  onShowToast,
}) => {
  if (!isOpen) return null;

  const handleCopyPOText = () => {
    if (orderItems.length === 0) {
      onShowToast('Tidak ada item yang membutuhkan PO saat ini.', 'info');
      return;
    }

    const todayStr = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    let txt = `*PO PT MAHAMERU INSAN MANDIRI*\nTanggal: ${todayStr}\n\nMohon pengiriman pasokan stok berikut:\n`;
    orderItems.forEach((o, idx) => {
      txt += `${idx + 1}. ${o.nama} (${o.sku}) : *${o.defisit} ${o.satuan}*\n`;
    });
    txt += `\nTerima kasih.`;

    navigator.clipboard
      .writeText(txt)
      .then(() => onShowToast('Daftar PO berhasil disalin ke clipboard WhatsApp!', 'success'))
      .catch(() => onShowToast('Gagal menyalin pesan PO.', 'error'));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 no-print">
      <div className="bg-white rounded-xl max-w-md w-full shadow-2xl flex flex-col max-h-[80vh] border border-slate-200 overflow-hidden">
        <div className="px-5 py-3 bg-rose-600 text-white flex justify-between items-center shrink-0">
          <h3 className="font-bold text-sm flex items-center gap-2">
            <ShoppingCart className="w-4 h-4" /> Saran Order (Stok Kritis)
          </h3>
          <button onClick={onClose} className="text-rose-200 hover:text-white transition p-1 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-3 text-xs flex-1 bg-slate-50">
          {orderItems.length === 0 ? (
            <div className="p-4 text-center text-emerald-600 font-bold bg-emerald-50 rounded-lg border border-emerald-200">
              Stok Aman, tidak ada PO dibutuhkan saat ini.
            </div>
          ) : (
            orderItems.map((o) => (
              <div
                key={o.sku}
                className="bg-white p-3 rounded-lg border border-rose-200 flex justify-between items-center shadow-xs"
              >
                <div>
                  <div className="font-bold text-slate-800">
                    {o.nama} <span className="font-normal text-slate-400 font-mono">({o.sku})</span>
                  </div>
                  <div className="text-[10px] text-rose-600 font-semibold mt-0.5">
                    Sisa: {o.stokTersediaSaatIni} | Safety Min: {o.min}
                  </div>
                </div>
                <div className="text-right">
                  <span className="block text-[10px] text-slate-400">Order:</span>
                  <span className="font-black text-rose-600 text-sm">
                    +{o.defisit} {o.satuan}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 bg-white border-t border-slate-200 flex justify-between items-center shrink-0">
          <span className="text-[10px] text-slate-400 italic">
            Generate otomatis berdasarkan Batas Safety Min
          </span>
          <button
            onClick={handleCopyPOText}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-xs transition active:scale-95 cursor-pointer"
          >
            <MessageCircle className="w-3.5 h-3.5" /> Salin ke WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
};

/* =========================================================
   4. KARTU STOK MODAL (CHRONOLOGICAL RUNNING LEDGER)
========================================================= */
interface KartuStokModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: {
    product: Product;
    saldoAwal: number;
    totalTerjual: number;
    saldoAkhir: number;
    rows: KartuStokRow[];
  } | null;
}

export const KartuStokModal: React.FC<KartuStokModalProps> = ({ isOpen, onClose, data }) => {
  if (!isOpen || !data) return null;

  const handleExportCSV = () => {
    if (!data.rows || data.rows.length === 0) return;
    const headers = ['Tanggal', 'Jenis Mutasi', 'Keterangan', 'In (+)', 'Out (-)', 'Saldo'];
    const csvRows = data.rows.map((r) => [
      r.tanggal,
      `"${r.jenis}"`,
      `"${(r.keterangan || '').replace(/"/g, '""')}"`,
      r.in,
      r.out,
      r.saldo,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...csvRows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Kartu_Stok_${data.product.sku}_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 printable-modal-overlay">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200 printable-modal-card">
        {/* Printable Header for Print Output */}
        <div className="print-only mb-4 pb-3 border-b-2 border-[#0b1e36]">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="font-black text-lg uppercase text-[#0b1e36]">
                PT. Mahameru Insan Mandiri - Kartu Stok
              </h2>
              <p className="text-xs text-slate-600 font-semibold">
                {data.product.nama} ({data.product.sku}) - Kategori: {data.product.kategori}
              </p>
            </div>
            <div className="text-right text-xs text-slate-500">
              Dicetak: {new Date().toLocaleDateString('id-ID')}
            </div>
          </div>
        </div>

        <div className="px-5 py-4 bg-[#0b1e36] text-white flex justify-between items-start shrink-0 no-print">
          <div>
            <h3 className="font-bold text-base">Kartu Stok: {data.product.nama}</h3>
            <p className="text-[11px] text-[#dfb753] mt-0.5">
              Riwayat Mutasi Transaksi ({data.product.sku}) - Kategori: {data.product.kategori}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold flex items-center gap-1 transition shadow-xs cursor-pointer active:scale-95"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" /> CSV
            </button>
            <button
              onClick={() => window.print()}
              className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded text-xs font-semibold flex items-center gap-1 transition shadow-xs cursor-pointer active:scale-95"
            >
              <Printer className="w-3.5 h-3.5" /> Cetak
            </button>
            <button onClick={onClose} className="text-slate-300 hover:text-white transition p-1 cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Top 3 Metric Cards */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-3 gap-4 text-center shrink-0">
          <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
            <span className="block text-[10px] text-slate-400 uppercase font-bold">
              Saldo Awal Master
            </span>
            <span className="block text-sm font-black text-indigo-900">
              {data.saldoAwal} {data.product.satuan}
            </span>
          </div>

          <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
            <span className="block text-[10px] text-slate-400 uppercase font-bold">
              Total Terjual (Net)
            </span>
            <span className="block text-sm font-black text-emerald-600">
              {data.totalTerjual} {data.product.satuan}
            </span>
          </div>

          <div className="bg-white p-3 rounded-lg border border-[#c29b38] shadow-xs">
            <span className="block text-[10px] text-[#0b1e36] uppercase font-bold">
              Sisa Stok Akhir
            </span>
            <span className="block text-xl font-black text-[#0b1e36]">
              {data.saldoAkhir} {data.product.satuan}
            </span>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="p-0 overflow-y-auto flex-1 bg-white">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold sticky top-0 z-10">
              <tr>
                <th className="p-3">Tanggal</th>
                <th className="p-3">Jenis Mutasi</th>
                <th className="p-3">Dokumen / Keterangan</th>
                <th className="p-3 text-right">In (+)</th>
                <th className="p-3 text-right">Out (-)</th>
                <th className="p-3 text-right font-black text-slate-800">Saldo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {data.rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">
                    Belum ada histori transaksi mutasi untuk produk ini
                  </td>
                </tr>
              ) : (
                data.rows.map((r, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition">
                    <td className="p-3 font-mono text-slate-500">{r.tanggal}</td>
                    <td className={`p-3 font-bold ${r.colorClass}`}>{r.jenis}</td>
                    <td className="p-3 text-slate-600 truncate max-w-[200px]">{r.keterangan}</td>
                    <td className="p-3 text-right font-bold text-blue-600">{r.in > 0 ? r.in : '-'}</td>
                    <td className="p-3 text-right font-bold text-rose-600">{r.out > 0 ? r.out : '-'}</td>
                    <td className="p-3 text-right font-black text-slate-800 bg-slate-50">{r.saldo}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

/* =========================================================
   5. PRINT SLIP MODAL (A4 PRINTABLE PREVIEW)
========================================================= */
interface PrintSlipModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'outbound' | 'retur';
  docId: string;
  outbounds: OutboundRecord[];
  returs: ReturRecord[];
  products: Product[];
  motoris: Motoris[];
}

export const PrintSlipModal: React.FC<PrintSlipModalProps> = ({
  isOpen,
  onClose,
  type,
  docId,
  outbounds,
  returs,
  products,
  motoris,
}) => {
  if (!isOpen || !docId) return null;

  const records =
    type === 'outbound'
      ? outbounds.filter((o) => o.noJalan === docId)
      : returs.filter((r) => r.noRetur === docId);

  if (records.length === 0) return null;

  const first = records[0];
  const motId = first.idMotoris;
  const motObj = motoris.find((m) => m.id === motId);
  const motName = motObj ? `${motObj.nama} (${motObj.area})` : motId;
  const title = type === 'outbound' ? 'SURAT JALAN LOADING PAGI' : 'BUKTI PENERIMAAN RETUR';
  const headLabel = 'Motoris';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 printable-modal-overlay">
      <div className="bg-white rounded-xl max-w-3xl w-full shadow-2xl flex flex-col max-h-[90vh] border border-slate-200 overflow-hidden printable-modal-card">
        <div className="px-5 py-3 bg-[#0b1e36] text-white flex justify-between items-center shrink-0 no-print">
          <h3 className="font-bold text-sm flex items-center gap-2">
            <Printer className="w-4 h-4 text-[#dfb753]" /> Preview Dokumen Transaksi
          </h3>
          <button onClick={onClose} className="text-slate-300 hover:text-white transition p-1 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Area Wrapper */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-200 flex justify-center printable-sheet">
          <div className="bg-white w-[210mm] min-h-[148mm] shadow-md p-8 text-slate-800 text-sm printable-paper">
            {/* Header */}
            <div className="flex justify-between items-start border-b-2 border-[#0b1e36] pb-6 mb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 border-2 border-[#c29b38] rounded-lg flex items-center justify-center bg-[#0b1e36] text-[#c29b38] font-black text-xl">
                  MIM
                </div>
                <div>
                  <h1 className="font-black text-2xl tracking-tight text-[#0b1e36] uppercase">
                    PT. Mahameru Insan Mandiri
                  </h1>
                  <p className="text-sm text-slate-500 font-medium">
                    Distribution Hub & Logistik Area
                  </p>
                </div>
              </div>
              <div className="text-right">
                <h2 className="font-black text-xl text-[#c29b38] tracking-widest uppercase">
                  {title}
                </h2>
                <p className="font-mono text-slate-600 font-semibold text-lg mt-1">{docId}</p>
              </div>
            </div>

            {/* Document Details Info */}
            <div className="grid grid-cols-2 gap-4 mb-8 text-sm">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="mb-2">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">
                    Tanggal Transaksi
                  </span>
                  <span className="font-bold text-slate-800 text-base">{first.tanggal}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">
                    Keterangan Dokumen
                  </span>
                  <span className="font-semibold text-slate-700">{first.ket || '-'}</span>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="mb-2">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">
                    {headLabel} ID
                  </span>
                  <span className="font-mono font-bold text-slate-800 text-base">{motId}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">
                    Nama Lengkap & Area
                  </span>
                  <span className="font-semibold text-slate-700">{motName}</span>
                </div>
              </div>
            </div>

            {/* Item Table */}
            <table className="w-full text-left text-sm mb-12 border-collapse">
              <thead className="bg-[#0b1e36] text-white font-bold uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="py-3 px-2 text-center w-12 rounded-tl-lg">No</th>
                  <th className="py-3 px-2">Kode SKU</th>
                  <th className="py-3 px-2">Deskripsi Produk</th>
                  <th className="py-3 px-2 text-right">Qty</th>
                  <th className="py-3 px-2 text-center rounded-tr-lg">Satuan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {records.map((item, idx) => {
                  const p = products.find((x) => x.sku === item.sku);
                  const retItem = item as ReturRecord;
                  return (
                    <tr key={idx} className="border-b border-slate-200">
                      <td className="py-2.5 px-2 text-center text-slate-500">{idx + 1}</td>
                      <td className="py-2.5 px-2 font-mono font-bold text-slate-800">{item.sku}</td>
                      <td className="py-2.5 px-2 font-semibold text-slate-800">
                        {p ? p.nama : item.sku}
                        {retItem.kondisi && (
                          <span className="block text-[10px] text-slate-500 mt-0.5">
                            Kondisi: {retItem.kondisi}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-2 text-right font-black text-sm">{item.qty}</td>
                      <td className="py-2.5 px-2 text-center text-slate-600">{p ? p.satuan : 'Pcs'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Signature Block */}
            <div className="grid grid-cols-3 text-center pt-8">
              <div>
                <p className="mb-20 text-sm font-semibold text-slate-500">Admin Gudang</p>
                <p className="font-bold text-slate-800 border-t border-slate-400 mx-8 pt-2">
                  ( ........................ )
                </p>
              </div>
              <div>
                <p className="mb-20 text-sm font-semibold text-slate-500">{headLabel} Penerima</p>
                <p className="font-bold text-slate-800 border-t border-slate-400 mx-8 pt-2">
                  {motObj ? motObj.nama : motId}
                </p>
              </div>
              <div>
                <p className="mb-20 text-sm font-semibold text-slate-500">Mengetahui SPV</p>
                <p className="font-bold text-slate-800 border-t border-slate-400 mx-8 pt-2">
                  ( ........................ )
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="p-4 bg-white border-t border-slate-200 flex justify-end gap-3 shrink-0 no-print">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold transition hover:bg-slate-200 cursor-pointer active:scale-95"
          >
            Tutup
          </button>
          <button
            onClick={() => window.print()}
            className="bg-[#0b1e36] hover:bg-[#163155] text-white px-6 py-2 rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-xs transition active:scale-95 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" /> Print Dokumen
          </button>
        </div>
      </div>
    </div>
  );
};

/* =========================================================
   6. DYNAMIC CONFIRMATION MODAL
========================================================= */
interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  type: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  type,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 no-print">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl text-center transform transition-transform duration-200">
        <div
          className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 ${
            type === 'danger'
              ? 'bg-rose-100 text-rose-600'
              : type === 'warning'
              ? 'bg-amber-100 text-amber-600'
              : 'bg-blue-100 text-blue-600'
          }`}
        >
          {type === 'danger' ? (
            <Trash2 className="w-7 h-7" />
          ) : type === 'warning' ? (
            <AlertTriangle className="w-7 h-7" />
          ) : (
            <HelpCircle className="w-7 h-7" />
          )}
        </div>

        <h3 className="font-extrabold text-slate-800 text-lg mb-1.5">{title}</h3>
        <p className="text-xs text-slate-500 mb-6 leading-relaxed">{message}</p>

        <div className="flex gap-3 justify-center">
          <button
            onClick={onCancel}
            className="w-1/2 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 transition cursor-pointer active:scale-95"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            className={`w-1/2 px-4 py-2.5 text-white rounded-xl text-xs font-bold shadow-md transition cursor-pointer active:scale-95 ${
              type === 'danger'
                ? 'bg-rose-600 hover:bg-rose-700'
                : type === 'warning'
                ? 'bg-amber-500 hover:bg-amber-600'
                : 'bg-[#0b1e36] hover:bg-[#163155]'
            }`}
          >
            {type === 'danger' ? 'Ya, Hapus' : type === 'warning' ? 'Ya, Lanjutkan' : 'Ya, Konfirmasi'}
          </button>
        </div>
      </div>
    </div>
  );
};
