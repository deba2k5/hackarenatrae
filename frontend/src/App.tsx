import './App.css';
import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from 'framer-motion';
import { Link } from 'react-router-dom';
import Tilt from 'react-parallax-tilt';
import { useStore, type SystemHealth } from './store/useStore';
import { useWebSocket } from './hooks/useWebSocket';
import {
  Terminal,
  Shield,
  Cpu,
  Database,
  Activity,
  RefreshCw,
  Wifi,
  WifiOff,
  GitBranch,
  CheckCircle2,
  AlertCircle,
  Zap,
  Sparkles,
  Code,
  Bot,
  Rocket,
  Play,
  Copy,
  Trash2,
  Clock,
  BarChart3,
  Network,
  Layers,
  Send,
  LayoutDashboard,
} from 'lucide-react';

/* ─── Static data ─────────────────────────────────────────────── */

const PIPELINE = [
  { id: 'retrieval', agent: 'Memory',   label: 'Chroma retrieve + BGE rerank',  Icon: Database  },
  { id: 'terminal', agent: 'Terminal',  label: 'DeBERTa-v3 classification',     Icon: Cpu       },
  { id: 'recovery', agent: 'Recovery',  label: 'Recovery plan synthesis',        Icon: Layers    },
  { id: 'store',    agent: 'Memory',    label: 'MongoDB + Chroma persist',       Icon: Network   },
] as const;

const SAMPLE_ERROR = `Error: Cannot find module "express"
Require stack:
- /app/index.js`;

const FEATURES = [
  {
    Icon: Code,
    title: 'Terminal Monitoring',
    desc: 'Real-time error detection and analysis from your Trae IDE terminal session.',
  },
  {
    Icon: Bot,
    title: 'AI Multi-Agent System',
    desc: 'LangGraph orchestration running 4 specialised agents in a deterministic pipeline.',
  },
  {
    Icon: Database,
    title: 'Smart Persistent Memory',
    desc: 'ChromaDB vectors + MongoDB checkpoints — every fix teaches the system.',
  },
];

const ERROR_COLORS: Record<string, string> = {
  module_not_found:  'text-orange-300 bg-orange-900/25 border-orange-500/35',
  syntax_error:      'text-red-300    bg-red-900/25    border-red-500/35',
  permission_denied: 'text-yellow-300 bg-yellow-900/25 border-yellow-500/35',
  port_in_use:       'text-purple-300 bg-purple-900/25 border-purple-500/35',
  env_missing:       'text-blue-300   bg-blue-900/25   border-blue-500/35',
  build_failed:      'text-red-300    bg-red-900/25    border-red-500/35',
  type_error:        'text-pink-300   bg-pink-900/25   border-pink-500/35',
  network_error:     'text-cyan-300   bg-cyan-900/25   border-cyan-500/35',
  unknown:           'text-slate-300  bg-slate-800/40  border-slate-500/35',
};

/* ─── Helpers ──────────────────────────────────────────────────── */

function fmt(d: Date) {
  return d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function fmtUptime(s: number) {
  if (s < 60)   return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m ${s % 60}s`;
  return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
}

/* ─── Component ────────────────────────────────────────────────── */

function App() {
  const { messages, agentsStatus, systemHealth, setSystemHealth, clearMessages } = useStore();
  const { sendMessage, connected } = useWebSocket('ws://127.0.0.1:8000/ws');

  const [errorInput, setErrorInput]   = useState(SAMPLE_ERROR);
  const [activeStep, setActiveStep]   = useState(-1);
  const [featureIdx, setFeatureIdx]   = useState(0);
  const [sessionStart]                = useState(() => new Date());
  const [now, setNow]                 = useState(() => new Date());

  const terminalEndRef = useRef<HTMLDivElement>(null);

  /* ── Parallax ── */
  const { scrollY }     = useScroll();
  const smoothY         = useSpring(scrollY, { stiffness: 100, damping: 30 });
  const y1              = useTransform(smoothY, [0, 800], [0, -90]);
  const y2              = useTransform(smoothY, [0, 800], [0, 90]);
  const op1             = useTransform(smoothY, [0, 400], [1, 0.5]);
  const op2             = useTransform(smoothY, [0, 400], [1, 0.65]);

  /* ── Auto-scroll stream ── */
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /* ── Health polling ── */
  useEffect(() => {
    const apiUrl = (window as any).TRAEGUARDIAN_CONFIG?.apiUrl ?? 'http://127.0.0.1:8000';
    const poll = async () => {
      try {
        const response = await fetch(`${apiUrl}/health`);
        if (!response.ok) throw new Error(`Health check failed: ${response.status}`);
        const data = await response.json() as SystemHealth;
        setSystemHealth(data);
      } catch (error) {
        console.error('Health polling error:', error);
        setSystemHealth({ models_ready: false });
      }
    };
    
    poll();
    const id = setInterval(poll, 5000);
    return () => clearInterval(id);
  }, [setSystemHealth]);

  /* ── Pipeline active step from agent status ── */
  useEffect(() => {
    const s = agentsStatus['Memory'] || agentsStatus['Terminal'] || agentsStatus['Recovery'] || '';
    if      (s.includes('Retrieving') || s.includes('Chroma'))   setActiveStep(0);
    else if (s.includes('DeBERTa')    || s.includes('Analyzing')) setActiveStep(1);
    else if (s.includes('Composing')  || s.includes('recovery'))  setActiveStep(2);
    else if (s.includes('Persisting') || s.includes('MongoDB'))   setActiveStep(3);
    else if (s === 'Online')                                        setActiveStep(-1);
  }, [agentsStatus]);

  /* ── Feature auto-rotate ── */
  useEffect(() => {
    const id = setInterval(() => setFeatureIdx(p => (p + 1) % FEATURES.length), 4000);
    return () => clearInterval(id);
  }, []);

  /* ── Live clock ── */
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  /* ── Actions ── */
  const submitError = () => {
    if (!errorInput.trim() || !connected || !modelsReady) return;
    sendMessage({
      type: 'terminal_error',
      error_log: errorInput,
      session_id: 'default',
      project_context: 'TraeGuardian IDE Workspace',
    });
    setActiveStep(0);
  };

  const restoreSession = () => sendMessage({ type: 'restore_session', session_id: 'default' });

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // Optionally add visual feedback here (e.g., toast notification)
    } catch (err) {
      console.error('Failed to copy text to clipboard:', err);
      // Fallback: select text manually
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
  };

  /* ── Derived values ── */
  const modelsReady    = systemHealth.models_ready;
  const hfOk           = systemHealth.huggingface?.configured;
  const uptime         = fmtUptime(Math.floor((now.getTime() - sessionStart.getTime()) / 1000));
  const responseCount  = messages.filter(m => m.type === 'response').length;

  /* ─────────────────────────── RENDER ──────────────────────────── */
  return (
    <div className="min-h-screen">

      {/* ── Ambient Background ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: `linear-gradient(rgba(99,102,241,1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(99,102,241,1) 1px, transparent 1px)`,
            backgroundSize: '64px 64px',
          }}
        />
        <motion.div
          className="absolute top-16 left-8 w-[420px] h-[420px] bg-violet-600/12 rounded-full blur-3xl"
          style={{ y: y1, opacity: op1 }}
        />
        <motion.div
          className="absolute bottom-16 right-8 w-[500px] h-[500px] bg-cyan-500/9 rounded-full blur-3xl"
          style={{ y: y2, opacity: op2 }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-indigo-600/4 rounded-full blur-3xl"
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* ─────────────── HEADER ─────────────── */}
      <motion.header
        initial={{ opacity: 0, y: -28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.75 }}
        className="sticky top-0 z-50 backdrop-blur-3xl bg-black/25 border-b border-white/5"
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">

            {/* Logo */}
            <div className="flex items-center gap-3.5">
              <motion.div
                whileHover={{ scale: 1.1, rotate: 10 }}
                className="w-11 h-11 bg-gradient-to-br from-cyan-500 via-violet-500 to-pink-500 rounded-xl flex items-center justify-center shadow-xl shadow-violet-500/30"
              >
                <Shield className="w-6 h-6 text-white" />
              </motion.div>
              <div>
                <h1 className="text-xl font-extrabold tracking-tight leading-none">
                  <span className="gradient-text">Trae</span>
                  <span className="text-white">Guardian</span>
                </h1>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">Autonomous AI Agent · Trae IDE</p>
              </div>
            </div>

            {/* Status bar */}
            <div className="flex items-center gap-2.5">
              {/* Clock */}
              <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-white/4 rounded-lg border border-white/7">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-mono text-slate-300 text-xs">{fmt(now)}</span>
              </div>
              {/* Uptime */}
              <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-white/4 rounded-lg border border-white/7">
                <BarChart3 className="w-3.5 h-3.5 text-violet-400" />
                <span className="font-mono text-slate-300 text-xs">{uptime}</span>
              </div>

              {/* WS status */}
              <motion.div
                whileHover={{ scale: 1.04 }}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-bold status-badge ${connected ? 'status-success' : 'status-error'}`}
              >
                {connected ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
                <span>{connected ? 'Connected' : 'Offline'}</span>
              </motion.div>

              {/* Models */}
              <motion.div
                whileHover={{ scale: 1.04 }}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-bold status-badge ${modelsReady ? 'status-success' : 'status-warning'}`}
              >
                {modelsReady ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                <span>{modelsReady ? 'Models Ready' : 'Booting…'}</span>
              </motion.div>

              {/* HF Auth badge */}
              {hfOk && (
                <motion.div
                  whileHover={{ scale: 1.04 }}
                  className="flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-bold status-badge status-info"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>HF Auth</span>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </motion.header>

      {/* ─────────────── MAIN ─────────────── */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 py-12">

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="text-center mb-12"
        >
          {/* Pill badge */}
          <motion.div
            animate={{ scale: [1, 1.04, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="inline-flex items-center gap-2.5 px-5 py-2 bg-white/5 border border-white/10 rounded-full mb-8"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-xs text-slate-200 font-medium tracking-wide">
              LangGraph · ChromaDB · DeBERTa-v3 · MongoDB
            </span>
          </motion.div>

          <h2 className="text-5xl md:text-[4.25rem] font-black mb-5 leading-[1.1] tracking-tight">
            Fix Errors with{' '}
            <span className="gradient-text">AI Agents</span>
          </h2>
          <p className="text-base md:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Paste your terminal error and watch a{' '}
            <span className="text-white font-semibold">4-stage multi-agent pipeline</span>{' '}
            diagnose, classify, and recover it — fully local, zero cloud cost.
          </p>
        </motion.div>

        {/* ── Stat cards ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.7 }}
          className="grid grid-cols-3 gap-4 mb-10"
        >
          {[
            { label: 'Session Events',  value: messages.length, Icon: Activity,     color: 'text-cyan-400',   bg: 'bg-cyan-500/10'   },
            { label: 'Fixes Generated', value: responseCount,   Icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
            { label: 'Pipeline Nodes',  value: 4,               Icon: GitBranch,    color: 'text-violet-400', bg: 'bg-violet-500/10' },
          ].map((stat, i) => {
            const StatIcon = stat.Icon;
            return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.08 }}
              className="glass-card p-5 flex items-center gap-4"
            >
              <div className={`p-2.5 rounded-xl ${stat.bg} ${stat.color}`}>
                <StatIcon className="w-5 h-5" />
              </div>
              <div>
                <div className={`text-2xl font-black text-white stat-number`}>{stat.value}</div>
                <div className="text-[11px] text-slate-400 font-medium tracking-wide">{stat.label}</div>
              </div>
            </motion.div>
            );
          })}
        </motion.div>

        {/* ── Feature carousel ── */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.75 }}
          className="mb-10"
        >
          <Tilt tiltMaxAngleX={4} tiltMaxAngleY={4} scale={1.01} transitionSpeed={400} className="glass-card p-8">
            {/* Dots */}
            <div className="flex items-center justify-center gap-2.5 mb-7">
              {FEATURES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setFeatureIdx(i)}
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    i === featureIdx
                      ? 'w-10 bg-gradient-to-r from-cyan-500 to-violet-500'
                      : 'w-1.5 bg-white/20 hover:bg-white/40'
                  }`}
                />
              ))}
            </div>

            <AnimatePresence mode="wait">
              {(() => {
                const FeatureIcon = FEATURES[featureIdx].Icon;
                return (
                  <motion.div
                    key={featureIdx}
                    initial={{ opacity: 0, x: 28 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -28 }}
                    transition={{ duration: 0.45 }}
                    className="flex items-center gap-8"
                  >
                    <motion.div
                      animate={{ rotate: [0, 5, -5, 0] }}
                      transition={{ duration: 2.8, repeat: Infinity }}
                      className="shrink-0 w-16 h-16 bg-gradient-to-br from-cyan-500/20 to-violet-500/20 rounded-2xl flex items-center justify-center"
                    >
                      <FeatureIcon className="w-7 h-7 text-cyan-300" />
                    </motion.div>
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1.5">{FEATURES[featureIdx].title}</h3>
                      <p className="text-slate-400 text-sm leading-relaxed">{FEATURES[featureIdx].desc}</p>
                    </div>
                  </motion.div>
                );
              })()}
            </AnimatePresence>
          </Tilt>
        </motion.div>

        {/* ── Main grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-7">

          {/* ── Left: Input + Stream ── */}
          <div className="lg:col-span-2 space-y-7">

            {/* Terminal input card */}
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55, duration: 0.7 }}
            >
              <Tilt tiltMaxAngleX={2} tiltMaxAngleY={2} scale={1.01} transitionSpeed={400} className="glass-card p-7">
                {/* Card header */}
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-cyan-500/15 rounded-lg flex items-center justify-center">
                      <Terminal className="w-4.5 h-4.5 text-cyan-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Terminal Error Input</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="hidden sm:inline text-[10px] text-slate-500 font-mono bg-white/4 px-2 py-1 rounded border border-white/6">
                      ⌘/Ctrl + Enter to run
                    </span>
                    <span className="text-[10px] text-slate-600 font-mono">{errorInput.length} ch</span>
                  </div>
                </div>

                {/* Fake terminal window */}
                <div className="rounded-xl overflow-hidden border border-white/8 bg-black/50 mb-5 scanline">
                  {/* Traffic lights */}
                  <div className="flex items-center gap-1.5 px-4 py-2.5 bg-white/[0.03] border-b border-white/6">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
                    <span className="ml-2.5 text-[10px] text-slate-500 font-mono">bash — error.log</span>
                  </div>
                  <textarea
                    id="error-input"
                    value={errorInput}
                    onChange={e => setErrorInput(e.target.value)}
                    onKeyDown={e => {
                      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') submitError();
                    }}
                    className="input-field rounded-none border-0 focus:ring-0 focus:border-0 bg-transparent h-40"
                    style={{ boxShadow: 'none' }}
                    placeholder="Paste your terminal error log here…"
                    aria-label="Terminal error log input"
                  />
                </div>

                {/* Action buttons */}
                <div className="flex gap-3">
                  <motion.button
                    id="run-pipeline-btn"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={submitError}
                    disabled={!connected || !modelsReady}
                    className="btn-primary flex-1 flex items-center justify-center gap-2.5 py-3 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                  >
                    <Play className="w-4.5 h-4.5" />
                    Run Agent Pipeline
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setErrorInput(SAMPLE_ERROR)}
                    className="btn-secondary flex items-center gap-2 px-4 text-sm"
                    title="Load sample error"
                  >
                    <Copy className="w-4 h-4" />
                    Sample
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setErrorInput('')}
                    className="btn-secondary px-4"
                    title="Clear input"
                  >
                    <Trash2 className="w-4 h-4" />
                  </motion.button>
                </div>

                {/* Boot warning */}
                <AnimatePresence>
                  {!modelsReady && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-amber-500/8 border border-amber-500/20 overflow-hidden"
                    >
                      <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                      <span className="text-amber-300/90 text-sm">
                        Backend is bootstrapping models — please wait for <strong>Models Ready</strong> status.
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Tilt>
            </motion.div>

            {/* Agent stream */}
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65, duration: 0.7 }}
            >
              <Tilt tiltMaxAngleX={1} tiltMaxAngleY={1} scale={1.005} transitionSpeed={400} className="glass-card overflow-hidden">
                {/* Stream header */}
                <div className="px-7 py-5 border-b border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-violet-500/15 rounded-lg flex items-center justify-center">
                      <Activity className="w-4 h-4 text-violet-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Agent Stream</h3>
                    {messages.length > 0 && (
                      <motion.span
                        key={messages.length}
                        initial={{ scale: 1.4 }}
                        animate={{ scale: 1 }}
                        className="px-2 py-0.5 bg-violet-500/15 border border-violet-500/30 rounded-full text-[10px] text-violet-300 font-mono font-bold"
                      >
                        {messages.length}
                      </motion.span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <Rocket className="w-5 h-5 text-violet-400 floating" />
                    {messages.length > 0 && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={clearMessages}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] text-slate-400 hover:text-red-400 bg-white/4 hover:bg-red-500/10 border border-white/8 hover:border-red-500/30 transition-all duration-200"
                      >
                        <Trash2 className="w-3 h-3" />
                        Clear
                      </motion.button>
                    )}
                  </div>
                </div>

                {/* Messages list */}
                <div className="p-5 h-[460px] overflow-y-auto bg-black/20 space-y-3">
                  {messages.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col items-center justify-center h-full text-slate-500 select-none"
                    >
                      <motion.div
                        animate={{ y: [0, -10, 0] }}
                        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                      >
                        <Send className="w-14 h-14 mb-4 opacity-15" />
                      </motion.div>
                      <p className="text-sm font-medium text-slate-500">No events yet</p>
                      <p className="text-xs text-slate-600 mt-1">Submit a terminal error to start the pipeline.</p>
                    </motion.div>
                  ) : (
                    <AnimatePresence initial={false}>
                      {messages.map(msg => {
                        /* parse [class: ...] line from content */
                        const classMatch = msg.content.match(/\[class:\s*([\w_]+)(?:,\s*([\d.]+)%?)?\]/);
                        const errType    = classMatch?.[1];
                        const conf       = classMatch?.[2];

                        return (
                          <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, x: -18, height: 0 }}
                            animate={{ opacity: 1, x: 0, height: 'auto' }}
                            exit={{ opacity: 0, x: 18, height: 0 }}
                            transition={{ duration: 0.32 }}
                            className={`group relative p-4 rounded-xl border ${
                              msg.type === 'error'    ? 'bg-red-500/7  border-red-500/18'  :
                              msg.type === 'response' ? 'bg-cyan-500/7 border-cyan-500/18' :
                                                        'bg-white/[0.025] border-white/7'
                            }`}
                          >
                            {/* Row 1: agent label + timestamp + copy */}
                            <div className="flex items-center justify-between mb-2 gap-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                  msg.type === 'response' ? 'bg-cyan-500/15 text-cyan-300'    :
                                  msg.type === 'error'    ? 'bg-red-500/15  text-red-300'     :
                                                            'bg-white/8     text-slate-300'
                                }`}>
                                  [{msg.agent}]
                                </span>
                                {errType && (
                                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md border ${ERROR_COLORS[errType] ?? ERROR_COLORS.unknown}`}>
                                    {errType}{conf ? ` · ${conf}%` : ''}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-[10px] text-slate-600 font-mono">{fmt(msg.timestamp)}</span>
                                {msg.type === 'response' && (
                                  <button
                                    onClick={() => copyText(msg.content)}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-white/10 text-slate-500 hover:text-white"
                                    title="Copy response"
                                  >
                                    <Copy className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                            {/* Content */}
                            <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-200 terminal-text">
                              {msg.content}
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  )}
                  <div ref={terminalEndRef} />
                </div>
              </Tilt>
            </motion.div>
          </div>

          {/* ── Right: Pipeline + Agents + Storage ── */}
          <div className="space-y-7">

            {/* Pipeline */}
            <motion.div
              initial={{ opacity: 0, x: 28 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6, duration: 0.7 }}
            >
              <Tilt tiltMaxAngleX={2} tiltMaxAngleY={2} scale={1.01} transitionSpeed={400} className="glass-card p-6">
                <div className="flex items-center gap-3 mb-7">
                  <div className="w-8 h-8 bg-cyan-500/15 rounded-lg flex items-center justify-center">
                    <GitBranch className="w-4 h-4 text-cyan-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white">Agent Pipeline</h3>
                </div>

                <ol className="relative space-y-0">
                  {/* Vertical connector line */}
                  <div className="absolute left-[19px] top-5 bottom-5 w-px bg-gradient-to-b from-indigo-500/30 via-white/6 to-transparent" />

                  {PIPELINE.map((step, i) => (
                    <motion.li
                      key={step.id}
                      initial={{ opacity: 0, x: 18 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.65 + i * 0.1, duration: 0.5 }}
                      className="relative flex items-start gap-4 pb-5 last:pb-0"
                    >
                      {/* Step indicator */}
                      <motion.div
                        animate={{
                          scale:     activeStep === i ? [1, 1.2, 1] : 1,
                          boxShadow: activeStep === i
                            ? ['0 0 0 0 rgba(99,102,241,0)', '0 0 18px 5px rgba(99,102,241,0.55)', '0 0 0 0 rgba(99,102,241,0)']
                            : 'none',
                        }}
                        transition={{ duration: 1.1, repeat: activeStep === i ? Infinity : 0 }}
                        className={`relative z-10 w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 ${
                          activeStep === i
                            ? 'bg-gradient-to-br from-cyan-500 to-violet-600 text-white shadow-lg shadow-violet-500/40'
                            : activeStep > i
                            ? 'bg-emerald-500/15 border border-emerald-500/35 text-emerald-400'
                            : 'bg-white/5 border border-white/10 text-slate-500'
                        }`}
                      >
                        {activeStep > i
                          ? <CheckCircle2 className="w-4 h-4" />
                          : <step.Icon className="w-4 h-4" />
                        }
                      </motion.div>

                      <div className="pt-2">
                        <p className={`font-semibold text-sm leading-tight ${activeStep === i ? 'text-white' : 'text-slate-300'}`}>
                          {step.label}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">{step.agent} Agent</p>
                      </div>
                    </motion.li>
                  ))}
                </ol>
              </Tilt>
            </motion.div>

            {/* Agents status */}
            <motion.div
              initial={{ opacity: 0, x: 28 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.72, duration: 0.7 }}
            >
              <Tilt tiltMaxAngleX={2} tiltMaxAngleY={2} scale={1.01} transitionSpeed={400} className="glass-card p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-violet-500/15 rounded-lg flex items-center justify-center">
                    <Cpu className="w-4 h-4 text-violet-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white">Agents Status</h3>
                </div>

                <ul className="space-y-3">
                  {Object.entries(agentsStatus).map(([agent, status], i) => {
                    const isActive = status !== 'Standby' && status !== 'Online';
                    const isOnline = status === 'Online' || status === 'Standby';
                    return (
                      <motion.li
                        key={agent}
                        initial={{ opacity: 0, x: 18 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.75 + i * 0.1 }}
                        className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            isActive
                              ? 'bg-amber-400 animate-pulse'
                              : 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.7)]'
                          }`} />
                          <span className="font-semibold text-slate-200 text-sm">{agent}</span>
                        </div>
                        <span className={`status-badge text-[10px] ${isOnline ? 'status-success' : 'status-warning'}`}>
                          {status}
                        </span>
                      </motion.li>
                    );
                  })}
                </ul>
              </Tilt>
            </motion.div>

            {/* Memory & Storage */}
            <motion.div
              initial={{ opacity: 0, x: 28 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.82, duration: 0.7 }}
            >
              <Tilt tiltMaxAngleX={2} tiltMaxAngleY={2} scale={1.01} transitionSpeed={400} className="glass-card p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-cyan-500/15 rounded-lg flex items-center justify-center">
                    <Database className="w-4 h-4 text-cyan-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white">Memory & Storage</h3>
                </div>

                <div className="space-y-4">
                  {/* ChromaDB */}
                  <div className="p-3.5 rounded-xl bg-white/[0.025] border border-white/6">
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                        <span className="text-sm text-slate-300 font-medium">ChromaDB</span>
                      </div>
                      <span className={`text-xs font-bold ${systemHealth.chroma?.ok ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {systemHealth.chroma?.ok ? `${systemHealth.chroma.documents ?? 0} vectors` : 'Connecting…'}
                      </span>
                    </div>
                    <div className="h-1 bg-white/8 rounded-full overflow-hidden progress-bar-shine">
                      <motion.div
                        className="h-full bg-gradient-to-r from-cyan-500 to-violet-500 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: systemHealth.chroma?.ok ? '65%' : '12%' }}
                        transition={{ duration: 1.6, ease: 'easeOut' }}
                      />
                    </div>
                  </div>

                  {/* MongoDB */}
                  <div className="p-3.5 rounded-xl bg-white/[0.025] border border-white/6">
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span className="text-sm text-slate-300 font-medium">MongoDB Atlas</span>
                      </div>
                      <span className={`text-xs font-bold ${systemHealth.mongodb?.ok ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {systemHealth.mongodb?.ok ? 'Connected' : 'Connecting…'}
                      </span>
                    </div>
                    <div className="h-1 bg-white/8 rounded-full overflow-hidden progress-bar-shine">
                      <motion.div
                        className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: systemHealth.mongodb?.ok ? '100%' : '15%' }}
                        transition={{ duration: 1.6, ease: 'easeOut' }}
                      />
                    </div>
                  </div>

                  {/* Model stack */}
                  <div className="pt-3 border-t border-white/6">
                    <p className="text-[11px] text-slate-500 font-mono leading-relaxed">
                      MiniLM-L6-v2 · BGE reranker · DeBERTa-v3
                    </p>
                  </div>
                </div>

                <motion.button
                  id="restore-session-btn"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={restoreSession}
                  disabled={!connected}
                  className="btn-secondary w-full mt-5 flex items-center justify-center gap-2.5 py-2.5 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <RefreshCw className="w-4 h-4" />
                  Restore Last Checkpoint
                </motion.button>
              </Tilt>
            </motion.div>

          </div>
        </div>
      </main>

      {/* ─────────────── FOOTER ─────────────── */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1, duration: 0.8 }}
        className="mt-16 border-t border-white/5 bg-black/20 backdrop-blur-3xl"
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-7">
          <div className="flex flex-wrap items-center justify-between gap-5">

            {/* Branding */}
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 bg-gradient-to-br from-cyan-500 to-violet-600 rounded-lg flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-slate-300 text-sm">TraeGuardian</span>
              <span className="text-slate-600 text-[10px] font-mono bg-white/4 px-1.5 py-0.5 rounded border border-white/6">v0.0.1</span>
              <span className="text-slate-600 text-[10px] font-mono">MIT License</span>
            </div>

            {/* Endpoints */}
            <div className="flex flex-wrap gap-5 text-[11px] text-slate-500 font-mono">
              <span>API <span className="text-slate-400">127.0.0.1:8000</span></span>
              <span className="text-slate-700">·</span>
              <span>UI <span className="text-slate-400">127.0.0.1:5173</span></span>
              <span className="text-slate-700">·</span>
              <span>ext <span className="text-slate-400">traeguardian.traeguardian</span></span>
            </div>

          </div>
        </div>
      </motion.footer>

    </div>
  );
}

export default App;
