'use client';

import { useState, useCallback } from 'react';
import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { usePlanning } from '../hooks/usePlanning';
import { PhaseTile } from './PhaseTile';
import { ComparisonView } from './ComparisonView';
import { Skeleton } from '@/shared/ui/Skeleton';
import type { PlanningLayer } from '../types';

type PlanningBoardProps = {
  readonly projectId: string;
};

export function PlanningBoard({ projectId }: PlanningBoardProps) {
  const {
    phases,
    loading,
    error,
    add,
    remove,
    reorder,
    debouncedUpdate,
    totalQuotedHours,
    totalInternalHours,
    comparisonRows,
    reload,
  } = usePlanning(projectId);

  const [activeLayer, setActiveLayer] = useState<PlanningLayer | 'comparison'>('client');
  const [addingPhase, setAddingPhase] = useState(false);
  const [newPhaseName, setNewPhaseName] = useState('');

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      reorder(String(active.id), String(over.id));
    }
  }, [reorder]);

  const handleAddPhase = useCallback(async () => {
    if (!newPhaseName.trim()) return;
    await add({
      project_id: projectId,
      name: newPhaseName.trim(),
    });
    setNewPhaseName('');
    setAddingPhase(false);
  }, [add, projectId, newPhaseName]);

  if (loading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-pomegranate-400 bg-pomegranate-300/20 p-4">
        <p className="text-sm text-pomegranate-600">{error}</p>
        <button onClick={reload} className="mt-2 text-sm font-semibold text-pomegranate-600 hover:text-pomegranate-600">
          Try again
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Layer tabs */}
      <div className="mb-4 flex gap-1 rounded-lg bg-oat-200 p-1">
        {([
          { key: 'client' as const, label: 'Client Budget' },
          { key: 'internal' as const, label: 'Internal Plan' },
          { key: 'comparison' as const, label: 'Comparison' },
        ]).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveLayer(key)}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              activeLayer === key
                ? 'bg-white text-black shadow-sm'
                : 'text-charcoal-500 hover:text-charcoal-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Comparison view */}
      {activeLayer === 'comparison' ? (
        <ComparisonView
          rows={comparisonRows}
          totalQuoted={totalQuotedHours}
          totalInternal={totalInternalHours}
        />
      ) : (
        <>
          {/* Totals bar */}
          <div className="mb-3 flex items-center justify-between rounded-lg bg-cream px-3 py-2 text-sm">
            <span className="text-charcoal-500">
              {activeLayer === 'client' ? 'Quoted' : 'Planned'} total:
            </span>
            <span className="font-semibold text-black">
              {activeLayer === 'client' ? totalQuotedHours : totalInternalHours}h
            </span>
          </div>

          {/* Phase tiles with drag-and-drop */}
          {phases.length === 0 ? (
            <p className="py-8 text-center text-sm text-charcoal-300">
              No phases yet. Add your first phase below.
            </p>
          ) : (
            <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={phases.map((p) => p.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {phases.map((phase) => (
                    <PhaseTile
                      key={phase.id}
                      phase={phase}
                      layer={activeLayer}
                      onUpdate={debouncedUpdate}
                      onDelete={remove}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}

          {/* Add phase */}
          {addingPhase ? (
            <div className="mt-3 flex gap-2">
              <input
                type="text"
                placeholder="Phase name"
                value={newPhaseName}
                onChange={(e) => setNewPhaseName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddPhase();
                  if (e.key === 'Escape') setAddingPhase(false);
                }}
                className="flex-1 rounded-lg border border-oat-300 px-3 py-1.5 text-sm focus:border-black focus:outline-none focus:ring-2 focus:ring-black/10"
                autoFocus
              />
              <button
                onClick={handleAddPhase}
                className="rounded-lg bg-black px-3 py-1.5 text-sm text-white hover:bg-charcoal-900"
              >
                Add
              </button>
              <button
                onClick={() => { setAddingPhase(false); setNewPhaseName(''); }}
                className="px-2 text-sm text-charcoal-500 hover:text-charcoal-700"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setAddingPhase(true)}
              className="mt-3 text-sm text-black hover:text-black"
            >
              + Add phase
            </button>
          )}
        </>
      )}
    </div>
  );
}
