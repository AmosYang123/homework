
import React, { useState } from 'react';
import { StyleTemplate } from '../types';

interface TemplateCreatorProps {
  template: StyleTemplate | null;
  onSave: (template: Partial<StyleTemplate>) => void;
  onClose: () => void;
}

const TemplateCreator: React.FC<TemplateCreatorProps> = ({ template, onSave, onClose }) => {
  const [step, setStep] = useState(1);
  const [name, setName] = useState(template?.name || '');
  const [description, setDescription] = useState(template?.description || '');
  const [inputExample, setInputExample] = useState(template?.inputExample || '');
  const [outputExample, setOutputExample] = useState(template?.outputExample || '');

  const handleNext = () => setStep(s => Math.min(s + 1, 3));
  const handleBack = () => setStep(s => Math.max(s - 1, 1));

  const isFormValid = name.trim() && inputExample.trim() && outputExample.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-main/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-bg-main w-full max-w-2xl border border-border-primary overflow-hidden flex flex-col max-h-[90vh]">

        <header className="px-8 py-6 border-b border-border-primary flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold tracking-tight">
              {template ? 'Modify Template' : 'Initialize Pattern'}
            </h2>
            <div className="flex gap-4 mt-2">
              {[1, 2, 3].map(i => (
                <div key={i} className={`h-[2px] w-6 transition-all ${step >= i ? 'bg-accent' : 'bg-border-primary'}`}></div>
              ))}
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-text-secondary hover:text-accent transition-colors">
            <i className="fa-solid fa-times text-sm"></i>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-10">
          {step === 1 && (
            <div className="space-y-10 animate-fade-in">
              <div className="space-y-4">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-secondary">Identifier</label>
                <div className="relative">
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 text-accent font-bold text-lg">@</span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value.replace(/\s+/g, ''))}
                    placeholder="PatternName"
                    className="w-full pl-6 py-3 border-b border-border-primary focus:border-accent outline-none font-bold text-xl transition-all"
                    autoFocus
                  />
                </div>
                <p className="text-[10px] text-text-secondary uppercase tracking-widest opacity-50">Alphanumeric string only</p>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-secondary">Description (Optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Define the transformation scope..."
                  className="w-full py-2 border-b border-border-primary focus:border-accent outline-none transition-all resize-none text-sm placeholder:text-text-secondary/30"
                  rows={2}
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
              <div className="space-y-4">
                <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-text-secondary mb-2">Input Context f(x)</div>
                <p className="text-[11px] text-text-secondary uppercase tracking-widest mb-4">Paste unformatted sample content</p>
                <textarea
                  value={inputExample}
                  onChange={(e) => setInputExample(e.target.value)}
                  placeholder="Raw source material..."
                  className="w-full h-80 p-6 bg-bg-surface border border-border-primary focus:border-accent outline-none transition-all resize-none text-[13px] leading-relaxed custom-scrollbar font-mono"
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-fade-in">
              <div className="space-y-4">
                <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-text-secondary mb-2">Output Context = y</div>
                <p className="text-[11px] text-text-secondary uppercase tracking-widest mb-4">Provide the idealized transformation</p>
                <textarea
                  value={outputExample}
                  onChange={(e) => setOutputExample(e.target.value)}
                  placeholder="Target style output..."
                  className="w-full h-80 p-6 bg-accent-soft border border-border-primary focus:border-accent outline-none transition-all resize-none text-[13px] leading-relaxed custom-scrollbar font-bold"
                />
              </div>
            </div>
          )}
        </div>

        <footer className="px-10 py-8 border-t border-border-primary flex items-center justify-between">
          <div>
            {step > 1 && (
              <button onClick={handleBack} className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-secondary hover:text-accent transition-colors">
                Previous
              </button>
            )}
          </div>
          <div className="flex gap-8 items-center">
            <button onClick={onClose} className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-secondary hover:text-accent transition-colors">Cancel</button>
            {step < 3 ? (
              <button
                onClick={handleNext}
                disabled={step === 1 && !name}
                className="px-8 py-3 bg-accent text-bg-main text-[10px] font-bold uppercase tracking-[0.2em] disabled:opacity-30 transition-all active:scale-95"
              >
                Continue
              </button>
            ) : (
              <button
                disabled={!isFormValid}
                onClick={() => onSave({ name, description, inputExample, outputExample })}
                className="px-8 py-3 bg-accent text-bg-main text-[10px] font-bold uppercase tracking-[0.2em] disabled:opacity-30 transition-all active:scale-95"
              >
                Register Pattern
              </button>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
};

export default TemplateCreator;
