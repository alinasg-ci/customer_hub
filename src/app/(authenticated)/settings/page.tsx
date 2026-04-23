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
      {/* Hero */}
      <section className="relative mb-8">
        <div className="clay-label">WORKSPACE · CONFIG</div>
        <h1
          className="my-2 font-semibold text-black"
          style={{
            fontSize: 'clamp(44px, 6vw, 72px)',
            lineHeight: 0.98,
            letterSpacing: '-0.03em',
            fontFeatureSettings: '"ss01","ss03"',
          }}
        >
          <em className="not-italic text-lemon-700">Settings</em>.
        </h1>
        <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-charcoal-500">
          Integrations and account preferences — connect Toggl, manage your session.
        </p>
      </section>

      <div className="space-y-6">
        <section className="clay-card-static overflow-hidden">
          <div className="h-[6px] bg-matcha-500" />
          <div className="p-5">
            <TogglSetup hubProjects={allProjects} />
          </div>
        </section>
        <section className="clay-card-static overflow-hidden">
          <div className="h-[6px] bg-pomegranate-400" />
          <div className="p-5">
            <h2 className="text-base font-semibold text-black">Account</h2>
            <p className="mt-1 text-sm text-charcoal-500">Sign out of your workspace</p>
            <button
              onClick={() => signOut()}
              className="clay-btn clay-btn-danger mt-4 text-sm"
            >
              Sign out
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
