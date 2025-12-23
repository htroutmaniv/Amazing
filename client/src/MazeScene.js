import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { HDRLoader } from 'three/examples/jsm/loaders/HDRLoader.js';
import { calculateFaceVertices, generateWalls } from './wallGeneration.js';

const FACES = 6;
const OPPOSITE = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' };

export function initThree(canvas, tiles, divisions, onWin) {
  const renderer = new THREE.WebGLRenderer({ canvas });
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    70,
    canvas.clientWidth / canvas.clientHeight,
    0.1,
    1000
  );

  initLights(scene);
  initEnvironment(scene);

  const diameter = 2;
  const radius = diameter / 2;
  generateCubeSphere(diameter, divisions, scene);

  // Generate walls using vertex-based approach
  const faceVertices = calculateFaceVertices(diameter, divisions);
  const options = {
    wallHeight: radius * 0.1,
    wallThickness: (radius / divisions) * 0.1,
  };
  generateWalls(faceVertices, tiles, radius, scene, options);
  findTileCenters(diameter, divisions, scene, tiles);
  let currentTile = tiles[0][0][0];
  let endTile = tiles[2][0][divisions - 1];
  generateEndPoint(endTile.getPosition(), (radius / divisions) * 0.5, scene);

  const player = makePlayer(
    currentTile.getPosition(),
    (radius / divisions) * 0.5
  );
  scene.add(player);

  // Track both axes: which tile direction corresponds to W and D
  let forwardDir = 'top'; // W moves in this direction
  let rightDir = 'right'; // D moves in this direction

  // Initialize camera
  updateCamera(player, camera, currentTile, forwardDir);

  const handleKeyDown = (event) => {
    const oldTile = currentTile;
    let moved = false;

    // Map WASD to current orientation
    const dirMap = {
      w: forwardDir,
      s: OPPOSITE[forwardDir],
      a: OPPOSITE[rightDir],
      d: rightDir,
    };

    const key = event.key.toLowerCase();
    if (!dirMap[key]) return;

    const moveDir = dirMap[key];
    if (currentTile._passages[moveDir]) {
      currentTile = currentTile._neighbors[moveDir];
      player.position.copy(currentTile.getPosition());
      moved = true;
    }

    if (moved) {
      // Update orientation based on spatial relationships
      // Forward: find which direction best matches old forward spatially
      const oldForwardVec = getDirVector(oldTile, forwardDir);
      const newForwardDir = oldForwardVec
        ? findClosestDir(currentTile, oldForwardVec)
        : forwardDir;

      // Right: must be perpendicular to forward, so only consider perpendicular candidates
      const perpendicularDirs = ['top', 'bottom', 'left', 'right'].filter(
        (d) => d !== newForwardDir && d !== OPPOSITE[newForwardDir]
      );
      const oldRightVec = getDirVector(oldTile, rightDir);
      const newRightDir = oldRightVec
        ? findClosestDir(currentTile, oldRightVec, perpendicularDirs)
        : perpendicularDirs.includes(rightDir)
        ? rightDir
        : perpendicularDirs[0];

      forwardDir = newForwardDir;
      rightDir = newRightDir;

      updateCamera(player, camera, currentTile, forwardDir);
      if (currentTile == endTile) {
        console.log('YOU WIN');
        onWin();
      }
    }
  };

  addEventListener('keydown', handleKeyDown);

  let frameId;

  function animate() {
    frameId = requestAnimationFrame(animate);
    renderer.render(scene, camera);
  }
  animate();

  const dispose = () => {
    removeEventListener('keydown', handleKeyDown);
    if (frameId) cancelAnimationFrame(frameId);
  };
  return { dispose };
}

function updateCamera(
  player,
  camera,
  currentTile,
  forwardDir,
  cameraHeight = 1.5
) {
  // Position camera above player along outward normal
  const outward = player.position.clone().normalize();
  camera.position.copy(player.position).addScaledVector(outward, cameraHeight);

  // Camera up = direction W will take us (forwardDir)
  const upNeighbor = currentTile._neighbors[forwardDir];
  if (upNeighbor) {
    const rawUp = new THREE.Vector3().subVectors(
      upNeighbor.getPosition(),
      currentTile.getPosition()
    );

    // Project onto tangent plane for precision
    const dot = rawUp.dot(outward);
    rawUp.addScaledVector(outward, -dot).normalize();

    camera.up.copy(rawUp);
  }

  // Look down at player
  camera.lookAt(player.position);
}

function initLights(scene) {
  const ambientLight = new THREE.AmbientLight(0xffffff, 1);
  scene.add(ambientLight);
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
  directionalLight.position.set(0, 0, 5);
  directionalLight.lookAt(0, 0, 0);
  const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.5);
  directionalLight2.position.set(0, 0, -5);
  directionalLight2.lookAt(0, 0, 0);
  scene.add(directionalLight);
  scene.add(directionalLight2);
}

function initEnvironment(scene) {
  const hdrLoader = new HDRLoader();
  hdrLoader.load('src/moon_lab_1k.hdr', (texture) => {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    scene.environment = texture;
    //scene.background = texture;
  });
}

async function generateCubeSphere(size, divisions, scene) {
  //create a box of specified size and divisions (this will be our maze fidelity)
  const geo = new THREE.BoxGeometry(
    size,
    size,
    size,
    divisions,
    divisions,
    divisions
  );

  //get the box's vertex positions
  const vertPos = geo.attributes.position;
  const tempPos = new THREE.Vector3();
  //iterate through verts setting the box verts to their corresponding sphere positions
  //we're basically pushing them out along their normal to the desired radius
  for (let i = 0; i < vertPos.count; i++) {
    tempPos.fromBufferAttribute(vertPos, i);

    tempPos.normalize().multiplyScalar(size / 2);
    vertPos.setXYZ(i, tempPos.x, tempPos.y, tempPos.z);
  }

  //update the geometry and it's vertex normals
  vertPos.needsUpdate = true;
  geo.computeVertexNormals();

  const textureLoader = new THREE.TextureLoader();

  const wrap = 12;
  const albedo = await textureLoader.loadAsync(
    '/textures/floor/floor_albedo.png'
  );

  const ao = await textureLoader.loadAsync('/textures/floor/floor_ao.png');

  const normal = await textureLoader.loadAsync(
    '/textures/floor/floor_normal.png'
  );

  const rough = await textureLoader.loadAsync(
    '/textures/floor/floor_roughness.png'
  );

  const material = new THREE.MeshStandardMaterial({
    map: albedo,
    normalMap: normal,
    roughnessMap: rough,
    aoMap: ao,
    wireframe: false,
  });

  albedo.wrapS = THREE.RepeatWrapping;
  albedo.wrapT = THREE.RepeatWrapping;
  albedo.repeat.set(wrap, wrap);
  albedo.needsUpdate = true;

  rough.wrapS = THREE.RepeatWrapping;
  rough.wrapT = THREE.RepeatWrapping;
  rough.repeat.set(wrap, wrap);
  rough.needsUpdate = true;

  normal.wrapS = THREE.RepeatWrapping;
  normal.wrapT = THREE.RepeatWrapping;
  normal.repeat.set(wrap, wrap);
  normal.needsUpdate = true;

  ao.wrapS = THREE.RepeatWrapping;
  ao.wrapT = THREE.RepeatWrapping;
  ao.repeat.set(wrap, wrap);
  ao.needsUpdate = true;

  const sphere = new THREE.Mesh(geo, material);
  scene.add(sphere);
  return sphere;
}

function findTileCenters(size, divisions, scene, tiles) {
  const subDist = size / divisions;
  const centers = [];

  //populate the cube face centers for a single face of the cube
  for (let x = 0; x < divisions; x++) {
    centers[x] = [];
    for (let y = 0; y < divisions; y++) {
      const center = new THREE.Vector3(
        subDist + x * subDist,
        0,
        subDist + y * subDist
      );
      centers[x][y] = center;
    }
  }

  //resposition centers so they are centered around origin
  for (let x = 0; x < divisions; x++) {
    for (let y = 0; y < divisions; y++) {
      centers[x][y].x -= size / 2 + subDist / 2;
      centers[x][y].z -= size / 2 + subDist / 2;
      // const box = makeBox(centers[x][y], 0.1);
      // scene.add(box);
    }
  }
  const allCenters = translateFaceCenters(
    centers,
    size,
    divisions,
    scene,
    tiles
  );
  return allCenters;
}

function translateFaceCenters(centers, size, divisions, scene, tiles) {
  const half = size / 2;
  const subDist = size / divisions;
  const allCenters = [];

  for (let face = 0; face < FACES; face++) {
    allCenters[face] = [];
    for (let x = 0; x < divisions; x++) {
      allCenters[face][x] = [];
      for (let y = 0; y < divisions; y++) {
        //I let the AI handle this switch case because the math is tricky and error prone, basically mapping our centers to the cube map by rotation&translation
        // Center is at (x + 0.5, y + 0.5) in tile coordinates
        // Use same coordinate system as calculateFaceVertices in wallGeneration.js
        let v;

        switch (face) {
          case 0: // Front (+Z)
            // Vertices: (i * subDist - half, half - j * subDist, half)
            v = new THREE.Vector3(
              (x + 0.5) * subDist - half,
              half - (y + 0.5) * subDist,
              half
            );
            break;
          case 1: // Right (+X)
            // Vertices: (half, half - j * subDist, half - i * subDist)
            v = new THREE.Vector3(
              half,
              half - (y + 0.5) * subDist,
              half - (x + 0.5) * subDist
            );
            break;
          case 2: // Back (-Z)
            // Vertices: (half - i * subDist, half - j * subDist, -half)
            v = new THREE.Vector3(
              half - (x + 0.5) * subDist,
              half - (y + 0.5) * subDist,
              -half
            );
            break;
          case 3: // Left (-X)
            // Vertices: (-half, half - j * subDist, i * subDist - half)
            v = new THREE.Vector3(
              -half,
              half - (y + 0.5) * subDist,
              (x + 0.5) * subDist - half
            );
            break;
          case 4: // Top (+Y)
            // Vertices: (i * subDist - half, half, j * subDist - half)
            v = new THREE.Vector3(
              (x + 0.5) * subDist - half,
              half,
              (y + 0.5) * subDist - half
            );
            break;
          case 5: // Bottom (-Y)
            // Vertices: (i * subDist - half, -half, half - j * subDist)
            v = new THREE.Vector3(
              (x + 0.5) * subDist - half,
              -half,
              half - (y + 0.5) * subDist
            );
            break;
        }

        // Spherize: push center out to sphere surface
        v.normalize().multiplyScalar(half);
        allCenters[face][x][y] = v;
        tiles[face][x][y].setPosition(v);
        // Debug visualization
        // const box = makeBox(v, 0.01);
        // scene.add(box);
      }
    }
  }
}

function makeBox(center, size) {
  const geo = new THREE.BoxGeometry(size, size, size);
  const box = new THREE.Mesh(
    geo,
    new THREE.MeshBasicMaterial({ color: 0x00ff00 })
  );
  box.position.copy(center);
  return box;
}

function makePlayer(position, size) {
  const geo = new THREE.SphereGeometry(size);
  const player = new THREE.Mesh(
    geo,
    new THREE.MeshStandardMaterial({
      color: 0x707070,
      roughness: 0.2,
      metalness: 1.0,
      wireframe: false,
    })
  );
  player.position.copy(position);
  return player;
}

function generateEndPoint(position, size, scene) {
  const geo = new THREE.SphereGeometry(size);
  const endPoint = new THREE.Mesh(
    geo,
    new THREE.MeshStandardMaterial({
      color: 0xff0000,
      roughness: 1.0,
      metalness: 0.0,
    })
  );
  endPoint.position.copy(position);
  scene.add(endPoint);
}

// AI-Get spatial direction vector from tile toward its neighbor
function getDirVector(tile, dir) {
  const neighbor = tile._neighbors[dir];
  if (!neighbor || !neighbor.getPosition()) return null;
  return new THREE.Vector3()
    .subVectors(neighbor.getPosition(), tile.getPosition())
    .normalize();
}

// AI-Find which direction on tile most closely matches the target vector
// Optionally restrict to specific candidate directions
function findClosestDir(
  tile,
  targetVec,
  candidates = ['top', 'bottom', 'left', 'right']
) {
  let bestDir = null;
  let bestDot = -Infinity;
  for (const dir of candidates) {
    const vec = getDirVector(tile, dir);
    if (vec) {
      const dot = vec.dot(targetVec);
      if (dot > bestDot) {
        bestDot = dot;
        bestDir = dir;
      }
    }
  }
  return bestDir;
}
