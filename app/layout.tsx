import type { Metadata } from 'next';
import '@fontsource/source-sans-pro/latin-300.css';
import '@fontsource/source-sans-pro/latin-400.css';
import '@fontsource/source-sans-pro/latin-600.css';
import '@fontsource/source-sans-pro/latin-700.css';
import './globals.css';
import DynamicFavicon from '@/components/layout/DynamicFavicon';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: 'Kreativa ERP – Superadmin Panel',
  description: 'Multi-tenant School Management & Tuition Billing System',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className="antialiased">
        <DynamicFavicon />
        <Toaster position="top-right" richColors />
        {children}
      </body>
    </html>
  );
}
