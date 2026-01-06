
import React, { useState, useEffect, useMemo } from 'react';
import { ViewType, Chat, StyleTemplate, Message, AppSettings, User } from './types';
import { INITIAL_TEMPLATES, DEFAULT_SETTINGS } from './constants';
import { supabase, supabaseService } from './services/supabase';
import { groqService } from './services/groqService';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';
import TemplateManager from './components/TemplateManager';
import TemplateCreator from './components/TemplateCreator';
import SettingsView from './components/SettingsView';
import LoginPage from './components/LoginPage';

const App: React.FC = () => {
  const [view, setView] = useState<ViewType>('main');
  const [chats, setChats] = useState<Chat[]>([]);
  const [templates, setTemplates] = useState<StyleTemplate[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<StyleTemplate | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1200);
  const [isSystemDark, setIsSystemDark] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthRestored, setIsAuthRestored] = useState(false);

  // Initialize data
  useEffect(() => {
    const savedTemplates = localStorage.getItem('trainer_templates_v4');
    const savedChats = localStorage.getItem('trainer_chats_v4');
    const savedSettings = localStorage.getItem('trainer_settings_v4');
    const savedUser = localStorage.getItem('homework_user');

    if (savedUser) setUser(JSON.parse(savedUser));
    setIsAuthRestored(true);

    if (savedTemplates) setTemplates(JSON.parse(savedTemplates));
    else setTemplates(INITIAL_TEMPLATES);

    if (savedChats) {
      const parsedChats = JSON.parse(savedChats);
      setChats(parsedChats);
      if (parsedChats.length > 0) setActiveChatId(parsedChats[0].id);
    }

    if (savedSettings) setSettings(JSON.parse(savedSettings));

    // Monitor system theme
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsSystemDark(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setIsSystemDark(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Persist data
  useEffect(() => localStorage.setItem('trainer_templates_v4', JSON.stringify(templates)), [templates]);
  useEffect(() => localStorage.setItem('trainer_chats_v4', JSON.stringify(chats)), [chats]);
  useEffect(() => localStorage.setItem('trainer_settings_v4', JSON.stringify(settings)), [settings]);

  // Determine active theme
  const isDark = useMemo(() => {
    if (settings.theme === 'dark') return true;
    if (settings.theme === 'light') return false;
    return isSystemDark;
  }, [settings.theme, isSystemDark]);

  useEffect(() => {
    if (isDark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDark]);

  // Cloud Sync: Load data when user changes
  useEffect(() => {
    if (user?.isCloud) {
      supabaseService.getChats(user.id).then(cloudChats => {
        if (cloudChats.length > 0) {
          setChats(cloudChats);
          if (!activeChatId) setActiveChatId(cloudChats[0].id);
        }
      });
      supabaseService.getTemplates(user.id).then(cloudTemplates => {
        if (cloudTemplates.length > 0) setTemplates(cloudTemplates);
      });
    }
  }, [user]);

  const activeChat = useMemo(() => chats.find(c => c.id === activeChatId) || null, [chats, activeChatId]);

  const handleNewChat = () => {
    const newChat: Chat = {
      id: crypto.randomUUID(),
      title: 'New Chat',
      messages: [],
      createdAt: Date.now(),
      lastUpdatedAt: Date.now(),
    };
    setChats(prev => [newChat, ...prev]);
    setActiveChatId(newChat.id);
    if (user?.isCloud) supabaseService.upsertChat(user.id, newChat);
    setView('main');
    if (window.innerWidth < 1024) setIsSidebarOpen(false);
  };

  const handleUpdateMessages = async (chatId: string, messages: Message[]) => {
    // Optimistic update first
    setChats(prev => prev.map(c => {
      if (c.id === chatId) {
        const updated = { ...c, messages, lastUpdatedAt: Date.now() };
        if (user?.isCloud) supabaseService.upsertChat(user.id, updated);
        return updated;
      }
      return c;
    }));

    // Handle Title Generation
    const chat = chats.find(c => c.id === chatId);
    if (!chat) return;

    if (messages.length > 0) {
      const firstUserMsg = messages.find(m => m.role === 'user');
      const isNewChat = chat.title === 'New Chat' || !chat.title;

      if (firstUserMsg && isNewChat) {
        // Generate smart title
        groqService.generateTitle(firstUserMsg.content).then(newTitle => {
          setChats(prev => prev.map(c => {
            if (c.id === chatId) {
              const updated = { ...c, title: newTitle };
              if (user?.isCloud && user.id) supabaseService.upsertChat(user.id, updated);
              return updated;
            }
            return c;
          }));
        });
      }
    }
  };

  const handleRenameChat = (id: string, newTitle: string) => {
    setChats(prev => prev.map(c => {
      if (c.id === id) {
        const updated = { ...c, title: newTitle };
        if (user?.isCloud) supabaseService.upsertChat(user.id, updated);
        return updated;
      }
      return c;
    }));
  };

  const handleSaveTemplate = (templateData: Partial<StyleTemplate>) => {
    if (editingTemplate) {
      setTemplates(prev => {
        const updated = prev.map(t => t.id === editingTemplate.id ? { ...t, ...templateData } as StyleTemplate : t);
        if (user?.isCloud) supabaseService.upsertTemplate(user.id, updated.find(t => t.id === editingTemplate.id)!);
        return updated;
      });
    } else {
      const newTemplate: StyleTemplate = {
        id: crypto.randomUUID(),
        name: templateData.name || 'Untitled',
        description: templateData.description || '',
        icon: templateData.icon || 'fa-sparkles',
        inputExample: templateData.inputExample || '',
        outputExample: templateData.outputExample || '',
        createdAt: Date.now(),
        useCount: 0,
      };
      setTemplates(prev => [newTemplate, ...prev]);
      if (user?.isCloud) supabaseService.upsertTemplate(user.id, newTemplate);
    }
    setIsTemplateModalOpen(false);
    setEditingTemplate(null);
  };

  const handleDeleteChat = (id: string) => {
    const newChats = chats.filter(c => c.id !== id);
    setChats(newChats);
    if (activeChatId === id) setActiveChatId(newChats.length > 0 ? newChats[0].id : null);
    if (user?.isCloud) supabaseService.deleteChat(id);
  };

  const handleDeleteTemplate = (id: string) => {
    setTemplates(prev => prev.filter(t => t.id !== id));
    if (user?.isCloud) supabaseService.deleteTemplate(id);
  };

  const handleLogout = async () => {
    if (user?.isCloud) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem('homework_user');
    setUser(null);
    setView('main');
    setChats([]);
    setTemplates(INITIAL_TEMPLATES);
  };

  if (!isAuthRestored) return null;

  if (!user) {
    return <LoginPage onLogin={setUser} />;
  }

  return (
    <div className={`flex h-screen w-full overflow-hidden bg-bg-main text-text-primary transition-colors duration-300`}>
      {isSidebarOpen && (
        <Sidebar
          chats={chats}
          activeChatId={activeChatId}
          onSelectChat={(id) => { setActiveChatId(id); setView('main'); if (window.innerWidth < 1024) setIsSidebarOpen(false); }}
          onNewChat={handleNewChat}
          onDeleteChat={handleDeleteChat}
          onRenameChat={handleRenameChat}
          view={view}
          onSetView={setView}
          onLogout={handleLogout}
        />
      )}

      <main className="flex-1 relative flex flex-col h-full overflow-hidden border-l border-border-primary">
        <header className="h-14 flex items-center px-6 border-b border-border-primary bg-bg-main/80 backdrop-blur-md shrink-0 z-30">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 -ml-2 text-text-secondary hover:text-text-primary transition-colors focus:outline-none"
            aria-label="Toggle Sidebar"
          >
            <i className={`fa-solid ${isSidebarOpen ? 'fa-align-left' : 'fa-align-justify'} text-xs`}></i>
          </button>

          <div className="flex-1 flex items-center justify-between min-w-0">
            <h2 className="text-[10px] font-bold truncate uppercase tracking-[0.25em] text-text-secondary ml-4">
              {view === 'main' ? (activeChat?.title || 'Draft Chat') : view === 'templates' ? 'Logic Repository' : 'System Preferences'}
            </h2>

            <nav className="flex items-center gap-10">
              <button
                onClick={() => setView('main')}
                className={`text-[9px] font-bold uppercase tracking-[0.2em] transition-all relative py-4 ${view === 'main' ? 'text-text-primary' : 'text-text-secondary hover:text-text-primary'}`}
              >
                Chat
                {view === 'main' && <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-accent"></div>}
              </button>
              <button
                onClick={() => setView('templates')}
                className={`text-[9px] font-bold uppercase tracking-[0.2em] transition-all relative py-4 ${view === 'templates' ? 'text-text-primary' : 'text-text-secondary hover:text-text-primary'}`}
              >
                Templates
                {view === 'templates' && <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-accent"></div>}
              </button>
              <button
                onClick={() => setView('settings')}
                className={`text-[9px] font-bold uppercase tracking-[0.2em] transition-all relative py-4 ${view === 'settings' ? 'text-text-primary' : 'text-text-secondary hover:text-text-primary'}`}
              >
                Settings
                {view === 'settings' && <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-accent"></div>}
              </button>
            </nav>
          </div>
        </header>

        <div className="flex-1 overflow-hidden relative">
          {view === 'main' ? (
            activeChat ? (
              <ChatInterface
                chat={activeChat}
                onUpdateMessages={(messages) => handleUpdateMessages(activeChat.id, messages)}
                templates={templates}
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center h-full max-w-sm mx-auto px-6 text-center animate-slide-in">
                <div className="text-[10px] font-bold uppercase tracking-[0.4em] text-text-secondary mb-4 opacity-40">Intelligence Engine</div>
                <h1 className="text-3xl font-bold mb-6 tracking-tighter">New Workspace</h1>
                <p className="text-text-secondary text-xs mb-10 leading-relaxed uppercase tracking-widest font-medium opacity-60">Initiate a chat or define transformation logic.</p>
                <button
                  onClick={handleNewChat}
                  className="w-full py-4 bg-accent text-bg-main text-[10px] font-bold uppercase tracking-[0.2em] hover:opacity-90 transition-all active:scale-[0.98]"
                >
                  Start Chat
                </button>
              </div>
            )
          ) : view === 'templates' ? (
            <TemplateManager
              templates={templates}
              onEdit={(t) => { setEditingTemplate(t); setIsTemplateModalOpen(true); }}
              onDelete={handleDeleteTemplate}
              onCreate={() => { setEditingTemplate(null); setIsTemplateModalOpen(true); }}
            />
          ) : (
            <SettingsView
              settings={settings}
              user={user}
              onUpdate={setSettings}
              onLogout={handleLogout}
              onClearData={() => {
                if (confirm("Confirm: This will permanently wipe all local chat and template data. Action is irreversible.")) {
                  localStorage.clear();
                  window.location.reload();
                }
              }}
              onExport={() => {
                const data = { chats, templates, settings };
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Homework_export_${new Date().getTime()}.json`;
                a.click();
              }}
            />
          )}
        </div>
      </main>

      {isTemplateModalOpen && (
        <TemplateCreator
          template={editingTemplate}
          onSave={handleSaveTemplate}
          onClose={() => { setIsTemplateModalOpen(false); setEditingTemplate(null); }}
        />
      )}
    </div>
  );
};

export default App;
