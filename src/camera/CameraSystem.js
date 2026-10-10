// ROADBOUND - Multi-Mode Dynamic Camera System
import * as THREE from 'three';

export class CameraSystem {
  constructor(camera, settingsManager) {
    this.camera = camera;
    this.settings = settingsManager;

    this.mode = 'third_person'; // 'third_person', 'vehicle_chase', 'vehicle_cockpit', 'cinematic_menu'
    this.orbitYaw = 0;
    this.orbitPitch = 0.25;

    this.currentPosition = new THREE.Vector3(0, 5, 10);
    this.targetLookAt = new THREE.Vector3(0, 1.5, 0);

    // Spring arm damping
    this.chaseDistance = 6.2;
    this.chaseHeight = 2.2;
    this.shakeIntensity = 0;
  }

  setMode(mode) {
    this.mode = mode;
  }

  cycleVehicleCamera() {
    if (this.mode === 'vehicle_chase') {
      this.mode = 'vehicle_cockpit';
    } else {
      this.mode = 'vehicle_chase';
    }
  }

  cycleOnFootCamera() {
    if (this.mode === 'third_person') {
      this.mode = 'first_person';
    } else {
      this.mode = 'third_person';
    }
    return this.mode;
  }

  update(delta, input, targetEntity, isPlayerInVehicle) {
    const mouseSens = this.settings.settings.controls.mouseSensitivity;

    // 1. Mouse Look orbit controls (with strict NaN safety guards)
    if (isNaN(this.orbitYaw)) this.orbitYaw = 0;
    if (isNaN(this.orbitPitch)) this.orbitPitch = 0.25;
    if (isNaN(this.currentPosition.x)) this.currentPosition.set(0, 5, 10);
    if (isNaN(this.targetLookAt.x)) this.targetLookAt.set(0, 1.5, 0);

    const dx = isNaN(input.mouse.deltaX) ? 0 : input.mouse.deltaX;
    const dy = isNaN(input.mouse.deltaY) ? 0 : input.mouse.deltaY;
    this.orbitYaw -= dx * mouseSens;
    const pitchDelta = dy * mouseSens * (this.settings.settings.controls.invertY ? -1 : 1);
    this.orbitPitch = Math.max(-0.6, Math.min(1.2, this.orbitPitch + pitchDelta));

    if (this.mode === 'cinematic_menu') {
      // Majestic turntable orbit around showcase vehicle / Marcus
      this.orbitYaw += delta * 0.2;
      const radius = 6.8;
      const centerX = targetEntity?.physics?.position?.x ?? 0;
      const centerY = (targetEntity?.physics?.position?.y ?? 0.5) + 0.6;
      const centerZ = targetEntity?.physics?.position?.z ?? 10;

      const targetPos = new THREE.Vector3(
        centerX + Math.sin(this.orbitYaw) * radius,
        centerY + 1.6 + Math.sin(this.orbitYaw * 0.5) * 0.4,
        centerZ + Math.cos(this.orbitYaw) * radius
      );
      this.camera.position.copy(targetPos);
      this.camera.lookAt(centerX, centerY, centerZ);
      this.camera.fov = 52;
      this.camera.updateProjectionMatrix();
      return;
    }

    if (isPlayerInVehicle && targetEntity) {
      // In Vehicle Camera Modes
      const vehPos = targetEntity.physics.position;
      const vehHeading = targetEntity.physics.heading;
      const vehSpeed = targetEntity.physics.speedMph;

      if (this.mode === 'vehicle_cockpit') {
        // First-person cockpit view
        const cockpitOffset = new THREE.Vector3(
          -0.4,
          1.05,
          0.1
        ).applyQuaternion(targetEntity.physics.quaternion);

        this.camera.position.copy(vehPos).add(cockpitOffset);

        const lookDir = new THREE.Vector3(0, -0.05, 5).applyQuaternion(targetEntity.physics.quaternion);
        this.camera.lookAt(this.camera.position.clone().add(lookDir));
        this.camera.fov = 68 + Math.min(15, vehSpeed * 0.12);
      } else {
        // Dynamic Vehicle Chase Camera (Spring-Arm)
        const targetDist = this.chaseDistance + Math.min(2.5, vehSpeed * 0.035);
        const targetH = this.chaseHeight + Math.min(0.8, vehSpeed * 0.01);

        // Follow behind car rotation with slight manual orbit yaw offset
        const camYaw = vehHeading + Math.PI + this.orbitYaw * 0.4;
        const desiredX = vehPos.x + Math.sin(camYaw) * targetDist;
        const desiredZ = vehPos.z + Math.cos(camYaw) * targetDist;
        const desiredY = vehPos.y + targetH + this.orbitPitch * 2.0;

        const desiredPos = new THREE.Vector3(desiredX, desiredY, desiredZ);
        this.currentPosition.lerp(desiredPos, delta * 9.0);

        // High speed camera shake
        if (vehSpeed > 80) {
          const shake = (vehSpeed - 80) * 0.0004;
          this.currentPosition.x += (Math.random() - 0.5) * shake;
          this.currentPosition.y += (Math.random() - 0.5) * shake;
        }

        this.camera.position.copy(this.currentPosition);

        const lookTarget = vehPos.clone().add(new THREE.Vector3(0, 1.1, 0));
        this.targetLookAt.lerp(lookTarget, delta * 12.0);
        this.camera.lookAt(this.targetLookAt);

        // Dynamic speed FOV widening (Speed tunnel sensation)
        this.camera.fov = 58 + Math.min(24, vehSpeed * 0.18);
      }
    } else if (targetEntity) {
      const playerPos = targetEntity.position || targetEntity.physics?.position || targetEntity.root?.position || new THREE.Vector3(0, 1.2, 0);
      const isAiming = input?.aim || false;

      if (this.mode === 'first_person') {
        // High-immersion First-Person Eyes-Level Camera View
        const eyeHeight = targetEntity.character?.gender === 'female' ? 1.48 : 1.62;
        const headPos = playerPos.clone().add(new THREE.Vector3(0, eyeHeight, 0));
        this.camera.position.copy(headPos);

        const lookDir = new THREE.Vector3(
          -Math.sin(this.orbitYaw) * Math.cos(this.orbitPitch),
          Math.sin(this.orbitPitch),
          -Math.cos(this.orbitYaw) * Math.cos(this.orbitPitch)
        );
        this.camera.lookAt(this.camera.position.clone().add(lookDir));

        if (targetEntity.character) {
          targetEntity.character.setFirstPerson(true);
        }

        const targetFov = isAiming ? 48 : 75;
        this.camera.fov += (targetFov - this.camera.fov) * (delta * 14.0);
      } else {
        // On-Foot Third Person Over-The-Shoulder Camera (AAA Shooter Framing)
        if (targetEntity.character) {
          targetEntity.character.setFirstPerson(false);
        }

        const camDist = isAiming ? 1.7 : 3.2;
        const shoulderOffset = isAiming ? 0.55 : 0.42;
        const camHeight = isAiming ? 1.55 : 1.65;

        const rightVec = new THREE.Vector3(Math.cos(this.orbitYaw), 0, -Math.sin(this.orbitYaw));
        const backVec = new THREE.Vector3(Math.sin(this.orbitYaw), 0, Math.cos(this.orbitYaw));

        const targetPos = playerPos.clone()
          .add(backVec.multiplyScalar(camDist * Math.cos(this.orbitPitch)))
          .add(rightVec.multiplyScalar(shoulderOffset))
          .add(new THREE.Vector3(0, camHeight + Math.sin(this.orbitPitch) * camDist, 0));

        this.currentPosition.lerp(targetPos, Math.min(1.0, delta * 18.0));
        this.camera.position.copy(this.currentPosition);

        // Aim downrange along yaw and pitch so crosshair aligns with center screen
        const forward = new THREE.Vector3(
          -Math.sin(this.orbitYaw) * Math.cos(this.orbitPitch),
          Math.sin(this.orbitPitch),
          -Math.cos(this.orbitYaw) * Math.cos(this.orbitPitch)
        );
        this.camera.lookAt(this.camera.position.clone().add(forward.multiplyScalar(50)));

        const targetFov = isAiming ? 44 : 60;
        this.camera.fov += (targetFov - this.camera.fov) * (delta * 14.0);
      }
    }

    this.camera.updateProjectionMatrix();
  }
}
