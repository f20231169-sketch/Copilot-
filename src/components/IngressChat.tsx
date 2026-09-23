/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Plus,
  Mic,
  MicOff,
  Loader2,
  ArrowRight,
  FileText,
  X,
  Sparkles,
  Database,
  ShieldCheck,
  CheckCircle2,
  Send,
  Globe,
  ExternalLink,
  Cpu,
  UserCheck,
  RotateCcw,
  Zap,
  Layers,
} from 'lucide-react';
import { ChatMessage, GeminiModelId, GeminiRole } from '../types';
import { parseCSVData } from '../utils/csvParser';

interface IngressChatProps {
  messages: ChatMessage[];
  onSendMessage: (
    text: string,
    attachedFile?: { name: string; content: string; rowCount: number },
    model?: GeminiModelId,
    role?: GeminiRole
  ) => void;
  onSelectPrompt: (promptText: string) => void;
  onGenerateDashboard: () => void;
  onLoadSampleDataset: () => void;
  onAttachFileParsed: (fileName: string, content: string) => void;
  onClearConversation: () => void;
  currentDatasetName: string;
  totalLogsCount: number;
  selectedModel: GeminiModelId;
  onChangeModel: (model: GeminiModelId) => void;
  selectedRole: GeminiRole;
  onChangeRole: (role: GeminiRole) => void;
  isAiResponding: boolean;
  isAuthenticated: boolean;
}

export const IngressChat: React.FC<IngressChatProps> = ({
  messages,
  onSendMessage,
  onSelectPrompt,
  onGenerateDashboard,
  onLoadSampleDataset,
  onAttachFileParsed,
  onClearConversation,
  currentDatasetName,
  totalLogsCount,
  selectedModel,
  onChangeModel,
  selectedRole,
  onChangeRole,
  isAiResponding,
  isAuthenticated,
}) => {
  const [inputText, setInputText] = useState('');
  const [attachedFile, setAttachedFile] = useState<{ name: string; content: string; rowCount: number } | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Audio recording & transcription state (uses gemini-3.5-transcribe)
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [transcribeError, setTranscribeError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);

  const recommendedPrompts = [
    'Analyze top systemic friction points destroying CSAT in 1-2 star reviews.',
    'Identify thermal spoilage and packaging leak patterns across Dark Stores.',
    'Benchmark our 15-minute quick commerce delivery SLAs against industry standards.',
  ];

  const roleLabels: Record<GeminiRole, { title: string; subtitle: string; icon: string }> = {
    operations_lead: {
      title: 'Operations Lead',
      subtitle: 'Cold chain, dark store staging, dwell time, pick/pack defects',
      icon: '🏬',
    },
    product_manager: {
      title: 'Product Manager',
      subtitle: 'Checkout UX, 504 timeouts, support bot refund disputes, LTV',
      icon: '📱',
    },
    executive_vp: {
      title: 'Executive VP / COO',
      subtitle: 'High-level financial summaries, revenue bleed, store benchmarking',
      icon: '📊',
    },
  };

  const modelLabels: Record<GeminiModelId, { name: string; badge: string; desc: string }> = {
    'gemini-3.1-pro-preview': {
      name: 'gemini-3.1-pro-preview',
      badge: 'Complex Tasks',
      desc: 'Deep multi-store root cause & systemic correlation',
    },
    'gemini-3.5-flash': {
      name: 'gemini-3.5-flash',
      badge: 'General Tasks',
      desc: 'Balanced triage & live Google Search grounding',
    },
    'gemini-3.1-flash-lite': {
      name: 'gemini-3.1-flash-lite',
      badge: 'Fast Tasks',
      desc: 'Rapid categorization & sub-second answering',
    },
  };

  // Auto-scroll chat to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAiResponding]);

  // Clean up recording timer on unmount
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processSelectedFile(file);
  };

  const processSelectedFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = String(event.target?.result || '');
      const parsed = parseCSVData(content, file.name);
      const rowCount = parsed.totalVoices;
      setAttachedFile({
        name: file.name,
        content,
        rowCount,
      });
      onAttachFileParsed(file.name, content);
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text');
    if (text.includes('\n') && (text.includes(',') || text.includes('\t'))) {
      const lines = text.trim().split('\n');
      if (
        lines.length > 2 &&
        (lines[0].toLowerCase().includes('id') ||
          lines[0].toLowerCase().includes('rating') ||
          lines[0].toLowerCase().includes('review') ||
          lines[0].toLowerCase().includes('text'))
      ) {
        e.preventDefault();
        const parsed = parseCSVData(text, 'pasted_records.csv');
        setAttachedFile({
          name: 'pasted_feedback_table.csv',
          content: text,
          rowCount: parsed.totalVoices,
        });
        onAttachFileParsed('pasted_feedback_table.csv', text);
        setInputText('Analyze pasted customer records for urgent dark store anomalies.');
      }
    }
  };

  // Start microphone recording (gemini-3.5-transcribe)
  const startRecording = async () => {
    setTranscribeError(null);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Microphone recording is not supported in this browser.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      let mimeType = 'audio/webm';
      if (!MediaRecorder.isTypeSupported('audio/webm') && MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      }

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        stream.getTracks().forEach((track) => track.stop());
        await transcribeAudioBlob(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Microphone error:', err);
      setTranscribeError(
        err?.name === 'NotAllowedError'
          ? 'Microphone permission was denied. Please allow microphone access.'
          : err?.message || 'Unable to access microphone.'
      );
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  };

  const transcribeAudioBlob = async (blob: Blob) => {
    setIsTranscribing(true);
    setTranscribeError(null);

    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const result = reader.result as string;
          const base64Data = result.split(',')[1] || result;
          resolve(base64Data);
        };
        reader.onerror = reject;
      });
      reader.readAsDataURL(blob);
      const base64Audio = await base64Promise;

      const res = await fetch('/api/gemini/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioData: base64Audio,
          mimeType: blob.type || 'audio/webm',
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with ${res.status}`);
      }

      const data = await res.json();
      if (data.text) {
        setInputText((prev) => (prev.trim() ? `${prev.trim()} ${data.text}` : data.text));
      } else {
        setTranscribeError('No audible speech was recognized.');
      }
    } catch (err: any) {
      console.error('Audio transcription error:', err);
      setTranscribeError(err?.message || 'Failed to transcribe audio.');
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() && !attachedFile) return;

    const textToSend =
      inputText.trim() || 'Analyze attached customer dataset for critical dark store friction points.';
    onSendMessage(textToSend, attachedFile || undefined, selectedModel, selectedRole);
    setInputText('');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#FCF9F2] overflow-hidden font-sans">
      {/* Top Multi-Turn Chat Controls Bar: Role Persona + Model Selection */}
      <div className="border-b border-[#E5E0D5] bg-[#FFFFFF] px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs shadow-2xs z-10">
        {/* Role Persona Switcher */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-mono text-[10px] uppercase tracking-wider text-[#938E85] mr-1">
            System Persona:
          </span>
          {(['operations_lead', 'product_manager', 'executive_vp'] as GeminiRole[]).map((r) => {
            const isSelected = selectedRole === r;
            return (
              <button
                key={r}
                type="button"
                onClick={() => onChangeRole(r)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all text-xs flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#181716] text-[#FCF9F2] shadow-2xs font-semibold'
                    : 'bg-[#F6F3EC] text-[#78736B] hover:text-[#181716] hover:bg-[#E5E0D5]/60'
                }`}
                title={roleLabels[r].subtitle}
              >
                <span>{roleLabels[r].icon}</span>
                <span>{roleLabels[r].title}</span>
              </button>
            );
          })}
        </div>

        {/* Model Selector Pill (gemini-3.1-pro-preview, gemini-3.5-flash, gemini-3.1-flash-lite) */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-[#F6F3EC] p-1 rounded-xl border border-[#E5E0D5]">
            {(['gemini-3.1-pro-preview', 'gemini-3.5-flash', 'gemini-3.1-flash-lite'] as GeminiModelId[]).map((m) => {
              const isSelected = selectedModel === m;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => onChangeModel(m)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all flex items-center gap-1 ${
                    isSelected
                      ? 'bg-[#FFFFFF] text-[#EE4322] font-bold shadow-2xs'
                      : 'text-[#78736B] hover:text-[#181716]'
                  }`}
                  title={`${modelLabels[m].name}: ${modelLabels[m].desc}`}
                >
                  <Cpu className="w-3 h-3" />
                  <span>{modelLabels[m].badge}</span>
                </button>
              );
            })}
          </div>

          {/* Clear / New Conversation Button */}
          <button
            type="button"
            onClick={onClearConversation}
            className="p-1.5 rounded-lg text-[#78736B] hover:text-[#EE4322] hover:bg-[#FDF1EE] transition-colors border border-transparent hover:border-[#EE4322]/20"
            title="Start new conversation thread"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Conversational Stream */}
      <div className="flex-1 overflow-y-auto px-6 py-6 max-w-4xl w-full mx-auto space-y-5">
        {/* Intro Greeting when empty thread */}
        {messages.length <= 1 && (
          <div className="text-center py-4 space-y-3">
            <div className="inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-[#FFFFFF] border border-[#E5E0D5] shadow-2xs mb-1">
              <Sparkles className="w-5 h-5 text-[#EE4322]" />
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold text-[#181716] tracking-tight">
              Tether VoC Multi-Turn Co-Pilot
            </h1>
            <p className="text-xs sm:text-sm text-[#78736B] max-w-lg mx-auto leading-relaxed">
              Multi-turn conversational intelligence powered by Gemini. Active role:{' '}
              <strong className="text-[#181716]">{roleLabels[selectedRole].title}</strong>. Model:{' '}
              <strong className="text-[#EE4322] font-mono">{selectedModel}</strong>.
            </p>

            {/* Quick Actions Strip */}
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={onLoadSampleDataset}
                className="flex items-center gap-1.5 text-xs font-medium px-3.5 py-1.5 bg-[#FFFFFF] hover:bg-[#F6F3EC] border border-[#E5E0D5] rounded-lg text-[#181716] transition-colors shadow-2xs"
              >
                <Database className="w-3.5 h-3.5 text-[#EE4322]" />
                <span>Quick Commerce Sample Data</span>
              </button>

              <button
                onClick={onGenerateDashboard}
                className="flex items-center gap-1.5 text-xs font-semibold px-4 py-1.5 bg-[#EE4322] hover:bg-[#d83819] text-[#FFFFFF] rounded-lg transition-colors shadow-2xs"
              >
                <span>View Full Executive Briefing</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Message Thread */}
        <div className="space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              {msg.sender === 'user' ? (
                /* User Message Bubble */
                <div className="max-w-xl bg-[#181716] text-[#FCF9F2] rounded-2xl rounded-tr-xs px-4 py-3 text-xs sm:text-sm shadow-2xs">
                  {msg.attachedFile && (
                    <div className="flex items-center gap-2 mb-2 pb-2 border-b border-[#33312E] text-xs font-mono text-[#E5E0D5]">
                      <FileText className="w-3.5 h-3.5 text-[#EE4322]" />
                      <span>{msg.attachedFile.name}</span>
                      <span className="text-[#938E85]">({msg.attachedFile.rowCount} records)</span>
                    </div>
                  )}
                  <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  <span className="text-[10px] text-[#938E85] font-mono block text-right mt-1.5">
                    {msg.timestamp}
                  </span>
                </div>
              ) : (
                /* AI Co-Pilot Response Bubble */
                <div className="max-w-2xl bg-[#FFFFFF] border border-[#E5E0D5] rounded-2xl rounded-tl-xs p-5 shadow-2xs text-xs sm:text-sm text-[#181716] space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-[#E5E0D5]/70 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#EE4322]" />
                      <span className="font-bold text-xs tracking-tight text-[#181716]">
                        Tether VoC Intelligence Brief
                      </span>
                      {msg.modelUsed && (
                        <span className="text-[10px] font-mono bg-[#F6F3EC] text-[#78736B] px-1.5 py-0.5 rounded border border-[#E5E0D5]">
                          {msg.modelUsed}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-mono text-[#4A5D4E] bg-[#4A5D4E]/10 px-2 py-0.5 rounded flex items-center gap-1 font-medium">
                      <ShieldCheck className="w-3 h-3" />
                      100% Attributed
                    </span>
                  </div>

                  <div className="leading-relaxed text-[#181716] whitespace-pre-wrap">
                    {msg.content}
                  </div>

                  {/* Google Search Grounding Section */}
                  {((msg.searchQueries && msg.searchQueries.length > 0) ||
                    (msg.groundingSources && msg.groundingSources.length > 0)) && (
                    <div className="mt-3 pt-3 border-t border-[#E5E0D5]/70 space-y-2 bg-[#F6F3EC]/50 p-3 rounded-xl border border-[#E5E0D5]">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-[#FFFFFF] text-[#181716] border border-[#E5E0D5] shadow-2xs">
                          <Globe className="w-3 h-3 text-[#EE4322]" />
                          Google Search Grounded
                        </span>
                        {msg.searchQueries &&
                          msg.searchQueries.map((q, idx) => (
                            <span key={idx} className="text-[10px] font-mono text-[#78736B] truncate max-w-[220px]">
                              "{q}"
                            </span>
                          ))}
                      </div>

                      {msg.groundingSources && msg.groundingSources.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-[10px] font-mono uppercase tracking-wider text-[#938E85] block">
                            Grounding Web Sources:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {msg.groundingSources.map((source, idx) => (
                              <a
                                key={idx}
                                href={source.uri}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] font-sans text-[#181716] hover:text-[#EE4322] bg-[#FFFFFF] border border-[#E5E0D5] px-2 py-1 rounded-md shadow-2xs hover:border-[#EE4322]/40 transition-colors max-w-xs truncate"
                                title={source.uri}
                              >
                                <span className="truncate">{source.title || source.uri}</span>
                                <ExternalLink className="w-3 h-3 shrink-0 text-[#78736B]" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {msg.matchedLogsCount !== undefined && msg.matchedLogsCount > 0 && (
                    <div className="pt-2 flex items-center justify-between border-t border-[#E5E0D5]/70 text-xs">
                      <span className="text-[#78736B] font-mono text-[11px]">
                        EVIDENCE BASE: <strong className="text-[#181716]">{msg.matchedLogsCount} matching ticket logs</strong>
                      </span>
                      <button
                        onClick={onGenerateDashboard}
                        className="text-[#EE4322] hover:text-[#d83819] font-medium flex items-center gap-1 hover:underline text-xs"
                      >
                        <span>Open Dossier & Visual Charts</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* AI Thinking Indicator */}
          {isAiResponding && (
            <div className="flex items-center gap-2.5 p-3.5 bg-[#FFFFFF] border border-[#E5E0D5] rounded-2xl text-xs text-[#78736B] max-w-sm shadow-2xs">
              <Loader2 className="w-4 h-4 animate-spin text-[#EE4322]" />
              <span>
                Gemini ({selectedModel}) analyzing conversation context...
              </span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Floating Prompt Bar Area */}
      <div className="border-t border-[#E5E0D5] bg-[#F6F3EC]/90 px-6 py-4">
        <div className="max-w-4xl mx-auto space-y-3">
          {/* Main Integrated Search Bar Input Card */}
          <form
            onSubmit={handleSubmit}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`bg-[#FFFFFF] border rounded-2xl p-2.5 shadow-xs transition-all ${
              isDraggingOver
                ? 'border-[#EE4322] bg-[#FDF1EE]/30'
                : 'border-[#E5E0D5] focus-within:border-[#181716]'
            }`}
          >
            {/* Attached File Preview Badge */}
            {attachedFile && (
              <div className="flex items-center justify-between bg-[#F6F3EC] border border-[#E5E0D5] rounded-xl px-3 py-1.5 mb-2 text-xs">
                <div className="flex items-center gap-2 text-[#181716] font-mono">
                  <FileText className="w-3.5 h-3.5 text-[#EE4322]" />
                  <span className="font-medium truncate max-w-[260px]">{attachedFile.name}</span>
                  <span className="text-[#78736B]">({attachedFile.rowCount} rows parsed)</span>
                </div>
                <button
                  type="button"
                  onClick={() => setAttachedFile(null)}
                  className="text-[#78736B] hover:text-[#EE4322] p-1"
                  title="Remove attached file"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Audio Recording Status Indicator */}
            {isRecording && (
              <div className="flex items-center justify-between gap-2 px-3 py-1.5 mb-2 bg-[#FDF1EE] border border-[#EE4322]/20 rounded-xl text-xs text-[#EE4322] font-mono">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#EE4322] animate-ping" />
                  <span className="font-semibold">
                    Recording audio ({recordingSeconds}s)...
                  </span>
                  <span className="text-[#78736B] hidden sm:inline font-sans">
                    Click mic to finish and transcribe with gemini-3.5-transcribe
                  </span>
                </div>
                <button
                  type="button"
                  onClick={stopRecording}
                  className="text-xs bg-[#EE4322] text-[#FFFFFF] px-2.5 py-0.5 rounded-lg font-bold hover:bg-[#d83819]"
                >
                  Stop & Transcribe
                </button>
              </div>
            )}

            {/* Audio Transcribing Spinner */}
            {isTranscribing && (
              <div className="flex items-center gap-2 px-3 py-1.5 mb-2 bg-[#FDF1EE] border border-[#EE4322]/20 rounded-xl text-xs text-[#EE4322] font-mono">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#EE4322]" />
                <span>Transcribing voice speech using gemini-3.5-transcribe...</span>
              </div>
            )}

            {/* Transcription Error Banner */}
            {transcribeError && (
              <div className="flex items-center justify-between gap-2 px-3 py-1.5 mb-2 bg-[#FDF1EE] border border-[#EE4322]/30 rounded-xl text-xs text-[#EE4322]">
                <span>{transcribeError}</span>
                <button
                  type="button"
                  onClick={() => setTranscribeError(null)}
                  className="text-[#EE4322] hover:text-[#181716]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Hidden file input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".csv,.json,.txt"
              className="hidden"
            />

            {/* Input Bar Layout: Attachment Icon (+) + Mic (right side of +) + Text Box + Action CTA */}
            <div className="flex items-center gap-1.5">
              {/* Attachment Button (+) */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-[#78736B] hover:text-[#EE4322] hover:bg-[#FDF1EE] transition-colors shrink-0"
                title="Attach feedback CSV, JSON or TXT"
              >
                <Plus className="w-5 h-5" />
              </button>

              {/* Mic for transcribing audio displayed right side of the plus icon */}
              <button
                type="button"
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isTranscribing}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all shrink-0 ${
                  isRecording
                    ? 'bg-[#EE4322] text-[#FFFFFF] shadow-sm animate-pulse ring-2 ring-[#EE4322]/30'
                    : isTranscribing
                    ? 'bg-[#FDF1EE] text-[#EE4322]'
                    : 'text-[#78736B] hover:text-[#EE4322] hover:bg-[#FDF1EE]'
                }`}
                title={
                  isRecording
                    ? `Recording (${recordingSeconds}s) - Click to stop and transcribe`
                    : isTranscribing
                    ? 'Transcribing audio with gemini-3.5-transcribe...'
                    : 'Transcribe audio via microphone (gemini-3.5-transcribe)'
                }
              >
                {isTranscribing ? (
                  <Loader2 className="w-4 h-4 animate-spin text-[#EE4322]" />
                ) : isRecording ? (
                  <MicOff className="w-4 h-4 text-[#FFFFFF]" />
                ) : (
                  <Mic className="w-4 h-4" />
                )}
              </button>

              {/* Text Input */}
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onPaste={handlePaste}
                placeholder={
                  isRecording
                    ? 'Listening to microphone input...'
                    : `Ask ${roleLabels[selectedRole].title} (${selectedModel})...`
                }
                className="flex-1 bg-transparent border-0 focus:outline-hidden text-xs sm:text-sm text-[#181716] placeholder:text-[#938E85] px-2 py-1 font-sans"
              />

              {/* Run Triage CTA */}
              <button
                type="submit"
                disabled={(!inputText.trim() && !attachedFile) || isAiResponding}
                className={`px-3.5 py-2 rounded-xl flex items-center gap-1.5 text-xs font-semibold transition-all shrink-0 ${
                  (inputText.trim() || attachedFile) && !isAiResponding
                    ? 'bg-[#EE4322] text-[#FFFFFF] hover:bg-[#d83819] shadow-2xs'
                    : 'bg-[#E5E0D5]/60 text-[#938E85] cursor-not-allowed'
                }`}
                title="Send query turn"
              >
                <span>Send</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>

          {/* Prompt Pills: Clean Horizontal Flex Layout Below Input */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#938E85] shrink-0">
              Quick Prompts:
            </span>
            {recommendedPrompts.map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onSelectPrompt(prompt)}
                className="whitespace-nowrap px-3 py-1.5 rounded-lg bg-[#FFFFFF] hover:bg-[#F6F3EC] border border-[#E5E0D5] text-[11px] text-[#78736B] hover:text-[#181716] transition-colors shadow-2xs shrink-0"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
