// ──────────────────────────────────────
//  Mutable shared state + localStorage
// ──────────────────────────────────────
import { RUDIMENTS } from './data.js';

export const state = {
  currentRud:  null,      // set to RUDIMENTS[0] in app.js
  currentCat:  '',
  currentView: 'categ',   // 'categ' | 'tier' | 'favs'
  mobOpenCat:  '',
};

// ── Progress: { [rudimentId]: levelKey | null } ──
export let rudProgress = JSON.parse(localStorage.getItem('rudProgress') || '{}');

export function saveProgress() {
  localStorage.setItem('rudProgress', JSON.stringify(rudProgress));
}

// ── Favourites: Set of rudiment ids ──
export let rudFavs = new Set(JSON.parse(localStorage.getItem('rudFavs') || '[]'));

export function saveFavs() {
  localStorage.setItem('rudFavs', JSON.stringify([...rudFavs]));
}

export function getFavsSorted() {
  return RUDIMENTS.filter(r => rudFavs.has(r.id)).sort((a, b) => a.tier - b.tier || a.id - b.id);
}
