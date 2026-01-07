
import React, { useState, useRef, useEffect, useCallback } from "react";
import { Plus, X, FileText, ClipboardList, Youtube, Loader2 } from "lucide-react";
import { StyleTemplate } from "../../types";
import { youtubeService } from "../../services/youtubeService";

interface AttachedFile {
    id: string;
    file: File;
    type: string;
    preview: string | null;
    uploadStatus: string;
}

interface PastedSnippet {
    id: string;
    content: string;
}

const FilePreview: React.FC<{ file: AttachedFile; onRemove: (id: string) => void }> = ({ file, onRemove }) => (
    <div className="relative group shrink-0 w-28 h-28 border border-border-primary bg-bg-surface flex flex-col justify-between hover:border-accent transition-all animate-slide-in overflow-hidden">
        {file.preview ? (
            <div className="absolute inset-0 z-0">
                <img src={file.preview} alt={file.file.name} className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity" />
                <div className="absolute inset-0 bg-gradient-to-t from-bg-surface via-transparent to-transparent" />
            </div>
        ) : null}
        <div className="relative z-10 p-3 h-full flex flex-col justify-between">
            <div className="flex justify-between items-start">
                <FileText size={14} className="text-text-secondary opacity-30" />
                <div className="text-[8px] font-bold text-text-secondary uppercase tracking-tighter truncate w-16 text-right">{file.file.name.split('.').pop()}</div>
            </div>
            <div className="text-[11px] font-bold truncate leading-tight bg-bg-surface/80 backdrop-blur-sm -mx-3 -mb-3 p-3">{file.file.name}</div>
        </div>
        <button
            onClick={() => onRemove(file.id)}
            className="absolute top-0 right-0 p-1.5 bg-bg-main border-l border-b border-border-primary z-20 opacity-0 group-hover:opacity-100 transition-opacity text-text-secondary hover:text-accent"
            aria-label="Remove file"
        >
            <X size={12} />
        </button>
    </div>
);

const SnippetPreview: React.FC<{ snippet: PastedSnippet; onRemove: (id: string) => void }> = ({ snippet, onRemove }) => (
    <div className="relative group shrink-0 w-28 h-28 border border-border-primary bg-bg-surface p-3 flex flex-col justify-between hover:border-accent transition-all animate-slide-in">
        <ClipboardList size={14} className="text-text-secondary opacity-30" />
        <div className="text-[10px] font-mono text-text-secondary line-clamp-3 overflow-hidden leading-snug">{snippet.content}</div>
        <button
            onClick={() => onRemove(snippet.id)}
            className="absolute top-0 right-0 p-1.5 bg-bg-main border-l border-b border-border-primary opacity-0 group-hover:opacity-100 transition-opacity text-text-secondary hover:text-accent"
            aria-label="Remove snippet"
        >
            <X size={12} />
        </button>
    </div>
);

interface ClaudeChatInputProps {
    onSendMessage: (data: {
        message: string;
        files: AttachedFile[];
        pastedContent: PastedSnippet[];
        model: string;
        activeTemplates: StyleTemplate[];
    }) => void;
    isLoading?: boolean;
    templates: StyleTemplate[];
    onLargePaste?: (content: string) => void;
    onThreeSectionTemplate?: (template: StyleTemplate) => void;
}

export const ClaudeChatInput: React.FC<ClaudeChatInputProps> = ({ onSendMessage, isLoading, templates, onLargePaste, onThreeSectionTemplate }) => {
    const [message, setMessage] = useState("");
    const [files, setFiles] = useState<AttachedFile[]>([]);
    const [pastedContent, setPastedContent] = useState<PastedSnippet[]>([]);
    const [activeTemplates, setActiveTemplates] = useState<StyleTemplate[]>([]);

    const [showMentions, setShowMentions] = useState(false);
    const [mentionFilter, setMentionFilter] = useState("");
    const [mentionIdx, setMentionIdx] = useState(0);
    const [detectedYouTube, setDetectedYouTube] = useState<string | null>(null);
    const [isExtractingYT, setIsExtractingYT] = useState(false);

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const filtered = templates.filter(t => t.name.toLowerCase().includes(mentionFilter.toLowerCase()));

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 280)}px`;
        }
    }, [message, activeTemplates]);

    const handleFiles = useCallback((fileList: FileList | File[]) => {
        const newFiles = Array.from(fileList).map(f => ({
            id: Math.random().toString(36).substr(2, 9),
            file: f,
            type: f.type || 'text/plain',
            preview: f.type.startsWith('image/') ? URL.createObjectURL(f) : null,
            uploadStatus: 'complete'
        }));
        setFiles(prev => [...prev, ...newFiles]);
    }, []);

    const handleSend = () => {
        if (!message.trim() && !files.length && !pastedContent.length) return;
        onSendMessage({ message, files, pastedContent, model: 'gemini-3-flash-preview', activeTemplates });
        setMessage("");
        setFiles([]);
        setPastedContent([]);
        setActiveTemplates([]);
        setShowMentions(false);
        if (textareaRef.current) textareaRef.current.style.height = 'auto';
    };

    const applyTemplate = (t: StyleTemplate) => {
        // Remove the "@filter" text from the message
        const words = message.split(/(@\w*)$/);
        const prefix = words[0] || "";

        if (t.type === 'three-section') {
            if (onThreeSectionTemplate) {
                onThreeSectionTemplate(t);
                setMessage(prefix);
                setShowMentions(false);
                return;
            }
        }

        setMessage(prefix);

        // Add the template to the active list
        if (!activeTemplates.find(at => at.id === t.id)) {
            setActiveTemplates([...activeTemplates, t]);
        }

        setShowMentions(false);
        textareaRef.current?.focus();
    };

    const removeTemplate = (id: string) => {
        setActiveTemplates(prev => prev.filter(t => t.id !== id));
        textareaRef.current?.focus();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (showMentions && filtered.length) {
            if (e.key === 'ArrowDown') { e.preventDefault(); setMentionIdx(i => (i + 1) % filtered.length); return; }
            if (e.key === 'ArrowUp') { e.preventDefault(); setMentionIdx(i => (i - 1 + filtered.length) % filtered.length); return; }
            if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); applyTemplate(filtered[mentionIdx]); return; }
            if (e.key === 'Escape') { e.preventDefault(); setShowMentions(false); return; }
        }

        // Atomic Deletion: Backspace on empty input removes the last template chip
        if (e.key === 'Backspace' && message === '' && activeTemplates.length > 0) {
            e.preventDefault();
            const newTemplates = [...activeTemplates];
            newTemplates.pop();
            setActiveTemplates(newTemplates);
        }

        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        setMessage(val);

        // Regex to detect if we are typing a mention at the end of the string
        const match = val.match(/@(\w*)$/);
        if (match) {
            setMentionFilter(match[1]);
            setShowMentions(true);
            setMentionIdx(0);
        } else {
            setShowMentions(false);
        }

        // Detect YouTube links - robust check
        if (val.includes('youtube.com/') || val.includes('youtu.be/')) {
            const videoId = youtubeService.extractVideoId(val);
            if (videoId) {
                // Ensure we capture the full URL for replacement
                const fullMatch = val.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
                setDetectedYouTube(fullMatch ? fullMatch[0] : val); // Fallback to full value if match fails but ID exists
            } else {
                setDetectedYouTube(null);
            }
        } else {
            setDetectedYouTube(null);
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        const items = e.clipboardData.items;
        let hasImage = false;

        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const blob = items[i].getAsFile();
                if (blob) {
                    const file = new File([blob], `screenshot-${Date.now()}.png`, { type: 'image/png' });
                    handleFiles([file]);
                    hasImage = true;
                }
            }
        }

        if (hasImage) return;

        const text = e.clipboardData.getData('text');
        if (text.length > 300 && onLargePaste) {
            e.preventDefault();
            onLargePaste(text);
        } else if (text.length > 500) {
            e.preventDefault();
            setPastedContent(prev => [...prev, { id: Math.random().toString(36).substr(2, 9), content: text }]);
        }
    };

    const handleExtractYouTube = async () => {
        if (!detectedYouTube) return;
        setIsExtractingYT(true);
        try {
            const transcript = await youtubeService.getTranscript(detectedYouTube);
            // Replace the YouTube link with the transcript wrapped in clear context tags
            // This helps the LLM distinguish between the user's question and the video content
            const contextWrapper = `
<transcript_context>
[SOURCE: YouTube Video ID ${youtubeService.extractVideoId(detectedYouTube)}]
[INSTRUCTION: Use the following transcript to answer the user's request. If the answer is NOT in this text, say so. Do not invent facts.]
${transcript}
</transcript_context>`;

            const newMessage = message.replace(detectedYouTube, contextWrapper);
            setMessage(newMessage);
            setDetectedYouTube(null);
        } catch (error: any) {
            // Add transcript error as a pasted snippet so user can see it
            setPastedContent(prev => [...prev, {
                id: Math.random().toString(36).substr(2, 9),
                content: `[YouTube Error] ${error.message}`
            }]);
        } finally {
            setIsExtractingYT(false);
        }
    };

    const hasContent = message.trim() || files.length > 0 || pastedContent.length > 0 || activeTemplates.length > 0;

    return (
        <div className="relative w-full z-40">
            {showMentions && filtered.length > 0 && (
                <div className="absolute bottom-full left-0 mb-2 w-full max-w-sm bg-bg-main border border-accent shadow-2xl p-1 animate-slide-in origin-bottom-left">
                    <div className="px-4 py-2 text-[9px] font-black uppercase tracking-[0.4em] text-text-secondary border-b border-border-primary mb-1 opacity-50">Select Logic Pattern</div>
                    <div className="max-h-60 overflow-y-auto custom-scrollbar">
                        {filtered.map((t, i) => (
                            <button
                                key={t.id}
                                onClick={() => applyTemplate(t)}
                                onMouseEnter={() => setMentionIdx(i)}
                                className={`w-full text-left px-4 py-3 text-[11px] font-bold uppercase tracking-[0.2em] transition-all flex items-center gap-4 ${i === mentionIdx ? 'bg-accent text-bg-main' : 'hover:bg-accent-soft text-text-primary'}`}
                            >
                                <span className="opacity-50">@</span>
                                <span>{t.name}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className={`relative border border-border-primary focus-within:border-accent bg-bg-main transition-all duration-300 shadow-sm focus-within:shadow-2xl focus-within:shadow-accent/5`}>
                {(files.length > 0 || pastedContent.length > 0) && (
                    <div className="flex gap-4 p-5 pb-3 overflow-x-auto border-b border-border-primary scrollbar-hide">
                        {pastedContent.map(c => <SnippetPreview key={c.id} snippet={c} onRemove={id => setPastedContent(p => p.filter(x => x.id !== id))} />)}
                        {files.map(f => <FilePreview key={f.id} file={f} onRemove={id => setFiles(p => p.filter(x => x.id !== id))} />)}
                    </div>
                )}

                <div className="flex flex-col p-4">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                        {activeTemplates.map(t => (
                            <div key={t.id} className="inline-flex items-center gap-2 bg-accent/5 text-accent border border-accent/20 px-2 py-1 rounded-md animate-fade-in group select-none">
                                <span className="text-[10px] font-bold uppercase tracking-widest">@{t.name}</span>
                                <button
                                    onClick={() => removeTemplate(t.id)}
                                    className="hover:bg-accent hover:text-bg-main rounded-sm p-0.5 transition-colors"
                                >
                                    <X size={10} />
                                </button>
                            </div>
                        ))}
                    </div>

                    <textarea
                        ref={textareaRef}
                        value={message}
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
                        onPaste={handlePaste}
                        placeholder={activeTemplates.length > 0 ? "Add context..." : "Define transformation target... Mention @pattern to apply logic"}
                        className="w-full bg-transparent border-0 outline-none text-[15px] leading-relaxed resize-none overflow-hidden py-1 placeholder:text-text-secondary/30 font-medium selection:bg-accent selection:text-bg-main"
                        rows={1}
                        autoFocus
                    />

                    <div className="flex justify-between items-center mt-4">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="text-text-secondary hover:text-accent transition-all focus:outline-none p-1 -ml-1 active:scale-90"
                                title="Attach Source Material"
                            >
                                <Plus size={20} strokeWidth={2.5} />
                            </button>
                            {detectedYouTube && (
                                <button
                                    onClick={handleExtractYouTube}
                                    disabled={isExtractingYT}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/30 text-red-500 text-[9px] font-bold uppercase tracking-widest hover:bg-red-500/20 transition-all disabled:opacity-50"
                                    title="Extract YouTube Transcript"
                                >
                                    {isExtractingYT ? (
                                        <Loader2 size={12} className="animate-spin" />
                                    ) : (
                                        <Youtube size={12} />
                                    )}
                                    {isExtractingYT ? 'Extracting...' : 'Extract Transcript'}
                                </button>
                            )}
                        </div>
                        <button
                            onClick={handleSend}
                            disabled={!hasContent || isLoading}
                            className={`px-6 py-2.5 text-[10px] font-bold uppercase tracking-[0.25em] transition-all focus:outline-none active:scale-[0.98] ${hasContent && !isLoading ? 'bg-accent text-bg-main shadow-lg shadow-accent/20' : 'bg-accent-soft text-text-secondary pointer-events-none'}`}
                        >
                            {isLoading ? 'Processing' : 'ENTER'}
                        </button>
                    </div>
                </div>
            </div>
            <input ref={fileInputRef} type="file" multiple className="hidden" onChange={(e) => e.target.files && handleFiles(e.target.files)} />
        </div>
    );
};
