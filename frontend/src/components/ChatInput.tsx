"use client";

import { useState, useRef, KeyboardEvent } from "react";
import { Send, Paperclip, X, Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ChatInputProps {
  onSend: (message: string, file?: File) => void;
  disabled?: boolean;
  showFileUpload?: boolean;
  placeholder?: string;
  inputType?: "text" | "password";
}

export function ChatInput({
  onSend,
  disabled,
  showFileUpload = true,
  placeholder = "Type a message...",
  inputType = "text",
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (file.type.startsWith("image/")) {
        setPreviewUrl(URL.createObjectURL(file));
      }
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSend = () => {
    if ((!message.trim() && !selectedFile) || disabled) return;
    onSend(message.trim(), selectedFile || undefined);
    setMessage("");
    setShowPassword(false);
    clearFile();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handlePasswordKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-slate-700/50 bg-slate-900/90 backdrop-blur-sm p-4">
      <AnimatePresence>
        {selectedFile && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-3 flex items-center gap-3 rounded-lg bg-slate-800 p-2"
          >
            {previewUrl && (
              <img
                src={previewUrl}
                alt="Preview"
                className="h-12 w-12 rounded object-cover"
              />
            )}
            <div className="flex-1 truncate text-sm text-slate-300">
              {selectedFile.name}
            </div>
            <button
              onClick={clearFile}
              className="rounded p-1 text-slate-400 hover:bg-slate-700 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-end gap-2">
        {showFileUpload && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              className="rounded-full p-3 text-slate-400 transition-colors hover:bg-slate-800 hover:text-cyan-400 disabled:opacity-50"
            >
              <Paperclip className="h-5 w-5" />
            </button>
          </>
        )}

        <div className="flex-1 relative">
          {inputType === "password" ? (
            <>
              <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handlePasswordKeyDown}
                placeholder={placeholder}
                disabled={disabled}
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                spellCheck={false}
                className="w-full rounded-2xl bg-slate-800 px-4 py-3 pr-12 text-slate-100 placeholder-slate-500 outline-none ring-1 ring-slate-700 transition-all focus:ring-cyan-500/50 disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                disabled={disabled || !message}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-700 hover:text-white disabled:opacity-50"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </>
          ) : (
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled}
              rows={1}
              className="w-full resize-none rounded-2xl bg-slate-800 px-4 py-3 text-slate-100 placeholder-slate-500 outline-none ring-1 ring-slate-700 transition-all focus:ring-cyan-500/50 disabled:opacity-50"
              style={{ maxHeight: "120px" }}
            />
          )}
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSend}
          disabled={disabled || (!message.trim() && !selectedFile)}
          className="rounded-full bg-gradient-to-r from-cyan-500 to-cyan-600 p-3 text-white shadow-lg shadow-cyan-500/25 transition-all hover:shadow-cyan-500/40 disabled:opacity-50 disabled:shadow-none"
        >
          <Send className="h-5 w-5" />
        </motion.button>
      </div>
    </div>
  );
}
