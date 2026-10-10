// ROADBOUND - Central Game State Manager
export class GameState {
  constructor() {
    this.player = {
      gender: 'male', // 'male' (Marcus Vance) or 'female' (Priya Sharma)
      name: 'Marcus Vance',
      role: 'Ex-Tactical Operative & Precision Driver',
      health: 100,
      maxHealth: 100,
      armor: 80,
      maxArmor: 100,
      cash: 45000,
      repLevel: 4,
      repXp: 1250,
      currentDistrict: 'Downtown Financial Sector',
      inVehicle: false,
      activeVehicleId: 'apex_vanguard',
      position: { x: 0, y: 1.5, z: 0 },
      rotation: 0,
      needs: {
        stamina: 100,
        maxStamina: 100,
        hunger: 94,
        thirst: 90,
        energy: 95,
        temperature: 37.0 // in Celsius (normal body temperature)
      }
    };

    // Fleet of vehicles with individual upgrade stats and paint
    this.vehicles = {
      apex_vanguard: {
        id: 'apex_vanguard',
        name: 'Apex Vanguard GT-R',
        class: 'Hypercar / Exotic',
        unlocked: true,
        stats: {
          topSpeed: 96,
          acceleration: 94,
          handling: 90,
          braking: 92,
          offroad: 35,
          durability: 75
        },
        upgrades: {
          engineStage: 2,
          brakesStage: 2,
          suspensionStage: 2,
          tiresStage: 2
        },
        customization: {
          paintColor: '#111111',
          paintFinish: 'metallic', // 'metallic', 'matte', 'gloss', 'carbon'
          rimColor: '#c59b27',
          windowTint: 0.8
        },
        condition: {
          health: 100,
          deformation: 0,
          engineDamage: 0
        }
      },
      kodiak_v8: {
        id: 'kodiak_v8',
        name: 'Kodiak V8 Enforcer',
        class: 'Muscle / Interceptor',
        unlocked: true,
        stats: {
          topSpeed: 88,
          acceleration: 89,
          handling: 78,
          braking: 80,
          offroad: 50,
          durability: 90
        },
        upgrades: {
          engineStage: 1,
          brakesStage: 1,
          suspensionStage: 1,
          tiresStage: 1
        },
        customization: {
          paintColor: '#a91212',
          paintFinish: 'gloss',
          rimColor: '#111111',
          windowTint: 0.5
        },
        condition: {
          health: 100,
          deformation: 0,
          engineDamage: 0
        }
      },
      stratus_4x4: {
        id: 'stratus_4x4',
        name: 'Stratus Overlander 4x4',
        class: 'Off-Road Tactical SUV',
        unlocked: true,
        stats: {
          topSpeed: 75,
          acceleration: 72,
          handling: 70,
          braking: 78,
          offroad: 95,
          durability: 98
        },
        upgrades: {
          engineStage: 1,
          brakesStage: 1,
          suspensionStage: 3,
          tiresStage: 3
        },
        customization: {
          paintColor: '#252b20',
          paintFinish: 'matte',
          rimColor: '#505050',
          windowTint: 0.6
        },
        condition: {
          health: 100,
          deformation: 0,
          engineDamage: 0
        }
      },
      tuk_tuk: {
        id: 'tuk_tuk',
        name: 'Bajaj RE Auto-Rickshaw',
        class: 'Commercial 3-Wheeler / Tuk-Tuk',
        unlocked: true,
        stats: {
          topSpeed: 52,
          acceleration: 68,
          handling: 94,
          braking: 70,
          offroad: 40,
          durability: 60
        },
        upgrades: {
          engineStage: 1,
          brakesStage: 1,
          suspensionStage: 1,
          tiresStage: 1
        },
        customization: {
          paintColor: '#0f592f', // Iconic Indian Deep Auto-Green
          paintFinish: 'gloss',
          rimColor: '#111111',
          windowTint: 0.2
        },
        condition: {
          health: 100,
          deformation: 0,
          engineDamage: 0
        }
      },
      sovereign_v12: {
        id: 'sovereign_v12',
        name: 'Sovereign V12 Royal Saloon',
        class: 'Ultra-Luxury Executive Sedan',
        unlocked: true,
        stats: {
          topSpeed: 92,
          acceleration: 86,
          handling: 85,
          braking: 90,
          offroad: 30,
          durability: 95
        },
        upgrades: {
          engineStage: 2,
          brakesStage: 2,
          suspensionStage: 2,
          tiresStage: 2
        },
        customization: {
          paintColor: '#0b0f19', // Midnight Sapphire
          paintFinish: 'metallic',
          rimColor: '#c59b27',
          windowTint: 0.9
        },
        condition: {
          health: 100,
          deformation: 0,
          engineDamage: 0
        }
      },
      thunderbolt_moto: {
        id: 'thunderbolt_moto',
        name: 'Thunderbolt 1200cc Streetfighter',
        class: 'High-Performance Superbike',
        unlocked: true,
        stats: {
          topSpeed: 98,
          acceleration: 98,
          handling: 95,
          braking: 88,
          offroad: 25,
          durability: 45
        },
        upgrades: {
          engineStage: 3,
          brakesStage: 3,
          suspensionStage: 3,
          tiresStage: 3
        },
        customization: {
          paintColor: '#d62828', // Racing Red
          paintFinish: 'gloss',
          rimColor: '#d4af37',
          windowTint: 0.0
        },
        condition: {
          health: 100,
          deformation: 0,
          engineDamage: 0
        }
      },
      metro_bus: {
        id: 'metro_bus',
        name: 'Metropolitan Transit 40ft',
        class: 'Heavy Commercial Public Transit Bus',
        unlocked: true,
        stats: {
          topSpeed: 60,
          acceleration: 50,
          handling: 55,
          braking: 75,
          offroad: 30,
          durability: 99
        },
        upgrades: {
          engineStage: 1,
          brakesStage: 1,
          suspensionStage: 1,
          tiresStage: 1
        },
        customization: {
          paintColor: '#1565c0', // Transit Blue
          paintFinish: 'gloss',
          rimColor: '#505050',
          windowTint: 0.4
        },
        condition: {
          health: 100,
          deformation: 0,
          engineDamage: 0
        }
      }
    };

    // Weapons arsenal (Matching screenshots: M4A1 42/42, AWM Sniper 6/20, SMG 255, Shotgun 14)
    this.weapons = [
      {
        id: 'm4a1_elite',
        name: 'M4A1 Tactical Rifle',
        type: 'Assault Rifle',
        damage: 42,
        fireRate: 0.11,
        magCapacity: 42,
        currentClip: 42,
        reserveAmmo: 255,
        spread: 0.02,
        recoil: 0.06,
        unlocked: true
      },
      {
        id: 'awm_sniper',
        name: 'AWM Sniper Rifle',
        type: 'Sniper Rifle',
        damage: 150,
        fireRate: 1.25,
        magCapacity: 6,
        currentClip: 6,
        reserveAmmo: 20,
        spread: 0.005,
        recoil: 0.28,
        unlocked: true
      },
      {
        id: 'spectre_x',
        name: 'Spectre-X SMG',
        type: 'Submachine Gun',
        damage: 26,
        fireRate: 0.09,
        magCapacity: 30,
        currentClip: 30,
        reserveAmmo: 255,
        spread: 0.04,
        recoil: 0.07,
        unlocked: true
      },
      {
        id: 'titan_12',
        name: 'Titan-12 Breacher',
        type: 'Tactical Shotgun',
        damage: 85,
        fireRate: 0.75,
        magCapacity: 8,
        currentClip: 8,
        reserveAmmo: 14,
        spread: 0.08,
        recoil: 0.22,
        unlocked: true
      }
    ];
    this.activeWeaponIndex = 0; // Starts with M4A1 Tactical Rifle (42/42)

    // Wardrobe & appearance (Yellow athletic jacket + black racing track pants)
    this.wardrobe = {
      preset: 'battle_royale_elite',
      jacketColor: '#f5c71a', // Vivid sports yellow
      pantsColor: '#181b22',  // Carbon black with racing yellow stripes
      bootsColor: '#f5c71a',  // Yellow & black sports sneakers
      sunglasses: false,
      backpack: true,
      holster: true,
      gloves: true
    };

    // Law enforcement & wanted system
    this.police = {
      wantedLevel: 0, // 0 to 5
      heat: 0,        // 0.0 to 100.0
      pursuitActive: false,
      lastKnownPos: null,
      cooldownTimer: 0
    };

    // Environment & time (Default Day Mode - Vibrant Crystal-Clear High Noon Daylight)
    this.world = {
      timeOfDay: 12.0, // 12:00 PM High Noon Day Mode (Crystal-clear visibility)
      timeMode: 'day', // 'day', 'sunset', 'night'
      timeSpeed: 0.0, // Locked to day mode by default so daytime stays permanent
      weather: 'clear', // Clear blue skies
      rainIntensity: 0.0,
      fogDensity: 0.001
    };

    // Active Mission tracking
    this.activeMission = {
      id: 'm1_arrival',
      step: 0,
      name: 'ARRIVAL & EXTRACTION',
      objective: 'Secure the prototype Apex Vanguard from the cargo docks',
      targetLocation: { x: 380, y: 0, z: -250 },
      isCompleted: false
    };

    this.gpsWaypoint = null;
    this.listeners = new Set();
  }

  getActiveWeapon() {
    return this.weapons[this.activeWeaponIndex] || this.weapons[0];
  }

  getActiveVehicle() {
    return this.vehicles[this.player.activeVehicleId] || this.vehicles.apex_vanguard;
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notify(event, payload) {
    for (const listener of this.listeners) {
      listener(event, payload, this);
    }
  }

  addCash(amount) {
    this.player.cash += amount;
    this.notify('cash_updated', this.player.cash);
  }

  spendCash(amount) {
    if (this.player.cash >= amount) {
      this.player.cash -= amount;
      this.notify('cash_updated', this.player.cash);
      return true;
    }
    return false;
  }

  takeDamage(amount) {
    if (this.player.armor > 0) {
      const armorAbsorb = Math.min(this.player.armor, amount * 0.75);
      this.player.armor -= armorAbsorb;
      amount -= armorAbsorb;
    }
    this.player.health = Math.max(0, this.player.health - amount);
    this.notify('player_damage', { health: this.player.health, armor: this.player.armor });
    return this.player.health <= 0;
  }

  heal(hp, armor = 0) {
    this.player.health = Math.min(this.player.maxHealth, this.player.health + hp);
    this.player.armor = Math.min(this.player.maxArmor, this.player.armor + armor);
    this.notify('player_healed', { health: this.player.health, armor: this.player.armor });
  }

  setWantedLevel(level) {
    this.police.wantedLevel = Math.max(0, Math.min(5, level));
    this.police.pursuitActive = this.police.wantedLevel > 0;
    this.notify('wanted_changed', this.police.wantedLevel);
  }
}

export const gameState = new GameState();
