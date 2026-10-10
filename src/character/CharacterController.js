// ROADBOUND - Grounded Biomechanics Character Controller & Combat Pipeline
// Unreal Engine 5 Style Movement, Unlimited Sprint, Recoil, Auto-Reload, Scopes, Healing & Ballistics
import * as THREE from 'three';
import { WEAPON_DEFINITIONS, weaponArsenal } from '../combat/WeaponArsenal.js';

export class CharacterController {
  constructor(character, camera, scene, audioManager, terrain, gameState) {
    this.character = character;
    this.camera = camera;
    this.scene = scene;
    this.audio = audioManager;
    this.terrain = terrain;
    this.gameState = gameState;

    this.position = new THREE.Vector3(0, 1.2, 0);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.yaw = 0;
    this.isGrounded = true;
    this.isCrouched = false;
    this.isAiming = false;
    this.isReloading = false;
    this.reloadTimer = 0;
    this.fireTimer = 0;

    // Movement speeds (Always Sprinting with Unlimited Stamina)
    this.walkSpeed = 4.2;
    this.sprintSpeed = 9.2; // Full tactical sprint speed
    this.crouchSpeed = 2.6;
    this.jumpForce = 7.6;
    this.isProne = false;
    this.actionQueue = [];

    // Scope & Optics
    this.scopeMode = 'none'; // 'none', 'red_dot', '2x', '4x', '8x'

    // Medical Healing State
    this.isHealing = false;
    this.healTimer = 0;
    this.healDuration = 3.0;
    this.activeMedkitType = null;

    // Death State
    this.isDead = false;

    // External Combat Subsystems
    this.lootSystem = null;
    this.grenadeSystem = null;
    this.enemyShooterAI = null;
    this.hud = null;
    this.cameraSystem = null;

    // Listen for Battle Royale UI touch/button actions
    window.addEventListener('roadbound_action', (e) => {
      if (e.detail?.action) {
        this.actionQueue.push(e.detail.action);
      }
    });

    // Ensure player has starter inventory
    this.initPlayerInventory();
  }

  setCombatSystems(lootSystem, grenadeSystem, enemyShooterAI, hud, cameraSystem) {
    this.lootSystem = lootSystem;
    this.grenadeSystem = grenadeSystem;
    this.enemyShooterAI = enemyShooterAI;
    this.hud = hud;
    this.cameraSystem = cameraSystem;
  }

  initPlayerInventory() {
    if (!this.gameState.player.inventory) {
      this.gameState.player.inventory = {
        bag: 'medium_bag',
        bagConfig: { id: 'medium_bag', name: 'Tactical Rucksack', ammoCapacity: 280, medkitCapacity: 8 },
        bagAmmo: {
          '7.62mm': 180,
          '5.56mm': 180,
          '9mm': 120,
          '.300mag': 20,
          '12gauge': 32
        },
        medkits: {
          bandage: 6,
          medkit: 3,
          first_aid: 1
        },
        grenades: 4,
        armorVest: 80,
        armorLevel: 2,
        helmetLevel: 2
      };
    }

    // Default starting weapons
    if (!this.gameState.weapons || this.gameState.weapons.length < 5) {
      this.gameState.weapons = [
        { ...WEAPON_DEFINITIONS.ak47, currentClip: 30, reserveAmmo: 180, unlocked: true },
        { ...WEAPON_DEFINITIONS.scar, currentClip: 30, reserveAmmo: 180, unlocked: true },
        { ...WEAPON_DEFINITIONS.pistol, currentClip: 15, reserveAmmo: 120, unlocked: true },
        { ...WEAPON_DEFINITIONS.knife, currentClip: 1, reserveAmmo: 999, unlocked: true },
        { ...WEAPON_DEFINITIONS.grenade, currentClip: 1, reserveAmmo: 4, unlocked: true }
      ];
      this.gameState.activeWeaponIndex = 0;
    }
  }

  setPosition(x, y, z) {
    this.position.set(x, y, z);
    this.character.root.position.copy(this.position);
  }

  respawn() {
    this.isDead = false;
    this.gameState.player.health = 100;
    this.gameState.player.armor = 80;
    this.setPosition(565.5, 27.2, -45);
    this.character.root.rotation.x = 0;
    this.character.root.rotation.z = 0;
    this.character.setVisible(true);
    this.initPlayerInventory();

    if (this.hud) {
      this.hud.hideDeathScreen();
      this.hud.updateVitals(100, 80);
      this.hud.showCommsDialogue('TACTICAL HQ', 'OPERATIVE RESPAWNED AT SAFE SUMMIT OVERLOOK.', 3.0);
    }
  }

  update(delta, input, cameraAngle, nearbyVehicle = null) {
    // Check if player is dead
    if (this.gameState.player.health <= 0) {
      if (!this.isDead) {
        this.handlePlayerDeath();
      }
      return;
    }

    if (this.gameState.player.inVehicle) {
      this.character.setVisible(false);
      return;
    }
    this.character.setVisible(true);

    // 1. Process Touch / UI Actions
    let touchEnter = false;
    let touchFire = false;
    let touchJump = false;
    let touchReload = false;
    let touchHeal = false;
    let touchGrenade = false;
    let touchScope = false;

    while (this.actionQueue.length > 0) {
      const act = this.actionQueue.shift();
      if (act === 'fire') touchFire = true;
      else if (act === 'aim_toggle') touchScope = true;
      else if (act === 'jump') touchJump = true;
      else if (act === 'crouch') this.isCrouched = !this.isCrouched;
      else if (act === 'prone') this.isProne = !this.isProne;
      else if (act === 'reload') touchReload = true;
      else if (act === 'medkit') touchHeal = true;
      else if (act === 'grenade') touchGrenade = true;
      else if (act === 'enter_vehicle') touchEnter = true;
    }

    // Vehicle Entry Check (E, F, or on-screen prompt click)
    const wantsVehicleEnter = (input.interact || input.pickup || touchEnter) && nearbyVehicle;
    if (wantsVehicleEnter) {
      const dx = this.position.x - nearbyVehicle.physics.position.x;
      const dz = this.position.z - nearbyVehicle.physics.position.z;
      const horizontalDist = Math.hypot(dx, dz);
      if (horizontalDist < 6.5) {
        this.enterVehicle(nearbyVehicle);
        return;
      }
    }

    // 2. Weapon Slot Switching (Keys 1-5 or Mouse Wheel)
    this.handleWeaponSwitching(input);

    // 3. Loot Pickup on [F]
    if (input.pickup && this.lootSystem) {
      this.lootSystem.pickUpNearest();
    }

    // 4. Scope Optics Toggle on [Z] or Middle Mouse Click
    if (input.scopeToggle || touchScope) {
      this.toggleScope();
    }

    // 5. Medical Healing on [H] with timed progress bar
    if (input.heal || touchHeal) {
      this.startHealing();
    }
    this.updateHealing(delta);

    // 6. Grenade Throw on [G]
    const camForward = new THREE.Vector3(-Math.sin(cameraAngle), -0.15, -Math.cos(cameraAngle));
    if ((input.grenade || touchGrenade) && this.grenadeSystem) {
      this.grenadeSystem.throwGrenade(this.position, camForward);
    }

    // 7. Weapon Reloading & Auto-Reload when Magazine is 0
    const currentWeapon = this.gameState.getActiveWeapon();
    const isMelee = currentWeapon.category === 'melee' || currentWeapon.id === 'knife';
    const inv = this.gameState.player.inventory;
    const bagAmmoCount = isMelee ? 999 : (inv?.bagAmmo[currentWeapon.caliber] ?? currentWeapon.reserveAmmo ?? 0);

    // Synchronize reserve ammo with bag ammo count
    currentWeapon.reserveAmmo = bagAmmoCount;

    if (this.isReloading && !isMelee) {
      this.reloadTimer -= delta;
      if (this.hud) {
        const reloadPct = Math.min(100, Math.round(((currentWeapon.reloadTime - this.reloadTimer) / currentWeapon.reloadTime) * 100));
        this.hud.updateReloadProgress(reloadPct);
      }

      if (this.reloadTimer <= 0) {
        this.isReloading = false;
        if (this.hud) this.hud.hideReloadProgress();

        const needed = currentWeapon.magCapacity - currentWeapon.currentClip;
        const taken = Math.min(needed, bagAmmoCount);

        currentWeapon.currentClip += taken;
        if (inv && inv.bagAmmo[currentWeapon.caliber] !== undefined) {
          inv.bagAmmo[currentWeapon.caliber] -= taken;
          currentWeapon.reserveAmmo = inv.bagAmmo[currentWeapon.caliber];
        } else {
          currentWeapon.reserveAmmo -= taken;
        }

        this.gameState.notify('weapon_fired', currentWeapon);
      }
    } else if (!isMelee) {
      // Manual Reload on [R]
      const wantsManualReload = (input.reload || touchReload) && currentWeapon.currentClip < currentWeapon.magCapacity;
      if (wantsManualReload) {
        if (bagAmmoCount > 0) {
          this.triggerReload(currentWeapon);
        } else {
          if (this.hud) this.hud.showNoAmmoWarning();
        }
      }
    }

    // 8. Weapon Firing (LEFT / RIGHT MOUSE BUTTON or TOUCH or J = SHOOT)
    this.fireTimer -= delta;
    this.isAiming = this.scopeMode !== 'none';

    const wantsFire = input.fire || touchFire || input.fireClicked;

    if (isMelee) {
      currentWeapon.currentClip = 1;
      currentWeapon.reserveAmmo = Infinity;
      if (wantsFire && this.fireTimer <= 0 && !this.isHealing) {
        this.fireTimer = currentWeapon.fireRate || 0.35;
        this.character.recoilKick = 0.35;
        if (this.audio) {
          this.audio.playImpactSound(0.2);
        }
        this.performRaycastShot(currentWeapon);
        this.gameState.notify('weapon_fired', currentWeapon);
      }
    } else if (wantsFire && this.fireTimer <= 0 && !this.isReloading && !this.isHealing) {
      if (currentWeapon.currentClip > 0) {
        // Discharge round
        currentWeapon.currentClip--;
        this.fireTimer = currentWeapon.fireRate;

        // Visual Muzzle Flash & Sound
        this.character.triggerMuzzleFlash();
        if (this.audio) {
          this.audio.playGunshot(currentWeapon.name);
        }

        // Camera recoil kick (Strict NaN guards)
        if (this.cameraSystem) {
          const pKick = (typeof currentWeapon.recoilPitch === 'number' ? currentWeapon.recoilPitch : 0.05) * 0.4;
          const ySpread = (typeof currentWeapon.recoilYawSpread === 'number' ? currentWeapon.recoilYawSpread : (typeof currentWeapon.recoilSpread === 'number' ? currentWeapon.recoilSpread : 0.02)) * 0.5;
          const curPitch = isNaN(this.cameraSystem.orbitPitch) ? 0.25 : this.cameraSystem.orbitPitch;
          const curYaw = isNaN(this.cameraSystem.orbitYaw) ? 0 : this.cameraSystem.orbitYaw;
          this.cameraSystem.orbitPitch = Math.min(1.2, curPitch + pKick);
          this.cameraSystem.orbitYaw = curYaw + (Math.random() - 0.5) * ySpread;
        }

        this.ejectShellCasing();
        this.performRaycastShot(currentWeapon);
        this.gameState.notify('weapon_fired', currentWeapon);

        // AUTOMATIC RELOAD when magazine reaches 0!
        if (currentWeapon.currentClip === 0) {
          if (bagAmmoCount > 0) {
            this.triggerReload(currentWeapon);
          } else {
            if (this.hud) this.hud.showNoAmmoWarning();
          }
        }
      } else if (input.fireClicked || touchFire) {
        // Out of ammo: check if bag has ammo to reload, else click dry fire
        if (bagAmmoCount > 0) {
          this.triggerReload(currentWeapon);
        } else {
          if (this.audio) this.audio.playUIClick();
          if (this.hud) this.hud.showNoAmmoWarning();
        }
      }
    }

    // 9. Locomotion Movement relative to camera yaw
    if (input.crouch !== undefined) {
      this.isCrouched = input.crouch;
    }
    const moveZ = input.moveZ;
    const moveX = input.moveX;
    const isMoving = Math.abs(moveX) > 0.05 || Math.abs(moveZ) > 0.05;

    // RUNNING IS ALWAYS ON with UNLIMITED stamina (user requirement)
    let targetSpeed = this.sprintSpeed;
    if (this.isCrouched) targetSpeed = this.crouchSpeed;

    // Forward & Right camera direction
    const camDir = new THREE.Vector3(-Math.sin(cameraAngle), 0, -Math.cos(cameraAngle));
    const camRight = new THREE.Vector3(Math.cos(cameraAngle), 0, -Math.sin(cameraAngle));

    if (isMoving) {
      const moveDir = new THREE.Vector3();
      moveDir.addScaledVector(camDir, moveZ);
      moveDir.addScaledVector(camRight, moveX);
      moveDir.normalize();

      this.velocity.x = moveDir.x * targetSpeed;
      this.velocity.z = moveDir.z * targetSpeed;

      // When aiming or holding left-click to look, face camera direction; otherwise face movement direction
      if (this.isAiming || input.leftDrag) {
        this.yaw = Math.atan2(camDir.x, camDir.z);
      } else {
        this.yaw = Math.atan2(moveDir.x, moveDir.z);
      }
    } else {
      this.velocity.x *= 0.6;
      this.velocity.z *= 0.6;
      if (this.isAiming || input.leftDrag) {
        this.yaw = Math.atan2(camDir.x, camDir.z);
      }
    }

    // 10. Gravity & Jumping
    const groundY = this.terrain ? this.terrain.getGroundHeight(this.position.x, this.position.z) : 0;
    if (this.position.y <= groundY + 0.05) {
      this.position.y = groundY;
      this.velocity.y = 0;
      this.isGrounded = true;

      if ((input.jump || touchJump) && !this.isCrouched) {
        this.velocity.y = this.jumpForce;
        this.isGrounded = false;
      }
    } else {
      this.velocity.y -= 19.6 * delta;
      this.isGrounded = false;
    }

    // 11. Obstacle Collision Integration
    const nextX = this.position.x + this.velocity.x * delta;
    const nextZ = this.position.z + this.velocity.z * delta;

    let canMoveX = true;
    let canMoveZ = true;
    const charRadius = 0.35;
    const charHeight = 1.8;

    if (this.terrain && this.terrain.colliders && this.terrain.colliders.length > 0) {
      const boxX = new THREE.Box3(
        new THREE.Vector3(nextX - charRadius, this.position.y + 0.1, this.position.z - charRadius),
        new THREE.Vector3(nextX + charRadius, this.position.y + charHeight, this.position.z + charRadius)
      );
      for (let i = 0; i < this.terrain.colliders.length; i++) {
        if (boxX.intersectsBox(this.terrain.colliders[i])) {
          canMoveX = false;
          break;
        }
      }

      const boxZ = new THREE.Box3(
        new THREE.Vector3(this.position.x - charRadius, this.position.y + 0.1, nextZ - charRadius),
        new THREE.Vector3(this.position.x + charRadius, this.position.y + charHeight, nextZ + charRadius)
      );
      for (let i = 0; i < this.terrain.colliders.length; i++) {
        if (boxZ.intersectsBox(this.terrain.colliders[i])) {
          canMoveZ = false;
          break;
        }
      }
    }

    if (canMoveX) this.position.x = nextX;
    if (canMoveZ) this.position.z = nextZ;
    this.position.y += this.velocity.y * delta;

    if (this.position.y < groundY) {
      this.position.y = groundY;
    }

    // Sync transforms
    this.character.root.position.copy(this.position);
    this.character.root.rotation.y = this.yaw;

    // Animation state
    let state = 'idle';
    if (this.isCrouched) state = 'crouch';
    else if (isMoving) state = 'sprint'; // Always sprint animation

    const speedRatio = Math.hypot(this.velocity.x, this.velocity.z) / this.sprintSpeed;
    this.character.updateAnimation(delta, state, speedRatio, this.isAiming);

    // Sync global player position
    this.gameState.player.position.x = this.position.x;
    this.gameState.player.position.y = this.position.y;
    this.gameState.player.position.z = this.position.z;
  }

  handlePlayerDeath() {
    this.isDead = true;
    this.character.root.rotation.x = -Math.PI / 2;
    this.character.root.position.y = (this.terrain ? this.terrain.getGroundHeight(this.position.x, this.position.z) : 0) + 0.15;

    if (this.audio) {
      this.audio.playImpactSound(0.8);
    }

    if (this.hud) {
      this.hud.showDeathScreen(() => this.respawn(), () => this.respawn());
      this.hud.addKillFeedEntry('Hostile Combatant', 'Marcus Vance (Player)', 'Eliminated');
    }
  }

  triggerReload(weapon) {
    this.isReloading = true;
    this.reloadTimer = weapon.reloadTime || 2.0;
    if (this.audio) {
      this.audio.playImpactSound(0.25); // Tactical magazine rack
    }
    if (this.hud) {
      this.hud.showReloadProgress(weapon.name);
    }
  }

  toggleScope() {
    const currentWeapon = this.gameState.getActiveWeapon();

    // AWM locked to 8x sniper scope
    if (currentWeapon.id === 'awm') {
      this.scopeMode = this.scopeMode === 'none' ? '8x' : 'none';
    } else if (currentWeapon.id === 'sks') {
      this.scopeMode = this.scopeMode === 'none' ? '4x' : 'none';
    } else {
      // Cycle: none -> red_dot -> 2x -> 4x -> none
      if (this.scopeMode === 'none') this.scopeMode = 'red_dot';
      else if (this.scopeMode === 'red_dot') this.scopeMode = '2x';
      else if (this.scopeMode === '2x') this.scopeMode = '4x';
      else this.scopeMode = 'none';
    }

    // Apply FOV Zoom
    const fovMap = {
      none: 65,
      red_dot: 50,
      '2x': 38,
      '4x': 26,
      '8x': 14
    };

    if (this.camera) {
      this.camera.fov = fovMap[this.scopeMode] || 65;
      this.camera.updateProjectionMatrix();
    }

    if (this.hud) {
      this.hud.setScopeOverlay(this.scopeMode);
    }
  }

  startHealing() {
    const player = this.gameState.player;
    if (player.health >= 100) {
      if (this.hud) this.hud.showCommsDialogue('MEDICAL STATUS', 'HEALTH IS ALREADY AT 100% MAXIMUM!', 2.0);
      return;
    }

    const inv = player.inventory;
    if (!inv || !inv.medkits) return;

    // Select available medkit
    let selectedType = null;
    let duration = 3.0;

    if (player.health >= 80 && inv.medkits.bandage > 0) {
      selectedType = 'bandage';
      duration = 2.0;
    } else if (inv.medkits.medkit > 0) {
      selectedType = 'medkit';
      duration = 3.5;
    } else if (inv.medkits.first_aid > 0) {
      selectedType = 'first_aid';
      duration = 5.0;
    } else if (inv.medkits.bandage > 0) {
      selectedType = 'bandage';
      duration = 2.0;
    }

    if (!selectedType) {
      if (this.hud) this.hud.showCommsDialogue('MEDICAL STATUS', 'NO MEDKITS OR BANDAGES IN BAG!', 2.0);
      return;
    }

    this.isHealing = true;
    this.healTimer = duration;
    this.healDuration = duration;
    this.activeMedkitType = selectedType;

    if (this.hud) {
      const label = selectedType === 'bandage' ? 'BANDAGE (+15 HP)' :
                    selectedType === 'medkit' ? 'TRAUMA MEDKIT (+50 HP)' : 'FULL FIRST AID KIT (+100 HP)';
      this.hud.showHealingProgress(0, label);
    }
  }

  updateHealing(delta) {
    if (!this.isHealing) return;

    this.healTimer -= delta;
    const progress = Math.min(100, Math.round(((this.healDuration - this.healTimer) / this.healDuration) * 100));

    if (this.hud) {
      this.hud.updateHealingProgressPct(progress);
    }

    if (this.healTimer <= 0) {
      this.isHealing = false;
      const inv = this.gameState.player.inventory;
      const type = this.activeMedkitType;

      let healAmount = 50;
      if (type === 'bandage') healAmount = 15;
      else if (type === 'medkit') healAmount = 50;
      else if (type === 'first_aid') healAmount = 100;

      if (inv && inv.medkits[type] > 0) {
        inv.medkits[type]--;
      }

      this.gameState.heal(healAmount);
      if (this.audio) {
        this.audio.playImpactSound(0.2);
      }
      if (this.hud) {
        this.hud.hideHealingProgress();
        this.hud.showCommsDialogue('MEDICAL STATUS', `APPLIED ${type.toUpperCase()}! (+${healAmount} HP)`, 2.5);
      }
    }
  }

  handleWeaponSwitching(input) {
    let targetIndex = null;
    if (input.slot1) targetIndex = 0;
    else if (input.slot2) targetIndex = 1;
    else if (input.slot3) targetIndex = 2;
    else if (input.slot4) targetIndex = 3;
    else if (input.slot5) targetIndex = 4;
    else if (input.wheelDelta !== 0) {
      const dir = input.wheelDelta > 0 ? 1 : -1;
      const total = this.gameState.weapons.length;
      targetIndex = (this.gameState.activeWeaponIndex + dir + total) % total;
    }

    if (targetIndex !== null && targetIndex !== this.gameState.activeWeaponIndex) {
      if (this.gameState.weapons[targetIndex]) {
        this.gameState.activeWeaponIndex = targetIndex;
        const newWep = this.gameState.getActiveWeapon();
        this.character.setEquippedWeapon(newWep.id);
        this.scopeMode = 'none';
        if (this.camera) {
          this.camera.fov = 65;
          this.camera.updateProjectionMatrix();
        }
        if (this.hud) {
          this.hud.setScopeOverlay('none');
          this.hud.updateWeaponDisplay(newWep);
        }
        if (this.audio) {
          this.audio.playImpactSound(0.15); // Weapon draw rustle
        }
      }
    }
  }

  performRaycastShot(weapon) {
    // Bullet originates from camera center (center of crosshair)
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);

    const isMelee = weapon.category === 'melee' || weapon.id === 'knife';
    const maxDist = isMelee ? 3.5 : (weapon.range || 500);

    let hitPoint = null;

    // 1. Check Hostile AI Bot Hits via EnemyShooterAI
    if (this.enemyShooterAI) {
      const res = this.enemyShooterAI.checkRaycastHit(
        raycaster.ray.origin,
        raycaster.ray.direction,
        weapon.damage,
        maxDist
      );
      if (res && res.hit) {
        hitPoint = res.point;
        this.createHitImpactFX(hitPoint, true);
        if (this.hud) {
          this.hud.triggerHitMarker(res.killed || false, res.headshot || false);
        }
      }
    }

    // 2. Check World Environment (High-performance targeted raycast)
    if (!hitPoint) {
      try {
        const testTargets = [];
        if (this.terrain?.terrainMesh) testTargets.push(this.terrain.terrainMesh);
        if (this.terrain?.roadMesh) testTargets.push(this.terrain.roadMesh);

        if (testTargets.length > 0) {
          const intersects = raycaster.intersectObjects(testTargets, false);
          for (const hit of intersects) {
            if (hit.distance > maxDist) break;
            hitPoint = hit.point;
            this.createHitImpactFX(hitPoint, false);
            break;
          }
        }
      } catch (err) {
        // Fallback
      }
    }

    // For firearms without obstacle hit, extend tracer forward
    if (!hitPoint && !isMelee) {
      hitPoint = raycaster.ray.origin.clone().addScaledVector(raycaster.ray.direction, 120);
    }

    // Draw visible bullet tracer beam
    if (!isMelee && hitPoint) {
      this.createBulletTracer(hitPoint);
    }
  }

  createBulletTracer(targetPoint) {
    const origin = this.position.clone().add(new THREE.Vector3(0.2, 1.3, 0));
    const geom = new THREE.BufferGeometry().setFromPoints([origin, targetPoint]);
    const mat = new THREE.LineBasicMaterial({
      color: 0xffea00,
      linewidth: 2,
      transparent: true,
      opacity: 0.9
    });
    const line = new THREE.Line(geom, mat);
    this.scene.add(line);

    setTimeout(() => {
      this.scene.remove(line);
      geom.dispose();
      mat.dispose();
    }, 60);
  }

  createHitImpactFX(point, isEnemyHit = false) {
    // Impact Spark / Dust Puff
    const sparkGeo = new THREE.SphereGeometry(isEnemyHit ? 0.08 : 0.05, 6, 6);
    const sparkMat = new THREE.MeshBasicMaterial({ color: isEnemyHit ? 0xd50000 : 0xffea00 });
    const spark = new THREE.Mesh(sparkGeo, sparkMat);
    spark.position.copy(point);
    this.scene.add(spark);

    setTimeout(() => {
      this.scene.remove(spark);
    }, 120);

    if (this.audio) {
      this.audio.playImpactSound(isEnemyHit ? 0.5 : 0.25);
    }
  }

  ejectShellCasing() {
    const casingGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.024, 6);
    const casingMat = new THREE.MeshStandardMaterial({ color: 0xd4a017, metalness: 0.9, roughness: 0.2 });
    const casing = new THREE.Mesh(casingGeo, casingMat);
    casing.position.copy(this.position).add(new THREE.Vector3(0.2, 1.3, 0.2));
    this.scene.add(casing);

    const vel = new THREE.Vector3((Math.random() - 0.2) * 2, 2.5, (Math.random() - 0.5) * 1.5);
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      if (elapsed > 1.2) {
        clearInterval(interval);
        this.scene.remove(casing);
        return;
      }
      vel.y -= 9.8 * 0.03;
      casing.position.addScaledVector(vel, 0.03);
      casing.rotation.x += 0.3;
      casing.rotation.y += 0.2;
    }, 30);
  }

  enterVehicle(vehicle) {
    this.gameState.player.inVehicle = true;
    vehicle.isOccupied = true;
    this.character.setVisible(false);
    this.audio.playImpactSound(0.3);
    this.gameState.notify('entered_vehicle', vehicle.id);
  }

  exitVehicle(vehicle) {
    this.gameState.player.inVehicle = false;
    vehicle.isOccupied = false;
    this.character.setVisible(true);

    const right = new THREE.Vector3(-1.8, 0, 0).applyQuaternion(vehicle.physics.quaternion);
    this.position.copy(vehicle.physics.position).add(right);
    this.position.y = this.terrain ? this.terrain.getGroundHeight(this.position.x, this.position.z) : 0;
    this.character.root.position.copy(this.position);

    this.audio.updateVehicleEngine(false, 0, 0, 0);
    this.audio.playImpactSound(0.3);
    this.gameState.notify('exited_vehicle', vehicle.id);
  }
}
