export interface Product {
  sku: string;
  nama: string;
  kategori: string;
  satuan: string;
  stokAwal: number;
  batasMin: number;
}

export interface Motoris {
  id: string;
  nama: string;
  area: string;
}

export interface OutboundRecord {
  tanggal: string;
  noJalan: string;
  idMotoris: string;
  sku: string;
  qty: number;
  ket?: string;
}

export interface ReturRecord {
  tanggal: string;
  noRetur: string;
  idMotoris: string;
  sku: string;
  qty: number;
  kondisi: 'Barang Bagus' | 'Barang Rusak' | string;
  ket?: string;
}

export interface InboundRecord {
  tanggal: string;
  noBukti: string;
  batchNo?: string;
  expDate?: string;
  sku: string;
  qty: number;
}

export interface OpnameRecord {
  tanggal: string;
  sku: string;
  stokSistem: number;
  stokFisik: number;
  selisih: number;
  ket?: string;
}

export interface OutboundCartItem {
  sku: string;
  nama: string;
  satuan: string;
  qty: number;
  ket?: string;
}

export interface ReturCartItem {
  sku: string;
  nama: string;
  satuan: string;
  qty: number;
  kondisi: string;
  ket?: string;
}

export interface InboundCartItem {
  sku: string;
  nama: string;
  satuan: string;
  qty: number;
  batchNo: string;
  expDate: string;
}

export interface StockCalculation {
  sku: string;
  nama: string;
  kategori: string;
  satuan: string;
  min: number;
  stokAwal: number;
  stokAwalPeriode: number;
  stokAkhirPeriode: number;
  stokTersediaSaatIni: number;
  in: number;
  out: number;
  retBagus: number;
  retRusak: number;
  opname: number;
  terjual: number;
  akhir: number;
  defisit: number;
  status: 'AMAN' | 'ORDER';
}

export interface KartuStokRow {
  tanggal: string;
  jenis: string;
  keterangan: string;
  in: number;
  out: number;
  saldo: number;
  colorClass: string;
}

export type ActiveTab = 'tabDashboard' | 'tabOutbound' | 'tabRetur' | 'tabInbound' | 'tabOpname' | 'tabLaporan';

export type PrintDocType = 'outbound' | 'retur' | 'inbound' | 'opname';
