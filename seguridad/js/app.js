/* ═══════════════════════════════════════════════════════════════════════════
   SecurePi — Main App  (polling + DOM updates)
   ═══════════════════════════════════════════════════════════════════════════ */

'use strict';

const API_URL_CANDIDATES = [
  '/seguridad/api/',
  '/api/seguridad/',
  'http://127.0.0.1:5050/',
  'http://127.0.0.1:5050/seguridad/api/',
];
const POLL_MS      = 10_000;   // 10 segundos
const API_TRY_TIMEOUT_MS = 1600;
const STORAGE_ACTIVE_API = 'securepi.activeApiUrl';
const STORAGE_LAST_DATA = 'securepi.lastPayload';
const STORAGE_LAST_TS = 'securepi.lastPayloadTs';

let countdown      = POLL_MS / 1000;
let pollTimer      = null;
let countdownTimer = null;
let isLoading      = false;
let activeApiUrl   = null;
let lastFailed24h  = null;
let currentLiveAttackBurst = 0;

// ─── Arranque ────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  configureDashboardLayout();
  initCharts();
  ensureDataSourcePill();
  setDataSourceStatus('loading', 'Conectando...');
  restoreLastSnapshot();
  fetchAndRender();
  startCountdown();
});

function configureDashboardLayout() {
  const bannedCard = document.getElementById('stat-banned')?.closest('.stat-card');
  if (bannedCard) bannedCard.remove();

  const grid = document.querySelector('.dash-grid');
  if (!grid) return;

  const preferredOrder = [
    '.card-events',
    '.card-f2b',
    '.card-worldmap',
    '.card-usernames',
    '.card-net',
    '.card-heatmap',
    '.card-countries',
  ];

  const preferredNodes = preferredOrder
    .map(selector => grid.querySelector(selector))
    .filter(Boolean);

  const preferredSet = new Set(preferredNodes);
  const remaining = Array.from(grid.children).filter(card => !preferredSet.has(card));
  [...preferredNodes, ...remaining].forEach(card => grid.appendChild(card));
}

// ─── Polling ─────────────────────────────────────────────────────────────────
function startCountdown() {
  clearInterval(countdownTimer);
  countdown = POLL_MS / 1000;
  countdownTimer = setInterval(() => {
    countdown--;
    const el = document.getElementById('refresh-countdown');
    if (el) el.textContent = `${countdown}s`;
    if (countdown <= 0) {
      fetchAndRender();
      countdown = POLL_MS / 1000;
    }
  }, 1000);
}

async function fetchAndRender() {
  if (isLoading) return;
  isLoading = true;
  setDataSourceStatus('loading', 'Sincronizando...');

  const icon = document.getElementById('refresh-icon');
  if (icon) icon.classList.add('spinning');

  try {
    const data = await fetchDashboardData();
    renderAll(data);
    persistSnapshot(data);
    setDataSourceStatus('live', 'En vivo');
    hideError();
  } catch (e) {
    setDataSourceStatus('error', 'Sin conexion');
    showError(`Error al contactar la API: ${e.message}`);
  } finally {
    isLoading = false;
    if (icon) icon.classList.remove('spinning');
  }
}

async function fetchDashboardData() {
  const candidates = getApiCandidates();
  const errors = [];

  for (const url of candidates) {
    try {
      const res = await fetchWithTimeout(url, { cache: 'no-store' }, API_TRY_TIMEOUT_MS);
      if (!res.ok) {
        errors.push(`${url} -> HTTP ${res.status}`);
        continue;
      }

      const data = await res.json();
      if (!isSecurityPayload(data)) {
        errors.push(`${url} -> JSON no valido`);
        continue;
      }

      activeApiUrl = url;
      localStorage.setItem(STORAGE_ACTIVE_API, url);
      return data;
    } catch (err) {
      errors.push(`${url} -> ${err.message}`);
    }
  }

  throw new Error(errors.slice(0, 3).join(' | '));
}

function getApiCandidates() {
  const protocol = window.location.protocol || 'http:';
  const host = window.location.hostname || '127.0.0.1';
  const dynamicBase = `${protocol}//${host}:5050`;
  const rememberedApi = localStorage.getItem(STORAGE_ACTIVE_API);

  const dynamicCandidates = [
    '/seguridad/api/',
    '/api/seguridad/',
    '/',
    `${dynamicBase}/`,
    `${dynamicBase}/seguridad/api/`,
  ];

  const unique = [];
  const add = value => {
    if (!value || unique.includes(value)) return;
    unique.push(value);
  };

  add(rememberedApi);
  if (activeApiUrl) add(activeApiUrl);
  dynamicCandidates.forEach(add);
  API_URL_CANDIDATES.forEach(add);

  if (window.location.port === '5050') {
    add('/');
  }

  return unique;
}

function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal })
    .finally(() => clearTimeout(timer));
}

function restoreLastSnapshot() {
  try {
    const raw = localStorage.getItem(STORAGE_LAST_DATA);
    if (!raw) return;
    const data = JSON.parse(raw);
    if (!isSecurityPayload(data)) return;
    renderAll(data);

    const ts = Number(localStorage.getItem(STORAGE_LAST_TS) || 0);
    const updated = Number.isFinite(ts) && ts > 0
      ? new Date(ts).toLocaleTimeString('es-ES')
      : 'cache';
    setText('events-updated', `últ. actualiz: ${updated} (cache)`);
    setDataSourceStatus('cache', `Cache ${updated}`);
  } catch {
    // ignore cache errors
  }
}

function persistSnapshot(data) {
  try {
    localStorage.setItem(STORAGE_LAST_DATA, JSON.stringify(data));
    localStorage.setItem(STORAGE_LAST_TS, String(Date.now()));
  } catch {
    // ignore storage quota errors
  }
}

function isSecurityPayload(data) {
  if (!data || typeof data !== 'object') return false;
  return (
    data.ssh &&
    data.network &&
    data.system &&
    data.fail2ban
  );
}

// ─── Render completo ─────────────────────────────────────────────────────────
function renderAll(d) {
  renderTopbar(d);
  renderStats(d);
  renderSSH(d.ssh);
  renderFail2ban(d.fail2ban);
  renderGauges(d.system);
  renderFirewall(d.firewall);
  renderNetwork(d.network);
  renderEnrichedAttackers(d.ssh?.enriched_attackers);
  renderCountries(d.ssh?.top_countries);
  renderVpnDonut(d.ssh);
  renderUsernames(d.ssh?.top_usernames);
  renderHeatmap(d.ssh);
  renderHourlyChart(d.ssh?.attack_hours_24h);
  renderSessions(d.sessions);
  renderServices(d.services);
  renderEvents(d.events);
  renderUpdates(d.updates);
}

// ─── Topbar ──────────────────────────────────────────────────────────────────
function renderTopbar(d) {
  setText('hostname', d.system?.hostname || '—');

  const pill = document.getElementById('threat-pill');
  const label = document.getElementById('threat-label');
  if (pill && d.threat_level) {
    pill.dataset.level      = d.threat_level;
    label.textContent       = d.threat_level;
  }
}

// ─── Stats bar ───────────────────────────────────────────────────────────────
function renderStats(d) {
  setNum('stat-ssh24', d.ssh?.failed_last_24h ?? '—');
  setNum('stat-ssh1h', d.ssh?.failed_last_hour ?? '—');
  setNum('stat-ips',   d.ssh?.unique_ips_24h ?? '—');
  setNum('stat-banned', d.fail2ban?.total_currently_banned ?? '—');
  setText('stat-uptime', formatUptime(d.system?.uptime));
}

// ─── SSH attack timeline ──────────────────────────────────────────────────────
function renderSSH(ssh) {
  if (!ssh) return;
  const count = ssh.failed_last_hour ?? 0;
  const failed24h = Number(ssh.failed_last_24h ?? 0);

  if (lastFailed24h == null) {
    currentLiveAttackBurst = 0;
  } else {
    currentLiveAttackBurst = Math.max(0, failed24h - lastFailed24h);
  }
  lastFailed24h = failed24h;

  setText('ssh-1h-badge', `${count} en 1h`);
  updateSSHChart(ssh.timeline);
}

// ─── Fail2ban ─────────────────────────────────────────────────────────────────
function renderFail2ban(f2b) {
  if (!f2b) return;

  const dot = document.getElementById('f2b-dot');
  if (dot) {
    dot.className = 'dot-status ' + (f2b.running ? 'ok' : 'error');
    dot.title     = f2b.running ? 'Activo' : 'Inactivo';
  }

  setNum('f2b-banned',       f2b.total_currently_banned ?? 0);
  setNum('f2b-total-banned', f2b.total_banned_ever ?? 0);
  setNum('f2b-total-failed', f2b.total_failed_ever ?? 0);

  const container = document.getElementById('f2b-jails');
  if (!container) return;

  const ips = extractCurrentBannedIps(f2b);
  if (!ips.length) {
    container.innerHTML = '<div class="f2b-empty">No hay IPs baneadas activas o la API no aporta detalle.</div>';
    return;
  }

  container.innerHTML = ips.map((ip, index) => `
    <div class="f2b-ip-row">
      <span class="f2b-ip-rank">#${index + 1}</span>
      <span class="f2b-ip mono">${esc(ip)}</span>
    </div>
  `).join('');
}

function extractCurrentBannedIps(f2b) {
  const ips = new Set();
  const addFrom = value => {
    if (!Array.isArray(value)) return;
    value.forEach(entry => {
      const ip = String(entry?.ip ?? entry ?? '').trim();
      if (ip) ips.add(ip);
    });
  };

  addFrom(f2b.currently_banned_ips);
  addFrom(f2b.banned_ips);
  (f2b.jails || []).forEach(jail => {
    addFrom(jail.currently_banned_ips);
    addFrom(jail.current_banned_ips);
    addFrom(jail.banned_ips);
    addFrom(jail.ips);
  });

  return Array.from(ips).slice(0, 150);
}

// ─── Gauges (SVG) ─────────────────────────────────────────────────────────────
function renderGauges(sys) {
  if (!sys) return;

  setGauge('gauge-cpu-fill', 'gauge-cpu-val', sys.cpu_percent ?? 0);
  setGauge('gauge-ram-fill', 'gauge-ram-val', sys.memory?.percent ?? 0);
  setGauge('gauge-disk-fill', 'gauge-disk-val', sys.disk?.percent ?? 0);

  // Temperature
  const temp = sys.cpu_temp;
  setText('cpu-temp', temp != null ? `${temp}°C` : '—');

  // RAM detail
  const mem = sys.memory;
  if (mem) {
    setText('ram-detail', `${fmtBytes(mem.used)} / ${fmtBytes(mem.total)}`);
    setText('ram-badge',  `${fmtBytes(mem.available)} libre`);
  }

  // Disk detail
  const disk = sys.disk;
  if (disk) {
    setText('disk-detail', `${fmtBytes(disk.used)} / ${fmtBytes(disk.total)}`);
  }

  // Load average
  if (sys.load_avg?.length) {
    setText('cpu-load', `Load: ${sys.load_avg.join('  ')} (${sys.cpu_count} cores)`);
  }
}

// ─── Firewall ─────────────────────────────────────────────────────────────────
function renderFirewall(fw) {
  if (!fw) return;

  const dot  = document.getElementById('fw-dot');
  if (dot) dot.className = 'dot-status ' + (fw.active ? 'ok' : 'error');

  const pill = document.getElementById('fw-active-pill');
  if (pill) {
    pill.className   = 'fw-pill ' + (fw.active ? 'active' : 'inactive');
    pill.textContent = fw.active ? '● Activo' : '○ Inactivo';
  }

  const defs = document.getElementById('fw-defaults');
  if (defs && fw.default_incoming) {
    defs.innerHTML = `
      <div class="fw-def-row">
        <span>Entrante:</span>
        <span class="fw-def-val ${fw.default_incoming}">${fw.default_incoming.toUpperCase()}</span>
      </div>
      <div class="fw-def-row">
        <span>Saliente:</span>
        <span class="fw-def-val ${fw.default_outgoing}">${(fw.default_outgoing || 'allow').toUpperCase()}</span>
      </div>`;
  }

  const rulesList = document.getElementById('fw-rules');
  if (rulesList && fw.rules) {
    rulesList.innerHTML = fw.rules.slice(0, 8).map(r => `
      <div class="fw-rule">
        <span class="fw-rule-action ${r.action.toUpperCase()}">${esc(r.action)}</span>
        <span class="fw-rule-port">${esc(r.to)}</span>
        <span class="fw-rule-from">${esc(r.from)}</span>
      </div>`).join('');
  }
}

// ─── Red ─────────────────────────────────────────────────────────────────────
function renderNetwork(net) {
  if (!net) return;

  setText('net-recv', `↓ ${fmtBytes(net.recv_rate)}/s`);
  setText('net-sent', `↑ ${fmtBytes(net.sent_rate)}/s`);
  setNum ('net-conns',  net.connections || 0);
  setNum ('net-estab',  net.established || 0);

  const ports = (net.listening_ports || []).join(', ');
  setText('net-ports', ports || '—');

  updateNetChart(net.history);
  renderConnectionDetail(net.established_detail);
}

const CONN_TYPE_META = {
  self:    { label: 'Tu acceso SSH',   cls: 'conn-self',   icon: '🔑' },
  vscode:  { label: 'VS Code Server',  cls: 'conn-vscode', icon: '💻' },
  web:     { label: 'HTTPS/Web',       cls: 'conn-web',    icon: '🌐' },
  local:   { label: 'Local / API',     cls: 'conn-local',  icon: '⚙️' },
  system:  { label: 'Sistema',         cls: 'conn-system', icon: '🔧' },
  unknown: { label: 'Otro',            cls: 'conn-unknown', icon: '❓' },
};

function renderConnectionDetail(detail) {
  const list = document.getElementById('conn-detail-list');
  if (!list) return;

  const established = Array.isArray(detail) ? detail : [];
  if (!established.length) {
    list.innerHTML = '<div class="conn-none conn-ok">Verificado: no hay intrusiones detectadas.</div>';
    return;
  }

  const suspicious = established.filter(isPotentialIntrusionConn);
  if (!suspicious.length) {
    list.innerHTML = `<div class="conn-none conn-ok">Verificado: no hay intrusiones detectadas (${established.length} conexiones legítimas).</div>`;
    return;
  }

  const suspects = Array.from(new Set(
    suspicious.map(conn => String(conn.remote_addr || '').trim()).filter(Boolean)
  )).slice(0, 4);

  list.innerHTML = `
    <div class="conn-none conn-alert">
      Posibles intrusiones detectadas: ${suspicious.length}${suspects.length ? ` · ${suspects.map(esc).join(', ')}` : ''}
    </div>
  `;
}

function isPotentialIntrusionConn(conn) {
  const type = String(conn?.type || '').toLowerCase();
  const location = String(conn?.location || '').toUpperCase();
  const direction = String(conn?.direction || '').toLowerCase();

  if (type === 'unknown') return true;
  if (location === 'INTERNET' && direction === 'inbound' && !['web', 'self', 'vscode'].includes(type)) {
    return true;
  }
  return false;
}

// ─── Top Attackers ────────────────────────────────────────────────────────────
function renderAttackers(attackers) {
  const container = document.getElementById('attackers-list');
  if (!container) return;

  if (!attackers?.length) {
    container.innerHTML = '<div style="color:var(--text3);font-size:0.72rem;padding:0.5rem 0">Sin datos de ataques</div>';
    return;
  }

  const max = Math.max(1, attackers[0]?.count || 1);
  container.innerHTML = attackers.map((a, i) => {
    const pct = Math.min(100, (a.count / max) * 100).toFixed(1);
    return `
      <div class="attacker-row">
        <span class="attacker-rank">${i + 1}</span>
        <span class="attacker-ip">${esc(a.ip)}</span>
        <div class="attacker-bar-wrap">
          <div class="attacker-bar-bg">
            <div class="attacker-bar-fill" style="width:${pct}%"></div>
          </div>
          <span class="attacker-count">${a.count}</span>
        </div>
      </div>`;
  }).join('');
}

// ─── Sesiones ─────────────────────────────────────────────────────────────────
function renderSessions(sess) {
  if (!sess) return;

  setNum('sessions-count', sess.count || 0);

  const list = document.getElementById('sessions-list');
  if (list) {
    if (!sess.active?.length) {
      list.innerHTML = '<div style="color:var(--text3);font-size:0.72rem;padding:0.3rem 0">Sin sesiones activas</div>';
    } else {
      list.innerHTML = sess.active.map(u => `
        <div class="session-row">
          <span class="session-dot"></span>
          <span class="session-user">${esc(u.user)}</span>
          <span class="session-tty">${esc(u.terminal)}</span>
          <span class="session-host">${esc(u.host)}</span>
        </div>`).join('');
    }
  }

  const logins = document.getElementById('recent-logins');
  if (logins && sess.recent?.length) {
    logins.innerHTML = sess.recent.slice(0, 6).map(l =>
      `<div class="login-row"><span class="login-user">${esc(l.user)}</span>  ${esc(l.raw.slice(l.user.length).trim())}</div>`
    ).join('');
  }
}

// ─── Servicios ────────────────────────────────────────────────────────────────
function renderServices(services) {
  const grid = document.getElementById('services-grid');
  if (!grid || !services?.length) return;

  grid.innerHTML = services.map(s => {
    const cls    = s.active ? 'active' : (s.status === 'unknown' ? 'unknown' : 'inactive');
    const label  = s.active ? 'activo' : (s.status || 'inactivo');
    return `
      <div class="service-item ${cls}">
        <span class="service-dot"></span>
        <span class="service-name">${esc(s.name)}</span>
        <span class="service-status">${esc(label)}</span>
      </div>`;
  }).join('');
}

// ─── Eventos ──────────────────────────────────────────────────────────────────
function renderEvents(events) {
  const list = document.getElementById('events-list');
  if (!list) return;

  setText('events-updated', `últ. actualiz: ${new Date().toLocaleTimeString('es-ES')}`);

  if (!events?.length) {
    list.innerHTML = '<div style="color:var(--text3);font-size:0.72rem;padding:0.5rem 0">Sin eventos recientes</div>';
    return;
  }

  list.innerHTML = events.map(ev => `
    <div class="event-row ${esc(ev.level || 'info')}">
      <span class="event-indicator"></span>
      <span class="event-ts">${esc(ev.ts ? ev.ts.slice(11, 19) : '—')}</span>
      <span class="event-label">${esc(ev.label || '')}</span>
      <span class="event-ip">${esc(ev.ip || '')}</span>
    </div>`).join('');
}

// ─── Actualizaciones ──────────────────────────────────────────────────────────
function renderUpdates(upd) {
  const container = document.getElementById('updates-content');
  if (!container || !upd) return;

  const hasUpdates = upd.count > 0;
  const hasSec     = upd.security_count > 0;

  const checkedAt = upd.checked_at
    ? new Date(upd.checked_at * 1000).toLocaleTimeString('es-ES')
    : '—';

  container.innerHTML = `
    <div class="update-stat">
      <div class="update-stat-val ${hasUpdates ? 'warn' : 'ok'}">${upd.count || 0}</div>
      <div class="update-stat-lbl">paquetes actualizables</div>
    </div>
    ${hasSec ? `
    <div class="update-sec-box">
      <div class="update-sec-title">⚠ Posibles actualizaciones de seguridad (${upd.security_count})</div>
      <div class="update-sec-list">
        ${(upd.security_pkgs || []).map(p => `<div class="update-pkg">${esc(p)}</div>`).join('')}
      </div>
    </div>` : ''}
    <div class="update-checked">Comprobado: ${checkedAt}</div>`;
}

// ─── Mapa de países ───────────────────────────────────────────────────────────
function renderCountries(countries) {
  // Update D3 map bubbles
  if (typeof updateWorldMap === 'function') updateWorldMap(countries || [], currentLiveAttackBurst);
  currentLiveAttackBurst = 0;

  // Update country count badge
  const cnt = (countries || []).length;
  setText('map-country-count', `${cnt} país${cnt !== 1 ? 'es' : ''}`);

  // Countries list panel
  const list = document.getElementById('countries-list');
  if (!list || !countries?.length) return;

  const max = Math.max(1, countries[0]?.count || 1);
  list.innerHTML = countries.slice(0, 12).map(c => {
    const pct  = Math.min(100, (c.count / max) * 100).toFixed(1);
    const flag = isoToFlag(c.iso || '');
    return `
      <div class="country-row">
        <span class="country-flag">${flag}</span>
        <span class="country-name">${esc(c.country || 'Unknown')}</span>
        <div class="country-bar-bg">
          <div class="country-bar-fill" style="width:${pct}%"></div>
        </div>
        <span class="country-count">${c.count}</span>
      </div>`;
  }).join('');
}

// ─── VPN / Datacenter donut ───────────────────────────────────────────────────
function renderVpnDonut(ssh) {
  if (!ssh) return;
  const dcCount  = ssh.vpn_dc_attacks  || 0;
  const dirCount = ssh.direct_attacks  || 0;

  if (typeof updateVpnDonutChart === 'function') updateVpnDonutChart(dcCount, dirCount);

  // Legend
  const total = dcCount + dirCount || 1;
  const legend = document.getElementById('vpn-legend');
  if (legend) {
    legend.innerHTML = `
      <div class="vpn-leg-row"><span class="vpn-leg-dot dc"></span>DC/VPN <strong>${dcCount}</strong> <span class="vpn-pct">(${Math.round(dcCount/total*100)}%)</span></div>
      <div class="vpn-leg-row"><span class="vpn-leg-dot dir"></span>Directo <strong>${dirCount}</strong> <span class="vpn-pct">(${Math.round(dirCount/total*100)}%)</span></div>`;
  }

  // Top ASNs
  const asnsEl = document.getElementById('vpn-asns');
  if (asnsEl && ssh.top_asns?.length) {
    const maxA = Math.max(1, ssh.top_asns[0].count);
    asnsEl.innerHTML = `<div class="vpn-asns-title">Top ASNs atacantes</div>` +
      ssh.top_asns.slice(0, 6).map(a => {
        const pct = Math.min(100, (a.count / maxA) * 100).toFixed(0);
        return `<div class="vpn-asn-row">
          <span class="vpn-asn-name" title="${esc(a.org)}">${esc(a.org.length > 22 ? a.org.slice(0, 21) + '…' : a.org)}</span>
          <div class="vpn-asn-bar-bg"><div class="vpn-asn-bar-fill" style="width:${pct}%"></div></div>
          <span class="vpn-asn-count">${a.count}</span>
        </div>`;
      }).join('');
  }
}

// ─── Tabla enriquecida de atacantes ──────────────────────────────────────────
function renderEnrichedAttackers(attackers) {
  const tbody = document.getElementById('enriched-attackers-body');
  if (!tbody) return;

  if (!attackers?.length) {
    tbody.innerHTML = `<tr><td colspan="7" class="no-data">Sin datos de ataques</td></tr>`;
    return;
  }

  tbody.innerHTML = attackers.map((a, i) => {
    const flag  = isoToFlag(a.country_iso || '');
    const badge = a.is_datacenter
      ? `<span class="vpn-badge">DC/VPN</span>`
      : `<span class="direct-badge">Directo</span>`;
    const org   = a.asn_org || a.isp || '—';
    const city  = a.city || '—';
    return `<tr class="enriched-row">
      <td class="td-rank">${i + 1}</td>
      <td class="td-ip"><span class="mono">${esc(a.ip)}</span></td>
      <td class="td-country">${flag} ${esc(a.country || '?')}</td>
      <td class="td-city">${esc(city)}</td>
      <td class="td-asn" title="${esc(org)}">${esc(org.length > 22 ? org.slice(0, 20) + '…' : org)}</td>
      <td class="td-type">${badge}</td>
      <td class="td-count">${a.count}</td>
    </tr>`;
  }).join('');
}

// ─── Usuarios más atacados ────────────────────────────────────────────────────
function renderUsernames(usernames) {
  const list = document.getElementById('usernames-list');
  if (!list) return;

  if (!usernames?.length) {
    list.innerHTML = '<div style="color:var(--text3);font-size:0.72rem;padding:0.5rem 0">Sin datos</div>';
    return;
  }

  const max = Math.max(1, usernames[0]?.count || 1);
  list.innerHTML = usernames.slice(0, 12).map((u, i) => {
    const pct = Math.min(100, (u.count / max) * 100).toFixed(1);
    return `
      <div class="username-row">
        <span class="username-rank">${i + 1}</span>
        <span class="username-val mono">${esc(u.user)}</span>
        <div class="username-bar-bg">
          <div class="username-bar-fill" style="width:${pct}%"></div>
        </div>
        <span class="username-count">${u.count}</span>
      </div>`;
  }).join('');
}

// ─── Heatmap ──────────────────────────────────────────────────────────────────
function renderHeatmap(ssh) {
  if (!ssh?.heatmap) return;
  if (typeof updateHeatmap === 'function') updateHeatmap(ssh.heatmap, ssh.heatmap_days);
}

// ─── Hourly chart (24h) ───────────────────────────────────────────────────────
function renderHourlyChart(attackHours) {
  if (typeof updateHourlyChart === 'function') updateHourlyChart(attackHours);
}

// ─── Helpers DOM ──────────────────────────────────────────────────────────────
// Country ISO code → emoji flag
function isoToFlag(iso) {
  if (!iso || iso.length !== 2) return '🌐';
  const cp1 = 0x1F1E6 + (iso.charCodeAt(0) - 65);
  const cp2 = 0x1F1E6 + (iso.charCodeAt(1) - 65);
  return String.fromCodePoint(cp1) + String.fromCodePoint(cp2);
}

// ─── Helpers DOM ──────────────────────────────────────────────────────────────
function setText(id, value) {
  const el = document.getElementById(id);
  if (el && el.textContent !== String(value)) el.textContent = value;
}

function setNum(id, value) {
  const el = document.getElementById(id);
  if (!el) return;
  const str = String(value);
  if (el.textContent !== str) {
    el.textContent = str;
    el.classList.remove('flash');
    void el.offsetWidth; // reflow
    el.classList.add('flash');
  }
}

function esc(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fmtBytes(n) {
  if (n == null || isNaN(n)) return '—';
  if (n < 1024)       return n.toFixed(0) + ' B';
  if (n < 1048576)    return (n / 1024).toFixed(1) + ' KB';
  if (n < 1073741824) return (n / 1048576).toFixed(2) + ' MB';
  return (n / 1073741824).toFixed(2) + ' GB';
}

function formatUptime(seconds) {
  if (!seconds) return '—';
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600)  / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function showError(msg) {
  let el = document.querySelector('.api-error');
  if (!el) {
    el = document.createElement('div');
    el.className = 'api-error';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add('visible');
}

function hideError() {
  const el = document.querySelector('.api-error');
  if (el) el.classList.remove('visible');
}

function ensureDataSourcePill() {
  let pill = document.getElementById('data-source-pill');
  if (pill) return pill;

  const host = document.querySelector('.topbar-right') || document.querySelector('.refresh-wrap');
  if (!host) return null;

  pill = document.createElement('span');
  pill.id = 'data-source-pill';
  pill.className = 'data-source-pill is-loading';
  pill.textContent = 'Conectando...';
  host.appendChild(pill);
  return pill;
}

function setDataSourceStatus(state, text) {
  const pill = ensureDataSourcePill();
  if (!pill) return;

  pill.className = `data-source-pill is-${state}`;
  pill.textContent = text;
}
