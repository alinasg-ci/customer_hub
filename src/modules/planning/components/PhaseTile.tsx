'use client';

import { useState, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/shared/utils/cn';
import type { Phase, PlanningLayer, UpdatePhaseInput } from '../types';

type PhaseTileProps = {
  readonly phase: Phase;
  readonly layer: PlanningLayer;
  readonly onUpdate: (id: string, input: UpdatePhaseInput) => void;
  readonly onDelete: (id: string) => void;
};

export function PhaseTile({ phase, layer, onUpdate, onDelete }: PhaseTileProps) {
  const [editingName, setEditingName] = useState(false);
  const [editingHours, setEditingHours] = useState(false);
  const [nameValue, setNameValue] = useState(phase.name);
  const [hoursValue, setHoursValue] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);
  const hoursInputRef = useRef<HTMLInputElement>(null);

  const hours = layer === 'client' ? phase.quoted_hours : phase.internal_planned_hours;
  const overBudget = layer === 'internal' && phase.internal_planned_hours > phase.quoted_hours;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: phase.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  useEffect(() => {
    if (editingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [editingName]);

  useEffect(() => {
    if (editingHours && hoursInputRef.current) {
      hoursInputRef.current.focus();
      hoursInputRef.current.select();
    }
  }, [editingHours]);

  function handleNameSave() {
    setEditingName(false);
    const trimmed = nameValue.trim();
    if (trimmed && trimmed !== phase.name) {
      onUpdate(phase.id, { name: trimmed });
    } else {
      setNameValue(phase.name);
    }
  }

  function handleHoursSave() {
    setEditingHours(false);
    const parsed = parseFloat(hoursValue);
    if (!isNaN(parsed) && parsed >= 0) {
      const field = layer === 'client' ? 'quoted_hours' : 'internal_planned_hours';
      if (parsed !== hours) {
        onUpdate(phase.id, { [field]: parsed });
      }
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group flex items-center gap-3 rounded-lg border bg-white px-3 py-2.5 shadow-sm transition-shadow',
        isDragging && 'opacity-50 shadow-lg',
        overBudget && 'border-red-300 bg-red-50'
      )}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab touch-none text-gray-300 hover:text-gray-500 active:cursor-grabbing"
        aria-label="Drag to reorder"
      >
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
        </svg>
      </button>

      {/* Phase name (inline editable) */}
      <div className="min-w-0 flex-1">
        {editingName ? (
          <input
            ref={nameInputRef}
            type="text"
            value={nameValue}
            onChange={(e) => setNameValue(e.target.value)}
            onBlur={handleNameSave}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleNameSave();
              if (e.key === 'Escape') {
                setNameValue(phase.name);
                setEditingName(false);
              }
            }}
            className="w-full rounded border border-blue-300 px-2 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        ) : (
          <button
            onClick={() => setEditingName(true)}
            className="w-full truncate text-left text-sm font-medium text-gray-900 hover:text-blue-600"
          >
            {phase.name}
          </button>
        )}
      </div>

      {/* Hours (inline editable) */}
      <div className="flex items-center gap-2">
        {editingHours ? (
          <input
            ref={hoursInputRef}
            type="number"
            step="0.5"
            value={hoursValue}
            onChange={(e) => setHoursValue(e.target.value)}
            onBlur={handleHoursSave}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleHoursSave();
              if (e.key === 'Escape') setEditingHours(false);
            }}
            className="w-16 rounded border border-blue-300 px-2 py-0.5 text-right text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        ) : (
          <button
            onClick={() => {
              setHoursValue(String(hours));
              setEditingHours(true);
            }}
            className={cn(
              'min-w-[3rem] rounded px-2 py-0.5 text-right text-sm font-medium hover:bg-gray-100',
              overBudget ? 'text-red-700' : 'text-gray-700'
            )}
          >
            {hours}h
          </button>
        )}

        {overBudget && (
          <span className="text-xs text-red-500" title="Exceeds quoted hours">
            !
          </span>
        )}

        {/* Delete */}
        <button
          onClick={() => onDelete(phase.id)}
          className="ml-1 rounded p-1 text-gray-300 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
          aria-label={`Delete ${phase.name}`}
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
