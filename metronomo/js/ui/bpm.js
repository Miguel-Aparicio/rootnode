/**
 * ui/bpm.js — Controles de tempo: display, slider, botones ±1 y tap tempo.
 */

'use strict';

import { state } from '../state.js';
import { setBPM, start, stop, restart } from '../metronome.js';

const bpmDisplay = document.getElementById('bpm-display');
const bpmSlider  = document.getElementById('bpm-slider');
const btnMinus   = document.getElementById('btn-minus');
const btnPlus    = document.getElementById('btn-plus');
const btnStart   = document.getElementById('btn-start');
const pendulumWrap = document.getElementById('pendulum-wrap');
const btnTap     = document.getElementById('btn-tap');

const tapTimes = [];

export function renderBPM(value) {
  bpmDisplay.textContent = value;
  bpmSlider.value        = value;
  const pct = ((value - 5) / 295 * 100).toFixed(1) + '%';
  bpmSlider.style.setProperty('--pct', pct);
}

export function init() {
  renderBPM(state.bpm);

  btnMinus.addEventListener('click', () => renderBPM(setBPM(state.bpm - 1)));
  btnPlus.addEventListener('click',  () => renderBPM(setBPM(state.bpm + 1)));

  bpmSlider.addEventListener('input', () => renderBPM(setBPM(+bpmSlider.value)));

  bpmDisplay.addEventListener('blur', () => {
    const v = parseInt(bpmDisplay.textContent, 10);
    renderBPM(setBPM(isNaN(v) ? 120 : v));
  });
  bpmDisplay.addEventListener('keydown', e => {
    if (e.key === 'Enter')      { e.preventDefault(); bpmDisplay.blur(); }
    if (e.key === 'ArrowUp')    { e.preventDefault(); renderBPM(setBPM(state.bpm + 1)); }
    if (e.key === 'ArrowDown')  { e.preventDefault(); renderBPM(setBPM(state.bpm - 1)); }
  });
  bpmDisplay.addEventListener('wheel', e => {
    e.preventDefault();
    renderBPM(setBPM(state.bpm + (e.deltaY < 0 ? 1 : -1)));
  }, { passive: false });

  // Play / Pause
  btnStart.addEventListener('click', e => {
    e.stopPropagation();
    if (state.running) {
      stop();
    } else {
      pendulumWrap.classList.add('is-running');
      start();
    }
  });
  pendulumWrap.addEventListener('click', () => { if (state.running) stop(); });

  // Tap tempo
  btnTap.addEventListener('click', () => {
    const now = performance.now();
    tapTimes.push(now);
    if (tapTimes.length > 8) tapTimes.shift();
    if (tapTimes.length >= 2) {
      const intervals = [];
      for (let i = 1; i < tapTimes.length; i++) intervals.push(tapTimes[i] - tapTimes[i - 1]);
      const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      renderBPM(setBPM(Math.round(60000 / avg)));
    }
  });
}
