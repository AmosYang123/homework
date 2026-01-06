
import React from 'react';
import { Chat, ViewType } from '../types';

interface SidebarProps {
  chats: Chat[];
  activeChatId: string | null;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  onDeleteChat: (id: string) => void;
  onRenameChat: (id: string, newTitle: string) => void;
  view: ViewType;
  onSetView: (view: ViewType) => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  chats,
  activeChatId,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  onRenameChat,
  view,
  onSetView,
  onLogout
}) => {
  const [editingChatId, setEditingChatId] = React.useState<string | null>(null);
  const [editValue, setEditValue] = React.useState('');

  const handleStartEdit = (chat: Chat) => {
    setEditingChatId(chat.id);
    setEditValue(chat.title || 'Draft Chat');
  };

  const handleFinishEdit = () => {
    if (editingChatId && editValue.trim()) {
      onRenameChat(editingChatId, editValue.trim());
    }
    setEditingChatId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleFinishEdit();
    if (e.key === 'Escape') setEditingChatId(null);
  };

  return (
    <div className="w-72 bg-bg-surface flex flex-col h-full border-r border-border-primary shrink-0 z-40 relative">
      <div className="p-6 flex flex-col h-full">
        <div className="mb-8">
          <div className="text-[14px] font-black tracking-[0.3em] text-text-primary uppercase mb-1">Homework</div>
          <div className="text-[8px] font-bold text-text-secondary uppercase tracking-[0.2em] opacity-40">Intelligence Engine</div>
        </div>

        <button
          onClick={onNewChat}
          className="w-full py-3 px-4 border border-accent text-accent hover:bg-accent hover:text-bg-main transition-all text-[10px] font-bold uppercase tracking-[0.3em] mb-6 active:scale-[0.98]"
        >
          New Chat
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
                  className={`group relative flex items-center justify-between py-2 px-3 cursor-pointer text-[11px] transition-all border ${activeChatId === chat.id && view === 'main' ? 'text-text-primary font-bold bg-bg-main border-border-primary shadow-sm' : 'text-text-secondary hover:text-text-primary hover:bg-bg-main/50 border-transparent'}`}
                  onClick={() => onSelectChat(chat.id)}
                  onDoubleClick={() => handleStartEdit(chat)}
                >
                  {editingChatId === chat.id ? (
                    <input
                      autoFocus
                      className="bg-transparent border-b border-accent outline-none w-full text-text-primary font-bold p-0 m-0 pb-1"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={handleFinishEdit}
                      onKeyDown={handleKeyDown}
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <>
                      <span className="truncate flex-1 tracking-tight select-none">{chat.title || 'Draft Chat'}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); onDeleteChat(chat.id); }}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:text-accent transition-opacity ml-4"
                        title="Remove chat"
                      >
                        <i className="fa-solid fa-times text-[10px]"></i>
                      </button>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="mt-auto pt-6 border-t border-border-primary">
          <div className="flex items-center justify-between mb-4 opacity-30">
            <div className="text-[9px] font-bold text-text-secondary uppercase tracking-[0.3em]">Engine v1.0.4</div>
            <div className="text-[9px] font-bold text-text-secondary uppercase tracking-[0.3em]">Active</div>
          </div>
          <button
            onClick={onLogout}
            className="w-full py-2 flex items-center justify-center gap-2 text-text-secondary hover:text-text-primary transition-colors hover:bg-bg-main/50 border border-transparent hover:border-border-primary"
          >
            <i className="fa-solid fa-sign-out-alt text-xs"></i>
            <span className="text-[9px] font-bold uppercase tracking-widest">Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
