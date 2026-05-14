import { useState, useEffect, useRef, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

// ── Question Generation ────────────────────────────────────────────────────────
function getTodayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function getRecentKeys(n = 7) {
  const keys = [];
  for (let i = 0; i < n; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    keys.push(`${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`);
  }
  return keys;
}

function loadCachedQuestions() {
  try {
    const raw = localStorage.getItem(`popgeo_questions_${getTodayKey()}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.length === 5) return parsed;
    return null;
  } catch { return null; }
}

function saveCachedQuestions(qs) {
  try {
    localStorage.setItem(`popgeo_questions_${getTodayKey()}`, JSON.stringify(qs));
    // Clean up old caches (keep last 3 days)
    getRecentKeys(14).slice(3).forEach(k => {
      try { localStorage.removeItem(`popgeo_questions_${k}`); } catch {}
    });
  } catch {}
}

function getRecentTitles() {
  // Collect titles used in the past 7 days to avoid repeats
  const titles = [];
  getRecentKeys(7).slice(1).forEach(k => {
    try {
      const raw = localStorage.getItem(`popgeo_questions_${k}`);
      if (raw) {
        const qs = JSON.parse(raw);
        qs.forEach(q => { if (q.title) titles.push(q.title); });
      }
    } catch {}
  });
  return titles;
}

async function generateDailyQuestions() {
  const cached = loadCachedQuestions();
  if (cached) return cached;

  const recentTitles = getRecentTitles();
  const todayKey = getTodayKey();
  const avoidList = recentTitles.length > 0
    ? `\n\nDO NOT use any of these titles/subjects from recent days: ${recentTitles.join(", ")}.`
    : "";

  const systemPrompt = `You generate geography quiz questions for a game called PopGeo. Players see a clue and must pin the correct location on a globe.

STRICT RULES — violating any rule makes the question unusable:

1. NEVER include the city, state, country, or region name anywhere in the clue. If the answer is "Fargo, North Dakota", the clue cannot say "Fargo" or "North Dakota" or "Midwest" or even "upper Midwest". The clue must work WITHOUT any geographic hints.

2. NEVER write a clue where the answer is obvious from the title alone. "Fargo takes place in Fargo" is a disqualifying clue. The player must know something beyond just the title.

3. Clues must require REAL knowledge — a specific plot detail, a filming fact, an actor's biography detail, a book's setting. Vague clues like "this film is set in a cold city" are not acceptable.

4. Do NOT mention the state or country in actor birthplace clues. Say "this Welsh actor" or "born in a small town on the Gower Peninsula" — never "born in Wales" when Wales IS the answer.

5. Prefer specific, evocative details over generic ones. "Shot in the sandstone valleys where T.E. Lawrence's actual campaigns took place" beats "filmed in a desert country."

6. Vary difficulty: 2 questions should be genuinely hard (deep cuts, B-list films, non-US locations), 2 moderate, 1 easier.

You return ONLY valid JSON, no markdown, no explanation.`;

  const userPrompt = `Generate exactly 5 PopGeo questions for today (${todayKey}). Use these types in this order:
1. filmed — where was it physically filmed (specific location, not just a country if avoidable)
2. set — where is it set (story location)
3. actor — where was a notable actor/director born or raised
4. filmed — different genre from #1
5. set — different genre from #2

Categories to draw from: movies, prestige TV, books/literature, historical events, music.
Mix US and international locations. At least 2 non-US answers.${avoidList}

Return a JSON array of 5 objects. Each object must have:
- type: "filmed" | "set" | "actor"
- emoji: appropriate emoji
- title: the film/show/book/person name (used internally to track repeats, not shown to player)
- clue: the question text shown to player — NO geographic terms per the rules above
- answer: the display answer shown after guessing (e.g. "Wadi Rum, Jordan")
- blurb: 1-2 fascinating sentences of context shown after the answer reveal
- lat: latitude of the answer location (number)
- lng: longitude of the answer location (number)

Example of a GOOD clue: "This Coen Brothers crime thriller opens with a car deal gone wrong in a snowbound city — the film's title is also the name of that city, but almost none of it was shot there."
Example of a BAD clue: "Fargo takes place in this frozen upper Midwest city" — BAD because it says "Midwest" and the answer is obvious from the title.

Another GOOD example (actor): "This Oscar-winning actress grew up on a farm outside a major South African city before moving to New York at 16 to model."
Another BAD example: "Charlize Theron grew up near this South African city" — BAD because "South African" gives away the continent.`;

  const response = await fetch("/api/questions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  if (!response.ok) throw new Error(`API error ${response.status}`);
  const data = await response.json();
  const text = data.content?.find(b => b.type === "text")?.text || "";
  const clean = text.replace(/```json|```/g, "").trim();
  const questions = JSON.parse(clean);

  if (!Array.isArray(questions) || questions.length !== 5) {
    throw new Error("Invalid question format from API");
  }

  // Add sequential IDs
  const withIds = questions.map((q, i) => ({ ...q, id: i + 1 }));
  saveCachedQuestions(withIds);
  return withIds;
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const KM_TO_MI = 0.621371;
function formatDist(km, unit) {
  return unit === "mi"
    ? `${Math.round(km * KM_TO_MI).toLocaleString()} mi`
    : `${Math.round(km).toLocaleString()} km`;
}
function loadUnit() { try { return localStorage.getItem("popgeo_unit") || "mi"; } catch { return "mi"; } }
function saveUnit(u) { try { localStorage.setItem("popgeo_unit", u); } catch {} }

function calcScore(d) {
  if (d < 50) return 1000;
  return Math.max(0, Math.round(1000 * Math.exp(-d / 2000)));
}

const FEEDBACK_TIERS = [
  { max: 50,       color: "#22c55e", labels: ["Perfect! 🎯", "Bullseye! 🎯", "Nailed it! 🎯", "Right on the money! 💰"] },
  { max: 200,      color: "#22c55e", labels: ["Outstanding! 🔥", "Excellent! 🔥", "So close! 🔥", "Almost exact! 💪"] },
  { max: 500,      color: "#84cc16", labels: ["Great! 👏", "Nice one! 👏", "Solid guess! 👌", "Pretty close! 👌"] },
  { max: 1000,     color: "#f59e0b", labels: ["Not bad!", "Could be worse!", "Room to improve 🤔", "Getting warmer 🌡️"] },
  { max: 2500,     color: "#f97316", labels: ["Way off 😬", "Oof, not close 😬", "That's a stretch 😅", "Yikes 😬", "Swing and a miss 😅"] },
  { max: Infinity, color: "#ef4444", labels: ["Ouch! 🌍", "Wrong side of the planet 🌍", "Did you guess blindfolded? 😂", "Ambitious guess 💀", "That's rough buddy 😬"] },
];
function getFeedback(km) {
  const mi = km * KM_TO_MI;
  const tier = FEEDBACK_TIERS.find(t => mi < t.max);
  return { label: tier.labels[Math.floor(Math.random() * tier.labels.length)], color: tier.color };
}
function scoreColor(s) {
  if (s >= 800) return "#22c55e";
  if (s >= 500) return "#84cc16";
  if (s >= 200) return "#f59e0b";
  return "#ef4444";
}
function scoreEmoji(s) {
  if (s >= 900) return "🟢";
  if (s >= 600) return "🟡";
  if (s >= 200) return "🟠";
  return "🔴";
}

const TYPE_META = {
  filmed: { label: "Where was it filmed?", color: "#93c5fd", bg: "rgba(29,78,216,0.25)", border: "rgba(59,130,246,0.5)" },
  set:    { label: "Where is it set?",     color: "#d8b4fe", bg: "rgba(124,58,237,0.25)", border: "rgba(167,139,250,0.5)" },
  actor:  { label: "Where are they from?", color: "#fcd34d", bg: "rgba(217,119,6,0.25)",  border: "rgba(251,191,36,0.5)" },
};

function buildShareText(questions, scores) {
  const d = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const total = scores.reduce((a, b) => a + b, 0);
  return `🎬 PopGeo — ${d}\n${scores.map(scoreEmoji).join("  ")}\n${total.toLocaleString()} / 5,000\npopgeo.app`;
}

async function shareResult(text, setShareText, setCopied) {
  if (navigator.share) {
    try { await navigator.share({ text }); return; }
    catch (e) { if (e.name === "AbortError") return; }
  }
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
      return;
    } catch (e) {}
  }
  setShareText(text);
}

function loadStreak() {
  try { return JSON.parse(localStorage.getItem("popgeo_streak") || "{}") || { count: 0, last: "" }; }
  catch { return { count: 0, last: "" }; }
}
function updateStreak() {
  const today = getTodayKey(), streak = loadStreak();
  if (streak.last === today) return streak.count;
  const d = new Date(); d.setDate(d.getDate() - 1);
  const yesterday = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  const count = streak.last === yesterday ? streak.count + 1 : 1;
  try { localStorage.setItem("popgeo_streak", JSON.stringify({ count, last: today })); } catch {}
  return count;
}

// ── Share Modal ────────────────────────────────────────────────────────────────
function ShareModal({ text, onClose }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); });
    } else {
      const el = document.getElementById("share-ta");
      if (el) { el.select(); document.execCommand("copy"); setCopied(true); setTimeout(() => setCopied(false), 1800); }
    }
  };
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 20 }} onClick={onClose}>
      <div style={{ background: "#060f20", border: "1px solid #0f2540", borderRadius: 16, padding: 24, width: "100%", maxWidth: 340 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#e2e8f0" }}>Share your result</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#475569", fontSize: 20, cursor: "pointer" }}>✕</button>
        </div>
        <div style={{ background: "#0a1525", borderRadius: 10, padding: 14, marginBottom: 14, fontFamily: "monospace", fontSize: 14, lineHeight: 2, color: "#cbd5e1", whiteSpace: "pre" }}>{text}</div>
        <textarea id="share-ta" readOnly value={text} style={{ position: "absolute", opacity: 0, pointerEvents: "none", width: 1, height: 1 }} />
        <button onClick={handleCopy} style={{ width: "100%", padding: 12, borderRadius: 9, fontSize: 14, fontWeight: 600, cursor: "pointer", background: copied ? "#166534" : "#1d4ed8", color: "#fff", border: "none" }}>
          {copied ? "✓ Copied!" : "Copy to clipboard"}
        </button>
      </div>
    </div>
  );
}

// ── Settings Panel ─────────────────────────────────────────────────────────────
function SettingsPanel({ unit, onUnitChange, onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 20 }} onClick={onClose}>
      <div style={{ background: "#060f20", border: "1px solid #0f2540", borderRadius: 16, padding: 24, width: "100%", maxWidth: 320 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: "#e2e8f0" }}>Settings</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#475569", fontSize: 20, cursor: "pointer" }}>✕</button>
        </div>
        <div style={{ color: "#64748b", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Distance Unit</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
          {["mi", "km"].map(u => (
            <button key={u} onClick={() => onUnitChange(u)} style={{ flex: 1, padding: 10, borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer", background: unit === u ? "#1d4ed8" : "#0a1525", color: unit === u ? "#fff" : "#475569", border: unit === u ? "1px solid #3b82f6" : "1px solid #0f2540" }}>
              {u === "mi" ? "Miles" : "Kilometers"}
            </button>
          ))}
        </div>
        <div style={{ color: "#1e3a5f", fontSize: 11, marginBottom: 20 }}>Default: Miles · Saved automatically</div>
        <div style={{ borderTop: "1px solid #0f2540", paddingTop: 16, color: "#334155", fontSize: 12, lineHeight: 1.6 }}>
          PopGeo · Daily pop culture geography · 5 questions · Distance scoring
        </div>
      </div>
    </div>
  );
}

// ── Mapbox Globe ───────────────────────────────────────────────────────────────
function Globe({ onPick, disabled, guess, answer, showAnswer, onMapReady }) {
  const mapRef = useRef(null);
  const containerRef = useRef(null);
  const markersRef = useRef({ guess: null, answer: null });

  useEffect(() => {
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/satellite-streets-v12",
      projection: "globe",
      center: [-98, 38],
      zoom: 2.8,
      minZoom: 1.5,
      maxZoom: 12,
      attributionControl: false,
    });
    mapRef.current = map;
    map.addControl(new mapboxgl.AttributionControl({ compact: true }), "bottom-left");

    map.on("load", () => {
      if (onMapReady) onMapReady(map);
      const textLayers = [
        "country-label", "state-label", "settlement-label",
        "settlement-subdivision-label", "airport-label", "poi-label",
        "water-point-label", "water-line-label", "natural-point-label",
        "natural-line-label", "waterway-label", "road-label-simple",
        "transit-label", "road-number-shield",
      ];
      textLayers.forEach(id => { try { map.setLayoutProperty(id, "visibility", "none"); } catch (e) {} });

      map.setFog({
        color: "rgb(10,20,40)",
        "high-color": "rgb(20,50,100)",
        "horizon-blend": 0.06,
        "space-color": "rgb(4,11,24)",
        "star-intensity": 0.6,
      });

      map.getStyle().layers.forEach(layer => {
        if (layer.type === "raster") {
          map.setPaintProperty(layer.id, "raster-brightness-min", 0.15);
          map.setPaintProperty(layer.id, "raster-brightness-max", 1.0);
          map.setPaintProperty(layer.id, "raster-saturation", 0.2);
        }
      });

      map.addSource("line-src", { type: "geojson", data: { type: "Feature", geometry: { type: "LineString", coordinates: [] } } });
      map.addLayer({ id: "guess-line", type: "line", source: "line-src", layout: { "line-join": "round", "line-cap": "round" }, paint: { "line-color": "#fde047", "line-width": 2.5, "line-dasharray": [2, 2], "line-opacity": 0.9 } });
    });

    map.on("click", e => {
      if (disabled) return;
      onPick({ lat: e.lngLat.lat, lng: e.lngLat.lng });
    });

    return () => map.remove();
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.getCanvas().style.cursor = disabled ? "default" : "crosshair";
  }, [disabled]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (markersRef.current.guess) { markersRef.current.guess.remove(); markersRef.current.guess = null; }
    if (!guess) return;
    const el = document.createElement("div");
    el.style.cssText = "width:22px;height:22px;border-radius:50%;background:#ef4444;border:3px solid #fff;box-shadow:0 2px 12px rgba(0,0,0,0.6);";
    markersRef.current.guess = new mapboxgl.Marker({ element: el, anchor: "center" }).setLngLat([guess.lng, guess.lat]).addTo(map);
  }, [guess]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (markersRef.current.answer) { markersRef.current.answer.remove(); markersRef.current.answer = null; }
    if (!showAnswer || !answer) {
      if (map.getSource("line-src")) map.getSource("line-src").setData({ type: "Feature", geometry: { type: "LineString", coordinates: [] } });
      return;
    }
    const el = document.createElement("div");
    el.style.cssText = "width:22px;height:22px;border-radius:50%;background:#22c55e;border:3px solid #fff;box-shadow:0 2px 12px rgba(0,0,0,0.6);";
    markersRef.current.answer = new mapboxgl.Marker({ element: el, anchor: "center" }).setLngLat([answer.lng, answer.lat]).addTo(map);
    if (map.getSource("line-src") && guess) {
      map.getSource("line-src").setData({ type: "Feature", geometry: { type: "LineString", coordinates: [[guess.lng, guess.lat], [answer.lng, answer.lat]] } });
    }
    if (guess) {
      const bounds = new mapboxgl.LngLatBounds().extend([guess.lng, guess.lat]).extend([answer.lng, answer.lat]);
      map.fitBounds(bounds, { padding: 100, maxZoom: 6, duration: 1200 });
    }
  }, [showAnswer, answer, guess]);

  return <div ref={containerRef} style={{ position: "absolute", inset: 0 }} />;
}

// ── Loading Screen ─────────────────────────────────────────────────────────────
function LoadingScreen({ error, onRetry }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "#040b18", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "system-ui,sans-serif", padding: 24 }}>
      <div style={{ fontSize: 60, marginBottom: 24 }}>🌍</div>
      {error ? (
        <>
          <div style={{ color: "#ef4444", fontSize: 15, fontWeight: 600, marginBottom: 8, textAlign: "center" }}>Couldn't load today's questions</div>
          <div style={{ color: "#475569", fontSize: 13, marginBottom: 24, textAlign: "center", maxWidth: 280 }}>{error}</div>
          <button onClick={onRetry} style={{ padding: "12px 28px", borderRadius: 10, fontSize: 14, fontWeight: 700, background: "#1d4ed8", color: "#fff", border: "1px solid #3b82f6", cursor: "pointer" }}>Try Again</button>
        </>
      ) : (
        <>
          <div style={{ color: "#60a5fa", fontSize: 15, fontWeight: 600, marginBottom: 8 }}>Generating today's questions…</div>
          <div style={{ color: "#334155", fontSize: 13 }}>Picking locations around the world</div>
          <div style={{ marginTop: 24, display: "flex", gap: 6 }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                width: 8, height: 8, borderRadius: "50%", background: "#3b82f6",
                animation: "pulse 1.2s ease-in-out infinite",
                animationDelay: `${i * 0.2}s`,
              }} />
            ))}
          </div>
          <style>{`@keyframes pulse { 0%,100%{opacity:0.3;transform:scale(0.8)} 50%{opacity:1;transform:scale(1.2)} }`}</style>
        </>
      )}
    </div>
  );
}

// ── App ────────────────────────────────────────────────────────────────────────
export default function PopGeo() {
  const [questions, setQuestions] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [qIdx, setQIdx]     = useState(0);
  const [guess, setGuess]   = useState(null);
  const [confirmed, setConf] = useState(false);
  const [scores, setScores]  = useState([]);
  const [dists, setDists]    = useState([]);
  const [phase, setPhase]    = useState("loading");
  const [streak, setStreak]  = useState(() => loadStreak().count);
  const [copied, setCopied]  = useState(false);
  const [unit, setUnit]      = useState(() => loadUnit());
  const [showSettings, setShowSettings] = useState(false);
  const [shareText, setShareText]       = useState(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    document.body.style.cssText = "margin:0;padding:0;background:#040b18;overflow:hidden;";
    document.documentElement.style.cssText = "margin:0;padding:0;background:#040b18;height:100%;";
  }, []);

  const fetchQuestions = useCallback(() => {
    setLoadError(null);
    setPhase("loading");
    generateDailyQuestions()
      .then(qs => { setQuestions(qs); setPhase("landing"); })
      .catch(err => { setLoadError(err.message || "Unknown error"); });
  }, []);

  useEffect(() => { fetchQuestions(); }, []);

  const q    = questions?.[qIdx];
  const meta = TYPE_META[q?.type] || TYPE_META.filmed;
  const total = scores.reduce((a, b) => a + b, 0);

  const handleUnitChange = u => { setUnit(u); saveUnit(u); };

  const handlePick = useCallback((coord) => {
    if (confirmed) return;
    setGuess(coord);
  }, [confirmed]);

  const handleConfirm = useCallback(() => {
    if (!guess || confirmed || !q) return;
    const dist  = haversine(guess.lat, guess.lng, q.lat, q.lng);
    const score = calcScore(dist);
    setDists(d => [...d, dist]);
    setScores(s => [...s, score]);
    setConf(true);
  }, [guess, confirmed, q]);

  const handleNext = () => {
    if (qIdx < questions.length - 1) {
      setQIdx(i => i + 1);
      setGuess(null);
      setConf(false);
    } else {
      const s = updateStreak();
      setStreak(s);
      setPhase("done");
    }
  };

  const handleShare = () => {
    const text = buildShareText(questions, scores);
    shareResult(text, setShareText, setCopied);
  };

  const feedback  = confirmed ? getFeedback(dists[dists.length - 1]) : null;
  const lastScore = scores[scores.length - 1];
  const lastDist  = dists[dists.length - 1];
  const todayLabel = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  // ── Loading / Error ──
  if (phase === "loading" || (!questions && !loadError)) {
    return <LoadingScreen error={loadError} onRetry={fetchQuestions} />;
  }
  if (loadError) {
    return <LoadingScreen error={loadError} onRetry={fetchQuestions} />;
  }

  // ── Landing ──
  if (phase === "landing") return (
    <div style={{ position: "fixed", inset: 0, background: "#040b18", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "system-ui,sans-serif", padding: 24 }}>
      {showSettings && <SettingsPanel unit={unit} onUnitChange={handleUnitChange} onClose={() => setShowSettings(false)} />}
      <div style={{ width: "100%", maxWidth: 380 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 120, height: 120, borderRadius: "50%", background: "radial-gradient(ellipse at 35% 30%,#1e6fa8 0%,#0d4a70 40%,#041822 100%)", boxShadow: "0 0 0 1px rgba(100,180,255,0.15),0 0 60px rgba(30,100,220,0.3)", fontSize: 60, marginBottom: 4 }}>
            🌍
          </div>
          <div style={{ fontSize: 36, fontWeight: 800, background: "linear-gradient(135deg,#60a5fa,#34d399)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: "-0.03em", marginBottom: 6 }}>PopGeo</div>
          <div style={{ color: "#94a3b8", fontSize: 15 }}>Daily pop culture geography</div>
          <div style={{ color: "#64748b", fontSize: 13, marginTop: 4 }}>{todayLabel}</div>
        </div>

        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid #0a1a2e", borderRadius: 14, padding: "16px 20px", marginBottom: 20 }}>
          {[
            { icon: "🌍", text: "Spin the globe to your answer" },
            { icon: "📍", text: "Tap once to lock in your guess" },
            { icon: "🎯", text: "Score up to 1,000 pts per question" },
          ].map((item, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: i < 2 ? 10 : 0 }}>
              <span style={{ fontSize: 20 }}>{item.icon}</span>
              <span style={{ color: "#94a3b8", fontSize: 13 }}>{item.text}</span>
            </div>
          ))}
        </div>

        {streak > 0 && (
          <div style={{ textAlign: "center", marginBottom: 16, color: "#64748b", fontSize: 13 }}>
            🔥 <span style={{ color: "#fbbf24", fontWeight: 700 }}>{streak} day</span> streak — keep it going!
          </div>
        )}

        <button onClick={() => setPhase("playing")} style={{ width: "100%", padding: 18, borderRadius: 14, fontSize: 18, fontWeight: 700, background: "linear-gradient(135deg,#1d4ed8,#2563eb)", color: "#fff", border: "1px solid #3b82f6", cursor: "pointer", boxShadow: "0 4px 24px rgba(29,78,216,0.4)", letterSpacing: "0.01em" }}>
          Play Today's Round →
        </button>

        <div style={{ textAlign: "center", marginTop: 16 }}>
          <button onClick={() => setShowSettings(true)} style={{ background: "none", border: "none", color: "#475569", fontSize: 13, cursor: "pointer" }}>⚙ Settings</button>
        </div>
      </div>
    </div>
  );

  // ── Done ──
  if (phase === "done") return (
    <div style={{ position: "fixed", inset: 0, background: "#040b18", overflowY: "auto", fontFamily: "system-ui,sans-serif" }}>
      {showSettings && <SettingsPanel unit={unit} onUnitChange={handleUnitChange} onClose={() => setShowSettings(false)} />}
      {shareText && <ShareModal text={shareText} onClose={() => setShareText(null)} />}
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "24px 16px 40px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 22, fontWeight: 800, background: "linear-gradient(135deg,#60a5fa,#34d399)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>PopGeo</div>
          <button onClick={() => setShowSettings(true)} style={{ background: "none", border: "none", color: "#334155", fontSize: 18, cursor: "pointer" }}>⚙</button>
        </div>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 44 }}>🎬</div>
          <div style={{ fontSize: 24, color: "#e2e8f0", fontWeight: 600, marginBottom: 2 }}>Round Complete</div>
          <div style={{ color: "#475569", fontSize: 13 }}>{todayLabel}</div>
          <div style={{ fontSize: 48, fontWeight: 800, color: "#f1f5f9", margin: "16px 0 2px" }}>{total.toLocaleString()}</div>
          <div style={{ color: "#475569", fontSize: 13, marginBottom: 8 }}>out of 5,000 points</div>
          {streak > 0 && <div style={{ color: "#64748b", fontSize: 13 }}>🔥 <span style={{ color: "#fbbf24", fontWeight: 700 }}>{streak} day</span> streak</div>}
        </div>

        <div style={{ background: "#070e1a", borderRadius: 8, height: 6, marginBottom: 20, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${Math.round((total / 5000) * 100)}%`, background: "linear-gradient(90deg,#3b82f6,#22c55e)", borderRadius: 8 }} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
          {questions.map((qu, i) => {
            const m = TYPE_META[qu.type] || TYPE_META.filmed;
            return (
              <div key={qu.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#070e1a", borderRadius: 8, padding: "10px 14px", borderLeft: `3px solid ${m.border}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: 16 }}>{scoreEmoji(scores[i])}</span>
                  <span style={{ color: "#94a3b8", fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{qu.answer}</span>
                </div>
                <div style={{ display: "flex", gap: 10, alignItems: "center", flexShrink: 0 }}>
                  <span style={{ color: "#475569", fontSize: 11 }}>{formatDist(dists[i], unit)}</span>
                  <span style={{ color: scoreColor(scores[i]), fontWeight: 700, fontSize: 15, minWidth: 40, textAlign: "right" }}>{scores[i].toLocaleString()}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ fontSize: 24, letterSpacing: 8, textAlign: "center", marginBottom: 20 }}>{scores.map(scoreEmoji).join("")}</div>
        <button onClick={handleShare} style={{ width: "100%", padding: 14, borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: "pointer", background: copied ? "#166534" : "#1d4ed8", color: "#fff", border: "none", marginBottom: 8 }}>
          {copied ? "✓ Copied!" : "📲 Share Result"}
        </button>
        <div style={{ textAlign: "center", color: "#475569", fontSize: 12, marginTop: 8 }}>Come back tomorrow for a new round</div>
      </div>
    </div>
  );

  // ── Playing ──
  return (
    <div style={{ position: "fixed", inset: 0, background: "#040b18", fontFamily: "system-ui,sans-serif", overflow: "hidden" }}>
      {showSettings && <SettingsPanel unit={unit} onUnitChange={handleUnitChange} onClose={() => setShowSettings(false)} />}
      {shareText && <ShareModal text={shareText} onClose={() => setShareText(null)} />}

      <Globe
        onPick={handlePick}
        disabled={confirmed}
        guess={guess}
        answer={confirmed ? { lat: q.lat, lng: q.lng } : null}
        showAnswer={confirmed}
        onMapReady={map => { mapInstanceRef.current = map; }}
      />

      {/* Top bar — pre-guess */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, padding: "50px 16px 12px", background: "linear-gradient(to bottom,rgba(4,11,24,0.92) 0%,rgba(4,11,24,0) 100%)", transition: "opacity 0.4s ease, transform 0.4s ease", opacity: confirmed ? 0 : 1, transform: confirmed ? "translateY(-20px)" : "translateY(0)", pointerEvents: confirmed ? "none" : "all" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ fontSize: 20, fontWeight: 800, background: "linear-gradient(135deg,#60a5fa,#34d399)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>PopGeo</div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ display: "flex", gap: 5 }}>
              {questions.map((_, i) => <div key={i} style={{ width: 22, height: 3, borderRadius: 2, background: i < qIdx ? "#22c55e" : i === qIdx ? "#3b82f6" : "rgba(255,255,255,0.1)" }} />)}
            </div>
            <span style={{ color: "#334155", fontSize: 11 }}>{qIdx + 1}/5</span>
            <button onClick={() => setShowSettings(true)} style={{ background: "none", border: "none", color: "#334155", fontSize: 16, cursor: "pointer" }}>⚙</button>
          </div>
        </div>

        <div style={{ display: "inline-block", background: "rgba(4,11,24,0.75)", border: `1px solid ${meta.border}`, borderRadius: 20, padding: "3px 12px", fontSize: 11, color: meta.color, fontFamily: "monospace", letterSpacing: "0.04em", marginBottom: 6, backdropFilter: "blur(8px)" }}>
          {q.emoji} {meta.label}
        </div>

        <div style={{ background: "rgba(4,11,24,0.82)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "10px 14px", marginTop: 4 }}>
          <div style={{ fontSize: 14, lineHeight: 1.55, color: "#e2e8f0", fontStyle: "italic" }}>
            "{q.clue}"
          </div>
        </div>
      </div>

      {/* Post-guess top bar */}
      {confirmed && (
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, padding: "50px 16px 10px", background: "linear-gradient(to bottom,rgba(4,11,24,0.85) 0%,rgba(4,11,24,0) 100%)", pointerEvents: "none" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 800, background: "linear-gradient(135deg,#60a5fa,#34d399)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>PopGeo</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ display: "flex", gap: 4 }}>
                {questions.map((_, i) => <div key={i} style={{ width: 20, height: 3, borderRadius: 2, background: i < qIdx ? "#22c55e" : i === qIdx ? "#3b82f6" : "rgba(255,255,255,0.1)" }} />)}
              </div>
              <span style={{ color: "#334155", fontSize: 11 }}>{qIdx + 1}/5</span>
              <button onClick={() => setShowSettings(true)} style={{ background: "none", border: "none", color: "#334155", fontSize: 15, cursor: "pointer", pointerEvents: "all" }}>⚙</button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom panel */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(to top,rgba(4,11,24,0.97) 60%,rgba(4,11,24,0) 100%)", padding: "60px 16px 40px" }}>
        {!confirmed ? (
          <div style={{ maxWidth: 480, margin: "0 auto" }}>
            <div style={{ textAlign: "center", color: "#64748b", fontSize: 12, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 10 }}>
              {guess ? "Pin placed — confirm when ready" : "Drag globe · Tap to place pin"}
            </div>
            <button onClick={handleConfirm} disabled={!guess} style={{ width: "100%", padding: 14, borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: guess ? "pointer" : "not-allowed", background: guess ? "linear-gradient(135deg,#1d4ed8,#2563eb)" : "rgba(255,255,255,0.04)", color: guess ? "#fff" : "#475569", border: guess ? "1px solid #3b82f6" : "1px solid rgba(255,255,255,0.08)", transition: "all 0.2s", boxShadow: guess ? "0 4px 20px rgba(29,78,216,0.4)" : "none" }}>
              {guess ? "Confirm Guess ✓" : "Tap the globe to guess"}
            </button>
          </div>
        ) : (
          <div style={{ maxWidth: 480, margin: "0 auto" }}>
            {/* Feedback + score — frosted card so it reads over the globe */}
            <div style={{ background: "rgba(4,11,24,0.82)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 12, padding: "12px 16px", marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div style={{ fontSize: 17, fontWeight: 700, color: feedback.color }}>{feedback.label}</div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: 28, fontWeight: 800, color: scoreColor(lastScore) }}>{lastScore.toLocaleString()}</span>
                  <span style={{ color: "#64748b", fontSize: 13 }}> / 1,000</span>
                </div>
              </div>

              <div style={{ background: "rgba(255,255,255,0.07)", borderRadius: 4, height: 4, marginBottom: 10, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${Math.round((lastScore / 1000) * 100)}%`, background: scoreColor(lastScore), borderRadius: 4 }} />
              </div>

              <div style={{ color: "#94a3b8", fontSize: 12 }}>{formatDist(lastDist, unit)} from the answer</div>
            </div>

            <div style={{ background: "rgba(4,11,24,0.85)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "12px 16px", marginBottom: 14 }}>
              <div style={{ color: "#475569", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 6 }}>Answer</div>
              <div style={{ color: "#f1f5f9", fontSize: 17, fontWeight: 700, marginBottom: 6, letterSpacing: "-0.01em" }}>{q.answer}</div>
              <div style={{ width: 32, height: 2, background: "linear-gradient(90deg,#3b82f6,#22c55e)", borderRadius: 2, marginBottom: 8 }} />
              <div style={{ color: "#94a3b8", fontSize: 13, lineHeight: 1.65, fontWeight: 400 }}>{q.blurb}</div>
            </div>

            <button onClick={handleNext} style={{ width: "100%", padding: 14, borderRadius: 10, fontSize: 15, fontWeight: 700, background: "#166534", color: "#fff", border: "1px solid #22c55e", cursor: "pointer" }}>
              {qIdx < questions.length - 1 ? "Next Question →" : "See Results →"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
