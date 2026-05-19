import React, { useState, useEffect, useRef } from "react";
import { 
  Terminal, 
  TrendingUp, 
  Cpu, 
  Search, 
  Lightbulb, 
  Compass, 
  Radio, 
  Layers, 
  ExternalLink,
  ChevronRight,
  Database,
  ArrowRight,
  Info,
  CheckCircle2,
  GitBranch,
  Flame,
  Zap,
  BookOpen,
  X,
  Gauge,
  History,
  Code,
  FileUp,
  HelpCircle,
  Activity,
  Award
} from "lucide-react";

interface StartupOpportunity {
  title: string;
  description: string;
  targetUser: string;
  technicalComplexity: string;
  timeToBuilt: string;
}

interface TrajectoryTimeline {
  phase1: string;
  phase2: string;
  phase3: string;
  phase4: string;
}

interface Source {
  title: string;
  url: string;
}

interface ShadowTrend {
  id: string;
  title: string;
  tagline: string;
  category: string;
  momentumScore: number;
  confidenceScore: number;
  hypeVsSubstance: number;
  whyNow: string;
  industriesAffected: string[];
  startupOpportunities: StartupOpportunity[];
  trajectoryTimeline: TrajectoryTimeline;
  sources: Source[];
  themeColor: string;
}

export default function App() {
  // App states
  const [trends, setTrends] = useState<ShadowTrend[]>([]);
  const [selectedTrend, setSelectedTrend] = useState<ShadowTrend | null>(null);
  const [searchVal, setSearchVal] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isScanning, setIsScanning] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    "[SYSTEM] Nodes booted successfully. Listening on Port 3000.",
    "[SYSTEM] Telemetry hook initialized (UTC: 2026-05-19 19:35).",
    "[INGEST] Synced with fallback cognitive databases.",
    "[SUCCESS] Active scan ready. Select an edge seed or enter custom query."
  ]);
  const [showBlueprints, setShowBlueprints] = useState(false);
  const [scannedCount, setScannedCount] = useState(3);
  const [errorMessage, setErrorMessage] = useState("");
  const [showGuide, setShowGuide] = useState(true);

  // File drag & paste states
  const [pastedPayload, setPastedPayload] = useState("");
  const [dragActive, setDragActive] = useState(false);

  // Ref for auto-scrolling terminal logs
  const terminalBottomRef = useRef<HTMLDivElement>(null);

  // Fetch initial base trends
  useEffect(() => {
    fetch("/api/trends")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.trends) {
          setTrends(data.trends);
          setSelectedTrend(data.trends[0]);
        }
      })
      .catch((err) => {
        console.error("Error loading trends:", err);
        setTerminalLogs(prev => [...prev, `[ERROR] Failed to fetch initial seed trends: ${err.message}`]);
      });
  }, []);

  // Scroll to bottom of terminal
  useEffect(() => {
    if (terminalBottomRef.current) {
      terminalBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [terminalLogs]);

  // Categories list
  const categories = ["All", "AI & Infrastructure", "Hardware & Wearables", "Bio-Tech & Audio", "Decentralized Infrastructure"];

  // Handle Scan Request
  const handleScan = async (sectorTheme?: string) => {
    const queryTerm = (sectorTheme || searchVal || "emergent edge web technologies").trim();
    setIsScanning(true);
    setErrorMessage("");

    // Setup initial scans
    const initialLogs = [
      `[INGEST] Connecting to search-nodes for: "${queryTerm}"...`,
      `[INGEST] Spawning signal listeners on HackerNews API...`,
      `[INGEST] Scraping Reddit sub-forums r/indiehackers, r/selfhosted, r/biohacking, r/hardware...`,
      `[INGEST] Fetching latest pre-print Arxiv drafts in technology categorizations...`,
      `[INGEST] Parsing ProductHunt and GitHub top-trending repository commits...`
    ];

    // Cascade local logs
    setTerminalLogs(prev => [...prev, ...initialLogs]);

    try {
      const response = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sector: queryTerm, query: queryTerm })
      });

      const data = await response.json();
      
      if (data.status === "success") {
        const newTrend: ShadowTrend = data.trend;
        
        // Append scanning logs from backend if present
        if (data.logs && data.logs.length > 0) {
          setTerminalLogs(prev => [...prev, ...data.logs]);
        } else {
          setTerminalLogs(prev => [...prev, `[SUCCESS] Trend extracted successfully: "${newTrend.title}"`]);
        }

        // Add to active state if unique
        setTrends(prev => {
          const exists = prev.some(t => t.id === newTrend.id);
          if (exists) {
            return prev.map(t => t.id === newTrend.id ? newTrend : t);
          }
          return [newTrend, ...prev];
        });

        // Auto select the new trend
        setSelectedTrend(newTrend);
        setScannedCount(c => c + 1);
        setSearchVal("");
        setPastedPayload("");
      } else {
        throw new Error(data.message || "Failed Trend Extraction");
      }
    } catch (err: any) {
      setErrorMessage(`Scan dispatch disrupted: ${err.message || err}`);
      setTerminalLogs(prev => [
        ...prev,
        `[ERROR] Synthesis process aborted. Reason: ${err.message || "Endpoint error"}`
      ]);
    } finally {
      setIsScanning(false);
    }
  };

  // Drag-and-Drop file processing helpers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processTextFeedback = (text: string) => {
    // Extract potential tech buzzwords or first sentence
    const previewText = text.trim().substring(0, 100);
    // Find keywords
    const trimmed = text.replace(/[^a-zA-Z0-9\s]/g, "");
    const words = trimmed.split(/\s+/).filter(w => w.length > 5);
    const uniqueWords = Array.from(new Set(words)).slice(0, 4).join(" ");
    
    setTerminalLogs(prev => [
      ...prev,
      `[INGEST] Text payload detected (${text.length} characters). Extractions: "${uniqueWords || "custom segment"}"`
    ]);

    const finalQuery = uniqueWords ? `${uniqueWords} stack` : "emergent local data relays";
    setSearchVal(finalQuery);
    handleScan(finalQuery);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target && event.target.result) {
          const contents = event.target.result as string;
          setTerminalLogs(prev => [...prev, `[FILE-INGEST] Accepted transcript file: "${file.name}"`]);
          processTextFeedback(contents);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleManualPaste = () => {
    if (!pastedPayload.trim()) return;
    setTerminalLogs(prev => [...prev, `[PASTE-INGEST] Parsing manual clipboard cache...`]);
    processTextFeedback(pastedPayload);
  };

  // Pre-seed terms for fast scanning triggers
  const seedFilters = [
    { label: "DeSoc Infrastructure", value: "Decentralized social cryptography open keys" },
    { label: "WebAssembly AI", value: "Browser WebAssembly llama index inference" },
    { label: "Hacker Smart Glasses", value: "ESP32 monochromatic wearables HUD" },
    { label: "Cortisol Focus Monitors", value: "Realtime Oura cortisol focus music tracks" }
  ];

  // Colors mapping for styles
  const getColorClasses = (color: string) => {
    switch(color) {
      case "cyan":
        return {
          border: "border-cyan-500/30",
          bg: "bg-cyan-500/10",
          text: "text-cyan-400",
          shadow: "shadow-[0_0_15px_rgba(6,182,212,0.15)]",
          glow: "glow-cyan",
          accentBg: "bg-cyan-500",
          pulse: "bg-cyan-400",
          gaugeBg: "text-cyan-500"
        };
      case "emerald":
        return {
          border: "border-emerald-500/30",
          bg: "bg-emerald-500/10",
          text: "text-emerald-400",
          shadow: "shadow-[0_0_15px_rgba(16,185,129,0.15)]",
          glow: "glow-emerald",
          accentBg: "bg-emerald-500",
          pulse: "bg-emerald-400",
          gaugeBg: "text-emerald-500"
        };
      case "violet":
        return {
          border: "border-violet-500/30",
          bg: "bg-violet-500/10",
          text: "text-violet-400",
          shadow: "shadow-[0_0_15px_rgba(139,92,246,0.15)]",
          glow: "glow-violet",
          accentBg: "bg-violet-500",
          pulse: "bg-violet-400",
          gaugeBg: "text-violet-500"
        };
      case "amber":
        return {
          border: "border-amber-500/30",
          bg: "bg-amber-500/10",
          text: "text-amber-400",
          shadow: "shadow-[0_0_15px_rgba(245,158,11,0.15)]",
          glow: "glow-amber",
          accentBg: "bg-amber-500",
          pulse: "bg-amber-400",
          gaugeBg: "text-amber-500"
        };
      case "rose":
      default:
        return {
          border: "border-rose-500/30",
          bg: "bg-rose-500/10",
          text: "text-rose-400",
          shadow: "shadow-[0_0_15px_rgba(244,63,94,0.15)]",
          glow: "glow-rose",
          accentBg: "bg-rose-500",
          pulse: "bg-rose-400",
          gaugeBg: "text-rose-500"
        };
    }
  };

  const activeColor = selectedTrend ? getColorClasses(selectedTrend.themeColor) : getColorClasses("cyan");

  // Filtering trends by category selection
  const filteredTrends = trends.filter(trend => {
    if (selectedCategory === "All") return true;
    return trend.category.toLowerCase().includes(selectedCategory.toLowerCase().split(" ")[0]);
  });

  // Decide substance marker badge
  const getSubstanceStatus = (score: number) => {
    if (score < 20) return { label: "SLEEPING GIANT", class: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30" };
    if (score < 45) return { label: "SOLID SUBSTANCE", class: "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30" };
    return { label: "MARKET HYPED WAVE", class: "bg-rose-500/15 text-rose-400 border border-rose-500/30" };
  };

  return (
    <div className="relative min-h-screen bg-[#05070a] text-slate-100 font-sans scanline overflow-y-auto">
      {/* Background cyber grid */}
      <div className="absolute inset-0 cyber-grid pointer-events-none z-0"></div>

      {/* GLOBAL SYSTEM BAR */}
      <header className="sticky top-0 z-40 bg-[#070b13]/95 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex flex-wrap items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-cyan-950/50 border border-cyan-500/50">
            <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
            <div className="absolute top-0 right-0 w-2 h-2 rounded-full bg-cyan-400 pulse-dot"></div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-bold tracking-tight font-sans text-white">SHADOW TRENDS AI</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">HACKATHON BUILD</span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">Emergent Internet Signals Detector & Opportunity Matrix Generator</p>
          </div>
        </div>

        {/* Telemetry dashboard headers */}
        <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono mt-2 sm:mt-0">
          <div className="bg-[#0b101d] px-3 py-1.5 rounded border border-slate-800">
            <span className="text-slate-500">SYS_CORES:</span>{" "}
            <span className="text-cyan-400">14 LIVE</span>
          </div>
          <div className="bg-[#0b101d] px-3 py-1.5 rounded border border-slate-800">
            <span className="text-slate-500">SENSORS:</span>{" "}
            <span className="text-violet-400">{scannedCount} INDEXED</span>
          </div>
          <button 
            id="blueprint-toggle-btn"
            onClick={() => setShowBlueprints(!showBlueprints)}
            className="flex items-center space-x-1.5 px-4 py-1.5 rounded bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)] cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>PITCH BLUEPRINTS</span>
          </button>
        </div>
      </header>

      {/* QUICK ONBOARDING GUIDE STREAM */}
      {showGuide && (
        <div className="bg-[#0c1425] border-b border-cyan-500/20 px-6 py-4 flex items-center justify-between relative overflow-hidden">
          <div className="absolute inset-0 bg-cyan-500/5 pointer-events-none"></div>
          <div className="flex items-start space-x-3.5 max-w-4xl relative z-10">
            <div className="p-2 rounded-lg bg-cyan-500/15 border border-cyan-500/30 shrink-0 mt-0.5">
              <Award className="w-5 h-5 text-cyan-400 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <span>⚡ Quick Hackathon Interactive Demo Guide</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-cyan-500/20 text-cyan-400 rounded-full">3 Easy Steps</span>
              </h3>
              
              {/* Detailed flow explanation to simplify the Bloomberg Dashboard experience */}
              <div className="grid md:grid-cols-3 gap-4 mt-2.5 text-xs text-slate-300">
                <div className="flex items-start gap-2 bg-[#05070a]/75 p-2 rounded border border-slate-800">
                  <span className="font-mono text-cyan-400 font-bold text-sm">💡 1:</span>
                  <p><strong>Click a Seed Badglet</strong> or paste transcript text to establish a telemetry target in the system input.</p>
                </div>
                <div className="flex items-start gap-2 bg-[#05070a]/75 p-2 rounded border border-slate-800">
                  <span className="font-mono text-cyan-400 font-bold text-sm">⛽ 2:</span>
                  <p><strong>Dispatch Crawler Agents</strong>. It runs a deep AI Search Grounding synthesis to build the Trend on-the-fly!</p>
                </div>
                <div className="flex items-start gap-2 bg-[#05070a]/75 p-2 rounded border border-slate-800">
                  <span className="font-mono text-cyan-400 font-bold text-sm">🏆 3:</span>
                  <p><strong>Study Opportunity details</strong>. Scroll the right panel to extract generated startup plans, paths, and raw feeds.</p>
                </div>
              </div>
            </div>
          </div>
          <button 
            onClick={() => setShowGuide(false)}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded shrink-0 self-start z-10 cursor-pointer ml-4"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* MAIN CONTAINER */}
      <main className="relative z-10 max-w-[1600px] mx-auto p-4 lg:grid lg:grid-cols-12 lg:gap-4">
        
        {/* LEFT COLUMN: SEED DISCOVERY & TRANSMISSION FEED INGESTION */}
        <section id="scanner-section" className="lg:col-span-4 space-y-4 mb-4 lg:mb-0">
          
          {/* Signal Ingestion Module Card */}
          <div className="bg-[#0a0f1d] border border-slate-800 rounded-xl overflow-hidden shadow-lg">
            <div className="bg-slate-900/80 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Cpu className="w-4 h-4 text-cyan-400" />
                <h2 className="text-xs font-bold uppercase tracking-wider font-mono text-cyan-400">Step 1: Signal Targeting</h2>
              </div>
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 pulse-dot"></span>
            </div>

            <div className="p-4 space-y-4">
              <p className="text-xs text-slate-400 leading-relaxed">
                Choose a suggested focus field below, enter custom terms, or drop a logs transcript directly to seed our autonomous agents.
              </p>

              {/* Direct search input */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-mono text-slate-500 uppercase">Target Signal Keywords</label>
                <div className="relative">
                  <input
                    id="scanner-search-input"
                    type="text"
                    placeholder="e.g. Decentralized local browsers, bio-rings..."
                    value={searchVal}
                    onChange={(e) => setSearchVal(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleScan()}
                    className="w-full bg-[#05070a] border border-slate-800 rounded-lg py-2.5 pl-3 pr-10 text-xs font-mono text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/70 focus:ring-1 focus:ring-cyan-500/30"
                  />
                  <button 
                    id="scanner-search-btn"
                    onClick={() => handleScan()}
                    disabled={isScanning}
                    className="absolute right-1 text-slate-400 hover:text-cyan-400 p-1.5 transition-colors top-1/2 -translate-y-1/2 cursor-pointer"
                  >
                    <Search className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Quick Preset Badges */}
              <div className="space-y-2">
                <span className="block text-[11px] font-mono text-slate-500 uppercase">Instant Signal Presets</span>
                <div className="grid grid-cols-2 gap-2">
                  {seedFilters.map((seed, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setSearchVal(seed.value);
                        handleScan(seed.value);
                      }}
                      disabled={isScanning}
                      className="text-left p-2.5 rounded-lg bg-[#070b13] border border-slate-800/80 hover:border-cyan-500/40 hover:bg-slate-900/60 transition-all text-[11px] font-mono flex items-start space-x-1 cursor-pointer disabled:opacity-50"
                    >
                      <ChevronRight className="w-3 h-3 text-cyan-500 shrink-0 mt-0.5" />
                      <span className="text-slate-300 line-clamp-1">{seed.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* DRAG AND DROP OR COPY INJECT TRANSMISSION (Usability guidelines) */}
              <div className="border border-dashed border-slate-800 rounded-lg p-3 bg-slate-950/40 text-center space-y-2.5">
                <div 
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`border border-transparent rounded p-2 transition-colors ${dragActive ? 'bg-cyan-500/10 border-cyan-500/40' : ''}`}
                >
                  <FileUp className="w-5 h-5 mx-auto text-slate-500 mb-1" />
                  <p className="text-[10px] text-slate-400 font-mono">
                    Drag & Drop signal transcription, file (.txt), or paste blog posts here
                  </p>
                </div>

                <div className="relative">
                  <textarea
                    rows={2}
                    placeholder="Paste technical logs or article snippets here to auto-analyze..."
                    value={pastedPayload}
                    onChange={(e) => setPastedPayload(e.target.value)}
                    className="w-full bg-[#05070a] border border-slate-800 rounded p-2 text-[10.5px] font-mono text-slate-300 placeholder:text-slate-650 focus:outline-none focus:border-cyan-500/60"
                  />
                  {pastedPayload && (
                    <button
                      onClick={handleManualPaste}
                      disabled={isScanning}
                      className="mt-1. w-full py-1 px-2.5 bg-slate-900 border border-slate-700 hover:border-cyan-500/40 rounded text-[10px] font-mono text-cyan-400 hover:text-white transition-colors cursor-pointer"
                    >
                      EXTRACT PATHS & SCAN NOW
                    </button>
                  )}
                </div>
              </div>

              {/* Primary Dispatch Action */}
              <div className="pt-1.5">
                <span className="block text-[10px] font-mono text-slate-500 uppercase tracking-widest text-center mb-1.5">Step 2: Initialize Agent</span>
                <button
                  id="dispatch-btn"
                  onClick={() => handleScan()}
                  disabled={isScanning}
                  className="w-full flex items-center justify-center space-x-2 py-3 bg-gradient-to-r from-cyan-600 to-indigo-600 text-slate-950 hover:from-cyan-500 hover:to-indigo-500 rounded-lg text-xs font-bold tracking-wider uppercase transition-all shadow-[0_0_20px_rgba(6,182,212,0.25)] hover:shadow-[0_0_25px_rgba(6,182,212,0.4)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isScanning ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                      <span>CRAWLING LIVE TELEMETRY...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 fill-current text-slate-950" />
                      <span>DISPATCH AUTONOMOUS AGENTS</span>
                    </>
                  )}
                </button>
              </div>

              {errorMessage && (
                <div className="p-2.5 rounded bg-red-500/10 border border-red-500/30 text-[11px] text-red-400 font-mono">
                  {errorMessage}
                </div>
              )}
            </div>
          </div>

          {/* Terminal Console Stream Card */}
          <div className="bg-[#0a0f1d] border border-slate-800 rounded-xl overflow-hidden shadow-lg h-[240px] flex flex-col">
            <div className="bg-slate-900/80 px-4 py-2 border-b border-slate-800 flex items-center space-x-2 justify-between">
              <div className="flex items-center space-x-2">
                <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[10.5px] font-mono uppercase tracking-wider font-bold text-slate-400">Live Agent Telemetry Stream</span>
              </div>
              <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-1 py-0.5 rounded border border-emerald-500/20 uppercase tracking-widest animate-pulse">STREAMING</span>
            </div>

            <div className="p-3 bg-[#04060b] flex-1 overflow-y-auto font-mono text-[10px] space-y-1.5 scrollbar">
              {terminalLogs.map((log, index) => {
                let colorClass = "text-slate-400";
                if (log.includes("[ERROR]")) colorClass = "text-rose-400 font-semibold";
                if (log.includes("[SUCCESS]")) colorClass = "text-emerald-400 font-bold";
                if (log.includes("[INGEST]")) colorClass = "text-cyan-400";
                if (log.includes("[AGENT-AI]")) colorClass = "text-violet-400 font-medium";
                if (log.includes("[PERSIST]")) colorClass = "text-amber-400";
                if (log.includes("[WARN]")) colorClass = "text-amber-500 font-semibold";
                
                return (
                  <div key={index} className="log-row flex items-start space-x-1.5">
                    <span className="text-slate-600 shrink-0 select-none">&gt;</span>
                    <span className={`${colorClass} leading-tight`}>{log}</span>
                  </div>
                );
              })}
              <div ref={terminalBottomRef} />
            </div>
          </div>

        </section>

        {/* MIDDLE COLUMN: CLASSIFIED STREAM FEED & MATRIX INDICATORS */}
        <section id="trends-grid-section" className="lg:col-span-4 space-y-4 mb-4 lg:mb-0">
          
          <div className="bg-[#0a0f1d] border border-slate-800 p-3 rounded-xl">
            <span className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-2">Step 3: Dive Into Findings Matrix</span>
            {/* Filter Categories tab list */}
            <div className="flex items-center space-x-1 overflow-x-auto scrollbar pb-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono whitespace-nowrap cursor-pointer transition-all ${
                    selectedCategory === cat 
                      ? "bg-[#1e293b] text-white font-bold border border-slate-700" 
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Trend Cards feed */}
          <div className="space-y-3">
            {filteredTrends.length === 0 ? (
              <div className="bg-[#0a0f1d] border border-slate-800 p-8 rounded-xl text-center space-y-2">
                <Compass className="w-8 h-8 text-slate-600 mx-auto animate-bounce" />
                <h3 className="text-sm font-semibold text-slate-300">No signals registered</h3>
                <p className="text-xs text-slate-500">Try running a scan or changing classification filters.</p>
              </div>
            ) : (
              filteredTrends.map((trend) => {
                const isSelected = selectedTrend?.id === trend.id;
                const colors = getColorClasses(trend.themeColor);
                const subStatus = getSubstanceStatus(trend.hypeVsSubstance);

                return (
                  <div
                    key={trend.id}
                    onClick={() => setSelectedTrend(trend)}
                    className={`relative p-4 rounded-xl border cursor-pointer transition-all ${
                      isSelected 
                        ? `${colors.border} ${colors.bg} ${colors.shadow} ring-1 ring-offset-0` 
                        : "border-slate-800/80 bg-[#0a0f1d] hover:border-slate-700 hover:bg-slate-900/60"
                    }`}
                  >
                    {/* Upper Badges Row with absolute colors */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">{trend.category}</span>
                      <div className="flex items-center space-x-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${colors.pulse} pulse-dot`}></span>
                        <span className={`text-[10px] font-mono font-bold ${colors.text}`}>#{trend.momentumScore} MOMENTUM</span>
                      </div>
                    </div>

                    <h3 className="text-sm font-bold text-white mb-1 font-sans">{trend.title}</h3>
                    <p className="text-xs text-slate-400 leading-snug mb-3 font-mono text-[11px] line-clamp-2">{trend.tagline}</p>

                    {/* Highly intuitive visual progress meters (Replaces flat text labels with Bloomberg-style loadlines) */}
                    <div className="space-y-2 pt-2.5 border-t border-slate-800/60">
                      
                      {/* Momentum indicator */}
                      <div>
                        <div className="flex justify-between text-[9px] font-mono text-slate-400 mb-0.5">
                          <span>TELEMETRY MOMENTUM:</span>
                          <span className={`${colors.text} font-bold`}>{trend.momentumScore}%</span>
                        </div>
                        <div className="w-full h-1 bg-[#05070a] rounded-full overflow-hidden">
                          <div className={`h-full ${colors.accentBg} transition-all duration-500`} style={{ width: `${trend.momentumScore}%` }}></div>
                        </div>
                      </div>

                      {/* Confidence / Quality rating */}
                      <div>
                        <div className="flex justify-between text-[9px] font-mono text-slate-400 mb-0.5">
                          <span>AGENT TRUST QUALITY:</span>
                          <span className="text-slate-200 font-bold">{trend.confidenceScore}%</span>
                        </div>
                        <div className="w-full h-1 bg-[#05070a] rounded-full overflow-hidden">
                          <div className="h-full bg-violet-500 transition-all duration-500" style={{ width: `${trend.confidenceScore}%` }}></div>
                        </div>
                      </div>

                      {/* Substance type pill */}
                      <div className="flex items-center justify-between pt-1 text-[9px] font-mono">
                        <span className="text-slate-500">SIGNAL SECTORS: {trend.sources.length} SOURCES</span>
                        <span className={`px-1.5 py-0.5 rounded text-[8.5px] font-bold ${subStatus.class}`}>
                          {subStatus.label}
                        </span>
                      </div>

                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Interactive scatter-dot live clusters heatmap visualization */}
          <div className="bg-[#0a0f1d] border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-violet-400" />
                <span className="text-xs font-bold uppercase font-mono text-slate-300">Shadow Node Coordinates Map</span>
              </div>
              <span className="text-[9px] font-mono text-slate-500">CONVERGENCE MATRIX</span>
            </div>

            {/* Custom interactive scatter-dot wireframe with interactive tooltip on how to operate */}
            <div className="relative h-44 rounded-lg bg-[#05070a] border border-slate-800 overflow-hidden">
              {/* background axis lines */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-full h-[1px] bg-slate-900"></div>
              </div>
              <div className="absolute inset-0 flex justify-center">
                <div className="h-full w-[1px] bg-slate-900"></div>
              </div>

              {/* Quadrant labels */}
              <div className="absolute top-2 left-2 text-[8px] font-mono text-slate-650">HIGH COOPERATIVE / SILENT SENSING</div>
              <div className="absolute top-2 right-2 text-[8px] font-mono text-slate-650">MASS MARKET SCALE</div>
              <div className="absolute bottom-2 left-2 text-[8px] font-mono text-slate-650">HACKERS DIY SPACE</div>
              <div className="absolute bottom-2 right-2 text-[8px] font-mono text-slate-650">SPURIOUS HYPERS</div>

              {/* Map actual loaded trends as shiny scatter dots */}
              {trends.map((item, id) => {
                const yPos = 100 - item.confidenceScore; // Percentage from top
                const xPos = item.momentumScore;       // Percentage from left
                const colors = getColorClasses(item.themeColor);
                const isFocused = selectedTrend?.id === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => setSelectedTrend(item)}
                    className="absolute group -translate-x-1/2 -translate-y-1/2 transition-all p-1.5 cursor-pointer z-20"
                    style={{ top: `${yPos}%`, left: `${xPos}%` }}
                    title={item.title}
                  >
                    <span className="relative flex h-4 w-4">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-60 ${colors.pulse}`}></span>
                      <span className={`relative inline-flex rounded-full h-4 w-4 border border-white/50 ${isFocused ? `${colors.accentBg} scale-125 ring-2 ring-white/25` : 'bg-slate-700'} transition-all`}></span>
                    </span>
                    
                    {/* tooltip details showing what is clicked */}
                    <div className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 bg-[#0d1322] border border-slate-700 px-2 py-1 rounded text-[8px] text-white font-mono opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity z-30 shadow-md">
                      {item.title} ({item.momentumScore} Mo)
                    </div>
                  </button>
                );
              })}
            </div>
            
            <div className="flex items-center justify-between text-[9px] font-mono text-slate-500">
              <span>&lt;- LOWER TRACTION</span>
              <span>EXPONENTIAL DISRUPTORS -&gt;</span>
            </div>
          </div>

        </section>

        {/* RIGHT COLUMN: CORE SIGNAL INTELLIGENCE & OPPORTUNITIES */}
        <section id="intelligence-section" className="lg:col-span-4 space-y-4">
          
          {selectedTrend ? (
            <div className="bg-[#0a0f1d] border border-slate-800 rounded-xl overflow-hidden shadow-xl">
              
              {/* Header card with distinct brand border */}
              <div className={`p-4 border-b border-rose-500/10 bg-[#070b13] relative overflow-hidden`}>
                {/* Background colored blur glow */}
                <div className={`absolute top-0 right-0 w-32 h-32 rounded-full filter blur-3xl opacity-10 ${activeColor.pulse}`}></div>

                <div className="flex items-center space-x-2 mb-2 relative z-10">
                  <span className="text-[10px] font-mono uppercase bg-[#1e293b] px-2 py-1 rounded text-slate-350 tracking-wider">
                    {selectedTrend.category}
                  </span>
                  <span className="text-[10px] font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded uppercase font-bold">
                    SIGNAL DIRECTORY_ID: {selectedTrend.id.substring(0, 8)}
                  </span>
                </div>

                <h2 className="text-xl font-bold font-sans tracking-tight text-white mb-2 leading-tight relative z-10">
                  {selectedTrend.title}
                </h2>
                <p className={`text-xs font-mono ${activeColor.text} leading-snug relative z-10`}>
                  {selectedTrend.tagline}
                </p>
              </div>

              {/* Tab section contain details */}
              <div className="p-4 space-y-4 font-mono">
                
                {/* ADVANCED VISUAL HYP-O-METER CHASSIS */}
                <div className="p-3 bg-[#05070a] rounded-lg border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">HYPE-VS-SUBSTANCE RATIO DIAL</span>
                    <span className="text-[10.5px] font-bold py-0.5 px-2 rounded-full text-slate-200 bg-slate-900 border border-slate-800">
                      {selectedTrend.hypeVsSubstance}% Hype
                    </span>
                  </div>

                  {/* Segmented slider to show visually where it sits */}
                  <div className="grid grid-cols-10 gap-1 mt-1">
                    {Array.from({ length: 10 }).map((_, stepIdx) => {
                      const limit = (stepIdx + 1) * 10;
                      const active = selectedTrend.hypeVsSubstance >= limit;
                      // Determine coloring representing risk/hype
                      let barColor = "bg-emerald-500";
                      if (selectedTrend.hypeVsSubstance > 35) barColor = "bg-amber-500";
                      if (selectedTrend.hypeVsSubstance > 60) barColor = "bg-rose-500";

                      return (
                        <div 
                          key={stepIdx} 
                          className={`h-2 rounded-sm transition-all duration-300 ${active ? barColor : "bg-slate-850"}`} 
                          title={`Hype segment ${limit}%`}
                        />
                      );
                    })}
                  </div>

                  <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                    <span>SLEEPING GIANT (0%)</span>
                    <span>MID GROUND</span>
                    <span>HEAVILY HYPED (100%)</span>
                  </div>
                </div>

                {/* 1. WHY NOW */}
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center space-x-1.5 font-bold uppercase text-slate-350">
                    <Compass className="w-3.5 h-3.5 text-cyan-400" />
                    <span>\"Why Now?\" Macro Catalyst Analysis</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed bg-[#05070a] p-3 rounded-lg border border-slate-800/80 font-mono">
                    {selectedTrend.whyNow}
                  </p>
                </div>

                {/* 2. INDUSTRIES AFFECTED */}
                <div className="space-y-1.5 text-xs">
                  <div className="font-bold uppercase text-slate-350 flex items-center space-x-1.5">
                    <Layers className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Disrupted Sectors</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedTrend.industriesAffected.map((ind, idx) => (
                      <span key={idx} className="bg-slate-900 text-slate-300 border border-slate-800 px-2 py-1 rounded text-[10px] font-mono">
                        {ind}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 3. STARTUP OPPORTUNITY GENERATOR */}
                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5 font-bold uppercase text-slate-350">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                      <span>Pitch Concept Node Ideas</span>
                    </div>
                    <span className="text-[9px] font-mono bg-amber-500/15 text-amber-400 px-1.5 py-0.5 rounded uppercase tracking-wider font-bold border border-amber-500/20">PREPARED PLANS</span>
                  </div>

                  <div className="space-y-2.5">
                    {selectedTrend.startupOpportunities.map((opp, idx) => (
                      <div key={idx} className="bg-gradient-to-br from-[#0c1424] to-[#080d19] border border-slate-800 p-3.5 rounded-lg relative overflow-hidden">
                        <div className="flex justify-between items-start mb-1.5">
                          <h4 className="text-xs font-bold text-amber-400 font-mono tracking-tight flex items-center space-x-1">
                            <Zap className="w-3 h-3 text-amber-500 fill-current" />
                            <span>{opp.title}</span>
                          </h4>
                          <span className="text-[9px] font-mono bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded text-slate-300">
                            TTB: {opp.timeToBuilt}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed mb-2.5 font-sans">
                          {opp.description}
                        </p>
                        <div className="grid grid-cols-2 gap-2 text-[9px] font-mono text-slate-400 border-t border-slate-800/55 pt-2">
                          <div>
                            <span className="text-slate-550 block uppercase text-[8px]">TARGET SEGMENT:</span>
                            <span className="text-slate-200 line-clamp-1">{opp.targetUser}</span>
                          </div>
                          <div>
                            <span className="text-slate-550 block uppercase text-[8px]">DEV COMPLEXITY:</span>
                            <span className="text-slate-200 block">{opp.technicalComplexity}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. PREDICTED TRAJECTORY TIMELINE */}
                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center space-x-1.5 font-bold uppercase text-slate-350">
                    <History className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Predicted Signal Evolution Trajectory</span>
                  </div>

                  {/* Horizontal visual line of timeline */}
                  <div className="space-y-3 p-3 bg-[#05070a] border border-slate-800/80 rounded-lg">
                    <div className="space-y-2.5">
                      <div className="text-[11px] leading-relaxed">
                        <span className="text-cyan-400 font-mono font-bold block mb-0.5">🚀 PHASE 1: SIGNS ON HORIZON (Origin)</span>
                        <span className="text-slate-400 line-clamp-2 hover:line-clamp-none transition-all cursor-help">{selectedTrend.trajectoryTimeline.phase1}</span>
                      </div>
                      <div className="text-[11px] leading-relaxed border-t border-slate-900 pt-2">
                        <span className="text-emerald-400 font-mono font-bold block mb-0.5">📈 PHASE 2: CURRENT SIGNAL FREQUENCY</span>
                        <span className="text-slate-400 line-clamp-2 hover:line-clamp-none transition-all cursor-help">{selectedTrend.trajectoryTimeline.phase2}</span>
                      </div>
                      <div className="text-[11px] leading-relaxed border-t border-slate-900 pt-2">
                        <span className="text-violet-400 font-mono font-bold block mb-0.5">🔥 PHASE 3: FUTURE SCALING MILESTONE</span>
                        <span className="text-slate-400 line-clamp-2 hover:line-clamp-none transition-all cursor-help">{selectedTrend.trajectoryTimeline.phase3}</span>
                      </div>
                      <div className="text-[11px] leading-relaxed border-t border-slate-900 pt-2">
                        <span className="text-amber-400 font-mono font-bold block mb-0.5">🌟 PHASE 4: UBIQUITOUS CONVERGENCE</span>
                        <span className="text-slate-400 line-clamp-2 hover:line-clamp-none transition-all cursor-help">{selectedTrend.trajectoryTimeline.phase4}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 5. GROUNDINGS */}
                <div className="space-y-1.5 text-xs">
                  <span className="block text-[11px] text-slate-500 uppercase tracking-widest">Referenced Grounded Nodes:</span>
                  <div className="space-y-1.5">
                    {selectedTrend.sources.map((src, i) => (
                      <a
                        key={i}
                        href={src.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between p-2 rounded bg-slate-900 hover:bg-slate-850 text-[11px] text-cyan-400 border border-slate-800 transition-colors"
                      >
                        <span className="line-clamp-1 font-mono text-slate-350">{src.title}</span>
                        <ExternalLink className="w-3 h-3 text-slate-500 hover:text-cyan-400 inline shrink-0 ml-2" />
                      </a>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          ) : (
            <div className="bg-[#0a0f1d] border border-slate-800 rounded-xl p-8 text-center space-y-3 h-96 flex flex-col justify-center items-center">
              <Compass className="w-12 h-12 text-slate-700 animate-spin" />
              <h3 className="text-sm font-semibold text-slate-300">Synchronizing Signals</h3>
              <p className="text-xs text-slate-500 max-w-xs">Select or search to analyze custom niche trajectories.</p>
            </div>
          )}

        </section>
      </main>

      {/* PITCH BLUEPRINT MODAL OVERLAY (WOW FACTOR JUDGE SPEC) */}
      {showBlueprints && (
        <div id="blueprints-modal" className="fixed inset-0 bg-[#05070a]/95 backdrop-blur-md z-50 overflow-y-auto p-4 md:p-8 animate-fade-in">
          <div className="max-w-5xl mx-auto bg-[#0a0f1d] border border-slate-700 rounded-2xl shadow-2xl relative overflow-hidden">
            
            {/* Header top controls */}
            <div className="bg-slate-900/80 border-b border-slate-700 p-6 flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <Database className="w-6 h-6 text-cyan-400" />
                <div>
                  <h2 className="text-xl font-bold font-sans text-white tracking-tight">SHADOW TRENDS ARCHIVAL BLUEPRINT</h2>
                  <p className="text-xs text-cyan-400 font-mono">The Ultimate 24-Hour Hackathon Startup Architecture Blueprint & Spec</p>
                </div>
              </div>
              <button 
                id="close-blueprints-btn"
                onClick={() => setShowBlueprints(false)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 md:p-8 space-y-8 font-sans">
              
              {/* Introduction Overview Grid */}
              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center space-x-1.5 text-cyan-400 font-mono font-bold text-sm">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>1. CORE VISION</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Shadow Trends AI acts like a <strong>Bloomberg Terminal for future internet trends</strong>, pinpointing sub-culture spikes and early adoption signals across HackerNews, Reddit discussions, GitHub commits, and Arxiv papers before general indexes catch on.
                  </p>
                </div>
                
                <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center space-x-1.5 text-emerald-400 font-mono font-bold text-sm">
                    <GitBranch className="w-4 h-4" />
                    <span>2. THE WOW FACTOR</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    The autonomous agent monitors live sources using <strong>Gemini 3.5 AI grounded search query routers</strong>, synthesizing structured telemetry on-the-fly and generating practical startup opportunity concepts tailored to developers who want to ship fast.
                  </p>
                </div>

                <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center space-x-1.5 text-violet-400 font-mono font-bold text-sm">
                    <Flame className="w-4 h-4" />
                    <span>3. HACKATHON FOCUS</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    We omit unnecessary microservice mesh complexity, using lightweight serverless edge routes, pre-primed cognitive models, and localized SVG charts that load on milliseconds to optimize user experience.
                  </p>
                </div>
              </div>

              {/* SECTION: SYSTEM ARCHITECTURE */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold font-mono tracking-wider text-white uppercase border-b border-slate-800 pb-2">
                  [NODE.JS AGENT & INGESTION FLOW DIAGRAM]
                </h3>
                <div className="bg-[#05070a] border border-slate-800 p-6 rounded-xl font-mono text-[11px] text-cyan-400 overflow-x-auto leading-relaxed">
{`                              [ CLIENT TERMINAL UI ] 
                                      │
                     Scan triggers ───┼─── Search Val / Seed Selects
                                      ▼
                        [ EXPRESS /API/SCAN ENGINE ]
                                      │
                                      ▼
               ┌──────────────────────┴──────────────────────┐
               │         AUTONOMOUS GEMINI TREND ROUTER       │
               │  - Live Google Search Grounding             │
               │  - Reddit, HN, GitHub Scrape Synthesis      │
               └──────────────────────┬──────────────────────┘
                                      │  (Extract Structured Schema)
                                      ▼
             ┌────────────────────────┴────────────────────────┐
             │            TREND SYNTHESIS EMBEDDING SYSTEM     │
             │  - Classifies signal momentum index (40-98%)    │
             │  - Projects market trajectory milestones        │
             │  - Synthesizes 2x concrete startup concept ideas│
             └────────────────────────┬────────────────────────┘
                                      │
                                      ▼
                            [ JSON RENDERING OUTLET ]
                                      │
                                      ▼
                           [ INTERACTIVE HEATMAP UI ]`}
                </div>
              </div>

              {/* TABS OF TECHNICAL SPECIFICATIONS */}
              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest mb-2">[Database Schema Spec- ClickHouse / Postgres]</h4>
                  <p className="text-slate-350 text-xs mb-3 font-sans">Storing internet feeds and extracted signal nodes dynamically for temporal trend mapping. Our exact 24-Hour SQL relational schema:</p>
                  <pre className="p-4 bg-[#05070a] rounded-lg text-[11px] font-mono border border-slate-800 text-cyan-300 overflow-x-auto">
{`CREATE TABLE shadow_trends (
  id VARCHAR(100) PRIMARY KEY,
  title VARCHAR(150) NOT NULL,
  tagline VARCHAR(255),
  category VARCHAR(50),
  momentum_score INT CHECK (momentum_score BETWEEN 0 AND 100),
  confidence_score INT CHECK (confidence_score BETWEEN 0 AND 100),
  hype_ratio INT,
  why_now TEXT,
  industries_affected TEXT[], -- Arrays
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE startup_opportunities (
  id SERIAL PRIMARY KEY,
  trend_id VARCHAR(100) REFERENCES shadow_trends(id) ON DELETE CASCADE,
  title VARCHAR(150),
  description TEXT,
  target_user VARCHAR(150),
  technical_complexity VARCHAR(20),
  time_to_build VARCHAR(50)
);`}
                  </pre>
                </div>

                <div>
                  <h4 className="text-xs font-mono font-bold text-violet-400 uppercase tracking-widest mb-2 font-sans">[Exact Gemini AI Structured System Instruction]</h4>
                  <p className="text-slate-350 text-xs mb-3">Below is the core system instruction used in the backend `server.ts` to instruct Gemini with search groundings, making sure it returns perfectly structured JSON and highly compelling startup ideas:</p>
                  <pre className="p-4 bg-[#05070a] rounded-lg text-[11px] font-mono border border-slate-800 text-cyan-300 overflow-x-auto whitespace-pre-wrap">
{`You are the lead startup architect and AI trends expert behind Shadow Trends AI.
Your goal is to parse search grounded results for target sector to identify the MOST early-stage, "weak-signal" emerging trend that is NOT yet mainstream but showing recurring mentions across HackerNews, Reddit, GitHub, or academic circles.

Provide exactly ONE cohesive and visually impressive "Shadow Trend" that emerges from your search. This should feel futuristic, technical, and startup-ready.
You MUST respond in clean, valid JSON matching this schema:
{
  "id": "slugified-trend-title",
  "title": "A compelling, distinct industry name for the trend",
  "tagline": "One-line punchy hook",
  "category": "Broad industry category",
  "momentumScore": integer from 40 to 98,
  "confidenceScore": integer,
  "hypeVsSubstance": integer,
  "whyNow": "Detailed paragraph explaining the macro catalysts",
  "industriesAffected": ["Sector1", "Sector2"],
  "startupOpportunities": [ ... ]
}`}
                  </pre>
                </div>

              </div>

              {/* FOOTER */}
              <div className="bg-[#05070a] p-6 flex items-center justify-between border-t border-slate-800 rounded-lg">
                <span className="text-xs text-slate-500 font-mono">CODEBASE STATUS : SUCCESS COMPILATION</span>
                <button
                  onClick={() => setShowBlueprints(false)}
                  className="px-5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-350 text-xs font-semibold border border-slate-705 transition-colors cursor-pointer"
                >
                  Return to Dashboard
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* FOOTER SYSTEM STATUS BAR */}
      <footer className="relative z-10 max-w-[1600px] mx-auto p-4 flex flex-col md:flex-row items-center justify-between border-t border-slate-850 text-slate-500 text-[11px] font-mono mt-8">
        <div>
          <span>© 2026 SHADOW_TRENDS // DEEP SPACE COGNITIVE NODE GATEWAY ALPHA</span>
        </div>
        <div className="flex items-center space-x-4 mt-2 md:mt-0">
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 pulse-dot inline-block"></span>
            <span className="text-emerald-400">GEMINI_API_ENGAGE: ON</span>
          </span>
          <span className="text-slate-400 hover:text-white transition-colors cursor-pointer" onClick={() => setShowBlueprints(true)}>
            [ VIEW ARCHITECT DECK ]
          </span>
        </div>
      </footer>
    </div>
  );
}
