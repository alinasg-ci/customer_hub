import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Client Hub',
  description: 'Central hub for managing freelance client work',
};

export default function RootLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        {children}
      </body>
    </html>
  );
}
