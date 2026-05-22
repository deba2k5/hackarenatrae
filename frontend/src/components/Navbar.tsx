import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Terminal, LayoutDashboard } from 'lucide-react';
import { useState } from 'react';

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { name: 'Home', path: '/', icon: <Terminal className="w-4 h-4" /> },
    { name: 'Architecture', path: '/architecture', icon: <LayoutDashboard className="w-4 h-4" /> },
  ];

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-0 z-50 bg-[#0a0e27] border-b border-[#00ff88]/20"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#00ff88]/10 border-2 border-[#00ff88] rounded flex items-center justify-center">
              <Shield className="w-6 h-6 text-[#00ff88]" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-widest text-[#00ff88]">
                TRAEGUARDIAN
              </h1>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 px-4 py-2 font-bold tracking-wider transition-all duration-300 ${
                  location.pathname === item.path
                    ? 'bg-[#00ff88]/10 text-[#00ff88] border-b-2 border-[#00ff88]'
                    : 'text-[#00ff88]/60 hover:text-[#00ff88] hover:bg-[#00ff88]/5'
                }`}
              >
                {item.icon}
                {item.name.toUpperCase()}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </motion.nav>
  );
}

export default Navbar;
