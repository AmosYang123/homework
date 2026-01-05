
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
    <div className="w-80 bg-bg-surface flex flex-col h-full border-r border-border-primary shrink-0 z-40 relative">
      <div className="p-10 flex flex-col h-full">
        <div className="mb-16">
          <div className="text-[14px] font-black tracking-[0.5em] text-text-primary uppercase mb-1">A&</div>
          <div className="text-[8px] font-bold text-text-secondary uppercase tracking-[0.3em] opacity-40">Intelligence Standard</div>
        </div>

        <button 
          onClick={onNewChat}
          className="w-full py-4 px-4 border border-accent text-accent hover:bg-accent hover:text-bg-main transition-all text-[10px] font-bold uppercase tracking-[0.3em] mb-16 active:scale-[0.98]"
        >
          New Session
        </button>

        <div className="flex-1 flex flex-col min-h-0">
          <header className="flex items-center justify-between mb-8 opacity-40">
            <h2 className="text-[9px] font-bold text-text-secondary uppercase tracking-[0.3em]">History</h2>
            <div className="h-[1px] flex-1 ml-4 bg-border-primary"></div>
          </header>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1 pr-3 -mr-3">
            {chats.length === 0 ? (
              <div className="text-center py-10 opacity-30">
                <p className="text-[10px] font-bold uppercase tracking-widest italic">Logs empty</p>
              </div>
            ) : (
              chats.map(chat => (
                <div 
                  key={chat.id}
                  className={`group relative flex items-center justify-between py-3 px-4 cursor-pointer text-[12px] transition-all border ${activeChatId === chat.id && view === 'main' ? 'text-text-primary font-bold bg-bg-main border-border-primary shadow-sm' : 'text-text-secondary hover:text-text-primary hover:bg-bg-main/50 border-transparent'}`}
                  onClick={() => onSelectChat(chat.id)}
                >
                  <span className="truncate flex-1 tracking-tight">{chat.title || 'Draft Session'}</span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onDeleteChat(chat.id); }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-accent transition-opacity ml-4"
                    title="Remove session"
                  >
                    <i className="fa-solid fa-times text-[10px]"></i>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="mt-auto pt-10 border-t border-border-primary opacity-30">
           <div className="flex items-center justify-between">
              <div className="text-[9px] font-bold text-text-secondary uppercase tracking-[0.3em]">Engine v1.0.4</div>
              <div className="text-[9px] font-bold text-text-secondary uppercase tracking-[0.3em]">Active</div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
