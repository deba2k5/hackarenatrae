import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from 'framer-motion';
import Tilt from 'react-parallax-tilt';
import { useStore } from './store/useStore';
import { useWebSocket } from './hooks/useWebSocket';
import {
  Terminal,
  Shield,
  Cpu,
  Database,
  Activity,
  RefreshCw,
  Send,
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
  ChevronRight,
  Play,
  Copy
} from 'lucide-react';

const PIPELINE = [
  { id: 'retrieval', agent: 'Memory', label: 'Chroma retrieve + BGE rerank' },
  { id: 'terminal', agent: 'Terminal', label: 'DeBERTa-v3 classification' },
  { id: 'recovery', agent: 'Recovery', label: 'Recovery plan synthesis' },
  { id: 'store', agent: 'Memory', label: 'MongoDB + Chroma persist' },
];

const SAMPLE_ERROR = `Error: Cannot find module "express"
Require stack:
- /app/index.js`;

const FEATURES = [
  { icon: <Code className="w-8 h-8" />, title: "Terminal Monitoring", desc: "Real-time error detection and analysis" },
  { icon: <Bot className="w-8 h-8" />, title: "AI Agents", desc: "Multi-agent LangGraph orchestration" },
  { icon: <Database className="w-8 h-8" />, title: "Smart Memory", desc: "ChromaDB + MongoDB persistence" }
];

function App() {
  const { messages, agentsStatus, systemHealth, setSystemHealth } = useStore();
  const { sendMessage, connected } = useWebSocket('ws://127.0.0.1:8000/ws');
  const [errorInput, setErrorInput] = useState(SAMPLE_ERROR);
  const [activeStep, setActiveStep] = useState(-1);
  const [featureIndex, setFeatureIndex] = useState(0);
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const smoothScrollY = useSpring(scrollY, { stiffness: 100, damping: 30 });
  const y1 = useTransform(smoothScrollY, [0, 800], [0, -100]);
  const y2 = useTransform(smoothScrollY, [0, 800], [0, 100]);
  const opacity1 = useTransform(smoothScrollY, [0, 400], [1, 0.5]);
  const opacity2 = useTransform(smoothScrollY, [0, 400], [1, 0.7]);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const api = window.TRAEGUARDIAN_CONFIG?.apiUrl ?? 'http://127.0.0.1:8000';
    const poll = () => {
      fetch(`${api}/health`)
        .then((r) => r.json())
        .then((data) => setSystemHealth(data))
        .catch(() => setSystemHealth({ models_ready: false }));
    };
    poll();
    const id = setInterval(poll, 5000);
    return () => clearInterval(id);
  }, [setSystemHealth]);

  useEffect(() => {
    const status = agentsStatus['Memory'] || agentsStatus['Terminal'] || agentsStatus['Recovery'] || '';
    if (status.includes('Retrieving') || status.includes('Chroma')) setActiveStep(0);
    else if (status.includes('DeBERTa') || status.includes('Analyzing')) setActiveStep(1);
    else if (status.includes('Composing') || status.includes('recovery')) setActiveStep(2);
    else if (status.includes('Persisting') || status.includes('MongoDB')) setActiveStep(3);
    else if (status === 'Online') setActiveStep(-1);
  }, [agentsStatus]);

  useEffect(() => {
    const interval = setInterval(() => {
      setFeatureIndex((prev) => (prev + 1) % FEATURES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const submitError = () => {
    if (!errorInput.trim()) return;
    sendMessage({
      type: 'terminal_error',
      error_log: errorInput,
      session_id: 'default',
      project_context: 'TraeGuardian IDE Workspace',
    });
    setActiveStep(0);
  };

  const restoreSession = () => {
    sendMessage({ type: 'restore_session', session_id: 'default' });
  };

  const modelsReady = systemHealth.models_ready;
  const hfOk = systemHealth.huggingface?.configured;

  return (
    <div className="min-h-screen">
      {/* Parallax Background Overlay */}
      <div className="fixed inset-0 bg-slate-900/60" />

      {/* Floating Parallax Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute top-20 left-10 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl"
          style={{ y: y1, opacity: opacity1 }}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-[28rem] h-[28rem] bg-cyan-500/20 rounded-full blur-3xl"
          style={{ y: y2, opacity: opacity2 }}
        />
      </div>

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="sticky top-0 z-50 backdrop-blur-3xl bg-slate-900/40 border-b border-white/5"
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.div
                whileHover={{ scale: 1.1, rotate: 10 }}
                className="w-14 h-14 bg-gradient-to-br from-cyan-500 via-violet-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-cyan-500/40"
              >
                <Shield className="w-8 h-8 text-white" />
              </motion.div>
              <div>
                <h1 className="text-4xl font-extrabold tracking-tight">
                  <span className="gradient-text">Trae</span>Guardian
                </h1>
                <p className="text-slate-300 text-sm">Autonomous AI Agent for Trae IDE</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full border ${connected ? 'status-success' : 'status-error'}`}
              >
                {connected ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
                <span className="font-semibold">{connected ? 'Connected' : 'Disconnected'}</span>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full border ${modelsReady ? 'status-success' : 'status-warning'}`}
              >
                {modelsReady ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                <span className="font-semibold">{modelsReady ? 'Models Ready' : 'Booting…'}</span>
              </motion.div>
              {hfOk && (
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full border status-info"
                >
                  <Zap className="w-5 h-5" />
                  <span className="font-semibold">HF Auth</span>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 py-16">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="text-center mb-16"
        >
          <motion.div
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            className="inline-flex items-center gap-3 px-6 py-3 bg-white/5 border border-white/10 rounded-full mb-8"
          >
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <span className="text-base text-slate-200">Powered by LangGraph & Local ML</span>
          </motion.div>
          <h2 className="text-6xl md:text-7xl font-black mb-6 leading-tight">
            Fix Errors with <span className="gradient-text">AI Agents</span>
          </h2>
          <p className="text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Paste your terminal error and watch our multi-agent system diagnose, analyze, and propose a fix.
          </p>
        </motion.div>

        {/* Feature Carousel */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="mb-16"
        >
          <Tilt
            tiltMaxAngleX={4}
            tiltMaxAngleY={4}
            scale={1.02}
            transitionSpeed={400}
            className="glass-card p-10"
          >
            <div className="flex items-center justify-center gap-4 mb-8">
              {FEATURES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setFeatureIndex(i)}
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-400 ${
                    i === featureIndex ? 'w-12 bg-gradient-to-r from-cyan-500 via-violet-500 to-pink-500' : 'bg-white/20 hover:bg-white/40'
                  }`}
                />
              ))}
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={featureIndex}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.6 }}
                className="text-center"
              >
                <motion.div
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
                  className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-cyan-500/20 via-violet-500/20 to-pink-500/20 rounded-3xl mb-6"
                >
                  <div className="text-cyan-300">{FEATURES[featureIndex].icon}</div>
                </motion.div>
                <h3 className="text-3xl font-bold mb-4 text-white">{FEATURES[featureIndex].title}</h3>
                <p className="text-lg text-slate-300">{FEATURES[featureIndex].desc}</p>
              </motion.div>
            </AnimatePresence>
          </Tilt>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Actions */}
          <div className="lg:col-span-2 space-y-8">
            {/* Terminal Input Card */}
            <Tilt
              tiltMaxAngleX={3}
              tiltMaxAngleY={3}
              scale={1.02}
              transitionSpeed={400}
              className="glass-card p-10"
            >
              <div className="flex items-center gap-4 mb-8">
                <Terminal className="w-8 h-8 text-cyan-400" />
                <h3 className="text-2xl font-bold">Terminal Error Input</h3>
              </div>
              <textarea
                value={errorInput}
                onChange={(e) => setErrorInput(e.target.value)}
                className="input-field font-mono text-sm resize-none h-48"
                placeholder="Paste your terminal error log here..."
              />
              <div className="flex gap-4 mt-6">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={submitError}
                  disabled={!connected || !modelsReady}
                  className="btn-primary flex-1 flex items-center justify-center gap-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Play className="w-6 h-6" />
                  Run Agent Pipeline
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setErrorInput(SAMPLE_ERROR)}
                  className="btn-secondary flex items-center gap-2"
                >
                  <Copy className="w-5 h-5" />
                  Use Sample
                </motion.button>
              </div>
              {!modelsReady && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 flex items-center gap-3 text-amber-300"
                >
                  <AlertCircle className="w-5 h-5" />
                  <span className="text-base">Waiting for backend to finish bootstrapping...</span>
                </motion.div>
              )}
            </Tilt>

            {/* Agent Stream */}
            <Tilt
              tiltMaxAngleX={2}
              tiltMaxAngleY={2}
              scale={1.01}
              transitionSpeed={400}
              className="glass-card overflow-hidden"
            >
              <div className="p-8 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Activity className="w-6 h-6 text-cyan-400" />
                  <h3 className="text-2xl font-bold">Agent Stream</h3>
                </div>
                <Rocket className="w-6 h-6 text-violet-400 floating" />
              </div>
              <div className="p-8 h-[480px] overflow-y-auto bg-slate-950/20">
                {messages.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center h-full text-slate-300"
                  >
                    <Activity className="w-24 h-24 mb-6 opacity-20" />
                    <p className="text-lg text-center">No events yet. Submit a terminal error to start the pipeline.</p>
                  </motion.div>
                ) : (
                  <AnimatePresence>
                    {messages.map((msg) => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4 }}
                        className={`mb-6 p-6 rounded-2xl ${
                          msg.type === 'error'
                            ? 'bg-red-500/15 border border-red-500/25'
                            : msg.type === 'response'
                            ? 'bg-cyan-500/15 border border-cyan-500/25'
                            : 'bg-white/5 border border-white/10'
                        }`}
                      >
                        <div className="text-sm font-bold mb-3 text-slate-300">[{msg.agent}]</div>
                        <div className="whitespace-pre-wrap text-base leading-relaxed">
                          {msg.content}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
                <div ref={terminalEndRef} />
              </div>
            </Tilt>
          </div>

          {/* Right Column - Pipeline & Status */}
          <div className="space-y-8">
            {/* Pipeline */}
            <Tilt
              tiltMaxAngleX={3}
              tiltMaxAngleY={3}
              scale={1.02}
              transitionSpeed={400}
              className="glass-card p-8"
            >
              <div className="flex items-center gap-4 mb-8">
                <GitBranch className="w-6 h-6 text-cyan-400" />
                <h3 className="text-2xl font-bold">Agent Pipeline</h3>
              </div>
              <ol className="space-y-5">
                {PIPELINE.map((step, i) => (
                  <motion.li
                    key={step.id}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.15, duration: 0.6 }}
                    className={`flex items-start gap-5 p-5 rounded-2xl transition-all duration-300 ${
                      activeStep === i
                        ? 'bg-gradient-to-r from-cyan-500/15 via-violet-500/15 to-pink-500/15 border border-cyan-500/30'
                        : 'border border-white/10'
                    }`}
                  >
                    <motion.div
                      animate={{
                        scale: activeStep === i ? [1, 1.15, 1] : 1,
                        rotate: activeStep === i ? [0, 8, -8, 0] : 0
                      }}
                      transition={{ duration: 1.2, repeat: activeStep === i ? Infinity : 0, ease: "easeInOut" }}
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 text-base font-bold ${
                        activeStep === i
                          ? 'bg-gradient-to-r from-cyan-500 via-violet-500 to-pink-500 text-white shadow-xl shadow-cyan-500/40'
                          : 'bg-white/10 text-slate-300'
                      }`}
                    >
                      {i + 1}
                    </motion.div>
                    <div className="flex-1">
                      <p className={`font-semibold text-lg ${activeStep === i ? 'text-white' : 'text-slate-200'}`}>
                        {step.label}
                      </p>
                      <p className="text-base text-slate-400 mt-1">{step.agent} Agent</p>
                    </div>
                  </motion.li>
                ))}
              </ol>
            </Tilt>

            {/* Agents Status */}
            <Tilt
              tiltMaxAngleX={2}
              tiltMaxAngleY={2}
              scale={1.01}
              transitionSpeed={400}
              className="glass-card p-8"
            >
              <div className="flex items-center gap-4 mb-8">
                <Cpu className="w-6 h-6 text-violet-400" />
                <h3 className="text-2xl font-bold">Agents Status</h3>
              </div>
              <ul className="space-y-4">
                {Object.entries(agentsStatus).map(([agent, status], i) => (
                  <motion.li
                    key={agent}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + i * 0.15, duration: 0.6 }}
                    className="flex items-center justify-between py-4 border-b border-white/5 last:border-0"
                  >
                    <span className="font-semibold text-xl text-slate-100">{agent}</span>
                    <span className={`status-badge text-sm ${status === 'Online' ? 'status-success' : 'status-warning'}`}>
                      {status}
                    </span>
                  </motion.li>
                ))}
              </ul>
            </Tilt>

            {/* Memory Info */}
            <Tilt
              tiltMaxAngleX={2}
              tiltMaxAngleY={2}
              scale={1.01}
              transitionSpeed={400}
              className="glass-card p-8"
            >
              <div className="flex items-center gap-4 mb-8">
                <Database className="w-6 h-6 text-cyan-400" />
                <h3 className="text-2xl font-bold">Memory & Storage</h3>
              </div>
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <span className="text-lg text-slate-300">ChromaDB</span>
                  <span className={systemHealth.chroma?.ok ? 'text-emerald-300 font-semibold text-lg' : 'text-amber-300 font-semibold text-lg'}>
                    {systemHealth.chroma?.ok ? `${systemHealth.chroma.documents ?? 0} vectors` : 'Connecting…'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-lg text-slate-300">MongoDB</span>
                  <span className={systemHealth.mongodb?.ok ? 'text-emerald-300 font-semibold text-lg' : 'text-amber-300 font-semibold text-lg'}>
                    {systemHealth.mongodb?.ok ? 'Connected' : 'Connecting…'}
                  </span>
                </div>
                <div className="pt-6 border-t border-white/10">
                  <p className="text-slate-400 text-sm">
                    Models: MiniLM-L6-v2 · BGE reranker · DeBERTa-v3
                  </p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={restoreSession}
                disabled={!connected}
                className="btn-secondary w-full mt-8 flex items-center justify-center gap-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className="w-5 h-5" />
                Restore Last Checkpoint
              </motion.button>
            </Tilt>
          </div>
        </div>
      </main>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.8 }}
        className="mt-20 border-t border-white/5 bg-slate-900/30 backdrop-blur-3xl"
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-10">
          <div className="flex flex-wrap items-center justify-between gap-6 text-base text-slate-400">
            <span>Backend API: http://127.0.0.1:8000</span>
            <span>Frontend: http://127.0.0.1:5173</span>
            <span>Extension: traeguardian.traeguardian</span>
          </div>
        </div>
      </motion.footer>
    </div>
  );
}

export default App;
