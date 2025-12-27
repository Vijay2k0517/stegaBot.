"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import { Upload, Image as ImageIcon } from "lucide-react";

interface FileUploadMessageProps {
  onFileSelect: (file: File) => void;
}

export function FileUploadMessage({ onFileSelect }: FileUploadMessageProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      onFileSelect(file);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex justify-start"
    >
      <div
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="group cursor-pointer rounded-2xl rounded-bl-sm bg-slate-800/80 p-4 shadow-[0_0_20px_rgba(34,211,238,0.1)] transition-all hover:bg-slate-700/80 hover:shadow-[0_0_25px_rgba(34,211,238,0.2)]"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg"
          onChange={handleFileChange}
          className="hidden"
        />
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-cyan-500/20 p-3 text-cyan-400 transition-colors group-hover:bg-cyan-500/30">
            <Upload className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-100">
              Click or drag to upload
            </p>
            <p className="flex items-center gap-1 text-xs text-slate-400">
              <ImageIcon className="h-3 w-3" />
              PNG or JPG, up to 5MB
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
