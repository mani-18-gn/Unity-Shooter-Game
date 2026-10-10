// ROADBOUND - Advanced Multi-Vehicle Rule-Following AI Traffic & Intersection State Machine
import * as THREE from 'three';
import { VehicleModels } from '../vehicle/VehicleModels.js';

export class TrafficAI {
  constructor(scene, roadNetwork, terrain, trafficLightSystem = null, pedestrianAI = null, audioManager = null) {
    this.scene = scene;
    this.roadNetwork = roadNetwork;
    this.terrain = terrain;
    this.trafficLights = trafficLightSystem;
    this.pedestrianAI = pedestrianAI;
    this.audio = audioManager;
    this.vehicles = [];

    this.spawnDiverseTrafficPool(8);
  }

  setSystems(trafficLightSystem, pedestrianAI, audioManager) {
    if (trafficLightSystem) this.trafficLights = trafficLightSystem;
    if (pedestrianAI) this.pedestrianAI = pedestrianAI;
    if (audioManager) this.audio = audioManager;
  }

  spawnDiverseTrafficPool(count) {
    const trafficPaints = [
      '#0f592f', // Auto green
      '#0b0f19', // Midnight navy
      '#3a4049', // Charcoal
      '#8c2424', // Crimson
      '#2b4f3b', // Racing green
      '#dcdcdc', // Pure silver
      '#f5c71a', // Auto yellow
      '#2d2f34'  // Titanium
    ];

    for (let i = 0; i < count; i++) {
      const paint = trafficPaints[i % trafficPaints.length];
      const mats = VehicleModels.createMaterials(paint, 'gloss', '#222222');

      // Diverse vehicle fleet: Tuk-Tuks, Luxury Sedans, Kodiak Muscle, Stratus 4x4, Apex
      let vehData;
      let modelType = 'sedan';
      if (i % 4 === 0) {
        vehData = VehicleModels.buildAutoRickshaw(mats);
        modelType = 'tuk_tuk';
      } else if (i % 4 === 1) {
        vehData = VehicleModels.buildLuxurySedan(mats);
        modelType = 'sovereign_v12';
      } else if (i % 4 === 2) {
        vehData = VehicleModels.buildKodiakV8(mats);
        modelType = 'kodiak_v8';
      } else {
        vehData = VehicleModels.buildStratusOverlander(mats);
        modelType = 'stratus_4x4';
      }

      const root = vehData.root;
      this.scene.add(root);

      // Start at different road network nodes
      const startNode = this.roadNetwork.nodes[(i * 4) % this.roadNetwork.nodes.length];
      root.position.copy(startNode.pos);

      this.vehicles.push({
        id: i,
        type: modelType,
        root: root,
        wheels: vehData.wheels,
        currentNodeIdx: startNode.id,
        targetPos: this.roadNetwork.getRandomWaypoint(),
        baseSpeed: modelType === 'tuk_tuk' ? 9.5 : (12 + Math.random() * 6), // ~22 - 40 mph
        currentSpeed: 0,
        heading: 0,
        blockedTimer: 0,
        lastHonkTime: 0
      });
    }
  }

  update(delta, playerPos, playerInVehicle = false) {
    const now = Date.now();

    for (let i = 0; i < this.vehicles.length; i++) {
      const v = this.vehicles[i];
      const currentPos = v.root.position;

      // 1. Waypoint reached check
      const distToTarget = currentPos.distanceTo(v.targetPos);
      if (distToTarget < 7.0) {
        v.targetPos = this.roadNetwork.getRandomWaypoint();
      }

      // 2. Heading direction towards next road node
      const forwardDir = v.targetPos.clone().sub(currentPos);
      forwardDir.y = 0;
      forwardDir.normalize();

      const targetHeading = Math.atan2(forwardDir.x, forwardDir.z);
      v.heading += (targetHeading - v.heading) * (delta * 3.8);
      v.root.rotation.y = v.heading;

      // 3. Traffic Law & Collision Evaluation
      let shouldStop = false;
      let stopReason = '';

      // A. Traffic Signal Red/Amber Detection at Intersections
      if (this.trafficLights) {
        for (const sig of this.trafficLights.signals) {
          const distToJunction = currentPos.distanceTo(new THREE.Vector3(sig.x, currentPos.y, sig.z));
          // Stop if within 6 to 19 meters of junction and approaching
          if (distToJunction < 19.0 && distToJunction > 4.0) {
            const isRed = this.trafficLights.isLightRedAt(sig.id, forwardDir);
            if (isRed) {
              shouldStop = true;
              stopReason = 'red_light';
              break;
            }
          }
        }
      }

      // B. Safe Following Distance to other AI Traffic (Anti-Rear-Ending)
      if (!shouldStop) {
        for (let j = 0; j < this.vehicles.length; j++) {
          if (i === j) continue;
          const other = this.vehicles[j];
          const offset = other.root.position.clone().sub(currentPos);
          const dist = offset.length();

          if (dist < 11.0) {
            // Check if other car is directly ahead in driving path
            const headingVec = new THREE.Vector3(Math.sin(v.heading), 0, Math.cos(v.heading));
            offset.normalize();
            if (headingVec.dot(offset) > 0.7) {
              shouldStop = true;
              stopReason = 'traffic_ahead';
              break;
            }
          }
        }
      }

      // C. Distance & Yielding to Player
      if (!shouldStop && playerPos) {
        const distToPlayer = currentPos.distanceTo(playerPos);
        if (distToPlayer < 12.0) {
          const headingVec = new THREE.Vector3(Math.sin(v.heading), 0, Math.cos(v.heading));
          const toPlayer = playerPos.clone().sub(currentPos).normalize();
          if (headingVec.dot(toPlayer) > 0.5) {
            shouldStop = true;
            stopReason = 'player_blocking';
          }
        }
      }

      // D. Yield to Crossing Pedestrians
      if (!shouldStop && this.pedestrianAI && this.pedestrianAI.pedestrians) {
        for (const ped of this.pedestrianAI.pedestrians) {
          const distToPed = currentPos.distanceTo(ped.root.position);
          if (distToPed < 8.5) {
            shouldStop = true;
            stopReason = 'pedestrian_crossing';
            break;
          }
        }
      }

      // 4. Smooth Acceleration / Braking
      const targetSpeed = shouldStop ? 0.0 : v.baseSpeed;
      const accelRate = shouldStop ? 12.0 : 4.5;
      v.currentSpeed += (targetSpeed - v.currentSpeed) * (delta * accelRate);

      // 5. Horn Honking behavior when blocked unnecessarily
      if (shouldStop && stopReason === 'player_blocking') {
        v.blockedTimer += delta;
        if (v.blockedTimer > 3.5 && now - v.lastHonkTime > 5000) {
          v.lastHonkTime = now;
          if (this.audio) {
            this.audio.playHornSound(v.type === 'tuk_tuk');
          }
        }
      } else {
        v.blockedTimer = 0;
      }

      // 6. Integrate movement along road surface
      const moveStep = v.currentSpeed * delta;
      v.root.position.x += Math.sin(v.heading) * moveStep;
      v.root.position.z += Math.cos(v.heading) * moveStep;
      v.root.position.y = this.terrain.getGroundHeight(v.root.position.x, v.root.position.z) + 0.35;

      // 7. Spin wheels
      if (v.wheels) {
        v.wheels.forEach(w => {
          if (w.rotator) {
            w.rotator.rotation.x += moveStep * 2.5;
          }
        });
      }
    }
  }
}
