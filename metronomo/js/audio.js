/**
 * audio.js — Motor de síntesis de sonido para el metrónomo Tiki.
 *
 * Responsabilidades:
 *   - Gestionar el AudioContext (Web Audio API)
 *   - Sintetizar los diferentes sonidos/ticks del metrónomo
 *   - Reproducir la alarma de fin de temporizador
 *   - Exponer funciones de reproducción (playClick, playSubClick, speakBeat, playAlarm)
 */

'use strict';

// ─── Estado del contexto de audio ────────────────────────────────────────────

let audioCtx = null;

export function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
}

export function getAudioCtx() {
  return audioCtx;
}

// ─── Catálogo de sonidos disponibles ─────────────────────────────────────────

export const SOUNDS = [
  { id: 'digital',    icon: '📳', name: 'Digital',    cat: 'Electrónico' },
  { id: 'sine-lo',    icon: '〰️', name: 'Sine Grave', cat: 'Electrónico' },
  { id: 'sine-hi',    icon: '🔹', name: 'Sine Agudo', cat: 'Electrónico' },
  { id: 'triangle-w', icon: '🔻', name: 'Triangular', cat: 'Electrónico' },
  { id: 'chip',       icon: '🎮', name: 'Chip',       cat: 'Electrónico' },
  { id: 'fm',         icon: '📻', name: 'FM',         cat: 'Electrónico' },
  { id: 'click',      icon: '🎯', name: 'Click',      cat: 'Click'       },
  { id: 'cajon',      icon: '📦', name: 'Cajón',      cat: 'Orgánico'   },
  { id: 'woodblock',  icon: '🪵', name: 'Woodblock',  cat: 'Orgánico'   },
];

// ─── Primitivas de síntesis ───────────────────────────────────────────────────

function _nb(dur) {
  const n = Math.ceil(audioCtx.sampleRate * dur);
  const buf = audioCtx.createBuffer(1, n, audioCtx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}

function _osc(t, wave, freq, g0, len, gm) {
  const o = audioCtx.createOscillator(), g = audioCtx.createGain();
  o.type = wave; o.frequency.value = freq;
  g.gain.setValueAtTime(g0 * gm, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + len);
  o.connect(g); g.connect(audioCtx.destination);
  o.start(t); o.stop(t + len + 0.01);
}

function _oscDrop(t, f0, f1, dropT, g0, len, gm) {
  const o = audioCtx.createOscillator(), g = audioCtx.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(f0, t);
  o.frequency.exponentialRampToValueAtTime(f1, t + dropT);
  g.gain.setValueAtTime(g0 * gm, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + len);
  o.connect(g); g.connect(audioCtx.destination);
  o.start(t); o.stop(t + len + 0.01);
}

function _nbp(t, freq, Q, g0, len, gm) {
  const src = audioCtx.createBufferSource();
  src.buffer = _nb(Math.max(len + 0.01, 0.02));
  const f = audioCtx.createBiquadFilter();
  f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = Q;
  const g = audioCtx.createGain();
  g.gain.setValueAtTime(g0 * gm, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + len);
  src.connect(f); f.connect(g); g.connect(audioCtx.destination);
  src.start(t);
}

function _nhp(t, freq, g0, len, gm) {
  const src = audioCtx.createBufferSource();
  src.buffer = _nb(Math.max(len + 0.01, 0.02));
  const f = audioCtx.createBiquadFilter();
  f.type = 'highpass'; f.frequency.value = freq;
  const g = audioCtx.createGain();
  g.gain.setValueAtTime(g0 * gm, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + len);
  src.connect(f); f.connect(g); g.connect(audioCtx.destination);
  src.start(t);
}

function _nlp(t, freq, g0, len, gm) {
  const src = audioCtx.createBufferSource();
  src.buffer = _nb(Math.max(len + 0.01, 0.02));
  const f = audioCtx.createBiquadFilter();
  f.type = 'lowpass'; f.frequency.value = freq;
  const g = audioCtx.createGain();
  g.gain.setValueAtTime(g0 * gm, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + len);
  src.connect(f); f.connect(g); g.connect(audioCtx.destination);
  src.start(t);
}

// ─── Sintetizador principal ───────────────────────────────────────────────────

function _synth(id, accent, t, gm) {
  gm = gm || 1;
  const a = accent;
  switch (id) {
    // ── Electrónico ──────────────────────────────────────────────────────────
    case 'digital':    _osc(t,'sine',    a?1200:800,  a?.6:.35,  .08, gm); break;
    case 'sine-lo':    _osc(t,'sine',    a?280:180,   a?.55:.32, .18, gm); break;
    case 'sine-hi':    _osc(t,'sine',    a?3200:2400, a?.45:.28, .045,gm); break;
    case 'square':     _osc(t,'square',  a?900:600,   a?.32:.19, .07, gm); break;
    case 'saw':        _osc(t,'sawtooth',a?750:500,   a?.26:.15, .09, gm); break;
    case 'triangle-w': _osc(t,'triangle',a?1050:700,  a?.55:.34, .12, gm); break;
    case 'chip':       _osc(t,'square',  a?3800:2800, a?.38:.23, .03, gm); break;
    case 'retro':      _osc(t,'sawtooth',a?300:200,   a?.38:.23, .14, gm); break;
    case 'pulse':
      _osc(t,'square', a?600:400, a?.2:.12, .09, gm);
      _osc(t,'square', a?608:404, a?.2:.12, .09, gm); break;
    case 'fm': {
      const cf = a ? 660 : 440;
      const mod = audioCtx.createOscillator(), modG = audioCtx.createGain();
      const car = audioCtx.createOscillator(), carG = audioCtx.createGain();
      mod.frequency.value = cf;
      modG.gain.setValueAtTime(cf * 3.5, t); modG.gain.exponentialRampToValueAtTime(cf * .1, t + .07);
      mod.connect(modG); modG.connect(car.frequency);
      car.frequency.value = cf;
      carG.gain.setValueAtTime((a ? .5 : .3) * gm, t); carG.gain.exponentialRampToValueAtTime(.0001, t + .09);
      car.connect(carG); carG.connect(audioCtx.destination);
      mod.start(t); mod.stop(t + .1); car.start(t); car.stop(t + .1);
      break;
    }
    // ── Click ────────────────────────────────────────────────────────────────
    case 'click':
      _nbp(t, a?2200:1700, .7, a?1:.62,  .028, gm);
      _osc(t,'sine', a?1050:820, a?.22:.13, .018, gm); break;
    case 'click-soft': _nbp(t, a?1000:750,  2,   a?.6:.38,  .05,  gm); break;
    case 'click-hi':   _nbp(t, a?4500:3500, 1.5, a?.8:.5,   .018, gm); break;
    case 'snap':       _nhp(t, a?5500:4000, a?.7:.44, .022, gm);        break;
    case 'toc':        _nbp(t, a?900:650,   3,   a?.75:.47, .06,  gm); break;
    case 'pop':        _nlp(t, a?320:220,   a?.8:.5,   .06,  gm);      break;
    case 'tick':       _nbp(t, a?2200:1700, 4,   a?.7:.44,  .014, gm); break;
    case 'tac':
      _nbp(t, a?3000:2200, 1, a?.65:.4, .022, gm);
      _osc(t,'sine', a?1500:1100, a?.15:.09, .015, gm); break;
    case 'crack': {
      const src = audioCtx.createBufferSource();
      src.buffer = _nb(.02);
      const gg = audioCtx.createGain();
      gg.gain.setValueAtTime((a?.9:.56)*gm, t); gg.gain.exponentialRampToValueAtTime(.0001, t+.015);
      src.connect(gg); gg.connect(audioCtx.destination); src.start(t);
      break;
    }
    case 'thud':
      _nlp(t, a?280:200, a?.8:.5, .07, gm);
      _oscDrop(t, a?180:130, a?60:45, .05, a?.45:.28, .09, gm); break;
    // ── Percusión ────────────────────────────────────────────────────────────
    case 'tom':      _oscDrop(t, a?310:210, a?118:80, .13, a?.9:.58, .24, gm); break;
    case 'tom-lo':   _oscDrop(t, a?200:140, a?70:50,  .16, a?.9:.58, .3,  gm); break;
    case 'kick': {
      _oscDrop(t, a?180:130, a?50:38, .08, a?.95:.65, .22, gm);
      const s2 = audioCtx.createBufferSource(); s2.buffer = _nb(.02);
      const lp2 = audioCtx.createBiquadFilter(); lp2.type='lowpass'; lp2.frequency.value=300;
      const g2 = audioCtx.createGain();
      g2.gain.setValueAtTime((a?.38:.24)*gm,t); g2.gain.exponentialRampToValueAtTime(.0001,t+.018);
      s2.connect(lp2); lp2.connect(g2); g2.connect(audioCtx.destination); s2.start(t);
      break;
    }
    case 'bongo-hi': _oscDrop(t, a?520:380, a?200:148, .08, a?.8:.5,  .14, gm); break;
    case 'bongo-lo': _oscDrop(t, a?280:200, a?105:76,  .1,  a?.8:.5,  .17, gm); break;
    case 'conga':    _oscDrop(t, a?380:280, a?145:106, .1,  a?.85:.54, .19, gm); break;
    case 'darbuka':  _oscDrop(t, a?620:460, a?240:178, .06, a?.85:.54, .12, gm); break;
    case 'timbal':   _oscDrop(t, a?460:340, a?176:130, .09, a?.85:.54, .17, gm); break;
    case 'floor-tom':_oscDrop(t, a?120:85,  a?42:30,   .22, a?.9:.58,  .38, gm); break;
    case 'rimshot':
      _nbp(t, a?1400:1100, 2, a?.8:.5, .04, gm);
      _osc(t,'sine', a?1800:1400, a?.28:.17, .025, gm); break;
    // ── Metálico ─────────────────────────────────────────────────────────────
    case 'metal':    _nhp(t, a?7500:5500, a?.65:.38, a?.06:.038, gm);  break;
    case 'hat-open': _nhp(t, a?7000:5000, a?.55:.33, a?.32:.2,   gm);  break;
    case 'cymbal':
      _nhp(t, a?6000:4500, (a?.4:.24)*gm, .5,  1);
      _nbp(t, a?8500:6500, .5, (a?.3:.18)*gm,  .38, 1); break;
    case 'cowbell':
      _osc(t,'square', a?562:420, a?.32:.2,  .3, gm);
      _osc(t,'square', a?845:632, a?.18:.11, .3, gm); break;
    case 'tri-perc': _osc(t,'sine', a?5500:4000, a?.5:.3, .6, gm); break;
    case 'bell':
      [[1,.5],[2.756,.12],[5.404,.04],[8.201,.02]].forEach(([r,v]) =>
        _osc(t,'sine', (a?880:660)*r, v*(a?1:.62)*gm, 1.2, 1)); break;
    case 'gong':
      [[1,.6],[1.41,.15],[1.78,.08]].forEach(([r,v]) =>
        _osc(t,'sine', (a?180:130)*r, v*(a?1:.62)*gm, 2.0, 1)); break;
    case 'vibra': {
      const ov = audioCtx.createOscillator(), gv = audioCtx.createGain();
      ov.type='sine'; ov.frequency.value = a?880:660;
      gv.gain.setValueAtTime(.0001,t); gv.gain.linearRampToValueAtTime((a?.6:.36)*gm, t+.018);
      gv.gain.exponentialRampToValueAtTime(.0001, t+.5);
      ov.connect(gv); gv.connect(audioCtx.destination); ov.start(t); ov.stop(t+.52);
      break;
    }
    case 'xylo':
      _oscDrop(t, a?2400:1800, a?2150:1620, .06, a?.7:.44, .18, gm);
      _osc(t,'sine', (a?2400:1800)*2, (a?.1:.06)*gm, .08, 1); break;
    case 'ride':
      _nhp(t, a?8000:6500, (a?.45:.28)*gm, .15, 1);
      _osc(t,'sine', a?3600:2800, (a?.12:.07)*gm, .12, 1); break;
    // ── Orgánico ─────────────────────────────────────────────────────────────
    case 'cajon':
      _oscDrop(t, a?90:65, a?35:25, .1, a?.85:.54, .25, gm);
      _nlp(t, a?500:380, (a?.5:.3)*gm, .04, 1); break;
    case 'clap':
      [0,.008,.016].forEach(d => _nbp(t+d, a?1500:1200, 1, (a?.55:.34)*gm, .04, 1)); break;
    case 'fingersnap': _nhp(t, a?4500:3500, a?.5:.3, .025, gm); break;
    case 'claves':
      [a?2500:2200, a?2900:2560].forEach(f => _osc(t,'sine', f, (a?.52:.35)*gm, .042, 1)); break;
    case 'woodblock':
      _nbp(t, a?900:700, 4, a?.7:.44, .05, gm);
      _osc(t,'sine', a?900:700, a?.28:.17, .035, gm); break;
    case 'maracas':    _nhp(t, a?8500:7000, a?.5:.3, .025, gm); break;
    case 'shaker':
      [0,.01,.02].forEach(d => _nhp(t+d, 6000, (a?.2:.12)*gm, .02, 1)); break;
    case 'guiro': {
      const sg = audioCtx.createBufferSource(); sg.buffer = _nb(.18);
      const hg = audioCtx.createBiquadFilter(); hg.type='highpass'; hg.frequency.value=4000;
      const gg = audioCtx.createGain();
      gg.gain.setValueAtTime((a?.5:.3)*gm, t); gg.gain.setValueAtTime((a?.5:.3)*gm, t+.08);
      gg.gain.exponentialRampToValueAtTime(.0001, t+.18);
      sg.connect(hg); hg.connect(gg); gg.connect(audioCtx.destination); sg.start(t);
      break;
    }
    case 'cabasa':
      [0,.04,.08].forEach(d => _nhp(t+d, a?6500:5000, (a?.35:.22)*gm, .03, 1)); break;
  }
}

// ─── API pública ──────────────────────────────────────────────────────────────

export function speakBeat(num, accent) {
  if (typeof speechSynthesis === 'undefined') return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(String(num));
  u.lang = 'es-ES'; u.rate = 1.9;
  u.pitch  = accent ? 1.5 : 1.0;
  u.volume = accent ? 1.0 : 0.75;
  speechSynthesis.speak(u);
}

export function playClick(soundType, accent, time) {
  if (!audioCtx || soundType === 'voz') return;
  const t = time !== undefined ? time : audioCtx.currentTime;
  _synth(soundType, accent, t, 1);
}

export function playSubClick(soundType, time) {
  if (!audioCtx || soundType === 'voz') return;
  _synth(soundType, false, time, 0.35);
}

export function playAlarm() {
  initAudio();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  // Tres campanadas suaves con armónicos (efecto campana/chime)
  const notes = [523.25, 659.25, 783.99]; // Do5 - Mi5 - Sol5 (acorde Mayor)
  notes.forEach((freq, i) => {
    const t = audioCtx.currentTime + i * 0.45;
    [1, 2.756, 5.404].forEach((ratio, j) => {
      const osc  = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain); gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq * ratio, t);
      const vol = [0.5, 0.15, 0.05][j];
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(vol, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);
      osc.start(t);
      osc.stop(t + 1.3);
    });
  });
}
