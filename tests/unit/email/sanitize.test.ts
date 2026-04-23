import { describe, it, expect } from 'vitest';
import {
  stripBlockTags,
  stripTrackingPixels,
  htmlToPlainText,
  bodyForLLM,
  headerDigest,
  LLM_BODY_MAX,
} from '@/modules/email/api/sanitize';

describe('stripBlockTags', () => {
  it('removes <script> and <style> blocks with their contents', () => {
    const html = 'before<script>alert(1)</script>middle<style>.x{}</style>after';
    expect(stripBlockTags(html)).toBe('before middle after');
  });

  it('is case insensitive', () => {
    expect(stripBlockTags('<SCRIPT>evil</SCRIPT>x')).toBe(' x');
  });
});

describe('stripTrackingPixels', () => {
  it('drops known tracker hosts', () => {
    const html = 'Hi<img src="https://mailtrack.io/pixel.gif" width="1" height="1">.';
    expect(stripTrackingPixels(html)).toBe('Hi.');
  });

  it('drops 1x1 invisible pixels regardless of host', () => {
    const html = '<img src="https://example.com/p" width="1" height="1">hello';
    expect(stripTrackingPixels(html)).toBe('hello');
  });

  it('leaves legitimate images in place', () => {
    const html = '<img src="https://example.com/logo.png" width="200" height="80">';
    expect(stripTrackingPixels(html)).toBe(html);
  });
});

describe('htmlToPlainText', () => {
  it('converts <br> to newline and strips tags', () => {
    const html = '<p>Hello<br>World</p>';
    expect(htmlToPlainText(html)).toBe('Hello\nWorld');
  });

  it('removes script + tracking pixels before conversion', () => {
    const html = '<p>Ok</p><script>alert(1)</script><img src="https://mailtrack.io/x" width="1" height="1">';
    expect(htmlToPlainText(html)).toBe('Ok');
  });

  it('decodes common HTML entities', () => {
    expect(htmlToPlainText('a &amp; b &lt;c&gt; &quot;d&quot;')).toBe('a & b <c> "d"');
  });
});

describe('bodyForLLM', () => {
  it('prefers text/plain when available', () => {
    expect(bodyForLLM({ text: 'plain body', html: '<p>html body</p>' })).toBe('plain body');
  });

  it('falls back to html→text', () => {
    expect(bodyForLLM({ text: null, html: '<p>hello</p>' })).toBe('hello');
  });

  it('truncates over LLM_BODY_MAX with an ellipsis marker', () => {
    const huge = 'a'.repeat(LLM_BODY_MAX + 500);
    const out = bodyForLLM({ text: huge });
    expect(out.length).toBe(LLM_BODY_MAX + 1); // truncated slice plus '…'
    expect(out.endsWith('…')).toBe(true);
  });

  it('returns empty string when both inputs are empty', () => {
    expect(bodyForLLM({ text: null, html: null })).toBe('');
  });
});

describe('headerDigest', () => {
  it('includes From + Subject + Date lines when present', () => {
    const digest = headerDigest({
      from_email: 'a@b.com',
      from_name: 'Alice',
      subject: 'Re: Hours',
      sent_at: '2026-04-23T10:00:00.000Z',
    });
    expect(digest).toContain('From: Alice <a@b.com>');
    expect(digest).toContain('Subject: Re: Hours');
    expect(digest).toContain('Date: 2026-04-23T10:00:00.000Z');
  });

  it('omits missing fields', () => {
    const digest = headerDigest({
      from_email: 'x@y.com',
      from_name: null,
      subject: null,
      sent_at: null,
    });
    expect(digest).toBe('From: x@y.com');
  });
});
