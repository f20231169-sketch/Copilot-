/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  ShieldCheck,
  Activity,
  Play,
  Pause,
  Zap,
  AlertTriangle,
  Sparkles,
  X,
} from 'lucide-react';
import { RealtimeAnomalyAlert } from '../types';

interface HeaderTelemetryProps {
  totalVoices: number;
  ingestionRate?: string;
  csatAverage: number;
  dedupEfficiency: number;
  activeQuery?: string;
  onClearQuery?: () => void;
  onNavigateToIngress: () => void;
  // Real-time stream props
  isStreaming: boolean;
  onToggleStreaming: () => void;
  streamSpeed: '1x' | '5x';
  onToggleSpeed: () => void;
  onTriggerSpike: () => void;
  activeAnomalyAlert: RealtimeAnomalyAlert | null;
  onDismissAnomaly?: () => void;
  onSelectAnomalyTicket?: (ticketId: string) => void;
}

export const HeaderTelemetry: React.FC<HeaderTelemetryProps> = ({
  totalVoices,
  ingestionRate = '1,420 msgs/hr',
  csatAverage,
  dedupEfficiency,
  activeQuery,
  onClearQuery,
  onNavigateToIngress,
  isStreaming,
  onToggleStreaming,
  streamSpeed,
  onToggleSpeed,
  onTriggerSpike,
  activeAnomalyAlert,
  onDismissAnomaly,
  onSelectAnomalyTicket,
}) => {
  return (
    <header className="h-16 bg-[#FFFFFF] border-b border-[#E5E0D5] px-5 lg:px-6 flex items-center justify-between sticky top-0 z-30 font-sans shadow-2xs">
      {/* 4-Card Unified Telemetry Metric Strip */}
      <div className="flex items-center gap-4 lg:gap-6 divide-x divide-[#E5E0D5] text-xs">
        {/* Metric 1: Total Voices Ingested */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center justify-center">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isStreaming ? 'bg-[#EE4322]' : 'bg-[#938E85]'
              }`}
            />
            {isStreaming && (
              <span className="absolute w-4 h-4 rounded-full bg-[#EE4322]/25 animate-ping" />
            )}
          </div>
          <div>
            <span className="font-mono text-[#938E85] text-[10px] uppercase tracking-wider block leading-none mb-1">
              Live Ingested
            </span>
            <span className="font-mono font-bold text-[#181716] tracking-tight tabular-nums text-sm">
              {totalVoices.toLocaleString()} VOICES
            </span>
          </div>
        </div>

        {/* Metric 2: Ingestion Rate */}
        <div className="pl-4 lg:pl-6 hidden sm:block">
          <span className="font-mono text-[#938E85] text-[10px] uppercase tracking-wider block leading-none mb-1">
            Stream Throughput
          </span>
          <span className="font-mono font-semibold text-[#181716] tabular-nums text-sm">
            {ingestionRate}
          </span>
        </div>

        {/* Metric 3: Live CSAT Average */}
        <div className="pl-4 lg:pl-6">
          <span className="font-mono text-[#938E85] text-[10px] uppercase tracking-wider block leading-none mb-1">
            Live CSAT
          </span>
          <div className="flex items-center gap-1.5">
            <span
              className={`font-mono font-bold tabular-nums text-sm ${
                csatAverage <= 2.5 ? 'text-[#EE4322]' : 'text-[#181716]'
              }`}
            >
              {csatAverage.toFixed(1)}
              <span className="text-[#938E85] text-xs font-normal"> / 5.0</span>
            </span>
            <span className="hidden md:inline-flex text-amber-500 text-xs">
              {'★'.repeat(Math.min(5, Math.max(1, Math.round(csatAverage))))}
            </span>
          </div>
        </div>

        {/* Metric 4: Deduplication Efficiency */}
        <div className="pl-4 lg:pl-6 hidden md:block">
          <span className="font-mono text-[#938E85] text-[10px] uppercase tracking-wider block leading-none mb-1">
            Dedup Efficiency
          </span>
          <span className="font-mono font-bold text-[#EE4322] tabular-nums text-sm">
            {dedupEfficiency}% Deduped
          </span>
        </div>
      </div>

      {/* Center/Right Controls: Real-Time Pipeline Stream Controls & Anomaly Alert */}
      <div className="flex items-center gap-2.5 lg:gap-3">
        {/* Real-time Anomaly Alert Pill (Kinetic Accent #EE4322) */}
        {activeAnomalyAlert && (
          <div className="flex items-center gap-2 bg-[#FDF1EE] border border-[#EE4322]/30 px-2.5 py-1 rounded-lg text-xs animate-in fade-in slide-in-from-top-1 duration-200">
            <span className="w-2 h-2 rounded-full bg-[#EE4322] animate-pulse shrink-0" />
            <span className="font-mono text-[11px] font-bold text-[#EE4322] hidden xl:inline">
              ANOMALY:
            </span>
            <button
              onClick={() => onSelectAnomalyTicket?.(activeAnomalyAlert.relatedTicketId)}
              className="font-medium text-[#181716] hover:text-[#EE4322] max-w-[150px] lg:max-w-[220px] truncate text-left text-xs"
              title={`${activeAnomalyAlert.title} - ${activeAnomalyAlert.storeId}: ${activeAnomalyAlert.summary}`}
            >
              {activeAnomalyAlert.title}
            </button>
            {onDismissAnomaly && (
              <button
                onClick={onDismissAnomaly}
                className="text-[#938E85] hover:text-[#EE4322] p-0.5"
                title="Dismiss alert banner"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        )}

        {/* Real-time Stream Control Buttons */}
        <div className="flex items-center gap-1 bg-[#F6F3EC] p-1 rounded-lg border border-[#E5E0D5]">
          {/* Pause / Resume Live Ingestion */}
          <button
            onClick={onToggleStreaming}
            className={`p-1.5 rounded-md transition-colors ${
              isStreaming
                ? 'bg-[#FFFFFF] text-[#EE4322] shadow-2xs font-semibold'
                : 'text-[#78736B] hover:text-[#181716]'
            }`}
            title={isStreaming ? 'Pause live ingestion pipeline' : 'Resume live ingestion pipeline'}
          >
            {isStreaming ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>

          {/* Stream Speed Toggle (1x / 5x) */}
          <button
            onClick={onToggleSpeed}
            className="px-2 py-1 rounded-md text-[11px] font-mono font-semibold text-[#181716] hover:bg-[#FFFFFF] transition-colors"
            title="Toggle ingestion pipeline stream speed"
          >
            {streamSpeed}
          </button>

          {/* Simulate Anomaly Burst Spike */}
          <button
            onClick={onTriggerSpike}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-mono text-[#EE4322] hover:bg-[#FDF1EE] transition-colors"
            title="Simulate dinner rush / dark store anomaly surge"
          >
            <Zap className="w-3 h-3" />
            <span className="hidden sm:inline">Spike</span>
          </button>
        </div>

        {/* Active Query Tag */}
        {activeQuery && (
          <div className="hidden 2xl:flex items-center gap-1.5 bg-[#F6F3EC] border border-[#E5E0D5] rounded-md px-2 py-1 text-xs text-[#78736B]">
            <span className="font-mono text-[10px] text-[#938E85]">FILTER:</span>
            <span className="font-medium text-[#181716] max-w-[100px] truncate">"{activeQuery}"</span>
            {onClearQuery && (
              <button onClick={onClearQuery} className="text-[#938E85] hover:text-[#EE4322]">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        )}

        {/* 100% Attribution Seal */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-[#4A5D4E]/10 border border-[#4A5D4E]/20 rounded-md text-[#4A5D4E] text-xs font-medium">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span className="font-mono text-[11px]">100% Attributed</span>
        </div>

        {/* Co-Pilot Ingress CTA */}
        <button
          onClick={onNavigateToIngress}
          className="flex items-center gap-1.5 text-xs font-semibold bg-[#181716] text-[#FCF9F2] hover:bg-[#2c2a28] px-3 py-2 rounded-lg transition-colors shadow-2xs"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#EE4322]" />
          <span className="hidden sm:inline">Co-Pilot Chat</span>
        </button>
      </div>
    </header>
  );
};
