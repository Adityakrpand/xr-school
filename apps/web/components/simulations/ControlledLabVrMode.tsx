'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export type VrLabAction = { id: string; label: string; onSelect: () => void };

type Props = {
  title: string;
  sampleLabel: string;
  observationColour: string;
  instruction: string;
  actions: VrLabAction[];
  accent: string;
  onBack: () => void;
  onNarrate: () => void;
};

function labelTexture(text: string, accent: string) {
  const canvas = document.createElement('canvas');
  canvas.width = 900; canvas.height = 220;
  const context = canvas.getContext('2d');
  if (!context) return new THREE.CanvasTexture(canvas);
  context.fillStyle = '#07111f'; context.fillRect(0, 0, 900, 220);
  context.strokeStyle = accent; context.lineWidth = 10; context.strokeRect(8, 8, 884, 204);
  context.fillStyle = '#f8fafc'; context.font = 'bold 48px system-ui'; context.textAlign = 'center'; context.textBaseline = 'middle';
  context.fillText(text.slice(0, 48), 450, 110);
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; return texture;
}

function controllerRay() {
  return new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(0, 0, -4)]), new THREE.LineBasicMaterial({ color: 0x67e8f9 }));
}

export default function ControlledLabVrMode({ title, sampleLabel, observationColour, instruction, actions, accent, onBack, onNarrate }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const liquidRef = useRef<THREE.Mesh | null>(null);
  const sampleLabelRef = useRef<THREE.Mesh | null>(null);
  const instructionRef = useRef<THREE.Mesh | null>(null);
  const actionMeshesRef = useRef<THREE.Mesh[]>([]);
  const actionsRef = useRef(actions);
  const backRef = useRef(onBack);
  const narrateRef = useRef(onNarrate);
  const [supported, setSupported] = useState(false);
  const [active, setActive] = useState(false);

  actionsRef.current = actions;
  backRef.current = onBack;
  narrateRef.current = onNarrate;

  useEffect(() => {
    navigator.xr?.isSessionSupported('immersive-vr').then(setSupported).catch(() => setSupported(false));
  }, []);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.xr.enabled = true; renderer.xr.setReferenceSpaceType('local-floor'); renderer.setSize(2, 2); renderer.setPixelRatio(1);
    mount.appendChild(renderer.domElement); rendererRef.current = renderer;
    const scene = new THREE.Scene(); scene.background = new THREE.Color(0x06111d);
    const camera = new THREE.PerspectiveCamera(65, 1, 0.05, 40); camera.position.set(0, 1.65, 3.1);
    // WebXR supplies the tracked headset pose at the local-floor origin and
    // ignores the desktop camera position. Start the whole player rig at a
    // calibrated viewing station so the bench is ~3 metres in front, not
    // intersecting the user's head.
    const playerRig = new THREE.Group(); playerRig.position.set(0, 0, 2.8); playerRig.add(camera); scene.add(playerRig);
    scene.add(new THREE.HemisphereLight(0xdbeafe, 0x172033, 1.5));
    const key = new THREE.DirectionalLight(0xffffff, 2); key.position.set(3, 6, 4); scene.add(key);
    const floor = new THREE.Mesh(new THREE.CircleGeometry(7, 64), new THREE.MeshStandardMaterial({ color: 0x152536, roughness: 0.9 })); floor.rotation.x = -Math.PI / 2; scene.add(floor);
    const bench = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.2, 2.3), new THREE.MeshStandardMaterial({ color: 0x68462f, roughness: 0.7 })); bench.position.set(0, 0.82, -0.4); scene.add(bench);
    const glassMaterial = new THREE.MeshStandardMaterial({ color: 0xdbeafe, transparent: true, opacity: 0.2, side: THREE.DoubleSide, depthWrite: false, roughness: 0.08 });
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.36, 1.65, 48, 1, true), glassMaterial); tube.position.set(0, 1.68, -0.35); tube.renderOrder = 3; scene.add(tube);
    const liquidMaterial = new THREE.MeshStandardMaterial({ color: observationColour, roughness: 0.3, transparent: false, emissive: observationColour, emissiveIntensity: 0.12 });
    const liquid = new THREE.Mesh(new THREE.CylinderGeometry(0.37, 0.31, 1.08, 48), liquidMaterial); liquid.position.set(0, 1.42, -0.35); liquid.renderOrder = 1; scene.add(liquid); liquidRef.current = liquid;
    const liquidSurface = new THREE.Mesh(new THREE.CircleGeometry(0.37, 48), liquidMaterial); liquidSurface.rotation.x = -Math.PI / 2; liquidSurface.position.set(0, 1.965, -0.35); liquidSurface.renderOrder = 1; scene.add(liquidSurface);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.46, 0.025, 10, 48), new THREE.MeshStandardMaterial({ color: 0xe0f2fe, metalness: 0.05, roughness: 0.15 })); rim.rotation.x = Math.PI / 2; rim.position.set(0, 2.5, -0.35); scene.add(rim);
    const heading = new THREE.Mesh(new THREE.PlaneGeometry(3.8, 0.78), new THREE.MeshBasicMaterial({ map: labelTexture(title, accent) })); heading.position.set(0, 2.75, -1.15); scene.add(heading);
    const sample = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.44), new THREE.MeshBasicMaterial({ map: labelTexture(sampleLabel, accent) })); sample.position.set(0, 0.96, 0.25); sample.rotation.x = -0.38; scene.add(sample); sampleLabelRef.current = sample;
    const guide = new THREE.Mesh(new THREE.PlaneGeometry(4.3, 0.7), new THREE.MeshBasicMaterial({ map: labelTexture(instruction, accent) })); guide.position.set(0, 2.15, -1.3); scene.add(guide); instructionRef.current = guide;

    actionMeshesRef.current = [];
    actionsRef.current.forEach((action, index) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.2, 0.08), new THREE.MeshStandardMaterial({ color: accent, emissive: accent, emissiveIntensity: 0.18 }));
      mesh.name = `vr-lab-action-${action.id}`; mesh.position.set(-1.8 + index * 1.2, 1.12, 0.62);
      const label = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 0.16), new THREE.MeshBasicMaterial({ map: labelTexture(action.label, accent), depthTest: false })); label.position.z = 0.05; mesh.add(label); scene.add(mesh); actionMeshesRef.current.push(mesh);
    });
    const exitMesh = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.22, 0.08), new THREE.MeshStandardMaterial({ color: 0xdc2626, emissive: 0x7f1d1d, emissiveIntensity: 0.35 }));
    exitMesh.name = 'vr-lab-action-exit'; exitMesh.position.set(0, 0.62, 0.55);
    const exitLabel = new THREE.Mesh(new THREE.PlaneGeometry(1.05, 0.17), new THREE.MeshBasicMaterial({ map: labelTexture('Exit VR', '#ef4444'), depthTest: false })); exitLabel.position.z = 0.05; exitMesh.add(exitLabel); scene.add(exitMesh); actionMeshesRef.current.push(exitMesh);

    const raycaster = new THREE.Raycaster(); const rotation = new THREE.Matrix4();
    const controllers: THREE.Group[] = [];
    [0, 1].forEach(index => {
      const controller = renderer.xr.getController(index); controller.add(controllerRay()); playerRig.add(controller); controllers.push(controller);
      controller.addEventListener('connected', event => { controller.userData.handedness = (event.data as XRInputSource).handedness; });
      controller.addEventListener('selectstart', () => {
        rotation.identity().extractRotation(controller.matrixWorld);
        raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld); raycaster.ray.direction.set(0, 0, -1).applyMatrix4(rotation);
        const hit = raycaster.intersectObjects(actionMeshesRef.current, false)[0]?.object;
        if (!hit) return;
        const id = hit.name.replace('vr-lab-action-', '');
        if (id === 'exit') { void renderer.xr.getSession()?.end(); return; }
        actionsRef.current.find(action => action.id === id)?.onSelect();
      });
      // Quest exposes squeeze consistently even when auxiliary face-button
      // indices vary by controller profile. Right grip mirrors B/Back.
      controller.addEventListener('squeezestart', () => { if (controller.userData.handedness === 'right') backRef.current(); });
    });
    const previousButtons = new Map<string, boolean>();
    const backPressedAt = new Map<string, number>();
    const backExitTriggered = new Set<string>();
    let snapReady = true;
    const clock = new THREE.Clock();
    const forward = new THREE.Vector3(); const right = new THREE.Vector3(); const move = new THREE.Vector3();
    renderer.setAnimationLoop(() => {
      const delta = Math.min(clock.getDelta(), 0.05);
      const session = renderer.xr.getSession();
      session?.inputSources.forEach((source, index) => {
        const gamepad = source.gamepad; if (!gamepad) return;
        const axes = gamepad.axes; const x = axes.length >= 4 ? axes[2] : axes[0] ?? 0; const y = axes.length >= 4 ? axes[3] : axes[1] ?? 0;
        if (source.handedness === 'left') {
          camera.getWorldDirection(forward); forward.y = 0; forward.normalize(); right.crossVectors(forward, camera.up).normalize();
          move.copy(forward).multiplyScalar(-y).addScaledVector(right, x);
          if (move.lengthSq() > 0.04) { move.normalize().multiplyScalar(delta * 1.25); playerRig.position.add(move); playerRig.position.x = THREE.MathUtils.clamp(playerRig.position.x, -2.4, 2.4); playerRig.position.z = THREE.MathUtils.clamp(playerRig.position.z, 1.1, 3.4); }
        }
        if (source.handedness === 'right') {
          if (Math.abs(x) > 0.72 && snapReady) { playerRig.rotateY(x > 0 ? -Math.PI / 6 : Math.PI / 6); snapReady = false; }
          if (Math.abs(x) < 0.25) snapReady = true;
        }
        // In xr-standard profiles the auxiliary face buttons follow the core
        // trigger/squeeze/stick controls, but their absolute indices can vary.
        // Treat the highest right-hand auxiliary button as B/Back.
        const auxiliaryButtons = gamepad.buttons.slice(4);
        const highestAuxiliary = auxiliaryButtons.length ? auxiliaryButtons[auxiliaryButtons.length - 1] : undefined;
        const auxiliaryPressed = Boolean(highestAuxiliary?.pressed || (highestAuxiliary?.value ?? 0) > 0.75);
        const backPressed = source.handedness === 'right' && auxiliaryPressed;
        const backKey = `${source.handedness}-back`; const wasBack = previousButtons.get(backKey) ?? false;
        if (backPressed && !wasBack) { backRef.current(); backPressedAt.set(backKey, Date.now()); backExitTriggered.delete(backKey); }
        if (backPressed && !backExitTriggered.has(backKey) && Date.now() - (backPressedAt.get(backKey) ?? Date.now()) > 1000) { backExitTriggered.add(backKey); void session.end(); }
        if (!backPressed) backPressedAt.delete(backKey);
        previousButtons.set(backKey, backPressed);
        const narratePressed = source.handedness === 'left' && auxiliaryPressed;
        const narrateKey = `${source.handedness}-narrate`; const wasNarrate = previousButtons.get(narrateKey) ?? false;
        if (narratePressed && !wasNarrate) narrateRef.current(); previousButtons.set(narrateKey, narratePressed);

        const controller = controllers[index];
        if (controller) {
          rotation.identity().extractRotation(controller.matrixWorld); raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld); raycaster.ray.direction.set(0, 0, -1).applyMatrix4(rotation);
          const hovered = raycaster.intersectObjects(actionMeshesRef.current, false)[0]?.object;
          actionMeshesRef.current.forEach(mesh => { const material = mesh.material as THREE.MeshStandardMaterial; material.emissiveIntensity = mesh === hovered ? 0.75 : 0.18; mesh.scale.setScalar(mesh === hovered ? 1.08 : 1); });
        }
      });
      renderer.render(scene, camera);
    });
    return () => { renderer.setAnimationLoop(null); renderer.dispose(); if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement); };
  }, []);

  useEffect(() => {
    if (liquidRef.current) { const material = liquidRef.current.material as THREE.MeshStandardMaterial; material.color.set(observationColour); material.emissive.set(observationColour); }
    if (sampleLabelRef.current) { const material = sampleLabelRef.current.material as THREE.MeshBasicMaterial; material.map?.dispose(); material.map = labelTexture(sampleLabel, accent); material.needsUpdate = true; }
    if (instructionRef.current) { const material = instructionRef.current.material as THREE.MeshBasicMaterial; material.map?.dispose(); material.map = labelTexture(instruction, accent); material.needsUpdate = true; }
  }, [sampleLabel, observationColour, instruction, accent]);

  async function enterVr() {
    const renderer = rendererRef.current;
    if (!renderer || !navigator.xr) return;
    // Start speech inside the same headset user gesture that requests XR;
    // Quest otherwise may suspend synthesis when the immersive session begins.
    narrateRef.current();
    const session = await navigator.xr.requestSession('immersive-vr', { optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking'] });
    session.addEventListener('end', () => setActive(false)); setActive(true); await renderer.xr.setSession(session);
  }

  return <><div ref={mountRef} aria-hidden="true" style={{ position: 'fixed', width: 2, height: 2, opacity: 0, pointerEvents: 'none' }} /><button onClick={enterVr} disabled={!supported || active} style={{ border: 0, borderRadius: 11, padding: '11px 16px', color: supported ? '#07111f' : '#cbd5e1', background: supported ? accent : '#475569', fontWeight: 850, cursor: supported ? 'pointer' : 'not-allowed' }}>{active ? 'VR active · Trigger interact · B back · Hold B/Exit VR to quit' : supported ? 'Enter VR' : 'VR unavailable'}</button></>;
}
