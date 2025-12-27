"use client";

import { motion } from "framer-motion";
import { Download, Image as ImageIcon } from "lucide-react";

export type MessageType = "text" | "image" | "file" | "download";

export interface ChatMessage {
  id: string;
  role: "user" | "bot";
  type: MessageType;
  content: string;
  fileName?: string;
  fileUrl?: string;
  timestamp: Date;
}

interface ChatBubbleProps {
  message: ChatMessage;
  onDownload?: () => void;
}

export function ChatBubble({ message, onDownload }: ChatBubbleProps) {
  const isBot = message.role === "bot";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`flex w-full ${isBot ? "justify-start" : "justify-end"}`}
    >
      <div
        className={`max-w-[80%] md:max-w-[70%] rounded-2xl px-4 py-3 ${
          isBot
            ? "bg-slate-800/80 text-slate-100 rounded-bl-sm shadow-[0_0_20px_rgba(34,211,238,0.1)]"
            : "bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-br-sm shadow-[0_0_20px_rgba(34,211,238,0.2)]"
        }`}
      >
        {message.type === "text" && (
          <div className="whitespace-pre-wrap text-sm md:text-base leading-relaxed">
            {message.content.split(/(\*\*[^*]+\*\*)/).map((part, i) => {
              if (part.startsWith("**") && part.endsWith("**")) {
                return (
                  <span key={i} className="font-semibold text-cyan-300">
                    {part.slice(2, -2)}
                  </span>
                );
              }
              return <span key={i}>{part}</span>;
            })}
          </div>
        )}

        {message.type === "image" && message.fileUrl && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <ImageIcon className="h-4 w-4" />
              {message.fileName}
            </div>
            <img
              src={message.fileUrl}
              alt={message.fileName}
              className="max-h-48 rounded-lg object-contain"
            />
          </div>
        )}

        {message.type === "download" && (
          <div className="space-y-3">
            <p className="text-sm md:text-base">{message.content}</p>
            {message.fileUrl && (
              <button
                onClick={onDownload}
                className="flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-emerald-400 hover:shadow-[0_0_15px_rgba(34,197,94,0.4)]"
              >
                <Download className="h-4 w-4" />
                Download Encoded Image
              </button>
            )}
          </div>
        )}

        <div
          className={`mt-1 text-[10px] ${
            isBot ? "text-slate-500" : "text-cyan-100/70"
          }`}
        >
          {message.timestamp.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>
    </motion.div>
  );
}
