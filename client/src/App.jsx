import { useState, useEffect } from "react";
import { C } from "./constants.js";
import { cellKey, bfsDistance } from "./algorithms/Bfs.js";
import { generateCity, getCityStats } from "./engine/cityGenerator.js";
import { createGameState, tick, placeWall } from "./engine/outbreakEngine.js";
import { calculateScore, getGrade, formatScore, getScoreBreakdown } from "./engine/scoring.js";

function runEngineSmokeTest() {
  const results = {};

  const city = generateCity("medium");
  results.city = {
    rows: city.rows, cols: city.cols,
    totalBuildings: city.grid.size,
    hospitalKey: city.hospitalKey,
    patientZeroKey: city.patientZeroKey,
    seed: city.seed,
    toolBudgets: city.toolBudgets,
  };

  let state = createGameState("easy", "TestPlayer");
  const prepTicks = state.prepSecsLeft;
  for (let i = 0; i < prepTicks; i++) state = tick(state);

  results.afterPrep = { phase: state.phase, waveCount: state.waveCount };

  const pz = state.grid.get(state.patientZeroKey);
  const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
  let wallPlaced = false;
  for (const [dr, dc] of dirs) {
    const nr = pz.row + dr, nc = pz.col + dc;
    if (nr >= 0 && nr < state.rows && nc >= 0 && nc < state.cols) {
      state = placeWall(state, state.patientZeroKey, cellKey(nr, nc));
      wallPlaced = true;
      break;
    }
  }

  for (let i = 0; i < 3; i++) state = tick(state);

  const stats = getCityStats(state.grid);
  results.after3Waves = { wallPlaced, wallCount: state.walls.size, waveCount: state.waveCount, infected: stats.infected, clean: stats.clean, pctClean: stats.pctClean };

  const score = calculateScore({ difficulty: "medium", pctClean: 75, toolsLeft: { wall:3, hazmat:1, flare:2 }, toolBudgets: { wall:8, hazmat:3, flare:5 }, wavesSurvived: 12, secsRemaining: 45 });
  const breakdown = getScoreBreakdown({ difficulty: "medium", pctClean: 75, toolsLeft: { wall:3, hazmat:1, flare:2 }, toolBudgets: { wall:8, hazmat:3, flare:5 }, wavesSurvived: 12, secsRemaining: 45 });
  const grade = getGrade(score, "medium");
  results.scoring = { score, formatted: formatScore(score), grade: grade.grade, gradeLabel: grade.label, multiplier: breakdown.multiplier, breakdown: breakdown.breakdown.map(b => `${b.label}: ${formatScore(b.value)}`) };

  const dist = bfsDistance(state.hospitalKey, state.grid, state.walls, state.rows, state.cols);
  results.bfsDistance = { wavesToHospital: dist };

  console.group("🧟 Engine Smoke Tests — Step 2");
  console.log("City Generator:", results.city);
  console.log("After Prep Phase:", results.afterPrep);
  console.log("After 3 Waves:", results.after3Waves);
  console.log("Scoring:", results.scoring);
  console.log("BFS Distance:", results.bfsDistance);
  console.groupEnd();

  return results;
}

export default function App() {
  const [results, setResults] = useState(null);
  useEffect(() => { setResults(runEngineSmokeTest()); }, []);

  return (
    <div style={S.page}>
      <GridBg />
      <div style={S.center}>
        <div style={{ textAlign:"center" }}>
          <div style={S.badge}>CDC CRISIS RESPONSE SYSTEM</div>
          <h1 style={S.title}>ZOMBIE<br/>OUTBREAK</h1>
          <div style={S.sub}>BFS CONTAINMENT PROTOCOL v2.0</div>
        </div>

        <div style={S.card}>
          <Row label="React + Vite"     s="online"  />
          <Row label="BFS algorithm"    s="online"  />
          <Row label="City generator"   s={results ? "online" : "loading"} />
          <Row label="Outbreak engine"  s={results ? "online" : "loading"} />
          <Row label="Scoring system"   s={results ? "online" : "loading"} />
          <Row label="UI components"    s="pending" step="step 3" />
          <Row label="FastAPI backend"  s="pending" step="step 4" />
          <Row label="Database + scale" s="pending" step="step 5" />
        </div>

        {results && <>
          <Sect title="CITY GENERATOR">
            <KV k="Grid"       v={`${results.city.rows} × ${results.city.cols} (${results.city.totalBuildings} buildings)`} />
            <KV k="Hospital"   v={results.city.hospitalKey} />
            <KV k="Patient 0"  v={results.city.patientZeroKey} />
            <KV k="Seed"       v={results.city.seed} />
            <KV k="Budgets"    v={`${results.city.toolBudgets.wall}w · ${results.city.toolBudgets.hazmat}h · ${results.city.toolBudgets.flare}f`} />
          </Sect>
          <Sect title="OUTBREAK ENGINE — 3 WAVES">
            <KV k="Phase after prep"  v={results.afterPrep.phase}      good={results.afterPrep.phase === "outbreak"} />
            <KV k="Wall placed"       v={String(results.after3Waves.wallPlaced)} good={results.after3Waves.wallPlaced} />
            <KV k="BFS waves fired"   v={results.after3Waves.waveCount} />
            <KV k="Infected"          v={results.after3Waves.infected} />
            <KV k="Clean buildings"   v={`${results.after3Waves.clean} (${results.after3Waves.pctClean}%)`} />
            <KV k="Waves to hospital" v={results.bfsDistance.wavesToHospital ?? "blocked"} />
          </Sect>
          <Sect title="SCORING ENGINE">
            <KV k="Score (75% clean, medium)" v={results.scoring.formatted} good />
            <KV k="Grade" v={`${results.scoring.grade} — ${results.scoring.gradeLabel}`} good />
            <KV k="Multiplier" v={`×${results.scoring.multiplier}`} />
            {results.scoring.breakdown.map((line, i) => <KV key={i} k="" v={line} />)}
          </Sect>
        </>}

        <div style={S.hint}>Open DevTools console for full structured output</div>
      </div>
    </div>
  );
}

function Row({ label, s, step }) {
  const c = { online: "#22c55e", loading: "#f59e0b", pending: "#475569" };
  const t = { online: "✓ ONLINE", loading: "⟳ LOADING", pending: step ? `— ${step.toUpperCase()}` : "— PENDING" };
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"7px 0", borderBottom:"1px solid #1a2332" }}>
      <span style={{ fontSize:14, fontWeight:500, color:"#e2e8f0" }}>{label}</span>
      <span style={{ fontSize:11, fontFamily:"'Share Tech Mono',monospace", letterSpacing:1, color:c[s] }}>{t[s]}</span>
    </div>
  );
}
function Sect({ title, children }) {
  return <div style={{ background:"#0d1117", border:"1px solid #1a2332", borderRadius:10, padding:"14px 18px" }}>
    <div style={{ fontSize:10, letterSpacing:4, color:"#22c55e", fontFamily:"'Share Tech Mono',monospace", marginBottom:10 }}>{title}</div>
    {children}
  </div>;
}
function KV({ k, v, good }) {
  return <div style={{ display:"flex", justifyContent:"space-between", padding:"4px 0", borderBottom:"1px solid #1a2332" }}>
    <span style={{ fontSize:12, color:"#64748b", minWidth:160 }}>{k}</span>
    <span style={{ fontSize:12, fontFamily:"'Share Tech Mono',monospace", color: good ? "#22c55e" : "#e2e8f0", textAlign:"right" }}>{String(v)}</span>
  </div>;
}
function GridBg() {
  return <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0, backgroundImage:`linear-gradient(rgba(34,197,94,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(34,197,94,0.03) 1px,transparent 1px)`, backgroundSize:"48px 48px" }} />;
}

const S = {
  page: { minHeight:"100vh", background:"#060a0f", color:"#e2e8f0", fontFamily:"'Rajdhani',sans-serif", display:"flex", flexDirection:"column", alignItems:"center", padding:"32px 16px", position:"relative" },
  center: { position:"relative", zIndex:1, width:"100%", maxWidth:480, display:"flex", flexDirection:"column", gap:20 },
  badge: { fontSize:10, letterSpacing:6, color:"#22c55e", marginBottom:10, fontFamily:"'Share Tech Mono',monospace" },
  title: { fontSize:"clamp(2.5rem,9vw,4.5rem)", fontWeight:700, lineHeight:0.9, letterSpacing:-2, color:"#e2e8f0", textShadow:"0 0 40px #ef444433", marginBottom:10 },
  sub: { fontSize:11, letterSpacing:4, color:"#475569", fontFamily:"'Share Tech Mono',monospace" },
  card: { background:"#0d1117", border:"1px solid #1a2332", borderRadius:12, padding:"16px 20px" },
  hint: { fontSize:11, color:"#334155", fontFamily:"'Share Tech Mono',monospace", letterSpacing:2, textAlign:"center", paddingBottom:24 },
};