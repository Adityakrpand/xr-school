import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
const source = readFileSync(resolve(process.cwd(), 'apps/web/components/simulations/ControlledLabVrMode.tsx'), 'utf8');
describe('shared controlled laboratory VR mode', () => {
  it('requests a real immersive WebXR session', () => {
    expect(source).toContain("isSessionSupported('immersive-vr')");
    expect(source).toContain("requestSession('immersive-vr'");
    expect(source).toContain('renderer.xr.setSession(session)');
    expect(source).toContain('Enter VR');
  });
  it('supports controller-ray procedure actions', () => {
    expect(source).toContain('renderer.xr.getController(index)');
    expect(source).toContain("controller.addEventListener('selectstart'");
    expect(source).toContain('raycaster.intersectObjects');
    expect(source).toContain('vr-lab-action-');
    expect(source).toContain('gamepad.buttons.slice(4)');
    expect(source).toContain("source.handedness === 'right'");
    expect(source).toContain("controller.addEventListener('squeezestart'");
    expect(source).toContain('playerRig.position.set(0, 0, 2.8)');
    expect(source).toContain('playerRig.position.add(move)');
    expect(source).toContain('playerRig.rotateY');
    expect(source).toContain('emissiveIntensity = mesh === hovered');
    expect(source).toContain("exitMesh.name = 'vr-lab-action-exit'");
    expect(source).toContain("labelTexture('Exit VR'");
    expect(source).toContain('void session.end()');
    expect(source).toContain('backPressedAt');
    expect(source).toContain('depthWrite: false');
    expect(source).toContain('liquidSurface');
    expect(source).toContain('liquid.renderOrder = 1');
  });
});
