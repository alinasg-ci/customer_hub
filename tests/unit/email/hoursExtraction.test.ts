import { describe, it, expect } from 'vitest';
import { detectHours } from '@/modules/email/api/hoursExtraction';

describe('detectHours', () => {
  it('returns null when body is empty', () => {
    expect(detectHours('')).toBeNull();
  });

  it('extracts simple "4 hours" mentions', () => {
    const r = detectHours('I worked 4 hours on the onboarding today');
    expect(r?.amount).toBe(4);
    expect(r?.source).toBe('hours');
    expect(r?.quote).toContain('4 hours');
  });

  it('extracts decimal hours ("3.5 hrs")', () => {
    const r = detectHours('Spent 3.5 hrs on design reviews yesterday.');
    expect(r?.amount).toBe(3.5);
  });

  it('extracts single-letter "h" suffix', () => {
    const r = detectHours('Logged 2h on the bug fix.');
    expect(r?.amount).toBe(2);
  });

  it('converts minutes to hours', () => {
    const r = detectHours('30 minutes on the call');
    expect(r?.amount).toBe(0.5);
    expect(r?.source).toBe('minutes');
  });

  it('ignores amounts outside the plausible window', () => {
    // 100 hours is implausible for one log entry — matcher rejects it.
    expect(detectHours('I worked 100 hours this week')).toBeNull();
  });

  it('returns the largest plausible match when multiple mentions exist', () => {
    const r = detectHours('First 1 hour of planning, then 4 hrs of build');
    expect(r?.amount).toBe(4);
  });

  it('returns null when body has no unit', () => {
    expect(detectHours('We met today. It was productive.')).toBeNull();
  });
});
