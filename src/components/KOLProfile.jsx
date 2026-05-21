import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Edit as EditIcon,
  Wallet as WalletIcon,
  User as UserIcon,
  Mail as MailIcon,
  FileText,
  Plus as PlusIcon,
  CheckCheck,
  Lock as LockIcon,
  Shield as ShieldIcon,
  ChevronRight,
  Save as SaveIcon,
  LogOut as LogOutIcon,
} from 'lucide-react';
import { apiFetch } from '../utils/api';
import { toProfileView, getDisplayName } from '../utils/profileHelpers';

const DEFAULT_AVATAR = 'https://api.dicebear.com/7.x/avataaars/svg?seed=verified';
const EMPTY_BIO_PLACEHOLDER =
  'Share your story, expertise, and what you\'re currently building in the Web3 space...';

export default function KOLProfile({ onBack, onDisconnect, userProfile, isOwnProfile = true }) {
  const isReadOnly = !isOwnProfile;
  const profileId = isReadOnly && userProfile?._id ? userProfile._id : null;

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [profileMeta, setProfileMeta] = useState({ fullName: 'User', username: '' });
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    bio: '',
    avatar: DEFAULT_AVATAR,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('idle');
  const fileInputRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    const loadProfile = async () => {
      setLoading(true);
      setLoadError('');
      try {
        const data = isReadOnly
          ? await apiFetch(`/api/users/${profileId}`)
          : await apiFetch('/api/auth/me');

        if (cancelled) return;

        const view = toProfileView(data.user || data, DEFAULT_AVATAR);
        setProfileMeta({ fullName: view.fullName, username: view.username });
        setFormData({
          fullName: view.fullName,
          username: view.username,
          bio: view.bio || (isReadOnly ? '' : ''),
          avatar: view.avatar,
        });
      } catch (error) {
        if (!cancelled) {
          setLoadError(error.message || 'Unable to load profile');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadProfile();
    return () => {
      cancelled = true;
    };
  }, [isReadOnly, profileId]);

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file || isReadOnly) return;

    if (file.size > 500 * 1024) {
      alert('Selected image is too large! Please choose a profile picture under 500KB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => ({ ...prev, avatar: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleChange = (field, value) => {
    if (isReadOnly) return;
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus('idle');
    try {
      const response = await apiFetch('/api/users/profile', {
        method: 'PUT',
        body: JSON.stringify({
          fullName: formData.fullName.trim(),
          bio: formData.bio.trim(),
          profilePicture: formData.avatar,
        }),
      });

      const view = toProfileView(response.user, DEFAULT_AVATAR);
      setProfileMeta({ fullName: view.fullName, username: view.username });
      setFormData({
        fullName: view.fullName,
        username: view.username,
        bio: view.bio,
        avatar: view.avatar,
      });
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      alert(error.message || 'Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  const displayTitle = isReadOnly
    ? `${getDisplayName(profileMeta)}'s Profile`
    : 'My Settings';

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
        Loading profile…
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
        <p className="text-sm text-red-500 font-semibold">{loadError}</p>
        <button onClick={onBack} className="text-brand-primary font-bold">
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto w-full">
      <div className="max-w-2xl mx-auto px-4 py-8 pb-48">
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleAvatarChange}
        />
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-slate-500 hover:text-brand-primary transition-colors font-semibold"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold text-brand-primary">{displayTitle}</h1>
          </div>
        </div>

        <section className="mb-10 flex flex-col items-center text-center">
          <div
            onClick={() => !isReadOnly && fileInputRef.current?.click()}
            className={`relative group ${isReadOnly ? '' : 'cursor-pointer hover:scale-105 transition-transform'}`}
          >
            <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-white shadow-lg ring-2 ring-brand-primary/10">
              <img alt="Avatar" className="w-full h-full object-cover" src={formData.avatar} />
            </div>
            {!isReadOnly && (
              <div className="absolute bottom-0 right-0 bg-brand-primary text-white p-1.5 rounded-full border-2 border-white shadow-sm flex items-center justify-center">
                <PlusIcon className="w-3 h-3 fill-current" />
              </div>
            )}
          </div>

          <div className="mt-4">
            <h2 className="text-2xl font-black text-brand-primary tracking-tight">
              {formData.fullName}
            </h2>
            <p className="text-sm text-slate-500 font-mono mt-1">@{formData.username}</p>
            <div className="flex items-center justify-center gap-2 mt-2">
              <span className="bg-slate-100 px-3 py-1 rounded-full text-xs font-mono text-slate-600 flex items-center gap-1.5 border border-slate-200">
                <WalletIcon className="w-3 h-3" />
                0x71C...4E2
              </span>
              <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-emerald-600">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Online
              </span>
            </div>
          </div>
        </section>

        <div className="space-y-6">
          <SettingsGroup title="Profile Details">
            <EditableItem
              icon={UserIcon}
              label="Display Name"
              value={formData.fullName}
              onChange={(val) => handleChange('fullName', val)}
              readOnly={isReadOnly}
            />
            <EditableItem
              icon={MailIcon}
              label="Username"
              value={formData.username}
              onChange={(val) => handleChange('username', val)}
              prefix="@"
              readOnly
            />
            <EditableItem
              icon={FileText}
              label="Bio"
              value={formData.bio}
              onChange={(val) => handleChange('bio', val)}
              isMultiline
              readOnly={isReadOnly}
              placeholder={isReadOnly ? 'No bio yet.' : EMPTY_BIO_PLACEHOLDER}
            />
          </SettingsGroup>

          <SettingsGroup title="Privacy & Security">
            <SettingsItem
              icon={LockIcon}
              label="End-to-End Encryption"
              value="Always active for your safety"
              action={<Toggle active />}
            />
            <SettingsItem
              icon={ShieldIcon}
              label="Wallet Visibility"
              value="Manage who can see your assets"
            />
          </SettingsGroup>

          <SettingsGroup title="Trust & Security Protocols">
            <SettingsItem
              icon={ShieldIcon}
              label="Anti-Phishing Handshake"
              value="Active: SHA-256 Verified"
              action={
                <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-1 rounded border border-emerald-100">
                  SECURE
                </span>
              }
            />
            <SettingsItem
              icon={FileText}
              label="Security Audit Status"
              value="Last check: 4 mins ago"
              action={
                <span className="text-[10px] font-bold text-blue-500 bg-blue-50 px-2 py-1 rounded border border-blue-100">
                  PASSED
                </span>
              }
            />
            <SettingsItem icon={LockIcon} label="Session Isolation" value="Level 4 Sandbox Active" />
          </SettingsGroup>

          {!isReadOnly && (
            <div className="space-y-3 pt-4">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className={`w-full font-bold py-4 rounded-2xl shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 ${
                  saveStatus === 'success'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-brand-primary text-white shadow-brand-primary/20'
                }`}
              >
                {isSaving ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : saveStatus === 'success' ? (
                  <>
                    <CheckCheck className="w-4 h-4" />
                    Saved Successfully
                  </>
                ) : (
                  <>
                    <SaveIcon className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
              <button
                onClick={onDisconnect}
                className="w-full text-brand-error font-bold py-4 rounded-2xl border border-brand-error/20 hover:bg-brand-error/5 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <LogOutIcon className="w-4 h-4" />
                Disconnect Wallet
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SettingsGroup({ title, children }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-100">
      <div className="px-5 py-4 border-b border-slate-50 bg-slate-50/50">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{title}</h3>
      </div>
      <div className="divide-y divide-slate-50">{children}</div>
    </div>
  );
}

function EditableItem({
  icon: IconComponent,
  label,
  value,
  onChange,
  prefix,
  isMultiline,
  readOnly,
  placeholder,
}) {
  const isEditableBio = isMultiline && !readOnly;

  return (
    <div
      className={`p-4 flex gap-4 transition-colors group ${
        isEditableBio ? 'items-start' : 'items-center'
      } ${readOnly ? '' : 'hover:bg-slate-50'}`}
    >
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center text-brand-primary transition-colors shrink-0 ${
          readOnly ? 'bg-slate-50' : 'bg-slate-100 group-hover:bg-white'
        } ${isEditableBio ? 'mt-1' : ''}`}
      >
        <IconComponent className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-1">{label}</p>
        <div className="flex items-center gap-1 group-focus-within:text-brand-secondary">
          {prefix && <span className="text-brand-primary font-bold">{prefix}</span>}
          {isMultiline ? (
            <textarea
              value={value ?? ''}
              onChange={(e) => onChange(e.target.value)}
              readOnly={readOnly}
              placeholder={placeholder}
              rows={4}
              className={`w-full text-sm font-medium text-slate-800 leading-relaxed min-h-[100px] max-h-[220px] overflow-y-auto ${
                readOnly
                  ? 'bg-transparent border-none p-0 resize-none cursor-default text-slate-600'
                  : 'bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-secondary/30 focus:border-brand-secondary resize-y'
              }`}
            />
          ) : (
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              readOnly={readOnly}
              className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm font-semibold text-slate-800"
            />
          )}
        </div>
        {isEditableBio && (
          <p className="text-[10px] text-slate-400 mt-2">Tap above to write your bio, then press Save Changes.</p>
        )}
      </div>
      {!readOnly && !isMultiline && (
        <EditIcon className="w-4 h-4 text-slate-300 group-focus-within:text-brand-secondary transition-colors shrink-0" />
      )}
    </div>
  );
}

function SettingsItem({ icon: IconComponent, label, value, action }) {
  return (
    <div className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer group">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-brand-primary group-hover:bg-white transition-colors">
          <IconComponent className="w-5 h-5" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-800">{label}</p>
          <p className="text-xs text-slate-400">{value}</p>
        </div>
      </div>
      {action ? action : <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-500 transition-colors" />}
    </div>
  );
}

function Toggle({ active }) {
  return (
    <div
      className={`w-10 h-5 rounded-full relative transition-colors ${active ? 'bg-brand-secondary' : 'bg-slate-300'}`}
    >
      <div
        className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${active ? 'right-1' : 'left-1'}`}
      />
    </div>
  );
}
