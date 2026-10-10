import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { VehicleModels } from './VehicleModels.js';
import { VehiclePhysics } from './VehiclePhysics.js';
import { VehicleDamage } from './VehicleDamage.js';

export class Vehicle {
  constructor(vehicleId, config, scene, audioManager, terrain) {
    this.id = vehicleId;
    this.config = config;
    this.scene = scene;
    this.audio = audioManager;
    this.terrain = terrain;

    this.headlightsOn = true;
    this.isOccupied = false;

    // Build visual model
    const mats = VehicleModels.createMaterials(
      config.customization?.paintColor || '#111111',
      config.customization?.paintFinish || 'metallic',
      config.customization?.rimColor || '#c59b27'
    );

    let modelData;
    if (vehicleId === 'kodiak_v8') {
      modelData = VehicleModels.buildKodiakV8(mats);
    } else if (vehicleId === 'stratus_4x4') {
      modelData = VehicleModels.buildStratusOverlander(mats);
    } else if (vehicleId === 'police_interceptor') {
      modelData = VehicleModels.buildPoliceCruiser(mats);
    } else if (vehicleId === 'tuk_tuk') {
      modelData = VehicleModels.buildAutoRickshaw(mats);
    } else if (vehicleId === 'sovereign_v12') {
      modelData = VehicleModels.buildLuxurySedan(mats);
    } else if (vehicleId === 'thunderbolt_moto') {
      modelData = VehicleModels.buildStreetMotorcycle(mats);
    } else if (vehicleId === 'metro_bus') {
      modelData = VehicleModels.buildCityBus(mats);
    } else {
      modelData = VehicleModels.buildApexVanguard(mats);
    }

    this.root = modelData.root;
    this.bodyGroup = modelData.bodyGroup;
    this.wheels = modelData.wheels;
    this.spotlights = modelData.spotlights || [];
    this.taillightMesh = modelData.taillightMesh;
    this.steeringWheel = modelData.steeringWheel;
    this.strobes = modelData.strobes || null;
    this.indicators = modelData.indicators || null;
    this.wiperMesh = modelData.wiperMesh || null;

    // Interactive vehicle state
    this.turnSignal = 'off'; // 'off', 'left', 'right', 'hazard'
    this.signalTimer = 0;
    this.wipersActive = false;
    this.wiperTime = 0;
    this.fuel = config.condition?.fuel !== undefined ? config.condition.fuel : 100.0;
    this.maxFuel = 100.0;

    this.scene.add(this.root);
    this.tryLoadExternalGLB(vehicleId, mats);

    // Initialize Physics based on vehicle class and upgrade stages
    const engineStage = config.upgrades?.engineStage || 1;
    const brakesStage = config.upgrades?.brakesStage || 1;

    let mass = 1380;
    let baseEngineForce = 7200;
    let brakeForce = 8500;
    let steerAngleMax = Math.PI * 0.22;

    if (vehicleId === 'kodiak_v8') {
      mass = 1800; baseEngineForce = 7800; brakeForce = 8800;
    } else if (vehicleId === 'stratus_4x4') {
      mass = 2200; baseEngineForce = 6500; brakeForce = 8200;
    } else if (vehicleId === 'tuk_tuk') {
      mass = 580; baseEngineForce = 3800; brakeForce = 6200; steerAngleMax = Math.PI * 0.32; // Agile 3-wheeler lock
    } else if (vehicleId === 'sovereign_v12') {
      mass = 2450; baseEngineForce = 8200; brakeForce = 9400; steerAngleMax = Math.PI * 0.20;
    } else if (vehicleId === 'thunderbolt_moto') {
      mass = 210; baseEngineForce = 8600; brakeForce = 9800; steerAngleMax = Math.PI * 0.19;
    } else if (vehicleId === 'metro_bus') {
      mass = 11000; baseEngineForce = 18500; brakeForce = 16000; steerAngleMax = Math.PI * 0.24;
    }

    this.physics = new VehiclePhysics({
      mass,
      topSpeedMph: (config.stats?.topSpeed || 90) * 2.1,
      maxEngineForce: baseEngineForce * (1.0 + engineStage * 0.15),
      brakeForce: brakeForce * (1.0 + brakesStage * 0.18),
      steerAngleMax
    });

    // Initialize Damage
    this.damage = new VehicleDamage(this);

    // Strobe timer for police cruisers
    this.strobeTimer = 0;

    // Exhaust Flames & Backfire state
    this.exhaustFlames = modelData.exhaustFlames || null;
    this.lastThrottle = 0;
    this.flameTimer = 0;

    // Tire Smoke & Skid Marks VFX
    this.initTireVFX();
  }

  tryLoadExternalGLB(vehicleId, mats) {
    const loader = new GLTFLoader();
    const candidatePaths = [
      `/assets/models/vehicles/${vehicleId}.glb`,
      '/assets/models/vehicles/apex_vanguard.glb',
      '/assets/models/vehicles/car.glb'
    ];

    const tryNext = (idx) => {
      if (idx >= candidatePaths.length) return;
      const path = candidatePaths[idx];
      loader.load(
        path,
        (gltf) => {
          console.log('[HORIZEN Graphics] Loaded Photorealistic Vehicle Model:', path);
          const carScene = gltf.scene;

          const box = new THREE.Box3().setFromObject(carScene);
          const size = box.getSize(new THREE.Vector3());
          if (size.z > 0.1) {
            const scaleFactor = 4.5 / size.z;
            carScene.scale.set(scaleFactor, scaleFactor, scaleFactor);
          }

          carScene.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
              const nameLower = child.name.toLowerCase();
              if (nameLower.includes('body') || nameLower.includes('paint')) {
                child.material = mats.body;
              } else if (nameLower.includes('glass') || nameLower.includes('window')) {
                child.material = mats.glass;
              } else if (nameLower.includes('wheel') || nameLower.includes('tire')) {
                child.material = mats.tireRubber;
              }
            }
          });

          if (this.bodyGroup) {
            this.bodyGroup.visible = false;
          }
          this.root.add(carScene);
        },
        undefined,
        () => {
          tryNext(idx + 1);
        }
      );
    };

    tryNext(0);
  }

  initTireVFX() {
    // 1. Tire Smoke Particle Pool (50 volumetric particles)
    this.smokePool = [];
    const smokeGeo = new THREE.SphereGeometry(0.32, 8, 6);
    for (let i = 0; i < 50; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: 0xf4f4f4,
        transparent: true,
        opacity: 0,
        depthWrite: false
      });
      const p = new THREE.Mesh(smokeGeo, mat);
      p.visible = false;
      this.scene.add(p);
      this.smokePool.push({
        mesh: p,
        active: false,
        life: 0,
        maxLife: 1.0,
        vx: 0,
        vy: 0,
        vz: 0,
        baseScale: 0.4
      });
    }

    // 2. Skid Mark Decal Ribbon Pool (60 road surface quads)
    this.skidPool = [];
    this.skidIndex = 0;
    const skidGeo = new THREE.PlaneGeometry(0.34, 1.1);
    skidGeo.rotateX(-Math.PI / 2);
    for (let i = 0; i < 60; i++) {
      const sMat = new THREE.MeshBasicMaterial({
        color: 0x141416,
        transparent: true,
        opacity: 0.0,
        depthWrite: false
      });
      const sMesh = new THREE.Mesh(skidGeo, sMat);
      sMesh.visible = false;
      this.scene.add(sMesh);
      this.skidPool.push(sMesh);
    }
  }

  emitSmokeParticle(pos, intensity = 1.0) {
    const p = this.smokePool.find(item => !item.active);
    if (!p) return;
    p.active = true;
    p.life = 0;
    p.maxLife = 0.8 + Math.random() * 0.4;
    p.baseScale = 0.35 + Math.random() * 0.25;
    p.mesh.position.set(
      pos.x + (Math.random() - 0.5) * 0.3,
      pos.y + 0.15,
      pos.z + (Math.random() - 0.5) * 0.3
    );
    p.mesh.scale.setScalar(p.baseScale);
    p.mesh.material.opacity = Math.min(0.55, 0.35 * intensity);
    p.mesh.visible = true;
    p.vx = (Math.random() - 0.5) * 0.4;
    p.vy = 0.6 + Math.random() * 0.5;
    p.vz = (Math.random() - 0.5) * 0.4;
  }

  emitSkidMark(pos, heading) {
    const s = this.skidPool[this.skidIndex];
    this.skidIndex = (this.skidIndex + 1) % this.skidPool.length;
    s.position.set(pos.x, pos.y + 0.02, pos.z);
    s.rotation.y = heading;
    s.material.opacity = 0.65;
    s.visible = true;
  }

  setPosition(x, y, z, heading = 0) {
    this.physics.position.set(x, y, z);
    this.physics.heading = heading;
    this.physics.velocity.set(0, 0, 0);
    this.root.position.copy(this.physics.position);
    this.root.rotation.y = heading;
  }

  toggleHeadlights() {
    this.headlightsOn = !this.headlightsOn;
    this.spotlights.forEach(s => {
      s.visible = this.headlightsOn;
    });
  }

  onDamageReceived(newHp) {
    if (this.isOccupied) {
      // Play metal crunch audio
      this.audio.playImpactSound(0.7);
    }
  }

  toggleTurnSignal(signalType) {
    if (this.turnSignal === signalType) {
      this.turnSignal = 'off';
    } else {
      this.turnSignal = signalType;
    }
    this.signalTimer = 0;
    if (this.audio) this.audio.playUIClick();
    return this.turnSignal;
  }

  toggleWipers() {
    this.wipersActive = !this.wipersActive;
    if (this.audio) this.audio.playUIClick();
    return this.wipersActive;
  }

  refuel(amount = 100) {
    this.fuel = Math.min(this.maxFuel, this.fuel + amount);
    if (this.config.condition) {
      this.config.condition.fuel = this.fuel;
    }
    return this.fuel;
  }

  update(delta, input = null, colliders = []) {
    // Default zero input if not driven
    const driveInput = input || {
      throttle: 0,
      steer: 0,
      brake: 0,
      handbrake: false
    };

    // Fuel consumption and engine stall if empty
    if (this.isOccupied) {
      if (this.fuel > 0) {
        const burnRate = (0.04 + Math.abs(driveInput.throttle) * 0.22 + (this.physics.rpm / 8500) * 0.15) * delta;
        this.fuel = Math.max(0, this.fuel - burnRate);
        if (this.config.condition) this.config.condition.fuel = this.fuel;
      } else {
        driveInput.throttle = 0; // Out of petrol
      }
    }

    // Steering wheel or handlebars rotation
    if (this.steeringWheel) {
      this.steeringWheel.rotation.z = -this.physics.currentSteer * 2.4;
    }

    // Windshield wipers sweep
    if (this.wipersActive && this.wiperMesh) {
      this.wiperTime += delta * 5.0;
      this.wiperMesh.rotation.z = Math.sin(this.wiperTime) * 0.65;
    }

    // Turn Indicators Flashing (1.5 Hz)
    if (this.indicators) {
      this.signalTimer += delta * 3.0;
      const isFlashOn = (Math.floor(this.signalTimer) % 2) === 0;

      const leftFlash = (this.turnSignal === 'left' || this.turnSignal === 'hazard') && isFlashOn;
      const rightFlash = (this.turnSignal === 'right' || this.turnSignal === 'hazard') && isFlashOn;

      if (this.indicators.left) {
        this.indicators.left.forEach(mesh => {
          mesh.material.emissiveIntensity = leftFlash ? 3.5 : 0.05;
        });
      }
      if (this.indicators.right) {
        this.indicators.right.forEach(mesh => {
          mesh.material.emissiveIntensity = rightFlash ? 3.5 : 0.05;
        });
      }
    }

    // Physics step
    this.physics.update(delta, driveInput, this.terrain, this.wheels);

    // Sync 3D Transform
    this.root.position.copy(this.physics.position);
    this.root.quaternion.copy(this.physics.quaternion);

    // Damage update
    this.damage.update(delta);

    // Check world obstacles collision
    if (colliders && colliders.length > 0 && this.physics.speedMph > 5) {
      const vehBox = new THREE.Box3().setFromObject(this.root);
      for (const col of colliders) {
        if (vehBox.intersectsBox(col)) {
          // Hard collision with building/rock
          const impactSpeed = this.physics.speedMph;
          this.physics.velocity.multiplyScalar(-0.35); // Bounce back
          this.damage.applyCollisionDamage(impactSpeed, new THREE.Vector3(0, 0, -1));
          break;
        }
      }
    }

    // Taillight glow on braking
    if (this.taillightMesh) {
      if (driveInput.brake > 0 || driveInput.handbrake) {
        this.taillightMesh.material.emissiveIntensity = 3.0;
      } else {
        this.taillightMesh.material.emissiveIntensity = 1.0;
      }
    }

    // Police Strobes flashing
    if (this.strobes) {
      this.strobeTimer += delta * 12;
      const strobeIdx = Math.floor(this.strobeTimer) % 2;
      this.strobes[0].material.emissiveIntensity = strobeIdx === 0 ? 3.5 : 0.2;
      this.strobes[1].material.emissiveIntensity = strobeIdx === 1 ? 3.5 : 0.2;
    }

    // Dynamic Tire Smoke & Skid Marks on Drift / Hard Braking / Burnout
    const isDrifting = Math.abs(this.physics.slipAngle) > 0.16;
    const isHardBraking = (driveInput.brake > 0 || driveInput.handbrake) && this.physics.speedMph > 8;
    const isBurnout = driveInput.throttle > 0.7 && driveInput.brake > 0.7;

    if (this.wheels && (isDrifting || isHardBraking || isBurnout)) {
      const tempPosL = new THREE.Vector3();
      const tempPosR = new THREE.Vector3();
      if (this.wheels.rl) this.wheels.rl.getWorldPosition(tempPosL);
      if (this.wheels.rr) this.wheels.rr.getWorldPosition(tempPosR);

      const intensity = Math.min(2.0, (Math.abs(this.physics.slipAngle) + (driveInput.handbrake ? 0.8 : 0) + (isBurnout ? 1.5 : 0)));
      this.emitSmokeParticle(tempPosL, intensity);
      this.emitSmokeParticle(tempPosR, intensity);

      if (Math.random() < 0.5) {
        this.emitSkidMark(tempPosL, this.physics.heading);
        this.emitSkidMark(tempPosR, this.physics.heading);
      }
    }

    // Update active smoke particle physics & fade
    if (this.smokePool) {
      this.smokePool.forEach(p => {
        if (!p.active) return;
        p.life += delta;
        if (p.life >= p.maxLife) {
          p.active = false;
          p.mesh.visible = false;
        } else {
          const progress = p.life / p.maxLife;
          p.mesh.position.x += p.vx * delta;
          p.mesh.position.y += p.vy * delta;
          p.mesh.position.z += p.vz * delta;
          const curScale = p.baseScale + progress * 1.6;
          p.mesh.scale.setScalar(curScale);
          p.mesh.material.opacity = (1.0 - progress) * 0.45;
        }
      });
    }

    // High RPM Throttle Lift-Off Exhaust Backfire
    if (this.isOccupied && this.physics.rpm > 5200 && driveInput.throttle < 0.15 && this.lastThrottle > 0.65) {
      this.flameTimer = 0.14;
      if (this.audio.playExhaustBackfire) this.audio.playExhaustBackfire();
    }
    this.lastThrottle = driveInput.throttle;

    if (this.exhaustFlames && this.exhaustFlames.length > 0) {
      if (this.flameTimer > 0) {
        this.flameTimer -= delta;
        const flameScale = 0.8 + Math.random() * 0.6;
        this.exhaustFlames.forEach(f => {
          f.visible = true;
          f.scale.set(flameScale, flameScale * 1.4, flameScale);
        });
      } else {
        this.exhaustFlames.forEach(f => { f.visible = false; });
      }
    }

    // Audio Engine synchronization when occupied
    if (this.isOccupied) {
      const rpmRatio = (this.physics.rpm - 800) / (8500 - 800);
      this.audio.updateVehicleEngine(
        true,
        rpmRatio,
        driveInput.throttle,
        this.physics.speedMph
      );
      this.audio.updateTireSlip(this.physics.slipAngle);
    }
  }

  destroy() {
    if (this.smokePool) {
      this.smokePool.forEach(p => this.scene.remove(p.mesh));
    }
    if (this.skidPool) {
      this.skidPool.forEach(s => this.scene.remove(s));
    }
    this.scene.remove(this.root);
  }
}
