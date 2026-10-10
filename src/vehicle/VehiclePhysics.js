// ROADBOUND - Physically-Grounded Vehicle Dynamics Engine
import * as THREE from 'three';

export class VehiclePhysics {
  constructor(vehicleConfig = {}) {
    this.mass = vehicleConfig.mass || 1450; // kg
    this.topSpeedMph = vehicleConfig.topSpeedMph || 195;
    this.maxEngineForce = vehicleConfig.maxEngineForce || 6800; // N
    this.brakeForce = vehicleConfig.brakeForce || 9000;
    this.steerAngleMax = vehicleConfig.steerAngleMax || (Math.PI * 0.22); // 38 deg max lock
    this.suspensionRestLength = 0.45;
    this.springStiffness = 32000;
    this.springDamping = 3200;

    // Rigid body state vectors
    this.position = new THREE.Vector3(0, 0.5, 0);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.angularVelocity = new THREE.Vector3(0, 0, 0);
    this.quaternion = new THREE.Quaternion();

    this.heading = 0; // Yaw
    this.pitch = 0;
    this.roll = 0;

    // Dynamic telemetry
    this.speed = 0; // m/s
    this.speedMph = 0;
    this.currentSteer = 0;
    this.rpm = 800;
    this.currentGear = 1;
    this.slipAngle = 0;
    this.lateralG = 0;
    this.isAirborne = false;
    this.surfaceFriction = 1.0; // Asphalt default
  }

  setSurfaceType(type, wetness = 0.0) {
    let baseFriction = 1.0;
    if (type === 'dirt' || type === 'gravel') baseFriction = 0.72;
    else if (type === 'mud') baseFriction = 0.55;
    else if (type === 'grass') baseFriction = 0.65;
    else baseFriction = 1.0; // Asphalt

    // Wetness reduces friction
    this.surfaceFriction = baseFriction * (1.0 - wetness * 0.35);
  }

  update(delta, input, terrain, wheels) {
    if (delta <= 0) return;
    delta = Math.min(delta, 0.05); // Prevent physics tunneling

    // 1. Steering interpolation with speed-sensitive steering falloff
    const speedRatio = Math.min(1.0, this.speed / 50.0);
    const effectiveMaxSteer = this.steerAngleMax * (1.0 - speedRatio * 0.55);
    const targetSteer = input.steer * effectiveMaxSteer;
    this.currentSteer += (targetSteer - this.currentSteer) * (delta * 12.0);

    // 2. Local orientation vectors
    const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(this.quaternion);
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.quaternion);
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(this.quaternion);

    // 3. Ground height and suspension raycast
    const groundY = terrain.getGroundHeight(this.position.x, this.position.z);
    const chassisBottomY = this.position.y - 0.2;
    const compression = Math.max(0, (groundY + this.suspensionRestLength) - chassisBottomY);

    if (chassisBottomY <= groundY + this.suspensionRestLength + 0.1) {
      this.isAirborne = false;
    } else {
      this.isAirborne = true;
    }

    // 4. Engine Torque & Transmission Gearing
    const forwardSpeed = this.velocity.dot(forward);
    this.speed = Math.abs(forwardSpeed);
    this.speedMph = Math.round(this.speed * 2.23694);

    // Auto-shifting 6-speed logic
    const gearRatios = [3.8, 2.6, 1.9, 1.4, 1.05, 0.82];
    const gearMaxSpeeds = [14, 28, 42, 58, 74, 92]; // m/s
    for (let g = 0; g < gearMaxSpeeds.length; g++) {
      if (this.speed < gearMaxSpeeds[g] || g === gearMaxSpeeds.length - 1) {
        this.currentGear = g + 1;
        break;
      }
    }

    // RPM Calculation (Idle: 800, Redline: 8500)
    const ratio = gearRatios[this.currentGear - 1];
    const engineRpmTarget = 800 + Math.abs(forwardSpeed) * (7000 / (gearMaxSpeeds[this.currentGear - 1] || 90));
    this.rpm += (engineRpmTarget - this.rpm) * (delta * 8.0);
    if (this.rpm > 8500) this.rpm = 8500;

    // 5. Forces calculation
    const totalForce = new THREE.Vector3(0, 0, 0);

    // Suspension upward normal force
    if (!this.isAirborne) {
      const springForceMag = compression * this.springStiffness - this.velocity.y * this.springDamping;
      totalForce.addScaledVector(up, Math.max(0, springForceMag));
    } else {
      // Gravity in air
      totalForce.y -= 9.81 * this.mass;
    }

    // Longitudinal drive & braking force
    let driveForce = 0;
    if (input.throttle > 0) {
      if (forwardSpeed < -1.0) {
        // Moving backward and pressing W: acts as brake to cancel reverse
        driveForce = this.brakeForce;
      } else if (this.speedMph < this.topSpeedMph) {
        driveForce = input.throttle * this.maxEngineForce * Math.max(1.2, ratio) * this.surfaceFriction;
      }
    } else if (input.throttle < 0) {
      if (forwardSpeed > 1.5) {
        // Moving forward and pressing S: acts as brake to slow down
        driveForce = -this.brakeForce;
      } else {
        // Stopped or reversing: reverse smoothly
        driveForce = input.throttle * (this.maxEngineForce * 0.75);
      }
    }

    // Handbrake: breaks rear axle grip into power drift
    let rearTireGrip = 1.0;
    if (input.handbrake) {
      rearTireGrip = 0.28;
      driveForce *= 0.3;
      if (forwardSpeed > 0.5) {
        driveForce -= this.brakeForce * 0.8;
      } else if (forwardSpeed < -0.5) {
        driveForce += this.brakeForce * 0.8;
      }
    }

    totalForce.addScaledVector(forward, driveForce);

    // Lateral tire friction (Pacejka model approximation)
    const lateralSpeed = this.velocity.dot(right);
    this.slipAngle = Math.abs(lateralSpeed) / (Math.max(1.0, this.speed) + 0.1);

    const corneringStiffness = 38000 * this.surfaceFriction * rearTireGrip;
    const lateralFrictionForce = -lateralSpeed * corneringStiffness;
    totalForce.addScaledVector(right, lateralFrictionForce);

    // Aerodynamic drag & rolling resistance
    const dragCoeff = 0.32;
    const aeroDrag = -0.5 * 1.225 * dragCoeff * 2.2 * this.speed * forwardSpeed;
    const rollingResistance = -this.mass * 9.81 * 0.015 * Math.sign(forwardSpeed);
    totalForce.addScaledVector(forward, aeroDrag + rollingResistance);

    // 6. Integrate linear velocity & position
    const accel = totalForce.clone().divideScalar(this.mass);
    this.velocity.addScaledVector(accel, delta);

    // ALWAYS apply velocity displacement to position (Fixed critical bug where car was frozen on ground!)
    this.position.addScaledVector(this.velocity, delta);

    if (!this.isAirborne) {
      const currentGroundY = terrain.getGroundHeight(this.position.x, this.position.z);
      this.position.y = currentGroundY + 0.38 + compression * 0.05;
      this.velocity.y = 0;
    }

    // 7. Yaw rotation from front wheel steering
    if (!this.isAirborne) {
      const effectiveSpeed = Math.max(2.4, Math.abs(forwardSpeed));
      const turnDir = forwardSpeed < -0.5 ? -1 : 1;
      const turnRadiusSpeed = (effectiveSpeed / 2.8) * turnDir;
      const yawRate = turnRadiusSpeed * Math.tan(this.currentSteer);
      this.heading += yawRate * delta;

      // Pitch & Roll inertia weight transfer
      const accelG = accel.dot(forward) / 9.81;
      this.pitch += (-accelG * 0.04 - this.pitch) * (delta * 6.0);

      this.lateralG = lateralSpeed * forwardSpeed * 0.02;
      const targetRoll = -this.lateralG * (input.handbrake ? 0.08 : 0.04);
      this.roll += (targetRoll - this.roll) * (delta * 8.0);

      // Pronounced motorcycle lean banking into turns
      if (wheels && wheels.length === 2) {
        const bikeLean = -this.currentSteer * Math.min(1.0, forwardSpeed / 8.0) * 1.35;
        this.roll += (bikeLean - this.roll) * (delta * 10.0);
      }
    }

    // Apply orientation
    const euler = new THREE.Euler(this.pitch, this.heading, this.roll, 'YXZ');
    this.quaternion.setFromEuler(euler);

    // 8. Visual Wheel updates (steering angle & spin rotation)
    if (wheels) {
      const wheelCircumference = 2 * Math.PI * 0.38;
      const spinAngleDelta = (forwardSpeed / wheelCircumference) * Math.PI * 2 * delta;

      wheels.forEach(w => {
        // Steer front wheels
        if (w.isFront) {
          w.hub.rotation.y = this.currentSteer;
        }
        // Rotate tire
        w.rotator.rotation.x += spinAngleDelta;
      });
    }
  }

  applyImpactImpulse(impulseVector) {
    this.velocity.addScaledVector(impulseVector.clone().divideScalar(this.mass), 1.0);
    this.angularVelocity.y += (Math.random() - 0.5) * 2.0;
  }
}
