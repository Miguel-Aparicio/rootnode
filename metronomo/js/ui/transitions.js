/**
 * ui/transitions.js — Animaciones de entrada y salida de página.
 *
 * Al cargar: añade 'page-loaded' al <body> (fade-in via CSS).
 * Al navegar: intercepta enlaces del mismo origen, añade 'page-exit'
 *             y navega tras 340 ms para que el CSS tenga tiempo de animar.
 */

'use strict';

export function init() {
  // Fade-in al cargar
  requestAnimationFrame(() => document.body.classList.add('page-loaded'));

  // Fade-out al navegar
  document.addEventListener('click', e => {
    const link = e.target.closest('a[href]');
    if (!link) return;
    const href = link.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('javascript:')) return;
    try {
      const url = new URL(href, location.href);
      if (url.origin !== location.origin) return;  // enlace externo → comportamiento normal
      e.preventDefault();
      document.body.classList.add('page-exit');
      setTimeout(() => { location.href = url.href; }, 340);
    } catch {
      // href inválido → dejamos que el navegador lo maneje
    }
  });
}
