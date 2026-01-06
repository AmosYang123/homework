
import React, { useState } from 'react';
import { Message, StyleTemplate } from '../types';

interface ChatMessageProps {
  message: Message;
  template?: StyleTemplate;
  onRegenerate?: () => void;
  onDelete?: () => void;
  onEdit?: (newContent: string) => void;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, template, onRegenerate, onDelete, onEdit }) => {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  const handleSave = () => {
    if (editContent.trim() !== message.content && onEdit) {
      onEdit(editContent);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditContent(message.content);
    setIsEditing(false);
  };

  const formatContent = (content: string) => {
    return content.split('\n').map((line, i) => {
      let formattedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-text-primary">$1</strong>');
      formattedLine = formattedLine.replace(/`(.*?)`/g, '<code class="bg-accent-soft px-1.5 py-0.5 rounded text-accent font-mono text-[11px] font-medium">$1</code>');

      if (line.trim().startsWith('-')) {
        return (
          <div key={i} className="pl-6 mb-2 flex items-start gap-4 animate-slide-in" style={{ animationDelay: `${i * 0.05}s` }}>
            <span className="text-text-secondary mt-2.5 w-2 h-[1px] bg-text-secondary shrink-0 opacity-40"></span>
            <span className="leading-relaxed" dangerouslySetInnerHTML={{ __html: formattedLine.replace(/^- \s*/, '') }} />
          </div>
        );
      }
      return (
        <p key={i}
          className="mb-5 last:mb-0 leading-relaxed animate-slide-in"
          style={{ animationDelay: `${i * 0.03}s` }}
          dangerouslySetInnerHTML={{ __html: formattedLine || '&nbsp;' }}
        />
      );
    });
  };

  return (
    <div className={`flex flex-col gap-4 w-full py-8 border-b border-border-primary/40 last:border-0 group animate-slide-in`}>
      <header className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${isUser ? 'bg-text-secondary opacity-30' : 'bg-accent'}`}></div>
            <span className={`text-[10px] font-bold uppercase tracking-[0.3em] ${isUser ? 'text-text-secondary opacity-60' : 'text-text-primary'}`}>
              {isUser ? 'Input' : 'Analysis'}
            </span>
          </div>
          {template && !isUser && (
            <div className="flex items-center gap-3">
              <div className="h-[10px] w-[1px] bg-border-primary"></div>
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-accent/60">
                @{template.name}
              </span>
            </div>
          )}
        </div>
        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-6 transition-all duration-200">
          {!isUser ? (
            <>
              <button onClick={copyToClipboard} className="text-[9px] uppercase font-bold text-text-secondary hover:text-accent transition-colors tracking-widest">
                {copied ? 'Captured' : 'Copy'}
              </button>
              <button onClick={onRegenerate} className="text-[9px] uppercase font-bold text-text-secondary hover:text-accent transition-colors tracking-widest">
                Retransform
              </button>
              <button onClick={onDelete} className="text-[9px] uppercase font-bold text-text-secondary hover:text-accent transition-colors tracking-widest">
                Discard
              </button>
            </>
          ) : (
            <>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-[9px] uppercase font-bold text-text-secondary hover:text-accent transition-colors tracking-widest"
                >
                  Modify
                </button>
              )}
              <button onClick={onDelete} className="text-[9px] uppercase font-bold text-text-secondary hover:text-accent transition-colors tracking-widest">
                Discard
              </button>
            </>
          )}
        </div>
      </header>

      <section className={`text-[15px] font-normal leading-relaxed ${isUser ? 'text-text-primary' : 'text-text-secondary'}`}>
        {isEditing ? (
          <div className="w-full flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full bg-bg-surface border border-border-primary p-4 text-[15px] focus:outline-none focus:border-accent min-h-[120px] resize-none"
              autoFocus
            />
            <div className="flex items-center gap-6">
              <button
                onClick={handleSave}
                className="text-[9px] uppercase font-bold text-accent hover:opacity-70 transition-all tracking-widest"
              >
                Save Changes
              </button>
              <button
                onClick={handleCancel}
                className="text-[9px] uppercase font-bold text-text-secondary hover:text-text-primary transition-all tracking-widest"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="whitespace-pre-wrap">{isUser ? message.content : formatContent(message.content)}</div>
        )}

        {message.attachments && message.attachments.length > 0 && !isEditing && (
          <div className="mt-8 flex flex-wrap gap-4">
            {message.attachments.map((file, idx) => (
              file.type.startsWith('image/') ? (
                <div key={idx} className="relative group/img overflow-hidden border border-border-primary hover:border-accent transition-all animate-slide-in">
                  <img src={file.data} alt={file.name} className="max-w-[300px] max-h-[300px] object-cover opacity-90 group-hover/img:opacity-100 transition-opacity" />
                  <div className="absolute inset-x-0 bottom-0 p-3 bg-bg-surface/80 backdrop-blur-sm transform translate-y-full group-hover/img:translate-y-0 transition-transform text-[9px] font-bold uppercase tracking-widest text-text-primary">
                    {file.name}
                  </div>
                </div>
              ) : (
                <div key={idx} className="flex items-center gap-4 py-3 px-5 border border-border-primary text-[10px] font-bold uppercase tracking-widest bg-bg-surface hover:border-accent transition-all cursor-default group/file">
                  <i className="fa-solid fa-file-alt text-text-secondary opacity-30 group-hover/file:opacity-100 transition-opacity"></i>
                  <span className="truncate max-w-[200px]">{file.name}</span>
                </div>
              )
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default ChatMessage;
