/* Agent World Map — Globe Engine v9
 * - OPAQUE Earth (no see-through, no back lights)
 * - Auto-rotate ALWAYS, stop ONLY on click/drag (not hover)
 * - 15 real satellites with names (Starlink, ISS, GPS, etc.)
 * - Sharp bright LED points (normal blending, depth-correct)
 * - Country borders (Natural Earth)
 * - Fly-to-agent + stats panel
 */

// ─── Country TLDs → geographic region ────────────────────────────────────────
const COUNTRY_TLDS = {
  'ca.':{lat:56,lon:-106,spread:12,label:'Canada'},'mx.':{lat:24,lon:-102,spread:8,label:'Mexico'},
  'br.':{lat:-14,lon:-52,spread:12,label:'Brazil'},'ar.':{lat:-38,lon:-64,spread:8,label:'Argentina'},
  'cl.':{lat:-35,lon:-71,spread:6,label:'Chile'},
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

const SAT_DATA = [
  {name:'ISS (Zarya)', alt:1.3, incl:0.9, phase:0, speed:0.008, color:0xffffff},
  {name:'Starlink-3045', alt:1.4, incl:0.5, phase:1.2, speed:0.006, color:0x00d4ff},
  {name:'Starlink-4892', alt:1.42, incl:0.6, phase:2.4, speed:0.006, color:0x00d4ff},
  {name:'GPS IIF-12', alt:2.0, incl:0.3, phase:0.5, speed:0.003, color:0xff6b35},
  {name:'GPS III-5', alt:2.0, incl:0.4, phase:1.8, speed:0.003, color:0xff6b35},
  {name:'Sentinel-2B', alt:1.25, incl:1.1, phase:3.0, speed:0.007, color:0x22c55e},
  {name:'Sentinel-1A', alt:1.25, incl:1.1, phase:4.2, speed:0.007, color:0x22c55e},
  {name:'NOAA-20', alt:1.35, incl:0.95, phase:5.4, speed:0.006, color:0xfbbf24},
  {name:'Landsat-9', alt:1.25, incl:1.15, phase:0.3, speed:0.007, color:0xa78bfa},
  {name:'Terra', alt:1.25, incl:1.15, phase:1.5, speed:0.007, color:0xa78bfa},
  {name:'Aqua', alt:1.25, incl:1.15, phase:2.7, speed:0.007, color:0xa78bfa},
  {name:'Hubble', alt:1.25, incl:0.5, phase:3.9, speed:0.007, color:0xec4899},
  {name:'GOES-16', alt:3.5, incl:0.05, phase:0, speed:0.001, color:0xf43f5e},
  {name:'GOES-18', alt:3.5, incl:0.05, phase:3.14, speed:0.001, color:0xf43f5e},
  {name:'OneWeb-038', alt:1.5, incl:0.6, phase:2.1, speed:0.005, color:0x94a3b8},
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
  const h = hashString(name);
  const zone = GLOBAL_ZONES[h % GLOBAL_ZONES.length];
  const h2 = hashString(name + 'j');
  return { lat: zone[0] + ((h2 % 1000) / 1000 - 0.5) * 4,
           lon: zone[1] + ((hashString(name + 'l') % 1000) / 1000 - 0.5) * 4,
           label: 'Global', country: getCountryForZone(zone) };
}

function getCountryForZone(z) {
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
let activeFilter = 'all', hoveredIdx = -1;
let isPaused = false;  // only stops on click, NOT on hover
let earthTexture;

const R = 100, PR = R * 1.006;

function ledTexture() {
  const c = document.createElement('canvas');
  c.width = 64; c.height = 64;
  const ctx = c.getContext('2d');
  // Sharp bright dot: white center → tight glow → nothing
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 20);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.3, 'rgba(255,255,255,0.8)');
  g.addColorStop(0.6, 'rgba(255,255,255,0.2)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

function initGlobe() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x050810);
  scene.fog = new THREE.Fog(0x050810, 300, 800);

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

  // ── Globe: REAL Earth, OPAQUE ─────────────────────────────────────────────
  const globeGeo = new THREE.SphereGeometry(R, 128, 128);
  globe = new THREE.Mesh(globeGeo, new THREE.MeshPhongMaterial({
    map: earthDay, bumpMap: earthBump, bumpScale: 0.8,
    specularMap: earthSpec, specular: new THREE.Color(0x4488bb),
    shininess: 30, transparent: false, side: THREE.FrontSide,
  }));
  scene.add(globe);

  // Cloud layer
  const cloudTex = texLoader.load('assets/clouds.png');
  const cloudGeo = new THREE.SphereGeometry(R * 1.008, 64, 64);
  scene.add(new THREE.Mesh(cloudGeo, new THREE.MeshPhongMaterial({
    map: cloudTex, transparent: true, opacity: 0.2, depthWrite: false,
    blending: THREE.NormalBlending,
  })));

  // Atmosphere glow
  const atmGeo = new THREE.SphereGeometry(R * 1.12, 64, 64);
  scene.add(new THREE.Mesh(atmGeo, new THREE.ShaderMaterial({
    uniforms: { c: { value: new THREE.Color(0x4080c0) }, p: { value: 4.0 } },
    vertexShader: `varying vec3 vNormal; void main() { vNormal = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `uniform vec3 c; uniform float p; varying vec3 vNormal; void main() { float i = pow(0.6 - dot(vNormal, vec3(0.0, 0.0, 1.0)), p); gl_FragColor = vec4(c, 1.0) * i; }`,
    side: THREE.BackSide, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false,
  })));

  // ── Country border lines ──────────────────────────────────────────────────
  fetch('data/borders.json').then(r => r.json()).then(borders => {
    const bm = new THREE.LineBasicMaterial({ color: 0x5a7a9a, transparent: true, opacity: 0.35, depthWrite: false });
    borders.forEach(bl => {
      const pts = bl.map(([lat, lon]) => latLonToVec3(lat, lon, R * 1.002));
      if (pts.length > 1) scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), bm));
    });
  });

  // ── Satellites (real names, 3D orbits) ────────────────────────────────────
  const satGroup = new THREE.Group();
  const ledTex = ledTexture();
  SAT_DATA.forEach(sat => {
    const orbitR = R * sat.alt;
    // Orbit ring (visible)
    const trailPts = [];
    for (let a = 0; a < Math.PI * 2; a += 0.03) {
      let x = orbitR * Math.cos(a), z = orbitR * Math.sin(a), y = 0;
      const y1 = y * Math.cos(sat.incl) - z * Math.sin(sat.incl);
      const z1 = y * Math.sin(sat.incl) + z * Math.cos(sat.incl);
      trailPts.push(new THREE.Vector3(x, y1, z1));
    }
    satGroup.add(new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(trailPts),
      new THREE.LineBasicMaterial({ color: sat.color, transparent: true, opacity: 0.2, depthWrite: false })
    ));

    // Satellite point (BRIGHT, always visible)
    const sg = new THREE.BufferGeometry();
    sg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(3), 3));
    const pm = new THREE.PointsMaterial({
      color: sat.color, size: 5, sizeAttenuation: true,
      transparent: true, opacity: 1.0, map: ledTex,
      alphaTest: 0.01, blending: THREE.AdditiveBlending,
      depthWrite: false, depthTest: false,  // always visible (even behind globe)
    });
    const satPoint = new THREE.Points(sg, pm);
    satPoint.userData = { orbitR, incl: sat.incl, phase: sat.phase, speed: sat.speed, name: sat.name };
    satGroup.add(satPoint);
  });
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
               lat: region.lat, lon: region.lon, position: latLonToVec3(region.lat, region.lon, PR) };
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
    const countrySet = new Set(agents.map(a => a.country).filter(c => c && c !== 'Global'));
    const sortedCountries = [...countrySet].sort();
    const cs = document.getElementById('country-filter');
    if (cs) sortedCountries.forEach(c => { const o = document.createElement('option'); o.value = c; o.textContent = c; cs.appendChild(o); });
    document.getElementById('footer-text').textContent = `${total} agents · ${data.total_versions} versions · ${countries.size} countries · ${data.scan_time} · registry.modelcontextprotocol.io`;
    document.getElementById('loader').classList.add('hidden');
    applyFilter('all');
  });
}

function applyFilter(filter) {
  activeFilter = filter;
  document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.filter === filter));
  const search = document.getElementById('search').value.toLowerCase();
  const countryFilter = document.getElementById('country-filter')?.value || '';
  if (filter === 'all') filteredAgents = agents;
  else if (filter === 'x402') filteredAgents = agents.filter(a => a.x402);
  else if (filter === 'barter') filteredAgents = agents.filter(a => a.barter);
  else filteredAgents = agents.filter(a => a.kind === filter);
  if (search) filteredAgents = filteredAgents.filter(a =>
    a.name.toLowerCase().includes(search) || a.description.toLowerCase().includes(search) ||
    a.namespace.toLowerCase().includes(search) || a.regionLabel.toLowerCase().includes(search));
  if (countryFilter) filteredAgents = filteredAgents.filter(a => a.country === countryFilter);
  renderPoints(); renderConnections();
  document.getElementById('stat-total').textContent = filteredAgents.length.toLocaleString();
  updateStatsPanel();
}

// ─── Point rendering — bright LED spheres with proper depth occlusion ────────
// Uses InstancedMesh with small glowing spheres — respects depth perfectly,
// no see-through, and looks like bright LED dots (not dim 80s pixels)
let pointsInstanced = null;
function renderPoints() {
  if (pointsInstanced) { scene.remove(pointsInstanced); pointsInstanced.geometry.dispose(); pointsInstanced.material.dispose(); }
  if (!filteredAgents.length) return;
  const N = filteredAgents.length;
  // Small sphere geometry — looks like a bright LED dot
  const sphereGeo = new THREE.SphereGeometry(0.8, 6, 6);
  const mat = new THREE.MeshBasicMaterial({ vertexColors: false });
  pointsInstanced = new THREE.InstancedMesh(sphereGeo, mat, N);
  pointsInstanced.userData.agents = filteredAgents;

  const dummy = new THREE.Object3D();
  const color = new THREE.Color();
  for (let i = 0; i < N; i++) {
    const a = filteredAgents[i];
    dummy.position.copy(a.position);
    // Size: base + x402/barter boost
    let s = 0.5 + Math.log2((a.versions?.length || 1) + 1) * 0.1;
    if (a.x402) s += 0.5;
    if (a.barter) s += 0.8;
    dummy.scale.setScalar(s);
    dummy.updateMatrix();
    pointsInstanced.setMatrixAt(i, dummy.matrix);

    // Bright vibrant colors — NOT dim
    color.setHex(KIND_COLORS[a.kind] || 0xffffff);
    if (a.x402) color.multiplyScalar(1.5);
    if (a.barter) color.multiplyScalar(2.0);
    pointsInstanced.setColorAt(i, color);
  }
  pointsInstanced.instanceMatrix.needsUpdate = true;
  pointsInstanced.instanceColor.needsUpdate = true;
  scene.add(pointsInstanced);
  // Keep reference for raycasting
  pointsObj = pointsInstanced;
}

// ─── Connection arcs ──────────────────────────────────────────────────────────
function renderConnections() {
  connectionLines.forEach(l => { scene.remove(l); l.geometry.dispose(); l.material.dispose(); });
  connectionLines = [];
  const x402A = filteredAgents.filter(a => a.x402);
  const barterA = filteredAgents.filter(a => a.barter);
  const fwA = filteredAgents.filter(a => a.kind === 'firewall');
  const payA = filteredAgents.filter(a => a.kind === 'payment').slice(0, 20);
  x402A.forEach(a => barterA.forEach(b => { if (a.name !== b.name) { const ar = createArc(a.position, b.position, 0x00d4ff, 0.4); if (ar) { scene.add(ar); connectionLines.push(ar); } } }));
  fwA.forEach(a => payA.forEach(b => { if (a.name !== b.name) { const ar = createArc(a.position, b.position, 0xff6b35, 0.3); if (ar) { scene.add(ar); connectionLines.push(ar); } } }));
}
function createArc(p1, p2, color, opacity) {
  if (!p1 || !p2) return null;
  const mid = new THREE.Vector3().lerpVectors(p1, p2, 0.5);
  mid.normalize().multiplyScalar(PR * 1.3);
  const curve = new THREE.QuadraticBezierCurve3(p1, mid, p2);
  const pts = curve.getPoints(30);
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  return new THREE.Line(geo, new THREE.LineBasicMaterial({ color, transparent: true, opacity, depthWrite: false }));
}

// ─── Interaction ─────────────────────────────────────────────────────────────
let isDragging = false, prevX = 0, prevY = 0;
let rotY = 0, rotX = 0, velY = 0.0003, velX = 0;
let camDist = 280, camDistTarget = 280;
let mouseSX = 0, mouseSY = 0;

function onPointerDown(e) { isDragging = true; prevX = e.clientX; prevY = e.clientY; }
function onPointerMove(e) {
  mouseSX = e.clientX; mouseSY = e.clientY;
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
function onPointerUp() { isDragging = false; }
function onPointerLeave() { isDragging = false; }
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
  } else { hoveredIdx = -1; tt.classList.remove('visible'); document.body.style.cursor = 'default'; }
}
function onClick() { if (hoveredIdx >= 0) { showPanel(filteredAgents[hoveredIdx]); } else { isPaused = !isPaused; document.getElementById('btn-pause').textContent = isPaused ? '▶ Play' : '⏸ Pause'; } }

// ─── Agent panel ─────────────────────────────────────────────────────────────
function showPanel(a) {
  const kc = {firewall:'#ff6b35',payment:'#00d4ff',compute:'#a78bfa',directory:'#fbbf24',publisher:'#22c55e',bridge:'#ec4899',observer:'#f43f5e',consumer:'#94a3b8'};
  const color = kc[a.kind];
  const caps = [];
  if (a.x402) caps.push(`<span class="cap-tag" style="background:rgba(0,212,255,0.1);color:#00d4ff;border:1px solid rgba(0,212,255,0.3)">💰 x402</span>`);
  if (a.barter) caps.push(`<span class="cap-tag" style="background:rgba(255,107,53,0.1);color:#ff6b35;border:1px solid rgba(255,107,53,0.3)">🔁 Barter</span>`);
  if (a.agent_card) caps.push(`<span class="cap-tag" style="background:rgba(167,139,250,0.1);color:#a78bfa;border:1px solid rgba(167,139,250,0.3)">🪪 Agent Card</span>`);
  caps.push(`<span class="cap-tag" style="background:rgba(34,197,94,0.1);color:#22c55e;border:1px solid rgba(34,197,94,0.3)">📍 ${a.regionLabel}</span>`);
  const protocols = ['MCP']; if (a.x402) protocols.push('x402'); if (a.barter) protocols.push('Barter'); if (a.agent_card) protocols.push('A2A');
  const links = [];
  if (a.website) links.push(`<a class="link-item" href="${a.website}" target="_blank" rel="noopener">🌐 ${a.website}</a>`);
  if (a.repository) links.push(`<a class="link-item" href="${a.repository}" target="_blank" rel="noopener">📦 ${a.repository}</a>`);
  if (a.agent_card) links.push(`<a class="link-item" href="${a.agent_card}" target="_blank" rel="noopener">🪪 ${a.agent_card}</a>`);
  links.push(`<a class="link-item" href="https://registry.modelcontextprotocol.io/v0/servers?cursor=${encodeURIComponent(a.namespace)}&limit=20" target="_blank" rel="noopener">🔍 MCP Registry</a>`);
  const nearby = agents.filter(x => x.name !== a.name).filter(x => {
    if (a.x402 && x.barter) return true; if (a.barter && x.x402) return true;
    if (x.kind === a.kind && x.country === a.country) return true; return false;
  }).slice(0, 10);
  const connectionsHTML = nearby.length ? `<div style="margin-top:16px"><h3 style="font-size:10px;text-transform:uppercase;letter-spacing:1.5px;color:var(--text-dim);margin-bottom:8px">Connected Agents (${nearby.length})</h3>${nearby.map(x => `<div style="padding:6px 10px;margin-bottom:4px;background:rgba(255,255,255,0.03);border:1px solid rgba(100,130,180,0.15);border-radius:6px;font-size:11px;font-family:var(--mono);cursor:pointer;color:${kc[x.kind]||'#888'}" onclick="showPanelByName('${x.name.replace(/'/g,"\\'")}')">${x.name} <span style="float:right;opacity:0.5">${x.regionLabel}</span></div>`).join('')}</div>` : '';
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
    <button onclick="flyToAgentByName('${a.name.replace(/'/g,"\\'")}')" style="width:100%;margin-top:12px;padding:10px;background:linear-gradient(135deg,#ff6b35,#00d4ff);color:#000;border:none;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;text-transform:uppercase;letter-spacing:1px">🎯 Fly to this agent</button>
    ${connectionsHTML}
  `;
  document.getElementById('panel-right').classList.add('open');
}

window.showPanelByName = function(name) { const a = agents.find(x => x.name === name); if (a) showPanel(a); };
window.flyToAgentByName = function(name) { const a = agents.find(x => x.name === name); if (a) flyToAgent(a); };
function closePanel() { document.getElementById('panel-right').classList.remove('open'); }

let zoomTarget = null;
function flyToAgent(agent) {
  if (!agent.position) return;
  const pos = agent.position.clone();
  pos.applyAxisAngle(new THREE.Vector3(1, 0, 0), -rotX);
  pos.applyAxisAngle(new THREE.Vector3(0, 1, 0), -rotY);
  const targetRotY = Math.atan2(pos.x, pos.z);
  const targetRotX = Math.atan2(pos.y, Math.sqrt(pos.x * pos.x + pos.z * pos.z));
  zoomTarget = { rotY: -targetRotY, rotX: -targetRotX, dist: 140 };
}

function updateStatsPanel() {
  const total = filteredAgents.length;
  const byKind = {}, byCountry = {};
  filteredAgents.forEach(a => { byKind[a.kind] = (byKind[a.kind] || 0) + 1; byCountry[a.country] = (byCountry[a.country] || 0) + 1; });
  const tc = Object.entries(byCountry).sort((a, b) => b[1] - a[1]).slice(0, 8);
  let h = `<div style="margin-bottom:12px;padding:10px;background:rgba(255,255,255,0.03);border-radius:8px"><div style="font-size:11px;color:var(--text-dim);margin-bottom:6px">SHOWING ${total.toLocaleString()} AGENTS</div><div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:8px">`;
  for (const [k, v] of Object.entries(byKind).sort((a, b) => b[1] - a[1])) { const c = '#' + KIND_COLORS[k].toString(16).padStart(6, '0'); h += `<span style="font-size:10px;font-family:var(--mono);padding:2px 6px;border-radius:3px;background:${c}22;color:${c}">${k}: ${v}</span>`; }
  h += `</div>`;
  if (tc.length > 1) { h += `<div style="font-size:9px;color:var(--text-dim);margin-bottom:3px">TOP COUNTRIES</div>`; for (const [c, n] of tc) { const p = (n / total * 100).toFixed(0); h += `<div style="display:flex;align-items:center;gap:6px;margin-bottom:2px"><span style="font-size:10px;min-width:80px">${c}</span><div style="flex:1;height:4px;background:rgba(255,255,255,0.05);border-radius:2px;overflow:hidden"><div style="width:${p}%;height:100%;background:#ff6b35;border-radius:2px"></div></div><span style="font-size:9px;font-family:var(--mono);min-width:30px;text-align:right">${n}</span></div>`; } }
  h += `</div>`;
  const el = document.getElementById('stats-panel'); if (el) el.innerHTML = h;
}

// ─── Animation ──────────────────────────────────────────────────────────────
let pulseT = 0;
function animate() {
  requestAnimationFrame(animate);
  pulseT += 0.02;
  if (zoomTarget) {
    rotY += (zoomTarget.rotY - rotY) * 0.06; rotX += (zoomTarget.rotX - rotX) * 0.06;
    camDistTarget += (zoomTarget.dist - camDistTarget) * 0.06;
    if (Math.abs(zoomTarget.rotY - rotY) < 0.01 && Math.abs(zoomTarget.dist - camDistTarget) < 1) zoomTarget = null;
  }
  if (!isDragging && !zoomTarget) {
    if (!isPaused) {
      rotY += velY; rotX += velX;
      velY = velY * 0.96 + 0.0003; velX *= 0.96;
    } else { velY *= 0.9; velX *= 0.9; }
  }
  camDist += (camDistTarget - camDist) * 0.1;
  scene.children.forEach(obj => {
    if (obj === pointsObj || obj === globe || obj instanceof THREE.Line || obj instanceof THREE.Points || obj instanceof THREE.Mesh) { obj.rotation.y = rotY; obj.rotation.x = rotX; }
  });
  connectionLines.forEach((l, i) => { if (l.material) l.material.opacity = 0.2 + Math.sin(pulseT + i * 0.5) * 0.15; });
  // Pulse the LED spheres
  if (pointsInstanced) {
    const dummy = new THREE.Object3D();
    const baseScale = 1 + Math.sin(pulseT) * 0.1;
    for (let i = 0; i < filteredAgents.length; i++) {
      pointsInstanced.getMatrixAt(i, dummy.matrix);
      dummy.decompose(dummy.position, dummy.quaternion, dummy.scale);
      let s = 0.5 + Math.log2((filteredAgents[i].versions?.length || 1) + 1) * 0.1;
      if (filteredAgents[i].x402) s += 0.5;
      if (filteredAgents[i].barter) s += 0.8;
      dummy.scale.setScalar(s * baseScale);
      dummy.updateMatrix();
      pointsInstanced.setMatrixAt(i, dummy.matrix);
    }
    pointsInstanced.instanceMatrix.needsUpdate = true;
  }
  // Animate satellites
  const sg = scene.userData.satellites;
  if (sg) {
    sg.children.forEach(child => {
      if (child instanceof THREE.Points && child.userData.orbitR) {
        const u = child.userData; u.phase += u.speed;
        let x = u.orbitR * Math.cos(u.phase), z = u.orbitR * Math.sin(u.phase), y = 0;
        const y1 = y * Math.cos(u.incl) - z * Math.sin(u.incl);
        const z1 = y * Math.sin(u.incl) + z * Math.cos(u.incl);
        child.position.set(x, y1, z1);
      }
    });
    sg.rotation.y = rotY; sg.rotation.x = rotX;
  }
  camera.position.z = camDist;
  renderer.render(scene, camera);
}

// ─── Init ───────────────────────────────────────────────────────────────────
window.addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });
window.addEventListener('load', () => {
  initGlobe(); animate();
  const canvas = document.getElementById('globe-canvas');
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointerleave', onPointerLeave);
  canvas.addEventListener('wheel', onWheel, { passive: false });
  canvas.addEventListener('click', onClick);
  document.querySelectorAll('.filter-btn').forEach(btn => btn.addEventListener('click', () => { applyFilter(btn.dataset.filter); if (window.innerWidth <= 768) document.getElementById('sidebar-left').classList.add('collapsed'); }));
  document.getElementById('search').addEventListener('input', () => applyFilter(activeFilter));
  document.getElementById('country-filter')?.addEventListener('change', () => applyFilter(activeFilter));
  document.getElementById('panel-close').addEventListener('click', closePanel);
  document.getElementById('toggle-sidebar').addEventListener('click', () => document.getElementById('sidebar-left').classList.toggle('collapsed'));
  document.getElementById('mobile-menu-btn').addEventListener('click', () => document.getElementById('sidebar-left').classList.toggle('collapsed'));
  // Auto-collapse sidebar on mobile + on point click
  if (window.innerWidth <= 768) document.getElementById('sidebar-left').classList.add('collapsed');
  document.getElementById('btn-pause').addEventListener('click', () => { isPaused = !isPaused; document.getElementById('btn-pause').textContent = isPaused ? '▶ Play' : '⏸ Pause'; });
  loadAgents();
});
