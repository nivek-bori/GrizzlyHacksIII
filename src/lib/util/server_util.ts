'use server';

import { cookies } from "next/headers";

export async function parseError(message: string, code?: string): Promise<string> {
  let retMessage = message;

  if (typeof message !== 'string') {
    retMessage = '';
  }

  // supabase
  if (message === 'email_not_confirmed') retMessage = 'Please confirm your email before signing in';
  if (message === 'Auth session missing!') retMessage = 'Please sign in first';
  if (code === 'weak_password')
    retMessage = 'Password must contain: lower and upper case letters, at least 1 number, and at least 1 special character';
  if (code === 'user_not_found') {
    const cookie = await cookies();
    cookie.delete('sb-access-token');
    cookie.delete('sb-refresh-token');
    retMessage = 'Please clear you cookies and sign in again';
  }
  if (message === 'Invalid login credentials') retMessage = 'Invalid longin credentials. Please try again';
  if (message === 'Email not confirmed') retMessage = 'Please confirm your email first';

  // prisma
  if (code === 'P2002') retMessage = 'An account with that email already exists. Sign in instead?';

  // google
  if (code === 'identity_already_exists') retMessage = 'That account is already linked to another account. Try another account';

  console.log('\nParseError:', code, message.slice(0, 200), '\n -> \n', retMessage, '\nParseErrorClose');
  return retMessage;
}

import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "../supabase/server";

export async function getUserServer(request: Request) {
  const supabase = await createServerSupabaseClient();

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      user: null,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    };
  }

  return { user };
}