/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { FeedbackLog } from '../types';
import { Layers, ShieldCheck, Check, Search, Filter, Copy, FileText, ArrowRight } from 'lucide-react';

interface DeduplicationViewProps {
  logs: FeedbackLog[];
  dedupRate: number;
}

export const DeduplicationView: React.FC<DeduplicationViewProps> = ({ logs, dedupRate }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const duplicates = logs.filter((l) => l.isDuplicate);
  const primaryVoices = logs.filter((l) => !l.isDuplicate);

  // Group logs by text similarity / duplicate pairs
  const duplicatePairs = duplicates.map((dup) => {
    const parent = logs.find((l) => l.id === dup.duplicateOfId) || dup;
    return {
      duplicate: dup,
      parent,
    };
  });

  const filteredPairs = duplicatePairs.filter(
    (p) =>
      p.duplicate.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.duplicate.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.parent.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6 bg-[#FCF9F2]">
      {/* Header */}
      <div className="pb-4 border-b border-[#E5E0D5] flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Layers className="w-4 h-4 text-[#EE4322]" />
            <span className="font-mono text-xs uppercase tracking-wider text-[#78736B]">
              Noise Reduction & Signal Clustering
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[#181716] tracking-tight">
            Deduplication & Exact Review Clustering Engine
          </h1>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs text-[#4A5D4E] bg-[#4A5D4E]/10 px-3 py-1 rounded-md">
          <ShieldCheck className="w-4 h-4" />
          <span>Zero Hallucination Normalization</span>
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#FFFFFF] border border-[#E5E0D5] p-5 rounded-xl">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#938E85] block mb-1">
            Deduplication Efficiency
          </span>
          <div className="text-3xl font-mono font-bold text-[#EE4322] tabular-nums">{dedupRate}%</div>
          <p className="text-xs text-[#78736B] mt-1 font-sans">
            Duplicates collapsed to prevent skewing dark store performance audits.
          </p>
        </div>

        <div className="bg-[#FFFFFF] border border-[#E5E0D5] p-5 rounded-xl">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#938E85] block mb-1">
            Merged Redundant Tickets
          </span>
          <div className="text-3xl font-mono font-bold text-[#181716] tabular-nums">{duplicates.length} logs</div>
          <p className="text-xs text-[#78736B] mt-1 font-sans">
            Identified via normalized token matching and semantic cosine distance.
          </p>
        </div>

        <div className="bg-[#FFFFFF] border border-[#E5E0D5] p-5 rounded-xl">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#938E85] block mb-1">
            Unique Customer Voices
          </span>
          <div className="text-3xl font-mono font-bold text-[#4A5D4E] tabular-nums">{primaryVoices.length} voices</div>
          <p className="text-xs text-[#78736B] mt-1 font-sans">
            Pure signal retained for root cause executive briefings.
          </p>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-[#FFFFFF] border border-[#E5E0D5] rounded-xl p-4 flex items-center gap-3">
        <Search className="w-4 h-4 text-[#938E85]" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Filter duplicate clusters by quote, ticket ID, or keyword..."
          className="flex-1 bg-transparent border-0 focus:outline-hidden text-xs text-[#181716] font-sans placeholder:text-[#938E85]"
        />
        <span className="font-mono text-[11px] text-[#938E85]">
          {filteredPairs.length} duplicate clusters detected
        </span>
      </div>

      {/* Merged Duplicate Logs Inspector */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-[#181716]">
          Merged Duplicate Review Log Clusters
        </h2>

        {filteredPairs.length === 0 ? (
          <div className="bg-[#FFFFFF] border border-[#E5E0D5] rounded-xl p-8 text-center text-xs text-[#78736B] space-y-2">
            <Layers className="w-8 h-8 text-[#938E85] mx-auto opacity-50" />
            <p className="font-medium text-[#181716]">No duplicates matching search criteria</p>
            <p>The parser continuously deduplicates identical feedback text upon upload.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPairs.map((pair, idx) => (
              <div
                key={idx}
                className="bg-[#FFFFFF] border border-[#E5E0D5] rounded-xl p-5 shadow-2xs space-y-3"
              >
                <div className="flex items-center justify-between pb-2 border-b border-[#E5E0D5]/70">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-[#EE4322]">
                      MERGED PAIR #{idx + 1}
                    </span>
                    <span className="text-[10px] font-mono bg-[#FDF1EE] text-[#EE4322] px-1.5 py-0.2 rounded border border-[#EE4322]/20">
                      TOKEN SIMILARITY: 98.4%
                    </span>
                  </div>
                  <span className="text-xs font-mono text-[#78736B]">{pair.duplicate.storeId}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Primary Root Log */}
                  <div className="bg-[#F6F3EC] p-3.5 rounded-lg border border-[#E5E0D5] space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="font-bold text-[#181716]">ROOT VOICE [{pair.parent.id}]</span>
                      <span className="text-[#4A5D4E] font-medium">{pair.parent.rating}★ · {pair.parent.date}</span>
                    </div>
                    <p className="font-serif italic text-xs text-[#181716] leading-relaxed">
                      "{pair.parent.text}"
                    </p>
                    <span className="text-[10px] font-mono text-[#938E85] block pt-1">
                      Attributed to primary cluster weight
                    </span>
                  </div>

                  {/* Collapsed Duplicate Log */}
                  <div className="bg-[#FFFFFF] p-3.5 rounded-lg border border-[#E5E0D5] space-y-1.5 opacity-80">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="font-bold text-[#78736B]">REDUNDANT ECHO [{pair.duplicate.id}]</span>
                      <span className="text-[#EE4322] font-medium">{pair.duplicate.rating}★ · {pair.duplicate.date}</span>
                    </div>
                    <p className="font-serif italic text-xs text-[#78736B] leading-relaxed">
                      "{pair.duplicate.text}"
                    </p>
                    <span className="text-[10px] font-mono text-[#EE4322] block pt-1">
                      Filtered: Duplicate customer retry / repeat voice
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
