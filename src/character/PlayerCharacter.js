// ROADBOUND - Next-Gen Photorealistic Dual-Protagonist (Male & Female) Humanoid Engine
// Unreal Engine 5 Style: Anatomical musculature, sculpted facial anatomy, articulated hands, realistic clothing layers & micro-animations.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { weaponArsenal } from '../combat/WeaponArsenal.js';

export class PlayerCharacter {
  constructor(scene, wardrobeConfig = {}) {
    this.scene = scene;
    this.wardrobe = wardrobeConfig || {};
    this.root = new THREE.Group();
    this.root.name = 'Protagonist_Root';

    this.gender = this.wardrobe.gender || 'male'; // 'male' or 'female'
    this.preset = this.wardrobe.preset || (this.gender === 'female' ? 'female_kurti' : 'male_jacket');

    this.animTime = 0;
    this.locomotionState = 'idle';
    this.aimWeight = 0;
    this.recoilKick = 0;
    this.isFirstPerson = false;
    this.isShivering = false;

    // Micro-animation timers
    this.blinkTimer = 0;
    this.nextBlink = 3.0 + Math.random() * 2.0;
    this.isBlinking = false;
    this.eyelids = [];

    this.initPBRMaterials();
    this.buildCharacterMesh();
    this.tryLoadExternalGLB();
    this.scene.add(this.root);
  }

  // =========================================================================
  // HIGH-RESOLUTION PROCEDURAL PBR TEXTURES & SHADERS
  // =========================================================================
  initPBRMaterials() {
    this.textures = {};

    // 1. Photorealistic Natural Skin Texture (Warm subsurface tone & micro-pores)
    const skinCanvas = document.createElement('canvas');
    skinCanvas.width = 512; skinCanvas.height = 512;
    const sctx = skinCanvas.getContext('2d');
    sctx.fillStyle = '#deb49b';
    sctx.fillRect(0, 0, 512, 512);
    const sImg = sctx.getImageData(0, 0, 512, 512);
    for (let i = 0; i < sImg.data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 14;
      sImg.data[i] = Math.max(0, Math.min(255, sImg.data[i] + noise));
      sImg.data[i + 1] = Math.max(0, Math.min(255, sImg.data[i + 1] + noise * 0.8));
      sImg.data[i + 2] = Math.max(0, Math.min(255, sImg.data[i + 2] + noise * 0.6));
    }
    sctx.putImageData(sImg, 0, 0);
    this.textures.skin = new THREE.CanvasTexture(skinCanvas);

    // 2. Woven Denim Jeans Texture (Indigo twill weave with double copper stitching)
    const denimCanvas = document.createElement('canvas');
    denimCanvas.width = 512; denimCanvas.height = 512;
    const dctx = denimCanvas.getContext('2d');
    dctx.fillStyle = '#1e3256';
    dctx.fillRect(0, 0, 512, 512);
    // Diagonal twill weave
    dctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    dctx.lineWidth = 1;
    for (let x = -512; x < 1024; x += 4) {
      dctx.beginPath();
      dctx.moveTo(x, 0);
      dctx.lineTo(x + 512, 512);
      dctx.stroke();
    }
    // Copper outer and inner seams
    dctx.fillStyle = '#c57832';
    dctx.fillRect(36, 0, 4, 512);
    dctx.fillRect(44, 0, 4, 512);
    dctx.fillRect(512 - 40, 0, 4, 512);
    dctx.fillRect(512 - 48, 0, 4, 512);
    this.textures.denim = new THREE.CanvasTexture(denimCanvas);

    // 3. Tactical Leather & Ballistic Nylon Jacket
    const jacketCanvas = document.createElement('canvas');
    jacketCanvas.width = 512; jacketCanvas.height = 512;
    const jctx = jacketCanvas.getContext('2d');
    jctx.fillStyle = '#f5c518'; // High-visibility athletic gold
    jctx.fillRect(0, 0, 512, 512);
    // Dark ballistic nylon side ribs
    jctx.fillStyle = '#16191f';
    jctx.fillRect(0, 0, 72, 512);
    jctx.fillRect(512 - 72, 0, 72, 512);
    // Center zipper track
    jctx.fillStyle = '#22252a';
    jctx.fillRect(246, 0, 20, 512);
    jctx.fillStyle = '#d0d5dc';
    for (let y = 0; y < 512; y += 8) {
      jctx.fillRect(252, y, 8, 4);
    }
    this.textures.jacket = new THREE.CanvasTexture(jacketCanvas);

    // 4. Female Silk Kurti (Crimson Ruby Silk & Gold Brocade Zari)
    const kurtiCanvas = document.createElement('canvas');
    kurtiCanvas.width = 512; kurtiCanvas.height = 512;
    const kctx = kurtiCanvas.getContext('2d');
    kctx.fillStyle = '#8e1428';
    kctx.fillRect(0, 0, 512, 512);
    // Brocade gold medallions
    kctx.fillStyle = 'rgba(245, 199, 26, 0.22)';
    for (let x = 32; x < 512; x += 64) {
      for (let y = 32; y < 512; y += 64) {
        kctx.beginPath();
        kctx.arc(x, y, 12, 0, Math.PI * 2);
        kctx.fill();
      }
    }
    // Glistening gold zari border
    kctx.fillStyle = '#f5c71a';
    kctx.fillRect(0, 0, 512, 42);
    kctx.fillRect(0, 460, 512, 52);
    this.textures.kurti = new THREE.CanvasTexture(kurtiCanvas);

    // 5. Female Silk Saree (Peacock Teal Emerald & Gold)
    const sareeCanvas = document.createElement('canvas');
    sareeCanvas.width = 512; sareeCanvas.height = 512;
    const sreeCtx = sareeCanvas.getContext('2d');
    sreeCtx.fillStyle = '#0a5b54';
    sreeCtx.fillRect(0, 0, 512, 512);
    sreeCtx.fillStyle = '#f7d046';
    sreeCtx.fillRect(0, 24, 512, 58);
    sreeCtx.fillRect(0, 440, 512, 72);
    this.textures.saree = new THREE.CanvasTexture(sareeCanvas);

    // 6. Charcoal Wool Pinstripe Suit
    const suitCanvas = document.createElement('canvas');
    suitCanvas.width = 512; suitCanvas.height = 512;
    const suCtx = suitCanvas.getContext('2d');
    suCtx.fillStyle = '#1c1f24';
    suCtx.fillRect(0, 0, 512, 512);
    suCtx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    for (let x = 0; x < 512; x += 16) {
      suCtx.fillRect(x, 0, 1.5, 512);
    }
    this.textures.suit = new THREE.CanvasTexture(suitCanvas);

    // 7. Male Royal Kurta
    const kurtaCanvas = document.createElement('canvas');
    kurtaCanvas.width = 512; kurtaCanvas.height = 512;
    const kuCtx = kurtaCanvas.getContext('2d');
    kuCtx.fillStyle = '#14223d';
    kuCtx.fillRect(0, 0, 512, 512);
    kuCtx.fillStyle = '#f5c71a';
    kuCtx.fillRect(240, 0, 32, 380);
    this.textures.kurta = new THREE.CanvasTexture(kurtaCanvas);

    // Realistic PBR Shader Materials
    this.materials = {
      skinMale: new THREE.MeshStandardMaterial({
        map: this.textures.skin,
        roughness: 0.52,
        metalness: 0.04
      }),
      skinFemale: new THREE.MeshStandardMaterial({
        map: this.textures.skin,
        roughness: 0.46,
        metalness: 0.03
      }),
      hairMale: new THREE.MeshStandardMaterial({
        color: 0x1f1714,
        roughness: 0.72,
        metalness: 0.12
      }),
      hairFemale: new THREE.MeshStandardMaterial({
        color: 0x140e0c,
        roughness: 0.38,
        metalness: 0.18
      }),
      sclera: new THREE.MeshStandardMaterial({
        color: 0xf4f6f8,
        roughness: 0.15,
        metalness: 0.05
      }),
      irisMale: new THREE.MeshStandardMaterial({
        color: 0x3d2716, // Rich hazel-brown
        roughness: 0.1,
        metalness: 0.3
      }),
      irisFemale: new THREE.MeshStandardMaterial({
        color: 0x221812, // Deep lustrous black-brown
        roughness: 0.1,
        metalness: 0.3
      }),
      pupil: new THREE.MeshBasicMaterial({ color: 0x050505 }),
      cornea: new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        transmission: 0.88,
        roughness: 0.02,
        ior: 1.38,
        transparent: true,
        opacity: 0.95
      }),
      lipsMale: new THREE.MeshStandardMaterial({
        color: 0xb5786a,
        roughness: 0.45,
        metalness: 0.04
      }),
      lipsFemale: new THREE.MeshStandardMaterial({
        color: 0xc45d62,
        roughness: 0.35,
        metalness: 0.08
      }),
      denimMat: new THREE.MeshStandardMaterial({
        map: this.textures.denim,
        roughness: 0.78,
        metalness: 0.04
      }),
      jacketMat: new THREE.MeshStandardMaterial({
        map: this.textures.jacket,
        roughness: 0.55,
        metalness: 0.15
      }),
      kurtiMat: new THREE.MeshStandardMaterial({
        map: this.textures.kurti,
        roughness: 0.60,
        metalness: 0.14
      }),
      sareeMat: new THREE.MeshStandardMaterial({
        map: this.textures.saree,
        roughness: 0.50,
        metalness: 0.22,
        side: THREE.DoubleSide
      }),
      suitMat: new THREE.MeshStandardMaterial({
        map: this.textures.suit,
        roughness: 0.70,
        metalness: 0.05
      }),
      kurtaMat: new THREE.MeshStandardMaterial({
        map: this.textures.kurta,
        roughness: 0.65,
        metalness: 0.10
      }),
      whiteShirt: new THREE.MeshStandardMaterial({
        color: 0xf5f7fb,
        roughness: 0.68,
        metalness: 0.04
      }),
      tacticalBlack: new THREE.MeshStandardMaterial({
        color: 0x15181e,
        roughness: 0.58,
        metalness: 0.22
      }),
      leatherBlack: new THREE.MeshStandardMaterial({
        color: 0x181a1f,
        roughness: 0.38,
        metalness: 0.18
      }),
      shoesRubber: new THREE.MeshStandardMaterial({
        color: 0x22262c,
        roughness: 0.75,
        metalness: 0.08
      }),
      shoesWhiteMid: new THREE.MeshStandardMaterial({
        color: 0xf0f2f6,
        roughness: 0.45,
        metalness: 0.05
      }),
      zipperChrome: new THREE.MeshStandardMaterial({
        color: 0xd8dde5,
        metalness: 0.95,
        roughness: 0.18
      }),
      smartwatchGlow: new THREE.MeshStandardMaterial({
        color: 0x00e5ff,
        emissive: 0x00b0ff,
        emissiveIntensity: 1.4,
        roughness: 0.1,
        metalness: 0.8
      }),
      plateCarrierMat: new THREE.MeshStandardMaterial({
        color: 0x1d2229,
        roughness: 0.88,
        metalness: 0.04
      }),
      molleWebbingMat: new THREE.MeshStandardMaterial({
        color: 0x272c35,
        roughness: 0.92,
        metalness: 0.02
      }),
      combatGlovesMat: new THREE.MeshStandardMaterial({
        color: 0x1b1f26,
        roughness: 0.72,
        metalness: 0.12
      }),
      holsterMat: new THREE.MeshStandardMaterial({
        color: 0x131518,
        roughness: 0.42,
        metalness: 0.28
      }),
      magPouchMat: new THREE.MeshStandardMaterial({
        color: 0x252a33,
        roughness: 0.85,
        metalness: 0.05
      })
    };
  }

  buildCharacterMesh() {
    while (this.root.children.length > 0) {
      this.root.remove(this.root.children[0]);
    }
    this.eyelids = [];

    if (this.gender === 'female') {
      this.buildFemaleRig();
    } else {
      this.buildMaleRig();
    }
  }

  setGender(gender, preset = null) {
    this.gender = gender;
    this.preset = preset || (gender === 'female' ? 'female_kurti' : 'male_jacket');
    this.wardrobe.gender = gender;
    this.wardrobe.preset = this.preset;
    this.buildCharacterMesh();
  }

  setOutfitPreset(presetId) {
    this.preset = presetId;
    this.wardrobe.preset = presetId;
    this.buildCharacterMesh();
  }

  updateWardrobe(wardrobe) {
    if (!wardrobe) return;
    this.wardrobe = { ...this.wardrobe, ...wardrobe };
    if (wardrobe.gender && wardrobe.gender !== this.gender) {
      this.gender = wardrobe.gender;
    }
    if (wardrobe.preset) {
      this.preset = wardrobe.preset;
    }
    this.buildCharacterMesh();
  }

  // =========================================================================
  // EXTERNAL GLB MODEL LOADER (GLTF + DRACO) WITH FALLBACK
  // =========================================================================
  tryLoadExternalGLB() {
    const loader = new GLTFLoader();
    const candidatePaths = [
      '/assets/models/character/player.glb',
      '/assets/models/character/survivor.glb',
      '/assets/models/character/soldier.glb'
    ];

    const tryNext = (idx) => {
      if (idx >= candidatePaths.length) return;
      const path = candidatePaths[idx];
      loader.load(
        path,
        (gltf) => {
          console.log('[HORIZEN Graphics] Loaded Photorealistic Humanoid Model:', path);
          this.glbModel = gltf.scene;
          this.glbModel.name = 'GLTF_Player_Model';

          const box = new THREE.Box3().setFromObject(this.glbModel);
          const size = box.getSize(new THREE.Vector3());
          if (size.y > 0.1) {
            const scaleFactor = 1.8 / size.y;
            this.glbModel.scale.set(scaleFactor, scaleFactor, scaleFactor);
          }

          this.glbModel.traverse((node) => {
            if (node.isMesh) {
              node.castShadow = true;
              node.receiveShadow = true;
              if (node.material) {
                node.material.envMapIntensity = 1.2;
                node.material.roughness = Math.max(0.2, node.material.roughness !== undefined ? node.material.roughness : 0.5);
              }
            }
          });

          if (gltf.animations && gltf.animations.length > 0) {
            this.mixer = new THREE.AnimationMixer(this.glbModel);
            this.actions = {};
            gltf.animations.forEach((clip) => {
              const name = clip.name.toLowerCase();
              this.actions[name] = this.mixer.clipAction(clip);
            });
            const idle = this.actions['idle'] || Object.values(this.actions)[0];
            if (idle) idle.play();
          }

          // Hide procedural rig while keeping root & weapon attachment
          if (this.pelvis) this.pelvis.visible = false;
          this.root.add(this.glbModel);
        },
        undefined,
        () => {
          tryNext(idx + 1);
        }
      );
    };

    tryNext(0);
  }

  // =========================================================================
  // HIGH-FIDELITY MALE RIG: MARCUS VANCE (Realistic Musculature, Head & Gear)
  // =========================================================================
  buildMaleRig() {
    const m = this.materials;
    const skin = m.skinMale;
    let upperMat = m.jacketMat;
    let lowerMat = m.denimMat;

    if (this.preset === 'male_formal') {
      upperMat = m.suitMat;
      lowerMat = m.suitMat;
    } else if (this.preset === 'male_traditional') {
      upperMat = m.kurtaMat;
      lowerMat = m.whiteShirt;
    } else if (this.preset === 'male_casual') {
      upperMat = m.whiteShirt;
      lowerMat = m.denimMat;
    }

    // 1. Pelvis / Hip Core
    this.pelvis = new THREE.Group();
    this.pelvis.position.y = 0.94;
    this.root.add(this.pelvis);

    // Anatomical Pelvis Mesh (Sculpted tapered hips)
    const hipsGeo = new THREE.CylinderGeometry(0.18, 0.16, 0.18, 14);
    const hips = new THREE.Mesh(hipsGeo, lowerMat);
    hips.scale.set(1.15, 1.0, 0.78);
    hips.castShadow = true;
    this.pelvis.add(hips);

    // Tactical Leather Belt & Polished Chrome Buckle
    const beltGeo = new THREE.CylinderGeometry(0.185, 0.185, 0.045, 16);
    const belt = new THREE.Mesh(beltGeo, m.leatherBlack);
    belt.scale.set(1.16, 1.0, 0.80);
    belt.position.y = 0.07;
    this.pelvis.add(belt);

    const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.045, 0.02), m.zipperChrome);
    buckle.position.set(0, 0.07, 0.155);
    this.pelvis.add(buckle);

    // Tactical Utility Holster & Pouches
    const pouchL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.09, 0.04), m.tacticalBlack);
    pouchL.position.set(-0.20, 0.02, 0);
    const pouchR = pouchL.clone();
    pouchR.position.x = 0.20;
    this.pelvis.add(pouchL, pouchR);

    // 2. Torso (Anatomical Pectorals, Waist Taper, Collar & Zipper)
    this.torso = new THREE.Group();
    this.torso.position.y = 0.14;
    this.pelvis.add(this.torso);

    // Athletic Muscular Chest (Broad shoulders tapering to waist)
    const chestGeo = new THREE.CylinderGeometry(0.22, 0.17, 0.38, 14);
    const chestMesh = new THREE.Mesh(chestGeo, upperMat);
    chestMesh.position.y = 0.19;
    chestMesh.scale.set(1.22, 1.0, 0.72);
    chestMesh.castShadow = true;
    this.torso.add(chestMesh);

    // Pectoral Definition (Left and Right contoured breast plates)
    const pecGeo = new THREE.BoxGeometry(0.14, 0.15, 0.04);
    const pecL = new THREE.Mesh(pecGeo, upperMat);
    pecL.position.set(-0.08, 0.24, 0.125);
    pecL.rotation.y = 0.15;
    const pecR = new THREE.Mesh(pecGeo, upperMat);
    pecR.position.set(0.08, 0.24, 0.125);
    pecR.rotation.y = -0.15;
    this.torso.add(pecL, pecR);

    // Jacket 3D Folded Collar
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.11, 0.07, 12, 1, true), m.tacticalBlack);
    collar.position.set(0, 0.38, 0);
    collar.scale.set(1.1, 1.0, 0.85);
    this.torso.add(collar);

    // Center Metallic Zipper Runner
    const zipper = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.36, 0.012), m.zipperChrome);
    zipper.position.set(0, 0.18, 0.145);
    this.torso.add(zipper);

    // 3. Neck & Head
    this.neck = new THREE.Group();
    this.neck.position.y = 0.44;
    this.torso.add(this.neck);

    // Sculpted anatomical neck with Adam's apple
    const neckMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.072, 0.14, 12), skin);
    neckMesh.position.y = 0.04;
    neckMesh.castShadow = true;
    this.neck.add(neckMesh);

    const adamsApple = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 8), skin);
    adamsApple.position.set(0, 0.045, 0.065);
    this.neck.add(adamsApple);

    this.head = new THREE.Group();
    this.head.position.y = 0.12;
    this.neck.add(this.head);

    // Sculpted Anatomical Cranium (Smooth skull curve)
    const craniumGeo = new THREE.SphereGeometry(0.12, 18, 14);
    const cranium = new THREE.Mesh(craniumGeo, skin);
    cranium.scale.set(0.92, 1.12, 1.05);
    cranium.position.set(0, 0.04, -0.01);
    cranium.castShadow = true;
    this.head.add(cranium);

    // Chiseled Masculine Jawline & Chin
    const jawGeo = new THREE.CylinderGeometry(0.095, 0.075, 0.12, 10);
    const jaw = new THREE.Mesh(jawGeo, skin);
    jaw.position.set(0, -0.05, 0.035);
    jaw.scale.set(1.1, 1.0, 0.95);
    jaw.castShadow = true;
    this.head.add(jaw);

    const chin = new THREE.Mesh(new THREE.SphereGeometry(0.026, 10, 8), skin);
    chin.position.set(0, -0.10, 0.088);
    this.head.add(chin);

    // Realistic 3D Nose (Bridge, tip and nostrils)
    const noseBridge = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.018, 0.065, 8), skin);
    noseBridge.position.set(0, 0.005, 0.122);
    noseBridge.rotation.x = 0.22;
    this.head.add(noseBridge);

    const noseTip = new THREE.Mesh(new THREE.SphereGeometry(0.014, 8, 8), skin);
    noseTip.position.set(0, -0.02, 0.134);
    this.head.add(noseTip);

    // Anatomical Eyes (Sclera, Hazel Iris, Pupil, Glossy Cornea & Eyelids)
    this.buildAnatomicalEyes(this.head, skin, m.irisMale);

    // Masculine Brow Ridges
    const browGeo = new THREE.BoxGeometry(0.055, 0.012, 0.02);
    const browL = new THREE.Mesh(browGeo, m.hairMale);
    browL.position.set(-0.046, 0.042, 0.118);
    browL.rotation.z = -0.12;
    const browR = new THREE.Mesh(browGeo, m.hairMale);
    browR.position.set(0.046, 0.042, 0.118);
    browR.rotation.z = 0.12;
    this.head.add(browL, browR);

    // Sculpted Natural Lips
    const lipUpper = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.042, 8), m.lipsMale);
    lipUpper.rotation.z = Math.PI / 2;
    lipUpper.position.set(0, -0.052, 0.112);
    const lipLower = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.038, 8), m.lipsMale);
    lipLower.rotation.z = Math.PI / 2;
    lipLower.position.set(0, -0.068, 0.108);
    this.head.add(lipUpper, lipLower);

    // Anatomical Ears (Left & Right)
    const earGeo = new THREE.TorusGeometry(0.028, 0.009, 8, 12);
    const earL = new THREE.Mesh(earGeo, skin);
    earL.position.set(-0.115, 0.01, -0.015);
    earL.rotation.y = -Math.PI / 2 + 0.25;
    const earR = new THREE.Mesh(earGeo, skin);
    earR.position.set(0.115, 0.01, -0.015);
    earR.rotation.y = Math.PI / 2 - 0.25;
    this.head.add(earL, earR);

    // Modern Textured Undercut Hairstyle
    const hairCap = new THREE.Mesh(new THREE.SphereGeometry(0.124, 18, 14), m.hairMale);
    hairCap.scale.set(0.94, 1.14, 1.06);
    hairCap.position.set(0, 0.055, -0.015);
    this.head.add(hairCap);

    // Textured top crop & quiff strands
    for (let f = -0.05; f <= 0.051; f += 0.035) {
      const strand = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.035, 0.12), m.hairMale);
      strand.position.set(f, 0.17, 0.02);
      strand.rotation.x = -0.35;
      this.head.add(strand);
    }

    // 4. Arms & Hands (Muscular Deltoids, Biceps, Forearms, Smartwatch & 5-Finger Hands)
    this.buildMaleArm(true, upperMat, skin, m);
    this.buildMaleArm(false, upperMat, skin, m);

    // 5. Legs & Boots (Quadriceps, Defined Patella Knees, Calves, Combat Boots)
    this.buildLegs(true, lowerMat, skin, m);
    this.buildLegs(false, lowerMat, skin, m);

    // === TACTICAL OPERATIVE LOADOUT (Military Survival AAA Quality) ===
    // 1. Ballistic Plate Carrier Body Armor
    const plateCarrier = new THREE.Group();
    plateCarrier.name = 'PlateCarrier_Vest';

    // Front & Back Armor Plates
    const frontPlate = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.28, 0.055), m.plateCarrierMat);
    frontPlate.position.set(0, 0.21, 0.125);
    frontPlate.castShadow = true;
    const backPlate = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.28, 0.055), m.plateCarrierMat);
    backPlate.position.set(0, 0.21, -0.125);
    backPlate.castShadow = true;
    plateCarrier.add(frontPlate, backPlate);

    // Shoulder Harness Straps
    const strapL = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.025, 0.28), m.plateCarrierMat);
    strapL.position.set(-0.095, 0.35, 0);
    const strapR = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.025, 0.28), m.plateCarrierMat);
    strapR.position.set(0.095, 0.35, 0);
    plateCarrier.add(strapL, strapR);

    // MOLLE Webbing Horizontal Rows (3 Rows across chest plate)
    [-0.04, 0.0, 0.04].forEach(yOff => {
      const molleRow = new THREE.Mesh(new THREE.BoxGeometry(0.21, 0.012, 0.008), m.molleWebbingMat);
      molleRow.position.set(0, 0.19 + yOff, 0.155);
      plateCarrier.add(molleRow);
    });

    // Triple Rifle Magazine Pouches (30-round mags with bungee retention)
    [-0.065, 0, 0.065].forEach(xOff => {
      const magPouch = new THREE.Mesh(new THREE.BoxGeometry(0.052, 0.11, 0.038), m.magPouchMat);
      magPouch.position.set(xOff, 0.16, 0.165);
      plateCarrier.add(magPouch);

      // Visible magazine top with metallic feed lip
      const magTop = new THREE.Mesh(new THREE.BoxGeometry(0.044, 0.035, 0.026), m.tacticalBlack);
      magTop.position.set(xOff, 0.22, 0.165);
      plateCarrier.add(magTop);
    });

    // Tactical Shoulder Radio & Rubber Whip Antenna (Left shoulder)
    const radioBody = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.08, 0.035), m.tacticalBlack);
    radioBody.position.set(-0.115, 0.30, 0.11);
    const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.002, 0.16, 6), m.tacticalBlack);
    antenna.position.set(-0.115, 0.41, 0.11);
    plateCarrier.add(radioBody, antenna);

    this.torso.add(plateCarrier);

    // 2. High-Tech Tactical Assault Backpack
    const backpack = new THREE.Group();
    backpack.name = 'Assault_Backpack';
    const packMain = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.32, 0.13), m.plateCarrierMat);
    packMain.position.set(0, 0.22, -0.19);
    packMain.castShadow = true;
    backpack.add(packMain);

    const packPouch = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.06), m.magPouchMat);
    packPouch.position.set(0, 0.18, -0.275);
    backpack.add(packPouch);

    // Top Grab Loop
    const grabLoop = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.008, 6, 8, Math.PI), m.molleWebbingMat);
    grabLoop.rotation.x = Math.PI;
    grabLoop.position.set(0, 0.38, -0.19);
    backpack.add(grabLoop);
    this.torso.add(backpack);

    // 3. Tactical Operator Comms Headset with Boom Mic
    const headset = new THREE.Group();
    headset.name = 'Tactical_Headset';
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.115, 0.012, 6, 12, Math.PI), m.tacticalBlack);
    band.position.set(0, 0.07, -0.015);
    headset.add(band);

    const earcupL = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.022, 10), m.tacticalBlack);
    earcupL.position.set(-0.12, 0.01, -0.015);
    earcupL.rotation.z = Math.PI / 2;
    const earcupR = earcupL.clone();
    earcupR.position.x = 0.12;
    headset.add(earcupL, earcupR);

    // Flexible boom microphone
    const boomMic = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.09, 6), m.tacticalBlack);
    boomMic.position.set(-0.08, -0.03, 0.06);
    boomMic.rotation.x = 0.5;
    boomMic.rotation.z = 0.5;
    const micHead = new THREE.Mesh(new THREE.SphereGeometry(0.008, 6, 6), m.tacticalBlack);
    micHead.position.set(-0.045, -0.06, 0.10);
    headset.add(boomMic, micHead);
    this.head.add(headset);

    // 4. Drop-Leg Kydex Thigh Holster & Sidearm
    if (this.legR) {
      const holsterGroup = new THREE.Group();
      holsterGroup.name = 'Thigh_Holster';
      const holsterPlate = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.16, 0.03), m.holsterMat);
      holsterPlate.position.set(0.10, -0.17, 0.02);
      holsterGroup.add(holsterPlate);

      // Molded Kydex Holster Shell
      const holsterShell = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.13, 0.07), m.tacticalBlack);
      holsterShell.position.set(0.12, -0.18, 0.025);
      holsterGroup.add(holsterShell);

      // Handgun Grip visible in holster
      const pistolGrip = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.07, 0.035), m.tacticalBlack);
      pistolGrip.position.set(0.13, -0.10, 0.04);
      pistolGrip.rotation.x = 0.35;
      holsterGroup.add(pistolGrip);

      // Leg Retention Straps (2 Straps around thigh)
      [-0.12, -0.22].forEach(yStrap => {
        const strap = new THREE.Mesh(new THREE.CylinderGeometry(0.088, 0.088, 0.022, 12), m.molleWebbingMat);
        strap.position.set(0, yStrap, 0);
        strap.scale.set(1.05, 1.0, 1.05);
        holsterGroup.add(strap);
      });
      this.legR.add(holsterGroup);
    }

    // Equip active weapon
    this.rifleMesh = null;
    this.setEquippedWeapon(this.currentWeaponId || 'ak47');
  }

  // =========================================================================
  // HIGH-FIDELITY FEMALE RIG: PRIYA SHARMA (Kurti, Saree, Western, Silky Hair)
  // =========================================================================
  buildFemaleRig() {
    const m = this.materials;
    const skin = m.skinFemale;
    let upperMat = m.kurtiMat;
    let lowerMat = m.denimMat;

    if (this.preset === 'female_saree') {
      upperMat = m.sareeMat;
      lowerMat = m.sareeMat;
    } else if (this.preset === 'female_casual') {
      upperMat = m.whiteShirt;
      lowerMat = m.denimMat;
    } else if (this.preset === 'female_formal') {
      upperMat = m.suitMat;
      lowerMat = m.suitMat;
    }

    // 1. Pelvis / Hips (Graceful feminine curvature)
    this.pelvis = new THREE.Group();
    this.pelvis.position.y = 0.88;
    this.root.add(this.pelvis);

    const hipsGeo = new THREE.CylinderGeometry(0.17, 0.15, 0.18, 14);
    const hips = new THREE.Mesh(hipsGeo, lowerMat);
    hips.scale.set(1.22, 1.0, 0.82);
    hips.castShadow = true;
    this.pelvis.add(hips);

    // Flared Kurti / Saree Skirt Hem
    if (this.preset === 'female_kurti' || this.preset === 'female_saree') {
      const skirtGeo = new THREE.CylinderGeometry(0.20, 0.35, 0.62, 18, 1, true);
      this.skirtMesh = new THREE.Mesh(skirtGeo, upperMat);
      this.skirtMesh.position.y = -0.26;
      this.skirtMesh.castShadow = true;
      this.pelvis.add(this.skirtMesh);
    }

    // 2. Torso (Bust & Athletic Waist Curve)
    this.torso = new THREE.Group();
    this.torso.position.y = 0.13;
    this.pelvis.add(this.torso);

    const chestGeo = new THREE.CylinderGeometry(0.18, 0.14, 0.34, 14);
    const chestMesh = new THREE.Mesh(chestGeo, upperMat);
    chestMesh.position.y = 0.17;
    chestMesh.scale.set(1.15, 1.0, 0.76);
    chestMesh.castShadow = true;
    this.torso.add(chestMesh);

    // Contoured Bust
    const bustGeo = new THREE.SphereGeometry(0.075, 12, 10);
    const bustL = new THREE.Mesh(bustGeo, upperMat);
    bustL.position.set(-0.07, 0.22, 0.08);
    bustL.scale.set(1.0, 0.9, 1.1);
    const bustR = new THREE.Mesh(bustGeo, upperMat);
    bustR.position.set(0.07, 0.22, 0.08);
    bustR.scale.set(1.0, 0.9, 1.1);
    this.torso.add(bustL, bustR);

    // Saree Pallu Cascading Drape
    if (this.preset === 'female_saree') {
      const palluGeo = new THREE.BoxGeometry(0.14, 0.58, 0.04);
      const pallu = new THREE.Mesh(palluGeo, m.sareeMat);
      pallu.position.set(-0.08, 0.14, 0.085);
      pallu.rotation.z = 0.42;
      pallu.castShadow = true;
      this.torso.add(pallu);
    }

    // 3. Neck & Head
    this.neck = new THREE.Group();
    this.neck.position.y = 0.38;
    this.torso.add(this.neck);

    const neckMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.058, 0.13, 12), skin);
    neckMesh.position.y = 0.04;
    neckMesh.castShadow = true;
    this.neck.add(neckMesh);

    this.head = new THREE.Group();
    this.head.position.y = 0.11;
    this.neck.add(this.head);

    // Feminine Cranium & Tapered Jaw
    const cranium = new THREE.Mesh(new THREE.SphereGeometry(0.11, 18, 14), skin);
    cranium.scale.set(0.90, 1.10, 1.02);
    cranium.position.set(0, 0.035, -0.01);
    cranium.castShadow = true;
    this.head.add(cranium);

    const jaw = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.055, 0.11, 10), skin);
    jaw.position.set(0, -0.045, 0.03);
    jaw.scale.set(1.05, 1.0, 0.9);
    jaw.castShadow = true;
    this.head.add(jaw);

    // Feminine Eyes & Lips
    this.buildAnatomicalEyes(this.head, skin, m.irisFemale);

    const lipUpper = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.036, 8), m.lipsFemale);
    lipUpper.rotation.z = Math.PI / 2;
    lipUpper.position.set(0, -0.048, 0.102);
    const lipLower = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.034, 8), m.lipsFemale);
    lipLower.rotation.z = Math.PI / 2;
    lipLower.position.set(0, -0.062, 0.098);
    this.head.add(lipUpper, lipLower);

    // Flowing Silky Hair with specular sheen
    const hairDome = new THREE.Mesh(new THREE.SphereGeometry(0.118, 18, 14), m.hairFemale);
    hairDome.scale.set(0.95, 1.15, 1.08);
    hairDome.position.set(0, 0.045, -0.02);
    this.head.add(hairDome);

    // Cascading Shoulder Locks
    const hairStrandL = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.02, 0.38, 10), m.hairFemale);
    hairStrandL.position.set(-0.11, -0.08, 0.02);
    hairStrandL.rotation.z = -0.15;
    const hairStrandR = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.02, 0.38, 10), m.hairFemale);
    hairStrandR.position.set(0.11, -0.08, 0.02);
    hairStrandR.rotation.z = 0.15;
    this.head.add(hairStrandL, hairStrandR);
    this.hairStrand = hairStrandL;

    // 4. Female Arms & Hands
    this.buildFemaleArm(true, upperMat, skin, m);
    this.buildFemaleArm(false, upperMat, skin, m);

    // 5. Female Legs & Shoes
    this.buildLegs(true, lowerMat, skin, m);
    this.buildLegs(false, lowerMat, skin, m);

    this.rifleMesh = null;
    this.setEquippedWeapon(this.currentWeaponId || 'ak47');
  }

  // =========================================================================
  // DETAILED ANATOMICAL EYES (Sclera, Iris, Pupil, Wet Cornea & Animated Eyelids)
  // =========================================================================
  buildAnatomicalEyes(headGroup, skinMat, irisMat) {
    const eyeOffsets = [-0.044, 0.044];

    eyeOffsets.forEach((ox, idx) => {
      const eyeRoot = new THREE.Group();
      eyeRoot.position.set(ox, 0.022, 0.096);

      // 1. Sclera (Eyeball white)
      const sclera = new THREE.Mesh(new THREE.SphereGeometry(0.021, 12, 10), this.materials.sclera);
      eyeRoot.add(sclera);

      // 2. Colored Iris
      const iris = new THREE.Mesh(new THREE.CircleGeometry(0.011, 14), irisMat);
      iris.position.z = 0.020;
      eyeRoot.add(iris);

      // 3. Dark Pupil
      const pupil = new THREE.Mesh(new THREE.CircleGeometry(0.0055, 12), this.materials.pupil);
      pupil.position.z = 0.0205;
      eyeRoot.add(pupil);

      // 4. Glossy Cornea Lens
      const cornea = new THREE.Mesh(new THREE.SphereGeometry(0.013, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.45), this.materials.cornea);
      cornea.position.z = 0.012;
      eyeRoot.add(cornea);

      // 5. Animated Upper Eyelid for Blinking
      const lidGeo = new THREE.BoxGeometry(0.044, 0.018, 0.022);
      const eyelid = new THREE.Mesh(lidGeo, skinMat);
      eyelid.position.set(0, 0.016, 0.012);
      eyeRoot.add(eyelid);
      this.eyelids.push(eyelid);

      headGroup.add(eyeRoot);
    });
  }

  // =========================================================================
  // DETAILED HUMAN ARMS & ARTICULATED HANDS
  // =========================================================================
  buildMaleArm(isLeft, upperMat, skinMat, mats) {
    const side = isLeft ? -1 : 1;
    const armGroup = new THREE.Group();
    armGroup.position.set(side * 0.24, 0.32, 0);
    this.torso.add(armGroup);

    // Deltoid Shoulder Cap
    const deltoid = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 10), upperMat);
    deltoid.position.y = -0.02;
    deltoid.castShadow = true;
    armGroup.add(deltoid);

    // Contoured Bicep/Tricep
    const bicep = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.054, 0.24, 12), upperMat);
    bicep.position.y = -0.14;
    bicep.castShadow = true;
    armGroup.add(bicep);

    // Forearm Group & Elbow
    const forearmGroup = new THREE.Group();
    forearmGroup.position.y = -0.26;
    armGroup.add(forearmGroup);

    const elbow = new THREE.Mesh(new THREE.SphereGeometry(0.048, 8, 8), skinMat);
    forearmGroup.add(elbow);

    const forearm = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.042, 0.22, 12), skinMat);
    forearm.position.y = -0.11;
    forearm.castShadow = true;
    forearmGroup.add(forearm);

    // Left Wrist: High-Tech Smartwatch / Tactical Chronograph
    if (isLeft) {
      const watchCase = new THREE.Mesh(new THREE.CylinderGeometry(0.046, 0.046, 0.028, 12), mats.tacticalBlack);
      watchCase.position.y = -0.19;
      const watchDial = new THREE.Mesh(new THREE.CircleGeometry(0.016, 12), mats.smartwatchGlow);
      watchDial.position.set(0, -0.19, 0.047);
      watchDial.rotation.x = Math.PI / 2;
      forearmGroup.add(watchCase, watchDial);
    }

    // Articulated 5-Finger Hand with Tactical Combat Glove
    this.buildArticulatedHand(forearmGroup, isLeft, skinMat, mats, mats.combatGlovesMat);

    if (isLeft) {
      this.armL = armGroup;
      this.forearmL = forearmGroup;
    } else {
      this.armR = armGroup;
      this.forearmR = forearmGroup;
    }
  }

  buildFemaleArm(isLeft, upperMat, skinMat, mats) {
    const side = isLeft ? -1 : 1;
    const armGroup = new THREE.Group();
    armGroup.position.set(side * 0.19, 0.28, 0);
    this.torso.add(armGroup);

    const deltoid = new THREE.Mesh(new THREE.SphereGeometry(0.058, 10, 8), upperMat);
    deltoid.position.y = -0.02;
    armGroup.add(deltoid);

    const bicep = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.042, 0.22, 10), upperMat);
    bicep.position.y = -0.12;
    bicep.castShadow = true;
    armGroup.add(bicep);

    const forearmGroup = new THREE.Group();
    forearmGroup.position.y = -0.23;
    armGroup.add(forearmGroup);

    const forearm = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.034, 0.20, 10), skinMat);
    forearm.position.y = -0.10;
    forearm.castShadow = true;
    forearmGroup.add(forearm);

    this.buildArticulatedHand(forearmGroup, isLeft, skinMat, mats, null);

    if (isLeft) {
      this.armL = armGroup;
      this.forearmL = forearmGroup;
    } else {
      this.armR = armGroup;
      this.forearmR = forearmGroup;
    }
  }

  // 5 Articulated Individual Fingers & Contoured Palm (Tactical Gloves Support)
  buildArticulatedHand(parentForearm, isLeft, skinMat, mats, gloveMat = null) {
    const hand = new THREE.Group();
    hand.position.y = -0.21;
    parentForearm.add(hand);

    const activeMat = gloveMat || skinMat;

    // Palm Core
    const palm = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.065, 0.025), activeMat);
    palm.position.y = -0.03;
    palm.castShadow = true;
    hand.add(palm);

    // Carbon-fiber protective knuckle guard for tactical operatives
    if (gloveMat) {
      const knuckleGuard = new THREE.Mesh(new THREE.BoxGeometry(0.052, 0.018, 0.012), mats.tacticalBlack);
      knuckleGuard.position.set(0, -0.045, -0.013);
      hand.add(knuckleGuard);
    }

    // Thumb (Opposable angle)
    const thumbSide = isLeft ? 1 : -1;
    const thumb = new THREE.Mesh(new THREE.CylinderGeometry(0.010, 0.009, 0.038, 6), activeMat);
    thumb.position.set(thumbSide * 0.032, -0.025, 0.014);
    thumb.rotation.z = thumbSide * 0.55;
    thumb.rotation.x = -0.3;
    hand.add(thumb);

    // 4 Articulated Fingers (Index, Middle, Ring, Pinky)
    const fingerSpacing = [-0.02, -0.007, 0.007, 0.02];
    const fingerLengths = [0.036, 0.040, 0.038, 0.032];

    fingerSpacing.forEach((fx, idx) => {
      const finger = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.007, fingerLengths[idx], 6), activeMat);
      finger.position.set(fx, -0.075, 0.004);
      finger.rotation.x = 0.45; // Natural weapon gripping curve
      hand.add(finger);
    });
  }

  // =========================================================================
  // LEGS & TACTICAL COMBAT SNEAKERS / BOOTS
  // =========================================================================
  buildLegs(isLeft, lowerMat, skinMat, mats) {
    const side = isLeft ? -1 : 1;
    const legGroup = new THREE.Group();
    legGroup.position.set(side * 0.11, -0.08, 0);
    this.pelvis.add(legGroup);

    // Anatomical Muscular Thigh (Quadriceps lateral sweep)
    const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.068, 0.40, 14), lowerMat);
    thigh.position.y = -0.20;
    thigh.castShadow = true;
    legGroup.add(thigh);

    // Shin & Calf Joint Group
    const shinGroup = new THREE.Group();
    shinGroup.position.y = -0.40;
    legGroup.add(shinGroup);

    // Patella Kneecap
    const patella = new THREE.Mesh(new THREE.SphereGeometry(0.042, 8, 8), lowerMat);
    patella.position.set(0, 0, 0.04);
    shinGroup.add(patella);

    // Muscular Gastrocnemius Calf tapering to ankle
    const calf = new THREE.Mesh(new THREE.CylinderGeometry(0.066, 0.048, 0.38, 12), lowerMat);
    calf.position.y = -0.19;
    calf.castShadow = true;
    shinGroup.add(calf);

    // High-Top Tactical Combat Sneaker / Boot
    this.buildCombatSneaker(shinGroup, mats);

    if (isLeft) {
      this.legL = legGroup;
      this.shinL = shinGroup;
    } else {
      this.legR = legGroup;
      this.shinR = shinGroup;
    }
  }

  buildCombatSneaker(parentShin, mats) {
    const bootGroup = new THREE.Group();
    bootGroup.position.set(0, -0.38, 0.035);

    // 1. Thick Lugged Rubber Outsole
    const sole = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.035, 0.24), mats.shoesRubber);
    sole.position.y = -0.035;
    sole.castShadow = true;
    bootGroup.add(sole);

    // 2. White Cushioned Midsole Wedge
    const mid = new THREE.Mesh(new THREE.BoxGeometry(0.098, 0.025, 0.235), mats.shoesWhiteMid);
    mid.position.y = -0.015;
    bootGroup.add(mid);

    // 3. Leather Upper & High-Top Ankle Collar
    const upper = new THREE.Mesh(new THREE.BoxGeometry(0.095, 0.075, 0.22), mats.leatherBlack);
    upper.position.set(0, 0.035, 0.01);
    upper.castShadow = true;
    bootGroup.add(upper);

    // 4. Reinforced Toe Cap
    const toe = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), mats.leatherBlack);
    toe.position.set(0, 0.01, 0.095);
    toe.scale.set(1.0, 0.65, 1.0);
    bootGroup.add(toe);

    // 5. Padded Tongue & 3D Laces
    const laces = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.065, 0.015), mats.shoesWhiteMid);
    laces.position.set(0, 0.06, 0.065);
    laces.rotation.x = -0.35;
    bootGroup.add(laces);

    parentShin.add(bootGroup);
  }

  // =========================================================================
  // WEAPON ATTACHMENT & MUZZLE FLASH
  // =========================================================================
  setEquippedWeapon(weaponId = 'ak47') {
    if (this.rifleMesh && this.forearmR) {
      this.forearmR.remove(this.rifleMesh);
    }
    this.currentWeaponId = weaponId;
    this.rifleMesh = weaponArsenal.createWeaponMesh(weaponId);

    // Position gun naturally in right hand grip
    this.rifleMesh.position.set(0, -0.22, 0.12);
    this.rifleMesh.rotation.set(-0.25, 0, 0);

    this.muzzleLight = this.rifleMesh.userData.muzzleLight || null;
    if (!this.muzzleLight) {
      this.muzzleLight = new THREE.PointLight(0xffaa22, 0, 22);
      this.muzzleLight.position.set(0, 0.08, 0.88);
      this.rifleMesh.add(this.muzzleLight);
    }
    if (this.forearmR) {
      this.forearmR.add(this.rifleMesh);
    }
  }

  buildPrimaryRifleMesh() {
    return weaponArsenal.createWeaponMesh('ak47');
  }

  setFirstPerson(isFP) {
    this.isFirstPerson = isFP;
    if (this.head) {
      this.head.visible = !isFP;
    }
  }

  setShivering(shivering) {
    this.isShivering = shivering;
  }

  triggerMuzzleFlash() {
    this.recoilKick = 0.24;
    if (this.muzzleLight) {
      this.muzzleLight.intensity = 9.0;
      setTimeout(() => {
        if (this.muzzleLight) this.muzzleLight.intensity = 0;
      }, 50);
    }
  }

  // =========================================================================
  // ANIMATION LOCOMOTION PIPELINE & MICRO-ANIMATIONS
  // =========================================================================
  updateAnimation(delta, state, speedRatio, isAiming) {
    if (this.mixer) {
      this.mixer.update(delta);
    }
    this.locomotionState = state;
    this.animTime += delta * (speedRatio > 0 ? (state === 'sprint' ? 12 : 7) : 2.2);

    // Natural eye blink micro-animation
    this.blinkTimer += delta;
    if (!this.isBlinking && this.blinkTimer >= this.nextBlink) {
      this.isBlinking = true;
      this.blinkTimer = 0;
      this.nextBlink = 3.0 + Math.random() * 3.5;
    }
    if (this.isBlinking) {
      const blinkProgress = this.blinkTimer / 0.15;
      if (blinkProgress >= 1.0) {
        this.isBlinking = false;
        this.eyelids.forEach(l => l.position.y = 0.016);
      } else {
        const lidClose = Math.sin(blinkProgress * Math.PI) * 0.018;
        this.eyelids.forEach(l => l.position.y = 0.016 - lidClose);
      }
    }

    const targetAim = isAiming ? 1.0 : 0.0;
    this.aimWeight += (targetAim - this.aimWeight) * (delta * 14.0);

    if (this.recoilKick > 0) {
      this.recoilKick = Math.max(0, this.recoilKick - delta * 2.0);
    }

    let shiverOffset = 0;
    if (this.isShivering) {
      shiverOffset = Math.sin(Date.now() * 0.05) * 0.012;
    }

    if (state === 'idle') {
      // Natural idle breathing (subtle chest rise and clavicle sway)
      const breath = Math.sin(this.animTime) * 0.018 + shiverOffset;
      if (this.torso) {
        this.torso.position.y = 0.14 + breath;
        this.torso.scale.set(1.0 + breath * 0.4, 1.0, 1.0 + breath * 0.4);
      }
      if (this.head) {
        this.head.rotation.x = Math.sin(this.animTime * 0.5) * 0.025;
      }

      if (this.skirtMesh) {
        this.skirtMesh.rotation.z = Math.sin(this.animTime * 1.2) * 0.035;
      }
      if (this.hairStrand) {
        this.hairStrand.rotation.z = -0.15 + Math.sin(this.animTime * 1.5) * 0.04;
      }

      if (this.aimWeight > 0.01) {
        if (this.armR) {
          this.armR.rotation.set(-Math.PI * 0.48 * this.aimWeight - this.recoilKick, -0.18 * this.aimWeight, 0.05);
        }
        if (this.forearmR) this.forearmR.rotation.set(-0.35 * this.aimWeight, 0, 0);
        if (this.armL) {
          this.armL.rotation.set(-Math.PI * 0.42 * this.aimWeight, 0.48 * this.aimWeight, 0.1);
        }
        if (this.forearmL) this.forearmL.rotation.set(-0.65 * this.aimWeight, 0.1, 0);
      } else {
        if (this.armR) this.armR.rotation.set(-Math.PI * 0.26, -0.20, 0.10 - this.recoilKick);
        if (this.forearmR) this.forearmR.rotation.set(-0.30, 0, 0);
        if (this.armL) this.armL.rotation.set(-Math.PI * 0.24, 0.38, 0.12);
        if (this.forearmL) this.forearmL.rotation.set(-0.52, 0.18, 0);
      }

      if (this.legL) this.legL.rotation.set(0, 0, 0);
      if (this.legR) this.legR.rotation.set(0, 0, 0);
      if (this.shinL) this.shinL.rotation.set(0, 0, 0);
      if (this.shinR) this.shinR.rotation.set(0, 0, 0);
    } else if (state === 'walk' || state === 'sprint') {
      const legStride = state === 'sprint' ? 0.85 : 0.50;
      const legAngle = Math.sin(this.animTime) * legStride;

      if (this.legL) this.legL.rotation.x = legAngle;
      if (this.legR) this.legR.rotation.x = -legAngle;

      if (this.shinL) this.shinL.rotation.x = legAngle > 0 ? legAngle * 0.85 : 0.1;
      if (this.shinR) this.shinR.rotation.x = -legAngle > 0 ? -legAngle * 0.85 : 0.1;

      if (this.torso) {
        this.torso.position.y = 0.14 + Math.abs(Math.sin(this.animTime)) * 0.045;
        this.torso.rotation.x = state === 'sprint' ? 0.15 : 0.06;
        this.torso.rotation.y = -legAngle * 0.12;
      }

      if (this.skirtMesh) {
        this.skirtMesh.rotation.x = Math.sin(this.animTime) * 0.15;
      }
      if (this.hairStrand) {
        this.hairStrand.rotation.x = -0.2 - Math.abs(Math.sin(this.animTime)) * 0.2;
      }

      if (this.aimWeight > 0.01) {
        if (this.armR) this.armR.rotation.set(-Math.PI * 0.48 * this.aimWeight - this.recoilKick, -0.18 * this.aimWeight, 0);
        if (this.armL) this.armL.rotation.set(-Math.PI * 0.42 * this.aimWeight, 0.48 * this.aimWeight, 0);
      } else {
        const bounce = Math.sin(this.animTime) * 0.12;
        if (this.armR) this.armR.rotation.set(-Math.PI * 0.26 + bounce, -0.20, 0.10);
        if (this.forearmR) this.forearmR.rotation.set(-0.30, 0, 0);
        if (this.armL) this.armL.rotation.set(-Math.PI * 0.24 + bounce, 0.38, 0.12);
        if (this.forearmL) this.forearmL.rotation.set(-0.52, 0.18, 0);
      }
    } else if (state === 'crouch') {
      if (this.pelvis) this.pelvis.position.y = 0.65;
      if (this.legL) this.legL.rotation.x = -0.85;
      if (this.legR) this.legR.rotation.x = -0.85;
      if (this.shinL) this.shinL.rotation.x = 1.25;
      if (this.shinR) this.shinR.rotation.x = 1.25;
    }
  }

  setVisible(visible) {
    this.root.visible = visible;
  }
}
