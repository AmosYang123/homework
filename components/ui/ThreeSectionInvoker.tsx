
import React, { useState } from 'react';
import { StyleTemplate, TemplateUsage } from '../../types';

interface ThreeSectionInvokerProps {
    template: StyleTemplate;
    onSubmit: (usage: TemplateUsage) => void;
    onClose: () => void;
    isDark?: boolean;
}

const ThreeSectionInvoker: React.FC<ThreeSectionInvokerProps> = ({ template, onSubmit, onClose, isDark }) => {
    const [rawMaterial, setRawMaterial] = useState('');
    const [templateContent, setTemplateContent] = useState('');
    const [useExample, setUseExample] = useState(template.threeSection?.exampleOutput?.enabled || false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!rawMaterial.trim() || !templateContent.trim()) return;

        onSubmit({
            templateId: template.id,
            rawMaterial,
            template: templateContent,
            useExample
        });
    };

    if (!template.threeSection) return null;

    return (
        <div className="bg-bg-surface/90 backdrop-blur-2xl border border-border-primary rounded-2xl overflow-hidden shadow-2xl animate-slide-in max-w-2xl w-full mx-auto my-6">
            <header className="px-6 py-4 border-b border-border-primary flex items-center justify-between bg-bg-surface/50">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                        <i className="fa-solid fa-puzzle-piece text-accent text-xs"></i>
                    </div>
                    <div>
                        <h3 className="text-xs font-bold uppercase tracking-widest text-text-primary">Execute Transformation</h3>
                        <p className="text-[9px] font-bold text-accent tracking-[0.2em] uppercase">@{template.name}</p>
                    </div>
                </div>
                <button onClick={onClose} className="p-2 text-text-secondary hover:text-accent transition-colors">
                    <i className="fa-solid fa-times text-xs"></i>
                </button>
            </header>

            <form onSubmit={handleSubmit} className="p-8 space-y-8">
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-text-secondary flex items-center gap-2">
                            <i className="fa-solid fa-file-lines text-text-secondary opacity-60"></i>
                            {template.threeSection.rawMaterial.label}
                        </label>
                        <span className="text-[9px] font-medium text-text-secondary opacity-30 uppercase tracking-widest">Source Data Required</span>
                    </div>
                    <textarea
                        value={rawMaterial}
                        onChange={(e) => setRawMaterial(e.target.value)}
                        placeholder={template.threeSection.rawMaterial.placeholder}
                        className="w-full h-32 p-4 bg-bg-main border border-border-primary focus:border-accent rounded-xl outline-none transition-all resize-none text-[13px] leading-relaxed custom-scrollbar placeholder:text-text-secondary/20"
                    />
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-text-secondary flex items-center gap-2">
                            <i className="fa-solid fa-table-list text-text-secondary opacity-60"></i>
                            {template.threeSection.template.label}
                        </label>
                        <span className="text-[9px] font-medium text-text-secondary opacity-30 uppercase tracking-widest">Target Structure Required</span>
                    </div>
                    <textarea
                        value={templateContent}
                        onChange={(e) => setTemplateContent(e.target.value)}
                        placeholder={template.threeSection.template.placeholder}
                        className="w-full h-32 p-4 bg-bg-main border border-border-primary focus:border-accent rounded-xl outline-none transition-all resize-none text-[13px] leading-relaxed custom-scrollbar placeholder:text-text-secondary/20"
                    />
                </div>

                {template.threeSection.exampleOutput?.enabled && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 p-4 bg-bg-main rounded-xl border border-border-primary border-dashed hover:border-accent/40 transition-colors">
                            <input
                                id="invoker-use-example"
                                type="checkbox"
                                checked={useExample}
                                onChange={(e) => setUseExample(e.target.checked)}
                                className="accent-accent w-4 h-4 cursor-pointer"
                            />
                            <label htmlFor="invoker-use-example" className="flex-1 text-[10px] font-bold uppercase tracking-widest text-text-secondary cursor-pointer select-none">
                                Use saved example for format reference
                            </label>
                        </div>
                        {useExample && (
                            <div className="p-4 bg-accent/5 border border-accent/10 rounded-xl animate-slide-in">
                                <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-accent mb-2 opacity-60">Reference Output Format</div>
                                <pre className="text-[11px] leading-relaxed text-text-primary/70 whitespace-pre-wrap font-mono">
                                    {template.threeSection.exampleOutput.content}
                                </pre>
                            </div>
                        )}
                    </div>
                )}

                <div className="flex items-center justify-end pt-4 border-t border-border-primary/30">
                    <button
                        type="submit"
                        disabled={!rawMaterial.trim() || !templateContent.trim()}
                        className="px-10 py-4 bg-accent text-bg-main text-[10px] font-bold uppercase tracking-[0.3em] rounded-xl hover:opacity-90 disabled:opacity-20 transition-all active:scale-[0.98] shadow-2xl shadow-accent/40"
                    >
                        Deploy Analysis
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ThreeSectionInvoker;
