import { useMemo, useState } from "react";
import { wallKey } from "../algorithms/Bfs.js";
import { getOpenNeighbourKeys } from "../engine/cityGenerator.js";
import { C, BUILDING_TYPES } from "../constants.js";

const CELL_SIZES = { easy: 44, medium: 34, hard: 28 };

export default function CityGrid({ gameState, selectedKey, onClickBuilding }) {
  const [hoveredKey, setHoveredKey] = useState(null);

  if (!gameState) return null;

  const { grid, rows, cols, walls, hospitalKey, patientZeroKey,
          activeTool, difficulty, phase } = gameState;

  const CELL = CELL_SIZES[difficulty] ?? 34;
  const W = cols * CELL;
  const H = rows * CELL;

  // Pre-compute sets for fast lookup
  const wallSet = walls;

  // Valid targets for wall placement (neighbours of selectedKey)
  const validWallTargets = useMemo(() => {
    if (activeTool !== "wall" || !selectedKey) return new Set();
    return new Set(getOpenNeighbourKeys(selectedKey, grid, wallSet, rows, cols));
  }, [activeTool, selectedKey, grid, wallSet, rows, cols]);

  // Collect all placed walls as line coords
  const wallLines = useMemo(() => {
    const lines = [];
    for (const wk of wallSet) {
      const [kA, kB] = wk.split("|");
      const bA = grid.get(kA);
      const bB = grid.get(kB);
      if (!bA || !bB) continue;
      const xA = bA.col * CELL, yA = bA.row * CELL;
      const xB = bB.col * CELL, yB = bB.row * CELL;

      let x1, y1, x2, y2;

      if (bA.row === bB.row) {
        // Horizontal neighbours — wall is a vertical line on the shared edge
        const edgeX = Math.max(xA, xB); // left edge of the right building
        x1 = edgeX; y1 = Math.min(yA, yB) + 2;
        x2 = edgeX; y2 = Math.min(yA, yB) + CELL - 2;
      } else {
        // Vertical neighbours — wall is a horizontal line on the shared edge
        const edgeY = Math.max(yA, yB); // top edge of the lower building
        x1 = Math.min(xA, xB) + 2; y1 = edgeY;
        x2 = Math.min(xA, xB) + CELL - 2; y2 = edgeY;
     }

     lines.push({ x1, y1, x2, y2, key: wk });
   }
   return lines;
  }, [wallSet, grid, CELL]);

  const canInteract = phase === "prep" || phase === "outbreak";

  function getBuildingFill(building, key) {
    if (building.isHospital) {
      return building.infected ? "#7f1d1d" : "#0c4a6e";
    }
    if (building.infected)  return "#450a0a";
    if (building.immune)    return "#0c1a4a";
    if (key === selectedKey) return "#1a3a1a";
    const typeDef = BUILDING_TYPES[building.type];
    return typeDef?.color ?? "#1a2332";
  }

  function getBuildingStroke(building, key) {
    if (key === selectedKey)              return C.accent;
    if (building.isHospital && !building.infected) return C.hospital;
    if (building.infected)               return C.danger;
    if (building.immune)                 return C.info;
    if (key === hoveredKey && canInteract) return C.textDim;
    if (validWallTargets.has(key))       return C.wall;
    return "#1e2d3d";
  }

  function getStrokeWidth(building, key) {
    if (key === selectedKey)        return 2;
    if (building.isHospital)        return 1.5;
    if (validWallTargets.has(key))  return 1.5;
    return 0.5;
  }

  function getCursor(key) {
    if (!canInteract) return "default";
    if (activeTool === "wall" && selectedKey && !validWallTargets.has(key) && key !== selectedKey) return "not-allowed";
    return "pointer";
  }

  return (
    <div style={{
      borderRadius: 10, overflow: "hidden",
      boxShadow: `0 0 0 1px ${C.panelBorder}, 0 0 40px rgba(0,0,0,0.5)`,
      display: "inline-block", position: "relative",
    }}>
      <svg
        width={W} height={H}
        style={{ display: "block", background: "#060c12" }}
      >
        {/* Buildings */}
        {Array.from(grid.entries()).map(([key, building]) => {
          const x = building.col * CELL;
          const y = building.row * CELL;
          const fill   = getBuildingFill(building, key);
          const stroke = getBuildingStroke(building, key);
          const sw     = getStrokeWidth(building, key);
          const isSelected = key === selectedKey;
          const isValidTarget = validWallTargets.has(key);
          const isHospital = building.isHospital;
          const isPatientZero = key === patientZeroKey && phase !== "prep";

          return (
            <g
              key={key}
              onClick={() => canInteract && onClickBuilding(key)}
              onMouseEnter={() => setHoveredKey(key)}
              onMouseLeave={() => setHoveredKey(null)}
              style={{ cursor: getCursor(key) }}
            >
              <rect
                x={x + 1} y={y + 1}
                width={CELL - 2} height={CELL - 2}
                rx={3}
                fill={fill}
                stroke={stroke}
                strokeWidth={sw}
              />

              {/* Infection pulse overlay */}
              {building.infected && !building.isHospital && (
                <rect
                  x={x + 1} y={y + 1}
                  width={CELL - 2} height={CELL - 2}
                  rx={3}
                  fill={C.danger}
                  opacity={0.15}
                />
              )}

              {/* Flared indicator */}
              {building.flared && (
                <circle
                  cx={x + CELL - 6} cy={y + 6}
                  r={3} fill={C.flare}
                />
              )}

              {/* Immune indicator */}
              {building.immune && (
                <rect
                  x={x + CELL * 0.3} y={y + CELL * 0.3}
                  width={CELL * 0.4} height={CELL * 0.4}
                  rx={2} fill={C.info} opacity={0.6}
                />
              )}

              {/* Hospital cross */}
              {isHospital && (
                <>
                  <rect x={x + CELL/2 - 1} y={y + CELL * 0.25}
                    width={2} height={CELL * 0.5}
                    fill={building.infected ? C.danger : C.hospital} />
                  <rect x={x + CELL * 0.25} y={y + CELL/2 - 1}
                    width={CELL * 0.5} height={2}
                    fill={building.infected ? C.danger : C.hospital} />
                </>
              )}

              {/* Patient zero biohazard dot */}
              {isPatientZero && (
                <circle
                  cx={x + CELL / 2} cy={y + CELL / 2}
                  r={CELL * 0.18}
                  fill={C.patientZero}
                  opacity={0.9}
                />
              )}

              {/* Wall target highlight */}
              {isValidTarget && (
                <rect
                  x={x + 1} y={y + 1}
                  width={CELL - 2} height={CELL - 2}
                  rx={3}
                  fill={C.wall}
                  opacity={0.12}
                />
              )}

              {/* Selected building highlight */}
              {isSelected && (
                <rect
                  x={x + 1} y={y + 1}
                  width={CELL - 2} height={CELL - 2}
                  rx={3}
                  fill="none"
                  stroke={C.accent}
                  strokeWidth={2}
                  strokeDasharray="4 2"
                />
              )}
            </g>
          );
        })}

        {/* Walls — drawn as thick lines ON THE EDGE between buildings */}
        {wallLines.map(({ x1, y1, x2, y2, key }) => (
        <g key={key}>
            {/* Glow */}
            <line x1={x1} y1={y1} x2={x2} y2={y2}
            stroke={C.wall} strokeWidth={8} opacity={0.2}
            strokeLinecap="round" />
            {/* Main wall */}
            <line x1={x1} y1={y1} x2={x2} y2={y2}
            stroke={C.wall} strokeWidth={3}
            strokeLinecap="round" />
        </g>
        ))} 

        {/* Phase overlay text */}
        {phase === "prep" && (
          <text
            x={W / 2} y={H - 10}
            textAnchor="middle"
            fontSize={10}
            fontFamily="'Share Tech Mono', monospace"
            letterSpacing={3}
            fill={C.accent}
            opacity={0.6}
          >
            PREP PHASE — PLACE DEFENCES
          </text>
        )}
      </svg>
    </div>
  );
}