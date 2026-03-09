// ──────────────────────────────────────
//  Detail card, achievements, progress banner, favourites
// ──────────────────────────────────────
import { RUDIMENTS, LEVELS, VF_IMG, VF_IMG_BASE, VF_STEMS } from './data.js';
import { state, rudProgress, rudFavs, saveProgress, saveFavs, getFavsSorted } from './state.js';
import { renderStaff } from './staff.js';
import { buildAudioPlayer, getApAudio, setApFavsAutoPlay, getApFavsStartKey } from './audio.js';
import {
  buildCategAccordion, buildTierBlocks, buildFavsPanel,
  updateFavArrows, buildMobList, closeMobSheet,
  levelIndex, levelColor, levelGlow, levelIcons,
} from './sidebar.js';

const isMobile = () => window.innerWidth <= 700;

// ════════════════════════════════════════
//  RUDIMENT SELECTION
// ════════════════════════════════════════

export function selectRud(rud, dir) {
  const card = document.getElementById('detailCard');
  if (dir && card) {
    const outCls = dir > 0 ? 'rud-out'   : 'rud-out-r';
    const inCls  = dir > 0 ? 'rud-in'    : 'rud-in-r';
    card.classList.remove('rud-in', 'rud-in-r', 'rud-out', 'rud-out-r');
    card.classList.add(outCls);
    setTimeout(() => {
      card.classList.remove(outCls);
      _applyRud(rud);
      void card.offsetWidth;
      card.classList.add(inCls);
    }, 190);
    return;
  }
  _applyRud(rud);
  if (isMobile()) card.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function _applyRud(rud) {
  state.currentRud = rud;
  state.currentCat = rud.cat;

  document.getElementById('rudCatLabel').textContent  = rud.cat;
  document.getElementById('rudName').textContent       = rud.name;
  document.getElementById('rudTierBadge').textContent  = 'Tier ' + rud.tier;

  buildLevelStrip(rud);
  buildAudioPlayer(rud);
  updateFavBtn();

  const vfSlug = VF_IMG[rud.id];
  document.getElementById('staffWrap').innerHTML = vfSlug
    ? `<div class="vf-img-wrap"><img src="${VF_IMG_BASE}${vfSlug}.webp" alt="${rud.name}" loading="lazy"/></div>`
    : renderStaff(rud);

  if (state.currentView === 'categ')      buildCategAccordion();
  else if (state.currentView === 'tier')  buildTierBlocks();
  else { buildFavsPanel(); updateFavArrows(); }

  buildMobList();
  if (isMobile()) closeMobSheet();
}

// ════════════════════════════════════════
//  ACHIEVEMENT BADGES
// ════════════════════════════════════════

export function buildLevelStrip(rud) {
  const el = document.getElementById('levelStrip');
  el.innerHTML = '';
  const ci = levelIndex(rudProgress[rud.id]);

  LEVELS.forEach((lvl, i) => {
    const reached = i <= ci;
    const card = document.createElement('button');
    card.className = `ach-card ${lvl.cls}` + (reached ? ' reached' : '');
    card.title = reached
      ? `Logro conseguido — ${lvl.name} (${lvl.bpm} BPM)\nPulsa para desmarcar`
      : `Marcar logro ${lvl.name} (${lvl.bpm} BPM)`;
    card.innerHTML = `${reached ? '<span class="ach-check">✓</span>' : ''}
      <span class="ach-icon">${levelIcons[lvl.key]}</span>
      <span class="ach-name">${lvl.name}</span>
      <span class="ach-bpm">${lvl.bpm} BPM</span>`;

    card.onclick = () => {
      const wasReached = levelIndex(rudProgress[rud.id]) >= i;
      rudProgress[rud.id] = rudProgress[rud.id] === lvl.key ? null : lvl.key;
      if (!rudProgress[rud.id]) delete rudProgress[rud.id];
      saveProgress();
      buildLevelStrip(rud);
      if (!wasReached) {
        const newCard = el.children[i];
        if (newCard) {
          newCard.classList.add('unlock-anim');
          newCard.addEventListener('animationend', () => newCard.classList.remove('unlock-anim'), { once: true });
        }
      }
      refreshChips();
      updateProgBanner();
    };
    el.appendChild(card);
  });
}

// ════════════════════════════════════════
//  PROGRESS BANNER
// ════════════════════════════════════════

export function updateProgBanner() {
  const cum = { bronze: 0, silver: 0, gold: 0, platinum: 0, diamond: 0 };
  RUDIMENTS.forEach(r => {
    const li = levelIndex(rudProgress[r.id]);
    LEVELS.forEach((l, i) => { if (li >= i) cum[l.key]++; });
  });
  document.getElementById('cBronze').textContent  = cum.bronze;
  document.getElementById('cSilver').textContent  = cum.silver;
  document.getElementById('cGold').textContent    = cum.gold;
  document.getElementById('cPlat').textContent    = cum.platinum;
  document.getElementById('cDiamond').textContent = cum.diamond;

  const total = 40;
  document.getElementById('pbBronze').style.width  = (cum.bronze  / total * 100) + '%';
  document.getElementById('pbSilver').style.width  = (cum.silver  / total * 100) + '%';
  document.getElementById('pbGold').style.width    = (cum.gold    / total * 100) + '%';
  document.getElementById('pbPlat').style.width    = (cum.platinum / total * 100) + '%';
  document.getElementById('pbDiamond').style.width = (cum.diamond / total * 100) + '%';
}

export function refreshChips() {
  if (state.currentView === 'categ')     buildCategAccordion();
  else if (state.currentView === 'tier') buildTierBlocks();
  else buildFavsPanel();
  buildMobList();
}

// ════════════════════════════════════════
//  FAVOURITES
// ════════════════════════════════════════

export function toggleFav() {
  if (!state.currentRud) return;
  if (rudFavs.has(state.currentRud.id)) rudFavs.delete(state.currentRud.id);
  else rudFavs.add(state.currentRud.id);
  saveFavs();
  updateFavBtn();
  if (state.currentView === 'favs') { buildFavsPanel(); updateFavArrows(); }
}

export function updateFavBtn() {
  const btn = document.getElementById('favBtn');
  if (!btn || !state.currentRud) return;
  const on = rudFavs.has(state.currentRud.id);
  btn.textContent = on ? '★' : '☆';
  btn.classList.toggle('active', on);
  btn.title = on ? 'Quitar de favoritos' : 'Añadir a favoritos';
}

export function navFav(dir) {
  const sorted = getFavsSorted();
  const ci     = sorted.findIndex(r => r.id === state.currentRud.id);
  const target = sorted[ci + dir];
  if (!target) return;
  const apAudio = getApAudio();
  setApFavsAutoPlay(!!(apAudio && !apAudio.paused));
  selectRud(target, dir);
}

// ════════════════════════════════════════
//  Audio favs auto-advance (triggered by audio.js event)
// ════════════════════════════════════════

document.addEventListener('audio:ended-in-favs', _onAudioEndedInFavs);

function _onAudioEndedInFavs() {
  const sorted = getFavsSorted().filter(r => VF_STEMS[r.id]);
  const ci     = sorted.findIndex(r => r.id === state.currentRud.id);
  if (ci >= 0 && ci < sorted.length - 1) {
    setApFavsAutoPlay(true);
    selectRud(sorted[ci + 1], 1);
  } else {
    // nothing — audio.js already stopped playback
  }
}
