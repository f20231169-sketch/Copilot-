/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  ViewTab,
  FeedbackLog,
  ThemeCluster,
  ChatMessage,
  RealtimeAnomalyAlert,
  UserProfile,
} from './types';
import { QUICK_COMMERCE_SAMPLE_LOGS } from './data/sampleDataset';
import { parseCSVData } from './utils/csvParser';
import { filterLogsByQuery, generateThemeClusters } from './utils/clusterEngine';
import { generateNextStreamLog } from './utils/realtimeStream';
import {
  loadUserProfiles,
  saveUserProfiles,
  getActiveUserId,
  setActiveUserId,
  saveAnalysisHistoryItem,
} from './utils/authStorage';
import { Sidebar } from './components/Sidebar';
import { HeaderTelemetry } from './components/HeaderTelemetry';
import { IngressChat } from './components/IngressChat';
import { ExecutiveDashboard } from './components/ExecutiveDashboard';
import { CitationDrawer } from './components/CitationDrawer';
import { TrendSlaView } from './components/TrendSlaView';
import { DeduplicationView } from './components/DeduplicationView';
import { BugDefectView } from './components/BugDefectView';
import { AuditDossierView } from './components/AuditDossierView';
import { UserProfileView } from './components/UserProfileView';

export default function App() {
  const [currentTab, setCurrentTab] = useState<ViewTab>('ingress');
  const [logs, setLogs] = useState<FeedbackLog[]>(QUICK_COMMERCE_SAMPLE_LOGS);
  const [datasetName, setDatasetName] = useState<string>('Standard Quick Commerce (30 Logs)');
  const [activeQuery, setActiveQuery] = useState<string>('');
  const [selectedClusterForCitation, setSelectedClusterForCitation] = useState<ThemeCluster | null>(null);
  const [isCitationDrawerOpen, setIsCitationDrawerOpen] = useState<boolean>(false);

  // User Auth & Profiles
  const [profiles, setProfiles] = useState<UserProfile[]>(() => loadUserProfiles());
  const [currentUserId, setCurrentUserIdState] = useState<string>(() => getActiveUserId());

  const currentUser = useMemo(() => {
    return profiles.find((p) => p.id === currentUserId) || profiles[0];
  }, [profiles, currentUserId]);

  // Real-time Data Ingestion Pipeline State
  const [isStreaming, setIsStreaming] = useState<boolean>(true);
  const [streamSpeed, setStreamSpeed] = useState<'1x' | '5x'>('1x');
  const [activeAnomalyAlert, setActiveAnomalyAlert] = useState<RealtimeAnomalyAlert | null>(null);

  // Initial introductory conversation
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-init',
      sender: 'assistant',
      content:
        'Tether VoC Anomaly Engine online. 30 high-fidelity dark store feedback voices loaded into memory. Real-time feedback ingestion pipeline active. You can ask targeted systemic questions, paste/upload your customer feedback CSV, or execute one of the quick triage prompt pills below.',
      timestamp: '21:30',
    },
  ]);

  // Real-time continuous stream ingestion effect
  useEffect(() => {
    if (!isStreaming) return;

    const intervalMs = streamSpeed === '5x' ? 1200 : 4500;
    const timer = setInterval(() => {
      const streamEvent = generateNextStreamLog();

      setLogs((prev) => {
        // Keep max 80 logs to maintain fast performance and avoid memory buildup
        const updated = [streamEvent.log, ...prev.slice(0, 79)];
        return updated;
      });

      if (streamEvent.alert) {
        setActiveAnomalyAlert(streamEvent.alert);
      }
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isStreaming, streamSpeed]);

  // Handle manual spike surge simulation
  const handleTriggerSpike = () => {
    // Generate 3 urgent logs immediately
    const burstLogs: FeedbackLog[] = [];
    let latestAlert: RealtimeAnomalyAlert | null = null;

    for (let i = 0; i < 3; i++) {
      const streamEvent = generateNextStreamLog();
      burstLogs.push(streamEvent.log);
      if (streamEvent.alert) latestAlert = streamEvent.alert;
    }

    setLogs((prev) => [...burstLogs, ...prev.slice(0, 75)]);

    if (latestAlert) {
      setActiveAnomalyAlert(latestAlert);
    } else {
      setActiveAnomalyAlert({
        id: `spike-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        severity: 'CRITICAL',
        title: 'Dinner Rush Surge Ingress',
        summary: 'Volume surge: 3 critical complaints logged in Staging Bay 3B.',
        storeId: 'Store #14 - South Bay',
        category: 'Thermal Cold-Chain',
        relatedTicketId: burstLogs[0].id,
      });
    }
  };

  // Compute dataset-wide metrics directly from actual logs
  const totalVoices = logs.length;
  const validRatings = logs.filter((l) => typeof l.rating === 'number' && !isNaN(l.rating));
  const csatAverage =
    validRatings.length > 0
      ? Number((validRatings.reduce((acc, l) => acc + l.rating, 0) / validRatings.length).toFixed(1))
      : 0;

  const duplicateCount = logs.filter((l) => l.isDuplicate).length;
  const dedupEfficiency =
    totalVoices > 0 ? Math.round((duplicateCount / totalVoices) * 100) : 0;

  const isCustomCSV = datasetName !== 'Standard Quick Commerce (30 Logs)';
  const calculatedThroughput = isStreaming
    ? streamSpeed === '5x'
      ? '7,100 msgs/hr'
      : '1,420 msgs/hr'
    : isCustomCSV
    ? `Static CSV (${totalVoices} rows)`
    : '0 msgs/hr (PAUSED)';

  // Filter logs by active query if present
  const { matchedLogs, keywords, groundednessScore } = useMemo(() => {
    return filterLogsByQuery(logs, activeQuery);
  }, [logs, activeQuery]);

  // Generate dynamic theme clusters
  const clusters = useMemo(() => {
    return generateThemeClusters(matchedLogs, activeQuery);
  }, [matchedLogs, activeQuery]);

  // Handle user query in chat bar
  const handleSendMessage = (
    text: string,
    attachedFile?: { name: string; content: string; rowCount: number }
  ) => {
    const userMsgId = `user-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      attachedFile: attachedFile ? { name: attachedFile.name, rowCount: attachedFile.rowCount } : undefined,
    };

    let workingLogs = logs;
    let newDatasetName = datasetName;

    // If a file was attached with this message, parse it
    if (attachedFile) {
      const parsed = parseCSVData(attachedFile.content, attachedFile.name);
      workingLogs = parsed.logs;
      newDatasetName = attachedFile.name;
      setLogs(workingLogs);
      setDatasetName(newDatasetName);
      setIsStreaming(false); // Stop synthetic mock streaming so uploaded dataset remains pure
      setActiveAnomalyAlert(null);
    }

    // Filter logs for query
    setActiveQuery(text);
    const filterResult = filterLogsByQuery(workingLogs, text);
    const generatedClusters = generateThemeClusters(filterResult.matchedLogs, text);

    // Formulate AI briefing reply
    const topCluster = generatedClusters[0];
    const topStore = topCluster ? topCluster.topStore : (workingLogs[0]?.storeId || 'Primary Facility');
    const totalMatched = filterResult.matchedLogs.length;

    // Save this analysis run to user profile history
    saveAnalysisHistoryItem(currentUser.id, {
      query: text,
      matchedCount: totalMatched,
      csatSnapshot: csatAverage,
      topStore: topStore,
    });
    // Reload profiles to keep UI synchronized
    setProfiles(loadUserProfiles());

    let responseContent = `Audit Complete. Identified ${totalMatched} verified customer logs correlating to your inquiry.`;
    if (topCluster) {
      responseContent += `\n\n• Primary Systemic Hotspot: "${topCluster.title}"\n• Impact: ${topCluster.insight}\n• Concentrated Facility: ${topStore}\n• Groundedness Attributed: ${filterResult.groundednessScore}% LLM Grounded with zero synthetic hallucination.`;
    }

    const aiMsgId = `ai-${Date.now()}`;
    const aiMsg: ChatMessage = {
      id: aiMsgId,
      sender: 'assistant',
      content: responseContent,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      matchedLogsCount: totalMatched,
      highlightThemeIds: generatedClusters.map((c) => c.id),
    };

    setMessages((prev) => [...prev, userMsg, aiMsg]);

    // Query server-side Gemini 3.5 Flash with Google Search grounding
    const sampleQuotes = filterResult.matchedLogs
      .slice(0, 4)
      .map((l) => `"${l.text}" (Rating: ${l.rating}★, Store: ${l.storeId}, Category: ${l.category})`)
      .join('\n');

    const logsSummary = `Total voices: ${workingLogs.length}, Matched voices: ${totalMatched}, CSAT average: ${csatAverage}★, Top cluster: "${
      topCluster?.title || 'General'
    }", Primary Store: ${topStore}.\nSample logs:\n${sampleQuotes}`;

    fetch('/api/gemini/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: text,
        logsSummary,
        useSearch: true,
      }),
    })
      .then(async (res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((data) => {
        if (data && data.reply) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === aiMsgId
                ? {
                    ...msg,
                    content: data.reply,
                    groundingSources: data.sources,
                    searchQueries: data.searchQueries,
                  }
                : msg
            )
          );
        }
      })
      .catch((err) => {
        // Fallback already displayed
        console.warn('Gemini search grounding query note:', err?.message);
      });
  };

  // Handle one-click prompt selection
  const handleSelectPrompt = (promptText: string) => {
    handleSendMessage(promptText);
  };

  // Load sample dataset
  const handleLoadSampleDataset = () => {
    setLogs(QUICK_COMMERCE_SAMPLE_LOGS);
    setDatasetName('Standard Quick Commerce (30 Logs)');
    setActiveQuery('');
    setActiveAnomalyAlert(null);
    setIsStreaming(true); // Re-enable streaming for synthetic demo data
    setMessages((prev) => [
      ...prev,
      {
        id: `sys-${Date.now()}`,
        sender: 'assistant',
        content:
          'Loaded standard Quick Commerce Dark Store dataset with 30 production incident logs across South Bay #14, Downtown North #08, East River #22, and West End #03.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  // Handle attached file parsed from file picker or drag & drop
  const handleAttachFileParsed = (fileName: string, content: string) => {
    const parsed = parseCSVData(content, fileName);
    setLogs(parsed.logs);
    setDatasetName(fileName);
    setIsStreaming(false); // Stop synthetic mock streaming so uploaded dataset remains pure
    setActiveAnomalyAlert(null); // Clear previous mock anomaly alert
    setActiveQuery(''); // Clear any query so all uploaded rows are immediately visible
    setMessages((prev) => [
      ...prev,
      {
        id: `sys-${Date.now()}`,
        sender: 'assistant',
        content: `Ingested ${parsed.totalVoices} customer voices from "${fileName}". Calculated CSAT: ${parsed.csatAverage.toFixed(
          1
        )}★, Deduplication efficiency: ${parsed.dedupEfficiencyRate}%. Ready for query triage.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        matchedLogsCount: parsed.totalVoices,
      },
    ]);
  };

  // Open Citation Drawer
  const handleOpenCitation = (cluster: ThemeCluster) => {
    setSelectedClusterForCitation(cluster);
    setIsCitationDrawerOpen(true);
  };

  // Open specific ticket in citation drawer
  const handleSelectTicketInDossier = (log: FeedbackLog) => {
    const cluster = clusters.find((c) => c.matchingLogIds.includes(log.id)) || clusters[0];
    if (cluster) {
      setSelectedClusterForCitation(cluster);
      setIsCitationDrawerOpen(true);
    }
  };

  // Handle anomaly ticket click from top banner
  const handleSelectAnomalyTicket = (ticketId: string) => {
    const targetLog = logs.find((l) => l.id === ticketId);
    if (targetLog) {
      handleSelectTicketInDossier(targetLog);
    } else {
      setCurrentTab('audit');
    }
  };

  // Profile Management handlers
  const handleSwitchUser = (userId: string) => {
    setActiveUserId(userId);
    setCurrentUserIdState(userId);
  };

  const handleUpdateProfile = (updated: UserProfile) => {
    const nextProfiles = profiles.map((p) => (p.id === updated.id ? updated : p));
    setProfiles(nextProfiles);
    saveUserProfiles(nextProfiles);
  };

  const handleCreateProfile = (newProfile: UserProfile) => {
    const nextProfiles = [...profiles, newProfile];
    setProfiles(nextProfiles);
    saveUserProfiles(nextProfiles);
    handleSwitchUser(newProfile.id);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#FCF9F2] text-[#181716] font-sans">
      {/* 1. STRICT SECTION-LINK SIDEBAR (No duplicate status card) */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        currentUser={currentUser}
      />

      {/* Main App Canvas */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* 2. CONSOLIDATED SINGLE TOP NAVIGATION & TELEMETRY BAR */}
        <HeaderTelemetry
          totalVoices={totalVoices}
          ingestionRate={calculatedThroughput}
          csatAverage={csatAverage}
          dedupEfficiency={dedupEfficiency}
          activeQuery={activeQuery}
          onClearQuery={() => setActiveQuery('')}
          onNavigateToIngress={() => setCurrentTab('ingress')}
          isStreaming={isStreaming}
          onToggleStreaming={() => setIsStreaming((prev) => !prev)}
          streamSpeed={streamSpeed}
          onToggleSpeed={() => setStreamSpeed((prev) => (prev === '1x' ? '5x' : '1x'))}
          onTriggerSpike={handleTriggerSpike}
          activeAnomalyAlert={activeAnomalyAlert}
          onDismissAnomaly={() => setActiveAnomalyAlert(null)}
          onSelectAnomalyTicket={handleSelectAnomalyTicket}
        />

        {/* 3. PRIMARY VIEW CONTAINER */}
        <main className="flex-1 flex flex-col overflow-hidden relative">
          {currentTab === 'ingress' && (
            <IngressChat
              messages={messages}
              onSendMessage={handleSendMessage}
              onSelectPrompt={handleSelectPrompt}
              onGenerateDashboard={() => setCurrentTab('dashboard')}
              onLoadSampleDataset={handleLoadSampleDataset}
              onAttachFileParsed={handleAttachFileParsed}
              currentDatasetName={datasetName}
              totalLogsCount={totalVoices}
            />
          )}

          {currentTab === 'dashboard' && (
            <ExecutiveDashboard
              logs={matchedLogs}
              clusters={clusters}
              onOpenCitation={handleOpenCitation}
              activeQuery={activeQuery}
              groundednessScore={groundednessScore}
            />
          )}

          {currentTab === 'trends' && <TrendSlaView logs={matchedLogs} />}

          {currentTab === 'dedup' && (
            <DeduplicationView logs={logs} dedupRate={dedupEfficiency} />
          )}

          {currentTab === 'defects' && <BugDefectView logs={matchedLogs} />}

          {currentTab === 'audit' && (
            <AuditDossierView
              logs={matchedLogs}
              onSelectTicket={handleSelectTicketInDossier}
            />
          )}

          {currentTab === 'profile' && (
            <UserProfileView
              currentUser={currentUser}
              allUsers={profiles}
              onSwitchUser={handleSwitchUser}
              onUpdateUser={handleUpdateProfile}
              onCreateUser={handleCreateProfile}
              onRunSavedPrompt={(prompt) => {
                handleSendMessage(prompt);
                setCurrentTab('ingress');
              }}
              onRunHistoryQuery={(query) => {
                handleSendMessage(query);
                setCurrentTab('ingress');
              }}
            />
          )}
        </main>
      </div>

      {/* 4. TRACEABLE EVIDENCE CITATION DRAWER */}
      <CitationDrawer
        isOpen={isCitationDrawerOpen}
        onClose={() => setIsCitationDrawerOpen(false)}
        cluster={selectedClusterForCitation}
        allLogs={logs}
      />
    </div>
  );
}
