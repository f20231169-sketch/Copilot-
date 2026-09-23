/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { UserProfile, DashboardConfig } from '../types';
import {
  User,
  Shield,
  Clock,
  Bookmark,
  Sliders,
  Plus,
  Trash2,
  ArrowRight,
  Check,
  Store,
  Bell,
  Sparkles
} from 'lucide-react';

interface UserProfileViewProps {
  currentUser: UserProfile;
  allUsers: UserProfile[];
  onSwitchUser: (userId: string) => void;
  onUpdateUser: (updatedUser: UserProfile) => void;
  onCreateUser: (newUser: UserProfile) => void;
  onRunSavedPrompt: (promptText: string) => void;
  onRunHistoryQuery: (queryText: string) => void;
}

export const UserProfileView: React.FC<UserProfileViewProps> = ({
  currentUser,
  allUsers,
  onSwitchUser,
  onUpdateUser,
  onCreateUser,
  onRunSavedPrompt,
  onRunHistoryQuery,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'prompts' | 'history' | 'config'>('overview');
  const [newPromptText, setNewPromptText] = useState('');
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileEmail, setNewProfileEmail] = useState('');
  const [newProfileRole, setNewProfileRole] = useState<UserProfile['role']>('Dark Store Ops Lead');
  const [configSavedToast, setConfigSavedToast] = useState(false);

  // Handle adding a custom prompt
  const handleAddPrompt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPromptText.trim()) return;
    const updated = {
      ...currentUser,
      savedPrompts: [newPromptText.trim(), ...currentUser.savedPrompts],
    };
    onUpdateUser(updated);
    setNewPromptText('');
  };

  // Handle deleting a prompt
  const handleDeletePrompt = (index: number) => {
    const updatedPrompts = currentUser.savedPrompts.filter((_, i) => i !== index);
    onUpdateUser({
      ...currentUser,
      savedPrompts: updatedPrompts,
    });
  };

  // Handle updating config
  const handleConfigChange = (key: keyof DashboardConfig, value: any) => {
    const updated: UserProfile = {
      ...currentUser,
      dashboardConfig: {
        ...currentUser.dashboardConfig,
        [key]: value,
      },
    };
    onUpdateUser(updated);
    setConfigSavedToast(true);
    setTimeout(() => setConfigSavedToast(false), 2000);
  };

  // Handle new profile creation
  const handleCreateProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProfileName.trim() || !newProfileEmail.trim()) return;

    const initials = newProfileName
      .split(' ')
      .map((p) => p[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    const newUser: UserProfile = {
      id: `user-${Date.now()}`,
      name: newProfileName.trim(),
      email: newProfileEmail.trim(),
      role: newProfileRole,
      avatarInitials: initials || 'VO',
      savedPrompts: [
        'Analyze Bay 3B dairy & gelato thermal dwell times > 15 mins.',
        'Audit Store #14 evening peak delivery SLA breaches.',
      ],
      analysisHistory: [],
      dashboardConfig: {
        pinnedStore: 'All Dark Stores',
        alertThresholdHours: 19,
        streamSpeed: '1x',
        enableSoundAlerts: true,
        favoriteCategories: ['Dairy', 'Customer Support'],
      },
    };

    onCreateUser(newUser);
    setIsCreatingProfile(false);
    setNewProfileName('');
    setNewProfileEmail('');
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6 bg-[#FCF9F2] font-sans">
      {/* Header & User Switcher */}
      <div className="pb-5 border-b border-[#E5E0D5] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <User className="w-4 h-4 text-[#EE4322]" />
            <span className="font-mono text-xs uppercase tracking-wider text-[#78736B]">
              Authenticated Workspace
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[#181716] tracking-tight">
            User Profile & Dashboard Preferences
          </h1>
        </div>

        {/* Profile Switcher Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-mono text-[#938E85] mr-1">Switch Profile:</span>
          {allUsers.map((user) => {
            const isActive = user.id === currentUser.id;
            return (
              <button
                key={user.id}
                onClick={() => onSwitchUser(user.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-[#181716] text-[#FCF9F2] shadow-xs'
                    : 'bg-[#FFFFFF] text-[#78736B] border border-[#E5E0D5] hover:text-[#181716]'
                }`}
              >
                <span className="w-5 h-5 rounded-full bg-[#EE4322] text-[#FFFFFF] font-mono text-[10px] flex items-center justify-center font-bold">
                  {user.avatarInitials}
                </span>
                <span>{user.name}</span>
              </button>
            );
          })}

          <button
            onClick={() => setIsCreatingProfile(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-[#EE4322] bg-[#FFFFFF] border border-[#EE4322]/30 hover:bg-[#FDF1EE] transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Profile</span>
          </button>
        </div>
      </div>

      {/* Modal for Creating New Profile */}
      {isCreatingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#181716]/40 backdrop-blur-xs">
          <div className="bg-[#FFFFFF] border border-[#E5E0D5] rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E0D5]">
              <h2 className="text-lg font-bold text-[#181716]">Create New Analyst Profile</h2>
              <button
                onClick={() => setIsCreatingProfile(false)}
                className="text-[#938E85] hover:text-[#181716] text-xs font-mono"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateProfileSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-mono text-[11px] text-[#78736B] uppercase block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newProfileName}
                  onChange={(e) => setNewProfileName(e.target.value)}
                  placeholder="e.g. Jordan Hayes"
                  className="w-full bg-[#F6F3EC] border border-[#E5E0D5] rounded-lg p-2.5 text-xs text-[#181716]"
                />
              </div>

              <div>
                <label className="font-mono text-[11px] text-[#78736B] uppercase block mb-1">Work Email</label>
                <input
                  type="email"
                  required
                  value={newProfileEmail}
                  onChange={(e) => setNewProfileEmail(e.target.value)}
                  placeholder="jordan.hayes@quickcommerce.internal"
                  className="w-full bg-[#F6F3EC] border border-[#E5E0D5] rounded-lg p-2.5 text-xs text-[#181716]"
                />
              </div>

              <div>
                <label className="font-mono text-[11px] text-[#78736B] uppercase block mb-1">Operational Role</label>
                <select
                  value={newProfileRole}
                  onChange={(e) => setNewProfileRole(e.target.value as any)}
                  className="w-full bg-[#F6F3EC] border border-[#E5E0D5] rounded-lg p-2.5 text-xs text-[#181716]"
                >
                  <option value="Dark Store Ops Lead">Dark Store Ops Lead</option>
                  <option value="VP of Customer Experience">VP of Customer Experience</option>
                  <option value="Logistics Director">Logistics Director</option>
                  <option value="Product Quality Analyst">Product Quality Analyst</option>
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#E5E0D5]">
                <button
                  type="button"
                  onClick={() => setIsCreatingProfile(false)}
                  className="px-3 py-2 rounded-lg text-xs font-medium text-[#78736B] hover:bg-[#F6F3EC]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#EE4322] text-[#FFFFFF] hover:bg-[#d83819]"
                >
                  Create & Activate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Profile Overview Card */}
      <div className="bg-[#FFFFFF] border border-[#E5E0D5] rounded-xl p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#181716] text-[#FCF9F2] flex items-center justify-center font-mono font-bold text-xl shadow-xs">
            {currentUser.avatarInitials}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-[#181716]">{currentUser.name}</h2>
              <span className="text-[10px] font-mono bg-[#4A5D4E]/10 text-[#4A5D4E] px-2 py-0.5 rounded font-medium">
                ACTIVE
              </span>
            </div>
            <p className="text-xs text-[#78736B] mt-0.5">{currentUser.email}</p>
            <div className="flex items-center gap-2 mt-1.5 text-xs font-mono text-[#938E85]">
              <Shield className="w-3.5 h-3.5 text-[#EE4322]" />
              <span className="text-[#181716] font-medium">{currentUser.role}</span>
              <span>·</span>
              <span>Pinned Hub: {currentUser.dashboardConfig.pinnedStore}</span>
            </div>
          </div>
        </div>

        {/* Sub-nav Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-[#F6F3EC] rounded-lg border border-[#E5E0D5] self-start sm:self-auto">
          <button
            onClick={() => setActiveSubTab('overview')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeSubTab === 'overview' ? 'bg-[#FFFFFF] text-[#181716] shadow-xs' : 'text-[#78736B] hover:text-[#181716]'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveSubTab('prompts')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeSubTab === 'prompts' ? 'bg-[#FFFFFF] text-[#181716] shadow-xs' : 'text-[#78736B] hover:text-[#181716]'
            }`}
          >
            Saved Prompts ({currentUser.savedPrompts.length})
          </button>
          <button
            onClick={() => setActiveSubTab('history')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeSubTab === 'history' ? 'bg-[#FFFFFF] text-[#181716] shadow-xs' : 'text-[#78736B] hover:text-[#181716]'
            }`}
          >
            History ({currentUser.analysisHistory.length})
          </button>
          <button
            onClick={() => setActiveSubTab('config')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeSubTab === 'config' ? 'bg-[#FFFFFF] text-[#181716] shadow-xs' : 'text-[#78736B] hover:text-[#181716]'
            }`}
          >
            Dashboard Config
          </button>
        </div>
      </div>

      {configSavedToast && (
        <div className="p-3 bg-[#4A5D4E]/10 border border-[#4A5D4E]/30 rounded-lg text-xs font-mono text-[#4A5D4E] flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>Dashboard configuration updated and persisted to your profile.</span>
        </div>
      )}

      {/* Tab 1: Overview */}
      {activeSubTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Saved Prompts Summary */}
          <div className="bg-[#FFFFFF] border border-[#E5E0D5] rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-[#EE4322]" />
                <h3 className="font-semibold text-sm text-[#181716]">My Quick Analysis Prompts</h3>
              </div>
              <button
                onClick={() => setActiveSubTab('prompts')}
                className="text-xs text-[#EE4322] font-medium hover:underline"
              >
                Manage All
              </button>
            </div>

            <div className="space-y-2">
              {currentUser.savedPrompts.slice(0, 3).map((prompt, idx) => (
                <div
                  key={idx}
                  onClick={() => onRunSavedPrompt(prompt)}
                  className="p-3 rounded-lg bg-[#F6F3EC] border border-[#E5E0D5] hover:border-[#181716] hover:bg-[#FFFFFF] cursor-pointer transition-all flex items-center justify-between group"
                >
                  <span className="text-xs text-[#181716] font-medium truncate pr-2">"{prompt}"</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#EE4322] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </div>
              ))}
            </div>
          </div>

          {/* Recent History Summary */}
          <div className="bg-[#FFFFFF] border border-[#E5E0D5] rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#181716]" />
                <h3 className="font-semibold text-sm text-[#181716]">Recent Investigation Dossiers</h3>
              </div>
              <button
                onClick={() => setActiveSubTab('history')}
                className="text-xs text-[#EE4322] font-medium hover:underline"
              >
                View History
              </button>
            </div>

            {currentUser.analysisHistory.length === 0 ? (
              <p className="text-xs text-[#78736B]">No recent analysis queries saved yet.</p>
            ) : (
              <div className="space-y-2">
                {currentUser.analysisHistory.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    onClick={() => onRunHistoryQuery(item.query)}
                    className="p-3 rounded-lg bg-[#F6F3EC] border border-[#E5E0D5] hover:border-[#181716] cursor-pointer transition-all space-y-1"
                  >
                    <div className="flex items-center justify-between text-[11px] font-mono text-[#938E85]">
                      <span>{item.timestamp}</span>
                      <span className="text-[#EE4322] font-semibold">{item.matchedCount} voices · {item.csatSnapshot}★</span>
                    </div>
                    <p className="text-xs text-[#181716] font-medium line-clamp-1">"{item.query}"</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Custom Saved Prompts Manager */}
      {activeSubTab === 'prompts' && (
        <div className="bg-[#FFFFFF] border border-[#E5E0D5] rounded-xl p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#E5E0D5]">
            <div>
              <h3 className="text-base font-bold text-[#181716]">Custom Saved Prompts Library</h3>
              <p className="text-xs text-[#78736B] mt-0.5">
                Save your standard weekly triage prompts for 1-click execution across ingested dark store logs.
              </p>
            </div>
          </div>

          {/* Add Prompt Form */}
          <form onSubmit={handleAddPrompt} className="flex gap-2">
            <input
              type="text"
              value={newPromptText}
              onChange={(e) => setNewPromptText(e.target.value)}
              placeholder="e.g. 'Audit Store #22 wet paper bag bottom tears and heavy 2L bottle stacking.'"
              className="flex-1 bg-[#F6F3EC] border border-[#E5E0D5] rounded-lg px-3 py-2 text-xs text-[#181716] placeholder:text-[#938E85]"
            />
            <button
              type="submit"
              disabled={!newPromptText.trim()}
              className="px-4 py-2 bg-[#EE4322] hover:bg-[#d83819] disabled:opacity-50 text-[#FFFFFF] rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Save Prompt</span>
            </button>
          </form>

          {/* Prompts List */}
          <div className="space-y-2 pt-2">
            {currentUser.savedPrompts.map((prompt, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg bg-[#F6F3EC] border border-[#E5E0D5] flex items-center justify-between gap-3 hover:bg-[#FFFFFF] transition-colors"
              >
                <span className="text-xs text-[#181716] font-medium">"{prompt}"</span>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => onRunSavedPrompt(prompt)}
                    className="px-3 py-1 bg-[#181716] text-[#FCF9F2] hover:bg-[#2c2a28] rounded-md text-xs font-medium transition-colors"
                  >
                    Run in Co-Pilot
                  </button>
                  <button
                    onClick={() => handleDeletePrompt(idx)}
                    className="p-1.5 text-[#938E85] hover:text-[#EE4322] rounded hover:bg-[#FDF1EE] transition-colors"
                    title="Delete prompt"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Analysis History */}
      {activeSubTab === 'history' && (
        <div className="bg-[#FFFFFF] border border-[#E5E0D5] rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E5E0D5]">
            <h3 className="text-base font-bold text-[#181716]">Historical Analysis Investigations</h3>
            <span className="text-xs font-mono text-[#938E85]">{currentUser.analysisHistory.length} saved sessions</span>
          </div>

          {currentUser.analysisHistory.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#78736B]">
              No past inquiries recorded. Inquiries sent via Ingress Chat will automatically appear here.
            </div>
          ) : (
            <div className="space-y-3">
              {currentUser.analysisHistory.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-lg bg-[#F6F3EC] border border-[#E5E0D5] flex items-center justify-between gap-4 hover:border-[#181716] transition-all"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-[11px] font-mono text-[#938E85]">
                      <span>{item.timestamp}</span>
                      <span>·</span>
                      <span className="text-[#181716] font-semibold">{item.topStore}</span>
                      <span>·</span>
                      <span className="text-[#EE4322]">{item.csatSnapshot}★ CSAT</span>
                    </div>
                    <p className="text-xs font-medium text-[#181716]">"{item.query}"</p>
                  </div>

                  <button
                    onClick={() => onRunHistoryQuery(item.query)}
                    className="px-3 py-1.5 bg-[#181716] text-[#FCF9F2] hover:bg-[#2c2a28] rounded-lg text-xs font-medium shrink-0"
                  >
                    Re-Analyze
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Dashboard Configuration */}
      {activeSubTab === 'config' && (
        <div className="bg-[#FFFFFF] border border-[#E5E0D5] rounded-xl p-6 space-y-6">
          <div className="pb-3 border-b border-[#E5E0D5]">
            <h3 className="text-base font-bold text-[#181716]">Custom Dashboard Configurations</h3>
            <p className="text-xs text-[#78736B] mt-0.5">
              Personalize thresholds, default streaming ingestion, and preferred dark store facilities.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* Pinned Store */}
            <div className="space-y-1.5">
              <label className="font-mono text-[11px] uppercase text-[#78736B] block">
                Default Pinned Dark Store
              </label>
              <select
                value={currentUser.dashboardConfig.pinnedStore}
                onChange={(e) => handleConfigChange('pinnedStore', e.target.value)}
                className="w-full bg-[#F6F3EC] border border-[#E5E0D5] rounded-lg p-2.5 text-xs text-[#181716]"
              >
                <option value="All Dark Stores">All Dark Stores (Omni-Channel)</option>
                <option value="Store #14 - South Bay">Store #14 - South Bay</option>
                <option value="Store #08 - Downtown North">Store #08 - Downtown North</option>
                <option value="Store #22 - East River">Store #22 - East River</option>
                <option value="Store #03 - West End">Store #03 - West End</option>
                <option value="Store #19 - Midtown Hub">Store #19 - Midtown Hub</option>
              </select>
            </div>

            {/* Ingestion Stream Speed */}
            <div className="space-y-1.5">
              <label className="font-mono text-[11px] uppercase text-[#78736B] block">
                Live Data Ingestion Pipeline Speed
              </label>
              <select
                value={currentUser.dashboardConfig.streamSpeed}
                onChange={(e) => handleConfigChange('streamSpeed', e.target.value as any)}
                className="w-full bg-[#F6F3EC] border border-[#E5E0D5] rounded-lg p-2.5 text-xs text-[#181716]"
              >
                <option value="1x">Standard 1x (Live Voice Stream ~10s)</option>
                <option value="5x">Accelerated 5x (Stress Surge Testing ~2s)</option>
                <option value="paused">Paused (Static Snapshot Mode)</option>
              </select>
            </div>

            {/* Sound & Notification Alerts */}
            <div className="space-y-1.5">
              <label className="font-mono text-[11px] uppercase text-[#78736B] block">
                Kinetic Anomaly Audio Pings
              </label>
              <div className="flex items-center justify-between p-2.5 bg-[#F6F3EC] border border-[#E5E0D5] rounded-lg">
                <span className="text-xs text-[#181716]">Visual & Sound Alerts for 1★ Critical Anomalies</span>
                <input
                  type="checkbox"
                  checked={currentUser.dashboardConfig.enableSoundAlerts}
                  onChange={(e) => handleConfigChange('enableSoundAlerts', e.target.checked)}
                  className="w-4 h-4 text-[#EE4322] rounded border-[#E5E0D5] focus:ring-[#EE4322]"
                />
              </div>
            </div>

            {/* Alert Threshold */}
            <div className="space-y-1.5">
              <label className="font-mono text-[11px] uppercase text-[#78736B] block">
                Peak Hour Window Focus (Hours)
              </label>
              <select
                value={currentUser.dashboardConfig.alertThresholdHours}
                onChange={(e) => handleConfigChange('alertThresholdHours', Number(e.target.value))}
                className="w-full bg-[#F6F3EC] border border-[#E5E0D5] rounded-lg p-2.5 text-xs text-[#181716]"
              >
                <option value={18}>18:00 - 23:00 (Evening Dinner Surge Peak)</option>
                <option value={12}>12:00 - 15:00 (Lunch Rush)</option>
                <option value={8}>08:00 - 11:00 (Morning Fresh & Dairy Rush)</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
