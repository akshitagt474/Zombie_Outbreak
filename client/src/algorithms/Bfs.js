import { ADJACENCY_DIRS } from "../constants.js";

export function cellKey(row, col) {
  return `${row},${col}`;
}

export function parseKey(key) {
  const [row, col] = key.split(",").map(Number);
  return { row, col };
}

export function wallKey(keyA, keyB) {
  return [keyA, keyB].sort().join("|");
}

export function hasWall(walls, keyA, keyB) {
  return walls.has(wallKey(keyA, keyB));
}

export function getNeighbours(row, col, rows, cols) {
  const neighbours = [];
  for (const { dr, dc } of ADJACENCY_DIRS) {
    const nr = row + dr;
    const nc = col + dc;
    if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
      neighbours.push(cellKey(nr, nc));
    }
  }
  return neighbours;
}

export function bfsTick(grid, walls, rows, cols, now = Date.now()) {
  const newlyInfected = [];
  let hospitalHit = false;

  const frontier = [];
  for (const [key, building] of grid.entries()) {
    if (building.infected && !building.immune) {
      const timeSinceInfection = now - (building.infectedAt ?? 0);
      if (timeSinceInfection >= building.spreadDelay) {
        frontier.push({ key, building });
      }
    }
  }

  const infectedThisTick = new Set();
  for (const { key, building } of frontier) {
    const { row, col } = building;
    const neighbours = getNeighbours(row, col, rows, cols);
    for (const neighbourKey of neighbours) {
      if (infectedThisTick.has(neighbourKey)) continue;
      const neighbour = grid.get(neighbourKey);
      if (!neighbour) continue;
      if (neighbour.infected) continue;
      if (neighbour.immune) continue;
      if (hasWall(walls, key, neighbourKey)) continue;
      infectedThisTick.add(neighbourKey);
      newlyInfected.push(neighbourKey);
      if (neighbour.isHospital) hospitalHit = true;
    }
  }

  let infectedCount = 0;
  for (const building of grid.values()) {
    if (building.infected) infectedCount++;
  }
  infectedCount += newlyInfected.length;

  return { newlyInfected, hospitalHit, infectedCount };
}

export function bfsReachability(sourceKey, grid, walls, rows, cols) {
  const visited = new Set([sourceKey]);
  const queue = [sourceKey];

  while (queue.length > 0) {
    const current = queue.shift();
    const { row, col } = parseKey(current);
    const neighbours = getNeighbours(row, col, rows, cols);
    for (const nKey of neighbours) {
      if (visited.has(nKey)) continue;
      const neighbour = grid.get(nKey);
      if (!neighbour) continue;
      if (neighbour.immune) continue;
      if (hasWall(walls, current, nKey)) continue;
      visited.add(nKey);
      queue.push(nKey);
    }
  }

  visited.delete(sourceKey);
  return visited;
}

export function isHospitalReachable(grid, walls, hospitalKey, rows, cols) {
  for (const [key, building] of grid.entries()) {
    if (!building.infected) continue;
    const reachable = bfsReachability(key, grid, walls, rows, cols);
    if (reachable.has(hospitalKey)) return true;
  }
  return false;
}

export function bfsDistance(targetKey, grid, walls, rows, cols) {
  const visited = new Map();
  const queue = [];

  for (const [key, building] of grid.entries()) {
    if (building.infected) {
      visited.set(key, 0);
      queue.push({ key, dist: 0 });
    }
  }

  while (queue.length > 0) {
    const { key, dist } = queue.shift();
    if (key === targetKey) return dist;
    const { row, col } = parseKey(key);
    const neighbours = getNeighbours(row, col, rows, cols);
    for (const nKey of neighbours) {
      if (visited.has(nKey)) continue;
      const neighbour = grid.get(nKey);
      if (!neighbour || neighbour.immune) continue;
      if (hasWall(walls, key, nKey)) continue;
      visited.set(nKey, dist + 1);
      queue.push({ key: nKey, dist: dist + 1 });
    }
  }

  return null;
}