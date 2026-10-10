// ROADBOUND - In-Game Handheld Smartphone OS (Apex Titan Pro), Apps & Camera System
export class SmartphoneUI {
  constructor(gameState, careerSystem, audioManager, hud) {
    this.gameState = gameState;
    this.career = careerSystem;
    this.audio = audioManager;
    this.hud = hud;

    this.isOpen = false;
    this.currentView = 'home';

    // Elements
    this.phoneEl = document.getElementById('in-game-smartphone');
    this.hudPhoneBtn = document.getElementById('btn-hud-phone');
    this.homeBarBtn = document.getElementById('phone-btn-home-bar');
    this.statusTimeEl = document.getElementById('phone-status-time');
    this.ownerNameEl = document.getElementById('phone-owner-name');
    this.quickCashEl = document.getElementById('phone-quick-cash');
    this.bankTotalCashEl = document.getElementById('phone-bank-total-cash');
    this.jobWidgetBody = document.getElementById('phone-widget-job-text');

    // Views
    this.views = {
      home: document.getElementById('phone-view-home'),
      maps: document.getElementById('phone-view-maps'),
      bank: document.getElementById('phone-view-bank'),
      jobs: document.getElementById('phone-view-jobs'),
      camera: document.getElementById('phone-view-camera'),
      radio: document.getElementById('phone-view-radio')
    };

    this.initEventListeners();
  }

  initEventListeners() {
    // 1. Toggle Phone on HUD Button or Keyboard [P]
    if (this.hudPhoneBtn) {
      this.hudPhoneBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggle();
      });
    }

    window.addEventListener('keydown', (e) => {
      if (e.code === 'KeyP') {
        this.toggle();
      }
    });

    // 2. Home Swipe Bar
    if (this.homeBarBtn) {
      this.homeBarBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.navigateTo('home');
      });
    }

    // 3. App Launch Buttons
    const appMap = [
      { id: 'app-btn-maps', view: 'maps' },
      { id: 'app-btn-bank', view: 'bank' },
      { id: 'app-btn-jobs', view: 'jobs' },
      { id: 'app-btn-camera', view: 'camera' },
      { id: 'app-btn-radio', view: 'radio' },
      { id: 'app-btn-comms', action: () => this.callElena() }
    ];

    appMap.forEach(item => {
      const btn = document.getElementById(item.id);
      if (btn) {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (this.audio) this.audio.playUIClick();
          if (item.view) this.navigateTo(item.view);
          else if (item.action) item.action();
        });
      }
    });

    // 4. Back Buttons
    ['maps', 'bank', 'jobs', 'camera', 'radio'].forEach(v => {
      const bBtn = document.getElementById(`btn-back-${v}`);
      if (bBtn) {
        bBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (this.audio) this.audio.playUIClick();
          this.navigateTo('home');
        });
      }
    });

    // 5. Maps POI and Clear GPS
    const btnClearGps = document.getElementById('btn-clear-gps');
    if (btnClearGps) {
      btnClearGps.addEventListener('click', () => {
        this.gameState.gpsWaypoint = null;
        if (this.audio) this.audio.playUIClick();
        if (this.hud) this.hud.showCommsDialogue('GPS NAVIGATION', 'Waypoint cleared from route.', 2.0);
      });
    }

    // 6. Career On-Duty Toggles
    const btnTaxiDuty = document.getElementById('btn-toggle-taxi-duty');
    if (btnTaxiDuty) {
      btnTaxiDuty.addEventListener('click', () => {
        const on = this.career.toggleTaxiDuty(!this.gameState.player.career.taxiOnDuty);
        btnTaxiDuty.textContent = on ? 'OFF-DUTY' : 'GO ON-DUTY';
        btnTaxiDuty.classList.toggle('active', on);
        this.renderJobsView();
      });
    }

    const btnCourierDuty = document.getElementById('btn-toggle-courier-duty');
    if (btnCourierDuty) {
      btnCourierDuty.addEventListener('click', () => {
        const on = this.career.toggleCourierDuty(!this.gameState.player.career.courierOnDuty);
        btnCourierDuty.textContent = on ? 'OFF-DUTY' : 'GO ON-DUTY';
        btnCourierDuty.classList.toggle('active', on);
        this.renderJobsView();
      });
    }

    // 7. Camera Shutter Button
    const shutterBtn = document.getElementById('btn-phone-shutter');
    if (shutterBtn) {
      shutterBtn.addEventListener('click', () => {
        if (this.audio) this.audio.playImpactSound(0.25); // Camera shutter mechanical snap
        // Flash white screen effect
        const flash = document.createElement('div');
        flash.style.position = 'fixed';
        flash.style.top = '0';
        flash.style.left = '0';
        flash.style.width = '100vw';
        flash.style.height = '100vh';
        flash.style.background = '#ffffff';
        flash.style.opacity = '0.85';
        flash.style.pointerEvents = 'none';
        flash.style.zIndex = '9999';
        flash.style.transition = 'opacity 0.4s ease-out';
        document.body.appendChild(flash);
        setTimeout(() => {
          flash.style.opacity = '0';
          setTimeout(() => flash.remove(), 400);
        }, 50);

        if (this.hud) {
          this.hud.showCommsDialogue('PRO CAMERA', 'Snapshot captured and saved to Gallery.', 2.5);
        }
      });
    }
  }

  toggle() {
    this.isOpen = !this.isOpen;
    if (this.phoneEl) {
      this.phoneEl.classList.toggle('hidden', !this.isOpen);
      if (this.isOpen) {
        if (this.audio) this.audio.playUIClick();
        this.updateData();
        this.navigateTo('home');
      }
    }
  }

  navigateTo(viewName) {
    this.currentView = viewName;
    Object.keys(this.views).forEach(vKey => {
      const el = this.views[vKey];
      if (el) el.classList.toggle('active', vKey === viewName);
    });

    if (viewName === 'maps') this.renderMapsView();
    if (viewName === 'jobs') this.renderJobsView();
  }

  update(delta) {
    if (!this.isOpen) return;

    // Time of day update
    if (this.statusTimeEl) {
      const h = Math.floor(this.gameState.world?.timeOfDay || 14);
      const m = Math.floor(((this.gameState.world?.timeOfDay || 14) % 1) * 60);
      this.statusTimeEl.textContent = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    }

    // Cash updates
    const formattedCash = `$${(this.gameState.player.cash || 0).toLocaleString()}`;
    if (this.quickCashEl) this.quickCashEl.textContent = formattedCash;
    if (this.bankTotalCashEl) this.bankTotalCashEl.textContent = formattedCash;

    // Active Job Widget text
    if (this.jobWidgetBody) {
      const activeJob = this.gameState.player.career?.activeJob;
      if (activeJob) {
        if (activeJob.type === 'taxi') {
          const target = activeJob.stage === 'pickup' ? `Pickup ${activeJob.passengerName} at ${activeJob.pickupName}` : `Drive to ${activeJob.dropoffName} ($${activeJob.fare})`;
          this.jobWidgetBody.innerHTML = `🚖 <strong>TAXI:</strong> ${target}`;
        } else {
          const timer = Math.max(0, Math.round(activeJob.timeRemaining || 0));
          this.jobWidgetBody.innerHTML = `📦 <strong>FREIGHT:</strong> Deliver to ${activeJob.dropoffName} (${timer}s left) &bull; $${activeJob.fare}`;
        }
      } else {
        const taxiOn = this.gameState.player.career?.taxiOnDuty;
        const courierOn = this.gameState.player.career?.courierOnDuty;
        if (taxiOn || courierOn) {
          this.jobWidgetBody.innerHTML = `<span style="color:#00e5ff">ON-DUTY:</span> Waiting for incoming dispatches...`;
        } else {
          this.jobWidgetBody.innerHTML = `No active shift. Open GigWork to start taxi or courier contracts.`;
        }
      }
    }
  }

  updateData() {
    if (this.ownerNameEl) {
      this.ownerNameEl.textContent = (this.gameState.player.name || 'MARCUS VANCE').toUpperCase();
    }
  }

  renderMapsView() {
    const container = document.getElementById('phone-poi-container');
    if (!container || !this.career.poiLocations) return;

    container.innerHTML = '';
    this.career.poiLocations.forEach(poi => {
      const item = document.createElement('div');
      item.className = 'poi-card-item';
      item.innerHTML = `
        <div class="poi-info">
          <strong>${poi.name}</strong>
          <small>District Landmark</small>
        </div>
        <button class="btn-set-poi">ROUTE</button>
      `;

      item.querySelector('.btn-set-poi').addEventListener('click', (e) => {
        e.stopPropagation();
        this.gameState.gpsWaypoint = poi.pos;
        if (this.audio) this.audio.playGPSChime();
        if (this.hud) {
          this.hud.showCommsDialogue('APEX GPS', `ROUTE SET TO: ${poi.name.toUpperCase()}. Spoken voice navigation active.`, 3.5);
        }
      });

      container.appendChild(item);
    });
  }

  renderJobsView() {
    const container = document.getElementById('phone-jobs-list');
    if (!container) return;

    container.innerHTML = '';
    const activeJob = this.gameState.player.career?.activeJob;

    if (activeJob) {
      const activeCard = document.createElement('div');
      activeCard.className = 'job-card-item active-contract';
      activeCard.innerHTML = `
        <div class="job-meta">
          <span class="job-type-tag ${activeJob.type}">${activeJob.type.toUpperCase()} IN PROGRESS</span>
          <h4>${activeJob.title}</h4>
          <p>Destination: <strong>${activeJob.dropoffName}</strong></p>
          <div class="job-fare-row">
            <span>GUARANTEED FARE:</span>
            <strong class="fare-num">$${activeJob.fare}</strong>
          </div>
        </div>
        <button class="btn-cancel-job" id="btn-cancel-current-job">CANCEL CONTRACT</button>
      `;

      activeCard.querySelector('#btn-cancel-current-job').addEventListener('click', () => {
        this.career.cancelActiveJob();
        this.renderJobsView();
      });

      container.appendChild(activeCard);
      return;
    }

    if (!this.career.availableJobs || this.career.availableJobs.length === 0) {
      container.innerHTML = `<div class="empty-jobs">No dispatch offers available. Toggle On-Duty shifts above.</div>`;
      return;
    }

    this.career.availableJobs.forEach(job => {
      const card = document.createElement('div');
      card.className = 'job-card-item';
      const isTaxi = job.type === 'taxi';
      card.innerHTML = `
        <div class="job-meta">
          <span class="job-type-tag ${job.type}">${isTaxi ? '🚖 TAXI PASSENGER' : '📦 EXPRESS FREIGHT'}</span>
          <h4>${job.title}</h4>
          <p>Pickup: ${job.pickupName} &bull; Drop: ${job.dropoffName}</p>
          <div class="job-fare-row">
            <span>ESTIMATED PAYOUT:</span>
            <strong class="fare-num">$${job.fare}</strong>
          </div>
        </div>
        <button class="btn-accept-job">ACCEPT</button>
      `;

      card.querySelector('.btn-accept-job').addEventListener('click', () => {
        this.career.acceptJob(job.id);
        this.renderJobsView();
      });

      container.appendChild(card);
    });
  }

  callElena() {
    if (this.audio) this.audio.playGPSChime();
    const greetings = [
      "Hey! Checking your transponder right now. Roads around the city are looking clear.",
      "If you need cash, turn on the Taxi Shift or pick up freight delivery contracts from GigWork.",
      "Don't forget to stop by the petrol station if your fuel tank drops below a quarter."
    ];
    const quote = greetings[Math.floor(Math.random() * greetings.length)];
    if (this.hud) {
      this.hud.showCommsDialogue('ELENA CROSS (PHONE CALL)', `"${quote}"`, 5.0);
    }
  }
}
