/**
 * ui/settings.js — Ajustes: selector de sonido, cambio de tema y navegación
 *                  entre la vista principal y la vista de ajustes.
 */

'use strict';

import { state } from '../state.js';
import { setSoundType } from '../metronome.js';
import { SOUNDS, initAudio, getAudioCtx, playClick, speakBeat } from '../audio.js';

const gearBtn      = document.getElementById('gear-btn');
const metroView    = document.getElementById('metro-view');
const settingsView = document.getElementById('settings-view');
const themeToggle  = document.getElementById('theme-toggle');
const themeIcon    = document.getElementById('theme-icon');
const themeLabel   = document.getElementById('theme-label');

let inSettings = false;

// ─── Tema ─────────────────────────────────────────────────────────────────────

function applyTheme(light) {
  document.documentElement.classList.toggle('light', light);
  themeToggle.checked    = light;
  themeIcon.textContent  = light ? '☀️' : '🌙';
  themeLabel.textContent = light ? 'Modo claro' : 'Modo oscuro';
  localStorage.setItem('metTheme', light ? 'light' : 'dark');
}

// ─── Sound Picker ─────────────────────────────────────────────────────────────

function updatePickerDisplay(soundId) {
  const s = SOUNDS.find(x => x.id === soundId) || SOUNDS[0];
  document.getElementById('sound-picker-icon').textContent  = s.icon;
  document.getElementById('sound-picker-label').textContent = s.name;
}

function buildSoundPicker() {
  const dropdown = document.getElementById('sound-dropdown');
  dropdown.innerHTML = '';
  SOUNDS.forEach(s => {
    const btn = document.createElement('button');
    btn.type      = 'button';
    btn.className = 'sound-dropdown-item' + (s.id === state.soundType ? ' active' : '');
    btn.dataset.sound = s.id;
    btn.innerHTML =
      `<span class="sound-dropdown-icon">${s.icon}</span>` +
      `<span class="sound-dropdown-name">${s.name}</span>`;
    dropdown.appendChild(btn);
  });
  updatePickerDisplay(state.soundType);
}

function previewSound() {
  const ctx = getAudioCtx();
  const t   = ctx.currentTime + 0.02;
  if (state.soundType === 'voz') speakBeat(1, true);
  else playClick(state.soundType, true, t);
}

// ─── Init ─────────────────────────────────────────────────────────────────────

export function init() {
  // Tema inicial
  applyTheme(localStorage.getItem('metTheme') === 'light');
  themeToggle.addEventListener('change', () => applyTheme(themeToggle.checked));

  // Sound picker
  buildSoundPicker();

  document.getElementById('sound-picker-btn').addEventListener('click', e => {
    e.stopPropagation();
    document.getElementById('sound-picker').classList.toggle('open');
  });

  document.getElementById('sound-dropdown').addEventListener('click', e => {
    const btn = e.target.closest('[data-sound]');
    if (!btn) return;
    setSoundType(btn.dataset.sound);
    document.querySelectorAll('.sound-dropdown-item').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    updatePickerDisplay(state.soundType);
    document.getElementById('sound-picker').classList.remove('open');
    initAudio();
    const ctx = getAudioCtx();
    if (ctx.state === 'suspended') ctx.resume().then(previewSound);
    else previewSound();
  });

  document.addEventListener('click', e => {
    const picker = document.getElementById('sound-picker');
    if (picker && !picker.contains(e.target)) picker.classList.remove('open');
  });

  // Gear button (metro ↔ settings)
  gearBtn.addEventListener('click', () => {
    inSettings = !inSettings;
    gearBtn.classList.toggle('in-settings', inSettings);
    gearBtn.title = inSettings ? 'Volver' : 'Ajustes';
    if (inSettings) {
      metroView.classList.add('hidden');
      settingsView.classList.add('visible');
    } else {
      settingsView.classList.remove('visible');
      metroView.classList.remove('hidden');
    }
  });
}
