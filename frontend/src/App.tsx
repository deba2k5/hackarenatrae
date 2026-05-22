import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

function App() {
  const { messages, agentsStatus, systemHealth, setSystemHealth } = useStore();
  const { sendMessage, connected } = useWebSocket('ws://127.0.0.1:8000/ws');
  const [errorInput, setErrorInput] = useState(SAMPLE_ERROR);
  const [activeStep, setActiveStep] = useState(-1);
  const terminalEndRef = useRef<HTMLDivElement>(null);

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
    <div className="min-h-screen bg-background-dark text-white p-4 md:p-6 font-sans">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel max-w-6xl mx-auto p-5 md:p-6 relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-cyber-gradient" />

        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-cyber-cyan shrink-0" />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                <span className="neon-text">Trae</span>Guardian
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">Local ML agents · Trae IDE extension</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className={`flex items-center gap-1.5 px-2 py-1 rounded-full border ${connected ? 'border-status-success/40 text-status-success' : 'border-status-error/40 text-status-error'}`}>
              {connected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              {connected ? 'WS Live' : 'WS Offline'}
            </span>
            <span className={`px-2 py-1 rounded-full border ${modelsReady ? 'border-status-success/40 text-status-success' : 'border-status-warning/40 text-status-warning'}`}>
              {modelsReady ? 'Models Ready' : 'Booting models…'}
            </span>
            {hfOk && (
              <span className="px-2 py-1 rounded-full border border-cyber-violet/40 text-cyber-violet">
                HF Auth ✓
              </span>
            )}
          </div>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="glass-panel p-3 border border-white/5">
              <label className="text-xs uppercase tracking-wider text-gray-400 flex items-center gap-2 mb-2">
                <Terminal className="w-3.5 h-3.5" /> Terminal error log
              </label>
              <textarea
                value={errorInput}
                onChange={(e) => setErrorInput(e.target.value)}
                className="w-full h-28 bg-black/50 border border-white/10 rounded-lg p-3 font-mono text-xs text-gray-200 focus:border-cyber-cyan/50 focus:outline-none resize-y"
                placeholder="Paste stderr / terminal output here…"
              />
              <div className="flex gap-2 mt-3">
                <button onClick={submitError} disabled={!connected || !modelsReady} className="cyber-button text-xs flex-1 flex items-center justify-center gap-2 disabled:opacity-40">
                  <Send className="w-4 h-4" /> Run agent pipeline
                </button>
                <button onClick={() => setErrorInput(SAMPLE_ERROR)} className="text-xs px-3 py-2 rounded-md border border-white/10 hover:border-cyber-cyan/40 text-gray-400">
                  Sample
                </button>
              </div>
              {!modelsReady && (
                <p className="text-xs text-status-warning mt-2">Waiting for backend bootstrap (downloads models on first run)…</p>
              )}
            </div>

            <div className="flex flex-col min-h-[320px]">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-cyber-blue" />
                <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Agent stream</h2>
              </div>

              <div className="flex-1 glass-panel p-4 bg-black/60 font-mono text-sm overflow-y-auto border-t-2 border-cyber-cyan/30 flex flex-col gap-2 max-h-[360px]">
                {messages.length === 0 && (
                  <p className="text-gray-500 text-center py-8">No events yet. Submit a terminal error to start LangGraph.</p>
                )}
                <AnimatePresence>
                  {messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`flex flex-col gap-1 ${msg.type === 'error' ? 'text-status-error' : msg.type === 'response' ? 'text-cyber-cyan' : 'text-gray-400'}`}
                    >
                      <span className="text-xs font-bold opacity-70">[{msg.agent}]</span>
                      <span className="whitespace-pre-wrap text-[13px] leading-relaxed">{msg.content}</span>
                    </motion.div>
                  ))}
                </AnimatePresence>
                <div ref={terminalEndRef} />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="glass-panel p-4 border border-white/5">
              <div className="flex items-center gap-2 mb-3">
                <GitBranch className="w-4 h-4 text-cyber-cyan" />
                <h2 className="text-sm uppercase tracking-wider text-gray-300 font-semibold">Pipeline</h2>
              </div>
              <ol className="space-y-2 text-xs">
                {PIPELINE.map((step, i) => (
                  <li
                    key={step.id}
                    className={`flex gap-2 p-2 rounded-lg border transition-colors ${
                      activeStep === i ? 'border-cyber-cyan/50 bg-cyber-cyan/5' : 'border-white/5'
                    }`}
                  >
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${activeStep === i ? 'bg-cyber-cyan text-black' : 'bg-white/10'}`}>
                      {i + 1}
                    </span>
                    <div>
                      <p className="font-medium text-gray-200">{step.label}</p>
                      <p className="text-gray-500">{step.agent}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div className="glass-panel p-4 border border-white/5">
              <div className="flex items-center gap-2 mb-3">
                <Cpu className="w-4 h-4 text-cyber-violet" />
                <h2 className="text-sm uppercase tracking-wider text-gray-300 font-semibold">Agents</h2>
              </div>
              <ul className="space-y-3 text-sm">
                {Object.entries(agentsStatus).map(([agent, status]) => (
                  <li key={agent} className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="font-medium">{agent}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full max-w-[140px] truncate ${
                        status === 'Online'
                          ? 'bg-status-success/20 text-status-success'
                          : 'bg-status-warning/20 text-status-warning'
                      }`}
                      title={status}
                    >
                      {status}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="glass-panel p-4 border border-white/5">
              <div className="flex items-center gap-2 mb-3">
                <Database className="w-4 h-4 text-cyber-blue" />
                <h2 className="text-sm uppercase tracking-wider text-gray-300 font-semibold">Memory</h2>
              </div>
              <div className="text-xs text-gray-400 space-y-1.5">
                <p>
                  ChromaDB:{' '}
                  <span className={systemHealth.chroma?.ok ? 'text-status-success' : 'text-status-warning'}>
                    {systemHealth.chroma?.ok ? `${systemHealth.chroma.documents ?? 0} vectors` : '…'}
                  </span>
                </p>
                <p>
                  MongoDB:{' '}
                  <span className={systemHealth.mongodb?.ok ? 'text-status-success' : 'text-status-warning'}>
                    {systemHealth.mongodb?.ok ? 'Atlas connected' : '…'}
                  </span>
                </p>
                <p>MiniLM-L6-v2 · BGE reranker · DeBERTa-v3</p>
              </div>
              <button
                onClick={restoreSession}
                disabled={!connected}
                className="cyber-button w-full mt-4 text-xs flex items-center justify-center gap-2 py-2 disabled:opacity-40"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Restore last checkpoint
              </button>
            </div>
          </div>
        </main>

        <footer className="mt-5 pt-3 border-t border-white/5 text-[10px] text-gray-500 flex flex-wrap gap-4 justify-between">
          <span>API http://127.0.0.1:8000</span>
          <span>UI http://127.0.0.1:5173</span>
          <span>Extension: traeguardian.traeguardian</span>
        </footer>
      </motion.div>
    </div>
  );
}

export default App;
