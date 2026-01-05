
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
    setTimeout(() => setCopied(false), 2000);
  };

  // Simplified Markdown Formatter for world-class look
  const formatContent = (content: string) => {
    return content.split('\n').map((line, i) => {
      // Bold
      let formattedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      // Inline Code
      formattedLine = formattedLine.replace(/`(.*?)`/g, '<code class="bg-claude-surface px-1.5 py-0.5 rounded text-accent font-mono text-[13px]">$1</code>');
      // Lists
      if (line.trim().startsWith('-')) {
        return <div key={i} className="pl-4 mb-1 flex items-start gap-2">
          <span className="text-accent mt-1">-</span>
          <span dangerouslySetInnerHTML={{ __html: formattedLine.replace(/^- \s*/, '') }} />
        </div>;
      }
      return <p key={i} className="mb-2 last:mb-0" dangerouslySetInnerHTML={{ __html: formattedLine || '&nbsp;' }} />;
    });
  };

  return (
    <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} gap-3 w-full group animate-in fade-in slide-in-from-bottom-4 duration-500`}>
      <div className={`flex items-center gap-3 px-1 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold ${isUser ? 'bg-claude-text text-white' : 'bg-accent text-white'}`}>
          {isUser ? 'U' : 'AI'}
        </div>
        <span className="text-[11px] font-bold text-claude-text uppercase tracking-widest">
          {isUser ? 'You' : 'Style Template'}
        </span>
        {template && !isUser && (
          <div className="flex items-center gap-1.5 bg-accent/10 px-2 py-0.5 rounded-full">
            <i className="fa-solid fa-wand-magic-sparkles text-[9px] text-accent"></i>
            <span className="text-[9px] font-bold text-accent uppercase tracking-tighter">
              @{template.name}
            </span>
          </div>
        )}
      </div>

      <div className={`relative max-w-[90%] md:max-w-[95%] text-[15px] leading-relaxed ${
        isUser 
          ? 'bg-claude-surface text-claude-text p-4 rounded-2xl rounded-tr-none border border-claude-border/50 shadow-sm' 
          : 'text-claude-text py-1'
      }`}>
        <div className="whitespace-pre-wrap">{isUser ? message.content : formatContent(message.content)}</div>
        
        {message.attachments && message.attachments.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {message.attachments.map((file, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 rounded-xl border border-claude-border bg-white shadow-sm hover:border-accent transition-colors">
                <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
                  <i className="fa-solid fa-file-lines"></i>
                </div>
                <div className="flex-1 min-w-0 pr-2">
                  <div className="text-xs font-bold truncate text-claude-text">{file.name}</div>
                  <div className="text-[10px] text-claude-text-secondary uppercase tracking-tighter font-bold">Document</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!isUser && (
          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 mt-4 transition-all duration-200">
            <button 
              onClick={copyToClipboard}
              className="p-2 text-claude-text-secondary hover:text-accent hover:bg-claude-surface rounded-lg transition-all" 
              title="Copy"
            >
              <i className={`fa-regular ${copied ? 'fa-check text-green-500' : 'fa-copy'} text-xs`}></i>
            </button>
            <button 
              onClick={onRegenerate}
              className="p-2 text-claude-text-secondary hover:text-accent hover:bg-claude-surface rounded-lg transition-all" 
              title="Regenerate"
            >
              <i className="fa-solid fa-rotate-right text-xs"></i>
            </button>
            <button 
              onClick={onDelete}
              className="p-2 text-claude-text-secondary hover:text-red-500 hover:bg-claude-surface rounded-lg transition-all" 
              title="Delete"
            >
              <i className="fa-regular fa-trash-can text-xs"></i>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
