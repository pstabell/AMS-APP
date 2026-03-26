import { NextRequest } from 'next/server';
import { createServerClient } from './supabase';

export type ServerAuthUser = {
  id: string;
  email: string;
};

const SESSION_COOKIE = "ams_session";

function decodeSession(payload: string): ServerAuthUser | null {
  try {
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

function getCookieFromRequest(request: NextRequest, name: string): string | null {
  const cookie = request.cookies.get(name);
  return cookie?.value || null;
}

/**
 * Server-side authentication - validates session cookie and returns user info
 * This replaces the insecure x-user-id header approach
 */
export async function validateServerSession(request: NextRequest): Promise<{
  user: ServerAuthUser | null;
  error: string | null;
}> {
  try {
    // Get session cookie
    const sessionCookie = getCookieFromRequest(request, SESSION_COOKIE);
    if (!sessionCookie) {
      return { user: null, error: 'No session found' };
    }

    // Decode session
    const sessionData = decodeSession(sessionCookie);
    if (!sessionData || !sessionData.id || !sessionData.email) {
      return { user: null, error: 'Invalid session data' };
    }

    // Validate user still exists and is active in database
    const supabase = createServerClient();
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, subscription_status')
      .eq('id', sessionData.id)
      .eq('email', sessionData.email)
      .maybeSingle();

    if (error) {
      console.error('Session validation error:', error);
      return { user: null, error: 'Session validation failed' };
    }

    if (!user) {
      return { user: null, error: 'User not found or session expired' };
    }

    if (user.subscription_status !== 'active') {
      return { user: null, error: 'Account subscription not active' };
    }

    return { 
      user: { 
        id: user.id, 
        email: user.email 
      }, 
      error: null 
    };

  } catch (err) {
    console.error('Session validation error:', err);
    return { user: null, error: 'Authentication failed' };
  }
}

/**
 * Lenient server-side authentication for admin API routes.
 * Tries the session cookie first; if that fails, falls back to the
 * x-user-id header (which the admin page always sends) and validates
 * the user via the service-role client.
 */
export async function validateServerSessionOrHeader(request: NextRequest): Promise<{
  user: ServerAuthUser | null;
  error: string | null;
}> {
  // 1. Try session cookie first
  const sessionResult = await validateServerSession(request);
  if (sessionResult.user) {
    return sessionResult;
  }

  // 2. Fallback: use x-user-id header
  const userId = request.headers.get('x-user-id');
  if (!userId) {
    return { user: null, error: 'No session or user ID found' };
  }

  try {
    const supabase = createServerClient();
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email')
      .eq('id', userId)
      .maybeSingle();

    if (error || !user) {
      return { user: null, error: 'User not found' };
    }

    return {
      user: { id: user.id, email: user.email },
      error: null,
    };
  } catch (err) {
    console.error('Header auth fallback error:', err);
    return { user: null, error: 'Authentication failed' };
  }
}