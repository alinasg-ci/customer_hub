'use client';

import { useState, useRef, useEffect } from 'react';

type PlanningRowEditorProps = {
  readonly value: string;
  readonly placeholder?: string;
  readonly multiline?: boolean;
  readonly className?: string;
  readonly onSave: (value: string) => void;
};

export function PlanningRowEditor({
  value,
  placeholder,
  multiline = false,
  className = '',
  onSave,
}: PlanningRowEditorProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
    }
  }, [editing]);

  const handleBlur = () => {
    setEditing(false);
    const trimmed = draft.trim();
    if (trimmed !== value) {
      onSave(trimmed);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault();
      (e.target as HTMLElement).blur();
    }
    if (e.key === 'Escape') {
      setDraft(value);
      setEditing(false);
    }
  };

  if (!editing) {
    return (
      <span
        className={`cursor-text rounded px-1 py-0.5 hover:bg-gray-100 ${className} ${!value ? 'text-gray-400 italic' : ''}`}
        onClick={() => setEditing(true)}
      >
        {value || placeholder || 'Click to edit'}
      </span>
    );
  }

  if (multiline) {
    return (
      <textarea
        ref={inputRef as React.RefObject<HTMLTextAreaElement>}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`w-full rounded border border-blue-300 px-1 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${className}`}
        rows={2}
      />
    );
  }

  return (
    <input
      ref={inputRef as React.RefObject<HTMLInputElement>}
      type="text"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      className={`w-full rounded border border-blue-300 px-1 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${className}`}
    />
  );
}
