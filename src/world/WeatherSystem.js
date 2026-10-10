// ROADBOUND - Dynamic Weather & 24-Hour Day/Night Atmospheric Pipeline
import * as THREE from 'three';

export class WeatherSystem {
  constructor(scene, engine, audioManager, gameState) {
    this.scene = scene;
    this.engine = engine;
    this.audio = audioManager;
    this.gameState = gameState;

    this.currentWeather = 'clear';
    this.rainIntensity = 0.0;
    this.wetness = 0.0; // Dry asphalt
    this.lightningTimer = 0;
    this.nextLightning = 15;

    this.initRainParticles();
    this.initLightningLight();
    this.initVolumetricClouds();

    // Listen for Day/Night toggle events
    window.addEventListener('roadbound_toggle_time', () => {
      this.toggleTimeMode();
    });
    window.addEventListener('roadbound_set_time', (e) => {
      if (e.detail?.mode) {
        this.setTimeMode(e.detail.mode);
      }
    });
  }

  setTimeMode(mode) {
    if (mode === 'day') {
      this.gameState.world.timeOfDay = 12.0;
      this.gameState.world.timeMode = 'day';
      this.gameState.world.timeSpeed = 0.0;
    } else if (mode === 'sunset') {
      this.gameState.world.timeOfDay = 17.5;
      this.gameState.world.timeMode = 'sunset';
      this.gameState.world.timeSpeed = 0.0;
    } else if (mode === 'night') {
      this.gameState.world.timeOfDay = 0.0;
      this.gameState.world.timeMode = 'night';
      this.gameState.world.timeSpeed = 0.0;
    }
    this.engine.updateSunPosition(this.gameState.world.timeOfDay);
    this.gameState.notify('time_mode_changed', { mode, timeOfDay: this.gameState.world.timeOfDay });
  }

  toggleTimeMode() {
    const cur = this.gameState.world.timeOfDay;
    let next = 'day';
    if (cur >= 8 && cur < 16) {
      next = 'sunset';
    } else if (cur >= 16 && cur < 20) {
      next = 'night';
    } else {
      next = 'day';
    }
    this.setTimeMode(next);
    return next;
  }

  initRainParticles() {
    const particleCount = 1800;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 80;
      positions[i + 1] = Math.random() * 40;
      positions[i + 2] = (Math.random() - 0.5) * 80;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0x8ab4f8,
      size: 0.25,
      transparent: true,
      opacity: 0.5,
      depthWrite: false
    });

    this.rainMesh = new THREE.Points(geometry, material);
    this.rainMesh.visible = false;
    this.scene.add(this.rainMesh);
  }

  initLightningLight() {
    this.lightningLight = new THREE.PointLight(0xddeeff, 0, 500);
    this.lightningLight.position.set(0, 150, 0);
    this.scene.add(this.lightningLight);
  }

  // Volumetric Cinematic Clouds (Forza Horizon sunset atmosphere)
  initVolumetricClouds() {
    this.cloudGroup = new THREE.Group();
    this.clouds = [];

    this.cloudMaterial = new THREE.MeshStandardMaterial({
      color: 0xffa066,
      roughness: 0.95,
      metalness: 0.02,
      transparent: true,
      opacity: 0.62,
      depthWrite: false
    });

    const puffGeo = new THREE.SphereGeometry(1, 8, 6);

    for (let c = 0; c < 16; c++) {
      const cluster = new THREE.Group();
      const cx = (Math.random() - 0.5) * 2600;
      const cy = 180 + Math.random() * 80;
      const cz = (Math.random() - 0.5) * 2600;
      cluster.position.set(cx, cy, cz);

      // 5-8 overlapping puffs per cloud formation
      const puffCount = 5 + Math.floor(Math.random() * 4);
      for (let p = 0; p < puffCount; p++) {
        const puff = new THREE.Mesh(puffGeo, this.cloudMaterial);
        const radius = 35 + Math.random() * 35;
        puff.scale.set(radius * (1.2 + Math.random() * 0.6), radius * 0.45, radius * (1.0 + Math.random() * 0.5));
        puff.position.set(
          (Math.random() - 0.5) * 60,
          (Math.random() - 0.5) * 15,
          (Math.random() - 0.5) * 60
        );
        cluster.add(puff);
      }

      this.cloudGroup.add(cluster);
      this.clouds.push(cluster);
    }

    this.scene.add(this.cloudGroup);
  }

  setWeather(type) {
    this.currentWeather = type;
    this.gameState.world.weather = type;

    if (type === 'clear') {
      this.rainIntensity = 0;
      this.rainMesh.visible = false;
    } else if (type === 'overcast') {
      this.rainIntensity = 0.1;
      this.rainMesh.visible = false;
    } else if (type === 'rain') {
      this.rainIntensity = 0.6;
      this.rainMesh.visible = true;
    } else if (type === 'storm') {
      this.rainIntensity = 1.0;
      this.rainMesh.visible = true;
    }

    this.audio.updateWeatherAudio(type, this.rainIntensity);
  }

  update(delta, playerPos) {
    // 1. Advance continuous time of day
    this.gameState.world.timeOfDay += delta * this.gameState.world.timeSpeed;
    if (this.gameState.world.timeOfDay >= 24) {
      this.gameState.world.timeOfDay -= 24;
    }

    this.engine.updateSunPosition(this.gameState.world.timeOfDay);

    // 2. Wetness transition
    const targetWet = (this.currentWeather === 'rain' || this.currentWeather === 'storm') ? 1.0 : 0.05;
    this.wetness += (targetWet - this.wetness) * (delta * 0.15);

    // 3. Update rain particle position following player/camera
    if (this.rainMesh && this.rainMesh.visible && playerPos) {
      this.rainMesh.position.x = playerPos.x;
      this.rainMesh.position.z = playerPos.z;

      const positions = this.rainMesh.geometry.attributes.position.array;
      const count = positions.length;

      for (let i = 1; i < count; i += 3) {
        positions[i] -= delta * 42 * (0.8 + this.rainIntensity * 0.4);
        if (positions[i] < -2) {
          positions[i] = 38;
        }
      }
      this.rainMesh.geometry.attributes.position.needsUpdate = true;
    }

    // 4. Cloud Drift & Time-of-Day Tinting
    if (this.clouds) {
      const tod = this.gameState.world.timeOfDay;
      if (tod >= 16.0 && tod <= 19.5) {
        this.cloudMaterial.color.setHex(0xffa066); // Warm sunset golden peach
        this.cloudMaterial.opacity = 0.68;
      } else if (tod > 6.5 && tod < 16.0) {
        this.cloudMaterial.color.setHex(0xfbfcfe); // Crisp white daylight
        this.cloudMaterial.opacity = 0.52;
      } else {
        this.cloudMaterial.color.setHex(0x1a2638); // Midnight indigo
        this.cloudMaterial.opacity = 0.40;
      }

      this.clouds.forEach(cl => {
        cl.position.x += delta * 1.8;
        if (cl.position.x > 1400) cl.position.x = -1400;
      });
    }

    // 5. Lightning & Thunder simulation during Storm
    if (this.currentWeather === 'storm') {
      this.lightningTimer += delta;
      if (this.lightningTimer > this.nextLightning) {
        this.lightningTimer = 0;
        this.nextLightning = 8 + Math.random() * 14;
        this.triggerLightningFlash(playerPos);
      }
    }
  }

  triggerLightningFlash(playerPos) {
    if (!playerPos) return;
    this.lightningLight.position.set(
      playerPos.x + (Math.random() - 0.5) * 160,
      120,
      playerPos.z + (Math.random() - 0.5) * 160
    );
    this.lightningLight.intensity = 5.0;

    setTimeout(() => {
      this.lightningLight.intensity = 1.5;
      setTimeout(() => {
        this.lightningLight.intensity = 4.2;
        setTimeout(() => {
          this.lightningLight.intensity = 0;
        }, 60);
      }, 40);
    }, 80);

    // Thunder sound delay based on distance
    setTimeout(() => {
      this.audio.playImpactSound(0.85);
    }, 450);
  }
}
