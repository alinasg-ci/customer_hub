'use client';

import { AuthGuard } from '@/shared/ui/AuthGuard';
import { ErrorBoundary } from '@/shared/ui/ErrorBoundary';
import { Sidebar } from '@/shared/ui/Sidebar';
import { RecordingProvider, GlobalRecordingIndicator } from '@/modules/recording';

export default function AuthenticatedLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <RecordingProvider>
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 overflow-y-auto bg-cream p-8">
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </main>
          <GlobalRecordingIndicator />
        </div>
      </RecordingProvider>
    </AuthGuard>
  );
}
