'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Product,
  Motoris,
  OutboundRecord,
  ReturRecord,
  InboundRecord,
  OpnameRecord,
  ActiveTab,
  StockCalculation,
} from '@/types/inventory';
import {
  DEFAULT_PRODUCTS,
  DEFAULT_MOTORIS,
  getTodayDateString,
  calculateStockForProduct,
  calculateDailySummary,
  getKartuStok,
  exportBackupJSON,
} from '@/lib/storage';
import { Navbar } from '@/components/Navbar';
import { DashboardTab } from '@/components/DashboardTab';
import { OutboundTab } from '@/components/OutboundTab';
import { ReturTab } from '@/components/ReturTab';
import { InboundTab } from '@/components/InboundTab';
import { OpnameTab } from '@/components/OpnameTab';
import { ReportTab } from '@/components/ReportTab';
import {
  MasterDataModal,
  SettingsModal,
  AutoPOModal,
  KartuStokModal,
  PrintSlipModal,
  ConfirmModal,
} from '@/components/Modals';
import { CheckCircle2, AlertCircle, Info, Loader2 } from 'lucide-react';

export default function HomePage() {
  // Main data state
  const [products, setProducts] = useState<Product[]>(DEFAULT_PRODUCTS);
  const [motoris, setMotoris] = useState<Motoris[]>(DEFAULT_MOTORIS);
  const [outbound, setOutbound] = useState<OutboundRecord[]>([]);
  const [retur, setRetur] = useState<ReturRecord[]>([]);
  const [inbound, setInbound] = useState<InboundRecord[]>([]);
  const [opname, setOpname] = useState<OpnameRecord[]>([]);
  const [scriptUrl, setScriptUrl] = useState<string>('');

  // UI state
  const [activeTab, setActiveTab] = useState<ActiveTab>('tabDashboard');
  const [activeDate, setActiveDate] = useState<string>(getTodayDateString());
  const [syncStatus, setSyncStatus] = useState<'demo' | 'syncing' | 'synced' | 'error'>('demo');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isHydrated, setIsHydrated] = useState<boolean>(false);
  const [loadingText, setLoadingText] = useState<string | null>(null);

  // Modals state
  const [masterDataOpen, setMasterDataOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [autoPOOpen, setAutoPOOpen] = useState(false);
  const [printSlip, setPrintSlip] = useState<{
    open: boolean;
    type: 'outbound' | 'retur';
    docId: string;
  }>({ open: false, type: 'outbound', docId: '' });
  const [selectedKartuSku, setSelectedKartuSku] = useState<string | null>(null);

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    title: string;
    message: string;
    type: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
  }>({
    open: false,
    title: '',
    message: '',
    type: 'info',
    onConfirm: () => {},
  });

  // Toast notification state
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: 'info' | 'success' | 'error';
  }>({
    show: false,
    message: '',
    type: 'info',
  });

  const showToast = useCallback((message: string, type: 'info' | 'success' | 'error' = 'info') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 3500);
  }, []);

  const requestConfirm = useCallback(
    (
      title: string,
      message: string,
      type: 'danger' | 'warning' | 'info',
      onConfirmAction: () => void
    ) => {
      setConfirmModal({
        open: true,
        title,
        message,
        type,
        onConfirm: () => {
          setConfirmModal((prev) => ({ ...prev, open: false }));
          onConfirmAction();
        },
      });
    },
    []
  );

  // Load from LocalStorage once mounted on client to prevent hydration mismatch
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const saved = localStorage.getItem('mahameru_app_state');
        const savedUrl = localStorage.getItem('mahameru_script_url') || '';

        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.products && Array.isArray(parsed.products) && parsed.products.length > 0) {
            setProducts(parsed.products);
          }
          if (parsed.motoris && Array.isArray(parsed.motoris) && parsed.motoris.length > 0) {
            setMotoris(parsed.motoris);
          }
          if (parsed.outbound && Array.isArray(parsed.outbound)) {
            setOutbound(parsed.outbound);
          }
          if (parsed.retur && Array.isArray(parsed.retur)) {
            setRetur(parsed.retur);
          }
          if (parsed.inbound && Array.isArray(parsed.inbound)) {
            setInbound(parsed.inbound);
          }
          if (parsed.opname && Array.isArray(parsed.opname)) {
            setOpname(parsed.opname);
          }
        }

        if (savedUrl) {
          setScriptUrl(savedUrl);
          setSyncStatus('synced');
        }
      } catch {
        // Storage not available or corrupted
      } finally {
        setIsHydrated(true);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Save to LocalStorage on state changes only after client hydration
  useEffect(() => {
    if (!isHydrated) return;
    try {
      const dataToSave = {
        products,
        motoris,
        outbound,
        retur,
        inbound,
        opname,
      };
      localStorage.setItem('mahameru_app_state', JSON.stringify(dataToSave));
    } catch {
      // Quota exceeded
    }
  }, [products, motoris, outbound, retur, inbound, opname, isHydrated]);

  // Sync background helpers
  const silentSyncPush = useCallback(
    async (
      action: 'appendRow' | 'appendRows' | 'updateRow' | 'deleteRow' | 'syncAll' | 'initSheets',
      sheetName: string,
      dataPayload?: unknown
    ) => {
      if (!scriptUrl || !scriptUrl.startsWith('https://script.google.com/')) return;
      setSyncStatus('syncing');

      const isArray = Array.isArray(dataPayload);
      const payloadObj: Record<string, unknown> = {
        scriptUrl,
        action,
        sheet: sheetName,
      };

      if (isArray) {
        payloadObj.rows = dataPayload;
      } else if (dataPayload && typeof dataPayload === 'object') {
        const obj = dataPayload as Record<string, unknown>;
        payloadObj.rowData = obj;
        if (obj.searchKey !== undefined) payloadObj.searchKey = obj.searchKey;
        if (obj.searchCol !== undefined) payloadObj.searchCol = obj.searchCol;
        if (obj.secondaryKey !== undefined) payloadObj.secondaryKey = obj.secondaryKey;
        if (obj.secondaryCol !== undefined) payloadObj.secondaryCol = obj.secondaryCol;
        if (obj.newRow !== undefined) payloadObj.newRow = obj.newRow;
      }

      try {
        // Try server-side proxy route first (bypasses CORS/redirect drops)
        const res = await fetch('/api/sheets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payloadObj),
        });

        if (res.ok) {
          const result = await res.json();
          if (result.success || result.status === 'success') {
            setSyncStatus('synced');
            return;
          }
        }

        // Direct client-side fetch fallback
        await fetch(scriptUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify(payloadObj),
        });
        setSyncStatus('synced');
      } catch {
        try {
          await fetch(scriptUrl, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify(payloadObj),
          });
          setSyncStatus('synced');
        } catch {
          setSyncStatus('error');
        }
      }
    },
    [scriptUrl]
  );

  const refreshFromSheet = useCallback(
    async (forceToast = false) => {
      if (!scriptUrl || !scriptUrl.startsWith('https://script.google.com/')) {
        if (forceToast) showToast('Mode Lokal: Tidak ada URL Sheets valid.', 'info');
        return;
      }

      setIsSyncing(true);
      setSyncStatus('syncing');
      if (forceToast) setLoadingText('Mengunduh Database Cloud...');

      try {
        let data: any = null;

        // Try proxy route first to ensure reliable redirect handling
        try {
          const proxyRes = await fetch(
            `/api/sheets?action=getAll&scriptUrl=${encodeURIComponent(scriptUrl)}`
          );
          if (proxyRes.ok) {
            const json = await proxyRes.json();
            if (json.status === 'success' || json.success) {
              data = json;
            }
          }
        } catch {
          // fallback to direct
        }

        // Direct fetch fallback
        if (!data) {
          const res = await fetch(`${scriptUrl}?action=getAll`);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          data = await res.json();
        }

        if (data && (data.status === 'success' || data.success)) {
          if (data.products && Array.isArray(data.products)) setProducts(data.products);
          if (data.motoris && Array.isArray(data.motoris)) setMotoris(data.motoris);
          if (data.outbound && Array.isArray(data.outbound)) setOutbound(data.outbound);
          if (data.retur && Array.isArray(data.retur)) setRetur(data.retur);
          if (data.inbound && Array.isArray(data.inbound)) setInbound(data.inbound);
          if (data.opname && Array.isArray(data.opname)) setOpname(data.opname);

          setSyncStatus('synced');
          if (forceToast) showToast('Sinkronisasi database Google Sheets berhasil!', 'success');
        } else {
          throw new Error('Format data tidak valid');
        }
      } catch (err: unknown) {
        setSyncStatus('error');
        const msg = err instanceof Error ? err.message : 'Periksa hak akses script.';
        if (forceToast) showToast(`Gagal mengambil data dari Google Sheets: ${msg}`, 'error');
      } finally {
        setIsSyncing(false);
        setLoadingText(null);
      }
    },
    [scriptUrl, showToast]
  );

  const handleTestPing = useCallback(async () => {
    if (!scriptUrl || !scriptUrl.startsWith('https://script.google.com/')) {
      showToast('URL tidak valid. Harus dari script.google.com', 'error');
      return;
    }
    setLoadingText('Tes Koneksi ke Google Sheets...');
    try {
      let data: any = null;
      try {
        const proxyRes = await fetch(
          `/api/sheets?action=ping&scriptUrl=${encodeURIComponent(scriptUrl)}`
        );
        if (proxyRes.ok) {
          data = await proxyRes.json();
        }
      } catch {
        // fallback
      }

      if (!data) {
        const res = await fetch(`${scriptUrl}?action=ping`);
        if (res.ok) {
          data = await res.json();
        }
      }

      if (data && (data.status === 'success' || data.success)) {
        const ssName = data.spreadsheetName ? ` (${data.spreadsheetName})` : '';
        showToast(`Koneksi berhasil! Terhubung ke Google Sheets${ssName}`, 'success');
        setSyncStatus('synced');
      } else {
        throw new Error(data?.error || 'Koneksi ditolak');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Pastikan opsi "Who has access: Anyone"';
      showToast(`Gagal terhubung: ${msg}`, 'error');
      setSyncStatus('error');
    } finally {
      setLoadingText(null);
    }
  }, [scriptUrl, showToast]);

  const handleInitSheets = useCallback(async () => {
    if (!scriptUrl || !scriptUrl.startsWith('https://script.google.com/')) {
      showToast('Masukkan URL Google Apps Script yang valid terlebih dahulu.', 'error');
      return;
    }
    setLoadingText('Menyiapkan format tabel di Google Sheets...');
    try {
      const res = await fetch('/api/sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scriptUrl,
          action: 'initSheets',
        }),
      });
      const data = await res.json();
      if (data.success || data.status === 'success') {
        showToast('Format seluruh 6 sheet berhasil disiapkan di spreadsheet Google Anda!', 'success');
        setSyncStatus('synced');
      } else {
        throw new Error(data.error || 'Gagal inisialisasi sheet');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Periksa hak akses script';
      showToast(`Gagal menyiapkan sheet: ${msg}`, 'error');
    } finally {
      setLoadingText(null);
    }
  }, [scriptUrl, showToast]);

  const handleSyncAllToSheet = useCallback(async () => {
    if (!scriptUrl || !scriptUrl.startsWith('https://script.google.com/')) {
      showToast('Masukkan URL Google Apps Script yang valid terlebih dahulu.', 'error');
      return;
    }
    setLoadingText('Mengunggah seluruh database lokal ke Google Sheets...');
    try {
      const res = await fetch('/api/sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scriptUrl,
          action: 'syncAll',
          products,
          motoris,
          outbound,
          retur,
          inbound,
          opname,
        }),
      });
      const data = await res.json();
      if (data.success || data.status === 'success') {
        showToast('Seluruh data master & transaksi berhasil disinkronkan ke Google Sheets!', 'success');
        setSyncStatus('synced');
      } else {
        throw new Error(data.error || 'Gagal sinkronisasi data');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Koneksi terputus';
      showToast(`Gagal mengunggah data: ${msg}`, 'error');
    } finally {
      setLoadingText(null);
    }
  }, [scriptUrl, products, motoris, outbound, retur, inbound, opname, showToast]);

  const handleSaveScriptUrl = useCallback(
    (newUrl: string) => {
      setScriptUrl(newUrl);
      localStorage.setItem('mahameru_script_url', newUrl);
      if (newUrl) {
        setSyncStatus('synced');
        showToast('URL Endpoint berhasil disimpan.', 'success');
      } else {
        setSyncStatus('demo');
        showToast('Kembali ke Mode Lokal.', 'info');
      }
      setSettingsOpen(false);
    },
    [showToast]
  );

  // Stock calculations for active date (Dashboard)
  const dashboardStockCalcs: StockCalculation[] = useMemo(() => {
    return products
      .map((p) =>
        calculateStockForProduct(
          p.sku,
          products,
          inbound,
          outbound,
          retur,
          opname,
          activeDate,
          activeDate
        )
      )
      .filter((c): c is StockCalculation => c !== null);
  }, [products, inbound, outbound, retur, opname, activeDate]);

  // Stock calculations for real-time overall stock (for Auto-PO and forms)
  const realTimeStockCalcs: StockCalculation[] = useMemo(() => {
    return products
      .map((p) => calculateStockForProduct(p.sku, products, inbound, outbound, retur, opname))
      .filter((c): c is StockCalculation => c !== null);
  }, [products, inbound, outbound, retur, opname]);

  const autoPOItems = useMemo(() => {
    return realTimeStockCalcs.filter((c) => c.status === 'ORDER');
  }, [realTimeStockCalcs]);

  const orderBadgeCount = autoPOItems.length;

  const dailySummary = useMemo(() => {
    return calculateDailySummary(outbound, retur, inbound, activeDate);
  }, [outbound, retur, inbound, activeDate]);

  // Master Data Actions
  const handleAddProduct = (newProd: Product) => {
    if (products.some((p) => p.sku === newProd.sku)) {
      showToast(`SKU ${newProd.sku} sudah terdaftar!`, 'error');
      return;
    }
    setProducts((prev) => [...prev, newProd]);
    silentSyncPush('appendRow', 'Master_Produk', newProd);
    showToast(`Produk ${newProd.sku} berhasil ditambahkan.`, 'success');
  };

  const handleDeleteProduct = (skuToDelete: string) => {
    setProducts((prev) => prev.filter((p) => p.sku !== skuToDelete));
    silentSyncPush('deleteRow', 'Master_Produk', { searchCol: 0, searchKey: skuToDelete });
    showToast(`Produk ${skuToDelete} berhasil dihapus.`, 'success');
  };

  const handleUpdateProduct = (updatedProd: Product) => {
    setProducts((prev) => prev.map((p) => (p.sku === updatedProd.sku ? updatedProd : p)));
    silentSyncPush('updateRow', 'Master_Produk', {
      searchCol: 0,
      searchKey: updatedProd.sku,
      newRow: updatedProd,
    });
    showToast(`Produk ${updatedProd.sku} berhasil diperbarui.`, 'success');
  };

  const handleAddMotoris = (newMot: Motoris) => {
    if (motoris.some((m) => m.id === newMot.id)) {
      showToast(`ID ${newMot.id} sudah terdaftar!`, 'error');
      return;
    }
    setMotoris((prev) => [...prev, newMot]);
    silentSyncPush('appendRow', 'Master_Motoris', newMot);
    showToast(`Motoris ${newMot.id} berhasil ditambahkan.`, 'success');
  };

  const handleDeleteMotoris = (idToDelete: string) => {
    setMotoris((prev) => prev.filter((m) => m.id !== idToDelete));
    silentSyncPush('deleteRow', 'Master_Motoris', { searchCol: 0, searchKey: idToDelete });
    showToast(`Motoris ${idToDelete} berhasil dihapus.`, 'success');
  };

  const handleUpdateMotoris = (updatedMot: Motoris) => {
    setMotoris((prev) => prev.map((m) => (m.id === updatedMot.id ? updatedMot : m)));
    silentSyncPush('updateRow', 'Master_Motoris', {
      searchCol: 0,
      searchKey: updatedMot.id,
      newRow: updatedMot,
    });
    showToast(`Motoris ${updatedMot.id} berhasil diperbarui.`, 'success');
  };

  // Transaction Operations
  const handleSaveOutbound = (records: OutboundRecord[]) => {
    setOutbound((prev) => [...prev, ...records]);
    silentSyncPush('appendRows', 'Barang_Keluar', records);
    showToast(`Sukses mencatat ${records.length} item muatan.`, 'success');
  };

  const handleDeleteOutbound = (index: number, noJalan: string) => {
    const target = outbound[index];
    setOutbound((prev) => prev.filter((_, i) => i !== index));
    silentSyncPush('deleteRow', 'Barang_Keluar', {
      searchCol: 1,
      searchKey: noJalan,
      secondaryCol: 3,
      secondaryKey: target?.sku,
    });
    showToast('Transaksi muatan berhasil dihapus.', 'success');
  };

  const handleSaveRetur = (records: ReturRecord[]) => {
    setRetur((prev) => [...prev, ...records]);
    silentSyncPush('appendRows', 'Retur', records);
    showToast(`Sukses mencatat ${records.length} item balikan.`, 'success');
  };

  const handleDeleteRetur = (index: number, noRetur: string) => {
    const target = retur[index];
    setRetur((prev) => prev.filter((_, i) => i !== index));
    silentSyncPush('deleteRow', 'Retur', {
      searchCol: 1,
      searchKey: noRetur,
      secondaryCol: 3,
      secondaryKey: target?.sku,
    });
    showToast('Transaksi balikan berhasil dihapus.', 'success');
  };

  const handleSaveInbound = (records: InboundRecord[]) => {
    setInbound((prev) => [...prev, ...records]);
    silentSyncPush('appendRows', 'Barang_Masuk', records);
    showToast(`Penerimaan DO ${records[0]?.noBukti || ''} berhasil disimpan.`, 'success');
  };

  const handleDeleteInbound = (index: number, noBukti: string) => {
    const target = inbound[index];
    setInbound((prev) => prev.filter((_, i) => i !== index));
    silentSyncPush('deleteRow', 'Barang_Masuk', {
      searchCol: 1,
      searchKey: noBukti,
      secondaryCol: 4,
      secondaryKey: target?.sku,
    });
    showToast('Transaksi penerimaan berhasil dihapus.', 'success');
  };

  const handleSaveOpname = (record: OpnameRecord) => {
    setOpname((prev) => [...prev, record]);
    silentSyncPush('appendRow', 'Cek_Fisik', record);
    showToast(`Audit SKU ${record.sku} tersimpan (Selisih: ${record.selisih})`, 'success');
  };

  const handleDeleteOpname = (index: number, sku: string) => {
    const target = opname[index];
    setOpname((prev) => prev.filter((_, i) => i !== index));
    silentSyncPush('deleteRow', 'Cek_Fisik', {
      searchCol: 1,
      searchKey: sku,
      secondaryCol: 0,
      secondaryKey: target?.tanggal,
    });
    showToast('Histori audit fisik berhasil dihapus.', 'success');
  };

  // Slip Printing
  const handleOpenPrintSlip = (type: 'outbound' | 'retur', docId: string) => {
    setPrintSlip({ open: true, type, docId });
  };

  // Kartu Stok
  const kartuStokData = useMemo(() => {
    if (!selectedKartuSku) return null;
    return getKartuStok(
      selectedKartuSku,
      products,
      inbound,
      outbound,
      retur,
      opname,
      (id) => motoris.find((m) => m.id === id)?.nama || id
    );
  }, [selectedKartuSku, products, inbound, outbound, retur, opname, motoris]);

  // Backup & Restore
  const handleExportBackup = () => {
    exportBackupJSON({
      products,
      motoris,
      outbound,
      retur,
      inbound,
      opname,
    });
    showToast('Cadangan JSON berhasil diunduh.', 'success');
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        if (parsed.products && Array.isArray(parsed.products)) setProducts(parsed.products);
        if (parsed.motoris && Array.isArray(parsed.motoris)) setMotoris(parsed.motoris);
        if (parsed.outbound && Array.isArray(parsed.outbound)) setOutbound(parsed.outbound);
        if (parsed.retur && Array.isArray(parsed.retur)) setRetur(parsed.retur);
        if (parsed.inbound && Array.isArray(parsed.inbound)) setInbound(parsed.inbound);
        if (parsed.opname && Array.isArray(parsed.opname)) setOpname(parsed.opname);

        showToast('Database berhasil dipulihkan dari file JSON.', 'success');
      } catch {
        showToast('Format file backup JSON tidak valid!', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col antialiased text-slate-800">
      {/* Toast Notification */}
      <div
        className={`fixed bottom-5 right-5 z-[120] transform transition-all duration-300 no-print ${
          toast.show ? 'translate-y-0 opacity-100' : 'translate-y-24 opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center space-x-3 px-4 py-3 rounded-lg shadow-xl text-sm font-medium border bg-white border-slate-200 text-slate-800">
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          ) : toast.type === 'error' ? (
            <AlertCircle className="w-5 h-5 text-rose-500" />
          ) : (
            <Info className="w-5 h-5 text-[#c29b38]" />
          )}
          <span>{toast.message}</span>
        </div>
      </div>

      {/* Loading Overlay */}
      {loadingText && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-900/50 backdrop-blur-xs no-print">
          <div className="bg-white p-5 rounded-2xl shadow-2xl flex flex-col items-center">
            <Loader2 className="w-8 h-8 text-[#c29b38] animate-spin mb-3" />
            <span className="text-xs font-bold text-slate-700">{loadingText}</span>
          </div>
        </div>
      )}

      {/* Header & Navbar */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        syncStatus={syncStatus}
        isSyncing={isSyncing}
        orderBadgeCount={orderBadgeCount}
        onRefresh={() => refreshFromSheet(true)}
        onOpenAutoPO={() => setAutoPOOpen(true)}
        onOpenMaster={() => setMasterDataOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'tabDashboard' && (
          <DashboardTab
            activeDate={activeDate}
            onChangeDate={setActiveDate}
            onSetToday={() => setActiveDate(getTodayDateString())}
            stockCalcs={dashboardStockCalcs}
            totalLoadingToday={dailySummary.totalLoading}
            totalTerjualToday={dailySummary.totalTerjual}
            onNavigateTab={setActiveTab}
            onOpenKartuStok={(sku) => setSelectedKartuSku(sku)}
          />
        )}

        {activeTab === 'tabOutbound' && (
          <OutboundTab
            products={products}
            motoris={motoris}
            outboundRecords={outbound}
            stockCalcs={realTimeStockCalcs}
            activeDate={activeDate}
            onSaveOutbound={handleSaveOutbound}
            onDeleteRecord={handleDeleteOutbound}
            onPrintSlip={(noJalan) => handleOpenPrintSlip('outbound', noJalan)}
            onRequestConfirm={requestConfirm}
          />
        )}

        {activeTab === 'tabRetur' && (
          <ReturTab
            products={products}
            motoris={motoris}
            returRecords={retur}
            outboundRecords={outbound}
            activeDate={activeDate}
            onSaveRetur={handleSaveRetur}
            onDeleteRecord={handleDeleteRetur}
            onPrintSlip={(noRetur) => handleOpenPrintSlip('retur', noRetur)}
            onRequestConfirm={requestConfirm}
          />
        )}

        {activeTab === 'tabInbound' && (
          <InboundTab
            products={products}
            inboundRecords={inbound}
            activeDate={activeDate}
            onSaveInbound={handleSaveInbound}
            onDeleteRecord={handleDeleteInbound}
            onRequestConfirm={requestConfirm}
          />
        )}

        {activeTab === 'tabOpname' && (
          <OpnameTab
            products={products}
            opnameRecords={opname}
            stockCalcs={realTimeStockCalcs}
            activeDate={activeDate}
            onSaveOpname={handleSaveOpname}
            onDeleteRecord={handleDeleteOpname}
            onRequestConfirm={requestConfirm}
          />
        )}

        {activeTab === 'tabLaporan' && (
          <ReportTab
            products={products}
            motoris={motoris}
            outboundRecords={outbound}
            returRecords={retur}
            inboundRecords={inbound}
            opnameRecords={opname}
            onOpenKartuStok={(sku) => setSelectedKartuSku(sku)}
            onShowToast={showToast}
          />
        )}
      </main>

      {/* Modals */}
      <MasterDataModal
        isOpen={masterDataOpen}
        onClose={() => setMasterDataOpen(false)}
        products={products}
        motoris={motoris}
        onAddProduct={handleAddProduct}
        onUpdateProduct={handleUpdateProduct}
        onDeleteProduct={handleDeleteProduct}
        onAddMotoris={handleAddMotoris}
        onUpdateMotoris={handleUpdateMotoris}
        onDeleteMotoris={handleDeleteMotoris}
        onRequestConfirm={requestConfirm}
      />

      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        scriptUrl={scriptUrl}
        onSaveUrl={handleSaveScriptUrl}
        onTestPing={handleTestPing}
        onForceDownload={() => refreshFromSheet(true)}
        onSyncAllToSheet={handleSyncAllToSheet}
        onInitSheets={handleInitSheets}
        onExportBackup={handleExportBackup}
        onImportBackup={handleImportBackup}
        onRequestConfirm={requestConfirm}
      />

      <AutoPOModal
        isOpen={autoPOOpen}
        onClose={() => setAutoPOOpen(false)}
        orderItems={autoPOItems}
        onShowToast={showToast}
      />

      <KartuStokModal
        isOpen={!!selectedKartuSku}
        onClose={() => setSelectedKartuSku(null)}
        data={kartuStokData}
      />

      <PrintSlipModal
        isOpen={printSlip.open}
        onClose={() => setPrintSlip({ open: false, type: 'outbound', docId: '' })}
        type={printSlip.type}
        docId={printSlip.docId}
        outbounds={outbound}
        returs={retur}
        products={products}
        motoris={motoris}
      />

      <ConfirmModal
        isOpen={confirmModal.open}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, open: false }))}
      />
    </div>
  );
}
