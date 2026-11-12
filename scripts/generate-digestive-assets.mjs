import * as THREE from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

class NodeFileReader {
  result = null;
  onloadend = null;
  onerror = null;
  readAsArrayBuffer(blob) { blob.arrayBuffer().then(value => { this.result = value; this.onloadend?.(); }).catch(error => this.onerror?.(error)); }
  readAsDataURL(blob) { blob.arrayBuffer().then(value => { this.result = `data:${blob.type};base64,${Buffer.from(value).toString('base64')}`; this.onloadend?.(); }).catch(error => this.onerror?.(error)); }
}
globalThis.FileReader = NodeFileReader;

const outDir = join(process.cwd(), 'apps', 'web', 'public', 'assets', 'digestive');
const mat = (color, roughness = 0.62, metalness = 0.04, emissive = 0x000000) => new THREE.MeshStandardMaterial({ color, roughness, metalness, emissive, emissiveIntensity: emissive ? 0.25 : 0 });
const physical = (color, opacity = 0.45) => new THREE.MeshPhysicalMaterial({ color, transparent: true, opacity, roughness: 0.18, transmission: 0.28, side: THREE.DoubleSide });
const add = (root, geometry, material, name, position = [0, 0, 0], scale = [1, 1, 1], rotation = [0, 0, 0]) => { const mesh = new THREE.Mesh(geometry, material); mesh.name = name; mesh.position.set(...position); mesh.scale.set(...scale); mesh.rotation.set(...rotation); mesh.castShadow = true; mesh.receiveShadow = true; root.add(mesh); return mesh; };
const sphere = (root, name, position, scale, color, emissive = 0x000000) => add(root, new THREE.SphereGeometry(1, 20, 14), mat(color, 0.58, 0.02, emissive), name, position, scale);
const box = (root, name, position, scale, color, metalness = 0.03) => add(root, new THREE.BoxGeometry(1, 1, 1), mat(color, 0.55, metalness), name, position, scale);
const tube = (root, name, points, radius, color) => add(root, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p))), 56, radius, 10, false), mat(color, 0.66), name);

function teacher() {
  const g = new THREE.Group(); g.name = 'chef-scientist-guide';
  sphere(g, 'head-expressive', [0, 1.72, 0], [0.22, 0.25, 0.22], 0xb77955); sphere(g, 'chef-hat', [0, 2.02, 0], [0.3, 0.18, 0.26], 0xf8fafc);
  add(g, new THREE.CapsuleGeometry(0.28, 0.72, 8, 14), mat(0xf8fafc), 'white-chef-lab-coat', [0, 1.04, 0]);
  for (const x of [-0.34, 0.34]) add(g, new THREE.CapsuleGeometry(0.065, 0.65, 6, 10), mat(0xb77955), x < 0 ? 'left-gesture-arm' : 'right-pointing-arm', [x, 1.24, 0], [1, 1, 1], [0, 0, x < 0 ? -0.25 : 0.55]);
  for (const x of [-0.13, 0.13]) add(g, new THREE.CapsuleGeometry(0.08, 0.65, 6, 10), mat(0x334155), 'leg', [x, 0.35, 0]);
  sphere(g, 'left-eye', [-0.08, 1.76, 0.2], [0.025, 0.035, 0.02], 0x111827); sphere(g, 'right-eye', [0.08, 1.76, 0.2], [0.025, 0.035, 0.02], 0x111827);
  return g;
}

function scienceRoom() {
  const g = new THREE.Group(); g.name = 'family-kitchen-science-room';
  box(g, 'kitchen-island', [0, 0.72, -2], [3.4, 0.12, 1.2], 0xe2e8f0); for (const x of [-1.5, 1.5]) box(g, 'island-leg', [x, 0.35, -2], [0.12, 0.7, 0.9], 0x64748b, 0.25);
  box(g, 'refrigerator', [-3.2, 1.2, -4], [1.1, 2.4, 0.8], 0xcbd5e1, 0.45); box(g, 'oven', [3.1, 0.75, -4], [1.15, 1.5, 0.8], 0x334155, 0.5);
  for (let i = 0; i < 8; i++) sphere(g, `fruit-${i}`, [-0.55 + (i % 4) * 0.35, 1.02 + Math.floor(i / 4) * 0.18, -2], [0.13, 0.13, 0.13], [0xef4444, 0xf59e0b, 0x84cc16, 0xfacc15][i % 4]);
  const portal = add(g, new THREE.TorusGeometry(0.9, 0.08, 16, 48), mat(0x22d3ee, 0.2, 0.2, 0x22d3ee), 'magical-lunchbox-portal', [0, 1.45, -4.1]); portal.rotation.y = 0;
  return g;
}

function tasteKingdom() {
  const g = new THREE.Group(); g.name = 'five-taste-kingdom-islands';
  const tastes = [
    ['sweet-island', -2.6, 0xf472b6, [0xfacc15, 0x7c2d12, 0xef4444]],
    ['sour-island', -1.3, 0xa3e635, [0xfacc15, 0xf97316, 0x84cc16]],
    ['salty-island', 0, 0x38bdf8, [0xf8fafc, 0xfacc15, 0xf59e0b]],
    ['bitter-island', 1.3, 0x22c55e, [0x65a30d, 0x166534, 0x84cc16]],
    ['umami-island', 2.6, 0xf59e0b, [0xf8fafc, 0xdc2626, 0xa16207]],
  ];
  for (const [name, x, color, foods] of tastes) {
    add(g, new THREE.CylinderGeometry(0.58, 0.82, 0.24, 20), mat(color, 0.7), name, [x, 1.15, -3.2]);
    foods.forEach((foodColor, i) => sphere(g, `${name}-food-${i}`, [x - 0.25 + i * 0.25, 1.48 + Math.sin(i) * 0.08, -3.15], [0.11, i === 1 ? 0.18 : 0.11, 0.11], foodColor));
  }
  for (let i = 0; i < 36; i++) sphere(g, `taste-sparkle-${i}`, [-3.1 + (i % 12) * 0.56, 1.75 + Math.floor(i / 12) * 0.28, -3.35], [0.025, 0.025, 0.025], 0xfef08a, 0xfacc15);
  return g;
}

function mouth() {
  const g = new THREE.Group(); g.name = 'giant-mouth-taste-bud-world';
  sphere(g, 'gum-cavity', [0, 1.4, -0.25], [1.6, 0.9, 0.75], 0x9f1239); sphere(g, 'tongue', [0, 1.1, 0.28], [1.15, 0.22, 0.55], 0xfb7185);
  for (let row = 0; row < 2; row++) for (let i = 0; i < 12; i++) { const x = -0.72 + i * 0.13; add(g, new THREE.CapsuleGeometry(0.065, 0.13, 5, 8), mat(0xfffbeb, 0.25), `tooth-${row}-${i}`, [x, 1.72 - row * 0.52, 0.42], [1, 1, 1], [0, 0, (i - 5.5) * 0.02]); }
  for (let i = 0; i < 48; i++) sphere(g, `taste-bud-${i}`, [-0.9 + (i % 12) * 0.16, 1.27 + Math.sin(i) * 0.025, 0.52 - Math.floor(i / 12) * 0.12], [0.025, 0.035, 0.025], i % 5 === 0 ? 0xfacc15 : 0xfda4af, 0xf97316);
  return g;
}

function esophagus() {
  const g = new THREE.Group(); g.name = 'transparent-esophagus-peristalsis-tunnel';
  add(g, new THREE.CylinderGeometry(0.72, 0.6, 4.6, 28, 1, true), physical(0xf472b6, 0.34), 'transparent-food-pipe', [0, 1.5, -0.2]);
  for (let i = 0; i < 12; i++) add(g, new THREE.TorusGeometry(0.66 - i * 0.006, 0.035, 10, 28), mat(i % 3 === 0 ? 0x67e8f9 : 0xdb2777, 0.4, 0, i % 3 === 0 ? 0x67e8f9 : 0), `muscle-ring-${i}`, [0, 3.5 - i * 0.36, -0.2], [1, 1, 1], [Math.PI / 2, 0, 0]);
  sphere(g, 'food-bolus', [0, 2.6, -0.2], [0.25, 0.32, 0.25], 0xf59e0b);
  return g;
}

function stomach() {
  const g = new THREE.Group(); g.name = 'living-stomach-digestion-chamber';
  sphere(g, 'stomach-outer-wall', [0, 1.45, -0.2], [1.15, 1.45, 0.8], 0xbe4164); sphere(g, 'gastric-juice-pool', [0, 0.82, 0.38], [0.85, 0.18, 0.58], 0xf59e0b, 0xf97316);
  for (let i = 0; i < 28; i++) sphere(g, `gastric-bubble-${i}`, [-0.65 + (i % 7) * 0.22, 0.92 + Math.floor(i / 7) * 0.25, 0.48], [0.035 + i % 3 * 0.012, 0.035 + i % 3 * 0.012, 0.035], 0xfef08a, 0xfacc15);
  add(g, new THREE.TorusGeometry(0.5, 0.07, 12, 30), mat(0x22d3ee, 0.25, 0.2, 0x22d3ee), 'enzyme-mixer-wheel', [1.2, 1.5, 0.5]);
  return g;
}

function helperOrgans() {
  const g = new THREE.Group(); g.name = 'liver-gallbladder-pancreas-asset';
  sphere(g, 'liver', [-0.55, 1.55, 0], [1, 0.52, 0.42], 0x8b2f2f); sphere(g, 'gallbladder', [-0.2, 1.12, 0.32], [0.16, 0.35, 0.16], 0x65a30d, 0x84cc16); sphere(g, 'pancreas', [0.72, 1.15, 0.1], [0.78, 0.18, 0.2], 0xf59e8b);
  tube(g, 'bile-flow', [[-0.2, 1.2, 0.3], [0.1, 0.9, 0.3], [0.5, 0.8, 0.2]], 0.035, 0xa3e635); tube(g, 'enzyme-flow', [[0.7, 1.1, 0.1], [0.45, 0.9, 0.2], [0.2, 0.8, 0.25]], 0.035, 0x67e8f9);
  return g;
}

function smallIntestine() {
  const g = new THREE.Group(); g.name = 'small-intestine-villi-walkthrough';
  tube(g, 'coiled-small-intestine', [[-1.4, 1.8, 0], [1.4, 1.7, 0], [-1.4, 1.35, 0], [1.4, 1.0, 0], [-1.2, 0.65, 0], [1.2, 0.4, 0]], 0.2, 0xf9a8d4);
  for (let i = 0; i < 80; i++) add(g, new THREE.ConeGeometry(0.035, 0.18, 7), mat(0xfda4af, 0.7), `villus-${i}`, [-1.6 + (i % 20) * 0.17, 0.45 + Math.floor(i / 20) * 0.35, 0.3 + Math.sin(i) * 0.1]);
  tube(g, 'blood-vessel', [[-1.6, 0.25, 0.6], [0, 0.18, 0.65], [1.6, 0.25, 0.6]], 0.075, 0xef4444);
  return g;
}

function largeIntestine() {
  const g = new THREE.Group(); g.name = 'large-intestine-water-absorption-world';
  tube(g, 'large-intestine-colon', [[-1.4, 0.5, 0], [-1.5, 2.2, 0], [1.5, 2.2, 0], [1.5, 0.55, 0], [0.7, 0.35, 0]], 0.28, 0xd97786);
  for (let i = 0; i < 30; i++) sphere(g, `water-droplet-${i}`, [-1.2 + (i % 10) * 0.27, 0.65 + Math.floor(i / 10) * 0.55, 0.35], [0.035, 0.05, 0.035], 0x60a5fa, 0x38bdf8);
  return g;
}

function rectum() { const g = new THREE.Group(); g.name = 'respectful-final-digestive-pathway'; tube(g, 'rectum-path', [[0, 2, 0], [0.1, 1.45, 0], [0, 0.9, 0], [0, 0.35, 0.15]], 0.3, 0xb45363); for (let i = 0; i < 8; i++) add(g, new THREE.TorusGeometry(0.42, 0.028, 8, 24), mat(0x67e8f9, 0.3, 0, 0x67e8f9), `path-arrow-${i}`, [0, 1.9 - i * 0.22, 0.15], [1, 1, 1], [Math.PI / 2, 0, 0]); return g; }

function foodTable() {
  const g = new THREE.Group(); g.name = 'healthy-food-sorting-market'; box(g, 'sorting-table', [0, 0.75, -0.2], [3.8, 0.15, 1.4], 0xe2e8f0, 0.15); box(g, 'healthy-basket', [-1.05, 1.15, -0.2], [1.2, 0.55, 0.8], 0x22c55e); box(g, 'sometimes-basket', [1.05, 1.15, -0.2], [1.2, 0.55, 0.8], 0xf97316);
  const colors = [0xef4444, 0xfacc15, 0xf8fafc, 0xf97316, 0x84cc16, 0x7c2d12, 0x60a5fa, 0xdc2626]; for (let i = 0; i < 8; i++) sphere(g, `food-model-${i}`, [-1.5 + i * 0.43, 1.12, 0.75], [0.13, i % 3 === 0 ? 0.17 : 0.13, 0.13], colors[i]); return g;
}

function quizArena() { const g = new THREE.Group(); g.name = 'holographic-food-explorer-arena'; add(g, new THREE.TorusGeometry(2.2, 0.05, 12, 60), mat(0x22d3ee, 0.25, 0.2, 0x22d3ee), 'quiz-light-ring', [0, 1.3, -0.4]); for (let i = 0; i < 5; i++) box(g, `quiz-card-${i + 1}`, [-1.6 + i * 0.8, 1.6 + Math.sin(i) * 0.25, 0], [0.65, 0.85, 0.05], i % 2 ? 0x1d4ed8 : 0x0f766e); for (let i = 0; i < 24; i++) sphere(g, `celebration-star-${i}`, [Math.sin(i) * 2.2, 0.4 + (i % 6) * 0.45, Math.cos(i) * 0.6], [0.04, 0.04, 0.04], 0xfacc15, 0xfacc15); return g; }

const assets = { 'teacher-guide-rig.glb': teacher, 'taste-kingdom-food-islands.glb': tasteKingdom, 'futuristic-science-room.glb': scienceRoom, 'mouth-interior-environment.glb': mouth, 'esophagus-peristalsis-tunnel.glb': esophagus, 'stomach-chamber-digestion.glb': stomach, 'helper-organs-chamber.glb': helperOrgans, 'small-intestine-villi-world.glb': smallIntestine, 'large-intestine-water-world.glb': largeIntestine, 'rectum-exit-pathway.glb': rectum, 'healthy-habits-table.glb': foodTable, 'holographic-quiz-arena.glb': quizArena };

async function exportGlb(scene) { const exporter = new GLTFExporter(); return new Promise((resolve, reject) => exporter.parse(scene, resolve, reject, { binary: true, onlyVisible: true, truncateDrawRange: true })); }
await mkdir(outDir, { recursive: true });
for (const [name, build] of Object.entries(assets)) { const scene = new THREE.Scene(); scene.name = name.replace('.glb', ''); scene.add(build()); const bytes = await exportGlb(scene); await writeFile(join(outDir, name), Buffer.from(bytes)); console.log(`generated ${name} (${Math.round(bytes.byteLength / 1024)} KB)`); }
