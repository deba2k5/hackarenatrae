import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Menu, X, GitBranch, Home, LayoutDashboard } from 'lucide-react';
import { useState } from 'react';

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { name: 'Home', path: '/', icon: <Home className="w-5 h-5" /> },
    { name: 'Architecture', path: '/architecture', icon: <LayoutDashboard className="w-5 h-5" /> },
  ];

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-0 z-50 backdrop-blur-3xl bg-slate-950/30 border-b border-white/5"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-5">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-4">
            <motion.div
              whileHover={{ scale: 1.1, rotate: 10 }}
              className="w-14 h-14 bg-gradient-to-br from-fuchsia-600 via-violet-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-fuchsia-500/40"
            >
              <Shield className="w-8 h-8 text-white" />
            </motion.div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">
                <span className="gradient-text">Trae</span>Guardian
              </h1>
              <p className="text-slate-400 text-sm">Autonomous AI Agent</p>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold transition-all duration-300 ${
                  location.pathname === item.path
                    ? 'bg-gradient-to-r from-fuchsia-600/20 to-indigo-600/20 text-white border border-fuchsia-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                {item.icon}
                {item.name}
              </Link>
            ))}
            <a
              href="https://github.com/deba2k5/hackarenatrae"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-6 py-3 bg-white/10 border border-white/20 rounded-xl font-semibold hover:border-fuchsia-400/50 hover:text-fuchsia-300 transition-all duration-300"
            >
              <GitBranch className="w-5 h-5" />
              GitHub
            </a>
          </div>

          <button
            className="md:hidden"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="w-8 h-8" /> : <Menu className="w-8 h-8" />}
          </button>
        </div>

        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 md:hidden space-y-3"
          >
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold transition-all duration-300 ${
                  location.pathname === item.path
                    ? 'bg-gradient-to-r from-fuchsia-600/20 to-indigo-600/20 text-white border border-fuchsia-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                {item.icon}
                {item.name}
              </Link>
            ))}
          </motion.div>
        )}
      </div>
    </motion.nav>
  );
}

export default Navbar;
