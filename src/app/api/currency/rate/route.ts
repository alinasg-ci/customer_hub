import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(req: NextRequest) {
  try {
    const { currency, date } = await req.json();

    if (!currency || !date) {
      return NextResponse.json(
        { data: null, error: { code: 'MISSING_PARAMS', message: 'Currency and date are required' } },
        { status: 400 }
      );
    }

    if (currency !== 'USD' && currency !== 'EUR') {
      return NextResponse.json(
        { data: null, error: { code: 'INVALID_CURRENCY', message: 'Only USD and EUR are supported' } },
        { status: 400 }
      );
    }

    // Use service role to bypass RLS for exchange_rates table
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check cache first
    const { data: cached } = await supabase
      .from('exchange_rates')
      .select('rate_to_ils, date')
      .eq('currency', currency)
      .eq('date', date)
      .maybeSingle();

    if (cached) {
      return NextResponse.json({
        data: { rate: Number(cached.rate_to_ils), date: cached.date },
        error: null,
      });
    }

    // Fetch from Bank of Israel XML feed
    const rate = await fetchBoiRate(currency, date);

    if (rate) {
      // Cache the rate
      await supabase
        .from('exchange_rates')
        .upsert({
          date: rate.date,
          currency,
          rate_to_ils: rate.rate,
          fetched_at: new Date().toISOString(),
        });

      return NextResponse.json({ data: rate, error: null });
    }

    // Fallback: most recent cached rate before the requested date
    const { data: fallback } = await supabase
      .from('exchange_rates')
      .select('rate_to_ils, date')
      .eq('currency', currency)
      .lte('date', date)
      .order('date', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fallback) {
      return NextResponse.json({
        data: { rate: Number(fallback.rate_to_ils), date: fallback.date },
        error: null,
      });
    }

    return NextResponse.json(
      { data: null, error: { code: 'RATE_NOT_FOUND', message: 'Exchange rate not available. Try a different date.' } },
      { status: 404 }
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: 'RATE_ERROR', message: 'Failed to fetch exchange rate' } },
      { status: 500 }
    );
  }
}

async function fetchBoiRate(
  currency: string,
  date: string
): Promise<{ rate: number; date: string } | null> {
  try {
    // BOI provides XML with latest rates
    const response = await fetch('https://www.boi.org.il/currency.xml', {
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) return null;

    const xml = await response.text();

    // Parse the currency code we need
    const currencyCode = currency === 'USD' ? 'USD' : 'EUR';
    const regex = new RegExp(
      `<CURRENCY>\\s*<NAME>[^<]*</NAME>\\s*<UNIT>\\d+</UNIT>\\s*<CURRENCYCODE>${currencyCode}</CURRENCYCODE>\\s*<COUNTRY>[^<]*</COUNTRY>\\s*<RATE>([\\d.]+)</RATE>\\s*<CHANGE>[^<]*</CHANGE>\\s*</CURRENCY>`,
      's'
    );

    const match = xml.match(regex);
    if (!match) return null;

    const rate = parseFloat(match[1]);
    if (isNaN(rate)) return null;

    // Extract the date from the XML
    const dateMatch = xml.match(/<LAST_UPDATE>([\d/]+)<\/LAST_UPDATE>/);
    const boiDate = dateMatch ? parseBoiDate(dateMatch[1]) : date;

    return { rate, date: boiDate };
  } catch {
    return null;
  }
}

function parseBoiDate(boiDateStr: string): string {
  // BOI format: "DD/MM/YYYY" or "YYYY-MM-DD"
  if (boiDateStr.includes('/')) {
    const [day, month, year] = boiDateStr.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  return boiDateStr;
}
