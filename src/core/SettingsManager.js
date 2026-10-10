// ROADBOUND - Graphics, Audio, and Control Settings Manager
export class SettingsManager {
  constructor() {
    const pr = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1;
    this.settings = {
      graphics: {
        preset: 'high', // 'low', 'medium', 'high', 'ultra'
        shadows: true,
        shadowMapSize: 2048,
        postProcessing: true,
        weatherEffects: true,
        viewDistance: 'far', // 'short' (150m), 'medium' (300m), 'far' (600m)
        pixelRatio: Math.min(pr, 1.5)
      },
      audio: {
        masterVolume: 0.8,
        engineVolume: 0.9,
        environmentVolume: 0.7,
        sfxVolume: 0.85
      },
      controls: {
        mouseSensitivity: 0.0025,
        invertY: false,
        cameraAutoCenter: true
      }
    };

    this.loadFromStorage();
  }

  loadFromStorage() {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return;
      const saved = localStorage.getItem('roadbound_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.graphics) Object.assign(this.settings.graphics, parsed.graphics);
        if (parsed.audio) Object.assign(this.settings.audio, parsed.audio);
        if (parsed.controls) Object.assign(this.settings.controls, parsed.controls);
      }
    } catch (e) {
      console.warn('Could not load settings from storage', e);
    }
  }

  saveToStorage() {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return;
      localStorage.setItem('roadbound_settings', JSON.stringify(this.settings));
    } catch (e) {
      console.warn('Could not save settings to storage', e);
    }
  }

  applyPreset(preset) {
    this.settings.graphics.preset = preset;
    if (preset === 'low') {
      this.settings.graphics.shadows = false;
      this.settings.graphics.shadowMapSize = 512;
      this.settings.graphics.postProcessing = false;
      this.settings.graphics.weatherEffects = false;
      this.settings.graphics.viewDistance = 'short';
      this.settings.graphics.pixelRatio = 1.0;
    } else if (preset === 'medium') {
      this.settings.graphics.shadows = true;
      this.settings.graphics.shadowMapSize = 1024;
      this.settings.graphics.postProcessing = false;
      this.settings.graphics.weatherEffects = true;
      this.settings.graphics.viewDistance = 'medium';
      this.settings.graphics.pixelRatio = 1.0;
    } else if (preset === 'high') {
      this.settings.graphics.shadows = true;
      this.settings.graphics.shadowMapSize = 2048;
      this.settings.graphics.postProcessing = true;
      this.settings.graphics.weatherEffects = true;
      this.settings.graphics.viewDistance = 'far';
      this.settings.graphics.pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
    } else if (preset === 'ultra') {
      this.settings.graphics.shadows = true;
      this.settings.graphics.shadowMapSize = 4096;
      this.settings.graphics.postProcessing = true;
      this.settings.graphics.weatherEffects = true;
      this.settings.graphics.viewDistance = 'far';
      this.settings.graphics.pixelRatio = window.devicePixelRatio || 1.5;
    }
    this.saveToStorage();
  }
}

export const settingsManager = new SettingsManager();
