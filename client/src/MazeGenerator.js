import Tile from './Tile';

const FACES = [0, 1, 2, 3, 4, 5];
export default function generateMaze(size, seed) {
  const tiles = initializeTiles(size);
  assignNeighbors(tiles, size);
  runPrim(tiles, seed);
  //printMaze(tiles, sizeX);
  return tiles;
}

function initializeTiles(size) {
  const tiles = [];

  //faces are the faces of a cube, representing the grids used to generate a cubic maze

  for (let face = 0; face < FACES.length; face++) {
    tiles[face] = [];
    //loop through each cell of the face

    for (let x = 0; x < size; x++) {
      tiles[face][x] = [];
      for (let y = 0; y < size; y++) {
        tiles[face][x][y] = new Tile(face, x, y);
      }
    }
  }
  return tiles;
}

/**
AI wrote this function for me, it's a tedious bit of code to take the grids for each cube face and assign the neighbors for each tile stitching the seams between the faces.
 */
function assignNeighbors(tiles, N) {
  const last = N - 1;
  const get = (face, x, y) => tiles[face][x][y];

  for (let face = 0; face < 6; face++) {
    for (let x = 0; x < N; x++) {
      for (let y = 0; y < N; y++) {
        const tile = get(face, x, y);

        let left = null,
          right = null,
          top = null,
          bottom = null;

        // INTERNAL NEIGHBORS (same face)
        if (x > 0) left = get(face, x - 1, y);
        if (x < last) right = get(face, x + 1, y);
        if (y > 0) top = get(face, x, y - 1);
        if (y < last) bottom = get(face, x, y + 1);

        // EDGE NEIGHBORS (across cube seams)
        // Each mapping is paired with its inverse for bidirectionality

        if (x === 0) {
          switch (face) {
            case 0:
              left = get(3, last, y);
              break; // Front.left → Left.right
            case 1:
              left = get(0, last, y);
              break; // Right.left → Front.right
            case 2:
              left = get(1, last, y);
              break; // Back.left → Right.right
            case 3:
              left = get(2, last, y);
              break; // Left.left → Back.right
            case 4:
              left = get(3, y, 0);
              break; // Top.left → Left.top
            case 5:
              left = get(3, last - y, last);
              break; // Bottom.left → Left.bottom
          }
        }

        if (x === last) {
          switch (face) {
            case 0:
              right = get(1, 0, y);
              break; // Front.right → Right.left
            case 1:
              right = get(2, 0, y);
              break; // Right.right → Back.left
            case 2:
              right = get(3, 0, y);
              break; // Back.right → Left.left
            case 3:
              right = get(0, 0, y);
              break; // Left.right → Front.left
            case 4:
              right = get(1, last - y, 0);
              break; // Top.right → Right.top
            case 5:
              right = get(1, y, last);
              break; // Bottom.right → Right.bottom
          }
        }

        if (y === 0) {
          switch (face) {
            case 0:
              top = get(4, x, last);
              break; // Front.top → Top.bottom
            case 1:
              top = get(4, last, last - x);
              break; // Right.top → Top.right
            case 2:
              top = get(4, last - x, 0);
              break; // Back.top → Top.top
            case 3:
              top = get(4, 0, x);
              break; // Left.top → Top.left
            case 4:
              top = get(2, last - x, 0);
              break; // Top.top → Back.top
            case 5:
              top = get(0, x, last);
              break; // Bottom.top → Front.bottom
          }
        }

        if (y === last) {
          switch (face) {
            case 0:
              bottom = get(5, x, 0);
              break; // Front.bottom → Bottom.top
            case 1:
              bottom = get(5, last, x);
              break; // Right.bottom → Bottom.right
            case 2:
              bottom = get(5, last - x, last);
              break; // Back.bottom → Bottom.bottom
            case 3:
              bottom = get(5, 0, last - x);
              break; // Left.bottom → Bottom.left
            case 4:
              bottom = get(0, x, 0);
              break; // Top.bottom → Front.top
            case 5:
              bottom = get(2, last - x, last);
              break; // Bottom.bottom → Back.bottom
          }
        }

        tile.setNeighbors({ left, right, top, bottom });
      }
    }
  }
  // Verify bidirectionality (CORRECT version)
  for (let face = 0; face < 6; face++) {
    for (let x = 0; x < N; x++) {
      for (let y = 0; y < N; y++) {
        const tile = tiles[face][x][y];
        for (const dir in tile._neighbors) {
          const neighbor = tile._neighbors[dir];
          if (neighbor) {
            const neighborHasTile = Object.values(neighbor._neighbors).includes(
              tile
            );
            if (!neighborHasTile) {
              console.error(
                `Non-mutual: Face ${face} [${x},${y}].${dir} → ` +
                  `Face ${neighbor._face} [${neighbor._x},${neighbor._y}] doesn't have original tile`
              );
            }
          }
        }
      }
    }
  }
}

function runPrim(tiles, seed) {
  const startTile = tiles[0][2][2];
  startTile.setVisited(true);
  const frontier = startTile.getNeighborsArray();
  //console.log('frontier:' + frontier);
  const randomGenerator = mulberry32(seed);

  //iterate through the whole tile list
  while (frontier.length > 0) {
    const randomTileIndex = Math.floor(randomGenerator() * frontier.length);
    const randomTile = frontier[randomTileIndex];
    const possibleConnections = [];
    randomTile.setVisited(true);
    randomTile.getNeighborsArray().forEach((neighbor) => {
      if (neighbor.getVisited() === true) {
        possibleConnections.push(neighbor);
      } else {
        if (!frontier.includes(neighbor)) {
          frontier.push(neighbor);
        }
      }
    });
    //pick one of the possible connections and connect from both sides
    const newPath =
      possibleConnections[
        Math.floor(randomGenerator() * possibleConnections.length)
      ];

    newPath.openTo(randomTile);
    randomTile.openTo(newPath);

    frontier.splice(randomTileIndex, 1);
  }
}

export function printMaze(tiles, N) {
  for (let face = 0; face < 6; face++) {
    console.log(`FACE ${face}`);

    const rows = [];

    for (let y = 0; y < N; y++) {
      let topLine = '';
      let midLine = '';

      for (let x = 0; x < N; x++) {
        const tile = tiles[face][x][y];
        const p = tile._passages;

        // Top wall
        topLine += '+';
        topLine += p.top ? '   ' : '---';

        // Mid row
        midLine += p.left ? ' ' : '|';
        midLine += '   ';
        // Right wall handled next column or after loop
      }

      // Close right border
      topLine += '+';
      midLine += '|';

      rows.push(topLine);
      rows.push(midLine);
    }

    // bottom wall
    let bottom = '';
    for (let x = 0; x < N; x++) {
      bottom += '+---';
    }
    bottom += '+';

    rows.push(bottom);

    // Print everything
    rows.forEach((line) => console.log(line));
    console.log('\n');
  }
}

// (AI) Helper function to produce random values from a seed for reproducibility
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
