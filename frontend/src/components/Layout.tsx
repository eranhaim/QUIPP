import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';

const menuItems = [
  { label: 'My Passport', href: '/passport/alex' },
  { label: 'Academy', href: '/academy' },
  { label: 'Credentials', href: '/passport/alex' },
  { label: 'About', href: '/' },
];

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Top Nav — minimal */}
      <nav className="sticky top-0 z-50 bg-background border-b border-border">
        <div className="max-w-[1200px] mx-auto px-5 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <span className="text-xl font-extrabold font-display text-foreground tracking-tight lowercase">quipp</span>
          </Link>
          <button
            onClick={() => setOpen(true)}
            className="text-foreground"
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </nav>

      {/* Full-screen burger overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="fixed inset-0 z-[100] flex flex-col"
            style={{ background: '#221f20' }}
          >
            <div className="max-w-[1200px] w-full mx-auto px-5 h-16 flex items-center justify-between">
              <span className="text-xl font-extrabold font-display text-primary tracking-tight lowercase">quipp</span>
              <button onClick={() => setOpen(false)} className="text-white" aria-label="Close menu">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 flex flex-col justify-center px-10 md:px-20 gap-6">
              {menuItems.map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * i, duration: 0.3 }}
                >
                  <Link
                    to={item.href}
                    onClick={() => setOpen(false)}
                    className="text-3xl md:text-4xl font-bold font-display text-white hover:text-primary transition-colors"
                  >
                    {item.label}
                  </Link>
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * menuItems.length, duration: 0.3 }}
              >
                {user ? (
                  <button
                    onClick={() => { logout(); setOpen(false); }}
                    className="text-3xl md:text-4xl font-bold font-display text-white hover:text-primary transition-colors"
                  >
                    Sign Out
                  </button>
                ) : (
                  <Link
                    to="/login"
                    onClick={() => setOpen(false)}
                    className="text-3xl md:text-4xl font-bold font-display text-white hover:text-primary transition-colors"
                  >
                    Sign In / Register
                  </Link>
                )}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main>{children}</main>

      {/* Footer */}
      <footer style={{ background: '#221f20' }}>
        <div className="max-w-[1200px] mx-auto px-5 py-16 text-center">
          <h3 className="text-2xl md:text-3xl font-bold font-display text-white mb-2">
            GET <span className="text-primary">QUIPP'D</span>
          </h3>
          <p className="text-sm text-white/60 mb-6">Your skills. Your story. Your future.</p>
          <p className="text-xs text-white/70">quipp.co · © 2026 Joonius Inc.</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
