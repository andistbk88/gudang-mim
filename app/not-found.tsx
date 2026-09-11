import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50 text-slate-800">
      <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm text-center max-w-md">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">404 - Halaman Tidak Ditemukan</h2>
        <p className="text-slate-600 mb-6 text-sm">Halaman yang Anda tuju tidak tersedia.</p>
        <Link
          href="/"
          className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-sm transition"
        >
          Kembali ke Dashboard
        </Link>
      </div>
    </div>
  );
}
