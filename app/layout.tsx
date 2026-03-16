import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Kreativa ERP – Superadmin Panel',
  description: 'Multi-tenant School Management & Tuition Billing System',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className="antialiased">{children}</body>
    </html>
  );
}
