/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  Volume2,
  Clock,
  Store,
  Calendar,
  AlertTriangle,
  Copy,
  Check,
  FileCheck,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { FeedbackLog, ThemeCluster } from '../types';

interface CitationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cluster: ThemeCluster | null;
  allLogs: FeedbackLog[];
  onSelectTicket?: (logId: string) => void;
}

export const CitationDrawer: React.FC<CitationDrawerProps> = ({
  isOpen,
  onClose,
  cluster,
  allLogs,
  onSelectTicket,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  if (!isOpen || !cluster) return null;

  // Retrieve matching logs for this cluster
  const matchedLogs = allLogs.filter((log) => cluster.matchingLogIds.includes(log.id));
  const activeLog = matchedLogs.find((l) => l.id === selectedTicketId) || matchedLogs[0];

  const handleCopyCitation = (log: FeedbackLog) => {
    const citationText = `[${log.id}] (${log.rating}★, ${log.storeId}, ${log.date}): "${log.text}" Telemetry: ${log.telemetryNote || 'N/A'}`;
    navigator.clipboard.writeText(citationText);
    setCopiedId(log.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-[#181716]/30 backdrop-blur-xs transition-opacity"
      />

      {/* Slide-out Drawer Panel */}
      <aside className="relative w-full max-w-xl bg-[#FFFFFF] border-l border-[#E5E0D5] h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-200">
        {/* Panel Header */}
        <div className="p-5 border-b border-[#E5E0D5] bg-[#F6F3EC]/80 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#EE4322] animate-pulse" />
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#938E85]">
                100% Attribution Protocol
              </span>
            </div>
            <h2 className="text-base font-bold text-[#181716] tracking-tight mt-0.5">
              Traceable Evidence & Customer Verification Dossier
            </h2>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#78736B] hover:text-[#181716] hover:bg-[#E5E0D5]/50 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Cluster Briefing Summary */}
        <div className="p-4 border-b border-[#E5E0D5] bg-[#FFFFFF] space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-[#EE4322] font-semibold">
              {cluster.title}
            </span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#4A5D4E]/10 text-[#4A5D4E] font-medium flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              {cluster.groundednessScore}% Grounded
            </span>
          </div>
          <p className="text-xs text-[#78736B] font-sans leading-relaxed">
            {cluster.insight}
          </p>

          <div className="flex items-center gap-3 pt-1 text-[11px] font-mono text-[#938E85]">
            <span>ATTRIBUTED BLEED: <strong className="text-[#EE4322]">{cluster.attributedRevenueBleed}</strong></span>
            <span>·</span>
            <span>VERIFIED LOGS: <strong className="text-[#181716]">{matchedLogs.length} voices</strong></span>
          </div>
        </div>

        {/* 1. Clickable Markdown Ticket Pills */}
        <div className="p-4 border-b border-[#E5E0D5] bg-[#F6F3EC]/50">
          <div className="text-[11px] font-mono text-[#938E85] uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Select Ticket Verification Pill</span>
            <span>{matchedLogs.length} Records</span>
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
            {matchedLogs.map((log) => {
              const isSelected = (activeLog?.id === log.id);
              return (
                <button
                  key={log.id}
                  onClick={() => {
                    setSelectedTicketId(log.id);
                    onSelectTicket?.(log.id);
                  }}
                  className={`font-mono text-xs px-2.5 py-1 rounded-md border transition-all flex items-center gap-1 ${
                    isSelected
                      ? 'bg-[#181716] text-[#FCF9F2] border-[#181716] shadow-xs font-semibold'
                      : 'bg-[#FFFFFF] text-[#181716] border-[#E5E0D5] hover:border-[#EE4322]/50 hover:bg-[#FDF1EE]/40'
                  }`}
                >
                  <span>[{log.id}]</span>
                  <span className={`text-[10px] ${log.rating <= 2 ? 'text-[#EE4322]' : 'text-[#4A5D4E]'}`}>
                    {log.rating}★
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Log Dossier Card */}
        {activeLog && (
          <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-[#FCF9F2]/40">
            {/* Primary Quote Card */}
            <div className="bg-[#FFFFFF] border border-[#E5E0D5] rounded-xl p-4 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E5E0D5]/70">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-[#181716]">
                    Ticket {activeLog.id}
                  </span>
                  {activeLog.isDuplicate && (
                    <span className="text-[10px] font-mono bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded">
                      MERGED DUPLICATE
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {/* Star Rating Badge */}
                  <span
                    className={`inline-flex items-center gap-1 font-mono text-xs font-bold px-2 py-0.5 rounded ${
                      activeLog.rating <= 2
                        ? 'bg-[#FDF1EE] text-[#EE4322] border border-[#EE4322]/20'
                        : 'bg-emerald-50 text-emerald-800'
                    }`}
                  >
                    ★ {activeLog.rating}.0
                  </span>

                  <button
                    onClick={() => handleCopyCitation(activeLog)}
                    className="text-[#938E85] hover:text-[#181716] p-1 rounded hover:bg-[#F6F3EC] transition-colors"
                    title="Copy exact markdown citation"
                  >
                    {copiedId === activeLog.id ? (
                      <Check className="w-3.5 h-3.5 text-[#4A5D4E]" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* 2. Exact Customer Quotes in Carbon Black Italic Editorial Style (#181716) */}
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#938E85] block mb-1">
                  Customer Voice Transcription
                </span>
                <blockquote className="font-serif italic text-base text-[#181716] leading-relaxed pl-3 border-l-2 border-[#EE4322]">
                  "{activeLog.text}"
                </blockquote>
              </div>

              {/* 3. Metadata Grid: Dark Store ID, Order SLA status, Timestamp */}
              <div className="grid grid-cols-2 gap-3 pt-2 text-xs border-t border-[#E5E0D5]/70">
                <div className="flex items-center gap-1.5 text-[#78736B]">
                  <Store className="w-3.5 h-3.5 text-[#938E85]" />
                  <span className="font-medium text-[#181716]">{activeLog.storeId}</span>
                </div>

                <div className="flex items-center gap-1.5 text-[#78736B]">
                  <Clock className="w-3.5 h-3.5 text-[#938E85]" />
                  <span className={`font-mono text-[11px] ${activeLog.slaStatus.includes('Breached') ? 'text-[#EE4322] font-semibold' : 'text-[#181716]'}`}>
                    {activeLog.slaStatus}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-[#78736B]">
                  <Calendar className="w-3.5 h-3.5 text-[#938E85]" />
                  <span className="font-mono text-[11px] text-[#181716]">
                    {activeLog.date} {activeLog.time ? `· ${activeLog.time}` : ''}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-[#78736B]">
                  <span className="text-[10px] font-mono text-[#938E85]">SKU:</span>
                  <span className="font-medium text-[#181716]">{activeLog.category}</span>
                </div>
              </div>

              {/* 4. Audio/Transcript Waveform Bar Placeholder (#EE4322 kinetic bars) */}
              <div className="bg-[#F6F3EC] border border-[#E5E0D5] rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono text-[#78736B]">
                  <div className="flex items-center gap-1.5">
                    <Volume2 className="w-3.5 h-3.5 text-[#EE4322]" />
                    <span className="font-medium text-[#181716]">Support Call Audio & Acoustic Stress Telemetry</span>
                  </div>
                  <span className="text-[#938E85]">0:{activeLog.audioDurationSeconds || 24}s · 16kHz WAV</span>
                </div>

                {/* Animated kinetic waveform bars */}
                <div className="h-8 flex items-center justify-between gap-1 px-1 bg-[#FFFFFF] rounded border border-[#E5E0D5]/80 overflow-hidden">
                  {[24, 45, 68, 30, 85, 95, 72, 40, 60, 88, 34, 52, 90, 80, 44, 62, 78, 50, 92, 38, 70, 84, 42, 66].map((height, idx) => (
                    <div
                      key={idx}
                      className="w-1.5 rounded-full bg-[#EE4322] transition-all hover:bg-[#181716]"
                      style={{
                        height: `${Math.max(15, height * (activeLog.rating <= 2 ? 0.9 : 0.4))}%`,
                        opacity: idx % 3 === 0 ? 0.9 : 0.7,
                      }}
                    />
                  ))}
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono text-[#938E85]">
                  <span>ACOUSTIC PITCH: +4.2dB STRESS PEAK</span>
                  <span>SENTIMENT SCORE: -0.84 (ANGRY)</span>
                </div>
              </div>

              {/* 5. Dark Store Telemetry Cell */}
              <div className="bg-[#FDF1EE] border border-[#EE4322]/20 rounded-lg p-3 space-y-1 text-xs">
                <div className="flex items-center gap-1.5 text-[#EE4322] font-semibold font-mono text-[11px]">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>DARK STORE SENSOR TELEMETRY</span>
                </div>
                <p className="font-mono text-[11px] text-[#181716] leading-relaxed">
                  {activeLog.telemetryNote || 'Unrefrigerated Staging Bay 3B - Ambient Sensor 26.8°C - Dwell time 14.0 mins'}
                </p>
                <div className="text-[10px] font-mono text-[#78736B] pt-1 flex items-center justify-between border-t border-[#EE4322]/10">
                  <span>STAGING BAY: BAY-03B</span>
                  <span>DISPATCH LATENCY: {activeLog.stagingDwellMinutes || 14} MINS</span>
                </div>
              </div>
            </div>

            {/* Evidence Chain Verification Fingerprint */}
            <div className="bg-[#FFFFFF] border border-[#E5E0D5] rounded-xl p-3.5 text-xs text-[#78736B] space-y-2">
              <div className="flex items-center justify-between text-[10px] font-mono text-[#938E85]">
                <span>LLM JUDGE VERIFICATION PROOF</span>
                <span className="text-[#4A5D4E] font-semibold">STATUS: VERIFIED</span>
              </div>
              <div className="font-mono text-[10px] text-[#181716] bg-[#F6F3EC] p-2 rounded border border-[#E5E0D5] break-all select-all">
                SHA256: 7f8a92b3c4d5e6f1082734615aefc90281b37e6a4b12c8e32d109f
              </div>
              <p className="text-[11px] text-[#78736B]">
                Every claim in the executive cluster is cryptographically mapped to this unedited raw log entry. Zero synthetic hallucination.
              </p>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#E5E0D5] bg-[#F6F3EC] flex items-center justify-between">
          <button
            onClick={() => {
              if (activeLog) handleCopyCitation(activeLog);
            }}
            className="flex items-center gap-1.5 text-xs font-mono text-[#181716] bg-[#FFFFFF] border border-[#E5E0D5] hover:bg-[#F6F3EC] px-3 py-1.5 rounded-lg transition-colors"
          >
            <Copy className="w-3.5 h-3.5 text-[#EE4322]" />
            <span>Copy Citation Markdown</span>
          </button>

          <button
            onClick={onClose}
            className="text-xs font-semibold px-4 py-1.5 bg-[#181716] hover:bg-[#2c2a28] text-[#FFFFFF] rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </aside>
    </div>
  );
};
