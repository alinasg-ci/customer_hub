'use client';

import { AuthGuard } from '@/shared/ui/AuthGuard';
import { ErrorBoundary } from '@/shared/ui/ErrorBoundary';
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
        <main className="flex-1 overflow-y-auto bg-slate-50 p-8">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </main>
      </div>
    </AuthGuard>
  );
}
