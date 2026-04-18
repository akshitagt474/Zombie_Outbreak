/**
 * useAuth — Step 4B
 *
 * React hook that manages Firebase auth state across the whole app.
 * Wrap App.jsx with this so every screen knows who's logged in.
 *
 * Returns:
 *   player      — { uid, displayName, regNumber } or null
 *   authLoading — true while Firebase is checking existing session
 *   authError   — string error message or null
 *   register()  — create account with regNumber + username + password
 *   login()     — sign in with regNumber + password
 *   logout()    — sign out
 */

import { useState, useEffect, useCallback } from "react";
import {
  registerPlayer,
  loginPlayer,
  signOut,
  onAuthChange,
  parseAuthError,
} from "../api/auth.js";

export function useAuth() {
  const [player,      setPlayer]      = useState(null);
  const [authLoading, setAuthLoading] = useState(true);  // true on first load
  const [authError,   setAuthError]   = useState(null);

  // Listen for Firebase auth state changes (handles page refresh)
  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      setPlayer(user);
      setAuthLoading(false);
    });
    return unsubscribe;
  }, []);

  const register = useCallback(async (regNumber, username, password) => {
    setAuthError(null);
    try {
      const result = await registerPlayer(regNumber, username, password);
      setPlayer({
        uid:         result.user.uid,
        displayName: result.displayName,
        regNumber:   result.regNumber,
      });
      return { success: true };
    } catch (err) {
      const msg = parseAuthError(err);
      setAuthError(msg);
      return { success: false, error: msg };
    }
  }, []);

  const login = useCallback(async (regNumber, password) => {
    setAuthError(null);
    try {
      const result = await loginPlayer(regNumber, password);
      setPlayer({
        uid:         result.user.uid,
        displayName: result.displayName,
        regNumber:   result.regNumber,
      });
      return { success: true };
    } catch (err) {
      const msg = parseAuthError(err);
      setAuthError(msg);
      return { success: false, error: msg };
    }
  }, []);

  const logout = useCallback(async () => {
    await signOut();
    setPlayer(null);
  }, []);

  return { player, authLoading, authError, register, login, logout };
}