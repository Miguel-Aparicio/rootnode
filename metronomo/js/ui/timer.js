/**
 * ui/timer.js — Temporizador de práctica: campos h/m/s, presets, spin buttons,
 *               countdown y barra de progreso.
 *
 * Escucha 'metro:tick'  → actualiza conteo regresivo y barra.
 * Escucha 'metro:stop'  → re-habilita campos.
 * Escucha 'metro:expired' → (stop ya lo maneja; aquí podríamos añadir feedback extra).
 */

'use strict';

import { state } from '../state.js';
import { setTimerEnabled, setTimerFromSeconds, getTimerSeconds } from '../metronome.js';

const timerToggle    = document.getElementById('timer-toggle');
const timerBody      = document.getElementById('timer-body');
const timerHrInput   = document.getElementById('timer-hr');
const timerMinInput  = document.getElementById('timer-min');
const timerSecInput  = document.getElementById('timer-sec');
const timerCountdown = document.getElementById('timer-countdown');
const timerBar       = document.getElementById('timer-bar');

function formatTime(s) {
  const h   = Math.floor(s / 3600);
  const m   = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return String(h).padStart(2, '0') + ':' +
         String(m).padStart(2, '0') + ':' +
         String(sec).padStart(2, '0');
}

function renderCountdown(remaining, total) {
  timerCountdown.textContent = formatTime(remaining);
  const pct     = total > 0 ? (remaining / total * 100) : 100;
  timerBar.style.width = pct + '%';
  const urgent  = remaining <= 10;
  const warning = !urgent && remaining <= 30;
  timerBar.classList.toggle('urgent',  urgent);
  timerBar.classList.toggle('warning', warning);
  timerCountdown.className =
    'timer-countdown' + (urgent ? ' urgent' : warning ? ' warning' : '');
}

function setFieldsDisabled(disabled) {
  [timerHrInput, timerMinInput, timerSecInput].forEach(el => (el.disabled = disabled));
  timerBody.querySelectorAll('.spin-btn, .preset-btn').forEach(el => (el.disabled = disabled));
}

function syncFromInputs() {
  const secs = getTimerSeconds(timerHrInput.value, timerMinInput.value, timerSecInput.value);
  setTimerFromSeconds(secs);
  renderCountdown(secs, secs);
}

function setFieldValues(totalSecs) {
  timerHrInput.value  = Math.floor(totalSecs / 3600);
  timerMinInput.value = Math.floor((totalSecs % 3600) / 60);
  timerSecInput.value = totalSecs % 60;
}

export function init() {
  // Timer toggle (habilitar/deshabilitar)
  timerToggle.addEventListener('change', () => {
    setTimerEnabled(timerToggle.checked);
    timerBody.classList.toggle('visible', state.timerEnabled);
    if (state.timerEnabled) syncFromInputs();
  });

  // Inputs manuales
  [timerHrInput, timerMinInput, timerSecInput].forEach(el => {
    el.addEventListener('input', syncFromInputs);
  });

  // Spin buttons
  timerBody.querySelectorAll('.spin-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const field = btn.dataset.field;
      const dir   = parseInt(btn.dataset.dir, 10);
      const input = field === 'hr' ? timerHrInput
                  : field === 'min' ? timerMinInput
                  : timerSecInput;
      const max = field === 'hr' ? 23 : 59;
      let val = (parseInt(input.value, 10) || 0) + dir;
      if (val < 0)   val = max;
      if (val > max) val = 0;
      input.value = val;
      syncFromInputs();
    });
  });

  // Preset buttons
  timerBody.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const secs = parseInt(btn.dataset.s, 10);
      setFieldValues(secs);
      setTimerFromSeconds(secs);
      renderCountdown(secs, secs);
    });
  });

  // Evento tick del motor → actualizar display
  document.addEventListener('metro:tick', ({ detail: { remaining, total } }) => {
    setFieldsDisabled(true);
    renderCountdown(remaining, total);
  });

  // Al detener (manual o por expiración) → re-habilitar
  document.addEventListener('metro:stop', () => {
    setFieldsDisabled(false);
    renderCountdown(state.timerTotal, state.timerTotal);
  });
}
