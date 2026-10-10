// ROADBOUND - Civic Mega Landmarks, Industrial Manufacturing, Gantry Cranes & Hydroelectric Dam
import * as THREE from 'three';

export class LandmarksAndIndustrySystem {
  constructor(scene, terrain, audioManager) {
    this.scene = scene;
    this.terrain = terrain;
    this.audio = audioManager;

    this.group = new THREE.Group();
    this.group.name = 'LandmarksAndIndustryWorld';
    this.scene.add(this.group);

    // Dynamic Smoke & Water Particles
    this.smokeParticles = [];
    this.spillwayWaterMesh = null;
    this.waterTextureOffset = 0;

    // Dam location for spatial audio
    this.damPosition = new THREE.Vector3(240, 14, -320);

    // Build world segments
    this.initCivicLandmarks();
    this.initIndustrialZone();
    this.initHarborContainerTerminal();
    this.initHydroelectricDam();
  }

  // =========================================================================
  // 1. URBAN CIVIC LANDMARKS (MALL, HOSPITAL, METRO, TEMPLE)
  // =========================================================================
  initCivicLandmarks() {
    // -----------------------------------------------------------------------
    // A. Blackshore Metropolis Grand Shopping Mall (x: 65, z: -110)
    // -----------------------------------------------------------------------
    const mallGroup = new THREE.Group();
    mallGroup.position.set(65, 0.2, -110);
    this.group.add(mallGroup);

    const mallGlassMat = new THREE.MeshPhysicalMaterial({
      color: 0x88ccff,
      roughness: 0.1,
      metalness: 0.2,
      transmission: 0.8,
      transparent: true,
      opacity: 0.6
    });

    const mallFacadeMat = new THREE.MeshStandardMaterial({
      color: 0xeef1f6,
      roughness: 0.35,
      metalness: 0.2
    });

    // Main 3-Story Mall Structure
    const mallMain = new THREE.Mesh(new THREE.BoxGeometry(54, 16, 36), mallFacadeMat);
    mallMain.position.set(0, 8, 0);
    mallMain.castShadow = true;
    mallMain.receiveShadow = true;
    mallGroup.add(mallMain);
    this.registerCollider(mallMain);

    // Panoramic Curved Glass Entrance Atrium
    const atrium = new THREE.Mesh(new THREE.CylinderGeometry(14, 14, 14, 24, 1, false, 0, Math.PI), mallGlassMat);
    atrium.position.set(0, 7, 18);
    mallGroup.add(atrium);

    // Glowing Neon Mall Signboard
    const mallSignGeo = new THREE.BoxGeometry(26, 3.2, 0.6);
    const mallSignMat = new THREE.MeshStandardMaterial({
      color: 0xe6a12b,
      emissive: 0xe6a12b,
      emissiveIntensity: 1.5
    });
    const mallSign = new THREE.Mesh(mallSignGeo, mallSignMat);
    mallSign.position.set(0, 15.5, 18.2);
    mallGroup.add(mallSign);

    // Secondary Storefront Billboards
    const brands = [
      { text: 'CYBERTECH', color: 0x00e5ff, x: -16 },
      { text: 'CINEMA 4D', color: 0xff3344, x: 16 }
    ];
    brands.forEach(b => {
      const bSign = new THREE.Mesh(
        new THREE.BoxGeometry(10, 2.2, 0.4),
        new THREE.MeshStandardMaterial({ color: b.color, emissive: b.color, emissiveIntensity: 1.2 })
      );
      bSign.position.set(b.x, 11, 18.3);
      mallGroup.add(bSign);
    });

    // Plaza Fountain
    const fountainBase = new THREE.Mesh(
      new THREE.CylinderGeometry(4.5, 5.0, 0.8, 20),
      new THREE.MeshStandardMaterial({ color: 0x3a4049, roughness: 0.6 })
    );
    fountainBase.position.set(0, 0.4, 28);
    mallGroup.add(fountainBase);

    // -----------------------------------------------------------------------
    // B. St. Jude Blackshore Central Medical Hospital (x: -75, z: 120)
    // -----------------------------------------------------------------------
    const hospGroup = new THREE.Group();
    hospGroup.position.set(-75, 0.2, 120);
    this.group.add(hospGroup);

    const hospMat = new THREE.MeshStandardMaterial({
      color: 0xf5f7fa,
      roughness: 0.3,
      metalness: 0.1
    });

    const hospGlassMat = new THREE.MeshStandardMaterial({
      color: 0x1b3b5a,
      roughness: 0.2,
      metalness: 0.7
    });

    // Main 8-Story Hospital Tower
    const hospTower = new THREE.Mesh(new THREE.BoxGeometry(38, 28, 28), hospMat);
    hospTower.position.set(0, 14, 0);
    hospTower.castShadow = true;
    hospGroup.add(hospTower);
    this.registerCollider(hospTower);

    // Glass Window Bands
    for (let f = 1; f <= 6; f++) {
      const windowBand = new THREE.Mesh(new THREE.BoxGeometry(38.4, 1.6, 26), hospGlassMat);
      windowBand.position.set(0, f * 3.8 + 2, 0);
      hospGroup.add(windowBand);
    }

    // Glowing Red Cross Symbol (+)
    const crossMat = new THREE.MeshStandardMaterial({ color: 0xff1744, emissive: 0xff1744, emissiveIntensity: 2.0 });
    const crossV = new THREE.Mesh(new THREE.BoxGeometry(1.8, 6.0, 0.4), crossMat);
    crossV.position.set(0, 24, 14.3);
    hospGroup.add(crossV);

    const crossH = new THREE.Mesh(new THREE.BoxGeometry(6.0, 1.8, 0.4), crossMat);
    crossH.position.set(0, 24, 14.3);
    hospGroup.add(crossH);

    // Emergency Ambulance Canopy
    const ambCanopy = new THREE.Mesh(
      new THREE.BoxGeometry(16, 0.4, 10),
      new THREE.MeshStandardMaterial({ color: 0x22262e })
    );
    ambCanopy.position.set(0, 4.5, 19);
    hospGroup.add(ambCanopy);

    // Rooftop Emergency Helipad
    const helipad = new THREE.Mesh(
      new THREE.CylinderGeometry(8.5, 8.5, 0.3, 24),
      new THREE.MeshStandardMaterial({ color: 0x2c323d, roughness: 0.8 })
    );
    helipad.position.set(0, 28.2, 0);
    hospGroup.add(helipad);

    // Painted Yellow Landing Ring & "H"
    const heliRing = new THREE.Mesh(
      new THREE.RingGeometry(6.5, 7.2, 24),
      new THREE.MeshBasicMaterial({ color: 0xffd600, side: THREE.DoubleSide })
    );
    heliRing.rotateX(-Math.PI * 0.5);
    heliRing.position.set(0, 28.4, 0);
    hospGroup.add(heliRing);

    // -----------------------------------------------------------------------
    // C. Elevated Grand Central Metro Viaduct & High-Speed Train (x: 0, z: 0)
    // -----------------------------------------------------------------------
    const metroGroup = new THREE.Group();
    metroGroup.position.set(0, 0, 0);
    this.group.add(metroGroup);

    const viaductHeight = 7.5;
    const viaductMat = new THREE.MeshStandardMaterial({ color: 0x474d57, roughness: 0.7, metalness: 0.2 });

    // Elevated concrete rail deck spanning across downtown (Z: -60 to +60)
    const railDeck = new THREE.Mesh(new THREE.BoxGeometry(8.5, 1.2, 140), viaductMat);
    railDeck.position.set(16, viaductHeight, 0);
    railDeck.receiveShadow = true;
    metroGroup.add(railDeck);

    // Concrete Support Pillars
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x363c45, roughness: 0.8 });
    for (let pz = -60; pz <= 60; pz += 25) {
      const pil = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.5, viaductHeight, 12), pillarMat);
      pil.position.set(16, viaductHeight * 0.5, pz);
      pil.castShadow = true;
      metroGroup.add(pil);
      this.registerCollider(pil);
    }

    // Metro Station Platform
    const platform = new THREE.Mesh(new THREE.BoxGeometry(14, 0.8, 48), viaductMat);
    platform.position.set(16, viaductHeight + 0.8, 0);
    metroGroup.add(platform);

    // Modern Curved Glass Station Canopy
    const canopyGeo = new THREE.CylinderGeometry(8, 8, 46, 16, 1, false, 0, Math.PI);
    const canopyMat = new THREE.MeshPhysicalMaterial({ color: 0x00e5ff, transmission: 0.7, opacity: 0.5, transparent: true });
    const canopy = new THREE.Mesh(canopyGeo, canopyMat);
    canopy.position.set(16, viaductHeight + 4.8, 0);
    canopy.rotation.z = Math.PI * 0.5;
    canopy.rotation.x = Math.PI * 0.5;
    metroGroup.add(canopy);

    // Streamlined Modern Metro Train (Silver & Cyan livery)
    const trainMat = new THREE.MeshStandardMaterial({ color: 0xdce2ec, metalness: 0.8, roughness: 0.2 });
    const trainCyan = new THREE.MeshStandardMaterial({ color: 0x00e5ff, emissive: 0x00e5ff, emissiveIntensity: 0.6 });
    for (let c = 0; c < 2; c++) {
      const carGroup = new THREE.Group();
      carGroup.position.set(13.8, viaductHeight + 2.5, -12 + c * 24);
      metroGroup.add(carGroup);

      const carBody = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.8, 22), trainMat);
      carGroup.add(carBody);

      // Window stripe
      const winStripe = new THREE.Mesh(new THREE.BoxGeometry(3.3, 0.7, 20), trainCyan);
      winStripe.position.y = 0.2;
      carGroup.add(winStripe);

      // Headlight
      if (c === 0) {
        const headlight = new THREE.Mesh(
          new THREE.SphereGeometry(0.3, 8, 8),
          new THREE.MeshBasicMaterial({ color: 0xffffff })
        );
        headlight.position.set(0, 0, -11.1);
        carGroup.add(headlight);
      }
    }

    // -----------------------------------------------------------------------
    // D. Serene Heritage Temple & Shrine Sanctum (x: -210, z: -120)
    // -----------------------------------------------------------------------
    const templeGroup = new THREE.Group();
    templeGroup.position.set(-210, 0.2, -120);
    this.group.add(templeGroup);

    const stoneMat = new THREE.MeshStandardMaterial({ color: 0xb5a794, roughness: 0.85 });
    const goldRoofMat = new THREE.MeshStandardMaterial({ color: 0xd4a017, metalness: 0.65, roughness: 0.3 });
    const vermilionMat = new THREE.MeshStandardMaterial({ color: 0xc92a2a, roughness: 0.6 });

    // Stone Foundation Plinth
    const plinth = new THREE.Mesh(new THREE.BoxGeometry(28, 1.8, 28), stoneMat);
    plinth.position.y = 0.9;
    plinth.receiveShadow = true;
    templeGroup.add(plinth);
    this.registerCollider(plinth);

    // Sanctum Hall
    const sanctum = new THREE.Mesh(new THREE.BoxGeometry(16, 7.5, 16), stoneMat);
    sanctum.position.y = 5.5;
    templeGroup.add(sanctum);

    // Multi-Tier Pagoda / Shikhara Spire
    for (let t = 0; t < 4; t++) {
      const tierSize = 18 - t * 3.5;
      const tierHeight = 1.6;
      const tierRoof = new THREE.Mesh(new THREE.BoxGeometry(tierSize, tierHeight, tierSize), goldRoofMat);
      tierRoof.position.y = 9.5 + t * 2.2;
      tierRoof.castShadow = true;
      templeGroup.add(tierRoof);
    }

    // Golden Pinnacle Kalash Spire
    const spire = new THREE.Mesh(new THREE.ConeGeometry(1.4, 5.0, 12), goldRoofMat);
    spire.position.y = 19.5;
    templeGroup.add(spire);

    // Grand Entrance Arch / Torii Gateway
    const toriiPillarL = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.45, 7.5, 12), vermilionMat);
    toriiPillarL.position.set(-4.5, 3.75, 18);
    templeGroup.add(toriiPillarL);

    const toriiPillarR = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.45, 7.5, 12), vermilionMat);
    toriiPillarR.position.set(4.5, 3.75, 18);
    templeGroup.add(toriiPillarR);

    const toriiBeam = new THREE.Mesh(new THREE.BoxGeometry(12, 0.8, 0.8), vermilionMat);
    toriiBeam.position.set(0, 7.2, 18);
    templeGroup.add(toriiBeam);

    // 4 Traditional Brass Diya Oil Lamps with warm flickering light
    for (let d = 0; d < 4; d++) {
      const dx = (d % 2 === 0 ? -6 : 6);
      const dz = (d < 2 ? 6 : -6);
      const lampMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.2, 1.2, 10), goldRoofMat);
      lampMesh.position.set(dx, 2.4, dz);
      templeGroup.add(lampMesh);

      const diyaLight = new THREE.PointLight(0xff9922, 0.8, 6.0, 1.5);
      diyaLight.position.set(dx, 3.1, dz);
      templeGroup.add(diyaLight);
    }
  }

  // =========================================================================
  // 2. INDUSTRIAL MANUFACTURING & SMOKING CHIMNEYS (x: 90, z: 590)
  // =========================================================================
  initIndustrialZone() {
    const indGroup = new THREE.Group();
    indGroup.position.set(90, 0.2, 590);
    this.group.add(indGroup);

    const metalMat = new THREE.MeshStandardMaterial({ color: 0x3b424d, roughness: 0.6, metalness: 0.5 });
    const concreteMat = new THREE.MeshStandardMaterial({ color: 0x5a6069, roughness: 0.85 });

    // Main Factory Warehouse Hall
    const factoryHall = new THREE.Mesh(new THREE.BoxGeometry(52, 14, 38), metalMat);
    factoryHall.position.set(0, 7, 0);
    factoryHall.castShadow = true;
    factoryHall.receiveShadow = true;
    indGroup.add(factoryHall);
    this.registerCollider(factoryHall);

    // Two 44-Meter Smoking Chimneys / Smokestacks
    const chimneyGeo = new THREE.CylinderGeometry(1.6, 2.8, 44, 16);
    const chimneyMat = new THREE.MeshStandardMaterial({ color: 0x4a4440, roughness: 0.9 });
    const hazardMat = new THREE.MeshStandardMaterial({ color: 0xd93829, roughness: 0.8 });

    [-14, 14].forEach(cx => {
      const chimney = new THREE.Mesh(chimneyGeo, chimneyMat);
      chimney.position.set(cx, 22, -12);
      chimney.castShadow = true;
      indGroup.add(chimney);
      this.registerCollider(chimney);

      // Red Hazard Aviation Rings at top
      const ring1 = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 1.8, 3.2, 16), hazardMat);
      ring1.position.set(cx, 40, -12);
      indGroup.add(ring1);

      // Add smoke emitter points
      const emitterPos = new THREE.Vector3(90 + cx, 44.5, 590 - 12);
      this.initChimneySmoke(emitterPos);
    });

    // Elevated Mechanical Conveyor Belt Bridge
    const conveyorBridge = new THREE.Mesh(new THREE.BoxGeometry(8, 4, 34), metalMat);
    conveyorBridge.position.set(30, 12, 10);
    conveyorBridge.rotation.y = 0.4;
    indGroup.add(conveyorBridge);

    // Large Cylindrical Oil Storage Tanks
    const tankGeo = new THREE.CylinderGeometry(8, 8, 12, 20);
    const tankMat = new THREE.MeshStandardMaterial({ color: 0x7c848f, metalness: 0.7, roughness: 0.3 });
    [-26, 26].forEach((tx, idx) => {
      const tank = new THREE.Mesh(tankGeo, tankMat);
      tank.position.set(tx, 6, 24);
      tank.castShadow = true;
      indGroup.add(tank);
      this.registerCollider(tank);
    });
  }

  initChimneySmoke(emitterPos) {
    const smokeMat = new THREE.MeshStandardMaterial({
      color: 0x444444,
      transparent: true,
      opacity: 0.45,
      roughness: 1.0
    });
    const smokeGeo = new THREE.SphereGeometry(1.2, 8, 8);

    for (let i = 0; i < 20; i++) {
      const p = new THREE.Mesh(smokeGeo, smokeMat.clone());
      p.position.copy(emitterPos).add(new THREE.Vector3(
        (Math.random() - 0.5) * 1.5,
        i * 1.4,
        (Math.random() - 0.5) * 1.5
      ));
      const scale = 1.0 + i * 0.25;
      p.scale.set(scale, scale * 0.8, scale);
      this.scene.add(p);

      this.smokeParticles.push({
        mesh: p,
        emitter: emitterPos.clone(),
        speedY: 2.5 + Math.random() * 1.5,
        windX: 1.2,
        initialY: emitterPos.y,
        maxLife: 8.0,
        age: (i / 20) * 8.0
      });
    }
  }

  // =========================================================================
  // 3. DEEPWATER PORT & CONTAINER CRANES (x: 750, z: 80)
  // =========================================================================
  initHarborContainerTerminal() {
    const harborGroup = new THREE.Group();
    harborGroup.position.set(750, 0.8, 80);
    this.group.add(harborGroup);

    // Concrete Quay Apron Pier
    const quayGeo = new THREE.BoxGeometry(110, 1.5, 140);
    const quayMat = new THREE.MeshStandardMaterial({ color: 0x4f545c, roughness: 0.8 });
    const quay = new THREE.Mesh(quayGeo, quayMat);
    quay.position.set(0, 0, 0);
    quay.receiveShadow = true;
    harborGroup.add(quay);

    // Two 48-Meter Dockside Container Gantry Cranes (Orange & Yellow)
    const craneOrange = new THREE.MeshStandardMaterial({ color: 0xf56f18, metalness: 0.7, roughness: 0.3 });
    const craneYellow = new THREE.MeshStandardMaterial({ color: 0xf5b818, metalness: 0.7, roughness: 0.3 });

    [-32, 32].forEach((cz, idx) => {
      const craneMat = idx === 0 ? craneOrange : craneYellow;
      const craneG = new THREE.Group();
      craneG.position.set(38, 0.8, cz);
      harborGroup.add(craneG);

      // 4 Main Lattice Legs
      [[-6, -8], [6, -8], [-6, 8], [6, 8]].forEach(([lx, lz]) => {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(1.2, 42, 1.2), craneMat);
        leg.position.set(lx, 21, lz);
        leg.castShadow = true;
        craneG.add(leg);
      });

      // Upper Machine House & Trolley Boom
      const boom = new THREE.Mesh(new THREE.BoxGeometry(48, 3.5, 7.0), craneMat);
      boom.position.set(-6, 42, 0);
      boom.castShadow = true;
      craneG.add(boom);

      // Operator Cabin
      const cabin = new THREE.Mesh(
        new THREE.BoxGeometry(3.5, 3.0, 3.5),
        new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.5 })
      );
      cabin.position.set(-16, 39, 0);
      craneG.add(cabin);
    });

    // Realistic Stacked Cargo Containers (20ft & 40ft in authentic colors)
    const containerColors = [
      0x0f4c81, // Maersk Maritime Blue
      0x1e7e34, // Evergreen Jade
      0xd9381e, // K-Line Crimson
      0xf07810, // Hapag Orange
      0x5a6268  // Charcoal Slate
    ];

    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 6; col++) {
        const stackHeight = 2 + ((row + col) % 3);
        for (let lvl = 0; lvl < stackHeight; lvl++) {
          const color = containerColors[(row * 3 + col * 2 + lvl) % containerColors.length];
          const cMat = new THREE.MeshStandardMaterial({ color: color, metalness: 0.5, roughness: 0.4 });
          const is40ft = (row + col) % 2 === 0;
          const cGeo = new THREE.BoxGeometry(is40ft ? 12.2 : 6.1, 2.6, 2.4);
          const container = new THREE.Mesh(cGeo, cMat);
          container.position.set(-25 + row * 13, 1.3 + lvl * 2.6, -45 + col * 18);
          container.castShadow = true;
          container.receiveShadow = true;
          harborGroup.add(container);
          this.registerCollider(container);
        }
      }
    }
  }

  // =========================================================================
  // 4. COLOSSAL HYDROELECTRIC DAM & SPILLWAY (x: 240, z: -320)
  // =========================================================================
  initHydroelectricDam() {
    const damGroup = new THREE.Group();
    damGroup.position.set(240, 0, -320);
    this.group.add(damGroup);

    const concreteMat = new THREE.MeshStandardMaterial({
      color: 0x6e7682,
      roughness: 0.9,
      metalness: 0.1
    });

    // Massive Curved Concrete Gravity Dam Wall (Height: 28m, Width: 76m, Thickness: 14m)
    const damWall = new THREE.Mesh(new THREE.BoxGeometry(76, 28, 14), concreteMat);
    damWall.position.set(0, 14, 0);
    damWall.castShadow = true;
    damWall.receiveShadow = true;
    damGroup.add(damWall);
    this.registerCollider(damWall);

    // Downstream Structural Slanted Buttresses
    for (let b = -26; b <= 26; b += 13) {
      const buttress = new THREE.Mesh(new THREE.BoxGeometry(4.2, 24, 18), concreteMat);
      buttress.position.set(b, 12, 10);
      buttress.castShadow = true;
      damGroup.add(buttress);
    }

    // Crest Highway Roadway across top of the dam (y: 28.2)
    const asphaltMat = new THREE.MeshStandardMaterial({ color: 0x1f2228, roughness: 0.6 });
    const crestRoad = new THREE.Mesh(new THREE.BoxGeometry(76, 0.4, 9.5), asphaltMat);
    crestRoad.position.set(0, 28.2, 0);
    crestRoad.receiveShadow = true;
    damGroup.add(crestRoad);

    // Parapet Crash Guardrails on both sides of crest road
    const parapetMat = new THREE.MeshStandardMaterial({ color: 0x8a929e, roughness: 0.5, metalness: 0.4 });
    const parapetL = new THREE.Mesh(new THREE.BoxGeometry(76, 1.2, 0.4), parapetMat);
    parapetL.position.set(0, 28.8, -4.6);
    damGroup.add(parapetL);
    this.registerCollider(parapetL);

    const parapetR = new THREE.Mesh(new THREE.BoxGeometry(76, 1.2, 0.4), parapetMat);
    parapetR.position.set(0, 28.8, 4.6);
    damGroup.add(parapetR);
    this.registerCollider(parapetR);

    // Streetlights on dam crest
    for (let lx = -30; lx <= 30; lx += 15) {
      const post = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.1, 4.2, 8),
        new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8 })
      );
      post.position.set(lx, 30.2, 4.2);
      damGroup.add(post);

      const lamp = new THREE.PointLight(0xffea9f, 0.6, 10.0, 1.5);
      lamp.position.set(lx, 32.2, 3.8);
      damGroup.add(lamp);
    }

    // 4 Spillway Floodgate Chutes & Foaming Water Cascade
    const spillwayMat = new THREE.MeshStandardMaterial({ color: 0x474c54, roughness: 0.8 });
    const gatePiers = new THREE.Mesh(new THREE.BoxGeometry(32, 6, 8), spillwayMat);
    gatePiers.position.set(0, 26, 6);
    damGroup.add(gatePiers);

    // Cascading Rushing Water Slope (Slanted plane with turbulent animated texture)
    const waterCanvas = document.createElement('canvas');
    waterCanvas.width = 256;
    waterCanvas.height = 256;
    const wCtx = waterCanvas.getContext('2d');
    const grad = wCtx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, '#5fa8e8');
    grad.addColorStop(0.3, '#ffffff');
    grad.addColorStop(0.7, '#d2e8ff');
    grad.addColorStop(1, '#ffffff');
    wCtx.fillStyle = grad;
    wCtx.fillRect(0, 0, 256, 256);

    this.spillwayWaterTexture = new THREE.CanvasTexture(waterCanvas);
    this.spillwayWaterTexture.wrapS = THREE.RepeatWrapping;
    this.spillwayWaterTexture.wrapT = THREE.RepeatWrapping;
    this.spillwayWaterTexture.repeat.set(1, 4);

    const waterGeo = new THREE.PlaneGeometry(28, 26);
    const waterMat = new THREE.MeshBasicMaterial({
      map: this.spillwayWaterTexture,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide
    });
    this.spillwayWaterMesh = new THREE.Mesh(waterGeo, waterMat);
    this.spillwayWaterMesh.rotation.x = Math.PI * 0.32;
    this.spillwayWaterMesh.position.set(0, 13.5, 11);
    damGroup.add(this.spillwayWaterMesh);

    // Foaming Impact Splash Pad at base
    const foamPad = new THREE.Mesh(
      new THREE.BoxGeometry(32, 1.2, 14),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 })
    );
    foamPad.position.set(0, 0.6, 20);
    damGroup.add(foamPad);

    // Upstream Deep Blue Reservoir Lake
    const lakeGeo = new THREE.PlaneGeometry(80, 80);
    lakeGeo.rotateX(-Math.PI * 0.5);
    const lakeMat = new THREE.MeshPhysicalMaterial({
      color: 0x0a3c5a,
      roughness: 0.1,
      metalness: 0.1,
      transmission: 0.7,
      transparent: true,
      opacity: 0.95
    });
    const lake = new THREE.Mesh(lakeGeo, lakeMat);
    lake.position.set(0, 25.5, -45);
    damGroup.add(lake);

    // Powerhouse Turbine Station at base
    const powerhouse = new THREE.Mesh(
      new THREE.BoxGeometry(24, 8, 14),
      concreteMat
    );
    powerhouse.position.set(22, 4, 18);
    powerhouse.castShadow = true;
    damGroup.add(powerhouse);
    this.registerCollider(powerhouse);
  }

  registerCollider(mesh) {
    if (!mesh) return;
    const box = new THREE.Box3().setFromObject(mesh);
    if (this.terrain && this.terrain.colliders) {
      this.terrain.colliders.push(box);
    }
  }

  // =========================================================================
  // 5. REAL-TIME UPDATE (SMOKE BILLOWING, WATER RUSHING & SPATIAL AUDIO)
  // =========================================================================
  update(delta, playerPos) {
    // 1. Chimney Particle Smoke Billowing
    for (let i = 0; i < this.smokeParticles.length; i++) {
      const p = this.smokeParticles[i];
      p.age += delta;
      if (p.age > p.maxLife) {
        p.age = 0;
        p.mesh.position.copy(p.emitter).add(new THREE.Vector3(
          (Math.random() - 0.5) * 1.5,
          0,
          (Math.random() - 0.5) * 1.5
        ));
        p.mesh.scale.set(1.0, 0.8, 1.0);
        p.mesh.material.opacity = 0.45;
      } else {
        p.mesh.position.y += p.speedY * delta;
        p.mesh.position.x += p.windX * delta;
        const progress = p.age / p.maxLife;
        const grow = 1.0 + progress * 3.5;
        p.mesh.scale.set(grow, grow * 0.8, grow);
        p.mesh.material.opacity = Math.max(0, 0.45 * (1.0 - progress));
      }
    }

    // 2. Spillway Cascading Water UV Flow
    if (this.spillwayWaterTexture) {
      this.waterTextureOffset -= delta * 3.5;
      this.spillwayWaterTexture.offset.y = this.waterTextureOffset;
    }

    // 3. Hydroelectric Dam Spatial Audio
    if (playerPos && this.audio && typeof this.audio.updateDamAudio === 'function') {
      const dist = playerPos.distanceTo(this.damPosition);
      this.audio.updateDamAudio(dist);
    }
  }
}
