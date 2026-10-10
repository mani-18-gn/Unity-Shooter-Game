import * as THREE from 'three';
import { Sky } from 'three/addons/objects/Sky.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';

// Cinematic Filmic Color Grading & Vignette Shader
const CinematicColorGradeShader = {
  name: 'CinematicColorGradeShader',
  uniforms: {
    'tDiffuse': { value: null },
    'vignetteDarkness': { value: 0.75 },
    'vignetteOffset': { value: 1.15 },
    'warmth': { value: 0.06 },
    'contrast': { value: 1.07 },
    'saturation': { value: 1.14 }
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float vignetteDarkness;
    uniform float vignetteOffset;
    uniform float warmth;
    uniform float contrast;
    uniform float saturation;
    varying vec2 vUv;

    void main() {
      vec4 texel = texture2D(tDiffuse, vUv);
      vec3 color = texel.rgb;

      // 1. Contrast adjustment
      color = (color - 0.5) * contrast + 0.5;

      // 2. Warm golden-hour sunset tint (rich amber/orange in midtones & highlights)
      color.r += warmth * 0.45;
      color.g += warmth * 0.22;

      // 3. Saturation boost for rich open-world palette
      float lum = dot(color, vec3(0.2126, 0.7152, 0.0722));
      color = mix(vec3(lum), color, saturation);

      // 4. Subtle cinematic vignette (guaranteed non-negative, zero NaN)
      vec2 uv = (vUv - vec2(0.5)) * vec2(vignetteOffset);
      float d = dot(uv, uv);
      float vig = clamp(1.0 - d * vignetteDarkness, 0.0, 1.0);
      color *= vig;

      gl_FragColor = vec4(color, texel.a);
    }
  `
};

export class Engine {
  constructor(canvas, settingsManager) {
    this.canvas = canvas;
    this.settings = settingsManager;

    this.scene = new THREE.Scene();

    // Natural atmospheric depth fog matching golden-hour horizon
    this.scene.fog = new THREE.FogExp2(0xc48c62, 0.00065);

    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      8000
    );

    const graphics = this.settings.settings.graphics;
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance',
      precision: 'highp',
      stencil: false
    });

    this.renderer.setSize(window.innerWidth, window.innerHeight);
    const pr = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1;
    this.renderer.setPixelRatio(Math.min(pr, 2.0)); // Cap at 2.0 for 60 FPS performance
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05; // Balanced cinematic exposure
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    if (graphics.shadows) {
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }

    this.pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.pmremGenerator.compileEquirectangularShader();

    this.clock = new THREE.Clock();
    this.textureLibrary = {};

    this.initLighting();
    this.createPhysicalSky();
    this.tryLoadHdriEnvironment();
    this.generateProceduralPBRTextures();
    this.initPostProcessing();
    this.setupResize();
  }

  // 1. PHYSICAL ATMOSPHERIC SKY SYSTEM
  createPhysicalSky() {
    this.sky = new Sky();
    this.sky.scale.setScalar(5000);
    this.scene.add(this.sky);

    // Warm golden sunset background color
    this.scene.background = new THREE.Color(0xf59858);

    this.sunPosition = new THREE.Vector3();

    const skyUniforms = this.sky.material.uniforms;
    skyUniforms['turbidity'].value = 8.0;
    skyUniforms['rayleigh'].value = 2.8; // Warm golden Rayleigh scattering
    skyUniforms['mieCoefficient'].value = 0.005;
    skyUniforms['mieDirectionalG'].value = 0.85;

    // Distant volumetric-style cloud plane
    const cloudGeo = new THREE.PlaneGeometry(2400, 2400);
    cloudGeo.rotateX(-Math.PI / 2);
    const cloudCanvas = document.createElement('canvas');
    cloudCanvas.width = 512;
    cloudCanvas.height = 512;
    const cctx = cloudCanvas.getContext('2d');
    cctx.fillStyle = 'rgba(0, 0, 0, 0)';
    cctx.fillRect(0, 0, 512, 512);

    for (let i = 0; i < 40; i++) {
      const cx = Math.random() * 512;
      const cy = Math.random() * 512;
      const rad = 50 + Math.random() * 90;
      const cgrad = cctx.createRadialGradient(cx, cy, 5, cx, cy, rad);
      cgrad.addColorStop(0, 'rgba(255, 230, 195, 0.65)');
      cgrad.addColorStop(0.5, 'rgba(235, 185, 150, 0.35)');
      cgrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      cctx.fillStyle = cgrad;
      cctx.beginPath();
      cctx.arc(cx, cy, rad, 0, Math.PI * 2);
      cctx.fill();
    }

    const cloudTex = new THREE.CanvasTexture(cloudCanvas);
    cloudTex.wrapS = THREE.RepeatWrapping;
    cloudTex.wrapT = THREE.RepeatWrapping;
    cloudTex.repeat.set(3, 3);

    this.cloudMat = new THREE.MeshBasicMaterial({
      map: cloudTex,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
      fog: false
    });

    this.cloudMesh = new THREE.Mesh(cloudGeo, this.cloudMat);
    this.cloudMesh.position.y = 220;
    this.scene.add(this.cloudMesh);

    // Initial environment lighting pass from physical sky
    this.createGoldenHourEnvironment();
  }

  // Generate real-time IBL Reflection Gradient for all PBR materials
  createGoldenHourEnvironment() {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 128;
      const ctx = canvas.getContext('2d');
      const grad = ctx.createLinearGradient(0, 0, 0, 128);
      grad.addColorStop(0.0, '#426894'); // Top sky: soft blue
      grad.addColorStop(0.48, '#f59e54'); // Horizon: golden sunset amber
      grad.addColorStop(0.68, '#c85e28'); // Sunset glow
      grad.addColorStop(1.0, '#3d2516'); // Ground bounce: warm dark terracotta
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 256, 128);

      const texture = new THREE.CanvasTexture(canvas);
      texture.mapping = THREE.EquirectangularReflectionMapping;
      this.scene.environment = texture;
    } catch (e) {
      console.warn('[Engine] Could not create environment texture:', e);
    }
  }

  // Optional local HDRI loader (checks /public/assets/hdri/sunset.hdr or sky.hdr)
  tryLoadHdriEnvironment() {
    const hdrLoader = new HDRLoader();
    const candidatePaths = [
      '/assets/hdri/sunset.hdr',
      '/assets/hdri/sky.hdr',
      '/assets/hdri/golden_hour.hdr'
    ];

    const tryNext = (idx) => {
      if (idx >= candidatePaths.length) return;
      const path = candidatePaths[idx];
      hdrLoader.load(
        path,
        (texture) => {
          texture.mapping = THREE.EquirectangularReflectionMapping;
          this.scene.environment = texture;
          this.scene.background = texture;
          console.log('[HORIZEN Graphics] Loaded Photorealistic HDRI Sky:', path);
        },
        undefined,
        () => {
          // File not present, fallback to physical Sky shader
          tryNext(idx + 1);
        }
      );
    };

    tryNext(0);
  }

  // 2. CINEMATIC AAA LIGHTING
  initLighting() {
    // 1. Ambient Irradiance: Soft warm ambient
    this.ambientLight = new THREE.AmbientLight(0xffdfcb, 0.85);
    this.scene.add(this.ambientLight);

    // 2. Hemispheric Sky/Ground Tone Light (Golden sky + terracotta ground)
    this.hemiLight = new THREE.HemisphereLight(0xf8b884, 0x483228, 1.15);
    this.scene.add(this.hemiLight);

    // 3. Main Direct Golden Sunset Sun Light
    this.sunLight = new THREE.DirectionalLight(0xffa254, 3.4);
    this.sunLight.position.set(120, 85, -500);
    this.sunLight.castShadow = this.settings.settings.graphics.shadows;

    if (this.sunLight.castShadow) {
      const smSize = this.settings.settings.graphics.shadowMapSize || 2048;
      this.sunLight.shadow.mapSize.width = smSize;
      this.sunLight.shadow.mapSize.height = smSize;
      this.sunLight.shadow.camera.near = 10;
      this.sunLight.shadow.camera.far = 550;
      this.sunLight.shadow.camera.left = -140;
      this.sunLight.shadow.camera.right = 140;
      this.sunLight.shadow.camera.top = 140;
      this.sunLight.shadow.camera.bottom = -140;
      this.sunLight.shadow.bias = -0.00025;
      this.sunLight.shadow.radius = 2.0;
    }
    this.scene.add(this.sunLight);

    // 4. Soft Fill Light (ambient sky bounce)
    this.fillLight = new THREE.DirectionalLight(0x90c4f0, 0.75);
    this.fillLight.position.set(-150, 110, -120);
    this.scene.add(this.fillLight);
  }

  // 3. POST-PROCESSING PIPELINE (EffectComposer)
  initPostProcessing() {
    this.postProcessingEnabled = true;
    this.graphicsPreset = 'high'; // 'low', 'medium', 'high'

    try {
      this.composer = new EffectComposer(this.renderer);
      
      // Pass 1: Base scene render
      this.renderPass = new RenderPass(this.scene, this.camera);
      this.composer.addPass(this.renderPass);

      // Pass 2: Subtle Cinematic Bloom (UnrealBloom)
      const res = new THREE.Vector2(window.innerWidth, window.innerHeight);
      this.bloomPass = new UnrealBloomPass(res, 0.28, 0.45, 0.88);
      this.composer.addPass(this.bloomPass);

      // Pass 3: Cinematic Color Grading & Vignette
      this.colorGradePass = new ShaderPass(CinematicColorGradeShader);
      this.composer.addPass(this.colorGradePass);

      // Pass 4: Output Tone Mapping & Color Management Pass
      this.outputPass = new OutputPass();
      this.composer.addPass(this.outputPass);
    } catch (err) {
      console.warn('[HORIZEN Graphics] Post-processing initialization error, using direct renderer:', err);
      this.postProcessingEnabled = false;
    }
  }

  setGraphicsQuality(preset = 'high') {
    this.graphicsPreset = preset;
    if (preset === 'low') {
      this.postProcessingEnabled = false;
      this.renderer.shadowMap.enabled = false;
      this.renderer.setPixelRatio(1.0);
    } else if (preset === 'medium') {
      this.postProcessingEnabled = true;
      if (this.bloomPass) this.bloomPass.enabled = false;
      this.renderer.shadowMap.enabled = true;
      this.renderer.setPixelRatio(1.0);
    } else {
      // High
      this.postProcessingEnabled = true;
      if (this.bloomPass) this.bloomPass.enabled = true;
      this.renderer.shadowMap.enabled = true;
      const pr = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1;
      this.renderer.setPixelRatio(Math.min(pr, 2.0));
    }
  }

  // 4. PROCEDURAL HIGH-RESOLUTION PBR TEXTURES
  generateProceduralPBRTextures() {
    // 1. High-Detail Asphalt Road with centerlines & fine grain
    const asphaltCanvas = document.createElement('canvas');
    asphaltCanvas.width = 512;
    asphaltCanvas.height = 512;
    const actx = asphaltCanvas.getContext('2d');

    actx.fillStyle = '#2c3138';
    actx.fillRect(0, 0, 512, 512);

    const imgData = actx.getImageData(0, 0, 512, 512);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const grain = (Math.random() - 0.5) * 22;
      data[i] = Math.max(0, Math.min(255, data[i] + grain));
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + grain));
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + grain));
    }
    actx.putImageData(imgData, 0, 0);

    // Crisp White Shoulder Markings
    actx.fillStyle = '#e8ecf2';
    actx.fillRect(24, 0, 8, 512);
    actx.fillRect(480, 0, 8, 512);

    // Double Center Yellow Lines
    actx.fillStyle = '#f5b82e';
    actx.fillRect(250, 0, 5, 512);
    actx.fillRect(258, 0, 5, 512);

    const asphaltTex = new THREE.CanvasTexture(asphaltCanvas);
    asphaltTex.wrapS = THREE.RepeatWrapping;
    asphaltTex.wrapT = THREE.RepeatWrapping;
    asphaltTex.repeat.set(1, 16);
    this.textureLibrary.asphalt = asphaltTex;

    // 2. Normal Map for Asphalt
    const normCanvas = document.createElement('canvas');
    normCanvas.width = 256;
    normCanvas.height = 256;
    const nctx = normCanvas.getContext('2d');
    nctx.fillStyle = '#8080ff';
    nctx.fillRect(0, 0, 256, 256);
    const nData = nctx.getImageData(0, 0, 256, 256);
    for (let i = 0; i < nData.data.length; i += 4) {
      const perturb = (Math.random() - 0.5) * 35;
      nData.data[i] = 128 + perturb;
      nData.data[i + 1] = 128 + perturb;
      nData.data[i + 2] = 255;
    }
    nctx.putImageData(nData, 0, 0);
    const asphaltNormal = new THREE.CanvasTexture(normCanvas);
    asphaltNormal.wrapS = THREE.RepeatWrapping;
    asphaltNormal.wrapT = THREE.RepeatWrapping;
    asphaltNormal.repeat.set(1, 16);
    this.textureLibrary.asphaltNormal = asphaltNormal;

    // 3. Organic Grass Texture
    const grassCanvas = document.createElement('canvas');
    grassCanvas.width = 256;
    grassCanvas.height = 256;
    const gctx = grassCanvas.getContext('2d');
    gctx.fillStyle = '#3a6634';
    gctx.fillRect(0, 0, 256, 256);
    const gData = gctx.getImageData(0, 0, 256, 256);
    for (let i = 0; i < gData.data.length; i += 4) {
      const gNoise = (Math.random() - 0.5) * 30;
      gData.data[i] = Math.max(0, Math.min(255, gData.data[i] + gNoise * 0.7));
      gData.data[i + 1] = Math.max(0, Math.min(255, gData.data[i + 1] + gNoise));
      gData.data[i + 2] = Math.max(0, Math.min(255, gData.data[i + 2] + gNoise * 0.5));
    }
    gctx.putImageData(gData, 0, 0);
    const grassTex = new THREE.CanvasTexture(grassCanvas);
    grassTex.wrapS = THREE.RepeatWrapping;
    grassTex.wrapT = THREE.RepeatWrapping;
    grassTex.repeat.set(30, 30);
    this.textureLibrary.grass = grassTex;

    // 4. Beach Sand
    const beachCanvas = document.createElement('canvas');
    beachCanvas.width = 256;
    beachCanvas.height = 256;
    const bctx = beachCanvas.getContext('2d');
    bctx.fillStyle = '#dfcca4';
    bctx.fillRect(0, 0, 256, 256);
    const bTex = new THREE.CanvasTexture(beachCanvas);
    bTex.wrapS = THREE.RepeatWrapping;
    bTex.wrapT = THREE.RepeatWrapping;
    bTex.repeat.set(20, 20);
    this.textureLibrary.beachSand = bTex;

    // 5. Desert Sand (Golden wind-rippled dunes)
    const desertCanvas = document.createElement('canvas');
    desertCanvas.width = 256;
    desertCanvas.height = 256;
    const dctx = desertCanvas.getContext('2d');
    dctx.fillStyle = '#d49448';
    dctx.fillRect(0, 0, 256, 256);
    for (let y = 0; y < 256; y += 16) {
      dctx.fillStyle = 'rgba(235, 175, 95, 0.35)';
      dctx.fillRect(0, y, 256, 8);
      dctx.fillStyle = 'rgba(175, 110, 45, 0.3)';
      dctx.fillRect(0, y + 8, 256, 8);
    }
    const desertTex = new THREE.CanvasTexture(desertCanvas);
    desertTex.wrapS = THREE.RepeatWrapping;
    desertTex.wrapT = THREE.RepeatWrapping;
    desertTex.repeat.set(24, 24);
    this.textureLibrary.desertSand = desertTex;

    // 6. Red Rock Sandstone
    const redRockCanvas = document.createElement('canvas');
    redRockCanvas.width = 256;
    redRockCanvas.height = 256;
    const rrctx = redRockCanvas.getContext('2d');
    rrctx.fillStyle = '#9c4d38';
    rrctx.fillRect(0, 0, 256, 256);
    for (let y = 0; y < 256; y += 24) {
      rrctx.fillStyle = (y % 48 === 0) ? '#ba644b' : '#7d3826';
      rrctx.fillRect(0, y, 256, 12);
    }
    const redRockTex = new THREE.CanvasTexture(redRockCanvas);
    redRockTex.wrapS = THREE.RepeatWrapping;
    redRockTex.wrapT = THREE.RepeatWrapping;
    redRockTex.repeat.set(16, 16);
    this.textureLibrary.redRock = redRockTex;

    // 7. Mountain Rock
    const rockCanvas = document.createElement('canvas');
    rockCanvas.width = 256;
    rockCanvas.height = 256;
    const rkctx = rockCanvas.getContext('2d');
    rkctx.fillStyle = '#534e4a';
    rkctx.fillRect(0, 0, 256, 256);
    const rockTex = new THREE.CanvasTexture(rockCanvas);
    rockTex.wrapS = THREE.RepeatWrapping;
    rockTex.wrapT = THREE.RepeatWrapping;
    rockTex.repeat.set(20, 20);
    this.textureLibrary.mountainRock = rockTex;

    // 8. Dirt Road
    const dirtCanvas = document.createElement('canvas');
    dirtCanvas.width = 256;
    dirtCanvas.height = 256;
    const dirtCtx = dirtCanvas.getContext('2d');
    dirtCtx.fillStyle = '#634d35';
    dirtCtx.fillRect(0, 0, 256, 256);
    const dirtTex = new THREE.CanvasTexture(dirtCanvas);
    dirtTex.wrapS = THREE.RepeatWrapping;
    dirtTex.wrapT = THREE.RepeatWrapping;
    dirtTex.repeat.set(2, 20);
    this.textureLibrary.dirtRoad = dirtTex;

    // 9. Airport Runway Asphalt
    const rwyCanvas = document.createElement('canvas');
    rwyCanvas.width = 512;
    rwyCanvas.height = 512;
    const rwCtx = rwyCanvas.getContext('2d');
    rwCtx.fillStyle = '#26292e';
    rwCtx.fillRect(0, 0, 512, 512);
    rwCtx.fillStyle = '#ffffff';
    for (let x = 40; x < 470; x += 36) {
      rwCtx.fillRect(x, 15, 20, 90);
      rwCtx.fillRect(x, 407, 20, 90);
    }
    for (let y = 140; y < 390; y += 70) {
      rwCtx.fillRect(246, y, 20, 45);
    }
    rwCtx.fillRect(25, 0, 6, 512);
    rwCtx.fillRect(481, 0, 6, 512);
    const rwyTex = new THREE.CanvasTexture(rwyCanvas);
    rwyTex.wrapS = THREE.RepeatWrapping;
    rwyTex.wrapT = THREE.RepeatWrapping;
    rwyTex.repeat.set(1, 10);
    this.textureLibrary.airportRunway = rwyTex;

    // 10. Carbon Fiber
    const cfCanvas = document.createElement('canvas');
    cfCanvas.width = 64;
    cfCanvas.height = 64;
    const cfctx = cfCanvas.getContext('2d');
    cfctx.fillStyle = '#15171a';
    cfctx.fillRect(0, 0, 64, 64);
    cfctx.fillStyle = '#242830';
    for (let x = 0; x < 64; x += 8) {
      for (let y = 0; y < 64; y += 8) {
        if ((x + y) % 16 === 0) cfctx.fillRect(x, y, 8, 8);
      }
    }
    const cfTex = new THREE.CanvasTexture(cfCanvas);
    cfTex.wrapS = THREE.RepeatWrapping;
    cfTex.wrapT = THREE.RepeatWrapping;
    cfTex.repeat.set(8, 8);
    this.textureLibrary.carbonFiber = cfTex;

    // 11. Tire Tread
    const tireCanvas = document.createElement('canvas');
    tireCanvas.width = 128;
    tireCanvas.height = 128;
    const tctx = tireCanvas.getContext('2d');
    tctx.fillStyle = '#181a1d';
    tctx.fillRect(0, 0, 128, 128);
    tctx.fillStyle = '#0a0b0d';
    for (let y = 0; y < 128; y += 16) {
      tctx.fillRect(0, y, 128, 4);
      tctx.fillRect(32, y + 6, 20, 6);
      tctx.fillRect(76, y + 6, 20, 6);
    }
    const tireTex = new THREE.CanvasTexture(tireCanvas);
    tireTex.wrapS = THREE.RepeatWrapping;
    tireTex.wrapT = THREE.RepeatWrapping;
    tireTex.repeat.set(1, 6);
    this.textureLibrary.tireTread = tireTex;
  }

  setupResize() {
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      if (this.composer) {
        this.composer.setSize(window.innerWidth, window.innerHeight);
      }
    });
  }

  // 5. REAL-TIME SUN VECTOR & ATMOSPHERIC CYCLE
  updateSunPosition(timeOfDay = 17.5) {
    // 6 = dawn, 12 = noon, 17.5 = golden hour sunset, 24 = midnight
    const angle = ((timeOfDay - 6) / 24) * Math.PI * 2;
    const distance = 400;
    const sunY = Math.sin(angle) * distance;
    const sunX = Math.cos(angle) * distance;
    const sunZ = 120;

    this.sunPosition.set(sunX, Math.max(10, sunY), sunZ);
    this.sunLight.position.copy(this.sunPosition);

    if (this.sky) {
      this.sky.material.uniforms['sunPosition'].value.copy(this.sunPosition);
    }

    let mode = 'sunset';
    if (timeOfDay >= 7.5 && timeOfDay < 16.5) {
      mode = 'day';
    } else if (timeOfDay >= 16.5 && timeOfDay < 19.5) {
      mode = 'sunset';
    } else {
      mode = 'night';
    }

    if (mode === 'day') {
      this.sunLight.color.setHex(0xfffaee);
      this.sunLight.intensity = 3.6;
      this.ambientLight.intensity = 1.1;
      this.ambientLight.color.setHex(0xffffff);
      this.hemiLight.color.setHex(0xd4eaff);
      this.hemiLight.groundColor.setHex(0x526655);
      this.hemiLight.intensity = 1.25;
      if (this.scene.fog) {
        this.scene.fog.color.setHex(0x9cc8f2);
        this.scene.fog.density = 0.0006;
      }
      if (this.scene.background) {
        this.scene.background.setHex(0x82b8e8);
      }
      if (this.sky) {
        this.sky.material.uniforms['turbidity'].value = 4.0;
        this.sky.material.uniforms['rayleigh'].value = 1.6;
      }
    } else if (mode === 'sunset') {
      // Golden Hour Sunset (Forza Horizon style!)
      this.sunLight.color.setHex(0xffa254);
      this.sunLight.intensity = 3.2;
      this.ambientLight.intensity = 0.95;
      this.ambientLight.color.setHex(0xffd8b8);
      this.hemiLight.color.setHex(0xf59a68);
      this.hemiLight.groundColor.setHex(0x4a342a);
      this.hemiLight.intensity = 1.2;
      if (this.scene.fog) {
        this.scene.fog.color.setHex(0xc48c62);
        this.scene.fog.density = 0.00075;
      }
      if (this.scene.background) {
        this.scene.background.setHex(0xf59858);
      }
      if (this.sky) {
        this.sky.material.uniforms['turbidity'].value = 9.0;
        this.sky.material.uniforms['rayleigh'].value = 3.2;
      }
    } else {
      // Moonlit Night with deep blue atmosphere & city visibility
      this.sunLight.color.setHex(0x8cb8ee);
      this.sunLight.intensity = 1.6;
      this.ambientLight.intensity = 0.8;
      this.ambientLight.color.setHex(0x384a62);
      this.hemiLight.color.setHex(0x22344a);
      this.hemiLight.groundColor.setHex(0x121a24);
      this.hemiLight.intensity = 0.95;
      if (this.scene.fog) {
        this.scene.fog.color.setHex(0x101824);
        this.scene.fog.density = 0.0012;
      }
      if (this.scene.background) {
        this.scene.background.setHex(0x0e1624);
      }
      if (this.sky) {
        this.sky.material.uniforms['turbidity'].value = 12.0;
        this.sky.material.uniforms['rayleigh'].value = 0.4;
      }
    }
  }

  render() {
    if (this.composer && this.postProcessingEnabled) {
      try {
        this.composer.render();
        return;
      } catch (err) {
        console.warn('[HORIZEN Graphics] Post-processing composer error, using direct render:', err);
        this.postProcessingEnabled = false;
      }
    }
    this.renderer.render(this.scene, this.camera);
  }
}
