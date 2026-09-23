/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { UserProfile, AnalysisHistoryItem } from '../types';

export const DEFAULT_PROFILES: UserProfile[] = [
  {
    id: 'user-alex',
    name: 'Alex Mercer',
    email: 'alex.mercer@quickcommerce.internal',
    role: 'Dark Store Ops Lead',
    avatarInitials: 'AM',
    savedPrompts: [
      'Analyze Bay 3B dairy & gelato thermal dwell times > 15 mins.',
      'Identify packing stations with highest broken bottle leak rates.',
      'Audit Store #14 evening peak delivery SLA breaches.',
    ],
    analysisHistory: [
      {
        id: 'hist-1',
        query: 'Analyze top systemic friction points destroying CSAT in 1-2 star reviews.',
        timestamp: 'Today, 20:45',
        matchedCount: 21,
        csatSnapshot: 1.9,
        topStore: 'Store #14 - South Bay',
      },
      {
        id: 'hist-2',
        query: 'Identify thermal spoilage and packaging leak patterns across Dark Stores.',
        timestamp: 'Today, 19:15',
        matchedCount: 14,
        csatSnapshot: 2.1,
        topStore: 'Store #14 - South Bay',
      },
    ],
    dashboardConfig: {
      pinnedStore: 'Store #14 - South Bay',
      alertThresholdHours: 18,
      streamSpeed: '1x',
      enableSoundAlerts: true,
      favoriteCategories: ['Dairy', 'Frozen & Ice Cream', 'Packaging & Bags'],
    },
  },
  {
    id: 'user-elena',
    name: 'Elena Rostova',
    email: 'elena.rostova@quickcommerce.internal',
    role: 'VP of Customer Experience',
    avatarInitials: 'ER',
    savedPrompts: [
      'Quantify revenue bleed and LTV drop from logistics vs product quality issues.',
      'Audit chatbot refund denials triggering credit card chargebacks.',
      'Track 100% cancellation penalty complaints during courier delays.',
    ],
    analysisHistory: [
      {
        id: 'hist-3',
        query: 'Quantify revenue bleed and LTV drop from logistics vs product quality issues.',
        timestamp: 'Yesterday, 17:30',
        matchedCount: 26,
        csatSnapshot: 2.3,
        topStore: 'Store #08 - Downtown North',
      },
    ],
    dashboardConfig: {
      pinnedStore: 'All Dark Stores',
      alertThresholdHours: 19,
      streamSpeed: '1x',
      enableSoundAlerts: false,
      favoriteCategories: ['Customer Support', 'App & Checkout'],
    },
  },
];

const STORAGE_KEY_PROFILES = 'tether_voc_user_profiles_v1';
const STORAGE_KEY_ACTIVE_ID = 'tether_voc_active_user_id_v1';

export function loadUserProfiles(): UserProfile[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PROFILES);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Failed to load profiles from storage', e);
  }
  return DEFAULT_PROFILES;
}

export function saveUserProfiles(profiles: UserProfile[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_PROFILES, JSON.stringify(profiles));
  } catch (e) {
    console.warn('Failed to save profiles to storage', e);
  }
}

export function getActiveUserId(): string {
  try {
    return localStorage.getItem(STORAGE_KEY_ACTIVE_ID) || DEFAULT_PROFILES[0].id;
  } catch {
    return DEFAULT_PROFILES[0].id;
  }
}

export function setActiveUserId(id: string): void {
  try {
    localStorage.setItem(STORAGE_KEY_ACTIVE_ID, id);
  } catch (e) {
    console.warn('Failed to save active user id', e);
  }
}

export function saveAnalysisHistoryItem(
  userId: string,
  item: {
    query: string;
    matchedCount: number;
    csatSnapshot: number;
    topStore: string;
  }
): void {
  const profiles = loadUserProfiles();
  const updatedProfiles = profiles.map((p) => {
    if (p.id === userId) {
      const newItem: AnalysisHistoryItem = {
        id: `hist-${Date.now()}`,
        query: item.query,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        matchedCount: item.matchedCount,
        csatSnapshot: item.csatSnapshot,
        topStore: item.topStore,
      };
      return {
        ...p,
        analysisHistory: [newItem, ...(p.analysisHistory || []).slice(0, 19)],
      };
    }
    return p;
  });
  saveUserProfiles(updatedProfiles);
}
