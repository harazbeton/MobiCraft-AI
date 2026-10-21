import React, { useState } from 'react';
import { CustomerProfile, DeviceRepairTicket } from '../types/repair';
import { Language, translations } from '../lib/i18n';
import {
  Sparkles,
  Send,
  Bot,
  User,
  CheckCircle,
  Clock,
  SendHorizontal,
  MessageSquare,
  Smartphone,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';

interface AiCopilotChatProps {
  customers: CustomerProfile[];
  onAddTicket: (ticket: DeviceRepairTicket) => void;
  onAddCustomer?: (customer: CustomerProfile) => void;
  onSelectTicketForRepair?: (ticketId: string) => void;
  lang: Language;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: string;
  matchedCustomer?: CustomerProfile;
  createdTicket?: DeviceRepairTicket;
  suggestedSteps?: string[];
}

export const AiCopilotChat: React.FC<AiCopilotChatProps> = ({
  customers,
  onAddTicket,
  onAddCustomer,
  onSelectTicketForRepair,
  lang,
}) => {
  const t = translations[lang];

  const defaultSamplePrompt =
    'گوشی سامسونگ آ53 با مشکل خاموشی و عدم جریان مصرفی با رنگ مشکی و شماره سریال 32325236523 از آقای علی اکبری تحویل گردید.';

  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm-0',
      sender: 'agent',
      text: 'سلام! من دستیار هوشمند و پذیرش کارگاه MobiCraft هستم. می‌توانید پذیرش دستگاه‌ها را به زبان طبیعی به من بگویید، مثلاً نام مشتری، مدل گوشی یا لپ‌تاپ و مشکل آن را مطرح کنید تا سابقه مشتری را بررسی، رسید را صادر و چک‌لیست ولتاژگیری بردویو سه‌بعدی را آماده کنم.',
      timestamp: 'همین الان',
    },
  ]);

  const [simulatedDispatchChannel, setSimulatedDispatchChannel] = useState<'sms' | 'whatsapp' | 'telegram'>('whatsapp');

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `m-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setLoading(true);

    try {
      const res = await fetch('/api/agent/parse-intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, lang }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        const data = json.data;

        // Check if customer exists in our database
        const existingCust = customers.find(
          (c) =>
            c.name.includes(data.customerName) ||
            data.customerName.includes(c.name.split(' ')[0])
        );

        const newTicketNumber = `MC-${24090 + Math.floor(Math.random() * 100)}`;
        const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);

        const newTicket: DeviceRepairTicket = {
          id: `t-${Date.now()}`,
          ticketNumber: newTicketNumber,
          category: 'smartphone',
          brand: data.brand || 'Samsung',
          modelName: data.modelName || 'Samsung Galaxy A53 5G',
          deviceColor: data.deviceColor || 'مشکی',
          serialOrImei: data.serialOrImei || '32325236523',
          customerName: existingCust ? existingCust.name : data.customerName,
          customerPhone: existingCust ? existingCust.phone : data.customerPhone || '09123456789',
          customerNationalId: existingCust ? existingCust.nationalId : data.customerNationalId || '0019842512',
          lockType: 'pattern',
          symptoms: data.symptoms || ['خاموشی کامل', 'عدم جریان مصرفی'],
          intakeCondition: {
            powersOn: false,
            displayCracked: false,
            liquidDamaged: false,
            missingScrews: false,
            batterySwollen: false,
            priorRepairAttempt: false,
          },
          status: 'pending_repair',
          currentConsumptionAmp: data.initialCurrentAmp || 0.0,
          createdAt: nowStr,
          updatedAt: nowStr,
          estimatedCost: 850000,
          paymentStatus: 'unpaid',
          dispatchedReceipt: {
            channel: simulatedDispatchChannel,
            sentAt: nowStr,
            trackingUrl: `https://mobicraft.ir/track/${newTicketNumber}`,
          },
          timeline: [
            {
              id: `tl-${Date.now()}-1`,
              timestamp: nowStr,
              title: 'پذیرش هوشمند با ایجنت دستیار',
              description: `دستگاه توسط کارشناس در چت هوش مصنوعی ثبت شد. رسید دیجیتال به ${simulatedDispatchChannel.toUpperCase()} مشتری ارسال گردید.`,
              actor: 'system',
              type: 'intake',
            },
            ...(existingCust
              ? [
                  {
                    id: `tl-${Date.now()}-2`,
                    timestamp: nowStr,
                    title: 'انطباق سوابق مشتری قدیمی',
                    description: `مشتری با کدملی ${existingCust.nationalId} شناسایی شد (${existingCust.totalVisits} مراجعه قبلی ثبت است).`,
                    actor: 'system' as const,
                    type: 'dispatch' as const,
                  },
                ]
              : []),
          ],
        };

        // Add ticket to system state
        onAddTicket(newTicket);

        const agentMsg: ChatMessage = {
          id: `m-agent-${Date.now()}`,
          sender: 'agent',
          text: data.agentReply || 'اطلاعات با موفقیت دریافت و دستگاه در میز در انتظار تعمیر ثبت شد.',
          timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
          matchedCustomer: existingCust,
          createdTicket: newTicket,
          suggestedSteps: data.suggestedWorkflow,
        };

        setMessages((prev) => [...prev, agentMsg]);
      }
    } catch (err) {
      console.error('Agent chat error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden flex flex-col h-[520px] shadow-xl">
      {/* Header */}
      <div className="px-4 py-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>MobiCraft AI Copilot</span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 px-1.5 py-0.2 rounded border border-emerald-800/40">
                ACTIVE
              </span>
            </div>
            <div className="text-[10px] text-slate-400">دستیار تعاملی پذیرش، تطبیق سوابق و عیب‌یابی مدار</div>
          </div>
        </div>

        {/* Dispatch Channel Indicator */}
        <div className="flex items-center gap-1 text-[11px] text-slate-400">
          <span>ارسال رسید به:</span>
          <select
            value={simulatedDispatchChannel}
            onChange={(e) => setSimulatedDispatchChannel(e.target.value as any)}
            className="bg-slate-950 border border-slate-800 rounded px-2 py-0.5 text-[11px] text-amber-400 outline-none"
          >
            <option value="whatsapp">WhatsApp</option>
            <option value="telegram">Telegram</option>
            <option value="sms">پیامک (SMS)</option>
          </select>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-2.5 ${
              msg.sender === 'user' ? 'flex-row-reverse' : ''
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                msg.sender === 'user'
                  ? 'bg-amber-400 text-slate-950 font-bold text-[10px]'
                  : 'bg-slate-800 text-amber-400'
              }`}
            >
              {msg.sender === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
            </div>

            <div
              className={`max-w-[85%] rounded-2xl p-3.5 space-y-2.5 ${
                msg.sender === 'user'
                  ? 'bg-amber-500 text-slate-950 font-medium rounded-tr-none'
                  : 'bg-slate-950/90 border border-slate-800 text-slate-200 rounded-tl-none'
              }`}
            >
              <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>

              {/* Matched Customer Box */}
              {msg.matchedCustomer && (
                <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl space-y-1.5 text-[11px]">
                  <div className="flex items-center justify-between text-amber-400 font-semibold">
                    <span>مشتری شناسایی شد: {msg.matchedCustomer.name}</span>
                    <span className="font-mono text-slate-400">کدملی: {msg.matchedCustomer.nationalId}</span>
                  </div>
                  <div className="text-slate-300">
                    تعداد مراجعات قبلی: <strong className="text-white">{msg.matchedCustomer.totalVisits} بار</strong>
                  </div>
                  {/* Previous Visits Timeline */}
                  <div className="pt-1 border-t border-slate-800/80 space-y-1">
                    <div className="text-slate-400 font-medium">سوابق تعمیرات گذشته:</div>
                    {msg.matchedCustomer.pastRepairs.map((rep, idx) => (
                      <div key={idx} className="flex items-center justify-between text-slate-400 font-mono text-[10px]">
                        <span>· {rep.date}: {rep.deviceModel} ({rep.issue})</span>
                        <span className="text-emerald-400">{rep.cost.toLocaleString('fa-IR')} ت</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Created Ticket Card */}
              {msg.createdTicket && (
                <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl space-y-2 text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-400 font-mono">
                      {msg.createdTicket.ticketNumber}
                    </span>
                    <span className="text-[10px] text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
                      افزوده شد به: در انتظار تعمیر
                    </span>
                  </div>
                  <div className="text-slate-200">
                    {msg.createdTicket.brand} {msg.createdTicket.modelName} — رنگ {msg.createdTicket.deviceColor}
                  </div>
                  <div className="text-slate-400 font-mono text-[10px]">
                    سریال: {msg.createdTicket.serialOrImei}
                  </div>

                  {/* Dispatched SMS / Telegram notification badge */}
                  <div className="flex items-center gap-1.5 text-[10px] text-cyan-400 pt-1 border-t border-slate-800">
                    <CheckCircle className="w-3.5 h-3.5 text-cyan-400" />
                    <span>
                      رسید دیجیتال به {msg.createdTicket.dispatchedReceipt?.channel.toUpperCase()} مشتری ارسال گردید.
                    </span>
                  </div>

                  {/* Probing 3D CTA */}
                  <button
                    type="button"
                    onClick={() => onSelectTicketForRepair?.(msg.createdTicket!.id)}
                    className="w-full mt-1.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-lg text-center transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>شروع ولتاژگیری سه‌بعدی و عیب‌یابی گام‌به‌گام</span>
                  </button>
                </div>
              )}

              {/* Suggested Step-by-Step Checklist */}
              {msg.suggestedSteps && msg.suggestedSteps.length > 0 && (
                <div className="pt-1.5 space-y-1 text-[11px]">
                  <div className="text-amber-400 font-semibold">اقدامات پیشنهادی عیب‌یابی:</div>
                  {msg.suggestedSteps.map((st, i) => (
                    <div key={i} className="text-slate-300 flex items-start gap-1.5">
                      <span className="text-amber-400">·</span>
                      <span>{st}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="text-[10px] opacity-70 text-end">{msg.timestamp}</div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-amber-400 animate-pulse p-2">
            <Sparkles className="w-4 h-4" />
            <span>در حال استخراج اطلاعات دستگاه، بررسی پرونده مشتری و صدور رسید...</span>
          </div>
        )}
      </div>

      {/* Quick Prompt Pill */}
      <div className="px-4 py-1.5 bg-slate-950/70 border-t border-slate-800/80 overflow-x-auto flex items-center gap-2">
        <span className="text-[10px] text-slate-400 shrink-0">سناریوی تستی آماده:</span>
        <button
          type="button"
          onClick={() => handleSendMessage(defaultSamplePrompt)}
          className="text-[11px] text-amber-300 hover:text-white bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-2.5 py-1 rounded-md transition-colors truncate max-w-md text-start shrink-0 cursor-pointer"
        >
          {defaultSamplePrompt}
        </button>
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2"
      >
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="مثال: گوشی سامسونگ آ53 با مشکل خاموشی از آقای علی اکبری تحویل شد..."
          className="flex-1 bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-xl py-2 px-3 text-xs text-slate-100 placeholder:text-slate-500 outline-none"
        />
        <button
          type="submit"
          disabled={!inputMessage.trim() || loading}
          className="p-2 bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-slate-950 rounded-xl transition-colors cursor-pointer"
        >
          <SendHorizontal className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
