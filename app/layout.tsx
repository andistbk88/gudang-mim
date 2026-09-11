import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'PT Mahameru Insan Mandiri - Inventory & Stock Movement System',
  description: 'Sistem manajemen stok, mutasi harian, loading pagi motoris, balikan retur, inbound pasokan, dan audit opname PT Mahameru Insan Mandiri.',
  openGraph: {
    title: 'PT Mahameru Insan Mandiri - Inventory & Stock Movement System',
    description: 'Sistem manajemen stok, mutasi harian, loading pagi motoris, balikan retur, inbound pasokan, dan audit opname PT Mahameru Insan Mandiri.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PT Mahameru Insan Mandiri - Inventory & Stock Movement System',
    description: 'Sistem manajemen stok, mutasi harian, loading pagi motoris, balikan retur, inbound pasokan, dan audit opname PT Mahameru Insan Mandiri.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
