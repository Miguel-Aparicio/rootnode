# rootnode.ddns.net — Raspberry Pi 5

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
├── rudimentos/
│   ├── index.html
│   ├── css/styles.css
│   └── js/
│       ├── app.js
│       ├── data.js
│       ├── state.js
│       ├── staff.js
│       ├── audio.js
│       ├── sidebar.js
│       └── detail.js
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

Referencia interactiva de los 40 rudimentos de percusión del PAS (Percussive Arts Society). Cada rudimento tiene notación, sticking, logros por velocidad y audio de ejemplo de Vic Firth.

#### Arquitectura

Misma filosofía que el metrónomo: ES Modules nativos, sin bundler. La comunicación entre módulos que formarían dependencias circulares se resuelve con **dependency injection** (una función se registra en el módulo que la necesita en tiempo de arranque, desde `app.js`) y con un `CustomEvent` del DOM para el caso concreto del avance automático en la playlist de favoritos.

```
app.js          ← entry point: inyecta dependencias, hace el render inicial, registra listeners
│
├── data.js     ← arrays y mapas estáticos (RUDIMENTS, LEVELS, VF_IMG, VF_STEMS…)
├── state.js    ← estado mutable (currentRud, currentView, rudProgress, rudFavs)
├── staff.js    ← renderizador SVG de pentagramas + HTML de sticking
├── audio.js    ← reproductor de audio (Vic Firth MP3s externos)
├── sidebar.js  ← acordeón de categorías, bloques de tier, panel de favoritos, sheet móvil
└── detail.js   ← tarjeta de detalle, logros, progreso, navegación de favoritos
```

#### `data.js` — datos puros

Toda la información estática del dominio. No importa nada y no toca el DOM:

- **`RUDIMENTS`** — array de 40 objetos `{ id, tier, cat, name, desc, pattern }`. La propiedad `pattern` es un array de grupos de golpes, donde cada golpe es `{ h:'R'|'L', a?:true, g?:'r'|'l', d?:'r'|'l', b?:true }` (*hand*, *accent*, *grace*, *drag*, *buzz*).
- **`LEVELS`** — 5 tiers de logros: Bronce 60 BPM → Diamante 160 BPM.
- **`VF_IMG`** / **`VF_STEMS`** — mapas de `id → slug` para construir URLs a las imágenes `.webp` locales y a los MP3 de Vic Firth en un servidor externo.
- Helpers de construcción de patrones: `RR()`, `LL()`, `RA()`, `LA()` (atajo para crear objetos de nota con los campos más comunes).

#### `state.js`

Estado mutable compartido:

```js
export const state = {
  currentRud:  null,      // rudimento seleccionado
  currentCat:  '',        // categoría acordeón abierta
  currentView: 'categ',   // 'categ' | 'tier' | 'favs'
  mobOpenCat:  '',        // categoría expandida en el sheet móvil
};
```

El progreso (`rudProgress`) y los favoritos (`rudFavs`) se persisten en `localStorage` como JSON. `rudFavs` vive como un `Set<id>` en memoria para que `has()` y `delete()` sean O(1).

#### `staff.js` — renderizador de notación

`renderStaff(rud)` genera un SVG inline a partir del array `pattern` del rudimento. Calcula posiciones X acumulando el ancho de cada nota más el espacio extra para las grace notes y drags, dibuja barras de corchea por grupo (con bracket de tresillo si el grupo tiene 3 o 6 notas), separa grupos con barlines y colorea cada cabeza de nota de rojo (R) o azul (L) para facilitar la lectura.

`renderSticking(rud)` produce un fragmento HTML con los textos `R`/`L` en color, prefijados por grace notes en superíndice cuando corresponde.

En la práctica, si existe una imagen `.webp` para el rudimento en `VF_IMG`, se usa la imagen en vez del SVG generado (mayor fidelidad visual). El SVG es el fallback para cualquier rudimento sin imagen.

#### `audio.js` — reproductor Vic Firth

Gestiona un único elemento `<Audio>` que se recrea en cada cambio de rudimento. El audio viene de `https://ae.vicfirth.com/wp-content/uploads/` y no está alojado localmente.

Cada rudimento tiene hasta 6 pistas (tracks): O-C-O (open-close-open), Bronce, Plata, Oro, Platino, Diamante. Cuando una pista termina, el reproductor avanza automáticamente a la siguiente. Cuando termina la última pista y el usuario está en la vista de favoritos, se despacha el evento `audio:ended-in-favs` en `document` — `detail.js` lo escucha y avanza al siguiente rudimento de la playlist. Esto desacopla `audio.js` de `detail.js` sin importación circular.

#### `sidebar.js` — todos los paneles de navegación

Gestiona tres vistas del sidebar (escritorio) y del sheet deslizante (móvil):

- **Categoría**: acordeón animado con `grid-template-rows: 0fr → 1fr`. Cada sección muestra la categoría, el número de rudimentos y una mini barra de progreso. Al abrir una sección, si el rudimento activo no pertenece a esa categoría, se selecciona automáticamente el primero de la nueva.
- **Nivel (Tier)**: tres bloques con los rudimentos agrupados por tier 1–4.
- **Favoritos**: lista plana de rudimentos marcados, con botones para comenzar la playlist de audio desde un nivel específico.

El sheet móvil se muestra u oculta con una transición CSS (`translateY(100%) → none`). Cuando el usuario cambia de vista mientras el sheet está abierto, el contenido se anima con un slide lateral.

`sidebar.js` necesita llamar a `selectRud()` (que vive en `detail.js`), pero `detail.js` importa `sidebar.js`. Para cortar la dependencia circular, `sidebar.js` expone `registerSelectRud(fn)` y `app.js` le inyecta la función al arrancar.

#### `detail.js` — tarjeta de detalle y logros

`selectRud(rud, dir)` es el punto central de la app: actualiza el estado, re-renderiza la tarjeta de detalle y sincroniza todos los paneles del sidebar. Si se pasa `dir` (−1 o +1), añade una animación de slide a la tarjeta antes de hacer el swap de contenido.

`buildLevelStrip(rud)` construye las 5 tarjetas de logro. Al pulsar una, alterna el nivel guardado en `rudProgress` y, si es un logro nuevo, dispara la animación `unlock-anim`. El progreso se guarda en `localStorage` inmediatamente.

`updateProgBanner()` recorre todos los rudimentos y recalcula cuántos cumplen cada nivel, actualizando los contadores y las barras de la barra superior.

#### `app.js` — arranque

1. **Dependency injection**: llama a `registerSelectRud(selectRud)` para que `sidebar.js` pueda invocar `selectRud` sin importarla directamente.
2. **Render inicial**: construye el acordeón, selecciona el primer rudimento, actualiza el banner de progreso y calcula la posición del indicador deslizante de los tabs.
3. **Event wiring**: conecta todos los botones del HTML (tabs, bottom nav, fav button, flechas de navegación, cerrar sheet) a sus funciones JS.
4. **Transiciones de página**: mismo patrón fade-in/fade-out que el resto de apps.

#### Layout

En escritorio (> 700 px): columna izquierda fija de 268 px (sidebar `position: sticky`) + área de detalle que ocupa el resto con `flex: 1`.

En móvil (≤ 700 px): el sidebar se oculta con `display: none`. Aparece una barra de navegación inferior fija con tres botones que abren el sheet deslizante. La tarjeta de detalle ocupa toda la pantalla con padding inferior para que el contenido no quede tapado por la barra.

---

### 🪘 Stick Control (`/stick-control/`)

> *Documentación pendiente.*

---

## Infraestructura

- **Servidor**: Raspberry Pi 5
- **Web server**: Nginx, sirviendo estáticos desde `/var/www/rootnode/`
- **HTTPS**: Let's Encrypt via certbot
- **DNS dinámico**: `rootnode.ddns.net`
