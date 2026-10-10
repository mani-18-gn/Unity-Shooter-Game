// ROADBOUND - Main Game Orchestrator & Game Loop
import * as THREE from 'three';
import { gameState } from './core/GameState.js';
import { settingsManager } from './core/SettingsManager.js';
import { SaveSystem } from './core/SaveSystem.js';
import { InputManager } from './core/InputManager.js';
import { AudioManager } from './core/AudioManager.js';
import { Engine } from './core/Engine.js';

import { BlackshoreTerrain } from './world/BlackshoreTerrain.js';
import { RoadNetwork } from './world/RoadNetwork.js';
import { WeatherSystem } from './world/WeatherSystem.js';
import { TrafficLightSystem } from './world/TrafficLightSystem.js';

import { PlayerCharacter } from './character/PlayerCharacter.js';
import { CharacterController } from './character/CharacterController.js';
import { Vehicle } from './vehicle/Vehicle.js';

import { TrafficAI } from './ai/TrafficAI.js';
import { PedestrianAI } from './ai/PedestrianAI.js';
import { PoliceAI } from './ai/PoliceAI.js';

import { CameraSystem } from './camera/CameraSystem.js';
import { HUD } from './ui/HUD.js';
import { FullscreenMap } from './ui/FullscreenMap.js';
import { SafehouseMenu } from './ui/SafehouseMenu.js';
import { MainMenu } from './ui/MainMenu.js';
import { MissionManager } from './missions/MissionManager.js';
import { GPSNavigation } from './core/GPSNavigation.js';
import { EnterableHouseSystem } from './world/EnterableHouseSystem.js';
import { LandmarksAndIndustrySystem } from './world/LandmarksAndIndustrySystem.js';
import { CareerSystem } from './economy/CareerSystem.js';
import { SmartphoneUI } from './ui/SmartphoneUI.js';
import { LootSystem } from './combat/LootSystem.js';
import { GrenadeSystem } from './combat/GrenadeSystem.js';
import { EnemyShooterAI } from './ai/EnemyShooterAI.js';

class RoadboundGame {
  constructor() {
    this.canvas = document.getElementById('webgl-canvas');
    this.settings = settingsManager;
    this.gameState = gameState;
    this.saveSystem = new SaveSystem(this.gameState);

    // Core Systems
    this.audio = new AudioManager(this.settings);
    this.engine = new Engine(this.canvas, this.settings);
    this.input = new InputManager(this.canvas);

    // World & Geography
    this.terrain = new BlackshoreTerrain(this.engine.scene, this.engine.textureLibrary);
    this.roadNetwork = new RoadNetwork();
    this.weather = new WeatherSystem(this.engine.scene, this.engine, this.audio, this.gameState);

    // Player Character (Marcus Vance)
    this.character = new PlayerCharacter(this.engine.scene, this.gameState.wardrobe);
    this.characterController = new CharacterController(
      this.character,
      this.engine.camera,
      this.engine.scene,
      this.audio,
      this.terrain,
      this.gameState
    );

    // Vehicles
    this.vehicles = new Map();
    this.spawnActiveVehicle(this.gameState.player.activeVehicleId);

    // Place Marcus Vance right beside the driver door of the parked supercar
    this.characterController.setPosition(565.2, 27.2, -45.5);
    this.characterController.yaw = -Math.PI * 0.25;

    // Traffic Light System (Signal Gantries & Intersections)
    this.trafficLightSystem = new TrafficLightSystem(this.engine.scene, this.terrain);

    // AI Systems
    this.pedestrianAI = new PedestrianAI(this.engine.scene, this.terrain);
    this.trafficAI = new TrafficAI(
      this.engine.scene,
      this.roadNetwork,
      this.terrain,
      this.trafficLightSystem,
      this.pedestrianAI,
      this.audio
    );
    this.policeAI = new PoliceAI(this.engine.scene, this.terrain, this.audio, this.gameState);

    // Camera & UI
    this.cameraSystem = new CameraSystem(this.engine.camera, this.settings);
    this.cameraSystem.setMode('cinematic_menu');

    this.hud = new HUD(this.gameState);
    this.fullscreenMap = new FullscreenMap(this.gameState, this.roadNetwork);
    this.missionManager = new MissionManager(this.gameState, this.hud, this.saveSystem);

    // Intelligent GPS Turn-by-Turn Voice Navigation
    this.gpsNav = new GPSNavigation(this.roadNetwork, this.audio, this.gameState, this.hud);

    // Enterable Furnished Safehouse Villa & Living Residence
    this.houseSystem = new EnterableHouseSystem(
      this.engine.scene,
      this.terrain,
      this.audio,
      this.gameState,
      this.hud
    );

    // Civic Landmarks, Industrial Manufacturing & Hydroelectric Dam
    this.landmarksSystem = new LandmarksAndIndustrySystem(
      this.engine.scene,
      this.terrain,
      this.audio
    );

    // Living Economy & Freelance Careers (Taxi Driver & Express Freight Courier)
    this.careerSystem = new CareerSystem(this.gameState, this.hud, this.audio);

    // In-Game Handheld Smartphone OS (Apex Titan Pro)
    this.smartphoneUI = new SmartphoneUI(this.gameState, this.careerSystem, this.audio, this.hud);

    // Open-World Loot & Weapon Drops System
    this.lootSystem = new LootSystem(this.engine.scene, this.terrain, this.audio, this.gameState, this.hud);

    // Throwable M67 Frag Grenade Physics Engine
    this.grenadeSystem = new GrenadeSystem(this.engine.scene, this.terrain, this.audio, this.engine.camera, this.gameState, this.hud);

    // Hostile Shooter AI Combatants
    this.enemyShooterAI = new EnemyShooterAI(this.engine.scene, this.terrain, this.audio, this.lootSystem, this.gameState, this.hud);

    // Connect Combat Systems to Character Controller
    this.characterController.setCombatSystems(
      this.lootSystem,
      this.grenadeSystem,
      this.enemyShooterAI,
      this.hud,
      this.cameraSystem
    );

    // Frame Pacing: STRICT 30 FPS LOCK
    this.targetFPS = 30;
    this.frameDuration = 1000 / this.targetFPS; // 33.33ms
    this.lastFrameTime = performance.now();

    // Subscribe to vehicle enter/exit for camera synchronization
    this.gameState.subscribe((event) => {
      if (event === 'entered_vehicle') {
        this.cameraSystem.setMode('vehicle_chase');
      } else if (event === 'exited_vehicle') {
        this.cameraSystem.setMode('third_person');
      }
    });

    this.toggleCameraRequested = false;
    window.addEventListener('roadbound_action', (e) => {
      const act = e.detail?.action;
      if (act === 'camera_toggle') {
        this.toggleCameraRequested = true;
      } else if (act === 'enter_vehicle') {
        if (!this.gameState.player.inVehicle && this.activeVehicle) {
          const dx = this.characterController.position.x - this.activeVehicle.physics.position.x;
          const dz = this.characterController.position.z - this.activeVehicle.physics.position.z;
          if (Math.hypot(dx, dz) < 8.0) {
            this.characterController.enterVehicle(this.activeVehicle);
            this.cameraSystem.setMode('vehicle_chase');
          }
        }
      } else if (act === 'exit_vehicle') {
        if (this.gameState.player.inVehicle && this.activeVehicle) {
          this.characterController.exitVehicle(this.activeVehicle);
          this.cameraSystem.setMode('third_person');
        }
      } else if (act === 'prompt_click') {
        if (this.houseSystem && this.houseSystem.activeInteraction) {
          if (this.houseSystem.activeInteraction === 'npc') {
            this.houseSystem.triggerInteraction('E');
          } else {
            this.houseSystem.triggerInteraction('F');
          }
        }
      } else if (this.activeVehicle && this.gameState.player.inVehicle) {
        if (act === 'veh_signal_left') this.activeVehicle.toggleTurnSignal('left');
        else if (act === 'veh_signal_right') this.activeVehicle.toggleTurnSignal('right');
        else if (act === 'veh_hazard') this.activeVehicle.toggleTurnSignal('hazard');
        else if (act === 'veh_wipers') this.activeVehicle.toggleWipers();
      }
    });

    this.safehouseMenu = new SafehouseMenu(
      this.gameState,
      this.saveSystem,
      this.settings,
      this.missionManager,
      this.fullscreenMap,
      (vehId) => this.spawnActiveVehicle(vehId),
      (wardrobe) => this.character.updateWardrobe(wardrobe)
    );

    this.mainMenu = new MainMenu(
      this.gameState,
      this.safehouseMenu,
      (isNewGame) => this.startPlay(isNewGame),
      this.audio,
      this.saveSystem
    );

    this.isPlaying = false;
    this.clock = new THREE.Clock();

    // Auto-load slot 1, but default to bright Day Mode
    this.saveSystem.loadGame(1);
    if (!this.gameState.world.timeMode) {
      this.gameState.world.timeMode = 'day';
      this.gameState.world.timeOfDay = 12.0;
    }
    this.engine.updateSunPosition(this.gameState.world.timeOfDay);

    // Start loop
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  spawnActiveVehicle(vehicleId) {
    if (this.activeVehicle) {
      this.activeVehicle.destroy();
    }

    const cfg = this.gameState.vehicles[vehicleId] || this.gameState.vehicles.apex_vanguard;
    this.activeVehicle = new Vehicle(
      vehicleId,
      cfg,
      this.engine.scene,
      this.audio,
      this.terrain
    );

    // Spawn parked at scenic Canyon Summit Overlook turnoff
    this.activeVehicle.setPosition(568, 27.2, -45, Math.PI * 0.7);
    this.gameState.player.activeVehicleId = vehicleId;
  }

  startPlay(isNewGame = false) {
    if (isNewGame) {
      this.gameState.player.cash = 25000;
      this.gameState.player.repLevel = 1;
      this.gameState.player.repXp = 0;
      this.gameState.player.health = 100;
      this.gameState.player.armor = 80;
      this.gameState.player.inVehicle = false;
      this.gameState.player.activeVehicleId = 'apex_vanguard';
      this.spawnActiveVehicle('apex_vanguard');
      this.characterController.setPosition(565.2, 27.2, -45.5);
      this.characterController.yaw = -Math.PI * 0.25;
      this.saveSystem.saveGame(1);
    }

    this.isPlaying = true;
    this.audio.ensureContext();
    this.input.requestPointerLock();
    if (this.canvas) this.canvas.focus();
    this.hud.setVisible(true);

    // Ensure bright Day Mode lighting is refreshed
    this.engine.updateSunPosition(this.gameState.world.timeOfDay);

    // Initial camera view (positioned over-the-shoulder looking forward)
    this.cameraSystem.orbitYaw = -Math.PI * 0.25;
    this.cameraSystem.orbitPitch = 0.15;

    if (this.gameState.player.inVehicle && this.activeVehicle) {
      this.cameraSystem.setMode('vehicle_chase');
    } else {
      this.cameraSystem.setMode('third_person');
    }
  }

  loop() {
    requestAnimationFrame(this.loop);

    try {
      // STRICT 30 FPS LOCK (Locked at 30 FPS as requested)
      const now = performance.now();
      const elapsed = now - this.lastFrameTime;
      if (elapsed < this.frameDuration - 1.5) {
        return; // Skip rendering to lock at exactly 30 FPS
      }
      this.lastFrameTime = now - (elapsed % this.frameDuration);
    const delta = 1.0 / 30.0;
    const movementInput = this.input.getMovementInput();

    // Audio context resume check on any user action
    if (movementInput.jump || movementInput.interact || movementInput.fire) {
      this.audio.ensureContext();
    }

    // Toggle Pause / Safehouse Menu on Tab or Esc
    if (movementInput.pauseToggle) {
      if (this.safehouseMenu.isOpen()) {
        this.safehouseMenu.hide();
        this.input.requestPointerLock();
      } else if (this.isPlaying) {
        this.safehouseMenu.show('garage');
        this.input.exitPointerLock();
      }
    }

    // Toggle Island Map on [M]
    if (movementInput.mapToggle) {
      if (this.safehouseMenu.isOpen()) {
        this.safehouseMenu.hide();
        this.input.requestPointerLock();
      } else {
        this.safehouseMenu.show('map');
        this.input.exitPointerLock();
      }
    }

    if (this.isPlaying && !this.safehouseMenu.isOpen()) {
      // 1. Vehicle Entry / Exit Toggle on [E] or [F]
      if (movementInput.interact || movementInput.pickup) {
        if (this.gameState.player.inVehicle && this.activeVehicle) {
          this.characterController.exitVehicle(this.activeVehicle);
          this.cameraSystem.setMode('third_person');
        }
      }

      // 2. Cycle Camera Mode on [V] or [C] or HUD Button
      if (movementInput.cameraToggle || this.input.isJustPressed('KeyC') || this.toggleCameraRequested) {
        this.toggleCameraRequested = false;
        if (this.gameState.player.inVehicle) {
          this.cameraSystem.cycleVehicleCamera();
          this.hud.showCommsDialogue('TACTICAL HUD', `VEHICLE CAMERA: ${this.cameraSystem.mode.toUpperCase().replace('_', ' ')}`, 2.0);
        } else {
          const mode = this.cameraSystem.cycleOnFootCamera();
          this.hud.showCommsDialogue('TACTICAL HUD', `CAMERA: ${mode === 'first_person' ? 'FIRST-PERSON EYE LEVEL [V]' : 'THIRD-PERSON OVER-THE-SHOULDER [V]'}`, 2.0);
          this.hud.updateCameraBadge(mode);
        }
      }

      // 3. Toggle Headlights on [L]
      if (movementInput.headlights && this.activeVehicle) {
        this.activeVehicle.toggleHeadlights();
      }

      // 4. Vehicle Cockpit Keyboard Shortcuts (Blinkers [Q]/[Z]/[X], Wipers [K], Hazard [H])
      if (this.gameState.player.inVehicle && this.activeVehicle) {
        if (this.input.isJustPressed('KeyQ') || this.input.isJustPressed('KeyZ')) {
          this.activeVehicle.toggleTurnSignal('left');
        }
        if (this.input.isJustPressed('KeyX')) {
          this.activeVehicle.toggleTurnSignal('right');
        }
        if (this.input.isJustPressed('KeyK')) {
          this.activeVehicle.toggleWipers();
        }
        if (this.input.isJustPressed('KeyH')) {
          this.activeVehicle.toggleTurnSignal('hazard');
        }
      } else {
        // Household & Residence Interactions ([F] for fixtures/doors/appliances, [E] for Elena chat)
        if (this.input.isJustPressed('KeyF')) {
          this.houseSystem.triggerInteraction('F');
        }
        if (this.input.isJustPressed('KeyE')) {
          if (this.houseSystem.activeInteraction === 'npc') {
            this.houseSystem.triggerInteraction('E');
          }
        }
      }

      // 5. Update Active Player or Vehicle
      if (this.gameState.player.inVehicle && this.activeVehicle) {
        this.activeVehicle.update(delta, movementInput, this.terrain.colliders);

        // Sync player global position to vehicle
        this.gameState.player.position.x = this.activeVehicle.physics.position.x;
        this.gameState.player.position.y = this.activeVehicle.physics.position.y;
        this.gameState.player.position.z = this.activeVehicle.physics.position.z;

        // Vehicle Cluster Telemetry (Speed, RPM, Gear, Health, Fuel, Signals, Wipers)
        this.hud.updateVehicleCluster(
          true,
          this.activeVehicle.physics.speedMph,
          this.activeVehicle.physics.rpm,
          this.activeVehicle.physics.currentGear,
          this.activeVehicle.damage.health,
          this.activeVehicle.fuel,
          this.activeVehicle.turnSignal,
          this.activeVehicle.wipersActive
        );

        // Petrol Pump refueling interaction check
        let nearGasStation = false;
        if (this.terrain.petrolStations) {
          const vehPos = this.activeVehicle.physics.position;
          for (const station of this.terrain.petrolStations) {
            if (Math.hypot(vehPos.x - station.x, vehPos.z - station.z) < station.radius) {
              nearGasStation = true;
              const fuelPct = Math.round(this.activeVehicle.fuel);
              this.hud.showPrompt('F / REFUEL', `${station.name.toUpperCase()} ($40) &bull; TANK: ${fuelPct}%`);

              if (this.input.isJustPressed('KeyF') && fuelPct < 98) {
                if (this.gameState.player.cash >= 40) {
                  this.gameState.player.cash -= 40;
                }
                this.activeVehicle.refuel(100);
                this.audio.playImpactSound(0.3);
                this.hud.showCommsDialogue('PETROL DISPENSER', `TANK FULLY REFUELED TO 100%! (-$40).`, 3.0);
              }
              break;
            }
          }
        }

        if (!nearGasStation) {
          this.hud.showPrompt('E / F', `EXIT ${this.activeVehicle.config.name.toUpperCase()}`);
        }
      } else {
        // Character Locomotion & Combat
        this.characterController.update(
          delta,
          movementInput,
          this.cameraSystem.orbitYaw,
          this.activeVehicle
        );

        // Passive vehicle physics (parked damping)
        if (this.activeVehicle) {
          this.activeVehicle.update(delta, null, this.terrain.colliders);

          // Show Enter Vehicle prompt if near vehicle
          const dx = this.characterController.position.x - this.activeVehicle.physics.position.x;
          const dz = this.characterController.position.z - this.activeVehicle.physics.position.z;
          const distToCar = Math.hypot(dx, dz);
          if (distToCar < 6.5) {
            this.hud.showPrompt('E / F', `ENTER ${this.activeVehicle.config.name.toUpperCase()}`);
          } else {
            this.hud.hidePrompt();
          }
        }

        this.hud.updateVehicleCluster(false, 0, 0, 1, 100);
      }

      // 5. Update Camera
      const targetEntity = this.gameState.player.inVehicle ? this.activeVehicle : this.characterController;
      this.cameraSystem.update(delta, this.input, targetEntity, this.gameState.player.inVehicle);

      // 6. Update AI
      const playerPos = this.gameState.player.inVehicle
        ? this.activeVehicle.physics.position
        : this.characterController.position;

      const playerSpeed = this.gameState.player.inVehicle
        ? this.activeVehicle.physics.speedMph
        : 0;

      this.trafficAI.update(delta, playerPos);
      this.pedestrianAI.update(delta, playerPos, playerSpeed);
      this.policeAI.update(delta, playerPos, this.gameState.player.inVehicle);

      // Intelligent GPS Spoken Voice & Turn-by-Turn Update
      const heading = this.gameState.player.inVehicle
        ? this.activeVehicle.physics.heading
        : this.characterController.yaw;
      this.gpsNav.update(delta, playerPos, heading);

      // Enterable Residence & Living Household Simulation Update
      this.houseSystem.update(delta, playerPos);

      // 7. Update Mission Progression
      this.missionManager.update(delta, playerPos, this.gameState.player.inVehicle);

      // 8. Real-time Biome & District Tracking across all 12 regions
      const currentDistrict = this.terrain.getRegionAt(playerPos.x, playerPos.z);
      this.gameState.player.currentDistrict = currentDistrict;
      this.hud.updateDistrict(currentDistrict);

      // 9. Surface Physics Friction adaptation based on biome
      if (this.gameState.player.inVehicle && this.activeVehicle) {
        let surfaceType = 'asphalt';
        if (currentDistrict.includes('DESERT')) surfaceType = 'sand';
        else if (currentDistrict.includes('FARMLAND') || currentDistrict.includes('WILDERNESS')) surfaceType = 'dirt';
        else if (currentDistrict.includes('COAST')) surfaceType = 'sand';
        this.activeVehicle.physics.setSurfaceType(surfaceType, this.weather.wetness);
      }

      // 10. Update Combat, Loot & Hostile Shooter AI
      this.lootSystem.update(delta, playerPos);
      this.grenadeSystem.update(delta, this.enemyShooterAI);
      this.enemyShooterAI.update(delta, playerPos, this.gameState.player.inVehicle);

      // 11. Update HUD Minimap & Dynamic Crosshair
      this.hud.renderMinimap(
        playerPos,
        heading,
        this.roadNetwork,
        this.gameState.activeMission?.targetLocation,
        this.gameState.gpsWaypoint
      );
      const isMoving = movementInput.moveX !== 0 || movementInput.moveZ !== 0;
      this.hud.updateCrosshair(movementInput.aim, isMoving, movementInput.fire);
    } else {
      // Cinematic Showcase turntable mode for Main Menu
      this.cameraSystem.update(delta, this.input, this.activeVehicle, false);
      if (this.activeVehicle) {
        this.activeVehicle.update(delta, null, null);
      }
    }

    // Traffic Lights Signal Cycle
    this.trafficLightSystem.update(delta);

    // Terrain & Prop animations (Windmills, oil pumpjacks)
    this.terrain.update(delta);

    // Civic Landmarks, Industrial Chimney Smoke & Hydroelectric Dam
    const worldTargetPos = this.activeVehicle
      ? this.activeVehicle.physics.position
      : (this.characterController ? this.characterController.position : new THREE.Vector3(0, 0, 0));
    this.landmarksSystem.update(delta, worldTargetPos);

    // Living Economy & Career System (Taxi & Courier Freight jobs)
    this.careerSystem.update(delta, worldTargetPos);

    // In-Game Handheld Smartphone (Apex Titan Pro) Update
    this.smartphoneUI.update(delta);

    // Weather & Atmosphere update
    const currentTargetPos = this.activeVehicle ? this.activeVehicle.physics.position : new THREE.Vector3(0, 0, 0);
    this.weather.update(delta, currentTargetPos);

    // Save System Timer
    this.saveSystem.update(delta);
    this.hud.update(delta, this.cameraSystem.orbitYaw);

    // Input cycle
    this.input.update();

    } catch (loopErr) {
      console.error('[ROADBOUND Game Loop Error]', loopErr);
    } finally {
      // Render 3D Scene - always runs so screen cannot turn black
      this.engine.render();
    }
  }
}

// Instantiate game on DOM ready
window.addEventListener('DOMContentLoaded', () => {
  window.gameInstance = new RoadboundGame();
});
