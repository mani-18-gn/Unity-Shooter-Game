// ROADBOUND - Photorealistic Enterable Multi-Room Modern Villa, Household Physics & Resident NPC
import * as THREE from 'three';

export class EnterableHouseSystem {
  constructor(scene, terrain, audioManager, gameState, hud) {
    this.scene = scene;
    this.terrain = terrain;
    this.audio = audioManager;
    this.gameState = gameState;
    this.hud = hud;

    // Villa root and systems
    this.group = new THREE.Group();
    this.group.name = 'EnterableSafehouseVilla';
    this.scene.add(this.group);

    // State
    this.doorOpen = false;
    this.doorCurrentAngle = 0;
    this.doorTargetAngle = 0;

    this.lightsOn = true;
    this.ceilingLights = [];

    this.faucetsRunning = false;
    this.waterParticles = [];

    this.tvPower = true;
    this.tvChannel = 1; // 0 = OFF, 1 = News 24, 2 = Apex Sports, 3 = Synthwave
    this.tvTimer = 0;

    this.activeInteraction = null;
    this.dialogueIndex = 0;

    // Initialize components
    this.initVillaArchitecture();
    this.initFurnishings();
    this.initTelevision();
    this.initLighting();
    this.initResidentNPC();
    this.initColliders();
  }

  // =========================================================================
  // 1. ARCHITECTURAL FLOORS, WALLS, ROOF & DOORS
  // =========================================================================
  initVillaArchitecture() {
    // Villa coordinates: X: -48, Y: 0.35, Z: 48 (Size: 32m wide x 26m deep)
    const villaBaseY = 0.35;
    this.villaBaseY = villaBaseY;

    // 1. Polished Hardwood Parquet Floor (Living & Bedroom)
    const woodFloorGeo = new THREE.BoxGeometry(16, 0.25, 24);
    const woodFloorMat = new THREE.MeshStandardMaterial({
      color: 0x2b1d14,
      roughness: 0.35,
      metalness: 0.1
    });
    const woodFloor = new THREE.Mesh(woodFloorGeo, woodFloorMat);
    woodFloor.position.set(-56, villaBaseY, 48);
    woodFloor.receiveShadow = true;
    this.group.add(woodFloor);

    // 2. White Italian Marble Floor (Kitchen & Spa Bathroom)
    const marbleFloorGeo = new THREE.BoxGeometry(16, 0.25, 24);
    const marbleFloorMat = new THREE.MeshStandardMaterial({
      color: 0xe8e8e8,
      roughness: 0.2,
      metalness: 0.15
    });
    const marbleFloor = new THREE.Mesh(marbleFloorGeo, marbleFloorMat);
    marbleFloor.position.set(-40, villaBaseY, 48);
    marbleFloor.receiveShadow = true;
    this.group.add(marbleFloor);

    // 3. Concrete Foundation & Entrance Patio Deck
    const patioGeo = new THREE.BoxGeometry(34, 0.3, 28);
    const patioMat = new THREE.MeshStandardMaterial({
      color: 0x42464d,
      roughness: 0.7,
      metalness: 0.1
    });
    const patio = new THREE.Mesh(patioGeo, patioMat);
    patio.position.set(-48, villaBaseY - 0.2, 48);
    patio.receiveShadow = true;
    this.group.add(patio);

    // Front entrance steps (Smooth ramp / step access)
    for (let s = 0; s < 3; s++) {
      const stepGeo = new THREE.BoxGeometry(6, 0.12, 1.2);
      const step = new THREE.Mesh(stepGeo, patioMat);
      step.position.set(-37, villaBaseY - 0.08 - s * 0.1, 35.2 - s * 0.8);
      this.group.add(step);
    }

    // Modern Stucco Wall Material
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0xd5d8de,
      roughness: 0.85,
      metalness: 0.05
    });

    const darkAccentMat = new THREE.MeshStandardMaterial({
      color: 0x1f242c,
      roughness: 0.4,
      metalness: 0.3
    });

    const wallHeight = 4.8;
    const wallY = villaBaseY + wallHeight * 0.5;

    // Exterior Perimeter Walls:
    // A. West Exterior Wall (Solid)
    const westWallGeo = new THREE.BoxGeometry(0.5, wallHeight, 24.5);
    const westWall = new THREE.Mesh(westWallGeo, wallMat);
    westWall.position.set(-64, wallY, 48);
    westWall.castShadow = true;
    westWall.receiveShadow = true;
    this.group.add(westWall);

    // B. East Exterior Wall (Solid)
    const eastWallGeo = new THREE.BoxGeometry(0.5, wallHeight, 24.5);
    const eastWall = new THREE.Mesh(eastWallGeo, wallMat);
    eastWall.position.set(-32, wallY, 48);
    eastWall.castShadow = true;
    eastWall.receiveShadow = true;
    this.group.add(eastWall);

    // C. North Exterior Wall (Back overlooking hills, with panoramic glass window)
    const northWallGeoL = new THREE.BoxGeometry(10, wallHeight, 0.5);
    const northWallL = new THREE.Mesh(northWallGeoL, wallMat);
    northWallL.position.set(-59, wallY, 60);
    this.group.add(northWallL);

    const northWallGeoR = new THREE.BoxGeometry(10, wallHeight, 0.5);
    const northWallR = new THREE.Mesh(northWallGeoR, wallMat);
    northWallR.position.set(-37, wallY, 60);
    this.group.add(northWallR);

    // Panoramic Master Glass Window (North center)
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xa8d5e5,
      roughness: 0.05,
      metalness: 0.1,
      transmission: 0.9,
      transparent: true,
      opacity: 0.45,
      reflectivity: 0.8
    });
    const panoramicGlassGeo = new THREE.BoxGeometry(12, 3.8, 0.1);
    const panoramicGlass = new THREE.Mesh(panoramicGlassGeo, glassMat);
    panoramicGlass.position.set(-48, wallY - 0.2, 60);
    this.group.add(panoramicGlass);

    // D. South Exterior Wall (Front with Entryway Door)
    // Left segment (Living room front)
    const southWallGeoL = new THREE.BoxGeometry(22, wallHeight, 0.5);
    const southWallL = new THREE.Mesh(southWallGeoL, wallMat);
    southWallL.position.set(-53, wallY, 36);
    this.group.add(southWallL);

    // Right segment (Kitchen front right of door)
    const southWallGeoR = new THREE.BoxGeometry(6.5, wallHeight, 0.5);
    const southWallR = new THREE.Mesh(southWallGeoR, wallMat);
    southWallR.position.set(-35.25, wallY, 36);
    this.group.add(southWallR);

    // Lintel above door
    const lintelGeo = new THREE.BoxGeometry(3.5, 1.8, 0.5);
    const lintel = new THREE.Mesh(lintelGeo, wallMat);
    lintel.position.set(-40.25, wallY + 1.5, 36);
    this.group.add(lintel);

    // Modern Flat Overhanging Roof / Ceiling
    const roofGeo = new THREE.BoxGeometry(34, 0.4, 26);
    const roof = new THREE.Mesh(roofGeo, darkAccentMat);
    roof.position.set(-48, villaBaseY + wallHeight + 0.2, 48);
    roof.castShadow = true;
    this.group.add(roof);

    // Interior Partition Walls:
    // 1. Central Hallway Partition (Divides West living/bedroom from East kitchen/bath)
    const centralDividerGeoA = new THREE.BoxGeometry(0.4, wallHeight, 8);
    const centralDividerA = new THREE.Mesh(centralDividerGeoA, wallMat);
    centralDividerA.position.set(-48, wallY, 40);
    this.group.add(centralDividerA);

    const centralDividerGeoB = new THREE.BoxGeometry(0.4, wallHeight, 8);
    const centralDividerB = new THREE.Mesh(centralDividerGeoB, wallMat);
    centralDividerB.position.set(-48, wallY, 56);
    this.group.add(centralDividerB);

    // 2. Bedroom/Living Room Divider (West horizontal divider with door opening)
    const westDividerGeo = new THREE.BoxGeometry(12, wallHeight, 0.4);
    const westDivider = new THREE.Mesh(westDividerGeo, wallMat);
    westDivider.position.set(-58, wallY, 48);
    this.group.add(westDivider);

    // 3. Bathroom/Kitchen Divider (East horizontal divider)
    const eastDividerGeo = new THREE.BoxGeometry(12, wallHeight, 0.4);
    const eastDivider = new THREE.Mesh(eastDividerGeo, wallMat);
    eastDivider.position.set(-38, wallY, 48);
    this.group.add(eastDivider);

    // =========================================================================
    // Front Entrance Hinged Door
    // =========================================================================
    this.doorPivot = new THREE.Group();
    this.doorPivot.position.set(-41.7, villaBaseY, 36); // Left hinge point
    this.group.add(this.doorPivot);

    const doorLeafGeo = new THREE.BoxGeometry(2.8, 3.2, 0.12);
    const doorMat = new THREE.MeshStandardMaterial({
      color: 0x3d271d, // Rich walnut wood
      roughness: 0.4,
      metalness: 0.1
    });
    this.doorMesh = new THREE.Mesh(doorLeafGeo, doorMat);
    this.doorMesh.position.set(1.4, 1.6, 0); // Offset so pivot is on left edge
    this.doorMesh.castShadow = true;
    this.doorPivot.add(this.doorMesh);

    // Modern Chrome Door Handle
    const handleGeo = new THREE.BoxGeometry(0.08, 0.4, 0.16);
    const handleMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.9, roughness: 0.1 });
    const handle = new THREE.Mesh(handleGeo, handleMat);
    handle.position.set(2.4, 1.5, 0.08);
    this.doorPivot.add(handle);

    // Entrance Wall Light Switch
    const switchGeo = new THREE.BoxGeometry(0.15, 0.25, 0.06);
    const switchMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
    this.lightSwitchMesh = new THREE.Mesh(switchGeo, switchMat);
    this.lightSwitchMesh.position.set(-37.5, villaBaseY + 1.4, 36.3);
    this.group.add(this.lightSwitchMesh);
  }

  // =========================================================================
  // 2. FURNISHINGS & DETAILED PROPS
  // =========================================================================
  initFurnishings() {
    const y = this.villaBaseY;

    // --- LIVING ROOM ---
    // A. L-Shaped Sectional Leather Sofa
    const sofaMat = new THREE.MeshStandardMaterial({
      color: 0x1f232b,
      roughness: 0.55,
      metalness: 0.1
    });

    const sofaMain = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.85, 1.8), sofaMat);
    sofaMain.position.set(-56, y + 0.42, 44);
    sofaMain.castShadow = true;
    this.group.add(sofaMain);

    const sofaBack = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.9, 0.5), sofaMat);
    sofaBack.position.set(-56, y + 0.85, 45);
    this.group.add(sofaBack);

    const sofaChaise = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.85, 2.6), sofaMat);
    sofaChaise.position.set(-58, y + 0.42, 42.2);
    sofaChaise.castShadow = true;
    this.group.add(sofaChaise);

    // Throw pillows (Mustard gold & Emerald)
    const pillowMat1 = new THREE.MeshStandardMaterial({ color: 0xe6a12b, roughness: 0.7 });
    const pillow1 = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.65, 0.3), pillowMat1);
    pillow1.position.set(-57.6, y + 0.9, 44.5);
    pillow1.rotation.y = 0.3;
    this.group.add(pillow1);

    const pillowMat2 = new THREE.MeshStandardMaterial({ color: 0x1d5c42, roughness: 0.7 });
    const pillow2 = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.65, 0.3), pillowMat2);
    pillow2.position.set(-54.2, y + 0.9, 44.5);
    pillow2.rotation.y = -0.25;
    this.group.add(pillow2);

    // B. Low Walnut Coffee Table & Geometric Rug
    const rugGeo = new THREE.BoxGeometry(5.2, 0.03, 4.4);
    const rugMat = new THREE.MeshStandardMaterial({ color: 0xc8c3b8, roughness: 0.9 });
    const rug = new THREE.Mesh(rugGeo, rugMat);
    rug.position.set(-56, y + 0.02, 42);
    this.group.add(rug);

    const tableGeo = new THREE.BoxGeometry(2.4, 0.45, 1.4);
    const tableMat = new THREE.MeshStandardMaterial({ color: 0x3b2a20, roughness: 0.35, metalness: 0.1 });
    const coffeeTable = new THREE.Mesh(tableGeo, tableMat);
    coffeeTable.position.set(-55.5, y + 0.25, 41.5);
    coffeeTable.castShadow = true;
    this.group.add(coffeeTable);

    // Coffee table book & plant
    const plantPotGeo = new THREE.CylinderGeometry(0.18, 0.14, 0.3, 16);
    const potMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
    const plantPot = new THREE.Mesh(plantPotGeo, potMat);
    plantPot.position.set(-56.2, y + 0.62, 41.5);
    this.group.add(plantPot);

    const plantLeavesGeo = new THREE.SphereGeometry(0.32, 12, 12);
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x2e6b35, roughness: 0.6 });
    const leaves = new THREE.Mesh(plantLeavesGeo, leafMat);
    leaves.position.set(-56.2, y + 0.9, 41.5);
    leaves.scale.set(1, 0.8, 1);
    this.group.add(leaves);

    // C. Arc Floor Lamp
    const lampStem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 2.6, 12),
      new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8, roughness: 0.2 })
    );
    lampStem.position.set(-61, y + 1.3, 44);
    this.group.add(lampStem);

    const lampShade = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.6, 0.4, 16),
      new THREE.MeshStandardMaterial({ color: 0xf5eedc, roughness: 0.5 })
    );
    lampShade.position.set(-61, y + 2.5, 44);
    this.group.add(lampShade);

    // --- KITCHEN & DINING ISLAND ---
    // A. White Marble Waterfall Island
    const islandGeo = new THREE.BoxGeometry(4.4, 1.05, 1.8);
    const islandMat = new THREE.MeshStandardMaterial({
      color: 0xf0f0f0,
      roughness: 0.18,
      metalness: 0.15
    });
    this.kitchenIsland = new THREE.Mesh(islandGeo, islandMat);
    this.kitchenIsland.position.set(-41, y + 0.52, 41.5);
    this.kitchenIsland.castShadow = true;
    this.group.add(this.kitchenIsland);

    // Kitchen Sink Cutout
    const sinkGeo = new THREE.BoxGeometry(1.2, 0.35, 0.8);
    const sinkMat = new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.8, roughness: 0.2 });
    const sink = new THREE.Mesh(sinkGeo, sinkMat);
    sink.position.set(-40, y + 0.95, 41.5);
    this.group.add(sink);

    // Chrome Faucet Arc
    const faucetArc = new THREE.Mesh(
      new THREE.TorusGeometry(0.2, 0.035, 8, 16, Math.PI),
      new THREE.MeshStandardMaterial({ color: 0xdddddd, metalness: 0.9, roughness: 0.1 })
    );
    faucetArc.rotation.z = Math.PI * 0.5;
    faucetArc.position.set(-40, y + 1.3, 41.15);
    this.group.add(faucetArc);

    // Running Water Stream Mesh (translucent, animated)
    const waterGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.38, 8);
    const waterMat = new THREE.MeshPhysicalMaterial({
      color: 0x70c0ff,
      roughness: 0.05,
      transmission: 0.9,
      transparent: true,
      opacity: 0.75
    });
    this.waterStreamMesh = new THREE.Mesh(waterGeo, waterMat);
    this.waterStreamMesh.position.set(-40, y + 1.15, 41.35);
    this.waterStreamMesh.visible = false;
    this.group.add(this.waterStreamMesh);

    // 2 Bar Stools
    for (let bs = 0; bs < 2; bs++) {
      const stool = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35, 0.35, 0.75, 16),
        new THREE.MeshStandardMaterial({ color: 0x1f242c, roughness: 0.5 })
      );
      stool.position.set(-42 + bs * 2.0, y + 0.38, 39.8);
      stool.castShadow = true;
      this.group.add(stool);
    }

    // B. Cooking Stove & Range Hood
    const stoveGeo = new THREE.BoxGeometry(2.4, 1.05, 1.0);
    const stoveMat = new THREE.MeshStandardMaterial({ color: 0x1c1e22, roughness: 0.3, metalness: 0.7 });
    this.stoveMesh = new THREE.Mesh(stoveGeo, stoveMat);
    this.stoveMesh.position.set(-35.5, y + 0.52, 45);
    this.group.add(this.stoveMesh);

    // Burner Rings (Emissive red indicators)
    for (let b = 0; b < 4; b++) {
      const burnerGeo = new THREE.RingGeometry(0.12, 0.22, 16);
      burnerGeo.rotateX(-Math.PI * 0.5);
      const burnerMat = new THREE.MeshBasicMaterial({ color: 0xff3b14, side: THREE.DoubleSide });
      const burner = new THREE.Mesh(burnerGeo, burnerMat);
      burner.position.set(-36.0 + (b % 2) * 0.8, y + 1.06, 44.7 + Math.floor(b / 2) * 0.5);
      this.group.add(burner);
    }

    // C. Stainless Steel French Door Refrigerator
    const fridgeGeo = new THREE.BoxGeometry(1.6, 2.6, 1.2);
    const fridgeMat = new THREE.MeshStandardMaterial({
      color: 0x8a929e,
      metalness: 0.85,
      roughness: 0.25
    });
    this.fridgeMesh = new THREE.Mesh(fridgeGeo, fridgeMat);
    this.fridgeMesh.position.set(-33.2, y + 1.3, 41.5);
    this.fridgeMesh.castShadow = true;
    this.group.add(this.fridgeMesh);

    // --- MASTER BEDROOM ---
    // A. King-Size Platform Bed
    const bedFrameGeo = new THREE.BoxGeometry(3.6, 0.55, 4.0);
    const bedFrameMat = new THREE.MeshStandardMaterial({ color: 0x2d221a, roughness: 0.5 });
    const bedFrame = new THREE.Mesh(bedFrameGeo, bedFrameMat);
    bedFrame.position.set(-56, y + 0.28, 55);
    bedFrame.castShadow = true;
    this.group.add(bedFrame);

    // Mattress & White Duvet Blanket
    const mattressGeo = new THREE.BoxGeometry(3.2, 0.45, 3.6);
    const duvetMat = new THREE.MeshStandardMaterial({ color: 0xf5f7fa, roughness: 0.9 });
    const mattress = new THREE.Mesh(mattressGeo, duvetMat);
    mattress.position.set(-56, y + 0.65, 55);
    this.group.add(mattress);

    // Padded Headboard
    const headboardGeo = new THREE.BoxGeometry(3.6, 1.6, 0.4);
    const headboardMat = new THREE.MeshStandardMaterial({ color: 0x3d3530, roughness: 0.7 });
    const headboard = new THREE.Mesh(headboardGeo, headboardMat);
    headboard.position.set(-56, y + 1.1, 57.2);
    this.group.add(headboard);

    // Dual Pillows
    const pillowGeo = new THREE.BoxGeometry(1.1, 0.25, 0.7);
    const pillowMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95 });
    const pillowL = new THREE.Mesh(pillowGeo, pillowMat);
    pillowL.position.set(-57, y + 0.95, 56.4);
    this.group.add(pillowL);

    const pillowR = new THREE.Mesh(pillowGeo, pillowMat);
    pillowR.position.set(-55, y + 0.95, 56.4);
    this.group.add(pillowR);

    // B. Floating Nightstands with Bedside Touch Lamps
    for (let ns = 0; ns < 2; ns++) {
      const standX = ns === 0 ? -58.4 : -53.6;
      const stand = new THREE.Mesh(
        new THREE.BoxGeometry(0.9, 0.6, 0.7),
        bedFrameMat
      );
      stand.position.set(standX, y + 0.3, 56.5);
      this.group.add(stand);

      // Nightstand lamp
      const nLamp = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.24, 0.35, 12),
        new THREE.MeshStandardMaterial({ color: 0xffeedd, roughness: 0.3 })
      );
      nLamp.position.set(standX, y + 0.78, 56.5);
      this.group.add(nLamp);
    }

    // C. Modern Sliding Wardrobe Closet
    const closetGeo = new THREE.BoxGeometry(0.8, 3.4, 4.2);
    const closetMat = new THREE.MeshStandardMaterial({ color: 0x231a14, roughness: 0.4 });
    const closet = new THREE.Mesh(closetGeo, closetMat);
    closet.position.set(-63.5, y + 1.7, 52);
    closet.castShadow = true;
    this.group.add(closet);

    // --- SPA BATHROOM ---
    // A. Floating Double Marble Vanity
    const vanityGeo = new THREE.BoxGeometry(4.2, 0.75, 1.4);
    const vanityMat = new THREE.MeshStandardMaterial({ color: 0xe0e0e0, roughness: 0.2, metalness: 0.1 });
    const vanity = new THREE.Mesh(vanityGeo, vanityMat);
    vanity.position.set(-38, y + 0.75, 57);
    this.group.add(vanity);

    // Backlit LED Mirror
    const mirrorGeo = new THREE.BoxGeometry(3.6, 1.8, 0.08);
    const mirrorMat = new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      metalness: 0.95,
      roughness: 0.05
    });
    const mirror = new THREE.Mesh(mirrorGeo, mirrorMat);
    mirror.position.set(-38, y + 2.4, 59.85);
    this.group.add(mirror);

    // Mirror glow frame
    const mirrorGlowGeo = new THREE.BoxGeometry(3.7, 1.9, 0.04);
    const mirrorGlowMat = new THREE.MeshBasicMaterial({ color: 0xffeeaa });
    const mirrorGlow = new THREE.Mesh(mirrorGlowGeo, mirrorGlowMat);
    mirrorGlow.position.set(-38, y + 2.4, 59.9);
    this.group.add(mirrorGlow);

    // B. Frameless Glass Shower Cubicle
    const showerGlassGeo = new THREE.BoxGeometry(2.4, 3.4, 0.08);
    const showerGlassMat = new THREE.MeshPhysicalMaterial({
      color: 0xa8d5e5,
      roughness: 0.05,
      metalness: 0.1,
      transmission: 0.9,
      transparent: true,
      opacity: 0.45,
      reflectivity: 0.8
    });
    const showerGlass = new THREE.Mesh(showerGlassGeo, showerGlassMat);
    showerGlass.position.set(-45.5, y + 1.7, 55.8);
    this.group.add(showerGlass);

    // Chrome Rain Showerhead
    const showerHead = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.3, 0.04, 16),
      new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.9, roughness: 0.1 })
    );
    showerHead.position.set(-45.5, y + 3.2, 57.5);
    this.group.add(showerHead);

    // C. Modern Porcelain Toilet
    const toiletBase = new THREE.Mesh(
      new THREE.BoxGeometry(0.65, 0.65, 0.9),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.1 })
    );
    toiletBase.position.set(-34, y + 0.32, 52);
    this.group.add(toiletBase);
  }

  // =========================================================================
  // 3. 65-INCH SMART TV WITH DYNAMIC REAL-TIME CHANNELS
  // =========================================================================
  initTelevision() {
    const y = this.villaBaseY;

    // Wall Media Console (floating walnut shelf under TV)
    const consoleGeo = new THREE.BoxGeometry(3.8, 0.45, 0.8);
    const consoleMat = new THREE.MeshStandardMaterial({ color: 0x221812, roughness: 0.4 });
    const mediaConsole = new THREE.Mesh(consoleGeo, consoleMat);
    mediaConsole.position.set(-56, y + 0.5, 36.6);
    this.group.add(mediaConsole);

    // Soundbar speaker
    const soundbarGeo = new THREE.BoxGeometry(2.2, 0.14, 0.18);
    const soundbarMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.7 });
    const soundbar = new THREE.Mesh(soundbarGeo, soundbarMat);
    soundbar.position.set(-56, y + 0.8, 36.6);
    this.group.add(soundbar);

    // Dynamic 2D Canvas Screen Texture (1024x576 16:9)
    this.tvCanvas = document.createElement('canvas');
    this.tvCanvas.width = 512;
    this.tvCanvas.height = 288;
    this.tvCtx = this.tvCanvas.getContext('2d');

    this.tvTexture = new THREE.CanvasTexture(this.tvCanvas);
    this.tvTexture.generateMipmaps = false;
    this.tvTexture.minFilter = THREE.LinearFilter;

    // TV Screen Frame & Display Panel
    const tvFrameGeo = new THREE.BoxGeometry(3.4, 2.0, 0.1);
    const tvFrameMat = new THREE.MeshStandardMaterial({ color: 0x050505, metalness: 0.8, roughness: 0.2 });
    const tvFrame = new THREE.Mesh(tvFrameGeo, tvFrameMat);
    tvFrame.position.set(-56, y + 2.1, 36.4);
    this.group.add(tvFrame);

    const tvScreenGeo = new THREE.PlaneGeometry(3.2, 1.8);
    this.tvScreenMat = new THREE.MeshBasicMaterial({
      map: this.tvTexture,
      toneMapped: false
    });
    this.tvScreenMesh = new THREE.Mesh(tvScreenGeo, this.tvScreenMat);
    this.tvScreenMesh.position.set(-56, y + 2.1, 36.46);
    this.tvScreenMesh.rotation.y = 0; // Faces South toward sofa
    this.group.add(this.tvScreenMesh);

    // Subtle TV glow light into living room
    this.tvLight = new THREE.PointLight(0x4080ff, 0.8, 8.0, 1.2);
    this.tvLight.position.set(-56, y + 2.1, 37.5);
    this.group.add(this.tvLight);

    this.renderTVFrame();
  }

  renderTVFrame() {
    const ctx = this.tvCtx;
    if (!ctx) return;
    const w = this.tvCanvas.width;
    const h = this.tvCanvas.height;

    if (!this.tvPower || this.tvChannel === 0) {
      // OFF State: Sleek black with red standby LED
      ctx.fillStyle = '#080a0f';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#ff1744';
      ctx.beginPath();
      ctx.arc(w - 20, h - 20, 4, 0, Math.PI * 2);
      ctx.fill();
      if (this.tvLight) this.tvLight.intensity = 0.05;
      this.tvTexture.needsUpdate = true;
      return;
    }

    if (this.tvChannel === 1) {
      // Channel 1: "BLACKSHORE 24" NEWS LIVE
      ctx.fillStyle = '#0a101d';
      ctx.fillRect(0, 0, w, h);

      // News studio backdrop & map graphics
      ctx.fillStyle = '#14223d';
      ctx.fillRect(20, 20, w - 40, h - 70);

      ctx.fillStyle = '#00e5ff';
      ctx.font = 'bold 22px Orbitron, sans-serif';
      ctx.fillText('BLACKSHORE 24 NEWS', 36, 54);

      ctx.fillStyle = '#e6a12b';
      ctx.font = '14px Inter, sans-serif';
      ctx.fillText('LIVE • DOWNTOWN FINANCIAL DISTRICT', 36, 76);

      // Breaking news banner
      ctx.fillStyle = '#d32f2f';
      ctx.fillRect(0, h - 42, w, 42);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 15px Orbitron, sans-serif';
      ctx.fillText('BREAKING:', 16, h - 16);

      ctx.fillStyle = '#ffffff';
      ctx.font = '13px Inter, sans-serif';
      const tickerOffset = (Date.now() * 0.08) % 600;
      ctx.fillText('HIGHWAY PATROL INCREASES CHECKPOINTS • APEX GT-R RECOVERED • WEATHER: SUNNY 28°C', 120 - tickerOffset, h - 16);

      if (this.tvLight) {
        this.tvLight.color.setHex(0x3a7bd5);
        this.tvLight.intensity = 0.75 + Math.sin(Date.now() * 0.003) * 0.15;
      }
    } else if (this.tvChannel === 2) {
      // Channel 2: "SPEED CIRCUIT TV"
      ctx.fillStyle = '#120508';
      ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = '#ff3d00';
      ctx.font = 'bold 24px Orbitron, sans-serif';
      ctx.fillText('APEX TELEMETRY PRO', 24, 46);

      // Speed gauge
      const speedAnim = 160 + Math.sin(Date.now() * 0.005) * 45;
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 54px Orbitron, sans-serif';
      ctx.fillText(`${Math.round(speedAnim)}`, 36, 128);
      ctx.font = '16px Orbitron, sans-serif';
      ctx.fillText('MPH', 160, 128);

      // Lap times & track graphic
      ctx.strokeStyle = '#ff9100';
      ctx.lineWidth = 3;
      ctx.strokeRect(260, 40, 220, 120);
      ctx.fillStyle = '#00e676';
      ctx.font = '12px Orbitron, sans-serif';
      ctx.fillText('SECTOR 1: 24.12s', 276, 70);
      ctx.fillText('SECTOR 2: 38.45s', 276, 94);
      ctx.fillText('DIFF: -0.42s (PURPLE)', 276, 118);

      if (this.tvLight) {
        this.tvLight.color.setHex(0xff5722);
        this.tvLight.intensity = 0.9;
      }
    } else if (this.tvChannel === 3) {
      // Channel 3: "SYNTHWAVE VISUALIZER"
      ctx.fillStyle = '#0d0417';
      ctx.fillRect(0, 0, w, h);

      // Equalizer bars
      const numBars = 24;
      const barW = (w - 60) / numBars;
      for (let i = 0; i < numBars; i++) {
        const barH = 30 + Math.abs(Math.sin(Date.now() * 0.006 + i * 0.4)) * 140;
        const grad = ctx.createLinearGradient(0, h - 30, 0, h - 30 - barH);
        grad.addColorStop(0, '#9c27b0');
        grad.addColorStop(0.5, '#e040fb');
        grad.addColorStop(1, '#00e5ff');
        ctx.fillStyle = grad;
        ctx.fillRect(30 + i * barW, h - 30 - barH, barW - 4, barH);
      }

      ctx.fillStyle = '#00e5ff';
      ctx.font = 'bold 16px Orbitron, sans-serif';
      ctx.fillText('CHILLWAVE RETRO FM 88.5', 30, 40);

      if (this.tvLight) {
        this.tvLight.color.setHex(0xd05ce3);
        this.tvLight.intensity = 0.8 + Math.sin(Date.now() * 0.01) * 0.25;
      }
    }

    this.tvTexture.needsUpdate = true;
  }

  // =========================================================================
  // 4. INTERIOR LIGHTING & CEILING POINT LIGHTS
  // =========================================================================
  initLighting() {
    const y = this.villaBaseY + 4.2;

    // 1. Living Room Warm Chandelier (3000K Warm Gold)
    const livingLight = new THREE.PointLight(0xffdfa8, 1.2, 14.0, 1.3);
    livingLight.position.set(-56, y, 43);
    livingLight.castShadow = true;
    this.group.add(livingLight);
    this.ceilingLights.push(livingLight);

    // 2. Kitchen Island Pendant Lights (4000K Pure White)
    const kitchenLight = new THREE.PointLight(0xfff6eb, 1.4, 14.0, 1.3);
    kitchenLight.position.set(-41, y, 42);
    kitchenLight.castShadow = true;
    this.group.add(kitchenLight);
    this.ceilingLights.push(kitchenLight);

    // 3. Master Bedroom Ambient Chandelier (2700K Soft Amber)
    const bedLight = new THREE.PointLight(0xffd499, 1.0, 12.0, 1.4);
    bedLight.position.set(-56, y, 55);
    this.group.add(bedLight);
    this.ceilingLights.push(bedLight);

    // 4. Spa Bathroom Crisp LED Fixture
    const bathLight = new THREE.PointLight(0xf2f8ff, 1.1, 10.0, 1.4);
    bathLight.position.set(-38, y, 55);
    this.group.add(bathLight);
    this.ceilingLights.push(bathLight);

    // Ceiling fixture geometry cups
    [-56, -41].forEach(lx => {
      const fixture = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35, 0.45, 0.15, 16),
        new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8 })
      );
      fixture.position.set(lx, y + 0.1, 42.5);
      this.group.add(fixture);
    });
  }

  // =========================================================================
  // 5. RESIDENT NPC COMPANION (ELENA CROSS) & DAILY ROUTINE
  // =========================================================================
  initResidentNPC() {
    this.npc = new THREE.Group();
    this.npc.name = 'ElenaCrossResident';
    this.group.add(this.npc);

    const skinMat = new THREE.MeshStandardMaterial({
      color: 0xe0ad89,
      roughness: 0.65,
      metalness: 0.05
    });

    const sweaterMat = new THREE.MeshStandardMaterial({
      color: 0x1b4d3e, // Deep emerald knitted lounge sweater
      roughness: 0.85
    });

    const pantsMat = new THREE.MeshStandardMaterial({
      color: 0x242831, // Charcoal relaxed lounge trousers
      roughness: 0.7
    });

    const hairMat = new THREE.MeshStandardMaterial({
      color: 0x1a120c, // Dark espresso brown
      roughness: 0.5
    });

    // Torso & Knitted Sweater
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.22, 0.65, 12), sweaterMat);
    torso.position.y = 1.05;
    torso.castShadow = true;
    this.npc.add(torso);

    // Head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 14, 14), skinMat);
    head.position.y = 1.52;
    head.scale.set(1, 1.15, 1);
    this.npc.add(head);

    // Hair (Layered shoulder cut)
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.18, 14, 14), hairMat);
    hair.position.set(0, 1.55, -0.02);
    hair.scale.set(1.05, 1.2, 1.1);
    this.npc.add(hair);

    // Legs & Pants
    const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.8, 10), pantsMat);
    legL.position.set(-0.11, 0.42, 0);
    this.npc.add(legL);

    const legR = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.8, 10), pantsMat);
    legR.position.set(0.11, 0.42, 0);
    this.npc.add(legR);

    // Shoes (White clean sneakers)
    const shoeMat = new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.3 });
    const shoeL = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.1, 0.26), shoeMat);
    shoeL.position.set(-0.11, 0.05, 0.04);
    this.npc.add(shoeL);

    const shoeR = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.1, 0.26), shoeMat);
    shoeR.position.set(0.11, 0.05, 0.04);
    this.npc.add(shoeR);

    // Arms
    const armL = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.065, 0.58, 10), sweaterMat);
    armL.position.set(-0.32, 1.05, 0);
    this.npc.add(armL);

    const armR = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.065, 0.58, 10), sweaterMat);
    armR.position.set(0.32, 1.05, 0);
    this.npc.add(armR);

    // Initial position: relaxing in living room armchair / sofa
    this.npc.position.set(-54.5, this.villaBaseY + 0.1, 44.0);
    this.npc.rotation.y = -Math.PI * 0.45;

    this.npcCurrentActivity = 'relaxing';
  }

  updateNPCRoutine(hourOfDay) {
    if (!this.npc) return;
    const y = this.villaBaseY + 0.1;

    // Daily Schedule:
    // 07:00 - 09:30: Kitchen stove cooking
    // 10:00 - 13:00: Sitting at kitchen island / breakfast
    // 13:00 - 17:00: Living room sofa watching TV
    // 17:00 - 21:30: Living room armchair / reading
    // 22:00 - 06:30: Bedroom sleeping
    if (hourOfDay >= 7.0 && hourOfDay < 9.5) {
      this.npc.position.set(-37.5, y, 45.0);
      this.npc.rotation.y = Math.PI * 0.5; // Facing stove
      this.npcCurrentActivity = 'cooking breakfast';
    } else if (hourOfDay >= 9.5 && hourOfDay < 13.0) {
      this.npc.position.set(-41.0, y, 40.0);
      this.npc.rotation.y = 0; // Facing island
      this.npcCurrentActivity = 'having tea at the island';
    } else if (hourOfDay >= 13.0 && hourOfDay < 17.5) {
      this.npc.position.set(-55.0, y, 43.5);
      this.npc.rotation.y = -Math.PI * 0.15; // Facing TV
      this.npcCurrentActivity = 'watching television';
    } else if (hourOfDay >= 17.5 && hourOfDay < 22.0) {
      this.npc.position.set(-58.0, y, 42.5);
      this.npc.rotation.y = Math.PI * 0.25;
      this.npcCurrentActivity = 'reading in the lounge';
    } else {
      this.npc.position.set(-54.5, y + 0.35, 55.5);
      this.npc.rotation.y = Math.PI; // Resting on bed
      this.npcCurrentActivity = 'sleeping';
    }
  }

  // =========================================================================
  // 6. SOLID BOX COLLIDERS REGISTRATION
  // =========================================================================
  initColliders() {
    this.colliders = [];
    const y = this.villaBaseY;

    // Helper to push collider box
    const addBoxCollider = (minX, minY, minZ, maxX, maxY, maxZ) => {
      const box = new THREE.Box3(
        new THREE.Vector3(minX, minY, minZ),
        new THREE.Vector3(maxX, maxY, maxZ)
      );
      this.colliders.push(box);
      if (this.terrain && this.terrain.colliders) {
        this.terrain.colliders.push(box);
      }
    };

    // 1. Exterior Walls:
    // West wall
    addBoxCollider(-64.5, y, 35.5, -63.5, y + 5.0, 60.5);
    // East wall
    addBoxCollider(-32.5, y, 35.5, -31.5, y + 5.0, 60.5);
    // North wall
    addBoxCollider(-64.5, y, 59.5, -31.5, y + 5.0, 60.5);
    // South wall (Left of door: -64.5 to -41.7)
    addBoxCollider(-64.5, y, 35.5, -41.7, y + 5.0, 36.5);
    // South wall (Right of door: -38.8 to -31.5)
    addBoxCollider(-38.8, y, 35.5, -31.5, y + 5.0, 36.5);

    // 2. Interior Partition Walls:
    // West-East bedroom divider (-64 to -48 at Z=48)
    addBoxCollider(-64.0, y, 47.8, -48.0, y + 5.0, 48.4);
    // Central wall segments
    addBoxCollider(-48.2, y, 36.0, -47.8, y + 5.0, 44.0);
    addBoxCollider(-48.2, y, 52.0, -47.8, y + 5.0, 60.0);

    // 3. Furniture Obstacles:
    // Kitchen island
    addBoxCollider(-43.5, y, 40.5, -38.5, y + 1.2, 42.5);
    // Living room sofa
    addBoxCollider(-58.8, y, 42.5, -53.2, y + 1.1, 45.8);
    // King bed
    addBoxCollider(-58.2, y, 52.5, -53.8, y + 1.2, 57.5);
    // Refrigerator
    addBoxCollider(-34.2, y, 40.5, -32.2, y + 2.8, 42.5);

    // Dynamic front door collider
    this.doorCollider = new THREE.Box3(
      new THREE.Vector3(-41.8, y, 35.7),
      new THREE.Vector3(-38.7, y + 3.4, 36.3)
    );
    this.terrain.colliders.push(this.doorCollider);
  }

  // =========================================================================
  // 7. REAL-TIME TICK & INTERACTIVE PROXIMITY DETECTION
  // =========================================================================
  update(delta, playerPos) {
    if (!playerPos) return;

    // 1. Smooth Door Swing Animation
    this.doorCurrentAngle += (this.doorTargetAngle - this.doorCurrentAngle) * Math.min(1.0, delta * 6.0);
    if (this.doorPivot) {
      this.doorPivot.rotation.y = this.doorCurrentAngle;
    }

    // Dynamic door collider adjustment
    if (this.doorCollider) {
      if (this.doorOpen) {
        // Move collider out of way
        this.doorCollider.min.set(-9999, -9999, -9999);
        this.doorCollider.max.set(-9999, -9999, -9999);
      } else {
        this.doorCollider.min.set(-41.8, this.villaBaseY, 35.7);
        this.doorCollider.max.set(-38.7, this.villaBaseY + 3.4, 36.3);
      }
    }

    // 2. Television animation
    if (this.tvPower && this.tvChannel > 0) {
      this.tvTimer += delta;
      if (this.tvTimer > 0.05) { // 20 FPS canvas refresh
        this.tvTimer = 0;
        this.renderTVFrame();
      }
    }

    // 3. Faucet animated water stream
    if (this.faucetsRunning && this.waterStreamMesh) {
      this.waterStreamMesh.visible = true;
      this.waterStreamMesh.rotation.y += delta * 12.0;
    } else if (this.waterStreamMesh) {
      this.waterStreamMesh.visible = false;
    }

    // 4. Update NPC Routine based on game time
    const timeOfDay = this.gameState.world?.timeOfDay ?? 12.0;
    this.updateNPCRoutine(timeOfDay);

    // 5. Proximity hotspot checks for player HUD interaction prompts
    this.checkInteractions(playerPos);
  }

  checkInteractions(playerPos) {
    if (!this.hud) return;

    // Interactivity zones
    const doorPos = new THREE.Vector3(-40.2, this.villaBaseY + 1.2, 36.0);
    const switchPos = new THREE.Vector3(-37.5, this.villaBaseY + 1.2, 36.5);
    const sinkPos = new THREE.Vector3(-40.0, this.villaBaseY + 1.0, 41.5);
    const fridgePos = new THREE.Vector3(-33.5, this.villaBaseY + 1.0, 41.5);
    const stovePos = new THREE.Vector3(-35.5, this.villaBaseY + 1.0, 45.0);
    const tvPos = new THREE.Vector3(-56.0, this.villaBaseY + 1.8, 38.0);
    const bedPos = new THREE.Vector3(-56.0, this.villaBaseY + 1.0, 54.0);
    const npcPos = this.npc ? this.npc.position : new THREE.Vector3(0, 0, 0);

    const dDoor = playerPos.distanceTo(doorPos);
    const dSwitch = playerPos.distanceTo(switchPos);
    const dSink = playerPos.distanceTo(sinkPos);
    const dFridge = playerPos.distanceTo(fridgePos);
    const dStove = playerPos.distanceTo(stovePos);
    const dTV = playerPos.distanceTo(tvPos);
    const dBed = playerPos.distanceTo(bedPos);
    const dNPC = playerPos.distanceTo(npcPos);

    if (dDoor < 2.8) {
      this.activeInteraction = 'door';
      this.hud.showPrompt('F', this.doorOpen ? 'CLOSE FRONT DOOR' : 'OPEN FRONT DOOR');
    } else if (dSwitch < 2.4) {
      this.activeInteraction = 'lights';
      this.hud.showPrompt('F', this.lightsOn ? 'TURN LIGHTS OFF' : 'TURN LIGHTS ON');
    } else if (dSink < 2.4) {
      this.activeInteraction = 'sink';
      this.hud.showPrompt('F', this.faucetsRunning ? 'TURN OFF FAUCET' : 'DRINK RUNNING WATER');
    } else if (dFridge < 2.5 || dStove < 2.5) {
      this.activeInteraction = 'food';
      this.hud.showPrompt('F', 'EAT FOOD / REFRIGERATOR');
    } else if (dTV < 3.6) {
      this.activeInteraction = 'tv';
      const chName = this.tvChannel === 1 ? 'NEWS 24' : this.tvChannel === 2 ? 'RACING' : this.tvChannel === 3 ? 'SYNTHWAVE' : 'OFF';
      this.hud.showPrompt('F', `SWITCH TV CHANNEL (${chName})`);
    } else if (dBed < 2.8) {
      this.activeInteraction = 'bed';
      this.hud.showPrompt('F', 'SLEEP & RESTORE ENERGY (6 HRS)');
    } else if (dNPC < 2.8) {
      this.activeInteraction = 'npc';
      this.hud.showPrompt('E', 'TALK TO ELENA CROSS');
    } else {
      if (this.activeInteraction) {
        this.activeInteraction = null;
        this.hud.hidePrompt();
      }
    }
  }

  // =========================================================================
  // 8. INTERACTION DISPATCHERS (KEY [F] AND [E])
  // =========================================================================
  triggerInteraction(key = 'F') {
    if (!this.activeInteraction) return false;

    if (key === 'F') {
      if (this.activeInteraction === 'door') {
        this.doorOpen = !this.doorOpen;
        this.doorTargetAngle = this.doorOpen ? -Math.PI * 0.45 : 0;
        if (this.audio) this.audio.playDoorSound(this.doorOpen);
        return true;
      }

      if (this.activeInteraction === 'lights') {
        this.lightsOn = !this.lightsOn;
        this.ceilingLights.forEach(light => {
          light.intensity = this.lightsOn ? 1.2 : 0.05;
        });
        if (this.audio) this.audio.playLightSwitch();
        return true;
      }

      if (this.activeInteraction === 'sink') {
        this.faucetsRunning = !this.faucetsRunning;
        if (this.audio) this.audio.playWaterFaucet(this.faucetsRunning);
        if (this.faucetsRunning && this.gameState.player.needs) {
          this.gameState.player.needs.thirst = Math.min(100, (this.gameState.player.needs.thirst || 70) + 35);
        }
        return true;
      }

      if (this.activeInteraction === 'food') {
        if (this.audio) this.audio.playEatingSound();
        if (this.gameState.player.needs) {
          this.gameState.player.needs.hunger = 100;
          this.gameState.player.needs.energy = Math.min(100, (this.gameState.player.needs.energy || 70) + 20);
        }
        return true;
      }

      if (this.activeInteraction === 'tv') {
        this.tvChannel = (this.tvChannel + 1) % 4;
        if (this.audio) this.audio.playTVChannelSwitch();
        this.renderTVFrame();
        return true;
      }

      if (this.activeInteraction === 'bed') {
        if (this.audio) this.audio.playSleepChime();
        // Advance clock by 6 hours
        if (this.gameState.world) {
          this.gameState.world.timeOfDay = ((this.gameState.world.timeOfDay || 12) + 6) % 24;
        }
        // Restore all player biological vitals
        if (this.gameState.player.needs) {
          this.gameState.player.needs.energy = 100;
          this.gameState.player.needs.stamina = 100;
          this.gameState.player.health = 100;
        }
        return true;
      }
    }

    if (key === 'E' && this.activeInteraction === 'npc') {
      this.talkToElena();
      return true;
    }

    return false;
  }

  talkToElena() {
    const dialogues = [
      "Good to see you back at the safehouse! The fridge is fully stocked and the water filter on the tap is clean. Make yourself at home.",
      "Highway patrol has set up automated speed traps near the coastal bridge. If you're running freight, take the canyon bypass.",
      "If you're exhausted from a sprint or pursuit, get some rest in the master bedroom. You can't outdrive the syndicate on zero stamina.",
      "I calibrated the garage diagnostic rack outside. All your unlocked vehicles are fueled up and ready to hit the tarmac."
    ];

    const text = dialogues[this.dialogueIndex % dialogues.length];
    this.dialogueIndex++;

    if (this.audio) this.audio.playGPSChime();
    if (this.hud && typeof this.hud.showCommsDialogue === 'function') {
      this.hud.showCommsDialogue('ELENA CROSS', text, 6.0);
    } else if (this.hud && typeof this.hud.showComms === 'function') {
      this.hud.showComms('ELENA CROSS', text);
    }
  }
}
