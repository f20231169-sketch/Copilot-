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
  GeminiModelId,
  GeminiRole,
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
import {
  signInWithGoogle,
  signOutUser,
  onAuthStatusChanged,
  validateFirestoreConnection,
  createOrUpdateConversation,
  addChatMessageToFirestore,
  StoredSavedAudit,
} from './services/firebase';
import { User } from 'firebase/auth';
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
import { CloudAuditsModal } from './components/CloudAuditsModal';

export default function App() {
  const [currentTab, setCurrentTab] = useState<ViewTab>('ingress');
  const [logs, setLogs] = useState<FeedbackLog[]>(QUICK_COMMERCE_SAMPLE_LOGS);
  const [datasetName, setDatasetName] = useState<string>('Standard Quick Commerce (30 Logs)');
  const [activeQuery, setActiveQuery] = useState<string>('');
  const [selectedClusterForCitation, setSelectedClusterForCitation] = useState<ThemeCluster | null>(null);
  const [isCitationDrawerOpen, setIsCitationDrawerOpen] = useState<boolean>(false);

  // Firebase Auth State
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);
  const [isCloudAuditsOpen, setIsCloudAuditsOpen] = useState<boolean>(false);

  // User Local Storage Profile state
  const [profiles, setProfiles] = useState<UserProfile[]>(() => loadUserProfiles());
  const [currentUserId, setCurrentUserIdState] = useState<string>(() => getActiveUserId());

  // Multi-Turn Chat & Gemini Configuration
  const [selectedModel, setSelectedModel] = useState<GeminiModelId>('gemini-3.5-flash');
  const [selectedRole, setSelectedRole] = useState<GeminiRole>('operations_lead');
  const [isAiResponding, setIsAiResponding] = useState<boolean>(false);
  const [conversationId, setConversationId] = useState<string>(() => `conv-${Date.now()}`);

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
        'Tether VoC Multi-Turn Engine online. 30 high-fidelity dark store feedback voices loaded into memory. Real-time feedback ingestion pipeline active. You can ask targeted systemic questions across previous conversation turns, attach feedback CSVs, or switch system persona roles.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      modelUsed: 'gemini-3.5-flash',
      roleUsed: 'operations_lead',
    },
  ]);

  // Initialize Firebase Auth listener and validate connection
  useEffect(() => {
    validateFirestoreConnection();
    const unsubscribe = onAuthStatusChanged((user) => {
      setAuthUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Real-time continuous stream ingestion effect
  useEffect(() => {
    if (!isStreaming) return;

    const intervalMs = streamSpeed === '5x' ? 1200 : 4500;
    const timer = setInterval(() => {
      const streamEvent = generateNextStreamLog();
      setLogs((prevLogs) => [streamEvent.log, ...prevLogs.slice(0, 199)]);

      if (streamEvent.alert) {
        setActiveAnomalyAlert(streamEvent.alert);
      }
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isStreaming, streamSpeed]);

  // Handle manual anomaly spike trigger
  const handleTriggerSpike = () => {
    const spikeStore = 'Store #14 - South Bay';
    const spikeEvent = generateNextStreamLog(spikeStore);
    setLogs((prevLogs) => [spikeEvent.log, ...prevLogs.slice(0, 199)]);
    if (spikeEvent.alert) {
      setActiveAnomalyAlert(spikeEvent.alert);
    }
  };

  // Compute filtered logs & dynamic clusters
  const { matchedLogs, clusters, groundednessScore } = useMemo(() => {
    const filterResult = filterLogsByQuery(logs, activeQuery);
    const generatedClusters = generateThemeClusters(filterResult.matchedLogs, activeQuery);
    return {
      matchedLogs: filterResult.matchedLogs,
      clusters: generatedClusters,
      groundednessScore: filterResult.groundednessScore,
    };
  }, [logs, activeQuery]);

  // Telemetry metrics
  const totalVoices = logs.length;
  const csatAverage = useMemo(() => {
    if (logs.length === 0) return 0;
    const sum = logs.reduce((acc, curr) => acc + curr.rating, 0);
    return sum / logs.length;
  }, [logs]);

  const dedupEfficiency = useMemo(() => {
    if (logs.length === 0) return 0;
    const dups = logs.filter((l) => l.isDuplicate).length;
    return Math.round((dups / logs.length) * 100);
  }, [logs]);

  const calculatedThroughput = isStreaming
    ? streamSpeed === '5x'
      ? '3,100 msgs/hr'
      : '1,420 msgs/hr'
    : '0 msgs/hr (PAUSED)';

  // Handle Google Sign-in with Firebase Auth
  const handleSignInGoogle = async () => {
    setIsSigningIn(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error('Google Sign-In failed:', err);
    } finally {
      setIsSigningIn(false);
    }
  };

  // Handle Sign out
  const handleSignOut = async () => {
    try {
      await signOutUser();
    } catch (err: any) {
      console.error('Sign out failed:', err);
    }
  };

  // Handle Multi-Turn Chat Messaging using Gemini
  const handleSendMessage = async (
    text: string,
    attached?: { name: string; content: string; rowCount: number },
    targetModel: GeminiModelId = selectedModel,
    targetRole: GeminiRole = selectedRole
  ) => {
    let workingLogs = logs;

    if (attached) {
      const parsed = parseCSVData(attached.content, attached.name);
      workingLogs = parsed.logs;
      setLogs(parsed.logs);
      setDatasetName(attached.name);
      setIsStreaming(false);
      setActiveAnomalyAlert(null);
    }

    const userMsgId = `user-${Date.now()}`;
    const userTimestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      content: text,
      timestamp: userTimestamp,
      attachedFile: attached ? { name: attached.name, rowCount: attached.rowCount } : undefined,
    };

    // Filter logs for query
    setActiveQuery(text);
    const filterResult = filterLogsByQuery(workingLogs, text);
    const generatedClusters = generateThemeClusters(filterResult.matchedLogs, text);

    const topCluster = generatedClusters[0];
    const topStore = topCluster ? topCluster.topStore : (workingLogs[0]?.storeId || 'Primary Facility');
    const totalMatched = filterResult.matchedLogs.length;

    // Save this analysis run to local user profile history
    saveAnalysisHistoryItem(currentUser.id, {
      query: text,
      matchedCount: totalMatched,
      csatSnapshot: csatAverage,
      topStore: topStore,
    });
    setProfiles(loadUserProfiles());

    // Prepare initial response placeholder
    let initialSummary = `Identified ${totalMatched} verified customer logs correlating to your inquiry.`;
    if (topCluster) {
      initialSummary += ` Primary hotspot: "${topCluster.title}" at ${topStore}. Groundedness: ${filterResult.groundednessScore}%.`;
    }

    const aiMsgId = `ai-${Date.now()}`;
    const aiMsg: ChatMessage = {
      id: aiMsgId,
      sender: 'assistant',
      content: initialSummary,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      matchedLogsCount: totalMatched,
      highlightThemeIds: generatedClusters.map((c) => c.id),
      modelUsed: targetModel,
      roleUsed: targetRole,
    };

    // Maintain conversation history
    const nextMessages = [...messages, userMsg, aiMsg];
    setMessages(nextMessages);
    setIsAiResponding(true);

    // Save to Firestore if user is authenticated
    if (authUser?.uid) {
      try {
        await createOrUpdateConversation(authUser.uid, {
          id: conversationId,
          title: text.slice(0, 60),
          model: targetModel,
          role: targetRole,
          messageCount: nextMessages.length,
        });

        await addChatMessageToFirestore(authUser.uid, conversationId, {
          id: userMsgId,
          sender: 'user',
          content: text,
          modelUsed: targetModel,
          roleUsed: targetRole,
          timestamp: userTimestamp,
        });
      } catch (e) {
        console.warn('Firestore conversation sync note:', e);
      }
    }

    // Build multi-turn context summary from current logs
    const sampleQuotes = filterResult.matchedLogs
      .slice(0, 4)
      .map((l) => `"${l.text}" (Rating: ${l.rating}★, Store: ${l.storeId}, Category: ${l.category})`)
      .join('\n');

    const logsSummary = `Total voices: ${workingLogs.length}, Matched voices: ${totalMatched}, CSAT average: ${csatAverage.toFixed(
      1
    )}★, Top cluster: "${topCluster?.title || 'General'}", Primary Facility: ${topStore}.\nSample logs:\n${sampleQuotes}`;

    // Previous turns history (excluding the pending ai response)
    const historyPayload = messages.map((m) => ({
      role: m.sender === 'assistant' ? 'assistant' : 'user',
      text: m.content,
    }));

    try {
      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: historyPayload,
          model: targetModel,
          role: targetRole,
          contextData: logsSummary,
          useSearch: targetModel === 'gemini-3.5-flash',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const updatedAiMsg: ChatMessage = {
          ...aiMsg,
          content: data.reply || initialSummary,
          modelUsed: data.modelUsed || targetModel,
          roleUsed: data.roleUsed || targetRole,
          groundingSources: data.sources,
          searchQueries: data.searchQueries,
        };

        setMessages((prev) =>
          prev.map((msg) => (msg.id === aiMsgId ? updatedAiMsg : msg))
        );

        // Sync final AI response to Firestore
        if (authUser?.uid) {
          try {
            await addChatMessageToFirestore(authUser.uid, conversationId, {
              id: aiMsgId,
              sender: 'assistant',
              content: data.reply || initialSummary,
              modelUsed: data.modelUsed || targetModel,
              roleUsed: data.roleUsed || targetRole,
              timestamp: aiMsg.timestamp,
            });
          } catch (e) {
            console.warn('Firestore message sync note:', e);
          }
        }
      }
    } catch (err: any) {
      console.warn('Multi-turn chat query note:', err?.message);
    } finally {
      setIsAiResponding(false);
    }
  };

  // Start new conversation thread
  const handleClearConversation = () => {
    const newConvId = `conv-${Date.now()}`;
    setConversationId(newConvId);
    setMessages([
      {
        id: `msg-reset-${Date.now()}`,
        sender: 'assistant',
        content: `New multi-turn session initialized with ${selectedRole.replace('_', ' ').toUpperCase()} co-pilot using ${selectedModel}. Conversation history reset.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: selectedModel,
        roleUsed: selectedRole,
      },
    ]);
  };

  // Handle one-click prompt selection
  const handleSelectPrompt = (promptText: string) => {
    handleSendMessage(promptText);
  };

  // Handle sample dataset reload
  const handleLoadSampleDataset = () => {
    setLogs(QUICK_COMMERCE_SAMPLE_LOGS);
    setDatasetName('Standard Quick Commerce (30 Logs)');
    setActiveQuery('');
    setActiveAnomalyAlert(null);
    setIsStreaming(true);
    setMessages((prev) => [
      ...prev,
      {
        id: `sys-${Date.now()}`,
        sender: 'assistant',
        content:
          'Loaded standard Quick Commerce Dark Store dataset with 30 production incident logs across South Bay #14, Downtown North #08, East River #22, and West End #03.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: selectedModel,
        roleUsed: selectedRole,
      },
    ]);
  };

  // Handle attached file parsed
  const handleAttachFileParsed = (fileName: string, content: string) => {
    const parsed = parseCSVData(content, fileName);
    setLogs(parsed.logs);
    setDatasetName(fileName);
    setIsStreaming(false);
    setActiveAnomalyAlert(null);
    setActiveQuery('');
    setMessages((prev) => [
      ...prev,
      {
        id: `sys-${Date.now()}`,
        sender: 'assistant',
        content: `Ingested ${parsed.totalVoices} customer voices from "${fileName}". Calculated CSAT: ${parsed.csatAverage.toFixed(
          1
        )}★, Deduplication efficiency: ${parsed.dedupEfficiencyRate}%. Multi-turn context updated.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        matchedLogsCount: parsed.totalVoices,
        modelUsed: selectedModel,
        roleUsed: selectedRole,
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

  // Load audit from Firestore into active view
  const handleLoadAuditFromCloud = (audit: StoredSavedAudit) => {
    setDatasetName(audit.datasetName);
    setActiveQuery('');
    setMessages((prev) => [
      ...prev,
      {
        id: `cloud-${Date.now()}`,
        sender: 'assistant',
        content: `Loaded Firestore Saved Audit: "${audit.title}". Logged ${audit.voicesCount} voices with ${audit.csatAverage.toFixed(
          1
        )}★ CSAT. Top facility: ${audit.topStore}. Notes: ${audit.notes || 'None recorded'}.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: selectedModel,
        roleUsed: selectedRole,
      },
    ]);
    setCurrentTab('dashboard');
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
      {/* 1. STRICT SECTION-LINK SIDEBAR */}
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
          authUser={authUser}
          onSignInGoogle={handleSignInGoogle}
          onSignOut={handleSignOut}
          isSigningIn={isSigningIn}
          onOpenCloudAudits={() => setIsCloudAuditsOpen(true)}
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
              onClearConversation={handleClearConversation}
              currentDatasetName={datasetName}
              totalLogsCount={totalVoices}
              selectedModel={selectedModel}
              onChangeModel={(m) => setSelectedModel(m)}
              selectedRole={selectedRole}
              onChangeRole={(r) => setSelectedRole(r)}
              isAiResponding={isAiResponding}
              isAuthenticated={!!authUser}
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

      {/* 5. FIRESTORE CLOUD AUDITS MODAL */}
      <CloudAuditsModal
        isOpen={isCloudAuditsOpen}
        onClose={() => setIsCloudAuditsOpen(false)}
        userId={authUser?.uid || null}
        datasetName={datasetName}
        totalVoices={totalVoices}
        csatAverage={csatAverage}
        topClusterTitle={clusters[0]?.title || 'General'}
        topStore={clusters[0]?.topStore || 'All Facilities'}
        onLoadAudit={handleLoadAuditFromCloud}
      />
    </div>
  );
}
