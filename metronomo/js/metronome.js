/**
 * metronome.js — Núcleo del metrónomo: scheduling de audio y lógica de tempo.
 *
 * Responsabilidades:
 *   - Leer y mutar el estado centralizado (state.js)
 *   - Programar los ticks de audio con precisión (Web Audio lookahead)
 *   - Generar patrones rítmicos aleatorios
 *   - Comunicar eventos a la UI mediante CustomEvents del DOM (sin acoplamiento)
 *   - Controlar el temporizador de práctica
 *
 * Eventos DOM que emite (en document):
 *   'metro:beat'    → { detail: { beat, tick, beatDur } }
 *   'metro:stop'    → (sin detail)
 *   'metro:tick'    → { detail: { remaining, total } }
 *   'metro:expired' → (sin detail)
 */

'use strict';

import { state } from './state.js';
import {
  initAudio, getAudioCtx,
  playClick, playSubClick, speakBeat, playAlarm,
} from './audio.js';

// ─── Estado interno del scheduler (no expuesto) ───────────────────────────────

let _currentBeat  = 0;
let _tickCount    = 0;
let _nextBeatTime = 0;
let _intervalID   = null;
let _schedGen     = 0;   // invalida callbacks visuales pendientes al detener
let _timerID      = null;

let _randPattern    = [];
let _randPatternIdx = 0;

// ─── Emisor de eventos ────────────────────────────────────────────────────────

function _emit(name, detail) {
  document.dispatchEvent(new CustomEvent(name, detail ? { detail } : undefined));
}

// ─── Mutadores de estado ──────────────────────────────────────────────────────

export function setBPM(v) {
  const oldBpm = state.bpm;
  state.bpm = Math.min(300, Math.max(5, Math.round(v)));

  const ctx = getAudioCtx();
  if (_intervalID && ctx) {
    const oldBeatDur = (60.0 / oldBpm)    * (4 / state.denominator);
    const newBeatDur = (60.0 / state.bpm) * (4 / state.denominator);
    const now       = ctx.currentTime;
    const beatStart = _nextBeatTime - oldBeatDur;
    const phase     = Math.min(1, Math.max(0, (now - beatStart) / oldBeatDur));
    _nextBeatTime   = now + newBeatDur * (1 - phase);
  }
  return state.bpm;
}

export function setBeats(n) {
  state.beats = n;
  _currentBeat = 0;
}

export function setDenominator(d) {
  state.denominator = d;
}

export function setSubdivisions(v) {
  state.subdivisions = v;
}

export function setRandomMode(enabled) {
  state.randomMode = enabled;
  if (enabled) { _randPattern = []; _randPatternIdx = 0; }
}

export function setSoundType(id) {
  state.soundType = id;
}

export function setIsLibre(libre) {
  state.isLibre = libre;
  if (libre) { state.beats = 0; _currentBeat = 0; }
  else        state.beats = state.beats || 4;
}

export function setTimerEnabled(enabled) {
  state.timerEnabled = enabled;
}

export function setTimerFromSeconds(totalSecs) {
  state.timerRemaining = totalSecs;
  state.timerTotal     = totalSecs;
}

export function getTimerSeconds(h, m, s) {
  return (Math.max(0, parseInt(h) || 0)) * 3600
       + (Math.max(0, parseInt(m) || 0)) * 60
       + Math.max(0, Math.min(59, parseInt(s) || 0));
}

// ─── Generador de patrones aleatorios ────────────────────────────────────────

function _generateRandPattern(barStartTime, unitDur, totalUnits) {
  const events = [];
  let pos = 0;
  function pickDur(avail) {
    const pool = [1,1,1, 2,2,2,2, 3,3, 4].filter(d => d <= avail);
    return pool[Math.floor(Math.random() * pool.length)];
  }
  while (pos < totalUnits) {
    const avail  = totalUnits - pos;
    const dur    = pickDur(avail);
    const isRest = Math.random() < (pos === 0 ? 0.22 : 0.38);
    events.push({ time: barStartTime + pos * unitDur, isRest, isAccent: pos === 0 });
    pos += dur;
  }
  return events;
}

// ─── Scheduler principal ──────────────────────────────────────────────────────

function _schedule() {
  const ctx        = getAudioCtx();
  const { bpm, beats, denominator, subdivisions, randomMode, soundType } = state;
  const beatDur    = (60.0 / bpm) * (4 / denominator);
  const barBeats   = beats > 0 ? beats : 4;
  const unitDur    = beatDur / 2;
  const totalUnits = barBeats * 2;

  while (_nextBeatTime < ctx.currentTime + 0.1) {
    const isAccent   = beats > 0 && _currentBeat === 0;
    const isBarStart = (_currentBeat === 0) || (beats === 0 && _tickCount % barBeats === 0);

    if (randomMode) {
      if (isBarStart) {
        _randPattern    = _generateRandPattern(_nextBeatTime, unitDur, totalUnits);
        _randPatternIdx = 0;
      }
    } else {
      if (subdivisions >= 1) {
        playClick(soundType, isAccent, _nextBeatTime);
        const subCount    = subdivisions > 1 ? Math.round(subdivisions) : 0;
        const subInterval = subCount > 0 ? beatDur / subCount : 0;
        for (let s = 1; s < subCount; s++) {
          playSubClick(soundType, _nextBeatTime + s * subInterval);
        }
      } else {
        const every = Math.round(1 / subdivisions);
        const ref   = beats > 0 ? _currentBeat : _tickCount;
        if (ref % every === 0) playClick(soundType, isAccent, _nextBeatTime);
      }
    }

    // Voz: adelantar ~130 ms para compensar la latencia de speechSynthesis
    if (soundType === 'voz') {
      const vDelay = Math.max(0, (_nextBeatTime - ctx.currentTime - 0.13) * 1000);
      const vBeat  = _currentBeat, vAcc = isAccent, vGen = _schedGen, vTick = _tickCount;
      setTimeout(() => {
        if (vGen !== _schedGen) return;
        speakBeat(beats > 0 ? vBeat + 1 : (vTick % 4) + 1, vAcc);
      }, vDelay);
    }

    // Evento visual programado para coincidir con el tick de audio
    const beat  = _currentBeat;
    const tick  = _tickCount;
    const when  = _nextBeatTime;
    const gen   = _schedGen;
    const delay = (when - ctx.currentTime) * 1000;
    setTimeout(() => {
      if (gen !== _schedGen) return;
      _emit('metro:beat', { beat, tick, beatDur });
    }, Math.max(0, delay));

    _currentBeat  = beats > 0 ? (_currentBeat + 1) % beats : 0;
    _tickCount++;
    _nextBeatTime += beatDur;
  }

  // Reproducir eventos del patrón aleatorio dentro del lookahead
  if (randomMode) {
    while (
      _randPatternIdx < _randPattern.length &&
      _randPattern[_randPatternIdx].time < ctx.currentTime + 0.1
    ) {
      const evt = _randPattern[_randPatternIdx++];
      if (!evt.isRest) playClick(state.soundType, evt.isAccent, evt.time);
    }
  }
}

// ─── Control play / stop ──────────────────────────────────────────────────────

export function start() {
  initAudio();
  const ctx = getAudioCtx();
  if (ctx.state === 'suspended') ctx.resume();
  state.running  = true;
  _currentBeat   = 0;
  _tickCount     = 0;
  _randPattern   = [];
  _randPatternIdx = 0;
  _nextBeatTime  = ctx.currentTime + 0.05;
  _intervalID    = setInterval(_schedule, 25);
  _startCountdown();
}

export function stop() {
  _schedGen++;
  state.running = false;
  clearInterval(_intervalID);
  _stopCountdown();
  _emit('metro:stop');
}

export function restart() {
  stop();
  start();
}

// ─── Temporizador ─────────────────────────────────────────────────────────────

function _startCountdown() {
  if (!state.timerEnabled || state.timerTotal <= 0) return;
  state.timerRemaining = state.timerTotal;
  _emit('metro:tick', { remaining: state.timerRemaining, total: state.timerTotal });
  _timerID = setInterval(() => {
    state.timerRemaining--;
    _emit('metro:tick', { remaining: state.timerRemaining, total: state.timerTotal });
    if (state.timerRemaining <= 0) {
      clearInterval(_timerID);
      stop();
      playAlarm();
      _emit('metro:expired');
    }
  }, 1000);
}

function _stopCountdown() {
  clearInterval(_timerID);
}
