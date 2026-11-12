'use client';

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { playSimulationNarration, stopSimulationNarration } from '@/lib/simulationAudio';
import { createGuidedCamera } from '@/lib/world-builder/guidedCamera';
import { createInteractionSystem } from '@/lib/world-builder/interactionSystem';
import {
  ANIMAL_DIETS, FOOD_JOURNEY, FOOD_SOURCES, PLANT_PARTS, createFoodExplorerModel,
  type DietType, type FoodExplorerZone, type FoodSource, type PlantPart,
} from '@xr-school/simulation-runtime';

const ZONES: { id: FoodExplorerZone; title: string; place: string; cue: string }[] = [
  { id: 'welcome', title: 'Magical Invitation', place: 'Sunrise Village', cue: 'Every meal tells a story. Follow Professor Green through farms, rivers, villages, and wild habitats.' },
  { id: 'plants', title: 'Food from Plants', place: 'Rainbow Farm', cue: 'Harvest crops and discover which root, stem, leaf, flower, fruit, or seed we eat.' },
  { id: 'animals', title: 'Food from Animals', place: 'Dairy & Pond', cue: 'Meet the cow, hen, goat, fish, and honeybee and connect foods to their sources.' },
  { id: 'journey', title: 'Journey to Our Plate', place: 'Farm to Village', cue: 'Trace every step from a seed in the soil to a meal on the dining table.' },
  { id: 'wildlife', title: 'Who Eats What?', place: 'Wildlife Sanctuary', cue: 'Observe herbivores, carnivores, and omnivores safely in their habitats.' },
  { id: 'assessment', title: 'Explorer Challenge', place: 'Nature Pavilion', cue: 'Use everything you discovered to earn your Food Explorer badges.' },
];

const NARRATIONS = ZONES.map(zone => `${zone.place}. ${zone.cue}`);
const NARRATION_AUDIO_URLS = ['/audio/food-sources/stage-01.mp3', '/audio/food-sources/stage-02.mp3', '/audio/food-sources/stage-03.mp3', '/audio/food-sources/stage-04.mp3'];
const ITEM_AUDIO_URLS = { rice: '/audio/food-sources/item-rice.mp3', milk: '/audio/food-sources/item-milk.mp3' } as const;
const ASSIGNMENT_AUDIO_URLS = { 'rice-plant': '/audio/food-sources/assign-rice-plant.mp3', 'milk-animal': '/audio/food-sources/assign-milk-animal.mp3' } as const;

const CARD_META: Record<string, { icon: string; type: string; detail: string; accent: string }> = {
  compass: { icon: '🧭', type: 'Explorer Tool', detail: 'Points toward the next learning station.', accent: '#67e8f9' },
  farmer: { icon: '🧑🏽‍🌾', type: 'Community Helper', detail: 'Grows, protects, harvests, and prepares crops for market.', accent: '#fbbf24' },
  rice: { icon: '🌾', type: 'Seed · Plant source', detail: 'Habitat: flooded paddy field · Rich in carbohydrates', accent: '#fde047' },
  carrot: { icon: '🥕', type: 'Root · Plant source', detail: 'The taproot stores food made by the leaves.', accent: '#fb923c' },
  potato: { icon: '🥔', type: 'Stem · Plant source', detail: 'Its “eyes” are buds, proving it is a modified stem.', accent: '#d6b07a' },
  spinach: { icon: '🥬', type: 'Leaf · Plant source', detail: 'A leafy vegetable containing iron and vitamins.', accent: '#4ade80' },
  cauliflower: { icon: '🥦', type: 'Flower · Plant source', detail: 'We eat the compact cluster of immature flower buds.', accent: '#e2e8f0' },
  mango: { icon: '🥭', type: 'Fruit · Plant source', detail: 'The fleshy fruit surrounds and protects one large seed.', accent: '#facc15' },
  milk: { icon: '🥛', type: 'Animal source', detail: 'Source animals: cow, buffalo, and goat · Rich in calcium', accent: '#f8fafc' },
  egg: { icon: '🥚', type: 'Animal source', detail: 'Source animals: hen and duck · Contains protein', accent: '#fde68a' },
  honey: { icon: '🍯', type: 'Animal source', detail: 'Honeybees transform flower nectar and store it in combs.', accent: '#f59e0b' },
  fish: { icon: '🐟', type: 'Animal source', detail: 'Habitat: ponds, rivers, lakes, and oceans', accent: '#38bdf8' },
  cow: { icon: '🐄', type: 'Herbivore', detail: 'Habitat: farms and grasslands · Eats grass and fodder', accent: '#86efac' },
  deer: { icon: '🦌', type: 'Herbivore', detail: 'Habitat: forest and grassland · Eats grass, shoots, and leaves', accent: '#bef264' },
  tiger: { icon: '🐅', type: 'Carnivore', detail: 'Habitat: forest and grassland · A solitary big cat', accent: '#fb923c' },
  bear: { icon: '🐻', type: 'Omnivore', detail: 'Habitat: forest and mountain · Eats berries, roots, insects, and fish', accent: '#d6a77a' },
  crow: { icon: '🐦‍⬛', type: 'Omnivore', detail: 'Habitat: towns, farms, and forests · Highly intelligent', accent: '#a5b4fc' },
};

const DISCOVERIES: Record<FoodExplorerZone, { id: string; label: string; fact: string }[]> = {
  welcome: [
    { id: 'compass', label: 'Glowing Compass', fact: 'Professor Green: Almost everything we eat comes from plants or animals.' },
    { id: 'farmer', label: 'Friendly Farmer', fact: 'Farmers prepare soil, sow seeds, care for crops, and harvest our food.' },
  ],
  plants: [
    { id: 'rice', label: 'Harvest Rice', fact: 'Rice is a seed and one of the world’s most important food crops.' },
    { id: 'carrot', label: 'Pull a Carrot', fact: 'A carrot is a root that stores food for its plant.' },
    { id: 'potato', label: 'Dig a Potato', fact: 'A potato is an underground stem, not a root.' },
    { id: 'spinach', label: 'Pick Spinach', fact: 'Spinach leaves use sunlight to make food for the plant.' },
    { id: 'cauliflower', label: 'Cut Cauliflower', fact: 'The part we eat is a cluster of flower buds.' },
    { id: 'mango', label: 'Pick a Mango', fact: 'Mango is a fruit that protects the seed inside.' },
  ],
  animals: [
    { id: 'milk', label: 'Fill Milk Can', fact: 'Cows, buffaloes, and goats provide milk.' },
    { id: 'egg', label: 'Collect an Egg', fact: 'Hens and ducks lay eggs.' },
    { id: 'honey', label: 'Visit the Hive', fact: 'Honeybees make honey from flower nectar and help pollinate plants.' },
    { id: 'fish', label: 'Observe the Pond', fact: 'Fish are aquatic animals and an animal source of food.' },
  ],
  journey: FOOD_JOURNEY.map((label, index) => ({ id: `step-${index}`, label, fact: `${index + 1} of ${FOOD_JOURNEY.length}: ${label} is part of the connected food journey.` })),
  wildlife: [
    { id: 'cow', label: 'Feed the Cow', fact: 'Herbivores such as cows eat plants.' },
    { id: 'deer', label: 'Watch the Deer', fact: 'Deer browse on grass, leaves, shoots, and fruits.' },
    { id: 'tiger', label: 'Track the Tiger', fact: 'Tigers are carnivores. Observe from a respectful distance.' },
    { id: 'bear', label: 'Observe the Bear', fact: 'Many bears are omnivores that eat berries, roots, insects, and fish.' },
    { id: 'crow', label: 'Listen to the Crow', fact: 'Crows are adaptable omnivores that eat plant and animal foods.' },
  ],
  assessment: [],
};

const QUESTIONS = [
  { prompt: 'Milk comes from which source?', options: ['Plant', 'Animal'], answer: 'Animal', why: 'Cows, buffaloes, and goats are animal sources of milk.' },
  { prompt: 'Which part of a carrot do we eat?', options: ['Root', 'Stem', 'Flower'], answer: 'Root', why: 'The swollen carrot root stores food.' },
  { prompt: 'A tiger is a…', options: ['Herbivore', 'Carnivore', 'Omnivore'], answer: 'Carnivore', why: 'Carnivores eat the flesh of other animals.' },
  { prompt: 'A crow is a…', options: ['Herbivore', 'Carnivore', 'Omnivore'], answer: 'Omnivore', why: 'Crows eat both plant and animal foods.' },
  { prompt: 'What follows harvest?', options: ['Transport', 'Seed', 'Dining table'], answer: 'Transport', why: 'Harvested food is transported to markets and homes.' },
];

const COLORS: Record<FoodExplorerZone, number> = { welcome: 0x78b7d0, plants: 0x7ebc58, animals: 0x76b8c4, journey: 0xd7a85a, wildlife: 0x9caa62, assessment: 0x6f75a8 };

function box(scene: THREE.Group, size: [number, number, number], position: [number, number, number], color: number) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), new THREE.MeshStandardMaterial({ color, roughness: 0.82 }));
  mesh.position.set(...position); mesh.castShadow = true; mesh.receiveShadow = true; scene.add(mesh); return mesh;
}

function sphere(scene: THREE.Group, radius: number, position: [number, number, number], color: number) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 16, 12), new THREE.MeshStandardMaterial({ color, roughness: 0.75 }));
  mesh.position.set(...position); mesh.castShadow = true; scene.add(mesh); return mesh;
}

function makeTree(group: THREE.Group, x: number, z: number) {
  box(group, [0.22, 1.5, 0.22], [x, 0.75, z], 0x76502d);
  sphere(group, 0.72, [x, 1.72, z], 0x2f7d42);
  sphere(group, 0.5, [x - .45, 1.65, z + .08], 0x3f914c); sphere(group, 0.48, [x + .42, 1.72, z - .05], 0x347f42);
}

function makeAnimal(group: THREE.Group, x: number, z: number, color: number, scale = 1) {
  const body = sphere(group, 0.42 * scale, [x, 0.58 * scale, z], color);
  body.scale.set(1.45, 0.82, 0.72);
  sphere(group, 0.25 * scale, [x + 0.58 * scale, 0.72 * scale, z], color);
  [-0.32, 0.28].forEach(dx => [-0.2, 0.2].forEach(dz => box(group, [0.08, 0.48, 0.08], [x + dx * scale, 0.25 * scale, z + dz * scale], color)));
  sphere(group, .035 * scale, [x + .79 * scale, .78 * scale, z - .12 * scale], 0x111827);
  sphere(group, .035 * scale, [x + .79 * scale, .78 * scale, z + .12 * scale], 0x111827);
  const tail = box(group, [.05 * scale, .5 * scale, .05 * scale], [x - .62 * scale, .68 * scale, z], color); tail.rotation.z = -.6;
}

function makeFence(group: THREE.Group, z: number) {
  for (let x = -7; x <= 7; x += 1.4) box(group, [.1, .85, .1], [x, .42, z], 0x8b623d);
  box(group, [14.2, .09, .09], [0, .35, z], 0xa87646); box(group, [14.2, .09, .09], [0, .7, z], 0xa87646);
}

function makeFlower(group: THREE.Group, x: number, z: number, color: number) {
  box(group, [.025, .3, .025], [x, .15, z], 0x2f7d42); sphere(group, .09, [x, .34, z], color); sphere(group, .035, [x, .34, z], 0xffd43b);
}

function buildZone(group: THREE.Group, zone: FoodExplorerZone) {
  while (group.children.length) group.remove(group.children[0]);
  const ground = new THREE.Mesh(new THREE.CircleGeometry(22, 48), new THREE.MeshStandardMaterial({ color: COLORS[zone], roughness: 1 }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; group.add(ground);
  for (let i = 0; i < 14; i++) makeTree(group, Math.sin(i * 2.4) * (8 + i % 3), -5 - (i % 5) * 2);
  makeFence(group, 6.6);
  for (let i = 0; i < 34; i++) makeFlower(group, -7 + (i * 2.17) % 14, -4 + (i * 1.31) % 9, [0xf472b6, 0xfde047, 0xa78bfa, 0xffffff][i % 4]);

  if (zone === 'welcome') {
    box(group, [3.4, 1.8, 2.5], [-4, 0.9, -1.5], 0xe8c88c); box(group, [3.8, 0.35, 2.9], [-4, 2, -1.5], 0xa84f3c).rotation.z = 0.08;
    for (let i = 0; i < 7; i++) box(group, [0.65, 0.08, 5], [-1.8 + i * 0.8, 0.05, 1], i % 2 ? 0xb9c54a : 0x5f9a42);
    const river = box(group, [18, 0.03, 2.2], [3, 0.04, -4], 0x4da9c9); river.material = new THREE.MeshStandardMaterial({ color: 0x4da9c9, metalness: 0.15, roughness: 0.2 });
    box(group, [.25, 3.4, .25], [5.8, 1.7, 1.4], 0xe7e2d1); sphere(group, .2, [5.8, 3.25, 1.4], 0xdbeafe); for (let i = 0; i < 4; i++) { const blade = box(group, [.16, 1.5, .08], [5.8, 3.25, 1.4], 0xf8fafc); blade.geometry.translate(0, .75, 0); blade.rotation.z = i * Math.PI / 2; }
  } else if (zone === 'plants') {
    for (let row = 0; row < 6; row++) for (let col = 0; col < 8; col++) { const x = -4 + col * 1.1, z = -2 + row * .8; box(group, [.035, .45, .035], [x, .22, z], 0x39773c); sphere(group, 0.16, [x, 0.5, z], [0x4c9d4b, 0xe26d3f, 0xe9b949][(row + col) % 3]); }
    for (let i = 0; i < 5; i++) { makeTree(group, -5 + i * 2.3, -4); sphere(group, 0.11, [-5 + i * 2.3, 1.7, -3.45], 0xf3a52b); }
    box(group, [2.6, 0.18, 1.2], [0, 0.35, 3.5], 0x8c5b35);
  } else if (zone === 'animals') {
    box(group, [4.2, 2, 2.8], [-4, 1, -2], 0xe7d3a3); box(group, [4.8, 0.28, 3.2], [-4, 2.15, -2], 0xa7493d);
    makeAnimal(group, -1.2, 0.2, 0xf2eee3, 1.25); makeAnimal(group, 1.2, 1.5, 0xd6bd88, 0.8);
    const pond = new THREE.Mesh(new THREE.CircleGeometry(2.3, 32), new THREE.MeshStandardMaterial({ color: 0x3ca6c7, roughness: 0.25, metalness: 0.15 })); pond.rotation.x = -Math.PI / 2; pond.position.set(4, 0.04, -1.5); group.add(pond);
    for (let i = 0; i < 4; i++) box(group, [0.62, 0.38, 0.48], [2.3 + i * 0.65, 0.25 + i * 0.38, 3], 0xd8a52f);
    for (let i = 0; i < 7; i++) { const fish = sphere(group, .12, [3 + (i % 3) * .75, .1, -2.1 + Math.floor(i / 3) * .7], 0xffa94d); fish.scale.set(1.6, .7, .45); }
  } else if (zone === 'journey') {
    FOOD_JOURNEY.forEach((_, i) => { const a = (i / FOOD_JOURNEY.length) * Math.PI * 1.55 + 0.7; box(group, [1.1, 0.55, 1.1], [Math.cos(a) * 5.2, 0.3, Math.sin(a) * 5.2], 0xf0c568); });
    box(group, [2.4, 1.5, 1.2], [0, 0.8, 0], 0xc84b3b); for (const x of [-0.7, 0.7]) { const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.33, 0.16, 16), new THREE.MeshStandardMaterial({ color: 0x222222 })); wheel.rotation.x = Math.PI / 2; wheel.position.set(x, 0.25, 0.68); group.add(wheel); }
  } else if (zone === 'wildlife') {
    makeAnimal(group, -4.5, 0, 0xc99a42, 1); makeAnimal(group, -1.8, -2.4, 0xd7b274, 0.9); makeAnimal(group, 2, -2.2, 0xd36d2c, 1.15); makeAnimal(group, 4.2, 0.4, 0x5b3b2c, 1.25);
    box(group, [4, 2.2, 2.3], [5, 1.1, -5], 0x625746);
    const lake = new THREE.Mesh(new THREE.CircleGeometry(2.1, 32), new THREE.MeshStandardMaterial({ color: 0x439cc0, roughness: 0.25 })); lake.rotation.x = -Math.PI / 2; lake.position.set(-3.5, 0.04, 4); group.add(lake);
    for (let i = 0; i < 22; i++) { const grass = box(group, [.025, .35 + (i % 3) * .08, .025], [-6 + (i * 1.87) % 12, .18, -4 + (i * 2.31) % 9], 0x315f32); grass.rotation.z = (i % 2 ? 1 : -1) * .15; }
  } else {
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; box(group, [0.8, 1.2, 0.8], [Math.cos(a) * 4, 0.6, Math.sin(a) * 4], 0xd3bb72); }
    const orb = sphere(group, 0.65, [0, 1.7, 0], 0xffd84f); (orb.material as THREE.MeshStandardMaterial).emissive.setHex(0x9a6500);
  }
}

function fittedAsset(source: THREE.Object3D, targetSize: number, position: [number, number, number]) {
  const clone = source.clone(true); const initial = new THREE.Box3().setFromObject(clone); const size = initial.getSize(new THREE.Vector3());
  const scale = targetSize / Math.max(size.x, size.y, size.z, .001); clone.scale.setScalar(scale); clone.updateMatrixWorld(true);
  const fitted = new THREE.Box3().setFromObject(clone); const center = fitted.getCenter(new THREE.Vector3());
  clone.position.set(position[0] - center.x, position[1] - fitted.min.y, position[2] - center.z); clone.traverse(child => { if (child instanceof THREE.Mesh) { child.castShadow = true; child.receiveShadow = true; } });
  return clone;
}

export default function FoodSourcesSortingViewer() {
  const mountRef = useRef<HTMLDivElement>(null); const rendererRef = useRef<THREE.WebGLRenderer | null>(null); const worldRef = useRef<THREE.Group | null>(null);
  const assetTemplatesRef = useRef<Record<string, THREE.Object3D>>({});
  const zoneRef = useRef<FoodExplorerZone>('welcome');
  const model = useMemo(() => createFoodExplorerModel(), []); const [started, setStarted] = useState(false); const [vrSupported, setVrSupported] = useState(false);
  const [zone, setZone] = useState<FoodExplorerZone>('welcome'); const [discoveries, setDiscoveries] = useState<string[]>([]); const [message, setMessage] = useState(ZONES[0].cue);
  const [selectedCard, setSelectedCard] = useState('compass');
  const [assetStatus, setAssetStatus] = useState<'loading' | 'ready' | 'fallback'>('loading');
  const [question, setQuestion] = useState(0); const [answered, setAnswered] = useState<Record<number, boolean>>({}); const [score, setScore] = useState(0);
  const current = ZONES.find(item => item.id === zone)!; const progress = Math.round(((ZONES.findIndex(item => item.id === zone) + 1) / ZONES.length) * 100);

  useEffect(() => { if ('xr' in navigator) setVrSupported(true); }, []);
  useEffect(() => {
    const mount = mountRef.current; if (!mount) return;
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' }); renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5)); renderer.setSize(mount.clientWidth, mount.clientHeight); renderer.xr.enabled = true; renderer.xr.setReferenceSpaceType('local-floor'); renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05; mount.appendChild(renderer.domElement); rendererRef.current = renderer;
    const scene = new THREE.Scene(); scene.background = new THREE.Color(0x89c9e8); scene.fog = new THREE.Fog(0x9ed2e7, 15, 38);
    const camera = new THREE.PerspectiveCamera(65, mount.clientWidth / mount.clientHeight, 0.05, 80); const guided = createGuidedCamera(camera, renderer.domElement); guided.focusOn({ position: new THREE.Vector3(0, 4.6, 9), target: new THREE.Vector3(0, 0.8, 0) }, { animate: false });
    scene.add(new THREE.HemisphereLight(0xdff4ff, 0x49613b, 2.2)); const sun = new THREE.DirectionalLight(0xfff3d0, 3); sun.position.set(-5, 12, 7); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024); scene.add(sun);
    const world = new THREE.Group(); scene.add(world); worldRef.current = world; buildZone(world, 'welcome');
    const loader = new GLTFLoader(); let cancelled = false;
    Promise.allSettled([loader.loadAsync('/assets/food-explorer/farm-pack.glb')]).then(results => {
      if (cancelled) return; const farm = results[0].status === 'fulfilled' ? results[0].value.scene : undefined;
      if (farm) { assetTemplatesRef.current.farm = farm; if (['welcome', 'plants', 'animals', 'journey'].includes(zoneRef.current)) world.add(fittedAsset(farm, 14, [0, 0, -1.5])); }
      setAssetStatus(farm ? 'ready' : 'fallback');
    });
    for (let i = 0; i < 24; i++) { const cloud = sphere(world, 0.4 + (i % 3) * 0.18, [-10 + (i % 8) * 3, 6 + (i % 2), -10 - Math.floor(i / 8) * 3], 0xffffff); (cloud.material as THREE.MeshStandardMaterial).transparent = true; (cloud.material as THREE.MeshStandardMaterial).opacity = 0.75; }
    const controller0 = renderer.xr.getController(0); const controller1 = renderer.xr.getController(1); scene.add(controller0, controller1);
    const interactionSystem = createInteractionSystem({ camera, domElement: renderer.domElement, xrControllers: [controller0, controller1], onSelect: id => {
      if (id.startsWith('food-token-')) narrate(`Selected ${id.replace('food-token-', '')}. Now choose its source.`, 1);
      if (id.startsWith('food-platform-')) narrate(`This is the ${id.replace('food-platform-', '')} source category.`, 2);
    } });
    const sortingRig = new THREE.Group(); sortingRig.position.set(-6.2, 0, 2.2); scene.add(sortingRig);
    const sortingItems = [{ id: 'rice', color: 0xf5d56a }, { id: 'milk', color: 0xf4f1e8 }];
    sortingItems.forEach((item, index) => { const token = sphere(sortingRig, .24, [index * .65, 1.15, 0], item.color); token.name = `food-token-${item.id}`; interactionSystem.register(token.name, token, { highlightColor: '#f5d56a' }); });
    const sortingCategories = [{ id: 'plant', color: 0x4ade80 }, { id: 'animal', color: 0xfb7185 }];
    sortingCategories.forEach((category, index) => { const platform = box(sortingRig, [.55, .12, .55], [index * .75, .65, 0], category.color); platform.name = `food-platform-${category.id}`; interactionSystem.register(platform.name, platform, { highlightColor: category.id === 'plant' ? '#4ade80' : '#fb7185' }); });
    const clock = new THREE.Clock(); renderer.setAnimationLoop(() => { const dt = clock.getDelta(); if (!renderer.xr.isPresenting) guided.update(dt); world.rotation.y = Math.sin(clock.elapsedTime * 0.08) * 0.012; renderer.render(scene, camera); });
    const resize = () => { camera.aspect = mount.clientWidth / mount.clientHeight; camera.updateProjectionMatrix(); renderer.setSize(mount.clientWidth, mount.clientHeight); }; addEventListener('resize', resize);
    return () => { cancelled = true; removeEventListener('resize', resize); renderer.setAnimationLoop(null); interactionSystem.dispose(); guided.dispose(); renderer.dispose(); mount.removeChild(renderer.domElement); stopSimulationNarration(); };
  }, []);

  function narrate(text: string, index = 0) { setMessage(text); void playSimulationNarration(text, index, `/audio/food-sources/stage-0${Math.min(index + 1, 4)}.mp3`); }
  function setStageNarration(index: number) { playSimulationNarration(NARRATIONS[index], index, NARRATION_AUDIO_URLS[index]); }
  function travel(next: FoodExplorerZone) { zoneRef.current = next; setZone(next); setSelectedCard(DISCOVERIES[next][0]?.id ?? ''); model.travel(next); if (worldRef.current) { buildZone(worldRef.current, next); const assets = assetTemplatesRef.current; if (assets.farm && ['welcome', 'plants', 'animals', 'journey'].includes(next)) worldRef.current.add(fittedAsset(assets.farm, 14, [0, 0, -1.5])); } const info = ZONES.find(item => item.id === next)!; narrate(`${info.place}. ${info.cue}`, ZONES.findIndex(item => item.id === next)); }
  function discover(id: string, label: string, fact: string) { setSelectedCard(id); model.discover(id); setDiscoveries(model.snapshot().discoveries); narrate(`${label}. ${fact}`, discoveries.length % 4); }
  function answer(option: string) { if (answered[question] !== undefined) return; const correct = option === QUESTIONS[question].answer; model.answer(correct); setAnswered(old => ({ ...old, [question]: correct })); if (correct) setScore(value => value + 1); narrate(`${correct ? 'Excellent, explorer!' : 'Good try.'} ${QUESTIONS[question].why}`, question % 4); }
  async function enterVr() { setStarted(true); narrate(`Professor Green: ${ZONES[0].cue}`); if (!rendererRef.current || !navigator.xr) return; const session = await navigator.xr.requestSession('immersive-vr', { optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking'] }); await rendererRef.current.xr.setSession(session); }
  const completed = Object.keys(answered).length === QUESTIONS.length;
  const selectedDiscovery = DISCOVERIES[zone].find(item => item.id === selectedCard);
  const selectedMeta = selectedDiscovery ? CARD_META[selectedDiscovery.id] ?? { icon: zone === 'journey' ? '🚚' : '🔎', type: zone === 'journey' ? 'Food Journey Stage' : 'Discovery', detail: selectedDiscovery.fact, accent: '#f5d56a' } : undefined;

  return <main style={{ width: '100vw', height: '100vh', overflow: 'hidden', background: '#102417' }}>
    <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
    {!started ? <section style={splashStyle}>
      <div style={{ maxWidth: 760, textAlign: 'center', color: 'white' }}><div style={eyebrowStyle}>Class 6 Science · 15–18 min · Quest 3/3S</div><h1 style={{ fontSize: 'clamp(2.7rem, 7vw, 5.5rem)', lineHeight: .92, margin: '16px 0' }}>Young Food<br/><span style={{ color: '#f5d56a' }}>Explorer</span></h1><p style={{ fontSize: 18, lineHeight: 1.6, color: '#deeadc' }}>A story-driven field trip with Professor Green through an Indian farm, village, food supply journey, and wildlife sanctuary.</p><div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginTop: 28 }}><button style={primaryButton} onClick={() => { setStarted(true); narrate(`Professor Green: ${ZONES[0].cue}`); }}>Begin Field Trip</button><button style={secondaryButton} disabled={!vrSupported} onClick={enterVr}>{vrSupported ? 'Enter VR' : 'VR unavailable'}</button></div><p style={{ fontSize: 12, color: '#aac0a9' }}>Seated or standing · controller + hand tracking · comfort-first guided travel</p></div>
    </section> : <>
      <header style={topBar}><div><div style={eyebrowStyle}>{current.place}</div><strong style={{ fontSize: 22 }}>{current.title}</strong></div><div style={{ minWidth: 150 }}><div style={{ fontSize: 11, textAlign: 'right', color: assetStatus === 'ready' ? '#a7e08e' : '#dbe7d8' }}>{assetStatus === 'ready' ? '◆ Detailed 3D assets ready' : assetStatus === 'loading' ? 'Loading detailed world…' : 'Optimized fallback world'}</div><div style={{ fontSize: 12, textAlign: 'right', marginTop: 4 }}>{progress}% journey</div><div style={{ height: 7, background: '#ffffff22', borderRadius: 8, marginTop: 5 }}><div style={{ width: `${progress}%`, height: '100%', borderRadius: 8, background: '#f5d56a' }} /></div></div></header>
      <aside style={panelStyle}><p style={{ margin: '0 0 14px', lineHeight: 1.45, color: '#dcebd9' }}>{message}</p>
        {zone !== 'assessment' && selectedDiscovery && selectedMeta && <article style={{ ...infoCardStyle, borderColor: `${selectedMeta.accent}88` }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}><div style={{ ...cardIconStyle, background: `${selectedMeta.accent}25` }}>{selectedMeta.icon}</div><div><div style={{ color: selectedMeta.accent, fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1 }}>{selectedMeta.type}</div><h3 style={{ margin: '3px 0 0', fontSize: 20 }}>{selectedDiscovery.label}</h3></div></div>
          <p style={{ color: '#dcebd9', margin: '12px 0 8px', lineHeight: 1.45 }}>{selectedDiscovery.fact}</p><div style={{ color: '#aec7ad', fontSize: 12, lineHeight: 1.4 }}>{selectedMeta.detail}</div>
          <button onClick={() => narrate(`${selectedDiscovery.label}. ${selectedDiscovery.fact} ${selectedMeta.detail}`, discoveries.length % 4)} style={replayButton}>▶ Replay narration</button>
        </article>}
        {zone !== 'assessment' ? <><div style={cardGrid}>{DISCOVERIES[zone].map(item => <button key={item.id} style={discoveryButton(discoveries.includes(item.id))} onClick={() => discover(item.id, item.label, item.fact)}>{discoveries.includes(item.id) ? '✓ ' : ''}{item.label}</button>)}</div><div style={{ fontSize: 12, color: '#a9c3a8', marginTop: 12 }}>{DISCOVERIES[zone].filter(item => discoveries.includes(item.id)).length}/{DISCOVERIES[zone].length} discoveries at this stop</div></> : <div>
          {!completed ? <><div style={{ color: '#f5d56a', fontSize: 12, fontWeight: 800 }}>QUESTION {question + 1} OF {QUESTIONS.length}</div><h3 style={{ margin: '8px 0 14px' }}>{QUESTIONS[question].prompt}</h3><div style={cardGrid}>{QUESTIONS[question].options.map(option => <button key={option} style={discoveryButton(false)} onClick={() => answer(option)}>{option}</button>)}</div>{answered[question] !== undefined && <button style={{ ...primaryButton, width: '100%', marginTop: 12 }} onClick={() => setQuestion(value => Math.min(value + 1, QUESTIONS.length - 1))}>{question === QUESTIONS.length - 1 ? 'Show achievements' : 'Next question'}</button>}</> : <div style={{ textAlign: 'center' }}><div style={{ fontSize: 46 }}>🏆</div><h2>Food Explorer</h2><p>You scored {score}/{QUESTIONS.length} and completed the field trip.</p><div style={{ fontSize: 26, letterSpacing: 8 }}>🌾 🦁 🌍</div><p style={{ color: '#f5d56a', fontWeight: 800 }}>Farm Friend · Wildlife Expert · Nature Protector</p></div>}
        </div>}
      </aside>
      <nav style={navStyle}>{ZONES.map(item => <button key={item.id} title={item.title} aria-label={item.title} onClick={() => travel(item.id)} style={navButton(item.id === zone)}>{ZONES.indexOf(item) + 1}<span style={{ display: 'block', fontSize: 9, marginTop: 2 }}>{item.place.split(' ')[0]}</span></button>)}</nav>
    </>}
  </main>;
}

const splashStyle: CSSProperties = { position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', padding: 24, background: 'radial-gradient(circle at 50% 28%, rgba(42,91,57,.55), rgba(8,25,16,.94) 70%)', backdropFilter: 'blur(3px)' };
const eyebrowStyle: CSSProperties = { color: '#a7e08e', fontSize: 12, fontWeight: 900, letterSpacing: 1.5, textTransform: 'uppercase' };
const primaryButton: CSSProperties = { border: 0, borderRadius: 999, padding: '13px 22px', background: '#f5d56a', color: '#182313', fontWeight: 900, cursor: 'pointer' };
const secondaryButton: CSSProperties = { ...primaryButton, color: 'white', background: '#ffffff20', border: '1px solid #ffffff44' };
const topBar: CSSProperties = { position: 'absolute', left: 18, right: 18, top: 18, color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 16px', borderRadius: 16, background: '#102417d9', border: '1px solid #ffffff22', backdropFilter: 'blur(12px)' };
const panelStyle: CSSProperties = { position: 'absolute', right: 18, top: 105, width: 'min(410px, calc(100vw - 36px))', maxHeight: 'calc(100vh - 205px)', overflowY: 'auto', padding: 16, borderRadius: 18, background: '#102417e8', border: '1px solid #ffffff22', color: 'white', backdropFilter: 'blur(14px)' };
const cardGrid: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 };
const infoCardStyle: CSSProperties = { padding: 14, marginBottom: 12, borderRadius: 16, background: 'linear-gradient(145deg, #ffffff16, #ffffff08)', border: '1px solid', boxShadow: '0 12px 30px #00000030' };
const cardIconStyle: CSSProperties = { width: 52, height: 52, borderRadius: 14, display: 'grid', placeItems: 'center', fontSize: 29, flexShrink: 0 };
const replayButton: CSSProperties = { width: '100%', marginTop: 11, border: '1px solid #ffffff22', borderRadius: 9, padding: '8px 10px', background: '#ffffff0b', color: '#e8f4e6', fontWeight: 800, cursor: 'pointer' };
const discoveryButton = (done: boolean): CSSProperties => ({ border: `1px solid ${done ? '#a7e08e' : '#ffffff22'}`, borderRadius: 12, padding: '11px 9px', background: done ? '#2f633f' : '#ffffff10', color: 'white', textAlign: 'left', fontWeight: 750, cursor: 'pointer' });
const navStyle: CSSProperties = { position: 'absolute', left: '50%', bottom: 18, transform: 'translateX(-50%)', display: 'flex', gap: 7, padding: 8, borderRadius: 18, background: '#102417e8', border: '1px solid #ffffff22', backdropFilter: 'blur(12px)' };
const navButton = (active: boolean): CSSProperties => ({ width: 54, height: 48, border: 0, borderRadius: 12, background: active ? '#f5d56a' : '#ffffff13', color: active ? '#182313' : 'white', fontWeight: 900, cursor: 'pointer' });
