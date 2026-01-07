
import React, { useState, useEffect } from 'react';
import { StyleTemplate, TemplateType, TemplateUsage } from '../types';

interface TemplateCreatorProps {
  template: StyleTemplate | null;
  onSave: (template: Partial<StyleTemplate>) => void;
  onClose: () => void;
}

export function buildThreeSectionPrompt(
  templateName: string,
  rawMaterial: string,
  templateContent: string,
  exampleOutputContent?: string,
  useExample: boolean = true
): string {
  let prompt = `You are a precise information extraction and formatting assistant.

# Task
Fill out the provided template/outline using ONLY information from the raw material provided. Do not add information from your training data.

[SECTION_RAW]
# Raw Material
${rawMaterial}
[/SECTION_RAW]

[SECTION_TEMPLATE]
# Template to Fill Out
${templateContent}
[/SECTION_TEMPLATE]
`;

  if (exampleOutputContent && useExample) {
    prompt += `

# Example of Desired Output Format
${exampleOutputContent}

Follow this exact format and level of detail.
`;
  }

  prompt += `

# Instructions
1. Carefully read the raw material
2. Identify information that matches each field in the template
3. Fill out the template using ONLY information from the raw material
4. If information is not found in the raw material, write "Not specified in source"
5. Maintain the exact structure and formatting of the template
6. Do not add any information beyond what is explicitly stated in the source

# Output
Provide ONLY the filled-out template. Do not include explanations or additional commentary.`;

  return prompt;
}

const TemplateCreator: React.FC<TemplateCreatorProps> = ({ template, onSave, onClose }) => {
  const [step, setStep] = useState(1);
  const [type, setType] = useState<TemplateType>(template?.type || 'standard');
  const [name, setName] = useState(template?.name || '');
  const [description, setDescription] = useState(template?.description || '');

  // Standard fields
  const [inputExample, setInputExample] = useState(template?.inputExample || '');
  const [outputExample, setOutputExample] = useState(template?.outputExample || '');

  // Three-Section fields
  const [rawMaterialLabel, setRawMaterialLabel] = useState(template?.threeSection?.rawMaterial.label || 'Raw Material');
  const [rawMaterialPlaceholder, setRawMaterialPlaceholder] = useState(template?.threeSection?.rawMaterial.placeholder || 'Paste source content here...');
  const [rawMaterialExample, setRawMaterialExample] = useState(template?.threeSection?.rawMaterial.example || '');

  const [templateLabel, setTemplateLabel] = useState(template?.threeSection?.template.label || 'Template/Outline');
  const [templatePlaceholder, setTemplatePlaceholder] = useState(template?.threeSection?.template.placeholder || 'Paste the template to fill out...');
  const [templateExample, setTemplateExample] = useState(template?.threeSection?.template.example || '');

  const [exampleOutputContent, setExampleOutputContent] = useState(template?.threeSection?.exampleOutput?.content || '');

  const isFormValid = name.trim() && (
    type === 'standard'
      ? (inputExample.trim() && outputExample.trim())
      : (rawMaterialExample.trim() && templateExample.trim() && exampleOutputContent.trim())
  );

  const handleNext = () => setStep(s => Math.min(s + 1, 3));
  const handleBack = () => setStep(s => Math.max(s - 1, 1));

  const handleSave = () => {
    const data: Partial<StyleTemplate> = {
      name,
      description,
      type,
    };

    if (type === 'standard') {
      data.inputExample = inputExample;
      data.outputExample = outputExample;
    } else {
      data.threeSection = {
        rawMaterial: {
          label: rawMaterialLabel,
          placeholder: rawMaterialPlaceholder,
          example: rawMaterialExample
        },
        template: {
          label: templateLabel,
          placeholder: templatePlaceholder,
          example: templateExample
        },
        exampleOutput: {
          label: 'Example Output',
          content: exampleOutputContent,
          enabled: true
        }
      };
      // Generate system prompt automatically
      data.systemPrompt = buildThreeSectionPrompt(
        name,
        rawMaterialExample,
        templateExample,
        exampleOutputContent,
        true
      );
    }

    onSave(data);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-main/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-bg-main w-full max-w-2xl border border-border-primary overflow-hidden flex flex-col max-h-[90vh] shadow-2xl">

        <header className="px-8 py-6 border-b border-border-primary flex items-center justify-between bg-bg-surface/50">
          <div>
            <h2 className="text-lg font-bold tracking-tight">
              {template ? 'Modify Logic' : 'Initialize Patterns'}
            </h2>
            <div className="flex gap-4 mt-2">
              {[1, 2, 3].map(i => (
                <div key={i} className={`h-[1px] w-8 transition-all ${step >= i ? 'bg-accent' : 'bg-border-primary'}`}></div>
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
              <div className="flex gap-4 p-1 bg-bg-surface rounded-lg border border-border-primary w-fit">
                <button
                  onClick={() => setType('standard')}
                  className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-all rounded-md ${type === 'standard' ? 'bg-accent text-bg-main shadow-lg' : 'text-text-secondary hover:text-text-primary'}`}
                >
                  Standard
                </button>
                <button
                  onClick={() => setType('three-section')}
                  className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-all rounded-md ${type === 'three-section' ? 'bg-accent text-bg-main shadow-lg' : 'text-text-secondary hover:text-text-primary'}`}
                >
                  Three-Section
                </button>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-secondary">Identifier</label>
                <div className="relative">
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 text-accent font-bold text-lg">@</span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value.replace(/\s+/g, ''))}
                    placeholder="PatternName"
                    className="w-full pl-6 py-3 border-b border-border-primary focus:border-accent outline-none font-bold text-xl transition-all bg-transparent"
                    autoFocus
                  />
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-secondary">Description (Optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Define the transformation scope..."
                  className="w-full py-2 border-b border-border-primary focus:border-accent outline-none transition-all resize-none text-sm placeholder:text-text-secondary/30 bg-transparent"
                  rows={2}
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
              {type === 'standard' ? (
                <div className="space-y-4">
                  <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-text-secondary">Input Context f(x)</div>
                  <textarea
                    value={inputExample}
                    onChange={(e) => setInputExample(e.target.value)}
                    placeholder="Raw source material..."
                    className="w-full h-[400px] p-6 bg-bg-surface border border-border-primary focus:border-accent outline-none transition-all resize-none text-[13px] leading-relaxed custom-scrollbar font-mono rounded-xl"
                  />
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <i className="fa-solid fa-file-lines text-text-secondary text-xs"></i>
                      <input
                        value={rawMaterialLabel}
                        onChange={e => setRawMaterialLabel(e.target.value)}
                        className="text-[10px] font-bold uppercase tracking-[0.3em] text-text-secondary bg-transparent border-none outline-none focus:text-accent"
                      />
                    </div>
                    <textarea
                      value={rawMaterialExample}
                      onChange={(e) => setRawMaterialExample(e.target.value)}
                      placeholder={rawMaterialPlaceholder}
                      className="w-full h-48 p-6 bg-bg-surface border border-border-primary rounded-xl focus:border-accent outline-none transition-all resize-none text-[13px] leading-relaxed custom-scrollbar font-mono"
                    />
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <i className="fa-solid fa-table-list text-text-secondary text-xs"></i>
                      <input
                        value={templateLabel}
                        onChange={e => setTemplateLabel(e.target.value)}
                        className="text-[10px] font-bold uppercase tracking-[0.3em] text-text-secondary bg-transparent border-none outline-none focus:text-accent"
                      />
                    </div>
                    <textarea
                      value={templateExample}
                      onChange={(e) => setTemplateExample(e.target.value)}
                      placeholder={templatePlaceholder}
                      className="w-full h-48 p-6 bg-bg-surface border border-border-primary rounded-xl focus:border-accent outline-none transition-all resize-none text-[13px] leading-relaxed custom-scrollbar font-mono"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-fade-in">
              {type === 'standard' ? (
                <div className="space-y-4">
                  <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-text-secondary">Output Context = y</div>
                  <textarea
                    value={outputExample}
                    onChange={(e) => setOutputExample(e.target.value)}
                    placeholder="Target style output..."
                    className="w-full h-[400px] p-6 bg-accent text-bg-main border border-border-primary focus:border-accent outline-none transition-all resize-none text-[13px] leading-relaxed custom-scrollbar font-bold rounded-xl"
                  />
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="space-y-4 animate-slide-in">
                    <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-text-secondary mb-2">Required Example Output</div>
                    <textarea
                      value={exampleOutputContent}
                      onChange={(e) => setExampleOutputContent(e.target.value)}
                      placeholder="Provide a completed example of how the template should be filled..."
                      className="w-full h-80 p-6 bg-bg-surface/50 border border-border-primary rounded-xl focus:border-accent outline-none transition-all resize-none text-[13px] leading-relaxed custom-scrollbar font-bold"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <footer className="px-10 py-8 border-t border-border-primary flex items-center justify-between bg-bg-surface/50">
          <div>
            {step > 1 && (
              <button
                onClick={handleBack}
                className="group flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-text-secondary hover:text-accent transition-colors"
              >
                <i className="fa-solid fa-chevron-left text-[8px] transition-transform group-hover:-translate-x-1"></i>
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
                className="px-8 py-3 bg-accent text-bg-main text-[10px] font-bold uppercase tracking-[0.2em] disabled:opacity-30 transition-all active:scale-95 rounded-lg shadow-xl shadow-accent/20"
              >
                Continue
              </button>
            ) : (
              <button
                disabled={!isFormValid}
                onClick={handleSave}
                className="px-8 py-3 bg-accent text-bg-main text-[10px] font-bold uppercase tracking-[0.2em] disabled:opacity-30 transition-all active:scale-95 rounded-lg shadow-xl shadow-accent/20"
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
