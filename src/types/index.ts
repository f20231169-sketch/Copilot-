/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface FeedbackLog {
  id: string; // Ticket / Review ID (e.g. #QK-8401 or UUID)
  rating: number; // 1 to 5
  text: string; // Exact customer voice quote
  date: string; // YYYY-MM-DD or ISO
  time?: string; // HH:mm
  storeId: string; // e.g. "Store #14 - South Bay" or location/channel
  category: string; // e.g. "Dairy", "Billing", "Support", etc.
  slaStatus: string; // e.g. "Breached (>20m)", "Delayed (15-20m)", "On-Time (<12m)", etc.
  stagingDwellMinutes?: number;
  telemetryNote?: string; // e.g. "Unrefrigerated Staging Bay - Dwell time 14.0 mins"
  defectType?: string; // e.g. "App Bug" | "Operational Defect" | "Logistics SLA"
  customerType?: string; // e.g. "High LTV" | "Standard"
  audioDurationSeconds?: number;
  isDuplicate?: boolean;
  duplicateOfId?: string;
  sourceFile?: string;
}

export interface ThemeCluster {
  id: string;
  title: string;
  insight: string;
  sentimentScore: number; // -1.0 to 1.0
  averageRating: number; // 1.0 - 5.0
  riskLevel: 'CRITICAL' | 'HIGH' | 'ELEVATED' | 'MODERATE';
  groundednessScore: number; // e.g. 96 (%)
  impactRating: 'High' | 'Critical' | 'Medium';
  matchingLogIds: string[];
  sampleQuote: string;
  topStore: string;
  attributedRevenueBleed: string; // e.g. "$42,800"
  keywords: string[];
}

export interface GroundingSource {
  uri: string;
  title: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: string;
  queryIntent?: string;
  matchedLogsCount?: number;
  highlightThemeIds?: string[];
  attachedFile?: {
    name: string;
    rowCount: number;
  };
  groundingSources?: GroundingSource[];
  searchQueries?: string[];
}

export interface AnalysisHistoryItem {
  id: string;
  query: string;
  timestamp: string;
  matchedCount: number;
  csatSnapshot: number;
  topStore: string;
}

export interface DashboardConfig {
  pinnedStore: string;
  alertThresholdHours: number;
  streamSpeed: '1x' | '5x' | 'paused';
  enableSoundAlerts: boolean;
  favoriteCategories: string[];
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'Dark Store Ops Lead' | 'VP of Customer Experience' | 'Logistics Director' | 'Product Quality Analyst';
  avatarInitials: string;
  savedPrompts: string[];
  analysisHistory: AnalysisHistoryItem[];
  dashboardConfig: DashboardConfig;
}

export interface RealtimeAnomalyAlert {
  id: string;
  timestamp: string;
  storeId: string;
  severity: 'CRITICAL' | 'HIGH' | 'ELEVATED';
  title: string;
  summary: string;
  category: string;
  relatedTicketId: string;
}

export type ViewTab = 'ingress' | 'dashboard' | 'trends' | 'dedup' | 'defects' | 'audit' | 'profile';
