/**
 * FIRESTORE API — Step 5
 *
 * All database operations for scores and leaderboard.
 *
 * Firestore structure:
 *
 *   players/
 *     {uid}/
 *       displayName: "Akshita"
 *       regNumber:   "22CS1001"
 *       bestScore:   12450
 *       gamesPlayed: 7
 *       lastPlayed:  timestamp
 *
 *   scores/
 *     {auto-id}/
 *       uid:         "firebase-uid"
 *       playerName:  "Akshita"
 *       regNumber:   "22CS1001"
 *       difficulty:  "medium"
 *       totalScore:  12450
 *       roundScore:  4200
 *       round:       3
 *       pctClean:    87
 *       waves:       14
 *       timeSec:     72
 *       createdAt:   timestamp
 *
 * Leaderboard query:
 *   scores collection → group by uid → keep best totalScore per player
 *   → order by totalScore desc → limit 20
 *   → onSnapshot for real-time updates
 */

import {
  collection,
  doc,
  setDoc,
  addDoc,
  getDoc,
  getDocs,
  query,
  orderBy,
  limit,
  where,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  increment,
} from "firebase/firestore";
import { db } from "../firebase.js";

// ─── COLLECTION REFS ─────────────────────────────────────────────

const playersRef = collection(db, "players");
const scoresRef  = collection(db, "scores");

// ─── PLAYER PROFILE ──────────────────────────────────────────────

/**
 * Creates or updates a player profile in Firestore.
 * Called after registration so the player appears on the leaderboard
 * even before they've submitted any scores.
 */
export async function upsertPlayer(uid, displayName, regNumber) {
  const ref = doc(playersRef, uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(ref, {
      displayName,
      regNumber,
      bestScore:   0,
      gamesPlayed: 0,
      lastPlayed:  serverTimestamp(),
      createdAt:   serverTimestamp(),
    });
  } else {
    // Update name in case it changed
    await updateDoc(ref, { displayName, regNumber });
  }
}

/**
 * Fetches a single player's profile.
 */
export async function getPlayer(uid) {
  const snap = await getDoc(doc(playersRef, uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// ─── SCORE SUBMISSION ────────────────────────────────────────────

/**
 * Saves a round score to Firestore.
 * Also updates the player's bestScore if this is a new personal best.
 *
 * @param {object} gameState  - final game state from the engine
 * @param {object} player     - Firebase player { uid, displayName, regNumber }
 */
export async function submitScore(gameState, player) {
  const {
    totalScore, roundScore, difficulty,
    round, waveCount, elapsedSec, grid,
  } = gameState;

  // Calculate pctClean from grid
  let infected = 0;
  const total  = grid?.size ?? 0;
  for (const b of (grid?.values?.() ?? [])) {
    if (b.infected) infected++;
  }
  const pctClean = total > 0 ? Math.round(((total - infected) / total) * 100) : 0;

  // Save score document
  await addDoc(scoresRef, {
    uid:         player.uid,
    playerName:  player.displayName,
    regNumber:   player.regNumber,
    difficulty,
    totalScore:  totalScore ?? 0,
    roundScore:  roundScore ?? 0,
    round:       round ?? 1,
    pctClean,
    waves:       waveCount ?? 0,
    timeSec:     elapsedSec ?? 0,
    createdAt:   serverTimestamp(),
  });

  // Update player profile — bestScore and gamesPlayed
  const playerRef = doc(playersRef, player.uid);
  const playerSnap = await getDoc(playerRef);

  if (playerSnap.exists()) {
    const current = playerSnap.data();
    const updates = { gamesPlayed: increment(1), lastPlayed: serverTimestamp() };
    if ((totalScore ?? 0) > (current.bestScore ?? 0)) {
      updates.bestScore  = totalScore;
      updates.difficulty = difficulty;
      updates.round      = round;
      updates.pctClean   = pctClean;
    }
    await updateDoc(playerRef, updates);
  } else {
    // Profile doesn't exist yet — create it
    await setDoc(playerRef, {
      displayName:  player.displayName,
      regNumber:    player.regNumber,
      bestScore:    totalScore ?? 0,
      gamesPlayed:  1,
      difficulty,
      round,
      pctClean,
      lastPlayed:   serverTimestamp(),
      createdAt:    serverTimestamp(),
    });
  }
}

// ─── LEADERBOARD — ONE-TIME FETCH ────────────────────────────────

/**
 * Fetches the top 20 players by bestScore.
 * Reads from the players collection (one doc per player = fast query).
 *
 * @param {string} difficulty  - "all" | "easy" | "medium" | "hard"
 */
export async function fetchLeaderboard(difficulty = "all") {
  try {
    let q;
    if (difficulty === "all") {
      q = query(playersRef, orderBy("bestScore", "desc"), limit(20));
    } else {
      q = query(
        playersRef,
        where("difficulty", "==", difficulty),
        orderBy("bestScore", "desc"),
        limit(20)
      );
    }
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error("Leaderboard fetch failed:", err);
    return [];
  }
}

// ─── LEADERBOARD — REAL-TIME LISTENER ────────────────────────────

/**
 * Subscribes to real-time leaderboard updates.
 * The callback fires immediately with current data, then again
 * whenever any player's score changes.
 *
 * Usage:
 *   const unsub = subscribeLeaderboard("all", (entries) => setEntries(entries));
 *   // Call unsub() when component unmounts
 *
 * @param {string}   difficulty  - "all" | "easy" | "medium" | "hard"
 * @param {function} callback    - called with array of leaderboard entries
 * @returns {function}           - unsubscribe function
 */
export function subscribeLeaderboard(difficulty = "all", callback) {
  let q;
  if (difficulty === "all") {
    q = query(playersRef, orderBy("bestScore", "desc"), limit(20));
  } else {
    q = query(
      playersRef,
      where("difficulty", "==", difficulty),
      orderBy("bestScore", "desc"),
      limit(20)
    );
  }

  return onSnapshot(q, (snap) => {
    const entries = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(entries);
  }, (err) => {
    console.error("Leaderboard listener error:", err);
    callback([]);
  });
}

// ─── PLAYER'S OWN SCORE HISTORY ──────────────────────────────────

/**
 * Fetches the last 10 scores for a specific player.
 * Used on the profile / game over screen.
 */
export async function getPlayerHistory(uid, limitCount = 10) {
  try {
    const q = query(
      scoresRef,
      where("uid", "==", uid),
      orderBy("createdAt", "desc"),
      limit(limitCount)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error("Player history fetch failed:", err);
    return [];
  }
}