// ROADBOUND - Tactical Throwable Hand Grenade Physics & Blast Engine
// Accurate arc trajectory, bounce physics, 3.5s fuse timer, particle fireball & radial blast damage
import * as THREE from 'three';
import { weaponArsenal } from './WeaponArsenal.js';

export class GrenadeSystem {
  constructor(scene, terrain, audio, camera, gameState, hud) {
    this.scene = scene;
    this.terrain = terrain;
    this.audio = audio;
    this.camera = camera;
    this.gameState = gameState;
    this.hud = hud;

    this.activeGrenades = [];
    this.activeExplosions = [];

    this.initExplosionAssets();
  }

  initExplosionAssets() {
    this.blastFlashGeo = new THREE.SphereGeometry(1.2, 16, 16);
    this.blastFlashMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.95 });

    this.fireballGeo = new THREE.SphereGeometry(2.8, 16, 16);
    this.fireballMat = new THREE.MeshBasicMaterial({ color: 0xff6d00, transparent: true, opacity: 0.85 });

    this.smokeGeo = new THREE.SphereGeometry(4.2, 12, 12);
    this.smokeMat = new THREE.MeshBasicMaterial({ color: 0x37474f, transparent: true, opacity: 0.6 });
  }

  throwGrenade(originPos, camForward, throwStrength = 24) {
    // Check inventory count
    const inv = this.gameState.player.inventory;
    if (inv && inv.grenades <= 0) {
      if (this.hud) this.hud.showCommsDialogue('TACTICAL SLOTS', 'NO GRENADES REMAINING IN BAG!', 2.0);
      return false;
    }
    if (inv) inv.grenades--;

    // Create 3D Grenade entity
    const mesh = weaponArsenal.createWeaponMesh('grenade');
    mesh.position.copy(originPos).add(new THREE.Vector3(0, 1.4, 0));
    this.scene.add(mesh);

    // Initial velocity: forward vector + upward arc
    const velocity = new THREE.Vector3(
      camForward.x * throwStrength,
      Math.max(4.5, camForward.y * throwStrength + 6.5),
      camForward.z * throwStrength
    );

    const grenade = {
      mesh,
      position: mesh.position,
      velocity,
      rotVelocity: new THREE.Vector3(
        (Math.random() - 0.5) * 15,
        (Math.random() - 0.5) * 15,
        (Math.random() - 0.5) * 15
      ),
      fuseTimer: 3.5, // 3.5s military fuse
      bounces: 0
    };

    this.activeGrenades.push(grenade);

    if (this.audio) {
      this.audio.playImpactSound(0.18); // Pin click & spoon release
    }

    if (this.hud) {
      const remaining = inv ? inv.grenades : 0;
      this.hud.showCommsDialogue('GRENADE OUT!', `FRAG GRENADE THROWN! (Remaining: ${remaining})`, 1.8);
    }

    return true;
  }

  update(delta, enemyAIManager = null) {
    // 1. Update In-Flight Grenades
    for (let i = this.activeGrenades.length - 1; i >= 0; i--) {
      const g = this.activeGrenades[i];
      g.fuseTimer -= delta;

      // Gravity
      g.velocity.y -= 22.0 * delta;

      // Step position
      g.position.addScaledVector(g.velocity, delta);
      g.mesh.rotation.x += g.rotVelocity.x * delta;
      g.mesh.rotation.y += g.rotVelocity.y * delta;
      g.mesh.rotation.z += g.rotVelocity.z * delta;

      // Terrain Ground Collision & Bounce
      const groundY = this.terrain ? this.terrain.getGroundHeight(g.position.x, g.position.z) : 0;
      if (g.position.y <= groundY + 0.12) {
        g.position.y = groundY + 0.12;
        g.velocity.y = -g.velocity.y * 0.45; // Restitution
        g.velocity.x *= 0.65; // Ground friction
        g.velocity.z *= 0.65;
        g.rotVelocity.multiplyScalar(0.7);
        g.bounces++;

        if (g.bounces === 1 && this.audio) {
          this.audio.playImpactSound(0.35); // Hard ground impact clack
        }
      }

      // Detonation
      if (g.fuseTimer <= 0) {
        this.detonateGrenade(g, enemyAIManager);
        this.scene.remove(g.mesh);
        this.activeGrenades.splice(i, 1);
      }
    }

    // 2. Update Active Visual Explosions
    for (let i = this.activeExplosions.length - 1; i >= 0; i--) {
      const exp = this.activeExplosions[i];
      exp.age += delta;

      const progress = exp.age / exp.duration;
      if (progress >= 1.0) {
        this.scene.remove(exp.group);
        this.activeExplosions.splice(i, 1);
        continue;
      }

      // Expand fireball & fade opacity
      const scale = 1.0 + progress * 2.8;
      exp.group.scale.set(scale, scale, scale);

      if (exp.fireMesh) {
        exp.fireMesh.material.opacity = Math.max(0, (1 - progress) * 0.85);
      }
      if (exp.flashLight) {
        exp.flashLight.intensity = Math.max(0, (1 - progress) * 12.0);
      }
    }
  }

  detonateGrenade(grenade, enemyAIManager) {
    const pos = grenade.position.clone();

    // 1. Visual Explosion FX
    const expGroup = new THREE.Group();
    expGroup.position.copy(pos);

    const fire = new THREE.Mesh(this.fireballGeo, this.fireballMat.clone());
    expGroup.add(fire);

    const smoke = new THREE.Mesh(this.smokeGeo, this.smokeMat.clone());
    smoke.position.y = 1.0;
    expGroup.add(smoke);

    const flashLight = new THREE.PointLight(0xff7700, 10.0, 28);
    expGroup.add(flashLight);

    this.scene.add(expGroup);

    this.activeExplosions.push({
      group: expGroup,
      fireMesh: fire,
      flashLight,
      age: 0,
      duration: 1.2
    });

    // 2. Audio Detonation
    if (this.audio) {
      this.audio.playGunshot('AWM Sniper Rifle'); // Massive explosive crack
      this.audio.playImpactSound(0.9); // Heavy sub bass blast
    }

    // 3. Screen Camera Shake
    const distToCam = this.camera.position.distanceTo(pos);
    if (distToCam < 35 && window.gameInstance && window.gameInstance.cameraSystem) {
      const shakeAmt = Math.max(0.05, (1 - distToCam / 35) * 0.35);
      window.gameInstance.cameraSystem.shakeIntensity = Math.max(
        window.gameInstance.cameraSystem.shakeIntensity || 0,
        shakeAmt
      );
    }

    // 4. Blast Damage Radial Falloff (8.5m kill zone)
    const blastRadius = 8.5;
    const maxDamage = 160;

    // Check Player
    const playerPos = this.gameState.player.position;
    const distToPlayer = Math.hypot(playerPos.x - pos.x, playerPos.z - pos.z);
    if (distToPlayer < blastRadius) {
      const dmgRatio = 1.0 - (distToPlayer / blastRadius);
      const appliedDmg = Math.round(maxDamage * dmgRatio);
      this.gameState.takeDamage(appliedDmg);
      if (this.hud) {
        this.hud.showCommsDialogue('EXPLOSIVE IMPACT', `CAUGHT IN FRAG BLAST! (-${appliedDmg} HP)`, 2.5);
      }
    }

    // Check Hostile Bots in Enemy Shooter AI
    if (enemyAIManager && enemyAIManager.enemies) {
      for (const bot of enemyAIManager.enemies) {
        if (!bot.isAlive) continue;
        const d = Math.hypot(bot.position.x - pos.x, bot.position.z - pos.z);
        if (d < blastRadius) {
          const dmgRatio = 1.0 - (d / blastRadius);
          const dmg = Math.round(maxDamage * dmgRatio);
          const isKilled = bot.takeDamage(dmg, false);

          if (this.hud) {
            this.hud.triggerHitMarker(isKilled);
            if (isKilled) {
              this.hud.addKillFeedEntry('Marcus Vance', bot.name, 'M67 Frag Grenade');
            }
          }
        }
      }
    }
  }
}
