"use client";

import { useMemo } from "react";
import { Shield, Lock, AlertTriangle, CheckCircle } from "lucide-react";

interface PasswordStrengthProps {
  password: string;
  showDetails?: boolean;
}

export function PasswordStrength({ password, showDetails = false }: PasswordStrengthProps) {
  const analysis = useMemo(() => {
    if (!password) {
      return { score: 0, label: "Enter password", color: "slate", checks: [] };
    }

    const checks = [
      { label: "8+ characters", passed: password.length >= 8 },
      { label: "Uppercase letter", passed: /[A-Z]/.test(password) },
      { label: "Lowercase letter", passed: /[a-z]/.test(password) },
      { label: "Number", passed: /\d/.test(password) },
      { label: "Special character", passed: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
    ];

    const score = checks.filter((c) => c.passed).length;

    let label: string;
    let color: string;

    if (score <= 1) {
      label = "Very Weak";
      color = "red";
    } else if (score === 2) {
      label = "Weak";
      color = "orange";
    } else if (score === 3) {
      label = "Fair";
      color = "yellow";
    } else if (score === 4) {
      label = "Strong";
      color = "lime";
    } else {
      label = "Very Strong";
      color = "green";
    }

    return { score, label, color, checks };
  }, [password]);

  const colorClasses: Record<string, string> = {
    slate: "bg-slate-600",
    red: "bg-red-500",
    orange: "bg-orange-500",
    yellow: "bg-yellow-500",
    lime: "bg-lime-500",
    green: "bg-green-500",
  };

  const textClasses: Record<string, string> = {
    slate: "text-slate-400",
    red: "text-red-400",
    orange: "text-orange-400",
    yellow: "text-yellow-400",
    lime: "text-lime-400",
    green: "text-green-400",
  };

  if (!password) return null;

  return (
    <div className="space-y-2">
      {/* Strength Bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden flex gap-0.5">
          {[1, 2, 3, 4, 5].map((level) => (
            <div
              key={level}
              className={`flex-1 h-full transition-all duration-300 ${
                level <= analysis.score ? colorClasses[analysis.color] : "bg-slate-700"
              }`}
            />
          ))}
        </div>
        <span className={`text-xs font-medium ${textClasses[analysis.color]}`}>
          {analysis.label}
        </span>
      </div>

      {/* Detailed Checks */}
      {showDetails && (
        <div className="grid grid-cols-2 gap-1 text-xs">
          {analysis.checks.map((check) => (
            <div
              key={check.label}
              className={`flex items-center gap-1 ${
                check.passed ? "text-green-400" : "text-slate-500"
              }`}
            >
              {check.passed ? (
                <CheckCircle className="h-3 w-3" />
              ) : (
                <div className="h-3 w-3 rounded-full border border-slate-600" />
              )}
              {check.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface EncryptionInfoProps {
  messageLength?: number;
  maxCapacity?: number;
}

export function EncryptionInfo({ messageLength, maxCapacity }: EncryptionInfoProps) {
  return (
    <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50 space-y-2">
      <div className="flex items-center gap-2 text-cyan-400 text-sm font-medium">
        <Shield className="h-4 w-4" />
        Military-Grade Encryption
      </div>
      
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-slate-900/50 rounded p-2">
          <div className="text-slate-500 mb-1">Algorithm</div>
          <div className="text-slate-200 font-mono">AES-256-CBC</div>
        </div>
        <div className="bg-slate-900/50 rounded p-2">
          <div className="text-slate-500 mb-1">Key Derivation</div>
          <div className="text-slate-200 font-mono">PBKDF2</div>
        </div>
        <div className="bg-slate-900/50 rounded p-2">
          <div className="text-slate-500 mb-1">Iterations</div>
          <div className="text-slate-200 font-mono">120,000</div>
        </div>
        <div className="bg-slate-900/50 rounded p-2">
          <div className="text-slate-500 mb-1">Brute Force Time</div>
          <div className="text-slate-200 font-mono">~10⁷⁷ years</div>
        </div>
      </div>

      {messageLength !== undefined && maxCapacity !== undefined && (
        <div className="pt-2 border-t border-slate-700/50">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-400">Message Size</span>
            <span className={messageLength > maxCapacity ? "text-red-400" : "text-slate-300"}>
              {messageLength} / {maxCapacity} chars
            </span>
          </div>
          <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                messageLength > maxCapacity ? "bg-red-500" :
                messageLength > maxCapacity * 0.8 ? "bg-yellow-500" : "bg-cyan-500"
              }`}
              style={{ width: `${Math.min(100, (messageLength / maxCapacity) * 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
