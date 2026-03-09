/**
 * ui/timesig.js — Selector de compás, modo Libre y selector de figuras.
 */

'use strict';

import { state, DEN_VALUES } from '../state.js';
import {
  setBeats, setDenominator, setIsLibre,
  setSubdivisions, setRandomMode, restart,
} from '../metronome.js';
import { buildDots } from './pendulum.js';

const tsNumEl    = document.getElementById('ts-num');
const tsDenEl    = document.getElementById('ts-den');
const tsLibreBtn = document.getElementById('ts-libre');
const timeSigEl  = document.getElementById('ts-display');
const numUpBtn   = document.getElementById('num-up');
const numDownBtn = document.getElementById('num-down');
const denUpBtn   = document.getElementById('den-up');
const denDownBtn = document.getElementById('den-down');
const noteSelEl  = document.getElementById('note-sel');

export function renderTimeSig() {
  const { beats, denominator, isLibre } = state;
  tsNumEl.textContent = beats;
  tsDenEl.textContent = denominator;
  numUpBtn.disabled   = isLibre || beats >= 16;
  numDownBtn.disabled = isLibre || beats <= 1;
  const di = DEN_VALUES.indexOf(denominator);
  denUpBtn.disabled   = isLibre || di >= DEN_VALUES.length - 1;
  denDownBtn.disabled = isLibre || di <= 0;
  timeSigEl.classList.toggle('libre', isLibre);
  tsLibreBtn.classList.toggle('active', isLibre);
}

export function init() {
  renderTimeSig();

  numUpBtn.addEventListener('click', () => {
    if (state.beats >= 16) return;
    setIsLibre(false);
    setBeats(state.beats + 1);
    buildDots(state.beats);
    renderTimeSig();
    if (state.running) restart();
  });

  numDownBtn.addEventListener('click', () => {
    if (state.beats <= 1) return;
    setIsLibre(false);
    setBeats(state.beats - 1);
    buildDots(state.beats);
    renderTimeSig();
    if (state.running) restart();
  });

  denUpBtn.addEventListener('click', () => {
    const i = DEN_VALUES.indexOf(state.denominator);
    if (i >= DEN_VALUES.length - 1) return;
    setIsLibre(false);
    setDenominator(DEN_VALUES[i + 1]);
    renderTimeSig();
  });

  denDownBtn.addEventListener('click', () => {
    const i = DEN_VALUES.indexOf(state.denominator);
    if (i <= 0) return;
    setIsLibre(false);
    setDenominator(DEN_VALUES[i - 1]);
    renderTimeSig();
  });

  tsLibreBtn.addEventListener('click', () => {
    setIsLibre(!state.isLibre);
    buildDots(state.beats);
    renderTimeSig();
    if (state.running) restart();
  });

  // Selector de figuras / subdivisiones
  noteSelEl.querySelectorAll('.note-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      noteSelEl.querySelectorAll('.note-btn').forEach(b => {
        b.classList.remove('active', 'rand-active');
      });
      if (btn.dataset.sub === 'random') {
        setRandomMode(true);
        btn.classList.add('rand-active');
      } else {
        setRandomMode(false);
        btn.classList.add('active');
        setSubdivisions(parseFloat(btn.dataset.sub));
        if (state.running) restart();
      }
    });
  });
}
