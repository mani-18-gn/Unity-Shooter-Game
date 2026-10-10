// ROADBOUND - Tactical Weapon Arsenal & Ballistics Engine
// Unreal Engine 5 Style High-Fidelity 3D Weapons, Ballistics & Recoil Dynamics
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export const WEAPON_DEFINITIONS = {
  ak47: {
    id: 'ak47',
    name: 'AK-47 Kalashnikov',
    category: 'assault_rifle',
    slot: 'primary',
    caliber: '7.62mm',
    damage: 38,
    fireRate: 0.10, // 600 RPM
    isAutomatic: true,
    magCapacity: 30,
    reloadTime: 2.2,
    recoilPitch: 0.08,
    recoilYawSpread: 0.035,
    range: 350,
    spread: 0.022,
    muzzleVelocity: 715,
    scopeType: 'iron',
    description: 'Iconic 7.62mm assault rifle with brutal stopping power and strong muzzle climb.'
  },
  scar: {
    id: 'scar',
    name: 'SCAR-L Special Forces',
    category: 'assault_rifle',
    slot: 'primary',
    caliber: '5.56mm',
    damage: 33,
    fireRate: 0.108, // 550 RPM
    isAutomatic: true,
    magCapacity: 30,
    reloadTime: 1.9,
    recoilPitch: 0.045,
    recoilYawSpread: 0.018,
    range: 400,
    spread: 0.012,
    muzzleVelocity: 870,
    scopeType: 'red_dot',
    description: 'Precision modular assault rifle. Extremely stable and controllable in sustained fire.'
  },
  sks: {
    id: 'sks',
    name: 'SKS Marksman DMR',
    category: 'dmr',
    slot: 'primary',
    caliber: '7.62mm',
    damage: 56,
    fireRate: 0.22,
    isAutomatic: false,
    magCapacity: 10,
    reloadTime: 2.4,
    recoilPitch: 0.09,
    recoilYawSpread: 0.02,
    range: 500,
    spread: 0.008,
    muzzleVelocity: 735,
    scopeType: '4x',
    description: 'Semi-automatic designated marksman rifle chambered in 7.62mm. High mid-range lethality.'
  },
  awm: {
    id: 'awm',
    name: 'AWM Arctic Warfare Magnum',
    category: 'sniper',
    slot: 'primary',
    caliber: '.300mag',
    damage: 150, // 1-shot high damage
    fireRate: 1.45, // Bolt-action cycle
    isAutomatic: false,
    magCapacity: 5,
    reloadTime: 3.2,
    recoilPitch: 0.22,
    recoilYawSpread: 0.04,
    range: 900,
    spread: 0.002,
    muzzleVelocity: 935,
    scopeType: '8x',
    description: 'Heavy bolt-action sniper rifle chambered in .300 Winchester Magnum. Equipped with 8x optical scope.'
  },
  m249: {
    id: 'm249',
    name: 'M249 SAW Light Machine Gun',
    category: 'lmg',
    slot: 'primary',
    caliber: '5.56mm',
    damage: 32,
    fireRate: 0.075, // 800 RPM
    isAutomatic: true,
    magCapacity: 100,
    reloadTime: 4.6,
    recoilPitch: 0.065,
    recoilYawSpread: 0.045,
    range: 420,
    spread: 0.035,
    muzzleVelocity: 915,
    scopeType: 'iron',
    description: '100-round belt-fed squad automatic weapon. Suppressive firepower at the expense of a long reload.'
  },
  ump: {
    id: 'ump',
    name: 'UMP-45 Tactical SMG',
    category: 'smg',
    slot: 'primary',
    caliber: '9mm',
    damage: 28,
    fireRate: 0.088, // 680 RPM
    isAutomatic: true,
    magCapacity: 25,
    reloadTime: 1.7,
    recoilPitch: 0.04,
    recoilYawSpread: 0.02,
    range: 220,
    spread: 0.025,
    muzzleVelocity: 400,
    scopeType: 'red_dot',
    description: 'High-mobility close quarters submachine gun with high cyclic rate and rapid reload.'
  },
  mp40: {
    id: 'mp40',
    name: 'MP-40 Maschinenpistole',
    category: 'smg',
    slot: 'primary',
    caliber: '9mm',
    damage: 26,
    fireRate: 0.105, // 570 RPM
    isAutomatic: true,
    magCapacity: 32,
    reloadTime: 2.0,
    recoilPitch: 0.042,
    recoilYawSpread: 0.022,
    range: 200,
    spread: 0.028,
    muzzleVelocity: 380,
    scopeType: 'iron',
    description: 'Classic 32-round 9mm SMG known for its manageable rate of fire and historical ergonomics.'
  },
  shotgun: {
    id: 'shotgun',
    name: 'M870 Tactical Breacher',
    category: 'shotgun',
    slot: 'primary',
    caliber: '12gauge',
    damage: 130, // 8 buckshot pellets total
    pellets: 8,
    fireRate: 0.85,
    isAutomatic: false,
    magCapacity: 8,
    reloadTime: 2.8,
    recoilPitch: 0.18,
    recoilYawSpread: 0.05,
    range: 75,
    spread: 0.09,
    muzzleVelocity: 410,
    scopeType: 'iron',
    description: 'Pump-action 12-gauge tactical shotgun. Devastating close-range clearing power.'
  },
  pistol: {
    id: 'pistol',
    name: 'Glock 19 Tactical Sidearm',
    category: 'pistol',
    slot: 'sidearm',
    caliber: '9mm',
    damage: 26,
    fireRate: 0.16,
    isAutomatic: false,
    magCapacity: 15,
    reloadTime: 1.4,
    recoilPitch: 0.05,
    recoilYawSpread: 0.02,
    range: 120,
    spread: 0.02,
    muzzleVelocity: 375,
    scopeType: 'iron',
    description: 'Dependable polymer 9mm semi-automatic service sidearm. Swift draw and fast reload.'
  },
  knife: {
    id: 'knife',
    name: 'Tanto Combat Knife',
    category: 'melee',
    slot: 'melee',
    caliber: 'none',
    damage: 65,
    fireRate: 0.45,
    isAutomatic: false,
    magCapacity: 1,
    reloadTime: 0,
    recoilPitch: 0.0,
    recoilYawSpread: 0.0,
    range: 2.4,
    spread: 0.0,
    muzzleVelocity: 0,
    scopeType: 'none',
    description: 'High-carbon tactical tanto blade for silent, lethal close-quarters takedowns.'
  },
  grenade: {
    id: 'grenade',
    name: 'M67 Fragmentation Grenade',
    category: 'throwable',
    slot: 'grenade',
    caliber: 'grenade',
    damage: 150,
    fireRate: 1.2,
    isAutomatic: false,
    magCapacity: 1,
    reloadTime: 0.8,
    recoilPitch: 0.02,
    recoilYawSpread: 0.0,
    range: 45,
    spread: 0.0,
    muzzleVelocity: 25,
    scopeType: 'none',
    description: 'High-explosive fragmentation grenade. 3.5-second fuse with 8-meter lethal kill radius.'
  }
};

export class WeaponArsenal {
  constructor() {
    this.materials = this.createWeaponMaterials();
  }

  createWeaponMaterials() {
    return {
      gunSteel: new THREE.MeshStandardMaterial({
        color: 0x1c1e22,
        metalness: 0.88,
        roughness: 0.32
      }),
      darkPolymer: new THREE.MeshStandardMaterial({
        color: 0x141517,
        metalness: 0.2,
        roughness: 0.72
      }),
      woodStock: new THREE.MeshStandardMaterial({
        color: 0x5a2d12, // Deep Russian laminate / walnut
        metalness: 0.05,
        roughness: 0.65
      }),
      fdeTan: new THREE.MeshStandardMaterial({
        color: 0x8a7b63, // SCAR Flat Dark Earth
        metalness: 0.35,
        roughness: 0.6
      }),
      brassGold: new THREE.MeshStandardMaterial({
        color: 0xd4af37,
        metalness: 0.95,
        roughness: 0.22
      }),
      opticGlass: new THREE.MeshPhysicalMaterial({
        color: 0x00e5ff,
        metalness: 0.1,
        roughness: 0.1,
        transmission: 0.85,
        transparent: true,
        opacity: 0.8
      }),
      bladeSteel: new THREE.MeshStandardMaterial({
        color: 0xd8dde4,
        metalness: 0.96,
        roughness: 0.15
      }),
      grenadeOlive: new THREE.MeshStandardMaterial({
        color: 0x3b4d28,
        metalness: 0.45,
        roughness: 0.6
      })
    };
  }

  // Generates 3D realistic mesh for any weapon
  createWeaponMesh(weaponId) {
    const root = new THREE.Group();
    root.name = `WeaponMesh_${weaponId}`;
    const m = this.materials;

    switch (weaponId) {
      case 'ak47': {
        // Receiver & Dust cover
        const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.075, 0.38), m.gunSteel);
        receiver.position.set(0, 0.04, 0.15);
        root.add(receiver);

        // Curved Banana Magazine (7.62x39)
        const mag = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.15, 0.06), m.gunSteel);
        mag.position.set(0, -0.06, 0.2);
        mag.rotation.x = 0.35;
        root.add(mag);

        // Long barrel & gas tube
        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.48, 8), m.gunSteel);
        barrel.rotation.x = Math.PI / 2;
        barrel.position.set(0, 0.055, 0.48);
        root.add(barrel);

        const gasTube = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.28, 8), m.woodStock);
        gasTube.rotation.x = Math.PI / 2;
        gasTube.position.set(0, 0.072, 0.38);
        root.add(gasTube);

        // Slanted Muzzle Brake
        const brake = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.012, 0.05, 8), m.gunSteel);
        brake.rotation.x = Math.PI / 2;
        brake.position.set(0, 0.055, 0.73);
        root.add(brake);

        // Wooden Handguard & Buttstock
        const stock = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.11, 0.28), m.woodStock);
        stock.position.set(0, 0.01, -0.16);
        root.add(stock);

        const grip = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.11, 0.045), m.woodStock);
        grip.position.set(0, -0.05, 0.02);
        grip.rotation.x = -0.32;
        root.add(grip);
        break;
      }

      case 'scar': {
        // Upper receiver (FDE Tan anodized aluminum)
        const upper = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.08, 0.44), m.fdeTan);
        upper.position.set(0, 0.045, 0.16);
        root.add(upper);

        // Lower receiver & grip
        const lower = new THREE.Mesh(new THREE.BoxGeometry(0.046, 0.05, 0.32), m.darkPolymer);
        lower.position.set(0, -0.01, 0.14);
        root.add(lower);

        const grip = new THREE.Mesh(new THREE.BoxGeometry(0.034, 0.11, 0.045), m.darkPolymer);
        grip.position.set(0, -0.07, 0.02);
        grip.rotation.x = -0.3;
        root.add(grip);

        // 5.56 STANAG Magazine
        const mag = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.14, 0.055), m.darkPolymer);
        mag.position.set(0, -0.07, 0.18);
        root.add(mag);

        // Picatinny Rail on top
        const rail = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.014, 0.44), m.gunSteel);
        rail.position.set(0, 0.09, 0.16);
        root.add(rail);

        // Holographic / Red Dot Sight
        const opticBox = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.04, 0.07), m.darkPolymer);
        opticBox.position.set(0, 0.115, 0.16);
        root.add(opticBox);
        const glass = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.028, 0.005), m.opticGlass);
        glass.position.set(0, 0.12, 0.18);
        root.add(glass);

        // Fluted Barrel & Flash Hider
        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.46, 8), m.gunSteel);
        barrel.rotation.x = Math.PI / 2;
        barrel.position.set(0, 0.04, 0.52);
        root.add(barrel);

        // Folding UGG-boot Stock
        const stock = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.09, 0.22), m.fdeTan);
        stock.position.set(0, 0.02, -0.15);
        root.add(stock);
        break;
      }

      case 'sks': {
        // Wooden classic rifle stock body
        const fullStock = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.08, 0.72), m.woodStock);
        fullStock.position.set(0, 0.02, 0.15);
        root.add(fullStock);

        // Steel bolt mechanism & barrel
        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.62, 8), m.gunSteel);
        barrel.rotation.x = Math.PI / 2;
        barrel.position.set(0, 0.05, 0.58);
        root.add(barrel);

        // Internal 10rd Box Magazine
        const boxMag = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.07, 0.08), m.gunSteel);
        boxMag.position.set(0, -0.03, 0.2);
        root.add(boxMag);

        // 4x Scope & Mount
        const scopeTube = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.22, 12), m.gunSteel);
        scopeTube.rotation.x = Math.PI / 2;
        scopeTube.position.set(0, 0.095, 0.12);
        root.add(scopeTube);
        break;
      }

      case 'awm': {
        // Heavy sniper chassis (Iconic L96 / AWM Olive Green)
        const chassisMat = new THREE.MeshStandardMaterial({ color: 0x475b36, metalness: 0.35, roughness: 0.55 });
        const chassis = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.09, 0.82), chassisMat);
        chassis.position.set(0, 0.03, 0.18);
        root.add(chassis);

        // Thumbhole Stock
        const stock = new THREE.Mesh(new THREE.BoxGeometry(0.044, 0.12, 0.28), chassisMat);
        stock.position.set(0, 0.02, -0.25);
        root.add(stock);

        // Massive Heavy Fluted .300 Barrel
        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.013, 0.78, 12), m.gunSteel);
        barrel.rotation.x = Math.PI / 2;
        barrel.position.set(0, 0.055, 0.78);
        root.add(barrel);

        // Monster Muzzle Brake
        const brake = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.034, 0.08), m.gunSteel);
        brake.position.set(0, 0.055, 1.18);
        root.add(brake);

        // High-Power 8x Sniper Scope
        const scopeMount = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.035, 0.14), m.gunSteel);
        scopeMount.position.set(0, 0.09, 0.16);
        root.add(scopeMount);

        const scopeMain = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.02, 0.34, 16), m.gunSteel);
        scopeMain.rotation.x = Math.PI / 2;
        scopeMain.position.set(0, 0.12, 0.16);
        root.add(scopeMain);

        // Giant Front Objective Lens Bell
        const objBell = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.024, 0.08, 16), m.gunSteel);
        objBell.rotation.x = Math.PI / 2;
        objBell.position.set(0, 0.12, 0.33);
        root.add(objBell);

        // Bolt Handle
        const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.07, 6), m.gunSteel);
        bolt.rotation.z = Math.PI / 2.8;
        bolt.position.set(0.035, 0.065, 0.04);
        root.add(bolt);
        break;
      }

      case 'm249': {
        // Heavy SAW Body
        const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.09, 0.46), m.gunSteel);
        receiver.position.set(0, 0.04, 0.14);
        root.add(receiver);

        // 100-Round Ammo Box Drum attached to bottom
        const drumMat = new THREE.MeshStandardMaterial({ color: 0x3d4934, metalness: 0.2, roughness: 0.8 });
        const ammoDrum = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.16, 0.14), drumMat);
        ammoDrum.position.set(0, -0.09, 0.18);
        root.add(ammoDrum);

        // Heavy Barrel with heat shield
        const heatShield = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.36, 12), m.gunSteel);
        heatShield.rotation.x = Math.PI / 2;
        heatShield.position.set(0, 0.05, 0.52);
        root.add(heatShield);

        // Carry Handle
        const handle = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.008, 6, 12, Math.PI), m.darkPolymer);
        handle.position.set(0.04, 0.1, 0.26);
        root.add(handle);

        // Metal Skeleton Stock
        const stock = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.1, 0.26), m.gunSteel);
        stock.position.set(0, 0.02, -0.2);
        root.add(stock);
        break;
      }

      case 'ump': {
        // Compact Polymer SMG Body
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.075, 0.32), m.darkPolymer);
        body.position.set(0, 0.035, 0.12);
        root.add(body);

        // Straight Stick 9mm Magazine
        const stickMag = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.18, 0.038), m.darkPolymer);
        stickMag.position.set(0, -0.08, 0.16);
        stickMag.rotation.x = -0.15;
        root.add(stickMag);

        // Short Barrel & Flash Hider
        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.22, 8), m.gunSteel);
        barrel.rotation.x = Math.PI / 2;
        barrel.position.set(0, 0.045, 0.36);
        root.add(barrel);

        // Skeleton Foldable Stock
        const stock = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.07, 0.18), m.darkPolymer);
        stock.position.set(0, 0.02, -0.12);
        root.add(stock);
        break;
      }

      case 'mp40': {
        // Cylindrical German Receiver
        const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.38, 12), m.gunSteel);
        tube.rotation.x = Math.PI / 2;
        tube.position.set(0, 0.04, 0.12);
        root.add(tube);

        // Long thin vertical 32-round stick mag
        const mag = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.22, 0.036), m.gunSteel);
        mag.position.set(0, -0.09, 0.19);
        root.add(mag);

        // Dark Bakelite lower grip frame
        const lower = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.05, 0.18), m.darkPolymer);
        lower.position.set(0, -0.01, 0.05);
        root.add(lower);

        // Underfolding Wire Stock
        const wireStock = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.06, 0.24), m.gunSteel);
        wireStock.position.set(0, -0.01, -0.16);
        root.add(wireStock);
        break;
      }

      case 'shotgun': {
        // Heavy Breacher Receiver
        const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.046, 0.07, 0.32), m.gunSteel);
        receiver.position.set(0, 0.035, 0.12);
        root.add(receiver);

        // 12-Gauge Full Length Barrel
        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.58, 10), m.gunSteel);
        barrel.rotation.x = Math.PI / 2;
        barrel.position.set(0, 0.05, 0.52);
        root.add(barrel);

        // Under-barrel Tubular Magazine (8 shells)
        const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.013, 0.5, 10), m.gunSteel);
        tube.rotation.x = Math.PI / 2;
        tube.position.set(0, 0.02, 0.48);
        root.add(tube);

        // Ribbed Pump Slide Forend
        const pump = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.18, 10), m.darkPolymer);
        pump.rotation.x = Math.PI / 2;
        pump.position.set(0, 0.02, 0.44);
        root.add(pump);

        // Pistol Grip & Tactical Stock
        const stock = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.1, 0.24), m.darkPolymer);
        stock.position.set(0, 0.01, -0.15);
        root.add(stock);
        break;
      }

      case 'pistol': {
        // Glock polymer frame
        const frame = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.05, 0.18), m.darkPolymer);
        frame.position.set(0, 0.01, 0.06);
        root.add(frame);

        // Steel slide
        const slide = new THREE.Mesh(new THREE.BoxGeometry(0.034, 0.04, 0.19), m.gunSteel);
        slide.position.set(0, 0.05, 0.06);
        root.add(slide);

        // Grip handle
        const grip = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.11, 0.048), m.darkPolymer);
        grip.position.set(0, -0.05, 0.01);
        grip.rotation.x = -0.28;
        root.add(grip);
        break;
      }

      case 'knife': {
        // Tanto blade with bevel
        const blade = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.042, 0.22), m.bladeSteel);
        blade.position.set(0, 0.01, 0.16);
        root.add(blade);

        // Ergonomic G10 Handle Grip
        const handle = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.038, 0.14), m.darkPolymer);
        handle.position.set(0, 0, -0.02);
        root.add(handle);
        break;
      }

      case 'grenade': {
        // M67 Lemon sphere body
        const body = new THREE.Mesh(new THREE.SphereGeometry(0.042, 12, 12), m.grenadeOlive);
        root.add(body);

        // Fuze, safety pin ring & fly-off lever
        const fuse = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.03, 8), m.gunSteel);
        fuse.position.set(0, 0.045, 0);
        root.add(fuse);

        const lever = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.06, 0.008), m.gunSteel);
        lever.position.set(0.03, 0.02, 0);
        root.add(lever);

        const pinRing = new THREE.Mesh(new THREE.TorusGeometry(0.014, 0.003, 6, 12), m.brassGold);
        pinRing.position.set(-0.025, 0.045, 0);
        root.add(pinRing);
        break;
      }

      default:
        break;
    }

    // Attach dynamic Muzzle Flash PointLight & Shell Ejection Port
    const muzzleLight = new THREE.PointLight(0xffb74d, 0, 16);
    muzzleLight.position.set(0, 0.05, 0.8);
    root.add(muzzleLight);
    root.userData.muzzleLight = muzzleLight;

    this.tryLoadExternalWeaponGLB(weaponId, root);

    return root;
  }

  tryLoadExternalWeaponGLB(weaponId, root) {
    const loader = new GLTFLoader();
    const candidatePaths = [
      `/assets/models/weapons/${weaponId}.glb`,
      `/assets/models/weapons/gun_${weaponId}.glb`
    ];

    const tryNext = (idx) => {
      if (idx >= candidatePaths.length) return;
      const path = candidatePaths[idx];
      loader.load(
        path,
        (gltf) => {
          console.log('[HORIZEN Graphics] Loaded Photorealistic Weapon Model:', path);
          const gunScene = gltf.scene;

          const box = new THREE.Box3().setFromObject(gunScene);
          const size = box.getSize(new THREE.Vector3());
          if (size.z > 0.05) {
            const scaleFactor = 0.85 / size.z;
            gunScene.scale.set(scaleFactor, scaleFactor, scaleFactor);
          }

          gunScene.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
              if (child.material) {
                child.material.envMapIntensity = 1.2;
              }
            }
          });

          // Hide procedural weapon meshes while keeping muzzle light
          root.children.forEach(c => {
            if (c !== root.userData.muzzleLight) {
              c.visible = false;
            }
          });
          root.add(gunScene);
        },
        undefined,
        () => {
          tryNext(idx + 1);
        }
      );
    };

    tryNext(0);
  }
}

export const weaponArsenal = new WeaponArsenal();
