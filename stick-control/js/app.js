/* ────────────────────────────────────────────────────────────
   DATA — Stick Control, G. L. Stone — Páginas 1-3 (ejercicios 1-72)
   8 golpes por ejercicio. D=Derecha, I=Izquierda. | = separador de grupo visual.
   Cada par impar/par es espejo D↔I (ej: 1 y 2, 3 y 4, etc.)
   ──────────────────────────────────────────────────────────── */
const SECTIONS = [
  {
    id: 'P1',
    name: 'Página 1',
    patterns: [
      { ex:  1, beats: 'DIDI|DIDI' },
      { ex:  2, beats: 'IDID|IDID' },
      { ex:  3, beats: 'DDII|DDII' },
      { ex:  4, beats: 'IIDD|IIDD' },
      { ex:  5, beats: 'DIDI|DDII' },
      { ex:  6, beats: 'IDID|IIDD' },
      { ex:  7, beats: 'DDII|DIDI' },
      { ex:  8, beats: 'IIDD|IDID' },
      { ex:  9, beats: 'DIID|DIID' },
      { ex: 10, beats: 'IDDI|IDDI' },
      { ex: 11, beats: 'DIDD|DDII' },
      { ex: 12, beats: 'IDII|IIDD' },
      { ex: 13, beats: 'DIDD|DIDD' },
      { ex: 14, beats: 'IDII|IDII' },
      { ex: 15, beats: 'DIDI|DIDD' },
      { ex: 16, beats: 'IDID|IDII' },
      { ex: 17, beats: 'DIDD|DIDI' },
      { ex: 18, beats: 'IDII|IDID' },
      { ex: 19, beats: 'DDID|DDID' },
      { ex: 20, beats: 'IIDI|IIDI' },
      { ex: 21, beats: 'DIDI|DDID' },
      { ex: 22, beats: 'IDID|IIDI' },
      { ex: 23, beats: 'DDID|DIDI' },
      { ex: 24, beats: 'IIDI|IDID' },
    ]
  },
  {
    id: 'P2',
    name: 'Página 2',
    patterns: [
      { ex: 25, beats: 'DIID|DIDI' },
      { ex: 26, beats: 'IDDI|IDID' },
      { ex: 27, beats: 'DIDI|DIID' },
      { ex: 28, beats: 'IDID|IDDI' },
      { ex: 29, beats: 'DDII|DIID' },
      { ex: 30, beats: 'IIDD|IDDI' },
      { ex: 31, beats: 'DIID|DDII' },
      { ex: 32, beats: 'IDDI|IIDD' },
      { ex: 33, beats: 'DIDD|DIID' },
      { ex: 34, beats: 'IDII|IDDI' },
      { ex: 35, beats: 'DIID|DIDD' },
      { ex: 36, beats: 'IDDI|IDII' },
      { ex: 37, beats: 'DDID|DIID' },
      { ex: 38, beats: 'IIDI|IDDI' },
      { ex: 39, beats: 'DIID|DDID' },
      { ex: 40, beats: 'IDDI|IIDI' },
      { ex: 41, beats: 'DIDI|DIDD' },
      { ex: 42, beats: 'IDID|IDII' },
      { ex: 43, beats: 'DIDD|DIDI' },
      { ex: 44, beats: 'IDII|IDID' },
      { ex: 45, beats: 'DDII|DIDD' },
      { ex: 46, beats: 'IIDD|IDII' },
      { ex: 47, beats: 'DIDD|DDII' },
      { ex: 48, beats: 'IDII|IIDD' },
    ]
  },
  {
    id: 'P3',
    name: 'Página 3',
    patterns: [
      { ex: 49, beats: 'DDID|DIDI' },
      { ex: 50, beats: 'IIDI|IDID' },
      { ex: 51, beats: 'DIDI|DDID' },
      { ex: 52, beats: 'IDID|IIDI' },
      { ex: 53, beats: 'DIDD|DDID' },
      { ex: 54, beats: 'IDII|IIDI' },
      { ex: 55, beats: 'DDID|DIDD' },
      { ex: 56, beats: 'IIDI|IDII' },
      { ex: 57, beats: 'DIID|DDID' },
      { ex: 58, beats: 'IDDI|IIDI' },
      { ex: 59, beats: 'DDID|DIID' },
      { ex: 60, beats: 'IIDI|IDDI' },
      { ex: 61, beats: 'DDII|DDID' },
      { ex: 62, beats: 'IIDD|IIDI' },
      { ex: 63, beats: 'DDID|DDII' },
      { ex: 64, beats: 'IIDI|IIDD' },
      { ex: 65, beats: 'DDII|DIDD' },
      { ex: 66, beats: 'IIDD|IDII' },
      { ex: 67, beats: 'DIDD|DDID' },
      { ex: 68, beats: 'IDII|IIDI' },
      { ex: 69, beats: 'DDID|DIDD' },
      { ex: 70, beats: 'IIDI|IDII' },
      { ex: 71, beats: 'DIID|DIDD' },
      { ex: 72, beats: 'IDDI|IDII' },
    ]
  },
];

/* Flatten all patterns with section info */
const ALL = [];
SECTIONS.forEach(sec => sec.patterns.forEach(p => ALL.push({ ...p, secId: sec.id, secName: sec.name })));
const TOTAL = ALL.length;

/* ── State ── */
let currentIdx = 0;
let currentSection = 'all';
let filteredIdxs = ALL.map((_,i)=>i); // indices into ALL[]
let done = new Set(JSON.parse(localStorage.getItem('scDone')||'[]'));
let bpm = 80;
let isPlaying = false;
let loopCount = 0;
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
  const pat = currentPattern();
  const len = pat.length;
  while(nextNoteTime < audioCtx.currentTime + SCHEDULE_AHEAD){
    const beat = scheduledBeat;
    const note = pat[beat];
    const t    = nextNoteTime;
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
  loopCount = 0;
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
  if(playheadRafId){ cancelAnimationFrame(playheadRafId); playheadRafId = null; }
  clearTimeout(schedulerTimer);
  clearAllBeats();
  document.getElementById('playBtn').classList.remove('playing');
  document.getElementById('playBtn').innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
  document.getElementById('loopCount').textContent = '0';
  document.getElementById('beatCounterLabel').textContent = 'Pulso: — / ' + currentPattern().length;
}

function togglePlay(){
  if(isPlaying) stopPlay(); else startPlay();
}

/* ── Beat UI ── */
function advanceBeatUI(beat, totalBeats){
  currentBeat = beat;
  document.getElementById('loopCount').textContent = loopCount;
  document.getElementById('beatCounterLabel').textContent = `Pulso: ${beat+1} / ${totalBeats}`;
}

function clearAllBeats(){
  const ph = document.querySelector('.playhead');
  if(ph) ph.style.opacity = '0';
  document.getElementById('beatCounterLabel').textContent = 'Pulso: — / ' + currentPattern().length;
}

function drawPlayhead(){
  if(!isPlaying){ playheadRafId = null; return; }
  const elapsed  = Math.max(0, audioCtx.currentTime - phNoteStart);
  const progress = phNoteDur > 0 ? Math.min(1, elapsed / phNoteDur) : 0;
  const x0  = PH_NOTE_X[phBeatIdx];
  const x1  = phBeatIdx < 15 ? PH_NOTE_X[phBeatIdx + 1] : PH_NOTE_X_END;
  const pct = (x0 + (x1 - x0) * progress) / PH_VBW * 100;
  const ph  = document.querySelector('.playhead');
  if(ph){
    ph.style.left    = pct + '%';
    ph.style.opacity = '1';
  }
  playheadRafId = requestAnimationFrame(drawPlayhead);
}

/* ── Pattern data helpers ── */
function currentPattern(){
  const p = ALL[currentIdx];
  // Each exercise = 2 measures of 4/4: the 8-note pattern played twice
  // dur = note duration in quarter-note beats (0.5 = eighth note)
  const base = p.beats.replace(/\|/g,'').split('').map(h => ({ hand: h, dur: 0.5 }));
  return [...base, ...base];
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
  const bpmSvgLabel = document.getElementById('bpm-svg-label');
  if(bpmSvgLabel) bpmSvgLabel.textContent = bpm + ' BPM';
  updateTempoPresets();
}

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

/* ── Section tabs ── */
function buildSectionTabs(){
  const wrap = document.getElementById('sectionTabs');
  wrap.innerHTML = '';
  const all = document.createElement('button');
  all.className = 'section-tab' + (currentSection==='all'?' active':'');
  all.textContent = 'Todos';
  all.onclick = ()=>setSection('all');
  wrap.appendChild(all);
  SECTIONS.forEach(s=>{
    const b = document.createElement('button');
    b.className = 'section-tab' + (currentSection===s.id?' active':'');
    b.textContent = s.name;
    b.onclick = ()=>setSection(s.id);
    wrap.appendChild(b);
  });
}

function setSection(id){
  currentSection = id;
  if(id==='all') filteredIdxs = ALL.map((_,i)=>i);
  else filteredIdxs = ALL.reduce((acc,p,i)=>{ if(p.secId===id) acc.push(i); return acc; },[]);
  currentIdx = filteredIdxs[0]||0;
  buildSectionTabs();
  buildChips();
  renderCard();
  updateNavArrows();
}

/* ── Chips ── */
function buildChips(){
  const wrap = document.getElementById('patternChips');
  wrap.innerHTML = '';
  filteredIdxs.forEach((allIdx, fi)=>{
    const p = ALL[allIdx];
    const chip = document.createElement('button');
    chip.className = 'pattern-chip' + (allIdx===currentIdx?' active':'');
    chip.innerHTML = `<span class="chip-dot"></span>Ej. ${p.ex}${done.has(allIdx)?'<span class="chip-done">✓</span>':''}`;
    chip.onclick = ()=>{ selectPattern(allIdx, allIdx>currentIdx?1:-1); };
    wrap.appendChild(chip);
  });
}

function refreshChips(){
  const chips = document.querySelectorAll('.pattern-chip');
  filteredIdxs.forEach((allIdx,fi)=>{
    const chip = chips[fi];
    if(!chip) return;
    chip.className = 'pattern-chip' + (allIdx===currentIdx?' active':'');
    chip.innerHTML = `<span class="chip-dot"></span>Ej. ${ALL[allIdx].ex}${done.has(allIdx)?'<span class="chip-done">✓</span>':''}`;
  });
}

/* ── Beat SVG renderer ── */
// Single combined SVG: both measures + barline in the middle.
// White score box; note heads/stems/beams in black; R/L labels in colour.
function buildBeatSVG(groups){
  const colR  = '#fb7185', colL = '#60a5fa';
  const noteC = '#1e293b'; // stems, noteheads, beams
  const barC  = 'rgba(30,41,59,0.2)';
  const noteW = 40, groupGap = 12, lPad = 12, rPad = 10, barGap = 20;
  const noteY = 58, beamY = noteY - 38, beamH = 5;
  const measureW = 8 * noteW + groupGap; // 332
  const vbW = lPad + measureW + barGap + measureW + rPad; // 706
  const vbH = 90;

  let s = `<svg viewBox="0 0 ${vbW} ${vbH}" class="beat-svg" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">`;

  // White score background
  s += `<rect x="4" y="6" width="${vbW-8}" height="80" rx="8" fill="#f8fafc" stroke="rgba(0,0,0,0.07)" stroke-width="1"/>`;

  // BPM label — top-right, above the beam
  s += `<text id="bpm-svg-label" x="${vbW-12}" y="${beamY-4}" text-anchor="end" fill="#64748b" font-size="11" font-weight="600" font-family="Inter,sans-serif">${bpm} BPM</text>`;

  let globalBeat = 0;
  [0, 1].forEach(mi => {
    let x = lPad + mi * (measureW + barGap); // m1: 12, m2: 364
    groups.forEach((group, gi) => {
      if(gi > 0) x += groupGap;
      const bx1 = x + 6, bx2 = x + (group.length - 1) * noteW + 6;
      s += `<rect x="${bx1}" y="${beamY}" width="${bx2-bx1}" height="${beamH}" rx="2.5" fill="${noteC}"/>`;
      group.forEach(hand => {
        const isRight = hand.toUpperCase() === 'D';
        const h   = isRight ? 'R' : 'L';
        const col = isRight ? colR : colL; // label colour only
        s += `<g class="beat-cell ${h}" data-beat="${globalBeat}">`;
        s += `<rect class="beat-bg" x="${x-13}" y="${beamY-4}" width="38" height="68" rx="7" fill="transparent"/>`;
        s += `<line x1="${x+6}" y1="${noteY-5}" x2="${x+6}" y2="${noteY-38}" stroke="${noteC}" stroke-width="2.5" stroke-linecap="round"/>`;
        s += `<ellipse cx="${x}" cy="${noteY}" rx="9" ry="6.2" fill="${noteC}" transform="rotate(-15 ${x} ${noteY})"/>`;
        s += `<text x="${x}" y="${noteY+21}" text-anchor="middle" fill="${col}" font-size="12" font-weight="700" font-family="Inter,sans-serif">${h}</text>`;
        s += `</g>`;
        x += noteW;
        globalBeat++;
      });
    });
  });

  // Barline centred in barGap between the two measures
  const barX = lPad + measureW + barGap / 2; // 354
  s += `<line x1="${barX}" y1="${beamY-4}" x2="${barX}" y2="${noteY+8}" stroke="${barC}" stroke-width="1.5" stroke-linecap="round"/>`;

  s += '</svg>';
  return `<div class="beat-wrap"><div class="playhead"></div>${s}</div>`;
}

/* ── Card render ── */
function renderCard(dir){
  const p = ALL[currentIdx];
  document.getElementById('patternEx').textContent = `${p.secName} · Ejercicio ${p.ex}`;
  document.getElementById('patternName').textContent = p.beats.replace(/\|/g,' · ');
  document.getElementById('doneBtn').classList.toggle('active', done.has(currentIdx));

  // Build beat display
  const disp = document.getElementById('beatDisplay');
  const groups = groupsOf(p);
  disp.innerHTML = buildBeatSVG(groups);

  document.getElementById('beatCounterLabel').textContent = 'Pulso: — / ' + currentPattern().length;

  // Animate
  const card = document.getElementById('practiceCard');
  card.classList.remove('anim-in','anim-in-r');
  void card.offsetWidth;
  if(dir===1)  card.classList.add('anim-in');
  if(dir===-1) card.classList.add('anim-in-r');
}

function selectPattern(allIdx, dir){
  if(isPlaying) stopPlay();
  currentIdx = allIdx;
  renderCard(dir);
  refreshChips();
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
  document.getElementById('navPrev').disabled = fi <= 0;
  document.getElementById('navNext').disabled = fi >= filteredIdxs.length - 1;
}

/* ── Progress ── */
function toggleDone(){
  if(done.has(currentIdx)) done.delete(currentIdx);
  else done.add(currentIdx);
  localStorage.setItem('scDone', JSON.stringify([...done]));
  document.getElementById('doneBtn').classList.toggle('active', done.has(currentIdx));
  refreshChips();
  updateProgress();
}

function updateProgress(){
  const n = done.size;
  document.getElementById('doneCount').textContent = n;
  document.getElementById('totalCount').textContent = TOTAL;
  document.getElementById('progressFill').style.width = (n/TOTAL*100)+'%';
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
  buildSectionTabs();
  buildChips();
  buildTempoPresets();
  renderCard();
  updateNavArrows();
  updateProgress();
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
