/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { DeviceRepairTicket, TicketStatus } from './types/repair';
import { Language } from './lib/i18n';
import { INITIAL_TICKETS } from './data/sampleData';
import { Header } from './components/Header';
import { Workbench } from './components/Workbench';
import { DiagnosticStudio } from './components/DiagnosticStudio';
import { TrainingHub } from './components/TrainingHub';
import { NewTicketModal } from './components/NewTicketModal';
import { TicketDetailsModal } from './components/TicketDetailsModal';

export default function App() {
  const [lang, setLang] = useState<Language>('fa');
  const [currentTab, setCurrentTab] = useState<'workbench' | 'diagnostics' | 'training'>('workbench');

  // Persistence for tickets
  const [tickets, setTickets] = useState<DeviceRepairTicket[]>(() => {
    try {
      const saved = localStorage.getItem('mobicraft_tickets_v3');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load tickets from localStorage', e);
    }
    return INITIAL_TICKETS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('mobicraft_tickets_v3', JSON.stringify(tickets));
    } catch (e) {
      console.error('Failed to save tickets to localStorage', e);
    }
  }, [tickets]);

  // Sync document language and direction
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'fa' ? 'rtl' : 'ltr';
  }, [lang]);

  // Modal States
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
  const [selectedPassportTicket, setSelectedPassportTicket] = useState<DeviceRepairTicket | null>(null);

  // Quick Diagnostic Hand-off
  const [diagnosticParams, setDiagnosticParams] = useState<{
    deviceModel: string;
    reportedFault: string;
    currentAmp: number;
  }>({
    deviceModel: '',
    reportedFault: '',
    currentAmp: 0,
  });

  const handleUpdateTicketStatus = (ticketId: string, status: TicketStatus) => {
    setTickets((prev) =>
      prev.map((tk) =>
        tk.id === ticketId
          ? { ...tk, status, updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 16) }
          : tk
      )
    );
  };

  const handleCreateNewTicket = (
    data: Omit<DeviceRepairTicket, 'id' | 'ticketNumber' | 'createdAt' | 'updatedAt' | 'status'>
  ) => {
    const nextNum = 24090 + tickets.length + 1;
    const now = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const newTicket: DeviceRepairTicket = {
      ...data,
      id: `t-${Date.now()}`,
      ticketNumber: `MC-${nextNum}`,
      createdAt: now,
      updatedAt: now,
      status: 'received',
    };

    setTickets((prev) => [newTicket, ...prev]);
  };

  const handleSelectTicketForDiag = (ticket: DeviceRepairTicket) => {
    setDiagnosticParams({
      deviceModel: `${ticket.brand} ${ticket.modelName}`,
      reportedFault: ticket.symptoms.join(' · '),
      currentAmp: ticket.currentConsumptionAmp || 0,
    });
    setCurrentTab('diagnostics');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Bar Navigation */}
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        lang={lang}
        setLang={setLang}
        onOpenNewTicket={() => setIsNewTicketOpen(true)}
      />

      {/* Main Viewport Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {currentTab === 'workbench' && (
          <Workbench
            tickets={tickets}
            onUpdateTicketStatus={handleUpdateTicketStatus}
            onOpenNewTicket={() => setIsNewTicketOpen(true)}
            onSelectTicketForDiag={handleSelectTicketForDiag}
            onViewPassport={(tk) => setSelectedPassportTicket(tk)}
            lang={lang}
          />
        )}

        {currentTab === 'diagnostics' && (
          <DiagnosticStudio
            key={`${diagnosticParams.deviceModel}-${diagnosticParams.reportedFault}`}
            initialDeviceModel={diagnosticParams.deviceModel}
            initialFault={diagnosticParams.reportedFault}
            initialCurrentAmp={diagnosticParams.currentAmp}
            lang={lang}
          />
        )}

        {currentTab === 'training' && <TrainingHub lang={lang} />}
      </main>

      {/* Modals */}
      <NewTicketModal
        isOpen={isNewTicketOpen}
        onClose={() => setIsNewTicketOpen(false)}
        onSubmit={handleCreateNewTicket}
        lang={lang}
      />

      <TicketDetailsModal
        ticket={selectedPassportTicket}
        onClose={() => setSelectedPassportTicket(null)}
        lang={lang}
      />
    </div>
  );
}
