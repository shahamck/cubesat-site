// Small generated SVG illustrations for cards and the form-factor viewer.
let uid = 0;

const PLANETS = {
  mars: ['#ff8a5c', '#a3341c'],
  moon: ['#e6e6ea', '#5d6069'],
  sun: ['#ffe08a', '#ff8a1f'],
  earth: ['#6fb6ff', '#123c9c'],
};

export function orbitArt(kind) {
  const id = `o${uid++}`;
  const [a, b] = PLANETS[kind];
  const orbit = {
    mars: 'M -130 60 C -60 -40 60 -70 150 -20',
    moon: 'M 0 -66 C 70 -66 70 66 0 66 C -18 66 -18 -66 0 -66 Z',
    sun: 'M -120 0 A 120 52 0 1 0 120 0 A 120 52 0 1 0 -120 0',
    earth: 'M -105 0 A 105 40 0 1 0 105 0 A 105 40 0 1 0 -105 0',
  }[kind];
  const r = kind === 'sun' ? 30 : kind === 'moon' ? 28 : 40;
  const cx = kind === 'mars' ? 110 : 0;
  const cy = kind === 'mars' ? -6 : 0;
  const sats = kind === 'earth' ? [0, 0.25, 0.5, 0.75] : kind === 'mars' ? [0, 0.04] : [0];
  const extra = kind === 'earth'
    ? '<ellipse rx="96" ry="58" fill="none" stroke="rgba(255,255,255,.12)" transform="rotate(-24)"/>'
    : '';
  return `<svg viewBox="-160 -85 320 170" role="img" aria-label="${kind} orbit">
    <defs><radialGradient id="${id}" cx="35%" cy="30%" r="80%"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></radialGradient>
    <radialGradient id="${id}g"><stop offset="0" stop-color="${a}" stop-opacity=".35"/><stop offset="1" stop-color="${a}" stop-opacity="0"/></radialGradient></defs>
    ${starField(id, 26, 160, 85)}
    <circle cx="${cx}" cy="${cy}" r="${r * 2.1}" fill="url(#${id}g)"/>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#${id})"/>
    ${extra}
    <path id="${id}p" d="${orbit}" fill="none" stroke="rgba(255,255,255,.28)" stroke-dasharray="3 5"/>
    ${sats.map((o) => `<rect x="-4" y="-4" width="8" height="8" rx="1.5" fill="#fff" stroke="#2458f2" stroke-width="1.5">
      <animateMotion dur="${kind === 'mars' ? 9 : 12}s" repeatCount="indefinite" begin="-${o * 12}s" rotate="auto"><mpath href="#${id}p"/></animateMotion></rect>`).join('')}
  </svg>`;
}

function starField(seed, n, w, h) {
  let s = 0;
  for (const c of String(seed)) s = (s * 31 + c.charCodeAt(0)) | 0;
  const r = () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  let out = '';
  for (let i = 0; i < n; i++) out += `<circle cx="${(r() * 2 - 1) * w}" cy="${(r() * 2 - 1) * h}" r="${0.4 + r() * 0.9}" fill="#fff" opacity="${0.2 + r() * 0.5}"/>`;
  return out;
}

export function newsArt(kind) {
  const id = `n${uid++}`;
  if (kind === 'mars') {
    return `<svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice"><defs>
      <radialGradient id="${id}" cx="70%" cy="85%" r="70%"><stop offset="0" stop-color="#ff7a45"/><stop offset=".55" stop-color="#7c2412"/><stop offset="1" stop-color="#120604"/></radialGradient></defs>
      <rect width="400" height="300" fill="#050507"/>${starField(id, 60, 400, 300).replace(/cx="-/g, 'cx="')}
      <circle cx="300" cy="360" r="230" fill="url(#${id})"/>
      <g transform="translate(120 110) rotate(-18)"><rect x="-22" y="-22" width="44" height="44" rx="3" fill="#2453d9" stroke="#cfd3da" stroke-width="4"/><rect x="22" y="-14" width="70" height="28" fill="#2a5be6" stroke="#cfd3da" stroke-width="2"/><line x1="0" y1="-22" x2="0" y2="-60" stroke="#c79d5c" stroke-width="3"/></g>
      <g transform="translate(70 170) rotate(14) scale(.6)"><rect x="-22" y="-22" width="44" height="44" rx="3" fill="#2453d9" stroke="#cfd3da" stroke-width="4"/><rect x="22" y="-14" width="70" height="28" fill="#2a5be6" stroke="#cfd3da" stroke-width="2"/></g>
    </svg>`;
  }
  if (kind === 'antenna') {
    return `<svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="${id}" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#0e1f4d"/><stop offset="1" stop-color="#020308"/></linearGradient></defs>
      <rect width="400" height="300" fill="url(#${id})"/>
      <g transform="translate(200 150)" stroke-linecap="round">
        ${[0, 90, 180, 270].map((a, i) => `<line x1="0" y1="0" x2="${i % 2 ? 110 : 160}" y2="0" stroke="#c79d5c" stroke-width="5" transform="rotate(${a + 20})"/>`).join('')}
        <rect x="-38" y="-38" width="76" height="76" rx="6" fill="#0b0c10" stroke="#d9dce1" stroke-width="5" transform="rotate(20)"/>
        <circle r="16" fill="none" stroke="#d9dce1" stroke-width="5"/>
        ${[50, 90, 130].map((r) => `<circle r="${r + 70}" fill="none" stroke="rgba(120,160,255,.14)" stroke-dasharray="2 8"/>`).join('')}
      </g></svg>`;
  }
  const parts = [
    ['#2453d9', 70, 70, 90, 90], ['#244a2d', 200, 60, 80, 80], ['#d9dce1', 310, 70, 60, 120],
    ['#1c2f9a', 80, 190, 80, 70], ['#e7b81c', 210, 190, 30, 30], ['#e7b81c', 250, 190, 30, 30], ['#1f5a34', 300, 210, 70, 60],
  ];
  return `<svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice"><rect width="400" height="300" fill="#0d0e12"/>
    ${parts.map(([c, x, y, w, h], i) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${c === '#e7b81c' ? 15 : 4}" fill="${c}" transform="rotate(${(i % 3 - 1) * 6} ${x + w / 2} ${y + h / 2})" opacity=".95"/>`).join('')}
    <g stroke="rgba(255,255,255,.25)" stroke-dasharray="3 5">${parts.map(([, x, y, w]) => `<line x1="${x + w / 2}" y1="${y - 6}" x2="${x + w / 2}" y2="${y - 22}"/>`).join('')}</g>
  </svg>`;
}

// Isometric stack of units. u = [x, y(height), z] in units.
const C30 = Math.cos(Math.PI / 6), S30 = 0.5;
export function isoUnits(u, s = 70) {
  const [a, h, b] = u;
  const P = (x, y, z) => {
    x -= a / 2; z -= b / 2; y -= h / 2;
    return `${((x - z) * C30 * s).toFixed(1)},${((x + z) * S30 * s - y * s).toFixed(1)}`;
  };
  const poly = (pts, fill) => `<polygon points="${pts.join(' ')}" fill="${fill}" stroke="#e3e6ea" stroke-width="3" stroke-linejoin="round"/>`;
  let grid = '';
  const L = (p, q) => `<line x1="${p.split(',')[0]}" y1="${p.split(',')[1]}" x2="${q.split(',')[0]}" y2="${q.split(',')[1]}"/>`;
  for (let i = 1; i < h; i++) grid += L(P(a, i, 0), P(a, i, b)) + L(P(0, i, b), P(a, i, b));
  for (let i = 1; i < a; i++) grid += L(P(i, 0, b), P(i, h, b)) + L(P(i, h, 0), P(i, h, b));
  for (let i = 1; i < b; i++) grid += L(P(a, 0, i), P(a, h, i)) + L(P(0, h, i), P(a, h, i));
  return `<svg viewBox="-235 -215 470 470">
    <defs>
      <linearGradient id="fR" x1="0" x2="1"><stop offset="0" stop-color="#2a5fe8"/><stop offset="1" stop-color="#173a9e"/></linearGradient>
      <linearGradient id="fL" x1="1" x2="0"><stop offset="0" stop-color="#1d46c0"/><stop offset="1" stop-color="#0f2670"/></linearGradient>
      <radialGradient id="fS"><stop offset="0" stop-color="#2458f2" stop-opacity=".35"/><stop offset="1" stop-color="#2458f2" stop-opacity="0"/></radialGradient>
    </defs>
    <ellipse cx="0" cy="${(h / 2) * s + ((a + b) / 2) * S30 * s + 30}" rx="${(a + b) * 0.8 * s}" ry="${(a + b) * 0.22 * s}" fill="url(#fS)"/>
    ${poly([P(a, 0, 0), P(a, h, 0), P(a, h, b), P(a, 0, b)], 'url(#fR)')}
    ${poly([P(0, 0, b), P(a, 0, b), P(a, h, b), P(0, h, b)], 'url(#fL)')}
    ${poly([P(0, h, 0), P(a, h, 0), P(a, h, b), P(0, h, b)], '#9aa3b2')}
    <g class="grid">${grid}</g>
  </svg>`;
}
