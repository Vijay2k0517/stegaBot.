"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { 
  Shield, 
  Upload, 
  BarChart3, 
  Eye, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Zap,
  Lock
} from "lucide-react";
import Link from "next/link";
import { 
  analyzeCapacity, 
  detectSteganography, 
  getImageHistogram,
  CapacityAnalysis,
  SteganalysisResult,
  HistogramData
} from "@/services/api";

export default function AnalyzePage() {
  const [image, setImage] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [capacity, setCapacity] = useState<CapacityAnalysis | null>(null);
  const [steganalysis, setSteganalysis] = useState<SteganalysisResult | null>(null);
  const [histogram, setHistogram] = useState<HistogramData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    setImage(file);
    setImageUrl(URL.createObjectURL(file));
    setLoading(true);

    try {
      const [cap, steg, hist] = await Promise.all([
        analyzeCapacity(file),
        detectSteganography(file),
        getImageHistogram(file),
      ]);
      setCapacity(cap);
      setSteganalysis(steg);
      setHistogram(hist);
    } catch (err) {
      console.error("Analysis failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      handleFileSelect(file);
    }
  };

  const getVerdictColor = (verdict: string) => {
    if (verdict.includes("LIKELY")) return "text-red-400";
    if (verdict.includes("POSSIBLY")) return "text-yellow-400";
    return "text-green-400";
  };

  const getVerdictIcon = (verdict: string) => {
    if (verdict.includes("LIKELY")) return <AlertTriangle className="h-6 w-6" />;
    if (verdict.includes("POSSIBLY")) return <Eye className="h-6 w-6" />;
    return <CheckCircle className="h-6 w-6" />;
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-white">
      {/* Header */}
      <header className="border-b border-slate-700/50 bg-slate-900/80 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/chat"
              className="rounded-full p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-400 to-purple-600 shadow-lg shadow-purple-500/30">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Steganalysis Lab</h1>
                <p className="text-xs text-slate-400">Detect hidden data in images</p>
              </div>
            </div>
          </div>
          <Link
            href="/chat"
            className="rounded-lg bg-cyan-500/20 px-4 py-2 text-cyan-400 hover:bg-cyan-500/30 transition-colors"
          >
            Back to Chat
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Upload Section */}
        {!image && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center"
          >
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              className="w-full max-w-2xl border-2 border-dashed border-slate-600 rounded-2xl p-16 text-center cursor-pointer hover:border-cyan-500/50 hover:bg-slate-800/30 transition-all"
            >
              <Upload className="h-16 w-16 mx-auto mb-4 text-slate-500" />
              <h2 className="text-2xl font-semibold mb-2">Drop an image to analyze</h2>
              <p className="text-slate-400 mb-4">
                Detect if an image contains hidden steganographic data
              </p>
              <button className="rounded-lg bg-gradient-to-r from-cyan-500 to-cyan-600 px-6 py-2 font-semibold">
                Select Image
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              />
            </div>

            {/* Feature Cards */}
            <div className="grid md:grid-cols-3 gap-6 mt-12 w-full max-w-4xl">
              <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
                <Eye className="h-8 w-8 text-purple-400 mb-3" />
                <h3 className="font-semibold mb-2">Steganalysis Detection</h3>
                <p className="text-sm text-slate-400">
                  Chi-square analysis and entropy detection to find hidden data
                </p>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
                <BarChart3 className="h-8 w-8 text-cyan-400 mb-3" />
                <h3 className="font-semibold mb-2">Histogram Analysis</h3>
                <p className="text-sm text-slate-400">
                  RGB channel distribution and LSB pattern visualization
                </p>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
                <Zap className="h-8 w-8 text-yellow-400 mb-3" />
                <h3 className="font-semibold mb-2">Capacity Calculator</h3>
                <p className="text-sm text-slate-400">
                  See how many characters can be hidden in any image
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Analysis Results */}
        {image && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* Top Row: Image + Detection */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Image Preview */}
              <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Eye className="h-5 w-5 text-cyan-400" />
                  Image Preview
                </h3>
                {imageUrl && (
                  <img
                    src={imageUrl}
                    alt="Analyzed"
                    className="rounded-lg max-h-64 mx-auto object-contain"
                  />
                )}
                <div className="mt-4 text-sm text-slate-400">
                  <p>{image.name}</p>
                  <p>{(image.size / 1024).toFixed(1)} KB</p>
                </div>
                <button
                  onClick={() => {
                    setImage(null);
                    setImageUrl(null);
                    setCapacity(null);
                    setSteganalysis(null);
                    setHistogram(null);
                  }}
                  className="mt-4 text-sm text-cyan-400 hover:text-cyan-300"
                >
                  Analyze different image
                </button>
              </div>

              {/* Steganalysis Result */}
              <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-purple-400" />
                  Steganalysis Detection
                </h3>
                {loading ? (
                  <div className="animate-pulse space-y-4">
                    <div className="h-12 bg-slate-700 rounded"></div>
                    <div className="h-4 bg-slate-700 rounded w-3/4"></div>
                    <div className="h-4 bg-slate-700 rounded w-1/2"></div>
                  </div>
                ) : steganalysis ? (
                  <div>
                    <div className={`flex items-center gap-3 text-xl font-bold mb-4 ${getVerdictColor(steganalysis.verdict)}`}>
                      {getVerdictIcon(steganalysis.verdict)}
                      <span className="text-base">{steganalysis.verdict}</span>
                    </div>
                    
                    {/* Score Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-400">Detection Score</span>
                        <span className="font-mono font-bold">{steganalysis.score}/{steganalysis.max_score}</span>
                      </div>
                      <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-1000 ${
                            steganalysis.score >= 70 ? 'bg-red-500' :
                            steganalysis.score >= 50 ? 'bg-orange-500' :
                            steganalysis.score >= 30 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${steganalysis.score}%` }}
                        />
                      </div>
                    </div>

                    {/* Confidence Badge */}
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-xs text-slate-500">Confidence:</span>
                      <span className={`text-xs uppercase font-bold px-2 py-0.5 rounded ${
                        steganalysis.confidence === 'very high' ? 'bg-red-500/20 text-red-400' :
                        steganalysis.confidence === 'high' ? 'bg-orange-500/20 text-orange-400' :
                        steganalysis.confidence === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-green-500/20 text-green-400'
                      }`}>{steganalysis.confidence}</span>
                    </div>

                    {/* Analysis Metrics Grid */}
                    <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                      {steganalysis.analysis.chi_square !== undefined && (
                        <div className="bg-slate-900/50 rounded p-2">
                          <div className="text-slate-500">Chi-Square</div>
                          <div className="font-mono text-slate-200">{steganalysis.analysis.chi_square}</div>
                        </div>
                      )}
                      {steganalysis.analysis.rs_score !== undefined && (
                        <div className="bg-slate-900/50 rounded p-2">
                          <div className="text-slate-500">RS Score</div>
                          <div className="font-mono text-slate-200">{(steganalysis.analysis.rs_score * 100).toFixed(1)}%</div>
                        </div>
                      )}
                      {steganalysis.analysis.spa_score !== undefined && (
                        <div className="bg-slate-900/50 rounded p-2">
                          <div className="text-slate-500">SPA Score</div>
                          <div className="font-mono text-slate-200">{(steganalysis.analysis.spa_score * 100).toFixed(1)}%</div>
                        </div>
                      )}
                      <div className="bg-slate-900/50 rounded p-2">
                        <div className="text-slate-500">LSB Entropy</div>
                        <div className="font-mono text-slate-200">{steganalysis.analysis.lsb_entropy}/8.0</div>
                      </div>
                      <div className="bg-slate-900/50 rounded p-2">
                        <div className="text-slate-500">LSB Ratio</div>
                        <div className="font-mono text-slate-200">{steganalysis.analysis.lsb_ratio}</div>
                      </div>
                      {steganalysis.analysis.detected_payload_bytes && (
                        <div className="bg-red-900/30 rounded p-2 border border-red-500/30">
                          <div className="text-red-400">Payload Detected</div>
                          <div className="font-mono text-red-300">{steganalysis.analysis.detected_payload_bytes.toLocaleString()} bytes</div>
                        </div>
                      )}
                    </div>

                    {/* Methods Used */}
                    <div className="mb-4">
                      <p className="text-xs text-slate-500 mb-1">Methods Used:</p>
                      <div className="flex flex-wrap gap-1">
                        {steganalysis.methods_used?.map((method, i) => (
                          <span key={i} className="text-xs bg-slate-700/50 text-slate-400 px-2 py-0.5 rounded">
                            {method}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Reasons */}
                    {steganalysis.reasons && steganalysis.reasons.length > 0 && (
                      <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-700/50">
                        <p className="text-xs text-slate-500 uppercase mb-2">Detection Findings</p>
                        <ul className="text-sm space-y-1">
                          {steganalysis.reasons.map((reason, i) => (
                            <li key={i} className="text-slate-300 flex items-start gap-2">
                              <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                              {reason}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            </div>

            {/* Bottom Row: Capacity + Histogram */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Capacity Analysis */}
              <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-400" />
                  Encoding Capacity
                </h3>
                {loading ? (
                  <div className="animate-pulse space-y-4">
                    <div className="h-20 bg-slate-700 rounded"></div>
                  </div>
                ) : capacity ? (
                  <div>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-slate-900/50 rounded-lg p-4 text-center">
                        <div className="text-3xl font-bold text-cyan-400">
                          {capacity.max_characters.toLocaleString()}
                        </div>
                        <div className="text-xs text-slate-400 mt-1">Max Characters</div>
                      </div>
                      <div className="bg-slate-900/50 rounded-lg p-4 text-center">
                        <div className="text-3xl font-bold text-purple-400">
                          ~{capacity.max_words.toLocaleString()}
                        </div>
                        <div className="text-xs text-slate-400 mt-1">Approx Words</div>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Dimensions</span>
                        <span className="font-mono">{capacity.width} × {capacity.height}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Total Pixels</span>
                        <span className="font-mono">{capacity.total_pixels.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="mt-4 p-3 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
                      <div className="flex items-center gap-2 text-cyan-400 text-sm">
                        <Lock className="h-4 w-4" />
                        {capacity.encryption}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>

              {/* LSB Histogram */}
              <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-cyan-400" />
                  LSB Distribution
                </h3>
                {loading ? (
                  <div className="animate-pulse space-y-4">
                    <div className="h-32 bg-slate-700 rounded"></div>
                  </div>
                ) : histogram ? (
                  <div>
                    {/* LSB Bar Chart */}
                    <div className="flex gap-4 mb-6">
                      <div className="flex-1">
                        <div className="text-sm text-slate-400 mb-2">LSB = 0</div>
                        <div className="h-24 bg-slate-900/50 rounded-lg flex items-end justify-center p-2">
                          <div
                            className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t transition-all duration-1000"
                            style={{
                              height: `${(histogram.histograms.lsb.zeros / (histogram.histograms.lsb.zeros + histogram.histograms.lsb.ones)) * 100}%`
                            }}
                          />
                        </div>
                        <div className="text-center text-sm font-mono mt-2">
                          {((histogram.histograms.lsb.zeros / (histogram.histograms.lsb.zeros + histogram.histograms.lsb.ones)) * 100).toFixed(1)}%
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="text-sm text-slate-400 mb-2">LSB = 1</div>
                        <div className="h-24 bg-slate-900/50 rounded-lg flex items-end justify-center p-2">
                          <div
                            className="w-full bg-gradient-to-t from-purple-600 to-purple-400 rounded-t transition-all duration-1000"
                            style={{
                              height: `${(histogram.histograms.lsb.ones / (histogram.histograms.lsb.zeros + histogram.histograms.lsb.ones)) * 100}%`
                            }}
                          />
                        </div>
                        <div className="text-center text-sm font-mono mt-2">
                          {((histogram.histograms.lsb.ones / (histogram.histograms.lsb.zeros + histogram.histograms.lsb.ones)) * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500">
                      Natural images typically have ~50/50 LSB distribution. 
                      Significant deviation may indicate steganography.
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
