/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FeedbackLog, RealtimeAnomalyAlert } from '../types';

export const INCOMING_STREAM_TEMPLATES: Array<Omit<FeedbackLog, 'id' | 'date' | 'time'>> = [
  {
    rating: 1,
    text: 'Urgent: South Bay dark store staging bay 3B refrigerator shut off again. Received 4 tubs of melted Häagen-Dazs ice cream and sour cream.',
    storeId: 'Store #14 - South Bay',
    category: 'Frozen & Ice Cream',
    slaStatus: 'Delayed (15-20m)',
    stagingDwellMinutes: 19.2,
    telemetryNote: 'Live Anomaly: Bay 3B Thermal Sensor 28.6°C - Defrost compressor failure',
    defectType: 'Operational Defect',
    customerType: 'High LTV',
    audioDurationSeconds: 31,
  },
  {
    rating: 1,
    text: 'Chatbot closed my inquiry without resolution. Order took 48 minutes, rider abandoned the bag in lobby puddle, and chatbot deducted 100% cancellation fee.',
    storeId: 'Store #08 - Downtown North',
    category: 'Customer Support',
    slaStatus: 'Breached (>20m)',
    stagingDwellMinutes: 24.0,
    telemetryNote: 'Live Anomaly: Support Intent Loop #4902 - Forced Policy Deduction',
    defectType: 'App Bug',
    customerType: 'VIP Club',
    audioDurationSeconds: 22,
  },
  {
    rating: 2,
    text: 'Sourdough bread and croissants were crushed flat under two 1.5L sparkling mineral water bottles. Packaging standards in East River need immediate inspection.',
    storeId: 'Store #22 - East River',
    category: 'Bakery',
    slaStatus: 'Delayed (15-20m)',
    stagingDwellMinutes: 11.0,
    telemetryNote: 'Packing Station Warning: Heavy item stacked directly over delicate bakery SKU',
    defectType: 'Operational Defect',
    customerType: 'Standard',
  },
  {
    rating: 5,
    text: 'Incredible delivery! Arrived in 7 minutes flat. Fresh raspberries and cold oat milk in pristine thermal sleeve.',
    storeId: 'Store #03 - West End',
    category: 'Fresh Produce',
    slaStatus: 'On-Time (<12m)',
    stagingDwellMinutes: 1.8,
    telemetryNote: 'Live Telemetry: Pick time 1.1m, transit 5.9m. Cold pack intact.',
    defectType: undefined,
    customerType: 'High LTV',
  },
  {
    rating: 1,
    text: 'Payment went through twice on Apple Pay, but the app shows "Order Failed". Unable to reach human support, bot keeps asking for order ID which does not exist!',
    storeId: 'Store #08 - Downtown North',
    category: 'App & Checkout',
    slaStatus: 'On-Time (<12m)',
    stagingDwellMinutes: 0.0,
    telemetryNote: 'Payment Webhook 504 Timeout: Double debit lock detected on checkout engine',
    defectType: 'App Bug',
    customerType: 'New User',
  },
  {
    rating: 4,
    text: 'Quick 11-minute delivery for dinner ingredients. Fresh basil and tomatoes in good condition.',
    storeId: 'Store #19 - Midtown Hub',
    category: 'Fresh Produce',
    slaStatus: 'On-Time (<12m)',
    stagingDwellMinutes: 3.2,
    telemetryNote: 'Nominal dispatch: 3.2m staging dwell time',
    defectType: undefined,
    customerType: 'Standard',
  },
];

let streamCounter = 9000;

export function generateNextStreamLog(overrideStoreId?: string): { log: FeedbackLog; alert?: RealtimeAnomalyAlert } {
  streamCounter++;
  const template = overrideStoreId
    ? INCOMING_STREAM_TEMPLATES.find((t) => t.storeId === overrideStoreId) || INCOMING_STREAM_TEMPLATES[0]
    : INCOMING_STREAM_TEMPLATES[Math.floor(Math.random() * INCOMING_STREAM_TEMPLATES.length)];
  const now = new Date();
  const timeStr = now.toTimeString().slice(0, 5);
  const dateStr = now.toISOString().slice(0, 10);
  const id = `#QK-${streamCounter}`;

  const log: FeedbackLog = {
    ...template,
    id,
    storeId: overrideStoreId || template.storeId,
    date: dateStr,
    time: timeStr,
  };

  let alert: RealtimeAnomalyAlert | undefined;
  if (log.rating === 1 && (log.category === 'Frozen & Ice Cream' || log.category === 'Customer Support' || log.category === 'Dairy' || log.category === 'App & Checkout')) {
    alert = {
      id: `alert-${Date.now()}`,
      timestamp: timeStr,
      storeId: log.storeId,
      severity: 'CRITICAL',
      title: log.category === 'Frozen & Ice Cream' || log.category === 'Dairy' 
        ? 'Thermal Spoilage Anomaly Detected'
        : log.category === 'Customer Support' 
        ? 'Support Chatbot Dispute Escalation'
        : 'Payment Gateway 504 Failure',
      summary: log.text.slice(0, 95) + '...',
      category: log.category,
      relatedTicketId: id,
    };
  }

  return { log, alert };
}
