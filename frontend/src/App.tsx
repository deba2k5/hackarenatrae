import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
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
  Rocket
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
  { icon: <Code className="w-6 h-6" />, title: "Terminal Monitoring", desc: "Real-time error detection and analysis" },
  { icon: <Bot className="w-6 h-6" />, title: "AI Agents", desc: "Multi-agent LangGraph orchestration" },
  { icon: <Database className="w-6 h-6" />, title: "Smart Memory", desc: "ChromaDB + MongoDB persistence" }
];

function App() {
  const { messages, agentsStatus, systemHealth, setSystemHealth } = useStore();
  const { sendMessage, connected } = useWebSocket('ws://127.0.0.1:8000/ws');
  const [errorInput, setErrorInput] = useState(SAMPLE_ERROR);
  const [activeStep, setActiveStep] = useState(-1);
  const [featureIndex, setFeatureIndex] = useState(0);
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, -50]);
  const y2 = useTransform(scrollY, [0, 500], [0, 50]);

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
      {/* Floating Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute top-20 left-10 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl"
          style={{ y: y1 }}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl"
          style={{ y: y2 }}
        />
      </div>

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/50 border-b border-white/10"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-xl shadow-cyan-500/30"
              >
                <Shield className="w-7 h-7 text-white" />
              </motion.div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  <span className="gradient-text">Trae</span>Guardian
                </h1>
                <p className="text-slate-400 text-sm">Autonomous AI Agent for Trae IDE</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border ${connected ? 'status-success' : 'status-error'}`}
              >
                {connected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                <span className="font-medium">{connected ? 'Connected' : 'Disconnected'}</span>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border ${modelsReady ? 'status-success' : 'status-warning'}`}
              >
                {modelsReady ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                <span className="font-medium">{modelsReady ? 'Models Ready' : 'Booting…'}</span>
              </motion.div>
              {hfOk && (
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center gap-2 px-4 py-2 rounded-full border status-info"
                >
                  <Zap className="w-4 h-4" />
                  <span className="font-medium">HF Auth</span>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-12"
        >
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full mb-6"
          >
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="text-sm text-slate-300">Powered by LangGraph & Local ML</span>
          </motion.div>
          <h2 className="text-5xl md:text-6xl font-bold mb-4">
            Fix Errors with <span className="gradient-text">AI Agents</span>
          </h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Paste your terminal error and watch our multi-agent system diagnose, analyze, and propose a fix.
          </p>
        </motion.div>

        {/* Feature Carousel */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-12"
        >
          <div className="glass-card p-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              {FEATURES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setFeatureIndex(i)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    i === featureIndex ? 'w-8 bg-gradient-to-r from-cyan-500 to-violet-600' : 'bg-white/20 hover:bg-white/40'
                  }`}
                />
              ))}
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={featureIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.5 }}
                className="text-center"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-cyan-500/20 to-violet-500/20 rounded-2xl mb-4">
                  <div className="text-cyan-400">{FEATURES[featureIndex].icon}</div>
                </div>
                <h3 className="text-2xl font-bold mb-2">{FEATURES[featureIndex].title}</h3>
                <p className="text-slate-400">{FEATURES[featureIndex].desc}</p>
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Actions */}
          <div className="lg:col-span-2 space-y-6">
            {/* Terminal Input Card */}
            <Tilt
              tiltMaxAngleX={3}
              tiltMaxAngleY={3}
              scale={1.02}
              transitionSpeed={400}
              className="glass-card p-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <Terminal className="w-6 h-6 text-cyan-400" />
                <h3 className="text-2xl font-bold">Terminal Error Input</h3>
              </div>
              <textarea
                value={errorInput}
                onChange={(e) => setErrorInput(e.target.value)}
                className="input-field font-mono text-sm resize-none h-40"
                placeholder="Paste your terminal error log here..."
              />
              <div className="flex gap-3 mt-5">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={submitError}
                  disabled={!connected || !modelsReady}
                  className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" />
                  Run Agent Pipeline
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setErrorInput(SAMPLE_ERROR)}
                  className="btn-secondary"
                >
                  Use Sample
                </motion.button>
              </div>
              {!modelsReady && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-4 flex items-center gap-2 text-amber-400"
                >
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">Waiting for backend to finish bootstrapping...</span>
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
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Activity className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-xl font-bold">Agent Stream</h3>
                </div>
                <Rocket className="w-5 h-5 text-violet-400 floating" />
              </div>
              <div className="p-6 h-96 overflow-y-auto bg-slate-950/30">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400">
                    <Activity className="w-16 h-16 mb-4 opacity-20" />
                    <p className="text-center">No events yet. Submit a terminal error to start the pipeline.</p>
                  </div>
                ) : (
                  <AnimatePresence>
                    {messages.map((msg) => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`mb-5 p-4 rounded-xl ${
                          msg.type === 'error'
                            ? 'bg-red-500/10 border border-red-500/20'
                            : msg.type === 'response'
                            ? 'bg-cyan-500/10 border border-cyan-500/20'
                            : 'bg-white/5 border border-white/10'
                        }`}
                      >
                        <div className="text-xs font-bold mb-2 text-slate-400">[{msg.agent}]</div>
                        <div className="whitespace-pre-wrap text-sm leading-relaxed">
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
          <div className="space-y-6">
            {/* Pipeline */}
            <Tilt
              tiltMaxAngleX={3}
              tiltMaxAngleY={3}
              scale={1.02}
              transitionSpeed={400}
              className="glass-card p-7"
            >
              <div className="flex items-center gap-3 mb-6">
                <GitBranch className="w-5 h-5 text-cyan-400" />
                <h3 className="text-xl font-bold">Agent Pipeline</h3>
              </div>
              <ol className="space-y-4">
                {PIPELINE.map((step, i) => (
                  <motion.li
                    key={step.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className={`flex items-start gap-4 p-4 rounded-xl transition-all duration-300 ${
                      activeStep === i
                        ? 'bg-gradient-to-r from-cyan-500/10 to-violet-500/10 border border-cyan-500/30'
                        : 'border border-white/10'
                    }`}
                  >
                    <motion.div
                      animate={{
                        scale: activeStep === i ? [1, 1.1, 1] : 1,
                        rotate: activeStep === i ? [0, 5, -5, 0] : 0
                      }}
                      transition={{ duration: 1, repeat: activeStep === i ? Infinity : 0 }}
                      className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-sm font-bold ${
                        activeStep === i
                          ? 'bg-gradient-to-r from-cyan-500 to-violet-600 text-white shadow-lg shadow-cyan-500/30'
                          : 'bg-white/10 text-slate-400'
                      }`}
                    >
                      {i + 1}
                    </motion.div>
                    <div className="flex-1">
                      <p className={`font-semibold ${activeStep === i ? 'text-white' : 'text-slate-300'}`}>
                        {step.label}
                      </p>
                      <p className="text-sm text-slate-500 mt-1">{step.agent} Agent</p>
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
              className="glass-card p-7"
            >
              <div className="flex items-center gap-3 mb-6">
                <Cpu className="w-5 h-5 text-violet-400" />
                <h3 className="text-xl font-bold">Agents Status</h3>
              </div>
              <ul className="space-y-4">
                {Object.entries(agentsStatus).map(([agent, status], i) => (
                  <motion.li
                    key={agent}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.1 }}
                    className="flex items-center justify-between py-3 border-b border-white/10 last:border-0"
                  >
                    <span className="font-semibold text-slate-200">{agent}</span>
                    <span className={`status-badge ${status === 'Online' ? 'status-success' : 'status-warning'}`}>
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
              className="glass-card p-7"
            >
              <div className="flex items-center gap-3 mb-6">
                <Database className="w-5 h-5 text-cyan-400" />
                <h3 className="text-xl font-bold">Memory & Storage</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">ChromaDB</span>
                  <span className={systemHealth.chroma?.ok ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>
                    {systemHealth.chroma?.ok ? `${systemHealth.chroma.documents ?? 0} vectors` : 'Connecting…'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">MongoDB</span>
                  <span className={systemHealth.mongodb?.ok ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>
                    {systemHealth.mongodb?.ok ? 'Connected' : 'Connecting…'}
                  </span>
                </div>
                <div className="pt-4 border-t border-white/10">
                  <p className="text-slate-500 text-xs">
                    Models: MiniLM-L6-v2 · BGE reranker · DeBERTa-v3
                  </p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={restoreSession}
                disabled={!connected}
                className="btn-secondary w-full mt-6 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className="w-4 h-4" />
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
        transition={{ delay: 0.6 }}
        className="mt-16 border-t border-white/10 bg-slate-950/50 backdrop-blur-xl"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-slate-500">
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
