// ROADBOUND - Robust 100% Offline Save & Load System
export class SaveSystem {
  constructor(gameState) {
    this.gameState = gameState;
    this.storageKeyPrefix = 'roadbound_save_slot_';
    this.metaKey = 'roadbound_meta';
    this.maxSlots = 3;
    this.autoSaveInterval = 120; // Seconds
    this.timer = 0;
  }

  getSlotMetadata() {
    const metaList = [];
    if (typeof window === 'undefined' || !window.localStorage) {
      for (let i = 1; i <= this.maxSlots; i++) metaList.push({ slot: i, isEmpty: true });
      return metaList;
    }
    for (let i = 1; i <= this.maxSlots; i++) {
      const raw = localStorage.getItem(`${this.storageKeyPrefix}${i}`);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          metaList.push({
            slot: i,
            isEmpty: false,
            timestamp: parsed.timestamp || Date.now(),
            playtime: parsed.playtime || '1h 45m',
            cash: parsed.player?.cash || 0,
            activeCar: parsed.player?.activeVehicleId || 'apex_vanguard',
            mission: parsed.activeMission?.name || 'ARRIVAL & EXTRACTION',
            district: parsed.player?.currentDistrict || 'Downtown'
          });
        } catch (e) {
          metaList.push({ slot: i, isEmpty: true });
        }
      } else {
        metaList.push({ slot: i, isEmpty: true });
      }
    }
    return metaList;
  }

  saveGame(slot = 1) {
    if (typeof window === 'undefined' || !window.localStorage) return false;
    try {
      const saveObject = {
        version: '1.0.4',
        timestamp: Date.now(),
        player: { ...this.gameState.player },
        vehicles: { ...this.gameState.vehicles },
        weapons: this.gameState.weapons.map(w => ({ ...w })),
        activeWeaponIndex: this.gameState.activeWeaponIndex,
        wardrobe: { ...this.gameState.wardrobe },
        police: { ...this.gameState.police },
        world: { ...this.gameState.world },
        activeMission: { ...this.gameState.activeMission }
      };

      const serialized = JSON.stringify(saveObject);
      localStorage.setItem(`${this.storageKeyPrefix}${slot}`, serialized);
      localStorage.setItem(`${this.storageKeyPrefix}backup`, serialized); // Crash-safe duplicate
      this.gameState.notify('game_saved', { slot, timestamp: Date.now() });
      return true;
    } catch (err) {
      console.error('[ROADBOUND SaveSystem] Save failed:', err);
      return false;
    }
  }

  loadGame(slot = 1) {
    if (typeof window === 'undefined' || !window.localStorage) return false;
    try {
      const raw = localStorage.getItem(`${this.storageKeyPrefix}${slot}`);
      if (!raw) return false;
      const data = JSON.parse(raw);

      // Hydrate state
      if (data.player) Object.assign(this.gameState.player, data.player);
      if (data.vehicles) Object.assign(this.gameState.vehicles, data.vehicles);
      if (data.weapons && Array.isArray(data.weapons)) {
        data.weapons.forEach((w, idx) => {
          if (this.gameState.weapons[idx]) {
            Object.assign(this.gameState.weapons[idx], w);
          }
        });
      }
      if (typeof data.activeWeaponIndex === 'number') {
        this.gameState.activeWeaponIndex = data.activeWeaponIndex;
      }
      if (data.wardrobe) Object.assign(this.gameState.wardrobe, data.wardrobe);
      if (data.world) {
        Object.assign(this.gameState.world, data.world);
        if (!data.world.timeMode) {
          this.gameState.world.timeMode = 'day';
          this.gameState.world.timeOfDay = 12.0;
        }
      }
      if (data.activeMission) Object.assign(this.gameState.activeMission, data.activeMission);

      this.gameState.notify('game_loaded', { slot });
      return true;
    } catch (err) {
      console.error('[ROADBOUND SaveSystem] Load failed:', err);
      return false;
    }
  }

  deleteSave(slot) {
    if (typeof window === 'undefined' || !window.localStorage) return;
    localStorage.removeItem(`${this.storageKeyPrefix}${slot}`);
    this.gameState.notify('save_deleted', { slot });
  }

  update(delta) {
    this.timer += delta;
    if (this.timer >= this.autoSaveInterval) {
      this.timer = 0;
      this.saveGame(1); // Auto-save to slot 1
    }
  }
}
