import { MessageSquare, Globe, Lock, User } from 'lucide-react';

export default function KOLBottomTab({ activeTab, onTabChange }) {
  const tabs = [
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'web3', label: 'Web3', icon: Globe },
    { id: 'vault', label: 'Vault', icon: Lock },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 w-full z-50 flex justify-around items-center h-20 px-4 pb-safe bg-white/90 backdrop-blur-lg border-t border-slate-200 shadow-[0_-4px_12px_rgba(11,28,61,0.08)] rounded-t-2xl">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex flex-col items-center justify-center transition-all ${
              isActive ? 'text-brand-primary scale-110' : 'text-slate-400'
            }`}
          >
            <Icon className={`w-6 h-6 ${isActive ? 'fill-current' : ''}`} />
            <span className="text-[11px] font-bold uppercase tracking-wider mt-1">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
