import { motion } from 'framer-motion';
import {
  Terminal,
  Database,
  Code,
  Bot,
  Target,
  Users,
  Server,
  Layers,
  Brain,
  GitBranch
} from 'lucide-react';
import { useState } from 'react';

const ARCHITECTURE_STEPS = [
  {
    icon: <Terminal className="w-6 h-6" />,
    title: '1. ERROR DETECTION',
    desc: 'Terminal errors are captured in real-time from your IDE environment.'
  },
  {
    icon: <Database className="w-6 h-6" />,
    title: '2. MEMORY RETRIEVAL',
    desc: 'ChromaDB + BGE reranker fetches similar past solutions.'
  },
  {
    icon: <Brain className="w-6 h-6" />,
    title: '3. ROOT CAUSE ANALYSIS',
    desc: 'DeBERTa-v3 classifies and analyzes the error pattern.'
  },
  {
    icon: <Code className="w-6 h-6" />,
    title: '4. RECOVERY PLAN',
    desc: 'Recovery agent composes a step-by-step fix strategy.'
  },
  {
    icon: <Layers className="w-6 h-6" />,
    title: '5. PERSISTENCE',
    desc: 'MongoDB + ChromaDB store the solution for future reference.'
  }
];

const WHO_IT_FOR = [
  { icon: <Users className="w-5 h-5" />, title: 'DEVELOPERS', desc: 'Streamline debugging in your daily workflow' },
  { icon: <Target className="w-5 h-5" />, title: 'TEAMS', desc: 'Share error resolutions across your organization' },
  { icon: <Server className="w-5 h-5" />, title: 'DEVOPS', desc: 'Automate error diagnosis in production pipelines' }
];

function Architecture() {
  const [githubUrl, setGithubUrl] = useState('https://github.com/deba2k5/hackarenatrae');

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      {/* Scanline Overlay */}
      <div className="fixed inset-0 scanline z-0" />

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <pre className="text-[#00ff88] text-xs sm:text-sm font-mono mb-4">
            <span className="text-[#00ff88]/60">╔════════════════════════════════════════════════════════════╗</span>
            <br />
            <span className="text-[#00ff88]/60">║</span>{' '}
            <span className="font-bold">SYSTEM</span>
            <span className="text-white">ARCHITECTURE</span>
            <span className="text-[#00ff88]/60"> - Multi-Agent Pipeline</span>
            <span className="text-[#00ff88]/60">                                     ║</span>
            <br />
            <span className="text-[#00ff88]/60">╚════════════════════════════════════════════════════════════╝</span>
          </pre>
          <p className="text-[#00ff88]/80 font-mono text-sm mb-2">
            <span className="text-[#00ff88]">user@traeg</span>:<span className="text-white">~</span>$ cat architecture.txt
          </p>
        </motion.div>

        {/* Architecture Diagram */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <div className="terminal-card">
            <div className="terminal-header">
              <div className="terminal-dot bg-red-500" />
              <div className="terminal-dot bg-yellow-500" />
              <div className="terminal-dot bg-green-500" />
              <span className="ml-4 text-[#00ff88]/70 text-xs font-bold">PIPELINE.DIAGRAM</span>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {ARCHITECTURE_STEPS.map((step, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                    className="p-4 border border-[#00ff88]/30"
                  >
                    <div className="mb-3 w-10 h-10 flex items-center justify-center border border-[#00ff88]">
                      <div className="text-[#00ff88]">{step.icon}</div>
                    </div>
                    <h3 className="text-[#00ff88] font-bold text-sm mb-2">{step.title}</h3>
                    <p className="text-[#00ff88]/60 text-xs">{step.desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* For Whom */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <div className="terminal-card">
            <div className="terminal-header">
              <div className="terminal-dot bg-red-500" />
              <div className="terminal-dot bg-yellow-500" />
              <div className="terminal-dot bg-green-500" />
              <span className="ml-4 text-[#00ff88]/70 text-xs font-bold">TARGET_AUDIENCE.CFG</span>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {WHO_IT_FOR.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + i * 0.1 }}
                    className="p-4 border border-[#00ff88]/30"
                  >
                    <div className="mb-3 w-10 h-10 flex items-center justify-center border border-[#00ff88]">
                      <div className="text-[#00ff88]">{item.icon}</div>
                    </div>
                    <h3 className="text-[#00ff88] font-bold text-sm mb-2">{item.title}</h3>
                    <p className="text-[#00ff88]/60 text-xs">{item.desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* GitHub Repo */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-8"
        >
          <div className="terminal-card">
            <div className="terminal-header">
              <div className="terminal-dot bg-red-500" />
              <div className="terminal-dot bg-yellow-500" />
              <div className="terminal-dot bg-green-500" />
              <span className="ml-4 text-[#00ff88]/70 text-xs font-bold">GITHUB_REPO.CONF</span>
            </div>
            <div className="p-6">
              <p className="text-[#00ff88]/80 text-sm mb-4">
                <span className="text-[#00ff88] font-bold">❯</span> Add your repository to enable project-specific error resolution.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  className="input-terminal flex-1"
                  placeholder="https://github.com/username/repo"
                />
                <button className="btn-terminal-primary">CONNECT</button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="pt-6 border-t border-[#00ff88]/20"
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

export default Architecture;
