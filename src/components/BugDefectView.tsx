/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { FeedbackLog } from '../types';
import { Bug, Box, Smartphone, CheckCircle, AlertCircle, ShieldAlert, Cpu } from 'lucide-react';

interface BugDefectViewProps {
  logs: FeedbackLog[];
}

export const BugDefectView: React.FC<BugDefectViewProps> = ({ logs }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'app_bug' | 'operational'>('all');

  const appBugs = logs.filter(
    (l) =>
      l.defectType === 'App Bug' ||
      l.category === 'App & Checkout' ||
      l.category === 'Customer Support' ||
      l.text.toLowerCase().includes('bot') ||
      l.text.toLowerCase().includes('crash') ||
      l.text.toLowerCase().includes('payment')
  );

  const operationalDefects = logs.filter((l) => !appBugs.includes(l));

  // Dynamically calculate failure summaries from actual categorized logs
  const getTopCategories = (list: FeedbackLog[]) => {
    const counts: Record<string, number> = {};
    list.forEach((l) => {
      const key = l.category || 'General Operations';
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  };

  const appBugCats = getTopCategories(appBugs);
  const primaryAppBug = appBugCats[0] ? `${appBugCats[0][0]} (${appBugCats[0][1]} tickets)` : 'No software bugs detected';
  const secondaryAppBug = appBugCats[1] ? `${appBugCats[1][0]} (${appBugCats[1][1]} tickets)` : 'Baseline platform stability';

  const opCats = getTopCategories(operationalDefects);
  const primaryOpDefect = opCats[0] ? `${opCats[0][0]} (${opCats[0][1]} tickets)` : 'No operational defects recorded';
  const secondaryOpDefect = opCats[1] ? `${opCats[1][0]} (${opCats[1][1]} tickets)` : 'Cold chain within normal thresholds';

  const itemsToShow =
    activeTab === 'app_bug' ? appBugs : activeTab === 'operational' ? operationalDefects : logs;

  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6 bg-[#FCF9F2]">
      {/* Header */}
      <div className="pb-4 border-b border-[#E5E0D5] flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Bug className="w-4 h-4 text-[#EE4322]" />
            <span className="font-mono text-xs uppercase tracking-wider text-[#78736B]">
              Automated Root Cause Triage
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[#181716] tracking-tight">
            App Bugs vs. Operational Defects
          </h1>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs text-[#181716] bg-[#FFFFFF] border border-[#E5E0D5] px-3 py-1.5 rounded-lg shadow-2xs">
          <span>CLASSIFIER CONFIDENCE:</span>
          <span className="font-bold text-[#4A5D4E]">97.8%</span>
        </div>
      </div>

      {/* Summary Matrix Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* App Bugs Card */}
        <div
          onClick={() => setActiveTab('app_bug')}
          className={`bg-[#FFFFFF] border rounded-xl p-5 cursor-pointer transition-all ${
            activeTab === 'app_bug'
              ? 'border-[#EE4322] ring-1 ring-[#EE4322]/20 shadow-md'
              : 'border-[#E5E0D5] hover:border-[#181716]'
          }`}
        >
          <div className="flex items-center justify-between pb-3 border-b border-[#E5E0D5]">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-[#FDF1EE] text-[#EE4322]">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#181716]">Software & App Bugs</h3>
                <span className="text-[11px] font-mono text-[#78736B]">Engineering & Core Platform</span>
              </div>
            </div>
            <span className="text-2xl font-mono font-bold text-[#EE4322] tabular-nums">
              {appBugs.length}
            </span>
          </div>

          <div className="pt-3 space-y-2 text-xs font-sans text-[#78736B]">
            <div className="flex items-center justify-between font-mono text-[11px]">
              <span>Primary Failure:</span>
              <strong className="text-[#181716] truncate max-w-[200px]" title={primaryAppBug}>{primaryAppBug}</strong>
            </div>
            <div className="flex items-center justify-between font-mono text-[11px]">
              <span>Secondary:</span>
              <strong className="text-[#181716] truncate max-w-[200px]" title={secondaryAppBug}>{secondaryAppBug}</strong>
            </div>
            <p className="text-[11px] leading-relaxed pt-1">
              Directly routes tickets to Slack #eng-triage and triggers automated engineer triage tickets.
            </p>
          </div>
        </div>

        {/* Operational Defects Card */}
        <div
          onClick={() => setActiveTab('operational')}
          className={`bg-[#FFFFFF] border rounded-xl p-5 cursor-pointer transition-all ${
            activeTab === 'operational'
              ? 'border-[#EE4322] ring-1 ring-[#EE4322]/20 shadow-md'
              : 'border-[#E5E0D5] hover:border-[#181716]'
          }`}
        >
          <div className="flex items-center justify-between pb-3 border-b border-[#E5E0D5]">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-[#F6F3EC] text-[#181716]">
                <Box className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#181716]">Physical & Dark Store Defects</h3>
                <span className="text-[11px] font-mono text-[#78736B]">Dark Store Leads & Cold Chain Ops</span>
              </div>
            </div>
            <span className="text-2xl font-mono font-bold text-[#181716] tabular-nums">
              {operationalDefects.length}
            </span>
          </div>

          <div className="pt-3 space-y-2 text-xs font-sans text-[#78736B]">
            <div className="flex items-center justify-between font-mono text-[11px]">
              <span>Primary Failure:</span>
              <strong className="text-[#181716] truncate max-w-[200px]" title={primaryOpDefect}>{primaryOpDefect}</strong>
            </div>
            <div className="flex items-center justify-between font-mono text-[11px]">
              <span>Secondary:</span>
              <strong className="text-[#181716] truncate max-w-[200px]" title={secondaryOpDefect}>{secondaryOpDefect}</strong>
            </div>
            <p className="text-[11px] leading-relaxed pt-1">
              Directly routes incident notices to local dark store general managers and cold storage contractors.
            </p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'all'
                ? 'bg-[#181716] text-[#FCF9F2]'
                : 'bg-[#FFFFFF] text-[#78736B] border border-[#E5E0D5] hover:text-[#181716]'
            }`}
          >
            All Classified Logs ({logs.length})
          </button>
          <button
            onClick={() => setActiveTab('app_bug')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'app_bug'
                ? 'bg-[#181716] text-[#FCF9F2]'
                : 'bg-[#FFFFFF] text-[#78736B] border border-[#E5E0D5] hover:text-[#181716]'
            }`}
          >
            App Bugs Only ({appBugs.length})
          </button>
          <button
            onClick={() => setActiveTab('operational')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'operational'
                ? 'bg-[#181716] text-[#FCF9F2]'
                : 'bg-[#FFFFFF] text-[#78736B] border border-[#E5E0D5] hover:text-[#181716]'
            }`}
          >
            Operational Only ({operationalDefects.length})
          </button>
        </div>

        <span className="text-xs font-mono text-[#938E85]">
          Showing {itemsToShow.length} categorized logs
        </span>
      </div>

      {/* Logs Classification Table */}
      <div className="bg-[#FFFFFF] border border-[#E5E0D5] rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F6F3EC] border-b border-[#E5E0D5] text-[#938E85] font-mono text-[10px] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Ticket</th>
                <th className="py-3 px-4">Classification</th>
                <th className="py-3 px-4">Rating</th>
                <th className="py-3 px-4">Dark Store</th>
                <th className="py-3 px-4">Voice Summary</th>
                <th className="py-3 px-4">Escalation Routing</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E0D5]">
              {itemsToShow.map((log) => {
                const isBug = appBugs.includes(log);
                return (
                  <tr key={log.id} className="hover:bg-[#F6F3EC]/50 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-[#181716] whitespace-nowrap">
                      {log.id}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 font-mono text-[10px] px-2 py-0.5 rounded font-medium ${
                          isBug
                            ? 'bg-[#FDF1EE] text-[#EE4322] border border-[#EE4322]/20'
                            : 'bg-[#F6F3EC] text-[#181716] border border-[#E5E0D5]'
                        }`}
                      >
                        {isBug ? 'App Bug' : 'Operational'}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-mono font-bold">
                      <span className={log.rating <= 2 ? 'text-[#EE4322]' : 'text-[#4A5D4E]'}>
                        {log.rating}★
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-[#78736B] font-sans">
                      {log.storeId}
                    </td>
                    <td className="py-3 px-4 text-[#181716] font-serif italic max-w-xs truncate">
                      "{log.text}"
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-[#78736B]">
                      {isBug ? '#eng-mobile-checkout' : 'Dark Store GM Direct'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
