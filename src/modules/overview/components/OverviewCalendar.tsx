'use client';

import { useCalendarEntries } from '../hooks/useCalendarEntries';
import { useCalendarState } from '../hooks/useCalendarState';
import { WeekView } from './WeekView';
import { DayView } from './DayView';
import { MonthView } from './MonthView';
import { ListView } from './ListView';
import { formatMonthHeader } from '../utils/calendarHelpers';
import { Skeleton } from '@/shared/ui/Skeleton';
import { cn } from '@/shared/utils/cn';

export function OverviewCalendar() {
  const { entries, clientIds, loading, error } = useCalendarEntries();
  const {
    viewMode, setViewMode,
    displayMode, setDisplayMode,
    currentDate, goToToday, goForward, goBack, goToDay,
    hourHeight, zoomIn, zoomOut,
  } = useCalendarState();

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full rounded-xl" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[12px] border border-pomegranate-400 bg-pomegranate-300/20 p-4">
        <p className="text-sm text-pomegranate-600">{error}</p>
      </div>
    );
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-4 flex items-center justify-between">
        {/* Left: navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={goBack}
            className="rounded-lg border border-oat-300 p-1.5 text-charcoal-500 hover:bg-oat-100"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={goToToday}
            className="rounded-lg border border-oat-300 px-3 py-1.5 text-xs font-medium text-charcoal-500 hover:bg-oat-100"
          >
            Today
          </button>
          <button
            onClick={goForward}
            className="rounded-lg border border-oat-300 p-1.5 text-charcoal-500 hover:bg-oat-100"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <span className="ml-2 text-sm font-semibold text-charcoal-700">
            {formatMonthHeader(currentDate)}
          </span>
        </div>

        {/* Right: view controls */}
        <div className="flex items-center gap-3">
          {/* Zoom (only for calendar views) */}
          {displayMode === 'calendar' && viewMode !== 'month' && (
            <div className="flex items-center gap-1">
              <button
                onClick={zoomOut}
                className="rounded p-1 text-oat-500 hover:bg-oat-100 hover:text-charcoal-500"
                title="Zoom out"
              >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM13.5 10.5h-6" />
                </svg>
              </button>
              <button
                onClick={zoomIn}
                className="rounded p-1 text-oat-500 hover:bg-oat-100 hover:text-charcoal-500"
                title="Zoom in"
              >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" />
                </svg>
              </button>
            </div>
          )}

          {/* Calendar / List toggle */}
          <div className="flex rounded-lg bg-oat-100 p-0.5">
            <button
              onClick={() => setDisplayMode('calendar')}
              className={cn(
                'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                displayMode === 'calendar' ? 'bg-white text-black shadow-sm' : 'text-charcoal-500'
              )}
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
            </button>
            <button
              onClick={() => setDisplayMode('list')}
              className={cn(
                'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                displayMode === 'list' ? 'bg-white text-black shadow-sm' : 'text-charcoal-500'
              )}
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
              </svg>
            </button>
          </div>

          {/* View mode toggle */}
          <div className="flex rounded-lg bg-oat-100 p-0.5">
            {(['day', 'week', 'month'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={cn(
                  'rounded-md px-3 py-1 text-xs font-medium transition-colors capitalize',
                  viewMode === mode ? 'bg-white text-black shadow-sm' : 'text-charcoal-500'
                )}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* View content */}
      {displayMode === 'list' ? (
        <ListView entries={entries} clientIds={clientIds} />
      ) : (
        <>
          {viewMode === 'week' && (
            <WeekView entries={entries} currentDate={currentDate} clientIds={clientIds} hourHeight={hourHeight} />
          )}
          {viewMode === 'day' && (
            <DayView entries={entries} currentDate={currentDate} clientIds={clientIds} hourHeight={hourHeight} />
          )}
          {viewMode === 'month' && (
            <MonthView entries={entries} currentDate={currentDate} clientIds={clientIds} onDayClick={goToDay} />
          )}
        </>
      )}
    </div>
  );
}
