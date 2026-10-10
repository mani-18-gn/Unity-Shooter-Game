// ROADBOUND - Civilian Pedestrian AI & Crowd Reaction Simulation
import * as THREE from 'three';

export class PedestrianAI {
  constructor(scene, terrain) {
    this.scene = scene;
    this.terrain = terrain;
    this.pedestrians = [];

    this.spawnPedestrianCrowd(12);
  }

  spawnPedestrianCrowd(count) {
    const skinMats = [
      new THREE.MeshStandardMaterial({ color: 0xd89b7b, roughness: 0.6 }),
      new THREE.MeshStandardMaterial({ color: 0xb5785a, roughness: 0.6 }),
      new THREE.MeshStandardMaterial({ color: 0xe0a68b, roughness: 0.6 })
    ];

    const clothColors = [0x223344, 0x442222, 0x224433, 0x333333, 0x554433, 0x112233];

    for (let i = 0; i < count; i++) {
      const group = new THREE.Group();

      const skin = skinMats[i % skinMats.length];
      const clothMat = new THREE.MeshStandardMaterial({
        color: clothColors[i % clothColors.length],
        roughness: 0.75
      });

      // Body mesh
      const torso = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.6, 0.22), clothMat);
      torso.position.y = 1.1;
      torso.castShadow = true;
      group.add(torso);

      // Head
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.22, 0.2), skin);
      head.position.y = 1.55;
      group.add(head);

      // Legs
      const legL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.7, 0.14), clothMat);
      legL.position.set(-0.1, 0.35, 0);
      const legR = legL.clone();
      legR.position.x = 0.1;
      group.add(legL);
      group.add(legR);

      // Place along downtown sidewalks (-16m or +16m off boulevard center)
      const side = (i % 2 === 0) ? -16 : 16;
      const zPos = -180 + i * 30;
      group.position.set(side, this.terrain.getGroundHeight(side, zPos) + 0.1, zPos);

      this.scene.add(group);

      this.pedestrians.push({
        root: group,
        legL: legL,
        legR: legR,
        dirZ: (Math.random() > 0.5 ? 1 : -1),
        speed: 1.4 + Math.random() * 0.5,
        state: 'walk', // 'walk', 'panic_run', 'dive'
        animTime: Math.random() * 10
      });
    }
  }

  update(delta, playerPos, playerSpeedMph = 0) {
    for (const p of this.pedestrians) {
      p.animTime += delta * (p.state === 'panic_run' ? 12 : 5);

      // Reaction check: If high-speed car is right beside pedestrian (< 6m)
      if (playerPos) {
        const dist = p.root.position.distanceTo(playerPos);
        if (dist < 8.0 && playerSpeedMph > 25) {
          p.state = 'panic_run';
          p.speed = 5.2; // Sprint away in panic!
        }
      }

      // Move along sidewalk
      p.root.position.z += p.dirZ * p.speed * delta;
      if (p.root.position.z > 220) p.dirZ = -1;
      if (p.root.position.z < -220) p.dirZ = 1;

      p.root.position.y = this.terrain.getGroundHeight(p.root.position.x, p.root.position.z) + 0.1;
      p.root.rotation.y = p.dirZ > 0 ? 0 : Math.PI;

      // Leg swing
      const swing = Math.sin(p.animTime) * 0.45;
      p.legL.rotation.x = swing;
      p.legR.rotation.x = -swing;
    }
  }
}
