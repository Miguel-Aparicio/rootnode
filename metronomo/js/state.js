/**
 * state.js — Objeto de estado centralizado del metrónomo.
 *
 * Fuente única de verdad para todos los módulos. Nunca se modifica directamente
 * desde fuera; se usa a través de las funciones de metronome.js o ui/*.js.
 */

'use strict';

export const state = {
  // Tempo
  bpm: 120,

  // Compás
  beats: 4,
  denominator: 4,
  isLibre: false,

  // Subdivisión / figura
  subdivisions: 1,   // ≥1 sub-divide, <1 pulso más lento
  randomMode: false,

  // Sonido
  soundType: 'digital',

  // Reproducción
  running: false,

  // Temporizador
  timerEnabled:   false,
  timerTotal:     0,
  timerRemaining: 0,
};

export const DEN_VALUES = [2, 4, 8, 16];
