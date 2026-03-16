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
const COUNTRY_KEY_ALIASES = {
  theunitedstatesofamerica: 'unitedstates',
  unitedstatesofamerica: 'unitedstates',
  unitedstates: 'unitedstates',
  thenetherlands: 'netherlands',
  holland: 'netherlands',
  russianfederation: 'russia',
  republicofkorea: 'southkorea',
  korearepublicof: 'southkorea',
  czechrepublic: 'czechia',
  democraticrepublicofthecongo: 'democraticrepubliccongo',
  demrepcongo: 'democraticrepubliccongo',
};

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
let mapPendingBurst = 0;
let mapSpainXY = null;
let mapTooltipEl = null;
let mapMode = 'd3';
let globeInstance = null;
let globeContainer = null;
let globeStaticRoutes = [];
let globeLivePulseTimer = null;
let globePointerEvent = null;
let globeCountryFeatures = [];
let globeAttacksByCountryKey = new Map();
let globeMaxAttackCount = 1;
let globeBasePoints = [];
let globeLastAltitude = 1.9;

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
  if (!container || mapSvg || globeInstance) return;

  if (typeof Globe === 'function') {
    initWorldGlobe(container);
    return;
  }

  if (typeof d3 === 'undefined' || typeof topojson === 'undefined') {
    container.innerHTML = '<p style="color:#475569;font-size:0.72rem;text-align:center;padding:3rem 1rem">Mapa no disponible</p>';
    return;
  }

  mapMode = 'd3';

  mapSvg = d3.select(container)
    .append('svg')
    .attr('viewBox', `0 0 ${MAP_W} ${MAP_H}`)
    .attr('preserveAspectRatio', 'xMidYMid meet')
    .style('width', '100%')
    .style('height', 'auto')
    .style('display', 'block');

  const defs = mapSvg.append('defs');
  defs.append('filter')
    .attr('id', 'routeShadowBlur')
    .attr('x', '-40%')
    .attr('y', '-40%')
    .attr('width', '180%')
    .attr('height', '180%')
    .append('feGaussianBlur')
    .attr('stdDeviation', 3.8);

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
        updateWorldMap(mapPendingCountries, mapPendingBurst);
        mapPendingCountries = null;
        mapPendingBurst = 0;
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

function initWorldGlobe(container) {
  mapMode = 'globe';
  globeContainer = container;
  mapReady = false;

  container.innerHTML = '';
  ensureMapTooltip();
  container.addEventListener('mousemove', event => {
    globePointerEvent = event;
  });

  const width = Math.max(320, container.clientWidth || MAP_W);
  const height = Math.max(240, Math.round(width * 0.52));

  globeInstance = Globe({ animateIn: false })(container)
    .width(width)
    .height(height)
    .backgroundColor('rgba(0,0,0,0)')
    .showAtmosphere(true)
    .atmosphereColor('#6ea8ff')
    .atmosphereAltitude(0.12)
    .globeImageUrl('https://unpkg.com/three-globe/example/img/earth-night.jpg')
    .bumpImageUrl('https://unpkg.com/three-globe/example/img/earth-topology.png')
    .arcAltitudeAutoScale(0)
    .arcCurveResolution(72)
    .arcCircularResolution(8)
    .arcColor(route => route.color)
    .arcStroke(route => route.width)
    .arcDashLength(route => route.mode === 'pulse'
      ? 0.042
      : (String(route.mode || '').startsWith('live-burst') ? (route.dashLength ?? 0.06) : 1))
    .arcDashGap(route => route.mode === 'pulse'
      ? 0.958
      : (String(route.mode || '').startsWith('live-burst') ? (route.dashGap ?? 0.94) : 0))
    .arcDashInitialGap(route => (route.mode === 'pulse' || String(route.mode || '').startsWith('live-burst')) ? (route.pulseOffset ?? 0) : 0)
    .arcDashAnimateTime(route => route.mode === 'pulse' ? 5200 : (String(route.mode || '').startsWith('live-burst') ? 650 : 0))
    .arcLabel(route => route.label)
    .pointLat(point => point.lat)
    .pointLng(point => point.lon)
    .pointAltitude(point => point.altitude)
    .pointColor(point => point.color)
    .pointRadius(point => point.radius)
    .pointLabel(point => point.label)
    .onPolygonHover(feature => {
      if (!feature) {
        container.style.cursor = 'grab';
        hideMapTooltip();
        return;
      }

      const attack = findAttackForFeature(feature, globeAttacksByCountryKey);
      if (!attack || !globePointerEvent) {
        container.style.cursor = 'grab';
        hideMapTooltip();
        return;
      }

      const levelText = { high: 'Alta actividad', mid: 'Actividad media', low: 'Actividad baja' };
      const statusText = {
        high: 'Origen con actividad especialmente intensa en la ventana actual.',
        mid: 'Origen activo con volumen sostenido.',
        low: 'Origen detectado con actividad baja pero reciente.',
      };

      container.style.cursor = 'pointer';
      showMapTooltip(globePointerEvent, buildAttackTooltip(attack, levelText, statusText, globeMaxAttackCount, true));
    })
    .onArcHover(route => {
      if (!route) {
        container.style.cursor = 'grab';
        hideMapTooltip();
        return;
      }
      if (!globePointerEvent) return;
      container.style.cursor = 'pointer';
      showMapTooltip(globePointerEvent, route.tooltipHtml);
    })
    .onPointHover(point => {
      if (!point) {
        container.style.cursor = 'grab';
        hideMapTooltip();
        return;
      }
      if (!globePointerEvent) return;
      container.style.cursor = 'pointer';
      showMapTooltip(globePointerEvent, point.tooltipHtml || point.label || '');
    });

  try {
    const controls = globeInstance.controls?.();
    if (controls) {
      controls.autoRotate = false;
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.rotateSpeed = 0.8;
      controls.minDistance = 110;
      controls.maxDistance = 500;
      controls.addEventListener('change', () => {
        const pov = globeInstance?.pointOfView?.();
        if (!pov) return;
        globeLastAltitude = Number(pov.altitude) || globeLastAltitude;
        syncGlobePointScale();
      });
    }
  } catch {
    // keep defaults if controls are not available
  }

  // Some globe.gl builds do not expose this setter; keep it optional to avoid breaking init.
  if (typeof globeInstance.arcTransitionDuration === 'function') {
    globeInstance.arcTransitionDuration(0);
  }

  const renderer = globeInstance.renderer?.();
  if (renderer?.setPixelRatio) {
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  }

  bindWorldMapControls();
  bindGlobeResize();

  d3.json(WORLD_TOPO)
    .then(world => {
      const countries = topojson.feature(world, world.objects.countries)?.features || [];
      globeCountryFeatures = countries;
      globeInstance
        .polygonsData(globeCountryFeatures)
        .polygonCapColor(() => 'rgba(44, 78, 128, 0.52)')
        .polygonSideColor(() => 'rgba(31, 58, 98, 0.28)')
        .polygonStrokeColor(() => 'rgba(112, 162, 241, 0.35)')
        .polygonAltitude(0.004);

      mapReady = true;
      if (mapPendingCountries) {
        updateWorldMap(mapPendingCountries, mapPendingBurst);
        mapPendingCountries = null;
        mapPendingBurst = 0;
      }

      zoomToGlobal();
    })
    .catch(() => {
      mapReady = true;
      if (mapPendingCountries) {
        updateWorldMap(mapPendingCountries, mapPendingBurst);
        mapPendingCountries = null;
        mapPendingBurst = 0;
      }
      zoomToGlobal();
    });
}

function bindGlobeResize() {
  if (!globeContainer || globeContainer.dataset.resizeBound === '1') return;

  globeContainer.dataset.resizeBound = '1';
  window.addEventListener('resize', () => {
    if (!globeInstance || !globeContainer) return;
    const width = Math.max(320, globeContainer.clientWidth || MAP_W);
    const height = Math.max(240, Math.round(width * 0.52));
    globeInstance.width(width).height(height);
  });
}

function updateWorldMap(countries, liveAttackBurst = 0) {
  if (mapMode === 'globe') {
    updateWorldGlobe(countries, liveAttackBurst);
    return;
  }

  if (!mapReady || !mapViewport || !mapProjection) {
    mapPendingCountries = countries;
    mapPendingBurst = liveAttackBurst;
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
  const lineWidth = d3.scaleSqrt().domain([1, maxCount]).range([1.1, 2.8]);
  const nodeRadius = d3.scaleSqrt().domain([1, maxCount]).range([2.8, 8]);
  const levelText = { high: 'Alta actividad', mid: 'Actividad media', low: 'Actividad baja' };
  const statusText = {
    high: 'Origen con actividad especialmente intensa en la ventana actual.',
    mid: 'Origen activo con volumen sostenido.',
    low: 'Origen detectado con actividad baja pero reciente.',
  };

  const attacksByCountryKey = new Map();
  valid.forEach(country => {
    attacksByCountryKey.set(canonicalCountryKey(country.country), country);
  });

  mapViewport.select('.map-countries')
    .selectAll('path')
    .each(function(feature) {
      const attack = findAttackForFeature(feature, attacksByCountryKey);
      const countryPath = d3.select(this);
      countryPath
        .classed('map-country-active', Boolean(attack))
        .style('cursor', attack ? 'pointer' : 'default')
        .on('mouseenter', event => {
          if (!attack) return;
          showMapTooltip(event, buildAttackTooltip(attack, levelText, statusText, maxCount, true));
        })
        .on('mousemove', event => {
          if (!attack) return;
          placeMapTooltip(event);
        })
        .on('mouseleave', () => {
          if (!attack) return;
          hideMapTooltip();
        });
    });

  const routeMeta = [];

  valid.forEach((country, index) => {
    const origin = mapProjection([country.lon, country.lat]);
    if (!origin) return;

    const [x, y] = origin;
    const [sx, sy] = mapSpainXY;
    const dx = sx - x;
    const dy = sy - y;
    const distance = Math.hypot(dx, dy);
    const invDistance = distance > 0 ? 1 / distance : 0;
    const nx = -dy * invDistance;
    const curve = clamp(distance * 0.46, 58, 220);
    const cx = x + dx * 0.5 + nx * curve * 0.62;
    const cy = y + dy * 0.5 - curve * 1.08;
    const baseWidth = lineWidth(country.count);
    const shadowCx = cx + nx * curve * 0.16;
    const shadowCy = cy + clamp(curve * 0.34, 16, 44);
    const level = country.count >= maxCount * 0.66 ? 'high' : (country.count >= maxCount * 0.33 ? 'mid' : 'low');
    const tooltip = buildAttackTooltip(country, levelText, statusText, maxCount, false, index + 1);
    const routePath = `M${x},${y} Q${cx},${cy} ${sx},${sy}`;

    routesLayer.append('path')
      .attr('class', `map-route-shadow route-${level}`)
      .attr('d', `M${x},${y} Q${shadowCx},${shadowCy} ${sx},${sy}`)
      .attr('stroke-width', baseWidth * 2.15)
      .attr('filter', 'url(#routeShadowBlur)');

    const cablePath = routesLayer.append('path')
      .attr('class', `map-route route-${level}`)
      .attr('d', routePath)
      .attr('stroke-width', baseWidth)
      .on('mouseenter', event => showMapTooltip(event, tooltip))
      .on('mousemove', event => placeMapTooltip(event))
      .on('mouseleave', hideMapTooltip);

    routeMeta.push({
      routePath,
      routeLength: cablePath.node()?.getTotalLength() || 1,
      baseWidth,
      level,
      count: country.count,
    });

    originsLayer.append('circle')
      .attr('class', `map-origin origin-${level}`)
      .attr('cx', x)
      .attr('cy', y)
      .attr('r', nodeRadius(country.count))
      .on('mouseenter', event => showMapTooltip(event, tooltip))
      .on('mousemove', event => placeMapTooltip(event))
      .on('mouseleave', hideMapTooltip);
  });

  const burstCount = clamp(Math.round(Number(liveAttackBurst) || 0), 0, 36);
  if (burstCount > 0 && routeMeta.length > 0) {
    const totalWeight = routeMeta.reduce((sum, route) => sum + route.count, 0) || 1;
    for (let i = 0; i < burstCount; i += 1) {
      const pick = pickWeightedRoute(routeMeta, totalWeight);
      if (!pick) continue;

      const pulseLength = clamp(pick.routeLength * 0.11, 18, 70);
      const pulseTrace = routesLayer.append('path')
        .attr('class', `map-route-pulse-trace pulse-${pick.level}`)
        .attr('d', pick.routePath)
        .attr('stroke-width', clamp(pick.baseWidth * 0.65, 0.95, 2.2))
        .attr('stroke-dasharray', `${pulseLength} ${Math.max(pick.routeLength - pulseLength, 1)}`)
        .attr('stroke-dashoffset', pick.routeLength)
        .attr('opacity', 0);

      pulseTrace.append('animate')
        .attr('attributeName', 'opacity')
        .attr('values', '0;1;0')
        .attr('dur', '0.22s')
        .attr('begin', `${(i * 0.03).toFixed(3)}s`)
        .attr('repeatCount', '1');

      pulseTrace.append('animate')
        .attr('attributeName', 'stroke-dashoffset')
        .attr('values', `${pick.routeLength};0`)
        .attr('dur', `${clamp(0.18 - (pick.count / maxCount) * 0.08, 0.08, 0.18)}s`)
        .attr('begin', `${(i * 0.03).toFixed(3)}s`)
        .attr('repeatCount', '1');
    }
  }
}

function updateWorldGlobe(countries, liveAttackBurst = 0) {
  if (!mapReady || !globeInstance) {
    mapPendingCountries = countries;
    mapPendingBurst = liveAttackBurst;
    return;
  }

  const valid = (Array.isArray(countries) ? countries : [])
    .map(country => normalizeCountry(country))
    .filter(country => Number.isFinite(country.lon) && Number.isFinite(country.lat) && country.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 40);

  const maxCount = Math.max(...valid.map(country => country.count), 1);
  globeMaxAttackCount = maxCount;
  const levelText = { high: 'Alta actividad', mid: 'Actividad media', low: 'Actividad baja' };
  const statusText = {
    high: 'Origen con actividad especialmente intensa en la ventana actual.',
    mid: 'Origen activo con volumen sostenido.',
    low: 'Origen detectado con actividad baja pero reciente.',
  };

  globeAttacksByCountryKey = new Map();
  valid.forEach(country => {
    globeAttacksByCountryKey.set(canonicalCountryKey(country.country), country);
  });

  if (globeCountryFeatures.length) {
    globeInstance
      .polygonsData(globeCountryFeatures)
      .polygonCapColor(feature => {
        const attack = findAttackForFeature(feature, globeAttacksByCountryKey);
        if (!attack) return 'rgba(44, 78, 128, 0.52)';
        const level = attack.count >= maxCount * 0.66 ? 'high' : (attack.count >= maxCount * 0.33 ? 'mid' : 'low');
        if (level === 'high') return 'rgba(139, 22, 22, 0.88)';
        if (level === 'mid') return 'rgba(126, 34, 34, 0.82)';
        return 'rgba(112, 43, 43, 0.76)';
      })
      .polygonSideColor(feature => {
        const attack = findAttackForFeature(feature, globeAttacksByCountryKey);
        return attack ? 'rgba(114, 24, 24, 0.42)' : 'rgba(31, 58, 98, 0.28)';
      })
      .polygonStrokeColor(feature => {
        const attack = findAttackForFeature(feature, globeAttacksByCountryKey);
        return attack ? 'rgba(252, 165, 165, 0.55)' : 'rgba(112, 162, 241, 0.35)';
      })
      .polygonAltitude(feature => {
        const attack = findAttackForFeature(feature, globeAttacksByCountryKey);
        return attack ? 0.011 : 0.004;
      });
  }

  const routeWidth = count => 0.18 + Math.sqrt(count / maxCount) * 0.38;
  globeStaticRoutes = valid.map((country, index) => ({
    mode: 'base',
    country: country.country,
    count: country.count,
    startLat: country.lat,
    startLng: country.lon,
    endLat: MAP_SPAIN.lat,
    endLng: MAP_SPAIN.lon,
    color: 'rgba(220, 42, 42, 0.95)',
    width: clamp(routeWidth(country.count), 0.18, 0.62),
    altitude: computeGlobeRouteAltitude(country.lon, country.lat, MAP_SPAIN.lon, MAP_SPAIN.lat, country.count, maxCount),
    pulseOffset: valid.length > 0 ? (index / valid.length) : 0,
    label: `<b>${escapeHtml(country.country)}</b><br/>Intentos: ${country.count}`,
    tooltipHtml: buildAttackTooltip(country, levelText, statusText, maxCount, false, index + 1),
  }));

  globeBasePoints = [];
  globeInstance.pointsData([]);
  applyGlobeArcs([]);
  emitGlobeSpainHeartbeat();

  if (globeLivePulseTimer) clearTimeout(globeLivePulseTimer);
  globeLivePulseTimer = null;

  const burstCount = clamp(Math.round(Number(liveAttackBurst) || 0), 0, 18);
  if (burstCount > 0 && globeStaticRoutes.length > 0) {
    const totalWeight = globeStaticRoutes.reduce((sum, route) => sum + (route.count || 0), 0) || 1;
    const liveRoutes = [];
    for (let i = 0; i < burstCount; i += 1) {
      const pick = pickWeightedRoute(globeStaticRoutes, totalWeight);
      if (!pick) continue;

      const headOffset = (i / Math.max(burstCount, 1)) % 1;
      const trail1Offset = ((headOffset - 0.022) % 1 + 1) % 1;
      const trail2Offset = ((headOffset - 0.046) % 1 + 1) % 1;

      liveRoutes.push(
        {
          ...pick,
          mode: 'live-burst-head',
          color: 'rgba(255, 255, 200, 1)',
          width: clamp(pick.width * 0.55, 0.14, 0.34),
          altitude: clamp((pick.altitude ?? 0.12) + 0.016, 0.08, 0.34),
          pulseOffset: headOffset,
          dashLength: 0.06,
          dashGap: 0.94,
        },
        {
          ...pick,
          mode: 'live-burst-trail-1',
          color: 'rgba(255, 160, 80, 0.85)',
          width: clamp(pick.width * 0.42, 0.11, 0.28),
          altitude: clamp((pick.altitude ?? 0.12) + 0.014, 0.08, 0.34),
          pulseOffset: trail1Offset,
          dashLength: 0.1,
          dashGap: 0.9,
        },
        {
          ...pick,
          mode: 'live-burst-trail-2',
          color: 'rgba(255, 80, 80, 0.45)',
          width: clamp(pick.width * 0.32, 0.09, 0.22),
          altitude: clamp((pick.altitude ?? 0.12) + 0.012, 0.08, 0.34),
          pulseOffset: trail2Offset,
          dashLength: 0.14,
          dashGap: 0.86,
        }
      );
    }

    applyGlobeArcs(liveRoutes);
    globeLivePulseTimer = setTimeout(() => {
      applyGlobeArcs([]);
      globeLivePulseTimer = null;
    }, 1400);
  }
}

function applyGlobeArcs(liveRoutes) {
  if (!globeInstance) return;
  const baseRoutes = [...globeStaticRoutes].sort((a, b) => (b.count || 0) - (a.count || 0));
  const pulseRoutes = baseRoutes.flatMap(route => {
    const baseOffset = Number(route.pulseOffset ?? 0);
    return [
      {
        ...route,
        mode: 'pulse',
        color: 'rgba(255, 186, 186, 0.78)',
        width: clamp(route.width * 0.24, 0.038, 0.098),
        altitude: clamp((route.altitude ?? 0.12) + 0.01, 0.08, 0.34),
        pulseOffset: baseOffset,
      },
      {
        ...route,
        mode: 'pulse',
        color: 'rgba(255, 168, 168, 0.5)',
        width: clamp(route.width * 0.2, 0.032, 0.082),
        altitude: clamp((route.altitude ?? 0.12) + 0.012, 0.08, 0.34),
        pulseOffset: (baseOffset + 0.48) % 1,
      },
    ];
  });
  const burstRoutes = Array.isArray(liveRoutes) ? liveRoutes : [];
  const allRoutes = [...baseRoutes, ...pulseRoutes, ...burstRoutes];

  globeInstance
    .arcsData(allRoutes)
    .arcAltitude(route => route.altitude ?? 0.12)
    .arcDashAnimateTime(route => route.mode === 'pulse' ? 5200 : (route.mode === 'live-burst' ? 650 : 0));
}

function computeGlobeRouteAltitude(startLon, startLat, endLon, endLat, count, maxCount) {
  const toRad = value => (Number(value) || 0) * (Math.PI / 180);
  const dLat = toRad(endLat - startLat);
  const dLon = toRad(endLon - startLon);
  const lat1 = toRad(startLat);
  const lat2 = toRad(endLat);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const earthKm = 6371;
  const distanceKm = earthKm * c;
  const distanceFactor = clamp(distanceKm / 12000, 0.22, 1);
  const intensityFactor = clamp(Math.sqrt((Number(count) || 1) / Math.max(maxCount, 1)), 0.32, 1);
  return clamp(0.055 + distanceFactor * 0.17 + intensityFactor * 0.06, 0.07, 0.29);
}

function syncGlobePointScale() {
  if (!globeInstance) return;
  const base = Array.isArray(globeBasePoints) ? globeBasePoints : [];
  const altitude = clamp(Number(globeLastAltitude) || 1.9, 0.46, 3.8);
  const scale = clamp(Math.sqrt(altitude / 1.55), 0.66, 1.72);
  const points = base.map(point => ({
    ...point,
    radius: clamp((point.baseRadius || 0.4) * scale, 0.2, 1.8),
  }));
  globeInstance.pointsData(points);
}

function emitGlobeSpainHeartbeat() {
  if (!globeInstance) return;

  globeInstance.ringsData([
    {
      lat: MAP_SPAIN.lat,
      lon: MAP_SPAIN.lon,
      color: () => 'rgba(248, 113, 113, 0.32)',
      maxR: 4.6,
      propagationSpeed: 1.2,
      repeatPeriod: 1900,
    },
  ])
    .ringColor(ring => ring.color)
    .ringMaxRadius(ring => ring.maxR)
    .ringPropagationSpeed(ring => ring.propagationSpeed)
    .ringRepeatPeriod(ring => ring.repeatPeriod);
}

function pickWeightedRoute(routes, totalWeight) {
  if (!routes.length) return null;
  let threshold = Math.random() * totalWeight;
  for (const route of routes) {
    threshold -= route.count;
    if (threshold <= 0) return route;
  }
  return routes[routes.length - 1];
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

  const beatA = destinationLayer.append('circle')
    .attr('class', 'map-spain-beat beat-a')
    .attr('cx', mapSpainXY[0])
    .attr('cy', mapSpainXY[1])
    .attr('r', 8)
    .attr('opacity', 0);
  beatA.append('animate')
    .attr('attributeName', 'r')
    .attr('values', '8;26')
    .attr('dur', '3.8s')
    .attr('repeatCount', 'indefinite');
  beatA.append('animate')
    .attr('attributeName', 'opacity')
    .attr('values', '0.48;0')
    .attr('dur', '3.8s')
    .attr('repeatCount', 'indefinite');

  const beatB = destinationLayer.append('circle')
    .attr('class', 'map-spain-beat beat-b')
    .attr('cx', mapSpainXY[0])
    .attr('cy', mapSpainXY[1])
    .attr('r', 8)
    .attr('opacity', 0);
  beatB.append('animate')
    .attr('attributeName', 'r')
    .attr('values', '8;26')
    .attr('dur', '3.8s')
    .attr('begin', '1.9s')
    .attr('repeatCount', 'indefinite');
  beatB.append('animate')
    .attr('attributeName', 'opacity')
    .attr('values', '0.38;0')
    .attr('dur', '3.8s')
    .attr('begin', '1.9s')
    .attr('repeatCount', 'indefinite');

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

  zoomIn.addEventListener('click', mapZoomIn);

  zoomOut.addEventListener('click', mapZoomOut);

  center.addEventListener('click', zoomToSpain);
  global.addEventListener('click', zoomToGlobal);
}

function mapZoomIn() {
  if (mapMode === 'globe' && globeInstance) {
    const current = globeInstance.pointOfView();
    const altitude = clamp((current.altitude ?? 1.8) * 0.82, 0.46, 3.8);
    globeInstance.pointOfView({ ...current, altitude }, 220);
    return;
  }

  if (mapSvg && mapZoom) mapSvg.transition().duration(180).call(mapZoom.scaleBy, 1.25);
}

function mapZoomOut() {
  if (mapMode === 'globe' && globeInstance) {
    const current = globeInstance.pointOfView();
    const altitude = clamp((current.altitude ?? 1.8) * 1.24, 0.46, 3.8);
    globeInstance.pointOfView({ ...current, altitude }, 220);
    return;
  }

  if (mapSvg && mapZoom) mapSvg.transition().duration(180).call(mapZoom.scaleBy, 0.8);
}

function zoomToGlobal() {
  if (mapMode === 'globe' && globeInstance) {
    globeInstance.pointOfView({ lat: 18, lng: 0, altitude: 1.9 }, 620);
    return;
  }

  if (mapSvg && mapZoom) {
    mapSvg.transition().duration(250).call(mapZoom.transform, d3.zoomIdentity);
  }
}

function zoomToSpain() {
  if (mapMode === 'globe' && globeInstance) {
    globeInstance.pointOfView({ lat: MAP_SPAIN.lat, lng: MAP_SPAIN.lon, altitude: 0.92 }, 720);
    return;
  }

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
    iso: String(country?.iso ?? country?.country_iso ?? '').toUpperCase(),
    count: Number(country?.count ?? country?.value ?? country?.attacks ?? 0),
    lon: toNumber(country?.lon ?? country?.lng ?? country?.longitude),
    lat: toNumber(country?.lat ?? country?.latitude),
  };
}

function buildAttackTooltip(country, levelText, statusText, maxCount, fromCountryArea, rank) {
  const level = country.count >= maxCount * 0.66 ? 'high' : (country.count >= maxCount * 0.33 ? 'mid' : 'low');
  const areaNote = fromCountryArea
    ? '<div class="map-tip-row"><span>Zona</span><strong>Territorio del país</strong></div>'
    : '';
  const rankNote = rank
    ? `<div class="map-tip-row"><span>Ranking</span><strong>#${rank}</strong></div>`
    : '';
  return [
    `<div class="map-tip-title">${escapeHtml(country.country)}</div>`,
    '<div class="map-tip-row"><span>Estado</span><strong class="tip-accent">País atacante</strong></div>',
    `<div class="map-tip-row"><span>Intentos</span><strong>${country.count}</strong></div>`,
    `<div class="map-tip-row"><span>Nivel</span><strong>${levelText[level]}</strong></div>`,
    areaNote,
    rankNote,
    `<div class="map-tip-note">${statusText[level]}</div>`,
  ].join('');
}

function findAttackForFeature(feature, attacksByCountryKey) {
  const candidates = [];
  const name = feature?.properties?.name;
  if (name) {
    candidates.push(canonicalCountryKey(name));
  }

  for (const key of candidates) {
    if (attacksByCountryKey.has(key)) return attacksByCountryKey.get(key);
  }

  return null;
}

function canonicalCountryKey(value) {
  const key = String(value ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
  return COUNTRY_KEY_ALIASES[key] || key;
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
