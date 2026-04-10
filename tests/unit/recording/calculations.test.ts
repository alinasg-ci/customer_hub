import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatElapsedTime, calculateDurationHours, getElapsedSeconds } from '@/modules/recording/calculations';

describe('formatElapsedTime', () => {
  it('should format 0 seconds as 00:00:00', () => {
    expect(formatElapsedTime(0)).toBe('00:00:00');
  });

  it('should format 59 seconds correctly', () => {
    expect(formatElapsedTime(59)).toBe('00:00:59');
  });

  it('should format 60 seconds as 1 minute', () => {
    expect(formatElapsedTime(60)).toBe('00:01:00');
  });

  it('should format 3661 seconds as 01:01:01', () => {
    expect(formatElapsedTime(3661)).toBe('01:01:01');
  });

  it('should handle large values (10+ hours)', () => {
    expect(formatElapsedTime(36000)).toBe('10:00:00');
  });

  it('should handle 99 hours', () => {
    expect(formatElapsedTime(356400)).toBe('99:00:00');
  });

  it('should format realistic work session (47.5 minutes)', () => {
    expect(formatElapsedTime(2850)).toBe('00:47:30');
  });
});

describe('calculateDurationHours', () => {
  it('should calculate 1 hour correctly', () => {
    const start = '2026-04-08T10:00:00Z';
    const end = '2026-04-08T11:00:00Z';
    expect(calculateDurationHours(start, end)).toBe(1);
  });

  it('should calculate 30 minutes as 0.5 hours', () => {
    const start = '2026-04-08T10:00:00Z';
    const end = '2026-04-08T10:30:00Z';
    expect(calculateDurationHours(start, end)).toBe(0.5);
  });

  it('should calculate a realistic session (47.5 minutes)', () => {
    const start = '2026-04-08T09:00:00Z';
    const end = '2026-04-08T09:47:30Z';
    expect(calculateDurationHours(start, end)).toBeCloseTo(0.79, 2);
  });

  it('should return 0 for same start and end', () => {
    const time = '2026-04-08T10:00:00Z';
    expect(calculateDurationHours(time, time)).toBe(0);
  });

  it('should return 0 if end is before start', () => {
    const start = '2026-04-08T11:00:00Z';
    const end = '2026-04-08T10:00:00Z';
    expect(calculateDurationHours(start, end)).toBe(0);
  });

  it('should handle cross-day sessions', () => {
    const start = '2026-04-08T23:30:00Z';
    const end = '2026-04-09T01:30:00Z';
    expect(calculateDurationHours(start, end)).toBe(2);
  });

  it('should round to 2 decimal places', () => {
    const start = '2026-04-08T10:00:00Z';
    const end = '2026-04-08T10:10:00Z'; // 10 minutes = 0.166666... hours
    expect(calculateDurationHours(start, end)).toBe(0.17);
  });
});

describe('getElapsedSeconds', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return 0 for a start time equal to now', () => {
    const now = new Date('2026-04-08T10:00:00Z');
    vi.setSystemTime(now);
    expect(getElapsedSeconds('2026-04-08T10:00:00Z')).toBe(0);
  });

  it('should return correct seconds after 5 minutes', () => {
    vi.setSystemTime(new Date('2026-04-08T10:05:00Z'));
    expect(getElapsedSeconds('2026-04-08T10:00:00Z')).toBe(300);
  });

  it('should return correct seconds after 2 hours', () => {
    vi.setSystemTime(new Date('2026-04-08T12:00:00Z'));
    expect(getElapsedSeconds('2026-04-08T10:00:00Z')).toBe(7200);
  });

  it('should return 0 if start time is in the future', () => {
    vi.setSystemTime(new Date('2026-04-08T10:00:00Z'));
    expect(getElapsedSeconds('2026-04-08T11:00:00Z')).toBe(0);
  });
});
