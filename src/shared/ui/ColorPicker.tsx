'use client';

import { useState, useRef, useEffect } from 'react';

type ColorPickerProps = {
  readonly value: string | null;
  readonly onChange: (color: string | null) => void;
};

const PALETTE = [
  '#fc7981', '#fbbd41', '#84e7a5', '#078a52',
  '#3bd3fd', '#c1b0ff', '#43089f', '#9f9b93',
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
        className="flex h-5 w-5 items-center justify-center rounded-md border border-oat-300 transition-colors hover:border-oat-400"
        style={value ? { backgroundColor: value, borderColor: value } : undefined}
        aria-label="Pick color"
        title="Pick color"
      >
        {!value && (
          <svg className="h-3 w-3 text-oat-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
          </svg>
        )}
      </button>

      {open && (
        <div className="clay-card-sm absolute left-0 top-7 z-10 p-2.5">
          <div className="grid grid-cols-4 gap-1.5">
            {PALETTE.map((color) => (
              <button
                key={color}
                onClick={() => {
                  onChange(color);
                  setOpen(false);
                }}
                className={`h-6 w-6 rounded-md transition-transform hover:scale-110 ${value === color ? 'ring-2 ring-matcha-600 ring-offset-1' : ''}`}
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
              className="mt-2 w-full rounded-md px-2 py-0.5 text-xs text-charcoal-500 transition-colors hover:bg-oat-100"
            >
              Clear
            </button>
          )}
        </div>
      )}
    </div>
  );
}
