// ──────────────────────────────────────
//  Sidebar panels + mobile sheet
//  (category accordion, tier blocks, favs list, mobile drawer)
// ──────────────────────────────────────
import { RUDIMENTS, categories, tierNames, tierSub, tierIcons, LEVELS } from './data.js';
import { state, rudProgress, rudFavs } from './state.js';

// Imported lazily (function-call level) to avoid circular dependency with detail.js
let _selectRud = null;
export function registerSelectRud(fn) { _selectRud = fn; }

// ── Level helpers (needed locally for row dots) ──
export function levelColor(key) {
  const map = { bronze:'#c97c2e', silver:'#a8bac6', gold:'#ffc400', platinum:'#ffe566', diamond:'#00d4c0' };
  return map[key] || 'transparent';
}
export function levelGlow(key) {
  const map = { bronze:'rgba(201,124,46,.6)', silver:'rgba(168,186,198,.55)', gold:'rgba(255,196,0,.75)', platinum:'rgba(255,229,102,.8)', diamond:'rgba(0,212,192,.85)' };
  return map[key] || 'none';
}
export function levelIndex(key) {
  return key ? LEVELS.findIndex(l => l.key === key) : -1;
}
export const levelIcons = { bronze:'🥉', silver:'🥈', gold:'🥇', platinum:'🏆', diamond:'💎' };

// ════════════════════════════════════════
//  ROW FACTORIES
// ════════════════════════════════════════

export function makeRudRow(rud) {
  const lvl = rudProgress[rud.id];
  const row = document.createElement('button');
  row.className = 'rud-row' + (rud === state.currentRud ? ' active' : '');
  row.innerHTML = `<span class="rud-row-lvl" style="${lvl ? 'background:' + levelColor(lvl) + ';border-color:' + levelColor(lvl) + ';box-shadow:0 0 6px ' + levelGlow(lvl) : ''}"></span>
    <span class="rud-row-name">${rud.name}</span>`;
  row.onclick = () => _selectRud && _selectRud(rud);
  return row;
}

function makeMobRudRow(rud) {
  const lvl = rudProgress[rud.id];
  const row = document.createElement('button');
  row.className = 'rud-row' + (rud === state.currentRud ? ' active' : '');
  row.innerHTML = `<span class="rud-row-lvl" style="${lvl ? 'background:' + levelColor(lvl) + ';border-color:' + levelColor(lvl) + ';box-shadow:0 0 6px ' + levelGlow(lvl) : ''}"></span>
    <span class="rud-row-name">${rud.name}</span>`;
  row.onclick = () => { _selectRud && _selectRud(rud); closeMobSheet(); };
  return row;
}

// ════════════════════════════════════════
//  CATEGORY ACCORDION
// ════════════════════════════════════════

export function buildCategAccordion() {
  const el = document.getElementById('categAccordion');
  if (!el) return;
  el.innerHTML = '';

  categories.forEach(cat => {
    const ruds     = RUDIMENTS.filter(r => r.cat === cat);
    const done     = ruds.filter(r => rudProgress[r.id]).length;
    const isOpen   = cat === state.currentCat;
    const hasActive = ruds.some(r => r === state.currentRud);
    const pct      = ruds.length ? Math.round(done / ruds.length * 100) : 0;

    const section = document.createElement('div');
    section.className = 'acc-section';
    section.dataset.cat = cat;

    const head = document.createElement('button');
    head.className = 'acc-head' + (isOpen ? ' open' : '') + (hasActive ? ' has-active' : '');
    head.innerHTML = `<span class="acc-name">${cat}</span>
      <div class="acc-prog-wrap">
        <span class="acc-badge">${ruds.length}</span>
        <div class="acc-prog-bar"><div class="acc-prog-fill" style="width:${pct}%"></div></div>
      </div>
      <svg class="acc-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 18l6-6-6-6"/></svg>`;

    const body = document.createElement('div');
    body.className = 'acc-body' + (isOpen ? ' open' : '');
    const inner = document.createElement('div');
    inner.className = 'acc-body-inner rud-list';
    ruds.forEach(r => inner.appendChild(makeRudRow(r)));
    body.appendChild(inner);

    head.onclick = () => _toggleAccSection(section, cat);
    section.appendChild(head);
    section.appendChild(body);
    el.appendChild(section);
  });
}

function _toggleAccSection(section, cat) {
  const body = section.querySelector('.acc-body');
  const head = section.querySelector('.acc-head');
  const opening = !body.classList.contains('open');
  // Collapse all
  document.querySelectorAll('#categAccordion .acc-body').forEach(b => b.classList.remove('open'));
  document.querySelectorAll('#categAccordion .acc-head').forEach(h => h.classList.remove('open'));
  if (opening) {
    body.classList.add('open');
    head.classList.add('open');
    state.currentCat = cat;
    const ruds = RUDIMENTS.filter(r => r.cat === cat);
    if (ruds.length && !ruds.includes(state.currentRud)) {
      _selectRud && _selectRud(ruds[0]);
    }
  }
}

// ════════════════════════════════════════
//  TIER BLOCKS
// ════════════════════════════════════════

export function buildTierBlocks() {
  const el = document.getElementById('tierBlocks');
  el.innerHTML = '';
  [1, 2, 3, 4].forEach(t => {
    const ruds = RUDIMENTS.filter(r => r.tier === t);
    const done = ruds.filter(r => rudProgress[r.id]).length;
    const block = document.createElement('div');
    block.className = 'tier-block';
    const header = document.createElement('div');
    header.className = 'tier-header';
    header.innerHTML = `<span class="tier-header-icon">${tierIcons[t]}</span>
      <div class="tier-header-info">
        <div class="tier-header-name">Tier ${t} — ${tierNames[t]}</div>
        <div class="tier-header-sub">${tierSub[t]}</div>
      </div>
      <span class="tier-header-count">${done}/${ruds.length}</span>`;
    const list = document.createElement('div');
    list.className = 'rud-list';
    ruds.forEach(r => list.appendChild(makeRudRow(r)));
    block.appendChild(header);
    block.appendChild(list);
    el.appendChild(block);
  });
}

// ════════════════════════════════════════
//  FAVS PANEL (desktop sidebar)
// ════════════════════════════════════════

export function buildFavsPanel() {
  const el      = document.getElementById('favsPanel');
  const favRuds = RUDIMENTS.filter(r => rudFavs.has(r.id));
  if (!favRuds.length) {
    el.innerHTML = '<div class="favs-empty">Aún no tienes favoritos. Pulsa ☆ en cualquier rudimento para guardarlo aquí.</div>';
    return;
  }
  el.innerHTML = '';
  const list = document.createElement('div');
  list.className = 'rud-list';
  favRuds.forEach(r => list.appendChild(makeRudRow(r)));
  el.appendChild(list);
}

export function buildFavStartRow() {
  const row = document.getElementById('favStartRow');
  if (!row) return;
  row.innerHTML = '';
  const lbl = document.createElement('span');
  lbl.className = 'fav-start-label';
  lbl.textContent = 'Empezar desde:';
  row.appendChild(lbl);
  LEVELS.forEach(lvl => {
    const btn = document.createElement('button');
    const isActive = lvl.key === _getApFavsStartKey();
    btn.className = 'fav-start-btn ' + lvl.cls + (isActive ? ' active' : '');
    btn.textContent = lvl.name;
    btn.onclick = () => {
      _setApFavsStartKey(lvl.key);
      row.querySelectorAll('.fav-start-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    };
    row.appendChild(btn);
  });
}

// Callbacks injected by app.js to avoid importing audio.js here
let _getApFavsStartKey = () => 'bronze';
let _setApFavsStartKey = () => {};
export function registerApFavsKeyHandlers(getter, setter) {
  _getApFavsStartKey = getter;
  _setApFavsStartKey = setter;
}

// ════════════════════════════════════════
//  VIEW SWITCHING
// ════════════════════════════════════════

export function setView(v) {
  state.currentView = v;

  // Update tab/bnav active states
  ['vtCateg', 'vtTier', 'vtFavs'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('active',
      (id === 'vtCateg' && v === 'categ') ||
      (id === 'vtTier'  && v === 'tier')  ||
      (id === 'vtFavs'  && v === 'favs'));
  });
  ['bnavCateg', 'bnavTier', 'bnavFavs'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('active',
      (id === 'bnavCateg' && v === 'categ') ||
      (id === 'bnavTier'  && v === 'tier')  ||
      (id === 'bnavFavs'  && v === 'favs'));
  });

  // Build the panel content
  if (v === 'tier') buildTierBlocks();
  else if (v === 'favs') { buildFavsPanel(); updateFavArrows(); }
  else buildCategAccordion();

  // Panel transition
  const targets = { categ: 'categPanel', tier: 'tierPanel', favs: 'favsPanel' };
  ['categPanel', 'tierPanel', 'favsPanel'].forEach(pid => {
    const el = document.getElementById(pid);
    if (!el) return;
    if (pid === targets[v]) {
      el.style.display = '';
      el.classList.remove('panel-enter');
      void el.offsetWidth;
      el.classList.add('panel-enter');
    } else {
      el.style.display = 'none';
      el.classList.remove('panel-enter');
    }
  });

  document.getElementById('appLayout').classList.toggle('view-favs', v === 'favs');
  updateTabIndicator(v);
  buildMobList();
}

export function updateTabIndicator(v) {
  const ind = document.getElementById('sTabInd');
  if (!ind) return;
  const map = { categ: 'vtCateg', tier: 'vtTier', favs: 'vtFavs' };
  const tab = document.getElementById(map[v]);
  if (!tab) return;
  ind.style.left  = tab.offsetLeft + 'px';
  ind.style.width = tab.offsetWidth + 'px';
}

export function updateFavArrows() {
  if (state.currentView !== 'favs') return;
  const sorted  = RUDIMENTS.filter(r => rudFavs.has(r.id));
  const ci      = sorted.findIndex(r => r.id === state.currentRud.id);
  const prev    = document.getElementById('cardPrev');
  const next    = document.getElementById('cardNext');
  const counter = document.getElementById('favCounter');
  if (prev)    prev.disabled    = (ci <= 0);
  if (next)    next.disabled    = (ci < 0 || ci >= sorted.length - 1);
  if (counter) counter.textContent = sorted.length ? (ci + 1) + '/' + sorted.length : '';
}

// ════════════════════════════════════════
//  MOBILE NAV
// ════════════════════════════════════════

export function mobNavClick(v) {
  const isMobile = window.innerWidth <= 700;
  if (!isMobile) { setView(v); return; }

  const sheetOpen = document.getElementById('mobSheet').classList.contains('open');
  const sameView  = v === state.currentView;
  const tabOrder  = { categ: 0, tier: 1, favs: 2 };
  const dir       = tabOrder[v] > tabOrder[state.currentView] ? 1 : -1;
  setView(v);

  if (sheetOpen && sameView) {
    closeMobSheet();
  } else if (sheetOpen && !sameView) {
    const body   = document.getElementById('mobSheetBody');
    const outX   = dir < 0 ? '40px' : '-40px';
    const inX    = dir < 0 ? '-40px' : '40px';
    body.animate(
      [{ opacity: 1, transform: 'translateX(0)' }, { opacity: 0, transform: `translateX(${outX})` }],
      { duration: 160, easing: 'cubic-bezier(.4,0,1,1)', fill: 'forwards' }
    ).onfinish = () => {
      state.mobOpenCat = null;
      buildMobSheet();
      body.animate(
        [{ opacity: 0, transform: `translateX(${inX})` }, { opacity: 1, transform: 'none' }],
        { duration: 220, easing: 'cubic-bezier(0,0,.2,1)', fill: 'forwards' }
      ).onfinish = () => { body.style.cssText = ''; };
    };
  } else {
    state.mobOpenCat = null;
    buildMobSheet();
    openMobSheet();
  }
}

// ════════════════════════════════════════
//  MOBILE SHEET
// ════════════════════════════════════════

export function buildMobList() {
  // Only rebuild if sheet is currently open on mobile
  if (window.innerWidth <= 700 && document.getElementById('mobSheet').classList.contains('open')) {
    buildMobSheet();
  }
}

export function buildMobSheet() {
  const el = document.getElementById('mobSheetBody');
  if (!el) return;
  el.innerHTML = '';

  const sheetTitles = { categ: 'Categoría', tier: 'Nivel', favs: 'Favoritos' };
  const titleEl = document.getElementById('mobSheetTitle');
  if (titleEl) titleEl.textContent = sheetTitles[state.currentView] || '';

  if (state.currentView === 'categ') {
    categories.forEach(cat => {
      const ruds   = RUDIMENTS.filter(r => r.cat === cat);
      const isOpen = cat === state.mobOpenCat;
      const sec    = document.createElement('div');
      const head   = document.createElement('button');
      head.className = 'mob-scat-head' + (isOpen ? ' open' : '');
      head.innerHTML = `<span class="mob-scat-name">${cat}</span>
        <span class="mob-scat-count">${ruds.length}</span>
        <svg class="mob-scat-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 18l6-6-6-6"/></svg>`;
      const body  = document.createElement('div');
      body.className = 'mob-scat-body';
      body.style.overflow = 'hidden';
      body.style.display  = isOpen ? 'block' : 'none';
      if (!isOpen) body.style.height = '0';
      const list = document.createElement('div');
      list.className = 'rud-list';
      ruds.forEach(r => list.appendChild(makeMobRudRow(r)));
      body.appendChild(list);

      head.onclick = () => {
        const wasOpen = body.style.display === 'block';
        // Collapse all
        el.querySelectorAll('.mob-scat-body').forEach(b => {
          if (b.style.display === 'block') {
            const h = b.scrollHeight;
            b.animate([{ height: h + 'px' }, { height: '0px' }],
              { duration: 260, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' })
              .onfinish = () => { b.style.display = 'none'; b.style.height = ''; };
          }
        });
        el.querySelectorAll('.mob-scat-head').forEach(h => h.classList.remove('open'));
        if (!wasOpen) {
          body.style.display = 'block';
          const target = body.scrollHeight;
          body.animate([{ height: '0px' }, { height: target + 'px' }],
            { duration: 300, easing: 'cubic-bezier(0,0,.2,1)', fill: 'forwards' })
            .onfinish = () => { body.style.height = ''; };
          head.classList.add('open');
          state.mobOpenCat = cat;
        } else {
          state.mobOpenCat = null;
        }
      };
      sec.appendChild(head);
      sec.appendChild(body);
      el.appendChild(sec);
    });

  } else if (state.currentView === 'tier') {
    [1, 2, 3, 4].forEach(t => {
      const ruds = RUDIMENTS.filter(r => r.tier === t);
      const done = ruds.filter(r => rudProgress[r.id]).length;
      const head = document.createElement('div');
      head.className = 'mob-tier-head';
      head.innerHTML = `${tierIcons[t]} Tier ${t} · ${tierNames[t]}<span class="mob-tier-count">${done}/${ruds.length}</span>`;
      const list = document.createElement('div');
      list.className = 'rud-list';
      list.style.padding = '0 .5rem .4rem';
      ruds.forEach(r => list.appendChild(makeMobRudRow(r)));
      el.appendChild(head);
      el.appendChild(list);
    });

  } else {
    const favRuds = RUDIMENTS.filter(r => rudFavs.has(r.id));
    if (!favRuds.length) {
      el.innerHTML = '<div style="padding:2rem 1rem;font-size:.82rem;color:var(--muted);text-align:center;line-height:1.7">Sin favoritos aún.<br>Pulsa ☆ en un rudimento para guardarlo.</div>';
      return;
    }
    const list = document.createElement('div');
    list.className = 'rud-list';
    list.style.padding = '.3rem .5rem';
    favRuds.forEach(r => list.appendChild(makeMobRudRow(r)));
    el.appendChild(list);
  }
}

let _sheetHideTimer = null;

export function openMobSheet() {
  const s = document.getElementById('mobSheet');
  clearTimeout(_sheetHideTimer);
  s.style.display = 'flex';
  void s.offsetWidth; // force reflow so transition fires
  s.classList.add('open');
  document.getElementById('mobSheetBackdrop').classList.add('open');
  document.body.style.overflow = 'hidden';
}

export function closeMobSheet() {
  const s = document.getElementById('mobSheet');
  s.classList.remove('open');
  document.getElementById('mobSheetBackdrop').classList.remove('open');
  document.body.style.overflow = '';
  state.mobOpenCat = null;
  clearTimeout(_sheetHideTimer);
  _sheetHideTimer = setTimeout(() => {
    if (!s.classList.contains('open')) s.style.display = 'none';
  }, 350);
}
