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
  CheckCircle2,
  AlertCircle,
  Zap
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
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-cyber-violet rounded-xl flex items-center justify-center shadow-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  TraeGuardian
                </h1>
                <p className="text-sm text-slate-500">Autonomous AI agent for Trae IDE</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${connected ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}`}>
                {connected ? <Wifi className="w-4 h-4 text-emerald-600" /> : <WifiOff className="w-4 h-4 text-red-600" />}
                <span className={`text-sm font-medium ${connected ? 'text-emerald-700' : 'text-red-700'}`}>
                  {connected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${modelsReady ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
                {modelsReady ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-amber-600" />}
                <span className={`text-sm font-medium ${modelsReady ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {modelsReady ? 'Models Ready' : 'Booting…'}
                </span>
              </div>
              {hfOk && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-200 bg-blue-50">
                  <Zap className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-700">HF Auth</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Actions */}
          <div className="lg:col-span-2 space-y-6">
            {/* Terminal Input Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <Terminal className="w-5 h-5 text-primary-600" />
                <h2 className="text-lg font-semibold text-slate-900">Terminal Error Input</h2>
              </div>
              <textarea
                value={errorInput}
                onChange={(e) => setErrorInput(e.target.value)}
                className="input-field font-mono text-sm resize-none h-32"
                placeholder="Paste your terminal error log here..."
              />
              <div className="flex gap-3 mt-4">
                <button
                  onClick={submitError}
                  disabled={!connected || !modelsReady}
                  className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                  Run Agent Pipeline
                </button>
                <button
                  onClick={() => setErrorInput(SAMPLE_ERROR)}
                  className="btn-secondary"
                >
                  Use Sample
                </button>
              </div>
              {!modelsReady && (
                <p className="mt-3 text-sm text-amber-600 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Waiting for backend to finish bootstrapping (downloading models on first run)...
                </p>
              )}
            </motion.div>

            {/* Agent Stream */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="card"
            >
              <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary-600" />
                  <h2 className="text-lg font-semibold text-slate-900">Agent Stream</h2>
                </div>
              </div>
              <div className="p-4 h-96 overflow-y-auto bg-slate-50">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-500">
                    <Activity className="w-12 h-12 mb-3 opacity-20" />
                    <p>No events yet. Submit a terminal error to start the pipeline.</p>
                  </div>
                ) : (
                  <AnimatePresence>
                    {messages.map((msg) => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`mb-3 ${msg.type === 'error' ? 'text-red-600' : msg.type === 'response' ? 'text-primary-700' : 'text-slate-600'}`}
                      >
                        <div className="text-xs font-semibold mb-1 text-slate-400">
                          [{msg.agent}]
                        </div>
                        <div className="whitespace-pre-wrap text-sm leading-relaxed">
                          {msg.content}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
                <div ref={terminalEndRef} />
              </div>
            </motion.div>
          </div>

          {/* Right Column - Pipeline & Status */}
          <div className="space-y-6">
            {/* Pipeline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="card p-6"
            >
              <div className="flex items-center gap-2 mb-5">
                <GitBranch className="w-5 h-5 text-primary-600" />
                <h2 className="text-lg font-semibold text-slate-900">Agent Pipeline</h2>
              </div>
              <ol className="space-y-4">
                {PIPELINE.map((step, i) => (
                  <li
                    key={step.id}
                    className={`flex items-start gap-3 p-3 rounded-xl transition-all duration-200 ${
                      activeStep === i
                        ? 'bg-primary-50 border border-primary-200'
                        : 'border border-slate-200'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-bold ${
                      activeStep === i
                        ? 'bg-primary-600 text-white'
                        : 'bg-slate-100 text-slate-500'
                    }`}>
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <p className={`font-medium ${activeStep === i ? 'text-primary-900' : 'text-slate-700'}`}>
                        {step.label}
                      </p>
                      <p className="text-sm text-slate-500 mt-0.5">
                        {step.agent} Agent
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </motion.div>

            {/* Agents Status */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="card p-6"
            >
              <div className="flex items-center gap-2 mb-5">
                <Cpu className="w-5 h-5 text-primary-600" />
                <h2 className="text-lg font-semibold text-slate-900">Agents Status</h2>
              </div>
              <ul className="space-y-3">
                {Object.entries(agentsStatus).map(([agent, status]) => (
                  <li key={agent} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                    <span className="font-medium text-slate-700">{agent}</span>
                    <span className={`status-badge ${
                      status === 'Online' ? 'status-success' : 'status-warning'
                    }`}>
                      {status}
                    </span>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Memory Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="card p-6"
            >
              <div className="flex items-center gap-2 mb-5">
                <Database className="w-5 h-5 text-primary-600" />
                <h2 className="text-lg font-semibold text-slate-900">Memory & Storage</h2>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">ChromaDB</span>
                  <span className={systemHealth.chroma?.ok ? 'text-emerald-600 font-medium' : 'text-amber-600 font-medium'}>
                    {systemHealth.chroma?.ok ? `${systemHealth.chroma.documents ?? 0} vectors` : 'Connecting…'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">MongoDB</span>
                  <span className={systemHealth.mongodb?.ok ? 'text-emerald-600 font-medium' : 'text-amber-600 font-medium'}>
                    {systemHealth.mongodb?.ok ? 'Connected' : 'Connecting…'}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-100">
                  <p className="text-slate-500 text-xs">
                    Models: MiniLM-L6-v2 · BGE reranker · DeBERTa-v3
                  </p>
                </div>
              </div>
              <button
                onClick={restoreSession}
                disabled={!connected}
                className="btn-secondary w-full mt-5 text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className="w-4 h-4" />
                Restore Last Checkpoint
              </button>
            </motion.div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-slate-500">
            <span>Backend API: http://127.0.0.1:8000</span>
            <span>Frontend: http://127.0.0.1:5173</span>
            <span>Extension: traeguardian.traeguardian</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
