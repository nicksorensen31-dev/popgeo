import { useState, useEffect, useRef, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

const ALL_QUESTIONS = [
  { id: 1,  type: "filmed", emoji: "🎬", clue: "No Country for Old Men was filmed in this desolate West Texas landscape", answer: "Marfa, Texas", blurb: "Marfa, a tiny art town of 1,800 people in the Chihuahuan Desert, doubled as the bleak Texas borderlands throughout the film.", lat: 30.3093, lng: -104.0205 },
  { id: 2,  type: "set",    emoji: "📍", clue: "Breaking Bad's Walter White cooked meth in this New Mexico city", answer: "Albuquerque, NM", blurb: "Albuquerque's distinct desert landscape and Route 66 strip became so iconic that tourism to the city jumped 10% after the show aired.", lat: 35.0844, lng: -106.6504 },
  { id: 3,  type: "filmed", emoji: "🎬", clue: "Game of Thrones' King's Landing was filmed in this ancient Croatian city", answer: "Dubrovnik, Croatia", blurb: "Dubrovnik's medieval walls and limestone streets were so perfect for King's Landing that the city now limits tourist numbers to protect the site.", lat: 42.6507, lng: 18.0944 },
  { id: 4,  type: "filmed", emoji: "🎬", clue: "Jurassic Park's island scenes were filmed on this Hawaiian island", answer: "Kauai, Hawaii", blurb: "Kauai's Napali Coast and Allerton Garden stood in for Isla Nublar — the island has appeared in more Hollywood films per square mile than almost anywhere on Earth.", lat: 22.0964, lng: -159.5261 },
  { id: 5,  type: "set",    emoji: "📍", clue: "Fargo takes place in this frozen upper Midwest city", answer: "Fargo, North Dakota", blurb: "Almost none of the Coen Brothers film was actually shot in Fargo — most filming happened in Minnesota — but the city embraced the name and even has a wood chipper on permanent display.", lat: 46.8772, lng: -96.7898 },
  { id: 6,  type: "filmed", emoji: "🎬", clue: "Mad Max: Fury Road was filmed in this otherworldly African desert", answer: "Namibia", blurb: "The Namib Desert's Dorob National Park provided the apocalyptic orange dunes. Director George Miller originally planned to shoot in Australia but record rains turned the outback green.", lat: -24.7599, lng: 15.9056 },
  { id: 7,  type: "filmed", emoji: "🎬", clue: "The Dark Knight's opening bank heist was filmed in this Midwest metropolis", answer: "Chicago, Illinois", blurb: "Christopher Nolan used Chicago so extensively that Gotham City essentially became Chicago — the elevated L train, City Hall, and Lower Wacker Drive all feature prominently.", lat: 41.8781, lng: -87.6298 },
  { id: 8,  type: "set",    emoji: "📍", clue: "The Wire is set in the decaying neighborhoods of this East Coast city", answer: "Baltimore, Maryland", blurb: "Creator David Simon was a Baltimore Sun crime reporter for 12 years before writing the show, making it one of the most accurately portrayed cities in TV history.", lat: 39.2904, lng: -76.6122 },
  { id: 9,  type: "filmed", emoji: "🎬", clue: "Lawrence of Arabia's sweeping desert scenes were filmed in this country", answer: "Jordan", blurb: "The film was shot primarily in Wadi Rum, a vast sandstone valley still called 'The Valley of the Moon.' It remains one of the most filmed desert locations on Earth.", lat: 30.5852, lng: 36.2384 },
  { id: 10, type: "set",    emoji: "📍", clue: "The Sopranos' Tony ran his crime family from this New Jersey suburb", answer: "Newark, New Jersey", blurb: "The show used real New Jersey locations throughout, including the Bada Bing strip club in Lodi and Tony's house in North Caldwell, which still draws fans decades later.", lat: 40.7357, lng: -74.1724 },
  { id: 11, type: "filmed", emoji: "🎬", clue: "Braveheart was filmed in the rugged highlands of this country", answer: "Scotland", blurb: "Despite being set in Scotland, much of Braveheart was filmed in Ireland due to budget reasons — but Glen Nevis near Fort William provided the iconic highland battle scenes.", lat: 56.4907, lng: -4.2026 },
  { id: 12, type: "set",    emoji: "📍", clue: "Succession's Roy family empire is headquartered in this global city", answer: "New York City", blurb: "The show filmed extensively at real Manhattan locations including Waystar Royco's offices in Midtown and the Upper East Side townhouses used for family gatherings.", lat: 40.7128, lng: -74.0060 },
  { id: 13, type: "filmed", emoji: "🎬", clue: "The Lord of the Rings trilogy was filmed across this island nation", answer: "New Zealand", blurb: "Peter Jackson filmed across 150 locations throughout New Zealand over 438 days, turning the country into Middle-earth and permanently boosting its tourism industry.", lat: -40.9006, lng: 174.8860 },
  { id: 14, type: "set",    emoji: "📍", clue: "Yellowstone's Dutton Ranch is set in the sweeping valleys of this state", answer: "Montana", blurb: "The show's success sparked a real Montana land rush — ranches near Billings and Paradise Valley saw property values surge as city buyers chased the Yellowstone lifestyle.", lat: 46.8797, lng: -110.3626 },
  { id: 15, type: "filmed", emoji: "🎬", clue: "The Shining's exterior shots were filmed at this iconic Colorado mountain hotel", answer: "Estes Park, Colorado", blurb: "The Stanley Hotel in Estes Park inspired Stephen King after a nightmarish stay in Room 217. The Overlook's interiors were built on a Burbank soundstage by Kubrick.", lat: 40.3772, lng: -105.5217 },
  { id: 16, type: "set",    emoji: "📍", clue: "True Detective Season 1 unravels across the bayous of this Southern state", answer: "Louisiana", blurb: "The flat, eerie Louisiana coastline — slowly being swallowed by the Gulf — became almost a character itself, reflecting the show's themes of decay and moral corruption.", lat: 30.9843, lng: -91.9623 },
  { id: 17, type: "filmed", emoji: "🎬", clue: "Apocalypse Now was filmed in the jungles of this Southeast Asian country", answer: "Philippines", blurb: "Filming in Luzon was so chaotic that it took 238 days instead of 17. A typhoon destroyed sets, Marlon Brando arrived overweight and unprepared, and Martin Sheen had a heart attack.", lat: 12.8797, lng: 121.7740 },
  { id: 18, type: "set",    emoji: "📍", clue: "Ozark's Byrde family launders money in this Missouri lake region", answer: "Lake of the Ozarks, MO", blurb: "The Lake of the Ozarks, a massive reservoir created by damming the Osage River in 1931, is real — and locals say the show's portrayal of its lawless reputation isn't far off.", lat: 38.1742, lng: -92.6824 },
  { id: 19, type: "filmed", emoji: "🎬", clue: "Dune's desert planet Arrakis was filmed in this UAE desert landscape", answer: "Abu Dhabi, UAE", blurb: "Director Denis Villeneuve used Liwa Desert's massive orange dunes as Arrakis, choosing Abu Dhabi over Jordan for its more alien, extreme landscape and towering dune scale.", lat: 23.4241, lng: 53.8478 },
  { id: 20, type: "set",    emoji: "📍", clue: "Deadwood is set in this lawless gold rush town in the Black Hills", answer: "Deadwood, South Dakota", blurb: "The real Deadwood was an illegal settlement on Lakota Sioux land. Wild Bill Hickok was shot dead there in 1876, and the town's history is just as wild as the HBO series.", lat: 44.3767, lng: -103.7296 },
  { id: 21, type: "actor",  emoji: "⭐", clue: "Meryl Streep was born and raised in this New Jersey suburb", answer: "Summit, New Jersey", blurb: "Streep grew up in Summit, a quiet commuter town 24 miles from Manhattan, and attended Vassar College before training at Yale School of Drama.", lat: 40.7151, lng: -74.3604 },
  { id: 22, type: "actor",  emoji: "⭐", clue: "Cate Blanchett was born in this southern Australian city", answer: "Melbourne, Australia", blurb: "Blanchett grew up in the Melbourne suburb of Ivanhoe and studied economics briefly before switching to acting at the National Institute of Dramatic Art in Sydney.", lat: -37.8136, lng: 144.9631 },
  { id: 23, type: "actor",  emoji: "⭐", clue: "Denzel Washington was born in this city just north of New York", answer: "Mount Vernon, New York", blurb: "Washington grew up in Mount Vernon, a working-class city directly bordering the Bronx, before attending Fordham University on an athletic scholarship.", lat: 40.9126, lng: -73.8371 },
  { id: 24, type: "actor",  emoji: "⭐", clue: "Anthony Hopkins was born in this small Welsh town", answer: "Port Talbot, Wales", blurb: "Hopkins grew up in the steel-industry town of Port Talbot, the same town that produced Richard Burton — Wales's two most celebrated actors came from the same small place.", lat: 51.5908, lng: -3.7877 },
  { id: 25, type: "actor",  emoji: "⭐", clue: "Charlize Theron grew up near this South African city", answer: "Johannesburg, South Africa", blurb: "Theron was raised on a farm in Benoni, east of Johannesburg. She moved to New York at 16 to pursue modeling and dance before a chance encounter led to her acting career.", lat: -26.2041, lng: 28.0473 },
  { id: 26, type: "actor",  emoji: "⭐", clue: "Brad Pitt was born in this Oklahoma city", answer: "Shawnee, Oklahoma", blurb: "Pitt was born in Shawnee but grew up in Springfield, Missouri. He left the University of Missouri just two credits short of graduating to drive to Hollywood in 1986.", lat: 35.3273, lng: -96.9253 },
  { id: 27, type: "actor",  emoji: "⭐", clue: "Joaquin Phoenix was born in this US territory island", answer: "San Juan, Puerto Rico", blurb: "Phoenix was born in San Juan while his parents were traveling with a religious organization. The family later moved to Los Angeles where all five siblings pursued acting.", lat: 18.4655, lng: -66.1057 },
  { id: 28, type: "actor",  emoji: "⭐", clue: "Viola Davis was born in this small South Carolina town", answer: "St. Matthews, South Carolina", blurb: "Davis grew up in poverty in Central Falls, Rhode Island, after her family relocated from South Carolina. She has called her childhood one of the most impoverished in the country.", lat: 33.6629, lng: -80.7748 },
  { id: 29, type: "actor",  emoji: "⭐", clue: "Javier Bardem was born in this Spanish Canary Island city", answer: "Las Palmas, Spain", blurb: "Bardem comes from a legendary Spanish acting dynasty — his mother, uncle, and grandfather were all well-known Spanish actors before him.", lat: 28.1235, lng: -15.4363 },
  { id: 30, type: "actor",  emoji: "⭐", clue: "Lupita Nyong'o was born in this Mexican capital while her father was in exile", answer: "Mexico City, Mexico", blurb: "Nyong'o's father Peter fled Kenya's political violence in the 1970s and settled in Mexico, where Lupita was born before the family eventually returned to Nairobi.", lat: 19.4326, lng: -99.1332 },
];

function getDailyQuestions() {
  const today = new Date();
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  const shuffled = [...ALL_QUESTIONS];
  let s = seed;
  for (let i = shuffled.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    const j = Math.abs(s) % (i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const filmed = shuffled.filter(q => q.type === "filmed");
  const set    = shuffled.filter(q => q.type === "set");
  const actor  = shuffled.filter(q => q.type === "actor");
  return [filmed[0], set[0], actor[0], filmed[1], set[1]];
}

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

const KM_TO_MI = 0.621371;
function formatDist(km, unit) {
  return unit === "mi" ? `${Math.round(km * KM_TO_MI).toLocaleString()} mi` : `${Math.round(km).toLocaleString()} km`;
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
  if (s >= 800) return "#22c55e"; if (s >= 500) return "#84cc16";
  if (s >= 200) return "#f59e0b"; return "#ef4444";
}
function scoreEmoji(s) {
  if (s >= 900) return "🟢"; if (s >= 600) return "🟡";
  if (s >= 200) return "🟠"; return "🔴";
}

const TYPE_META = {
  filmed: { label: "Where was it filmed?", color: "#93c5fd", bg: "rgba(29,78,216,0.25)", border: "rgba(59,130,246,0.5)" },
  set:    { label: "Where is it set?",     color: "#d8b4fe", bg: "rgba(124,58,237,0.25)", border: "rgba(167,139,250,0.5)" },
  actor:  { label: "Where are they from?", color: "#fcd34d", bg: "rgba(217,119,6,0.25)",  border: "rgba(251,191,36,0.5)" },
};

function buildShareText(questions, scores) {
  const d = new Date().toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" });
  const total = scores.reduce((a,b) => a+b, 0);
  return `🎬 PopGeo — ${d}\n${scores.map(scoreEmoji).join("  ")}\n${total.toLocaleString()} / 5,000\npopgeo.app`;
}

async function shareResult(text, setShareText, setCopied) {
  if (navigator.share) {
    try {
      await navigator.share({ text });
      return;
    } catch(e) {
      if (e.name === "AbortError") return; // user cancelled
    }
  }
  // Fallback: clipboard
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
      return;
    } catch(e) {}
  }
  // Last resort: show modal
  setShareText(text);
}
function getTodayKey() { const d = new Date(); return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`; }
function loadStreak() {
  try { return JSON.parse(localStorage.getItem("popgeo_streak") || "{}") || { count:0, last:"" }; }
  catch { return { count:0, last:"" }; }
}
function updateStreak() {
  const today = getTodayKey(), streak = loadStreak();
  if (streak.last === today) return streak.count;
  const d = new Date(); d.setDate(d.getDate()-1);
  const yesterday = `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
  const count = streak.last === yesterday ? streak.count+1 : 1;
  try { localStorage.setItem("popgeo_streak", JSON.stringify({ count, last:today })); } catch {}
  return count;
}

// ── Share Modal ───────────────────────────────────────────────────────────────
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
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200, padding:20 }} onClick={onClose}>
      <div style={{ background:"#060f20", border:"1px solid #0f2540", borderRadius:16, padding:24, width:"100%", maxWidth:340 }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
          <div style={{ fontSize:15, fontWeight:600, color:"#e2e8f0" }}>Share your result</div>
          <button onClick={onClose} style={{ background:"none", border:"none", color:"#475569", fontSize:20, cursor:"pointer" }}>✕</button>
        </div>
        <div style={{ background:"#0a1525", borderRadius:10, padding:14, marginBottom:14, fontFamily:"monospace", fontSize:14, lineHeight:2, color:"#cbd5e1", whiteSpace:"pre" }}>{text}</div>
        <textarea id="share-ta" readOnly value={text} style={{ position:"absolute", opacity:0, pointerEvents:"none", width:1, height:1 }}/>
        <button onClick={handleCopy} style={{ width:"100%", padding:12, borderRadius:9, fontSize:14, fontWeight:600, cursor:"pointer", background:copied?"#166534":"#1d4ed8", color:"#fff", border:"none" }}>
          {copied ? "✓ Copied!" : "Copy to clipboard"}
        </button>
      </div>
    </div>
  );
}

// ── Settings Panel ────────────────────────────────────────────────────────────
function SettingsPanel({ unit, onUnitChange, onClose }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200, padding:20 }} onClick={onClose}>
      <div style={{ background:"#060f20", border:"1px solid #0f2540", borderRadius:16, padding:24, width:"100%", maxWidth:320 }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <div style={{ fontSize:16, fontWeight:600, color:"#e2e8f0" }}>Settings</div>
          <button onClick={onClose} style={{ background:"none", border:"none", color:"#475569", fontSize:20, cursor:"pointer" }}>✕</button>
        </div>
        <div style={{ color:"#64748b", fontSize:11, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:10 }}>Distance Unit</div>
        <div style={{ display:"flex", gap:8, marginBottom:6 }}>
          {["mi","km"].map(u => (
            <button key={u} onClick={() => onUnitChange(u)} style={{ flex:1, padding:10, borderRadius:8, fontSize:14, fontWeight:600, cursor:"pointer", background:unit===u?"#1d4ed8":"#0a1525", color:unit===u?"#fff":"#475569", border:unit===u?"1px solid #3b82f6":"1px solid #0f2540" }}>
              {u==="mi"?"Miles":"Kilometers"}
            </button>
          ))}
        </div>
        <div style={{ color:"#1e3a5f", fontSize:11, marginBottom:20 }}>Default: Miles · Saved automatically</div>
        <div style={{ borderTop:"1px solid #0f2540", paddingTop:16, color:"#334155", fontSize:12, lineHeight:1.6 }}>
          PopGeo · Daily pop culture geography · 5 questions · Distance scoring
        </div>
      </div>
    </div>
  );
}

// ── Mapbox Globe ──────────────────────────────────────────────────────────────
function Globe({ onPick, disabled, guess, answer, showAnswer }) {
  const mapRef       = useRef(null);
  const containerRef = useRef(null);
  const markersRef   = useRef({ guess: null, answer: null });

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

    map.on("load", () => {
      // Hide text labels only — keep country/state border lines visible
      const textLayers = [
        "country-label","state-label","settlement-label",
        "settlement-subdivision-label","airport-label","poi-label",
        "water-point-label","water-line-label","natural-point-label",
        "natural-line-label","waterway-label","road-label-simple",
        "transit-label","road-number-shield"
      ];
      textLayers.forEach(id => {
        try { map.setLayoutProperty(id, "visibility", "none"); } catch(e) {}
      });

      map.setFog({
        color: "rgb(10,20,40)",
        "high-color": "rgb(20,50,100)",
        "horizon-blend": 0.06,
        "space-color": "rgb(4,11,24)",
        "star-intensity": 0.6,
      });

      // Brighten satellite imagery
      map.getStyle().layers.forEach(layer => {
        if (layer.type === "raster") {
          map.setPaintProperty(layer.id, "raster-brightness-min", 0.15);
          map.setPaintProperty(layer.id, "raster-brightness-max", 1.0);
          map.setPaintProperty(layer.id, "raster-saturation", 0.2);
        }
      });

      map.addSource("line-src", { type:"geojson", data:{ type:"Feature", geometry:{ type:"LineString", coordinates:[] } } });
      map.addLayer({ id:"guess-line", type:"line", source:"line-src", layout:{"line-join":"round","line-cap":"round"}, paint:{"line-color":"#fde047","line-width":2.5,"line-dasharray":[2,2],"line-opacity":0.9} });
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
    markersRef.current.guess = new mapboxgl.Marker({ element:el, anchor:"center" }).setLngLat([guess.lng, guess.lat]).addTo(map);
  }, [guess]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (markersRef.current.answer) { markersRef.current.answer.remove(); markersRef.current.answer = null; }
    if (!showAnswer || !answer) {
      if (map.getSource("line-src")) map.getSource("line-src").setData({ type:"Feature", geometry:{ type:"LineString", coordinates:[] } });
      return;
    }
    const el = document.createElement("div");
    el.style.cssText = "width:22px;height:22px;border-radius:50%;background:#22c55e;border:3px solid #fff;box-shadow:0 2px 12px rgba(0,0,0,0.6);";
    markersRef.current.answer = new mapboxgl.Marker({ element:el, anchor:"center" }).setLngLat([answer.lng, answer.lat]).addTo(map);
    if (map.getSource("line-src") && guess) {
      map.getSource("line-src").setData({ type:"Feature", geometry:{ type:"LineString", coordinates:[[guess.lng,guess.lat],[answer.lng,answer.lat]] } });
    }

    if (guess) {
      const bounds = new mapboxgl.LngLatBounds().extend([guess.lng,guess.lat]).extend([answer.lng,answer.lat]);
      map.fitBounds(bounds, { padding:100, maxZoom:6, duration:1200 });
    }
  }, [showAnswer, answer, guess]);

  return <div ref={containerRef} style={{ position:"absolute", inset:0 }}/>;
}


// ── App ───────────────────────────────────────────────────────────────────────
export default function PopGeo() {
  const questions = getDailyQuestions();
  const [qIdx, setQIdx]       = useState(0);
  const [guess, setGuess]     = useState(null);
  const [confirmed, setConf]  = useState(false);
  const [scores, setScores]   = useState([]);
  const [dists, setDists]     = useState([]);
  const [phase, setPhase]     = useState("landing");
  const [streak, setStreak]   = useState(() => loadStreak().count);
  const [copied, setCopied]   = useState(false);
  const [unit, setUnit]       = useState(() => loadUnit());
  const [showSettings, setShowSettings] = useState(false);
  const [shareText, setShareText]       = useState(null);

  useEffect(() => {
    document.body.style.cssText = "margin:0;padding:0;background:#040b18;overflow:hidden;";
    document.documentElement.style.cssText = "margin:0;padding:0;background:#040b18;height:100%;";
  }, []);

  const q     = questions[qIdx];
  const meta  = TYPE_META[q?.type] || TYPE_META.filmed;
  const total = scores.reduce((a,b)=>a+b,0);

  const handleUnitChange = u => { setUnit(u); saveUnit(u); };

  const handlePick = useCallback((coord) => {
    if (confirmed) return;
    setGuess(coord);
  }, [confirmed]);

  const handleConfirm = useCallback(() => {
    if (!guess || confirmed) return;
    const dist  = haversine(guess.lat, guess.lng, q.lat, q.lng);
    const score = calcScore(dist);
    setDists(d => [...d, dist]);
    setScores(s => [...s, score]);
    setConf(true);
  }, [guess, confirmed, q]);

  const handleNext = () => {
    if (qIdx < questions.length-1) { setQIdx(i=>i+1); setGuess(null); setConf(false); }
    else { setStreak(updateStreak()); setPhase("done"); }
  };

  const handleShare = () => {
    const text = buildShareText(questions, scores);
    shareResult(text, setShareText, setCopied);
  };

  const feedback   = confirmed ? getFeedback(dists[dists.length-1]) : null;
  const lastScore  = scores[scores.length-1];
  const lastDist   = dists[dists.length-1];
  const todayLabel = new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"});

  // ── Landing ──
  if (phase === "landing") return (
    <div style={{ position:"fixed", inset:0, background:"#040b18", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", fontFamily:"system-ui,sans-serif", padding:24 }}>
      {showSettings && <SettingsPanel unit={unit} onUnitChange={handleUnitChange} onClose={()=>setShowSettings(false)}/>}
      <div style={{ width:"100%", maxWidth:380 }}>
        {/* Globe icon */}
        <div style={{ textAlign:"center", marginBottom:32 }}>
          <div style={{ display:"inline-flex", alignItems:"center", justifyContent:"center", width:120, height:120, borderRadius:"50%", background:"radial-gradient(ellipse at 35% 30%,#1e6fa8 0%,#0d4a70 40%,#041822 100%)", boxShadow:"0 0 0 1px rgba(100,180,255,0.15),0 0 60px rgba(30,100,220,0.3)", fontSize:60, marginBottom:4 }}>
            🌍
          </div>
          <div style={{ fontSize:36, fontWeight:800, background:"linear-gradient(135deg,#60a5fa,#34d399)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", letterSpacing:"-0.03em", marginBottom:6 }}>PopGeo</div>
          <div style={{ color:"#64748b", fontSize:15 }}>Daily pop culture geography</div>
          <div style={{ color:"#1e3a5f", fontSize:13, marginTop:4 }}>{todayLabel}</div>
        </div>

        {/* How it works */}
        <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid #0a1a2e", borderRadius:14, padding:"16px 20px", marginBottom:20 }}>
          {[
            { icon:"🌍", text:"Spin the globe to your answer" },
            { icon:"📍", text:"Tap once to lock in your guess" },
            { icon:"🎯", text:"Score up to 1,000 pts per question" },
          ].map((item,i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:12, marginBottom:i<2?10:0 }}>
              <span style={{ fontSize:20 }}>{item.icon}</span>
              <span style={{ color:"#64748b", fontSize:13 }}>{item.text}</span>
            </div>
          ))}
        </div>

        {streak > 0 && (
          <div style={{ textAlign:"center", marginBottom:16, color:"#64748b", fontSize:13 }}>
            🔥 <span style={{ color:"#fbbf24", fontWeight:700 }}>{streak} day</span> streak — keep it going!
          </div>
        )}

        <button onClick={()=>setPhase("playing")} style={{ width:"100%", padding:18, borderRadius:14, fontSize:18, fontWeight:700, background:"linear-gradient(135deg,#1d4ed8,#2563eb)", color:"#fff", border:"1px solid #3b82f6", cursor:"pointer", boxShadow:"0 4px 24px rgba(29,78,216,0.4)", letterSpacing:"0.01em" }}>
          Play Today's Round →
        </button>

        <div style={{ textAlign:"center", marginTop:16 }}>
          <button onClick={()=>setShowSettings(true)} style={{ background:"none", border:"none", color:"#1e3a5f", fontSize:13, cursor:"pointer" }}>⚙ Settings</button>
        </div>
      </div>
    </div>
  );

  // ── Done ──
  if (phase === "done") return (
    <div style={{ position:"fixed", inset:0, background:"#040b18", overflowY:"auto", fontFamily:"system-ui,sans-serif" }}>
      {showSettings && <SettingsPanel unit={unit} onUnitChange={handleUnitChange} onClose={()=>setShowSettings(false)}/>}
      {shareText && <ShareModal text={shareText} onClose={()=>setShareText(null)}/>}
      <div style={{ maxWidth:480, margin:"0 auto", padding:"24px 16px 40px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
          <div style={{ fontSize:22, fontWeight:800, background:"linear-gradient(135deg,#60a5fa,#34d399)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>PopGeo</div>
          <button onClick={()=>setShowSettings(true)} style={{ background:"none", border:"none", color:"#334155", fontSize:18, cursor:"pointer" }}>⚙</button>
        </div>
        <div style={{ textAlign:"center", marginBottom:24 }}>
          <div style={{ fontSize:44 }}>🎬</div>
          <div style={{ fontSize:24, color:"#e2e8f0", fontWeight:600, marginBottom:2 }}>Round Complete</div>
          <div style={{ color:"#475569", fontSize:13 }}>{todayLabel}</div>
          <div style={{ fontSize:48, fontWeight:800, color:"#f1f5f9", margin:"16px 0 2px" }}>{total.toLocaleString()}</div>
          <div style={{ color:"#475569", fontSize:13, marginBottom:8 }}>out of 5,000 points</div>
          {streak > 0 && <div style={{ color:"#64748b", fontSize:13 }}>🔥 <span style={{ color:"#fbbf24", fontWeight:700 }}>{streak} day</span> streak</div>}
        </div>

        <div style={{ background:"#070e1a", borderRadius:8, height:6, marginBottom:20, overflow:"hidden" }}>
          <div style={{ height:"100%", width:`${Math.round((total/5000)*100)}%`, background:"linear-gradient(90deg,#3b82f6,#22c55e)", borderRadius:8 }}/>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:20 }}>
          {questions.map((qu,i) => {
            const m = TYPE_META[qu.type];
            return <div key={qu.id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", background:"#070e1a", borderRadius:8, padding:"10px 14px", borderLeft:`3px solid ${m.border}` }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, flex:1, minWidth:0 }}>
                <span style={{ fontSize:16 }}>{scoreEmoji(scores[i])}</span>
                <span style={{ color:"#94a3b8", fontSize:12, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{qu.answer}</span>
              </div>
              <div style={{ display:"flex", gap:10, alignItems:"center", flexShrink:0 }}>
                <span style={{ color:"#475569", fontSize:11 }}>{formatDist(dists[i],unit)}</span>
                <span style={{ color:scoreColor(scores[i]), fontWeight:700, fontSize:15, minWidth:40, textAlign:"right" }}>{scores[i].toLocaleString()}</span>
              </div>
            </div>;
          })}
        </div>

        <div style={{ fontSize:24, letterSpacing:8, textAlign:"center", marginBottom:20 }}>{scores.map(scoreEmoji).join("")}</div>
        <button onClick={handleShare} style={{ width:"100%", padding:14, borderRadius:10, fontSize:15, fontWeight:600, cursor:"pointer", background:copied?"#166534":"#1d4ed8", color:"#fff", border:"none", marginBottom:8 }}>
          {copied ? "✓ Copied!" : "📲 Share Result"}
        </button>
        <div style={{ textAlign:"center", color:"#1e3a5f", fontSize:12, marginTop:8 }}>Come back tomorrow for a new round</div>
      </div>
    </div>
  );

  // ── Playing ──
  return (
    <div style={{ position:"fixed", inset:0, background:"#040b18", fontFamily:"system-ui,sans-serif", overflow:"hidden" }}>
      {showSettings && <SettingsPanel unit={unit} onUnitChange={handleUnitChange} onClose={()=>setShowSettings(false)}/>}
      {shareText && <ShareModal text={shareText} onClose={()=>setShareText(null)}/>}

      {/* Full screen globe */}
      <Globe onPick={handlePick} disabled={confirmed} guess={guess}
        answer={confirmed?{lat:q.lat,lng:q.lng}:null} showAnswer={confirmed}/>

      {/* Top header bar — collapses after guess */}
      <div style={{ position:"absolute", top:0, left:0, right:0, padding:"50px 16px 12px", background:"linear-gradient(to bottom,rgba(4,11,24,0.92) 0%,rgba(4,11,24,0) 100%)", pointerEvents:"none", transition:"opacity 0.4s ease, transform 0.4s ease", opacity:confirmed?0:1, transform:confirmed?"translateY(-20px)":"translateY(0)", pointerEvents:confirmed?"none":"all" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
          <div style={{ fontSize:20, fontWeight:800, background:"linear-gradient(135deg,#60a5fa,#34d399)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>PopGeo</div>
          <div style={{ display:"flex", alignItems:"center", gap:10, pointerEvents:"all" }}>
            <div style={{ display:"flex", gap:5 }}>
              {questions.map((_,i) => <div key={i} style={{ width:22, height:3, borderRadius:2, background:i<qIdx?"#22c55e":i===qIdx?"#3b82f6":"rgba(255,255,255,0.1)" }}/>)}
            </div>
            <span style={{ color:"#334155", fontSize:11 }}>{qIdx+1}/5</span>
            <button onClick={()=>setShowSettings(true)} style={{ background:"none", border:"none", color:"#334155", fontSize:16, cursor:"pointer", pointerEvents:"all" }}>⚙</button>
          </div>
        </div>

        {/* Question type badge */}
        <div style={{ display:"inline-block", background:"rgba(4,11,24,0.75)", border:`1px solid ${meta.border}`, borderRadius:20, padding:"3px 12px", fontSize:11, color:meta.color, fontFamily:"monospace", letterSpacing:"0.04em", marginBottom:6, backdropFilter:"blur(8px)" }}>
          {q.emoji} {meta.label}
        </div>

        {/* Clue */}
        <div style={{ background:"rgba(4,11,24,0.82)", backdropFilter:"blur(12px)", WebkitBackdropFilter:"blur(12px)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:"10px 14px", marginTop:4 }}>
          <div style={{ fontSize:14, lineHeight:1.55, color:"#e2e8f0", fontStyle:"italic" }}>
            "{q.clue}"
          </div>
        </div>
      </div>

      {/* Minimal post-guess top bar — shows after answer */}
      {confirmed && (
        <div style={{ position:"absolute", top:0, left:0, right:0, padding:"50px 16px 10px", background:"linear-gradient(to bottom,rgba(4,11,24,0.85) 0%,rgba(4,11,24,0) 100%)", pointerEvents:"none", transition:"opacity 0.4s ease", opacity:1 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div style={{ fontSize:18, fontWeight:800, background:"linear-gradient(135deg,#60a5fa,#34d399)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>PopGeo</div>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ display:"flex", gap:4 }}>
                {questions.map((_,i) => <div key={i} style={{ width:20, height:3, borderRadius:2, background:i<qIdx?"#22c55e":i===qIdx?"#3b82f6":"rgba(255,255,255,0.1)" }}/>)}
              </div>
              <span style={{ color:"#334155", fontSize:11 }}>{qIdx+1}/5</span>
              <button onClick={()=>setShowSettings(true)} style={{ background:"none", border:"none", color:"#334155", fontSize:15, cursor:"pointer", pointerEvents:"all" }}>⚙</button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom panel — hint or result */}
      <div style={{ position:"absolute", bottom:0, left:0, right:0, background:"linear-gradient(to top,rgba(4,11,24,0.97) 60%,rgba(4,11,24,0) 100%)", padding:"60px 16px 40px" }}>
        {!confirmed ? (
          <div style={{ maxWidth:480, margin:"0 auto" }}>
            <div style={{ textAlign:"center", color:"#1e3a5f", fontSize:12, letterSpacing:"0.05em", textTransform:"uppercase", marginBottom:10 }}>
              {guess ? "Pin placed — confirm when ready" : "Drag globe · Tap to place pin"}
            </div>
            <button onClick={handleConfirm} disabled={!guess} style={{ width:"100%", padding:14, borderRadius:10, fontSize:15, fontWeight:700, cursor:guess?"pointer":"not-allowed", background:guess?"linear-gradient(135deg,#1d4ed8,#2563eb)":"rgba(255,255,255,0.04)", color:guess?"#fff":"#1e3a5f", border:guess?"1px solid #3b82f6":"1px solid rgba(255,255,255,0.06)", transition:"all 0.2s", boxShadow:guess?"0 4px 20px rgba(29,78,216,0.4)":"none" }}>
              {guess ? "Confirm Guess ✓" : "Tap the globe to guess"}
            </button>
          </div>
        ) : (
          <div style={{ maxWidth:480, margin:"0 auto" }}>
            {/* Feedback + score */}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
              <div style={{ fontSize:16, fontWeight:700, color:feedback.color }}>{feedback.label}</div>
              <div style={{ textAlign:"right" }}>
                <span style={{ fontSize:26, fontWeight:800, color:scoreColor(lastScore) }}>{lastScore.toLocaleString()}</span>
                <span style={{ color:"#334155", fontSize:13 }}> / 1,000</span>
              </div>
            </div>

            {/* Score bar */}
            <div style={{ background:"rgba(255,255,255,0.05)", borderRadius:4, height:4, marginBottom:10, overflow:"hidden" }}>
              <div style={{ height:"100%", width:`${Math.round((lastScore/1000)*100)}%`, background:scoreColor(lastScore), borderRadius:4 }}/>
            </div>

            <div style={{ color:"#475569", fontSize:12, marginBottom:12 }}>{formatDist(lastDist,unit)} from the answer</div>

            {/* Answer blurb */}
            <div style={{ background:"rgba(4,11,24,0.85)", backdropFilter:"blur(12px)", WebkitBackdropFilter:"blur(12px)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:12, padding:"12px 16px", marginBottom:14 }}>
              <div style={{ color:"#475569", fontSize:10, textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:6 }}>Answer</div>
              <div style={{ color:"#f1f5f9", fontSize:17, fontWeight:700, marginBottom:6, letterSpacing:"-0.01em" }}>{q.answer}</div>
              <div style={{ width:32, height:2, background:"linear-gradient(90deg,#3b82f6,#22c55e)", borderRadius:2, marginBottom:8 }}/>
              <div style={{ color:"#94a3b8", fontSize:13, lineHeight:1.65, fontWeight:400 }}>{q.blurb}</div>
            </div>

            <button onClick={handleNext} style={{ width:"100%", padding:14, borderRadius:10, fontSize:15, fontWeight:700, background:"#166534", color:"#fff", border:"1px solid #22c55e", cursor:"pointer" }}>
              {qIdx<questions.length-1?"Next Question →":"See Results →"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
