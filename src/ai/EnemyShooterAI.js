// ROADBOUND - Tactical Hostile Shooter AI Engine
// Realistic combat behaviors: patrol, cover-taking, suppression fire, healing, headshot hitboxes, and death loot drops
import * as THREE from 'three';
import { weaponArsenal } from '../combat/WeaponArsenal.js';

export class EnemyShooterBot {
  constructor(id, name, position, weaponId, scene, terrain, audio, lootSystem) {
    this.id = id;
    this.name = name;
    this.position = new THREE.Vector3(position.x, position.y, position.z);
    this.weaponId = weaponId;
    this.scene = scene;
    this.terrain = terrain;
    this.audio = audio;
    this.lootSystem = lootSystem;

    this.health = 100;
    this.maxHealth = 100;
    this.isAlive = true;
    this.state = 'patrol'; // 'patrol', 'chase', 'cover', 'shoot', 'heal', 'dead'

    this.yaw = Math.random() * Math.PI * 2;
    this.velocity = new THREE.Vector3();
    this.patrolOrigin = this.position.clone();
    this.patrolTarget = this.getRandomPatrolPoint();

    this.fireTimer = Math.random() * 1.5;
    this.burstCount = 0;
    this.healTimer = 0;
    this.animTime = 0;
    this.coverTimer = 0;
    this.deathTimer = 0;

    this.detectionRange = 65.0; // Sight detection distance
    this.attackRange = 45.0;

    this.initMesh();
  }

  getRandomPatrolPoint() {
    const angle = Math.random() * Math.PI * 2;
    const dist = 12 + Math.random() * 25;
    return new THREE.Vector3(
      this.patrolOrigin.x + Math.sin(angle) * dist,
      0,
      this.patrolOrigin.z + Math.cos(angle) * dist
    );
  }

  initMesh() {
    this.root = new THREE.Group();
    this.root.position.copy(this.position);

    // Tactical Operator Camo Materials
    const camoMat = new THREE.MeshStandardMaterial({ color: 0x333b2f, roughness: 0.7, metalness: 0.2 });
    const vestMat = new THREE.MeshStandardMaterial({ color: 0x1b1f1a, roughness: 0.6, metalness: 0.4 });
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xc8987b, roughness: 0.55 });
    const helmetMat = new THREE.MeshStandardMaterial({ color: 0x22261e, roughness: 0.5, metalness: 0.5 });

    // 1. Torso & Tactical Plate Carrier
    this.torso = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.52, 0.22), camoMat);
    this.torso.position.y = 1.15;
    this.torso.castShadow = true;
    this.root.add(this.torso);

    const vest = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.44, 0.24), vestMat);
    vest.position.y = 1.15;
    this.root.add(vest);

    // 2. Head with Ballistic FAST Helmet & Balaclava (Crucial for Headshots)
    this.head = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.24, 0.22), skinMat);
    this.head.position.y = 1.62;
    this.head.castShadow = true;
    this.root.add(this.head);

    const helmet = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.16, 0.24), helmetMat);
    helmet.position.y = 1.68;
    this.root.add(helmet);

    // 3. Limbs
    this.armR = new THREE.Group();
    this.armR.position.set(0.24, 1.35, 0);
    this.root.add(this.armR);
    const upperArmR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.35, 0.1), camoMat);
    upperArmR.position.y = -0.17;
    this.armR.add(upperArmR);

    this.armL = new THREE.Group();
    this.armL.position.set(-0.24, 1.35, 0);
    this.root.add(this.armL);
    const upperArmL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.35, 0.1), camoMat);
    upperArmL.position.y = -0.17;
    this.armL.add(upperArmL);

    this.legR = new THREE.Group();
    this.legR.position.set(0.12, 0.88, 0);
    this.root.add(this.legR);
    const thighR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.45, 0.12), camoMat);
    thighR.position.y = -0.22;
    this.legR.add(thighR);

    this.legL = new THREE.Group();
    this.legL.position.set(-0.12, 0.88, 0);
    this.root.add(this.legL);
    const thighL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.45, 0.12), camoMat);
    thighL.position.y = -0.22;
    this.legL.add(thighL);

    // 4. Weapon Mesh
    this.weaponMesh = weaponArsenal.createWeaponMesh(this.weaponId);
    this.weaponMesh.scale.set(1.1, 1.1, 1.1);
    this.weaponMesh.position.set(0.12, -0.2, 0.25);
    this.armR.add(this.weaponMesh);

    // 5. Overhead Tactical Health Bar Canvas Billboard
    this.healthCanvas = document.createElement('canvas');
    this.healthCanvas.width = 128;
    this.healthCanvas.height = 32;
    this.healthTexture = new THREE.CanvasTexture(this.healthCanvas);

    const hpGeo = new THREE.PlaneGeometry(1.2, 0.3);
    const hpMat = new THREE.MeshBasicMaterial({
      map: this.healthTexture,
      transparent: true,
      side: THREE.DoubleSide
    });
    this.hpBillboard = new THREE.Mesh(hpGeo, hpMat);
    this.hpBillboard.position.y = 2.05;
    this.root.add(this.hpBillboard);

    this.updateHealthBar();
    this.scene.add(this.root);
  }

  updateHealthBar() {
    const ctx = this.healthCanvas.getContext('2d');
    ctx.clearRect(0, 0, 128, 32);

    // Background pill
    ctx.fillStyle = 'rgba(10, 15, 20, 0.85)';
    ctx.beginPath();
    ctx.roundRect(4, 4, 120, 24, 6);
    ctx.fill();

    // Red HP track
    ctx.fillStyle = '#b71c1c';
    ctx.fillRect(8, 12, 112, 10);

    // Green HP Fill
    const pct = Math.max(0, this.health / this.maxHealth);
    ctx.fillStyle = pct > 0.4 ? '#4caf50' : '#ff9800';
    ctx.fillRect(8, 12, 112 * pct, 10);

    // Text Label
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${this.name} [${Math.round(this.health)}]`, 64, 10);

    this.healthTexture.needsUpdate = true;
  }

  takeDamage(damage, isHeadshot = false) {
    if (!this.isAlive) return false;

    const finalDmg = isHeadshot ? Math.round(damage * 2.5) : damage;
    this.health = Math.max(0, this.health - finalDmg);
    this.updateHealthBar();

    // Alert bot immediately to attack attacker
    if (this.state === 'patrol') {
      this.state = 'chase';
    }

    if (this.health <= 0) {
      this.die();
      return true; // killed!
    }

    // High damage triggers cover-taking / evasion
    if (this.health < 40 && Math.random() < 0.6) {
      this.state = 'cover';
      this.coverTimer = 3.5;
    }

    return false;
  }

  die() {
    this.isAlive = false;
    this.state = 'dead';
    this.hpBillboard.visible = false;

    // Death slump animation
    this.root.rotation.x = -Math.PI / 2;
    this.root.position.y = (this.terrain ? this.terrain.getGroundHeight(this.position.x, this.position.z) : 0) + 0.15;

    // Drop tactical loot crate at corpse position
    if (this.lootSystem) {
      this.lootSystem.spawnEnemyLootCrate(this.position, this.weaponId);
    }
  }

  update(delta, playerPos, playerInVehicle, gameState) {
    if (!this.isAlive) {
      this.deathTimer += delta;
      return;
    }

    this.animTime += delta * 6;

    // Orient health billboard towards player camera
    this.hpBillboard.lookAt(playerPos.x, playerPos.y + 1.6, playerPos.z);

    const distToPlayer = Math.hypot(playerPos.x - this.position.x, playerPos.z - this.position.z);

    // State Transitions
    if (this.state === 'patrol') {
      if (distToPlayer < this.detectionRange) {
        this.state = 'chase';
      }
    } else if (this.state === 'chase' || this.state === 'shoot') {
      if (distToPlayer > this.detectionRange * 1.4) {
        this.state = 'patrol';
      }
    }

    // AI Behavior Execution
    if (this.state === 'patrol') {
      this.patrolBehavior(delta);
    } else if (this.state === 'chase') {
      this.chaseBehavior(delta, playerPos);
    } else if (this.state === 'shoot') {
      this.shootBehavior(delta, playerPos, gameState);
    } else if (this.state === 'cover') {
      this.coverBehavior(delta, playerPos);
    } else if (this.state === 'heal') {
      this.healBehavior(delta);
    }

    // Keep on terrain ground
    if (this.terrain) {
      const gY = this.terrain.getGroundHeight(this.position.x, this.position.z);
      this.position.y = gY;
      this.root.position.copy(this.position);
    }
    this.root.rotation.y = this.yaw;
  }

  patrolBehavior(delta) {
    const toTarget = new THREE.Vector2(this.patrolTarget.x - this.position.x, this.patrolTarget.z - this.position.z);
    if (toTarget.length() < 2.0) {
      this.patrolTarget = this.getRandomPatrolPoint();
    } else {
      toTarget.normalize();
      this.yaw = Math.atan2(toTarget.x, toTarget.y);
      const walkSpeed = 2.2;
      this.position.x += toTarget.x * walkSpeed * delta;
      this.position.z += toTarget.y * walkSpeed * delta;

      // Leg stride
      this.legL.rotation.x = Math.sin(this.animTime) * 0.4;
      this.legR.rotation.x = -Math.sin(this.animTime) * 0.4;
    }
  }

  chaseBehavior(delta, playerPos) {
    const toPlayer = new THREE.Vector2(playerPos.x - this.position.x, playerPos.z - this.position.z);
    const dist = toPlayer.length();

    this.yaw = Math.atan2(toPlayer.x, toPlayer.y);

    if (dist <= this.attackRange) {
      this.state = 'shoot';
      return;
    }

    toPlayer.normalize();
    const runSpeed = 5.2;
    this.position.x += toPlayer.x * runSpeed * delta;
    this.position.z += toPlayer.y * runSpeed * delta;

    this.legL.rotation.x = Math.sin(this.animTime * 1.5) * 0.7;
    this.legR.rotation.x = -Math.sin(this.animTime * 1.5) * 0.7;
  }

  shootBehavior(delta, playerPos, gameState) {
    const toPlayer = new THREE.Vector2(playerPos.x - this.position.x, playerPos.z - this.position.z);
    this.yaw = Math.atan2(toPlayer.x, toPlayer.y);

    // Aim arms at player
    this.armR.rotation.x = -Math.PI * 0.45;
    this.armL.rotation.x = -Math.PI * 0.4;

    this.fireTimer -= delta;
    if (this.fireTimer <= 0) {
      this.fireTimer = 0.16 + Math.random() * 0.2;
      this.burstCount++;

      // Bot Muzzle Flash & Sound
      if (this.audio) {
        this.audio.playGunshot(this.weaponId);
      }

      // Flash weapon light
      if (this.weaponMesh.userData.muzzleLight) {
        this.weaponMesh.userData.muzzleLight.intensity = 4.0;
        setTimeout(() => {
          if (this.weaponMesh?.userData?.muzzleLight) {
            this.weaponMesh.userData.muzzleLight.intensity = 0;
          }
        }, 40);
      }

      // Accuracy check (accuracy falls off with distance)
      const dist = toPlayer.length();
      const hitChance = Math.max(0.2, 0.85 - (dist / 60));
      if (Math.random() < hitChance) {
        const dmg = 8 + Math.round(Math.random() * 12);
        gameState.takeDamage(dmg);
      }

      if (this.burstCount >= 4) {
        this.burstCount = 0;
        this.fireTimer = 1.2 + Math.random() * 0.8; // Pause between bursts
      }
    }

    if (toPlayer.length() > this.attackRange * 1.2) {
      this.state = 'chase';
    }
  }

  coverBehavior(delta, playerPos) {
    this.coverTimer -= delta;

    // Crouch down behind cover
    this.torso.position.y = 0.85;
    this.head.position.y = 1.32;

    if (this.coverTimer <= 0) {
      this.torso.position.y = 1.15;
      this.head.position.y = 1.62;
      if (this.health < 40) {
        this.state = 'heal';
        this.healTimer = 2.8;
      } else {
        this.state = 'shoot';
      }
    }
  }

  healBehavior(delta) {
    this.healTimer -= delta;
    if (this.healTimer <= 0) {
      this.health = Math.min(this.maxHealth, this.health + 45);
      this.updateHealthBar();
      this.state = 'shoot';
    }
  }
}

export class EnemyShooterAI {
  constructor(scene, terrain, audio, lootSystem, gameState, hud) {
    this.scene = scene;
    this.terrain = terrain;
    this.audio = audio;
    this.lootSystem = lootSystem;
    this.gameState = gameState;
    this.hud = hud;

    this.enemies = [];
    this.spawnEnemySquads();
  }

  spawnEnemySquads() {
    const spawnList = [
      // 1. Industrial Chimneys & Chemical Factory
      { id: 'bot_alpha', name: 'Hostile Operator (Alpha)', x: -340, z: -155, weapon: 'scar' },
      { id: 'bot_bravo', name: 'Mercenary Gunner (Bravo)', x: -365, z: -170, weapon: 'm249' },
      { id: 'bot_sniper', name: 'Elite Marksman (Ghost)', x: -385, z: -130, weapon: 'awm' },

      // 2. Commercial Harbor Docks & Warehouses
      { id: 'bot_dock1', name: 'Syndicate Enforcer', x: 395, z: -245, weapon: 'ak47' },
      { id: 'bot_dock2', name: 'Dockyard Raider', x: 415, z: -265, weapon: 'shotgun' },

      // 3. Downtown Financial Center
      { id: 'bot_city1', name: 'Blackshore Militant', x: -15, z: -95, weapon: 'ump' },
      { id: 'bot_city2', name: 'Rooftop Scout', x: 20, z: -115, weapon: 'sks' },

      // 4. Canyon Summit Highway Patrol
      { id: 'bot_canyon1', name: 'Highway Highwayman', x: 255, z: 125, weapon: 'ak47' }
    ];

    spawnList.forEach(s => {
      const gY = this.terrain ? this.terrain.getGroundHeight(s.x, s.z) : 0;
      const bot = new EnemyShooterBot(
        s.id,
        s.name,
        { x: s.x, y: gY, z: s.z },
        s.weapon,
        this.scene,
        this.terrain,
        this.audio,
        this.lootSystem
      );
      this.enemies.push(bot);
    });
  }

  update(delta, playerPos, playerInVehicle) {
    for (const enemy of this.enemies) {
      enemy.update(delta, playerPos, playerInVehicle, this.gameState);
    }
  }

  // Raycast shot check against all enemies
  checkRaycastHit(origin, direction, damage, maxRange = 600) {
    const ray = new THREE.Ray(origin, direction);
    let closestHit = null;
    let closestDist = maxRange;
    let isHeadshot = false;
    let targetBot = null;

    for (const bot of this.enemies) {
      if (!bot.isAlive) continue;

      // Distance test
      const distToBot = origin.distanceTo(bot.position);
      if (distToBot > closestDist) continue;

      // Head Hitbox check (Sphere around head bone)
      const headCenter = bot.position.clone().add(new THREE.Vector3(0, 1.62, 0));
      const headSphere = new THREE.Sphere(headCenter, 0.28);
      const headHit = ray.intersectSphere(headSphere, new THREE.Vector3());

      if (headHit) {
        const d = origin.distanceTo(headHit);
        if (d < closestDist) {
          closestDist = d;
          closestHit = headHit;
          isHeadshot = true;
          targetBot = bot;
          continue;
        }
      }

      // Torso Hitbox check (Box around chest)
      const torsoBox = new THREE.Box3(
        new THREE.Vector3(bot.position.x - 0.25, bot.position.y + 0.3, bot.position.z - 0.25),
        new THREE.Vector3(bot.position.x + 0.25, bot.position.y + 1.8, bot.position.z + 0.25)
      );
      const bodyHit = ray.intersectBox(torsoBox, new THREE.Vector3());
      if (bodyHit) {
        const d = origin.distanceTo(bodyHit);
        if (d < closestDist) {
          closestDist = d;
          closestHit = bodyHit;
          isHeadshot = false;
          targetBot = bot;
        }
      }
    }

    if (targetBot && closestHit) {
      const isKilled = targetBot.takeDamage(damage, isHeadshot);

      if (this.hud) {
        this.hud.triggerHitMarker(isKilled, isHeadshot);
        if (isKilled) {
          const wep = this.gameState.getActiveWeapon();
          this.hud.addKillFeedEntry('Marcus Vance', targetBot.name, wep?.name || 'Assault Rifle', isHeadshot);
        }
      }

      return { hit: true, point: closestHit, isHeadshot, isKilled, bot: targetBot };
    }

    return { hit: false };
  }
}
