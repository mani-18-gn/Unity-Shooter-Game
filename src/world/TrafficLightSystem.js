// ROADBOUND - Multi-Intersection Traffic Light Controller & Signal Architecture
import * as THREE from 'three';

export class TrafficLightSystem {
  constructor(scene, terrain) {
    this.scene = scene;
    this.terrain = terrain;

    this.signals = [];
    this.cycleTimer = 0;
    this.greenDuration = 14.0;
    this.amberDuration = 3.5;
    this.redDuration = 17.5; // (green + amber of opposing phase)
    this.totalCycle = this.greenDuration + this.amberDuration + this.redDuration; // 35.0s

    this.initIntersectionSignals();
  }

  initIntersectionSignals() {
    const intersections = [
      { id: 1, x: 0, z: -120, name: 'Financial District Plaza' },
      { id: 2, x: 0, z: 0, name: 'Grand Central Crossroads' },
      { id: 3, x: 0, z: 120, name: 'Commercial Crossway' },
      { id: 4, x: 0, z: 240, name: 'South Highway Interchange' },
      { id: 6, x: 240, z: 0, name: 'East Crosstown Avenue' },
      { id: 8, x: -280, z: 200, name: 'Coastal Boulevard Incline' }
    ];

    intersections.forEach(inter => {
      const y = this.terrain.getGroundHeight(inter.x, inter.z);
      const group = new THREE.Group();
      group.name = `TrafficLight_${inter.id}`;
      group.position.set(inter.x, y, inter.z);

      // Create 4 Signal Heads (North, South, East, West approaches)
      const signalHeads = [];
      const approaches = [
        { dir: 'NS', x: -9, z: 9, rotY: 0 },         // Facing South
        { dir: 'NS', x: 9, z: -9, rotY: Math.PI },   // Facing North
        { dir: 'EW', x: -9, z: -9, rotY: Math.PI * 0.5 }, // Facing East
        { dir: 'EW', x: 9, z: 9, rotY: -Math.PI * 0.5 }   // Facing West
      ];

      approaches.forEach(app => {
        const headGroup = this.buildSignalPole();
        headGroup.position.set(app.x, 0, app.z);
        headGroup.rotation.y = app.rotY;
        group.add(headGroup);

        signalHeads.push({
          dir: app.dir,
          headGroup: headGroup,
          redLens: headGroup.userData.redLens,
          amberLens: headGroup.userData.amberLens,
          greenLens: headGroup.userData.greenLens,
          pointLight: headGroup.userData.pointLight
        });
      });

      // Road Surface Zebra Crossings (White thermoplastic stripes)
      this.createZebraCrossings(group);

      this.scene.add(group);

      this.signals.push({
        id: inter.id,
        x: inter.x,
        y: y,
        z: inter.z,
        radius: 18.0,
        signalHeads: signalHeads,
        currentPhaseNS: 'green', // 'green', 'amber', 'red'
        currentPhaseEW: 'red'
      });
    });
  }

  buildSignalPole() {
    const group = new THREE.Group();

    // Steel post (black textured steel)
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x1f242d, roughness: 0.6, metalness: 0.8 });
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 6.2, 10), poleMat);
    pole.position.y = 3.1;
    pole.castShadow = true;
    group.add(pole);

    // Cantilever horizontal arm over road lane
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 4.2, 8), poleMat);
    arm.rotation.z = Math.PI / 2;
    arm.position.set(2.0, 5.8, 0);
    group.add(arm);

    // Traffic Light Signal Housing Box
    const boxMat = new THREE.MeshStandardMaterial({ color: 0x111317, roughness: 0.7 });
    const box = new THREE.Mesh(new THREE.BoxGeometry(0.52, 1.4, 0.35), boxMat);
    box.position.set(3.2, 5.2, 0);
    box.castShadow = true;
    group.add(box);

    // Visors / Hoods over lenses
    [-0.38, 0, 0.38].forEach(ly => {
      const visor = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.18, 12, 1, true, 0, Math.PI), boxMat);
      visor.rotation.x = Math.PI / 2;
      visor.position.set(3.2, 5.2 + ly, 0.18);
      group.add(visor);
    });

    // 3 Lenses: Red (top), Amber (middle), Green (bottom)
    const lensGeo = new THREE.CircleGeometry(0.13, 16);

    const redLens = new THREE.Mesh(lensGeo, new THREE.MeshStandardMaterial({
      color: 0xff1744,
      emissive: 0xff1744,
      emissiveIntensity: 0.2
    }));
    redLens.position.set(3.2, 5.58, 0.18);
    group.add(redLens);

    const amberLens = new THREE.Mesh(lensGeo, new THREE.MeshStandardMaterial({
      color: 0xffab00,
      emissive: 0xffab00,
      emissiveIntensity: 0.2
    }));
    amberLens.position.set(3.2, 5.2, 0.18);
    group.add(amberLens);

    const greenLens = new THREE.Mesh(lensGeo, new THREE.MeshStandardMaterial({
      color: 0x00e676,
      emissive: 0x00e676,
      emissiveIntensity: 2.2 // Green on by default for NS
    }));
    greenLens.position.set(3.2, 4.82, 0.18);
    group.add(greenLens);

    // Glowing active point light
    const pointLight = new THREE.PointLight(0x00e676, 1.5, 12);
    pointLight.position.set(3.2, 5.0, 0.8);
    group.add(pointLight);

    group.userData = { redLens, amberLens, greenLens, pointLight };
    return group;
  }

  createZebraCrossings(group) {
    const zebraMat = new THREE.MeshStandardMaterial({
      color: 0xf5f7fa,
      roughness: 0.9,
      metalness: 0.05
    });

    // 4 Crosswalks around junction
    const crosswalkOffsets = [
      { x: 0, z: 9, rot: 0 },
      { x: 0, z: -9, rot: 0 },
      { x: 9, z: 0, rot: Math.PI / 2 },
      { x: -9, z: 0, rot: Math.PI / 2 }
    ];

    crosswalkOffsets.forEach(cw => {
      for (let s = -3.5; s <= 3.5; s += 1.0) {
        const stripe = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 2.8), zebraMat);
        stripe.rotateX(-Math.PI / 2);
        stripe.position.set(cw.x + (cw.rot === 0 ? s : 0), 0.02, cw.z + (cw.rot !== 0 ? s : 0));
        stripe.rotation.z = cw.rot;
        group.add(stripe);
      }
    });
  }

  update(delta) {
    this.cycleTimer = (this.cycleTimer + delta) % this.totalCycle;

    // Phase schedule:
    // 0.0 to 14.0s: NS Green, EW Red
    // 14.0 to 17.5s: NS Amber, EW Red
    // 17.5 to 31.5s: NS Red, EW Green
    // 31.5 to 35.0s: NS Red, EW Amber

    let phaseNS = 'red';
    let phaseEW = 'red';

    if (this.cycleTimer < this.greenDuration) {
      phaseNS = 'green';
      phaseEW = 'red';
    } else if (this.cycleTimer < this.greenDuration + this.amberDuration) {
      phaseNS = 'amber';
      phaseEW = 'red';
    } else if (this.cycleTimer < this.greenDuration + this.amberDuration + this.greenDuration) {
      phaseNS = 'red';
      phaseEW = 'green';
    } else {
      phaseNS = 'red';
      phaseEW = 'amber';
    }

    this.signals.forEach(sig => {
      sig.currentPhaseNS = phaseNS;
      sig.currentPhaseEW = phaseEW;

      sig.signalHeads.forEach(sh => {
        const activePhase = sh.dir === 'NS' ? phaseNS : phaseEW;

        sh.redLens.material.emissiveIntensity = activePhase === 'red' ? 2.5 : 0.15;
        sh.amberLens.material.emissiveIntensity = activePhase === 'amber' ? 2.5 : 0.15;
        sh.greenLens.material.emissiveIntensity = activePhase === 'green' ? 2.5 : 0.15;

        if (sh.pointLight) {
          if (activePhase === 'red') {
            sh.pointLight.color.setHex(0xff1744);
            sh.pointLight.intensity = 1.2;
          } else if (activePhase === 'amber') {
            sh.pointLight.color.setHex(0xffab00);
            sh.pointLight.intensity = 1.2;
          } else {
            sh.pointLight.color.setHex(0x00e676);
            sh.pointLight.intensity = 1.4;
          }
        }
      });
    });
  }

  // Returns true if the traffic light is RED for an entity approaching target intersection
  isLightRedAt(nodeId, incomingDirVector) {
    const signal = this.signals.find(s => s.id === nodeId);
    if (!signal) return false;

    // Check whether incoming direction is closer to North-South (Z-axis) or East-West (X-axis)
    const isNorthSouth = Math.abs(incomingDirVector.z) >= Math.abs(incomingDirVector.x);
    const activePhase = isNorthSouth ? signal.currentPhaseNS : signal.currentPhaseEW;

    return activePhase === 'red' || activePhase === 'amber';
  }
}
