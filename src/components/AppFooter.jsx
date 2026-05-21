export default function AppFooter() {
  return (
    <footer className="bg-white dark:bg-slate-950 w-full py-12 border-t border-slate-100 dark:border-slate-900">
      <div className="flex flex-col md:flex-row justify-between items-center px-8 max-w-7xl mx-auto space-y-4 md:space-y-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-brand-primary dark:text-white">KOL Chat Protocol</span>
          <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[10px] font-bold text-slate-500">BETA</span>
        </div>
        <div className="flex items-center space-x-6">
          <a className="text-xs text-slate-500 hover:text-brand-primary transition-colors" href="#">Whitepaper</a>
          <a className="text-xs text-slate-500 hover:text-brand-primary transition-colors" href="#">Privacy</a>
          <a className="text-xs text-slate-500 hover:text-brand-primary transition-colors" href="#">Security</a>
          <a className="text-xs text-slate-500 hover:text-brand-primary transition-colors" href="#">Contact</a>
        </div>
        <div className="text-xs text-slate-600 dark:text-slate-400">
          © 2026 KOL Chat Protocol. Encrypted by Web3.
        </div>
      </div>
    </footer>
  );
}
