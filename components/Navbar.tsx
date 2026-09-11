'use client';

import React from 'react';
import {
  LayoutDashboard,
  Truck,
  RotateCcw,
  ArrowDownToDot,
  ClipboardCheck,
  BarChart3,
  RefreshCw,
  ShoppingCart,
  Database,
  Settings,
} from 'lucide-react';
import { ActiveTab } from '@/types/inventory';

interface NavbarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  syncStatus: 'demo' | 'syncing' | 'synced' | 'error';
  isSyncing: boolean;
  orderBadgeCount: number;
  onRefresh: () => void;
  onOpenAutoPO: () => void;
  onOpenMaster: () => void;
  onOpenSettings: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  syncStatus,
  isSyncing,
  orderBadgeCount,
  onRefresh,
  onOpenAutoPO,
  onOpenMaster,
  onOpenSettings,
}) => {
  const getSyncBadge = () => {
    switch (syncStatus) {
      case 'synced':
        return (
          <span
            suppressHydrationWarning
            className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
          >
            <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Terhubung Sheets
          </span>
        );
      case 'syncing':
        return (
          <span
            suppressHydrationWarning
            className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30"
          >
            <RefreshCw className="w-2.5 h-2.5 mr-1 animate-spin text-blue-400" />
            Menyinkronkan...
          </span>
        );
      case 'error':
        return (
          <span
            suppressHydrationWarning
            className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30"
          >
            <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-rose-400"></span>
            Offline / Error
          </span>
        );
      default:
        return (
          <span
            suppressHydrationWarning
            className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/50"
          >
            <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-amber-400"></span>
            Mode Lokal
          </span>
        );
    }
  };

  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode; colorClass: string }[] = [
    {
      id: 'tabDashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-4 h-4 text-[#c29b38]" />,
      colorClass: 'text-[#c29b38]',
    },
    {
      id: 'tabOutbound',
      label: 'Loading Pagi',
      icon: <Truck className="w-4 h-4 text-amber-400" />,
      colorClass: 'text-amber-400',
    },
    {
      id: 'tabRetur',
      label: 'Balikan Sore',
      icon: <RotateCcw className="w-4 h-4 text-emerald-400" />,
      colorClass: 'text-emerald-400',
    },
    {
      id: 'tabInbound',
      label: 'Barang Masuk',
      icon: <ArrowDownToDot className="w-4 h-4 text-blue-400" />,
      colorClass: 'text-blue-400',
    },
    {
      id: 'tabOpname',
      label: 'Audit Fisik',
      icon: <ClipboardCheck className="w-4 h-4 text-purple-400" />,
      colorClass: 'text-purple-400',
    },
    {
      id: 'tabLaporan',
      label: 'Laporan Stok',
      icon: <BarChart3 className="w-4 h-4 text-[#dfb753]" />,
      colorClass: 'text-[#dfb753]',
    },
  ];

  return (
    <header className="bg-[#0b1e36] text-white sticky top-0 z-40 border-b-2 border-[#c29b38] shadow-md no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Brand Logo & Name */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="flex items-center justify-center h-10 w-12 sm:h-12 sm:w-14 bg-[#071526] border border-[#c29b38] rounded-xl shadow-sm text-[#c29b38] font-black text-sm tracking-wider">
              MIM
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-extrabold tracking-wider text-white uppercase leading-tight">
                  PT. Mahameru
                </h1>
                {getSyncBadge()}
              </div>
              <p className="text-[10px] sm:text-xs text-[#dfb753] font-medium">
                Stock Movement & Distribution System
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <button
              type="button"
              onClick={onRefresh}
              disabled={isSyncing}
              title="Sinkronisasi Data"
              className="p-2 sm:px-3 sm:py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center transition active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 sm:mr-1.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Sync Data</span>
            </button>

            <button
              type="button"
              onClick={onOpenAutoPO}
              title="Saran Order Kritis"
              className={`p-2 sm:px-3 sm:py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center transition shadow-xs active:scale-95 cursor-pointer ${
                orderBadgeCount > 0 ? 'ring-2 ring-rose-400/40' : ''
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5 sm:mr-1.5" />
              <span className="hidden sm:inline">
                Auto-PO ({orderBadgeCount})
              </span>
              <span className="sm:hidden ml-1 font-bold text-[10px]">{orderBadgeCount}</span>
            </button>

            <button
              type="button"
              onClick={onOpenMaster}
              title="Master Data"
              className="p-2 sm:px-3 sm:py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold flex items-center transition active:scale-95 cursor-pointer"
            >
              <Database className="w-3.5 h-3.5 sm:mr-1.5" />
              <span className="hidden sm:inline">Master Data</span>
            </button>

            <button
              type="button"
              onClick={onOpenSettings}
              title="Pengaturan & URL Endpoint"
              className="p-2 sm:px-3 sm:py-2 rounded-lg bg-[#c29b38] hover:bg-[#dfb753] text-[#0b1e36] font-bold text-xs flex items-center transition shadow-xs active:scale-95 cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5 sm:mr-1.5" />
              <span className="hidden sm:inline">Setup</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Sub-bar */}
      <div className="bg-[#071526] border-t border-[#163155] px-4 overflow-x-auto">
        <div className="max-w-7xl mx-auto flex space-x-1 sm:space-x-2 py-2">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-2 transition whitespace-nowrap active:scale-95 cursor-pointer ${
                  isActive
                    ? 'text-[#dfb753] bg-[#0b1e36] border-b-2 border-[#c29b38] shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-[#163155]/60'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
