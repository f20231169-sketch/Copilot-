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
  Cloud,
  LogOut,
  User as UserIcon,
  Loader2,
} from 'lucide-react';
import { User } from 'firebase/auth';
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
  // Firebase Auth & Cloud props
  authUser: User | null;
  onSignInGoogle: () => void;
  onSignOut: () => void;
  isSigningIn: boolean;
  onOpenCloudAudits: () => void;
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
  authUser,
  onSignInGoogle,
  onSignOut,
  isSigningIn,
  onOpenCloudAudits,
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
        <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 bg-[#4A5D4E]/10 border border-[#4A5D4E]/20 rounded-md text-[#4A5D4E] text-xs font-medium">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span className="font-mono text-[11px]">100% Attributed</span>
        </div>

        {/* Cloud Audits (Firestore) Button */}
        <button
          onClick={onOpenCloudAudits}
          className="flex items-center gap-1.5 text-xs font-semibold bg-[#F6F3EC] hover:bg-[#E5E0D5]/70 text-[#181716] border border-[#E5E0D5] px-2.5 py-1.5 rounded-lg transition-colors shadow-2xs"
          title="Open Firestore Cloud Audits"
        >
          <Cloud className="w-3.5 h-3.5 text-[#EE4322]" />
          <span className="hidden md:inline">Cloud Audits</span>
        </button>

        {/* Google Sign-in with Firebase Auth */}
        {authUser ? (
          <div className="flex items-center gap-2 pl-1 border-l border-[#E5E0D5]">
            <div className="flex items-center gap-1.5">
              {authUser.photoURL ? (
                <img
                  src={authUser.photoURL}
                  alt={authUser.displayName || 'User'}
                  className="w-7 h-7 rounded-full border border-[#E5E0D5] object-cover"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-[#181716] text-[#FCF9F2] text-xs flex items-center justify-center font-bold">
                  {authUser.displayName ? authUser.displayName.charAt(0) : 'U'}
                </div>
              )}
              <div className="hidden 2xl:block text-left">
                <span className="text-xs font-bold text-[#181716] block leading-tight truncate max-w-[110px]">
                  {authUser.displayName || 'Operator'}
                </span>
                <span className="text-[10px] text-[#78736B] block leading-none truncate max-w-[110px]">
                  {authUser.email}
                </span>
              </div>
            </div>
            <button
              onClick={onSignOut}
              className="p-1.5 rounded-lg text-[#78736B] hover:text-[#EE4322] hover:bg-[#FDF1EE] transition-colors"
              title="Sign out of Firebase Auth"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={onSignInGoogle}
            disabled={isSigningIn}
            className="flex items-center gap-1.5 text-xs font-semibold bg-[#FFFFFF] hover:bg-[#F6F3EC] text-[#181716] border border-[#E5E0D5] px-3 py-1.5 rounded-lg transition-colors shadow-2xs shrink-0"
            title="Sign in with Google using Firebase Auth"
          >
            {isSigningIn ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#EE4322]" />
            ) : (
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span className="hidden sm:inline">Google Sign-in</span>
          </button>
        )}

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
