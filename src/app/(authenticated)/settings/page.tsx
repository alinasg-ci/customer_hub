'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/shared/hooks/useAuth';
import { TogglSetup } from '@/modules/time-tracking';
import { supabase } from '@/shared/hooks/useSupabase';
import type { Project } from '@/modules/projects';

export default function SettingsPage() {
  const { signOut } = useAuth();
  const [allProjects, setAllProjects] = useState<readonly Project[]>([]);

  useEffect(() => {
    async function loadProjects() {
      const { data } = await supabase
        .from('projects')
        .select('*')
        .order('name');
      setAllProjects((data as Project[]) ?? []);
    }
    loadProjects();
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">Manage integrations and account preferences</p>
      </div>
      <div className="space-y-8">
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <TogglSetup hubProjects={allProjects} />
        </section>
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-base font-semibold text-slate-900">Account</h2>
          <p className="mt-1 text-sm text-slate-500">Sign out of your workspace</p>
          <button
            onClick={() => signOut()}
            className="mt-4 rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
          >
            Sign out
          </button>
        </section>
      </div>
    </div>
  );
}
