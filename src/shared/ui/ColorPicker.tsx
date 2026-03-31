'use client';

import { useState, useRef, useEffect } from 'react';

type ColorPickerProps = {
  readonly value: string | null;
  readonly onChange: (color: string | null) => void;
};

const PALETTE = [
  '#EF4444', '#F97316', '#EAB308', '#22C55E',
  '#3B82F6', '#8B5CF6', '#EC4899', '#6B7280',
] as const;

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        onClick={() => setOpen(!open)}
        className="flex h-5 w-5 items-center justify-center rounded border border-gray-300"
        style={value ? { backgroundColor: value, borderColor: value } : undefined}
        aria-label="Pick color"
        title="Pick color"
      >
        {!value && (
          <svg className="h-3 w-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
          </svg>
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-7 z-10 rounded-lg border border-gray-200 bg-white p-2 shadow-lg">
          <div className="grid grid-cols-4 gap-1">
            {PALETTE.map((color) => (
              <button
                key={color}
                onClick={() => {
                  onChange(color);
                  setOpen(false);
                }}
                className={`h-6 w-6 rounded ${value === color ? 'ring-2 ring-blue-500 ring-offset-1' : ''}`}
                style={{ backgroundColor: color }}
                aria-label={color}
              />
            ))}
          </div>
          {value && (
            <button
              onClick={() => {
                onChange(null);
                setOpen(false);
              }}
              className="mt-1.5 w-full rounded px-2 py-0.5 text-xs text-gray-500 hover:bg-gray-100"
            >
              Clear
            </button>
          )}
        </div>
      )}
    </div>
  );
}
