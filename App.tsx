
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
import Toast, { ToastType } from './components/ui/Toast';
import ConfirmModal from './components/ui/ConfirmModal';

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
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null);

  // Initialize data and handle Auth
  useEffect(() => {
    // Listen for Auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth Event:', event);
      if (session?.user) {
        const u: User = {
          id: session.user.id,
          name: session.user.email?.split('@')[0] || 'User',
          email: session.user.email,
          isCloud: true
        };
        setUser(u);
        localStorage.setItem('homework_user', JSON.stringify(u));
        // After user is set by auth change, load cloud data
        loadCloudData(u.id, u);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        localStorage.removeItem('homework_user');
        // When signed out, revert to local data
        loadLocalData();
      }
      setIsAuthRestored(true);
    });

    const init = async () => {
      // 1. Restore User Session (from localStorage, will be overridden by onAuthStateChange if session is active)
      const savedUser = localStorage.getItem('homework_user');
      let currentUser: User | null = null;

      if (savedUser) {
        currentUser = JSON.parse(savedUser);
        setUser(currentUser);
      }
      // setIsAuthRestored(true); // Moved inside onAuthStateChange to ensure it's set after initial auth check

      // 2. Load Settings (Local)
      const savedSettings = localStorage.getItem('trainer_settings_v4');
      if (savedSettings) setSettings(JSON.parse(savedSettings));

      // 3. Initial Data Load (if not handled by onAuthStateChange for cloud users)
      // If currentUser is already set and isCloud, onAuthStateChange will trigger loadCloudData.
      // If currentUser is local or null, load local data.
      if (!currentUser?.isCloud) {
        loadLocalData();
      }
    };

    const loadCloudData = async (userId: string, currentUser: User) => {
      try {
        // Force profile check
        await supabaseService.ensureProfile(currentUser);

        const [cloudChats, cloudTemplates] = await Promise.all([
          supabaseService.getChats(userId),
          supabaseService.getTemplates(userId)
        ]);

        // INTELLIGENT MERGE: 
        // We combine local memory and cloud data to prevent the "Empty Logs" issue
        setChats(prev => {
          const combined = [...prev];
          cloudChats.forEach(cc => {
            const exists = combined.findIndex(c => c.id === cc.id);
            if (exists === -1) combined.push(cc);
            // If it exists locally, cloud version wins (usually safer)
            else combined[exists] = cc;
          });
          return combined.sort((a, b) => b.lastUpdatedAt - a.lastUpdatedAt);
        });

        if (cloudChats.length > 0 && !activeChatId) setActiveChatId(cloudChats[0].id);

        setTemplates(prev => {
          const combined = [...prev];
          cloudTemplates.forEach(ct => {
            if (!combined.find(t => t.id === ct.id)) combined.push(ct);
          });
          return combined;
        });

      } catch (err) {
        console.error("Cloud sync failed on init:", err);
        setToast({ message: "Cloud sync failed. Loading local data.", type: "error" });
        loadLocalData();
      }
    };

    const loadLocalData = () => {
      const savedTemplates = localStorage.getItem('trainer_templates_v4');
      const savedChats = localStorage.getItem('trainer_chats_v4');

      if (savedTemplates) setTemplates(JSON.parse(savedTemplates));
      else setTemplates(INITIAL_TEMPLATES);

      if (savedChats) {
        const parsedChats = JSON.parse(savedChats);
        setChats(parsedChats);
        if (parsedChats.length > 0) setActiveChatId(parsedChats[0].id);
      } else {
        setChats([]);
        setActiveChatId(null);
      }
    };

    init();

    // Monitor system theme
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsSystemDark(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setIsSystemDark(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => {
      mediaQuery.removeEventListener('change', handler);
      subscription.unsubscribe(); // Clean up auth subscription
    };
  }, []);

  // Persist local data (and sync to cloud if needed)
  useEffect(() => {
    localStorage.setItem('trainer_templates_v4', JSON.stringify(templates));
  }, [templates]);

  useEffect(() => {
    localStorage.setItem('trainer_chats_v4', JSON.stringify(chats));
  }, [chats]);

  useEffect(() => {
    localStorage.setItem('trainer_settings_v4', JSON.stringify(settings));
  }, [settings]);

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
    const chat = chats.find(c => c.id === chatId);
    if (!chat) return;

    const lastUpdated = Date.now();

    // Optimistic local update
    setChats(prev => prev.map(c =>
      c.id === chatId ? { ...c, messages, lastUpdatedAt: lastUpdated } : c
    ));

    // Cloud Sync
    if (user?.isCloud) {
      try {
        const updatedChat = { ...chat, messages, lastUpdatedAt: lastUpdated };
        await supabaseService.upsertChat(user.id, updatedChat);
      } catch (err) {
        setToast({ message: "Cloud sync failed. Working locally only.", type: "error" });
      }
    }

    // Title Generation for new chats
    if (messages.length > 0 && (chat.title === 'New Chat' || !chat.title)) {
      const firstUserMsg = messages.find(m => m.role === 'user');
      if (firstUserMsg) {
        groqService.generateTitle(firstUserMsg.content).then(newTitle => {
          setChats(prev => prev.map(c => {
            if (c.id === chatId) {
              const updated = { ...c, title: newTitle };
              if (user?.isCloud) supabaseService.upsertChat(user.id, updated).catch(() => { }); // Catch and ignore title update sync errors
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

  const handleSyncToCloud = async () => {
    if (!user?.isCloud) return;
    setToast({ message: "Starting emergency sync...", type: "info" });
    try {
      // Create user profile if missing
      await supabaseService.ensureProfile(user);

      const chatPromises = chats.map(c => supabaseService.upsertChat(user.id, c));
      const templatePromises = templates.map(t => supabaseService.upsertTemplate(user.id, t));

      await Promise.all([...chatPromises, ...templatePromises]);
      setToast({ message: "Cloud Sync Complete!", type: "success" });
    } catch (err) {
      setToast({ message: "Sync failed. Check console.", type: "error" });
    }
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
                setConfirmModal({
                  title: "Clear All Data",
                  message: "Confirm: This will permanently wipe all local chat and template data. Action is irreversible.",
                  onConfirm: () => {
                    localStorage.clear();
                    window.location.reload();
                  }
                });
              }}
              onExport={() => {
                try {
                  const data = { chats, templates, settings };
                  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `Homework_export_${new Date().getTime()}.json`;
                  a.click();
                  setToast({ message: "Export successful", type: "success" });
                } catch (e) {
                  setToast({ message: "Export failed", type: "error" });
                }
              }}
              onSyncToCloud={handleSyncToCloud}
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

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {confirmModal && (
        <ConfirmModal
          title={confirmModal.title}
          message={confirmModal.message}
          onConfirm={() => { confirmModal.onConfirm(); setConfirmModal(null); }}
          onCancel={() => setConfirmModal(null)}
        />
      )}
    </div>
  );
};

export default App;
