/**
 * app.js — Punto de entrada de la aplicación Tiki Metrónomo.
 *
 * Solo inicializa los módulos de UI; toda la lógica vive en sus respectivos
 * módulos. El motor (metronome.js) se comunica con la UI mediante CustomEvents.
 */

'use strict';

import { state } from './state.js';
import { buildDots, init as initPendulum } from './ui/pendulum.js';
import { init as initBPM }         from './ui/bpm.js';
import { init as initTimeSig }     from './ui/timesig.js';
import { init as initTimer }       from './ui/timer.js';
import { init as initSettings }    from './ui/settings.js';
import { init as initTransitions } from './ui/transitions.js';

// Construir los puntos de compás con el estado inicial
buildDots(state.beats);

// Inicializar cada módulo de UI
initPendulum();
initBPM();
initTimeSig();
initTimer();
initSettings();
initTransitions();
