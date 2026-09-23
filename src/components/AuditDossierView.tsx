/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { FeedbackLog } from '../types';
import { FileCheck2, Download, Search, Filter, ShieldCheck, ExternalLink, Volume2, Store } from 'lucide-react';

interface AuditDossierViewProps {
  logs: FeedbackLog[];
  onSelectTicket?: (log: FeedbackLog) => void;
}

export function exportToCSV(logs: FeedbackLog[], filename = 'tether_voc_dossier.csv') {
  const headers = ['id', 'rating', 'storeId', 'category', 'slaStatus', 'date', 'time', 'telemetryNote', 'text'];
  const csvRows = [headers.join(',')];

  logs.forEach((l) => {
    const row = [
      `"${l.id}"`,
      l.rating,
      `"${l.storeId}"`,
      `"${l.category}"`,
      `"${l.slaStatus}"`,
      `"${l.date}"`,
      `"${l.time || ''}"`,
      `"${(l.telemetryNote || '').replace(/"/g, '""')}"`,
      `"${l.text.replace(/"/g, '""')}"`,
    ];
    csvRows.push(row.join(','));
  });

  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export const AuditDossierView: React.FC<AuditDossierViewProps> = ({ logs, onSelectTicket }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [ratingFilter, setRatingFilter] = useState<number | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const availableCategories = React.useMemo(() => {
    return Array.from(new Set(logs.map((l) => l.category).filter(Boolean))).sort();
  }, [logs]);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.storeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.telemetryNote || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRating = ratingFilter === 'all' || log.rating === ratingFilter;
    const matchesCategory = categoryFilter === 'all' || log.category === categoryFilter;

    return matchesSearch && matchesRating && matchesCategory;
  });

  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6 bg-[#FCF9F2]">
      {/* Header */}
      <div className="pb-4 border-b border-[#E5E0D5] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FileCheck2 className="w-4 h-4 text-[#EE4322]" />
            <span className="font-mono text-xs uppercase tracking-wider text-[#78736B]">
              Regulatory & Customer Evidence Base
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[#181716] tracking-tight">
            Audit Dossier & Sensor Telemetry Ledger
          </h1>
        </div>

        <button
          onClick={() => exportToCSV(filteredLogs)}
          className="flex items-center gap-2 text-xs font-semibold px-4 py-2 bg-[#181716] hover:bg-[#2c2a28] text-[#FFFFFF] rounded-lg transition-colors shadow-2xs self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5 text-[#EE4322]" />
          <span>Export Filtered VoC (.CSV)</span>
        </button>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-[#FFFFFF] border border-[#E5E0D5] rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-2xs">
        <div className="flex-1 min-w-[240px] flex items-center gap-2">
          <Search className="w-4 h-4 text-[#938E85]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search logs by keyword, ticket ID, store, or sensor note..."
            className="flex-1 text-xs text-[#181716] bg-transparent border-0 focus:outline-hidden placeholder:text-[#938E85]"
          />
        </div>

        <div className="flex items-center gap-3">
          {/* Rating filter */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-[#938E85] font-mono text-[10px] uppercase">Rating:</span>
            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="bg-[#F6F3EC] border border-[#E5E0D5] rounded-md px-2 py-1 text-xs font-mono text-[#181716]"
            >
              <option value="all">All Stars</option>
              <option value="1">1 Star Only</option>
              <option value="2">2 Stars Only</option>
              <option value="3">3 Stars Only</option>
              <option value="4">4 Stars Only</option>
              <option value="5">5 Stars Only</option>
            </select>
          </div>

          {/* Category filter */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-[#938E85] font-mono text-[10px] uppercase">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-[#F6F3EC] border border-[#E5E0D5] rounded-md px-2 py-1 text-xs text-[#181716]"
            >
              <option value="all">All Categories ({logs.length})</option>
              {availableCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Search Result Count */}
      <div className="flex items-center justify-between text-xs font-mono text-[#78736B]">
        <span>
          MATCHING RECORDS: <strong className="text-[#181716]">{filteredLogs.length} voices</strong>
        </span>
        <span className="flex items-center gap-1 text-[#4A5D4E]">
          <ShieldCheck className="w-3.5 h-3.5" />
          CRYPTOGRAPHICALLY LINKED TO DARK STORE HUBS
        </span>
      </div>

      {/* Main Table */}
      <div className="bg-[#FFFFFF] border border-[#E5E0D5] rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F6F3EC] border-b border-[#E5E0D5] text-[#938E85] font-mono text-[10px] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Ticket</th>
                <th className="py-3 px-4">Rating</th>
                <th className="py-3 px-4">Dark Store</th>
                <th className="py-3 px-4">SLA Delivery</th>
                <th className="py-3 px-4">Customer Voice Quote</th>
                <th className="py-3 px-4">Telemetry Sensor Note</th>
                <th className="py-3 px-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E0D5]">
              {filteredLogs.map((log) => (
                <tr
                  key={log.id}
                  onClick={() => onSelectTicket?.(log)}
                  className="hover:bg-[#F6F3EC]/70 cursor-pointer transition-colors group"
                >
                  <td className="py-3 px-4 font-mono font-bold text-[#181716] whitespace-nowrap group-hover:text-[#EE4322]">
                    [{log.id}]
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap font-mono font-bold">
                    <span className={log.rating <= 2 ? 'text-[#EE4322]' : 'text-[#4A5D4E]'}>
                      {log.rating}★
                    </span>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap text-[#78736B] font-medium font-sans">
                    {log.storeId}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px]">
                    <span className={log.slaStatus.includes('Breached') ? 'text-[#EE4322] font-semibold' : 'text-[#181716]'}>
                      {log.slaStatus}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-[#181716] font-serif italic max-w-sm truncate">
                    "{log.text}"
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-[#78736B] max-w-xs truncate">
                    {log.telemetryNote || 'Standard telemetry recorded'}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-[#938E85]">
                    {log.date} {log.time ? `· ${log.time}` : ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
