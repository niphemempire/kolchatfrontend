import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import KOLBottomTab from './components/KOLBottomTab';
import KOLHero from './components/KOLHero';
import AppLogin from './components/AppLogin';
import KOLChatRoom from './components/KOLChatRoom';
import KOLProfile from './components/KOLProfile';
import AppFooter from './components/AppFooter';
import { apiFetch } from './utils/api';
import { connectSocket, disconnectSocket } from './utils/socket';

export default function App() {
  const [view, setView] = useState('loading');   // start with loading while we check session
  const [activeTab, setActiveTab] = useState('chat');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);

  // On mount, check if the user already has a valid session cookie
  useEffect(() => {
    let cancelled = false;
    apiFetch('/api/auth/me')
      .then(() => {
        if (cancelled) return;
        // Cookie is still valid — restore logged-in state
        connectSocket();
        setIsLoggedIn(true);
        setView('app');
        setActiveTab('chat');
      })
      .catch(() => {
        if (cancelled) return;
        // No valid session — show landing page
        setView('landing');
      });
    return () => { cancelled = true; };
  }, []);

  const handleConnect = () => {
    if (isLoggedIn) {
      setView('app');
    } else {
      setView('login');
    }
  };

  const handleLoginSuccess = () => {
    connectSocket();
    setIsLoggedIn(true);
    setView('app');
    setActiveTab('chat');
  };

  const handleDisconnect = async () => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      disconnectSocket();
      setIsLoggedIn(false);
      setView('landing');
    }
  };

  const handleOpenSettings = (profile) => {
    setSelectedProfile(profile && profile._id ? profile : null);
    setActiveTab('profile');
  };

  return (
    <div className={`flex flex-col ${view === 'app' ? 'h-screen h-[100svh] overflow-hidden' : 'min-h-screen'}`}>
      <Navbar 
        currentPage={view === 'app' ? 'app' : view}
        onLoginClick={() => setView('login')}
        onSignUpClick={() => setView('login')}
      />

      <main className={`flex flex-col ${view === 'app' ? 'flex-1 overflow-hidden' : 'flex-grow'}`}>
        {view === 'loading' && (
          <div className="flex-grow flex items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-200 border-t-brand-secondary"></div>
          </div>
        )}

        {view === 'landing' && <KOLHero onConnectClick={handleConnect} />}
        
        {view === 'login' && <AppLogin onLoginSuccess={handleLoginSuccess} onBack={() => setView('landing')} />}
        
        {view === 'app' && (
          <>
            {activeTab === 'chat' && <KOLChatRoom onSettingsClick={handleOpenSettings} />}
            {activeTab === 'profile' && (
              <KOLProfile 
                onBack={() => setActiveTab('chat')} 
                onDisconnect={handleDisconnect} 
                userProfile={selectedProfile}
                isOwnProfile={!selectedProfile}
              />
            )}
            {(activeTab === 'web3' || activeTab === 'vault') && (
              <div className="flex-1 flex items-center justify-center p-12 text-center text-slate-400 pb-32 md:pb-12">
                <p className="text-lg font-bold">This section is coming soon in Beta 🚀</p>
              </div>
            )}
          </>
        )}
      </main>

      {view === 'landing' && <AppFooter />}
      
      {view === 'app' && (
        <KOLBottomTab 
          activeTab={activeTab} 
          onTabChange={(tab) => {
            if (tab === 'profile') {
              setSelectedProfile(null);
            }
            setActiveTab(tab);
          }} 
        />
      )}
    </div>
  );
}

