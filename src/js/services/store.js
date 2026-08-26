import { loadJson, saveJson } from "./storage.js";
import { createSeedState } from "../data/seedData.js";

const STATE_KEY = "planifi.state.v2";
const listeners = new Set();

let state = null;

export function getState() {
  if (!state) state = loadState();
  return state;
}

function loadState() {
  const saved = loadJson(STATE_KEY, null);
  const seed = createSeedState();
  if (saved?.version === 2) {
    return {
      ...seed,
      ...saved,
      preferences: {
        ...seed.preferences,
        ...saved.preferences,
        roundup: { ...seed.preferences.roundup, ...saved.preferences?.roundup },
        notifications: { ...seed.preferences.notifications, ...saved.preferences?.notifications },
      },
      gamification: { ...seed.gamification, ...saved.gamification },
    };
  }
  saveJson(STATE_KEY, seed);
  return seed;
}

export function persist() {
  saveJson(STATE_KEY, state);
  listeners.forEach((fn) => fn(state));
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function replaceState(next) {
  state = next;
  persist();
}

export function patchState(updater) {
  const current = getState();
  state = typeof updater === "function" ? updater(current) : { ...current, ...updater };
  persist();
  return state;
}

export function resetState() {
  state = createSeedState();
  persist();
  return state;
}
