
import React, { useState, useRef, useEffect } from 'react';
import { Chat, StyleTemplate, Message, FileAttachment } from '../types';
import { geminiService } from '../services/geminiService';
import ChatMessage from './ChatMessage';
import { ClaudeChatInput } from './ui/claude-style-chat-input';

interface ChatInterfaceProps {
  chat: Chat;
  onUpdateMessages: (messages: Message[]) => void;
  templates: StyleTemplate[];
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ chat, onUpdateMessages, templates }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<StyleTemplate | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    scrollToBottom('auto');
  }, [chat.id]);

  useEffect(() => {
    scrollToBottom();
  }, [chat.messages, isLoading]);

  const handleSendMessageFromInput = async (data: {
    message: string;
    files: any[];
    pastedContent: any[];
    model: string;
    isThinkingEnabled: boolean;
  }) => {
    const { message, files, pastedContent, model, isThinkingEnabled } = data;

    // Combine manual input with any pasted snippets if needed
    let finalContent = message;
    if (pastedContent.length > 0) {
      finalContent += "\n\nPASTED CONTEXT:\n" + pastedContent.map(p => p.content).join("\n---\n");
    }

    if (!finalContent.trim() && files.length === 0) return;

    // Detect active template from content or sticky state
    let templateToUse = selectedTemplate;
    const templateMatch = finalContent.match(/@(\w+)/);
    if (templateMatch) {
      const matched = templates.find(t => t.name.toLowerCase() === templateMatch[1].toLowerCase());
      if (matched) templateToUse = matched;
    }

    // Convert internal file objects to our generic FileAttachment type
    const attachments: FileAttachment[] = [];
    for (const f of files) {
      if (f.uploadStatus === 'complete') {
        // We assume handleFiles in ClaudeChatInput stores the base64 or URL in 'data'
        // For simplicity, we'll convert the actual File to base64 here if it's not already
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(f.file);
        });

        attachments.push({
          name: f.file.name,
          type: f.file.type,
          size: f.file.size,
          data: base64
        });
      }
    }

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: finalContent,
      timestamp: Date.now(),
      attachments: attachments.length > 0 ? attachments : undefined,
      templateUsedId: templateToUse?.id
    };

    const newMessages = [...chat.messages, userMessage];
    onUpdateMessages(newMessages);
    setIsLoading(true);

    try {
      const response = await geminiService.generateResponse(
        finalContent,
        newMessages.slice(0, -1),
        templateToUse || undefined,
        attachments,
        model,
        isThinkingEnabled ? 20000 : 0
      );

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response,
        timestamp: Date.now(),
        templateUsedId: templateToUse?.id
      };

      onUpdateMessages([...newMessages, assistantMessage]);
      setSelectedTemplate(null); // Clear one-time template if not sticky
    } catch (error) {
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: "An error occurred. Please check your connection and try again.",
        timestamp: Date.now(),
      };
      onUpdateMessages([...newMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteMessage = (id: string) => {
    onUpdateMessages(chat.messages.filter(m => m.id !== id));
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white relative">
      <div className="flex-1 overflow-y-auto custom-scrollbar px-4 pt-6 pb-48">
        <div className="max-w-3xl mx-auto">
          {chat.messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center animate-fade-in">
              <div className="w-20 h-20 bg-accent/10 rounded-3xl flex items-center justify-center mb-8 text-accent shadow-inner">
                <i className="fa-solid fa-sparkles text-3xl"></i>
              </div>
              <h2 className="text-4xl font-serif font-light text-claude-text mb-4">How can I help you today?</h2>
              <p className="text-claude-text-secondary max-w-md mb-12 text-lg">
                Type naturally, or use <span className="text-accent font-bold">@template</span> to apply specialized style templates.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-xl">
                {templates.slice(0, 4).map(t => (
                  <button 
                    key={t.id}
                    onClick={() => setSelectedTemplate(t)}
                    className="p-4 rounded-2xl border border-claude-border bg-white hover:border-accent hover:shadow-lg transition-all text-left flex items-center gap-4 group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-accent/5 text-accent flex items-center justify-center group-hover:bg-accent group-hover:text-white transition-colors">
                      <i className={`fa-solid ${t.icon}`}></i>
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-claude-text">@{t.name}</div>
                      <div className="text-xs text-claude-text-secondary truncate">{t.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-12">
              {chat.messages.map((msg) => (
                <ChatMessage 
                  key={msg.id} 
                  message={msg} 
                  template={templates.find(t => t.id === msg.templateUsedId)} 
                  onRegenerate={() => handleSendMessageFromInput({
                    message: msg.content,
                    files: [],
                    pastedContent: [],
                    model: 'gemini-3-flash-preview',
                    isThinkingEnabled: false
                  })}
                  onDelete={() => handleDeleteMessage(msg.id)}
                />
              ))}
              {isLoading && (
                <div className="flex items-start gap-5 animate-fade-in">
                  <div className="w-8 h-8 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <Loader2 className="w-4 h-4 text-accent animate-spin" />
                  </div>
                  <div className="flex-1 space-y-3 pt-1">
                    <div className="h-2 bg-claude-border rounded-full w-[80%] animate-pulse"></div>
                    <div className="h-2 bg-claude-border rounded-full w-[50%] animate-pulse"></div>
                  </div>
                </div>
              )}
            </div>
          )}
          <div ref={messagesEndRef} className="h-4" />
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-bg-0 via-bg-0/95 to-transparent pt-16">
        <div className="max-w-3xl mx-auto">
          {selectedTemplate && (
            <div className="mb-4 flex items-center gap-2 bg-accent text-white rounded-xl p-2 px-4 shadow-xl animate-fade-in w-fit border border-accent-hover/20">
              <i className={`fa-solid ${selectedTemplate.icon} text-xs`}></i>
              <span className="text-xs font-bold uppercase tracking-widest">Template Active: @{selectedTemplate.name}</span>
              <button onClick={() => setSelectedTemplate(null)} className="ml-2 hover:opacity-70 transition-opacity">
                <i className="fa-solid fa-circle-xmark"></i>
              </button>
            </div>
          )}

          <ClaudeChatInput 
            onSendMessage={handleSendMessageFromInput} 
            isLoading={isLoading} 
          />
          
          <p className="text-[10px] text-center text-text-500 mt-4 font-medium uppercase tracking-[0.1em] opacity-40">
            Intelligence Engine v1.0 • Mathematical Consistency Enabled
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;

const Loader2 = ({ className }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
);
