
import React, { useState } from 'react';
import { StyleTemplate } from '../types';

interface TemplateManagerProps {
  templates: StyleTemplate[];
  onEdit: (template: StyleTemplate) => void;
  onDelete: (id: string) => void;
  onCreate: () => void;
}

const TemplateManager: React.FC<TemplateManagerProps> = ({ templates, onEdit, onDelete, onCreate }) => {
  const [search, setSearch] = useState('');

  const filtered = templates.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    (t.description?.toLowerCase().includes(search.toLowerCase()) ?? false)
  );

  return (
    <div className="flex-1 h-full overflow-y-auto custom-scrollbar px-12 pt-10 pb-40 bg-bg-main animate-slide-in">
      <div className="max-w-5xl mx-auto">
        <header className="flex justify-between items-end mb-12 border-b border-border-primary pb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tighter mb-2">Logic Repository</h1>
            <p className="text-[10px] text-text-secondary uppercase tracking-[0.4em] font-bold opacity-40">Transformation Catalog Standard</p>
          </div>
          <button
            onClick={onCreate}
            className="text-[10px] font-bold uppercase tracking-[0.2em] bg-accent text-bg-main px-6 py-3 hover:opacity-90 transition-all active:scale-[0.98]"
          >
            Add New Pattern
          </button>
        </header>

        <div className="mb-16">
          <div className="relative group">
            <input
              type="text"
              placeholder="Search registry patterns..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full py-4 border-b border-border-primary outline-none focus:border-accent text-[16px] placeholder:text-text-secondary/20 transition-all font-medium"
            />
            <div className="absolute right-0 bottom-4 text-[10px] font-bold text-text-secondary uppercase tracking-widest opacity-20 group-focus-within:opacity-100 transition-opacity">Filters Active</div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {filtered.length === 0 ? (
            <div className="py-32 text-center border border-dashed border-border-primary bg-bg-surface/30">
              <p className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.4em] opacity-60 italic">No patterns match the criteria</p>
            </div>
          ) : (
            filtered.map(template => (
              <div
                key={template.id}
                className="group border border-border-primary p-10 transition-all hover:border-accent bg-bg-main flex items-start gap-16 relative"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-6 mb-4">
                    <h3 className="text-[18px] font-bold tracking-tight">@{template.name}</h3>
                    <div className="h-[1px] w-12 bg-border-primary"></div>
                    <span className={`text-[9px] uppercase font-bold tracking-[0.3em] ${template.type === 'three-section' ? 'text-accent' : 'text-text-secondary opacity-40'}`}>
                      {template.type === 'three-section' ? 'Complex Logic (3-Sec)' : 'Standard Logic'}
                    </span>
                  </div>
                  {template.description && (
                    <p className="text-[14px] text-text-secondary leading-relaxed mb-8 max-w-2xl font-medium">{template.description}</p>
                  )}
                  <div className="flex gap-10 text-[9px] font-bold uppercase tracking-[0.3em] opacity-30">
                    <div className="flex items-center gap-2">
                      <i className={`fa-solid ${template.type === 'three-section' ? 'fa-puzzle-piece' : 'fa-chart-line'}`}></i>
                      {template.useCount} Executions
                    </div>
                    <div className="flex items-center gap-2"><i className="fa-solid fa-code-branch"></i> Logic Verified</div>
                  </div>
                </div>
                <div className="flex flex-col gap-8 items-end shrink-0 pt-1">
                  <button onClick={() => onEdit(template)} className="text-[10px] font-bold uppercase tracking-[0.3em] text-text-secondary hover:text-accent transition-colors">Modify</button>
                  <button onClick={() => onDelete(template.id)} className="text-[10px] font-bold uppercase tracking-[0.3em] text-text-secondary hover:text-red-500 transition-colors">Discard</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default TemplateManager;
