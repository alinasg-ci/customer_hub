'use client';

import { AuthGuard } from '@/shared/ui/AuthGuard';
import { Sidebar } from '@/shared/ui/Sidebar';

export default function AuthenticatedLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
