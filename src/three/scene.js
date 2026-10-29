import * as THREE from 'three';
import { buildCubeSat } from './cubesat.js';

// Black studio with a few softboxes, baked into a PMREM env for the metal.
function studioEnv(renderer) {
  const env = new THREE.Scene();
  env.add(new THREE.Mesh(new THREE.SphereGeometry(20, 32, 16), new THREE.MeshBasicMaterial({ color: '#17181c', side: THREE.BackSide })));
  const box = (w, h, pos, look, k) => {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(k, k, k), side: THREE.DoubleSide }));
    p.position.set(...pos);
    p.lookAt(...look);
    env.add(p);
  };
  box(10, 5, [0, 9, 2], [0, 0, 0], 3.2);
  box(2, 12, [-9, 1, 3], [0, 0, 0], 4.5);
  box(1.4, 10, [8, 0, -4], [0, 0, 0], 3.5);
  box(8, 1.2, [2, -6, 7], [0, 0, 0], 1.6);
  box(3, 3, [4, 4, 9], [0, 0, 0], 1.4);
  box(9, 6, [-2, 1, 12], [0, 0, 0], 2.0);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const tex = pmrem.fromScene(env, 0.02).texture;
  pmrem.dispose();
  return tex;
}

const ease = (t) => t * t * (3 - 2 * t);
const FIELDS = ['px', 'py', 'rx', 'ry', 'rz', 'lift', 'spread', 'scale'];

export function sample(keys, p) {
  if (p <= keys[0].p) return { ...keys[0] };
  for (let i = 1; i < keys.length; i++) {
    const b = keys[i];
    if (p <= b.p) {
      const a = keys[i - 1];
      const t = ease((p - a.p) / (b.p - a.p));
      const o = {};
      for (const f of FIELDS) o[f] = a[f] + (b[f] - a[f]) * t;
      return o;
    }
  }
  return { ...keys[keys.length - 1] };
}

export function createStage(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor('#000000');
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.0;

  const scene = new THREE.Scene();
  scene.environment = studioEnv(renderer);
  const key = new THREE.DirectionalLight('#ffffff', 1.6);
  key.position.set(-4, 6, 5);
  scene.add(key);
  const rim = new THREE.DirectionalLight('#9db8ff', 1.2);
  rim.position.set(5, 2, -4);
  scene.add(rim);

  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);
  camera.position.set(0, 0, 8);

  const sat = buildCubeSat();
  const holder = new THREE.Group();
  const spin = new THREE.Group();
  holder.add(spin);
  spin.add(sat.root);
  scene.add(holder);

  const halfH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
  let w = 1, h = 1;

  function resize(width, height) {
    w = width; h = height;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  function apply(s, time) {
    holder.position.set(s.px * halfH * camera.aspect, s.py + Math.sin(time * 0.6) * 0.03, 0);
    holder.scale.setScalar(s.scale);
    spin.rotation.set(s.rx + Math.sin(time * 0.4) * 0.025, s.ry + Math.sin(time * 0.27) * 0.05, s.rz);
    sat.setExplode(s.lift, s.spread);
  }

  const v = new THREE.Vector3();
  function project(name) {
    sat.anchors[name].getWorldPosition(v);
    v.project(camera);
    return { x: (v.x * 0.5 + 0.5) * w, y: (-v.y * 0.5 + 0.5) * h };
  }

  function render() {
    renderer.render(scene, camera);
  }

  return { resize, apply, project, render, anchors: Object.keys(sat.anchors) };
}
