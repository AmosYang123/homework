
import React, { useState } from 'react';
import { Message, StyleTemplate } from '../types';

interface ChatMessageProps {
  message: Message;
  template?: StyleTemplate;
  onRegenerate?: () => void;
  onDelete?: () => void;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, template, onRegenerate, onDelete }) => {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
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
        {!isUser && (
          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-6 transition-all duration-200">
            <button onClick={copyToClipboard} className="text-[9px] uppercase font-bold text-text-secondary hover:text-accent transition-colors tracking-widest">
              {copied ? 'Captured' : 'Copy'}
            </button>
            <button onClick={onRegenerate} className="text-[9px] uppercase font-bold text-text-secondary hover:text-accent transition-colors tracking-widest">
              Retransform
            </button>
            <button onClick={onDelete} className="text-[9px] uppercase font-bold text-text-secondary hover:text-accent transition-colors tracking-widest">
              Discard
            </button>
          </div>
        )}
      </header>

      <section className={`text-[15px] font-normal leading-relaxed ${isUser ? 'text-text-primary' : 'text-text-secondary'}`}>
        <div className="whitespace-pre-wrap">{isUser ? message.content : formatContent(message.content)}</div>
        
        {message.attachments && message.attachments.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-4">
            {message.attachments.map((file, idx) => (
              <div key={idx} className="flex items-center gap-4 py-3 px-5 border border-border-primary text-[10px] font-bold uppercase tracking-widest bg-bg-surface hover:border-accent transition-all cursor-default group/file">
                <i className="fa-solid fa-file-alt text-text-secondary opacity-30 group-hover/file:opacity-100 transition-opacity"></i>
                <span className="truncate max-w-[200px]">{file.name}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default ChatMessage;
