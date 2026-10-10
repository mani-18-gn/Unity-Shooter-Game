// HORIZEN ISLANDS - Premium AAA Main Menu Controller
export class MainMenu {
  constructor(gameState, safehouseMenu, onStartGame, audio = null, saveSystem = null) {
    this.gameState = gameState;
    this.safehouseMenu = safehouseMenu;
    this.onStartGame = onStartGame;
    this.audio = audio;
    this.saveSystem = saveSystem;

    this.menuRoot = document.getElementById('main-menu');
    this.btnContinue = document.getElementById('btn-menu-continue');
    this.btnNewGame = document.getElementById('btn-menu-newgame');
    this.btnGarage = document.getElementById('btn-menu-garage');
    this.btnMap = document.getElementById('btn-menu-map');
    this.btnMissions = document.getElementById('btn-menu-missions');
    this.btnCharacter = document.getElementById('btn-menu-character');
    this.btnSettings = document.getElementById('btn-menu-settings');
    this.btnTopSettings = document.getElementById('btn-top-settings');
    this.btnExit = document.getElementById('btn-menu-exit');

    // Dialog Modal elements
    this.dialogOverlay = document.getElementById('horizen-dialog-overlay');
    this.dialogTitle = document.getElementById('horizen-dialog-title');
    this.dialogDesc = document.getElementById('horizen-dialog-desc');
    this.btnDialogCancel = document.getElementById('btn-dialog-cancel');
    this.btnDialogConfirm = document.getElementById('btn-dialog-confirm');
    this.activeDialogAction = null;

    // Navigation items array for keyboard/mouse navigation
    this.navButtons = [
      this.btnContinue,
      this.btnNewGame,
      this.btnGarage,
      this.btnMap,
      this.btnMissions,
      this.btnCharacter,
      this.btnSettings,
      this.btnExit
    ].filter(Boolean);

    this.selectedIndex = 0;

    this.initButtons();
    this.initDialog();
    this.initKeyboardNav();
    this.initCanvasFx();
  }

  playHoverSound() {
    if (this.audio) {
      if (typeof this.audio.playUIHover === 'function') {
        this.audio.playUIHover();
      } else if (this.audio.ctx && this.audio.initialized) {
        try {
          const now = this.audio.ctx.currentTime;
          const osc = this.audio.ctx.createOscillator();
          const gain = this.audio.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(1200, now);
          osc.frequency.exponentialRampToValueAtTime(800, now + 0.03);
          gain.gain.setValueAtTime(0.03, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
          osc.connect(gain);
          gain.connect(this.audio.masterGain || this.audio.ctx.destination);
          osc.start(now);
          osc.stop(now + 0.035);
        } catch (e) {
          // Silent fallback
        }
      }
    }
  }

  playClickSound() {
    if (this.audio) {
      if (typeof this.audio.playUIClick === 'function') {
        this.audio.playUIClick();
      }
    }
  }

  setSelectedIndex(index) {
    if (index < 0 || index >= this.navButtons.length) return;
    this.selectedIndex = index;
    this.navButtons.forEach((btn, i) => {
      if (i === index) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  initButtons() {
    // 1. CONTINUE
    if (this.btnContinue) {
      this.btnContinue.addEventListener('click', () => {
        this.playClickSound();
        this.triggerContinue();
      });
    }

    // 2. NEW GAME
    if (this.btnNewGame) {
      this.btnNewGame.addEventListener('click', () => {
        this.playClickSound();
        this.showDialog(
          'START NEW ADVENTURE?',
          'Starting a new game will begin Marcus Vance’s journey from the beginning on Blackshore Island. Any unsaved progress will be reset.',
          () => this.triggerNewGame()
        );
      });
    }

    // 3. GARAGE
    if (this.btnGarage) {
      this.btnGarage.addEventListener('click', () => {
        this.playClickSound();
        if (this.safehouseMenu) this.safehouseMenu.show('garage');
      });
    }

    // 4. MAP
    if (this.btnMap) {
      this.btnMap.addEventListener('click', () => {
        this.playClickSound();
        if (this.safehouseMenu) this.safehouseMenu.show('map');
      });
    }

    // 5. MISSIONS
    if (this.btnMissions) {
      this.btnMissions.addEventListener('click', () => {
        this.playClickSound();
        if (this.safehouseMenu) this.safehouseMenu.show('missions');
      });
    }

    // 6. CHARACTER
    if (this.btnCharacter) {
      this.btnCharacter.addEventListener('click', () => {
        this.playClickSound();
        if (this.safehouseMenu) this.safehouseMenu.show('wardrobe');
      });
    }

    // 7. SETTINGS
    if (this.btnSettings) {
      this.btnSettings.addEventListener('click', () => {
        this.playClickSound();
        if (this.safehouseMenu) this.safehouseMenu.show('settings');
      });
    }

    // Top Settings Button
    if (this.btnTopSettings) {
      this.btnTopSettings.addEventListener('click', () => {
        this.playClickSound();
        if (this.safehouseMenu) this.safehouseMenu.show('settings');
      });
    }

    // 8. EXIT GAME
    if (this.btnExit) {
      this.btnExit.addEventListener('click', () => {
        this.playClickSound();
        this.showDialog(
          'EXIT TO DESKTOP?',
          'Your profile and progression are safely preserved in offline local storage. Are you sure you want to exit Horizen Islands?',
          () => this.triggerExit()
        );
      });
    }

    // Mouse hover audio and selection synchronization
    this.navButtons.forEach((btn, idx) => {
      btn.addEventListener('mouseenter', () => {
        this.playHoverSound();
        this.setSelectedIndex(idx);
      });
    });
  }

  triggerContinue() {
    if (this.saveSystem) {
      this.saveSystem.loadGame(1);
    }
    this.hide();
    if (this.onStartGame) this.onStartGame(false);
  }

  triggerNewGame() {
    this.hide();
    if (this.onStartGame) this.onStartGame(true);
  }

  triggerExit() {
    if (this.audio && this.audio.ctx) {
      try { this.audio.ctx.suspend(); } catch (e) {}
    }
    // Render clean exit screen
    if (this.menuRoot) {
      this.menuRoot.innerHTML = `
        <div class="horizen-farewell-screen">
          <div class="horizen-farewell-card">
            <h1 class="farewell-title">HORIZEN ISLANDS</h1>
            <p class="farewell-sub">BLACKSHORE ISLAND &bull; OFFLINE EDITION</p>
            <div class="farewell-divider"></div>
            <p class="farewell-msg">Session saved safely to local storage. You may now close this window or refresh to launch again.</p>
            <button class="farewell-btn" onclick="window.location.reload()">LAUNCH MENU</button>
          </div>
        </div>
      `;
    }
  }

  // Confirmation Modal
  initDialog() {
    if (this.btnDialogCancel) {
      this.btnDialogCancel.addEventListener('click', () => {
        this.playClickSound();
        this.hideDialog();
      });
    }

    if (this.btnDialogConfirm) {
      this.btnDialogConfirm.addEventListener('click', () => {
        this.playClickSound();
        const action = this.activeDialogAction;
        this.hideDialog();
        if (action) action();
      });
    }

    if (this.dialogOverlay) {
      this.dialogOverlay.addEventListener('click', (e) => {
        if (e.target === this.dialogOverlay) {
          this.hideDialog();
        }
      });
    }
  }

  showDialog(title, description, onConfirm) {
    if (!this.dialogOverlay) return;
    if (this.dialogTitle) this.dialogTitle.textContent = title;
    if (this.dialogDesc) this.dialogDesc.textContent = description;
    this.activeDialogAction = onConfirm;
    this.dialogOverlay.classList.remove('hidden');
  }

  hideDialog() {
    if (!this.dialogOverlay) return;
    this.dialogOverlay.classList.add('hidden');
    this.activeDialogAction = null;
  }

  isDialogOpen() {
    return this.dialogOverlay && !this.dialogOverlay.classList.contains('hidden');
  }

  // Keyboard Navigation (Arrow Keys / W / S, Enter / Space, Escape)
  initKeyboardNav() {
    window.addEventListener('keydown', (e) => {
      if (!this.isVisible()) return;

      // If dialog is open, handle Enter/Escape for dialog
      if (this.isDialogOpen()) {
        if (e.key === 'Escape') {
          e.preventDefault();
          this.hideDialog();
        } else if (e.key === 'Enter') {
          e.preventDefault();
          if (this.activeDialogAction) {
            const act = this.activeDialogAction;
            this.hideDialog();
            act();
          }
        }
        return;
      }

      // If subscreen is open, let subscreen handle Escape
      if (this.safehouseMenu && this.safehouseMenu.isOpen()) {
        return;
      }

      if (e.key === 'ArrowDown' || e.key === 'KeyS' || e.key === 's') {
        e.preventDefault();
        const next = (this.selectedIndex + 1) % this.navButtons.length;
        this.playHoverSound();
        this.setSelectedIndex(next);
      } else if (e.key === 'ArrowUp' || e.key === 'KeyW' || e.key === 'w') {
        e.preventDefault();
        const prev = (this.selectedIndex - 1 + this.navButtons.length) % this.navButtons.length;
        this.playHoverSound();
        this.setSelectedIndex(prev);
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const activeBtn = this.navButtons[this.selectedIndex];
        if (activeBtn) {
          activeBtn.click();
        }
      } else if (e.key === 'Escape') {
        // Open Exit Dialog
        this.btnExit?.click();
      }
    });
  }

  // Canvas Cinematic Ambient FX (Drifting golden sunlight motes & atmosphere)
  initCanvasFx() {
    const canvas = document.getElementById('horizen-fx-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Ambient floating golden dust particles
    const particleCount = 45;
    const particles = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        radius: Math.random() * 1.8 + 0.6,
        alpha: Math.random() * 0.5 + 0.2,
        speedX: (Math.random() - 0.3) * 0.4,
        speedY: -Math.random() * 0.35 - 0.1,
        pulseSpeed: Math.random() * 0.02 + 0.01,
        pulseAngle: Math.random() * Math.PI * 2
      });
    }

    let lastTime = performance.now();
    const render = () => {
      if (!this.isVisible()) {
        requestAnimationFrame(render);
        return;
      }

      const now = performance.now();
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Subtle volumetric golden sunset shimmer on top-right (sun position)
      const sunGradient = ctx.createRadialGradient(
        canvas.width * 0.94, canvas.height * 0.18, 10,
        canvas.width * 0.94, canvas.height * 0.18, canvas.width * 0.45
      );
      const sunPulse = 0.12 + Math.sin(now * 0.001) * 0.03;
      sunGradient.addColorStop(0, `rgba(255, 200, 90, ${sunPulse})`);
      sunGradient.addColorStop(0.3, `rgba(255, 160, 40, ${sunPulse * 0.4})`);
      sunGradient.addColorStop(1, 'rgba(255, 140, 20, 0)');
      ctx.fillStyle = sunGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Supercar taillight soft ambient breath (centered in lower-mid-left)
      const carGlowX = canvas.width * 0.34;
      const carGlowY = canvas.height * 0.73;
      const tailGlow = ctx.createRadialGradient(
        carGlowX, carGlowY, 5,
        carGlowX, carGlowY, canvas.width * 0.14
      );
      const tailPulse = 0.08 + Math.sin(now * 0.002) * 0.025;
      tailGlow.addColorStop(0, `rgba(255, 30, 30, ${tailPulse})`);
      tailGlow.addColorStop(0.5, `rgba(255, 10, 10, ${tailPulse * 0.3})`);
      tailGlow.addColorStop(1, 'rgba(255, 0, 0, 0)');
      ctx.fillStyle = tailGlow;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Render floating golden motes
      particles.forEach(p => {
        p.x += p.speedX;
        p.y += p.speedY;
        p.pulseAngle += p.pulseSpeed;

        if (p.y < -10) {
          p.y = canvas.height + 10;
          p.x = Math.random() * canvas.width;
        }
        if (p.x < -10) p.x = canvas.width + 10;
        if (p.x > canvas.width + 10) p.x = -10;

        const currentAlpha = p.alpha * (0.6 + Math.sin(p.pulseAngle) * 0.4);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 205, 95, ${currentAlpha})`;
        ctx.fill();
      });

      requestAnimationFrame(render);
    };

    requestAnimationFrame(render);
  }

  show() {
    if (this.menuRoot) {
      this.menuRoot.classList.remove('hidden');
      this.setSelectedIndex(0);
    }
  }

  hide() {
    if (this.menuRoot) {
      this.menuRoot.classList.add('hidden');
    }
  }

  isVisible() {
    return this.menuRoot && !this.menuRoot.classList.contains('hidden');
  }
}
