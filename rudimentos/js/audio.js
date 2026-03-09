// ──────────────────────────────────────
//  Vic Firth audio player
// ──────────────────────────────────────
import { VF_BASE, VF_STEMS, AP_TRACKS, RUDIMENTS } from './data.js';
import { state } from './state.js';

// Module-level player state
let apAudio       = null;
let apCurrentKey  = 'open-close-open';
let apStem        = null;
let apFavsAutoPlay = false;
let apFavsStartKey = 'bronze';

export function getApFavsAutoPlay()    { return apFavsAutoPlay; }
export function setApFavsAutoPlay(v)   { apFavsAutoPlay = v; }
export function getApFavsStartKey()    { return apFavsStartKey; }
export function setApFavsStartKey(key) { apFavsStartKey = key; }
export function getApAudio()           { return apAudio; }

export function buildAudioPlayer(rud) {
  const el  = document.getElementById('audioPlayer');
  const sec = document.getElementById('audioSection');
  const stem = VF_STEMS[rud.id] || null;
  apStem = stem;

  if (apAudio) { apAudio.pause(); apAudio.src = ''; }
  sec.style.display = '';

  if (!stem) {
    el.innerHTML = '<div class="ap-unavail">Audio no disponible para este rudimento.</div>';
    return;
  }

  apCurrentKey = apFavsAutoPlay ? apFavsStartKey : 'open-close-open';

  const btns = AP_TRACKS
    .map(t => `<button class="ap-track${t.key === apCurrentKey ? ' active' : ''}" data-key="${t.key}">${t.label}</button>`)
    .join('');

  el.innerHTML = `<div class="ap-tracks">${btns}</div>
    <div class="ap-controls">
      <button class="ap-play" id="apPlay">&#9654;</button>
      <div class="ap-progress-wrap" id="apProgressWrap"><div class="ap-progress-fill" id="apProgressFill"></div></div>
      <span class="ap-time" id="apTime">-:--</span>
    </div>`;

  apAudio = new Audio();
  apAudio.preload = 'none';
  apAudio.src = VF_BASE + apStem + apCurrentKey + '.mp3';

  el.querySelectorAll('.ap-track').forEach(btn => { btn.onclick = () => apSelectTrack(btn.dataset.key); });
  document.getElementById('apPlay').onclick         = apToggle;
  document.getElementById('apProgressWrap').onclick = e => {
    if (!apAudio || !apAudio.duration) return;
    const r = e.currentTarget.getBoundingClientRect();
    apAudio.currentTime = ((e.clientX - r.left) / r.width) * apAudio.duration;
  };

  apAudio.addEventListener('timeupdate', apUpdateProgress);
  apAudio.addEventListener('ended', _onEnded);
  apAudio.addEventListener('play',  () => apSetPlay(true));
  apAudio.addEventListener('pause', () => apSetPlay(false));

  if (apFavsAutoPlay) {
    apFavsAutoPlay = false;
    setTimeout(() => apAudio.play().catch(() => {}), 80);
  }
}

function _onEnded() {
  const idx = AP_TRACKS.findIndex(t => t.key === apCurrentKey);
  if (idx >= 0 && idx < AP_TRACKS.length - 1) {
    apSelectTrack(AP_TRACKS[idx + 1].key);
    apAudio.play().catch(() => {});
    return;
  }
  // Last track finished — advance in favs playlist if active
  if (state.currentView === 'favs') {
    // dispatch event so detail.js can handle favs auto-advance without circular import
    document.dispatchEvent(new CustomEvent('audio:ended-in-favs'));
  } else {
    apSetPlay(false);
  }
}

export function apSelectTrack(key) {
  const wasPlaying = apAudio && !apAudio.paused;
  if (apAudio) apAudio.pause();
  apCurrentKey = key;
  apAudio.src = VF_BASE + apStem + key + '.mp3';
  document.querySelectorAll('#audioPlayer .ap-track')
    .forEach(b => b.classList.toggle('active', b.dataset.key === key));
  apSetPlay(false);
  apResetBar();
  if (wasPlaying) apAudio.play().catch(() => {});
}

export function apToggle() {
  if (!apAudio) return;
  if (apAudio.paused) apAudio.play().catch(() => {});
  else apAudio.pause();
}

function apSetPlay(on) {
  const btn = document.getElementById('apPlay');
  if (!btn) return;
  btn.innerHTML = on ? '&#9646;&#9646;' : '&#9654;';
  btn.classList.toggle('playing', on);
}

function apResetBar() {
  const f = document.getElementById('apProgressFill');
  const t = document.getElementById('apTime');
  if (f) f.style.width = '0%';
  if (t) t.textContent = '-:--';
}

function apUpdateProgress() {
  if (!apAudio) return;
  const f = document.getElementById('apProgressFill');
  const t = document.getElementById('apTime');
  if (!f || !t) return;
  f.style.width = (apAudio.duration ? (apAudio.currentTime / apAudio.duration) * 100 : 0) + '%';
  const rem = apAudio.duration ? apAudio.duration - apAudio.currentTime : 0;
  t.textContent = `${Math.floor(rem / 60)}:${String(Math.floor(rem % 60)).padStart(2, '0')}`;
}
