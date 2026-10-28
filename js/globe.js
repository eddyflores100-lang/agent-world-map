/* Agent World Map — Globe Engine
 *
 * Technical agent locator with geographic positioning based on:
 * 1. Namespace TLD analysis (ae.* → UAE, cn.* → China, etc.)
 * 2. Repository URL domain analysis (github.com → distributed, gitlab.* → EU)
 * 3. Deterministic hash-based jitter within each region
 *
 * Agent classification (kind):
 *   firewall  — security/protection agents (uta-shield, etc.)
 *   payment   — x402 wallets, payment infrastructure
 *   compute   — GPU providers, inference engines
 *   directory — registries, catalogs, indexes
 *   publisher — MCP servers that publish tools
 *   bridge    — A2A gateways, protocol bridges
 *   observer  — threat-intel, audit, monitoring
 *   consumer  — agents that consume MCP servers (passive)
 *
 * Position: lat/lon → 3D sphere point
 * Color: by kind
 * Size: by version_count (log scale) + x402/barter boost
 * Brightness: x402/barter agents glow brighter
 */

// ─── Region database ──────────────────────────────────────────────────────────
// Maps namespace TLD prefixes to geographic centers with spread radius.
// The spread creates a "cluster" around each region center — agents from the
// same region appear near each other but not perfectly stacked.

const REGIONS = {
  // North America
  'us':    { lat: 39.8,  lon: -98.5,  spread: 15, label: 'United States' },
  'us-ec': { lat: 40.7,  lon: -74.0,  spread: 5,  label: 'US East Coast' },
  'us-wc': { lat: 37.4,  lon: -122.1, spread: 5,  label: 'US West Coast' },
  'ca':    { lat: 56.1,  lon: -106.3, spread: 10, label: 'Canada' },
  'mx':    { lat: 23.6,  lon: -102.5, spread: 8,  label: 'Mexico' },
  // South America
  'br':    { lat: -14.2, lon: -51.9,  spread: 12, label: 'Brazil' },
  'ar':    { lat: -38.4, lon: -63.6,  spread: 8,  label: 'Argentina' },
  'cl':    { lat: -35.6, lon: -71.5,  spread: 6,  label: 'Chile' },
  // Europe
  'eu':    { lat: 50.1,  lon: 10.2,   spread: 12, label: 'Europe (Central)' },
  'uk':    { lat: 55.3,  lon: -3.4,   spread: 5,  label: 'United Kingdom' },
  'de':    { lat: 51.2,  lon: 10.4,   spread: 5,  label: 'Germany' },
  'fr':    { lat: 46.2,  lon: 2.2,    spread: 5,  label: 'France' },
  'nl':    { lat: 52.1,  lon: 5.3,    spread: 3,  label: 'Netherlands' },
  'ch':    { lat: 46.8,  lon: 8.2,    spread: 3,  label: 'Switzerland' },
  'es':    { lat: 40.5,  lon: -3.7,   spread: 5,  label: 'Spain' },
  'it':    { lat: 41.9,  lon: 12.6,   spread: 5,  label: 'Italy' },
  'se':    { lat: 60.1,  lon: 18.6,   spread: 4,  label: 'Sweden' },
  'pl':    { lat: 51.9,  lon: 19.1,   spread: 4,  label: 'Poland' },
  'be':    { lat: 50.6,  lon: 4.7,    spread: 2,  label: 'Belgium' },
  // Middle East & Africa
  'ae':    { lat: 24.0,  lon: 54.0,   spread: 3,  label: 'UAE' },
  'il':    { lat: 31.5,  lon: 34.8,   spread: 2,  label: 'Israel' },
  'sa':    { lat: 23.9,  lon: 45.1,   spread: 5,  label: 'Saudi Arabia' },
  'za':    { lat: -29.0, lon: 24.0,   spread: 5,  label: 'South Africa' },
  'ng':    { lat: 9.1,   lon: 8.7,    spread: 4,  label: 'Nigeria' },
  // Asia
  'cn':    { lat: 35.0,  lon: 105.0,  spread: 10, label: 'China' },
  'in':    { lat: 20.6,  lon: 78.9,   spread: 10, label: 'India' },
  'jp':    { lat: 36.0,  lon: 138.0,  spread: 4,  label: 'Japan' },
  'kr':    { lat: 36.5,  lon: 127.8,  spread: 3,  label: 'Korea' },
  'sg':    { lat: 1.35,  lon: 103.8,  spread: 1.5,label: 'Singapore' },
  'hk':    { lat: 22.3,  lon: 114.2,  spread: 1,  label: 'Hong Kong' },
  'tw':    { lat: 23.7,  lon: 121.0,  spread: 2,  label: 'Taiwan' },
  'th':    { lat: 15.9,  lon: 100.9,  spread: 4,  label: 'Thailand' },
  'vn':    { lat: 14.1,  lon: 108.3,  spread: 4,  label: 'Vietnam' },
  'id':    { lat: -2.5,  lon: 118.0,  spread: 6,  label: 'Indonesia' },
  // Oceania
  'au':    { lat: -25.0, lon: 133.0,  spread: 10, label: 'Australia' },
  'nz':    { lat: -42.0, lon: 172.0,  spread: 4,  label: 'New Zealand' },
  // Default
  'global':{ lat: 0,     lon: 0,      spread: 50, label: 'Global / Unknown' },
};

// TLD → region mapping (checks namespace prefix)
function regionForNamespace(ns) {
  const lower = ns.toLowerCase();
  // Direct TLD matches
  for (const [tld, regionId] of [
    ['ae.', 'ae'], ['il.', 'il'], ['sa.', 'sa'], ['za.', 'za'], ['ng.', 'ng'],
    ['cn.', 'cn'], ['in.', 'in'], ['jp.', 'jp'], ['kr.', 'kr'], ['sg.', 'sg'],
    ['hk.', 'hk'], ['tw.', 'tw'], ['th.', 'th'], ['vn.', 'vn'], ['id.', 'id'],
    ['au.', 'au'], ['nz.', 'nz'], ['br.', 'br'], ['ar.', 'ar'], ['cl.', 'cl'],
    ['ca.', 'ca'], ['mx.', 'mx'], ['uk.', 'uk'], ['de.', 'de'], ['fr.', 'fr'],
    ['nl.', 'nl'], ['ch.', 'ch'], ['es.', 'es'], ['it.', 'it'], ['se.', 'se'],
    ['pl.', 'pl'], ['be.', 'be'], ['eu.', 'eu'],
  ]) {
    if (lower.startsWith(tld)) return regionId;
  }
  // Common TLDs that map to US
  for (const tld of ['com.', 'biz.', 'ai.', 'app.', 'dev.', 'cloud.', 'io.', 'co.', 'cc.', 'fit.', 'fitness.', 'ad.', 'ac.', 'shop.', 'store.', 'art.', 'studio.', 'tech.', 'net.', 'org.']) {
    if (lower.startsWith(tld)) return 'us';
  }
  // GitHub users — distribute globally (GitHub is global)
  if (lower.startsWith('io.github.')) {
    const user = lower.slice('io.github.'.length).split('/')[0];
    const regions = ['us-ec', 'us-wc', 'eu', 'uk', 'de', 'cn', 'in', 'jp', 'br', 'au', 'sg', 'kr'];
    return regions[hashString(user) % regions.length];
  }
  return 'global';
}

// Deterministic hash for stable positioning
function hashString(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// Lat/lon → 3D position on sphere
function latLonToVec3(lat, lon, radius) {
  const phi = (90 - lat) * Math.PI / 180;
  const theta = (lon + 180) * Math.PI / 180;
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
     radius * Math.cos(phi),
     radius * Math.sin(phi) * Math.sin(theta)
  );
}

// Agent classification
function classifyAgent(name, description, ns) {
  const text = `${name} ${description} ${ns}`.toLowerCase();
  // Priority order: most specific first
  if (/firewall|shield|guard|protect|waf/.test(text)) return 'firewall';
  if (/x402|payment|wallet|usdc|billing|invoice|stripe|paypal/.test(text)) return 'payment';
  if (/compute|gpu|inference|render|train|model.*serv|vllm|ollama/.test(text)) return 'compute';
  if (/registry|directory|catalog|index|search.*server|discover/.test(text)) return 'directory';
  if (/threat|audit|monitor|ioc|security.*scan|phish|malware/.test(text)) return 'observer';
  if (/bridge|gateway|proxy|a2a|connector|relay/.test(text)) return 'bridge';
  // Default: most agents publish tools
  return 'publisher';
}

const KIND_COLORS = {
  firewall:  0xff6b35,
  payment:   0x00d4ff,
  compute:   0xa78bfa,
  directory: 0xfbbf24,
  publisher: 0x22c55e,
  bridge:    0xec4899,
  observer:  0xf43f5e,
  consumer:  0x94a3b8,
};

const KIND_LABELS = {
  firewall:  'Firewall / Protection',
  payment:   'Payment / x402',
  compute:   'Compute / GPU',
  directory: 'Directory / Registry',
  publisher: 'Publisher / MCP Server',
  bridge:    'Bridge / Gateway',
  observer:  'Observer / Threat-Intel',
  consumer:  'Consumer',
};

// ─── Globe scene ──────────────────────────────────────────────────────────────
let scene, camera, renderer, globe, pointsObj, raycaster, mouse;
let agents = [];
let filteredAgents = [];
let activeFilter = 'all';
let hoveredIdx = -1;

const GLOBE_RADIUS = 100;
const POINTS_RADIUS = GLOBE_RADIUS * 1.008;

function initGlobe() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x050810);
  scene.fog = new THREE.Fog(0x050810, 200, 600);

  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 2000);
  camera.position.set(0, 60, 280);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  document.getElementById('globe-canvas').appendChild(renderer.domElement);

  raycaster = new THREE.Raycaster();
  raycaster.params.Points.threshold = 1.5;
  mouse = new THREE.Vector2();

  // Lighting
  scene.add(new THREE.AmbientLight(0x404060, 0.5));
  const dir = new THREE.DirectionalLight(0xffffff, 0.6);
  dir.position.set(150, 100, 200);
  scene.add(dir);

  addStars();
  addGlobeSphere();
  addLatLonGrid();
}

function addStars() {
  const geo = new THREE.BufferGeometry();
  const N = 5000;
  const pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const r = 500 + Math.random() * 800;
    const phi = Math.random() * Math.PI * 2;
    const theta = Math.acos(2 * Math.random() - 1);
    pos[i*3] = r * Math.sin(theta) * Math.cos(phi);
    pos[i*3+1] = r * Math.sin(theta) * Math.sin(phi);
    pos[i*3+2] = r * Math.cos(theta);
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  scene.add(new THREE.Points(geo, new THREE.PointsMaterial({
    color: 0xffffff, size: 0.8, transparent: true, opacity: 0.6,
    sizeAttenuation: true, depthWrite: false,
  })));
}

function addGlobeSphere() {
  // Inner solid sphere (dark blue, like deep ocean)
  const innerGeo = new THREE.SphereGeometry(GLOBE_RADIUS * 0.97, 48, 48);
  scene.add(new THREE.Mesh(innerGeo, new THREE.MeshPhongMaterial({
    color: 0x0a1520, transparent: true, opacity: 0.9, shininess: 8,
  })));

  // Wireframe outer sphere (lat/lon grid lines visible)
  const wireGeo = new THREE.SphereGeometry(GLOBE_RADIUS, 64, 64);
  globe = new THREE.Mesh(wireGeo, new THREE.MeshBasicMaterial({
    color: 0x1a2a3a, wireframe: true, transparent: true, opacity: 0.35,
  }));
  scene.add(globe);
}

function addLatLonGrid() {
  const mat = new THREE.LineBasicMaterial({ color: 0x2a3a4a, transparent: true, opacity: 0.2 });
  // Parallels (latitude lines)
  for (let lat = -75; lat <= 75; lat += 15) {
    const pts = [];
    for (let lon = -180; lon <= 180; lon += 3) {
      pts.push(latLonToVec3(lat, lon, GLOBE_RADIUS * 1.002));
    }
    scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), mat));
  }
  // Meridians (longitude lines)
  for (let lon = -180; lon < 180; lon += 15) {
    const pts = [];
    for (let lat = -88; lat <= 88; lat += 3) {
      pts.push(latLonToVec3(lat, lon, GLOBE_RADIUS * 1.002));
    }
    scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), mat));
  }
  // Equator (brighter)
  const eqPts = [];
  for (let lon = -180; lon <= 180; lon += 2) {
    eqPts.push(latLonToVec3(0, lon, GLOBE_RADIUS * 1.003));
  }
  scene.add(new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(eqPts),
    new THREE.LineBasicMaterial({ color: 0x3a5a7a, transparent: true, opacity: 0.4 })
  ));
}

// ─── Data loading ─────────────────────────────────────────────────────────────
function loadAgents() {
  fetch('data/agents.json')
    .then(r => r.json())
    .then(data => {
      agents = (data.agents || []).map(a => {
        const kind = classifyAgent(a.name, a.description, a.namespace);
        const regionId = regionForNamespace(a.namespace);
        const region = REGIONS[regionId] || REGIONS['global'];
        const h1 = hashString(a.name);
        const h2 = hashString(a.name + a.namespace);
        const lat = region.lat + ((h1 % 10000) / 10000 - 0.5) * region.spread * 2;
        const lon = region.lon + ((h2 % 10000) / 10000 - 0.5) * region.spread * 2;
        return {
          ...a,
          kind,
          region: regionId,
          regionLabel: region.label,
          lat, lon,
          position: latLonToVec3(lat, lon, POINTS_RADIUS),
        };
      });

      // Stats
      const total = agents.length;
      const x402 = agents.filter(a => a.x402).length;
      const barter = agents.filter(a => a.barter).length;
      const cards = agents.filter(a => a.agent_card).length;
      const regions = new Set(agents.map(a => a.region));

      document.getElementById('stat-total').textContent = total.toLocaleString();
      document.getElementById('stat-x402').textContent = x402;
      document.getElementById('stat-barter').textContent = barter;
      document.getElementById('stat-cards').textContent = cards;
      document.getElementById('stat-regions').textContent = regions.size;

      // Update filter counts
      const kinds = ['firewall','payment','compute','directory','publisher','bridge','observer'];
      kinds.forEach(k => {
        const count = agents.filter(a => a.kind === k).length;
        const el = document.querySelector(`[data-filter="${k}"] .count`);
        if (el) el.textContent = count;
      });
      document.querySelector('[data-filter="x402"] .count').textContent = x402;
      document.querySelector('[data-filter="barter"] .count').textContent = barter;

      // Footer
      document.getElementById('footer-text').textContent =
        `${total} agents · ${data.total_versions} versions · ${regions.size} regions · ${data.scan_time} · registry.modelcontextprotocol.io`;

      // Hide loader
      document.getElementById('loader').classList.add('hidden');

      applyFilter('all');
    })
    .catch(err => {
      document.getElementById('loader-detail').textContent = 'Error: ' + err.message;
    });
}

// ─── Filtering ────────────────────────────────────────────────────────────────
function applyFilter(filter) {
  activeFilter = filter;
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filter === filter);
  });

  const search = document.getElementById('search').value.toLowerCase();

  if (filter === 'all') {
    filteredAgents = agents;
  } else if (filter === 'x402') {
    filteredAgents = agents.filter(a => a.x402);
  } else if (filter === 'barter') {
    filteredAgents = agents.filter(a => a.barter);
  } else {
    filteredAgents = agents.filter(a => a.kind === filter);
  }

  // Apply search
  if (search) {
    filteredAgents = filteredAgents.filter(a =>
      a.name.toLowerCase().includes(search) ||
      a.description.toLowerCase().includes(search) ||
      a.namespace.toLowerCase().includes(search)
    );
  }

  renderPoints();
  document.getElementById('stat-total').textContent = filteredAgents.length.toLocaleString();
}

// ─── Point rendering ──────────────────────────────────────────────────────────
function createPointTexture() {
  const c = document.createElement('canvas');
  c.width = 64; c.height = 64;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.3, 'rgba(255,255,255,0.8)');
  g.addColorStop(0.6, 'rgba(255,255,255,0.2)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

function renderPoints() {
  if (pointsObj) {
    scene.remove(pointsObj);
    pointsObj.geometry.dispose();
    pointsObj.material.dispose();
  }
  if (filteredAgents.length === 0) return;

  const N = filteredAgents.length;
  const positions = new Float32Array(N * 3);
  const colors = new Float32Array(N * 3);

  for (let i = 0; i < N; i++) {
    const a = filteredAgents[i];
    positions[i*3] = a.position.x;
    positions[i*3+1] = a.position.y;
    positions[i*3+2] = a.position.z;

    const color = new THREE.Color(KIND_COLORS[a.kind] || 0xffffff);
    // Boost brightness for x402/barter agents
    if (a.x402) color.multiplyScalar(1.8);
    if (a.barter) color.multiplyScalar(2.0);
    colors[i*3] = Math.min(color.r, 1);
    colors[i*3+1] = Math.min(color.g, 1);
    colors[i*3+2] = Math.min(color.b, 1);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const mat = new THREE.PointsMaterial({
    size: 1.8,
    sizeAttenuation: true,
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
    map: createPointTexture(),
    alphaTest: 0.01,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  pointsObj = new THREE.Points(geo, mat);
  pointsObj.userData.agents = filteredAgents;
  scene.add(pointsObj);
}

// ─── Interaction ─────────────────────────────────────────────────────────────
let isDragging = false;
let prevX = 0, prevY = 0;
let rotY = 0, rotX = 0;
let velY = 0.0006, velX = 0;
let camDist = 280;
let mouseScreenX = 0, mouseScreenY = 0;

function onPointerDown(e) {
  isDragging = true;
  prevX = e.clientX;
  prevY = e.clientY;
}
function onPointerMove(e) {
  mouseScreenX = e.clientX;
  mouseScreenY = e.clientY;
  if (isDragging) {
    const dx = e.clientX - prevX;
    const dy = e.clientY - prevY;
    velY = dx * 0.006;
    velX = dy * 0.006;
    rotY += velY;
    rotX += velX;
    rotX = Math.max(-Math.PI/2.1, Math.min(Math.PI/2.1, rotX));
    prevX = e.clientX;
    prevY = e.clientY;
  } else {
    // Hover detection
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    checkHover();
  }
}
function onPointerUp() { isDragging = false; }
function onWheel(e) {
  camDist *= 1 + (e.deltaY > 0 ? 0.08 : -0.08);
  camDist = Math.max(130, Math.min(500, camDist));
  e.preventDefault();
}

function checkHover() {
  if (!pointsObj) return;
  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObject(pointsObj);
  const tooltip = document.getElementById('tooltip');
  if (hits.length > 0) {
    hoveredIdx = hits[0].index;
    const a = filteredAgents[hoveredIdx];
    tooltip.innerHTML = `<div class="t-name">${a.name}</div><div class="t-meta">${a.regionLabel} · v${a.version} · ${a.kind}${a.x402 ? ' · x402' : ''}${a.barter ? ' · barter' : ''}</div>`;
    tooltip.style.left = (mouseScreenX + 14) + 'px';
    tooltip.style.top = (mouseScreenY + 14) + 'px';
    tooltip.classList.add('visible');
    document.body.style.cursor = 'pointer';
  } else {
    hoveredIdx = -1;
    tooltip.classList.remove('visible');
    document.body.style.cursor = 'default';
  }
}

function onClick() {
  if (hoveredIdx >= 0) {
    showAgentPanel(filteredAgents[hoveredIdx]);
  }
}

function showAgentPanel(a) {
  const kindColors = {
    firewall: '#ff6b35', payment: '#00d4ff', compute: '#a78bfa',
    directory: '#fbbf24', publisher: '#22c55e', bridge: '#ec4899',
    observer: '#f43f5e', consumer: '#94a3b8',
  };
  const color = kindColors[a.kind];

  const capabilities = [];
  if (a.x402) capabilities.push(`<span class="cap-tag" style="background:rgba(0,212,255,0.1);color:#00d4ff;border:1px solid rgba(0,212,255,0.3)">💰 x402 Payments</span>`);
  if (a.barter) capabilities.push(`<span class="cap-tag" style="background:rgba(255,107,53,0.1);color:#ff6b35;border:1px solid rgba(255,107,53,0.3)">🔁 Barter Accepted</span>`);
  if (a.agent_card) capabilities.push(`<span class="cap-tag" style="background:rgba(167,139,250,0.1);color:#a78bfa;border:1px solid rgba(167,139,250,0.3)">🪪 Agent Card</span>`);
  capabilities.push(`<span class="cap-tag" style="background:rgba(34,197,94,0.1);color:#22c55e;border:1px solid rgba(34,197,94,0.3)">● ${a.regionLabel}</span>`);

  const links = [];
  if (a.website) links.push(`<a class="link-item" href="${a.website}" target="_blank" rel="noopener">🌐 ${a.website}</a>`);
  if (a.repository) links.push(`<a class="link-item" href="${a.repository}" target="_blank" rel="noopener">📦 ${a.repository}</a>`);
  if (a.agent_card) links.push(`<a class="link-item" href="${a.agent_card}" target="_blank" rel="noopener">🪪 ${a.agent_card}</a>`);
  links.push(`<a class="link-item" href="https://registry.modelcontextprotocol.io/v0/servers?cursor=${encodeURIComponent(a.namespace)}&limit=20" target="_blank" rel="noopener">🔍 View in MCP Registry</a>`);

  document.getElementById('panel-content').innerHTML = `
    <div class="kind-badge" style="background:${color};color:#000">${KIND_LABELS[a.kind] || a.kind}</div>
    <div class="agent-title">${a.name}</div>
    <div class="agent-version">v${a.version} · ${a.versions.length} versions published</div>
    <div class="agent-desc">${a.description || '(no description available)'}</div>
    <div class="agent-capabilities">${capabilities.join('')}</div>
    ${a.wallet ? `<div class="wallet-box"><div class="label">x402 Wallet (USDC Receiver)</div><div class="value">${a.wallet}</div></div>` : ''}
    <div class="info-grid">
      <div class="info-card"><div class="label">First seen</div><div class="value">${a.first_seen}</div></div>
      <div class="info-card"><div class="label">Last seen</div><div class="value">${a.last_seen}</div></div>
      <div class="info-card"><div class="label">Region</div><div class="value">${a.regionLabel}</div></div>
      <div class="info-card"><div class="label">Coordinates</div><div class="value">${a.lat.toFixed(2)}°, ${a.lon.toFixed(2)}°</div></div>
      <div class="info-card"><div class="label">Namespace</div><div class="value">${a.namespace}</div></div>
      <div class="info-card"><div class="label">Protocol</div><div class="value">MCP${a.x402 ? ' + x402' : ''}${a.barter ? ' + Barter' : ''}</div></div>
    </div>
    <div class="link-list">${links.join('')}</div>
  `;
  document.getElementById('panel-right').classList.add('open');
}

function closePanel() {
  document.getElementById('panel-right').classList.remove('open');
}

// ─── Animation loop ──────────────────────────────────────────────────────────
function animate() {
  requestAnimationFrame(animate);
  if (!isDragging) {
    rotY += velY;
    rotX += velX;
    velY = velY * 0.96 + 0.0006;
    velX *= 0.96;
  }
  // Rotate everything together (globe + points + grid)
  scene.children.forEach(obj => {
    if (obj === pointsObj || obj === globe || obj instanceof THREE.Line || obj instanceof THREE.Points || obj instanceof THREE.Mesh) {
      obj.rotation.y = rotY;
      obj.rotation.x = rotX;
    }
  });
  camera.position.z = camDist;
  renderer.render(scene, camera);
}

// ─── Init ────────────────────────────────────────────────────────────────────
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

window.addEventListener('load', () => {
  initGlobe();
  animate();

  const canvas = document.getElementById('globe-canvas');
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointerleave', onPointerUp);
  canvas.addEventListener('wheel', onWheel, { passive: false });
  canvas.addEventListener('click', onClick);

  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => applyFilter(btn.dataset.filter));
  });

  document.getElementById('search').addEventListener('input', () => applyFilter(activeFilter));
  document.getElementById('panel-close').addEventListener('click', closePanel);
  document.getElementById('toggle-sidebar').addEventListener('click', () => {
    document.getElementById('sidebar-left').classList.toggle('collapsed');
  });

  loadAgents();
});
