
import React from 'react';
import { AppSettings, User } from '../types';

interface SettingsViewProps {
  settings: AppSettings;
  user: User;
  onUpdate: (settings: AppSettings) => void;
  onClearData: () => void;
  onExport: () => void;
  onLogout: () => void;
  onSyncToCloud: () => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ settings, user, onUpdate, onClearData, onExport, onLogout, onSyncToCloud }) => {
  const updateField = (field: keyof AppSettings, value: any) => {
    onUpdate({ ...settings, [field]: value });
  };

  return (
    <div className="flex-1 h-full overflow-y-auto custom-scrollbar px-8 pt-10 pb-32 animate-fade-in">
      <div className="max-w-3xl mx-auto">
        <header className="mb-12 border-b border-border-primary pb-8">
          <h1 className="text-2xl font-bold tracking-tighter mb-1">Configuration</h1>
          <p className="text-xs text-text-secondary uppercase tracking-widest opacity-60">Engine Preferences</p>
        </header>

        <div className="space-y-24">
          <section>
            <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-text-secondary mb-10 border-b border-border-primary pb-2">User Identity</h2>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[18px] font-bold tracking-tight mb-1">{user.name}</div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-text-secondary flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${user.isCloud ? 'bg-green-500' : 'bg-accent'}`}></span>
                  {user.isCloud ? `Cloud Account (${user.email})` : 'Local Workspace'}
                </div>
              </div>
              <button
                onClick={onLogout}
                className="text-[10px] font-bold uppercase tracking-[0.2em] border border-border-primary px-6 py-2 hover:bg-accent hover:text-bg-main transition-all active:scale-[0.98]"
              >
                Sign Out
              </button>
            </div>
          </section>
          <section>
            <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-text-secondary mb-10 border-b border-border-primary pb-2">Appearance</h2>
            <div className="flex items-center justify-between max-w-md">
              <span className="text-[13px] font-bold uppercase tracking-widest text-text-secondary">UI Theme</span>
              <div className="flex gap-1 bg-bg-surface p-1 border border-border-primary">
                {['light', 'dark'].map((t) => (
                  <button
                    key={t}
                    onClick={() => updateField('theme', t)}
                    className={`px-6 py-2 text-[10px] font-bold uppercase tracking-widest transition-all ${settings.theme === t ? 'bg-accent text-bg-main' : 'text-text-secondary hover:text-text-primary'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-text-secondary mb-10 border-b border-border-primary pb-2">Intelligence Pipeline</h2>
            <div className="space-y-8 max-w-md">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[13px] font-bold uppercase tracking-widest">Sticky Mode</div>
                  <div className="text-[11px] text-text-secondary mt-1">Retain template state per session</div>
                </div>
                <button
                  onClick={() => updateField('stickyMode', !settings.stickyMode)}
                  className={`w-10 h-5 border border-border-primary p-0.5 transition-colors ${settings.stickyMode ? 'bg-accent' : 'bg-bg-surface'}`}
                >
                  <div className={`h-full w-4 bg-bg-main transition-all ${settings.stickyMode ? 'ml-auto' : 'ml-0'}`}></div>
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[13px] font-bold uppercase tracking-widest">Assistive Mode</div>
                  <div className="text-[11px] text-text-secondary mt-1">Show inline pattern suggestions</div>
                </div>
                <button
                  onClick={() => updateField('templateSuggestions', !settings.templateSuggestions)}
                  className={`w-10 h-5 border border-border-primary p-0.5 transition-colors ${settings.templateSuggestions ? 'bg-accent' : 'bg-bg-surface'}`}
                >
                  <div className={`h-full w-4 bg-bg-main transition-all ${settings.templateSuggestions ? 'ml-auto' : 'ml-0'}`}></div>
                </button>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-text-secondary mb-10 border-b border-border-primary pb-2">System Operations</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {user.isCloud && (
                <div
                  className="group border border-accent p-8 hover:bg-accent/5 transition-all cursor-pointer"
                  onClick={onSyncToCloud}
                >
                  <div className="text-[11px] font-bold uppercase tracking-widest mb-2 text-accent">Push Local to Cloud</div>
                  <p className="text-[12px] text-text-secondary leading-relaxed mb-6">Force-upload all local chats and patterns to your account.</p>
                  <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-accent opacity-0 group-hover:opacity-100 transition-opacity">Execute Cloud Sync</span>
                </div>
              )}

              <div
                className="group border border-border-primary p-8 hover:border-accent transition-all cursor-pointer"
                onClick={onExport}
              >
                <div className="text-[11px] font-bold uppercase tracking-widest mb-2">Export Data</div>
                <p className="text-[12px] text-text-secondary leading-relaxed mb-6">Archive all logs and custom patterns as JSON.</p>
                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-accent opacity-0 group-hover:opacity-100 transition-opacity">Execute Download</span>
              </div>

              <div
                className="group border border-border-primary p-8 hover:border-accent transition-all cursor-pointer"
                onClick={onClearData}
              >
                <div className="text-[11px] font-bold uppercase tracking-widest mb-2 text-red-500">Purge Memory</div>
                <p className="text-[12px] text-text-secondary leading-relaxed mb-6">Permanently remove all local data cache.</p>
                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">Confirm Purge</span>
              </div>
            </div>
          </section>

          <footer className="pt-20 border-t border-border-primary opacity-50 text-center">
            <div className="text-[9px] font-bold uppercase tracking-[0.5em] text-text-secondary">Homework Intelligence Standard v1.0.0</div>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
