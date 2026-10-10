# ROADMAP.md — Realistic AAA-Style Open-World Military Combat Game
# Unity 6.3 LTS + URP

> **Single Source of Truth** for Milestone Progress and Task Execution.

---

## Milestone Overview

- [x] **Milestone 1**: Unity Project Verification, System Audit, & Baseline Protection
- [x] **Milestone 2**: Free Military Character & Animation Integration
- [x] **Milestone 3**: Humanoid Character Controller & Camera Combat Integration
- [x] **Milestone 4**: Realistic Weapon Models, Ballistics, Audio & Visual Effects
- [x] **Milestone 5**: Open-World Military Environment, Outposts & PBR Props
- [x] **Milestone 6**: Realistic Military Vehicle Driving & Physics
- [x] **Milestone 7**: Tactical Enemy Combat AI & Battle Royale Foundation
- [x] **Milestone 8**: Professional Military UI, Post-Processing, Polish & Verification

---

## Detailed Milestone Execution Record

### Milestone 1: Unity Project Verification & System Audit
- [x] 1.1 Verified active Unity 6.3 LTS (`6000.3.26f1`) running with `-projectpath D:\game` (PID 12112).
- [x] 1.2 Isolated and protected authentic Unity project boundaries from legacy web files.
- [x] 1.3 Audited existing combat codebase (`PlayerController`, `WeaponController`, `WeaponFireSystem`, `PlayerCameraController`, `CombatDummyTarget`, `CombatTestDebugUI`).
- [x] 1.4 Verified C# compilation pipeline with zero errors (`dotnet build Assembly-CSharp.csproj` & `Assembly-CSharp-Editor.csproj`).

### Milestone 2: Free Military Character & Animation Integration
- [x] 2.1 Downloaded verified free SWAT Tactical Soldier FBX (25.5 MB) with full 2K PBR textures (Body diffuse, normal, specular; Head diffuse, normal, specular).
- [x] 2.2 Downloaded Mixamo combat animations suite (Idle, Walk, Run, Firing Rifle, Crouch Idle, Crouched Walking, Standing Death Backward).
- [x] 2.3 Created `CharacterSetupTool.cs` generating Humanoid Avatar and `SwatAnimatorController.controller` with 1D Locomotion BlendTree, Crouch state, Fire trigger, and Death trigger.
- [x] 2.4 Built isolated test scene `Assets/Scenes/CharacterTestScene.unity`.

### Milestone 3: Humanoid Character Controller & Camera Combat Integration
- [x] 3.1 Implemented `HumanoidAnimationBridge.cs` syncing movement velocity, aim state, crouch state, and grounding between `PlayerController` and `Animator`.
- [x] 3.2 Integrated SWAT visual mesh onto `Player` with `RightHandSocket` while preserving `BodyMesh` and `Visor` for validator compatibility.
- [x] 3.3 Connected weapon firing triggers and death collapse to animator.

### Milestone 4: Realistic Weapon Models, Ballistics, Audio & Visual Effects
- [x] 4.1 Downloaded and converted genuine 3D `AK47.obj` (12.2 MB) with full PBR texture and attached to character's `RightHandSocket`.
- [x] 4.2 Realigned `MuzzlePoint` precisely to the AK-47 barrel tip.
- [x] 4.3 Implemented `CombatAudioManager.cs` with authentic gunshot, reload, bullet impact, explosion, landing, and hurt voice feedback.
- [x] 4.4 Implemented `CombatEffectsSystem.cs` with muzzle light flashes, bullet tracer lines, and surface/flesh impact visual bursts.

### Milestone 5: Open-World Military Environment, Outposts & PBR Props
- [x] 5.1 Downloaded 5 Poly Haven CC0 PBR military props: `ammo_box`, `old_military_crate`, `concrete_road_barrier`, `medical_box`, `coast_rocks_01` with diffuse, normal, roughness, and metallic textures.
- [x] 5.2 Created `EnvironmentAssetSetup.cs` configuring URP materials.
- [x] 5.3 Created dedicated open-world combat scene `Assets/Scenes/MilitaryOpenWorld.unity` (300m x 300m terrain).
- [x] 5.4 Placed tactical checkpoint barriers, ammo depot, and boulder cover positions in `CombatTestScene.unity`.

### Milestone 6: Realistic Military Vehicle Driving & Physics
- [x] 6.1 Implemented `MilitaryVehicleController.cs` with 4 WheelColliders, motor torque, speed-sensitive steering, brake force, and center of mass stabilization.
- [x] 6.2 Implemented driver enter/exit interaction (`[E]`) with camera target redirection and audio pitch scaling.

### Milestone 7: Tactical Enemy Combat AI & Battle Royale Foundation
- [x] 7.1 Implemented `TacticalEnemyAI.cs` using NavMesh with Patrol, Chase, Combat, and Death states, line-of-sight checks, and `IDamageable` integration.
- [x] 7.2 Implemented `BattleRoyaleZoneManager.cs` with shrinking safe zone circle, boundary damage ticking, match timer, and victory/defeat conditions.

### Milestone 8: Professional Military UI, Post-Processing, Polish & Verification
- [x] 8.1 Implemented `MilitaryHUD.cs` featuring dynamic crosshair, hit markers, health/armor bars, weapon/ammo display, 360° tactical compass bar, outside safe zone warning, and pause menu (`[ESC]`).
- [x] 8.2 Created `MilitaryCombatMasterValidator.cs` covering all 6 master validation suites with zero regressions.
- [x] 8.3 Configured clean `.gitignore` for Unity and verified zero compiler errors across both runtime and editor assemblies.
