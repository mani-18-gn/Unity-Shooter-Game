# SPEC.md — Realistic AAA-Style Open-World Military Combat Game
# Unity 6.3 LTS + URP

> **Status**: `FINALIZED`
> **Version**: 2.0.0
> **Engine**: Unity 6.3 LTS (Version 6000.3.26f1) + Universal Render Pipeline (URP)

---

## 1. Vision & Executive Summary
Transform the existing Unity military combat project into a high-quality, realistic modern military open-world combat game. The project features realistic characters (male and female tactical soldiers), genuine firearms (AK-47, M4A1, AWM Sniper, UMP, Shotgun, Pistol, Grenade), vehicular simulation, tactical enemy AI, an expansive open-world military zone with PBR materials and atmospheric lighting, battle royale gameplay systems, professional HUD/UI, and high immersion.

---

## 2. Core Pillars & Specifications

### 2.1 Project Boundary & Architecture Protection
- Preserve all existing gameplay code, scenes, and assets: `CombatTestScene.unity`, `PlayerController`, `PlayerCameraController`, `WeaponController`, `WeaponFireSystem`, `WeaponInventory`, `WeaponRecoil`, `PlayerHealth`, `CombatDummyTarget`, `CombatTestDebugUI`, and ScriptableObjects (`WeaponData`, `LootItemData`, `VehicleData`).
- All new systems extend existing interfaces (`IDamageable`, `WeaponData`, `PlayerInputHandler`) without destructive overwrites.

### 2.2 Realistic Character System
- Humanoid rigged male and female tactical soldiers with modern military uniforms, helmets, tactical vests, boots, and realistic PBR materials.
- Comprehensive locomotion & combat animations: Idle, Walk, Run, Sprint, Jump, Crouch, Aiming, Rifle Firing, Reloading, Hit Reactions, and Death.
- Animator Controller with smooth transitions and integration with `CharacterController`.

### 2.3 Third-Person Player Controls & Camera
- Smooth camera orbit with configurable sensitivity, shoulder offsets (normal and ADS), recoil kick recovery, and collision sphere-casting against geometry.
- Responsive movement: WASD, Shift (Sprint), Space (Jump), C/Ctrl (Crouch), RMB (ADS), LMB (Fire), R (Reload), 1/2/3 (Weapon Selection).

### 2.4 Realistic Weapons & Combat System
- True 3D weapon meshes attached to character hand sockets with proper muzzle offsets.
- Hitscan / raycast and ballistic projectile logic with weapon-specific fire rates, magazine capacities, recoil impulse, and spread cone modifiers.
- Muzzle flash VFX, bullet tracer effects, surface impact VFX (dirt, concrete, metal, blood), and headshot critical multiplier.
- Sound effects: authentic gunshot, mechanical reload, bullet impact, and hurt vocalizations.

### 2.5 Massive Open-World Military Environment
- Large playable military terrain with hills, roads, military checkpoint barriers, concrete barricades, watchtowers, warehouses/outposts, ammo crates, and cover positions.
- High-quality PBR textures: asphalt, cracked road, gravel, dirt, grass, concrete, and rock.
- URP lighting: directional sunlight, soft shadows, ambient reflection probes, atmospheric fog, and post-processing.

### 2.6 Realistic Vehicles & Driving
- Drivable military vehicle (e.g. Tactical Off-Road Jeep / Truck) with wheel colliders, suspension physics, acceleration, steering, braking, reverse, and vehicle camera follow.
- Enter/exit vehicle interaction.

### 2.7 Enemy Combat AI
- NavMesh-driven tactical military enemies with patrol, sight detection, line-of-sight checks, combat chase, cover engagement, shooting, damage reaction, and ragdoll/death states.
- Reusable damage pipeline targeting `IDamageable`.

### 2.8 Battle Royale Gameplay Foundation
- Offline single-player Battle Royale loop: player & AI drop/spawn, weapon/ammo/armor loot pickups, shrinking safe zone circle with perimeter damage, elimination feed, match timer, victory/defeat conditions.

### 2.9 Professional Military UI/HUD
- Modern tactical HUD: dynamic crosshair with spread expansion, hit markers, health & armor bars, active weapon & ammo counter, interaction prompts, minimap/compass, pause menu, and game over/victory screens.

---

## 3. Hardware & Performance Target
- Target Hardware: Dell Precision 5560 (Intel Core i7, 32 GB RAM, 1 TB SSD).
- Smooth 60 FPS target with optimized draw calls, LODs, efficient physics layers, and memory hygiene.
