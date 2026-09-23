/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ViewTab, UserProfile } from '../types';
import {
  MessageSquareText,
  TrendingDown,
  Layers,
  Bug,
  FileCheck2,
  ChevronRight,
  UserCheck
} from 'lucide-react';

interface SidebarProps {
  currentTab: ViewTab;
  onSelectTab: (tab: ViewTab) => void;
  currentUser: UserProfile;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  currentUser,
}) => {
  const navItems: { id: ViewTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'ingress', label: 'Executive Ingress', icon: MessageSquareText },
    { id: 'dashboard', label: 'Executive Briefing', icon: TrendingDown },
    { id: 'trends', label: 'Trend & SLA Analysis', icon: TrendingDown },
    { id: 'dedup', label: 'Deduplication Engine', icon: Layers },
    { id: 'defects', label: 'Bug & Defect Tags', icon: Bug },
    { id: 'audit', label: 'Audit Dossier & Telemetry', icon: FileCheck2 },
  ];

  return (
    <aside className="w-60 shrink-0 bg-[#F6F3EC] border-r border-[#E5E0D5] flex flex-col justify-between select-none h-screen sticky top-0 font-sans">
      {/* Brand Header */}
      <div>
        <div className="p-4 border-b border-[#E5E0D5] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="relative flex items-center justify-center">
              <span className="w-2.5 h-2.5 rounded-full bg-[#EE4322] inline-block" />
              <span className="absolute w-4 h-4 rounded-full bg-[#EE4322]/20 animate-ping" />
            </div>
            <div>
              <span className="font-bold text-base text-[#181716] tracking-tight block leading-tight">
                Tether VoC
              </span>
              <span className="text-[11px] text-[#78736B] tracking-normal">Feedback Co-Pilot</span>
            </div>
          </div>
          <span className="text-[10px] font-mono bg-[#E5E0D5]/70 text-[#78736B] px-1.5 py-0.5 rounded font-medium">
            LIVE
          </span>
        </div>

        {/* Section Navigation Links Only */}
        <nav className="p-3 space-y-1">
          <div className="px-3 py-2 text-[10px] font-mono uppercase tracking-wider text-[#938E85]">
            Intelligence Views
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all text-left ${
                  isActive
                    ? 'bg-[#FFFFFF] text-[#181716] shadow-xs border border-[#E5E0D5] font-semibold'
                    : 'text-[#78736B] hover:text-[#181716] hover:bg-[#FFFFFF]/60'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? 'text-[#EE4322]' : 'text-[#938E85]'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-[#EE4322] shrink-0" />}
              </button>
            );
          })}
        </nav>
      </div>

      {/* User Profile & Config Link in Bottom of Sidebar (No duplicate status card) */}
      <div className="p-3 border-t border-[#E5E0D5] bg-[#F6F3EC]">
        <button
          onClick={() => onSelectTab('profile')}
          className={`w-full flex items-center justify-between p-2.5 rounded-lg transition-all text-left ${
            currentTab === 'profile'
              ? 'bg-[#FFFFFF] border border-[#EE4322]/40 shadow-xs'
              : 'hover:bg-[#FFFFFF] border border-transparent hover:border-[#E5E0D5]'
          }`}
          title="Manage user profile, saved prompts & configurations"
        >
          <div className="flex items-center gap-2.5 truncate">
            <div className="w-7 h-7 rounded-full bg-[#181716] text-[#FCF9F2] flex items-center justify-center font-mono font-bold text-xs shrink-0">
              {currentUser.avatarInitials}
            </div>
            <div className="truncate">
              <span className="text-xs font-semibold text-[#181716] block truncate">
                {currentUser.name}
              </span>
              <span className="text-[10px] text-[#78736B] block truncate">
                {currentUser.role}
              </span>
            </div>
          </div>
          <UserCheck className="w-3.5 h-3.5 text-[#4A5D4E] shrink-0" />
        </button>
      </div>
    </aside>
  );
};
