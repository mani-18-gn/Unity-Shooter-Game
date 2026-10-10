// ROADBOUND - Intelligent GPS Navigation, Road Graph Routing & Spoken Voice Guidance
import * as THREE from 'three';

export class GPSNavigation {
  constructor(roadNetwork, audioManager, gameState, hud) {
    this.roadNetwork = roadNetwork;
    this.audio = audioManager;
    this.gameState = gameState;
    this.hud = hud;

    this.currentRoute = [];
    this.currentInstruction = null;
    this.lastSpokenKey = null;
    this.lastSpokenTime = 0;
    this.voiceMuted = false;
    this.speechSynth = typeof window !== 'undefined' && window.speechSynthesis ? window.speechSynthesis : null;

    this.bannerEl = document.getElementById('hud-gps-banner');
    this.bannerIcon = document.getElementById('gps-turn-icon');
    this.bannerDist = document.getElementById('gps-turn-dist');
    this.bannerText = document.getElementById('gps-turn-text');
    this.btnMute = document.getElementById('btn-gps-mute');

    this.initMuteButton();
  }

  initMuteButton() {
    if (this.btnMute) {
      this.btnMute.addEventListener('click', (e) => {
        e.stopPropagation();
        this.voiceMuted = !this.voiceMuted;
        this.btnMute.textContent = this.voiceMuted ? '🔇' : '🔊';
        if (this.audio) this.audio.playUIClick();
      });
    }
  }

  update(delta, playerPos, playerHeading) {
    // 1. Identify destination (Custom waypoint or active mission objective)
    const targetPos = this.gameState.gpsWaypoint || this.gameState.activeMission?.targetLocation;
    if (!targetPos || !playerPos) {
      this.hideBanner();
      this.currentRoute = [];
      return;
    }

    const distToTarget = Math.hypot(targetPos.x - playerPos.x, targetPos.z - playerPos.z);

    // 2. Destination reached check
    if (distToTarget < 22.0) {
      this.showInstruction('arrived', 'ARRIVED', 'You have arrived at your destination.', 0);
      this.speakVoice('You have reached your destination.', 'arrived');
      return;
    }

    // 3. Compute road graph path if not cached or drifted
    if (this.currentRoute.length === 0 || Math.random() < 0.05) {
      this.currentRoute = this.roadNetwork.findShortestPath(playerPos, targetPos);
    }

    // Prune visited waypoints
    while (this.currentRoute.length > 1) {
      const d = playerPos.distanceTo(this.currentRoute[0]);
      if (d < 12.0) {
        this.currentRoute.shift();
      } else {
        break;
      }
    }

    if (this.currentRoute.length < 2) {
      this.showInstruction('straight', `${Math.round(distToTarget)}m`, 'Continue towards destination', distToTarget);
      return;
    }

    // 4. Calculate upcoming turn angles
    const wpCurrent = this.currentRoute[0];
    const wpNext = this.currentRoute[1];

    const distToWp = playerPos.distanceTo(wpCurrent);
    const toWpVec = new THREE.Vector2(wpCurrent.x - playerPos.x, wpCurrent.z - playerPos.z).normalize();
    const nextVec = new THREE.Vector2(wpNext.x - wpCurrent.x, wpNext.z - wpCurrent.z).normalize();

    // Cross product in 2D gives signed angle direction (positive = right turn, negative = left turn)
    const cross = toWpVec.x * nextVec.y - toWpVec.y * nextVec.x;
    const dot = toWpVec.dot(nextVec);
    const turnAngleDeg = (Math.atan2(cross, dot) * 180) / Math.PI;

    let turnType = 'straight';
    let turnPrompt = 'Continue straight';
    let spokenPrompt = '';

    const roundedDist = Math.round(distToWp);

    if (turnAngleDeg > 28) {
      turnType = 'right';
      turnPrompt = `In ${roundedDist}m, turn right`;
      spokenPrompt = `In ${roundedDist} meters, turn right.`;
    } else if (turnAngleDeg < -28) {
      turnType = 'left';
      turnPrompt = `In ${roundedDist}m, turn left`;
      spokenPrompt = `In ${roundedDist} meters, turn left.`;
    } else {
      turnType = 'straight';
      turnPrompt = `Continue straight for ${roundedDist}m`;
      spokenPrompt = `Continue straight for ${roundedDist} meters.`;
    }

    this.showInstruction(turnType, `${roundedDist}m`, turnPrompt, distToWp);

    // 5. Trigger spoken voice guidance at strategic approach distances (between 45m and 110m)
    if (distToWp < 110 && distToWp > 45 && spokenPrompt && turnType !== 'straight') {
      const speechKey = `${turnType}_${Math.floor(wpCurrent.x)}_${Math.floor(wpCurrent.z)}`;
      this.speakVoice(spokenPrompt, speechKey);
    }
  }

  showInstruction(type, distStr, text, meters) {
    if (!this.bannerEl) return;
    this.bannerEl.classList.remove('hidden');

    if (this.bannerIcon) {
      if (type === 'right') this.bannerIcon.innerHTML = '&#8625;'; // ↱
      else if (type === 'left') this.bannerIcon.innerHTML = '&#8624;'; // ↰
      else if (type === 'arrived') this.bannerIcon.innerHTML = '&#127937;'; // 🏁
      else this.bannerIcon.innerHTML = '&#8593;'; // ↑
    }

    if (this.bannerDist) this.bannerDist.textContent = distStr;
    if (this.bannerText) this.bannerText.textContent = text.toUpperCase();

    // Also update mini mission distance readout
    if (this.hud && typeof this.hud.updateMissionDistance === 'function') {
      this.hud.updateMissionDistance(Math.round(meters));
    }
  }

  hideBanner() {
    if (this.bannerEl) {
      this.bannerEl.classList.add('hidden');
    }
  }

  speakVoice(text, key) {
    if (this.voiceMuted || !this.speechSynth) return;

    const now = Date.now();
    if (this.lastSpokenKey === key && now - this.lastSpokenTime < 15000) {
      return; // Prevent repetitive spam
    }

    this.lastSpokenKey = key;
    this.lastSpokenTime = now;

    try {
      // Play brief GPS chime tone before voice
      if (this.audio) {
        this.audio.playGPSChime();
      }

      this.speechSynth.cancel(); // Stop any pending speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      utterance.volume = 0.95;
      utterance.lang = 'en-US';

      // Pick high quality natural voice if available
      const voices = this.speechSynth.getVoices();
      const naturalVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha')));
      if (naturalVoice) utterance.voice = naturalVoice;

      this.speechSynth.speak(utterance);
    } catch (e) {
      // Speech synthesis fallback ignored
    }
  }
}
