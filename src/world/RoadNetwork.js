// ROADBOUND - Trans-Island Road Network, Traffic Splines & GPS Pathfinding
import * as THREE from 'three';

export class RoadNetwork {
  constructor() {
    this.nodes = [
      // Downtown Grid Loop (Nodes 0..7)
      { id: 0, pos: new THREE.Vector3(0, 0.2, -240), label: 'Downtown North Avenue' },
      { id: 1, pos: new THREE.Vector3(0, 0.2, -120), label: 'Financial District Plaza' },
      { id: 2, pos: new THREE.Vector3(0, 0.2, 0), label: 'Downtown Grand Central' },
      { id: 3, pos: new THREE.Vector3(0, 0.2, 120), label: 'Commercial Crossway' },
      { id: 4, pos: new THREE.Vector3(0, 0.2, 240), label: 'Downtown South Interchange' },
      { id: 5, pos: new THREE.Vector3(-240, 0.2, 0), label: 'West Crosstown Avenue' },
      { id: 6, pos: new THREE.Vector3(240, 0.2, 0), label: 'East Crosstown Avenue' },
      { id: 7, pos: new THREE.Vector3(-36, 0.2, 36), label: 'Player Safehouse & Garage' },

      // Region A: Tropical Coast & Resort Beaches (Nodes 8..12)
      { id: 8, pos: new THREE.Vector3(-280, 0.2, 200), label: 'Coast Highway Incline' },
      { id: 9, pos: new THREE.Vector3(-450, 0.2, 340), label: 'Ocean Boulevard Curve' },
      { id: 10, pos: new THREE.Vector3(-620, 0.2, 480), label: 'White Sand Beach Promenade' },
      { id: 11, pos: new THREE.Vector3(-720, 0.2, 560), label: 'Resort Pier & Marina' },
      { id: 12, pos: new THREE.Vector3(-550, 0.2, 620), label: 'South Coast Causeway' },

      // Region B: Green Countryside & Farmland (Nodes 13..16)
      { id: 13, pos: new THREE.Vector3(-250, 0.2, -260), label: 'Rural Farmland Entrance' },
      { id: 14, pos: new THREE.Vector3(-420, 0.2, -380), label: 'Red Barn Pastures' },
      { id: 15, pos: new THREE.Vector3(-580, 0.2, -520), label: 'Windmill Ridge Dirt Track' },
      { id: 16, pos: new THREE.Vector3(-350, 0.2, -650), label: 'North Valley Farmsteads' },

      // Region E: Mountain Summit & Hairpin Pass (Nodes 17..20)
      { id: 17, pos: new THREE.Vector3(180, 12, -220), label: 'Mountain Base Ascent' },
      { id: 18, pos: new THREE.Vector3(280, 26, -350), label: 'Serpentine Switchback 1' },
      { id: 19, pos: new THREE.Vector3(380, 52, -480), label: 'Granite Tunnel & Cliffs' },
      { id: 20, pos: new THREE.Vector3(450, 72, -580), label: 'Summit Communication Tower' },

      // Region F & G: Desert Dunes & Oilfields (Nodes 21..25)
      { id: 21, pos: new THREE.Vector3(380, 0.2, 120), label: 'Red Rock Canyon Pass' },
      { id: 22, pos: new THREE.Vector3(520, 0.2, 240), label: 'Desert Gateway Highway' },
      { id: 23, pos: new THREE.Vector3(650, 0.2, 380), label: 'Oil Derrick Pumpjack Field' },
      { id: 24, pos: new THREE.Vector3(780, 0.2, 520), label: 'Golden Dunes South Highway' },
      { id: 25, pos: new THREE.Vector3(620, 0.2, 650), label: 'Southern Desert Basin' },

      // Region H: Industrial District (Nodes 26..28)
      { id: 26, pos: new THREE.Vector3(-50, 0.2, 480), label: 'Industrial Freight Corridor' },
      { id: 27, pos: new THREE.Vector3(80, 0.2, 620), label: 'Fuel Depot & Refinery' },
      { id: 28, pos: new THREE.Vector3(220, 0.2, 680), label: 'Manufacturing Logistics Yard' },

      // Region I: Airport (Nodes 29..32)
      { id: 29, pos: new THREE.Vector3(-220, 0.2, 550), label: 'Airport Passenger Terminal' },
      { id: 30, pos: new THREE.Vector3(-360, 0.2, 480), label: 'Runway 09L Threshold' },
      { id: 31, pos: new THREE.Vector3(-360, 0.2, 680), label: 'Runway Touchdown Zone' },
      { id: 32, pos: new THREE.Vector3(-360, 0.2, 880), label: 'Runway 27R Departure' },

      // Region J: Deepwater Port & Harbor (Nodes 33..35)
      { id: 33, pos: new THREE.Vector3(650, 0.8, -50), label: 'Harbor Gate & Checkpoint' },
      { id: 34, pos: new THREE.Vector3(780, 0.8, 100), label: 'Container Crane Berth 02' },
      { id: 35, pos: new THREE.Vector3(920, 0.8, 150), label: 'Deepwater Cargo Ship Berth' },

      // Region K & L: Wilderness & Military Facility (Nodes 36..39)
      { id: 36, pos: new THREE.Vector3(-80, 4, -750), label: 'Alpine Wilderness Lake' },
      { id: 37, pos: new THREE.Vector3(120, 18, -780), label: 'Remote Forest Logging Trail' },
      { id: 38, pos: new THREE.Vector3(550, 6, -650), label: 'Military Checkpoint Alpha' },
      { id: 39, pos: new THREE.Vector3(680, 6, -620), label: 'Fortified Bunker & Radome' }
    ];

    // Interconnecting directional/bi-directional road network edges
    this.edges = [
      // Downtown Corridor
      [0, 1], [1, 0], [1, 2], [2, 1], [2, 3], [3, 2], [3, 4], [4, 3],
      [5, 2], [2, 5], [2, 6], [6, 2],
      [2, 7], [7, 2], // Safehouse link

      // Tropical Coast link
      [4, 8], [8, 4], [8, 9], [9, 8], [9, 10], [10, 9], [10, 11], [11, 10], [10, 12], [12, 10],

      // Countryside link
      [0, 13], [13, 0], [13, 14], [14, 13], [14, 15], [15, 14], [14, 16], [16, 14],

      // Mountain Pass link
      [6, 17], [17, 6], [17, 18], [18, 17], [18, 19], [19, 18], [19, 20], [20, 19],

      // Desert link
      [6, 21], [21, 6], [21, 22], [22, 21], [22, 23], [23, 22], [23, 24], [24, 23], [24, 25], [25, 24],

      // Industrial link
      [4, 26], [26, 4], [26, 27], [27, 26], [27, 28], [28, 27], [28, 25], [25, 28],

      // Airport link
      [8, 29], [29, 8], [26, 29], [29, 26], [29, 30], [30, 29], [30, 31], [31, 30], [31, 32], [32, 31],

      // Harbor link
      [6, 33], [33, 6], [33, 34], [34, 33], [34, 35], [35, 34], [34, 22], [22, 34],

      // Wilderness & Military links
      [16, 36], [36, 16], [36, 37], [37, 36], [37, 19], [19, 37],
      [20, 38], [38, 20], [38, 39], [39, 38]
    ];
  }

  getNearestNode(pos) {
    if (!pos) return this.nodes[0];
    const px = pos.x ?? 0;
    const py = pos.y ?? 0;
    const pz = pos.z ?? 0;
    let bestDist = Infinity;
    let bestNode = this.nodes[0];
    for (const node of this.nodes) {
      const dx = px - node.pos.x;
      const dy = py - node.pos.y;
      const dz = pz - node.pos.z;
      const d = Math.hypot(dx, dy, dz);
      if (d < bestDist) {
        bestDist = d;
        bestNode = node;
      }
    }
    return bestNode;
  }

  findShortestPath(startPos, endPos) {
    if (!startPos || !endPos) return [];

    const startVec = startPos instanceof THREE.Vector3
      ? startPos.clone()
      : new THREE.Vector3(startPos.x || 0, startPos.y || 0, startPos.z || 0);

    const endVec = endPos instanceof THREE.Vector3
      ? endPos.clone()
      : new THREE.Vector3(endPos.x || 0, endPos.y || 0, endPos.z || 0);

    const startNode = this.getNearestNode(startVec);
    const endNode = this.getNearestNode(endVec);

    if (startNode.id === endNode.id) {
      return [startVec, endVec];
    }

    const distances = {};
    const previous = {};
    const unvisited = new Set();

    for (const node of this.nodes) {
      distances[node.id] = Infinity;
      previous[node.id] = null;
      unvisited.add(node.id);
    }
    distances[startNode.id] = 0;

    while (unvisited.size > 0) {
      let currentId = null;
      let smallestDist = Infinity;
      for (const id of unvisited) {
        if (distances[id] < smallestDist) {
          smallestDist = distances[id];
          currentId = id;
        }
      }

      if (currentId === null || currentId === endNode.id || smallestDist === Infinity) {
        break;
      }

      unvisited.delete(currentId);

      const neighbors = this.edges
        .filter(edge => edge[0] === currentId)
        .map(edge => edge[1]);

      for (const neighborId of neighbors) {
        if (!unvisited.has(neighborId)) continue;
        const curPos = this.nodes[currentId].pos;
        const neighPos = this.nodes[neighborId].pos;
        const alt = distances[currentId] + curPos.distanceTo(neighPos);

        if (alt < distances[neighborId]) {
          distances[neighborId] = alt;
          previous[neighborId] = currentId;
        }
      }
    }

    const path = [];
    let curr = endNode.id;
    while (curr !== null) {
      path.unshift(this.nodes[curr].pos.clone());
      curr = previous[curr];
    }

    path.unshift(startVec);
    path.push(endVec);
    return path;
  }

  getRandomWaypoint() {
    const idx = Math.floor(Math.random() * this.nodes.length);
    return this.nodes[idx].pos.clone();
  }
}
