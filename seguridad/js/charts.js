/* ═══════════════════════════════════════════════════════════════════════════
   SecurePi — Charts (Chart.js v4 + D3 v7)
   ═══════════════════════════════════════════════════════════════════════════ */

'use strict';

Chart.defaults.color = '#94a3b8';
Chart.defaults.borderColor = 'rgba(255,255,255,0.05)';
Chart.defaults.font.family = "'JetBrains Mono', 'Inter', sans-serif";
Chart.defaults.font.size = 10;
Chart.defaults.animation.duration = 400;

const GAUGE_PATH_LEN = 259.2;
const WORLD_TOPO = '/seguridad/js/countries-110m.json';
const MAP_W = 960;
const MAP_H = 460;
const MAP_SPAIN = { lon: -3.7038, lat: 40.4168, label: 'Raspberry (España)' };
const EMPTY_HEATMAP = Array.from({ length: 7 }, () => Array(24).fill(0));

let sshChart = null;
let netChart = null;
let hourlyChart = null;
let vpnDonutChart = null;

let mapSvg = null;
let mapViewport = null;
let mapProjection = null;
let mapPath = null;
let mapZoom = null;
let mapReady = false;
let mapPendingCountries = null;
let mapSpainXY = null;
let mapTooltipEl = null;

function initCharts() {
  createSSHChart();
  createNetChart();
  createHourlyChart();
  createVpnDonutChart();
  initWorldMap();
  updateHeatmap(EMPTY_HEATMAP, ['L', 'M', 'X', 'J', 'V', 'S', 'D']);
}

function createSSHChart() {
  const canvas = document.getElementById('chart-ssh');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, 0, 180);
  gradient.addColorStop(0, 'rgba(239,68,68,0.45)');
  gradient.addColorStop(0.65, 'rgba(239,68,68,0.12)');
  gradient.addColorStop(1, 'rgba(239,68,68,0)');

  sshChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        data: [],
        label: 'Ataques',
        borderColor: '#ef4444',
        backgroundColor: gradient,
        borderWidth: 2,
        fill: true,
        tension: 0.35,
        pointRadius: 2.5,
        pointHoverRadius: 4,
        pointBackgroundColor: '#ef4444',
        pointBorderColor: '#0a1628',
        pointBorderWidth: 1.5,
      }],
    },
    options: chartOptions({
      tooltipBorder: 'rgba(239,68,68,0.5)',
      tooltipTitle: '#f87171',
      tooltipLabel: item => ` ${item.raw} intento${item.raw !== 1 ? 's' : ''}`,
      yStepSize: 1,
    }),
  });
}

function updateSSHChart(timeline) {
  if (!sshChart) return;
  const points = normalizeTimeline(timeline, 60);
  sshChart.data.labels = points.map(point => point.label);
  sshChart.data.datasets[0].data = points.map(point => point.value);
  sshChart.update('none');
}

function createNetChart() {
  const canvas = document.getElementById('chart-net');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const recvGradient = ctx.createLinearGradient(0, 0, 0, 120);
  recvGradient.addColorStop(0, 'rgba(52,211,153,0.30)');
  recvGradient.addColorStop(1, 'rgba(52,211,153,0)');

  const sentGradient = ctx.createLinearGradient(0, 0, 0, 120);
  sentGradient.addColorStop(0, 'rgba(96,165,250,0.28)');
  sentGradient.addColorStop(1, 'rgba(96,165,250,0)');

  netChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [
        {
          label: 'Recibido',
          data: [],
          borderColor: '#34d399',
          backgroundColor: recvGradient,
          borderWidth: 2,
          fill: true,
          tension: 0.32,
          pointRadius: 0,
        },
        {
          label: 'Enviado',
          data: [],
          borderColor: '#60a5fa',
          backgroundColor: sentGradient,
          borderWidth: 2,
          fill: true,
          tension: 0.32,
          pointRadius: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#0d1e35',
          borderColor: 'rgba(0,212,255,0.2)',
          borderWidth: 1,
          titleColor: '#dbeafe',
          bodyColor: '#e2e8f0',
          callbacks: {
            label: item => ` ${item.dataset.label}: ${fmtBytesLocal(item.raw)}/s`,
          },
        },
      },
      scales: {
        x: axisX(),
        y: {
          ...axisY(),
          ticks: {
            color: '#475569',
            font: { size: 9 },
            callback: value => fmtBytesLocal(Number(value)),
          },
        },
      },
    },
  });
}

function updateNetChart(history) {
  if (!netChart) return;
  const points = normalizeNetHistory(history, 40);
  netChart.data.labels = points.map(point => point.label);
  netChart.data.datasets[0].data = points.map(point => point.recv);
  netChart.data.datasets[1].data = points.map(point => point.sent);
  netChart.update('none');
}

function setGauge(fillId, valueId, percent) {
  const fill = document.getElementById(fillId);
  const value = document.getElementById(valueId);
  const safePercent = clamp(Number(percent) || 0, 0, 100);
  const offset = GAUGE_PATH_LEN * (1 - safePercent / 100);

  if (fill) {
    fill.style.strokeDasharray = String(GAUGE_PATH_LEN);
    fill.style.strokeDashoffset = String(offset);
  }

  if (value) {
    value.textContent = `${Math.round(safePercent)}%`;
  }
}

function initWorldMap() {
  const container = document.getElementById('world-map-container');
  if (!container || mapSvg) return;

  if (typeof d3 === 'undefined' || typeof topojson === 'undefined') {
    container.innerHTML = '<p style="color:#475569;font-size:0.72rem;text-align:center;padding:3rem 1rem">Mapa no disponible</p>';
    return;
  }

  mapSvg = d3.select(container)
    .append('svg')
    .attr('viewBox', `0 0 ${MAP_W} ${MAP_H}`)
    .attr('preserveAspectRatio', 'xMidYMid meet')
    .style('width', '100%')
    .style('height', 'auto')
    .style('display', 'block');

  ensureMapTooltip();

  mapViewport = mapSvg.append('g').attr('class', 'map-viewport');
  mapProjection = d3.geoNaturalEarth1().scale(153).translate([MAP_W / 2, MAP_H / 2]);
  mapPath = d3.geoPath().projection(mapProjection);
  mapSpainXY = mapProjection([MAP_SPAIN.lon, MAP_SPAIN.lat]);

  mapZoom = d3.zoom()
    .scaleExtent([1, 8])
    .extent([[0, 0], [MAP_W, MAP_H]])
    .translateExtent([[-MAP_W, -MAP_H], [MAP_W * 2, MAP_H * 2]])
    .on('zoom', event => {
      if (mapViewport) mapViewport.attr('transform', event.transform);
    });

  mapSvg.call(mapZoom).on('dblclick.zoom', null);
  bindWorldMapControls();

  mapViewport.append('path')
    .datum({ type: 'Sphere' })
    .attr('class', 'map-sphere')
    .attr('d', mapPath);

  mapViewport.append('path')
    .datum(d3.geoGraticule()())
    .attr('class', 'map-graticule')
    .attr('d', mapPath);

  mapSvg.append('text')
    .attr('class', 'map-loading-txt')
    .attr('x', MAP_W / 2)
    .attr('y', MAP_H / 2)
    .attr('text-anchor', 'middle')
    .attr('dominant-baseline', 'middle')
    .attr('fill', '#64748b')
    .attr('font-size', 14)
    .text('Cargando mapa...');

  d3.json(WORLD_TOPO)
    .then(world => {
      mapSvg.select('.map-loading-txt').remove();

      const countries = topojson.feature(world, world.objects.countries);
      mapViewport.append('g')
        .attr('class', 'map-countries')
        .selectAll('path')
        .data(countries.features)
        .enter()
        .append('path')
        .attr('class', 'map-country')
        .attr('d', mapPath);

      mapViewport.append('path')
        .datum(topojson.mesh(world, world.objects.countries, (a, b) => a !== b))
        .attr('class', 'map-borders')
        .attr('d', mapPath);

      mapViewport.append('path')
        .datum({ type: 'Sphere' })
        .attr('class', 'map-sphere-border')
        .attr('d', mapPath);

      mapViewport.append('g').attr('class', 'map-routes');
      mapViewport.append('g').attr('class', 'map-origins');
      mapViewport.append('g').attr('class', 'map-destination');

      mapReady = true;
      if (mapPendingCountries) {
        updateWorldMap(mapPendingCountries);
        mapPendingCountries = null;
      } else {
        renderMapDestination();
      }

      zoomToGlobal();
    })
    .catch(() => {
      mapSvg.select('.map-loading-txt')
        .text('No se pudo cargar el mapa');
    });
}

function updateWorldMap(countries) {
  if (!mapReady || !mapViewport || !mapProjection) {
    mapPendingCountries = countries;
    return;
  }

  const routesLayer = mapViewport.select('.map-routes');
  const originsLayer = mapViewport.select('.map-origins');
  routesLayer.selectAll('*').remove();
  originsLayer.selectAll('*').remove();

  const valid = (Array.isArray(countries) ? countries : [])
    .map(country => normalizeCountry(country))
    .filter(country => Number.isFinite(country.lon) && Number.isFinite(country.lat) && country.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  renderMapDestination();

  if (!valid.length || !mapSpainXY) return;

  const maxCount = Math.max(...valid.map(country => country.count), 1);
  const lineWidth = d3.scaleSqrt().domain([1, maxCount]).range([1.4, 5]);
  const nodeRadius = d3.scaleSqrt().domain([1, maxCount]).range([2.8, 8]);
  const levelText = { high: 'Alta actividad', mid: 'Actividad media', low: 'Actividad baja' };
  const statusText = {
    high: 'Origen con actividad especialmente intensa en la ventana actual.',
    mid: 'Origen activo con volumen sostenido.',
    low: 'Origen detectado con actividad baja pero reciente.',
  };

  valid.forEach((country, index) => {
    const origin = mapProjection([country.lon, country.lat]);
    if (!origin) return;

    const [x, y] = origin;
    const [sx, sy] = mapSpainXY;
    const dx = sx - x;
    const dy = sy - y;
    const distance = Math.hypot(dx, dy);
    const lift = clamp(distance * 0.18, 18, 58);
    const cx = x + dx / 2;
    const cy = y + dy / 2 - lift;
    const baseWidth = lineWidth(country.count);
    const shadowCy = cy + clamp(lift * 0.22, 5, 14);
    const level = country.count >= maxCount * 0.66 ? 'high' : (country.count >= maxCount * 0.33 ? 'mid' : 'low');
    const tooltip = [
      `<div class="map-tip-title">${escapeHtml(country.country)}</div>`,
      `<div class="map-tip-row"><span>Intentos</span><strong>${country.count}</strong></div>`,
      `<div class="map-tip-row"><span>Nivel</span><strong>${levelText[level]}</strong></div>`,
      `<div class="map-tip-row"><span>Ranking</span><strong>#${index + 1}</strong></div>`,
      `<div class="map-tip-note">${statusText[level]}</div>`,
    ].join('');

    routesLayer.append('path')
      .attr('class', `map-route-shadow route-${level}`)
      .attr('d', `M${x},${y} Q${cx},${shadowCy} ${sx},${sy}`)
      .attr('stroke-width', baseWidth * 1.65);

    routesLayer.append('path')
      .attr('class', `map-route route-${level} route-live route-live-${level}`)
      .attr('d', `M${x},${y} Q${cx},${cy} ${sx},${sy}`)
      .attr('stroke-width', baseWidth)
      .on('mouseenter', event => showMapTooltip(event, tooltip))
      .on('mousemove', event => placeMapTooltip(event))
      .on('mouseleave', hideMapTooltip);

    originsLayer.append('circle')
      .attr('class', `map-origin origin-${level}`)
      .attr('cx', x)
      .attr('cy', y)
      .attr('r', nodeRadius(country.count))
      .on('mouseenter', event => showMapTooltip(event, tooltip))
      .on('mousemove', event => placeMapTooltip(event))
      .on('mouseleave', hideMapTooltip);
  });
}

function renderMapDestination() {
  if (!mapViewport || !mapSpainXY) return;

  const destinationLayer = mapViewport.select('.map-destination');
  destinationLayer.selectAll('*').remove();

  destinationLayer.append('circle')
    .attr('class', 'map-spain-halo')
    .attr('cx', mapSpainXY[0])
    .attr('cy', mapSpainXY[1])
    .attr('r', 10.5)
    .attr('data-base-r', 10.5);

  destinationLayer.append('circle')
    .attr('class', 'map-spain-node')
    .attr('cx', mapSpainXY[0])
    .attr('cy', mapSpainXY[1])
    .attr('r', 5.2)
    .attr('data-base-r', 5.2);

  destinationLayer.append('text')
    .attr('class', 'map-spain-label')
    .attr('x', mapSpainXY[0] + 10)
    .attr('y', mapSpainXY[1] - 10)
    .text(MAP_SPAIN.label);
}

function bindWorldMapControls() {
  const zoomIn = document.getElementById('map-zoom-in');
  const zoomOut = document.getElementById('map-zoom-out');
  const center = document.getElementById('map-center');
  const global = document.getElementById('map-global');

  if (!zoomIn || zoomIn.dataset.bound === '1') return;

  zoomIn.dataset.bound = '1';
  zoomOut.dataset.bound = '1';
  center.dataset.bound = '1';
  global.dataset.bound = '1';

  zoomIn.addEventListener('click', () => {
    if (mapSvg && mapZoom) mapSvg.transition().duration(180).call(mapZoom.scaleBy, 1.25);
  });

  zoomOut.addEventListener('click', () => {
    if (mapSvg && mapZoom) mapSvg.transition().duration(180).call(mapZoom.scaleBy, 0.8);
  });

  center.addEventListener('click', zoomToSpain);
  global.addEventListener('click', zoomToGlobal);
}

function zoomToGlobal() {
  if (mapSvg && mapZoom) {
    mapSvg.transition().duration(250).call(mapZoom.transform, d3.zoomIdentity);
  }
}

function zoomToSpain() {
  if (!mapSvg || !mapZoom || !mapSpainXY) return;
  const scale = 2.2;
  const transform = d3.zoomIdentity
    .translate(MAP_W / 2 - mapSpainXY[0] * scale, MAP_H / 2 - mapSpainXY[1] * scale)
    .scale(scale);
  mapSvg.transition().duration(280).call(mapZoom.transform, transform);
}

function ensureMapTooltip() {
  const container = document.getElementById('world-map-container');
  if (!container) return null;

  let tooltip = container.querySelector('.map-tooltip');
  if (!tooltip) {
    tooltip = document.createElement('div');
    tooltip.className = 'map-tooltip';
    container.appendChild(tooltip);
  }

  mapTooltipEl = tooltip;
  return tooltip;
}

function showMapTooltip(event, html) {
  const tooltip = ensureMapTooltip();
  if (!tooltip) return;
  tooltip.innerHTML = html;
  tooltip.classList.add('show');
  placeMapTooltip(event);
}

function placeMapTooltip(event) {
  if (!mapTooltipEl) return;

  const container = document.getElementById('world-map-container');
  if (!container) return;

  const rect = container.getBoundingClientRect();
  const tipW = mapTooltipEl.offsetWidth || 220;
  const tipH = mapTooltipEl.offsetHeight || 90;
  const pad = 12;

  let x = event.clientX - rect.left + 14;
  let y = event.clientY - rect.top + 14;

  if (x + tipW > rect.width - pad) x = Math.max(pad, rect.width - tipW - pad);
  if (y + tipH > rect.height - pad) y = Math.max(pad, rect.height - tipH - pad);

  mapTooltipEl.style.left = `${x}px`;
  mapTooltipEl.style.top = `${y}px`;
}

function hideMapTooltip() {
  if (mapTooltipEl) mapTooltipEl.classList.remove('show');
}

function updateHeatmap(matrix, dayLabels) {
  const container = document.getElementById('heatmap-container');
  if (!container || typeof d3 === 'undefined') return;

  const rows = Array.isArray(matrix) && matrix.length ? matrix : EMPTY_HEATMAP;
  const labels = Array.isArray(dayLabels) && dayLabels.length ? dayLabels : ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
  const labelWidth = 68;
  const cols = 24;
  const cellWidth = Math.max(8, Math.floor((container.clientWidth - labelWidth - 24) / cols));
  const cellHeight = Math.max(18, Math.floor(cellWidth * 0.75));
  const topHeight = 18;
  const svgW = labelWidth + cols * cellWidth + 4;
  const svgH = topHeight + rows.length * cellHeight + 8;
  const flat = rows.flat().map(value => Number(value) || 0);
  const maxValue = Math.max(1, ...flat);
  const color = d3.scaleSequential().domain([0, maxValue]).interpolator(d3.interpolateRgb('#0d1e35', '#ef4444'));

  container.innerHTML = '';

  const svg = d3.select(container)
    .append('svg')
    .attr('viewBox', `0 0 ${svgW} ${svgH}`)
    .attr('preserveAspectRatio', 'xMidYMid meet')
    .style('width', '100%');

  for (let hour = 0; hour < cols; hour += 1) {
    if (hour % 3 === 0) {
      svg.append('text')
        .attr('x', labelWidth + hour * cellWidth + cellWidth / 2)
        .attr('y', topHeight - 3)
        .attr('text-anchor', 'middle')
        .attr('class', 'hm-label')
        .text(`${hour}h`);
    }
  }

  rows.forEach((row, rowIndex) => {
    svg.append('text')
      .attr('x', labelWidth - 4)
      .attr('y', topHeight + rowIndex * cellHeight + cellHeight / 2 + 4)
      .attr('text-anchor', 'end')
      .attr('class', 'hm-label')
      .text(labels[rowIndex] || '');

    for (let col = 0; col < cols; col += 1) {
      const value = Number(row?.[col]) || 0;
      const group = svg.append('g');

      group.append('rect')
        .attr('x', labelWidth + col * cellWidth + 1)
        .attr('y', topHeight + rowIndex * cellHeight + 1)
        .attr('width', cellWidth - 2)
        .attr('height', cellHeight - 2)
        .attr('rx', 2)
        .attr('fill', value === 0 ? '#0d1e35' : color(value))
        .attr('opacity', value === 0 ? 0.6 : 1);

      group.append('title').text(`${labels[rowIndex] || rowIndex}, ${col}:00 — ${value} ataques`);
    }
  });
}

function createHourlyChart() {
  const canvas = document.getElementById('chart-hourly');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, 0, 160);
  gradient.addColorStop(0, 'rgba(251,146,60,0.8)');
  gradient.addColorStop(0.65, 'rgba(251,146,60,0.24)');
  gradient.addColorStop(1, 'rgba(251,146,60,0)');

  hourlyChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: Array.from({ length: 24 }, (_, i) => `${i}h`),
      datasets: [{
        data: Array(24).fill(0),
        label: 'Ataques',
        backgroundColor: gradient,
        borderColor: '#fb923c',
        borderWidth: 1,
        borderRadius: 3,
      }],
    },
    options: chartOptions({
      tooltipBorder: 'rgba(251,146,60,0.5)',
      tooltipTitle: '#fed7aa',
      tooltipLabel: item => ` ${item.raw} ataque${item.raw !== 1 ? 's' : ''}`,
      yStepSize: 1,
      type: 'bar',
    }),
  });
}

function updateHourlyChart(attackHours) {
  if (!hourlyChart) return;

  const normalized = normalizeHourly(attackHours);
  hourlyChart.data.labels = normalized.map(item => item.label);
  hourlyChart.data.datasets[0].data = normalized.map(item => item.value);
  hourlyChart.update('none');
}

function createVpnDonutChart() {
  const canvas = document.getElementById('chart-vpn');
  if (!canvas) return;

  vpnDonutChart = new Chart(canvas.getContext('2d'), {
    type: 'doughnut',
    data: {
      labels: ['Datacenter / VPN', 'Directo'],
      datasets: [{
        data: [0, 0],
        backgroundColor: ['#f59e0b', '#3b82f6'],
        borderColor: ['#f59e0b', '#3b82f6'],
        borderWidth: 2,
        hoverOffset: 6,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '68%',
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#0d1e35',
          borderColor: 'rgba(0,212,255,0.2)',
          borderWidth: 1,
          callbacks: {
            label: item => ` ${item.label}: ${item.raw} ataques`,
          },
        },
      },
    },
  });
}

function updateVpnDonutChart(vpnDc, direct) {
  if (!vpnDonutChart) return;
  vpnDonutChart.data.datasets[0].data = [Number(vpnDc) || 0, Number(direct) || 0];
  vpnDonutChart.update('none');
}

function chartOptions({ tooltipBorder, tooltipTitle, tooltipLabel, yStepSize, type = 'line' }) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0d1e35',
        borderColor: tooltipBorder,
        borderWidth: 1,
        titleColor: tooltipTitle,
        bodyColor: '#e2e8f0',
        callbacks: { label: tooltipLabel },
      },
    },
    scales: {
      x: axisX(),
      y: axisY(yStepSize),
    },
    ...(type === 'bar' ? {} : { interaction: { mode: 'index', intersect: false } }),
  };
}

function axisX() {
  return {
    grid: { color: 'rgba(255,255,255,0.04)' },
    ticks: { color: '#475569', font: { size: 9 }, maxRotation: 0 },
  };
}

function axisY(stepSize) {
  return {
    beginAtZero: true,
    grid: { color: 'rgba(255,255,255,0.04)' },
    ticks: {
      color: '#475569',
      font: { size: 9 },
      ...(stepSize ? { stepSize } : {}),
    },
  };
}

function normalizeTimeline(input, fallbackLength) {
  if (!Array.isArray(input) || !input.length) {
    return Array.from({ length: fallbackLength }, (_, i) => ({ label: `${fallbackLength - i}m`, value: 0 })).reverse();
  }

  return input.map((item, index) => {
    if (typeof item === 'number') {
      return { label: `${index + 1}`, value: item };
    }

    return {
      label: String(item.label ?? item.minute ?? item.time ?? item.ts ?? item.bucket ?? index + 1),
      value: Number(item.count ?? item.value ?? item.attacks ?? item.failed ?? item.y ?? 0),
    };
  });
}

function normalizeNetHistory(input, fallbackLength) {
  if (!Array.isArray(input) || !input.length) {
    return Array.from({ length: fallbackLength }, (_, i) => ({ label: `${i + 1}`, recv: 0, sent: 0 }));
  }

  return input.map((item, index) => ({
    label: String(item.label ?? item.time ?? item.ts ?? item.minute ?? index + 1),
    recv: Number(item.recv ?? item.recv_rate ?? item.rx ?? item.download ?? item.in ?? 0),
    sent: Number(item.sent ?? item.sent_rate ?? item.tx ?? item.upload ?? item.out ?? 0),
  }));
}

function normalizeHourly(input) {
  const base = Array.from({ length: 24 }, (_, hour) => ({ label: `${hour}h`, value: 0 }));
  if (!Array.isArray(input) || !input.length) return base;

  input.forEach((item, index) => {
    if (typeof item === 'number') {
      if (index < 24) base[index].value = item;
      return;
    }

    const rawHour = Number(item.hour ?? item.h ?? index);
    const hour = Number.isFinite(rawHour) ? clamp(Math.round(rawHour), 0, 23) : clamp(index, 0, 23);
    base[hour].value = Number(item.count ?? item.value ?? item.attacks ?? 0);
  });

  return base;
}

function normalizeCountry(country) {
  return {
    country: String(country?.country ?? country?.name ?? country?.label ?? 'Unknown'),
    count: Number(country?.count ?? country?.value ?? country?.attacks ?? 0),
    lon: toNumber(country?.lon ?? country?.lng ?? country?.longitude),
    lat: toNumber(country?.lat ?? country?.latitude),
  };
}

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : NaN;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function fmtBytesLocal(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0) return '0 B';
  if (amount < 1024) return `${amount.toFixed(0)} B`;
  if (amount < 1024 ** 2) return `${(amount / 1024).toFixed(1)} KB`;
  if (amount < 1024 ** 3) return `${(amount / 1024 ** 2).toFixed(2)} MB`;
  return `${(amount / 1024 ** 3).toFixed(2)} GB`;
}
