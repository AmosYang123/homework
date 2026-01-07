
import React, { useRef, useEffect } from 'react';

interface InputPanelProps {
    isExpanded: boolean;
    content: string;
    onContentChange: (content: string) => void;
    onToggle: () => void;
    onClear: () => void;
    isDark?: boolean;
}

const InputPanel: React.FC<InputPanelProps> = ({
    isExpanded,
    content,
    onContentChange,
    onToggle,
    onClear,
    isDark
}) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current && isExpanded) {
            textareaRef.current.style.height = 'auto';
            const newHeight = Math.min(Math.max(textareaRef.current.scrollHeight, 200), 400);
            textareaRef.current.style.height = `${newHeight}px`;
        }
    }, [content, isExpanded]);

    return (
        <div className={`w-full transition-all duration-300 ease-in-out ${isExpanded ? 'mb-0' : 'mb-2'}`}>
            {isExpanded ? (
                <div className="bg-bg-surface/60 backdrop-blur-xl border border-border-primary border-b-0 rounded-t-2xl overflow-hidden animate-slide-in">
                    <div className="flex items-center justify-between bg-bg-surface/80 border-b border-border-primary/30 px-5 py-3">
                        <div className="flex items-center gap-3">
                            <i className="fa-solid fa-align-left text-[10px] text-accent opacity-40"></i>
                            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-text-primary">Source Material / Input</span>
                        </div>
                        <div className="flex items-center gap-6">
                            <span className="text-[9px] font-bold text-text-secondary opacity-40 tracking-widest">{content.length.toLocaleString()} CHARS</span>
                            <button
                                onClick={onClear}
                                className="text-[9px] font-bold uppercase tracking-widest text-text-secondary hover:text-accent transition-colors"
                            >
                                Clear
                            </button>
                            <button
                                onClick={onToggle}
                                className="text-text-secondary hover:text-accent transition-colors"
                                title="Minimize"
                            >
                                <i className="fa-solid fa-chevron-down text-[10px]"></i>
                            </button>
                        </div>
                    </div>

                    <textarea
                        ref={textareaRef}
                        value={content}
                        onChange={(e) => onContentChange(e.target.value)}
                        placeholder="Paste your content here (homework, notes, extracts)..."
                        className="w-full bg-transparent p-6 text-[14px] leading-relaxed text-text-primary focus:outline-none resize-none custom-scrollbar placeholder:text-text-secondary/20 font-medium"
                        style={{ minHeight: '200px' }}
                    />
                </div>
            ) : (
                <div className="flex justify-start px-2">
                    <button
                        onClick={onToggle}
                        className="group flex items-center gap-3 px-4 py-2 bg-bg-surface/40 backdrop-blur-md border border-border-primary hover:border-accent/30 transition-all active:scale-95 border-b-0 rounded-t-xl"
                    >
                        <i className={`fa-solid ${content.length > 0 ? 'fa-file-lines' : 'fa-plus'} text-[10px] text-accent opacity-50 transition-transform group-hover:scale-110`}></i>
                        <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-text-secondary group-hover:text-text-primary transition-colors">
                            {content.length > 0 ? 'Input Content' : 'Add Context material'}
                            {content.length > 0 && <span className="ml-2 opacity-50">({content.length})</span>}
                        </span>
                    </button>
                </div>
            )}
        </div>
    );
};

export default InputPanel;
