// ROADBOUND - Battle Royale / Open World Tactical HUD Pipeline
// Matches reference screenshots: 360° compass, safezone timer, BR weapon card, dual EP/HP bars, touch action controls

export class HUD {
  constructor(gameState) {
    this.gameState = gameState;

    // DOM Elements
    this.hudRoot = document.getElementById('game-hud');
    this.minimapCanvas = document.getElementById('minimap-canvas');
    this.minimapCtx = this.minimapCanvas ? this.minimapCanvas.getContext('2d') : null;

    // Compass Tape
    this.compassTape = document.getElementById('hud-compass-tape');
    this.compassDeg = document.getElementById('hud-compass-deg');
    this.initCompassTape();

    // Safe Zone Timer
    this.safezoneBanner = document.getElementById('hud-safezone-banner');
    this.safezoneTimerText = document.getElementById('safezone-timer');
    this.safezoneTimeRemaining = 71; // 01:11 countdown (Screenshot 1)
    this.isSafezoneShrinking = false;

    // BR Match Stats
    this.aliveNum = document.getElementById('br-alive-count');
    this.killNum = document.getElementById('br-kill-count');

    // Vitals (Dual EP & HP Bars)
    this.epFill = document.getElementById('hud-ep-fill');
    this.epNum = document.getElementById('hud-ep-num');
    this.healthFill = document.getElementById('hud-health-fill');
    this.healthNum = document.getElementById('hud-health-num');

    // Weapons
    this.weaponCard = document.getElementById('hud-weapon-card');
    this.ammoClip = document.getElementById('hud-ammo-clip');
    this.ammoReserve = document.getElementById('hud-ammo-reserve');
    this.btnQuickReload = document.getElementById('btn-quick-reload');
    this.districtName = document.getElementById('hud-district-name');

    // Vehicle Cluster
    this.vehicleCluster = document.getElementById('hud-vehicle-cluster');
    this.speedNum = document.getElementById('hud-speed-num');
    this.gearNum = document.getElementById('hud-gear-num');
    this.rpmCircle = document.getElementById('dial-rpm-circle');
    this.rpmMeter = document.getElementById('hud-rpm-meter');
    this.vehHp = document.getElementById('hud-veh-hp');

    // Comms Box & Prompt
    this.commsBox = document.getElementById('comms-dialogue-box');
    this.commsSpeaker = document.getElementById('comms-speaker-name');
    this.commsText = document.getElementById('comms-text');
    this.commsTimer = 0;

    this.promptBox = document.getElementById('interaction-prompt');
    this.promptKey = document.getElementById('prompt-key');
    this.promptText = document.getElementById('prompt-text');

    this.crosshair = document.getElementById('weapon-crosshair');
    this.crosshairRing = document.getElementById('crosshair-ring');
    this.crosshairDot = document.getElementById('crosshair-dot');
    this.hitMarker = document.getElementById('hit-marker');
    this.hitKillSkull = document.getElementById('hit-kill-skull');
    this.scopeOverlayRoot = document.getElementById('scope-overlay-root');
    this.scope8x = document.getElementById('scope-8x');
    this.scope4x = document.getElementById('scope-4x');
    this.scopeRedDot = document.getElementById('scope-reddot');
    this.noAmmoPill = document.getElementById('hud-no-ammo-pill');
    this.healingProgress = document.getElementById('hud-healing-progress');
    this.healingLabel = document.getElementById('healing-label-text');
    this.healingFillBar = document.getElementById('healing-fill-bar');
    this.reloadProgress = document.getElementById('hud-reload-progress');
    this.reloadLabel = document.getElementById('reload-label-text');
    this.reloadFillBar = document.getElementById('reload-fill-bar');
    this.killFeed = document.getElementById('hud-kill-feed');
    this.deathScreen = document.getElementById('screen-you-died');
    this.btnRespawn = document.getElementById('btn-death-respawn');
    this.btnRestart = document.getElementById('btn-death-restart');
    this.damageVignette = document.getElementById('screen-damage-vignette');

    // Survival Needs & Stamina Elements
    this.staminaFill = document.getElementById('hud-stamina-fill');
    this.staminaNum = document.getElementById('hud-stamina-num');
    this.hungerVal = document.getElementById('need-hunger-val');
    this.thirstVal = document.getElementById('need-thirst-val');
    this.tempVal = document.getElementById('need-temp-val');
    this.camPillText = document.getElementById('cam-pill-text');

    // Vehicle Cockpit Telemetry & Controls
    this.vehFuel = document.getElementById('hud-veh-fuel');
    this.fuelPct = document.getElementById('hud-fuel-pct');
    this.btnSigLeft = document.getElementById('btn-veh-signal-left');
    this.btnSigRight = document.getElementById('btn-veh-signal-right');
    this.btnHazard = document.getElementById('btn-veh-hazard');
    this.btnWipers = document.getElementById('btn-veh-wipers');

    this.initActionButtons();
    this.subscribeEvents();
  }

  initCompassTape() {
    if (!this.compassTape) return;
    this.compassTape.innerHTML = '';

    // Build degree items across 720 degrees (-180 to +540) for seamless wrap
    // Cardinal labels: N, 15, 30, NE, 60, 75, E, 105, 120, SE, 150, 165, S, 195, 210, SW, 240, 255, W, 285, 300, NW, 330, 345
    const cardinalMap = {
      0: 'N',
      45: 'NE',
      90: 'E',
      135: 'SE',
      180: 'S',
      225: 'SW',
      270: 'W',
      315: 'NW'
    };

    // Width per degree: 2.4px -> 360 deg = 864px
    this.pxPerDegree = 2.4;

    for (let deg = -180; deg <= 540; deg += 15) {
      const normDeg = ((deg % 360) + 360) % 360;
      const isCardinal = normDeg in cardinalMap;
      const label = isCardinal ? cardinalMap[normDeg] : `${normDeg}`;

      const item = document.createElement('div');
      item.className = 'compass-item';
      item.style.width = `${15 * this.pxPerDegree}px`;

      const labelEl = document.createElement('span');
      labelEl.className = `compass-label-text ${isCardinal ? 'cardinal' : ''}`;
      labelEl.textContent = label;

      const tickEl = document.createElement('div');
      tickEl.className = `compass-tick-mark ${isCardinal ? 'major' : ''}`;

      item.appendChild(labelEl);
      item.appendChild(tickEl);
      this.compassTape.appendChild(item);
    }
  }

  updateCompass(yawRadians) {
    if (!this.compassTape) return;

    // Convert yaw to 0-360 compass bearing (North = 0)
    let deg = ((-yawRadians * 180 / Math.PI) % 360 + 360) % 360;
    const offsetPx = -deg * this.pxPerDegree;

    this.compassTape.style.transform = `translateX(${offsetPx}px)`;

    if (this.compassDeg) {
      const cardinalMap = { 0: 'N', 45: 'NE', 90: 'E', 135: 'SE', 180: 'S', 225: 'SW', 270: 'W', 315: 'NW' };
      const nearestCardinal = Object.entries(cardinalMap).find(([d]) => Math.abs(deg - Number(d)) < 15);
      const suffix = nearestCardinal ? ` ${nearestCardinal[1]}` : '';
      this.compassDeg.textContent = `${Math.round(deg)}°${suffix}`;
    }
  }

  updateSafeZone(delta) {
    this.safezoneTimeRemaining -= delta;

    if (this.safezoneTimeRemaining <= 0) {
      if (!this.isSafezoneShrinking) {
        // Switch to shrinking alert
        this.isSafezoneShrinking = true;
        this.safezoneTimeRemaining = 45; // 45s shrink phase
        if (this.safezoneBanner) {
          this.safezoneBanner.classList.add('shrinking');
          this.safezoneBanner.innerHTML = `<span class="safezone-icon">&#9888;</span> <span>Safe zone is now shrinking <strong>WARNING</strong></span>`;
        }
      } else {
        // Switch back to countdown
        this.isSafezoneShrinking = false;
        this.safezoneTimeRemaining = 71; // 01:11
        if (this.safezoneBanner) {
          this.safezoneBanner.classList.remove('shrinking');
          this.safezoneBanner.innerHTML = `<span class="safezone-icon">&#9203;</span> <span>Safe zone will shrink in <strong id="safezone-timer">01:11</strong></span>`;
          this.safezoneTimerText = document.getElementById('safezone-timer');
        }
      }
    }

    if (!this.isSafezoneShrinking && this.safezoneTimerText) {
      const mins = Math.floor(this.safezoneTimeRemaining / 60);
      const secs = Math.floor(this.safezoneTimeRemaining % 60);
      this.safezoneTimerText.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
  }

  initActionButtons() {
    // Interactive Touch / Action buttons
    const bindBtn = (id, callback) => {
      const btn = document.getElementById(id);
      if (btn) {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          callback();
        });
      }
    };

    // Day / Night Mode Toggle Button
    const btnDayNight = document.getElementById('btn-hud-day-night');
    if (btnDayNight) {
      btnDayNight.addEventListener('click', (e) => {
        e.stopPropagation();
        window.dispatchEvent(new CustomEvent('roadbound_toggle_time'));
      });
    }

    // Open Settings Menu button
    const btnSettings = document.getElementById('btn-hud-open-settings');
    if (btnSettings) {
      btnSettings.addEventListener('click', (e) => {
        e.stopPropagation();
        if (window.gameInstance && window.gameInstance.safehouseMenu) {
          window.gameInstance.safehouseMenu.show('settings');
          window.gameInstance.input.exitPointerLock();
        }
      });
    }

    // Interactive Click-to-Enter / Exit on Interaction Prompt
    if (this.promptBox) {
      this.promptBox.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.gameState.player.inVehicle) {
          window.dispatchEvent(new CustomEvent('roadbound_action', { detail: { action: 'exit_vehicle' } }));
        } else {
          window.dispatchEvent(new CustomEvent('roadbound_action', { detail: { action: 'enter_vehicle' } }));
        }
      });
    }

    // Virtual D-Pad buttons for smooth on-screen movement
    const bindDpad = (btnId, axis, val) => {
      const btn = document.getElementById(btnId);
      if (!btn) return;
      const start = (e) => {
        e.preventDefault();
        e.stopPropagation();
        btn.classList.add('active');
        window.dispatchEvent(new CustomEvent('roadbound_virtual_move', { detail: { [axis]: val } }));
      };
      const stop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        btn.classList.remove('active');
        window.dispatchEvent(new CustomEvent('roadbound_virtual_move', { detail: { [axis]: 0 } }));
      };
      btn.addEventListener('mousedown', start);
      btn.addEventListener('mouseup', stop);
      btn.addEventListener('mouseleave', stop);
      btn.addEventListener('touchstart', start, { passive: false });
      btn.addEventListener('touchend', stop, { passive: false });
      btn.addEventListener('touchcancel', stop, { passive: false });
    };

    bindDpad('btn-dpad-w', 'moveZ', 1);
    bindDpad('btn-dpad-s', 'moveZ', -1);
    bindDpad('btn-dpad-a', 'moveX', -1);
    bindDpad('btn-dpad-d', 'moveX', 1);

    bindBtn('btn-touch-fire', () => {
      window.dispatchEvent(new CustomEvent('roadbound_action', { detail: { action: 'fire' } }));
    });

    bindBtn('btn-touch-aim', () => {
      window.dispatchEvent(new CustomEvent('roadbound_action', { detail: { action: 'aim_toggle' } }));
    });

    bindBtn('btn-touch-sprint', () => {
      window.dispatchEvent(new CustomEvent('roadbound_action', { detail: { action: 'sprint_toggle' } }));
    });

    bindBtn('btn-touch-jump', () => {
      window.dispatchEvent(new CustomEvent('roadbound_action', { detail: { action: 'jump' } }));
    });

    bindBtn('btn-touch-crouch', () => {
      window.dispatchEvent(new CustomEvent('roadbound_action', { detail: { action: 'crouch' } }));
    });

    bindBtn('btn-touch-prone', () => {
      window.dispatchEvent(new CustomEvent('roadbound_action', { detail: { action: 'prone' } }));
    });

    bindBtn('btn-touch-medkit', () => {
      const currentHp = this.gameState.player.health;
      if (currentHp < 200) {
        this.gameState.player.health = Math.min(200, currentHp + 50);
        this.gameState.notify('player_healed', { health: this.gameState.player.health, armor: this.gameState.player.armor });
      }
    });

    bindBtn('btn-quick-reload', () => {
      window.dispatchEvent(new CustomEvent('roadbound_action', { detail: { action: 'reload' } }));
    });

    bindBtn('btn-hud-camera-toggle', () => {
      window.dispatchEvent(new CustomEvent('roadbound_action', { detail: { action: 'camera_toggle' } }));
    });

    // Cockpit action controls (Blinkers, Wipers)
    bindBtn('btn-veh-signal-left', () => {
      window.dispatchEvent(new CustomEvent('roadbound_action', { detail: { action: 'veh_signal_left' } }));
    });
    bindBtn('btn-veh-signal-right', () => {
      window.dispatchEvent(new CustomEvent('roadbound_action', { detail: { action: 'veh_signal_right' } }));
    });
    bindBtn('btn-veh-hazard', () => {
      window.dispatchEvent(new CustomEvent('roadbound_action', { detail: { action: 'veh_hazard' } }));
    });
    bindBtn('btn-veh-wipers', () => {
      window.dispatchEvent(new CustomEvent('roadbound_action', { detail: { action: 'veh_wipers' } }));
    });
  }

  subscribeEvents() {
    this.gameState.subscribe((event, payload) => {
      if (event === 'player_damage' || event === 'player_healed') {
        this.updateVitals(payload.health, payload.armor);
        if (event === 'player_damage' && this.damageVignette) {
          this.damageVignette.classList.add('hit');
          setTimeout(() => this.damageVignette.classList.remove('hit'), 220);
        }
      } else if (event === 'weapon_fired') {
        this.updateWeaponDisplay(payload);
      } else if (event === 'time_mode_changed') {
        this.updateTimeBadge(payload.mode);
      }
    });
  }

  updateTimeBadge(mode) {
    const btn = document.getElementById('btn-hud-day-night');
    const icon = document.getElementById('time-pill-icon');
    const label = document.getElementById('time-pill-text');
    if (!btn || !icon || !label) return;

    btn.classList.remove('sunset', 'night');
    if (mode === 'day') {
      icon.textContent = '☀️';
      label.textContent = 'DAY MODE';
    } else if (mode === 'sunset') {
      btn.classList.add('sunset');
      icon.textContent = '🌅';
      label.textContent = 'SUNSET';
    } else if (mode === 'night') {
      btn.classList.add('night');
      icon.textContent = '🌙';
      label.textContent = 'NIGHT MODE';
    }
  }

  setVisible(visible) {
    if (this.hudRoot) {
      if (visible) this.hudRoot.classList.remove('hidden');
      else this.hudRoot.classList.add('hidden');
    }
  }

  updateVitals(hp, armor) {
    // Health (HP) bar & text (100 max)
    const hpClamped = Math.max(0, Math.min(100, hp));
    if (this.healthFill) this.healthFill.style.width = `${hpClamped}%`;
    if (this.healthNum) this.healthNum.textContent = `${Math.round(hpClamped)}/100`;

    // Energy / Armor bar & text (100 max)
    const armorClamped = Math.max(0, Math.min(100, armor));
    if (this.epFill) this.epFill.style.width = `${armorClamped}%`;
    if (this.epNum) this.epNum.textContent = `${Math.round(armorClamped)}/100`;
  }

  updateWeaponDisplay(weapon) {
    if (!weapon) return;
    if (this.ammoClip) this.ammoClip.textContent = weapon.currentClip;
    if (this.ammoReserve) this.ammoReserve.textContent = weapon.reserveAmmo;

    // Update active silhouette name if element exists
    const label = document.getElementById('hud-active-wep-name');
    if (label) label.textContent = weapon.name;
  }

  updateCrosshair(isAiming = false, isMoving = false, isFiring = false) {
    if (this.crosshair) {
      this.crosshair.classList.toggle('aiming', isAiming);
    }
    if (this.crosshairRing) {
      this.crosshairRing.classList.toggle('expanded', (isMoving || isFiring) && !isAiming);
    }
  }

  triggerHitMarker(isKill = false, isHeadshot = false) {
    if (!this.hitMarker) return;
    this.hitMarker.classList.remove('hidden');
    this.hitMarker.classList.toggle('kill', isKill || isHeadshot);

    if (this.hitKillSkull) {
      this.hitKillSkull.classList.toggle('hidden', !(isKill || isHeadshot));
    }

    if (this.hitMarkerTimer) clearTimeout(this.hitMarkerTimer);
    this.hitMarkerTimer = setTimeout(() => {
      this.hitMarker?.classList.add('hidden');
      this.hitKillSkull?.classList.add('hidden');
    }, 180);
  }

  setScopeOverlay(mode = 'none') {
    if (!this.scopeOverlayRoot) return;

    if (mode === 'none') {
      this.scopeOverlayRoot.classList.add('hidden');
      if (this.crosshair) this.crosshair.classList.remove('hidden');
    } else {
      this.scopeOverlayRoot.classList.remove('hidden');
      if (this.crosshair) this.crosshair.classList.add('hidden');

      if (this.scope8x) this.scope8x.classList.toggle('hidden', mode !== '8x');
      if (this.scope4x) this.scope4x.classList.toggle('hidden', mode !== '4x');
      if (this.scopeRedDot) this.scopeRedDot.classList.toggle('hidden', mode !== 'red_dot' && mode !== '2x');
    }
  }

  showHealingProgress(pct, label = 'HEALING...') {
    if (this.healingProgress) this.healingProgress.classList.remove('hidden');
    if (this.healingLabel) this.healingLabel.textContent = label;
    if (this.healingFillBar) this.healingFillBar.style.width = `${pct}%`;
  }

  updateHealingProgressPct(pct) {
    if (this.healingFillBar) this.healingFillBar.style.width = `${pct}%`;
  }

  hideHealingProgress() {
    if (this.healingProgress) this.healingProgress.classList.add('hidden');
  }

  showReloadProgress(weaponName = 'WEAPON') {
    if (this.reloadProgress) this.reloadProgress.classList.remove('hidden');
    if (this.reloadLabel) this.reloadLabel.textContent = `RELOADING ${weaponName.toUpperCase()}...`;
    if (this.reloadFillBar) this.reloadFillBar.style.width = '0%';
  }

  updateReloadProgress(pct) {
    if (this.reloadFillBar) this.reloadFillBar.style.width = `${pct}%`;
  }

  hideReloadProgress() {
    if (this.reloadProgress) this.reloadProgress.classList.add('hidden');
  }

  showNoAmmoWarning() {
    if (!this.noAmmoPill) return;
    this.noAmmoPill.classList.remove('hidden');
    if (this.noAmmoTimer) clearTimeout(this.noAmmoTimer);
    this.noAmmoTimer = setTimeout(() => {
      this.noAmmoPill?.classList.add('hidden');
    }, 1800);
  }

  addKillFeedEntry(killer, victim, weaponName = 'AK-47', isHeadshot = false) {
    if (!this.killFeed) return;
    const entry = document.createElement('div');
    entry.className = 'kill-feed-item';
    const headshotTag = isHeadshot ? ' <span style="color:#ff1744;">[HEADSHOT]</span>' : '';
    entry.innerHTML = `<span class="kill-killer">${killer}</span> <span class="kill-weapon">[${weaponName}]</span> <span class="kill-victim">${victim}</span>${headshotTag}`;

    this.killFeed.appendChild(entry);
    setTimeout(() => {
      if (entry.parentNode) entry.parentNode.removeChild(entry);
    }, 4500);
  }

  showDeathScreen(onRespawn, onRestart) {
    if (!this.deathScreen) return;
    this.deathScreen.classList.remove('hidden');

    if (this.btnRespawn) {
      this.btnRespawn.onclick = () => {
        this.hideDeathScreen();
        if (onRespawn) onRespawn();
      };
    }
    if (this.btnRestart) {
      this.btnRestart.onclick = () => {
        this.hideDeathScreen();
        if (onRestart) onRestart();
      };
    }
  }

  hideDeathScreen() {
    if (this.deathScreen) this.deathScreen.classList.add('hidden');
  }

  showCommsDialogue(speaker, text, durationSec = 6) {
    if (!this.commsBox) return;
    if (this.commsSpeaker) this.commsSpeaker.textContent = speaker;
    if (this.commsText) this.commsText.innerHTML = text;
    this.commsBox.classList.remove('hidden');
    this.commsTimer = durationSec;
  }

  showPrompt(key, text) {
    if (this.promptBox) {
      if (this.promptKey) this.promptKey.textContent = key;
      if (this.promptText) this.promptText.textContent = text;
      this.promptBox.classList.remove('hidden');
    }
  }

  hidePrompt() {
    if (this.promptBox) {
      this.promptBox.classList.add('hidden');
    }
  }

  updateMissionDistance(dist) {
    this.currentMissionDistance = dist;
    const distEl = document.getElementById('mission-distance-val');
    if (distEl) distEl.textContent = `${dist}m`;
  }

  updateVehicleCluster(inVehicle, speedMph, rpm, gear, health, fuel = 100, turnSignal = 'off', wipersActive = false) {
    if (inVehicle) {
      if (this.weaponCard) this.weaponCard.classList.add('hidden');
      if (this.vehicleCluster) this.vehicleCluster.classList.remove('hidden');
      if (this.crosshair) this.crosshair.classList.add('hidden');

      if (this.speedNum) this.speedNum.textContent = speedMph;
      if (this.gearNum) this.gearNum.textContent = gear;

      if (this.rpmCircle) {
        const rpmRatio = Math.max(0, Math.min(1, (rpm - 800) / (8500 - 800)));
        const offset = 330 - (rpmRatio * 250);
        this.rpmCircle.style.strokeDashoffset = offset;
      }
      if (this.rpmMeter) {
        const rpmRatio = (rpm - 800) / (8500 - 800);
        this.rpmMeter.style.width = `${Math.min(100, Math.max(5, rpmRatio * 100))}%`;
      }
      if (this.vehHp) {
        this.vehHp.style.width = `${Math.max(0, health)}%`;
      }

      // Fuel Bar & Digital Readout
      if (this.vehFuel) {
        const fClamped = Math.max(0, Math.min(100, fuel));
        this.vehFuel.style.width = `${fClamped}%`;
        if (fClamped < 15) this.vehFuel.classList.add('low-fuel');
        else this.vehFuel.classList.remove('low-fuel');
      }
      if (this.fuelPct) {
        this.fuelPct.textContent = `${Math.round(fuel)}%`;
      }

      // Cockpit Switches Active Highlights
      if (this.btnSigLeft) {
        this.btnSigLeft.classList.toggle('active-signal', turnSignal === 'left');
      }
      if (this.btnSigRight) {
        this.btnSigRight.classList.toggle('active-signal', turnSignal === 'right');
      }
      if (this.btnHazard) {
        this.btnHazard.classList.toggle('active-signal', turnSignal === 'hazard');
      }
      if (this.btnWipers) {
        this.btnWipers.classList.toggle('active-wiper', wipersActive);
      }
      // High-speed motion blur vignette effect
      const speedBlur = document.getElementById('hud-speed-blur');
      if (speedBlur) {
        const blurIntensity = Math.max(0, Math.min(0.85, (speedMph - 45) / 65));
        speedBlur.style.opacity = blurIntensity;
      }
    } else {
      if (this.weaponCard) this.weaponCard.classList.remove('hidden');
      if (this.vehicleCluster) this.vehicleCluster.classList.add('hidden');
      if (this.crosshair) this.crosshair.classList.remove('hidden');
      const speedBlur = document.getElementById('hud-speed-blur');
      if (speedBlur) speedBlur.style.opacity = '0';
    }
  }

  updateDistrict(name) {
    if (!name) return;
    if (this.districtName) {
      this.districtName.textContent = name;
    }
    if (this.currentDistrictName !== name) {
      this.currentDistrictName = name;
      const banner = document.getElementById('cinematic-location-banner');
      if (banner) {
        banner.classList.add('active');
        if (this.locationBannerTimer) clearTimeout(this.locationBannerTimer);
        this.locationBannerTimer = setTimeout(() => {
          banner.classList.remove('active');
        }, 3500);
      }
    }
  }

  updateMissionDistance(distanceMeters) {
    const distEl = document.getElementById('hud-mission-distance');
    if (distEl) {
      distEl.textContent = `${distanceMeters}m`;
    }
  }

  renderMinimap(playerPos, playerHeading, roadNetwork, missionTarget, customGpsWaypoint) {
    if (!this.minimapCtx || !roadNetwork) return;

    const ctx = this.minimapCtx;
    const w = this.minimapCanvas.width;
    const h = this.minimapCanvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const scale = 0.22;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#0a0e14';
    ctx.fillRect(0, 0, w, h);

    // Faint tactical circular grid background
    ctx.strokeStyle = 'rgba(79, 195, 247, 0.08)';
    ctx.lineWidth = 1;
    [25, 50, 75].forEach(r => {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    });

    // Faint tactical crosshairs
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.beginPath();
    ctx.moveTo(cx, 0); ctx.lineTo(cx, h);
    ctx.moveTo(0, cy); ctx.lineTo(w, cy);
    ctx.stroke();

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-playerHeading);

    // Draw safe zone tactical perimeter circle
    ctx.strokeStyle = 'rgba(79, 195, 247, 0.65)';
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc((550 - playerPos.x) * scale, (-60 - playerPos.z) * scale, 55, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw road network
    ctx.strokeStyle = '#283548';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';

    roadNetwork.edges.forEach(edge => {
      const n1 = roadNetwork.nodes[edge[0]];
      const n2 = roadNetwork.nodes[edge[1]];
      if (n1 && n2) {
        const x1 = (n1.pos.x - playerPos.x) * scale;
        const y1 = (n1.pos.z - playerPos.z) * scale;
        const x2 = (n2.pos.x - playerPos.x) * scale;
        const y2 = (n2.pos.z - playerPos.z) * scale;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
    });

    // Draw Mission Objective Marker
    if (missionTarget) {
      const mx = (missionTarget.x - playerPos.x) * scale;
      const my = (missionTarget.z - playerPos.z) * scale;
      ctx.fillStyle = '#4fc3f7';
      ctx.beginPath();
      ctx.arc(mx, my, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    ctx.restore();

    // Center Player Vision Cone & Tactical Arrow
    ctx.fillStyle = 'rgba(79, 195, 247, 0.16)';
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, 32, -Math.PI / 2 - 0.45, -Math.PI / 2 + 0.45);
    ctx.closePath();
    ctx.fill();

    // Sharp tactical arrow blip
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(cx, cy - 7);
    ctx.lineTo(cx - 4.5, cy + 4.5);
    ctx.lineTo(cx, cy + 2);
    ctx.lineTo(cx + 4.5, cy + 4.5);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#4fc3f7';
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }

  updateNeedsDisplay() {
    const player = this.gameState.player;
    if (!player || !player.needs) return;
    const needs = player.needs;

    // Stamina Fill & Text
    if (this.staminaFill) {
      const stmPct = Math.max(0, Math.min(100, (needs.stamina / (needs.maxStamina || 100)) * 100));
      this.staminaFill.style.width = `${stmPct}%`;
    }
    if (this.staminaNum) {
      this.staminaNum.textContent = `${Math.round(needs.stamina)}%`;
    }

    // Micro Needs Bar
    if (this.hungerVal) this.hungerVal.textContent = `${Math.round(needs.hunger)}%`;
    if (this.thirstVal) this.thirstVal.textContent = `${Math.round(needs.thirst)}%`;
    if (this.tempVal) this.tempVal.textContent = `${needs.temperature.toFixed(1)}°C`;
  }

  updateCameraBadge(mode) {
    if (this.camPillText) {
      this.camPillText.textContent = mode === 'first_person' ? '1ST PERSON [V]' : '3RD PERSON [V]';
    }
  }

  update(delta, cameraYaw = 0) {
    if (this.commsTimer > 0) {
      this.commsTimer -= delta;
      if (this.commsTimer <= 0 && this.commsBox) {
        this.commsBox.classList.add('hidden');
      }
    }

    this.updateNeedsDisplay();
    this.updateCompass(cameraYaw);
    this.updateSafeZone(delta);
  }
}
