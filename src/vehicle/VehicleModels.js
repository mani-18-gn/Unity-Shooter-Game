// ROADBOUND - High-Detail Original Vehicle 3D Models & PBR Automotive Architecture
import * as THREE from 'three';

export class VehicleModels {
  static createMaterials(paintColor = '#c4151c', finish = 'metallic', rimColor = '#e0e0e0') {
    let roughness = 0.12;
    let metalness = 0.88;
    let clearcoat = 1.0;
    let clearcoatRoughness = 0.04;

    if (finish === 'matte') {
      roughness = 0.65;
      metalness = 0.2;
      clearcoat = 0.0;
    } else if (finish === 'gloss') {
      roughness = 0.06;
      metalness = 0.45;
      clearcoat = 1.0;
    } else if (finish === 'carbon') {
      roughness = 0.25;
      metalness = 0.55;
      clearcoat = 0.6;
    }

    // Default to rich exotic Rosso Corsa racing red if dark default provided
    const primaryColor = (paintColor === '#111111' || !paintColor) ? '#c4151c' : paintColor;

    return {
      body: new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(primaryColor),
        roughness: roughness,
        metalness: metalness,
        clearcoat: clearcoat,
        clearcoatRoughness: clearcoatRoughness,
        reflectivity: 0.95
      }),
      carbon: new THREE.MeshStandardMaterial({
        color: 0x16181b,
        roughness: 0.28,
        metalness: 0.5
      }),
      glass: new THREE.MeshPhysicalMaterial({
        color: 0x050c14,
        roughness: 0.04,
        metalness: 0.15,
        transmission: 0.6,
        transparent: true,
        opacity: 0.75,
        ior: 1.52,
        reflectivity: 0.95
      }),
      chrome: new THREE.MeshStandardMaterial({
        color: 0xf0f0f0,
        roughness: 0.02,
        metalness: 0.99
      }),
      titaniumBlue: new THREE.MeshStandardMaterial({
        color: 0x1565c0,
        roughness: 0.15,
        metalness: 0.95,
        emissive: 0x0d47a1,
        emissiveIntensity: 0.3
      }),
      interior: new THREE.MeshStandardMaterial({
        color: 0x181a1f,
        roughness: 0.75,
        metalness: 0.12
      }),
      interiorAccent: new THREE.MeshStandardMaterial({
        color: new THREE.Color(primaryColor),
        roughness: 0.4,
        metalness: 0.3
      }),
      tireRubber: new THREE.MeshStandardMaterial({
        color: 0x1a1c20,
        roughness: 0.88,
        metalness: 0.04
      }),
      rim: new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(rimColor),
        roughness: 0.08,
        metalness: 0.96,
        clearcoat: 0.9
      }),
      brakeDisc: new THREE.MeshStandardMaterial({
        color: 0x8a929a,
        roughness: 0.22,
        metalness: 0.92
      }),
      brakeCaliper: new THREE.MeshStandardMaterial({
        color: 0xd50000, // Racing Brembo red
        roughness: 0.15,
        metalness: 0.55
      }),
      headlightOff: new THREE.MeshStandardMaterial({
        color: 0xd0d4dc,
        roughness: 0.08,
        metalness: 0.9
      }),
      headlightOn: new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0xffffff,
        emissiveIntensity: 2.2
      }),
      taillightOff: new THREE.MeshStandardMaterial({
        color: 0x4a0008,
        roughness: 0.18
      }),
      taillightOn: new THREE.MeshStandardMaterial({
        color: 0xff1744,
        emissive: 0xff1744,
        emissiveIntensity: 2.5
      }),
      exhaustFlame: new THREE.MeshBasicMaterial({
        color: 0x00e5ff,
        transparent: true,
        opacity: 0.95
      }),
      indicatorL: new THREE.MeshStandardMaterial({
        color: 0xffab00,
        emissive: 0xffab00,
        emissiveIntensity: 0.1
      }),
      indicatorR: new THREE.MeshStandardMaterial({
        color: 0xffab00,
        emissive: 0xffab00,
        emissiveIntensity: 0.1
      }),
      autoGreen: new THREE.MeshStandardMaterial({
        color: 0x0f592f,
        roughness: 0.35,
        metalness: 0.2
      }),
      autoYellow: new THREE.MeshStandardMaterial({
        color: 0xfbc02d,
        roughness: 0.3,
        metalness: 0.2
      }),
      canvasRoof: new THREE.MeshStandardMaterial({
        color: 0x181c20,
        roughness: 0.9,
        metalness: 0.05
      }),
      leather: new THREE.MeshStandardMaterial({
        color: 0x5c3a21,
        roughness: 0.6,
        metalness: 0.1
      })
    };
  }

  // 1. APEX VANGUARD GT-R (Aerodynamic Sculpted Exotic Hypercar)
  static buildApexVanguard(mats) {
    const root = new THREE.Group();
    root.name = 'Apex_Vanguard';

    const bodyGroup = new THREE.Group();
    bodyGroup.name = 'Chassis';

    // 1. Sleek Central Monocoque Cockpit & Floorpan
    const bellyPanGeo = new THREE.BoxGeometry(1.92, 0.22, 4.3);
    const bellyPan = new THREE.Mesh(bellyPanGeo, mats.carbon);
    bellyPan.position.y = 0.26;
    bellyPan.castShadow = true;
    bodyGroup.add(bellyPan);

    // 2. Main Sculpted Body Midsection (Aerodynamic Tumblehome)
    const midBodyGeo = new THREE.BoxGeometry(1.86, 0.42, 2.6);
    const midBody = new THREE.Mesh(midBodyGeo, mats.body);
    midBody.position.set(0, 0.52, 0.05);
    midBody.castShadow = true;
    bodyGroup.add(midBody);

    // 3. Front Nose & Wedge Hood with Sculpted Creases
    const noseGeo = new THREE.CylinderGeometry(0.78, 1.02, 1.6, 6);
    noseGeo.rotateY(Math.PI / 6);
    const nose = new THREE.Mesh(noseGeo, mats.body);
    nose.position.set(0, 0.50, 1.48);
    nose.scale.set(0.96, 0.34, 1.15);
    nose.castShadow = true;
    bodyGroup.add(nose);

    // Dual Recessed Carbon Hood Heat Extractor Vents
    const hoodVentL = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.04, 0.55), mats.carbon);
    hoodVentL.position.set(-0.35, 0.62, 1.35);
    hoodVentL.rotation.x = -0.12;
    const hoodVentR = hoodVentL.clone();
    hoodVentR.position.x = 0.35;
    bodyGroup.add(hoodVentL, hoodVentR);

    // 4. Front Aerodynamic Carbon Splitter & Dive Planes (Canards)
    const splitter = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.05, 0.95), mats.carbon);
    splitter.position.set(0, 0.16, 2.18);
    splitter.castShadow = true;
    bodyGroup.add(splitter);

    const canardL = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.03, 0.24), mats.carbon);
    canardL.position.set(-0.96, 0.32, 2.05);
    canardL.rotation.z = -0.25;
    const canardR = canardL.clone();
    canardR.position.x = 0.96;
    canardR.rotation.z = 0.25;
    bodyGroup.add(canardL, canardR);

    // 5. Front Honeycomb Grille & Center Air Dam
    const grilleMesh = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.22, 0.15), mats.carbon);
    grilleMesh.position.set(0, 0.30, 2.15);
    bodyGroup.add(grilleMesh);

    // 6. Sculpted Front Wheel Fenders with Extractor Louvers
    const fenderL = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.44, 1.25), mats.body);
    fenderL.position.set(-0.94, 0.54, 1.32);
    fenderL.castShadow = true;
    const fenderR = fenderL.clone();
    fenderR.position.x = 0.94;
    bodyGroup.add(fenderL, fenderR);

    // 7. Muscular Rear Haunches over Wheels
    const rearHaunchL = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.52, 1.45), mats.body);
    rearHaunchL.position.set(-0.96, 0.60, -1.25);
    rearHaunchL.castShadow = true;
    const rearHaunchR = rearHaunchL.clone();
    rearHaunchR.position.x = 0.96;
    bodyGroup.add(rearHaunchL, rearHaunchR);

    // 8. Side Rocker Panels & Large Radiator Air Scoops
    const sideSkirtL = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.14, 1.8), mats.carbon);
    sideSkirtL.position.set(-0.98, 0.22, 0.05);
    const sideSkirtR = sideSkirtL.clone();
    sideSkirtR.position.x = 0.98;
    bodyGroup.add(sideSkirtL, sideSkirtR);

    const sideScoopL = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.32, 0.55), mats.carbon);
    sideScoopL.position.set(-0.92, 0.46, -0.45);
    sideScoopL.rotation.y = 0.18;
    const sideScoopR = sideScoopL.clone();
    sideScoopR.position.x = 0.92;
    sideScoopR.rotation.y = -0.18;
    bodyGroup.add(sideScoopL, sideScoopR);

    // 9. Aerodynamic Greenhouse Canopy (Curved Tinted Glass)
    const cabinGeo = new THREE.CylinderGeometry(0.72, 0.88, 1.7, 8);
    cabinGeo.rotateZ(Math.PI / 2);
    const cabin = new THREE.Mesh(cabinGeo, mats.glass);
    cabin.position.set(0, 0.95, -0.05);
    cabin.scale.set(0.96, 0.48, 1.15);
    cabin.castShadow = true;
    bodyGroup.add(cabin);

    // Double-bubble Carbon Roof Spine & Induction Snorkel Scoop
    const roofSpine = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.10, 1.5), mats.carbon);
    roofSpine.position.set(0, 1.22, -0.12);
    roofSpine.castShadow = true;
    bodyGroup.add(roofSpine);

    const roofScoop = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.12, 0.65), mats.carbon);
    roofScoop.position.set(0, 1.28, 0.2);
    roofScoop.rotation.x = -0.18;
    bodyGroup.add(roofScoop);

    // 10. Rear Engine Glass Deck & Visible Twin-Turbo V12 Manifold
    const engineCover = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.08, 1.15), mats.glass);
    engineCover.position.set(0, 0.86, -1.05);
    engineCover.rotation.x = 0.15;
    bodyGroup.add(engineCover);

    const engineBlock = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.28, 0.95), mats.interior);
    engineBlock.position.set(0, 0.65, -1.05);
    const manifoldChrome = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.12, 0.75), mats.chrome);
    manifoldChrome.position.set(0, 0.76, -1.05);
    bodyGroup.add(engineBlock, manifoldChrome);

    // 11. Swan-Neck Mounted Carbon GT Rear Wing with Endplates
    const wingBlade = new THREE.Mesh(new THREE.BoxGeometry(1.98, 0.05, 0.38), mats.carbon);
    wingBlade.position.set(0, 1.18, -2.12);
    wingBlade.rotation.x = -0.06;
    wingBlade.castShadow = true;
    bodyGroup.add(wingBlade);

    const endplateL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.22, 0.42), mats.carbon);
    endplateL.position.set(-0.99, 1.18, -2.12);
    const endplateR = endplateL.clone();
    endplateR.position.x = 0.99;
    bodyGroup.add(endplateL, endplateR);

    const pylonL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.36, 0.22), mats.carbon);
    pylonL.position.set(-0.48, 0.98, -2.02);
    pylonL.rotation.x = 0.22;
    const pylonR = pylonL.clone();
    pylonR.position.x = 0.48;
    pylonR.rotation.x = 0.22;
    bodyGroup.add(pylonL, pylonR);

    // 12. Aggressive Rear Aerodynamic Diffuser with Vertical Strakes
    const diffuser = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.12, 0.7), mats.carbon);
    diffuser.position.set(0, 0.22, -2.15);
    diffuser.rotation.x = -0.15;
    diffuser.castShadow = true;
    bodyGroup.add(diffuser);

    for (let f = -0.6; f <= 0.61; f += 0.4) {
      const fin = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.22, 0.55), mats.carbon);
      fin.position.set(f, 0.20, -2.15);
      bodyGroup.add(fin);
    }

    // 13. Quad Titanium Exhaust Pipes with Heat-Blued Tips & Internal Flame Cones
    const quadExhausts = [];
    const flameCones = [];
    const exhOffsets = [-0.36, -0.12, 0.12, 0.36];

    exhOffsets.forEach(ox => {
      const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.32, 14), mats.titaniumBlue);
      pipe.rotation.x = Math.PI / 2;
      pipe.position.set(ox, 0.46, -2.22);
      bodyGroup.add(pipe);
      quadExhausts.push(pipe);

      // Interior backfire flame cone (hidden by default)
      const flame = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.35, 8), mats.exhaustFlame);
      flame.rotation.x = -Math.PI / 2;
      flame.position.set(ox, 0.46, -2.38);
      flame.visible = false;
      bodyGroup.add(flame);
      flameCones.push(flame);
    });

    // 14. Matrix LED Projector Headlights & Jewel DRL Bars
    const hlLensGeo = new THREE.BoxGeometry(0.28, 0.07, 0.18);
    const hlL = new THREE.Mesh(hlLensGeo, mats.headlightOn);
    hlL.position.set(-0.72, 0.54, 2.05);
    hlL.rotation.y = -0.22;
    const hlR = new THREE.Mesh(hlLensGeo, mats.headlightOn);
    hlR.position.set(0.72, 0.54, 2.05);
    hlR.rotation.y = 0.22;
    bodyGroup.add(hlL, hlR);

    // Forward Projector Spotlights with Ground Illumination
    const spotL = new THREE.SpotLight(0xffffff, 2.8, 85, Math.PI / 5.5, 0.35);
    spotL.position.set(-0.72, 0.55, 2.12);
    const spotTargetL = new THREE.Object3D();
    spotTargetL.position.set(-0.72, 0.15, 38);
    bodyGroup.add(spotL, spotTargetL);
    spotL.target = spotTargetL;

    const spotR = new THREE.SpotLight(0xffffff, 2.8, 85, Math.PI / 5.5, 0.35);
    spotR.position.set(0.72, 0.55, 2.12);
    const spotTargetR = new THREE.Object3D();
    spotTargetR.position.set(0.72, 0.15, 38);
    bodyGroup.add(spotR, spotTargetR);
    spotR.target = spotTargetR;

    // 15. Continuous Full-Width 3D Laser LED Taillight Bar
    const tlBar = new THREE.Mesh(new THREE.BoxGeometry(1.82, 0.05, 0.08), mats.taillightOn);
    tlBar.position.set(0, 0.65, -2.22);
    bodyGroup.add(tlBar);

    // 16. Sculpted Aerodynamic Side Mirrors with Turn Signal Blades
    const mirrorStemL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.04, 0.04), mats.carbon);
    mirrorStemL.position.set(-0.85, 0.85, 0.65);
    const mirrorHousingL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.09, 0.12), mats.body);
    mirrorHousingL.position.set(-0.95, 0.86, 0.65);
    const mirrorGlassL = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.08, 0.10), mats.chrome);
    mirrorGlassL.position.set(-0.94, 0.86, 0.64);
    bodyGroup.add(mirrorStemL, mirrorHousingL, mirrorGlassL);

    const mirrorStemR = mirrorStemL.clone(); mirrorStemR.position.x = 0.85;
    const mirrorHousingR = mirrorHousingL.clone(); mirrorHousingR.position.x = 0.95;
    const mirrorGlassR = mirrorGlassL.clone(); mirrorGlassR.position.x = 0.94;
    bodyGroup.add(mirrorStemR, mirrorHousingR, mirrorGlassR);

    // 17. Interior Cockpit Details (Racing seats, flat-bottom steering wheel, digital dashboard)
    const steeringWheel = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.025, 8, 20), mats.carbon);
    steeringWheel.position.set(-0.38, 0.78, 0.32);
    steeringWheel.rotation.x = -Math.PI / 5;
    bodyGroup.add(steeringWheel);

    const dashScreen = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.14, 0.04), mats.headlightOn);
    dashScreen.position.set(-0.38, 0.82, 0.46);
    dashScreen.rotation.x = -0.25;
    bodyGroup.add(dashScreen);

    // Carbon fiber racing bucket seats
    const seatL = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.68, 0.48), mats.interior);
    seatL.position.set(-0.38, 0.62, -0.15);
    const seatR = seatL.clone();
    seatR.position.x = 0.38;
    bodyGroup.add(seatL, seatR);

    root.add(bodyGroup);

    // 4 Realistic Alloy Wheels with Brembo Calipers & Drilled Discs
    const wheels = VehicleModels.buildFourWheels(mats, 0.38, 0.30, 0.98, 1.45);
    root.add(wheels.group);

    return {
      root,
      bodyGroup,
      wheels: wheels.wheels,
      spotlights: [spotL, spotR],
      taillightMesh: tlBar,
      exhaustPipes: quadExhausts,
      exhaustFlames: flameCones,
      steeringWheel
    };
  }

  // 2. KODIAK V8 ENFORCER (Heavy American Muscle / Interceptor)
  static buildKodiakV8(mats) {
    const root = new THREE.Group();
    root.name = 'Kodiak_V8';

    const bodyGroup = new THREE.Group();
    bodyGroup.name = 'Chassis';

    // Long aggressive muscle body
    const mainBody = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.65, 4.8), mats.body);
    mainBody.position.y = 0.6;
    mainBody.castShadow = true;
    bodyGroup.add(mainBody);

    // Muscle Hood Scoop / Supercharger intake
    const scoop = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.18, 1.4), mats.carbon);
    scoop.position.set(0, 0.98, 1.1);
    bodyGroup.add(scoop);

    // Fastback Greenhouse / Roof
    const roof = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.55, 2.3), mats.glass);
    roof.position.set(0, 1.15, -0.3);
    roof.castShadow = true;
    bodyGroup.add(roof);

    // Chrome Bumper
    const frontBumper = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.2, 0.3), mats.chrome);
    frontBumper.position.set(0, 0.45, 2.4);
    bodyGroup.add(frontBumper);

    // Quad Round Headlights
    const qHL1 = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.1, 16), mats.headlightOn);
    qHL1.rotation.x = Math.PI / 2;
    qHL1.position.set(-0.8, 0.65, 2.42);
    const qHL2 = qHL1.clone(); qHL2.position.x = -0.55;
    const qHL3 = qHL1.clone(); qHL3.position.x = 0.55;
    const qHL4 = qHL1.clone(); qHL4.position.x = 0.8;
    bodyGroup.add(qHL1);
    bodyGroup.add(qHL2);
    bodyGroup.add(qHL3);
    bodyGroup.add(qHL4);

    // Spotlights
    const spotL = new THREE.SpotLight(0xffffff, 2.0, 65, Math.PI / 6, 0.4);
    spotL.position.set(-0.65, 0.65, 2.45);
    const spotTargetL = new THREE.Object3D();
    spotTargetL.position.set(-0.65, 0.2, 30);
    bodyGroup.add(spotL);
    bodyGroup.add(spotTargetL);
    spotL.target = spotTargetL;

    const spotR = new THREE.SpotLight(0xffffff, 2.0, 65, Math.PI / 6, 0.4);
    spotR.position.set(0.65, 0.65, 2.45);
    const spotTargetR = new THREE.Object3D();
    spotTargetR.position.set(0.65, 0.2, 30);
    bodyGroup.add(spotR);
    bodyGroup.add(spotTargetR);
    spotR.target = spotTargetR;

    // Classic Muscle Taillights
    const tlL = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.18, 0.08), mats.taillightOn);
    tlL.position.set(-0.65, 0.75, -2.42);
    const tlR = tlL.clone();
    tlR.position.x = 0.65;
    bodyGroup.add(tlL);
    bodyGroup.add(tlR);

    root.add(bodyGroup);

    // Wheels (Fatter rear wheels)
    const wheels = VehicleModels.buildFourWheels(mats, 0.42, 0.32, 1.05, 1.55);
    root.add(wheels.group);

    return {
      root,
      bodyGroup,
      wheels: wheels.wheels,
      spotlights: [spotL, spotR],
      taillightMesh: tlL
    };
  }

  // 3. STRATUS OVERLANDER (Off-Road 4x4 SUV)
  static buildStratusOverlander(mats) {
    const root = new THREE.Group();
    root.name = 'Stratus_Overlander';

    const bodyGroup = new THREE.Group();
    bodyGroup.name = 'Chassis';

    // High ground clearance rugged body
    const mainBox = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.9, 4.4), mats.body);
    mainBox.position.y = 0.95;
    mainBox.castShadow = true;
    bodyGroup.add(mainBox);

    // High SUV Cabin
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.8, 2.6), mats.glass);
    cabin.position.set(0, 1.65, -0.4);
    cabin.castShadow = true;
    bodyGroup.add(cabin);

    // Heavy tubular bullbar
    const bullbar = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.8, 8), mats.carbon);
    bullbar.rotation.z = Math.PI / 2;
    bullbar.position.set(0, 0.75, 2.3);
    bodyGroup.add(bullbar);

    // Roof rack with overland gear
    const roofRack = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.12, 2.2), mats.carbon);
    roofRack.position.set(0, 2.1, -0.4);
    bodyGroup.add(roofRack);

    // Spare wheel mounted on tailgate
    const spareTire = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.44, 0.3, 16), mats.tireRubber);
    spareTire.rotation.x = Math.PI / 2;
    spareTire.position.set(0, 1.05, -2.35);
    spareTire.castShadow = true;
    bodyGroup.add(spareTire);

    // Spotlights
    const spotL = new THREE.SpotLight(0xffffff, 2.0, 70, Math.PI / 6, 0.4);
    spotL.position.set(-0.7, 0.95, 2.25);
    const spotTargetL = new THREE.Object3D();
    spotTargetL.position.set(-0.7, 0.2, 30);
    bodyGroup.add(spotL);
    bodyGroup.add(spotTargetL);
    spotL.target = spotTargetL;

    const spotR = new THREE.SpotLight(0xffffff, 2.0, 70, Math.PI / 6, 0.4);
    spotR.position.set(0.7, 0.95, 2.25);
    const spotTargetR = new THREE.Object3D();
    spotTargetR.position.set(0.7, 0.2, 30);
    bodyGroup.add(spotR);
    bodyGroup.add(spotTargetR);
    spotR.target = spotTargetR;

    // Taillights
    const tlL = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.5, 0.08), mats.taillightOn);
    tlL.position.set(-0.95, 1.15, -2.22);
    const tlR = tlL.clone();
    tlR.position.x = 0.95;
    bodyGroup.add(tlL);
    bodyGroup.add(tlR);

    root.add(bodyGroup);

    // Large high-travel off-road tires
    const wheels = VehicleModels.buildFourWheels(mats, 0.48, 0.36, 1.15, 1.5);
    root.add(wheels.group);

    return {
      root,
      bodyGroup,
      wheels: wheels.wheels,
      spotlights: [spotL, spotR],
      taillightMesh: tlL
    };
  }

  // 4. POLICE CRUISER VARIANT (Interceptor with rooftop strobe lightbar)
  static buildPoliceCruiser(mats) {
    // Base is Kodiak V8 with police livery and rooftop strobe bar
    const policeMats = {
      ...mats,
      body: new THREE.MeshStandardMaterial({ color: 0x090b10, roughness: 0.2, metalness: 0.8 }),
      strobeRed: new THREE.MeshStandardMaterial({ color: 0xff0022, emissive: 0xff0022, emissiveIntensity: 2.0 }),
      strobeBlue: new THREE.MeshStandardMaterial({ color: 0x0055ff, emissive: 0x0055ff, emissiveIntensity: 2.0 })
    };

    const veh = VehicleModels.buildKodiakV8(policeMats);
    veh.root.name = 'Police_Interceptor';

    // Strobe lightbar on roof
    const lightbarBase = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.08, 0.25), policeMats.carbon);
    lightbarBase.position.set(0, 1.48, -0.2);
    veh.bodyGroup.add(lightbarBase);

    const strobeL = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.1, 0.22), policeMats.strobeRed);
    strobeL.position.set(-0.3, 1.54, -0.2);
    const strobeR = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.1, 0.22), policeMats.strobeBlue);
    strobeR.position.set(0.3, 1.54, -0.2);

    veh.bodyGroup.add(strobeL);
    veh.bodyGroup.add(strobeR);
    veh.strobes = [strobeL, strobeR];

    return veh;
  }

  static buildFourWheels(mats, radius, width, halfWidth, halfLength) {
    const group = new THREE.Group();
    const wheels = [];

    const wheelGeo = new THREE.CylinderGeometry(radius, radius, width, 18);
    wheelGeo.rotateZ(Math.PI / 2);

    const rimGeo = new THREE.CylinderGeometry(radius * 0.75, radius * 0.75, width * 1.02, 18);
    rimGeo.rotateZ(Math.PI / 2);

    const positions = [
      { name: 'FL', x: -halfWidth, y: radius, z: halfLength, isFront: true },
      { name: 'FR', x: halfWidth, y: radius, z: halfLength, isFront: true },
      { name: 'RL', x: -halfWidth, y: radius, z: -halfLength, isFront: false },
      { name: 'RR', x: halfWidth, y: radius, z: -halfLength, isFront: false }
    ];

    positions.forEach(pos => {
      const wheelHub = new THREE.Group();
      wheelHub.name = `Wheel_${pos.name}`;
      wheelHub.position.set(pos.x, pos.y, pos.z);

      // Rotating rim & rubber
      const rotator = new THREE.Group();
      rotator.name = 'Rotator';

      const tire = new THREE.Mesh(wheelGeo, mats.tireRubber);
      tire.castShadow = true;
      rotator.add(tire);

      const rim = new THREE.Mesh(rimGeo, mats.rim);
      rotator.add(rim);

      wheelHub.add(rotator);
      group.add(wheelHub);

      wheels.push({
        hub: wheelHub,
        rotator: rotator,
        isFront: pos.isFront,
        restY: pos.y,
        radius: radius
      });
    });

    return { group, wheels };
  }

  static buildThreeWheels(mats, frontRadius, rearRadius, frontHalfLength, rearHalfLength, rearHalfWidth) {
    const group = new THREE.Group();
    const wheels = [];

    const positions = [
      { name: 'F', x: 0, y: frontRadius, z: frontHalfLength, radius: frontRadius, width: 0.18, isFront: true },
      { name: 'RL', x: -rearHalfWidth, y: rearRadius, z: -rearHalfLength, radius: rearRadius, width: 0.22, isFront: false },
      { name: 'RR', x: rearHalfWidth, y: rearRadius, z: -rearHalfLength, radius: rearRadius, width: 0.22, isFront: false }
    ];

    positions.forEach(pos => {
      const wheelGeo = new THREE.CylinderGeometry(pos.radius, pos.radius, pos.width, 18);
      wheelGeo.rotateZ(Math.PI / 2);
      const rimGeo = new THREE.CylinderGeometry(pos.radius * 0.72, pos.radius * 0.72, pos.width * 1.02, 18);
      rimGeo.rotateZ(Math.PI / 2);

      const wheelHub = new THREE.Group();
      wheelHub.name = `Wheel_${pos.name}`;
      wheelHub.position.set(pos.x, pos.y, pos.z);

      const rotator = new THREE.Group();
      rotator.name = 'Rotator';

      const tire = new THREE.Mesh(wheelGeo, mats.tireRubber);
      tire.castShadow = true;
      rotator.add(tire);

      const rim = new THREE.Mesh(rimGeo, mats.rim);
      rotator.add(rim);

      wheelHub.add(rotator);
      group.add(wheelHub);

      wheels.push({
        hub: wheelHub,
        rotator: rotator,
        isFront: pos.isFront,
        restY: pos.y,
        radius: pos.radius
      });
    });

    return { group, wheels };
  }

  static buildTwoWheels(mats, radius, halfLength) {
    const group = new THREE.Group();
    const wheels = [];

    const positions = [
      { name: 'F', x: 0, y: radius, z: halfLength, radius: radius, width: 0.14, isFront: true },
      { name: 'R', x: 0, y: radius, z: -halfLength, radius: radius, width: 0.2, isFront: false }
    ];

    positions.forEach(pos => {
      const wheelGeo = new THREE.CylinderGeometry(pos.radius, pos.radius, pos.width, 18);
      wheelGeo.rotateZ(Math.PI / 2);
      const rimGeo = new THREE.CylinderGeometry(pos.radius * 0.75, pos.radius * 0.75, pos.width * 1.02, 18);
      rimGeo.rotateZ(Math.PI / 2);

      const wheelHub = new THREE.Group();
      wheelHub.name = `Wheel_${pos.name}`;
      wheelHub.position.set(pos.x, pos.y, pos.z);

      const rotator = new THREE.Group();
      rotator.name = 'Rotator';

      const tire = new THREE.Mesh(wheelGeo, mats.tireRubber);
      tire.castShadow = true;
      rotator.add(tire);

      const rim = new THREE.Mesh(rimGeo, mats.rim);
      rotator.add(rim);

      wheelHub.add(rotator);
      group.add(wheelHub);

      wheels.push({
        hub: wheelHub,
        rotator: rotator,
        isFront: pos.isFront,
        restY: pos.y,
        radius: pos.radius
      });
    });

    return { group, wheels };
  }

  // 5. BAJAJ RE AUTO-RICKSHAW (Iconic 3-Wheeled Tuk-Tuk)
  static buildAutoRickshaw(mats) {
    const root = new THREE.Group();
    root.name = 'Bajaj_AutoRickshaw';

    const bodyGroup = new THREE.Group();
    bodyGroup.name = 'Chassis';

    // 1. Lower chassis frame & floor pan
    const floor = new THREE.Mesh(new THREE.BoxGeometry(1.36, 0.2, 2.6), mats.carbon);
    floor.position.set(0, 0.38, 0);
    floor.castShadow = true;
    bodyGroup.add(floor);

    // 2. Front nose / mudguard cowl (Iconic yellow rounded front nose)
    const nose = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 0.7, 10), mats.autoYellow);
    nose.position.set(0, 0.65, 0.95);
    nose.castShadow = true;
    bodyGroup.add(nose);

    // Front fork steering column & handlebars
    const fork = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.65, 8), mats.chrome);
    fork.position.set(0, 0.58, 1.08);
    fork.rotation.x = -0.18;
    bodyGroup.add(fork);

    const handlebarGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.62, 8);
    handlebarGeo.rotateZ(Math.PI / 2);
    const handlebars = new THREE.Mesh(handlebarGeo, mats.carbon);
    handlebars.position.set(0, 0.88, 0.98);
    bodyGroup.add(handlebars);

    // Central round chrome headlamp
    const hlGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.08, 16);
    hlGeo.rotateX(Math.PI / 2);
    const hl = new THREE.Mesh(hlGeo, mats.headlightOn);
    hl.position.set(0, 0.72, 1.25);
    bodyGroup.add(hl);

    const spot = new THREE.SpotLight(0xfff3d0, 2.2, 55, Math.PI / 5, 0.35);
    spot.position.set(0, 0.72, 1.28);
    const spotTarget = new THREE.Object3D();
    spotTarget.position.set(0, 0.2, 25);
    bodyGroup.add(spot, spotTarget);
    spot.target = spotTarget;

    // 3. Cabin side panels (Deep green lower half with yellow coachline)
    const sideL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.5, 1.8), mats.autoGreen);
    sideL.position.set(-0.66, 0.62, -0.2);
    sideL.castShadow = true;
    bodyGroup.add(sideL);

    const sideR = sideL.clone();
    sideR.position.x = 0.66;
    bodyGroup.add(sideR);

    // Rear engine hood cover (Green)
    const rearBoot = new THREE.Mesh(new THREE.BoxGeometry(1.36, 0.5, 0.6), mats.autoGreen);
    rearBoot.position.set(0, 0.62, -1.05);
    rearBoot.castShadow = true;
    bodyGroup.add(rearBoot);

    // 4. Passenger Bench & Driver Saddle
    const driverSeat = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.15, 0.42), mats.leather);
    driverSeat.position.set(0, 0.56, 0.35);
    bodyGroup.add(driverSeat);

    const passSeat = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.16, 0.5), mats.leather);
    passSeat.position.set(0, 0.56, -0.65);
    bodyGroup.add(passSeat);

    const passBack = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.42, 0.1), mats.leather);
    passBack.position.set(0, 0.85, -0.92);
    bodyGroup.add(passBack);

    // 5. Classic Canvas Canopy Roof & Tubular Chrome Support Pillars
    const roofPillars = new THREE.Group();
    const pillarGeo = new THREE.CylinderGeometry(0.025, 0.025, 1.0, 8);
    const pFL = new THREE.Mesh(pillarGeo, mats.chrome); pFL.position.set(-0.58, 1.15, 0.75);
    const pFR = new THREE.Mesh(pillarGeo, mats.chrome); pFR.position.set(0.58, 1.15, 0.75);
    const pRL = new THREE.Mesh(pillarGeo, mats.chrome); pRL.position.set(-0.65, 1.15, -0.95);
    const pRR = new THREE.Mesh(pillarGeo, mats.chrome); pRR.position.set(0.65, 1.15, -0.95);
    roofPillars.add(pFL, pFR, pRL, pRR);
    bodyGroup.add(roofPillars);

    // Front windshield glass
    const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.52, 0.04), mats.glass);
    windshield.position.set(0, 1.18, 0.76);
    windshield.rotation.x = -0.15;
    bodyGroup.add(windshield);

    // Wiper blade (sweeping)
    const wiperArm = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.26, 0.015), mats.carbon);
    wiperArm.position.set(-0.15, 1.15, 0.8);
    wiperArm.rotation.z = -0.4;
    bodyGroup.add(wiperArm);

    // Overhead curved canopy roof
    const roofMesh = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.1, 2.3), mats.canvasRoof);
    roofMesh.position.set(0, 1.68, -0.1);
    roofMesh.castShadow = true;
    bodyGroup.add(roofMesh);

    // Rear canvas curtain flap
    const rearFlap = new THREE.Mesh(new THREE.BoxGeometry(1.36, 0.5, 0.04), mats.canvasRoof);
    rearFlap.position.set(0, 1.38, -1.22);
    bodyGroup.add(rearFlap);

    // Turn Indicators (Amber)
    const indFL = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), mats.indicatorL);
    indFL.position.set(-0.35, 0.65, 1.1);
    const indFR = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), mats.indicatorR);
    indFR.position.set(0.35, 0.65, 1.1);
    const indRL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.04), mats.indicatorL);
    indRL.position.set(-0.58, 0.65, -1.36);
    const indRR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.04), mats.indicatorR);
    indRR.position.set(0.58, 0.65, -1.36);
    bodyGroup.add(indFL, indFR, indRL, indRR);

    // Rear Brake Taillights
    const tlL = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.1, 0.04), mats.taillightOn);
    tlL.position.set(-0.42, 0.65, -1.36);
    const tlR = tlL.clone(); tlR.position.x = 0.42;
    bodyGroup.add(tlL, tlR);

    root.add(bodyGroup);

    // 3 Wheels (1 Front, 2 Rear)
    const wheels = VehicleModels.buildThreeWheels(mats, 0.28, 0.28, 1.08, 0.75, 0.62);
    root.add(wheels.group);

    return {
      root,
      bodyGroup,
      wheels: wheels.wheels,
      spotlights: [spot],
      taillightMesh: tlL,
      steeringWheel: handlebars,
      wiperMesh: wiperArm,
      indicators: { left: [indFL, indRL], right: [indFR, indRR] }
    };
  }

  // 6. SOVEREIGN V12 ROYAL SALOON (Ultra-Luxury British Executive Sedan)
  static buildLuxurySedan(mats) {
    const root = new THREE.Group();
    root.name = 'Sovereign_V12';

    const bodyGroup = new THREE.Group();
    bodyGroup.name = 'Chassis';

    // Long stately executive body
    const mainBody = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.65, 5.2), mats.body);
    mainBody.position.y = 0.62;
    mainBody.castShadow = true;
    bodyGroup.add(mainBody);

    // Imposing Vertical Chrome Grille
    const grille = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.52, 0.12), mats.chrome);
    grille.position.set(0, 0.68, 2.62);
    bodyGroup.add(grille);

    // Mascot ornament
    const ornament = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.08, 8), mats.chrome);
    ornament.position.set(0, 0.98, 2.52);
    bodyGroup.add(ornament);

    // Sleek LED Headlights
    const hlL = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.16, 0.08), mats.headlightOn);
    hlL.position.set(-0.75, 0.72, 2.61);
    const hlR = hlL.clone(); hlR.position.x = 0.75;
    bodyGroup.add(hlL, hlR);

    const spotL = new THREE.SpotLight(0xffffff, 2.2, 70, Math.PI / 6, 0.35);
    spotL.position.set(-0.75, 0.72, 2.65);
    const spotTargetL = new THREE.Object3D();
    spotTargetL.position.set(-0.75, 0.2, 35);
    bodyGroup.add(spotL, spotTargetL);
    spotL.target = spotTargetL;

    const spotR = new THREE.SpotLight(0xffffff, 2.2, 70, Math.PI / 6, 0.35);
    spotR.position.set(0.75, 0.72, 2.65);
    const spotTargetR = new THREE.Object3D();
    spotTargetR.position.set(0.75, 0.2, 35);
    bodyGroup.add(spotR, spotTargetR);
    spotR.target = spotTargetR;

    // Executive Greenhouse Cabin (Formal upright C-pillar)
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.62, 2.8), mats.glass);
    cabin.position.set(0, 1.2, -0.2);
    cabin.castShadow = true;
    bodyGroup.add(cabin);

    // Chrome Window Surrounds
    const trimL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 2.82), mats.chrome);
    trimL.position.set(-0.91, 0.92, -0.2);
    const trimR = trimL.clone(); trimR.position.x = 0.91;
    bodyGroup.add(trimL, trimR);

    // Turn Indicators
    const indFL = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.08, 0.04), mats.indicatorL);
    indFL.position.set(-0.98, 0.72, 2.58);
    const indFR = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.08, 0.04), mats.indicatorR);
    indFR.position.set(0.98, 0.72, 2.58);
    const indRL = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.12, 0.04), mats.indicatorL);
    indRL.position.set(-0.85, 0.76, -2.61);
    const indRR = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.12, 0.04), mats.indicatorR);
    indRR.position.set(0.85, 0.76, -2.61);
    bodyGroup.add(indFL, indFR, indRL, indRR);

    // Vertical Prestige Taillights
    const tlL = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.44, 0.08), mats.taillightOn);
    tlL.position.set(-0.7, 0.78, -2.61);
    const tlR = tlL.clone(); tlR.position.x = 0.7;
    bodyGroup.add(tlL, tlR);

    // Dual Chrome Exhaust Tips
    const exL = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.14, 12), mats.chrome);
    exL.rotateX(Math.PI / 2);
    exL.position.set(-0.65, 0.32, -2.64);
    const exR = exL.clone(); exR.position.x = 0.65;
    bodyGroup.add(exL, exR);

    root.add(bodyGroup);

    // Stately large multi-spoke alloy wheels
    const wheels = VehicleModels.buildFourWheels(mats, 0.42, 0.3, 1.05, 1.65);
    root.add(wheels.group);

    return {
      root,
      bodyGroup,
      wheels: wheels.wheels,
      spotlights: [spotL, spotR],
      taillightMesh: tlL,
      indicators: { left: [indFL, indRL], right: [indFR, indRR] }
    };
  }

  // 7. THUNDERBOLT 1200cc SUPERBIKE (Streetfighter Motorcycle)
  static buildStreetMotorcycle(mats) {
    const root = new THREE.Group();
    root.name = 'Thunderbolt_Superbike';

    const bodyGroup = new THREE.Group();
    bodyGroup.name = 'Chassis';

    // Sculpted Trellis Frame & V-Twin Engine Block
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.55, 1.2), mats.carbon);
    frame.position.set(0, 0.58, 0);
    bodyGroup.add(frame);

    // Engine cylinder heads
    const cyl1 = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.32, 10), mats.chrome);
    cyl1.position.set(0, 0.55, 0.18);
    cyl1.rotation.x = 0.45;
    const cyl2 = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.32, 10), mats.chrome);
    cyl2.position.set(0, 0.55, -0.18);
    cyl2.rotation.x = -0.45;
    bodyGroup.add(cyl1, cyl2);

    // Muscular Fuel Tank
    const tank = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.35, 0.7), mats.body);
    tank.position.set(0, 0.88, 0.22);
    tank.castShadow = true;
    bodyGroup.add(tank);

    // Rider Saddle & Tail Fairing
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.12, 0.48), mats.interior);
    seat.position.set(0, 0.82, -0.32);
    bodyGroup.add(seat);

    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.2, 0.5), mats.body);
    tail.position.set(0, 0.9, -0.72);
    tail.rotation.x = -0.15;
    tail.castShadow = true;
    bodyGroup.add(tail);

    // Upside-down front forks (Gold / Chrome)
    const forkL = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.82, 8), mats.rim);
    forkL.position.set(-0.12, 0.52, 0.82);
    forkL.rotation.x = -0.35;
    const forkR = forkL.clone(); forkR.position.x = 0.12;
    bodyGroup.add(forkL, forkR);

    // Clip-on Handlebars
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.68, 8), mats.carbon);
    bar.rotateZ(Math.PI / 2);
    bar.position.set(0, 0.95, 0.68);
    bodyGroup.add(bar);

    // Twin Projector Headlights
    const hl = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 12), mats.headlightOn);
    hl.position.set(0, 0.82, 0.95);
    bodyGroup.add(hl);

    const spot = new THREE.SpotLight(0xffffff, 2.5, 65, Math.PI / 5, 0.3);
    spot.position.set(0, 0.82, 1.0);
    const spotTarget = new THREE.Object3D();
    spotTarget.position.set(0, 0.2, 30);
    bodyGroup.add(spot, spotTarget);
    spot.target = spotTarget;

    // LED Tail Strip
    const tl = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.06, 0.04), mats.taillightOn);
    tl.position.set(0, 0.92, -0.98);
    bodyGroup.add(tl);

    // Exhaust
    const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.45, 10), mats.chrome);
    exhaust.rotateX(Math.PI / 2);
    exhaust.position.set(0.14, 0.72, -0.68);
    bodyGroup.add(exhaust);

    // Turn Indicators
    const indFL = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 6), mats.indicatorL);
    indFL.position.set(-0.24, 0.82, 0.85);
    const indFR = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 6), mats.indicatorR);
    indFR.position.set(0.24, 0.82, 0.85);
    const indRL = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 6), mats.indicatorL);
    indRL.position.set(-0.18, 0.88, -0.92);
    const indRR = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 6), mats.indicatorR);
    indRR.position.set(0.18, 0.88, -0.92);
    bodyGroup.add(indFL, indFR, indRL, indRR);

    root.add(bodyGroup);

    // 2 Wheels (Front & Rear)
    const wheels = VehicleModels.buildTwoWheels(mats, 0.34, 0.85);
    root.add(wheels.group);

    return {
      root,
      bodyGroup,
      wheels: wheels.wheels,
      spotlights: [spot],
      taillightMesh: tl,
      steeringWheel: bar,
      indicators: { left: [indFL, indRL], right: [indFR, indRR] }
    };
  }

  // 8. METROPOLITAN TRANSIT 40FT (Heavy Public Transit Bus)
  static buildCityBus(mats) {
    const root = new THREE.Group();
    root.name = 'Metropolitan_Bus';

    const bodyGroup = new THREE.Group();
    bodyGroup.name = 'Chassis';

    // Main Bus Body (10.2m long, 2.5m wide, 2.8m high)
    const busBody = new THREE.Mesh(new THREE.BoxGeometry(2.5, 2.1, 10.2), mats.body);
    busBody.position.y = 1.6;
    busBody.castShadow = true;
    bodyGroup.add(busBody);

    // Continuous Panoramic Passenger Glass Windows
    const glassL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.85, 8.8), mats.glass);
    glassL.position.set(-1.26, 1.85, -0.4);
    const glassR = glassL.clone(); glassR.position.x = 1.26;
    bodyGroup.add(glassL, glassR);

    // Front panoramic windshield
    const frontWindshield = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.1, 0.08), mats.glass);
    frontWindshield.position.set(0, 1.8, 5.12);
    bodyGroup.add(frontWindshield);

    // Roof Air Conditioning Pods
    const acPod1 = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.35, 2.2), mats.carbon);
    acPod1.position.set(0, 2.8, 1.5);
    const acPod2 = acPod1.clone(); acPod2.position.z = -2.5;
    bodyGroup.add(acPod1, acPod2);

    // LED Destination Route Display
    const destCanvas = document.createElement('canvas');
    destCanvas.width = 256; destCanvas.height = 64;
    const dctx = destCanvas.getContext('2d');
    dctx.fillStyle = '#080808'; dctx.fillRect(0, 0, 256, 64);
    dctx.fillStyle = '#ff8800';
    dctx.font = 'bold 22px monospace';
    dctx.fillText('42 DOWNTOWN', 18, 40);
    const destTex = new THREE.CanvasTexture(destCanvas);
    const destMat = new THREE.MeshBasicMaterial({ map: destTex });
    const destSign = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.28, 0.06), destMat);
    destSign.position.set(0, 2.45, 5.14);
    bodyGroup.add(destSign);

    // Headlights
    const hlL = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.1, 16), mats.headlightOn);
    hlL.rotateX(Math.PI / 2);
    hlL.position.set(-0.85, 0.82, 5.12);
    const hlR = hlL.clone(); hlR.position.x = 0.85;
    bodyGroup.add(hlL, hlR);

    const spotL = new THREE.SpotLight(0xffffff, 2.5, 75, Math.PI / 5, 0.4);
    spotL.position.set(-0.85, 0.82, 5.15);
    const spotTargetL = new THREE.Object3D();
    spotTargetL.position.set(-0.85, 0.2, 35);
    bodyGroup.add(spotL, spotTargetL);
    spotL.target = spotTargetL;

    const spotR = new THREE.SpotLight(0xffffff, 2.5, 75, Math.PI / 5, 0.4);
    spotR.position.set(0.85, 0.82, 5.15);
    const spotTargetR = new THREE.Object3D();
    spotTargetR.position.set(0.85, 0.2, 35);
    bodyGroup.add(spotR, spotTargetR);
    spotR.target = spotTargetR;

    // Rear Taillights
    const tlL = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.65, 0.08), mats.taillightOn);
    tlL.position.set(-1.0, 1.2, -5.12);
    const tlR = tlL.clone(); tlR.position.x = 1.0;
    bodyGroup.add(tlL, tlR);

    // Turn Indicators
    const indFL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.1, 0.04), mats.indicatorL);
    indFL.position.set(-1.1, 0.82, 5.12);
    const indFR = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.1, 0.04), mats.indicatorR);
    indFR.position.set(1.1, 0.82, 5.12);
    const indRL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.12, 0.04), mats.indicatorL);
    indRL.position.set(-1.0, 1.6, -5.12);
    const indRR = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.12, 0.04), mats.indicatorR);
    indRR.position.set(1.0, 1.6, -5.12);
    bodyGroup.add(indFL, indFR, indRL, indRR);

    root.add(bodyGroup);

    // 4 Heavy Bus Wheels
    const wheels = VehicleModels.buildFourWheels(mats, 0.52, 0.38, 1.18, 3.2);
    root.add(wheels.group);

    return {
      root,
      bodyGroup,
      wheels: wheels.wheels,
      spotlights: [spotL, spotR],
      taillightMesh: tlL,
      indicators: { left: [indFL, indRL], right: [indFR, indRR] }
    };
  }
}
