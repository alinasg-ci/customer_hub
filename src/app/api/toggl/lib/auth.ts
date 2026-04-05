import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';

function getEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

const supabaseUrl = getEnvVar('NEXT_PUBLIC_SUPABASE_URL');
const supabaseServiceKey = getEnvVar('SUPABASE_SERVICE_ROLE_KEY');

// Singleton service client — reused across requests
const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Verify Supabase session from request headers.
 * Returns the authenticated user or a 401 response.
 */
export async function authenticateRequest(req: NextRequest): Promise<
  { user: { id: string }; error?: never } | { user?: never; error: NextResponse }
> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return {
      error: NextResponse.json(
        { data: null, error: { code: 'UNAUTHORIZED', message: 'Authentication required', id: generateErrorId() } },
        { status: 401 }
      ),
    };
  }

  const token = authHeader.slice(7);
  const supabase = serviceClient;

  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return {
      error: NextResponse.json(
        { data: null, error: { code: 'UNAUTHORIZED', message: 'Invalid or expired session', id: generateErrorId() } },
        { status: 401 }
      ),
    };
  }

  return { user: { id: user.id } };
}

/**
 * Get the server-side Supabase client (service role).
 */
export function getServiceClient() {
  return serviceClient;
}

/**
 * Generate a unique error ID for logging/display.
 */
export function generateErrorId(): string {
  return `err_${randomBytes(6).toString('hex')}`;
}
