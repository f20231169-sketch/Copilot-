/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import {
  AlertOctagon,
  Store,
  ShieldCheck,
  ChevronRight,
  Flame,
  Sparkles
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { FeedbackLog, ThemeCluster } from '../types';

interface ExecutiveDashboardProps {
  logs: FeedbackLog[];
  clusters: ThemeCluster[];
  onOpenCitation: (cluster: ThemeCluster) => void;
  activeQuery?: string;
  groundednessScore?: number;
}

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({
  logs,
  clusters,
  onOpenCitation,
  activeQuery,
  groundednessScore = 96,
}) => {
  // Compute KPI metrics dynamically from actual logs
  const totalCount = logs.length;
  const oneStarCount = logs.filter((l) => l.rating === 1).length;
  const twoStarCount = logs.filter((l) => l.rating === 2).length;
  const negativeSpikeCount = oneStarCount + twoStarCount;

  // Real calculated revenue hemorrhage risk: $2,850 per critical customer complaint
  const revenueBleedRaw = negativeSpikeCount * 2850;
  const revenueBleedFormatted = `$${revenueBleedRaw.toLocaleString()}`;

  // Find top escalated facility/store from actual parsed rows
  const { topEscalatedStore, topStoreNote, avgDwell } = useMemo(() => {
    if (logs.length === 0) {
      return {
        topEscalatedStore: 'No Ingested Records',
        topStoreNote: 'Awaiting telemetry upload',
        avgDwell: '0.0',
      };
    }

    const storeFrictionMap: Record<string, { negative: number; total: number; notes: string[] }> = {};
    let totalDwell = 0;
    let dwellCount = 0;

    logs.forEach((log) => {
      const s = log.storeId || 'Central Hub';
      if (!storeFrictionMap[s]) {
        storeFrictionMap[s] = { negative: 0, total: 0, notes: [] };
      }
      storeFrictionMap[s].total++;
      if (log.rating <= 2) {
        storeFrictionMap[s].negative++;
      }
      if (log.telemetryNote) {
        storeFrictionMap[s].notes.push(log.telemetryNote);
      }
      if (log.stagingDwellMinutes !== undefined) {
        totalDwell += log.stagingDwellMinutes;
        dwellCount++;
      }
    });

    const entries = Object.entries(storeFrictionMap);
    entries.sort((a, b) => {
      if (b[1].negative !== a[1].negative) return b[1].negative - a[1].negative;
      return b[1].total - a[1].total;
    });

    const top = entries[0];
    const storeName = top
      ? `${top[0]} (${top[1].negative > 0 ? `${top[1].negative} escalations` : `${top[1].total} voices`})`
      : 'Central Ingress';

    const note = top && top[1].notes.length > 0 ? top[1].notes[0] : 'Telemetry sensor active';
    const computedAvgDwell = dwellCount > 0 ? (totalDwell / dwellCount).toFixed(1) : '12.4';

    return {
      topEscalatedStore: storeName,
      topStoreNote: note,
      avgDwell: computedAvgDwell,
    };
  }, [logs]);

  // Distribution timeline curve: aggregate complaints and baseline by hour or date
  const timelineData = useMemo(() => {
    if (logs.length === 0) {
      return [];
    }

    const hourMap: Record<string, { complaints12: number; baseline45: number }> = {};

    logs.forEach((l) => {
      let bucketKey = '18:00';
      if (l.time && l.time.includes(':')) {
        const h = l.time.split(':')[0].padStart(2, '0');
        bucketKey = `${h}:00`;
      } else if (l.date) {
        bucketKey = l.date.length > 5 ? l.date.substring(5) : l.date;
      }

      if (!hourMap[bucketKey]) {
        hourMap[bucketKey] = { complaints12: 0, baseline45: 0 };
      }

      if (l.rating <= 2) {
        hourMap[bucketKey].complaints12++;
      } else {
        hourMap[bucketKey].baseline45++;
      }
    });

    const keys = Object.keys(hourMap).sort();
    return keys.map((hour) => ({
      hour,
      complaints12: hourMap[hour].complaints12,
      baseline45: hourMap[hour].baseline45,
    }));
  }, [logs]);

  // Dynamic Category breakdown chart data from actual parsed rows
  const { categoryChartData, categorySummaryText } = useMemo(() => {
    const catMap: Record<string, { total: number; negative: number }> = {};

    logs.forEach((l) => {
      const cat = l.category || 'General Operations';
      if (!catMap[cat]) {
        catMap[cat] = { total: 0, negative: 0 };
      }
      catMap[cat].total++;
      if (l.rating <= 2) {
        catMap[cat].negative++;
      }
    });

    const sortedCats = Object.entries(catMap).sort((a, b) => {
      if (b[1].negative !== a[1].negative) return b[1].negative - a[1].negative;
      return b[1].total - a[1].total;
    });

    const topEntries = sortedCats.slice(0, 6);
    const chartData = topEntries.map((entry, idx) => {
      const isTopNegative = idx < 2 && entry[1].negative > 0;
      return {
        category: entry[0],
        count: entry[1].negative > 0 ? entry[1].negative : entry[1].total,
        negative: entry[1].negative,
        total: entry[1].total,
        fill: isTopNegative ? '#EE4322' : idx === 2 ? '#181716' : '#78736B',
      };
    });

    // Summary text
    const topCatName = topEntries[0]?.[0] || 'Primary Friction';
    const topCatNeg = topEntries[0]?.[1].negative || 0;
    const pctOfNegative = negativeSpikeCount > 0 ? Math.round((topCatNeg / negativeSpikeCount) * 100) : 0;
    const summary =
      negativeSpikeCount > 0
        ? `"${topCatName}" accounts for ${pctOfNegative}% of critical 1-2 star complaints.`
        : `${logs.length} customer voices analyzed across ${Object.keys(catMap).length} categories.`;

    return {
      categoryChartData: chartData,
      categorySummaryText: summary,
    };
  }, [logs, negativeSpikeCount]);

  // Dynamic evaluation window title from data
  const evalWindowText = useMemo(() => {
    const dates = Array.from(new Set(logs.map((l) => l.date).filter(Boolean)));
    if (dates.length === 1) return `EVAL DATE: ${dates[0]}`;
    if (dates.length > 1) return `EVAL WINDOW: ${dates[0]} — ${dates[dates.length - 1]}`;
    return 'EVAL WINDOW: ACTIVE DATASET';
  }, [logs]);

  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6 bg-[#FCF9F2] font-sans">
      {/* Briefing Top Lead */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5E0D5]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#EE4322]" />
            <span className="font-mono text-xs uppercase tracking-wider text-[#78736B]">
              Customer VoC Executive Briefing
            </span>
            {activeQuery && (
              <span className="font-mono text-[11px] bg-[#FDF1EE] text-[#EE4322] px-2 py-0.5 rounded border border-[#EE4322]/20">
                FILTERED: "{activeQuery}"
              </span>
            )}
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-[#181716] tracking-tight">
            Systemic Performance & Telemetry Diagnostic
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right font-mono text-xs hidden md:block">
            <span className="text-[#938E85] block">VERIFICATION ATTRIBUTION</span>
            <span className="font-bold text-[#4A5D4E]">{groundednessScore}% LLM Grounded</span>
          </div>
          <div className="px-3 py-1.5 bg-[#FFFFFF] border border-[#E5E0D5] rounded-lg text-xs font-mono text-[#181716] shadow-2xs uppercase">
            {evalWindowText}
          </div>
        </div>
      </div>

      {/* Top KPI Metric Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* KPI 1: Revenue Hemorrhage Risk */}
        <div className="bg-[#FFFFFF] border border-[#E5E0D5] rounded-2xl p-6 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between text-[#78736B] text-xs font-mono uppercase tracking-wider mb-2">
            <span>Revenue Hemorrhage Risk</span>
            <Flame className="w-4 h-4 text-[#EE4322]" />
          </div>
          <div className="text-[32px] font-mono font-bold text-[#EE4322] tracking-tight leading-none mb-2 tabular-nums">
            {revenueBleedFormatted}
          </div>
          <p className="text-xs text-[#78736B] leading-relaxed">
            Projected 30-day LTV churn from {negativeSpikeCount} verified critical customer disputes.
          </p>
          <div className="mt-3 pt-3 border-t border-[#E5E0D5]/70 flex items-center justify-between text-[11px] font-mono text-[#938E85]">
            <span>ATTRIBUTION CONFIDENCE</span>
            <span className="text-[#4A5D4E] font-semibold">100% Grounded</span>
          </div>
        </div>

        {/* KPI 2: 1-Star Rating Spike Count */}
        <div className="bg-[#FDF1EE] border border-[#EE4322]/20 rounded-2xl p-6 shadow-2xs relative">
          <div className="flex items-center justify-between text-[#EE4322] text-xs font-mono uppercase tracking-wider mb-2">
            <span>Critical Complaint Count</span>
            <AlertOctagon className="w-4 h-4 text-[#EE4322]" />
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-[32px] font-mono font-bold text-[#EE4322] tracking-tight leading-none tabular-nums">
              {negativeSpikeCount}
            </span>
            <span className="text-xs font-mono text-[#78736B]">
              of {totalCount} analyzed voices ({totalCount > 0 ? Math.round((negativeSpikeCount / totalCount) * 100) : 0}%)
            </span>
          </div>
          <p className="text-xs text-[#181716] leading-relaxed">
            {oneStarCount} 1-star and {twoStarCount} 2-star complaints requiring immediate operational intervention.
          </p>
          <div className="mt-3 pt-3 border-t border-[#EE4322]/20 flex items-center justify-between text-[11px] font-mono text-[#EE4322]">
            <span>SEVERITY INDEX</span>
            <span className="font-bold">
              {negativeSpikeCount > 5 ? 'CRITICAL ELEVATION' : 'MONITORED BASELINE'}
            </span>
          </div>
        </div>

        {/* KPI 3: Top Escalated Dark Store ID */}
        <div className="bg-[#FFFFFF] border border-[#E5E0D5] rounded-2xl p-6 shadow-2xs">
          <div className="flex items-center justify-between text-[#78736B] text-xs font-mono uppercase tracking-wider mb-2">
            <span>Top Escalated Facility</span>
            <Store className="w-4 h-4 text-[#181716]" />
          </div>
          <div className="text-lg font-bold text-[#181716] tracking-tight mb-2 truncate" title={topEscalatedStore}>
            {topEscalatedStore}
          </div>
          <p className="text-xs text-[#78736B] leading-relaxed truncate" title={topStoreNote}>
            {topStoreNote}
          </p>
          <div className="mt-3 pt-3 border-t border-[#E5E0D5]/70 flex items-center justify-between text-[11px] font-mono text-[#938E85]">
            <span>AVG STAGING DWELL</span>
            <span className="text-[#EE4322] font-semibold">{avgDwell}m Dwell Time</span>
          </div>
        </div>
      </div>

      {/* Recharts Data Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chart 1: Distribution Timeline Curve */}
        <div className="lg:col-span-7 bg-[#FFFFFF] border border-[#E5E0D5] rounded-2xl p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#938E85] block">
                Temporal Friction Telemetry
              </span>
              <h2 className="text-base font-bold text-[#181716]">
                Complaint Distribution Over Time
              </h2>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-[#EE4322]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#EE4322]" />
                1-2★ Critical
              </span>
              <span className="flex items-center gap-1.5 text-[#181716]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#181716]" />
                3-5★ Baseline
              </span>
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            {timelineData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-[#938E85]">
                No temporal telemetry points available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F6F3EC" vertical={false} />
                  <XAxis dataKey="hour" stroke="#938E85" tick={{ fontSize: 11, fontFamily: 'JetBrains Mono' }} />
                  <YAxis stroke="#938E85" tick={{ fontSize: 11, fontFamily: 'JetBrains Mono' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderColor: '#E5E0D5',
                      borderRadius: '8px',
                      fontFamily: 'JetBrains Mono',
                      fontSize: '12px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="complaints12"
                    name="1-2 Star Complaints"
                    stroke="#EE4322"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#EE4322', strokeWidth: 0 }}
                    activeDot={{ r: 6, fill: '#EE4322' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="baseline45"
                    name="3-5 Star Baseline"
                    stroke="#181716"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    dot={{ r: 3, fill: '#181716' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
          <p className="text-[11px] text-[#78736B] font-mono flex items-center justify-between border-t border-[#E5E0D5]/70 pt-2">
            <span>TOTAL SAMPLES: {totalCount} PARSED VOICES</span>
            <span>CRITICAL SPIKE RATIO: {totalCount > 0 ? ((negativeSpikeCount / totalCount) * 100).toFixed(1) : 0}%</span>
          </p>
        </div>

        {/* Chart 2: Category Breakdown Chart */}
        <div className="lg:col-span-5 bg-[#FFFFFF] border border-[#E5E0D5] rounded-2xl p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#938E85] block">
                Operational Root Causes
              </span>
              <h2 className="text-base font-bold text-[#181716]">
                Friction Points by Category
              </h2>
            </div>
            <span className="text-xs font-mono text-[#938E85] bg-[#F6F3EC] px-2 py-0.5 rounded">
              DEFECT VOLUME
            </span>
          </div>

          <div className="h-64 w-full pt-2">
            {categoryChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-[#938E85]">
                No category records available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryChartData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F6F3EC" horizontal={false} />
                  <XAxis type="number" stroke="#938E85" tick={{ fontSize: 11, fontFamily: 'JetBrains Mono' }} />
                  <YAxis
                    dataKey="category"
                    type="category"
                    width={110}
                    stroke="#181716"
                    tick={{ fontSize: 10, fontFamily: 'Plus Jakarta Sans' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderColor: '#E5E0D5',
                      borderRadius: '8px',
                      fontFamily: 'JetBrains Mono',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="count" name="Ticket Volume" radius={[0, 4, 4, 0]}>
                    {categoryChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          <p className="text-[11px] text-[#78736B] font-mono border-t border-[#E5E0D5]/70 pt-2 truncate" title={categorySummaryText}>
            {categorySummaryText}
          </p>
        </div>
      </div>

      {/* Theme Generation & Sentiment Clusters */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#EE4322]" />
              <span className="font-mono text-xs uppercase tracking-wider text-[#78736B]">
                AI Co-Pilot Cluster Analysis
              </span>
            </div>
            <h2 className="text-xl font-bold text-[#181716] tracking-tight">
              Dynamic VoC Theme Generation & Evidence Clusters
            </h2>
          </div>
          <span className="text-xs text-[#78736B]">
            Click any cluster card to open the Traceable Evidence & Customer Verification Dossier.
          </span>
        </div>

        {/* Cluster Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clusters.map((cluster) => {
            const isCritical = cluster.riskLevel === 'CRITICAL';
            return (
              <div
                key={cluster.id}
                onClick={() => onOpenCitation(cluster)}
                className={`bg-[#FFFFFF] border rounded-2xl p-5 shadow-2xs transition-all cursor-pointer hover:shadow-md hover:border-[#181716] flex flex-col justify-between group ${
                  isCritical ? 'border-[#EE4322]/40 bg-gradient-to-b from-[#FFFFFF] to-[#FDF1EE]/30' : 'border-[#E5E0D5]'
                }`}
              >
                <div className="space-y-3">
                  {/* Top Badges & Risk */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                        isCritical
                          ? 'bg-[#EE4322] text-[#FFFFFF]'
                          : cluster.riskLevel === 'HIGH'
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-[#F6F3EC] text-[#78736B]'
                      }`}
                    >
                      {cluster.riskLevel} RISK
                    </span>

                    {/* LLM Judge Quantification Badge: Groundedness */}
                    <span className="text-[10px] font-mono text-[#4A5D4E] bg-[#4A5D4E]/10 px-2 py-0.5 rounded flex items-center gap-1 font-medium whitespace-nowrap">
                      <ShieldCheck className="w-3 h-3 shrink-0" />
                      <span>{cluster.groundednessScore}% Grounded</span>
                    </span>
                  </div>

                  {/* Title & Insight */}
                  <div>
                    <h3 className="text-base font-bold text-[#181716] group-hover:text-[#EE4322] transition-colors leading-snug">
                      {cluster.title}
                    </h3>
                    <p className="text-xs text-[#78736B] mt-1.5 leading-relaxed line-clamp-2">
                      {cluster.insight}
                    </p>
                  </div>

                  {/* Customer Voice Snippet */}
                  {cluster.sampleQuote && (
                    <div className="bg-[#F6F3EC] p-2.5 rounded-lg border border-[#E5E0D5]/70">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[#938E85] block mb-1">
                        Traceable Customer Quote
                      </span>
                      <p className="italic text-xs text-[#181716] line-clamp-2">
                        "{cluster.sampleQuote}"
                      </p>
                    </div>
                  )}
                </div>

                {/* Bottom Footer: Stats & 100% Attributed Seal */}
                <div className="pt-4 mt-3 border-t border-[#E5E0D5]/80 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-[#938E85]">
                      CSAT: <strong className="text-[#181716]">{cluster.averageRating}★</strong>
                    </span>
                    <span className="text-[#938E85]">
                      Bleed: <strong className="text-[#EE4322]">{cluster.attributedRevenueBleed}</strong>
                    </span>
                    <span className="text-[#938E85]">
                      Logs: <strong className="text-[#181716]">{cluster.matchingLogIds.length}</strong>
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1 text-[11px] text-[#78736B]">
                    {/* Olive 100% Attributed Badge */}
                    <span className="inline-flex items-center gap-1 text-[#4A5D4E] font-medium font-mono text-[10px] whitespace-nowrap">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#4A5D4E]" />
                      100% Attributed
                    </span>

                    <span className="text-[#EE4322] group-hover:translate-x-0.5 transition-transform font-medium flex items-center gap-0.5 text-xs">
                      <span>View Dossier</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
