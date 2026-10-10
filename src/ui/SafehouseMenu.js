// ROADBOUND - Safehouse & Tuning Hub Modal Coordinator
import { MISSIONS_DATA } from '../missions/MissionsData.js';

export class SafehouseMenu {
  constructor(gameState, saveSystem, settingsManager, missionManager, fullscreenMap, onSpawnVehicle, onApplyWardrobe) {
    this.gameState = gameState;
    this.saveSystem = saveSystem;
    this.settings = settingsManager;
    this.missionManager = missionManager;
    this.fullscreenMap = fullscreenMap;
    this.onSpawnVehicle = onSpawnVehicle;
    this.onApplyWardrobe = onApplyWardrobe;

    this.container = document.getElementById('sub-screen-container');
    this.tabButtons = document.querySelectorAll('.sub-tab-btn');
    this.tabPanels = document.querySelectorAll('.tab-panel');
    this.cashDisplay = document.getElementById('sub-cash-display');

    this.selectedGarageVehicleId = this.gameState.player.activeVehicleId || 'apex_vanguard';

    this.initTabs();
    this.initGarageTab();
    this.initWardrobeTab();
    this.initMissionsTab();
    this.initSettingsTab();
    this.initSavesTab();
    this.initHeaderButtons();
  }

  show(tabName = 'garage') {
    if (!this.container) return;
    this.container.classList.remove('hidden');
    this.switchTab(tabName);
    this.updateCashDisplay();
    this.updateWardrobeNeeds();
    this.refreshSavesList();

    const btnResume = document.getElementById('btn-back-to-game');
    if (btnResume) {
      const isPlaying = window.gameInstance?.isPlaying;
      btnResume.innerHTML = isPlaying ? '&larr; RESUME GAME [ESC]' : '&larr; BACK TO MENU [ESC]';
    }
  }

  hide() {
    if (this.container) {
      this.container.classList.add('hidden');
    }
  }

  isOpen() {
    return this.container && !this.container.classList.contains('hidden');
  }

  updateCashDisplay() {
    if (this.cashDisplay) {
      this.cashDisplay.textContent = `$${this.gameState.player.cash.toLocaleString()}`;
    }
  }

  initHeaderButtons() {
    const btnResume = document.getElementById('btn-back-to-game');
    if (btnResume) {
      btnResume.addEventListener('click', () => {
        this.hide();
      });
    }
  }

  initTabs() {
    this.tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.getAttribute('data-tab');
        this.switchTab(targetTab);
      });
    });
  }

  switchTab(tabName) {
    this.tabButtons.forEach(btn => {
      if (btn.getAttribute('data-tab') === tabName) btn.classList.add('active');
      else btn.classList.remove('active');
    });

    this.tabPanels.forEach(panel => {
      if (panel.id === `tab-${tabName}`) panel.classList.add('active');
      else panel.classList.remove('active');
    });

    if (tabName === 'map') {
      setTimeout(() => {
        this.fullscreenMap.resize();
        this.fullscreenMap.centerOnPlayer();
      }, 50);
    }
  }

  // GARAGE TAB
  initGarageTab() {
    const list = document.getElementById('garage-vehicle-list');
    if (!list) return;

    list.innerHTML = '';
    Object.values(this.gameState.vehicles).forEach(veh => {
      const card = document.createElement('div');
      card.className = `vehicle-card-item ${veh.id === this.selectedGarageVehicleId ? 'active' : ''}`;
      card.innerHTML = `
        <div class="veh-info">
          <div class="veh-info-name">${veh.name}</div>
          <div class="veh-info-class">${veh.class}</div>
        </div>
        <div class="veh-badge">&#9656;</div>
      `;
      card.addEventListener('click', () => {
        list.querySelectorAll('.vehicle-card-item').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        this.selectedGarageVehicleId = veh.id;
        this.updateGarageSpecs(veh);
      });
      list.appendChild(card);
    });

    this.updateGarageSpecs(this.gameState.vehicles[this.selectedGarageVehicleId]);

    // Upgrade buttons
    const btnUpEngine = document.getElementById('btn-up-engine');
    if (btnUpEngine) {
      btnUpEngine.addEventListener('click', () => {
        if (this.gameState.spendCash(5000)) {
          const veh = this.gameState.vehicles[this.selectedGarageVehicleId];
          veh.upgrades.engineStage++;
          veh.stats.topSpeed += 4;
          veh.stats.acceleration += 5;
          this.updateGarageSpecs(veh);
          this.updateCashDisplay();
        }
      });
    }

    const btnRepair = document.getElementById('btn-repair-vehicle');
    if (btnRepair) {
      btnRepair.addEventListener('click', () => {
        if (this.gameState.spendCash(500)) {
          const veh = this.gameState.vehicles[this.selectedGarageVehicleId];
          veh.condition.health = 100;
          this.updateCashDisplay();
        }
      });
    }

    // Paint Swatches
    const swatches = document.querySelectorAll('#garage-paint-swatches .swatch');
    swatches.forEach(swatch => {
      swatch.addEventListener('click', () => {
        swatches.forEach(s => s.classList.remove('active'));
        swatch.classList.add('active');
        const color = swatch.getAttribute('data-color');
        const veh = this.gameState.vehicles[this.selectedGarageVehicleId];
        veh.customization.paintColor = color;
      });
    });

    // Spawn & Drive
    const btnSpawn = document.getElementById('btn-spawn-active-car');
    if (btnSpawn) {
      btnSpawn.addEventListener('click', () => {
        this.gameState.player.activeVehicleId = this.selectedGarageVehicleId;
        if (this.onSpawnVehicle) {
          this.onSpawnVehicle(this.selectedGarageVehicleId);
        }
        this.hide();
      });
    }
  }

  updateGarageSpecs(veh) {
    if (!veh) return;
    const stats = veh.stats;
    const setFill = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.style.width = `${Math.min(100, val)}%`;
    };
    setFill('spec-speed', stats.topSpeed);
    setFill('spec-accel', stats.acceleration);
    setFill('spec-handling', stats.handling);
    setFill('spec-braking', stats.braking);
    setFill('spec-offroad', stats.offroad);
    setFill('spec-durability', stats.durability);
  }

  // WARDROBE & PROTAGONIST CUSTOMIZER
  initWardrobeTab() {
    const btnMale = document.getElementById('btn-char-male');
    const btnFemale = document.getElementById('btn-char-female');
    const malePresets = document.getElementById('wardrobe-male-presets');
    const femalePresets = document.getElementById('wardrobe-female-presets');
    const charName = document.getElementById('wardrobe-char-name');

    const setGenderUI = (gender) => {
      this.gameState.player.gender = gender;
      if (gender === 'female') {
        this.gameState.player.name = 'Priya Sharma';
        this.gameState.player.role = 'Specialist Operative & Infiltrator';
        if (btnMale) btnMale.classList.remove('active');
        if (btnFemale) btnFemale.classList.add('active');
        if (malePresets) malePresets.classList.add('hidden');
        if (femalePresets) femalePresets.classList.remove('hidden');
        if (charName) charName.textContent = 'PRIYA SHARMA - WARDROBE';
        this.gameState.wardrobe.gender = 'female';
        this.gameState.wardrobe.preset = this.gameState.wardrobe.preset?.startsWith('female_') ? this.gameState.wardrobe.preset : 'female_kurti';
      } else {
        this.gameState.player.name = 'Marcus Vance';
        this.gameState.player.role = 'Ex-Tactical Operative & Precision Driver';
        if (btnMale) btnMale.classList.add('active');
        if (btnFemale) btnFemale.classList.remove('active');
        if (malePresets) malePresets.classList.remove('hidden');
        if (femalePresets) femalePresets.classList.add('hidden');
        if (charName) charName.textContent = 'MARCUS VANCE - WARDROBE';
        this.gameState.wardrobe.gender = 'male';
        this.gameState.wardrobe.preset = this.gameState.wardrobe.preset?.startsWith('male_') ? this.gameState.wardrobe.preset : 'male_jacket';
      }
      if (this.onApplyWardrobe) this.onApplyWardrobe(this.gameState.wardrobe);
      this.updateWardrobeNeeds();
    };

    if (btnMale) btnMale.addEventListener('click', () => setGenderUI('male'));
    if (btnFemale) btnFemale.addEventListener('click', () => setGenderUI('female'));

    const presets = document.querySelectorAll('.btn-preset');
    presets.forEach(p => {
      p.addEventListener('click', () => {
        const parent = p.closest('.preset-buttons');
        if (parent) {
          parent.querySelectorAll('.btn-preset').forEach(b => b.classList.remove('active'));
        }
        p.classList.add('active');
        const presetType = p.getAttribute('data-preset');
        this.gameState.wardrobe.preset = presetType;
        if (this.onApplyWardrobe) this.onApplyWardrobe(this.gameState.wardrobe);
      });
    });

    const btnApply = document.getElementById('btn-apply-wardrobe');
    if (btnApply) {
      btnApply.addEventListener('click', () => {
        if (this.onApplyWardrobe) this.onApplyWardrobe(this.gameState.wardrobe);
        this.hide();
      });
    }
  }

  updateWardrobeNeeds() {
    const needs = this.gameState.player?.needs;
    if (!needs) return;
    const stm = document.getElementById('menu-stat-stamina');
    const hng = document.getElementById('menu-stat-hunger');
    const thr = document.getElementById('menu-stat-thirst');
    const nrg = document.getElementById('menu-stat-energy');
    const tmp = document.getElementById('menu-stat-temp');
    if (stm) stm.textContent = `${Math.round(needs.stamina)}%`;
    if (hng) hng.textContent = `${Math.round(needs.hunger)}%`;
    if (thr) thr.textContent = `${Math.round(needs.thirst)}%`;
    if (nrg) nrg.textContent = `${Math.round(needs.energy)}%`;
    if (tmp) tmp.textContent = `${needs.temperature.toFixed(1)}°C`;
  }

  // MISSIONS TAB
  initMissionsTab() {
    const list = document.getElementById('missions-campaign-list');
    if (!list) return;

    list.innerHTML = '';
    MISSIONS_DATA.forEach(m => {
      const item = document.createElement('div');
      item.className = 'mission-card';
      item.innerHTML = `
        <div class="m-number">CHAPTER ${m.number}</div>
        <div class="m-name">${m.name}</div>
        <div class="m-status">${m.tagline}</div>
      `;
      item.addEventListener('click', () => {
        list.querySelectorAll('.mission-card').forEach(c => c.classList.remove('active'));
        item.classList.add('active');

        document.getElementById('detail-m-title').textContent = m.name;
        document.getElementById('detail-m-desc').textContent = m.description;
      });
      list.appendChild(item);
    });

    const btnStart = document.getElementById('btn-start-track-mission');
    if (btnStart) {
      btnStart.addEventListener('click', () => {
        this.missionManager.startMission(this.gameState.activeMission.id);
        this.hide();
      });
    }
  }

  // SETTINGS TAB
  initSettingsTab() {
    const presetSelect = document.getElementById('set-graphics-preset');
    if (presetSelect) {
      presetSelect.addEventListener('change', (e) => {
        this.settings.applyPreset(e.target.value);
      });
    }

    const timeSelect = document.getElementById('set-time-of-day');
    if (timeSelect) {
      timeSelect.addEventListener('change', (e) => {
        window.dispatchEvent(new CustomEvent('roadbound_set_time', { detail: { mode: e.target.value } }));
      });
    }
  }

  // SAVES TAB
  initSavesTab() {
    const btnManualSave = document.getElementById('btn-manual-save');
    if (btnManualSave) {
      btnManualSave.addEventListener('click', () => {
        this.saveSystem.saveGame(1);
        this.refreshSavesList();
      });
    }
  }

  refreshSavesList() {
    const container = document.getElementById('saves-slots-list');
    if (!container) return;

    const slots = this.saveSystem.getSlotMetadata();
    container.innerHTML = '';

    slots.forEach(s => {
      const card = document.createElement('div');
      card.className = `save-slot-card ${s.isEmpty ? '' : 'active'}`;
      if (s.isEmpty) {
        card.innerHTML = `
          <div class="slot-num">SLOT 0${s.slot}</div>
          <div class="slot-title">EMPTY SLOT</div>
          <p class="slot-meta">No local save data found.</p>
          <div class="slot-actions">
            <button class="slot-btn btn-save-slot" data-slot="${s.slot}">CREATE SAVE</button>
          </div>
        `;
      } else {
        const dateStr = new Date(s.timestamp).toLocaleDateString();
        card.innerHTML = `
          <div class="slot-num">SLOT 0${s.slot}</div>
          <div class="slot-title">${s.district}</div>
          <p class="slot-meta">
            Saved: ${dateStr}<br>
            Funds: $${s.cash.toLocaleString()}<br>
            Car: ${s.activeCar.replace('_', ' ').toUpperCase()}<br>
            Mission: ${s.mission}
          </p>
          <div class="slot-actions">
            <button class="slot-btn btn-load-slot" data-slot="${s.slot}">LOAD</button>
            <button class="slot-btn btn-save-slot" data-slot="${s.slot}">OVERWRITE</button>
          </div>
        `;
      }

      container.appendChild(card);
    });

    // Attach listeners
    container.querySelectorAll('.btn-save-slot').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const slot = parseInt(e.target.getAttribute('data-slot'));
        this.saveSystem.saveGame(slot);
        this.refreshSavesList();
      });
    });

    container.querySelectorAll('.btn-load-slot').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const slot = parseInt(e.target.getAttribute('data-slot'));
        this.saveSystem.loadGame(slot);
        this.refreshSavesList();
        this.hide();
      });
    });
  }
}
