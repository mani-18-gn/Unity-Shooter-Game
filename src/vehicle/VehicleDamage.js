// ROADBOUND - Vehicle Structural & Performance Damage System
import * as THREE from 'three';

export class VehicleDamage {
  constructor(vehicle) {
    this.vehicle = vehicle;
    this.health = 100;
    this.engineIntegrity = 100;
    this.panelsDeformed = 0;
    this.smokeParticles = null;
    this.sparksGroup = null;

    this.initDamageVFX();
  }

  initDamageVFX() {
    // Engine Smoke Particle System
    const pCount = 60;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(pCount * 3);

    for (let i = 0; i < pCount * 3; i += 3) {
      pos[i] = 0;
      pos[i + 1] = -100; // Hidden initially
      pos[i + 2] = 0;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));

    const mat = new THREE.PointsMaterial({
      color: 0x999999,
      size: 1.2,
      transparent: true,
      opacity: 0.45,
      depthWrite: false
    });

    this.smokeMesh = new THREE.Points(geo, mat);
    this.vehicle.root.add(this.smokeMesh);
  }

  applyCollisionDamage(impactSpeedMph, normal) {
    // Minor bumps (< 12 mph) absorb without damage
    if (impactSpeedMph < 12) return;

    const damageAmount = Math.min(45, (impactSpeedMph - 10) * 1.35);
    this.health = Math.max(0, this.health - damageAmount);

    // Mechanical engine integrity degrades
    if (this.health < 60) {
      this.engineIntegrity = Math.max(10, this.health * 1.1);
      // Reduce engine force proportionally
      this.vehicle.physics.maxEngineForce *= 0.92;
    }

    // Visual Mesh Panel Deformation on hard crash
    if (damageAmount > 15 && this.vehicle.bodyGroup) {
      this.deformChassisMesh(normal, damageAmount);
    }

    // Broken Headlight logic
    if (damageAmount > 25 && this.vehicle.spotlights?.length > 0) {
      // Crack one headlight
      const targetSpot = Math.random() > 0.5 ? this.vehicle.spotlights[0] : this.vehicle.spotlights[1];
      if (targetSpot) {
        targetSpot.intensity *= 0.2;
      }
    }

    this.vehicle.onDamageReceived(this.health);
  }

  deformChassisMesh(impactNormal, severity) {
    // Traverse body children and deform vertices
    this.vehicle.bodyGroup.traverse(child => {
      if (child.isMesh && child.geometry && child.geometry.attributes.position) {
        const pos = child.geometry.attributes.position;
        const count = Math.min(pos.count, 24); // Deform select front/bumper vertices

        for (let i = 0; i < count; i++) {
          if (Math.random() > 0.6) {
            const z = pos.getZ(i);
            const x = pos.getX(i);
            // Crush inward
            pos.setZ(i, z - (severity * 0.005));
            pos.setX(i, x + (Math.random() - 0.5) * (severity * 0.004));
          }
        }
        pos.needsUpdate = true;
      }
    });
    this.panelsDeformed++;
  }

  repair() {
    this.health = 100;
    this.engineIntegrity = 100;
    this.smokeMesh.visible = false;
    if (this.vehicle.spotlights) {
      this.vehicle.spotlights.forEach(s => { s.intensity = 2.2; });
    }
  }

  update(delta) {
    // Emit radiator smoke when vehicle is critically damaged
    if (this.health < 40) {
      this.smokeMesh.visible = true;
      const pos = this.smokeMesh.geometry.attributes.position.array;
      const count = pos.length;

      // Color smoke darker as health reaches 0
      if (this.health < 20) {
        this.smokeMesh.material.color.setHex(0x222222); // Thick black smoke
        this.smokeMesh.material.opacity = 0.75;
      } else {
        this.smokeMesh.material.color.setHex(0xaaaaaa); // Radiator steam
        this.smokeMesh.material.opacity = 0.45;
      }

      for (let i = 0; i < count; i += 3) {
        pos[i + 1] += delta * 4.0;
        pos[i] += (Math.random() - 0.5) * delta * 2.0;
        pos[i + 2] -= delta * (this.vehicle.physics.speed + 1.5); // Smoke billows backward

        if (pos[i + 1] > 6.0) {
          // Reset to hood radiator location
          pos[i] = (Math.random() - 0.5) * 0.6;
          pos[i + 1] = 0.8;
          pos[i + 2] = 1.6;
        }
      }
      this.smokeMesh.geometry.attributes.position.needsUpdate = true;
    } else {
      this.smokeMesh.visible = false;
    }
  }
}
