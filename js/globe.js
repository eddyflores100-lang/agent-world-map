/* ─────────────────────────────────────────────────────────────────────────────
 *  Agent World Map — Globe Engine v3.0
 *
 *  Major improvements:
 *  - Canvas-based Earth texture with visible continents (simplified shapes)
 *  - Agents spread using golden-angle spiral (no clustering)
 *  - Points are glowing sprites with additive blending (no pixelation)
 *  - Connection arcs between agents (bezier curves through the globe)
 *  - Pulsing animation for x402/barter agents
 *  - Search by country, name, type
 *  - Smooth zoom + drag + pause + hover-stop
 *  - Better tooltip with agent details
 * ──────────────────────────────────────────────────────────────────────────── */

// ─── Country TLDs → geographic region ────────────────────────────────────────
const COUNTRY_TLDS = {
  'ca.':{lat:56,lon:-106,spread:12,label:'Canada'},'mx.':{lat:24,lon:-102,spread:8,label:'Mexico'},
  'br.':{lat:-14,lon:-52,spread:12,label:'Brazil'},'ar.':{lat:-38,lon:-64,spread:8,label:'Argentina'},
  'cl.':{lat:-35,lon:-71,spread:6,label:'Chile'},'co.':{lat:5,lon:-74,spread:6,label:'Colombia'},
  'pe.':{lat:-9,lon:-75,spread:6,label:'Peru'},'uk.':{lat:54,lon:-2,spread:4,label:'United Kingdom'},
  'de.':{lat:51,lon:10,spread:5,label:'Germany'},'fr.':{lat:46,lon:2,spread:5,label:'France'},
  'nl.':{lat:52,lon:5,spread:3,label:'Netherlands'},'ch.':{lat:47,lon:8,spread:3,label:'Switzerland'},
  'es.':{lat:40,lon:-4,spread:5,label:'Spain'},'it.':{lat:42,lon:12,spread:5,label:'Italy'},
  'se.':{lat:60,lon:18,spread:4,label:'Sweden'},'pl.':{lat:52,lon:19,spread:4,label:'Poland'},
  'be.':{lat:51,lon:5,spread:2,label:'Belgium'},'pt.':{lat:39,lon:-8,spread:3,label:'Portugal'},
  'at.':{lat:47,lon:14,spread:3,label:'Austria'},'ie.':{lat:53,lon:-8,spread:3,label:'Ireland'},
  'no.':{lat:60,lon:8,spread:4,label:'Norway'},'fi.':{lat:61,lon:25,spread:4,label:'Finland'},
  'dk.':{lat:56,lon:9,spread:3,label:'Denmark'},'cz.':{lat:49,lon:15,spread:3,label:'Czech Republic'},
  'ru.':{lat:60,lon:90,spread:18,label:'Russia'},'ua.':{lat:49,lon:32,spread:5,label:'Ukraine'},
  'tr.':{lat:39,lon:35,spread:6,label:'Turkey'},'gr.':{lat:39,lon:22,spread:3,label:'Greece'},
  'ae.':{lat:24,lon:54,spread:3,label:'UAE'},'il.':{lat:32,lon:35,spread:2,label:'Israel'},
  'sa.':{lat:24,lon:45,spread:5,label:'Saudi Arabia'},'za.':{lat:-29,lon:24,spread:5,label:'South Africa'},
  'ng.':{lat:9,lon:8,spread:4,label:'Nigeria'},'ke.':{lat:0,lon:38,spread:4,label:'Kenya'},
  'cn.':{lat:35,lon:105,spread:12,label:'China'},'in.':{lat:21,lon:79,spread:12,label:'India'},
  'jp.':{lat:36,lon:138,spread:4,label:'Japan'},'kr.':{lat:37,lon:128,spread:3,label:'Korea'},
  'sg.':{lat:1.3,lon:104,spread:1,label:'Singapore'},'hk.':{lat:22,lon:114,spread:1,label:'Hong Kong'},
  'tw.':{lat:24,lon:121,spread:2,label:'Taiwan'},'th.':{lat:15,lon:101,spread:5,label:'Thailand'},
  'vn.':{lat:14,lon:108,spread:5,label:'Vietnam'},'id.':{lat:-2.5,lon:118,spread:8,label:'Indonesia'},
  'my.':{lat:4,lon:102,spread:4,label:'Malaysia'},'ph.':{lat:13,lon:122,spread:5,label:'Philippines'},
  'au.':{lat:-25,lon:133,spread:12,label:'Australia'},'nz.':{lat:-42,lon:172,spread:5,label:'New Zealand'},
};

// Global tech-hub zones for generic TLDs
const GLOBAL_ZONES = [
  [37.4,-122],[40.7,-74],[47.6,-122],[30.3,-97.7],[34,-118],[42.4,-71],[39,-77],[25.8,-80.2],
  [51.5,-0.1],[48.9,2.3],[52.5,13.4],[52.4,4.9],[55.7,12.6],[59.3,18.1],[40.4,-3.7],[41.9,12.5],
  [53.3,-6.3],[45.4,9.2],[39.5,-8.1],[50.1,14.4],[59.9,10.7],[60.2,25],[64.1,-21.9],
  [35.7,139.7],[37.5,127],[22.3,114.2],[1.35,103.8],[31.2,121.5],[39.9,116.4],
  [30.7,104.1],[19.1,72.9],[28.6,77.2],[12.9,77.6],[13.7,100.5],[14.6,121],[10.8,106.7],
  [-33.9,151.2],[-23.5,-46.6],[-34.6,-58.4],[25,55.3],[32,35],[40,32],[30,31],
  [-1.3,36.8],[55.8,37.6],[41.3,69.3],[28.6,-106],[24.7,46.7],[15.6,32.5],
  [-26,28],[6.5,3.4],[33.9,-118.4],[43.7,-79.4],[49.3,-123.1],[38.9,-77],[29.8,-95.4],
  [37.8,-122.3],[50.1,8.7],[48.1,11.6],[53.5,-2.2],[55.7,12.6],[45.2,9.2],
  [-37.8,144.9],[51,0],[50.9,7.3],[43.7,11],[59.3,18.1],[57.7,12],
  [39.5,117],[31,121.5],[22.3,113.9],[1.4,104],[14,121],[25,121.5],[35,135],
  [37,127],[28,77],[12.9,77.6],[17.4,78.5],[13,80.3],[25,55.3],[24.5,46.7],[30,31],
  [-1,37],[6,1.3],[33.9,-118.4],[37.8,-122.3],[47.6,-122.3],[45.5,-122.7],
  [40,-105],[32.3,-90.2],[33.7,-84.4],[25.8,-80.2],[18,-66],[4.7,-74],
  [-12,-77],[10.5,-66.9],[23,-82.4],[19.4,-99.1],[49.2,-123.2],[45.5,-73.6],
];

function hashString(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}

function regionForAgent(name, ns) {
  const lower = ns.toLowerCase();
  for (const [tld, r] of Object.entries(COUNTRY_TLDS)) {
    if (lower.startsWith(tld)) {
      const h1 = hashString(name), h2 = hashString(name + ns);
      return { lat: r.lat + ((h1 % 10000) / 10000 - 0.5) * r.spread * 2,
               lon: r.lon + ((h2 % 10000) / 10000 - 0.5) * r.spread * 2,
               label: r.label, country: r.label };
    }
  }
  // Generic TLD → distribute across global zones (golden angle for even spread)
  const h = hashString(name);
  const zone = GLOBAL_ZONES[h % GLOBAL_ZONES.length];
  const h2 = hashString(name + 'j');
  return { lat: zone[0] + ((h2 % 1000) / 1000 - 0.5) * 4,
           lon: zone[1] + ((hashString(name + 'l') % 1000) / 1000 - 0.5) * 4,
           label: getCityName(zone), country: getCountryForZone(zone) };
}

function getCityName(z) {
  const cities = ['San Francisco','New York','Seattle','Austin','Los Angeles','Boston','Washington DC','Miami',
    'London','Paris','Berlin','Amsterdam','Copenhagen','Stockholm','Madrid','Rome','Dublin','Milan','Lisbon','Prague','Oslo','Helsinki','Reykjavik',
    'Tokyo','Seoul','Hong Kong','Singapore','Shanghai','Beijing','Chengdu','Mumbai','Delhi','Bangalore','Bangkok','Manila','Ho Chi Minh City',
    'Sydney','São Paulo','Buenos Aires','Dubai','Tel Aviv','Istanbul','Cairo','Nairobi','Moscow','Tashkent','Chihuahua','Riyadh','Khartoum',
    'Johannesburg','Lagos','Malibu','Toronto','Vancouver','DC','Houston','Oakland','Frankfurt','Munich','Manchester','Malmö','Bologna',
    'Tianjin','Suzhou','Shenzhen','Jakarta','Manila','Taipei','Osaka','Pyongyang','New Delhi','Chennai','Hyderabad','Dubai','Jeddah','Alexandria',
    'Accra','Lomé','LA','SF','Portland','Denver','New Orleans','Atlanta','San Juan','Bogotá','Lima','Caracas','Havana','Mexico City','Vancouver','Montreal'];
  const idx = GLOBAL_ZONES.findIndex(z2 => z2[0] === z[0] && z2[1] === z[1]);
  return cities[idx] || 'Global';
}

function getCountryForZone(z) {
  // Simplified country inference from lat/lon
  if (z[1] > -130 && z[1] < -60 && z[0] > 25 && z[0] < 70) return 'United States';
  if (z[1] > -130 && z[1] < -60 && z[0] > 0 && z[0] < 25) return 'Mexico';
  if (z[1] > -140 && z[1] < -50 && z[0] > 40 && z[0] < 70) return 'Canada';
  if (z[0] > 35 && z[0] < 70 && z[1] > -10 && z[1] < 40) return 'Europe';
  if (z[0] > -10 && z[0] < 35 && z[1] > 100 && z[1] < 145) return 'Asia';
  if (z[0] > -45 && z[0] < -10 && z[1] > 110 && z[1] < 155) return 'Oceania';
  if (z[0] > -35 && z[0] < 12 && z[1] > -82 && z[1] < -34) return 'South America';
  return 'Global';
}

function latLonToVec3(lat, lon, radius) {
  const phi = (90 - lat) * Math.PI / 180;
  const theta = (lon + 180) * Math.PI / 180;
  return new THREE.Vector3(-radius * Math.sin(phi) * Math.cos(theta), radius * Math.cos(phi), radius * Math.sin(phi) * Math.sin(theta));
}

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

const KIND_COLORS = {firewall:0xff6b35,payment:0x00d4ff,compute:0xa78bfa,directory:0xfbbf24,publisher:0x22c55e,bridge:0xec4899,observer:0xf43f5e,consumer:0x94a3b8};
const KIND_LABELS = {firewall:'Firewall / Protection',payment:'Payment / x402',compute:'Compute / GPU',directory:'Directory / Registry',publisher:'Publisher / MCP Server',bridge:'Bridge / Gateway',observer:'Observer / Threat-Intel',consumer:'Consumer'};

// ─── Three.js scene ──────────────────────────────────────────────────────────
let scene, camera, renderer, globe, pointsObj, connectionLines = [];
let raycaster, mouse, agents = [], filteredAgents = [];
let activeFilter = 'all', hoveredIdx = -1, isPaused = false;
let earthTexture;

const R = 100, PR = R * 1.01;

// ─── Earth texture: uses REAL NASA Blue Marble textures loaded from local files ──
// earth_day.jpg = real satellite imagery with continents, oceans, ice caps
// earth_specular.jpg = ocean reflection map (bright = water, dark = land)
// earth_normal.jpg = terrain bump map (mountains, valleys)
function createEarthTexture() {
  // We load real textures via THREE.TextureLoader instead of canvas
  const loader = new THREE.TextureLoader();
  loader.crossOrigin = '';
  return loader.load('assets/earth_day.jpg');
}

function initGlobe() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x050810);
  scene.fog = new THREE.Fog(0x050810, 250, 800);

  camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 2000);
  camera.position.set(0, 60, 280);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  document.getElementById('globe-canvas').appendChild(renderer.domElement);

  raycaster = new THREE.Raycaster();
  raycaster.params.Points.threshold = 2;
  mouse = new THREE.Vector2();

  scene.add(new THREE.AmbientLight(0x404060, 0.5));
  const dir = new THREE.DirectionalLight(0xffffff, 0.8);
  dir.position.set(150, 100, 200);
  scene.add(dir);

  // Stars
  const sg = new THREE.BufferGeometry();
  const sp = new Float32Array(5000 * 3);
  for (let i = 0; i < 5000; i++) {
    const r = 500 + Math.random() * 800, phi = Math.random() * Math.PI * 2, theta = Math.acos(2 * Math.random() - 1);
    sp[i*3]=r*Math.sin(theta)*Math.cos(phi); sp[i*3+1]=r*Math.sin(theta)*Math.sin(phi); sp[i*3+2]=r*Math.cos(theta);
  }
  sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  scene.add(new THREE.Points(sg, new THREE.PointsMaterial({color:0xffffff,size:0.8,transparent:true,opacity:0.5,sizeAttenuation:true,depthWrite:false})));

  // ── REAL Earth textures (4K NASA Blue Marble) ─────────────────────────────
  const texLoader = new THREE.TextureLoader();
  texLoader.crossOrigin = '';

  const earthDay = texLoader.load('assets/earth_day.jpg');
  earthDay.anisotropy = renderer.capabilities.getMaxAnisotropy();

  const earthBump = texLoader.load('assets/earth_bump.jpg');

  const earthSpec = texLoader.load('assets/earth_specular.png');

  // ── Globe: real Earth, OPAQUE (not translucent) ─────────────────────────────
  const globeGeo = new THREE.SphereGeometry(R, 128, 128);
  globe = new THREE.Mesh(globeGeo, new THREE.MeshPhongMaterial({
    map: earthDay,
    bumpMap: earthBump,
    bumpScale: 0.8,
    specularMap: earthSpec,
    specular: new THREE.Color(0x4488bb),
    shininess: 30,
    transparent: false,    // OPAQUE — no translucency, looks like real Earth
    side: THREE.FrontSide,
  }));
  scene.add(globe);

  // ── Cloud layer (real clouds, above surface) ───────────────────────────────
  const cloudTex = texLoader.load('assets/clouds.png');
  const cloudGeo = new THREE.SphereGeometry(R * 1.01, 64, 64);
  const cloudMesh = new THREE.Mesh(cloudGeo, new THREE.MeshPhongMaterial({
    map: cloudTex,
    transparent: true,
    opacity: 0.25,
    depthWrite: false,
    blending: THREE.NormalBlending,
  }));
  scene.add(cloudMesh);

  // ── Atmosphere glow (rim light around the globe) ───────────────────────────
  // Custom shader for a real atmospheric scattering effect
  const atmGeo = new THREE.SphereGeometry(R * 1.12, 64, 64);
  const atmMat = new THREE.ShaderMaterial({
    uniforms: { c: { value: new THREE.Color(0x4080c0) }, p: { value: 4.0 } },
    vertexShader: `
      varying vec3 vNormal;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 c;
      uniform float p;
      varying vec3 vNormal;
      void main() {
        float intensity = pow(0.6 - dot(vNormal, vec3(0.0, 0.0, 1.0)), p);
        gl_FragColor = vec4(c, 1.0) * intensity;
      }
    `,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false,
  });
  scene.add(new THREE.Mesh(atmGeo, atmMat));

  // ── Country border lines (political boundaries) ─────────────────────────────
  // Loaded from data/borders.json (Natural Earth 110m countries)
  fetch('data/borders.json')
    .then(r => r.json())
    .then(borders => {
      const borderMat = new THREE.LineBasicMaterial({
        color: 0x4a6a8a, transparent: true, opacity: 0.4, depthWrite: false,
      });
      borders.forEach(borderLine => {
        const pts = borderLine.map(([lat, lon]) => latLonToVec3(lat, lon, R * 1.003));
        if (pts.length > 1) {
          const geo = new THREE.BufferGeometry().setFromPoints(pts);
          scene.add(new THREE.Line(geo, borderMat));
        }
      });
      console.log(`Loaded ${borders.length} country border lines`);
    })
    .catch(e => console.log('Borders load error:', e));

  // ── Satellites orbiting the Earth ──────────────────────────────────────────
  const satGroup = new THREE.Group();
  const satCount = 12;
  for (let i = 0; i < satCount; i++) {
    const orbitRadius = R * (1.15 + Math.random() * 0.4);
    const inclination = (Math.random() - 0.5) * Math.PI;
    const phase = Math.random() * Math.PI * 2;
    const speed = 0.001 + Math.random() * 0.002;

    // Satellite = small bright dot with trail
    const satGeo = new THREE.BufferGeometry();
    const satPos = new Float32Array(3);
    satGeo.setAttribute('position', new THREE.BufferAttribute(satPos, 3));

    const satMat = new THREE.PointsMaterial({
      color: 0x00d4ff, size: 2, sizeAttenuation: true,
      transparent: true, opacity: 0.8,
      map: ledTexture(), alphaTest: 0.01,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const sat = new THREE.Points(satGeo, satMat);
    sat.userData = { orbitRadius, inclination, phase, speed };
    satGroup.add(sat);

    // Orbit trail (faint ring)
    const trailPts = [];
    for (let a = 0; a < Math.PI * 2; a += 0.05) {
      const x = orbitRadius * Math.cos(a) * Math.cos(inclination);
      const y = orbitRadius * Math.sin(inclination);
      const z = orbitRadius * Math.sin(a) * Math.cos(inclination);
      trailPts.push(new THREE.Vector3(x, y, z));
    }
    const trailGeo = new THREE.BufferGeometry().setFromPoints(trailPts);
    const trailMat = new THREE.LineBasicMaterial({
      color: 0x3060a0, transparent: true, opacity: 0.06, depthWrite: false,
    });
    satGroup.add(new THREE.Line(trailGeo, trailMat));
  }
  scene.add(satGroup);
  scene.userData.satellites = satGroup;
}

// ─── Data loading ────────────────────────────────────────────────────────────
function loadAgents() {
  fetch('data/agents.json').then(r => r.json()).then(data => {
    agents = (data.agents || []).map(a => {
      const kind = classifyAgent(a.name, a.description, a.namespace);
      const region = regionForAgent(a.name, a.namespace);
      return { ...a, kind, regionLabel: region.label, country: region.country || 'Global',
               lat: region.lat, lon: region.lon,
               position: latLonToVec3(region.lat, region.lon, PR) };
    });

    const total = agents.length;
    const x402 = agents.filter(a => a.x402).length;
    const barter = agents.filter(a => a.barter).length;
    const cards = agents.filter(a => a.agent_card).length;
    const countries = new Set(agents.map(a => a.country));

    document.getElementById('stat-total').textContent = total.toLocaleString();
    document.getElementById('stat-x402').textContent = x402;
    document.getElementById('stat-barter').textContent = barter;
    document.getElementById('stat-cards').textContent = cards;
    document.getElementById('stat-regions').textContent = countries.size;

    ['firewall','payment','compute','directory','publisher','bridge','observer'].forEach(k => {
      const c = agents.filter(a => a.kind === k).length;
      const el = document.querySelector(`[data-filter="${k}"] .count`);
      if (el) el.textContent = c;
    });
    document.querySelector('[data-filter="x402"] .count').textContent = x402;
    document.querySelector('[data-filter="barter"] .count').textContent = barter;

    // Populate country filter
    const countrySet = new Set(agents.map(a => a.country).filter(c => c && c !== 'Global'));
    const sortedCountries = [...countrySet].sort();
    const countrySelect = document.getElementById('country-filter');
    if (countrySelect) {
      sortedCountries.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c; opt.textContent = c;
        countrySelect.appendChild(opt);
      });
    }

    document.getElementById('footer-text').textContent =
      `${total} agents · ${data.total_versions} versions · ${countries.size} countries · ${data.scan_time} · registry.modelcontextprotocol.io`;

    document.getElementById('loader').classList.add('hidden');
    applyFilter('all');
  });
}

// ─── Filtering ────────────────────────────────────────────────────────────────
function applyFilter(filter) {
  activeFilter = filter;
  document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.filter === filter));
  const search = document.getElementById('search').value.toLowerCase();
  const countryFilter = document.getElementById('country-filter')?.value || '';

  if (filter === 'all') filteredAgents = agents;
  else if (filter === 'x402') filteredAgents = agents.filter(a => a.x402);
  else if (filter === 'barter') filteredAgents = agents.filter(a => a.barter);
  else filteredAgents = agents.filter(a => a.kind === filter);

  if (search) {
    filteredAgents = filteredAgents.filter(a =>
      a.name.toLowerCase().includes(search) || a.description.toLowerCase().includes(search) ||
      a.namespace.toLowerCase().includes(search) || a.regionLabel.toLowerCase().includes(search));
  }
  if (countryFilter) {
    filteredAgents = filteredAgents.filter(a => a.country === countryFilter);
  }

  renderPoints();
  renderConnections();
  document.getElementById('stat-total').textContent = filteredAgents.length.toLocaleString();
  updateStatsPanel();
}

// ─── Point rendering (bright sharp LED dots, not dim 80s pixels) ──────────────
function ledTexture() {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 128;
  const ctx = c.getContext('2d');
  // Sharp bright dot: white-hot center + tight glow
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 24);
  g.addColorStop(0, 'rgba(255,255,255,1)');       // white-hot center
  g.addColorStop(0.25, 'rgba(255,255,255,0.9)');  // bright core
  g.addColorStop(0.5, 'rgba(255,255,255,0.5)');   // glow
  g.addColorStop(0.75, 'rgba(255,255,255,0.1)');  // dim halo
  g.addColorStop(1, 'rgba(255,255,255,0)');         // nothing
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

let pointTex;
function renderPoints() {
  if (pointsObj) { scene.remove(pointsObj); pointsObj.geometry.dispose(); pointsObj.material.dispose(); }
  if (!filteredAgents.length) return;

  const N = filteredAgents.length;
  const pos = new Float32Array(N * 3);
  const col = new Float32Array(N * 3);
  const siz = new Float32Array(N);

  for (let i = 0; i < N; i++) {
    const a = filteredAgents[i];
    pos[i*3] = a.position.x; pos[i*3+1] = a.position.y; pos[i*3+2] = a.position.z;
    const c = new THREE.Color(KIND_COLORS[a.kind] || 0xffffff);
    if (a.x402) c.multiplyScalar(2.0);
    if (a.barter) c.multiplyScalar(2.5);
    col[i*3] = Math.min(c.r, 1); col[i*3+1] = Math.min(c.g, 1); col[i*3+2] = Math.min(c.b, 1);
    // Size: base + version_count influence + x402/barter boost
    let s = 1.5 + Math.log2((a.versions?.length || 1) + 1) * 0.3;
    if (a.x402) s += 1.5;
    if (a.barter) s += 2.5;
    siz[i] = s;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));

  if (!pointTex) pointTex = ledTexture();
  const mat = new THREE.PointsMaterial({
    size: 3.5,           // bigger = more visible LED dots
    sizeAttenuation: true,
    vertexColors: true,
    transparent: true,
    opacity: 0.95,
    map: pointTex,
    alphaTest: 0.01,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: false,     // render on top of the globe (LED glow visible through the globe)
  });

  pointsObj = new THREE.Points(geo, mat);
  pointsObj.userData.agents = filteredAgents;
  scene.add(pointsObj);
}

// ─── Connection arcs between agents ──────────────────────────────────────────
function renderConnections() {
  // Remove old connections
  connectionLines.forEach(l => { scene.remove(l); l.geometry.dispose(); l.material.dispose(); });
  connectionLines = [];

  // Draw connections from x402 agents to barter agents, and from firewall to payment
  const x402Agents = filteredAgents.filter(a => a.x402);
  const barterAgents = filteredAgents.filter(a => a.barter);
  const firewallAgents = filteredAgents.filter(a => a.kind === 'firewall');
  const paymentAgents = filteredAgents.filter(a => a.kind === 'payment').slice(0, 20);

  // x402 → barter connections
  x402Agents.forEach(a => {
    barterAgents.forEach(b => {
      if (a.name === b.name) return;
      const arc = createArc(a.position, b.position, 0x00d4ff, 0.4);
      if (arc) { scene.add(arc); connectionLines.push(arc); }
    });
  });

  // firewall → payment connections
  firewallAgents.forEach(a => {
    paymentAgents.forEach(b => {
      if (a.name === b.name) return;
      const arc = createArc(a.position, b.position, 0xff6b35, 0.3);
      if (arc) { scene.add(arc); connectionLines.push(arc); }
    });
  });
}

function createArc(p1, p2, color, opacity) {
  if (!p1 || !p2) return null;
  const mid = new THREE.Vector3().lerpVectors(p1, p2, 0.5);
  mid.normalize().multiplyScalar(PR * 1.3); // arc above the surface
  const curve = new THREE.QuadraticBezierCurve3(p1, mid, p2);
  const points = curve.getPoints(30);
  const geo = new THREE.BufferGeometry().setFromPoints(points);
  const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity, depthWrite: false });
  return new THREE.Line(geo, mat);
}

// ─── Interaction ─────────────────────────────────────────────────────────────
let isDragging = false, prevX = 0, prevY = 0;
let rotY = 0, rotX = 0, velY = 0.0005, velX = 0;
let camDist = 280, camDistTarget = 280;
let mouseOnGlobe = false, mouseSX = 0, mouseSY = 0;

function onPointerDown(e) { isDragging = true; prevX = e.clientX; prevY = e.clientY; }
function onPointerMove(e) {
  mouseSX = e.clientX; mouseSY = e.clientY; mouseOnGlobe = true;
  if (isDragging) {
    velY = (e.clientX - prevX) * 0.006; velX = (e.clientY - prevY) * 0.006;
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
  camDistTarget *= 1 + (e.deltaY > 0 ? 0.12 : -0.12);
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
    tt.innerHTML = `<div class="t-name">${a.name}</div><div class="t-meta">${a.regionLabel} · ${a.country} · ${a.kind}${a.x402?' · x402':''}${a.barter?' · barter':''}</div>`;
    tt.style.left = (mouseSX + 14) + 'px'; tt.style.top = (mouseSY + 14) + 'px';
    tt.classList.add('visible'); document.body.style.cursor = 'pointer';
  } else {
    hoveredIdx = -1; tt.classList.remove('visible'); document.body.style.cursor = 'default';
  }
}

function onClick() { if (hoveredIdx >= 0) showPanel(filteredAgents[hoveredIdx]); }

// ─── Agent detail panel ─────────────────────────────────────────────────────
function showPanel(a) {
  const kc = {firewall:'#ff6b35',payment:'#00d4ff',compute:'#a78bfa',directory:'#fbbf24',publisher:'#22c55e',bridge:'#ec4899',observer:'#f43f5e',consumer:'#94a3b8'};
  const color = kc[a.kind];
  const caps = [];
  if (a.x402) caps.push(`<span class="cap-tag" style="background:rgba(0,212,255,0.1);color:#00d4ff;border:1px solid rgba(0,212,255,0.3)">💰 x402 Payments</span>`);
  if (a.barter) caps.push(`<span class="cap-tag" style="background:rgba(255,107,53,0.1);color:#ff6b35;border:1px solid rgba(255,107,53,0.3)">🔁 Barter Accepted</span>`);
  if (a.agent_card) caps.push(`<span class="cap-tag" style="background:rgba(167,139,250,0.1);color:#a78bfa;border:1px solid rgba(167,139,250,0.3)">🪪 Agent Card</span>`);
  caps.push(`<span class="cap-tag" style="background:rgba(34,197,94,0.1);color:#22c55e;border:1px solid rgba(34,197,94,0.3)">📍 ${a.regionLabel}</span>`);

  const protocols = ['MCP']; if (a.x402) protocols.push('x402'); if (a.barter) protocols.push('Barter'); if (a.agent_card) protocols.push('A2A');
  const links = [];
  if (a.website) links.push(`<a class="link-item" href="${a.website}" target="_blank" rel="noopener">🌐 ${a.website}</a>`);
  if (a.repository) links.push(`<a class="link-item" href="${a.repository}" target="_blank" rel="noopener">📦 ${a.repository}</a>`);
  if (a.agent_card) links.push(`<a class="link-item" href="${a.agent_card}" target="_blank" rel="noopener">🪪 ${a.agent_card}</a>`);
  links.push(`<a class="link-item" href="https://registry.modelcontextprotocol.io/v0/servers?cursor=${encodeURIComponent(a.namespace)}&limit=20" target="_blank" rel="noopener">🔍 View in MCP Registry</a>`);

  // Connections: find related agents
  const nearby = agents.filter(x => x.name !== a.name).filter(x => {
    if (a.x402 && x.barter) return true;
    if (a.barter && x.x402) return true;
    if (x.kind === a.kind && x.country === a.country) return true;
    return false;
  }).slice(0, 10);
  const connectionsHTML = nearby.length ? `
    <div style="margin-top:16px">
      <h3 style="font-size:10px;text-transform:uppercase;letter-spacing:1.5px;color:var(--text-dim);margin-bottom:8px">Connected Agents (${nearby.length})</h3>
      ${nearby.map(x => `<div style="padding:6px 10px;margin-bottom:4px;background:rgba(255,255,255,0.03);border:1px solid rgba(100,130,180,0.15);border-radius:6px;font-size:11px;font-family:var(--mono);cursor:pointer;color:${kc[x.kind]||'#888'}" onclick="showPanelByName('${x.name.replace(/'/g,"\\'")}')">${x.name} <span style="float:right;opacity:0.5">${x.regionLabel}</span></div>`).join('')}
    </div>` : '';

  document.getElementById('panel-content').innerHTML = `
    <div class="kind-badge" style="background:${color};color:#000">${KIND_LABELS[a.kind] || a.kind}</div>
    <div class="agent-title">${a.name}</div>
    <div class="agent-version">v${a.version} · ${a.versions.length} versions</div>
    <div class="agent-desc">${a.description || '(no description)'}</div>
    <div class="agent-capabilities">${caps.join('')}</div>
    ${a.wallet ? `<div class="wallet-box"><div class="label">x402 Wallet (USDC)</div><div class="value">${a.wallet}</div></div>` : ''}
    <div class="info-grid">
      <div class="info-card"><div class="label">Type</div><div class="value">${a.kind}</div></div>
      <div class="info-card"><div class="label">Location</div><div class="value">${a.regionLabel}</div></div>
      <div class="info-card"><div class="label">Country</div><div class="value">${a.country}</div></div>
      <div class="info-card"><div class="label">Coordinates</div><div class="value">${a.lat.toFixed(2)}°, ${a.lon.toFixed(2)}°</div></div>
      <div class="info-card"><div class="label">Protocols</div><div class="value">${protocols.join(' + ')}</div></div>
      <div class="info-card"><div class="label">Versions</div><div class="value">${a.versions.length}</div></div>
      <div class="info-card"><div class="label">Namespace</div><div class="value">${a.namespace}</div></div>
      <div class="info-card"><div class="label">First seen</div><div class="value">${a.first_seen}</div></div>
    </div>
    <div class="link-list">${links.join('')}</div>
    <button onclick="flyToAgent(agents.find(a=>a.name==='${a.name.replace(/'/g,"\\'")}'))" style="width:100%;margin-top:12px;padding:10px;background:linear-gradient(135deg,#ff6b35,#00d4ff);color:#000;border:none;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;text-transform:uppercase;letter-spacing:1px">🎯 Fly to this agent</button>
    ${connectionsHTML}
  `;
  document.getElementById('panel-right').classList.add('open');
}

window.showPanelByName = function(name) { const a = agents.find(x => x.name === name); if (a) showPanel(a); };
function closePanel() { document.getElementById('panel-right').classList.remove('open'); }

// ─── Zoom to agent (Idea 1: click agent in panel → camera flies to it) ──────
let zoomTarget = null;
function flyToAgent(agent) {
  if (!agent.position) return;
  // Compute target rotation so the agent faces the camera
  const pos = agent.position.clone();
  // Undo current rotation to get the "world" position
  pos.applyAxisAngle(new THREE.Vector3(1, 0, 0), -rotX);
  pos.applyAxisAngle(new THREE.Vector3(0, 1, 0), -rotY);
  // Calculate the rotation needed to bring this point to the front
  const targetRotY = Math.atan2(pos.x, pos.z);
  const targetRotX = Math.atan2(pos.y, Math.sqrt(pos.x * pos.x + pos.z * pos.z));
  // Smoothly animate to this rotation
  zoomTarget = { rotY: -targetRotY, rotX: -targetRotX, dist: 140 };
}

// ─── Stats panel (Idea 3: real-time stats that update on filter) ────────────
function updateStatsPanel() {
  const total = filteredAgents.length;
  const byKind = {};
  filteredAgents.forEach(a => { byKind[a.kind] = (byKind[a.kind] || 0) + 1; });
  const byCountry = {};
  filteredAgents.forEach(a => { byCountry[a.country] = (byCountry[a.country] || 0) + 1; });
  const topCountries = Object.entries(byCountry).sort((a, b) => b[1] - a[1]).slice(0, 8);

  let html = `<div style="margin-bottom:12px;padding:10px;background:rgba(255,255,255,0.03);border-radius:8px">`;
  html += `<div style="font-size:11px;color:var(--text-dim);margin-bottom:6px">SHOWING ${total.toLocaleString()} AGENTS</div>`;
  html += `<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:8px">`;
  for (const [k, v] of Object.entries(byKind).sort((a, b) => b[1] - a[1])) {
    const color = '#' + KIND_COLORS[k].toString(16).padStart(6, '0');
    html += `<span style="font-size:10px;font-family:var(--mono);padding:2px 6px;border-radius:3px;background:${color}22;color:${color}">${k}: ${v}</span>`;
  }
  html += `</div>`;
  if (topCountries.length > 1) {
    html += `<div style="font-size:9px;color:var(--text-dim);margin-bottom:3px">TOP COUNTRIES</div>`;
    for (const [c, n] of topCountries) {
      const pct = (n / total * 100).toFixed(0);
      html += `<div style="display:flex;align-items:center;gap:6px;margin-bottom:2px">`;
      html += `<span style="font-size:10px;min-width:80px">${c}</span>`;
      html += `<div style="flex:1;height:4px;background:rgba(255,255,255,0.05);border-radius:2px;overflow:hidden">`;
      html += `<div style="width:${pct}%;height:100%;background:var(--accent-orange);border-radius:2px"></div>`;
      html += `</div>`;
      html += `<span style="font-size:9px;font-family:var(--mono);min-width:30px;text-align:right">${n}</span>`;
      html += `</div>`;
    }
  }
  html += `</div>`;
  const statsEl = document.getElementById('stats-panel');
  if (statsEl) statsEl.innerHTML = html;
}

// ─── Animation ──────────────────────────────────────────────────────────────
let pulseT = 0;
function animate() {
  requestAnimationFrame(animate);
  pulseT += 0.02;

  // Zoom-to-agent animation
  if (zoomTarget) {
    rotY += (zoomTarget.rotY - rotY) * 0.06;
    rotX += (zoomTarget.rotX - rotX) * 0.06;
    camDistTarget += (zoomTarget.dist - camDistTarget) * 0.06;
    if (Math.abs(zoomTarget.rotY - rotY) < 0.01 && Math.abs(zoomTarget.dist - camDistTarget) < 1) {
      zoomTarget = null;
    }
  }

  if (!isDragging && !zoomTarget) {
    if (!isPaused && !mouseOnGlobe) {
      rotY += velY; rotX += velX;
      velY = velY * 0.96 + 0.0005; velX *= 0.96;
    } else { velY *= 0.9; velX *= 0.9; }
  }

  camDist += (camDistTarget - camDist) * 0.1;

  scene.children.forEach(obj => {
    if (obj === pointsObj || obj === globe || obj instanceof THREE.Line || obj instanceof THREE.Points || obj instanceof THREE.Mesh) {
      obj.rotation.y = rotY; obj.rotation.x = rotX;
    }
  });

  // Pulse the connection lines
  connectionLines.forEach((l, i) => {
    if (l.material) l.material.opacity = 0.2 + Math.sin(pulseT + i * 0.5) * 0.15;
  });

  // Pulse the LED points (breathing effect)
  if (pointsObj && pointsObj.material) {
    pointsObj.material.size = 3.5 + Math.sin(pulseT) * 0.3;
  }

  // Animate satellites
  const satGroup = scene.userData.satellites;
  if (satGroup) {
    satGroup.children.forEach(child => {
      if (child instanceof THREE.Points && child.userData.orbitRadius) {
        const ud = child.userData;
        ud.phase += ud.speed;
        const x = ud.orbitRadius * Math.cos(ud.phase) * Math.cos(ud.inclination);
        const y = ud.orbitRadius * Math.sin(ud.inclination);
        const z = ud.orbitRadius * Math.sin(ud.phase) * Math.cos(ud.inclination);
        child.position.set(x, y, z);
      }
    });
    // Rotate satellite group with the globe
    satGroup.rotation.y = rotY;
    satGroup.rotation.x = rotX;
  }

  camera.position.z = camDist;
  renderer.render(scene, camera);
}

// ─── Init ───────────────────────────────────────────────────────────────────
window.addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight);
});

window.addEventListener('load', () => {
  initGlobe(); animate();
  const canvas = document.getElementById('globe-canvas');
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointerleave', onPointerLeave);
  canvas.addEventListener('wheel', onWheel, { passive: false });
  canvas.addEventListener('click', onClick);
  document.querySelectorAll('.filter-btn').forEach(btn => btn.addEventListener('click', () => applyFilter(btn.dataset.filter)));
  document.getElementById('search').addEventListener('input', () => applyFilter(activeFilter));
  document.getElementById('country-filter')?.addEventListener('change', () => applyFilter(activeFilter));
  document.getElementById('panel-close').addEventListener('click', closePanel);
  document.getElementById('toggle-sidebar').addEventListener('click', () => document.getElementById('sidebar-left').classList.toggle('collapsed'));
  document.getElementById('btn-pause').addEventListener('click', () => {
    isPaused = !isPaused;
    document.getElementById('btn-pause').textContent = isPaused ? '▶ Play' : '⏸ Pause';
  });
  loadAgents();
});
