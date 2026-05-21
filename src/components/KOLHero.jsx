import { Wallet, ArrowRight, Verified, ShieldCheck as ShieldCheckIcon, Users, Key } from 'lucide-react';

export default function KOLHero({ onConnectClick }) {
  return (
    <div className="relative overflow-hidden pt-12 pb-24">
      {/* Background Decor */}
      <div className="absolute inset-0 purple-glow -z-10" />
      <div className="absolute inset-0 geometric-bg -z-10" />
      
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div 
          className="space-y-8 animate-in fade-in slide-in-from-left-8 duration-700 fill-mode-both"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-secondary/10 text-brand-secondary rounded-full border border-brand-secondary/20">
            <Verified className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Web3 Verified Access</span>
          </div>
          
          <h1 className="text-[56px] leading-[1.1] font-extrabold text-brand-primary tracking-tight">
            Where Web3 <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-purple">KOLs</span> Conduct High-Stakes Business.
          </h1>
          
          <p className="text-lg text-brand-on-surface-variant max-w-xl">
            The encrypted communication protocol built for creators, investors, and DAOs. Verified identity. Zero spam. Peer-to-peer security.
          </p>
          
          <div className="flex flex-wrap gap-4 pt-4">
            <button 
              onClick={onConnectClick}
              className="group flex items-center gap-3 px-8 py-4 bg-brand-primary text-white rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-95"
            >
              <Wallet className="w-5 h-5 fill-current" />
              <span className="font-bold text-lg">Connect to Chat</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="px-8 py-4 bg-white border border-slate-200 text-brand-primary rounded-xl font-bold hover:bg-slate-50 transition-all active:scale-95">
              View Whitepaper
            </button>
          </div>
          
          <div className="flex items-center gap-6 pt-8 border-t border-slate-200/60">
            <div className="flex -space-x-3">
              {[1, 2, 3].map((i) => (
                <img 
                  key={i}
                  className="w-10 h-10 rounded-full border-2 border-white object-cover" 
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 10}`} 
                  alt="KOL Avatar" 
                />
              ))}
            </div>
            <div className="text-sm font-medium text-brand-on-surface-variant">
              <span className="text-brand-primary font-bold">2,500+</span> Verified KOLs already active
            </div>
          </div>
        </div>

        <div 
          className="relative animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200 fill-mode-both"
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 glass-card rounded-2xl p-6 shadow-xl relative overflow-hidden group">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-200" />
                  <div>
                    <div className="w-24 h-3 bg-slate-200 rounded-full mb-2" />
                    <div className="w-16 h-2 bg-slate-100 rounded-full" />
                  </div>
                </div>
                <div className="flex gap-1">
                  <div className="w-1 h-1 bg-slate-300 rounded-full" />
                  <div className="w-1 h-1 bg-slate-300 rounded-full" />
                  <div className="w-1 h-1 bg-slate-300 rounded-full" />
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-end">
                  <div className="bg-brand-primary text-white p-4 rounded-2xl rounded-tr-none max-w-[80%] text-sm">
                    The deal terms for the Series A are confirmed. Ready to execute on-chain?
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-100 p-4 rounded-2xl rounded-tl-none max-w-[80%] text-sm shadow-sm">
                    Confirming now. Initializing multi-sig vault...
                  </div>
                </div>
              </div>
              
              <div className="absolute -bottom-2 -right-2 bg-gradient-to-br from-brand-purple to-brand-primary text-white p-4 rounded-xl shadow-2xl scale-90 md:scale-100">
                <div className="flex items-center gap-2 mb-2">
                  <Key className="w-3 h-3 fill-current" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">End-to-End Encrypted</span>
                </div>
                <div className="text-xs opacity-80 font-mono">Encryption Key: 0x71...4E2</div>
              </div>
            </div>
            
            <div className="glass-card rounded-xl p-6 flex flex-col justify-between min-h-[160px]">
              <Wallet className="w-8 h-8 text-brand-secondary" />
              <div>
                <h3 className="text-brand-primary font-bold">Wallet Gating</h3>
                <p className="text-xs text-brand-on-surface-variant">Access chats based on NFT or Token balances.</p>
              </div>
            </div>
            
            <div className="glass-card rounded-xl p-6 flex flex-col justify-between min-h-[160px]">
              <ShieldCheckIcon className="w-8 h-8 text-brand-purple" />
              <div>
                <h3 className="text-brand-primary font-bold">Safe Vault</h3>
                <p className="text-xs text-brand-on-surface-variant">Sign transactions directly within the chat UI.</p>
              </div>
            </div>
          </div>
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-brand-purple/20 blur-[80px] -z-10 rounded-full" />
        </div>
      </div>

      {/* Features List Section */}
      <section className="bg-white py-24 mt-24 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-brand-primary mb-4 tracking-tight">Built for the Web3 Ecosystem</h2>
            <p className="text-lg text-brand-on-surface-variant">Standard messaging is for everyone. KOL Chat is for those who value privacy, verification, and speed above all else.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={ShieldCheckIcon} 
              title="Proof of Identity" 
              description="Verify your social profile and on-chain holdings to gain trust. No more impersonators in your DMs." 
            />
            <FeatureCard 
              icon={Users} 
              title="DAO Management" 
              description="Host governance discussions with native snapshot integration and secure voting within chat threads." 
            />
            <FeatureCard 
              icon={Key} 
              title="Zero Knowledge" 
              description="Your messages never touch a centralized server. We use ZK-proofs to verify access without exposing your data." 
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon: IconComponent, title, description }) {
  return (
    <div className="p-8 rounded-2xl hover:bg-slate-50 transition-colors group">
      <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-brand-primary group-hover:text-white transition-colors">
        <IconComponent className="w-6 h-6" />
      </div>
      <h3 className="text-xl font-bold text-brand-primary mb-3">{title}</h3>
      <p className="text-sm text-brand-on-surface-variant leading-relaxed">{description}</p>
    </div>
  );
}
