// ROADBOUND - Photorealistic Continuous Mega-Island Architecture (Blackshore Island)
import * as THREE from 'three';

export class BlackshoreTerrain {
  constructor(scene, textureLibrary) {
    this.scene = scene;
    this.textures = textureLibrary;
    this.colliders = [];
    this.buildings = [];
    this.animatedProps = [];

    this.createMegaIslandBase();
    this.createOceanWater();
    this.createHighwayAndRoadNetwork();
    this.createRegionA_TropicalCoast();
    this.createRegionB_CountrysideAndFarms();
    this.createRegionC_ModernCity();
    this.createRegionE_MountainSummit();
    this.createRegionF_DryRockyCanyons();
    this.createRegionG_DesertDunes();
    this.createRegionH_IndustrialDistrict();
    this.createRegionI_Airport();
    this.createRegionJ_HarborAndPort();
    this.createRegionK_RemoteWilderness();
    this.createRegionL_SecuredMilitaryFacility();
    this.createSafehouseGarageHub();
    this.createPetrolStations();
  }

  // =========================================================================
  // 1. MEGA ISLAND GEOGRAPHY & ELEVATION MESH (2400m x 2400m)
  // =========================================================================
  createMegaIslandBase() {
    const islandGeo = new THREE.PlaneGeometry(2400, 2400, 96, 96);
    islandGeo.rotateX(-Math.PI / 2);

    const pos = islandGeo.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const color = new THREE.Color();

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const y = this.getGroundHeight(x, z);
      pos.setY(i, y);

      // Determine regional biome coloration with natural organic blending
      if (z >= -250 && z <= 150 && x >= 350) {
        // Red Rock Canyons: Warm rich sandstone terracotta with natural strata
        const strata = Math.sin(y * 0.45) * 0.08 + Math.sin(x * 0.02) * 0.04;
        color.setRGB(0.70 + strata, 0.32 + strata * 0.5, 0.20 + strata * 0.3);
      } else if (z > 150 && x >= 350 && z <= 750) {
        // Golden Dunes Desert: Warm Sahara amber gold
        color.setRGB(0.82, 0.58, 0.28);
      } else if (z < -250 && x > 100 && x < 650) {
        // Mountain Summit: Granite stone / alpine grey
        color.setRGB(0.38, 0.36, 0.34);
      } else if (z > 200 && x < -400) {
        // Tropical Coast: Warm golden beach sand
        color.setRGB(0.85, 0.76, 0.58);
      } else if (Math.hypot(x, z) < 180) {
        // Downtown Metropolis: Paved asphalt gray
        color.setRGB(0.40, 0.44, 0.48);
      } else {
        // Lush Countryside & Farmlands: Rich vibrant meadow green
        color.setRGB(0.24, 0.46, 0.20);
      }

      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    islandGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    islandGeo.computeVertexNormals();

    const islandMat = new THREE.MeshStandardMaterial({
      map: this.textures.grass,
      vertexColors: true,
      roughness: 0.88,
      metalness: 0.05
    });

    this.groundMesh = new THREE.Mesh(islandGeo, islandMat);
    this.groundMesh.receiveShadow = true;
    this.scene.add(this.groundMesh);
  }

  // =========================================================================
  // HIGH-FIDELITY OCEAN SHADER & PROCEDURAL WAVE SYNTHESIS
  // =========================================================================
  generateOceanNormalMap() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    const imgData = ctx.createImageData(512, 512);
    const data = imgData.data;

    for (let y = 0; y < 512; y++) {
      for (let x = 0; x < 512; x++) {
        const nx1 = Math.sin((x / 512) * Math.PI * 16 + (y / 512) * Math.PI * 8);
        const ny1 = Math.cos((y / 512) * Math.PI * 16 + (x / 512) * Math.PI * 8);
        const nx2 = Math.sin((x / 512) * Math.PI * 32 - (y / 512) * Math.PI * 16) * 0.5;
        const ny2 = Math.cos((y / 512) * Math.PI * 32 + (x / 512) * Math.PI * 16) * 0.5;
        const nx3 = Math.sin((x / 512) * Math.PI * 64) * 0.25;
        const ny3 = Math.cos((y / 512) * Math.PI * 64) * 0.25;

        const totalNx = (nx1 + nx2 + nx3) * 0.45;
        const totalNy = (ny1 + ny2 + ny3) * 0.45;

        const idx = (y * 512 + x) * 4;
        data[idx] = Math.floor(((totalNx + 1.0) / 2.0) * 255);
        data[idx + 1] = Math.floor(((totalNy + 1.0) / 2.0) * 255);
        data[idx + 2] = 245;
        data[idx + 3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(24, 24);
    return tex;
  }

  createOceanWater() {
    this.oceanWaterTexture = this.generateOceanNormalMap();
    this.oceanWaterOffset = 0;

    const oceanGeo = new THREE.PlaneGeometry(4200, 4200, 64, 64);
    oceanGeo.rotateX(-Math.PI / 2);

    const oceanMat = new THREE.MeshPhysicalMaterial({
      color: 0x08385e, // Deep azure-cyan ocean
      roughness: 0.06,
      metalness: 0.12,
      transmission: 0.70,
      ior: 1.333,
      reflectivity: 0.95,
      clearcoat: 1.0,
      clearcoatRoughness: 0.03,
      normalMap: this.oceanWaterTexture,
      normalScale: new THREE.Vector2(0.9, 0.9),
      transparent: true,
      opacity: 0.92
    });

    this.oceanMesh = new THREE.Mesh(oceanGeo, oceanMat);
    this.oceanMesh.position.y = -2.2;
    this.oceanMesh.receiveShadow = true;
    this.scene.add(this.oceanMesh);
  }

  // =========================================================================
  // HIGH-DETAIL PROCEDURAL PBR VEGETATION & FOLIAGE ARCHITECTURE
  // =========================================================================
  createRealisticPalmTree(x, y, z, scale = 1.0, tilt = 0.12, rotY = 0) {
    const palmGroup = new THREE.Group();
    palmGroup.position.set(x, y, z);
    palmGroup.rotation.y = rotY || Math.random() * Math.PI * 2;

    const barkMat = new THREE.MeshStandardMaterial({
      color: 0x5a4230,
      roughness: 0.92,
      metalness: 0.05
    });

    const frondMat = new THREE.MeshStandardMaterial({
      color: 0x2e8234,
      roughness: 0.62,
      metalness: 0.08,
      side: THREE.DoubleSide
    });

    const coconutMat = new THREE.MeshStandardMaterial({
      color: 0x48321a,
      roughness: 0.85
    });

    // 1. Organic Curved Segmented Palm Trunk (4 connected segments)
    const trunkGroup = new THREE.Group();
    const segCount = 4;
    const segHeight = 2.2 * scale;
    let currY = 0;
    let currZ = 0;

    for (let s = 0; s < segCount; s++) {
      const rBot = (0.42 - s * 0.04) * scale;
      const rTop = (0.38 - s * 0.04) * scale;
      const segMesh = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, segHeight, 8), barkMat);
      segMesh.position.set(0, currY + segHeight / 2, currZ);
      segMesh.rotation.x = tilt * (s + 1) * 0.35;
      segMesh.castShadow = true;
      trunkGroup.add(segMesh);

      // Bark Ring Collar
      const ring = new THREE.Mesh(new THREE.TorusGeometry(rBot * 1.05, 0.04 * scale, 6, 12), barkMat);
      ring.position.set(0, currY, currZ);
      ring.rotation.x = Math.PI / 2;
      trunkGroup.add(ring);

      currY += segHeight * Math.cos(tilt * (s + 1) * 0.35);
      currZ += segHeight * Math.sin(tilt * (s + 1) * 0.35);
    }
    palmGroup.add(trunkGroup);

    // 2. Crown Base with Coconuts
    const crownPos = new THREE.Vector3(0, currY, currZ);
    for (let c = 0; c < 5; c++) {
      const cAngle = (c / 5) * Math.PI * 2;
      const coconut = new THREE.Mesh(new THREE.SphereGeometry(0.18 * scale, 8, 8), coconutMat);
      coconut.position.set(
        crownPos.x + Math.cos(cAngle) * 0.32 * scale,
        crownPos.y - 0.15 * scale,
        crownPos.z + Math.sin(cAngle) * 0.32 * scale
      );
      palmGroup.add(coconut);
    }

    // 3. Fanned Arched Palm Fronds (10 natural arching leaves)
    const frondCount = 10;
    for (let f = 0; f < frondCount; f++) {
      const angle = (f / frondCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.2;
      const frondGroup = new THREE.Group();
      frondGroup.position.copy(crownPos);
      frondGroup.rotation.y = angle;

      const leafLength = 4.2 * scale;
      const leafGeo = new THREE.BoxGeometry(0.55 * scale, 0.04, leafLength);
      const leafMesh = new THREE.Mesh(leafGeo, frondMat);
      leafMesh.position.set(0, -0.4 * scale, leafLength * 0.45);
      leafMesh.rotation.x = 0.52 + Math.random() * 0.12;
      leafMesh.castShadow = true;
      frondGroup.add(leafMesh);

      const tipGeo = new THREE.BoxGeometry(0.35 * scale, 0.03, leafLength * 0.6);
      const tipMesh = new THREE.Mesh(tipGeo, frondMat);
      tipMesh.position.set(0, -1.2 * scale, leafLength * 0.85);
      tipMesh.rotation.x = 0.85;
      tipMesh.castShadow = true;
      frondGroup.add(tipMesh);

      palmGroup.add(frondGroup);
    }

    this.scene.add(palmGroup);
    return palmGroup;
  }

  createRealisticPineTree(x, y, z, scale = 1.0) {
    const pineGroup = new THREE.Group();
    pineGroup.position.set(x, y, z);
    pineGroup.rotation.y = Math.random() * Math.PI * 2;

    const barkMat = new THREE.MeshStandardMaterial({
      color: 0x3d2c1e,
      roughness: 0.95,
      metalness: 0.04
    });

    const needleMat = new THREE.MeshStandardMaterial({
      color: 0x163820,
      roughness: 0.76,
      metalness: 0.05
    });

    const trunkHeight = 13 * scale;
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16 * scale, 0.38 * scale, trunkHeight, 8),
      barkMat
    );
    trunk.position.y = trunkHeight / 2;
    trunk.castShadow = true;
    pineGroup.add(trunk);

    const tiers = [
      { y: 4.2 * scale, r: 3.8 * scale, h: 2.4 * scale },
      { y: 6.4 * scale, r: 3.1 * scale, h: 2.2 * scale },
      { y: 8.4 * scale, r: 2.4 * scale, h: 2.0 * scale },
      { y: 10.2 * scale, r: 1.7 * scale, h: 1.8 * scale },
      { y: 11.8 * scale, r: 0.95 * scale, h: 1.8 * scale }
    ];

    tiers.forEach(t => {
      const bough = new THREE.Mesh(new THREE.ConeGeometry(t.r, t.h, 7), needleMat);
      bough.position.y = t.y;
      bough.castShadow = true;
      pineGroup.add(bough);
    });

    this.scene.add(pineGroup);
    return pineGroup;
  }

  createRealisticDeciduousTree(x, y, z, scale = 1.0) {
    const treeGroup = new THREE.Group();
    treeGroup.position.set(x, y, z);
    treeGroup.rotation.y = Math.random() * Math.PI * 2;

    const woodMat = new THREE.MeshStandardMaterial({
      color: 0x423224,
      roughness: 0.90,
      metalness: 0.04
    });

    const foliageColors = [0x266820, 0x2e7527, 0x1e5a19];

    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.35 * scale, 0.65 * scale, 5.5 * scale, 8), woodMat);
    trunk.position.y = 2.75 * scale;
    trunk.castShadow = true;
    treeGroup.add(trunk);

    const branchL = new THREE.Mesh(new THREE.CylinderGeometry(0.22 * scale, 0.32 * scale, 3.2 * scale, 6), woodMat);
    branchL.position.set(-0.8 * scale, 4.8 * scale, 0.2 * scale);
    branchL.rotation.z = 0.55;
    treeGroup.add(branchL);

    const branchR = new THREE.Mesh(new THREE.CylinderGeometry(0.20 * scale, 0.30 * scale, 3.4 * scale, 6), woodMat);
    branchR.position.set(0.9 * scale, 4.9 * scale, -0.3 * scale);
    branchR.rotation.z = -0.52;
    treeGroup.add(branchR);

    const canopyConfigs = [
      { x: 0, y: 7.2 * scale, z: 0, r: 3.8 * scale, col: 0 },
      { x: -1.6 * scale, y: 6.2 * scale, z: 0.6 * scale, r: 3.1 * scale, col: 1 },
      { x: 1.7 * scale, y: 6.4 * scale, z: -0.5 * scale, r: 3.2 * scale, col: 2 },
      { x: 0.4 * scale, y: 8.4 * scale, z: -0.3 * scale, r: 2.6 * scale, col: 1 }
    ];

    canopyConfigs.forEach(c => {
      const fMat = new THREE.MeshStandardMaterial({
        color: foliageColors[c.col],
        roughness: 0.72,
        metalness: 0.05
      });
      const canopy = new THREE.Mesh(new THREE.DodecahedronGeometry(c.r, 1), fMat);
      canopy.position.set(c.x, c.y, c.z);
      canopy.castShadow = true;
      treeGroup.add(canopy);
    });

    this.scene.add(treeGroup);
    return treeGroup;
  }


  // =========================================================================
  // 2. CONTINUOUS HIGHWAY NETWORK (Region D)
  // =========================================================================
  createHighwayAndRoadNetwork() {
    const hwyMat = new THREE.MeshStandardMaterial({
      map: this.textures.asphalt,
      normalMap: this.textures.asphaltNormal,
      roughness: 0.65,
      metalness: 0.15
    });

    const dirtMat = new THREE.MeshStandardMaterial({
      map: this.textures.dirtRoad,
      roughness: 0.92,
      metalness: 0.05
    });

    // Main Arterial Highway: Connects City (0,0) -> Coast (-550, 450) -> Airport (-350, 650) -> Desert (550, 450) -> Harbor (750, 100) -> Mountains (300, -450)
    const roadSegments = [
      // Downtown Central Corridor
      { x: 0, y: 0.15, z: 0, w: 26, l: 600, rot: 0 },
      { x: 0, y: 0.15, z: 0, w: 600, l: 26, rot: 0 },
      // Southwestern Highway to Tropical Coast & Resort
      { x: -350, y: 0.15, z: 280, w: 22, l: 550, rot: Math.PI * 0.22 },
      { x: -650, y: 0.15, z: 520, w: 20, l: 480, rot: -Math.PI * 0.15 },
      // Southern Highway linking Airport & Industrial
      { x: -100, y: 0.15, z: 620, w: 24, l: 650, rot: Math.PI / 2 },
      { x: 380, y: 0.15, z: 620, w: 22, l: 450, rot: Math.PI / 2 },
      // Southeastern Desert Highway
      { x: 550, y: 0.15, z: 420, w: 22, l: 520, rot: -Math.PI * 0.2 },
      { x: 720, y: 0.15, z: 120, w: 22, l: 480, rot: 0 },
      // Eastern Port Highway
      { x: 550, y: 0.15, z: -50, w: 22, l: 420, rot: Math.PI / 2 },
      // Mountain Scenic Switchback Highway
      { x: 300, y: 22, z: -350, w: 18, l: 520, rot: -Math.PI * 0.28, pitch: 0.08 },
      { x: 420, y: 48, z: -560, w: 18, l: 380, rot: Math.PI * 0.35, pitch: 0.06 },
      // Northern Countryside Highway
      { x: -350, y: 0.15, z: -400, w: 22, l: 580, rot: Math.PI * 0.18 },
      { x: -150, y: 0.15, z: -620, w: 20, l: 450, rot: Math.PI / 2 }
    ];

    roadSegments.forEach(seg => {
      const geo = new THREE.BoxGeometry(seg.w, 0.25, seg.l);
      const mesh = new THREE.Mesh(geo, hwyMat);
      mesh.position.set(seg.x, seg.y, seg.z);
      mesh.rotation.y = seg.rot;
      if (seg.pitch) mesh.rotation.x = seg.pitch;
      mesh.receiveShadow = true;
      this.scene.add(mesh);
    });

    // Rural Dirt Trails in Countryside (Region B) & Desert (Region G)
    const dirtTrails = [
      { x: -480, y: 0.18, z: -350, w: 10, l: 380, rot: Math.PI * 0.4 },
      { x: -550, y: 0.18, z: -550, w: 10, l: 340, rot: -Math.PI * 0.2 },
      { x: 650, y: 0.18, z: 420, w: 12, l: 400, rot: Math.PI * 0.15 }
    ];

    dirtTrails.forEach(tr => {
      const geo = new THREE.BoxGeometry(tr.w, 0.22, tr.l);
      const mesh = new THREE.Mesh(geo, dirtMat);
      mesh.position.set(tr.x, tr.y, tr.z);
      mesh.rotation.y = tr.rot;
      mesh.receiveShadow = true;
      this.scene.add(mesh);
    });

    // Guard rails & Overhead Highway Signs on Main Interchanges
    const railMat = new THREE.MeshStandardMaterial({ color: 0x99a2ad, metalness: 0.8, roughness: 0.3 });
    const signMat = new THREE.MeshStandardMaterial({ color: 0x1d5c36, roughness: 0.5 }); // Green highway sign

    const hwySignGantry = new THREE.Mesh(new THREE.BoxGeometry(26, 0.6, 0.8), railMat);
    hwySignGantry.position.set(0, 7.5, 120);
    this.scene.add(hwySignGantry);

    const signBoard = new THREE.Mesh(new THREE.BoxGeometry(16, 3.2, 0.4), signMat);
    signBoard.position.set(0, 7.5, 119.5);
    this.scene.add(signBoard);
  }

  // =========================================================================
  // 3. REGION A — TROPICAL COAST & RESORT BEACHES (x: -850..-450, z: 250..750)
  // =========================================================================
  createRegionA_TropicalCoast() {
    // White Sandy Beach Strip
    const beachGeo = new THREE.PlaneGeometry(550, 450);
    beachGeo.rotateX(-Math.PI / 2);
    const beachMat = new THREE.MeshStandardMaterial({
      map: this.textures.beachSand,
      roughness: 0.9,
      metalness: 0.05
    });
    const beach = new THREE.Mesh(beachGeo, beachMat);
    beach.position.set(-680, 0.05, 520);
    beach.receiveShadow = true;
    this.scene.add(beach);

    // Realistic Palm Trees along coastal boulevard
    for (let i = 0; i < 28; i++) {
      const px = -520 - (i % 6) * 45 + (Math.random() - 0.5) * 15;
      const pz = 320 + Math.floor(i / 6) * 75 + (Math.random() - 0.5) * 15;
      const py = this.getGroundHeight(px, pz);
      const scale = 0.85 + Math.random() * 0.35;
      const tilt = 0.08 + Math.random() * 0.12;
      this.createRealisticPalmTree(px, py, pz, scale, tilt);
    }

    // Beachfront Resort Hotel & Bungalows
    const resortMat = new THREE.MeshStandardMaterial({ color: 0xd8e4ed, roughness: 0.3, metalness: 0.2 });
    const resortTower = new THREE.Mesh(new THREE.BoxGeometry(45, 24, 30), resortMat);
    resortTower.position.set(-580, 12, 420);
    resortTower.castShadow = true;
    this.scene.add(resortTower);
    this.colliders.push(new THREE.Box3().setFromObject(resortTower));

    // Wooden Pier into the Ocean with Docked Boats
    const pierMat = new THREE.MeshStandardMaterial({ color: 0x4a3c2c, roughness: 0.8 });
    const pier = new THREE.Mesh(new THREE.BoxGeometry(8, 1.2, 95), pierMat);
    pier.position.set(-780, 0.4, 550);
    this.scene.add(pier);

    // Motorboat docked
    const boatMat = new THREE.MeshStandardMaterial({ color: 0xd9e3f0, roughness: 0.2, metalness: 0.4 });
    const boat = new THREE.Mesh(new THREE.BoxGeometry(4, 2, 10), boatMat);
    boat.position.set(-772, 0.3, 560);
    this.scene.add(boat);
  }

  // =========================================================================
  // 4. REGION B — DENSE GREEN COUNTRYSIDE & FARMLANDS (x: -750..-200, z: -800..-200)
  // =========================================================================
  createRegionB_CountrysideAndFarms() {
    // Red Barns, Silos & Farmhouses
    const barnMat = new THREE.MeshStandardMaterial({ color: 0x942923, roughness: 0.7 }); // Red timber barn
    const siloMat = new THREE.MeshStandardMaterial({ color: 0xb5bcc4, metalness: 0.8, roughness: 0.3 }); // Metal silo
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x2b3038, roughness: 0.6 });

    const farmLocations = [
      { x: -480, z: -380 },
      { x: -620, z: -550 },
      { x: -380, z: -680 }
    ];

    farmLocations.forEach(f => {
      // Big Red Barn
      const barn = new THREE.Mesh(new THREE.BoxGeometry(22, 12, 34), barnMat);
      barn.position.set(f.x, 6, f.z);
      barn.castShadow = true;
      this.scene.add(barn);
      this.colliders.push(new THREE.Box3().setFromObject(barn));

      // Roof
      const roof = new THREE.Mesh(new THREE.ConeGeometry(18, 6, 4), roofMat);
      roof.position.set(f.x, 15, f.z);
      roof.rotation.y = Math.PI / 4;
      this.scene.add(roof);

      // Grain Silo
      const silo = new THREE.Mesh(new THREE.CylinderGeometry(4.5, 4.5, 22, 16), siloMat);
      silo.position.set(f.x + 18, 11, f.z - 10);
      silo.castShadow = true;
      this.scene.add(silo);
      this.colliders.push(new THREE.Box3().setFromObject(silo));

      // Plowed Farm Fields
      const fieldGeo = new THREE.PlaneGeometry(120, 100);
      fieldGeo.rotateX(-Math.PI / 2);
      const fieldMat = new THREE.MeshStandardMaterial({
        map: this.textures.dirtRoad,
        color: 0x5a4830,
        roughness: 0.95
      });
      const field = new THREE.Mesh(fieldGeo, fieldMat);
      field.position.set(f.x - 60, 0.08, f.z + 40);
      this.scene.add(field);
    });

    // Windmills with rotating blades
    const windmillTower = new THREE.Mesh(
      new THREE.CylinderGeometry(2, 4.5, 26, 12),
      new THREE.MeshStandardMaterial({ color: 0xdedede, roughness: 0.5 })
    );
    windmillTower.position.set(-520, 13, -480);
    this.scene.add(windmillTower);

    const bladeGeo = new THREE.BoxGeometry(16, 0.8, 0.2);
    const bladeMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.8 });
    const windmillBlades = new THREE.Mesh(bladeGeo, bladeMat);
    windmillBlades.position.set(-520, 24, -476);
    this.scene.add(windmillBlades);
    this.animatedProps.push({ mesh: windmillBlades, rotSpeed: 0.8 });

    // Realistic Rural Oak & Pine Trees
    for (let i = 0; i < 35; i++) {
      const tx = -350 - (i % 7) * 45 + (Math.random() - 0.5) * 20;
      const tz = -320 - Math.floor(i / 7) * 65 + (Math.random() - 0.5) * 20;
      const ty = this.getGroundHeight(tx, tz);
      const scale = 0.9 + Math.random() * 0.3;
      if (i % 3 === 0) {
        this.createRealisticPineTree(tx, ty, tz, scale * 0.95);
      } else {
        this.createRealisticDeciduousTree(tx, ty, tz, scale);
      }
    }
  }

  // =========================================================================
  // 5. REGION C — LARGE MODERN METROPOLITAN CITY (x: -300..150, z: -250..300)
  // =========================================================================
  createRegionC_ModernCity() {
    const facadeMaterials = [
      new THREE.MeshStandardMaterial({ color: 0x22384f, roughness: 0.15, metalness: 0.88 }), // Blue Glass Skyscraper
      new THREE.MeshStandardMaterial({ color: 0x3d444e, roughness: 0.52, metalness: 0.28 }),  // Architectural Concrete
      new THREE.MeshStandardMaterial({ color: 0x14181f, roughness: 0.22, metalness: 0.82 }),  // Obsidian Corporate Tower
      new THREE.MeshStandardMaterial({ color: 0x626c78, roughness: 0.55, metalness: 0.22 })   // Brushed Granite Plaza
    ];

    const windowGlassMat = new THREE.MeshStandardMaterial({
      color: 0x8ab4d8,
      roughness: 0.08,
      metalness: 0.92,
      emissive: 0x22425a,
      emissiveIntensity: 0.35
    });

    const warmWindowMat = new THREE.MeshStandardMaterial({
      color: 0xffd27d,
      roughness: 0.2,
      metalness: 0.1,
      emissive: 0xff9922,
      emissiveIntensity: 1.2
    });

    const roofMetalMat = new THREE.MeshStandardMaterial({ color: 0x2a2f38, roughness: 0.65, metalness: 0.75 });
    const acFanMat = new THREE.MeshStandardMaterial({ color: 0x1a1c22, roughness: 0.4, metalness: 0.8 });

    const buildingCoords = [
      // Downtown Core Skyscrapers
      { x: -75, z: -80, w: 50, d: 50, h: 125, mat: 0 },
      { x: -145, z: -80, w: 45, d: 45, h: 80, mat: 1 },
      { x: -75, z: -160, w: 52, d: 48, h: 105, mat: 2 },
      { x: -145, z: -160, w: 48, d: 52, h: 145, mat: 0 },
      { x: 75, z: -80, w: 52, d: 50, h: 135, mat: 0 },
      { x: 145, z: -80, w: 45, d: 48, h: 88, mat: 3 },
      { x: 75, z: -160, w: 48, d: 55, h: 155, mat: 2 },
      { x: 145, z: -160, w: 50, d: 50, h: 96, mat: 1 },
      // South Downtown Blocks
      { x: -75, z: 80, w: 50, d: 45, h: 78, mat: 1 },
      { x: -145, z: 80, w: 45, d: 45, h: 68, mat: 3 },
      { x: 75, z: 80, w: 52, d: 48, h: 92, mat: 0 },
      { x: 145, z: 80, w: 45, d: 45, h: 72, mat: 2 },
      // Commercial Plazas & Mid-rises
      { x: -85, z: 180, w: 60, d: 50, h: 62, mat: 1 },
      { x: 85, z: 180, w: 55, d: 60, h: 75, mat: 0 }
    ];

    buildingCoords.forEach(b => {
      const geo = new THREE.BoxGeometry(b.w, b.h, b.d);
      const mesh = new THREE.Mesh(geo, facadeMaterials[b.mat]);
      mesh.position.set(b.x, b.h / 2, b.z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.scene.add(mesh);
      this.buildings.push(mesh);
      this.colliders.push(new THREE.Box3().setFromObject(mesh));

      // 1. Multi-Floor Glass Ribbon Windows with Warm Evening Office Light
      const bandCount = Math.floor(b.h / 12);
      for (let f = 1; f < bandCount; f++) {
        const isWarmLit = (f % 2 === 0);
        const wMat = isWarmLit ? warmWindowMat : windowGlassMat;
        const bandGeo = new THREE.BoxGeometry(b.w + 0.5, 2.4, b.d + 0.5);
        const bandMesh = new THREE.Mesh(bandGeo, wMat);
        bandMesh.position.set(b.x, f * 12, b.z);
        this.scene.add(bandMesh);
      }

      // 2. Rooftop Architectural Mechanical Structures
      // A. Rooftop Elevator Penthouse / Machinery Bulkhead
      const phW = b.w * 0.42;
      const phD = b.d * 0.42;
      const phH = 6.5;
      const phMesh = new THREE.Mesh(new THREE.BoxGeometry(phW, phH, phD), roofMetalMat);
      phMesh.position.set(b.x, b.h + phH / 2, b.z);
      phMesh.castShadow = true;
      this.scene.add(phMesh);

      // B. HVAC Chiller Units with Ventilation Exhaust
      const hvac1 = new THREE.Mesh(new THREE.BoxGeometry(4.5, 3.2, 5.5), roofMetalMat);
      hvac1.position.set(b.x - b.w * 0.28, b.h + 1.6, b.z - b.d * 0.28);
      this.scene.add(hvac1);

      const hvacFan = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 0.4, 12), acFanMat);
      hvacFan.position.set(b.x - b.w * 0.28, b.h + 3.4, b.z - b.d * 0.28);
      this.scene.add(hvacFan);

      // C. Roof Safety Parapet Wall Border
      const parapetH = 1.6;
      const parapetGeo = new THREE.BoxGeometry(b.w, parapetH, b.d);
      const parapet = new THREE.Mesh(parapetGeo, roofMetalMat);
      parapet.position.set(b.x, b.h + parapetH / 2, b.z);
      this.scene.add(parapet);

      // D. Ground Level Entrance Portico
      const portico = new THREE.Mesh(new THREE.BoxGeometry(b.w * 0.45, 4.2, 5.5), roofMetalMat);
      portico.position.set(b.x, 2.1, b.z + b.d / 2 + 2.8);
      this.scene.add(portico);

      // E. Roof Aircraft Warning Beacon & Spire
      if (b.h > 80) {
        const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.6, 16, 8), roofMetalMat);
        spire.position.set(b.x, b.h + phH + 8, b.z);
        spire.castShadow = true;
        this.scene.add(spire);

        const beacon = new THREE.PointLight(0xff3333, 2.2, 140);
        beacon.position.set(b.x, b.h + phH + 16, b.z);
        this.scene.add(beacon);
      }
    });

    // Concrete Sidewalks and Curbs along downtown
    const curbMat = new THREE.MeshStandardMaterial({ color: 0x8a929d, roughness: 0.6 });
    const curbL = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.45, 520), curbMat);
    curbL.position.set(-15.25, 0.22, 0);
    this.scene.add(curbL);
    const curbR = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.45, 520), curbMat);
    curbR.position.set(15.25, 0.22, 0);
    this.scene.add(curbR);
  }

  // =========================================================================
  // 6. REGION E — MOUNTAIN WORLD & SUMMIT PASS (x: 100..600, z: -850..-300)
  // =========================================================================
  createRegionE_MountainSummit() {
    // Massive Mountain Granite Rocks & Cliffs
    const rockMat = new THREE.MeshStandardMaterial({
      map: this.textures.mountainRock,
      roughness: 0.9,
      metalness: 0.1
    });

    for (let i = 0; i < 22; i++) {
      const rockGeo = new THREE.DodecahedronGeometry(18 + Math.random() * 12, 1);
      const rock = new THREE.Mesh(rockGeo, rockMat);
      const angle = (i / 22) * Math.PI * 1.4;
      rock.position.set(
        220 + Math.cos(angle) * 160 + (Math.random() - 0.5) * 40,
        18 + i * 2.8,
        -320 - Math.sin(angle) * 220 + (Math.random() - 0.5) * 40
      );
      rock.castShadow = true;
      rock.receiveShadow = true;
      this.scene.add(rock);
      this.colliders.push(new THREE.Box3().setFromObject(rock));
    }

    // Mountain Summit Communication Relay Tower (Elevation 75m)
    const towerMat = new THREE.MeshStandardMaterial({ color: 0xcc2222, metalness: 0.8, roughness: 0.2 });
    const commTower = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 4.5, 60, 6), towerMat);
    commTower.position.set(380, 85, -580);
    commTower.castShadow = true;
    this.scene.add(commTower);

    const beaconLight = new THREE.PointLight(0xff2222, 2.5, 200);
    beaconLight.position.set(380, 118, -580);
    this.scene.add(beaconLight);

    // Realistic Pine Trees on Mountain Slopes
    for (let i = 0; i < 30; i++) {
      const px = 180 + (i % 6) * 45 + (Math.random() - 0.5) * 20;
      const pz = -350 - Math.floor(i / 6) * 55 + (Math.random() - 0.5) * 20;
      const py = this.getGroundHeight(px, pz);
      const scale = 0.85 + Math.random() * 0.4;
      this.createRealisticPineTree(px, py, pz, scale);
    }
  }

  // =========================================================================
  // 7. REGION F — DRY ROCKY CANYONS & SUMMIT LOOKOUT (Matching Screenshots 1 & 2)
  // =========================================================================
  createRegionF_DryRockyCanyons() {
    const canyonGeo = new THREE.PlaneGeometry(380, 380);
    canyonGeo.rotateX(-Math.PI / 2);
    const canyonMat = new THREE.MeshStandardMaterial({
      map: this.textures.redRock,
      color: 0xba583c,
      roughness: 0.92,
      metalness: 0.05
    });
    const canyonFloor = new THREE.Mesh(canyonGeo, canyonMat);
    canyonFloor.position.set(550, 24.5, -60);
    canyonFloor.receiveShadow = true;
    this.scene.add(canyonFloor);

    // Red Rock Formations, Buttes & Mesa Strata
    const butteMat = new THREE.MeshStandardMaterial({
      map: this.textures.redRock,
      roughness: 0.88,
      metalness: 0.08
    });

    const strataCoords = [
      { x: 480, y: 22, z: -150, w: 45, h: 26, d: 38 },
      { x: 620, y: 25, z: -140, w: 55, h: 32, d: 42 },
      { x: 670, y: 20, z: -40, w: 48, h: 24, d: 48 },
      { x: 640, y: 18, z: 40, w: 52, h: 22, d: 45 },
      { x: 440, y: 15, z: 30, w: 38, h: 18, d: 35 },
      { x: 580, y: 28, z: -110, w: 42, h: 28, d: 36 }
    ];

    strataCoords.forEach(s => {
      const butte = new THREE.Mesh(new THREE.BoxGeometry(s.w, s.h, s.d), butteMat);
      butte.position.set(s.x, s.y, s.z);
      butte.castShadow = true;
      butte.receiveShadow = true;
      this.scene.add(butte);
      this.colliders.push(new THREE.Box3().setFromObject(butte));
    });

    // 1. Canyon Summit Metal Lookout Tower (Exact Replica from Screenshot 2)
    const towerX = 550;
    const towerZ = -60;
    const towerBaseY = 27;

    const steelMat = new THREE.MeshStandardMaterial({
      color: 0x3d3834,
      metalness: 0.85,
      roughness: 0.35
    });
    const deckMat = new THREE.MeshStandardMaterial({
      color: 0x5a4d42,
      roughness: 0.6,
      metalness: 0.5
    });
    const railMat = new THREE.MeshStandardMaterial({
      color: 0x6e5e52,
      metalness: 0.8,
      roughness: 0.4
    });

    // 4 Steel Structural Legs
    const legGeo = new THREE.BoxGeometry(0.5, 6.0, 0.5);
    const legOffsets = [
      { x: -5, z: -5 },
      { x: 5, z: -5 },
      { x: -5, z: 5 },
      { x: 5, z: 5 }
    ];
    legOffsets.forEach(lo => {
      const leg = new THREE.Mesh(legGeo, steelMat);
      leg.position.set(towerX + lo.x, towerBaseY + 3.0, towerZ + lo.z);
      leg.castShadow = true;
      this.scene.add(leg);
    });

    // Main Observation Deck Platform (12m x 12m)
    const deckMesh = new THREE.Mesh(new THREE.BoxGeometry(11, 0.4, 11), deckMat);
    deckMesh.position.set(towerX, towerBaseY + 6.0, towerZ);
    deckMesh.receiveShadow = true;
    this.scene.add(deckMesh);
    this.colliders.push(new THREE.Box3().setFromObject(deckMesh));

    // Steel Safety Railings around the platform edges
    const railGeoH = new THREE.BoxGeometry(11, 0.1, 0.1);
    const railGeoV = new THREE.BoxGeometry(0.1, 1.1, 0.1);

    // North, South, East, West Railings
    const railings = [
      { x: towerX, z: towerZ - 5.4, rotY: 0 },
      { x: towerX, z: towerZ + 5.4, rotY: 0 },
      { x: towerX - 5.4, z: towerZ, rotY: Math.PI / 2 },
      { x: towerX + 5.4, z: towerZ, rotY: Math.PI / 2 }
    ];
    railings.forEach(r => {
      // Top rail bar
      const barTop = new THREE.Mesh(railGeoH, railMat);
      barTop.position.set(r.x, towerBaseY + 7.1, r.z);
      barTop.rotation.y = r.rotY;
      this.scene.add(barTop);
      // Mid rail bar
      const barMid = new THREE.Mesh(railGeoH, railMat);
      barMid.position.set(r.x, towerBaseY + 6.6, r.z);
      barMid.rotation.y = r.rotY;
      this.scene.add(barMid);
      // Stanchion posts
      for (let p = -5; p <= 5; p += 2.5) {
        const post = new THREE.Mesh(railGeoV, railMat);
        const px = r.rotY === 0 ? r.x + p : r.x;
        const pz = r.rotY === 0 ? r.z : r.z + p;
        post.position.set(px, towerBaseY + 6.55, pz);
        this.scene.add(post);
      }
    });

    // Center Communications Mast & Antenna (Matching Screenshot 2 mast)
    const mastPole = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.4, 18, 8), steelMat);
    mastPole.position.set(towerX, towerBaseY + 15.0, towerZ);
    mastPole.castShadow = true;
    this.scene.add(mastPole);

    // Antenna cross-arms and microwave drum
    const drumMat = new THREE.MeshStandardMaterial({ color: 0x4a4845, roughness: 0.5 });
    const dish1 = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 0.8, 12), drumMat);
    dish1.position.set(towerX, towerBaseY + 18.0, towerZ);
    dish1.rotation.z = Math.PI / 2;
    this.scene.add(dish1);

    const dish2 = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 0.6, 12), drumMat);
    dish2.position.set(towerX, towerBaseY + 13.0, towerZ);
    dish2.rotation.z = Math.PI / 2;
    this.scene.add(dish2);

    // 2. Realistic Ribbed Saguaro Cacti with Fluted Columns & Dome Caps
    const cactusGreenMat = new THREE.MeshStandardMaterial({
      color: 0x3d6634,
      roughness: 0.65,
      metalness: 0.08
    });
    const spineMat = new THREE.MeshStandardMaterial({
      color: 0x8a7d55,
      roughness: 0.8
    });

    const createSaguaroCactus = (x, y, z, scale = 1.0) => {
      const cactusGroup = new THREE.Group();
      // Fluted Main Trunk with rounded dome tip
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.38 * scale, 0.44 * scale, 5.8 * scale, 16), cactusGreenMat);
      trunk.position.y = 2.9 * scale;
      trunk.castShadow = true;
      cactusGroup.add(trunk);

      const trunkCap = new THREE.Mesh(new THREE.SphereGeometry(0.38 * scale, 12, 8), cactusGreenMat);
      trunkCap.position.y = 5.8 * scale;
      cactusGroup.add(trunkCap);

      // Left curved arm with fluted cap
      const armHorizL = new THREE.Mesh(new THREE.CylinderGeometry(0.24 * scale, 0.24 * scale, 1.4 * scale, 12), cactusGreenMat);
      armHorizL.rotation.z = Math.PI / 2;
      armHorizL.position.set(-0.75 * scale, 2.8 * scale, 0);
      cactusGroup.add(armHorizL);

      const armVertL = new THREE.Mesh(new THREE.CylinderGeometry(0.24 * scale, 0.24 * scale, 2.2 * scale, 12), cactusGreenMat);
      armVertL.position.set(-1.4 * scale, 3.8 * scale, 0);
      armVertL.castShadow = true;
      cactusGroup.add(armVertL);

      const armCapL = new THREE.Mesh(new THREE.SphereGeometry(0.24 * scale, 10, 8), cactusGreenMat);
      armCapL.position.set(-1.4 * scale, 4.9 * scale, 0);
      cactusGroup.add(armCapL);

      // Right curved arm
      const armHorizR = new THREE.Mesh(new THREE.CylinderGeometry(0.24 * scale, 0.24 * scale, 1.2 * scale, 12), cactusGreenMat);
      armHorizR.rotation.z = Math.PI / 2;
      armHorizR.position.set(0.65 * scale, 3.4 * scale, 0);
      cactusGroup.add(armHorizR);

      const armVertR = new THREE.Mesh(new THREE.CylinderGeometry(0.24 * scale, 0.24 * scale, 1.8 * scale, 12), cactusGreenMat);
      armVertR.position.set(1.2 * scale, 4.2 * scale, 0);
      armVertR.castShadow = true;
      cactusGroup.add(armVertR);

      const armCapR = new THREE.Mesh(new THREE.SphereGeometry(0.24 * scale, 10, 8), cactusGreenMat);
      armCapR.position.set(1.2 * scale, 5.1 * scale, 0);
      cactusGroup.add(armCapR);

      cactusGroup.position.set(x, y, z);
      this.scene.add(cactusGroup);
      this.colliders.push(new THREE.Box3().setFromObject(trunk));
    };

    // Naturally placed Saguaro Cacti along canyon rim
    createSaguaroCactus(540, 27.2, -56, 1.25);
    createSaguaroCactus(534, 26.5, -42, 1.10);
    createSaguaroCactus(548, 27.2, -36, 0.95); // Moved back from player spawn point
    createSaguaroCactus(528, 24.0, -82, 1.30);
    createSaguaroCactus(578, 26.0, -92, 1.15);

    // Weathered Canyon Sandstone Boulders & Rocks on Overlook
    const boulderMat = new THREE.MeshStandardMaterial({
      map: this.textures.redRock,
      color: 0x9e4a34,
      roughness: 0.90,
      metalness: 0.06
    });

    const boulderCoords = [
      { x: 554, y: 27.4, z: -52, r: 2.2 },
      { x: 538, y: 26.8, z: -48, r: 3.4 },
      { x: 572, y: 27.0, z: -58, r: 2.8 },
      { x: 546, y: 26.6, z: -66, r: 4.1 },
      { x: 582, y: 25.8, z: -38, r: 3.0 }
    ];

    boulderCoords.forEach(bc => {
      const bGeo = new THREE.DodecahedronGeometry(bc.r, 1);
      const bMesh = new THREE.Mesh(bGeo, boulderMat);
      bMesh.position.set(bc.x, bc.y + bc.r * 0.4, bc.z);
      bMesh.rotation.set(Math.random() * 2, Math.random() * 2, Math.random() * 2);
      bMesh.castShadow = true;
      bMesh.receiveShadow = true;
      this.scene.add(bMesh);
      this.colliders.push(new THREE.Box3().setFromObject(bMesh));
    });

    // 3. Realistic Valley Greenery & Trees Below (Looking out westward over the valley)
    for (let i = 0; i < 45; i++) {
      const vx = 240 + (i % 9) * 25 + (Math.random() - 0.5) * 15;
      const vz = -180 + Math.floor(i / 9) * 35 + (Math.random() - 0.5) * 15;
      const vy = this.getGroundHeight(vx, vz);
      const scale = 0.85 + Math.random() * 0.35;
      if (i % 2 === 0) {
        this.createRealisticPineTree(vx, vy, vz, scale);
      } else {
        this.createRealisticDeciduousTree(vx, vy, vz, scale);
      }
    }

    // 4. Valley Outpost Buildings visible in distance (Screenshot 1 & 4)
    const compoundMat = new THREE.MeshStandardMaterial({ color: 0x54585c, roughness: 0.6 });
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x2e353d, roughness: 0.5 });

    const compoundCoords = [
      { x: 300, z: -70, w: 18, h: 7, d: 14 },
      { x: 330, z: -95, w: 22, h: 8, d: 16 },
      { x: 280, z: -130, w: 16, h: 6, d: 20 }
    ];
    compoundCoords.forEach(c => {
      const cy = this.getGroundHeight(c.x, c.z);
      const bld = new THREE.Mesh(new THREE.BoxGeometry(c.w, c.h, c.d), compoundMat);
      bld.position.set(c.x, cy + c.h / 2, c.z);
      bld.castShadow = true;
      bld.receiveShadow = true;
      this.scene.add(bld);
      this.colliders.push(new THREE.Box3().setFromObject(bld));

      const roof = new THREE.Mesh(new THREE.BoxGeometry(c.w + 1.2, 0.8, c.d + 1.2), roofMat);
      roof.position.set(c.x, cy + c.h + 0.4, c.z);
      this.scene.add(roof);
    });
  }

  // =========================================================================
  // 8. REGION G — EXPANSIVE DESERT & DUNES (x: 350..900, z: 200..750)
  // =========================================================================
  createRegionG_DesertDunes() {
    const duneGeo = new THREE.PlaneGeometry(550, 550, 32, 32);
    duneGeo.rotateX(-Math.PI / 2);
    // Add sinusoidal sand wave undulations
    const dPos = duneGeo.attributes.position;
    for (let i = 0; i < dPos.count; i++) {
      const dx = dPos.getX(i);
      const dz = dPos.getZ(i);
      const dy = Math.sin(dx * 0.03) * Math.cos(dz * 0.03) * 6 + Math.sin(dx * 0.015) * 8;
      dPos.setY(i, dy);
    }
    duneGeo.computeVertexNormals();

    const desertMat = new THREE.MeshStandardMaterial({
      map: this.textures.desertSand,
      color: 0xd49448,
      roughness: 0.95,
      metalness: 0.02
    });
    const dunes = new THREE.Mesh(duneGeo, desertMat);
    dunes.position.set(620, 0.05, 480);
    dunes.receiveShadow = true;
    this.scene.add(dunes);

    // Oil Pumpjacks (Working animated nods)
    const oilSteelMat = new THREE.MeshStandardMaterial({ color: 0x3d434d, metalness: 0.7, roughness: 0.4 });
    for (let i = 0; i < 4; i++) {
      const ox = 520 + (i % 2) * 110;
      const oz = 380 + Math.floor(i / 2) * 120;
      const derrick = new THREE.Mesh(new THREE.BoxGeometry(4, 16, 4), oilSteelMat);
      derrick.position.set(ox, 8, oz);
      derrick.castShadow = true;
      this.scene.add(derrick);

      const beam = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.2, 12), oilSteelMat);
      beam.position.set(ox, 16, oz);
      this.scene.add(beam);
      this.animatedProps.push({ mesh: beam, pitchSpeed: 0.9 });
    }

    // Cylindrical Crude Oil Storage Tanks
    const tankMat = new THREE.MeshStandardMaterial({ color: 0xdcdfe4, roughness: 0.5, metalness: 0.5 });
    for (let i = 0; i < 3; i++) {
      const tank = new THREE.Mesh(new THREE.CylinderGeometry(14, 14, 12, 24), tankMat);
      tank.position.set(720 + i * 35, 6, 320);
      tank.castShadow = true;
      this.scene.add(tank);
      this.colliders.push(new THREE.Box3().setFromObject(tank));
    }
  }

  // =========================================================================
  // 9. REGION H — INDUSTRIAL DISTRICT & FUEL DEPOT (x: -150..250, z: 450..850)
  // =========================================================================
  createRegionH_IndustrialDistrict() {
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x424852, metalness: 0.6, roughness: 0.5 });
    const brickMat = new THREE.MeshStandardMaterial({ color: 0x6e4236, roughness: 0.85 });

    // Manufacturing Warehouses
    for (let i = 0; i < 6; i++) {
      const wx = -80 + (i % 3) * 85;
      const wz = 520 + Math.floor(i / 3) * 120;
      const wh = new THREE.Mesh(new THREE.BoxGeometry(55, 14, 75), metalMat);
      wh.position.set(wx, 7, wz);
      wh.castShadow = true;
      wh.receiveShadow = true;
      this.scene.add(wh);
      this.colliders.push(new THREE.Box3().setFromObject(wh));
    }

    // Industrial Smokestacks
    for (let i = 0; i < 3; i++) {
      const stack = new THREE.Mesh(new THREE.CylinderGeometry(2, 3.5, 45, 16), brickMat);
      stack.position.set(40 + i * 22, 22.5, 710);
      stack.castShadow = true;
      this.scene.add(stack);
      this.colliders.push(new THREE.Box3().setFromObject(stack));
    }

    // Spherical Gas Tanks
    const sphereMat = new THREE.MeshStandardMaterial({ color: 0xe6e9ed, metalness: 0.8, roughness: 0.2 });
    for (let i = 0; i < 3; i++) {
      const sphere = new THREE.Mesh(new THREE.SphereGeometry(9, 18, 18), sphereMat);
      sphere.position.set(160 + i * 26, 9.5, 540);
      sphere.castShadow = true;
      this.scene.add(sphere);
      this.colliders.push(new THREE.Box3().setFromObject(sphere));
    }
  }

  // =========================================================================
  // 10. REGION I — BLACKSHORE INTERNATIONAL AIRPORT (x: -600..-150, z: 450..900)
  // =========================================================================
  createRegionI_Airport() {
    // 550m Long Main Runway (with threshold bars & stripes)
    const runwayGeo = new THREE.BoxGeometry(45, 0.25, 550);
    const runwayMat = new THREE.MeshStandardMaterial({
      map: this.textures.airportRunway,
      roughness: 0.6,
      metalness: 0.2
    });
    const runway = new THREE.Mesh(runwayGeo, runwayMat);
    runway.position.set(-360, 0.16, 680);
    runway.receiveShadow = true;
    this.scene.add(runway);

    // Parallel Taxiway
    const taxiway = new THREE.Mesh(new THREE.BoxGeometry(22, 0.22, 520), this.textures.asphalt ? new THREE.MeshStandardMaterial({ map: this.textures.asphalt }) : runwayMat);
    taxiway.position.set(-305, 0.16, 680);
    this.scene.add(taxiway);

    // Air Traffic Control Tower (Elevation 42m)
    const towerShaft = new THREE.Mesh(
      new THREE.CylinderGeometry(3.5, 5.5, 36, 12),
      new THREE.MeshStandardMaterial({ color: 0xd8dde3, roughness: 0.4 })
    );
    towerShaft.position.set(-250, 18, 550);
    towerShaft.castShadow = true;
    this.scene.add(towerShaft);
    this.colliders.push(new THREE.Box3().setFromObject(towerShaft));

    // Glass Control Cabin on top of tower
    const towerCabin = new THREE.Mesh(
      new THREE.CylinderGeometry(7, 5, 6, 16),
      new THREE.MeshStandardMaterial({ color: 0x1d3852, metalness: 0.9, roughness: 0.1 })
    );
    towerCabin.position.set(-250, 39, 550);
    this.scene.add(towerCabin);

    // Airport Passenger Terminal Building
    const terminal = new THREE.Mesh(
      new THREE.BoxGeometry(90, 14, 45),
      new THREE.MeshStandardMaterial({ color: 0x22364a, metalness: 0.7, roughness: 0.2 })
    );
    terminal.position.set(-230, 7, 720);
    terminal.castShadow = true;
    this.scene.add(terminal);
    this.colliders.push(new THREE.Box3().setFromObject(terminal));

    // Commercial Airliner parked on apron
    const planeMat = new THREE.MeshStandardMaterial({ color: 0xf5f7fa, metalness: 0.5, roughness: 0.2 });
    const fuselage = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.5, 36, 16), planeMat);
    fuselage.rotation.x = Math.PI / 2;
    fuselage.position.set(-280, 4, 620);
    fuselage.castShadow = true;
    this.scene.add(fuselage);

    const wings = new THREE.Mesh(new THREE.BoxGeometry(32, 0.4, 6), planeMat);
    wings.position.set(-280, 3.5, 620);
    this.scene.add(wings);
  }

  // =========================================================================
  // 11. REGION J — DEEPWATER PORT & HARBOR (x: 650..1000, z: -150..350)
  // =========================================================================
  createRegionJ_HarborAndPort() {
    // Concrete Harbor Apron
    const dockGeo = new THREE.BoxGeometry(260, 3.5, 220);
    const dockMat = new THREE.MeshStandardMaterial({ color: 0x485260, roughness: 0.75, metalness: 0.2 });
    const dock = new THREE.Mesh(dockGeo, dockMat);
    dock.position.set(780, 0.8, 120);
    dock.castShadow = true;
    dock.receiveShadow = true;
    this.scene.add(dock);
    this.colliders.push(new THREE.Box3().setFromObject(dock));

    // Giant Orange Container Cranes
    const craneMat = new THREE.MeshStandardMaterial({ color: 0xe67300, roughness: 0.4, metalness: 0.7 });
    for (let i = 0; i < 2; i++) {
      const cx = 880;
      const cz = 60 + i * 110;
      const craneLegs = new THREE.Mesh(new THREE.BoxGeometry(8, 48, 12), craneMat);
      craneLegs.position.set(cx, 26, cz);
      craneLegs.castShadow = true;
      this.scene.add(craneLegs);

      const craneBoom = new THREE.Mesh(new THREE.BoxGeometry(60, 4.5, 8), craneMat);
      craneBoom.position.set(cx - 15, 52, cz);
      this.scene.add(craneBoom);
    }

    // Stacks of Multicolored Shipping Containers
    const containerColors = [0xb82828, 0x1f5ea8, 0x228b4d, 0xcca01a, 0x3d434d];
    for (let i = 0; i < 24; i++) {
      const col = containerColors[i % containerColors.length];
      const cMat = new THREE.MeshStandardMaterial({ color: col, roughness: 0.65, metalness: 0.35 });
      const cMesh = new THREE.Mesh(new THREE.BoxGeometry(12, 5, 26), cMat);
      const sx = 720 + (i % 6) * 16;
      const sy = 4.5 + Math.floor(i / 6) * 5;
      const sz = 40 + Math.floor(i % 3) * 32;
      cMesh.position.set(sx, sy, sz);
      cMesh.castShadow = true;
      this.scene.add(cMesh);
      this.colliders.push(new THREE.Box3().setFromObject(cMesh));
    }

    // Moored Cargo Container Vessel
    const shipHull = new THREE.Mesh(
      new THREE.BoxGeometry(32, 16, 120),
      new THREE.MeshStandardMaterial({ color: 0x1b232c, roughness: 0.5, metalness: 0.6 })
    );
    shipHull.position.set(940, 5, 120);
    this.scene.add(shipHull);
  }

  // =========================================================================
  // 12. REGION K — REMOTE WILDERNESS (x: -250..200, z: -1000..-650)
  // =========================================================================
  createRegionK_RemoteWilderness() {
    // Secluded Mountain Lake
    const lakeGeo = new THREE.CircleGeometry(65, 32);
    lakeGeo.rotateX(-Math.PI / 2);
    const lakeMat = new THREE.MeshStandardMaterial({
      color: 0x184252,
      roughness: 0.08,
      metalness: 0.9,
      transparent: true,
      opacity: 0.9
    });
    const lake = new THREE.Mesh(lakeGeo, lakeMat);
    lake.position.set(-60, 2.5, -780);
    this.scene.add(lake);

    // Remote Log Cabins
    const cabinMat = new THREE.MeshStandardMaterial({ color: 0x5a3e28, roughness: 0.85 });
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(14, 7, 16), cabinMat);
    cabin.position.set(-110, 6, -760);
    cabin.castShadow = true;
    this.scene.add(cabin);
    this.colliders.push(new THREE.Box3().setFromObject(cabin));

    // Realistic Dense Alpine Pine Trees
    for (let i = 0; i < 40; i++) {
      const ax = -180 + (i % 8) * 35 + (Math.random() - 0.5) * 15;
      const az = -680 - Math.floor(i / 8) * 45 + (Math.random() - 0.5) * 15;
      const ay = this.getGroundHeight(ax, az);
      const scale = 0.9 + Math.random() * 0.4;
      this.createRealisticPineTree(ax, ay, az, scale);
    }
  }

  // =========================================================================
  // 13. REGION L — SECURED MILITARY / PRIVATE COMPOUND (x: 550..850, z: -800..-450)
  // =========================================================================
  createRegionL_SecuredMilitaryFacility() {
    const milMat = new THREE.MeshStandardMaterial({ color: 0x3d453b, roughness: 0.7, metalness: 0.3 }); // Olive drab & concrete
    const fenceMat = new THREE.MeshStandardMaterial({ color: 0x88929e, metalness: 0.9, roughness: 0.2 });

    // Fortified Main Bunker
    const bunker = new THREE.Mesh(new THREE.BoxGeometry(50, 10, 70), milMat);
    bunker.position.set(680, 5, -620);
    bunker.castShadow = true;
    this.scene.add(bunker);
    this.colliders.push(new THREE.Box3().setFromObject(bunker));

    // Radar Radome Dome
    const radome = new THREE.Mesh(
      new THREE.SphereGeometry(12, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.4 })
    );
    radome.position.set(680, 19, -620);
    this.scene.add(radome);

    // Perimeter Security Watchtowers
    for (let i = 0; i < 4; i++) {
      const tx = 580 + (i % 2) * 200;
      const tz = -720 + Math.floor(i / 2) * 200;
      const tower = new THREE.Mesh(new THREE.BoxGeometry(5, 22, 5), milMat);
      tower.position.set(tx, 11, tz);
      tower.castShadow = true;
      this.scene.add(tower);
      this.colliders.push(new THREE.Box3().setFromObject(tower));

      // Watchtower Searchlight
      const spot = new THREE.SpotLight(0xfffaea, 2.2, 70, Math.PI / 6, 0.4);
      spot.position.set(tx, 22, tz);
      const spotT = new THREE.Object3D();
      spotT.position.set(tx, 0, tz + (tz < -620 ? 30 : -30));
      this.scene.add(spot);
      this.scene.add(spotT);
      spot.target = spotT;
    }

    // Helipad with 'H' Marking
    const heliPadGeo = new THREE.BoxGeometry(26, 0.3, 26);
    const heliPadMat = new THREE.MeshStandardMaterial({ color: 0x24282e, roughness: 0.6 });
    const helipad = new THREE.Mesh(heliPadGeo, heliPadMat);
    helipad.position.set(600, 0.2, -560);
    this.scene.add(helipad);
  }

  // =========================================================================
  // 14. SAFEHOUSE & TUNING HUB
  // =========================================================================
  createSafehouseGarageHub() {
    // Open-Air Garage Carport Pavilion (attached to enterable safehouse residence)
    const canopyRoofGeo = new THREE.BoxGeometry(16, 0.4, 14);
    const canopyMat = new THREE.MeshStandardMaterial({
      color: 0x1f242c,
      roughness: 0.4,
      metalness: 0.3
    });
    const canopy = new THREE.Mesh(canopyRoofGeo, canopyMat);
    canopy.position.set(-24, 5.5, 42);
    canopy.castShadow = true;
    canopy.receiveShadow = true;
    this.scene.add(canopy);

    // 4 Support Pillars for Garage Canopy
    const pillarGeo = new THREE.CylinderGeometry(0.25, 0.25, 5.5, 12);
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8 });
    [[-31, 36], [-31, 48], [-17, 36], [-17, 48]].forEach(([px, pz]) => {
      const pil = new THREE.Mesh(pillarGeo, pillarMat);
      pil.position.set(px, 2.75, pz);
      this.scene.add(pil);
      this.colliders.push(new THREE.Box3().setFromObject(pil));
    });

    // Luminous Safehouse Sign
    const signGeo = new THREE.BoxGeometry(14, 2.0, 0.4);
    const signMat = new THREE.MeshStandardMaterial({
      color: 0xe6a12b,
      emissive: 0xe6a12b,
      emissiveIntensity: 1.2
    });
    const sign = new THREE.Mesh(signGeo, signMat);
    sign.position.set(-48, 5.6, 35.5);
    this.scene.add(sign);

    // Elegant Ground Hologram Ring
    const ringGeo = new THREE.RingGeometry(3.2, 3.8, 32);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x00e5ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.75
    });
    const groundRing = new THREE.Mesh(ringGeo, ringMat);
    groundRing.position.set(-24, 0.28, 42);
    this.scene.add(groundRing);
  }

  // =========================================================================
  // 15. INTERACTIVE HIGHWAY PETROL STATIONS & FUEL PUMP DISPENSERS
  // =========================================================================
  createPetrolStations() {
    this.petrolStations = [];

    const stationLocations = [
      { x: 520, z: -35, name: 'Canyon Summit 24/7 Petrol' },
      { x: -30, z: 95, name: 'Coastal Express Gas Station' },
      { x: 260, z: -480, name: 'Mountain Pass Fuel Depot' }
    ];

    stationLocations.forEach((loc, idx) => {
      const y = this.getGroundHeight(loc.x, loc.z);
      const group = new THREE.Group();
      group.name = `PetrolStation_${idx}`;
      group.position.set(loc.x, y, loc.z);

      // 1. Concrete Forecourt Pad
      const padGeo = new THREE.BoxGeometry(22, 0.25, 16);
      const padMat = new THREE.MeshStandardMaterial({ color: 0x242830, roughness: 0.8 });
      const pad = new THREE.Mesh(padGeo, padMat);
      pad.position.y = 0.12;
      group.add(pad);

      // 2. Large Canopy Roof with glowing LED fascia
      const canopyGeo = new THREE.BoxGeometry(20, 1.2, 14);
      const canopyMat = new THREE.MeshStandardMaterial({ color: 0xf5f7fb, roughness: 0.3, metalness: 0.1 });
      const canopy = new THREE.Mesh(canopyGeo, canopyMat);
      canopy.position.y = 5.6;
      canopy.castShadow = true;
      group.add(canopy);

      // Glowing yellow/blue LED fascia trim
      const trimGeo = new THREE.BoxGeometry(20.4, 0.4, 14.4);
      const trimMat = new THREE.MeshStandardMaterial({ color: 0xf5c71a, emissive: 0xf5c71a, emissiveIntensity: 1.8 });
      const trim = new THREE.Mesh(trimGeo, trimMat);
      trim.position.y = 5.6;
      group.add(trim);

      // Overhead fluorescent downlights
      const downlight1 = new THREE.PointLight(0xfffaed, 1.8, 18);
      downlight1.position.set(-5, 4.8, 0);
      const downlight2 = new THREE.PointLight(0xfffaed, 1.8, 18);
      downlight2.position.set(5, 4.8, 0);
      group.add(downlight1, downlight2);

      // Heavy support pillars
      const pillarGeo = new THREE.CylinderGeometry(0.35, 0.35, 5.0, 12);
      const pillarMat = new THREE.MeshStandardMaterial({ color: 0x3a424e, roughness: 0.5 });
      const p1 = new THREE.Mesh(pillarGeo, pillarMat); p1.position.set(-6, 2.5, -4);
      const p2 = new THREE.Mesh(pillarGeo, pillarMat); p2.position.set(6, 2.5, -4);
      const p3 = new THREE.Mesh(pillarGeo, pillarMat); p3.position.set(-6, 2.5, 4);
      const p4 = new THREE.Mesh(pillarGeo, pillarMat); p4.position.set(6, 2.5, 4);
      group.add(p1, p2, p3, p4);

      // 3. Fuel Pump Dispensers (2 raised concrete islands with digital pumps)
      [-4, 4].forEach(px => {
        const islandGeo = new THREE.BoxGeometry(2.4, 0.35, 6.5);
        const islandMat = new THREE.MeshStandardMaterial({ color: 0x546e7a, roughness: 0.7 });
        const island = new THREE.Mesh(islandGeo, islandMat);
        island.position.set(px, 0.35, 0);
        group.add(island);

        [-1.8, 1.8].forEach(pz => {
          const pumpGeo = new THREE.BoxGeometry(0.75, 1.8, 0.9);
          const pumpMat = new THREE.MeshStandardMaterial({ color: 0x1565c0, roughness: 0.3, metalness: 0.3 });
          const pump = new THREE.Mesh(pumpGeo, pumpMat);
          pump.position.set(px, 1.4, pz);
          pump.castShadow = true;
          group.add(pump);

          const screenGeo = new THREE.BoxGeometry(0.76, 0.35, 0.45);
          const screenMat = new THREE.MeshStandardMaterial({ color: 0x00e676, emissive: 0x00e676, emissiveIntensity: 1.5 });
          const screen = new THREE.Mesh(screenGeo, screenMat);
          screen.position.set(px, 1.7, pz);
          group.add(screen);
        });
      });

      // 4. Convenience Store Building in background
      const storeGeo = new THREE.BoxGeometry(16, 4.5, 8);
      const storeMat = new THREE.MeshStandardMaterial({ color: 0x263238, roughness: 0.6 });
      const store = new THREE.Mesh(storeGeo, storeMat);
      store.position.set(0, 2.25, -12);
      store.castShadow = true;
      group.add(store);

      const glassGeo = new THREE.BoxGeometry(14, 2.6, 0.2);
      const glassMat = new THREE.MeshStandardMaterial({ color: 0x81d4fa, transparent: true, opacity: 0.7, roughness: 0.1 });
      const storeGlass = new THREE.Mesh(glassGeo, glassMat);
      storeGlass.position.set(0, 1.8, -7.9);
      group.add(storeGlass);

      const signGeo = new THREE.BoxGeometry(12, 1.0, 0.3);
      const signMat = new THREE.MeshStandardMaterial({ color: 0xff3d00, emissive: 0xff3d00, emissiveIntensity: 1.8 });
      const storeSign = new THREE.Mesh(signGeo, signMat);
      storeSign.position.set(0, 3.8, -7.8);
      group.add(storeSign);

      this.scene.add(group);
      this.colliders.push(new THREE.Box3().setFromObject(store));

      this.petrolStations.push({
        name: loc.name,
        x: loc.x,
        y: y,
        z: loc.z,
        radius: 10.0
      });
    });
  }

  // =========================================================================
  // ANALYTICAL ELEVATION & REGION IDENTIFICATION
  // =========================================================================
  getGroundHeight(x, z) {
    // 1. Mountain Peak in North-East (Region E)
    if (x > 100 && x < 650 && z < -250 && z > -850) {
      const dist = Math.hypot(x - 380, z - (-550));
      if (dist < 420) {
        let y = Math.cos((dist / 420) * Math.PI) * 42 + 42;
        y += Math.sin(x * 0.04) * Math.cos(z * 0.04) * 6;
        return y;
      }
    }

    // 1b. Canyon Summit Plateau Ridge & Lookout (Region F - Screenshots 1 & 2)
    if (x >= 400 && x <= 720 && z >= -220 && z <= 100) {
      const dx = x - 560;
      const dz = z - (-60);
      const dist = Math.hypot(dx * 0.85, dz * 0.7);
      if (dist < 180) {
        const h = Math.cos((dist / 180) * (Math.PI * 0.5)) * 28;
        return Math.max(0, h + Math.sin(x * 0.05) * 1.5);
      }
    }

    // 2. Rolling Countryside Hills (Region B)
    if (x < -200 && x > -800 && z < -200 && z > -850) {
      return Math.sin(x * 0.02) * Math.cos(z * 0.02) * 5 + 4;
    }

    // 3. Desert Dunes (Region G)
    if (x > 350 && z > 200 && z < 750) {
      return Math.sin(x * 0.025) * Math.cos(z * 0.025) * 4.5 + 2;
    }

    // 4. Island Perimeter falloff to ocean
    const distFromCenter = Math.hypot(x, z);
    if (distFromCenter > 950) {
      const falloff = (distFromCenter - 950) / 200;
      return -Math.min(25, falloff * 25);
    }

    return 0;
  }

  getRegionAt(x, z) {
    if (z > 200 && x < -400) return 'TROPICAL COAST & RESORT';
    if (z < -200 && x < -150) return 'GREEN COUNTRYSIDE & FARMLANDS';
    if (z < -250 && x > 100 && x < 650) return 'BLACKSHORE SUMMIT PASS';
    if (z < -450 && x >= 550) return 'SECURED MILITARY FACILITY';
    if (z < -650 && x >= -250 && x <= 200) return 'REMOTE WILDERNESS';
    if (z >= -250 && z <= 150 && x >= 350) return 'RED ROCK CANYONS';
    if (z > 150 && x >= 350 && z <= 750) return 'GOLDEN DUNES DESERT';
    if (z > 400 && x >= -150 && x <= 250) return 'INDUSTRIAL DISTRICT';
    if (z > 400 && x < -150) return 'BLACKSHORE AIRPORT';
    if (x >= 650 && z >= -150 && z <= 350) return 'PORT & HARBOR';
    return 'DOWNTOWN METROPOLIS';
  }

  update(delta) {
    // Animate props (Windmills, oil pumpjacks)
    this.animatedProps.forEach(p => {
      if (p.rotSpeed) p.mesh.rotation.z += delta * p.rotSpeed;
      if (p.pitchSpeed) p.mesh.rotation.x = Math.sin(Date.now() * 0.002 * p.pitchSpeed) * 0.25;
    });

    // Dynamic Ocean Waves UV drift & subtle surface undulation
    if (this.oceanWaterTexture) {
      this.oceanWaterOffset = (this.oceanWaterOffset || 0) + delta * 0.022;
      this.oceanWaterTexture.offset.set(this.oceanWaterOffset, this.oceanWaterOffset * 0.65);
    }
    if (this.oceanMesh) {
      this.oceanMesh.position.y = -2.2 + Math.sin(Date.now() * 0.0014) * 0.12;
    }
  }
}
