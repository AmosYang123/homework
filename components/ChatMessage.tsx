
import React, { useState } from 'react';
import { Message, StyleTemplate } from '../types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface ChatMessageProps {
  message: Message;
  template?: StyleTemplate;
  onRegenerate?: () => void;
  onDelete?: () => void;
  onEdit?: (newContent: string) => void;
  isDark?: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, template, onRegenerate, onDelete, onEdit, isDark }) => {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [isContextExpanded, setIsContextExpanded] = useState(false);
  const [isRawExpanded, setIsRawExpanded] = useState(false);
  const [isTemplateExpanded, setIsTemplateExpanded] = useState(false);

  // Standard context match
  const contextMatch = message.content.match(/\[CONTEXT\/MATERIAL\]\n([\s\S]*?)\n\n\[USER_QUERY\]\n([\s\S]*)/);
  const hasContext = !!contextMatch;
  const contextContent = contextMatch ? contextMatch[1] : '';
  let queryContent = contextMatch ? contextMatch[2] : message.content;

  // Three-Section match
  const rawMatch = message.content.match(/\[SECTION_RAW\]\n([\s\S]*?)\n\[\/SECTION_RAW\]/);
  const templateMatch = message.content.match(/\[SECTION_TEMPLATE\]\n([\s\S]*?)\n\[\/SECTION_TEMPLATE\]/);

  if (rawMatch || templateMatch) {
    // If we have these sections, strip them from the query content representation
    queryContent = message.content
      .replace(/\[SECTION_RAW\][\s\S]*?\[\/SECTION_RAW\]/, '')
      .replace(/\[SECTION_TEMPLATE\][\s\S]*?\[\/SECTION_TEMPLATE\]/, '')
      .trim();
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
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

  const MarkdownComponents = {
    code({ node, inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '');
      const codeString = String(children).replace(/\n$/, '');

      if (!inline && match) {
        return (
          <div className="relative group/code my-6 animate-slide-in">
            <div className="absolute right-3 top-3 z-10 opacity-0 group-hover/code:opacity-100 transition-opacity">
              <button
                onClick={() => copyToClipboard(codeString)}
                className="bg-bg-surface/80 backdrop-blur-md border border-border-primary px-3 py-1.5 rounded text-[9px] font-bold uppercase tracking-widest hover:text-accent transition-colors"
              >
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-secondary/40 absolute left-4 top-3 pointer-events-none">
              {match[1]}
            </div>
            <SyntaxHighlighter
              style={isDark ? oneDark : oneLight}
              language={match[1]}
              PreTag="div"
              className="rounded-xl !bg-bg-surface !p-8 !pt-12 !m-0 border border-border-primary/50 shadow-sm"
              {...props}
            >
              {codeString}
            </SyntaxHighlighter>
          </div>
        );
      }

      return (
        <code className="bg-accent-soft px-1.5 py-0.5 rounded text-accent font-mono text-[11px] font-medium" {...props}>
          {children}
        </code>
      );
    }
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
              <button
                onClick={() => copyToClipboard(message.content)}
                className="text-[9px] uppercase font-bold text-text-secondary hover:text-accent transition-colors tracking-widest"
              >
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
          <div className="markdown-content">
            {isUser ? (
              <div className="flex flex-col gap-6">
                {hasContext && (
                  <div className="bg-bg-surface/50 border border-border-primary rounded-xl overflow-hidden mb-2 transition-all">
                    <button
                      onClick={() => setIsContextExpanded(!isContextExpanded)}
                      className="w-full flex items-center justify-between px-5 py-3 hover:bg-bg-surface transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <i className="fa-solid fa-paperclip text-accent opacity-40 text-xs"></i>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">
                          Used material ({contextContent.length.toLocaleString()} chars)
                        </span>
                      </div>
                      <i className={`fa-solid fa-chevron-${isContextExpanded ? 'up' : 'down'} text-[8px] text-text-secondary opacity-30 transition-transform`}></i>
                    </button>
                    {isContextExpanded && (
                      <div className="px-6 py-6 border-t border-border-primary bg-bg-main/50 animate-in fade-in slide-in-from-top-2 duration-300">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={MarkdownComponents as any}
                        >
                          {contextContent}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>
                )}

                {rawMatch && (
                  <div className="bg-bg-surface/50 border border-border-primary rounded-xl overflow-hidden mb-2 transition-all">
                    <button
                      onClick={() => setIsRawExpanded(!isRawExpanded)}
                      className="w-full flex items-center justify-between px-5 py-3 hover:bg-bg-surface transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <i className="fa-solid fa-file-lines text-accent opacity-40 text-xs"></i>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">
                          Source Material ({rawMatch[1].length.toLocaleString()} chars)
                        </span>
                      </div>
                      <i className={`fa-solid fa-chevron-${isRawExpanded ? 'up' : 'down'} text-[8px] text-text-secondary opacity-30 transition-transform`}></i>
                    </button>
                    {isRawExpanded && (
                      <div className="px-6 py-6 border-t border-border-primary bg-bg-main/50 animate-in fade-in slide-in-from-top-2 duration-300">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={MarkdownComponents as any}
                        >
                          {rawMatch[1]}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>
                )}

                {templateMatch && (
                  <div className="bg-bg-surface/50 border border-border-primary rounded-xl overflow-hidden mb-2 transition-all">
                    <button
                      onClick={() => setIsTemplateExpanded(!isTemplateExpanded)}
                      className="w-full flex items-center justify-between px-5 py-3 hover:bg-bg-surface transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <i className="fa-solid fa-table-list text-accent opacity-40 text-xs"></i>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">
                          Target Structure ({templateMatch[1].length.toLocaleString()} chars)
                        </span>
                      </div>
                      <i className={`fa-solid fa-chevron-${isTemplateExpanded ? 'up' : 'down'} text-[8px] text-text-secondary opacity-30 transition-transform`}></i>
                    </button>
                    {isTemplateExpanded && (
                      <div className="px-6 py-6 border-t border-border-primary bg-bg-main/50 animate-in fade-in slide-in-from-top-2 duration-300">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={MarkdownComponents as any}
                        >
                          {templateMatch[1]}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>
                )}

                <div className="whitespace-pre-wrap">{queryContent}</div>
              </div>
            ) : (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={MarkdownComponents as any}
              >
                {message.content}
              </ReactMarkdown>
            )}
          </div>
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
