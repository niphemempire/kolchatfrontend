import React, { useState } from 'react';
import { Wallet, Lock, Eye, EyeOff, ShieldCheck, ArrowLeft } from 'lucide-react';
import { z } from 'zod';
import { apiFetch } from '../utils/api';

const loginSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }).optional(),
  username: z.string().min(3, { message: "Username must be at least 3 characters" }).regex(/^[a-z0-9_]+$/, { message: "Lowercase letters, numbers, and underscores only" }).optional(),
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string()
    .min(8, { message: "Password must be at least 8 characters" })
    .regex(/[A-Za-z]/, { message: "Password must contain letters" })
    .regex(/[0-9]/, { message: "Password must contain numbers" })
});

const EMPTY_FORM = { name: '', username: '', email: '', password: '' };

const GoogleIcon = (props) => (
  <img
    {...props}
    src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png"
    alt="Google"
    className={`${props.className} grayscale group-hover:grayscale-0 transition-opacity`}
  />
);

export default function AppLogin({ onLoginSuccess, onBack }) {
  const [activeTab, setActiveTab] = useState('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');

  const resetForm = () => {
    setFormData({ ...EMPTY_FORM });
    setErrors({});
    setServerError('');
    setShowPassword(false);
  };

  const handleTabChange = (tab) => {
    if (tab === activeTab) return;
    resetForm();
    setActiveTab(tab);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setServerError('');

    const dataToValidate = {
      email: formData.email,
      password: formData.password
    };

    if (activeTab === 'signup') {
      dataToValidate.name = formData.name;
      dataToValidate.username = formData.username;

      if (!formData.name) {
        setErrors(prev => ({ ...prev, name: 'Name is required' }));
        return;
      }
      if (!formData.username) {
        setErrors(prev => ({ ...prev, username: 'Username is required' }));
        return;
      }
    }

    const result = loginSchema.safeParse(dataToValidate);
    if (!result.success) {
      const formattedErrors = {};
      result.error.issues.forEach(issue => {
        formattedErrors[issue.path[0]] = issue.message;
      });
      setErrors(formattedErrors);
      return;
    }

    setIsLoading(true);
    try {
      if (activeTab === 'signup') {
        await apiFetch('/api/auth/signup', {
          method: 'POST',
          body: JSON.stringify({
            fullname: formData.name,
            username: formData.username,
            email: formData.email,
            password: formData.password,
          }),
        });
      } else {
        await apiFetch('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
          }),
        });
      }

      resetForm();
      onLoginSuccess();
    } catch (error) {
      if (error.status === 0) {
        setServerError(error.message);
      } else if (error.status === 400) {
        setServerError(error.message || 'Invalid credentials or signup conflict.');
      } else if (error.status === 401) {
        setServerError(error.message || 'Unauthorized. Please check your credentials.');
      } else if (error.status >= 500) {
        setServerError(error.message || 'Server error. Please try again later.');
      } else {
        setServerError(error.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-grow flex items-center justify-center px-6 py-12 relative">
      {showComingSoon && (
        <div className="absolute inset-0 z-50 bg-brand-primary/95 backdrop-blur-md flex items-center justify-center p-6 text-center animate-in fade-in duration-300">
          <div className="space-y-6 max-w-sm">
            <div className="w-20 h-20 bg-brand-secondary/20 rounded-full flex items-center justify-center mx-auto">
              <ShieldCheck className="w-10 h-10 text-brand-secondary" />
            </div>
            <h2 className="text-2xl font-bold text-white">Full Wallet Integration Coming Soon</h2>
            <p className="text-slate-300">We're finalizing our secure on-chain handshake protocol. For now, please use the standard login to preview the experience.</p>
            <button 
              onClick={() => setShowComingSoon(false)}
              className="px-8 py-3 bg-white text-brand-primary font-bold rounded-xl active:scale-95 transition-all"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      <div className="w-full max-w-md space-y-8">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-brand-primary transition-colors font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          Go Back
        </button>

        <div 
          className="glass-card rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both"
        >
          {/* Tab Switcher */}
          <div className="flex border-b border-slate-200/20">
            <button 
              type="button"
              onClick={() => handleTabChange('login')}
              className={`flex-1 py-6 text-lg font-semibold border-b-2 transition-all ${
                activeTab === 'login' ? 'border-brand-secondary text-brand-primary' : 'border-transparent text-brand-on-surface-variant hover:bg-slate-50'
              }`}
            >
              Login
            </button>
            <button 
              type="button"
              onClick={() => handleTabChange('signup')}
              className={`flex-1 py-6 text-lg font-semibold border-b-2 transition-all ${
                activeTab === 'signup' ? 'border-brand-secondary text-brand-primary' : 'border-transparent text-brand-on-surface-variant hover:bg-slate-50'
              }`}
            >
              Sign Up
            </button>
          </div>

          <div className="p-8 space-y-8">
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold text-brand-primary">{activeTab === 'login' ? 'Welcome Back' : 'Create Account'}</h1>
              <p className="text-sm text-brand-on-surface-variant">
                {activeTab === 'login' ? 'Access your decentralized conversations' : 'Join the world\'s most exclusive KOL network'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {activeTab === 'signup' && (
                <>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-brand-on-surface-variant uppercase tracking-wider pl-1">Full Name</label>
                    <input 
                      className={`w-full px-4 py-3 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-brand-secondary/20 focus:border-brand-secondary outline-none transition-all ${errors.name ? 'border-red-400' : 'border-slate-200'}`}
                      placeholder="John Doe"
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                    {errors.name && <p className="text-[10px] text-red-500 font-bold pl-1">{errors.name}</p>}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-brand-on-surface-variant uppercase tracking-wider pl-1">Username</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">@</span>
                      <input 
                        className={`w-full pl-8 pr-4 py-3 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-brand-secondary/20 focus:border-brand-secondary outline-none transition-all ${errors.username ? 'border-red-400' : 'border-slate-200'}`}
                        placeholder="username"
                        type="text"
                        value={formData.username}
                        onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                        required
                      />
                    </div>
                    {errors.username && <p className="text-[10px] text-red-500 font-bold pl-1">{errors.username}</p>}
                  </div>
                </>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-brand-on-surface-variant uppercase tracking-wider pl-1">Email</label>
                <div className="relative">
                  <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input 
                    className={`w-full pl-12 pr-4 py-3.5 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-brand-secondary/20 focus:border-brand-secondary outline-none transition-all ${errors.email ? 'border-red-400' : 'border-slate-200'}`}
                    placeholder="email@domain.com"
                    type="text"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>
                {errors.email && <p className="text-[10px] text-red-500 font-bold pl-1">{errors.email}</p>}
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-bold text-brand-on-surface-variant uppercase tracking-wider">Password</label>
                  {activeTab === 'login' && <a href="#" className="text-[10px] font-bold text-brand-secondary hover:underline">Forgot?</a>}
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input 
                    className={`w-full pl-12 pr-12 py-3.5 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-brand-secondary/20 focus:border-brand-secondary outline-none transition-all ${errors.password ? 'border-red-400' : 'border-slate-200'}`}
                    placeholder="••••••••"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    required
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand-primary"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && <p className="text-[10px] text-red-500 font-bold pl-1">{errors.password}</p>}
              </div>

              {serverError && (
                <div className="rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 px-4 py-3 text-sm font-semibold">
                  {serverError}
                </div>
              )}

              <button 
                type="submit"
                disabled={isLoading}
                className="w-full bg-brand-secondary text-white py-4 rounded-xl font-bold shadow-lg shadow-brand-secondary/20 hover:brightness-110 active:scale-[0.98] transition-all mt-4 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Processing...' : activeTab === 'login' ? 'Enter Chat Room' : 'Join the Network'}
              </button>
            </form>

            <div className="relative flex items-center py-4">
              <div className="flex-grow border-t border-slate-200/50" />
              <span className="flex-shrink mx-4 text-[10px] font-bold text-slate-400 tracking-widest">WEB3 SOCIAL CONNECT</span>
              <div className="flex-grow border-t border-slate-200/50" />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <SocialButton 
                onClick={() => setShowComingSoon(true)}
                label="METAMASK" 
                icon={Wallet} 
              />
              <SocialButton 
                onClick={() => setShowComingSoon(true)}
                label="GOOGLE" 
                icon={GoogleIcon} 
              />
              <SocialButton 
                onClick={() => setShowComingSoon(true)}
                label="WALLETCONNECT" 
                icon={ShieldCheck} 
              />
            </div>
          </div>
        </div>

        {/* Promo Card */}
        <div 
          className="p-6 rounded-2xl bg-brand-primary text-white border border-brand-primary/20 shadow-xl relative overflow-hidden group animate-in fade-in duration-700 delay-300 fill-mode-both"
        >
          <div className="relative z-10">
            <span className="text-[10px] font-bold tracking-widest uppercase text-slate-400 mb-2 block">New Feature</span>
            <h3 className="text-xl font-bold mb-2">Encrypted NFT Gating</h3>
            <p className="text-sm text-slate-300 opacity-90 max-w-[200px]">Verify your portfolio to join exclusive KOL circles.</p>
          </div>
          <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <ShieldCheck className="w-32 h-32" />
          </div>
        </div>
      </div>
    </div>
  );
}

function SocialButton({ label, icon: IconComponent, onClick }) {
  return (
    <button 
      onClick={onClick}
      className="flex flex-col items-center justify-center p-4 border border-slate-200 rounded-xl hover:bg-white hover:shadow-md transition-all group"
    >
      <IconComponent className="w-6 h-6 text-slate-500 group-hover:text-brand-primary transition-colors" />
      <span className="text-[8px] mt-2 font-bold text-slate-400 tracking-wider text-center">{label}</span>
    </button>
  );
}
