// ──────────────────────────────────────
//  Entry point — wires up all modules
// ──────────────────────────────────────
import { RUDIMENTS } from './data.js';
import { state } from './state.js';
import { selectRud, toggleFav, navFav, updateProgBanner } from './detail.js';
import {
  buildCategAccordion, buildFavStartRow, updateTabIndicator,
  mobNavClick, registerSelectRud, registerApFavsKeyHandlers,
  closeMobSheet,
} from './sidebar.js';
import { getApFavsStartKey, setApFavsStartKey } from './audio.js';

// ── Break sidebar↔detail circular dependency via dependency injection ──
// sidebar.js uses selectRud but can't import it directly (detail imports sidebar).
// We hand selectRud to sidebar at runtime instead.
registerSelectRud(selectRud);

// Same pattern for the favs start-key in the audio player
registerApFavsKeyHandlers(getApFavsStartKey, setApFavsStartKey);

// ── Bootstrap state ──
state.currentRud = RUDIMENTS[0];
state.currentCat = RUDIMENTS[0].cat;
state.mobOpenCat = RUDIMENTS[0].cat;

// ── Initial render ──
buildCategAccordion();
selectRud(RUDIMENTS[0]);
updateProgBanner();
buildFavStartRow();
updateTabIndicator('categ');

// ── Global event wiring ──
window.addEventListener('resize', () => updateTabIndicator(state.currentView));

document.getElementById('favBtn').onclick    = toggleFav;
document.getElementById('cardPrev').onclick  = () => navFav(-1);
document.getElementById('cardNext').onclick  = () => navFav(1);

// Bottom nav tabs
document.getElementById('bnavCateg').onclick = () => mobNavClick('categ');
document.getElementById('bnavTier').onclick  = () => mobNavClick('tier');
document.getElementById('bnavFavs').onclick  = () => mobNavClick('favs');

// Desktop sidebar tabs
document.getElementById('vtCateg').onclick   = () => mobNavClick('categ');
document.getElementById('vtTier').onclick    = () => mobNavClick('tier');
document.getElementById('vtFavs').onclick    = () => mobNavClick('favs');

// Mobile sheet close / backdrop
document.getElementById('mobSheetClose').onclick    = () => closeMobSheet();
document.getElementById('mobSheetBackdrop').onclick = () => closeMobSheet();

// ── Page transitions (fade in / out on navigation) ──
requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.add('loaded')));

document.querySelectorAll('a[href]').forEach(a => {
  a.addEventListener('click', function (e) {
    const href = this.getAttribute('href');
    if (!href || href.startsWith('#') || this.target) return;
    try { if (new URL(href, location.href).origin !== location.origin) return; } catch (_) { return; }
    e.preventDefault();
    document.body.classList.add('exit');
    setTimeout(() => { location.href = href; }, 280);
  });
});
