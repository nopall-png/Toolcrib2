import type { Metadata } from 'next';
import { AppProvider } from '@/src/lib/store';
import './globals.css';

export const metadata: Metadata = {
  title: 'Toolcrib Request & Inventory System',
  description: 'Sistem pengajuan dan manajemen barang/alat Toolcrib & Procurement',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900" suppressHydrationWarning>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
