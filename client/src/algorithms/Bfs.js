/**
 * bfs.js — core BFS algorithm for Zombie Outbreak
 *
 * The city is modelled as an undirected graph:
 *   nodes  = buildings  { id, row, col, type, ...}
 *   edges  = streets between adjacent buildings (up/down/left/right)
 *
 * A quarantine wall severs a specific edge so BFS cannot cross it.
 * A flare adds an extra delay to a node so it is skipped for N extra waves.
 * A hazmat clears a node (removes it from the infected set).
 *
 * The engine calls bfsStep() once per interval tick.
 * Each call spreads infection by exactly ONE wave from every currently
 * infected node — matching the classic BFS "level by level" expansion.
 */

// ─── GRAPH HELPERS ────────────────────────────────────────────────────────────

/**
 * Returns the four cardinal neighbour IDs of a node, filtering out
 * nodes that sit outside the grid boundaries.
 *
 * @param {number} id   - node id  (row * cols + col)
 * @param {number} rows
 * @param {number} cols
 * @returns {number[]}
 */
export function getNeighbourIds(id, rows, cols) {
  const row = Math.floor(id / cols);
  const col = id % cols;
  const neighbours = [];
  if (row > 0)        neighbours.push((row - 1) * cols + col); // up
  if (row < rows - 1) neighbours.push((row + 1) * cols + col); // down
  if (col > 0)        neighbours.push(row * cols + (col - 1)); // left
  if (col < cols - 1) neighbours.push(row * cols + (col + 1)); // right
  return neighbours;
}

/**
 * Builds the initial edge set for a fully-connected grid graph.
 * Each edge is stored as a sorted string "minId-maxId" so walls can
 * be looked up in O(1) using a Set.
 *
 * @param {number} rows
 * @param {number} cols
 * @returns {Set<string>}
 */
export function buildEdgeSet(rows, cols) {
  const edges = new Set();
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const id = r * cols + c;
      if (c < cols - 1) edges.add(edgeKey(id, id + 1));       // horizontal
      if (r < rows - 1) edges.add(edgeKey(id, id + cols));     // vertical
    }
  }
  return edges;
}

/** Canonical key for an edge between two node IDs. */
export function edgeKey(a, b) {
  return a < b ? `${a}-${b}` : `${b}-${a}`;
}

// ─── BFS STATE ────────────────────────────────────────────────────────────────

/**
 * Creates a fresh BFS state object for a new round.
 *
 * @param {number[]} patientZeroIds   - 1 or more starting infected nodes
 * @param {number}   rows
 * @param {number}   cols
 * @returns {object} bfsState
 */
export function createBfsState(patientZeroIds, rows, cols) {
  return {
    infected:    new Set(patientZeroIds),  // all infected node IDs
    frontier:    new Set(patientZeroIds),  // nodes that will spread THIS wave
    flaredelay:  new Map(),                // nodeId -> extra waves to skip
    walls:       buildEdgeSet(rows, cols), // active edges (wall = remove edge)
    waveCount:   0,
    rows,
    cols,
  };
}

// ─── CORE STEP ────────────────────────────────────────────────────────────────

/**
 * Advances the BFS by exactly one wave.
 * Mutates state in-place and returns the set of newly infected node IDs
 * so the UI can animate them.
 *
 * @param {object} state - BFS state from createBfsState()
 * @returns {{ newlyInfected: Set<number>, done: boolean }}
 */
export function bfsStep(state) {
  const { infected, frontier, flaredelay, walls, rows, cols } = state;
  const newlyInfected = new Set();
  const nextFrontier  = new Set();

  for (const nodeId of frontier) {
    const neighbours = getNeighbourIds(nodeId, rows, cols);

    for (const nbId of neighbours) {
      // Skip if already infected
      if (infected.has(nbId)) continue;

      // Skip if the street between them is walled off
      if (!walls.has(edgeKey(nodeId, nbId))) continue;

      // Skip if a flare is delaying this node (decrement delay)
      if (flaredelay.has(nbId)) {
        const remaining = flaredelay.get(nbId) - 1;
        if (remaining > 0) {
          flaredelay.set(nbId, remaining);
          continue;
        }
        flaredelay.delete(nbId);
      }

      newlyInfected.add(nbId);
    }
  }

  // Commit the new infections
  for (const id of newlyInfected) {
    infected.add(id);
    nextFrontier.add(id);
  }

  state.frontier  = nextFrontier;
  state.waveCount += 1;

  // BFS is "done" when there is nothing left to spread to
  const done = nextFrontier.size === 0;
  return { newlyInfected, done };
}

// ─── TOOL ACTIONS ─────────────────────────────────────────────────────────────

/**
 * Places a quarantine wall between two adjacent nodes.
 * Removes the edge from the active edge set so BFS will never cross it.
 *
 * @param {object} state
 * @param {number} nodeA
 * @param {number} nodeB
 */
export function placeWall(state, nodeA, nodeB) {
  state.walls.delete(edgeKey(nodeA, nodeB));
}

/**
 * Deploys a hazmat team to a node.
 * Removes the node from both infected and frontier sets.
 * The building is now immune for the rest of the round.
 *
 * @param {object} state
 * @param {number} nodeId
 */
export function deployHazmat(state, nodeId) {
  state.infected.delete(nodeId);
  state.frontier.delete(nodeId);
}

/**
 * Drops a flare on an uninfected node, adding extra BFS waves of delay.
 *
 * @param {object} state
 * @param {number} nodeId
 * @param {number} delayWaves  - how many extra waves to skip (default 3)
 */
export function dropFlare(state, nodeId, delayWaves = 3) {
  if (!state.infected.has(nodeId)) {
    state.flaredelay.set(nodeId, delayWaves);
  }
}

// ─── UTILITY ──────────────────────────────────────────────────────────────────

/**
 * Returns true if the given nodeId is infected.
 * @param {object} state
 * @param {number} nodeId
 */
export function isInfected(state, nodeId) {
  return state.infected.has(nodeId);
}

/**
 * Finds the shortest BFS path between two nodes ignoring walls/delays.
 * Used for the "chokepoint hint" feature in the UI.
 *
 * @param {number} startId
 * @param {number} endId
 * @param {number} rows
 * @param {number} cols
 * @returns {number[] | null}  array of node IDs from start to end, or null
 */
export function bfsShortestPath(startId, endId, rows, cols) {
  if (startId === endId) return [startId];
  const visited = new Set([startId]);
  const queue   = [{ id: startId, path: [startId] }];

  while (queue.length > 0) {
    const { id, path } = queue.shift();
    for (const nbId of getNeighbourIds(id, rows, cols)) {
      if (visited.has(nbId)) continue;
      const newPath = [...path, nbId];
      if (nbId === endId) return newPath;
      visited.add(nbId);
      queue.push({ id: nbId, path: newPath });
    }
  }
  return null; // no path (disconnected graph — shouldn't happen on a grid)
}