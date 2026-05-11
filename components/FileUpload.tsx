import React, { useState, useRef, DragEvent } from 'react';
import { Upload, FileAudio, X, FileVideo } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    // This is crucial for allowing drop
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      validateAndSetFile(file);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    const validTypes = ['audio/mpeg', 'audio/wav', 'audio/mp3', 'video/mp4', 'video/quicktime', 'video/webm'];
    
    if (file.size > 100 * 1024 * 1024) {
        alert("File size exceeds 100MB limit. Please upload a smaller file.");
        return;
    }
    
    // Simple validation, can be expanded
    if (validTypes.some(type => file.type.includes(type.split('/')[1]) || file.type === type)) {
        setSelectedFile(file);
        onFileSelect(file);
    } else {
        alert("Please upload a valid audio or video file (MP3, WAV, MP4, MOV).");
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {!selectedFile ? (
        <div
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`
            relative border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-300
            ${isDragging 
              ? 'border-indigo-500 bg-indigo-50 scale-[1.02]' 
              : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'
            }
          `}
        >
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".mp3,.wav,.mp4,.mov"
            onChange={handleFileInput}
          />
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className={`p-4 rounded-full ${isDragging ? 'bg-indigo-100' : 'bg-slate-100'}`}>
              <Upload className={`w-8 h-8 ${isDragging ? 'text-indigo-600' : 'text-slate-500'}`} />
            </div>
            <div>
              <p className="text-lg font-medium text-slate-700">
                Drag & Drop your media file here
              </p>
              <p className="text-sm text-slate-500 mt-1">
                or click to browse (MP3, MP4, WAV, MOV)
              </p>
            </div>
            <div className="text-xs text-slate-400 mt-4">
              Max file size: 100MB
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-indigo-100 rounded-lg">
              {selectedFile.type.startsWith('video') ? (
                <FileVideo className="w-6 h-6 text-indigo-600" />
              ) : (
                <FileAudio className="w-6 h-6 text-indigo-600" />
              )}
            </div>
            <div>
              <p className="font-medium text-slate-800 truncate max-w-xs">
                {selectedFile.name}
              </p>
              <p className="text-sm text-slate-500">
                {formatFileSize(selectedFile.size)}
              </p>
            </div>
          </div>
          <button
            onClick={removeFile}
            className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
