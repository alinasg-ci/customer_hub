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
    <div className="py-6">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
      <div className="mt-6 space-y-8">
        <section>
          <TogglSetup hubProjects={allProjects} />
        </section>
        <section>
          <h2 className="text-lg font-semibold text-gray-800">Account</h2>
          <button
            onClick={() => signOut()}
            className="mt-2 rounded-md bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
          >
            Sign out
          </button>
        </section>
      </div>
    </div>
  );
}
