
import React, { useRef } from 'react';
import { FileAttachment } from '../types';

interface FileUploadProps {
  onUpload: (files: FileAttachment[]) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onUpload }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const loaders = Array.from(files).map((file: File) => {
      return new Promise<FileAttachment>((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          resolve({
            name: file.name,
            type: file.type || 'text/plain',
            size: file.size,
            data: event.target?.result as string
          });
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(loaders).then(results => {
      onUpload(results);
      if (fileInputRef.current) fileInputRef.current.value = '';
    });
  };

  return (
    <div>
      <input 
        type="file" 
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden" 
        multiple
        accept=".pdf,.doc,.docx,.txt,.csv,.xlsx,.jpg,.png,.js,.py,.ts,.cpp,.java"
      />
      <button 
        onClick={() => fileInputRef.current?.click()}
        className="w-9 h-9 flex items-center justify-center text-claude-text-secondary hover:text-claude-text hover:bg-claude-surface rounded-claude transition-all"
        title="Upload content"
      >
        <i className="fa-solid fa-paperclip text-lg"></i>
      </button>
    </div>
  );
};

export default FileUpload;
