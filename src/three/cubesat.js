import * as THREE from 'three';

// 1U CubeSat built from primitives. Units: 1 = 10 cm.
// Every part has an assembled height plus two explode offsets:
// `lift` (top plate rises, board stack leaves the frame) and `spread` (gaps open up).
const W = 1;
const H = 1.1;

function rng(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function canvasTexture(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

function chamferRect(w, h, c) {
  const s = new THREE.Shape();
  const x = w / 2, y = h / 2;
  s.moveTo(-x + c, -y); s.lineTo(x - c, -y); s.lineTo(x, -y + c); s.lineTo(x, y - c);
  s.lineTo(x - c, y); s.lineTo(-x + c, y); s.lineTo(-x, y - c); s.lineTo(-x, -y + c);
  s.closePath();
  return s;
}

function rectPath(w, h) {
  const p = new THREE.Path();
  p.moveTo(-w / 2, -h / 2); p.lineTo(-w / 2, h / 2); p.lineTo(w / 2, h / 2); p.lineTo(w / 2, -h / 2);
  p.closePath();
  return p;
}

function circlePath(x, y, r) {
  const p = new THREE.Path();
  p.absarc(x, y, r, 0, Math.PI * 2, true);
  return p;
}

// Planar UVs normalised to the geometry's xy bounds (for shape caps).
function fitUV(geo) {
  geo.computeBoundingBox();
  const b = geo.boundingBox, p = geo.attributes.position, uv = geo.attributes.uv;
  for (let i = 0; i < p.count; i++) {
    uv.setXY(i, (p.getX(i) - b.min.x) / (b.max.x - b.min.x), (p.getY(i) - b.min.y) / (b.max.y - b.min.y));
  }
  uv.needsUpdate = true;
  return geo;
}

// Horizontal slab from a shape: extruded upward from y = 0.
function slab(shape, depth) {
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 24 });
  fitUV(g);
  g.rotateX(-Math.PI / 2);
  return g;
}

function cellTexture() {
  return canvasTexture(512, 512, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, w, h);
    gr.addColorStop(0, '#2a5ff0');
    gr.addColorStop(0.5, '#1a44c4');
    gr.addColorStop(1, '#10298a');
    g.fillStyle = gr;
    g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(170,200,255,.5)';
    g.lineWidth = 1.4;
    for (let y = 6; y < h; y += 13) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
    g.strokeStyle = 'rgba(235,240,255,.95)';
    g.lineWidth = 6;
    for (const x of [w * 0.34, w * 0.66]) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
    g.strokeStyle = 'rgba(235,240,255,.7)';
    g.lineWidth = 10;
    g.strokeRect(0, 0, w, h);
  });
}

function boardTexture(base, seed) {
  const r = rng(seed);
  return canvasTexture(1024, 1024, (g, w) => {
    g.fillStyle = base;
    g.fillRect(0, 0, w, w);
    g.lineCap = 'round';
    for (let i = 0; i < 90; i++) {
      g.strokeStyle = `rgba(255,255,255,${0.05 + r() * 0.08})`;
      g.lineWidth = 2 + r() * 4;
      let x = r() * w, y = r() * w;
      g.beginPath(); g.moveTo(x, y);
      for (let k = 0; k < 3; k++) {
        if (k % 2) y += (r() - 0.5) * 500; else x += (r() - 0.5) * 500;
        g.lineTo(x, y);
      }
      g.stroke();
    }
    g.fillStyle = '#d9b46a';
    for (let i = 0; i < 260; i++) g.fillRect(r() * w, r() * w, 6 + r() * 10, 6 + r() * 6);
    g.strokeStyle = 'rgba(255,255,255,.75)';
    g.lineWidth = 3;
    for (let i = 0; i < 16; i++) g.strokeRect(r() * w * 0.85, r() * w * 0.85, 40 + r() * 120, 30 + r() * 80);
    g.fillStyle = '#d9b46a';
    const k = w / 0.86;
    for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      g.beginPath(); g.arc(w / 2 + sx * 0.36 * k, w / 2 + sz * 0.36 * k, 0.045 * k, 0, Math.PI * 2); g.fill();
    }
  });
}

function makeMaterials() {
  return {
    alu: new THREE.MeshStandardMaterial({ color: '#bfc3ca', metalness: 1, roughness: 0.3 }),
    rail: new THREE.MeshStandardMaterial({ color: '#aeb2b9', metalness: 1, roughness: 0.2 }),
    brushed: new THREE.MeshStandardMaterial({ color: '#b8bcc3', metalness: 1, roughness: 0.42 }),
    gold: new THREE.MeshStandardMaterial({ color: '#86652f', metalness: 1, roughness: 0.28, side: THREE.DoubleSide }),
    brass: new THREE.MeshStandardMaterial({ color: '#d7b25e', metalness: 1, roughness: 0.25 }),
    black: new THREE.MeshStandardMaterial({ color: '#0c0d10', metalness: 0.3, roughness: 0.45 }),
    chip: new THREE.MeshStandardMaterial({ color: '#16171b', metalness: 0.2, roughness: 0.3 }),
    white: new THREE.MeshStandardMaterial({ color: '#e9e8e3', metalness: 0, roughness: 0.4 }),
    toroid: new THREE.MeshStandardMaterial({ color: '#e7b81c', metalness: 0.15, roughness: 0.35 }),
    copper: new THREE.MeshStandardMaterial({ color: '#b8642f', metalness: 1, roughness: 0.3 }),
    orange: new THREE.MeshStandardMaterial({ color: '#e0782a', metalness: 0.4, roughness: 0.3 }),
    lens: new THREE.MeshPhysicalMaterial({ color: '#0a1230', metalness: 0.2, roughness: 0.02, clearcoat: 1, envMapIntensity: 2.5 }),
    glass: new THREE.MeshPhysicalMaterial({ color: '#0b1020', metalness: 0, roughness: 0.04, transparent: true, opacity: 0.42, envMapIntensity: 2.4, depthWrite: false }),
    cell: new THREE.MeshPhysicalMaterial({ map: cellTexture(), metalness: 0.05, roughness: 0.35, clearcoat: 0.5, clearcoatRoughness: 0.1, envMapIntensity: 0.55 }),
    substrate: new THREE.MeshStandardMaterial({ color: '#08090c', metalness: 0.4, roughness: 0.25 }),
    pcbEdge: new THREE.MeshStandardMaterial({ color: '#1b2a1f', roughness: 0.6 }),
    green: new THREE.MeshStandardMaterial({ color: '#244a2d', metalness: 0.1, roughness: 0.5 }),
  };
}

function screw(m, len = 0.08) {
  const g = new THREE.Group();
  const head = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.024, 20), m.alu);
  head.position.y = len + 0.012;
  const socket = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.005, 6), m.black);
  socket.position.y = len + 0.0245;
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, len, 10), m.brushed);
  shaft.position.y = len / 2;
  g.add(head, socket, shaft);
  return g;
}

// Solar cell lying in the local XY plane, facing +Z.
function cell(m, w, h) {
  const geo = fitUV(new THREE.ShapeGeometry(chamferRect(w, h, Math.min(w, h) * 0.12)));
  return new THREE.Mesh(geo, m.cell);
}

// One side of the frame, built facing +Z and rotated into place.
function sideFace(m, solar) {
  const g = new THREE.Group();
  const ow = W - 0.03, oh = H - 0.03, iw = W - 0.2, ih = H - 0.22;
  const shape = chamferRect(ow, oh, 0.0);
  shape.holes.push(rectPath(iw, ih));
  const plate = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 0.022, bevelEnabled: false }), m.alu);
  plate.position.z = W / 2 - 0.03;
  g.add(plate);
  // Inner lip that makes the window read as a machined pocket
  const lipShape = chamferRect(iw + 0.04, ih + 0.04, 0);
  lipShape.holes.push(rectPath(iw, ih));
  const lip = new THREE.Mesh(new THREE.ExtrudeGeometry(lipShape, { depth: 0.02, bevelEnabled: false }), m.rail);
  lip.position.z = W / 2 - 0.012;
  g.add(lip);
  if (solar) {
    const sub = new THREE.Mesh(new THREE.PlaneGeometry(iw + 0.02, ih + 0.02), m.substrate);
    sub.position.z = W / 2 - 0.015;
    g.add(sub);
    for (const y of [-1, 1]) {
      const c = cell(m, iw - 0.03, ih / 2 - 0.03);
      c.position.set(0, y * ih / 4, W / 2 - 0.012);
      g.add(c);
    }
  } else {
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(iw + 0.02, ih + 0.02), m.glass);
    glass.position.z = W / 2 - 0.016;
    glass.renderOrder = 2;
    g.add(glass);
  }
  return g;
}

function frame(m) {
  const g = new THREE.Group();
  const railGeo = new THREE.BoxGeometry(0.075, H, 0.075);
  const footGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.05, 14);
  const o = W / 2 - 0.0375;
  for (const [x, z] of [[-o, -o], [o, -o], [o, o], [-o, o]]) {
    const rail = new THREE.Mesh(railGeo, m.rail);
    rail.position.set(x, 0, z);
    g.add(rail);
    for (const y of [-1, 1]) {
      const foot = new THREE.Mesh(footGeo, m.brushed);
      foot.position.set(x, y * (H / 2 + 0.02), z);
      g.add(foot);
    }
  }
  // Faces: +Z and +X carry cells, -Z and -X are windows into the bay
  const faces = [[0, true], [Math.PI / 2, true], [Math.PI, false], [-Math.PI / 2, false]];
  for (const [ry, solar] of faces) {
    const f = sideFace(m, solar);
    f.rotation.y = ry;
    g.add(f);
  }
  // Rings at top and bottom tie the rails together
  const ring = chamferRect(W, W, 0.04);
  ring.holes.push(rectPath(W - 0.14, W - 0.14));
  for (const y of [-H / 2, H / 2 - 0.03]) {
    const r = new THREE.Mesh(slab(ring, 0.03), m.rail);
    r.position.y = y;
    g.add(r);
  }
  // Sun sensors: tiny dark windows on the solar faces
  for (const ry of [0, Math.PI / 2]) {
    const s = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.03, 0.012), m.black);
    s.position.set(0, -H / 2 + 0.055, W / 2 - 0.006);
    const p = new THREE.Group(); p.rotation.y = ry; p.add(s); g.add(p);
  }
  return g;
}

// Tape antenna: a bronze tape spring (shallow C cross-section) starting at x = 0.
// The curve keeps it readable edge-on, like the real thing.
function antennaStrip(m, len) {
  const w = 0.046, sag = 0.014, t = 0.004, n = 12;
  const s = new THREE.Shape();
  for (let i = 0; i <= n; i++) {
    const z = -w / 2 + (w * i) / n;
    const y = sag * (1 - (2 * z / w) ** 2);
    i ? s.lineTo(z, y) : s.moveTo(z, y);
  }
  for (let i = n; i >= 0; i--) {
    const z = -w / 2 + (w * i) / n;
    s.lineTo(z, sag * (1 - (2 * z / w) ** 2) - t);
  }
  s.closePath();
  const geo = new THREE.ExtrudeGeometry(s, { depth: len, bevelEnabled: false, steps: 1 });
  geo.rotateY(Math.PI / 2);
  geo.computeVertexNormals();
  return new THREE.Mesh(geo, m.gold);
}

function topPlate(m) {
  const g = new THREE.Group();
  const s = chamferRect(W - 0.01, W - 0.01, 0.05);
  s.holes.push(circlePath(0, 0, 0.075));
  const plate = new THREE.Mesh(slab(s, 0.035), m.alu);
  g.add(plate);
  // Cells either side of the antenna deployer
  const sub = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.008, 0.86), m.substrate);
  sub.position.y = 0.039;
  g.add(sub);
  for (const x of [-1, 1]) {
    const c = cell(m, 0.26, 0.78);
    c.rotation.x = -Math.PI / 2;
    c.position.set(x * 0.28, 0.044, 0);
    g.add(c);
  }
  // Deployer housing: dark block, burn-wire puck, four tape antennas
  const box = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.05, 0.24), m.black);
  box.position.y = 0.06;
  g.add(box);
  const puck = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.03, 32), m.rail);
  puck.position.y = 0.095;
  g.add(puck);
  const hole = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.031, 24), m.black);
  hole.position.y = 0.096;
  g.add(hole);
  // Four wings in a pinwheel: each is bolted to one corner by a slotted
  // aluminium bracket and runs along that edge, out past the corner.
  const h = (W - 0.01) / 2;
  const holeGeo = new THREE.CylinderGeometry(0.0065, 0.0065, 0.003, 12);
  holeGeo.rotateX(Math.PI / 2);
  const strips = [];
  for (let i = 0; i < 4; i++) {
    const a = new THREE.Group();
    a.rotation.y = (i * Math.PI) / 2;
    const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.035, 0.018), m.rail);
    bracket.position.set(h - 0.08, 0.0175, h + 0.009);
    a.add(bracket);
    for (const x of [-0.2, -0.08, 0.04]) {
      const hole = new THREE.Mesh(holeGeo, m.black);
      hole.position.set(h + x, 0.0175, h + 0.0185);
      a.add(hole);
    }
    const st = antennaStrip(m, 1.7);
    st.position.set(h + 0.04, 0.026, h + 0.014);
    a.add(st);
    g.add(a);
    strips.push(st);
  }
  return { group: g, strips };
}

function bottomPlate(m) {
  const g = new THREE.Group();
  const s = chamferRect(W - 0.01, W - 0.01, 0.05);
  for (const [x, z] of [[-0.36, -0.36], [0.36, -0.36], [0.36, 0.36], [-0.36, 0.36]]) s.holes.push(circlePath(x, z, 0.02));
  s.holes.push(rectPath(0.3, 0.14));
  const plate = new THREE.Mesh(slab(s, 0.035), m.brushed);
  g.add(plate);
  const rim = chamferRect(W - 0.01, W - 0.01, 0.05);
  rim.holes.push(rectPath(W - 0.12, W - 0.12));
  const r = new THREE.Mesh(slab(rim, 0.06), m.alu);
  g.add(r);
  return g;
}

function header(m, len, rows = 2) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(len, 0.05, 0.03 * rows + 0.02), m.black);
  body.position.y = 0.025;
  g.add(body);
  const n = Math.round(len / 0.022);
  const pins = new THREE.InstancedMesh(new THREE.BoxGeometry(0.008, 0.03, 0.008), m.brass, n * rows);
  const d = new THREE.Object3D();
  let k = 0;
  for (let r = 0; r < rows; r++) {
    for (let i = 0; i < n; i++) {
      d.position.set(-len / 2 + 0.011 + i * 0.022, 0.06, (r - (rows - 1) / 2) * 0.03);
      d.updateMatrix();
      pins.setMatrixAt(k++, d.matrix);
    }
  }
  g.add(pins);
  return g;
}

function chips(m, r, n, area) {
  const g = new THREE.Group();
  for (let i = 0; i < n; i++) {
    const w = 0.03 + r() * 0.08, d = 0.03 + r() * 0.07;
    const c = new THREE.Mesh(new THREE.BoxGeometry(w, 0.012 + r() * 0.012, d), r() > 0.85 ? m.white : m.chip);
    c.position.set(area[0] + r() * (area[1] - area[0]), 0.008, area[2] + r() * (area[3] - area[2]));
    g.add(c);
  }
  return g;
}

function pcb(m, color, seed) {
  const g = new THREE.Group();
  const s = chamferRect(0.86, 0.86, 0.05);
  for (const [x, z] of [[-0.36, -0.36], [0.36, -0.36], [0.36, 0.36], [-0.36, 0.36]]) s.holes.push(circlePath(x, z, 0.022));
  const top = new THREE.MeshStandardMaterial({ map: boardTexture(color, seed), metalness: 0.15, roughness: 0.5 });
  const board = new THREE.Mesh(slab(s, 0.022), [top, m.pcbEdge]);
  g.add(board);
  const standGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.09, 6);
  for (const [x, z] of [[-0.36, -0.36], [0.36, -0.36], [0.36, 0.36], [-0.36, 0.36]]) {
    const st = new THREE.Mesh(standGeo, m.brushed);
    st.position.set(x, -0.045, z);
    g.add(st);
  }
  const deck = new THREE.Group();
  deck.position.y = 0.022;
  g.add(deck);
  return { group: g, deck };
}

function payloadBoard(m) {
  const { group, deck } = pcb(m, '#1c2f9a', 11);
  const r = rng(12);
  deck.add(chips(m, r, 14, [-0.36, 0.36, 0.2, 0.36]));
  const hdr = header(m, 0.5);
  hdr.position.set(0, 0, -0.33);
  deck.add(hdr);
  // Camera: stacked green boards in a block, lens facing +Z
  const cam = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.26), m.green);
  body.position.y = 0.1;
  cam.add(body);
  for (const y of [0.04, 0.12, 0.2]) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.31, 0.012, 0.27), m.pcbEdge);
    b.position.y = y;
    cam.add(b);
  }
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.065, 0.09, 32), m.black);
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(0.02, 0.11, 0.175);
  cam.add(barrel);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.052, 0.012, 12, 40), m.orange);
  ring.position.set(0.02, 0.11, 0.22);
  cam.add(ring);
  const glass = new THREE.Mesh(new THREE.CircleGeometry(0.045, 32), m.lens);
  glass.position.set(0.02, 0.11, 0.221);
  cam.add(glass);
  const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.05, 20), m.black);
  knob.rotation.z = Math.PI / 2;
  knob.position.set(-0.17, 0.08, 0.05);
  cam.add(knob);
  cam.position.set(-0.04, 0, 0.02);
  deck.add(cam);
  return group;
}

function epsBoard(m) {
  const { group, deck } = pcb(m, '#1f5a34', 21);
  const r = rng(22);
  for (const x of [-0.22, 0, 0.22]) {
    const t = new THREE.Mesh(new THREE.TorusGeometry(0.068, 0.034, 16, 40), m.toroid);
    t.rotation.x = Math.PI / 2;
    t.position.set(x, 0.034, 0.02);
    deck.add(t);
    const core = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.036, 0.04, 20), m.copper);
    core.position.set(x, 0.02, 0.02);
    deck.add(core);
  }
  const batt = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.06, 0.12), m.white);
  batt.position.set(0.24, 0.03, -0.2);
  deck.add(batt);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.07, 20), m.black);
  cap.position.set(-0.28, 0.035, -0.2);
  deck.add(cap);
  deck.add(chips(m, r, 12, [-0.36, 0.36, 0.18, 0.36]));
  const hdr = header(m, 0.5);
  hdr.position.set(-0.02, 0, -0.33);
  deck.add(hdr);
  return group;
}

function radioBoard(m) {
  const { group, deck } = pcb(m, '#22593a', 31);
  const r = rng(32);
  const shield = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.055, 0.3), m.rail);
  shield.position.set(0.12, 0.028, 0.06);
  deck.add(shield);
  const lid = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.02, 0.14), m.white);
  lid.position.set(-0.25, 0.01, 0.15);
  deck.add(lid);
  for (const z of [-0.05, 0.08]) {
    const sma = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.07, 6), m.brass);
    sma.rotation.z = Math.PI / 2;
    sma.position.set(0.39, 0.03, z);
    deck.add(sma);
  }
  deck.add(chips(m, r, 14, [-0.36, 0.0, -0.2, 0.36]));
  const hdr = header(m, 0.5, 3);
  hdr.position.set(0, 0, -0.32);
  deck.add(hdr);
  return group;
}

function computerBoard(m) {
  const { group, deck } = pcb(m, '#1d4f31', 41);
  const r = rng(42);
  const can = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.04, 0.24), m.alu);
  can.position.set(-0.14, 0.02, 0.06);
  deck.add(can);
  const mcu = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.018, 0.14), m.chip);
  mcu.position.set(0.2, 0.009, 0.1);
  deck.add(mcu);
  const sd = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.02, 0.1), m.white);
  sd.position.set(0.24, 0.01, -0.12);
  deck.add(sd);
  deck.add(chips(m, r, 16, [-0.36, 0.36, 0.2, 0.36]));
  const hdr = header(m, 0.5);
  hdr.position.set(0, 0, -0.33);
  deck.add(hdr);
  return group;
}

function anchor(parent, x, y, z) {
  const a = new THREE.Object3D();
  a.position.set(x, y, z);
  parent.add(a);
  return a;
}

export function buildCubeSat() {
  const m = makeMaterials();
  const root = new THREE.Group();
  const parts = [];
  const add = (obj, y, lift, spread) => {
    obj.position.y = y;
    root.add(obj);
    parts.push({ obj, y, lift, spread });
    return obj;
  };

  const anchors = {};

  const fr = add(frame(m), 0, 0, 0);
  anchors.structure = anchor(fr, -W / 2, H / 2 - 0.15, W / 2);
  anchors.solar = anchor(fr, W / 2, -0.12, 0.05);

  const top = topPlate(m);
  add(top.group, H / 2 + 0.005, 0.35, 0.18);
  anchors.dipole = anchor(top.strips[0], 0.75, 0, 0.002);

  const ts = new THREE.Group();
  for (const [x, z] of [[-0.43, -0.43], [0.43, -0.43], [0.43, 0.43], [-0.43, 0.43], [0.43, 0], [-0.43, 0]]) {
    const s = screw(m, 0.09);
    s.position.set(x, 0, z);
    ts.add(s);
  }
  add(ts, H / 2 - 0.05, 0.45, 0.4);

  const boards = [payloadBoard(m), epsBoard(m), radioBoard(m), computerBoard(m)];
  const keys = ['payload', 'eps', 'radio', 'computer'];
  const ax = [-0.43, 0.43, -0.43, 0.43];
  boards.forEach((b, i) => {
    add(b, 0.27 - i * 0.2, -1.18, -i * 0.2);
    anchors[keys[i]] = anchor(b, ax[i], 0.02, 0.2);
  });

  const bp = add(bottomPlate(m), -H / 2 + 0.02, -1.18, -1.0);
  const bs = new THREE.Group();
  for (const [x, z] of [[-0.36, -0.36], [0.36, -0.36], [0.36, 0.36], [-0.36, 0.36]]) {
    const s = screw(m, 0.09);
    s.rotation.x = Math.PI;
    s.position.set(x, 0, z);
    bs.add(s);
  }
  add(bs, -H / 2 + 0.02, -1.18, -1.17);
  void bp;

  function setExplode(lift, spread) {
    for (const p of parts) p.obj.position.y = p.y + p.lift * lift + p.spread * spread;
  }

  return { root, anchors, setExplode };
}
