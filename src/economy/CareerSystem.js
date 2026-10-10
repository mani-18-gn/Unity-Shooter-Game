// ROADBOUND - Living Economy, Taxi Driver Careers & Parcel Courier Delivery System
import * as THREE from 'three';

export class CareerSystem {
  constructor(gameState, hud, audioManager) {
    this.gameState = gameState;
    this.hud = hud;
    this.audio = audioManager;

    // Initialize player career records if absent
    if (!this.gameState.player.career) {
      this.gameState.player.career = {
        taxiFaresCompleted: 0,
        taxiEarnings: 0,
        taxiOnDuty: false,
        courierDeliveriesCompleted: 0,
        courierEarnings: 0,
        courierOnDuty: false,
        activeJob: null
      };
    }

    this.poiLocations = [
      { id: 'mall', name: 'The Strand Shopping Mall', pos: new THREE.Vector3(65, 0.5, -110) },
      { id: 'hospital', name: 'St. Jude Central Hospital', pos: new THREE.Vector3(-75, 0.5, 120) },
      { id: 'safehouse', name: 'Downtown Safehouse & Villa', pos: new THREE.Vector3(-36, 0.5, 36) },
      { id: 'harbor', name: 'Deepwater Container Port', pos: new THREE.Vector3(750, 0.8, 80) },
      { id: 'dam', name: 'Hydroelectric Dam Crest', pos: new THREE.Vector3(240, 28.2, -320) },
      { id: 'beach', name: 'White Sand Beach Promenade', pos: new THREE.Vector3(-620, 0.5, 480) },
      { id: 'airport', name: 'International Airport Terminal', pos: new THREE.Vector3(-220, 0.5, 550) },
      { id: 'temple', name: 'Shanti Heritage Temple', pos: new THREE.Vector3(-210, 0.5, -120) },
      { id: 'financial', name: 'Financial District Plaza', pos: new THREE.Vector3(0, 0.5, -120) }
    ];

    this.passengerNames = [
      'Maya Sen', 'Vikram Patel', 'Elena Cross', 'Arjun Mehta',
      'Sarah Connor', 'David Chen', 'Priya Sharma', 'Lucas Vance'
    ];

    this.courierItemNames = [
      'Emergency Medical Vaccines', 'Boutique Designer Apparel',
      'High-Speed GPU Servers', 'Fresh Coastal Seafood',
      'Industrial Turbine Bearings', 'Confidential Syndicate Drive'
    ];

    this.availableJobs = [];
    this.generateJobPool();
  }

  generateJobPool() {
    this.availableJobs = [];

    // 3 Taxi Rides
    for (let i = 0; i < 3; i++) {
      const pIdx = Math.floor(Math.random() * this.poiLocations.length);
      let dIdx = Math.floor(Math.random() * this.poiLocations.length);
      while (dIdx === pIdx) dIdx = Math.floor(Math.random() * this.poiLocations.length);

      const pickup = this.poiLocations[pIdx];
      const dropoff = this.poiLocations[dIdx];
      const dist = pickup.pos.distanceTo(dropoff.pos);
      const fare = Math.round(80 + dist * 0.22);
      const name = this.passengerNames[Math.floor(Math.random() * this.passengerNames.length)];

      this.availableJobs.push({
        id: `taxi_${Date.now()}_${i}`,
        type: 'taxi',
        title: `Passenger: ${name}`,
        passengerName: name,
        pickupName: pickup.name,
        pickupPos: pickup.pos.clone(),
        dropoffName: dropoff.name,
        dropoffPos: dropoff.pos.clone(),
        fare: fare,
        stage: 'pickup', // 'pickup' -> 'transit' -> 'completed'
        timeRemaining: null
      });
    }

    // 2 Courier Contracts
    for (let j = 0; j < 2; j++) {
      const pIdx = Math.floor(Math.random() * this.poiLocations.length);
      let dIdx = Math.floor(Math.random() * this.poiLocations.length);
      while (dIdx === pIdx) dIdx = Math.floor(Math.random() * this.poiLocations.length);

      const pickup = this.poiLocations[pIdx];
      const dropoff = this.poiLocations[dIdx];
      const dist = pickup.pos.distanceTo(dropoff.pos);
      const fare = Math.round(140 + dist * 0.35);
      const cargo = this.courierItemNames[Math.floor(Math.random() * this.courierItemNames.length)];
      const allottedSec = Math.max(90, Math.round(dist * 0.35));

      this.availableJobs.push({
        id: `courier_${Date.now()}_${j}`,
        type: 'courier',
        title: `Express Freight: ${cargo}`,
        cargoName: cargo,
        pickupName: pickup.name,
        pickupPos: pickup.pos.clone(),
        dropoffName: dropoff.name,
        dropoffPos: dropoff.pos.clone(),
        fare: fare,
        stage: 'transit',
        timeRemaining: allottedSec,
        maxTime: allottedSec
      });
    }
  }

  toggleTaxiDuty(onDuty) {
    this.gameState.player.career.taxiOnDuty = onDuty;
    if (this.audio) this.audio.playUIClick();
    if (this.hud) {
      this.hud.showCommsDialogue(
        'GIGWORK DISPATCH',
        onDuty ? 'TAXI SHIFT ACTIVE: Accept passenger ride requests via your smartphone [P].' : 'TAXI SHIFT ENDED.',
        3.5
      );
    }
    return this.gameState.player.career.taxiOnDuty;
  }

  toggleCourierDuty(onDuty) {
    this.gameState.player.career.courierOnDuty = onDuty;
    if (this.audio) this.audio.playUIClick();
    if (this.hud) {
      this.hud.showCommsDialogue(
        'GIGWORK DISPATCH',
        onDuty ? 'COURIER SHIFT ACTIVE: Accept high-priority express delivery contracts via your smartphone [P].' : 'COURIER SHIFT ENDED.',
        3.5
      );
    }
    return this.gameState.player.career.courierOnDuty;
  }

  acceptJob(jobId) {
    const job = this.availableJobs.find(j => j.id === jobId);
    if (!job) return false;

    this.gameState.player.career.activeJob = job;

    // Set first GPS waypoint target
    const target = job.stage === 'pickup' ? job.pickupPos : job.dropoffPos;
    this.gameState.gpsWaypoint = target;

    if (this.audio) this.audio.playGPSChime();
    if (this.hud) {
      const destName = job.stage === 'pickup' ? job.pickupName : job.dropoffName;
      this.hud.showCommsDialogue(
        'DISPATCH ASSIGNED',
        `CONTRACT ACCEPTED: ${job.title}. Head to ${destName.toUpperCase()}! Target waypoint set on GPS.`,
        4.0
      );
    }

    return true;
  }

  cancelActiveJob() {
    this.gameState.player.career.activeJob = null;
    this.gameState.gpsWaypoint = null;
    if (this.audio) this.audio.playUIClick();
    if (this.hud) {
      this.hud.showCommsDialogue('GIGWORK', 'Contract cancelled.', 2.5);
    }
  }

  update(delta, playerPos) {
    const job = this.gameState.player.career?.activeJob;
    if (!job || !playerPos) return;

    // 1. Courier delivery timer countdown
    if (job.type === 'courier' && job.timeRemaining !== null) {
      job.timeRemaining -= delta;
      if (job.timeRemaining <= 0) {
        // Delivery failed / expired
        if (this.hud) {
          this.hud.showCommsDialogue('DELIVERY EXPIRED', `Time expired for ${job.cargoName}! Contract voided.`, 3.5);
        }
        this.cancelActiveJob();
        return;
      }
    }

    // 2. Taxi Passenger Pickup Check
    if (job.type === 'taxi' && job.stage === 'pickup') {
      const distToPickup = playerPos.distanceTo(job.pickupPos);
      if (distToPickup < 14.0) {
        if (this.hud) {
          this.hud.showPrompt('F', `PICK UP PASSENGER (${job.passengerName.toUpperCase()})`);
        }

        // Auto-board or prompt
        if (this.gameState.player.inVehicle) {
          // Passenger boards
          job.stage = 'transit';
          this.gameState.gpsWaypoint = job.dropoffPos;
          if (this.audio) this.audio.playDoorSound(false);
          if (this.hud) {
            this.hud.showCommsDialogue(
              job.passengerName,
              `"Hello driver! Please take me to ${job.dropoffName}. Smooth ride, please!"`,
              4.5
            );
          }
        }
      }
    }

    // 3. Dropoff & Destination Arrival Check
    if (job.stage === 'transit') {
      const distToDropoff = playerPos.distanceTo(job.dropoffPos);
      if (distToDropoff < 16.0) {
        this.completeJob(job);
      }
    }
  }

  completeJob(job) {
    if (this.audio) this.audio.playSleepChime();

    let bonus = 0;
    if (job.type === 'taxi') {
      bonus = Math.round(20 + Math.random() * 45); // Customer tip
      const totalPayout = job.fare + bonus;
      this.gameState.player.cash += totalPayout;
      this.gameState.player.career.taxiFaresCompleted++;
      this.gameState.player.career.taxiEarnings += totalPayout;

      if (this.hud) {
        this.hud.showCommsDialogue(
          'FARE COMPLETED',
          `ARRIVED AT ${job.dropoffName.toUpperCase()}! Fare: $${job.fare} + 5-Star Tip: $${bonus} &bull; Total: <strong>+$${totalPayout}</strong>`,
          5.5
        );
      }
    } else if (job.type === 'courier') {
      const speedBonus = job.timeRemaining > 30 ? 60 : 20;
      const totalPayout = job.fare + speedBonus;
      this.gameState.player.cash += totalPayout;
      this.gameState.player.career.courierDeliveriesCompleted++;
      this.gameState.player.career.courierEarnings += totalPayout;

      if (this.hud) {
        this.hud.showCommsDialogue(
          'DELIVERY COMPLETED',
          `DELIVERED ${job.cargoName.toUpperCase()}! Payment: $${job.fare} + On-Time Bonus: $${speedBonus} &bull; Total: <strong>+$${totalPayout}</strong>`,
          5.5
        );
      }
    }

    // Clear active job and GPS route
    this.gameState.player.career.activeJob = null;
    this.gameState.gpsWaypoint = null;

    // Refresh job offers
    this.generateJobPool();
  }
}
