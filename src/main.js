import '@fontsource-variable/figtree';
import './style.css';
import Lenis from 'lenis';
import { createStage, sample } from './three/scene.js';
import { MISSIONS, FACTORS, NEWS, EVENTS } from './data.js';
import { orbitArt, newsArt, isoUnits } from './art.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

// Poses along the story track (p = 0..1). px is in fractions of the half-width.
const DESKTOP = [
  { p: 0.0, px: 0.36, py: -0.02, rx: 0.62, ry: 0.78, rz: 0.42, lift: 0, spread: 0, scale: 1.3 },
  { p: 0.05, px: 0.36, py: -0.02, rx: 0.62, ry: 0.78, rz: 0.42, lift: 0, spread: 0, scale: 1.3 },
  { p: 0.22, px: 0.3, py: -0.12, rx: 0.95, ry: 0.3, rz: -0.5, lift: 0.78, spread: 0.22, scale: 0.95 },
  { p: 0.31, px: 0.3, py: -0.12, rx: 0.95, ry: 0.3, rz: -0.5, lift: 0.78, spread: 0.22, scale: 0.95 },
  { p: 0.44, px: 0.04, py: -0.15, rx: 0.3, ry: -0.62, rz: 0, lift: 1, spread: 1, scale: 0.92 },
  { p: 0.53, px: 0.04, py: -0.15, rx: 0.3, ry: -0.62, rz: 0, lift: 1, spread: 1, scale: 0.92 },
  { p: 0.8, px: 0.04, py: 1.55, rx: 0.26, ry: -0.7, rz: 0, lift: 1, spread: 1, scale: 0.92 },
  { p: 1.0, px: 0.04, py: 1.55, rx: 0.26, ry: -0.7, rz: 0, lift: 1, spread: 1, scale: 0.92 },
];
const MOBILE = [
  { p: 0.0, px: 0.1, py: -0.75, rx: 0.62, ry: 0.78, rz: 0.42, lift: 0, spread: 0, scale: 0.78 },
  { p: 0.05, px: 0.1, py: -0.75, rx: 0.62, ry: 0.78, rz: 0.42, lift: 0, spread: 0, scale: 0.78 },
  { p: 0.22, px: 0.1, py: -0.65, rx: 0.34, ry: 0.5, rz: -0.52, lift: 0.78, spread: 0.22, scale: 0.68 },
  { p: 0.31, px: 0.1, py: -0.65, rx: 0.34, ry: 0.5, rz: -0.52, lift: 0.78, spread: 0.22, scale: 0.68 },
  { p: 0.44, px: 0, py: 0.2, rx: 0.3, ry: -0.62, rz: 0, lift: 1, spread: 1, scale: 0.36 },
  { p: 0.53, px: 0, py: 0.2, rx: 0.3, ry: -0.62, rz: 0, lift: 1, spread: 1, scale: 0.36 },
  { p: 0.8, px: 0, py: 0.75, rx: 0.26, ry: -0.7, rz: 0, lift: 1, spread: 1, scale: 0.36 },
  { p: 1.0, px: 0, py: 0.75, rx: 0.26, ry: -0.7, rz: 0, lift: 1, spread: 1, scale: 0.36 },
];

/* ---------- smooth scroll ---------- */
const lenis = new Lenis({ lerp: 0.085, smoothWheel: !reduced });
window.lenis = lenis;

const story = $('#story');
const trackP = () => {
  const r = story.getBoundingClientRect();
  return clamp(-r.top / (story.offsetHeight - innerHeight));
};
const gotoP = (p) => {
  const y = story.offsetTop + p * (story.offsetHeight - innerHeight);
  lenis.scrollTo(y, { duration: 1.8 });
};

$$('[data-goto]').forEach((el) => el.addEventListener('click', (e) => { e.preventDefault(); gotoP(+el.dataset.goto); }));
$$('[data-href]').forEach((el) => el.addEventListener('click', () => lenis.scrollTo(el.dataset.href, { duration: 1.6 })));
$$('a[href^="#"]').forEach((a) => {
  if (a.dataset.goto) return;
  a.addEventListener('click', (e) => {
    const id = a.getAttribute('href');
    if (id.length < 2 || !$(id)) return;
    e.preventDefault();
    nav.classList.remove('open');
    lenis.scrollTo(id === '#top' ? 0 : id, { duration: 1.6, offset: id === '#top' ? 0 : -40 });
  });
});

/* ---------- nav ---------- */
const nav = $('#nav');
$('.menu').addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  $('.menu').setAttribute('aria-expanded', open);
});

const toastEl = $('.toast');
let toastT;
function toast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastT);
  toastT = setTimeout(() => toastEl.classList.remove('show'), 2600);
}
$$('[data-toast]').forEach((el) => el.addEventListener('click', (e) => { e.preventDefault(); toast(el.dataset.toast); }));

/* ---------- 3D story ---------- */
const canvas = $('#sat');
const stage = createStage(canvas);
const hero = $('.scene-hero');
const guide = $('.scene-guide');
const factsTitle = $('.facts-title');
const hint = $('.hint');
const svg = $('.leaders');
const dots = $$('.dots button');
const dotsBox = $('.dots');
const callouts = $$('.callout').map((el) => {
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('pathLength', '1');
  path.style.strokeDasharray = '1';
  const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  dot.setAttribute('r', '2.5');
  svg.append(path, dot);
  return { el, path, dot, h3: $('h3', el), anchor: el.dataset.anchor, side: el.dataset.side, at: +el.dataset.at, dy: +el.dataset.dy };
});

let W = 0, H = 0, mobile = false, titleBottom = 0;
function resize() {
  W = innerWidth; H = innerHeight;
  mobile = W < 760;
  stage.resize(W, H);
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  titleBottom = factsTitle.offsetTop + factsTitle.offsetHeight;
}
resize();
addEventListener('resize', resize);

function layoutCallouts(p) {
  const gut = mobile ? 14 : W * 0.085;
  const k = H / 900;
  for (const c of callouts) {
    const op = smooth(c.at, c.at + 0.035, p);
    const a = stage.project(c.anchor);
    const cw = c.el.offsetWidth;
    const hh = c.h3.offsetHeight;
    const lineY = a.y + c.dy * (mobile ? 0.6 : k);
    let x0, x1, knee;
    if (c.side === 'left') {
      x0 = gut;
      x1 = Math.min(gut + cw + W * 0.035, a.x - 14);
      knee = x1;
    } else {
      x0 = mobile ? W - gut - cw : Math.max(W * 0.685, a.x + 40);
      x1 = Math.min(W - (mobile ? 6 : W * 0.03), x0 + cw + W * 0.03);
      knee = Math.max(x0 - W * 0.04, a.x + 14);
      x0 = knee;
    }
    const fade = op * smooth(titleBottom + 4, titleBottom + 50, lineY - hh) * smooth(H + 40, H - 80, lineY);
    const labelX = c.side === 'left' ? gut : (mobile ? W - gut - cw : Math.max(W * 0.685, a.x + 40));
    c.el.style.transform = `translate(${labelX}px, ${lineY - hh}px)`;
    c.el.style.opacity = fade;
    const d = c.side === 'left'
      ? `M${x0},${lineY}H${knee}L${a.x},${a.y}`
      : `M${x1},${lineY}H${knee}L${a.x},${a.y}`;
    c.path.setAttribute('d', d);
    c.path.style.strokeDashoffset = 1 - op;
    c.path.style.opacity = fade > 0 ? Math.min(1, fade * 1.5) : 0;
    c.dot.setAttribute('cx', a.x);
    c.dot.setAttribute('cy', a.y);
    c.dot.style.opacity = fade;
  }
}

function setDot(i) {
  dots.forEach((d, j) => d.classList.toggle('on', i === j));
}

let visible = true;
new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { rootMargin: '100px' }).observe(story);

function frame(time) {
  lenis.raf(time);
  const p = trackP();
  const t = reduced ? 0 : time / 1000;

  if (visible) {
    stage.apply(sample(mobile ? MOBILE : DESKTOP, p), t);
    stage.render();

    const heroOut = smooth(0.03, 0.1, p);
    hero.style.opacity = 1 - heroOut;
    hero.style.setProperty('--ty', `${-heroOut * 70}px`);
    hero.style.visibility = heroOut >= 1 ? 'hidden' : '';
    const gIn = smooth(0.13, 0.19, p), gOut = smooth(0.31, 0.37, p);
    guide.style.opacity = gIn * (1 - gOut);
    guide.style.setProperty('--ty', `${(1 - gIn) * 60 - gOut * 60}px`);
    guide.style.visibility = gIn * (1 - gOut) <= 0 ? 'hidden' : '';
    const fIn = smooth(0.4, 0.45, p);
    factsTitle.style.opacity = fIn;
    factsTitle.style.transform = `translateY(${(1 - fIn) * 24}px)`;
    hint.style.opacity = 1 - smooth(0, 0.03, p);
    layoutCallouts(p);
  }

  const sat = $('#satellites').getBoundingClientRect();
  if (sat.top < H * 0.5) setDot(4);
  else setDot(p < 0.13 ? 0 : p < 0.38 ? 1 : p < 0.66 ? 2 : 3);
  dotsBox.classList.toggle('away', mobile ? story.getBoundingClientRect().bottom < H * 0.6 : sat.bottom < H * 0.4);
  nav.classList.toggle('solid', story.getBoundingClientRect().bottom < 80);

  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

/* ---------- missions ---------- */
$('#missionCards').innerHTML = MISSIONS.map((m) => `
  <article class="card reveal">
    <div class="orbit">${orbitArt(m.art)}</div>
    <span class="tag">${m.tag}</span>
    <h3>${m.name}</h3>
    <p class="sub">${m.sub}</p>
    <p>${m.text}</p>
    <dl>
      <div><dt>Size</dt><dd>${m.size}</dd></div>
      <div><dt>Launched</dt><dd>${m.year}</dd></div>
      <div><dt>Destination</dt><dd>${m.dest}</dd></div>
      <div><dt>Mass each</dt><dd>${m.mass}</dd></div>
    </dl>
  </article>`).join('');

/* ---------- form factors ---------- */
const art = $('#factorArt');
const specs = $('#factorSpecs');
const tabs = $('#factorTabs');
tabs.innerHTML = FACTORS.map((f, i) => `<button role="tab" aria-selected="${i === 0}" data-i="${i}">${f.id}</button>`).join('');
let cur = [...FACTORS[0].u];
let anim;
function showFactor(i) {
  const f = FACTORS[i];
  $$('button', tabs).forEach((b, j) => b.setAttribute('aria-selected', i === j));
  specs.innerHTML = `<dt>Size</dt><dd>${f.dims}</dd><dt>Up to</dt><dd>${f.mass}</dd><dt>Typical use</dt><dd>${f.use}</dd>`;
  const from = [...cur], to = f.u, t0 = performance.now();
  cancelAnimationFrame(anim);
  const step = (now) => {
    const t = reduced ? 1 : smooth(0, 700, now - t0);
    cur = from.map((v, k) => v + (to[k] - v) * t);
    art.innerHTML = isoUnits(cur);
    if (t < 1) anim = requestAnimationFrame(step);
  };
  anim = requestAnimationFrame(step);
}
tabs.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) showFactor(+b.dataset.i); });
art.innerHTML = isoUnits(cur);
showFactor(0);

/* ---------- news + events ---------- */
$('#newsGrid').innerHTML = NEWS.map((n) => `
  <article class="story-card reveal" tabindex="0">
    <div class="pic">${newsArt(n.art)}</div>
    <div class="meta"><span>${n.kind}</span><span>${n.date}</span><span>${n.mins} min read</span></div>
    <h3>${n.title}</h3>
  </article>`).join('');
$$('.story-card').forEach((c) => c.addEventListener('click', () => toast('Demo build: articles are placeholders.')));

$('#eventList').innerHTML = EVENTS.map((e) => `
  <li class="reveal">
    <div class="date"><b>${e.d}</b><span>${e.m}</span></div>
    <div><h3>${e.title}</h3><p>${e.where}</p></div>
    <span class="kind">${e.kind}</span>
    <button class="rsvp" type="button">RSVP</button>
  </li>`).join('');
$$('.rsvp').forEach((b) => b.addEventListener('click', () => {
  const on = b.classList.toggle('done');
  b.textContent = on ? 'Going ✓' : 'RSVP';
}));

/* ---------- contact ---------- */
const form = $('#contactForm');
form.addEventListener('submit', (e) => {
  e.preventDefault();
  let ok = true;
  for (const f of $$('input, textarea', form)) {
    const bad = !f.checkValidity() || !f.value.trim();
    f.classList.toggle('bad', bad);
    if (bad) ok = false;
  }
  const note = $('.form-note', form);
  if (!ok) { note.textContent = 'Please fill in the highlighted fields.'; return; }
  note.textContent = `Thanks, ${form.name.value.trim().split(' ')[0]}. This demo doesn't send anything, but the form works.`;
  form.reset();
});

/* ---------- reveals + counters ---------- */
const io = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (!e.isIntersecting) continue;
    e.target.classList.add('in');
    io.unobserve(e.target);
  }
}, { threshold: 0.15 });
$$('.reveal, .sec h2, .sec .lead').forEach((el, i) => {
  el.classList.add('reveal');
  el.style.transitionDelay = `${(i % 4) * 70}ms`;
  io.observe(el);
});

const cio = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (!e.isIntersecting) continue;
    cio.unobserve(e.target);
    const el = e.target, end = +el.dataset.count, suf = el.dataset.suffix || '', t0 = performance.now();
    const fmt = (v) => (end >= 1000 && end !== 1999 ? Math.round(v).toLocaleString('en-US') : Math.round(v)) + suf;
    const step = (now) => {
      const t = reduced ? 1 : clamp((now - t0) / 1400);
      el.textContent = fmt(end * (1 - Math.pow(1 - t, 3)));
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
}, { threshold: 0.6 });
$$('[data-count]').forEach((el) => cio.observe(el));

/* footer brand reuses the nav mark */
$('.foot .brand').innerHTML = $('.nav .brand').innerHTML;
