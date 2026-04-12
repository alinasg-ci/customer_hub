'use client';

import { useState, useCallback } from 'react';
import type { ViewMode, DisplayMode } from '../types';

export function useCalendarState() {
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [displayMode, setDisplayMode] = useState<DisplayMode>('calendar');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [hourHeight, setHourHeight] = useState(48);

  const goToToday = useCallback(() => setCurrentDate(new Date()), []);

  const goForward = useCallback(() => {
    setCurrentDate((d) => {
      const next = new Date(d);
      if (viewMode === 'day') next.setDate(d.getDate() + 1);
      else if (viewMode === 'week') next.setDate(d.getDate() + 7);
      else next.setMonth(d.getMonth() + 1);
      return next;
    });
  }, [viewMode]);

  const goBack = useCallback(() => {
    setCurrentDate((d) => {
      const prev = new Date(d);
      if (viewMode === 'day') prev.setDate(d.getDate() - 1);
      else if (viewMode === 'week') prev.setDate(d.getDate() - 7);
      else prev.setMonth(d.getMonth() - 1);
      return prev;
    });
  }, [viewMode]);

  const zoomIn = useCallback(() => setHourHeight((h) => Math.min(80, h + 8)), []);
  const zoomOut = useCallback(() => setHourHeight((h) => Math.max(20, h - 8)), []);

  const goToDay = useCallback((date: Date) => {
    setCurrentDate(date);
    setViewMode('day');
  }, []);

  return {
    viewMode, setViewMode,
    displayMode, setDisplayMode,
    currentDate, goToToday, goForward, goBack, goToDay,
    hourHeight, zoomIn, zoomOut,
  };
}
