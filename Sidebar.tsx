
import React from 'react';
import { Chat, ViewType } from '../types';

interface SidebarProps {
  chats: Chat[];
  activeChatId: string | null;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  onDeleteChat: (id: string) => void;
  view: ViewType;
  onSetView: (view: ViewType) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  chats, 
  activeChatId, 
  onSelectChat, 
  onNewChat, 
  onDeleteChat,
  view,
  onSetView 
}) => {
  return (
    <div className="w-[280px] bg-claude-surface flex flex-col h-full border-r border-claude-border/80">
      <div className="p-5 flex flex-col h-full">
        <button 
          onClick={onNewChat}
          className="w-full flex items-center justify-between py-3 px-4 bg-white hover:bg-claude-bg text-claude-text rounded-2xl transition-all border border-claude-border font-bold shadow-sm mb-8 group active:scale-95"
        >
          <span className="text-sm">New Conversation</span>
          <i className="fa-solid fa-pen-to-square text-xs text-accent group-hover:rotate-12 transition-transform"></i>
        </button>

        <div className="space-y-1.5 mb-10">
          <button 
            onClick={() => onSetView('chat')}
            className={`w-full flex items-center gap-4 py-2.5 px-3 rounded-xl transition-all text-sm font-bold ${view === 'chat' ? 'bg-white shadow-md text-accent border border-claude-border' : 'text-claude-text-secondary hover:bg-white/60 hover:text-claude-text'}`}
          >
            <div className={`w-1.5 h-1.5 rounded-full ${view === 'chat' ? 'bg-accent' : 'bg-transparent'}`}></div>
            <i className="fa-solid fa-house-chimney w-4 text-[13px]"></i>
            Workbench
          </button>
          <button 
            onClick={() => onSetView('templates')}
            className={`w-full flex items-center gap-4 py-2.5 px-3 rounded-xl transition-all text-sm font-bold ${view === 'templates' ? 'bg-white shadow-sm text-accent border border-claude-border' : 'text-claude-text-secondary hover:bg-white/60 hover:text-claude-text'}`}
          >
            <div className={`w-1.5 h-1.5 rounded-full ${view === 'templates' ? 'bg-accent' : 'bg-transparent'}`}></div>
            <i className="fa-solid fa-layer-group w-4 text-[13px]"></i>
            Templates
          </button>
          <button 
            onClick={() => onSetView('settings')}
            className={`w-full flex items-center gap-4 py-2.5 px-3 rounded-xl transition-all text-sm font-bold ${view === 'settings' ? 'bg-white shadow-md text-accent border border-claude-border' : 'text-claude-text-secondary hover:bg-white/60 hover:text-claude-text'}`}
          >
            <div className={`w-1.5 h-1.5 rounded-full ${view === 'settings' ? 'bg-accent' : 'bg-transparent'}`}></div>
            <i className="fa-solid fa-gear w-4 text-[13px]"></i>
            Settings
          </button>
        </div>

        <div className="flex-1 flex flex-col min-h-0">
          <h2 className="text-[11px] font-black text-claude-text-secondary uppercase tracking-[0.2em] px-3 mb-4 opacity-50">Recent History</h2>
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1 pr-1">
            {chats.length === 0 ? (
              <div className="px-3 py-10 text-center">
                <p className="text-[11px] text-claude-text-secondary italic font-medium opacity-60">No recent logs</p>
              </div>
            ) : (
              chats.map(chat => (
                <div 
                  key={chat.id}
                  className={`group relative flex items-center gap-3 py-2.5 px-3 rounded-xl cursor-pointer transition-all text-[13px] font-medium border border-transparent ${activeChatId === chat.id && view === 'chat' ? 'bg-white shadow-sm border-claude-border text-claude-text' : 'text-claude-text-secondary hover:bg-white/40 hover:text-claude-text'}`}
                  onClick={() => onSelectChat(chat.id)}
                >
                  <i className={`fa-solid fa-message text-[10px] ${activeChatId === chat.id && view === 'chat' ? 'text-accent' : 'opacity-30'}`}></i>
                  <span className="truncate flex-1">{chat.title || 'Untitled Session'}</span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onDeleteChat(chat.id); }}
                    className="opacity-0 group-hover:opacity-100 p-1.5 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  >
                    <i className="fa-solid fa-trash-can text-[10px]"></i>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="p-5 border-t border-claude-border/60 bg-white/40 backdrop-blur-md">
        <button className="w-full flex items-center gap-3 p-2.5 rounded-2xl hover:bg-white transition-all text-sm font-bold text-claude-text-secondary group">
          <div className="w-8 h-8 rounded-xl bg-accent flex items-center justify-center text-white text-[11px] font-black shadow-lg shadow-accent/20 group-hover:scale-105 transition-transform">AI</div>
          <span className="flex-1 text-left truncate">System Active</span>
          <i className="fa-solid fa-ellipsis-vertical text-xs opacity-40"></i>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
