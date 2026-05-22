import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import Tilt from 'react-parallax-tilt';
import {
  Terminal,
  Shield,
  Cpu,
  Database,
  Code,
  Bot,
  GitBranch,
  Target,
  Users,
  Server,
  Globe,
  Layers,
  Brain,
  Zap,
  ChevronRight
} from 'lucide-react';
import { useState } from 'react';

const ARCHITECTURE_STEPS = [
  {
    icon: <Terminal className="w-10 h-10" />,
    title: '1. Error Detection',
    desc: 'Terminal errors are captured in real-time from your IDE environment.'
  },
  {
    icon: <Database className="w-10 h-10" />,
    title: '2. Memory Retrieval',
    desc: 'ChromaDB + BGE reranker fetches similar past solutions.'
  },
  {
    icon: <Brain className="w-10 h-10" />,
    title: '3. Root Cause Analysis',
    desc: 'DeBERTa-v3 classifies and analyzes the error pattern.'
  },
  {
    icon: <Code className="w-10 h-10" />,
    title: '4. Recovery Plan',
    desc: 'Recovery agent composes a step-by-step fix strategy.'
  },
  {
    icon: <Layers className="w-10 h-10" />,
    title: '5. Persistence',
    desc: 'MongoDB + ChromaDB store the solution for future reference.'
  }
];

const WHO_IT_FOR = [
  { icon: <Users className="w-8 h-8" />, title: 'Developers', desc: 'Streamline debugging in your daily workflow' },
  { icon: <Target className="w-8 h-8" />, title: 'Teams', desc: 'Share error resolutions across your organization' },
  { icon: <Server className="w-8 h-8" />, title: 'DevOps', desc: 'Automate error diagnosis in production pipelines' }
];

function Architecture() {
  const { scrollY } = useScroll();
  const smoothScrollY = useSpring(scrollY, { stiffness: 100, damping: 30 });
  const y1 = useTransform(smoothScrollY, [0, 600], [0, -80]);
  const y2 = useTransform(smoothScrollY, [0, 600], [0, 80]);
  const opacity1 = useTransform(smoothScrollY, [0, 300], [1, 0.5]);
  const opacity2 = useTransform(smoothScrollY, [0, 300], [1, 0.7]);
  const [githubUrl, setGithubUrl] = useState('https://github.com/deba2k5/hackarenatrae');

  return (
    <div className="min-h-screen">
      {/* Floating Parallax Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute top-10 left-10 w-[28rem] h-[28rem] bg-fuchsia-600/12 rounded-full blur-3xl"
          style={{ y: y1, opacity: opacity1 }}
        />
        <motion.div
          className="absolute bottom-10 right-10 w-[32rem] h-[32rem] bg-indigo-600/12 rounded-full blur-3xl"
          style={{ y: y2, opacity: opacity2 }}
        />
      </div>

      {/* Hero Section */}
      <section className="relative z-10">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-24">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-6xl md:text-7xl font-black mb-8 leading-tight">
              How <span className="gradient-text">TraeGuardian</span> Works
            </h1>
            <p className="text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
              A multi-agent system powered by LangGraph, ChromaDB, and local ML models.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Architecture Diagram */}
      <section className="relative z-10">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            <Tilt
              tiltMaxAngleX={4}
              tiltMaxAngleY={4}
              scale={1.02}
              transitionSpeed={400}
              className="glass-card p-12 mb-16"
            >
              <h2 className="text-4xl font-bold text-center mb-12">System Architecture</h2>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                {ARCHITECTURE_STEPS.map((step, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.15, duration: 0.6 }}
                    className="relative"
                  >
                    <Tilt
                      tiltMaxAngleX={5}
                      tiltMaxAngleY={5}
                      scale={1.03}
                      transitionSpeed={300}
                      className="glass-card p-8 h-full"
                    >
                      <div className="mb-6 w-16 h-16 bg-gradient-to-br from-fuchsia-600/20 to-indigo-600/20 rounded-2xl flex items-center justify-center">
                        <div className="text-fuchsia-400">{step.icon}</div>
                      </div>
                      <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                      <p className="text-slate-400 text-base">{step.desc}</p>
                    </Tilt>
                    {i < ARCHITECTURE_STEPS.length - 1 && (
                      <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 z-10">
                        <ChevronRight className="w-8 h-8 text-fuchsia-400" />
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </Tilt>
          </motion.div>
        </div>
      </section>

      {/* For Whom? */}
      <section className="relative z-10">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            <h2 className="text-4xl font-bold text-center mb-12">Who Is This For?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {WHO_IT_FOR.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.15, duration: 0.7 }}
                >
                  <Tilt
                    tiltMaxAngleX={6}
                    tiltMaxAngleY={6}
                    scale={1.03}
                    transitionSpeed={300}
                    className="glass-card p-10 h-full"
                  >
                    <div className="mb-6 w-16 h-16 bg-gradient-to-br from-fuchsia-600/20 to-indigo-600/20 rounded-2xl flex items-center justify-center">
                      <div className="text-fuchsia-400">{item.icon}</div>
                    </div>
                    <h3 className="text-2xl font-bold mb-4">{item.title}</h3>
                    <p className="text-slate-400 text-lg">{item.desc}</p>
                  </Tilt>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* GitHub Repo */}
      <section className="relative z-10">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 py-16">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            <Tilt
              tiltMaxAngleX={4}
              tiltMaxAngleY={4}
              scale={1.02}
              transitionSpeed={400}
              className="glass-card p-12"
            >
              <div className="flex items-center gap-5 mb-8">
                <GitBranch className="w-12 h-12 text-fuchsia-400" />
                <h2 className="text-4xl font-bold">Connect Your GitHub Repo</h2>
              </div>
              <p className="text-xl text-slate-300 mb-8">
                Add your repository to enable project-specific error resolution.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <input
                  type="text"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  className="input-field flex-1 text-lg"
                  placeholder="https://github.com/username/repo"
                />
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  className="btn-primary text-lg"
                >
                  Connect
                </motion.button>
              </div>
            </Tilt>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.8 }}
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

export default Architecture;
