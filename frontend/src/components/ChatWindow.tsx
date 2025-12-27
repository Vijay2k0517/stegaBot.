"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, BarChart3, History, X, Lock, Unlock } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChatBubble, ChatMessage } from "./ChatBubble";
import { ChatInput } from "./ChatInput";
import { TypingIndicator } from "./TypingIndicator";
import { FileUploadMessage } from "./FileUploadMessage";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useLanguage } from "./LanguageProvider";
import {
  ChatState,
  createInitialState,
  processMessage,
  getRandomGreeting,
  getResponse,
} from "@/services/chatController";
import { encodeMessage, decodeMessage, getConversations, ConversationItem } from "@/services/api";
import { getAccessToken, clearAuth, getDisplayName } from "@/services/auth";

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

export function ChatWindow() {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatState, setChatState] = useState<ChatState>(createInitialState());
  const [isTyping, setIsTyping] = useState(false);
  const [awaitingFile, setAwaitingFile] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [authorized, setAuthorized] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<ConversationItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  const loadHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const convos = await getConversations();
      setHistory(convos);
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.push("/login?next=/chat");
      return;
    }
    setAuthorized(true);
    const name = getDisplayName() || "friend";
    const greeting = `Welcome, ${name}! ${getRandomGreeting()}`;
    setIsTyping(true);
    const timer = setTimeout(() => {
      setIsTyping(false);
      setMessages([
        {
          id: generateId(),
          role: "bot",
          type: "text",
          content: greeting,
          timestamp: new Date(),
        },
      ]);
    }, 800);

    // Clear auth on page unload for privacy (extra safety measure)
    const handleUnload = () => {
      clearAuth();
    };
    window.addEventListener("beforeunload", handleUnload);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, [router]);

  const addBotMessage = (content: string, type: ChatMessage["type"] = "text", extra?: Partial<ChatMessage>) => {
    setMessages((prev) => [
      ...prev,
      {
        id: generateId(),
        role: "bot",
        type,
        content,
        timestamp: new Date(),
        ...extra,
      },
    ]);
  };

  const handleSend = async (text: string, file?: File) => {
    if (file) {
      const userMsg: ChatMessage = {
        id: generateId(),
        role: "user",
        type: "image",
        content: "",
        fileName: file.name,
        fileUrl: URL.createObjectURL(file),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setAwaitingFile(false);

      setIsTyping(true);
      const { response, newState, action } = processMessage("", chatState, file);
      setChatState(newState);

      setTimeout(() => {
        setIsTyping(false);
        addBotMessage(response);
        if (action === "request_file") {
          setAwaitingFile(true);
        }
      }, 600);
      return;
    }

    if (!text) return;

    const isPasswordStep = chatState.currentFlow.includes("password");

    const userMsg: ChatMessage = {
      id: generateId(),
      role: "user",
      type: "text",
      content: isPasswordStep ? "••••••" : text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);

    setIsTyping(true);
    const { response, newState, action } = processMessage(text, chatState);
    setChatState(newState);

    setTimeout(async () => {
      setIsTyping(false);
      addBotMessage(response);

      if (action === "request_file") {
        setAwaitingFile(true);
      } else if (action === "encode") {
        await handleEncode(newState);
      } else if (action === "decode") {
        await handleDecode(newState);
      }
    }, 800);
  };

  const handleEncode = async (state: ChatState) => {
    if (!state.encodeImage || !state.encodeMessage || !state.encodePassword) return;

    setIsTyping(true);
    try {
      const { blob } = await encodeMessage(
        state.encodeImage,
        state.encodeMessage,
        state.encodePassword
      );
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);

      setTimeout(() => {
        setIsTyping(false);
        addBotMessage(getResponse("encode_success"), "download", { fileUrl: url });
        setChatState(createInitialState());
      }, 1500);
    } catch (err) {
      setTimeout(() => {
        setIsTyping(false);
        addBotMessage(
          `Encoding failed: ${err instanceof Error ? err.message : "Unknown error"}. Please try again.`
        );
        setChatState(createInitialState());
      }, 500);
    }
  };

  const handleDecode = async (state: ChatState) => {
    if (!state.decodeImage || !state.decodePassword) return;

    setIsTyping(true);
    try {
      const result = await decodeMessage(state.decodeImage, state.decodePassword);

      setTimeout(() => {
        setIsTyping(false);
        if (result.decodedMessage) {
          addBotMessage(`${getResponse("decode_success")}\n\n"${result.decodedMessage}"`);
          setChatState(createInitialState());
          return;
        }

        // Wrong password / not encoded — keep iterating until success or user cancels.
        const extra = "\n\nTry again, or type 'cancel' to quit.";
        addBotMessage(`${result.message || getResponse("decode_fail")}${extra}`);
        setChatState({
          ...state,
          currentFlow: "decode_awaiting_password",
          decodePassword: "",
        });
      }, 1500);
    } catch (err) {
      setTimeout(() => {
        setIsTyping(false);
        addBotMessage(`${getResponse("decode_fail")}\n\nTry again, or type 'cancel' to quit.`);
        setChatState({
          ...state,
          currentFlow: "decode_awaiting_password",
          decodePassword: "",
        });
      }, 500);
    }
  };

  const handleDownload = () => {
    if (downloadUrl) {
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = "stegabot_encoded.png";
      a.click();
    }
  };

  const handleLogout = () => {
    clearAuth();
    router.push("/login");
  };

  const handleFileUpload = (file: File) => {
    handleSend("", file);
  };

  return (
    <div className="flex h-screen flex-col bg-[#0F172A]">
      {!authorized && (
        <div className="flex flex-1 items-center justify-center text-slate-200">
          Redirecting to login...
        </div>
      )}
      {authorized && (
        <>
          <motion.header
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex items-center justify-between border-b border-slate-700/50 bg-slate-900/80 px-4 py-3 backdrop-blur-sm"
          >
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div className="flex items-center gap-2">
                <div>
                  <h1 className="logo-font text-xl text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-cyan-200">StegaBot</h1>
                  <p className="text-xs text-emerald-400">Online</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setShowHistory(true);
                  loadHistory();
                }}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-800 hover:text-cyan-400 transition-colors"
                title="History"
              >
                <History className="h-5 w-5" />
              </button>
              <Link
                href="/analyze"
                className="rounded-full p-2 text-slate-400 hover:bg-slate-800 hover:text-purple-400 transition-colors"
                title="Steganalysis Lab"
              >
                <BarChart3 className="h-5 w-5" />
              </Link>
              <LanguageSwitcher />
              <button
                onClick={handleLogout}
                className="rounded-full px-3 py-1 text-xs text-slate-300 hover:bg-slate-800"
              >
                Logout
              </button>
              <div className="flex items-center gap-1 rounded-full bg-emerald-500/20 px-3 py-1">
                <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs text-emerald-400">Secure</span>
              </div>
            </div>
          </motion.header>

          {/* History Sidebar */}
          <AnimatePresence>
            {showHistory && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/50 z-40"
                  onClick={() => setShowHistory(false)}
                />
                <motion.div
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                  className="fixed right-0 top-0 bottom-0 w-80 bg-slate-900 border-l border-slate-700 z-50 flex flex-col"
                >
                  <div className="flex items-center justify-between p-4 border-b border-slate-700">
                    <h2 className="font-semibold text-white flex items-center gap-2">
                      <History className="h-5 w-5 text-cyan-400" />
                      Activity History
                    </h2>
                    <button
                      onClick={() => setShowHistory(false)}
                      className="p-1 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4">
                    {loadingHistory ? (
                      <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="animate-pulse bg-slate-800 rounded-lg p-4 h-20" />
                        ))}
                      </div>
                    ) : history.length === 0 ? (
                      <div className="text-center py-8 text-slate-500">
                        <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>No activity yet</p>
                        <p className="text-sm mt-1">Your encode/decode history will appear here</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {history.slice().reverse().map((item, i) => (
                          <div
                            key={i}
                            className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50"
                          >
                            <div className="flex items-center gap-2 mb-2">
                              {item.type === 'encode' ? (
                                <Lock className="h-4 w-4 text-cyan-400" />
                              ) : (
                                <Unlock className="h-4 w-4 text-emerald-400" />
                              )}
                              <span className={`text-sm font-medium ${
                                item.type === 'encode' ? 'text-cyan-400' : 'text-emerald-400'
                              }`}>
                                {item.type === 'encode' ? 'Encoded' : 'Decoded'}
                              </span>
                              <span className="text-xs text-slate-500 ml-auto">
                                {new Date(item.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 font-mono truncate">
                              Hash: {item.image_hash?.slice(0, 16)}...
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                              {new Date(item.created_at).toLocaleTimeString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <ChatBubble
                key={msg.id}
                message={msg}
                onDownload={msg.type === "download" ? handleDownload : undefined}
              />
            ))}
            {awaitingFile && !isTyping && (
              <FileUploadMessage onFileSelect={handleFileUpload} />
            )}
            {isTyping && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-sm bg-slate-800/80">
                  <TypingIndicator />
                </div>
              </div>
            )}
          </div>

          <ChatInput
            onSend={handleSend}
            disabled={isTyping}
            showFileUpload={awaitingFile}
            inputType={chatState.currentFlow.includes("password") ? "password" : "text"}
            placeholder={
              awaitingFile
                ? "Upload an image or type a message..."
                : chatState.currentFlow === "encode_awaiting_message"
                ? "Enter your secret message..."
                : chatState.currentFlow.includes("password")
                ? "Enter your password..."
                : "Type a message..."
            }
          />
        </>
      )}
    </div>
  );
}
