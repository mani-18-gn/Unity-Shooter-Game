// ROADBOUND - Open-World Procedural Loot & Itemization System
// High-tier loot in factories, military depots, warehouses, enterable houses & rooftops
import * as THREE from 'three';
import { WEAPON_DEFINITIONS, weaponArsenal } from './WeaponArsenal.js';

export const BAG_TIERS = {
  none: {
    id: 'none',
    name: 'No Backpack',
    ammoCapacity: 60,
    medkitCapacity: 2,
    armorBonus: 0
  },
  small_bag: {
    id: 'small_bag',
    name: 'Light Assault Pack (Small)',
    ammoCapacity: 150,
    medkitCapacity: 5,
    armorBonus: 0
  },
  medium_bag: {
    id: 'medium_bag',
    name: 'Tactical Rucksack (Medium)',
    ammoCapacity: 280,
    medkitCapacity: 9,
    armorBonus: 0
  },
  large_bag: {
    id: 'large_bag',
    name: 'Expedition Military Bag (Large)',
    ammoCapacity: 480,
    medkitCapacity: 16,
    armorBonus: 0
  }
};

export const MEDKIT_TYPES = {
  bandage: {
    id: 'bandage',
    name: 'Combat Bandage',
    healAmount: 15,
    useTime: 2.0,
    icon: '🩹'
  },
  medkit: {
    id: 'medkit',
    name: 'Field Trauma Medkit',
    healAmount: 50,
    useTime: 3.5,
    icon: '🧰'
  },
  first_aid: {
    id: 'first_aid',
    name: 'Full Surgical First Aid Kit',
    healAmount: 100, // Full heal
    useTime: 5.0,
    icon: '💉'
  }
};

export class LootSystem {
  constructor(scene, terrain, audio, gameState, hud) {
    this.scene = scene;
    this.terrain = terrain;
    this.audio = audio;
    this.gameState = gameState;
    this.hud = hud;

    this.lootItems = [];
    this.nearestLoot = null;
    this.animClock = 0;

    this.initMaterials();
    this.spawnMapLoot();
  }

  initMaterials() {
    this.materials = {
      beaconYellow: new THREE.MeshBasicMaterial({ color: 0xffd54f, transparent: true, opacity: 0.35 }),
      beaconCyan: new THREE.MeshBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.35 }),
      beaconPurple: new THREE.MeshBasicMaterial({ color: 0xd500f9, transparent: true, opacity: 0.45 }),
      beaconGold: new THREE.MeshBasicMaterial({ color: 0xffab00, transparent: true, opacity: 0.55 }),

      ammoBoxGreen: new THREE.MeshStandardMaterial({ color: 0x334425, metalness: 0.7, roughness: 0.4 }),
      ammoBoxMetal: new THREE.MeshStandardMaterial({ color: 0x546e7a, metalness: 0.8, roughness: 0.3 }),
      medkitWhite: new THREE.MeshStandardMaterial({ color: 0xf5f5f5, metalness: 0.2, roughness: 0.3 }),
      redCross: new THREE.MeshBasicMaterial({ color: 0xd32f2f }),
      crateWood: new THREE.MeshStandardMaterial({ color: 0x4e342e, roughness: 0.85 }),
      crateMilitary: new THREE.MeshStandardMaterial({ color: 0x2e3b23, metalness: 0.4, roughness: 0.6 })
    };
  }

  spawnMapLoot() {
    // 1. Factory & Industrial Sector (High-tier: AWM, M249, SCAR, Large Bags, Level 3 Armor)
    const factoryCoords = [
      { x: -350, z: -150, type: 'weapon', itemId: 'awm', name: 'AWM Sniper Rifle' },
      { x: -330, z: -160, type: 'ammo', itemId: 'ammo_300', count: 20, name: '.300 Magnum Ammo (x20)' },
      { x: -370, z: -140, type: 'weapon', itemId: 'm249', name: 'M249 LMG' },
      { x: -380, z: -155, type: 'ammo', itemId: 'ammo_556', count: 120, name: '5.56mm Ammo (x120)' },
      { x: -320, z: -180, type: 'bag', itemId: 'large_bag', name: 'Military Backpack (Large)' },
      { x: -340, z: -200, type: 'medkit', itemId: 'first_aid', count: 2, name: 'Full First Aid Kit (x2)' },
      { x: -360, z: -210, type: 'armor', itemId: 'vest_lv3', name: 'Kevlar Vest (Level 3)' }
    ];

    // 2. Warehouses & Harbour Cargo Docks
    const dockCoords = [
      { x: 380, z: -250, type: 'weapon', itemId: 'ak47', name: 'AK-47 Assault Rifle' },
      { x: 390, z: -245, type: 'ammo', itemId: 'ammo_762', count: 90, name: '7.62mm Ammo (x90)' },
      { x: 410, z: -260, type: 'weapon', itemId: 'scar', name: 'SCAR-L Special Forces' },
      { x: 420, z: -270, type: 'ammo', itemId: 'ammo_556', count: 90, name: '5.56mm Ammo (x90)' },
      { x: 370, z: -230, type: 'bag', itemId: 'medium_bag', name: 'Tactical Rucksack (Medium)' },
      { x: 400, z: -240, type: 'medkit', itemId: 'medkit', count: 3, name: 'Field Medkit (x3)' },
      { x: 430, z: -250, type: 'weapon', itemId: 'grenade', count: 4, name: 'M67 Frag Grenades (x4)' }
    ];

    // 3. Enterable Luxury Villa & Hillside Residences
    const villaCoords = [
      { x: 560, z: -48, type: 'weapon', itemId: 'sks', name: 'SKS Marksman DMR' },
      { x: 565, z: -52, type: 'ammo', itemId: 'ammo_762', count: 60, name: '7.62mm Ammo (x60)' },
      { x: 555, z: -45, type: 'weapon', itemId: 'shotgun', name: 'M870 Breacher Shotgun' },
      { x: 558, z: -42, type: 'ammo', itemId: 'ammo_12g', count: 24, name: '12-Gauge Shells (x24)' },
      { x: 570, z: -40, type: 'weapon', itemId: 'pistol', name: 'Glock 19 Sidearm' },
      { x: 572, z: -38, type: 'ammo', itemId: 'ammo_9mm', count: 60, name: '9mm Parabellum (x60)' },
      { x: 562, z: -55, type: 'medkit', itemId: 'bandage', count: 5, name: 'Combat Bandages (x5)' },
      { x: 550, z: -50, type: 'bag', itemId: 'small_bag', name: 'Light Assault Pack (Small)' }
    ];

    // 4. Downtown City Buildings & Metro Stations
    const downtownCoords = [
      { x: 0, z: -100, type: 'weapon', itemId: 'ump', name: 'UMP-45 Tactical SMG' },
      { x: 15, z: -90, type: 'weapon', itemId: 'mp40', name: 'MP-40 SMG' },
      { x: -10, z: -110, type: 'ammo', itemId: 'ammo_9mm', count: 120, name: '9mm Ammo (x120)' },
      { x: 25, z: -120, type: 'weapon', itemId: 'knife', name: 'Tanto Combat Knife' },
      { x: -20, z: -85, type: 'medkit', itemId: 'medkit', count: 2, name: 'Field Medkit (x2)' },
      { x: 5, z: -70, type: 'armor', itemId: 'vest_lv2', name: 'Tactical Vest (Level 2)' }
    ];

    // 5. Canyon Summit & Highway Checkpoints
    const canyonCoords = [
      { x: 250, z: 120, type: 'weapon', itemId: 'scar', name: 'SCAR-L' },
      { x: 260, z: 110, type: 'ammo', itemId: 'ammo_556', count: 60, name: '5.56mm Ammo (x60)' },
      { x: 240, z: 130, type: 'medkit', itemId: 'bandage', count: 4, name: 'Bandages (x4)' },
      { x: 270, z: 140, type: 'weapon', itemId: 'grenade', count: 3, name: 'Frag Grenades (x3)' }
    ];

    const allSpawns = [...factoryCoords, ...dockCoords, ...villaCoords, ...downtownCoords, ...canyonCoords];

    allSpawns.forEach((spawn) => {
      const groundY = this.terrain ? this.terrain.getGroundHeight(spawn.x, spawn.z) : 0;
      this.createLootEntity({
        ...spawn,
        y: groundY + 0.35
      });
    });
  }

  createLootEntity(spec) {
    const group = new THREE.Group();
    group.position.set(spec.x, spec.y, spec.z);

    // 1. Beacon Light Pillar
    const beaconGeo = new THREE.CylinderGeometry(0.18, 0.18, 2.8, 8);
    let beaconMat = this.materials.beaconYellow;
    if (spec.type === 'weapon') {
      const def = WEAPON_DEFINITIONS[spec.itemId];
      if (def?.category === 'sniper' || def?.category === 'lmg') beaconMat = this.materials.beaconGold;
      else if (def?.category === 'assault_rifle') beaconMat = this.materials.beaconPurple;
      else beaconMat = this.materials.beaconCyan;
    } else if (spec.type === 'bag') {
      beaconMat = this.materials.beaconGold;
    } else if (spec.type === 'medkit') {
      beaconMat = this.materials.beaconYellow;
    }

    const beacon = new THREE.Mesh(beaconGeo, beaconMat);
    beacon.position.y = 1.4;
    group.add(beacon);

    // 2. 3D Model representation
    let itemMesh = null;
    if (spec.type === 'weapon') {
      itemMesh = weaponArsenal.createWeaponMesh(spec.itemId);
      itemMesh.scale.set(1.3, 1.3, 1.3);
      itemMesh.rotation.z = Math.PI * 0.1;
    } else if (spec.type === 'ammo') {
      itemMesh = this.buildAmmoBoxMesh(spec.itemId);
    } else if (spec.type === 'medkit') {
      itemMesh = this.buildMedkitMesh(spec.itemId);
    } else if (spec.type === 'bag') {
      itemMesh = this.buildBackpackMesh(spec.itemId);
    } else if (spec.type === 'armor') {
      itemMesh = this.buildArmorMesh(spec.itemId);
    }

    if (itemMesh) {
      itemMesh.position.y = 0.45;
      group.add(itemMesh);
    }

    this.scene.add(group);

    const lootObj = {
      ...spec,
      group,
      itemMesh,
      baseY: spec.y,
      beacon
    };

    this.lootItems.push(lootObj);
    return lootObj;
  }

  buildAmmoBoxMesh(ammoType) {
    const box = new THREE.Group();
    const geo = new THREE.BoxGeometry(0.24, 0.16, 0.36);
    const mesh = new THREE.Mesh(geo, this.materials.ammoBoxGreen);
    box.add(mesh);

    // Stencil text badge
    const badgeGeo = new THREE.BoxGeometry(0.25, 0.05, 0.18);
    const badgeMat = new THREE.MeshBasicMaterial({ color: 0xffca28 });
    const badge = new THREE.Mesh(badgeGeo, badgeMat);
    badge.position.y = 0.03;
    box.add(badge);

    return box;
  }

  buildMedkitMesh(medkitType) {
    const kit = new THREE.Group();
    const caseGeo = new THREE.BoxGeometry(0.3, 0.22, 0.14);
    const caseMesh = new THREE.Mesh(caseGeo, this.materials.medkitWhite);
    kit.add(caseMesh);

    // Red Cross icon
    const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.12, 0.15), this.materials.redCross);
    const crossH = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.04, 0.15), this.materials.redCross);
    kit.add(crossV);
    kit.add(crossH);

    return kit;
  }

  buildBackpackMesh(tier) {
    const pack = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({
      color: tier === 'large_bag' ? 0x2e3b23 : 0x5d4037,
      metalness: 0.2,
      roughness: 0.8
    });
    const mainBody = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.44, 0.22), bodyMat);
    pack.add(mainBody);

    const pocket = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.22, 0.1), bodyMat);
    pocket.position.z = 0.14;
    pocket.position.y = -0.06;
    pack.add(pocket);

    return pack;
  }

  buildArmorMesh(armorId) {
    const vest = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: 0x212121, metalness: 0.4, roughness: 0.7 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.38, 0.18), mat);
    vest.add(body);
    return vest;
  }

  spawnEnemyLootCrate(position, weaponId = 'ak47') {
    const groundY = this.terrain ? this.terrain.getGroundHeight(position.x, position.z) : position.y;
    const crateGroup = new THREE.Group();
    crateGroup.position.set(position.x, groundY + 0.25, position.z);

    // Tactical Metal Drop Crate
    const crateGeo = new THREE.BoxGeometry(0.65, 0.45, 0.65);
    const crateMesh = new THREE.Mesh(crateGeo, this.materials.crateMilitary);
    crateMesh.castShadow = true;
    crateGroup.add(crateMesh);

    // Glowing green beacon
    const beacon = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.2, 3.2, 8),
      this.materials.beaconCyan
    );
    beacon.position.y = 1.6;
    crateGroup.add(beacon);

    this.scene.add(crateGroup);

    const drop = {
      x: position.x,
      y: groundY + 0.25,
      z: position.z,
      type: 'crate',
      itemId: weaponId,
      name: `ELIMINATED ENEMY CRATE [${weaponId.toUpperCase()}]`,
      group: crateGroup,
      beacon,
      isEnemyDrop: true
    };

    this.lootItems.push(drop);
    return drop;
  }

  update(delta, playerPos) {
    this.animClock += delta;
    const hoverOffset = Math.sin(this.animClock * 3.0) * 0.08;
    const rotSpeed = delta * 1.5;

    let closest = null;
    let minDistance = 2.8;

    for (let i = 0; i < this.lootItems.length; i++) {
      const item = this.lootItems[i];
      if (!item.group) continue;

      // Bob and rotate 3D mesh
      if (item.itemMesh) {
        item.itemMesh.rotation.y += rotSpeed;
        item.itemMesh.position.y = 0.45 + hoverOffset;
      } else if (item.isEnemyDrop) {
        item.group.rotation.y += delta * 0.4;
      }

      const dist = Math.hypot(playerPos.x - item.x, playerPos.z - item.z);
      if (dist < minDistance) {
        minDistance = dist;
        closest = item;
      }
    }

    this.nearestLoot = closest;

    if (this.nearestLoot) {
      const label = this.nearestLoot.count ? `${this.nearestLoot.name}` : `${this.nearestLoot.name}`;
      this.hud.showPrompt('F', `PICK UP ${label.toUpperCase()}`);
    }
  }

  pickUpNearest() {
    if (!this.nearestLoot) return false;

    const item = this.nearestLoot;
    const player = this.gameState.player;

    // Check inventory & Bag Capacity
    if (!player.inventory) {
      player.inventory = {
        bag: 'small_bag',
        bagConfig: BAG_TIERS.small_bag,
        bagAmmo: {
          '7.62mm': 120,
          '5.56mm': 120,
          '9mm': 90,
          '.300mag': 15,
          '12gauge': 24
        },
        medkits: {
          bandage: 4,
          medkit: 2,
          first_aid: 1
        },
        grenades: 3,
        armorVest: 50,
        armorLevel: 2,
        helmetLevel: 2
      };
    }

    if (item.type === 'weapon') {
      // Add or replace primary weapon in gameState
      const def = WEAPON_DEFINITIONS[item.itemId];
      if (def) {
        const newWep = {
          id: def.id,
          name: def.name,
          type: def.name,
          category: def.category,
          caliber: def.caliber,
          damage: def.damage,
          fireRate: def.fireRate,
          isAutomatic: def.isAutomatic,
          magCapacity: def.magCapacity,
          currentClip: def.magCapacity,
          reserveAmmo: player.inventory.bagAmmo[def.caliber] || 60,
          reloadTime: def.reloadTime,
          recoilPitch: def.recoilPitch,
          recoilSpread: def.recoilYawSpread,
          spread: def.spread,
          scopeType: def.scopeType,
          unlocked: true
        };

        // Equip into active weapon slot
        this.gameState.weapons[this.gameState.activeWeaponIndex] = newWep;
        if (window.gameInstance && window.gameInstance.characterController) {
          window.gameInstance.characterController.character.setEquippedWeapon(newWep.id);
        }
        this.gameState.notify('weapon_fired', newWep);
        this.hud.showCommsDialogue('GEAR EQUIPPED', `EQUIPPED <strong>${def.name.toUpperCase()}</strong> (${def.caliber})`, 2.5);
      }
    } else if (item.type === 'ammo') {
      const cal = item.itemId.replace('ammo_', '').replace('12g', '12gauge').replace('300', '.300mag');
      const targetCal = item.itemId === 'ammo_762' ? '7.62mm' :
                        item.itemId === 'ammo_556' ? '5.56mm' :
                        item.itemId === 'ammo_9mm' ? '9mm' :
                        item.itemId === 'ammo_300' ? '.300mag' : '12gauge';

      const current = player.inventory.bagAmmo[targetCal] || 0;
      const maxCap = player.inventory.bagConfig?.ammoCapacity || 150;
      const added = Math.min(item.count || 60, maxCap - current);

      player.inventory.bagAmmo[targetCal] = current + (added > 0 ? added : item.count || 30);

      // Also update reserve ammo on active weapon if calibers match
      const activeWep = this.gameState.getActiveWeapon();
      if (activeWep && activeWep.caliber === targetCal) {
        activeWep.reserveAmmo = player.inventory.bagAmmo[targetCal];
        this.gameState.notify('weapon_fired', activeWep);
      }

      this.hud.showCommsDialogue('AMMO PICKUP', `ACQUIRED <strong>+${item.count || 60} ROUNDS</strong> OF ${targetCal} AMMO`, 2.0);
    } else if (item.type === 'medkit') {
      const type = item.itemId;
      player.inventory.medkits[type] = (player.inventory.medkits[type] || 0) + (item.count || 1);
      this.hud.showCommsDialogue('MEDICAL SUPPLY', `ACQUIRED <strong>${item.name.toUpperCase()}</strong>`, 2.0);
    } else if (item.type === 'bag') {
      player.inventory.bag = item.itemId;
      player.inventory.bagConfig = BAG_TIERS[item.itemId] || BAG_TIERS.medium_bag;
      this.hud.showCommsDialogue('TACTICAL GEAR', `EQUIPPED <strong>${BAG_TIERS[item.itemId].name.toUpperCase()}</strong>! Ammo Cap: ${BAG_TIERS[item.itemId].ammoCapacity}`, 3.0);
    } else if (item.type === 'armor') {
      player.armor = 100;
      this.gameState.notify('player_healed', { health: player.health, armor: player.armor });
      this.hud.showCommsDialogue('TACTICAL ARMOR', `EQUIPPED <strong>${item.name.toUpperCase()}</strong> (100% Armor Protection)`, 2.5);
    } else if (item.type === 'crate') {
      // Enemy death crate: Give ammo, medkit & weapon
      player.inventory.medkits.medkit += 1;
      player.inventory.medkits.bandage += 3;
      const activeWep = this.gameState.getActiveWeapon();
      if (activeWep) {
        player.inventory.bagAmmo[activeWep.caliber] = (player.inventory.bagAmmo[activeWep.caliber] || 60) + 60;
        activeWep.reserveAmmo = player.inventory.bagAmmo[activeWep.caliber];
        this.gameState.notify('weapon_fired', activeWep);
      }
      this.hud.showCommsDialogue('LOOT CRATE SECURED', `SCAVENGED AMMO, MEDKITS & TACTICAL SUPPLIES FROM ENEMY CRATE!`, 3.0);
    }

    if (this.audio) {
      this.audio.playImpactSound(0.25);
    }

    // Remove entity from scene & array
    this.scene.remove(item.group);
    const idx = this.lootItems.indexOf(item);
    if (idx !== -1) {
      this.lootItems.splice(idx, 1);
    }
    this.nearestLoot = null;
    this.hud.hidePrompt();

    return true;
  }
}
