export default class Tile {
  _face;
  _x;
  _y;
  _neighbors = { left: null, right: null, top: null, bottom: null };
  _passages = { left: false, right: false, top: false, bottom: false };
  _visited = false;
  _position;

  constructor(face, x, y) {
    this._face = face;
    this._x = x;
    this._y = y;
  }

  setNeighbors(n) {
    this._neighbors.left = n.left;
    this._neighbors.right = n.right;
    this._neighbors.top = n.top;
    this._neighbors.bottom = n.bottom;
  }

  addNeighbor(direction, tile) {
    this._neighbors[direction] = tile;
  }

  setPassage(passage) {
    this._passages[passage] = true;
  }

  setPosition(position) {
    this._position = position;
  }
  getPosition() {
    return this._position;
  }

  getNeighbors() {
    return this._neighbors;
  }
  getNeighborsArray() {
    return Object.values(this._neighbors).filter((n) => n !== null);
  }
  getX() {
    return this._x;
  }
  getY() {
    return this._y;
  }
  getFace() {
    return this._face;
  }
  setVisited(value) {
    this._visited = value;
  }
  getVisited() {
    return this._visited;
  }

  openTo(neighborTile) {
    for (const dir in this._neighbors) {
      if (this._neighbors[dir] === neighborTile) {
        this._passages[dir] = true;
      }
    }
  }
}
