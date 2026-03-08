import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/models', label: 'Models' },
  { to: '/generate', label: 'Generate' },
  { to: '/collaborate', label: 'Collaborate' },
  { to: '/mixer', label: 'Mixer' },
  { to: '/evaluation', label: 'Evaluation' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border">
      <div className="container flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2 font-heading text-lg font-bold">
          <span className="gradient-text">MusicGAN</span>
          <span className="text-muted-foreground text-sm">Research</span>
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map(l => (
            <Link
              key={l.to}
              to={l.to}
              className={`px-3 py-2 rounded-md text-sm transition-colors ${
                pathname === l.to ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:block">
          <Link
            to="/generate"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg gradient-bg text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
          >
            <Play className="w-3.5 h-3.5" /> Live Demo
          </Link>
        </div>

        {/* Mobile toggle */}
        <button onClick={() => setOpen(!open)} className="md:hidden text-foreground p-2">
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden overflow-hidden border-t border-border bg-card"
          >
            <div className="container py-4 flex flex-col gap-2">
              {NAV_LINKS.map(l => (
                <Link
                  key={l.to}
                  to={l.to}
                  onClick={() => setOpen(false)}
                  className={`px-3 py-2 rounded-md text-sm ${
                    pathname === l.to ? 'text-primary bg-primary/10' : 'text-muted-foreground'
                  }`}
                >
                  {l.label}
                </Link>
              ))}
              <Link
                to="/generate"
                onClick={() => setOpen(false)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg gradient-bg text-sm font-semibold text-primary-foreground mt-2"
              >
                <Play className="w-3.5 h-3.5" /> Live Demo
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
