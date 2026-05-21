/* ────────────────────────────────────────────────────────────
   DATA — Stick Control, G. L. Stone — Páginas 1-3 (ejercicios 1-72)
   16 golpes por ejercicio, formato XXXX|XXXX|XXXX|XXXX (4 grupos de 4).
   ──────────────────────────────────────────────────────────── */
const SECTIONS = [
  {
    id: 'P1',
    name: 'Página 1',
    patterns: [
      { ex:  1, beats: 'RLRL|RLRL|RLRL|RLRL' },
      { ex:  2, beats: 'LRLR|LRLR|LRLR|LRLR' },
      { ex:  3, beats: 'RRLL|RRLL|RRLL|RRLL' },
      { ex:  4, beats: 'LLRR|LLRR|LLRR|LLRR' },
      { ex:  5, beats: 'RLRR|LRLL|RLRR|LRLL' },
      { ex:  6, beats: 'RLLR|LRRL|RLLR|LRRL' },
      { ex:  7, beats: 'RRLR|LLRL|RRLR|LLRL' },
      { ex:  8, beats: 'RLRL|LRLR|RLRL|LRLR' },
      { ex:  9, beats: 'RRRL|RRRL|RRRL|RRRL' },
      { ex: 10, beats: 'LLLR|LLLR|LLLR|LLLR' },
      { ex: 11, beats: 'RLLL|RLLL|RLLL|RLLL' },
      { ex: 12, beats: 'LRRR|LRRR|LRRR|LRRR' },
      { ex: 13, beats: 'RRRR|LLLL|RRRR|LLLL' },
      { ex: 14, beats: 'RLRL|RRLL|RLRL|RRLL' },
      { ex: 15, beats: 'LRLR|LLRR|LRLR|LLRR' },
      { ex: 16, beats: 'RLRL|RLRR|LRLR|LRLL' },
      { ex: 17, beats: 'RLRL|RLLR|LRLR|LRRL' },
      { ex: 18, beats: 'RLRL|RRLR|LRLR|LLRL' },
      { ex: 19, beats: 'RLRL|RRRL|RLRL|RRRL' },
      { ex: 20, beats: 'LRLR|LLLR|LRLR|LLLR' },
      { ex: 21, beats: 'RLRL|RLLL|RLRL|RLLL' },
      { ex: 22, beats: 'LRLR|LRRR|LRLR|LRRR' },
      { ex: 23, beats: 'RLRL|RRRR|LRLR|LLLL' },
      { ex: 24, beats: 'RRLL|RLRR|LLRR|LRLL' },
    ]
  },
  {
    id: 'P2',
    name: 'Página 2',
    patterns: [
      { ex: 25, beats: 'RRLL|RLLR|LLRR|LRRL' },
      { ex: 26, beats: 'RRLL|RRLR|LLRR|LLRL' },
      { ex: 27, beats: 'RRLL|LLRR|RRLL|LLRR' },
      { ex: 28, beats: 'RRLL|RRRL|RRLL|RRRL' },
      { ex: 29, beats: 'LLRR|LLLR|LLRR|LLLR' },
      { ex: 30, beats: 'RRLL|RLLL|RRLL|RLLL' },
      { ex: 31, beats: 'LLRR|LRRR|LLRR|LRRR' },
      { ex: 32, beats: 'RRLL|RRRR|LLRR|LLLL' },
      { ex: 33, beats: 'RLRR|LRRL|RLRR|LRRL' },
      { ex: 34, beats: 'LRLL|RLLR|LRLL|RLLR' },
      { ex: 35, beats: 'RLRR|LLRL|RLRR|LLRL' },
      { ex: 36, beats: 'LRLL|RRLR|LRLL|RRLR' },
      { ex: 37, beats: 'RLRR|RLRR|RLRR|RLRR' },
      { ex: 38, beats: 'LRLL|LRLL|LRLL|LRLL' },
      { ex: 39, beats: 'RLRR|LLLR|LRLL|RRRL' },
      { ex: 40, beats: 'RLRR|LRRR|LRLL|RLLL' },
      { ex: 41, beats: 'RLRR|LLLL|RLRR|LLLL' },
      { ex: 42, beats: 'LRLL|RRRR|LRLL|RRRR' },
      { ex: 43, beats: 'RLLR|LLRL|RLLR|LLRL' },
      { ex: 44, beats: 'LRRL|RRLR|LRRL|RRLR' },
      { ex: 45, beats: 'RLLR|RLLR|RLLR|RLLR' },
      { ex: 46, beats: 'LRRL|LRRL|LRRL|LRRL' },
      { ex: 47, beats: 'RLLR|LLLR|LRRL|RRRL' },
      { ex: 48, beats: 'RLLR|LRRR|LRRL|RLLL' },
    ]
  },
  {
    id: 'P3',
    name: 'Página 3',
    patterns: [
      { ex: 49, beats: 'RLLR|LLLL|RLLR|LLLL' },
      { ex: 50, beats: 'LRRL|RRRR|LRRL|RRRR' },
      { ex: 51, beats: 'RRLR|RRLR|RRLR|RRLR' },
      { ex: 52, beats: 'LLRL|LLRL|LLRL|LLRL' },
      { ex: 53, beats: 'RRLR|LLLR|LLRL|RRRL' },
      { ex: 54, beats: 'RRLR|LRRR|LLRL|RLLL' },
      { ex: 55, beats: 'RRLR|LLLL|RRLR|LLLL' },
      { ex: 56, beats: 'LLRL|RRRR|LLRL|RRRR' },
      { ex: 57, beats: 'RRRL|LLLR|RRRL|LLLR' },
      { ex: 58, beats: 'RRRL|RLLL|RRRL|RLLL' },
      { ex: 59, beats: 'LLLR|LRRR|LLLR|LRRR' },
      { ex: 60, beats: 'RRRL|RRRR|LLLR|LLLL' },
      { ex: 61, beats: 'RLLL|LRRR|RLLL|LRRR' },
      { ex: 62, beats: 'RLLL|RRRR|LRRR|LLLL' },
      { ex: 63, beats: 'RRRL|LLRR|RLLL|RRRL' },
      { ex: 64, beats: 'LLLR|RRLL|LRRR|LLLR' },
      { ex: 65, beats: 'RRLR|RLRR|LRRL|RLRL' },
      { ex: 66, beats: 'LLRL|LRLL|RLLR|LRLR' },
      { ex: 67, beats: 'RLLR|LLRL|LRRL|RRLR' },
      { ex: 68, beats: 'LRRL|RRLR|RLRR|LRLR' },
      { ex: 69, beats: 'RLRR|LLLL|RRRR|LRLL' },
      { ex: 70, beats: 'RRLL|RLRR|LLLL|RRRR' },
      { ex: 71, beats: 'LLRR|LRLL|RRRR|LLLL' },
      { ex: 72, beats: 'RRRR|LLRR|LRRL|RLRL' },
    ]
  },
];

/* Flatten all patterns with section info */
const ALL = [];
SECTIONS.forEach(sec => sec.patterns.forEach(p => ALL.push({ ...p, secId: sec.id, secName: sec.name })));
const TOTAL = ALL.length;

/* ── State ── */
let currentIdx = 0;
let selectedPages = null; // null = all, Set<string> = specific page IDs
let filteredIdxs = ALL.map((_,i)=>i); // indices into ALL[]
let done = new Set(JSON.parse(localStorage.getItem('scDone')||'[]'));
let bpm = 152;
let isPlaying = false;
let loopCount = 0;
let currentMode  = 'reps20'; // 'biblioteca' | 'reps20' | 'wait2' | 'wait4'
let waitLeft     = 0;  // eighth-note steps remaining in between-exercise wait phase
let waitTotal    = 0;  // total steps in current wait phase (for UI label)
let repeatPending          = false; // "repeat last" pressed during exercise phase
let repeatAfterWait        = false; // "repeat last" pressed during wait phase
let repeatAfterWaitPrevIdx = -1;    // prev exercise idx to insert after wait ends
let currentBeat = 0;
let opts = { accent: true, sound: true };

/* ── Web Audio Metronome ── */
let audioCtx = null;
let schedulerTimer = null;
let nextNoteTime = 0.0;
let scheduledBeat = 0;
let scheduledBeatPos = 0; // cumulative quarter-note position within loop
let playheadRafId = null;
let phNoteStart   = 0;   // audio time when current note was scheduled to play
let phNoteDur     = 0;   // duration of current note in seconds
let phBeatIdx     = 0;   // note index within the 16-note loop (0-15)
const LOOKAHEAD      = 25.0;  // ms
const SCHEDULE_AHEAD = 0.1;   // s
// Playhead geometry — combined both-measure SVG
// lPad=12, noteW=40, groupGap=12, barGap=20, rPad=10
const PH_VBW        = 706;  // total viewBox width
const PH_NOTE_X     = [     // SVG x of each note centre
  12,  52,  92, 132, 184, 224, 264, 304,  // measure 1
  364, 404, 444, 484, 536, 576, 616, 656  // measure 2
];
const PH_NOTE_X_END = 696;  // endpoint after last note (note15 + noteW)

function initAudio(){ if(!audioCtx) audioCtx = new (window.AudioContext||window.webkitAudioContext)(); }

function scheduleClick(time, isAccent){
  if(!opts.sound) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain); gain.connect(audioCtx.destination);
  osc.frequency.value = isAccent ? 1100 : 820;
  gain.gain.setValueAtTime(isAccent ? 0.35 : 0.22, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.055);
  osc.start(time); osc.stop(time + 0.06);
}

function scheduler(){
  while(nextNoteTime < audioCtx.currentTime + SCHEDULE_AHEAD){
    const pat = currentPattern(); // re-fetched each note — enables seamless pattern switching
    const len = pat.length;
    const t = nextNoteTime;

    // ── Wait phase: blank measures between exercises (wait2 / wait4 modes) ──
    if(waitLeft > 0){
      const step = waitTotal - waitLeft;
      if(step % 2 === 0){                   // quarter-note boundary
        scheduleClick(t, step % 8 === 0);  // accent on measure downbeat
      }
      // Update wait ring every eighth-note step
      {
        const progress = step / waitTotal;
        const d = Math.max(0, (t - audioCtx.currentTime) * 1000 - 8);
        setTimeout(() => { setWaitRing(progress); }, d);
      }
      nextNoteTime += (60.0 / bpm) * 0.5;
      waitLeft--;
      // End of wait: if a repeat was requested, go back to the previous exercise first
      if(waitLeft === 0 && repeatAfterWait){
        repeatAfterWait = false;
        currentIdx      = repeatAfterWaitPrevIdx;
        repeatAfterWaitPrevIdx = -1;
        loopCount = 0;
        const d = Math.max(0, (nextNoteTime - audioCtx.currentTime) * 1000 - 16);
        setTimeout(() => {
          triggerFadeTransition();
          document.getElementById('repeatBtn').classList.remove('active');
        }, d);
      }
      if(waitLeft === 0){
        const d = Math.max(0, (nextNoteTime - audioCtx.currentTime) * 1000 - 16);
        setTimeout(() => hideWaitRing(), d);
      }
      continue;
    }

    // ── Normal beat ──
    const beat = scheduledBeat;
    const note = pat[beat];
    // Only click on quarter-note boundaries; accent on measure downbeat (every 4 beats)
    if(scheduledBeatPos % 1 === 0){
      scheduleClick(t, opts.accent && scheduledBeatPos % 4 === 0);
    }
    const noteDurSec    = (60.0 / bpm) * note.dur;
    const noteAudioTime = t;
    const delay = Math.max(0, (t - audioCtx.currentTime) * 1000 - 8);
    setTimeout(()=>{
      phNoteStart = noteAudioTime;
      phNoteDur   = noteDurSec;
      phBeatIdx   = beat;
      advanceBeatUI(beat, len);
    }, delay);
    nextNoteTime     += noteDurSec;
    scheduledBeatPos += note.dur;
    scheduledBeat     = (scheduledBeat + 1) % len;
    if(scheduledBeat === 0){
      loopCount++;
      scheduledBeatPos = 0;
      // ── reps20: seamless advance after 20 loops ──
      if(currentMode === 'reps20' && loopCount >= 20){
        doSeamlessAdvance(nextNoteTime);
      }
      // ── wait2 / wait4: transition fires immediately, then wait measures play ──
      if((currentMode === 'wait2' || currentMode === 'wait4') && loopCount >= 1){
        if(repeatPending){
          // Repeat requested during exercise: replay one more loop, then normal wait+advance
          repeatPending = false;
          loopCount = 0;
          const rb = document.getElementById('repeatBtn');
          if(rb) rb.classList.remove('active');
        } else {
          waitTotal = (currentMode === 'wait2') ? 16 : 32;
          waitLeft  = waitTotal;
          doSeamlessAdvance(nextNoteTime); // advance now — wait plays before new exercise
        }
      }
    }
  }
  schedulerTimer = setTimeout(scheduler, LOOKAHEAD);
}

function startPlay(){
  initAudio();
  if(audioCtx.state === 'suspended') audioCtx.resume();
  isPlaying = true;
  currentBeat = 0;
  scheduledBeat = 0;
  scheduledBeatPos = 0;
  loopCount    = 0;
  waitLeft     = 0;
  repeatPending = false;
  repeatAfterWait = false;
  repeatAfterWaitPrevIdx = -1;
  updateModeCounter();
  updateRepeatBtn();
  nextNoteTime = audioCtx.currentTime + 0.05;
  // Initialise playhead for note 0
  phBeatIdx   = 0;
  phNoteStart = nextNoteTime;
  phNoteDur   = (60.0 / bpm) * 0.5;
  if(!playheadRafId) playheadRafId = requestAnimationFrame(drawPlayhead);
  scheduler();
  document.getElementById('playBtn').classList.add('playing');
  document.getElementById('playBtn').innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>';
}

function stopPlay(){
  isPlaying = false;
  waitLeft  = 0;
  loopCount = 0;
  repeatPending = false;
  repeatAfterWait = false;
  repeatAfterWaitPrevIdx = -1;
  if(playheadRafId){ cancelAnimationFrame(playheadRafId); playheadRafId = null; }
  clearTimeout(schedulerTimer);
  clearAllBeats();
  document.getElementById('playBtn').classList.remove('playing');
  document.getElementById('playBtn').innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
  hideWaitRing();
  updateModeCounter();
  updateRepeatBtn();
}

function togglePlay(){
  if(isPlaying) stopPlay(); else startPlay();
}

/* ── Beat UI ── */
function advanceBeatUI(beat, totalBeats){
  currentBeat = beat;
  updateModeCounter();
}

function clearAllBeats(){
  const ph = document.querySelector('#beatDisplay .playhead');
  if(ph) ph.style.opacity = '0';
}

function updateRepeatBtn(){
  const btn = document.getElementById('repeatBtn');
  if(!btn) return;
  const show = isPlaying && (currentMode === 'wait2' || currentMode === 'wait4');
  btn.style.display = show ? 'inline-flex' : 'none';
  if(!show) btn.classList.remove('active');
}

function requestRepeat(){
  if(!isPlaying) return;
  if(currentMode !== 'wait2' && currentMode !== 'wait4') return;
  const btn = document.getElementById('repeatBtn');
  if(waitLeft === 0){
    // During exercise: set flag to replay one more time at loop boundary
    repeatPending = true;
    if(btn) btn.classList.add('active');
  } else {
    // During wait: after wait ends, go back to the previous exercise
    const fi = filteredIdxs.indexOf(currentIdx);
    if(fi <= 0) return;
    repeatAfterWait        = true;
    repeatAfterWaitPrevIdx = filteredIdxs[fi - 1];
    if(btn) btn.classList.add('active');
  }
}

function updateModeCounter(override){  const el = document.getElementById('modeCounter');
  if(!el) return;
  if(override !== undefined){ el.textContent = override; return; }
  const ring = document.getElementById('waitRing');
  const fill = document.getElementById('waitRingFill');
  switch(currentMode){
    case 'reps20':
      el.style.display = '';
      el.textContent = `Rep. ${loopCount + 1} / 20`;
      if(ring) ring.classList.remove('active', 'idle');
      break;
    case 'wait2':
    case 'wait4':
      el.style.display = '';
      el.textContent = '';
      if(ring && fill && !ring.classList.contains('active')){
        fill.style.animation = 'none';
        fill.style.strokeDashoffset = '94.25';
        ring.classList.remove('active');
        ring.classList.add('idle');
      }
      break;
    default:
      el.style.display = '';
      el.textContent = loopCount || '';
      if(ring) ring.classList.remove('active', 'idle');
      break;
  }
}

function setWaitRing(progress){
  if(progress > 0) return; // single CSS animation handles full depletion
  const ring = document.getElementById('waitRing');
  const fill = document.getElementById('waitRingFill');
  const el   = document.getElementById('modeCounter');
  if(!ring || !fill) return;
  const totalDur = (waitTotal * (60 / bpm) * 0.5).toFixed(3);
  ring.classList.remove('idle');
  ring.classList.add('active');
  if(el) el.style.display = 'none';
  // Cancel any previous animation, snap to full, then start flash + linear deplete
  fill.style.animation = 'none';
  fill.style.strokeDashoffset = '0';
  void fill.getBoundingClientRect(); // reflow to restart
  fill.style.animation =
    `wait-ring-flash 0.38s ease-out forwards, wait-ring-deplete ${totalDur}s linear forwards`;
}

function hideWaitRing(){
  const ring = document.getElementById('waitRing');
  const fill = document.getElementById('waitRingFill');
  const el   = document.getElementById('modeCounter');
  if(ring) ring.classList.remove('active');
  if(fill){ fill.style.animation = 'none'; fill.style.strokeDashoffset = '94.25'; }
  if(el) el.style.display = '';
  updateModeCounter();
}

function drawPlayhead(){
  if(!isPlaying){ playheadRafId = null; return; }
  const elapsed  = Math.max(0, audioCtx.currentTime - phNoteStart);
  const progress = phNoteDur > 0 ? Math.min(1, elapsed / phNoteDur) : 0;
  const x0  = PH_NOTE_X[phBeatIdx];
  const x1  = phBeatIdx < 15 ? PH_NOTE_X[phBeatIdx + 1] : PH_NOTE_X_END;
  const pct = (x0 + (x1 - x0) * progress) / PH_VBW * 100;
  const ph  = document.querySelector('#beatDisplay .playhead');
  if(ph){
    ph.style.left    = pct + '%';
    ph.style.opacity = '1';
  }
  playheadRafId = requestAnimationFrame(drawPlayhead);
}

/* ── Pattern data helpers ── */
function currentPattern(){
  const p = ALL[currentIdx];
  // Each exercise = 2 measures of 4/4: 16 eighth notes
  // dur = note duration in quarter-note beats (0.5 = eighth note)
  const base = p.beats.replace(/\|/g,'').split('').map(h => ({ hand: h, dur: 0.5 }));
  return base;
}

function groupsOf(p){
  if(p.beats.includes('|')) return p.beats.split('|').map(g=>g.split(''));
  const b = p.beats.split('');
  return [b.slice(0,4), b.slice(4)];
}

/* ── BPM ── */
function setBpm(v){
  bpm = Math.max(30, Math.min(220, v));
  document.getElementById('bpmDisplay').textContent = bpm;
  document.getElementById('bpmSlider').value = bpm;
  updateTempoPresets();
}

/* ── BPM dropdown ── */
function toggleBpmDropdown(e){
  e.stopPropagation();
  document.getElementById('bpmDropdown').classList.toggle('open');
}

/* ── Mode ── */
const MODE_LABELS = { biblioteca:'Bibl.', reps20:'×20', wait2:'Esp.2', wait4:'Esp.4' };
function setMode(m){
  currentMode = m;
  document.getElementById('modeDisplay').textContent = MODE_LABELS[m] || m;
  const isActive = m !== 'biblioteca';
  document.getElementById('modeTrigger').classList.toggle('mode-active', isActive);
  document.querySelectorAll('.mode-opt').forEach(b =>
    b.classList.toggle('active', b.dataset.mode === m));
  document.getElementById('modeDropdown').classList.remove('open');
  updateModeCounter();
  updateRepeatBtn();
  buildLibraryPanel();
}
function toggleModeDropdown(e){
  e.stopPropagation();
  document.getElementById('modeDropdown').classList.toggle('open');
}

document.addEventListener('click', function(){
  const dd = document.getElementById('bpmDropdown');
  if(dd) dd.classList.remove('open');
  const md = document.getElementById('modeDropdown');
  if(md) md.classList.remove('open');
});

const TEMPO_PRESETS = [
  { label:'Lento',   bpm: 60  },
  { label:'Medio',   bpm: 90  },
  { label:'Rápido',  bpm: 120 },
  { label:'Desafío', bpm: 160 },
];

function buildTempoPresets(){
  const wrap = document.getElementById('tempoPresets');
  wrap.innerHTML = '';
  TEMPO_PRESETS.forEach(t=>{
    const b = document.createElement('button');
    b.className = 'tempo-btn';
    b.dataset.bpm = t.bpm;
    b.textContent = t.label;
    b.onclick = ()=>{ setBpm(t.bpm); if(isPlaying){ stopPlay(); startPlay(); } };
    wrap.appendChild(b);
  });
  updateTempoPresets();
}

function updateTempoPresets(){
  document.querySelectorAll('.tempo-btn').forEach(b=>{
    b.classList.toggle('active', +b.dataset.bpm === bpm);
  });
}

/* ── Page picker ── */
function updateFilteredIdxs(){
  if(!selectedPages || selectedPages.size === 0){
    filteredIdxs = ALL.map((_,i)=>i);
  } else {
    filteredIdxs = ALL.reduce((acc,p,i)=>{
      if(selectedPages.has(p.secId)) acc.push(i);
      return acc;
    },[]);
  }
}

function buildPagePicker(){
  const wrap = document.getElementById('pagePicker');
  if(!wrap) return;
  wrap.innerHTML = '';
  const all = document.createElement('button');
  all.className = 'page-btn' + (!selectedPages ? ' active' : '');
  all.textContent = 'Todas';
  all.onclick = ()=>{ selectedPages = null; applyPageSelection(); };
  wrap.appendChild(all);
  SECTIONS.forEach(s=>{
    const b = document.createElement('button');
    b.className = 'page-btn' + (selectedPages && selectedPages.has(s.id) ? ' active' : '');
    b.textContent = s.name;
    b.onclick = ()=>togglePage(s.id);
    wrap.appendChild(b);
  });
}

function togglePage(id){
  if(!selectedPages){
    selectedPages = new Set([id]);
  } else {
    if(selectedPages.has(id)){
      selectedPages.delete(id);
      if(selectedPages.size === 0) selectedPages = null;
    } else {
      selectedPages.add(id);
      if(selectedPages.size === SECTIONS.length) selectedPages = null;
    }
  }
  applyPageSelection();
}

function applyPageSelection(){
  updateFilteredIdxs();
  if(!filteredIdxs.includes(currentIdx)) currentIdx = filteredIdxs[0] || 0;
  buildPagePicker();
  buildLibraryPanel();
  renderCard();
  updateNavArrows();
}

/* ── Library panel ── */
function buildLibraryPanel(){
  const wrap = document.getElementById('libraryPanel');
  if(!wrap) return;
  if(currentMode !== 'biblioteca'){
    wrap.classList.remove('open');
    wrap.innerHTML = '';
    return;
  }
  wrap.classList.add('open');
  wrap.innerHTML = '';
  filteredIdxs.forEach((allIdx)=>{
    const p = ALL[allIdx];
    const item = document.createElement('button');
    item.className = 'library-item' + (allIdx === currentIdx ? ' active' : '');
    item.dataset.idx = allIdx;
    item.innerHTML = `<span class="lib-ex">${p.secName} &middot; Ej.\u00a0${p.ex}</span><span class="lib-beats">${p.beats.replace(/\|/g,' ')}</span>`;
    item.onclick = ()=>selectPattern(allIdx, allIdx > currentIdx ? 1 : -1);
    wrap.appendChild(item);
  });
}

function refreshLibraryPanel(){
  if(currentMode !== 'biblioteca') return;
  document.querySelectorAll('.library-item').forEach(item=>{
    const idx = +item.dataset.idx;
    item.classList.toggle('active', idx === currentIdx);
  });
  const active = document.querySelector('.library-item.active');
  if(active) active.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

/* ── Beat SVG renderer ── */
// Single combined SVG: both measures + barline in the middle.
// Score-style: white box, staff line, proper barlines, black note elements + labels.
function buildBeatSVG(groups){
  const noteC  = '#2a3f52'; // note heads, stems, beams, labels
  const staffC = '#b8c8d4'; // staff line + barlines (subtle on white)
  const noteW = 40, groupGap = 12, lPad = 12, rPad = 10, barGap = 20;
  const noteY = 72, beamY = noteY - 38, beamH = 5; // beamY = 34
  const measureW = 8 * noteW + groupGap; // 332
  const vbW = lPad + measureW + barGap + measureW + rPad; // 706
  const vbH = 108;

  let s = `<svg viewBox="0 0 ${vbW} ${vbH}" class="beat-svg" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">`;

  // Staff line (full width, at note-head level)
  const staffX1 = lPad - 4, staffX2 = vbW - rPad + 2; // x=8 .. x=698
  s += `<line x1="${staffX1}" y1="${noteY}" x2="${staffX2}" y2="${noteY}" stroke="${staffC}" stroke-width="1.5"/>`;

  // Opening barline (left edge)
  s += `<line x1="${staffX1}" y1="${beamY-2}" x2="${staffX1}" y2="${noteY+7}" stroke="${staffC}" stroke-width="2" stroke-linecap="round"/>`;
  // Closing barline (right edge)
  s += `<line x1="${staffX2}" y1="${beamY-2}" x2="${staffX2}" y2="${noteY+7}" stroke="${staffC}" stroke-width="2" stroke-linecap="round"/>`;
  // Mid-measure barline (between the two measures)
  const midBarX = lPad + measureW + barGap / 2; // 354
  s += `<line x1="${midBarX}" y1="${beamY-2}" x2="${midBarX}" y2="${noteY+7}" stroke="${staffC}" stroke-width="1.5" stroke-linecap="round"/>`;
  // Notes
  let globalBeat = 0;
  [0, 1].forEach(mi => {
    let x = lPad + mi * (measureW + barGap); // m1: 12, m2: 364
    const measureGroups = groups.slice(mi * 2, mi * 2 + 2);
    measureGroups.forEach((group, gi) => {
      if(gi > 0) x += groupGap;
      const bx1 = x + 6, bx2 = x + (group.length - 1) * noteW + 6;
      s += `<rect x="${bx1}" y="${beamY}" width="${bx2-bx1}" height="${beamH}" rx="2.5" fill="${noteC}"/>`;
      group.forEach(hand => {
        const h = hand.toUpperCase() === 'R' ? 'R' : 'L';
        s += `<g class="beat-cell ${h}" data-beat="${globalBeat}">`;
        s += `<rect class="beat-bg" x="${x-13}" y="${beamY-4}" width="38" height="68" rx="7" fill="transparent"/>`;
        s += `<line x1="${x+6}" y1="${noteY-5}" x2="${x+6}" y2="${beamY}" stroke="${noteC}" stroke-width="2" stroke-linecap="round"/>`;
        s += `<ellipse cx="${x}" cy="${noteY}" rx="8" ry="5.8" fill="${noteC}" transform="rotate(-15 ${x} ${noteY})"/>`;
        s += `<text x="${x}" y="${noteY+22}" text-anchor="middle" fill="${noteC}" font-size="12" font-weight="700" font-family="Inter,sans-serif">${h}</text>`;
        s += `</g>`;
        x += noteW;
        globalBeat++;
      });
    });
  });

  s += '</svg>';
  return `<div class="beat-wrap"><div class="playhead"></div>${s}</div>`;
}

/* ── Card render ── */
function renderCard(dir){
  const p = ALL[currentIdx];
  document.getElementById('patternEx').textContent = `${p.secName} · Ejercicio ${p.ex}`;
  const pn = document.getElementById('patternName');
  if(pn) pn.textContent = p.beats.replace(/\|/g,' · ');
  document.getElementById('doneBtn')?.classList.toggle('active', done.has(currentIdx));

  // Build beat display
  const disp = document.getElementById('beatDisplay');
  const groups = groupsOf(p);
  disp.innerHTML = buildBeatSVG(groups);
  renderNextPreview();

  // Animate
  const card = document.getElementById('practiceCard');
  card.classList.remove('anim-in','anim-in-r');
  void card.offsetWidth;
  if(dir===1)  card.classList.add('anim-in');
  if(dir===-1) card.classList.add('anim-in-r');
}

function selectPattern(allIdx, dir){
  if(isPlaying){
    // Audio: stop, switch, restart immediately (< 5 ms gap)
    stopPlay();
    currentIdx = allIdx;
    startPlay();
    // Visual: crossfade to new exercise (content updated instantly so playhead is correct)
    triggerFadeTransition();
  } else {
    currentIdx = allIdx;
    renderCard(dir);
  }
  refreshLibraryPanel();
  updateNavArrows();
}

function navigate(dir){
  const fi = filteredIdxs.indexOf(currentIdx);
  const nfi = fi + dir;
  if(nfi < 0 || nfi >= filteredIdxs.length) return;
  selectPattern(filteredIdxs[nfi], dir);
}

function updateNavArrows(){
  const fi = filteredIdxs.indexOf(currentIdx);
  const prev = document.getElementById('navPrev');
  const next = document.getElementById('navNext');
  if(prev) prev.disabled = fi <= 0;
  if(next) next.disabled = fi >= filteredIdxs.length - 1;
}

/* ── Seamless transitions ── */
function renderNextPreview(){
  const nextDisp = document.getElementById('beatDisplayNext');
  if(!nextDisp) return;
  const fi = filteredIdxs.indexOf(currentIdx);
  if(fi >= filteredIdxs.length - 1){ nextDisp.innerHTML = ''; return; }
  const p = ALL[filteredIdxs[fi + 1]];
  nextDisp.innerHTML = buildBeatSVG(groupsOf(p));
}

function doSeamlessAdvance(transitionAudioTime){
  const fi = filteredIdxs.indexOf(currentIdx);
  if(fi >= filteredIdxs.length - 1) return; // already at last exercise
  currentIdx = filteredIdxs[fi + 1];
  loopCount  = 0;
  // Fire visual slide to coincide with the audio beat
  const delay = Math.max(0, (transitionAudioTime - audioCtx.currentTime) * 1000 - 16);
  setTimeout(triggerSlideTransition, delay);
}

/* Smooth slide: preview rises to become main, new preview fades in below.
   Used by reps20 auto-advance (always sequential). */
function triggerSlideTransition(){
  const disp     = document.getElementById('beatDisplay');
  const nextDisp = document.getElementById('beatDisplayNext');
  // No preview — instant swap
  if(!nextDisp || !nextDisp.firstElementChild){
    const p = ALL[currentIdx];
    disp.innerHTML = buildBeatSVG(groupsOf(p));
    document.getElementById('patternEx').textContent = `${p.secName} · Ejercicio ${p.ex}`;
    document.getElementById('doneBtn')?.classList.toggle('active', done.has(currentIdx));
    renderNextPreview(); refreshLibraryPanel(); updateNavArrows();
    return;
  }
  const shift = nextDisp.offsetTop - disp.offsetTop; // exact px gap between the two
  const dur   = 260;
  const ease  = 'cubic-bezier(0.4,0,0.2,1)';
  // Old main: fade out + float up slightly
  disp.style.transition = `transform ${dur}ms ${ease}, opacity ${dur}ms ease`;
  disp.style.transform  = `translateY(-${Math.round(shift * 0.35)}px)`;
  disp.style.opacity    = '0';
  // Preview → becomes new main: slide up to main position + brighten
  nextDisp.style.transition = `transform ${dur}ms ${ease}, opacity ${dur}ms ease`;
  nextDisp.style.transform  = `translateY(-${shift}px)`;
  nextDisp.style.opacity    = '1';
  setTimeout(() => {
    disp.style.transition     = 'none';
    nextDisp.style.transition = 'none';
    disp.style.transform      = '';
    disp.style.opacity        = '';
    nextDisp.style.transform  = '';
    nextDisp.style.opacity    = '0';
    // Render new current exercise
    const p = ALL[currentIdx];
    disp.innerHTML = buildBeatSVG(groupsOf(p));
    document.getElementById('patternEx').textContent = `${p.secName} · Ejercicio ${p.ex}`;
    document.getElementById('doneBtn')?.classList.toggle('active', done.has(currentIdx));
    renderNextPreview(); refreshLibraryPanel(); updateNavArrows();
    // Fade in new next preview
    requestAnimationFrame(() => requestAnimationFrame(() => {
      nextDisp.style.transition = 'opacity 0.28s ease';
      nextDisp.style.opacity    = ''; // revert to CSS 0.38
      setTimeout(() => { nextDisp.style.transition = ''; }, 320);
    }));
  }, dur + 20);
}

/* Quick crossfade: for manual navigation while playing.
   Content updated immediately so playhead tracks the correct (new) exercise. */
function triggerFadeTransition(){
  const disp     = document.getElementById('beatDisplay');
  const nextDisp = document.getElementById('beatDisplayNext');
  const p = ALL[currentIdx];
  disp.innerHTML = buildBeatSVG(groupsOf(p));
  document.getElementById('patternEx').textContent = `${p.secName} · Ejercicio ${p.ex}`;
  document.getElementById('doneBtn')?.classList.toggle('active', done.has(currentIdx));
  renderNextPreview();
  // Quick fade-in on the new content
  disp.style.opacity  = '0';
  disp.style.transition = 'none';
  requestAnimationFrame(() => requestAnimationFrame(() => {
    disp.style.transition = 'opacity 0.18s ease';
    disp.style.opacity    = '';
    setTimeout(() => { disp.style.transition = ''; }, 200);
  }));
}

/* ── Progress ── */
function toggleDone(){
  if(done.has(currentIdx)) done.delete(currentIdx);
  else done.add(currentIdx);
  localStorage.setItem('scDone', JSON.stringify([...done]));
  document.getElementById('doneBtn')?.classList.toggle('active', done.has(currentIdx));
  refreshLibraryPanel();
  updateProgress();
}

function updateProgress(){
  const n = done.size;
  const dc = document.getElementById('doneCount'); if(dc) dc.textContent = n;
  const tc = document.getElementById('totalCount'); if(tc) tc.textContent = TOTAL;
  const pf = document.getElementById('progressFill'); if(pf) pf.style.width = (n/TOTAL*100)+'%';
}

/* ── Keyboard shortcuts ── */
document.addEventListener('keydown', e=>{
  if(e.target.tagName==='INPUT') return;
  if(e.code==='Space'){ e.preventDefault(); togglePlay(); }
  if(e.code==='ArrowRight'){ e.preventDefault(); navigate(1); }
  if(e.code==='ArrowLeft'){ e.preventDefault(); navigate(-1); }
});

/* ── Init ── */
function init(){
  buildPagePicker();
  buildTempoPresets();
  renderCard();
  updateNavArrows();
  updateProgress();
  setMode(currentMode); // apply default mode to button UI
}

init();

(function () {
  /* Fade-in on load */
  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      document.body.classList.add('page-loaded');
    });
  });

  document.querySelectorAll('a[href]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var href = this.getAttribute('href');
      if (!href || href.startsWith('#') || this.target) return;
      try { if (new URL(href, location.href).origin !== location.origin) return; } catch (_) { return; }
      e.preventDefault();
      document.body.classList.add('page-exit');
      setTimeout(function () { location.href = href; }, 340);
    });
  });
})();
