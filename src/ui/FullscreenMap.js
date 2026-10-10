// ROADBOUND - Interactive Fullscreen Blackshore Island Tactical Map (All 12 Biomes)
export class FullscreenMap {
  constructor(gameState, roadNetwork) {
    this.gameState = gameState;
    this.roadNetwork = roadNetwork;

    this.canvas = document.getElementById('fullscreen-map-canvas');
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;

    this.zoom = 1.0;
    this.panX = 0;
    this.panY = 0;
    this.isDragging = false;
    this.dragStart = { x: 0, y: 0 };

    this.initEvents();
  }

  initEvents() {
    if (!this.canvas) return;

    this.canvas.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.dragStart.x = e.clientX - this.panX;
      this.dragStart.y = e.clientY - this.panY;
    });

    window.addEventListener('mousemove', (e) => {
      if (this.isDragging) {
        this.panX = e.clientX - this.dragStart.x;
        this.panY = e.clientY - this.dragStart.y;
        this.render();
      }
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
      this.zoom = Math.max(0.35, Math.min(3.8, this.zoom * zoomFactor));
      this.render();
    });

    // Click to set custom GPS waypoint
    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      const cx = this.canvas.width / 2 + this.panX;
      const cy = this.canvas.height / 2 + this.panY;
      const scale = 0.45 * this.zoom;

      const worldX = (clickX - cx) / scale;
      const worldZ = (clickY - cy) / scale;

      this.gameState.gpsWaypoint = { x: worldX, z: worldZ };
      this.gameState.notify('gps_waypoint_set', this.gameState.gpsWaypoint);
      this.render();
    });

    const btnCenter = document.getElementById('btn-map-center-player');
    if (btnCenter) {
      btnCenter.addEventListener('click', () => {
        this.centerOnPlayer();
      });
    }

    const btnClear = document.getElementById('btn-map-clear-waypoint');
    if (btnClear) {
      btnClear.addEventListener('click', () => {
        this.gameState.gpsWaypoint = null;
        this.render();
      });
    }
  }

  centerOnPlayer() {
    const scale = 0.45 * this.zoom;
    this.panX = -this.gameState.player.position.x * scale;
    this.panY = -this.gameState.player.position.z * scale;
    this.render();
  }

  resize() {
    if (!this.canvas) return;
    const parent = this.canvas.parentElement;
    if (parent) {
      this.canvas.width = parent.clientWidth;
      this.canvas.height = parent.clientHeight;
      this.render();
    }
  }

  render() {
    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Deep Ocean Water
    ctx.fillStyle = '#08101a';
    ctx.fillRect(0, 0, w, h);

    const cx = w / 2 + this.panX;
    const cy = h / 2 + this.panY;
    const scale = 0.45 * this.zoom;

    ctx.save();
    ctx.translate(cx, cy);

    // 1. Draw Island Base Landmass (2400m continuous island)
    ctx.fillStyle = '#162818';
    ctx.strokeStyle = '#2b4430';
    ctx.lineWidth = 4 * this.zoom;
    ctx.beginPath();
    ctx.ellipse(0, 0, 1100 * scale, 1050 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 2. Draw Distinct Biome Terrains

    // Region A: Tropical Coast & Beach (Southwest)
    ctx.fillStyle = '#8f7e5b';
    ctx.beginPath();
    ctx.arc(-650 * scale, 480 * scale, 280 * scale, 0, Math.PI * 2);
    ctx.fill();

    // Region B: Countryside & Farmland (Northwest)
    ctx.fillStyle = '#2d5e2a';
    ctx.beginPath();
    ctx.arc(-480 * scale, -450 * scale, 350 * scale, 0, Math.PI * 2);
    ctx.fill();

    // Region E: High Mountain Summit (Center-North & Northeast)
    ctx.fillStyle = '#3a414a';
    ctx.beginPath();
    ctx.arc(360 * scale, -500 * scale, 340 * scale, 0, Math.PI * 2);
    ctx.fill();

    // Region F: Red Rock Canyons (East-Center)
    ctx.fillStyle = '#6e3020';
    ctx.beginPath();
    ctx.arc(550 * scale, -50 * scale, 240 * scale, 0, Math.PI * 2);
    ctx.fill();

    // Region G: Desert Golden Dunes (Southeast)
    ctx.fillStyle = '#9e6722';
    ctx.beginPath();
    ctx.arc(620 * scale, 480 * scale, 320 * scale, 0, Math.PI * 2);
    ctx.fill();

    // Region H: Industrial District (South-Central)
    ctx.fillStyle = '#2a2f38';
    ctx.beginPath();
    ctx.arc(80 * scale, 620 * scale, 220 * scale, 0, Math.PI * 2);
    ctx.fill();

    // Region I: Airport Runway Strip (Southwest)
    ctx.fillStyle = '#181c22';
    ctx.fillRect(-390 * scale, 420 * scale, 70 * scale, 450 * scale);

    // Region J: Deepwater Cargo Harbor (East Coast)
    ctx.fillStyle = '#28323e';
    ctx.fillRect(700 * scale, 0, 260 * scale, 240 * scale);

    // Region K: Remote Wilderness & Alpine Lake (Far North)
    ctx.fillStyle = '#1b3b22';
    ctx.beginPath();
    ctx.arc(-60 * scale, -780 * scale, 220 * scale, 0, Math.PI * 2);
    ctx.fill();
    // Alpine lake water
    ctx.fillStyle = '#124458';
    ctx.beginPath();
    ctx.arc(-60 * scale, -780 * scale, 55 * scale, 0, Math.PI * 2);
    ctx.fill();

    // Region L: Secured Military Facility (Northeast)
    ctx.fillStyle = '#363d34';
    ctx.strokeStyle = '#c93b3b';
    ctx.lineWidth = 2 * this.zoom;
    ctx.beginPath();
    ctx.rect(560 * scale, -750 * scale, 220 * scale, 220 * scale);
    ctx.fill();
    ctx.stroke();

    // Region C: Downtown Metropolis Grid (Center-West)
    ctx.fillStyle = '#15202c';
    ctx.fillRect(-180 * scale, -200 * scale, 360 * scale, 440 * scale);

    // 3. Draw Road Network
    ctx.strokeStyle = '#e6a12b';
    ctx.lineWidth = 4 * this.zoom;
    ctx.lineCap = 'round';

    this.roadNetwork.edges.forEach(edge => {
      const n1 = this.roadNetwork.nodes[edge[0]];
      const n2 = this.roadNetwork.nodes[edge[1]];
      if (n1 && n2) {
        ctx.beginPath();
        ctx.moveTo(n1.pos.x * scale, n1.pos.z * scale);
        ctx.lineTo(n2.pos.x * scale, n2.pos.z * scale);
        ctx.stroke();
      }
    });

    // 4. Draw GPS Route Path to Active Mission or Custom Waypoint
    const activeTarget = this.gameState.gpsWaypoint || this.gameState.activeMission?.targetLocation;
    if (activeTarget) {
      const path = this.roadNetwork.findShortestPath(
        new THREE.Vector3(this.gameState.player.position.x, 0, this.gameState.player.position.z),
        new THREE.Vector3(activeTarget.x, 0, activeTarget.z)
      );

      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 6 * this.zoom;
      ctx.setLineDash([8 * this.zoom, 4 * this.zoom]);
      ctx.beginPath();
      path.forEach((pt, idx) => {
        if (idx === 0) ctx.moveTo(pt.x * scale, pt.z * scale);
        else ctx.lineTo(pt.x * scale, pt.z * scale);
      });
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 5. Biome & District Text Labels
    ctx.textAlign = 'center';
    ctx.font = `bold ${Math.round(11 * this.zoom)}px Orbitron, sans-serif`;

    const labels = [
      { text: 'DOWNTOWN METROPOLIS', x: 0, z: 20, col: '#fff' },
      { text: 'TROPICAL PALM COAST', x: -620, z: 490, col: '#f0dfba' },
      { text: 'GREEN COUNTRYSIDE & FARMS', x: -480, z: -440, col: '#a3f099' },
      { text: 'SUMMIT PASS [75m ELEV]', x: 380, z: -550, col: '#cbd5e1' },
      { text: 'RED ROCK CANYONS', x: 550, z: -50, col: '#f59e8b' },
      { text: 'GOLDEN DUNES DESERT', x: 620, z: 480, col: '#ffd182' },
      { text: 'INDUSTRIAL FUEL DEPOT', x: 80, z: 620, col: '#94a3b8' },
      { text: 'AIRPORT [RUNWAY 09L/27R]', x: -360, z: 680, col: '#38bdf8' },
      { text: 'DEEPWATER CARGO PORT', x: 820, z: 120, col: '#38bdf8' },
      { text: 'REMOTE WILDERNESS', x: -60, z: -780, col: '#86efac' },
      { text: 'SECURED MILITARY FACILITY', x: 670, z: -640, col: '#f87171' }
    ];

    labels.forEach(lbl => {
      ctx.fillStyle = lbl.col;
      ctx.fillText(lbl.text, lbl.x * scale, lbl.z * scale);
    });

    // 6. Safehouse Garage Icon
    ctx.fillStyle = '#00e5ff';
    ctx.beginPath();
    ctx.arc(-36 * scale, 36 * scale, 9 * this.zoom, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${Math.round(10 * this.zoom)}px Inter, sans-serif`;
    ctx.fillText('Safehouse', -36 * scale, 54 * scale);

    // 7. Active Mission Objective Marker
    const mTarget = this.gameState.activeMission?.targetLocation;
    if (mTarget) {
      ctx.fillStyle = '#e6a12b';
      ctx.beginPath();
      ctx.arc(mTarget.x * scale, mTarget.z * scale, 11 * this.zoom, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2 * this.zoom;
      ctx.stroke();
      ctx.fillStyle = '#e6a12b';
      ctx.fillText(this.gameState.activeMission.name, mTarget.x * scale, (mTarget.z + 18) * scale);
    }

    // 8. Custom GPS Waypoint
    if (this.gameState.gpsWaypoint) {
      const gx = this.gameState.gpsWaypoint.x * scale;
      const gz = this.gameState.gpsWaypoint.z * scale;
      ctx.fillStyle = '#ff3344';
      ctx.beginPath();
      ctx.arc(gx, gz, 9 * this.zoom, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.fillText('GPS Destination', gx, gz + 16 * this.zoom);
    }

    // 9. Player (Marcus Vance) Blip & Direction Pointer
    const px = this.gameState.player.position.x * scale;
    const pz = this.gameState.player.position.z * scale;
    const rot = this.gameState.player.rotation || 0;

    ctx.save();
    ctx.translate(px, pz);
    ctx.rotate(rot);

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(0, -11 * this.zoom);
    ctx.lineTo(-7 * this.zoom, 8 * this.zoom);
    ctx.lineTo(0, 4 * this.zoom);
    ctx.lineTo(7 * this.zoom, 8 * this.zoom);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 2 * this.zoom;
    ctx.stroke();

    ctx.restore();

    ctx.restore();
  }
}
