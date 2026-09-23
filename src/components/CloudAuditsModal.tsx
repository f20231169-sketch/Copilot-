/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Cloud,
  Save,
  Clock,
  Database,
  Building2,
  CheckCircle2,
  Loader2,
  Sparkles,
  ArrowRight,
  Trash2,
} from 'lucide-react';
import { StoredSavedAudit, saveAuditToFirestore, fetchSavedAudits } from '../services/firebase';

interface CloudAuditsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
  datasetName: string;
  totalVoices: number;
  csatAverage: number;
  topClusterTitle: string;
  topStore: string;
  onLoadAudit: (audit: StoredSavedAudit) => void;
}

export const CloudAuditsModal: React.FC<CloudAuditsModalProps> = ({
  isOpen,
  onClose,
  userId,
  datasetName,
  totalVoices,
  csatAverage,
  topClusterTitle,
  topStore,
  onLoadAudit,
}) => {
  const [activeTab, setActiveTab] = useState<'save' | 'list'>('save');
  const [title, setTitle] = useState(
    `Triage Snapshot - ${datasetName} (${new Date().toLocaleDateString()})`
  );
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [savedList, setSavedList] = useState<StoredSavedAudit[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && userId) {
      loadAudits();
    }
  }, [isOpen, userId]);

  const loadAudits = async () => {
    if (!userId) return;
    setIsLoadingList(true);
    setErrorMsg(null);
    try {
      const list = await fetchSavedAudits(userId);
      setSavedList(list || []);
    } catch (err: any) {
      console.error('Failed to load audits from Firestore:', err);
      setErrorMsg('Could not fetch audits. Check Firestore permissions or connection.');
    } finally {
      setIsLoadingList(false);
    }
  };

  const handleSaveCurrent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      setErrorMsg('Please sign in with Google to save audits to Firestore.');
      return;
    }
    if (!title.trim()) return;

    setIsSaving(true);
    setErrorMsg(null);
    try {
      const auditId = `audit-${Date.now()}`;
      await saveAuditToFirestore(userId, {
        id: auditId,
        title: title.trim(),
        datasetName,
        voicesCount: totalVoices,
        csatAverage,
        topCluster: topClusterTitle || 'General VoC',
        topStore: topStore || 'All Facilities',
        notes: notes.trim(),
      });
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setActiveTab('list');
        loadAudits();
      }, 1200);
    } catch (err: any) {
      console.error('Error saving audit:', err);
      setErrorMsg(err?.message || 'Failed to save audit to Firestore.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#181716]/60 backdrop-blur-xs p-4 animate-in fade-in duration-150 font-sans">
      <div className="bg-[#FFFFFF] border border-[#E5E0D5] rounded-2xl w-full max-w-xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E5E0D5] flex items-center justify-between bg-[#F6F3EC]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#EE4322]/10 border border-[#EE4322]/20 flex items-center justify-center text-[#EE4322]">
              <Cloud className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#181716] tracking-tight">
                Firestore Cloud Audits
              </h2>
              <p className="text-[11px] text-[#78736B]">
                Persist and retrieve quick commerce triage snapshots in Firestore
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#78736B] hover:text-[#181716] p-1.5 rounded-lg hover:bg-[#E5E0D5]/50 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-[#E5E0D5] bg-[#FFFFFF] px-6 pt-3 gap-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('save')}
            className={`pb-2.5 flex items-center gap-1.5 transition-colors border-b-2 ${
              activeTab === 'save'
                ? 'border-[#EE4322] text-[#EE4322]'
                : 'border-transparent text-[#78736B] hover:text-[#181716]'
            }`}
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Current Snapshot</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('list');
              loadAudits();
            }}
            className={`pb-2.5 flex items-center gap-1.5 transition-colors border-b-2 ${
              activeTab === 'list'
                ? 'border-[#EE4322] text-[#EE4322]'
                : 'border-transparent text-[#78736B] hover:text-[#181716]'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Saved Audits ({savedList.length})</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-[#FDF1EE] border border-[#EE4322]/30 rounded-xl text-xs text-[#EE4322]">
              {errorMsg}
            </div>
          )}

          {!userId && (
            <div className="p-4 bg-[#F6F3EC] border border-[#E5E0D5] rounded-xl text-center space-y-2">
              <p className="text-xs text-[#78736B]">
                You are currently browsing as a guest. Sign in with Google to enable Firestore cloud persistence.
              </p>
            </div>
          )}

          {activeTab === 'save' ? (
            <form onSubmit={handleSaveCurrent} className="space-y-4">
              {/* Snapshot Summary Preview */}
              <div className="bg-[#F6F3EC] border border-[#E5E0D5] rounded-xl p-3.5 space-y-2 text-xs">
                <div className="font-mono text-[10px] uppercase tracking-wider text-[#938E85]">
                  Telemetry Snapshot Payload
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[#78736B]">Dataset:</span>{' '}
                    <strong className="text-[#181716]">{datasetName}</strong>
                  </div>
                  <div>
                    <span className="text-[#78736B]">Total Voices:</span>{' '}
                    <strong className="text-[#181716] font-mono">{totalVoices} logs</strong>
                  </div>
                  <div>
                    <span className="text-[#78736B]">Live CSAT:</span>{' '}
                    <strong className="text-[#EE4322] font-mono">{csatAverage.toFixed(1)}★</strong>
                  </div>
                  <div>
                    <span className="text-[#78736B]">Top Facility:</span>{' '}
                    <strong className="text-[#181716]">{topStore || 'South Bay #14'}</strong>
                  </div>
                </div>
              </div>

              {/* Title input */}
              <div>
                <label className="block text-xs font-semibold text-[#181716] mb-1">
                  Audit Snapshot Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. South Bay Dairy Spoilage Audit"
                  className="w-full text-xs px-3 py-2 bg-[#FFFFFF] border border-[#E5E0D5] rounded-xl focus:border-[#181716] focus:outline-hidden"
                  required
                />
              </div>

              {/* Notes input */}
              <div>
                <label className="block text-xs font-semibold text-[#181716] mb-1">
                  Investigation Notes & Root Causes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g., Cold chain refrigeration broke down at Bay 3B. Notified facility director."
                  rows={3}
                  className="w-full text-xs px-3 py-2 bg-[#FFFFFF] border border-[#E5E0D5] rounded-xl focus:border-[#181716] focus:outline-hidden"
                />
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-[#78736B] hover:text-[#181716]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving || !userId || saveSuccess}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 text-[#FFFFFF] transition-colors shadow-2xs ${
                    saveSuccess
                      ? 'bg-[#4A5D4E]'
                      : 'bg-[#EE4322] hover:bg-[#d83819] disabled:opacity-50 disabled:cursor-not-allowed'
                  }`}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving to Firestore...</span>
                    </>
                  ) : saveSuccess ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Saved to Cloud!</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Save to Firestore</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* Saved Audits List */
            <div className="space-y-3">
              {isLoadingList ? (
                <div className="flex items-center justify-center py-8 text-xs text-[#78736B] gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-[#EE4322]" />
                  <span>Loading audits from Firestore...</span>
                </div>
              ) : savedList.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#78736B] space-y-2">
                  <Database className="w-6 h-6 mx-auto text-[#938E85]" />
                  <p>No audits saved in Firestore yet.</p>
                  <button
                    onClick={() => setActiveTab('save')}
                    className="text-[#EE4322] font-semibold hover:underline"
                  >
                    Save your current triage snapshot
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {savedList.map((audit) => (
                    <div
                      key={audit.id}
                      className="bg-[#FFFFFF] border border-[#E5E0D5] rounded-xl p-3.5 hover:border-[#181716] transition-all shadow-2xs flex items-center justify-between gap-4"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-[#181716] truncate">
                            {audit.title}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#FDF1EE] text-[#EE4322] font-bold">
                            {audit.csatAverage.toFixed(1)}★ CSAT
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-[#78736B] font-mono">
                          <span>{audit.voicesCount} voices</span>
                          <span>•</span>
                          <span className="truncate">{audit.topStore}</span>
                        </div>
                        {audit.notes && (
                          <p className="text-[11px] text-[#181716] line-clamp-1 italic">
                            "{audit.notes}"
                          </p>
                        )}
                      </div>

                      <button
                        onClick={() => {
                          onLoadAudit(audit);
                          onClose();
                        }}
                        className="shrink-0 px-3 py-1.5 rounded-lg bg-[#181716] hover:bg-[#2c2a28] text-[#FFFFFF] text-xs font-semibold flex items-center gap-1 transition-colors"
                      >
                        <span>View</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
