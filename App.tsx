
import React, { useState, useEffect, useMemo } from 'react';
import { ViewType, Chat, StyleTemplate, Message, AppSettings } from './types';
import { INITIAL_TEMPLATES, DEFAULT_SETTINGS } from './constants';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';
import TemplateManager from './components/TemplateManager';
import TemplateCreator from './components/TemplateCreator';
import SettingsView from './components/SettingsView';

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

  // Initialize data
  useEffect(() => {
    const savedTemplates = localStorage.getItem('trainer_templates_v4');
    const savedChats = localStorage.getItem('trainer_chats_v4');
    const savedSettings = localStorage.getItem('trainer_settings_v4');

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

  const activeChat = useMemo(() => chats.find(c => c.id === activeChatId) || null, [chats, activeChatId]);

  const handleNewChat = () => {
    const newChat: Chat = {
      id: crypto.randomUUID(),
      title: 'New Session',
      messages: [],
      createdAt: Date.now(),
      lastUpdatedAt: Date.now(),
    };
    setChats(prev => [newChat, ...prev]);
    setActiveChatId(newChat.id);
    setView('main');
    if (window.innerWidth < 1024) setIsSidebarOpen(false);
  };

  const handleUpdateMessages = (chatId: string, messages: Message[]) => {
    setChats(prev => prev.map(c => {
      if (c.id === chatId) {
        let newTitle = c.title;
        if (messages.length > 0 && (c.title === 'New Session' || !c.title)) {
          const firstUserMsg = messages.find(m => m.role === 'user');
          if (firstUserMsg) {
            newTitle = firstUserMsg.content.trim().slice(0, 32) + (firstUserMsg.content.length > 32 ? '...' : '');
          }
        }
        return { ...c, messages, title: newTitle, lastUpdatedAt: Date.now() };
      }
      return c;
    }));
  };

  const handleSaveTemplate = (templateData: Partial<StyleTemplate>) => {
    if (editingTemplate) {
      setTemplates(prev => prev.map(t => t.id === editingTemplate.id ? { ...t, ...templateData } as StyleTemplate : t));
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
    }
    setIsTemplateModalOpen(false);
    setEditingTemplate(null);
  };

  const handleDeleteChat = (id: string) => {
    const newChats = chats.filter(c => c.id !== id);
    setChats(newChats);
    if (activeChatId === id) setActiveChatId(newChats.length > 0 ? newChats[0].id : null);
  };

  return (
    <div className={`flex h-screen w-full overflow-hidden bg-bg-main text-text-primary transition-colors duration-300`}>
      {isSidebarOpen && (
        <Sidebar 
          chats={chats}
          activeChatId={activeChatId}
          onSelectChat={(id) => { setActiveChatId(id); setView('main'); if (window.innerWidth < 1024) setIsSidebarOpen(false); }}
          onNewChat={handleNewChat}
          onDeleteChat={handleDeleteChat}
          view={view}
          onSetView={setView}
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
              {view === 'main' ? (activeChat?.title || 'Draft Workspace') : view === 'templates' ? 'Logic Repository' : 'System Preferences'}
            </h2>
            
            <nav className="flex items-center gap-10">
              <button 
                onClick={() => setView('main')} 
                className={`text-[9px] font-bold uppercase tracking-[0.2em] transition-all relative py-4 ${view === 'main' ? 'text-text-primary' : 'text-text-secondary hover:text-text-primary'}`}
              >
                Chat
                {view === 'main' && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-accent"></div>}
              </button>
              <button 
                onClick={() => setView('templates')} 
                className={`text-[9px] font-bold uppercase tracking-[0.2em] transition-all relative py-4 ${view === 'templates' ? 'text-text-primary' : 'text-text-secondary hover:text-text-primary'}`}
              >
                Templates
                {view === 'templates' && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-accent"></div>}
              </button>
              <button 
                onClick={() => setView('settings')} 
                className={`text-[9px] font-bold uppercase tracking-[0.2em] transition-all relative py-4 ${view === 'settings' ? 'text-text-primary' : 'text-text-secondary hover:text-text-primary'}`}
              >
                Settings
                {view === 'settings' && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-accent"></div>}
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
                <p className="text-text-secondary text-xs mb-10 leading-relaxed uppercase tracking-widest font-medium opacity-60">Initiate a session or define transformation logic.</p>
                <button 
                  onClick={handleNewChat} 
                  className="w-full py-4 bg-accent text-bg-main text-[10px] font-bold uppercase tracking-[0.2em] hover:opacity-90 transition-all active:scale-[0.98]"
                >
                  Start Session
                </button>
              </div>
            )
          ) : view === 'templates' ? (
            <TemplateManager 
              templates={templates}
              onEdit={(t) => { setEditingTemplate(t); setIsTemplateModalOpen(true); }}
              onDelete={(id) => setTemplates(prev => prev.filter(t => t.id !== id))}
              onCreate={() => { setEditingTemplate(null); setIsTemplateModalOpen(true); }}
            />
          ) : (
            <SettingsView 
              settings={settings}
              onUpdate={setSettings}
              onClearData={() => {
                if(confirm("Confirm: This will permanently wipe all local session and template data. Action is irreversible.")) {
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
                a.download = `A&_export_${new Date().getTime()}.json`;
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
