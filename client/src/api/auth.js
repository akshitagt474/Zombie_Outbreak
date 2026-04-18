/**
 * AUTH API — Step 4B
 *
 * Handles registration number + username login using Firebase Auth.
 *
 * Strategy:
 *   Firebase Auth requires an email format. We construct one from
 *   the registration number so the player never sees it:
 *
 *     regNumber: 22CS1001
 *     username:  Akshita
 *     → Firebase email: 22cs1001@zombiegame.app
 *     → Firebase displayName: Akshita
 *     → Leaderboard shows: Akshita (22CS1001)
 *
 * The player only ever types their registration number + username.
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from "firebase/auth";
import { auth } from "../firebase.js";

// ─── HELPERS ──────────────────────────────────────────────────────

/**
 * Converts a registration number to a valid Firebase email.
 * 22CS1001 → 22cs1001@zombiegame.app
 */
function toEmail(regNumber) {
  return `${regNumber.trim().toLowerCase()}@zombiegame.app`;
}

/**
 * Validates a registration number format.
 * Allows: letters and numbers, 4–20 characters.
 */
export function validateRegNumber(reg) {
  return /^[a-zA-Z0-9]{4,20}$/.test(reg.trim());
}

/**
 * Validates a username.
 * Allows: letters, numbers, @, _, -, 2–24 characters.
 */
export function validateUsername(name) {
  return /^[\w@\-]{2,24}$/.test(name.trim());
}

// ─── REGISTER ─────────────────────────────────────────────────────

/**
 * Creates a new Firebase account using registration number + username.
 *
 * @param {string} regNumber  - e.g. "22CS1001"
 * @param {string} username   - display name on leaderboard
 * @param {string} password   - player's chosen password
 * @returns {{ user, displayName, regNumber }}
 */
export async function registerPlayer(regNumber, username, password) {
  const email = toEmail(regNumber);

  // Create Firebase account
  const credential = await createUserWithEmailAndPassword(auth, email, password);

  // Set display name so leaderboard shows username
  await updateProfile(credential.user, {
    displayName: username.trim(),
  });

  return {
    user:        credential.user,
    displayName: username.trim(),
    regNumber:   regNumber.trim().toUpperCase(),
  };
}

// ─── LOGIN ────────────────────────────────────────────────────────

/**
 * Signs in with registration number + password.
 * Username is read from the Firebase profile (set at registration).
 *
 * @param {string} regNumber
 * @param {string} password
 * @returns {{ user, displayName, regNumber }}
 */
export async function loginPlayer(regNumber, password) {
  const email      = toEmail(regNumber);
  const credential = await signInWithEmailAndPassword(auth, email, password);

  return {
    user:        credential.user,
    displayName: credential.user.displayName ?? regNumber,
    regNumber:   regNumber.trim().toUpperCase(),
  };
}

// ─── SIGN OUT ─────────────────────────────────────────────────────

export async function signOut() {
  await firebaseSignOut(auth);
}

// ─── AUTH STATE LISTENER ─────────────────────────────────────────

/**
 * Subscribes to Firebase auth state changes.
 * Calls callback with the current user (or null if signed out).
 *
 * @param {function} callback
 * @returns {function} unsubscribe
 */
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, (user) => {
    if (user) {
      callback({
        uid:         user.uid,
        displayName: user.displayName ?? user.email,
        regNumber:   user.email?.replace("@zombiegame.app", "").toUpperCase() ?? "",
        email:       user.email,
      });
    } else {
      callback(null);
    }
  });
}

// ─── PARSE ERROR MESSAGES ────────────────────────────────────────

/**
 * Converts Firebase error codes into friendly messages.
 */
export function parseAuthError(error) {
  switch (error.code) {
    case "auth/email-already-in-use":
      return "This registration number is already registered. Try logging in.";
    case "auth/user-not-found":
      return "Registration number not found. Check your number or register first.";
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Incorrect password. Please try again.";
    case "auth/weak-password":
      return "Password must be at least 6 characters.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a moment and try again.";
    case "auth/network-request-failed":
      return "Network error. Check your internet connection.";
    default:
      return error.message ?? "Something went wrong. Please try again.";
  }
}