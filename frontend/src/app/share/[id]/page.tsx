"use client";

import { useState, useEffect, use } from "react";
import { motion } from "framer-motion";
import { Shield, Lock, Eye, EyeOff, CheckCircle, XCircle, Share2 } from "lucide-react";
import Link from "next/link";
import { getSharedImage, decodeSharedImage, SharedImage } from "@/services/api";

export default function ShareDecodePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [sharedData, setSharedData] = useState<SharedImage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [decoding, setDecoding] = useState(false);
  const [decodedMessage, setDecodedMessage] = useState<string | null>(null);
  const [decodeError, setDecodeError] = useState<string | null>(null);

  useEffect(() => {
    const fetchShared = async () => {
      try {
        const data = await getSharedImage(id);
        setSharedData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Link not found");
      } finally {
        setLoading(false);
      }
    };
    fetchShared();
  }, [id]);

  const handleDecode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;

    setDecoding(true);
    setDecodeError(null);

    try {
      const result = await decodeSharedImage(id, password);
      if (result.decodedMessage) {
        setDecodedMessage(result.decodedMessage);
      } else {
        setDecodeError(result.message || "Wrong password");
      }
    } catch (err) {
      setDecodeError("Failed to decode");
    } finally {
      setDecoding(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-400"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center px-4">
        <div className="text-center">
          <XCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Link Not Found</h1>
          <p className="text-slate-400 mb-6">{error}</p>
          <Link
            href="/chat"
            className="rounded-lg bg-cyan-500 px-6 py-2 text-white font-semibold hover:bg-cyan-600 transition-colors"
          >
            Go to StegaBot
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
              <Share2 className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Shared Secret Message</h1>
          <p className="text-slate-400">
            Someone shared an encrypted image with you
          </p>
        </div>

        {/* Card */}
        <div className="bg-slate-900/80 border border-slate-700/50 rounded-2xl p-6 backdrop-blur">
          {!decodedMessage ? (
            <>
              {/* Image Preview */}
              {sharedData && (
                <div className="mb-6">
                  <img
                    src={`data:image/png;base64,${sharedData.image_base64}`}
                    alt="Shared encoded image"
                    className="rounded-lg max-h-48 mx-auto object-contain"
                  />
                  <div className="flex justify-center gap-4 mt-3 text-xs text-slate-500">
                    <span>Views: {sharedData.views}</span>
                    <span>•</span>
                    <span>Shared: {new Date(sharedData.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              )}

              {/* Password Form */}
              <form onSubmit={handleDecode}>
                <label className="block text-sm text-slate-300 mb-2">
                  Enter password to reveal the message
                </label>
                <div className="relative mb-4">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full rounded-lg bg-slate-800 border border-slate-700 pl-10 pr-10 py-3 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>

                {decodeError && (
                  <p className="text-red-400 text-sm mb-4 flex items-center gap-2">
                    <XCircle className="h-4 w-4" />
                    {decodeError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={decoding || !password}
                  className="w-full rounded-lg bg-gradient-to-r from-cyan-500 to-cyan-600 py-3 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:from-cyan-600 hover:to-cyan-700 transition-all"
                >
                  {decoding ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white"></div>
                      Decoding...
                    </span>
                  ) : (
                    "Reveal Secret Message"
                  )}
                </button>
              </form>

              {/* Security Note */}
              <div className="mt-6 p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                <div className="flex items-start gap-2">
                  <Shield className="h-5 w-5 text-cyan-400 mt-0.5" />
                  <div className="text-xs text-slate-400">
                    <p className="font-semibold text-slate-300 mb-1">End-to-End Encrypted</p>
                    <p>This message is protected with AES-256 encryption. Only someone with the correct password can read it.</p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Success State */
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className="text-center mb-6">
                <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-3" />
                <h2 className="text-lg font-semibold text-white">Message Decoded!</h2>
              </div>

              <div className="bg-slate-800/80 rounded-lg p-4 border border-green-500/30">
                <p className="text-white whitespace-pre-wrap">{decodedMessage}</p>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => {
                    setDecodedMessage(null);
                    setPassword("");
                  }}
                  className="flex-1 rounded-lg border border-slate-600 py-2 text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  Decode Another
                </button>
                <Link
                  href="/chat"
                  className="flex-1 rounded-lg bg-cyan-500 py-2 text-center text-white font-semibold hover:bg-cyan-600 transition-colors"
                >
                  Try StegaBot
                </Link>
              </div>
            </motion.div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <Link href="/" className="text-slate-500 text-sm hover:text-slate-300">
            Powered by StegaBot
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
