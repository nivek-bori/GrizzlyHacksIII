'use client'

import { useCallback, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { parseError } from "@/lib/util/server_util";
import CustomGoogleAuthButton from "./google/GoogleButton";
import EmailHandler from "./email/EmailHandler";
import { useNotification } from "../notification/NotificationProvider";
import { DefaultAPIResponse, request } from "@/lib/util/api";
import { ProfilePostRequest, ProfilePostResponse } from "@/app/api/profile/route";

interface GoogleAuthResponse {
  credential: string;
  [key: string]: unknown;
}

export default function AuthComponent({ defaultFormState = 'signin' }: { defaultFormState?: 'signup' | 'signin' }) {
  const { addNotification, addNotificationStatus } = useNotification();

  const [status, setStatus] = useState<'google-loading' | 'email-loading' | 'page-loading' | 'null'>('page-loading');

  const handleEmailSignIn = useCallback(async (email: string, password: string) => {
    setStatus('email-loading');

    try {
      // Data validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        addNotification({ message: 'Please enter a valid email address', type: 'error' });
        return;
      }

      // Supabase auth
      const { data: auth_data, error: auth_error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      })

      // Auth errors
      if (auth_error) {
        parseError(auth_error.message, auth_error.code);
        addNotification({ message: 'There was an issue signing in with Google', type: 'error'});
        console.log('There was an issue signing in');
      }
      if (!auth_data.user || !auth_data.user.id) {
        addNotification({ message: 'There was an issue signing in with Google', type: 'error'});
        console.log('There was an issue signing in');
      }

    } catch (e: any) {
      console.log('/components/auth/auth handleEmailSignIn error', await parseError(e.message, e.code));
      addNotification({ message: 'There was an issue signing in', type: 'error'});
    } finally {
      setStatus('null');
    }
  }, [setStatus, supabase, parseError]);

  const handleEmailSignUp = useCallback(async (email: string, name: string, password: string, confirmPassword: string) => {
    setStatus('email-loading');

    try {
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        addNotification({ message: 'Please enter a valid email address', type: 'error'});
        return;
      }
      
      if (password !== confirmPassword) {
        addNotification({ message: 'Passwords do not match', type: 'error'});
        return;
      }
    
      const { data: signup_data, error: signup_error } = await supabase.auth.signUp({ email: email, password: password });

      // Auth errors
      if (signup_error) {
        const msg = await parseError(signup_error.message, signup_error.code);
        addNotification({ message: msg, type: 'error'});
        return;
      }
      if (!signup_data.user || !signup_data.user.id) {
        addNotification({ message: 'There was an issue signing up', type: 'error'});
        return;
      }

      // Ensure db profile exists
      const body: ProfilePostRequest = {
        userId: signup_data.user.id,
        email: email,
        name: name || email.split('@')[1] || 'user',
      };

      const res = await request<ProfilePostResponse>({
        type: 'POST',
        route: 'api/profile',
        body: body
      });

      addNotificationStatus(res);
    } catch (e: any) {
      console.log('/components/auth/auth handleEmailSignUp error', await parseError(e.message, e.code));
      addNotification({ message: 'There was an issue signing up', type: 'error'});
    } finally {
      setStatus('null');
    }
  }, []);

  const handleGoogleAuth = useCallback(async (response: GoogleAuthResponse) => {
    setStatus('google-loading');

    try {
      // Sign in using Google token
      const { data: auth_data, error: auth_error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: response.credential,
      });

      // Auth errors
      if (auth_error) {
        parseError(auth_error.message, auth_error.code);
        addNotification({ message: 'There was an issue with Google', type: 'error' });
        return;
      }
      if (!auth_data.user || !auth_data.user.id) {
        addNotification({ message: 'There was an issue with Google', type: 'error' });
        return;
      }

      const body: ProfilePostRequest = {
        userId: auth_data.user.id,
        email: auth_data.user.email || 'unknown email',
        name: auth_data.user.user_metadata.name || 'user'
      };

      const res = await request<ProfilePostResponse>({
        type: 'POST',
        route: 'api/profile',
        body: body
      });

      addNotificationStatus(res);
    } catch (e: any) {
      console.log('/components/auth/auth handleGoogleAuth error', await parseError(e.message, e.code));
      addNotification({ message: 'There was an issue with Google', type: 'error' });
    } finally {
      setTimeout(() => setStatus('null'), 10 * 1000);
    }
  }, [setStatus]);

  return (
    <div className="flex justify-center items-center p-4 min-h-screen bg-linear-to-br from-blue-50 to-indigo-100">
      <div className="p-8 w-full max-w-md bg-white rounded-lg shadow-xl">
        <EmailHandler status={status} onEmailSignIn={handleEmailSignIn} onEmailSignUp={handleEmailSignUp} defaultFormState={defaultFormState} />

        <div className="mt-6">
          <div className="relative">
            <div className="flex absolute inset-0 items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="flex relative justify-center text-sm">
              <span className="px-2 text-gray-500 bg-white">Or continue with</span>
            </div>
          </div>

          <div className="mt-4">
            <CustomGoogleAuthButton
              handleGoogleAuthCallback={handleGoogleAuth}
              setStatus={setStatus}
              buttonUse='continue_with'
              buttonText='Continue with Google'
            />
          </div>
        </div>
      </div>
    </div>
  )
}