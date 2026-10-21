import React, { useState, useMemo } from 'react';
import { DeviceRepairTicket, TicketStatus, DeviceCategory } from '../types/repair';
import { Language, translations } from '../lib/i18n';
import { 
  Search, 
  Smartphone, 
  Laptop, 
  Tablet, 
  Sparkles, 
  FileText, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Layers,
  Phone,
  Hash,
} from 'lucide-react';

interface WorkbenchProps {
  tickets: DeviceRepairTicket[];
  onUpdateTicketStatus: (ticketId: string, status: TicketStatus) => void;
  onOpenNewTicket: () => void;
  onSelectTicketForDiag: (ticket: DeviceRepairTicket) => void;
  onViewPassport: (ticket: DeviceRepairTicket) => void;
  lang: Language;
}

export const Workbench: React.FC<WorkbenchProps> = ({
  tickets,
  onUpdateTicketStatus,
  onOpenNewTicket,
  onSelectTicketForDiag,
  onViewPassport,
  lang,
}) => {
  const t = translations[lang];

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<DeviceCategory>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // KPI Calculations
  const metrics = useMemo(() => {
    const total = tickets.length;
    const underDiag = tickets.filter((tk) => tk.status === 'under_diagnosis' || tk.status === 'pending_repair').length;
    const waitingParts = tickets.filter((tk) => tk.status === 'waiting_component').length;
    const repaired = tickets.filter((tk) => tk.status === 'repaired' || tk.status === 'testing' || tk.status === 'delivered').length;
    return { total, underDiag, waitingParts, repaired };
  }, [tickets]);

  // Filtered tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter((tk) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        tk.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tk.modelName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tk.serialOrImei.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tk.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === 'all' || tk.category === selectedCategory;

      const matchesStatus =
        selectedStatus === 'all' || tk.status === selectedStatus;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [tickets, searchQuery, selectedCategory, selectedStatus]);

  const getStatusBadge = (status: TicketStatus) => {
    switch (status) {
      case 'received':
        return { label: t.status.received, color: 'text-slate-300 bg-slate-800/80 border-slate-700' };
      case 'pending_repair':
        return { label: 'در انتظار تعمیر', color: 'text-amber-400 bg-amber-950/40 border-amber-800/60' };
      case 'under_diagnosis':
        return { label: t.status.under_diagnosis, color: 'text-amber-400 bg-amber-950/40 border-amber-800/60' };
      case 'waiting_component':
        return { label: t.status.waiting_component, color: 'text-rose-400 bg-rose-950/40 border-rose-800/60' };
      case 'testing':
        return { label: t.status.testing, color: 'text-sky-400 bg-sky-950/40 border-sky-800/60' };
      case 'repaired':
        return { label: t.status.repaired, color: 'text-emerald-400 bg-emerald-950/40 border-emerald-800/60' };
      case 'delivered':
        return { label: t.status.delivered, color: 'text-neutral-400 bg-neutral-900 border-neutral-700' };
      default:
        return { label: status, color: 'text-slate-400 bg-slate-900 border-slate-800' };
    }
  };

  const getDeviceIcon = (category: string) => {
    switch (category) {
      case 'laptop':
        return <Laptop className="w-4 h-4 text-sky-400 shrink-0" />;
      case 'tablet':
        return <Tablet className="w-4 h-4 text-purple-400 shrink-0" />;
      default:
        return <Smartphone className="w-4 h-4 text-amber-400 shrink-0" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Workbench Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            {t.workbench.title}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {t.workbench.subtitle}
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenNewTicket}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-sm transition-colors whitespace-nowrap self-start md:self-auto cursor-pointer"
        >
          <span>{t.workbench.newTicketBtn}</span>
        </button>
      </div>

      {/* KPI Stat Cards (Tabular figures, Single-elevation depth) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>{t.workbench.totalActive}</span>
            <Layers className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-white">
            {metrics.total}
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-amber-400 mb-1">
            <span>{t.workbench.underDiag}</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-amber-400">
            {metrics.underDiag}
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-rose-400 mb-1">
            <span>{t.workbench.waitingParts}</span>
            <Clock className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-rose-400">
            {metrics.waitingParts}
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-emerald-400 mb-1">
            <span>{t.workbench.repairedCount}</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-emerald-400">
            {metrics.repaired}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-3 sm:p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.workbench.searchPlaceholder}
            className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg py-2 ps-9 pe-3 text-xs text-slate-100 placeholder:text-slate-500 outline-none transition-colors"
          />
        </div>

        {/* Category Segmented Buttons */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 overflow-x-auto">
          {(['all', 'smartphone', 'laptop', 'tablet'] as DeviceCategory[]).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t.categories[cat]}
            </button>
          ))}
        </div>

        {/* Status Dropdown Filter */}
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-lg px-3 py-2 outline-none focus:border-amber-500 cursor-pointer"
        >
          <option value="all">{t.workbench.filterAll}</option>
          <option value="received">{t.status.received}</option>
          <option value="under_diagnosis">{t.status.under_diagnosis}</option>
          <option value="waiting_component">{t.status.waiting_component}</option>
          <option value="testing">{t.status.testing}</option>
          <option value="repaired">{t.status.repaired}</option>
          <option value="delivered">{t.status.delivered}</option>
        </select>
      </div>

      {/* High-Density Tickets Table */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-medium">
                <th className="py-3 px-4 text-start">{t.workbench.tableHeaders.ticketNo}</th>
                <th className="py-3 px-4 text-start">{t.workbench.tableHeaders.device}</th>
                <th className="py-3 px-4 text-start">{t.workbench.tableHeaders.customer}</th>
                <th className="py-3 px-4 text-start">{t.workbench.tableHeaders.symptoms}</th>
                <th className="py-3 px-4 text-start">{t.workbench.tableHeaders.status}</th>
                <th className="py-3 px-4 text-start">{t.workbench.tableHeaders.date}</th>
                <th className="py-3 px-4 text-center">{t.workbench.tableHeaders.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredTickets.length > 0 ? (
                filteredTickets.map((ticket) => {
                  const statusInfo = getStatusBadge(ticket.status);
                  return (
                    <tr
                      key={ticket.id}
                      className="hover:bg-slate-800/30 transition-colors group"
                    >
                      {/* Ticket # */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-mono font-semibold text-amber-400">
                          {ticket.ticketNumber}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {ticket.serialOrImei ? `IMEI: ${ticket.serialOrImei.slice(-6)}` : ''}
                        </div>
                      </td>

                      {/* Device & Model */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {getDeviceIcon(ticket.category)}
                          <div className="font-medium text-slate-100 whitespace-nowrap">
                            {ticket.modelName}
                          </div>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {ticket.brand} · {t.categories[ticket.category]}
                        </div>
                      </td>

                      {/* Customer & Phone */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="text-slate-200 font-medium">{ticket.customerName}</div>
                        <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-600" />
                          <span>{ticket.customerPhone}</span>
                        </div>
                      </td>

                      {/* Symptoms */}
                      <td className="py-3 px-4 max-w-xs">
                        <div className="text-slate-300 truncate" title={ticket.symptoms.join(' · ')}>
                          {ticket.symptoms[0] || '—'}
                        </div>
                        {ticket.currentConsumptionAmp !== undefined && ticket.currentConsumptionAmp > 0 && (
                          <div className="text-[11px] font-mono tabular-nums text-amber-400/90 mt-0.5">
                            DC Draw: {ticket.currentConsumptionAmp}A
                          </div>
                        )}
                      </td>

                      {/* Status with quick selector */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <select
                          value={ticket.status}
                          onChange={(e) => onUpdateTicketStatus(ticket.id, e.target.value as TicketStatus)}
                          className={`text-[11px] font-medium px-2 py-1 rounded-md border cursor-pointer outline-none ${statusInfo.color}`}
                        >
                          <option value="received">{t.status.received}</option>
                          <option value="under_diagnosis">{t.status.under_diagnosis}</option>
                          <option value="waiting_component">{t.status.waiting_component}</option>
                          <option value="testing">{t.status.testing}</option>
                          <option value="repaired">{t.status.repaired}</option>
                          <option value="delivered">{t.status.delivered}</option>
                        </select>
                      </td>

                      {/* Date */}
                      <td className="py-3 px-4 whitespace-nowrap font-mono tabular-nums text-slate-400 text-[11px]">
                        {ticket.createdAt}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onSelectTicketForDiag(ticket)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-md transition-colors cursor-pointer"
                            title={t.workbench.quickDiagnose}
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>{t.workbench.quickDiagnose}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => onViewPassport(ticket)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md transition-colors cursor-pointer"
                            title={t.workbench.viewPassport}
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>{t.workbench.viewPassport}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 text-xs">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Hash className="w-8 h-8 text-slate-600 stroke-1" />
                      <span>{t.workbench.emptyState}</span>
                      <button
                        type="button"
                        onClick={onOpenNewTicket}
                        className="mt-2 text-amber-400 hover:text-amber-300 font-medium underline underline-offset-4 cursor-pointer"
                      >
                        {t.workbench.newTicketBtn}
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
