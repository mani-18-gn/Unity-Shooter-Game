// ROADBOUND - Dynamic 5-Star Law Enforcement & Pursuit Tactics AI
import * as THREE from 'three';
import { VehicleModels } from '../vehicle/VehicleModels.js';

export class PoliceAI {
  constructor(scene, terrain, audioManager, gameState) {
    this.scene = scene;
    this.terrain = terrain;
    this.audio = audioManager;
    this.gameState = gameState;

    this.cruisers = [];
    this.helicopter = null;
    this.searchlight = null;
    this.escapeTimer = 0;
    this.searchRadius = 120;

    this.initHelicopter();
    this.spawnPoliceCruiser();
  }

  initHelicopter() {
    this.helicopterGroup = new THREE.Group();
    this.helicopterGroup.name = 'Police_Helicopter';

    // Helicopter body
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x0a0c10, roughness: 0.3, metalness: 0.8 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.2, 7.5), bodyMat);
    this.helicopterGroup.add(body);

    // Tail boom
    const boom = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 6.0), bodyMat);
    boom.position.set(0, 0.4, -6.0);
    this.helicopterGroup.add(boom);

    // Main Rotor Blades
    const rotorMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8 });
    const rotor = new THREE.Mesh(new THREE.BoxGeometry(11.0, 0.08, 0.45), rotorMat);
    rotor.position.set(0, 1.4, 0);
    this.helicopterGroup.add(rotor);
    this.rotor = rotor;

    // High-Intensity Downward Searchlight
    this.searchlight = new THREE.SpotLight(0xffffff, 0, 160, Math.PI / 8, 0.5);
    this.searchlight.position.set(0, -0.5, 1.0);
    const searchTarget = new THREE.Object3D();
    this.helicopterGroup.add(searchTarget);
    this.helicopterGroup.add(this.searchlight);
    this.searchlight.target = searchTarget;
    this.searchTarget = searchTarget;

    this.helicopterGroup.position.set(0, 85, 0);
    this.scene.add(this.helicopterGroup);
  }

  spawnPoliceCruiser() {
    const mats = VehicleModels.createMaterials('#0d1117', 'gloss', '#111111');
    const vehData = VehicleModels.buildPoliceCruiser(mats);

    const root = vehData.root;
    root.position.set(0, 0.5, -150);
    this.scene.add(root);

    this.cruisers.push({
      root: root,
      wheels: vehData.wheels,
      strobes: vehData.strobes,
      strobeTimer: 0,
      heading: 0,
      speed: 0,
      maxSpeed: 28 // ~62 mph
    });
  }

  update(delta, playerPos, playerInVehicle) {
    const wanted = this.gameState.police.wantedLevel;

    // Rotor spin
    if (this.rotor) {
      this.rotor.rotation.y += delta * 35;
    }

    if (wanted === 0 || !playerPos) {
      // Standby / Patrol mode
      this.searchlight.intensity = 0;
      this.audio.updatePoliceSiren(0);
      return;
    }

    // 1. Helicopter tracking (Wanted 4-5)
    if (wanted >= 4) {
      this.searchlight.intensity = 4.5;
      const heliTarget = new THREE.Vector3(playerPos.x, 75, playerPos.z);
      this.helicopterGroup.position.lerp(heliTarget, delta * 1.8);
      this.searchTarget.position.set(0, -75, 0);
    } else {
      this.searchlight.intensity = 0;
      this.helicopterGroup.position.y = 150; // Elevated out of sight
    }

    // 2. Cruiser Pursuits
    let nearestDist = Infinity;

    for (const c of this.cruisers) {
      // Strobe flash
      c.strobeTimer += delta * 14;
      if (c.strobes) {
        const idx = Math.floor(c.strobeTimer) % 2;
        c.strobes[0].material.emissiveIntensity = idx === 0 ? 3.5 : 0.2;
        c.strobes[1].material.emissiveIntensity = idx === 1 ? 3.5 : 0.2;
      }

      const distToPlayer = c.root.position.distanceTo(playerPos);
      if (distToPlayer < nearestDist) nearestDist = distToPlayer;

      // Tactical pursuit trajectory
      const toPlayer = playerPos.clone().sub(c.root.position);
      toPlayer.y = 0;
      const targetHeading = Math.atan2(toPlayer.x, toPlayer.z);

      c.heading += (targetHeading - c.heading) * (delta * 4.5);
      c.root.rotation.y = c.heading;

      // Accelerate towards player (Attempt PIT maneuver)
      const desiredSpeed = distToPlayer > 8 ? c.maxSpeed : 12;
      c.speed += (desiredSpeed - c.speed) * (delta * 3.0);

      const moveStep = c.speed * delta;
      c.root.position.x += Math.sin(c.heading) * moveStep;
      c.root.position.z += Math.cos(c.heading) * moveStep;
      c.root.position.y = this.terrain.getGroundHeight(c.root.position.x, c.root.position.z) + 0.35;

      if (c.wheels) {
        c.wheels.forEach(w => {
          w.rotator.rotation.x += moveStep * 2.5;
        });
      }

      // Ramming / Damage check
      if (distToPlayer < 3.5) {
        if (playerInVehicle) {
          // PIT bump
          this.audio.playImpactSound(0.75);
        } else {
          // Player hit on foot
          this.gameState.takeDamage(15);
        }
      }
    }

    // Dynamic Police Siren Audio
    this.audio.updatePoliceSiren(wanted, nearestDist);

    // Escape mechanics: If player is beyond search radius (> 140m)
    if (nearestDist > this.searchRadius) {
      this.escapeTimer += delta;
      if (this.escapeTimer > 10) {
        // Cooled down! Reduce wanted stars
        this.escapeTimer = 0;
        this.gameState.setWantedLevel(wanted - 1);
      }
    } else {
      this.escapeTimer = 0;
    }
  }
}
