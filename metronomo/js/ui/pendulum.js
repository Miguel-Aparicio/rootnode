/**
 * ui/pendulum.js — Animación del péndulo y puntos de compás.
 *
 * Escucha 'metro:beat' y 'metro:stop' del DOM para actualizar la UI
 * sin conocer nada del motor de audio o del estado.
 */

'use strict';

const beatsEl      = document.getElementById('beats');
const pendulum     = document.getElementById('pendulum');
const pendulumWrap = document.getElementById('pendulum-wrap');

export function buildDots(count) {
  beatsEl.innerHTML = '';
  if (count === 0) return;
  for (let i = 0; i < count; i++) {
    const d = document.createElement('div');
    d.className = 'beat-dot' + (i === 0 ? ' accent' : '');
    beatsEl.appendChild(d);
  }
}

function onBeat({ detail: { beat, tick, beatDur } }) {
  beatsEl.querySelectorAll('.beat-dot').forEach(d => d.classList.remove('active'));
  const dot = beatsEl.querySelectorAll('.beat-dot')[beat];
  if (dot) dot.classList.add('active');
  const angle = tick % 2 === 0 ? -28 : 28;
  pendulum.style.transform  = `rotate(${angle}deg)`;
  pendulum.style.transition = `transform ${(beatDur * 0.85).toFixed(3)}s ease-in-out`;
}

function onStop() {
  beatsEl.querySelectorAll('.beat-dot').forEach(d => d.classList.remove('active'));
  pendulum.style.transition = 'transform 0.6s cubic-bezier(0.34,1.56,0.64,1)';
  pendulum.style.transform  = 'rotate(0deg)';
  pendulumWrap.classList.remove('is-running');
}

export function init() {
  document.addEventListener('metro:beat', onBeat);
  document.addEventListener('metro:stop', onStop);
}
