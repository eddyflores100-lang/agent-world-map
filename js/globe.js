/* ─────────────────────────────────────────────────────────────────────────────
 *  Agent World Map — Globe Engine v2.0
 *
 *  Changes from v1:
 *  - Generic TLDs (com.*, ai.*, app.*, co.*) distributed GLOBALLY via hash,
 *    not clustered in US. Only country-specific TLDs (ae.*, cn.*, br.*) are
 *    pinned to their geographic region.
 *  - Continent outlines drawn on the globe for geographic reference.
 *  - Pause button + pause-on-hover (rotation stops when mouse is over globe).
 *  - Smooth zoom with momentum (Google Earth style).
 *  - Agent connection lines (x402 ↔ barter ↔ MCP stdio).
 *  - Skills/tools classification shown in panel.
 *  - Agent type analysis (publisher / consumer / both).
 * ──────────────────────────────────────────────────────────────────────────── */

// ─── Country-specific TLD → geographic region ────────────────────────────────
// Only country-specific TLDs are pinned. Generic TLDs get global distribution.
const COUNTRY_TLDS = {
  // North America
  'ca.':   { lat: 56,   lon: -106,  spread: 12, label: 'Canada' },
  'mx.':   { lat: 23.6, lon: -102,  spread: 8,  label: 'Mexico' },
  // South America
  'br.':   { lat: -14,  lon: -52,   spread: 12, label: 'Brazil' },
  'ar.':   { lat: -38,  lon: -64,   spread: 8,  label: 'Argentina' },
  'cl.':   { lat: -35,  lon: -71,   spread: 6,  label: 'Chile' },
  'co.':   { lat: 4.6,  lon: -74,   spread: 6,  label: 'Colombia' },
  'pe.':   { lat: -9,   lon: -75,   spread: 6,  label: 'Peru' },
  've.':   { lat: 6.4,  lon: -66,   spread: 6,  label: 'Venezuela' },
  // Europe
  'uk.':   { lat: 54,   lon: -2,    spread: 4,  label: 'United Kingdom' },
  'de.':   { lat: 51,   lon: 10,    spread: 5,  label: 'Germany' },
  'fr.':   { lat: 46,   lon: 2,     spread: 5,  label: 'France' },
  'nl.':   { lat: 52,   lon: 5,     spread: 3,  label: 'Netherlands' },
  'ch.':   { lat: 47,   lon: 8,     spread: 3,  label: 'Switzerland' },
  'es.':   { lat: 40,   lon: -3.7,  spread: 5,  label: 'Spain' },
  'it.':   { lat: 42,   lon: 12,    spread: 5,  label: 'Italy' },
  'se.':   { lat: 60,   lon: 18,    spread: 4,  label: 'Sweden' },
  'pl.':   { lat: 52,   lon: 19,    spread: 4,  label: 'Poland' },
  'be.':   { lat: 50.6, lon: 4.7,   spread: 2,  label: 'Belgium' },
  'pt.':   { lat: 39,   lon: -8,    spread: 3,  label: 'Portugal' },
  'at.':   { lat: 47,   lon: 14,    spread: 3,  label: 'Austria' },
  'ie.':   { lat: 53,   lon: -8,    spread: 3,  label: 'Ireland' },
  'no.':   { lat: 60,   lon: 8,     spread: 4,  label: 'Norway' },
  'fi.':   { lat: 61,   lon: 25,    spread: 4,  label: 'Finland' },
  'dk.':   { lat: 56,   lon: 9,     spread: 3,  label: 'Denmark' },
  'cz.':   { lat: 49,   lon: 15,    spread: 3,  label: 'Czech Republic' },
  'ru.':   { lat: 61,   lon: 90,    spread: 15, label: 'Russia' },
  'ua.':   { lat: 49,   lon: 32,    spread: 5,  label: 'Ukraine' },
  'tr.':   { lat: 39,   lon: 35,    spread: 6,  label: 'Turkey' },
  'gr.':   { lat: 39,   lon: 22,    spread: 3,  label: 'Greece' },
  // Middle East & Africa
  'ae.':   { lat: 24,   lon: 54,    spread: 3,  label: 'UAE' },
  'il.':   { lat: 31.5, lon: 34.8,  spread: 2,  label: 'Israel' },
  'sa.':   { lat: 24,   lon: 45,    spread: 5,  label: 'Saudi Arabia' },
  'eg.':   { lat: 27,   lon: 30,    spread: 5,  label: 'Egypt' },
  'za.':   { lat: -29,  lon: 24,    spread: 5,  label: 'South Africa' },
  'ng.':   { lat: 9,    lon: 8,     spread: 4,  label: 'Nigeria' },
  'ke.':   { lat: 0,    lon: 38,    spread: 4,  label: 'Kenya' },
  'ma.':   { lat: 31,   lon: -7,    spread: 4,  label: 'Morocco' },
  // Asia
  'cn.':   { lat: 35,   lon: 105,   spread: 12, label: 'China' },
  'in.':   { lat: 21,   lon: 79,    spread: 12, label: 'India' },
  'jp.':   { lat: 36,   lon: 138,   spread: 4,  label: 'Japan' },
  'kr.':   { lat: 36.5, lon: 128,   spread: 3,  label: 'Korea' },
  'sg.':   { lat: 1.3,  lon: 104,   spread: 1,  label: 'Singapore' },
  'hk.':   { lat: 22.3, lon: 114,   spread: 1,  label: 'Hong Kong' },
  'tw.':   { lat: 23.7, lon: 121,   spread: 2,  label: 'Taiwan' },
  'th.':   { lat: 15,   lon: 101,   spread: 5,  label: 'Thailand' },
  'vn.':   { lat: 14,   lon: 108,   spread: 5,  label: 'Vietnam' },
  'id.':   { lat: -2.5, lon: 118,   spread: 8,  label: 'Indonesia' },
  'my.':   { lat: 4,    lon: 102,   spread: 4,  label: 'Malaysia' },
  'ph.':   { lat: 13,   lon: 122,   spread: 5,  label: 'Philippines' },
  'pk.':   { lat: 30,   lon: 70,    spread: 8,  label: 'Pakistan' },
  'bd.':   { lat: 24,   lon: 90,    spread: 5,  label: 'Bangladesh' },
  // Oceania
  'au.':   { lat: -25,  lon: 133,   spread: 12, label: 'Australia' },
  'nz.':   { lat: -42,  lon: 172,   spread: 5,  label: 'New Zealand' },
};

// ─── Global distribution zones for generic TLDs ──────────────────────────────
// When the TLD is generic (com.*, ai.*, app.*, etc.), distribute across these
// tech-hub zones worldwide using a hash of the agent name.
const GLOBAL_ZONES = [
  { lat: 37.4,  lon: -122,  label: 'San Francisco, US' },     // Silicon Valley
  { lat: 40.7,  lon: -74,   label: 'New York, US' },          // East Coast
  { lat: 47.6,  lon: -122.3,label: 'Seattle, US' },          // Pacific NW
  { lat: 41.9,  lon: -87.6, label: 'Chicago, US' },
  { lat: 30.3,  lon: -97.7, label: 'Austin, US' },
  { lat: 51.5,  lon: -0.1,  label: 'London, UK' },
  { lat: 48.9,  lon: 2.3,   label: 'Paris, FR' },
  { lat: 52.5,  lon: 13.4,  label: 'Berlin, DE' },
  { lat: 52.4,  lon: 4.9,   label: 'Amsterdam, NL' },
  { lat: 55.7,  lon: 12.6,  label: 'Copenhagen, DK' },
  { lat: 59.3,  lon: 18.1,  label: 'Stockholm, SE' },
  { lat: 41.9,  lon: 12.5,  label: 'Rome, IT' },
  { lat: 39.5,  lon: -8.1,  label: 'Lisbon, PT' },
  { lat: 53.3,  lon: -6.3,  label: 'Dublin, IE' },
  { lat: 35.7,  lon: 139.7, label: 'Tokyo, JP' },
  { lat: 37.5,  lon: 127,   label: 'Seoul, KR' },
  { lat: 22.3,  lon: 114.2, label: 'Hong Kong' },
  { lat: 1.35,  lon: 103.8, label: 'Singapore' },
  { lat: 31.2,  lon: 121.5, label: 'Shanghai, CN' },
  { lat: 39.9,  lon: 116.4, label: 'Beijing, CN' },
  { lat: 19.1,  lon: 72.9,  label: 'Mumbai, IN' },
  { lat: 28.6,  lon: 77.2,  label: 'Delhi, IN' },
  { lat: -33.9, lon: 151.2, label: 'Sydney, AU' },
  { lat: -23.5, lon: -46.6, label: 'São Paulo, BR' },
  { lat: -34.6, lon: -58.4, label: 'Buenos Aires, AR' },
  { lat: 25.0,  lon: 55.3,  label: 'Dubai, AE' },
  { lat: 31.8,  lon: 35.2,  label: 'Tel Aviv, IL' },
  { lat: -1.3,  lon: 36.8,  label: 'Nairobi, KE' },
  { lat: 55.8,  lon: 37.6,  label: 'Moscow, RU' },
  { lat: 41.3,  lon: 69.3,  label: 'Tashkent, UZ' },
  { lat: 28.6,  lon: -106.1,label: 'Chihuahua, MX' },
  { lat: 45.4,  lon: 9.2,   label: 'Milan, IT' },
  { lat: 40.0,  lon: 116.4, label: 'Northern China' },
  { lat: 30.7,  lon: 104.1, label: 'Chengdu, CN' },
  { lat: -23.0, lon: 113.7, label: 'Western Australia' },
  { lat: 14.6,  lon: 121.0, label: 'Manila, PH' },
  { lat: 13.8,  lon: 100.5, label: 'Bangkok, TH' },
  { lat: 21.0,  lon: 105.8, label: 'Hanoi, VN' },
  { lat: -6.2,  lon: 106.8, label: 'Jakarta, ID' },
  { lat: 3.1,   lon: 101.7, label: 'Kuala Lumpur, MY' },
];

// ─── Hash function (FNV-1a, deterministic) ───────────────────────────────────
function hashString(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// ─── Region assignment ────────────────────────────────────────────────────────
function regionForAgent(name, namespace) {
  const lower = namespace.toLowerCase();

  // 1. Check country-specific TLDs FIRST
  for (const [tld, region] of Object.entries(COUNTRY_TLDS)) {
    if (lower.startsWith(tld)) {
      const h1 = hashString(name);
      const h2 = hashString(name + namespace);
      const lat = region.lat + ((h1 % 10000) / 10000 - 0.5) * region.spread * 2;
      const lon = region.lon + ((h2 % 10000) / 10000 - 0.5) * region.spread * 2;
      return { lat, lon, label: region.label };
    }
  }

  // 2. For io.github.* — distribute across global zones (GitHub is global)
  // 3. For generic TLDs (com.*, ai.*, app.*, etc.) — also distribute globally
  // Use the full agent name hash to pick a zone
  const h = hashString(name);
  const zone = GLOBAL_ZONES[h % GLOBAL_ZONES.length];
  // Small jitter within the zone (±1.5 degrees)
  const h2 = hashString(name + 'jitter');
  const lat = zone.lat + ((h2 % 1000) / 1000 - 0.5) * 3;
  const lon = zone.lon + ((hashString(name + 'lon') % 1000) / 1000 - 0.5) * 3;
  return { lat, lon, label: zone.label };
}

// ─── Lat/Lon → 3D position ───────────────────────────────────────────────────
function latLonToVec3(lat, lon, radius) {
  const phi = (90 - lat) * Math.PI / 180;
  const theta = (lon + 180) * Math.PI / 180;
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
     radius * Math.cos(phi),
     radius * Math.sin(phi) * Math.sin(theta)
  );
}

// ─── Agent classification ────────────────────────────────────────────────────
function classifyAgent(name, desc, ns) {
  const t = `${name} ${desc} ${ns}`.toLowerCase();
  if (/firewall|shield|guard|protect|waf/.test(t)) return 'firewall';
  if (/x402|payment|wallet|usdc|billing|invoice|stripe|paypal/.test(t)) return 'payment';
  if (/compute|gpu|inference|render|train|model.*serv|vllm|ollama/.test(t)) return 'compute';
  if (/registry|directory|catalog|index|search.*server|discover/.test(t)) return 'directory';
  if (/threat|audit|monitor|ioc|security.*scan|phish|malware/.test(t)) return 'observer';
  if (/bridge|gateway|proxy|a2a|connector|relay/.test(t)) return 'bridge';
  return 'publisher';
}

const KIND_COLORS = {
  firewall: 0xff6b35, payment: 0x00d4ff, compute: 0xa78bfa,
  directory: 0xfbbf24, publisher: 0x22c55e, bridge: 0xec4899,
  observer: 0xf43f5e, consumer: 0x94a3b8,
};
const KIND_LABELS = {
  firewall: 'Firewall / Protection', payment: 'Payment / x402',
  compute: 'Compute / GPU', directory: 'Directory / Registry',
  publisher: 'Publisher / MCP Server', bridge: 'Bridge / Gateway',
  observer: 'Observer / Threat-Intel', consumer: 'Consumer',
};

// ─── Three.js scene ──────────────────────────────────────────────────────────
let scene, camera, renderer, globe, pointsObj, raycaster, mouse;
let agents = [], filteredAgents = [];
let activeFilter = 'all';
let hoveredIdx = -1;
let isPaused = false;

const R = 100;       // globe radius
const PR = R * 1.008; // points radius

function initGlobe() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x050810);
  scene.fog = new THREE.Fog(0x050810, 200, 800);

  camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 2000);
  camera.position.set(0, 60, 280);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  document.getElementById('globe-canvas').appendChild(renderer.domElement);

  raycaster = new THREE.Raycaster();
  raycaster.params.Points.threshold = 1.5;
  mouse = new THREE.Vector2();

  scene.add(new THREE.AmbientLight(0x404060, 0.5));
  const dir = new THREE.DirectionalLight(0xffffff, 0.6);
  dir.position.set(150, 100, 200);
  scene.add(dir);

  addStars();
  addGlobe();
  addContinentOutlines();
}

function addStars() {
  const g = new THREE.BufferGeometry();
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
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  scene.add(new THREE.Points(g, new THREE.PointsMaterial({
    color: 0xffffff, size: 0.8, transparent: true, opacity: 0.5,
    sizeAttenuation: true, depthWrite: false,
  })));
}

function addGlobe() {
  // Dark solid sphere
  const innerGeo = new THREE.SphereGeometry(R * 0.97, 48, 48);
  scene.add(new THREE.Mesh(innerGeo, new THREE.MeshPhongMaterial({
    color: 0x0a1520, transparent: true, opacity: 0.9, shininess: 8,
  })));

  // Wireframe
  const wireGeo = new THREE.SphereGeometry(R, 64, 64);
  globe = new THREE.Mesh(wireGeo, new THREE.MeshBasicMaterial({
    color: 0x1a2a3a, wireframe: true, transparent: true, opacity: 0.3,
  }));
  scene.add(globe);

  // Lat/lon grid
  const gridMat = new THREE.LineBasicMaterial({ color: 0x2a3a4a, transparent: true, opacity: 0.15 });
  for (let lat = -75; lat <= 75; lat += 15) {
    const pts = [];
    for (let lon = -180; lon <= 180; lon += 3)
      pts.push(latLonToVec3(lat, lon, R * 1.002));
    scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), gridMat));
  }
  for (let lon = -180; lon < 180; lon += 15) {
    const pts = [];
    for (let lat = -88; lat <= 88; lat += 3)
      pts.push(latLonToVec3(lat, lon, R * 1.002));
    scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), gridMat));
  }
}

// ─── Simplified continent outlines (coastline points) ─────────────────────────
function addContinentOutlines() {
  // Simplified continent outlines — a few dozen points per continent
  // Drawn as line loops on the globe surface
  const continents = [
    // North America (simplified)
    [[71,-156],[70,-130],[60,-140],[49,-125],[32,-117],[23,-110],[18,-92],[25,-80],
     [30,-80],[35,-75],[45,-65],[50,-55],[60,-65],[70,-80],[75,-100],[71,-156]],
    // South America
    [[12,-72],[10,-65],[5,-52],[-3,-44],[-23,-40],[-34,-52],[-52,-68],[-55,-70],
     [-50,-73],[-35,-72],[-18,-71],[-10,-78],[0,-79],[5,-77],[12,-72]],
    // Europe + Africa (simplified, connected)
    [[70,28],[65,22],[58,8],[50,-5],[44,-9],[36,-6],[35,10],[31,32],[20,38],
     [12,42],[0,10],[-5,9],[-15,12],[-25,18],[-34,20],[-35,18],[-30,32],[-12,40],
     [0,45],[12,50],[25,55],[35,55],[45,40],[55,38],[65,35],[70,28]],
    // Asia (simplified)
    [[70,40],[70,80],[75,120],[72,160],[65,175],[60,165],[55,140],[45,140],
     [35,130],[30,120],[20,110],[10,105],[5,100],[8,95],[20,90],[25,85],
     [30,75],[35,60],[42,48],[50,45],[60,50],[70,40]],
    // Australia
    [[-12,131],[-12,142],[-18,145],[-25,153],[-35,150],[-38,142],[-35,135],
     [-32,125],[-25,113],[-18,122],[-12,131]],
    // Antarctica (simplified ring)
    [[-75,-170],[-78,-140],[-80,-100],[-82,-60],[-80,-20],[-78,20],[-80,60],
     [-82,100],[-80,140],[-78,170],[-75,-170]],
  ];

  const mat = new THREE.LineBasicMaterial({ color: 0x3a5070, transparent: true, opacity: 0.35 });
  for (const continent of continents) {
    const pts = continent.map(([lat, lon]) => latLonToVec3(lat, lon, R * 1.004));
    scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), mat));
  }
}

// ─── Data loading ────────────────────────────────────────────────────────────
function loadAgents() {
  fetch('data/agents.json')
    .then(r => r.json())
    .then(data => {
      agents = (data.agents || []).map(a => {
        const kind = classifyAgent(a.name, a.description, a.namespace);
        const region = regionForAgent(a.name, a.namespace);
        return {
          ...a, kind,
          regionLabel: region.label,
          lat: region.lat, lon: region.lon,
          position: latLonToVec3(region.lat, region.lon, PR),
        };
      });

      // Stats
      const total = agents.length;
      const x402 = agents.filter(a => a.x402).length;
      const barter = agents.filter(a => a.barter).length;
      const cards = agents.filter(a => a.agent_card).length;
      const regions = new Set(agents.map(a => a.regionLabel));

      document.getElementById('stat-total').textContent = total.toLocaleString();
      document.getElementById('stat-x402').textContent = x402;
      document.getElementById('stat-barter').textContent = barter;
      document.getElementById('stat-cards').textContent = cards;
      document.getElementById('stat-regions').textContent = regions.size;

      // Filter counts
      ['firewall','payment','compute','directory','publisher','bridge','observer'].forEach(k => {
        const c = agents.filter(a => a.kind === k).length;
        const el = document.querySelector(`[data-filter="${k}"] .count`);
        if (el) el.textContent = c;
      });
      document.querySelector('[data-filter="x402"] .count').textContent = x402;
      document.querySelector('[data-filter="barter"] .count').textContent = barter;

      document.getElementById('footer-text').textContent =
        `${total} agents · ${data.total_versions} versions · ${regions.size} locations · ${data.scan_time} · registry.modelcontextprotocol.io`;

      document.getElementById('loader').classList.add('hidden');
      applyFilter('all');
    });
}

// ─── Filtering ───────────────────────────────────────────────────────────────
function applyFilter(filter) {
  activeFilter = filter;
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filter === filter);
  });
  const search = document.getElementById('search').value.toLowerCase();
  if (filter === 'all') filteredAgents = agents;
  else if (filter === 'x402') filteredAgents = agents.filter(a => a.x402);
  else if (filter === 'barter') filteredAgents = agents.filter(a => a.barter);
  else filteredAgents = agents.filter(a => a.kind === filter);
  if (search) {
    filteredAgents = filteredAgents.filter(a =>
      a.name.toLowerCase().includes(search) ||
      a.description.toLowerCase().includes(search) ||
      a.namespace.toLowerCase().includes(search));
  }
  renderPoints();
  document.getElementById('stat-total').textContent = filteredAgents.length.toLocaleString();
}

// ─── Point rendering ─────────────────────────────────────────────────────────
function pointTexture() {
  const c = document.createElement('canvas');
  c.width = 64; c.height = 64;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.3, 'rgba(255,255,255,0.7)');
  g.addColorStop(0.7, 'rgba(255,255,255,0.1)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

function renderPoints() {
  if (pointsObj) {
    scene.remove(pointsObj);
    pointsObj.geometry.dispose(); pointsObj.material.dispose();
  }
  if (!filteredAgents.length) return;
  const N = filteredAgents.length;
  const pos = new Float32Array(N * 3);
  const col = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const a = filteredAgents[i];
    pos[i*3] = a.position.x; pos[i*3+1] = a.position.y; pos[i*3+2] = a.position.z;
    const c = new THREE.Color(KIND_COLORS[a.kind] || 0xffffff);
    if (a.x402) c.multiplyScalar(1.8);
    if (a.barter) c.multiplyScalar(2.0);
    col[i*3] = Math.min(c.r, 1); col[i*3+1] = Math.min(c.g, 1); col[i*3+2] = Math.min(c.b, 1);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const mat = new THREE.PointsMaterial({
    size: 1.8, sizeAttenuation: true, vertexColors: true,
    transparent: true, opacity: 0.9, map: pointTexture(),
    alphaTest: 0.01, blending: THREE.AdditiveBlending, depthWrite: false,
  });
  pointsObj = new THREE.Points(geo, mat);
  pointsObj.userData.agents = filteredAgents;
  scene.add(pointsObj);
}

// ─── Interaction ─────────────────────────────────────────────────────────────
let isDragging = false, prevX = 0, prevY = 0;
let rotY = 0, rotX = 0, velY = 0.0006, velX = 0;
let camDist = 280, camDistTarget = 280;
let mouseOnGlobe = false;
let mouseSX = 0, mouseSY = 0;

function onPointerDown(e) {
  isDragging = true; prevX = e.clientX; prevY = e.clientY;
}
function onPointerMove(e) {
  mouseSX = e.clientX; mouseSY = e.clientY;
  mouseOnGlobe = true;
  if (isDragging) {
    velY = (e.clientX - prevX) * 0.006;
    velX = (e.clientY - prevY) * 0.006;
    rotY += velY; rotX += velX;
    rotX = Math.max(-Math.PI/2.1, Math.min(Math.PI/2.1, rotX));
    prevX = e.clientX; prevY = e.clientY;
  } else {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    checkHover();
  }
}
function onPointerLeave() { isDragging = false; mouseOnGlobe = false; }
function onPointerUp() { isDragging = false; }

function onWheel(e) {
  camDistTarget *= 1 + (e.deltaY > 0 ? 0.15 : -0.15);
  camDistTarget = Math.max(110, Math.min(600, camDistTarget));
  e.preventDefault();
}

function checkHover() {
  if (!pointsObj) return;
  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObject(pointsObj);
  const tt = document.getElementById('tooltip');
  if (hits.length > 0) {
    hoveredIdx = hits[0].index;
    const a = filteredAgents[hoveredIdx];
    tt.innerHTML = `<div class="t-name">${a.name}</div><div class="t-meta">${a.regionLabel} · v${a.version} · ${a.kind}${a.x402 ? ' · x402' : ''}${a.barter ? ' · barter' : ''}</div>`;
    tt.style.left = (mouseSX + 14) + 'px';
    tt.style.top = (mouseSY + 14) + 'px';
    tt.classList.add('visible');
    document.body.style.cursor = 'pointer';
  } else {
    hoveredIdx = -1;
    tt.classList.remove('visible');
    document.body.style.cursor = 'default';
  }
}

function onClick() {
  if (hoveredIdx >= 0) showPanel(filteredAgents[hoveredIdx]);
}

// ─── Agent detail panel ──────────────────────────────────────────────────────
function showPanel(a) {
  const kc = { firewall:'#ff6b35', payment:'#00d4ff', compute:'#a78bfa',
    directory:'#fbbf24', publisher:'#22c55e', bridge:'#ec4899',
    observer:'#f43f5e', consumer:'#94a3b8' };
  const color = kc[a.kind];

  // Capabilities
  const caps = [];
  if (a.x402) caps.push(`<span class="cap-tag" style="background:rgba(0,212,255,0.1);color:#00d4ff;border:1px solid rgba(0,212,255,0.3)">💰 x402 Payments</span>`);
  if (a.barter) caps.push(`<span class="cap-tag" style="background:rgba(255,107,53,0.1);color:#ff6b35;border:1px solid rgba(255,107,53,0.3)">🔁 Barter Accepted</span>`);
  if (a.agent_card) caps.push(`<span class="cap-tag" style="background:rgba(167,139,250,0.1);color:#a78bfa;border:1px solid rgba(167,139,250,0.3)">🪪 Agent Card</span>`);
  caps.push(`<span class="cap-tag" style="background:rgba(34,197,94,0.1);color:#22c55e;border:1px solid rgba(34,197,94,0.3)">📍 ${a.regionLabel}</span>`);

  // Protocol info
  const protocols = ['MCP'];
  if (a.x402) protocols.push('x402');
  if (a.barter) protocols.push('Barter');
  if (a.agent_card) protocols.push('A2A');

  // Links
  const links = [];
  if (a.website) links.push(`<a class="link-item" href="${a.website}" target="_blank" rel="noopener">🌐 ${a.website}</a>`);
  if (a.repository) links.push(`<a class="link-item" href="${a.repository}" target="_blank" rel="noopener">📦 ${a.repository}</a>`);
  if (a.agent_card) links.push(`<a class="link-item" href="${a.agent_card}" target="_blank" rel="noopener">🪪 ${a.agent_card}</a>`);
  links.push(`<a class="link-item" href="https://registry.modelcontextprotocol.io/v0/servers?cursor=${encodeURIComponent(a.namespace)}&limit=20" target="_blank" rel="noopener">🔍 View in MCP Registry</a>`);

  // Connections: find nearby agents (same region + same kind, or x402 ↔ barter)
  const nearby = agents
    .filter(x => x.name !== a.name)
    .filter(x => {
      if (a.x402 && x.barter) return true;  // x402 agents connect to barter agents
      if (a.barter && x.x402) return true;
      if (x.kind === a.kind && x.regionLabel === a.regionLabel) return true;  // same kind + region
      return false;
    })
    .slice(0, 8);
  const connectionsHTML = nearby.length ? `
    <div class="sidebar-section" style="margin-top:16px">
      <h3 style="font-size:10px;text-transform:uppercase;letter-spacing:1.5px;color:var(--text-dim);margin-bottom:8px">Connections (${nearby.length})</h3>
      ${nearby.map(x => `<div style="padding:6px 10px;margin-bottom:4px;background:rgba(255,255,255,0.03);border:1px solid var(--border);border-radius:6px;font-size:11px;font-family:var(--mono);cursor:pointer;color:${kc[x.kind]||'#888'}" onclick="showPanelByName('${x.name.replace(/'/g,"\\'")}')">${x.name}</div>`).join('')}
    </div>` : '';

  document.getElementById('panel-content').innerHTML = `
    <div class="kind-badge" style="background:${color};color:#000">${KIND_LABELS[a.kind] || a.kind}</div>
    <div class="agent-title">${a.name}</div>
    <div class="agent-version">v${a.version} · ${a.versions.length} versions published</div>
    <div class="agent-desc">${a.description || '(no description)'}</div>
    <div class="agent-capabilities">${caps.join('')}</div>
    ${a.wallet ? `<div class="wallet-box"><div class="label">x402 Wallet (USDC)</div><div class="value">${a.wallet}</div></div>` : ''}
    <div class="info-grid">
      <div class="info-card"><div class="label">First seen</div><div class="value">${a.first_seen}</div></div>
      <div class="info-card"><div class="label">Last seen</div><div class="value">${a.last_seen}</div></div>
      <div class="info-card"><div class="label">Location</div><div class="value">${a.regionLabel}</div></div>
      <div class="info-card"><div class="label">Coordinates</div><div class="value">${a.lat.toFixed(2)}°, ${a.lon.toFixed(2)}°</div></div>
      <div class="info-card"><div class="label">Namespace</div><div class="value">${a.namespace}</div></div>
      <div class="info-card"><div class="label">Protocols</div><div class="value">${protocols.join(' + ')}</div></div>
      <div class="info-card"><div class="label">Agent type</div><div class="value">${a.kind}</div></div>
      <div class="info-card"><div class="label">Versions</div><div class="value">${a.versions.length}</div></div>
    </div>
    <div class="link-list">${links.join('')}</div>
    ${connectionsHTML}
  `;
  document.getElementById('panel-right').classList.add('open');
}

// Global function for clicking connections inside the panel
window.showPanelByName = function(name) {
  const a = agents.find(x => x.name === name);
  if (a) showPanel(a);
};

function closePanel() { document.getElementById('panel-right').classList.remove('open'); }

// ─── Animation loop with pause + smooth zoom ────────────────────────────────
function animate() {
  requestAnimationFrame(animate);

  // Pause: stop rotation if paused OR if mouse is over the globe
  if (!isDragging) {
    if (!isPaused && !mouseOnGlobe) {
      rotY += velY; rotX += velX;
      velY = velY * 0.96 + 0.0006;  // auto-rotate
      velX *= 0.96;
    } else if (isPaused) {
      velY *= 0.9; velX *= 0.9;  // decelerate when paused
    } else if (mouseOnGlobe) {
      velY *= 0.85; velX *= 0.85;  // slow down when hovering
    }
  }

  // Smooth zoom interpolation
  camDist += (camDistTarget - camDist) * 0.1;

  // Apply rotation to all scene objects
  scene.children.forEach(obj => {
    if (obj === pointsObj || obj === globe || obj instanceof THREE.Line || obj instanceof THREE.Points || obj instanceof THREE.Mesh) {
      obj.rotation.y = rotY;
      obj.rotation.x = rotX;
    }
  });

  camera.position.z = camDist;
  renderer.render(scene, camera);
}

// ─── Init ───────────────────────────────────────────────────────────────────
window.addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

window.addEventListener('load', () => {
  initGlobe();
  animate();

  const canvas = document.getElementById('globe-canvas');
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointerleave', onPointerLeave);
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

  // Pause button
  document.getElementById('btn-pause').addEventListener('click', () => {
    isPaused = !isPaused;
    document.getElementById('btn-pause').textContent = isPaused ? '▶ Play' : '⏸ Pause';
  });

  loadAgents();
});
