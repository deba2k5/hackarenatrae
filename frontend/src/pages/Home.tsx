import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from 'framer-motion';
import Tilt from 'react-parallax-tilt';
import { useStore } from '../store/useStore';
import { useWebSocket } from '../hooks/useWebSocket';
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
  Play,
  Copy,
  ChevronDown
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
  { icon: <Code className="w-10 h-10" />, title: "Terminal Monitoring", desc: "Real-time error detection and analysis" },
  { icon: <Bot className="w-10 h-10" />, title: "AI Agents", desc: "Multi-agent LangGraph orchestration" },
  { icon: <Database className="w-10 h-10" />, title: "Smart Memory", desc: "ChromaDB + MongoDB persistence" }
];

function Home() {
  const { messages, agentsStatus, systemHealth, setSystemHealth } = useStore();
  const { sendMessage, connected } = useWebSocket('ws://127.0.0.1:8000/ws');
  const [errorInput, setErrorInput] = useState(SAMPLE_ERROR);
  const [activeStep, setActiveStep] = useState(-1);
  const [featureIndex, setFeatureIndex] = useState(0);
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const smoothScrollY = useSpring(scrollY, { stiffness: 100, damping: 30 });
  const y1 = useTransform(smoothScrollY, [0, 800], [0, -120]);
  const y2 = useTransform(smoothScrollY, [0, 800], [0, 120]);
  const opacity1 = useTransform(smoothScrollY, [0, 400], [1, 0.4]);
  const opacity2 = useTransform(smoothScrollY, [0, 400], [1, 0.6]);

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

  const scrollToDemo = () => {
    document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen">
      {/* Floating Parallax Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute top-10 left-10 w-[32rem] h-[32rem] bg-fuchsia-600/10 rounded-full blur-3xl"
          style={{ y: y1, opacity: opacity1 }}
        />
        <motion.div
          className="absolute bottom-10 right-10 w-[36rem] h-[36rem] bg-indigo-600/10 rounded-full blur-3xl"
          style={{ y: y2, opacity: opacity2 }}
        />
      </div>

      {/* Hero Section */}
      <section className="relative z-10">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-32">
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9 }}
            className="text-center"
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="inline-flex items-center gap-4 px-10 py-5 bg-white/5 border border-white/10 rounded-full mb-12"
            >
              <Sparkles className="w-7 h-7 text-fuchsia-400" />
              <span className="text-xl text-slate-200 font-semibold">Powered by LangGraph & Local ML</span>
            </motion.div>

            <h1 className="text-8xl md:text-9xl font-black mb-10 leading-tight">
              Fix Errors with <span className="gradient-text">AI Agents</span>
            </h1>

            <p className="text-2xl md:text-3xl text-slate-300 max-w-4xl mx-auto mb-16 leading-relaxed">
              Paste your terminal error and watch our multi-agent system diagnose, analyze, and propose a fix.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                onClick={scrollToDemo}
                className="btn-primary text-2xl px-16 py-6 pulse-glow"
              >
                <Play className="w-8 h-8 mr-4" />
                Try the Demo
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => setErrorInput(SAMPLE_ERROR)}
                className="btn-secondary text-2xl"
              >
                <Copy className="w-7 h-7 mr-3" />
                Use Sample
              </motion.button>
            </div>

            <motion.div
              animate={{ y: [0, 15, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              className="mt-24"
              onClick={scrollToDemo}
            >
              <ChevronDown className="w-16 h-16 mx-auto text-fuchsia-400" />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Feature Carousel */}
      <section className="relative z-10">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            <Tilt
              tiltMaxAngleX={5}
              tiltMaxAngleY={5}
              scale={1.02}
              transitionSpeed={400}
              className="glass-card p-12"
            >
              <div className="flex items-center justify-center gap-5 mb-10">
                {FEATURES.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setFeatureIndex(i)}
                    className={`w-3 h-3 rounded-full transition-all duration-400 ${
                      i === featureIndex ? 'w-16 bg-gradient-to-r from-fuchsia-600 via-violet-600 to-indigo-600' : 'bg-white/20 hover:bg-white/40'
                    }`}
                  />
                ))}
              </div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={featureIndex}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.6 }}
                  className="text-center"
                >
                  <motion.div
                    animate={{ rotate: [0, 6, -6, 0] }}
                    transition={{ duration: 2.5, repeat: Infinity, delay: 0.3 }}
                    className="inline-flex items-center justify-center w-28 h-28 bg-gradient-to-br from-fuchsia-600/20 via-violet-600/20 to-indigo-600/20 rounded-3xl mb-8"
                  >
                    <div className="text-fuchsia-300">{FEATURES[featureIndex].icon}</div>
                  </motion.div>
                  <h3 className="text-4xl font-bold mb-6 text-white">{FEATURES[featureIndex].title}</h3>
                  <p className="text-xl text-slate-300">{FEATURES[featureIndex].desc}</p>
                </motion.div>
              </AnimatePresence>
            </Tilt>
          </motion.div>
        </div>
      </section>

      {/* Demo Section */}
      <section id="demo" className="relative z-10">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Left Column - Main Actions */}
            <div className="lg:col-span-2 space-y-10">
              {/* Status Row */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.8 }}
                className="flex flex-wrap items-center gap-4"
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className={`flex items-center gap-3 px-6 py-3 rounded-full border ${connected ? 'status-success' : 'status-error'}`}
                >
                  {connected ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
                  <span className="font-semibold text-lg">{connected ? 'Connected' : 'Disconnected'}</span>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className={`flex items-center gap-3 px-6 py-3 rounded-full border ${modelsReady ? 'status-success' : 'status-warning'}`}
                >
                  {modelsReady ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                  <span className="font-semibold text-lg">{modelsReady ? 'Models Ready' : 'Booting…'}</span>
                </motion.div>
                {hfOk && (
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="flex items-center gap-3 px-6 py-3 rounded-full border status-info"
                  >
                    <Zap className="w-5 h-5" />
                    <span className="font-semibold text-lg">HF Auth</span>
                  </motion.div>
                )}
              </motion.div>

              {/* Terminal Input Card */}
              <Tilt
                tiltMaxAngleX={4}
                tiltMaxAngleY={4}
                scale={1.02}
                transitionSpeed={400}
                className="glass-card p-12"
              >
                <div className="flex items-center gap-5 mb-10">
                  <Terminal className="w-10 h-10 text-fuchsia-400" />
                  <h3 className="text-3xl font-bold">Terminal Error Input</h3>
                </div>
                <textarea
                  value={errorInput}
                  onChange={(e) => setErrorInput(e.target.value)}
                  className="input-field font-mono text-base resize-none h-56"
                  placeholder="Paste your terminal error log here..."
                />
                <div className="flex gap-5 mt-8">
                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={submitError}
                    disabled={!connected || !modelsReady}
                    className="btn-primary flex-1 flex items-center justify-center gap-4 text-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Play className="w-7 h-7" />
                    Run Agent Pipeline
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => setErrorInput(SAMPLE_ERROR)}
                    className="btn-secondary flex items-center gap-3"
                  >
                    <Copy className="w-6 h-6" />
                    Use Sample
                  </motion.button>
                </div>
                {!modelsReady && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-8 flex items-center gap-3 text-amber-300"
                  >
                    <AlertCircle className="w-6 h-6" />
                    <span className="text-lg">Waiting for backend to finish bootstrapping...</span>
                  </motion.div>
                )}
              </Tilt>

              {/* Agent Stream */}
              <Tilt
                tiltMaxAngleX={3}
                tiltMaxAngleY={3}
                scale={1.01}
                transitionSpeed={400}
                className="glass-card overflow-hidden"
              >
                <div className="p-10 border-b border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-5">
                    <Activity className="w-8 h-8 text-fuchsia-400" />
                    <h3 className="text-3xl font-bold">Agent Stream</h3>
                  </div>
                  <Rocket className="w-8 h-8 text-indigo-400 floating" />
                </div>
                <div className="p-10 h-[520px] overflow-y-auto bg-slate-950/20">
                  {messages.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col items-center justify-center h-full text-slate-300"
                    >
                      <Activity className="w-32 h-32 mb-8 opacity-20" />
                      <p className="text-xl text-center">No events yet. Submit a terminal error to start the pipeline.</p>
                    </motion.div>
                  ) : (
                    <AnimatePresence>
                      {messages.map((msg) => (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, x: -40 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.5 }}
                          className={`mb-8 p-8 rounded-2xl ${
                            msg.type === 'error'
                              ? 'bg-red-500/15 border border-red-500/25'
                              : msg.type === 'response'
                              ? 'bg-fuchsia-500/15 border border-fuchsia-500/25'
                              : 'bg-white/5 border border-white/10'
                          }`}
                        >
                          <div className="text-base font-bold mb-4 text-slate-300">[{msg.agent}]</div>
                          <div className="whitespace-pre-wrap text-lg leading-relaxed">
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
            <div className="space-y-10">
              {/* Pipeline */}
              <Tilt
                tiltMaxAngleX={4}
                tiltMaxAngleY={4}
                scale={1.02}
                transitionSpeed={400}
                className="glass-card p-10"
              >
                <div className="flex items-center gap-5 mb-10">
                  <GitBranch className="w-8 h-8 text-fuchsia-400" />
                  <h3 className="text-3xl font-bold">Agent Pipeline</h3>
                </div>
                <ol className="space-y-6">
                  {PIPELINE.map((step, i) => (
                    <motion.li
                      key={step.id}
                      initial={{ opacity: 0, x: 40 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.2, duration: 0.7 }}
                      className={`flex items-start gap-6 p-6 rounded-2xl transition-all duration-300 ${
                        activeStep === i
                          ? 'bg-gradient-to-r from-fuchsia-600/15 via-violet-600/15 to-indigo-600/15 border border-fuchsia-500/30'
                          : 'border border-white/10'
                      }`}
                    >
                      <motion.div
                        animate={{
                          scale: activeStep === i ? [1, 1.2, 1] : 1,
                          rotate: activeStep === i ? [0, 10, -10, 0] : 0
                        }}
                        transition={{ duration: 1.5, repeat: activeStep === i ? Infinity : 0, ease: "easeInOut" }}
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 text-lg font-bold ${
                          activeStep === i
                            ? 'bg-gradient-to-r from-fuchsia-600 via-violet-600 to-indigo-600 text-white shadow-2xl shadow-fuchsia-500/40'
                            : 'bg-white/10 text-slate-300'
                        }`}
                      >
                        {i + 1}
                      </motion.div>
                      <div className="flex-1">
                        <p className={`font-semibold text-xl ${activeStep === i ? 'text-white' : 'text-slate-200'}`}>
                          {step.label}
                        </p>
                        <p className="text-lg text-slate-400 mt-2">{step.agent} Agent</p>
                      </div>
                    </motion.li>
                  ))}
                </ol>
              </Tilt>

              {/* Agents Status */}
              <Tilt
                tiltMaxAngleX={3}
                tiltMaxAngleY={3}
                scale={1.01}
                transitionSpeed={400}
                className="glass-card p-10"
              >
                <div className="flex items-center gap-5 mb-10">
                  <Cpu className="w-8 h-8 text-indigo-400" />
                  <h3 className="text-3xl font-bold">Agents Status</h3>
                </div>
                <ul className="space-y-5">
                  {Object.entries(agentsStatus).map(([agent, status], i) => (
                    <motion.li
                      key={agent}
                      initial={{ opacity: 0, x: 40 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.8 + i * 0.2, duration: 0.7 }}
                      className="flex items-center justify-between py-5 border-b border-white/5 last:border-0"
                    >
                      <span className="font-semibold text-2xl text-slate-100">{agent}</span>
                      <span className={`status-badge text-lg ${status === 'Online' ? 'status-success' : 'status-warning'}`}>
                        {status}
                      </span>
                    </motion.li>
                  ))}
                </ul>
              </Tilt>

              {/* Memory Info */}
              <Tilt
                tiltMaxAngleX={3}
                tiltMaxAngleY={3}
                scale={1.01}
                transitionSpeed={400}
                className="glass-card p-10"
              >
                <div className="flex items-center gap-5 mb-10">
                  <Database className="w-8 h-8 text-fuchsia-400" />
                  <h3 className="text-3xl font-bold">Memory & Storage</h3>
                </div>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <span className="text-xl text-slate-300">ChromaDB</span>
                    <span className={systemHealth.chroma?.ok ? 'text-emerald-300 font-semibold text-xl' : 'text-amber-300 font-semibold text-xl'}>
                      {systemHealth.chroma?.ok ? `${systemHealth.chroma.documents ?? 0} vectors` : 'Connecting…'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xl text-slate-300">MongoDB</span>
                    <span className={systemHealth.mongodb?.ok ? 'text-emerald-300 font-semibold text-xl' : 'text-amber-300 font-semibold text-xl'}>
                      {systemHealth.mongodb?.ok ? 'Connected' : 'Connecting…'}
                    </span>
                  </div>
                  <div className="pt-8 border-t border-white/10">
                    <p className="text-slate-400 text-base">
                      Models: MiniLM-L6-v2 · BGE reranker · DeBERTa-v3
                    </p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={restoreSession}
                  disabled={!connected}
                  className="btn-secondary w-full mt-10 flex items-center justify-center gap-4 text-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw className="w-6 h-6" />
                  Restore Last Checkpoint
                </motion.button>
              </Tilt>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.8 }}
        className="mt-24 border-t border-white/5 bg-slate-950/30 backdrop-blur-3xl"
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
          <div className="flex flex-wrap items-center justify-between gap-8 text-lg text-slate-400">
            <span>Backend API: http://127.0.0.1:8000</span>
            <span>Frontend: http://127.0.0.1:5173</span>
            <span>Extension: traeguardian.traeguardian</span>
          </div>
        </div>
      </motion.footer>
    </div>
  );
}

export default Home;
