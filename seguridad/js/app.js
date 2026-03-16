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
let lastEventTs    = null;
let f2bCountdownTimer = null;

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
    '.card-countries',
    '.card-vpn',
    '.card-worldmap',
    '.card-net',
    '.card-heatmap',
    '.card-usernames',
    '.card-f2b',
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
  computeLiveBurst(d.events);
  renderFail2ban(d.fail2ban);
  renderGauges(d.system);
  renderNetwork(d.network);
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
  const uniqueIps24h = Number(ssh.unique_ips_24h ?? 0);
  const timeline = Array.isArray(ssh.timeline) ? ssh.timeline : [];
  const values = timeline.map(item => Number(item?.count ?? item?.value ?? item) || 0);
  const peakPerMinute = values.length ? Math.max(...values) : 0;

  lastFailed24h = failed24h;
  setText('ssh-1h-badge', `${count} en 1h`);
  setText('ssh-sum-1h', String(count));
  setText('ssh-sum-24h', String(failed24h));
  setText('ssh-sum-ips', String(uniqueIps24h));
  setText('ssh-sum-peak', String(peakPerMinute));
  updateSSHChart(ssh.timeline);
}

function computeLiveBurst(events) {
  if (!Array.isArray(events) || !events.length) {
    currentLiveAttackBurst = 0;
    return;
  }
  const newestTs = events[0]?.ts ? new Date(events[0].ts).getTime() : 0;
  if (lastEventTs === null) {
    currentLiveAttackBurst = 0;
  } else if (newestTs > lastEventTs) {
    currentLiveAttackBurst = events.filter(ev => {
      const t = ev?.ts ? new Date(ev.ts).getTime() : 0;
      return t > lastEventTs;
    }).length;
  } else {
    currentLiveAttackBurst = 0;
  }
  if (newestTs > 0) lastEventTs = newestTs;
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
  const listTitle = document.getElementById('f2b-list-title');
  const entries = extractCurrentBannedEntries(f2b);
  const currentTotal = Number(f2b.total_currently_banned ?? entries.length ?? 0);

  if (!entries.length) {
    if (listTitle) listTitle.textContent = 'Listado de IPs baneadas (tiempo real)';
    container.innerHTML = '<div class="f2b-empty">No hay IPs baneadas activas o la API no aporta detalle.</div>';
    if (f2bCountdownTimer) {
      clearInterval(f2bCountdownTimer);
      f2bCountdownTimer = null;
    }
    return;
  }

  if (listTitle) {
    const shown = entries.length;
    const missing = Math.max(0, currentTotal - shown);
    listTitle.textContent = missing > 0
      ? `IPs baneadas activas: mostrando ${shown} de ${currentTotal} (faltan ${missing} sin detalle en API)`
      : `IPs baneadas activas: mostrando ${shown} de ${currentTotal}`;
  }

  container.innerHTML = entries.map((entry, index) => {
    const cssType = banTypeToCss(entry.banType);
    const leftText = entry.secondsLeft != null
      ? formatCountdown(entry.secondsLeft)
      : 'N/D API';
    const title = entry.secondsLeft != null
      ? 'Cuenta atras estimada hasta desbaneo'
      : 'La API no expone tiempo restante por IP';

    return `
      <div class="f2b-ip-row">
        <span class="f2b-ip-rank">#${index + 1}</span>
        <span class="f2b-ip mono">${esc(entry.ip)}</span>
        <span class="f2b-ban-type ${cssType}">${esc(entry.banType)}</span>
        <span class="f2b-left" data-seconds-left="${entry.secondsLeft != null ? Math.max(0, Math.floor(entry.secondsLeft)) : ''}" title="${esc(title)}">${esc(leftText)}</span>
      </div>
    `;
  }).join('');

  startF2bCountdownTicker();
}

function extractCurrentBannedEntries(f2b) {
  const byIp = new Map();

  const addEntry = (entryRaw, jailName = '') => {
    const item = entryRaw && typeof entryRaw === 'object' ? entryRaw : { ip: entryRaw };
    const ip = String(item.ip ?? item.address ?? item.host ?? '').trim();
    if (!ip) return;

    const jail = String(item.jail ?? jailName ?? '').trim();
    const banType = String((item.ban_type ?? item.type ?? deriveBanTypeFromJail(jail)) || 'GENERAL').toUpperCase();
    const secondsLeft = deriveSecondsLeft(item);

    const prev = byIp.get(ip);
    if (!prev || (prev.secondsLeft == null && secondsLeft != null)) {
      byIp.set(ip, { ip, jail, banType, secondsLeft });
    }
  };

  const addFromList = (value, jailName = '') => {
    if (!Array.isArray(value)) return;
    value.forEach(v => addEntry(v, jailName));
  };

  addFromList(f2b.currently_banned_ips);
  addFromList(f2b.banned_ips);

  (f2b.jails || []).forEach(jail => {
    const name = String(jail?.name || '').trim();
    addFromList(jail?.currently_banned_ips, name);
    addFromList(jail?.current_banned_ips, name);
    addFromList(jail?.banned_ips, name);
    addFromList(jail?.ips, name);
  });

  return Array.from(byIp.values());
}

function deriveBanTypeFromJail(jailName) {
  const jail = String(jailName || '').toLowerCase();
  if (!jail) return 'GENERAL';
  if (jail.includes('recidive')) return 'RECIDIVA';
  if (jail.includes('sshd')) return 'SSH';
  if (jail.includes('nginx-http-auth')) return 'HTTP-AUTH';
  if (jail.includes('nginx-limit-req')) return 'RATE-LIMIT';
  return jail.toUpperCase();
}

function deriveSecondsLeft(item) {
  const nowSec = Math.floor(Date.now() / 1000);

  const explicitLeft = Number(item.seconds_left ?? item.remaining_seconds ?? item.left_seconds);
  if (Number.isFinite(explicitLeft) && explicitLeft >= 0) return explicitLeft;

  const unbanCandidates = [item.unban_at, item.unban_ts, item.expires_at, item.expire_at, item.until];
  for (const candidate of unbanCandidates) {
    if (candidate == null) continue;
    const tsSec = normalizeToUnixSeconds(candidate);
    if (tsSec != null && tsSec >= nowSec) return tsSec - nowSec;
  }

  const bannedAt = normalizeToUnixSeconds(item.banned_at ?? item.ban_ts ?? item.since);
  const banTime = Number(item.ban_time ?? item.bantime ?? item.duration_seconds);
  if (bannedAt != null && Number.isFinite(banTime) && banTime > 0) {
    const left = bannedAt + banTime - nowSec;
    return left > 0 ? left : 0;
  }

  return null;
}

function normalizeToUnixSeconds(value) {
  if (value == null) return null;

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return null;
    if (value > 1e12) return Math.floor(value / 1000);
    return Math.floor(value);
  }

  const str = String(value).trim();
  if (!str) return null;
  if (/^\d+$/.test(str)) {
    const num = Number(str);
    if (!Number.isFinite(num)) return null;
    return num > 1e12 ? Math.floor(num / 1000) : Math.floor(num);
  }

  const ms = Date.parse(str);
  if (Number.isNaN(ms)) return null;
  return Math.floor(ms / 1000);
}

function banTypeToCss(type) {
  const t = String(type || '').toUpperCase();
  if (t.includes('RECID')) return 'type-recidive';
  if (t.includes('SSH')) return 'type-ssh';
  if (t.includes('HTTP')) return 'type-http';
  if (t.includes('RATE')) return 'type-rate';
  return 'type-general';
}

function formatCountdown(totalSeconds) {
  const s = Math.max(0, Number(totalSeconds) || 0);
  const hh = Math.floor(s / 3600);
  const mm = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  if (hh > 0) return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
  return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
}

function startF2bCountdownTicker() {
  if (f2bCountdownTimer) clearInterval(f2bCountdownTimer);
  f2bCountdownTimer = setInterval(updateF2bCountdowns, 1000);
  updateF2bCountdowns();
}

function updateF2bCountdowns() {
  const nodes = document.querySelectorAll('.f2b-left[data-seconds-left]');
  if (!nodes.length) return;

  nodes.forEach(node => {
    const raw = node.getAttribute('data-seconds-left');
    if (raw == null || raw === '') return;
    let left = Number(raw);
    if (!Number.isFinite(left)) return;

    node.textContent = formatCountdown(left);
    if (left <= 0) {
      node.classList.add('is-expiring');
      return;
    }

    left -= 1;
    node.setAttribute('data-seconds-left', String(left));
    if (left <= 60) node.classList.add('is-expiring');
  });
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
  renderNetworkSummary(net);
}

function renderNetworkSummary(net) {
  const detail = Array.isArray(net?.established_detail) ? net.established_detail : [];
  const inbound = detail.filter(conn => String(conn?.direction || '').toLowerCase() === 'inbound').length;
  const outbound = detail.filter(conn => String(conn?.direction || '').toLowerCase() === 'outbound').length;
  const internet = detail.filter(conn => String(conn?.location || '').toUpperCase() === 'INTERNET').length;
  const lan = detail.filter(conn => String(conn?.location || '').toUpperCase() === 'LAN').length;
  const suspicious = detail.filter(isPotentialIntrusionConn).length;
  const portsCount = Array.isArray(net?.listening_ports) ? net.listening_ports.length : 0;
  const totalRate = Number(net?.recv_rate || 0) + Number(net?.sent_rate || 0);

  setText('net-ports-count', String(portsCount));
  setText('net-inbound', String(inbound));
  setText('net-outbound', String(outbound));
  setText('net-internet', String(internet));
  setText('net-lan', String(lan));
  setText('net-suspicious', String(suspicious));
  setText('net-total-rate', `${fmtBytes(totalRate)}/s`);
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
  list.classList.add('terminal-feed');

  if (!events?.length) {
    list.innerHTML = '<div class="feed-empty">Sin eventos recientes</div>';
    return;
  }

  list.innerHTML = events.map(ev => {
    const parsed = parseEventForFeed(ev);
    return `<div class="feed-line ${parsed.tone}">` +
      `<span class="feed-ts">${esc(parsed.syslogTs)}</span>` +
      `<span class="feed-msg">${esc(parsed.msg)}</span>` +
      `<span class="feed-from">from</span>` +
      `<span class="feed-ip">${esc(parsed.ip)}</span>` +
      `<span class="feed-port-word">port</span>` +
      `<span class="feed-port">${esc(parsed.port)}</span>` +
      `</div>`;
  }).join('');
}

function formatSyslogTs(d) {
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const mon = months[d.getMonth()];
  const day = String(d.getDate()).padStart(2, ' ');
  const hh  = String(d.getHours()).padStart(2, '0');
  const mm  = String(d.getMinutes()).padStart(2, '0');
  const ss  = String(d.getSeconds()).padStart(2, '0');
  return `${mon} ${day} ${hh}:${mm}:${ss}`;
}

function parseEventForFeed(ev) {
  const ts = String(ev?.ts || '');
  const label = String(ev?.label || '');
  const raw = String(ev?.raw || ev?.message || ev?.msg || '');
  const sourceText = `${label} ${raw}`.toLowerCase();
  const ip = String(ev?.ip || extractFromText(`${label} ${raw}`, /\b(?:\d{1,3}\.){3}\d{1,3}\b/) || '—');

  const isBan   = /\bban(ead|ned|)\b|fail2ban.*ban|ip bloqueada|ip baneada/.test(sourceText);
  const isUnban = /\bunban(ead|ned|)\b|desban|desbanead|ip desbloqueada/.test(sourceText);

  const dateObj  = ts ? new Date(ts) : null;
  const validDate = dateObj && !Number.isNaN(dateObj.getTime());
  const syslogTs  = validDate ? formatSyslogTs(dateObj) : '— — —:—:—';

  const port = extractFromText(sourceText, /(?:port|puerto)\s*(\d{1,5})/, 1)
    || (sourceText.includes('ssh') ? '22' : '—');

  const msg = label || raw || 'Evento detectado';

  let tone = 'tone-attempt';
  if (isBan)   tone = 'tone-ban';
  if (isUnban) tone = 'tone-unban';

  return { syslogTs, msg, ip, port, tone };
}

function inferAttemptReason(sourceText, fallbackLabel) {
  if (/usuario inv[aá]lido|invalid user/.test(sourceText)) return 'usuario no existe';
  if (/failed password|contrase[nñ]a/.test(sourceText)) return 'credenciales incorrectas';
  if (/authentication failure|auth failed|authentic/.test(sourceText)) return 'fallo de autenticación';
  if (/connection closed|closed by/.test(sourceText)) return 'conexión cerrada antes de autenticar';
  return fallbackLabel || 'acceso rechazado';
}

function extractFromText(text, regex, groupIndex = 0) {
  const match = String(text || '').match(regex);
  if (!match) return '';
  return String(match[groupIndex] || '').trim();
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
  list.innerHTML = countries.slice(0, 18).map(c => {
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

  const values = Array.isArray(attackHours)
    ? attackHours.map(v => Number(v) || 0)
    : [];

  if (!values.length) {
    setText('hourly-total', '—');
    setText('hourly-avg', '—');
    setText('hourly-peak-hour', '—');
    setText('hourly-peak-count', '—');
    return;
  }

  const total = values.reduce((sum, n) => sum + n, 0);
  const avg = total / values.length;
  let peakIdx = 0;
  let peakVal = values[0];
  values.forEach((v, i) => {
    if (v > peakVal) {
      peakVal = v;
      peakIdx = i;
    }
  });

  const now = new Date();
  const peakHour = new Date(now.getTime() - ((23 - peakIdx) * 3600 * 1000));
  const hh = String(peakHour.getHours()).padStart(2, '0');

  setText('hourly-total', String(total));
  setText('hourly-avg', avg.toFixed(1));
  setText('hourly-peak-hour', `${hh}:00`);
  setText('hourly-peak-count', String(peakVal));
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
