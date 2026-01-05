
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
  // Sticky template from previous interactions or manual selection outside input
  const [stickyTemplate, setStickyTemplate] = useState<StyleTemplate | null>(null);
  
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
    activeTemplates?: StyleTemplate[];
  }) => {
    const { message, files, pastedContent, model, activeTemplates } = data;

    let finalContent = message;
    if (pastedContent.length > 0) {
      finalContent += "\n\n[APPENDED_CONTEXT]\n" + pastedContent.map(p => p.content).join("\n---\n");
    }

    if (!finalContent.trim() && files.length === 0) return;

    // Prioritize templates sent from the input chips, fall back to sticky template
    // We only support one active template for logic generation per the original prompt requirement,
    // but the UI allows selecting multiple. We'll take the last one or merge logic if needed.
    // For now, we take the last added template as the primary driver.
    let templateToUse = activeTemplates && activeTemplates.length > 0 
      ? activeTemplates[activeTemplates.length - 1] 
      : stickyTemplate;

    // Fallback: Check for regex if no explicit chips were used (legacy/paste support)
    if (!templateToUse) {
      const templateMatch = finalContent.match(/@(\w+)/);
      if (templateMatch) {
        const matched = templates.find(t => t.name.toLowerCase() === templateMatch[1].toLowerCase());
        if (matched) templateToUse = matched;
      }
    }

    const attachments: FileAttachment[] = [];
    for (const f of files) {
      if (f.uploadStatus === 'complete') {
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
        0
      );

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response,
        timestamp: Date.now(),
        templateUsedId: templateToUse?.id
      };

      onUpdateMessages([...newMessages, assistantMessage]);
      setStickyTemplate(null); // Clear sticky
    } catch (error) {
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: "Processing Failure: Engine could not compute transformation. Check network protocol and API authorization.",
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
    <div className="flex-1 flex flex-col h-full relative overflow-hidden bg-bg-main">
      <div className="flex-1 overflow-y-auto custom-scrollbar px-10 pt-16 pb-72">
        <div className="max-w-4xl mx-auto">
          {chat.messages.length === 0 ? (
            <div className="py-40 text-center animate-slide-in">
              <div className="text-[10px] font-bold uppercase tracking-[0.5em] text-text-secondary opacity-30 mb-6">Environment Initialized</div>
              <h2 className="text-2xl font-bold tracking-tighter mb-4 text-text-primary">Ready for Input</h2>
              <p className="text-xs text-text-secondary uppercase tracking-[0.2em] opacity-60">Paste content or type @pattern to begin</p>
            </div>
          ) : (
            <div className="space-y-4">
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
                    activeTemplates: msg.templateUsedId ? [templates.find(t => t.id === msg.templateUsedId)!] : []
                  })}
                  onDelete={() => handleDeleteMessage(msg.id)}
                />
              ))}
              {isLoading && (
                <div className="flex items-center gap-6 py-10 animate-slide-in">
                  <div className="flex gap-2">
                    <div className="w-1.5 h-1.5 bg-accent animate-pulse"></div>
                    <div className="w-1.5 h-1.5 bg-accent animate-pulse [animation-delay:0.2s]"></div>
                    <div className="w-1.5 h-1.5 bg-accent animate-pulse [animation-delay:0.4s]"></div>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-text-secondary">Computing transformation...</span>
                </div>
              )}
            </div>
          )}
          <div ref={messagesEndRef} className="h-4" />
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-12 bg-gradient-to-t from-bg-main via-bg-main to-transparent pt-32 shrink-0 z-20">
        <div className="max-w-4xl mx-auto">
          {stickyTemplate && (
            <div className="mb-6 inline-flex items-center gap-6 bg-accent text-bg-main px-6 py-3 border border-accent shadow-2xl animate-slide-in">
              <span className="text-[10px] font-bold uppercase tracking-[0.3em]">Locked Pattern: @{stickyTemplate.name}</span>
              <button 
                onClick={() => setStickyTemplate(null)} 
                className="hover:opacity-60 transition-opacity border-l border-bg-main/20 pl-4"
                title="Unlock pattern"
              >
                <i className="fa-solid fa-times text-[10px]"></i>
              </button>
            </div>
          )}

          <ClaudeChatInput 
            onSendMessage={handleSendMessageFromInput} 
            isLoading={isLoading} 
            templates={templates}
          />
          
          <div className="mt-8 flex justify-center opacity-30">
            <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-text-secondary">A& Intelligence Logic Engine Standard v1.0.4</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
