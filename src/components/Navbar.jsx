import { useState } from 'react';
import { Shield as ShieldIcon, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Navbar({ onLoginClick, onSignUpClick, currentPage }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  const handleMobileNavClick = (action) => {
    setIsMobileMenuOpen(false);
    action();
  };

  return (
    <nav className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-50">
      <div className="flex justify-between items-center px-6 h-16 w-full max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-brand-primary rounded-lg flex items-center justify-center">
            <ShieldIcon className="text-white w-4 h-4 fill-current" />
          </div>
          <span className="text-xl font-black text-brand-primary tracking-tight">KOL Chat</span>
        </div>
        
        {currentPage === 'landing' && (
          <div className="hidden md:flex items-center space-x-8">
            <a className="text-brand-primary font-semibold tracking-tight" href="#">Home</a>
            <a className="text-slate-500 font-semibold tracking-tight hover:text-brand-primary transition-colors" href="#">Protocol</a>
            <a className="text-slate-500 font-semibold tracking-tight hover:text-brand-primary transition-colors" href="#">Safety</a>
          </div>
        )}

        <div className="flex items-center gap-4">
          {currentPage === 'landing' ? (
            <>
              <div className="hidden md:flex items-center gap-4">
                <button 
                  onClick={onLoginClick}
                  className="px-5 py-2 text-brand-primary font-semibold hover:bg-slate-100 transition-all rounded-lg active:scale-95"
                >
                  Login
                </button>
                <button 
                  onClick={onSignUpClick}
                  className="px-6 py-2.5 bg-brand-primary text-white font-bold rounded-lg shadow-md hover:bg-opacity-90 active:scale-95"
                >
                  Sign Up
                </button>
              </div>
              
              {/* Mobile Menu Toggle */}
              <button 
                onClick={toggleMobileMenu}
                className="md:hidden p-2 text-slate-600 hover:text-brand-primary transition-colors"
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </>
          ) : (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <ShieldIcon className="w-4 h-4 text-brand-secondary" />
                <span className="text-[10px] font-bold tracking-widest text-brand-secondary uppercase">Encrypted</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && currentPage === 'landing' && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="md:hidden absolute top-16 left-0 right-0 bg-white border-b border-slate-200 shadow-xl overflow-hidden"
          >
            <div className="flex flex-col p-6 gap-6">
              <div className="flex flex-col gap-4">
                <a className="text-lg font-bold text-brand-primary" href="#" onClick={() => setIsMobileMenuOpen(false)}>Home</a>
                <a className="text-lg font-medium text-slate-600 hover:text-brand-primary" href="#" onClick={() => setIsMobileMenuOpen(false)}>Protocol</a>
                <a className="text-lg font-medium text-slate-600 hover:text-brand-primary" href="#" onClick={() => setIsMobileMenuOpen(false)}>Safety</a>
              </div>
              <div className="border-t border-slate-100 pt-6 flex flex-col gap-4">
                <button 
                  onClick={() => handleMobileNavClick(onLoginClick)}
                  className="w-full py-4 text-brand-primary font-bold bg-slate-50 rounded-2xl active:scale-98 transition-transform"
                >
                  Login
                </button>
                <button 
                  onClick={() => handleMobileNavClick(onSignUpClick)}
                  className="w-full py-4 bg-brand-primary text-white font-bold rounded-2xl shadow-lg shadow-brand-primary/20 active:scale-98 transition-transform"
                >
                  Sign Up
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
