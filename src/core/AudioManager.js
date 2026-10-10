// ROADBOUND - Procedural High-Fidelity Web Audio Synthesizer (100% Offline)
export class AudioManager {
  constructor(settingsManager) {
    this.settings = settingsManager;
    this.ctx = null;
    this.masterGain = null;
    this.engineGain = null;
    this.sfxGain = null;
    this.envGain = null;
    this.initialized = false;

    // Vehicle Engine Audio Nodes
    this.engineOsc1 = null; // Low rumble
    this.engineOsc2 = null; // Mid cylinder buzz
    this.engineOsc3 = null; // High intake harmonic
    this.engineNoise = null;
    this.engineFilter = null;
    this.turboOsc = null;

    // Tire Screech
    this.screechNoise = null;
    this.screechFilter = null;
    this.screechGain = null;

    // Siren
    this.sirenOsc = null;
    this.sirenGain = null;
    this.sirenTimer = 0;

    // Weather / Ambience
    this.rainSource = null;
    this.rainGain = null;
    this.rainFilter = null;

    // Radio
    this.radioPlaying = false;
    this.radioTimer = 0;
    this.radioStep = 0;
  }

  init() {
    if (this.initialized) return;

    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();

      // Master bus
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.settings.settings.audio.masterVolume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // Sub-busses
      this.engineGain = this.ctx.createGain();
      this.engineGain.gain.setValueAtTime(this.settings.settings.audio.engineVolume, this.ctx.currentTime);
      this.engineGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.settings.settings.audio.sfxVolume, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      this.envGain = this.ctx.createGain();
      this.envGain.gain.setValueAtTime(this.settings.settings.audio.environmentVolume, this.ctx.currentTime);
      this.envGain.connect(this.masterGain);

      this.initEngineSynthesizer();
      this.initTireScreech();
      this.initPoliceSiren();
      this.initEnvironmentAmbience();

      this.initialized = true;
    } catch (e) {
      console.warn('[ROADBOUND Audio] Web Audio init deferred until user interaction', e);
    }
  }

  ensureContext() {
    if (!this.initialized) this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  createNoiseBuffer(seconds = 3) {
    const bufferSize = this.ctx.sampleRate * seconds;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      // Pink noise approximation
      data[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = data[i];
    }
    return buffer;
  }

  initEngineSynthesizer() {
    // 3 harmonic oscillators simulating multi-cylinder firing
    this.engineOsc1 = this.ctx.createOscillator();
    this.engineOsc1.type = 'sawtooth';
    this.engineOsc1.frequency.setValueAtTime(35, this.ctx.currentTime);

    this.engineOsc2 = this.ctx.createOscillator();
    this.engineOsc2.type = 'triangle';
    this.engineOsc2.frequency.setValueAtTime(70, this.ctx.currentTime);

    this.engineOsc3 = this.ctx.createOscillator();
    this.engineOsc3.type = 'sawtooth';
    this.engineOsc3.frequency.setValueAtTime(105, this.ctx.currentTime);

    this.engineFilter = this.ctx.createBiquadFilter();
    this.engineFilter.type = 'lowpass';
    this.engineFilter.frequency.setValueAtTime(280, this.ctx.currentTime);
    this.engineFilter.Q.setValueAtTime(3.0, this.ctx.currentTime);

    const engMix = this.ctx.createGain();
    engMix.gain.setValueAtTime(0.0, this.ctx.currentTime); // Initially muted until car is active

    this.engineOsc1.connect(this.engineFilter);
    this.engineOsc2.connect(this.engineFilter);
    this.engineOsc3.connect(this.engineFilter);
    this.engineFilter.connect(engMix);
    engMix.connect(this.engineGain);

    this.engineMixGain = engMix;

    this.engineOsc1.start();
    this.engineOsc2.start();
    this.engineOsc3.start();
  }

  initTireScreech() {
    const noiseBuffer = this.createNoiseBuffer(2);
    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    this.screechFilter = this.ctx.createBiquadFilter();
    this.screechFilter.type = 'bandpass';
    this.screechFilter.frequency.setValueAtTime(1200, this.ctx.currentTime);
    this.screechFilter.Q.setValueAtTime(6.0, this.ctx.currentTime);

    this.screechGain = this.ctx.createGain();
    this.screechGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

    noiseSource.connect(this.screechFilter);
    this.screechFilter.connect(this.screechGain);
    this.screechGain.connect(this.sfxGain);

    noiseSource.start();
  }

  initPoliceSiren() {
    this.sirenOsc = this.ctx.createOscillator();
    this.sirenOsc.type = 'sine';
    this.sirenOsc.frequency.setValueAtTime(650, this.ctx.currentTime);

    this.sirenGain = this.ctx.createGain();
    this.sirenGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

    this.sirenOsc.connect(this.sirenGain);
    this.sirenGain.connect(this.sfxGain);

    this.sirenOsc.start();
  }

  initEnvironmentAmbience() {
    const rainBuf = this.createNoiseBuffer(4);
    const rainSrc = this.ctx.createBufferSource();
    rainSrc.buffer = rainBuf;
    rainSrc.loop = true;

    this.rainFilter = this.ctx.createBiquadFilter();
    this.rainFilter.type = 'lowpass';
    this.rainFilter.frequency.setValueAtTime(800, this.ctx.currentTime);

    this.rainGain = this.ctx.createGain();
    this.rainGain.gain.setValueAtTime(0.08, this.ctx.currentTime);

    rainSrc.connect(this.rainFilter);
    this.rainFilter.connect(this.rainGain);
    this.rainGain.connect(this.envGain);

    rainSrc.start();
  }

  updateVehicleEngine(inCar, rpmRatio, throttle, speedMph) {
    if (!this.initialized || !this.ctx) return;
    const now = this.ctx.currentTime;

    if (!inCar) {
      this.engineMixGain.gain.setTargetAtTime(0.0, now, 0.1);
      return;
    }

    // Base pitch modulation: 40 Hz idle to 240 Hz top revs
    const baseFreq = 38 + rpmRatio * 180;
    this.engineOsc1.frequency.setTargetAtTime(baseFreq, now, 0.05);
    this.engineOsc2.frequency.setTargetAtTime(baseFreq * 2.02, now, 0.05);
    this.engineOsc3.frequency.setTargetAtTime(baseFreq * 3.01, now, 0.05);

    // Filter opening on throttle load
    const cutoff = 240 + throttle * 900 + rpmRatio * 800;
    this.engineFilter.frequency.setTargetAtTime(cutoff, now, 0.08);

    // Volume level
    const targetVol = 0.22 + throttle * 0.18 + (speedMph / 120) * 0.12;
    this.engineMixGain.gain.setTargetAtTime(Math.min(targetVol, 0.5), now, 0.08);
  }

  updateTireSlip(slipAmount) {
    if (!this.initialized || !this.screechGain) return;
    const now = this.ctx.currentTime;
    const absSlip = Math.abs(slipAmount);
    const targetGain = Math.max(0, Math.min(0.35, (absSlip - 0.14) * 0.65));
    this.screechGain.gain.setTargetAtTime(targetGain, now, 0.03);
    if (this.screechFilter && absSlip > 0.14) {
      const freq = 1100 + Math.min(1400, absSlip * 1800);
      this.screechFilter.frequency.setTargetAtTime(freq, now, 0.05);
    }
  }

  playExhaustBackfire() {
    if (!this.initialized || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(35, now + 0.08);
      gain.gain.setValueAtTime(0.45, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.10);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.11);
    } catch (e) {}
  }

  updatePoliceSiren(wantedLevel, nearestPoliceDist = 100) {
    if (!this.initialized || !this.sirenGain) return;
    const now = this.ctx.currentTime;

    if (wantedLevel <= 0 || nearestPoliceDist > 300) {
      this.sirenGain.gain.setTargetAtTime(0.0, now, 0.2);
      return;
    }

    // Wail siren frequency modulation
    this.sirenTimer += 0.05;
    const freq = 600 + Math.sin(this.sirenTimer * 4.0) * 350;
    this.sirenOsc.frequency.setValueAtTime(freq, now);

    // Distance attenuation
    const distFactor = Math.max(0, 1 - nearestPoliceDist / 300);
    this.sirenGain.gain.setTargetAtTime(distFactor * 0.18, now, 0.1);
  }

  playGunshot(weaponType = 'ak47') {
    if (!this.initialized || !this.ctx) return;
    try {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      const now = this.ctx.currentTime;
      const typeStr = String(weaponType).toLowerCase();

      // Knife melee slash whoosh
      if (typeStr.includes('knife')) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(450, now);
        osc.frequency.exponentialRampToValueAtTime(120, now + 0.12);
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.15);
        return;
      }

      // Weapon Acoustic Tuning
      let startFreq = 820;
      let endFreq = 75;
      let attackGain = 0.55;
      let subFreq = 140;
      let subDuration = 0.22;

      if (typeStr.includes('awm') || typeStr.includes('sniper')) {
        startFreq = 1200;
        endFreq = 30;
        attackGain = 0.85;
        subFreq = 80;
        subDuration = 0.55;
      } else if (typeStr.includes('shotgun')) {
        startFreq = 950;
        endFreq = 45;
        attackGain = 0.8;
        subFreq = 110;
        subDuration = 0.35;
      } else if (typeStr.includes('ak47') || typeStr.includes('7.62')) {
        startFreq = 750;
        endFreq = 65;
        attackGain = 0.65;
        subFreq = 130;
        subDuration = 0.28;
      } else if (typeStr.includes('scar') || typeStr.includes('m249') || typeStr.includes('5.56')) {
        startFreq = 920;
        endFreq = 95;
        attackGain = 0.55;
        subFreq = 150;
        subDuration = 0.22;
      } else if (typeStr.includes('ump') || typeStr.includes('mp40') || typeStr.includes('pistol')) {
        startFreq = 850;
        endFreq = 110;
        attackGain = 0.45;
        subFreq = 160;
        subDuration = 0.18;
      }

      // 1. Transient attack crack
      const crackOsc = this.ctx.createOscillator();
      const crackGain = this.ctx.createGain();
      crackOsc.type = 'sawtooth';
      crackOsc.frequency.setValueAtTime(startFreq, now);
      crackOsc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.09);
      crackGain.gain.setValueAtTime(attackGain, now);
      crackGain.gain.exponentialRampToValueAtTime(0.01, now + 0.14);

      crackOsc.connect(crackGain);
      crackGain.connect(this.sfxGain);
      crackOsc.start(now);
      crackOsc.stop(now + 0.15);

      // 2. Sub-bass boom & mechanical chamber resonance
      const subOsc = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      subOsc.type = 'triangle';
      subOsc.frequency.setValueAtTime(subFreq, now);
      subOsc.frequency.exponentialRampToValueAtTime(25, now + subDuration);
      subGain.gain.setValueAtTime(attackGain * 0.9, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + subDuration + 0.05);

      subOsc.connect(subGain);
      subGain.connect(this.sfxGain);
      subOsc.start(now);
      subOsc.stop(now + subDuration + 0.06);
    } catch (e) {
      // Audio safely silenced on error
    }
  }

  playImpactSound(intensity = 0.5) {
    if (!this.initialized || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(90, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.2);

      const targetGain = Math.max(0.01, Math.min(0.5, intensity * 0.4));
      gain.gain.setValueAtTime(targetGain, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.28);
    } catch (e) {
      // Audio safely silenced on error
    }
  }

  playUIClick() {
    if (!this.initialized || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(900, now);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.05);
  }

  playHornSound(isTukTuk = false) {
    if (!this.initialized || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sawtooth';
    osc2.type = 'sawtooth';

    const baseFreq = isTukTuk ? 460 : 340;
    osc1.frequency.setValueAtTime(baseFreq, now);
    osc2.frequency.setValueAtTime(baseFreq * 1.22, now);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.sfxGain);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.38);
    osc2.stop(now + 0.38);
  }

  playGPSChime() {
    if (!this.initialized || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, now); // D5
    osc.frequency.setValueAtTime(880, now + 0.08); // A5
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.32);
  }

  updateWeatherAudio(weather, rainIntensity) {
    if (!this.initialized || !this.rainGain) return;
    const targetVol = (weather === 'rain' || weather === 'storm') ? rainIntensity * 0.25 : 0.04;
    this.rainGain.gain.setTargetAtTime(targetVol, this.ctx.currentTime, 0.5);
  }

  // Household & Residential Interactive Audio
  playDoorSound(isOpen = true) {
    if (!this.initialized || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = isOpen ? 'sine' : 'triangle';
    osc.frequency.setValueAtTime(isOpen ? 120 : 80, now);
    osc.frequency.exponentialRampToValueAtTime(isOpen ? 60 : 35, now + 0.18);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.24);
  }

  playLightSwitch() {
    if (!this.initialized || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'highpass' || 'square';
    osc.frequency.setValueAtTime(1400, now);
    osc.frequency.exponentialRampToValueAtTime(700, now + 0.03);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.05);
  }

  playWaterFaucet(active = true) {
    if (!this.initialized || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(540, now + 0.15);
    gain.gain.setValueAtTime(active ? 0.1 : 0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.42);
  }

  playEatingSound() {
    if (!this.initialized || !this.ctx) return;
    const now = this.ctx.currentTime;
    // Crisp double crunch
    [0, 0.08, 0.16].forEach((offset, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(450 - idx * 60, now + offset);
      gain.gain.setValueAtTime(0.1, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.06);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now + offset);
      osc.stop(now + offset + 0.07);
    });
  }

  playSleepChime() {
    if (!this.initialized || !this.ctx) return;
    const now = this.ctx.currentTime;
    [261.63, 329.63, 392.00, 523.25].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.12);
      gain.gain.setValueAtTime(0.15, now + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.6);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now + idx * 0.12);
      osc.stop(now + idx * 0.12 + 0.65);
    });
  }

  playTVChannelSwitch() {
    if (!this.initialized || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(440, now + 0.08);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.12);
  }

  // Hydroelectric Dam & Cascading Water Spatial Audio
  initDamAudio() {
    if (!this.initialized || !this.ctx || this.damGain) return;
    const noiseBuffer = this.createNoiseBuffer(3);
    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    this.damFilter = this.ctx.createBiquadFilter();
    this.damFilter.type = 'lowpass';
    this.damFilter.frequency.setValueAtTime(360, this.ctx.currentTime);
    this.damFilter.Q.setValueAtTime(2.5, this.ctx.currentTime);

    this.damGain = this.ctx.createGain();
    this.damGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

    noiseSource.connect(this.damFilter);
    this.damFilter.connect(this.damGain);
    this.damGain.connect(this.ambientGain || this.masterGain);

    noiseSource.start();
  }

  updateDamAudio(distToDam) {
    if (!this.initialized || !this.ctx) return;
    if (!this.damGain) this.initDamAudio();
    if (!this.damGain) return;

    // Audible within 160 meters of the canyon dam
    const maxDist = 160.0;
    const vol = Math.max(0, Math.min(0.28, (1.0 - distToDam / maxDist) * 0.28));
    this.damGain.gain.setTargetAtTime(vol, this.ctx.currentTime, 0.2);
  }
}


