import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ title, message, onConfirm, onCancel }) => {
    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-bg-main/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-bg-main border border-border-primary w-full max-w-sm shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-red-500/20"></div>

                <div className="p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-red-500/10 rounded-full">
                            <AlertTriangle size={20} className="text-red-500" />
                        </div>
                        <h2 className="text-lg font-bold tracking-tight text-text-primary">{title}</h2>
                    </div>

                    <p className="text-xs text-text-secondary leading-relaxed mb-10 font-medium">
                        {message}
                    </p>

                    <div className="flex gap-4">
                        <button
                            onClick={onCancel}
                            className="flex-1 py-3 border border-border-primary text-[10px] font-bold uppercase tracking-[0.2em] text-text-secondary hover:text-text-primary hover:bg-bg-surface transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            className="flex-1 py-3 bg-red-500 text-white text-[10px] font-bold uppercase tracking-[0.2em] hover:opacity-90 transition-all active:scale-[0.98]"
                        >
                            Confirm
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
