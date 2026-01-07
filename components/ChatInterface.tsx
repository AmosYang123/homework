
import React, { useState, useRef, useEffect } from 'react';
import { Chat, StyleTemplate, Message, FileAttachment, TemplateUsage } from '../types';
import { groqService } from '../services/groqService';
import ChatMessage from './ChatMessage';
import { ClaudeChatInput } from './ui/claude-style-chat-input';
import InputPanel from './ui/InputPanel';
import { ToastType } from './ui/Toast';
import ThreeSectionInvoker from './ui/ThreeSectionInvoker';
import { buildThreeSectionPrompt } from './TemplateCreator';

interface ChatInterfaceProps {
  chat: Chat;
  onUpdateMessages: (messages: Message[]) => void;
  templates: StyleTemplate[];
  isDark?: boolean;
  onShowToast?: (message: string, type: ToastType) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ chat, onUpdateMessages, templates, isDark, onShowToast }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [inputPanelContent, setInputPanelContent] = useState("");
  const [isInputPanelExpanded, setIsInputPanelExpanded] = useState(false);
  // Sticky template from previous interactions or manual selection outside input
  const [stickyTemplate, setStickyTemplate] = useState<StyleTemplate | null>(null);
  const [activeThreeSectionTemplate, setActiveThreeSectionTemplate] = useState<StyleTemplate | null>(null);

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
    threeSectionUsage?: TemplateUsage;
  }) => {
    const { message, files, pastedContent, model, activeTemplates, threeSectionUsage } = data;

    let finalContent = message;

    // 1. Prepend Context from InputPanel if it exists
    if (inputPanelContent.trim()) {
      finalContent = `[CONTEXT/MATERIAL]\n${inputPanelContent}\n\n[USER_QUERY]\n${finalContent}`;
    }

    if (pastedContent.length > 0) {
      finalContent += "\n\n[APPENDED_CONTEXT]\n" + pastedContent.map(p => p.content).join("\n---\n");
    }

    if (!finalContent.trim() && files.length === 0 && !threeSectionUsage) return;

    // Prioritize templates sent from the input chips, fall back to sticky template
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

    // Special handling for Three-Section template construction
    if (threeSectionUsage && templateToUse?.threeSection) {
      finalContent = buildThreeSectionPrompt(
        templateToUse.name,
        threeSectionUsage.rawMaterial,
        threeSectionUsage.template,
        templateToUse.threeSection.exampleOutput?.content,
        threeSectionUsage.useExample
      );
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
      const response = await groqService.generateResponse(
        finalContent,
        newMessages.slice(0, -1),
        templateToUse || undefined,
        attachments,
        'llama-3.3-70b-versatile',
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

      // 2. Clear Input Panel after send (with confirmation if > 500 chars)
      if (inputPanelContent.length > 500) {
        setInputPanelContent("");
        setIsInputPanelExpanded(false);
      } else {
        setInputPanelContent("");
        setIsInputPanelExpanded(false);
      }
    } catch (error) {
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `Processing Failure: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: Date.now(),
      };
      onUpdateMessages([...newMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleThreeSectionSubmit = (usage: TemplateUsage) => {
    if (!activeThreeSectionTemplate) return;

    handleSendMessageFromInput({
      message: `[Complex Transformation Execution] @${activeThreeSectionTemplate.name}`,
      files: [],
      pastedContent: [],
      model: 'gemini-3-flash-preview',
      activeTemplates: [activeThreeSectionTemplate],
      threeSectionUsage: usage
    });

    setActiveThreeSectionTemplate(null);
  };

  const handleDeleteMessage = (id: string) => {
    onUpdateMessages(chat.messages.filter(m => m.id !== id));
  };

  const handleEditMessage = async (id: string, newContent: string) => {
    const index = chat.messages.findIndex(m => m.id === id);
    if (index === -1) return;

    const messageToEdit = chat.messages[index];
    const isUser = messageToEdit.role === 'user';

    if (isUser) {
      const history = chat.messages.slice(0, index);
      const userMessage: Message = {
        ...messageToEdit,
        content: newContent,
        timestamp: Date.now()
      };

      const newMessages = [...history, userMessage];
      onUpdateMessages(newMessages);
      setIsLoading(true);

      try {
        const templateToUse = templates.find(t => t.id === messageToEdit.templateUsedId);
        const response = await groqService.generateResponse(
          newContent,
          history,
          templateToUse || undefined,
          messageToEdit.attachments || [],
          'llama-3.3-70b-versatile',
          0
        );

        const assistantMessage: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: response,
          timestamp: Date.now(),
          templateUsedId: messageToEdit.templateUsedId
        };

        onUpdateMessages([...newMessages, assistantMessage]);
      } catch (error) {
        const errorMessage: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `Regeneration Failure: ${error instanceof Error ? error.message : String(error)}`,
          timestamp: Date.now(),
        };
        onUpdateMessages([...newMessages, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    } else {
      const newMessages = chat.messages.map(m => m.id === id ? { ...m, content: newContent } : m);
      onUpdateMessages(newMessages);
    }
  };

  const handleLargePaste = (content: string) => {
    setInputPanelContent(content);
    setIsInputPanelExpanded(true);
    if (onShowToast) {
      onShowToast("Large text moved to Input Panel for better readability", "info");
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full relative overflow-hidden bg-bg-main">
      <div className="flex-1 overflow-y-auto custom-scrollbar px-10 pt-16 pb-48 flex flex-col">
        <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col justify-center">
          {chat.messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center animate-slide-in pb-20">
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
                  onEdit={(content) => handleEditMessage(msg.id, content)}
                  isDark={isDark}
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

      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-bg-main via-bg-main to-transparent pt-10 shrink-0 z-20">
        <div className="max-w-4xl mx-auto shrink-0">
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

          {activeThreeSectionTemplate && (
            <ThreeSectionInvoker
              template={activeThreeSectionTemplate}
              isDark={isDark}
              onClose={() => setActiveThreeSectionTemplate(null)}
              onSubmit={handleThreeSectionSubmit}
            />
          )}

          <InputPanel
            isExpanded={isInputPanelExpanded}
            content={inputPanelContent}
            onContentChange={setInputPanelContent}
            onToggle={() => setIsInputPanelExpanded(!isInputPanelExpanded)}
            onClear={() => {
              if (inputPanelContent.length > 300) {
                if (window.confirm("Are you sure you want to clear the context material?")) {
                  setInputPanelContent("");
                }
              } else {
                setInputPanelContent("");
              }
            }}
            isDark={isDark}
          />

          <ClaudeChatInput
            onSendMessage={handleSendMessageFromInput}
            isLoading={isLoading}
            templates={templates}
            onLargePaste={handleLargePaste}
            onThreeSectionTemplate={(t) => setActiveThreeSectionTemplate(t)}
          />

          <div className="mt-4 flex justify-center opacity-30">
            <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-text-secondary">Homework Intelligence Logic Engine Standard v1.0.4</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
