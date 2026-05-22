import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import { useWebSocket } from '../hooks/useWebSocket';
import {
  Terminal,
  Play,
  Copy,
  Wifi,
  WifiOff,
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

function Home() {
  const { messages, agentsStatus, systemHealth, setSystemHealth } = useStore();
  const { sendMessage, connected } = useWebSocket('ws://127.0.0.1:8000/ws');
  const [errorInput, setErrorInput] = useState(SAMPLE_ERROR);
  const [activeStep, setActiveStep] = useState(-1);
  const terminalEndRef = useRef<HTMLDivElement>(null);

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
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'terminalError' && event.data.error) {
        setErrorInput(event.data.error);
        // Auto-run the pipeline when error is received
        setTimeout(() => {
          submitError();
        }, 500);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [submitError]);

  const modelsReady = systemHealth.models_ready;
  const hfOk = systemHealth.huggingface?.configured;

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      {/* Scanline Overlay */}
      <div className="fixed inset-0 scanline z-0" />

      {/* Main Container */}
      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-6 flex flex-wrap items-center gap-4"
        >
          <div className="flex items-center gap-2 text-[#00ff88]">
            {connected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
            <span className="text-sm font-bold">
              {connected ? 'WS: CONNECTED' : 'WS: DISCONNECTED'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[#00ff88]">
            {modelsReady ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span className="text-sm font-bold">
              {modelsReady ? 'MODELS: READY' : 'MODELS: BOOTING'}
            </span>
          </div>
          {hfOk && (
            <div className="flex items-center gap-2 text-[#00ff88]">
              <Zap className="w-4 h-4" />
              <span className="text-sm font-bold">HF: CONFIGURED</span>
            </div>
          )}
        </motion.div>

        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <pre className="text-[#00ff88] text-xs sm:text-sm font-mono mb-4">
            <span className="text-[#00ff88]/60">╔════════════════════════════════════════════════════════════╗</span>
            <br />
            <span className="text-[#00ff88]/60">║</span>{' '}
            <span className="font-bold">TRAE</span>
            <span className="text-white">GUARDIAN</span>
            <span className="text-[#00ff88]/60"> - Autonomous AI Agent System</span>
            <span className="text-[#00ff88]/60">                          ║</span>
            <br />
            <span className="text-[#00ff88]/60">╚════════════════════════════════════════════════════════════╝</span>
          </pre>
          <p className="text-[#00ff88]/80 font-mono text-sm mb-2">
            <span className="text-[#00ff88]">user@traeg</span>:<span className="text-white">~</span>$ ./start.sh
          </p>
          <p className="text-[#00ff88]/60 font-mono text-xs">
            [INFO] System initialized. Paste terminal error to begin...
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left - Main Terminal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Input Terminal */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="terminal-card"
            >
              <div className="terminal-header">
                <div className="terminal-dot bg-red-500" />
                <div className="terminal-dot bg-yellow-500" />
                <div className="terminal-dot bg-green-500" />
                <span className="ml-4 text-[#00ff88]/70 text-xs font-bold">ERROR_INPUT.TXT</span>
              </div>
              <div className="p-6">
                <div className="mb-4">
                  <span className="text-[#00ff88] font-bold mr-2">❯</span>
                  <span className="text-[#00ff88]/80 text-sm">Enter terminal error log:</span>
                </div>
                <textarea
                  value={errorInput}
                  onChange={(e) => setErrorInput(e.target.value)}
                  className="input-terminal resize-none h-48 mb-4"
                  placeholder="Paste your error here..."
                />
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={submitError}
                    disabled={!connected || !modelsReady}
                    className="btn-terminal-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Play className="w-4 h-4" />
                    EXECUTE
                  </button>
                  <button
                    onClick={() => setErrorInput(SAMPLE_ERROR)}
                    className="btn-terminal flex items-center gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    SAMPLE
                  </button>
                  <button
                    onClick={() => {
                      if (window.parent !== window) {
                        window.parent.postMessage({ type: 'requestTerminalContent' }, '*');
                      } else {
                        // If not in iframe, prompt user to paste
                        const content = prompt('Paste your terminal output/error here:');
                        if (content?.trim()) {
                          setErrorInput(content);
                          submitError();
                        }
                      }
                    }}
                    className="btn-terminal flex items-center gap-2"
                  >
                    <Terminal className="w-4 h-4" />
                    CAPTURE TERMINAL
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Agent Stream Terminal */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="terminal-card"
            >
              <div className="terminal-header">
                <div className="terminal-dot bg-red-500" />
                <div className="terminal-dot bg-yellow-500" />
                <div className="terminal-dot bg-green-500" />
                <span className="ml-4 text-[#00ff88]/70 text-xs font-bold">AGENT_STREAM.LOG</span>
              </div>
              <div className="p-6 h-[500px] overflow-y-auto">
                {messages.length === 0 ? (
                  <div className="text-[#00ff88]/40 font-mono text-sm">
                    <p>[SYSTEM] Waiting for input...</p>
                    <p className="mt-2">[SYSTEM] No events logged yet.</p>
                  </div>
                ) : (
                  <AnimatePresence>
                    {messages.map((msg) => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="mb-4 font-mono text-sm"
                      >
                        <span className="text-white/80">[{msg.agent.toUpperCase()}]</span>
                        <pre className="text-[#00ff88] mt-1 whitespace-pre-wrap">
                          {msg.content}
                        </pre>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
                <div ref={terminalEndRef} />
              </div>
            </motion.div>
          </div>

          {/* Right - Pipeline & Status */}
          <div className="space-y-6">
            {/* Pipeline Terminal */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="terminal-card"
            >
              <div className="terminal-header">
                <div className="terminal-dot bg-red-500" />
                <div className="terminal-dot bg-yellow-500" />
                <div className="terminal-dot bg-green-500" />
                <span className="ml-4 text-[#00ff88]/70 text-xs font-bold">PIPELINE.CFG</span>
              </div>
              <div className="p-6">
                <ol className="space-y-3">
                  {PIPELINE.map((step, i) => (
                    <motion.li
                      key={step.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + i * 0.1 }}
                      className={`p-3 border transition-all duration-300 ${
                        activeStep === i
                          ? 'border-[#00ff88] bg-[#00ff88]/5'
                          : 'border-[#00ff88]/20'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-6 h-6 flex items-center justify-center text-xs font-bold ${
                          activeStep === i ? 'bg-[#00ff88] text-[#0a0e27]' : 'border border-[#00ff88]/50 text-[#00ff88]/70'
                        }`}>
                          {i + 1}
                        </span>
                        <div>
                          <p className={`font-bold text-xs ${activeStep === i ? 'text-[#00ff88]' : 'text-[#00ff88]/70'}`}>
                            {step.label}
                          </p>
                          <p className="text-[10px] text-[#00ff88]/50">{step.agent} AGENT</p>
                        </div>
                      </div>
                    </motion.li>
                  ))}
                </ol>
              </div>
            </motion.div>

            {/* Agents Status Terminal */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="terminal-card"
            >
              <div className="terminal-header">
                <div className="terminal-dot bg-red-500" />
                <div className="terminal-dot bg-yellow-500" />
                <div className="terminal-dot bg-green-500" />
                <span className="ml-4 text-[#00ff88]/70 text-xs font-bold">AGENTS.STATUS</span>
              </div>
              <div className="p-6">
                <ul className="space-y-3">
                  {Object.entries(agentsStatus).map(([agent, status], i) => (
                    <motion.li
                      key={agent}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7 + i * 0.1 }}
                      className="flex items-center justify-between"
                    >
                      <span className="font-bold text-[#00ff88]">{agent.toUpperCase()}</span>
                      <span className={`text-xs font-bold px-2 py-1 border ${
                        status === 'Online' ? 'border-[#00ff88] text-[#00ff88] bg-[#00ff88]/5' : 'border-[#00ff88]/30 text-[#00ff88]/60'
                      }`}>
                        {status.toUpperCase()}
                      </span>
                    </motion.li>
                  ))}
                </ul>
              </div>
            </motion.div>

            {/* Memory Info Terminal */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 }}
              className="terminal-card"
            >
              <div className="terminal-header">
                <div className="terminal-dot bg-red-500" />
                <div className="terminal-dot bg-yellow-500" />
                <div className="terminal-dot bg-green-500" />
                <span className="ml-4 text-[#00ff88]/70 text-xs font-bold">MEMORY.INFO</span>
              </div>
              <div className="p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[#00ff88] font-bold">CHROMADB</span>
                  <span className={systemHealth.chroma?.ok ? 'text-[#00ff88]' : 'text-[#00ff88]/60'}>
                    {systemHealth.chroma?.ok ? `${systemHealth.chroma.documents ?? 0} VECTORS` : 'CONNECTING...'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#00ff88] font-bold">MONGODB</span>
                  <span className={systemHealth.mongodb?.ok ? 'text-[#00ff88]' : 'text-[#00ff88]/60'}>
                    {systemHealth.mongodb?.ok ? 'CONNECTED' : 'CONNECTING...'}
                  </span>
                </div>
                <div className="pt-3 border-t border-[#00ff88]/20 mt-3">
                  <p className="text-[#00ff88]/50 text-xs">
                    MODELS: MINILM-L6-V2 · BGE RERANKER · DEBERTA-V3
                  </p>
                </div>
                <button
                  onClick={restoreSession}
                  disabled={!connected}
                  className="btn-terminal w-full mt-4 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  RESTORE CHECKPOINT
                </button>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-8 pt-6 border-t border-[#00ff88]/20"
        >
          <div className="flex flex-wrap gap-4 text-[#00ff88]/50 text-xs font-mono">
            <span>API: http://127.0.0.1:8000</span>
            <span>UI: http://127.0.0.1:5173</span>
            <span>EXT: traeguardian.traeguardian</span>
          </div>
        </motion.footer>
      </div>
    </div>
  );
}

export default Home;
