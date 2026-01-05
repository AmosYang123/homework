
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
  const [selectedTemplate, setSelectedTemplate] = useState<StyleTemplate | null>(null);

  const filtered = templates.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-claude-bg overflow-hidden">
      <div className="max-w-5xl mx-auto w-full px-6 pt-12 pb-20 custom-scrollbar overflow-y-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-claude-text">Style Templates</h1>
            <p className="text-claude-text-secondary text-lg">Define f(input)=output patterns to transform your content.</p>
          </div>
          <button 
            onClick={onCreate}
            className="bg-accent hover:bg-accent-hover text-white px-6 py-3 rounded-xl transition-all shadow-lg shadow-accent/20 font-bold text-sm flex items-center gap-2 w-fit active:scale-95"
          >
            <i className="fa-solid fa-plus"></i>
            Create Template
          </button>
        </div>

        <div className="relative mb-10 group">
          <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-claude-text-secondary/40 group-focus-within:text-accent transition-colors"></i>
          <input 
            type="text" 
            placeholder="Search templates..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-6 py-4 bg-white border border-claude-border rounded-2xl focus:ring-4 focus:ring-accent/5 focus:border-accent outline-none transition-all text-sm shadow-sm"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(template => (
            <div 
              key={template.id}
              onClick={() => setSelectedTemplate(template)}
              className="group bg-white border border-claude-border rounded-xl p-6 transition-all hover:border-accent hover:shadow-lg cursor-pointer flex flex-col relative"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                    <i className={`fa-solid ${template.icon || 'fa-sparkles'}`}></i>
                  </div>
                  <h3 className="text-lg font-bold text-claude-text">@{template.name}</h3>
                </div>
                <div className="relative group/menu">
                  <button className="p-2 text-claude-text-secondary hover:bg-claude-surface rounded-lg">
                    <i className="fa-solid fa-ellipsis-vertical"></i>
                  </button>
                  <div className="absolute top-full right-0 mt-1 hidden group-hover/menu:block bg-white border border-claude-border shadow-xl rounded-xl z-10 w-40 overflow-hidden">
                    <button onClick={(e) => { e.stopPropagation(); onEdit(template); }} className="w-full text-left px-4 py-2 hover:bg-claude-surface text-sm flex items-center gap-2">
                      <i className="fa-solid fa-pen text-[10px]"></i> Edit
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onDelete(template.id); }} className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-500 text-sm flex items-center gap-2">
                      <i className="fa-solid fa-trash-can text-[10px]"></i> Delete
                    </button>
                  </div>
                </div>
              </div>

              <p className="text-sm text-claude-text-secondary line-clamp-1 mb-6">
                {template.description}
              </p>

              <div className="space-y-2 mb-6">
                <div className="text-[13px] text-claude-text-secondary flex items-center gap-2">
                  <span className="opacity-70 font-bold">INPUT:</span>
                  <span className="truncate flex-1 font-medium">{template.inputExample.slice(0, 30)}...</span>
                </div>
                <div className="text-[13px] text-claude-text-secondary flex items-center gap-2">
                  <span className="opacity-70 font-bold">OUTPUT:</span>
                  <span className="truncate flex-1 font-medium">{template.outputExample.slice(0, 30)}...</span>
                </div>
              </div>

              <div className="mt-auto pt-4 border-t border-claude-border flex items-center justify-between">
                <span className="text-[11px] text-claude-text-secondary font-medium">
                  Last used: {template.lastUsedAt ? new Date(template.lastUsedAt).toLocaleDateString() : 'Never'}
                </span>
                <span className="text-[11px] font-bold text-accent uppercase tracking-tighter">
                  Used {template.useCount || 0} times
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-claude-text/40 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setSelectedTemplate(null)}>
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 border border-claude-border" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-claude-border flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent text-xl">
                  <i className={`fa-solid ${selectedTemplate.icon || 'fa-sparkles'}`}></i>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-claude-text">@{selectedTemplate.name}</h2>
                  <p className="text-sm text-claude-text-secondary">{selectedTemplate.description}</p>
                </div>
              </div>
              <button onClick={() => setSelectedTemplate(null)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-claude-surface text-claude-text-secondary transition-colors">
                <i className="fa-solid fa-times"></i>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-8">
              <section className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-claude-text-secondary uppercase tracking-widest">
                  <i className="fa-solid fa-arrow-right-to-bracket text-accent"></i> Input Example
                </div>
                <div className="p-5 bg-claude-surface rounded-xl border border-claude-border text-sm leading-relaxed whitespace-pre-wrap">
                  {selectedTemplate.inputExample}
                </div>
              </section>

              <section className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-claude-text-secondary uppercase tracking-widest">
                  <i className="fa-solid fa-arrow-right-from-bracket text-accent"></i> Output Example
                </div>
                <div className="p-5 bg-accent/[0.02] rounded-xl border border-accent/20 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                  {selectedTemplate.outputExample}
                </div>
              </section>

              <section className="pt-4 border-t border-claude-border grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-[10px] text-claude-text-secondary uppercase font-bold tracking-widest mb-1">Total Uses</div>
                  <div className="text-xl font-bold text-claude-text">{selectedTemplate.useCount || 0}</div>
                </div>
                <div className="text-center border-x border-claude-border">
                  <div className="text-[10px] text-claude-text-secondary uppercase font-bold tracking-widest mb-1">Created</div>
                  <div className="text-sm font-bold text-claude-text">{new Date(selectedTemplate.createdAt).toLocaleDateString()}</div>
                </div>
                <div className="text-center">
                  <div className="text-[10px] text-claude-text-secondary uppercase font-bold tracking-widest mb-1">Efficiency</div>
                  <div className="text-xl font-bold text-accent">98%</div>
                </div>
              </section>
            </div>

            <div className="p-6 bg-claude-surface/30 border-t border-claude-border flex justify-end gap-3">
              <button onClick={() => { onEdit(selectedTemplate); setSelectedTemplate(null); }} className="px-5 py-2.5 rounded-xl border border-claude-border font-bold text-sm hover:bg-white transition-all">Edit Template</button>
              <button onClick={() => setSelectedTemplate(null)} className="px-6 py-2.5 bg-accent text-white rounded-xl font-bold text-sm shadow-lg shadow-accent/20 hover:bg-accent-hover active:scale-95 transition-all">Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateManager;
