# migueguay.ddns.net — Raspberry Pi 5

Proyecto personal corriendo en una Raspberry Pi 5 con Nginx y Let's Encrypt. La idea es ir construyendo mini-apps web sobre temas que me interesen, todas en vanilla HTML/CSS/JS — sin frameworks, sin bundler, sin build step. Lo que hay en disco es lo que recibe el navegador.

No hay backend de aplicación: Nginx sirve estáticos directamente desde `/var/www/rootnode/`. Toda la lógica es client-side.

---

## Estructura

```
/var/www/rootnode/
├── index.html          ← Página de inicio
├── metronomo/
│   ├── index.html
│   ├── css/styles.css
│   └── js/
│       ├── app.js
│       ├── state.js
│       ├── metronome.js
│       ├── audio.js
│       └── ui/
│           ├── pendulum.js
│           ├── bpm.js
│           ├── timesig.js
│           ├── timer.js
│           ├── settings.js
│           └── transitions.js
├── rudimentos/
│   └── index.html
└── stick-control/
    └── index.html
```

---

## `index.html` — la página de inicio

Es un único archivo autocontenido: HTML + `<style>` + `<script>` inline. Tiene sentido así porque no hay lógica real, solo presentación: un grid de tarjetas con las apps disponibles y algo de animación.

### Las tarjetas

Cada app es un `<a class="app-card" href="/app/">`. El grid usa `auto-fill` con `minmax(160px, 1fr)`, así se adapta al ancho sin media queries.

### La animación al hacer click

Cuando el usuario pulsa una tarjeta, el script intercepta el evento antes de navegar para hacer una pequeña escena:

1. Añade la clase `card-active` a la tarjeta, que dispara tres animaciones CSS simultáneas: destello en el borde (`cardGlow`), rebote del icono (`iconBlast`) y flash del texto (`nameFlash`).
2. Llama a `spawnRings()`, que inyecta tres `<div class="card-ring">` como hijos de la tarjeta — cada uno con un `animation-delay` diferente — creando el efecto de ondas que se expanden desde el icono.
3. A los 260 ms añade `page-exit` al `<body>` para el fade-out de salida, y tras otros 340 ms ejecuta la navegación.

### Transiciones de página

El `<body>` empieza con `opacity: 0` en CSS. El script añade la clase `page-loaded` en el siguiente frame de renderizado (doble `requestAnimationFrame`, para asegurarse de que el primer paint ya ocurrió), lo que activa el fade-in de entrada. Al salir, `page-exit` activa el fade-out. Es el mismo patrón que usan las apps individuales.

---

## Apps

### 🎵 Metrónomo (`/metronomo/`)

Un metrónomo web con síntesis de audio en tiempo real, animación de péndulo, selector de compás y temporizador de práctica. Sin archivos de audio — todos los sonidos se sintetizan con Web Audio API.

#### Arquitectura

El proyecto usa ES Modules nativos (`type="module"`). La comunicación entre el motor de audio y la UI se hace con `CustomEvent`s del DOM: el motor dispara eventos en `document`, los módulos de UI los escuchan de forma independiente. Ni el motor sabe que existe la UI ni la UI sabe cómo funciona el motor.

```
app.js              ← entry point: construye el estado inicial y llama init() de cada módulo
│
├── state.js        ← objeto de estado compartido
├── metronome.js    ← scheduler de audio + lógica de tempo
├── audio.js        ← síntesis Web Audio
└── ui/
    ├── pendulum.js
    ├── bpm.js
    ├── timesig.js
    ├── timer.js
    ├── settings.js
    └── transitions.js
```

#### `state.js`

Un objeto plano exportado con `export const state = { bpm, beats, running, ... }`. Todos los módulos lo importan y mutan directamente (`state.bpm = 140`). No hay Proxy ni reactividad: como ningún módulo necesita reaccionar automáticamente a cambios de otro, con leer el estado en el momento oportuno es suficiente.

#### `metronome.js` — el scheduler

La parte más interesante del proyecto. El problema de hacer un metrónomo con `setInterval` es que el event loop de JS introduce jitter (puede llegar a ±50 ms), lo que hace que los beats suenen irregulares. La solución estándar para esto con Web Audio es el **lookahead scheduling**:

- Un `setInterval` de 25 ms actúa como "despertador" y llama al scheduler.
- El scheduler no reproduce un sonido ahora mismo — programa todos los sonidos que caigan dentro de los próximos 100 ms en la línea de tiempo del `AudioContext` (`_nextBeatTime < ctx.currentTime + 0.1`).
- El `AudioContext` tiene su propio reloj de alta precisión, completamente independiente del event loop. El audio suena exactamente cuando toca.

Para sincronizar las animaciones con el audio, por cada beat programado se calcula `delay = (when - ctx.currentTime) * 1000` y se lanza un `setTimeout` que dispara el evento `metro:beat` en ese momento. El visual llega al mismo tiempo que el sonido aunque vivan en "relojes" distintos.

Otros comportamientos del scheduler:

- **Cambio de BPM en caliente**: cuando se cambia el BPM mientras el metrónomo corre, calcula en qué punto de la fase del beat actual está y ajusta `_nextBeatTime` para que el siguiente beat llegue en el tiempo proporcionalmente correcto, sin saltos ni repeticiones.
- **Modo Random**: al inicio de cada compás genera un patrón rítmico aleatorio (`_generateRandPattern`) con duraciones de negra, corchea o tresillo y silencios con probabilidad variable. Los eventos del patrón se van reproduciendo conforme el lookahead los alcanza.

Eventos que emite en `document`:

| Evento | Detalle | Cuándo |
|---|---|---|
| `metro:beat` | `{ beat, tick, beatDur }` | Cada tiempo del compás |
| `metro:stop` | — | Al parar |
| `metro:tick` | `{ remaining, total }` | Cada segundo del temporizador |
| `metro:expired` | — | Cuando el temporizador llega a cero |

#### `audio.js`

Exporta funciones de síntesis (`playClick`, `playSubClick`, `playAlarm`, `speakBeat`) y el catálogo de sonidos (`SOUNDS`). Cada sonido se construye con nodos de Web Audio: osciladores con envelopes de amplitud cortos para los clicks digitales, buffers de ruido blanco filtrado para sonidos percusivos como cajon o woodblock. El modo "voz" usa `SpeechSynthesisUtterance` y se programa con ~130 ms de adelanto para compensar su latencia.

#### `ui/*.js`

Cada módulo escucha los eventos del DOM que le interesan y actualiza su trozo de UI:

- **`pendulum.js`**: en `metro:beat` alterna el ángulo del péndulo entre ±28° con una transición CSS cuya duración es `beatDur * 0.85s`. En `metro:stop` vuelve a 0°.
- **`bpm.js`**: gestiona el display `contenteditable`, el slider y los botones. El tap tempo acumula hasta 8 timestamps y calcula la media de los intervalos entre pulsaciones.
- **`timesig.js`**: controla el numerador y denominador del compás, el modo Libre (sin acentos de compás) y el selector de figuras (subdivisiones).
- **`timer.js`**: en `metro:tick` actualiza el countdown y la barra de progreso y deshabilita los campos de entrada. En `metro:stop` los reactiva.
- **`settings.js`**: construye el dropdown de sonidos a partir del array `SOUNDS` de `audio.js`, guarda el tema claro/oscuro en `localStorage` y maneja la navegación entre la vista del metrónomo y la de ajustes.
- **`transitions.js`**: el mismo patrón de fade-in/fade-out de `index.html`, encapsulado como módulo.

---

### 🥁 Rudimentos (`/rudimentos/`)

> *Documentación pendiente.*

---

### 🪘 Stick Control (`/stick-control/`)

> *Documentación pendiente.*

---

## Infraestructura

- **Servidor**: Raspberry Pi 5
- **Web server**: Nginx, sirviendo estáticos desde `/var/www/rootnode/`
- **HTTPS**: Let's Encrypt via certbot
- **DNS dinámico**: `migueguay.ddns.net`
