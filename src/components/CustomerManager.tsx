import React, { useState } from 'react';
import { CustomerProfile, DeviceRepairTicket } from '../types/repair';
import { CustomerPortal } from './CustomerPortal';
import { Language, translations } from '../lib/i18n';
import {
  Users,
  UserCheck,
  UserPlus,
  Search,
  Phone,
  FileText,
  Clock,
  ExternalLink,
  MessageCircle,
  Send,
  Plus,
  ShieldCheck,
  History,
  CheckCircle,
} from 'lucide-react';

interface CustomerManagerProps {
  customers: CustomerProfile[];
  tickets: DeviceRepairTicket[];
  onAddCustomer: (customer: CustomerProfile) => void;
  onPayTicket: (ticketId: string) => void;
  lang: Language;
}

export const CustomerManager: React.FC<CustomerManagerProps> = ({
  customers,
  tickets,
  onAddCustomer,
  onPayTicket,
  lang,
}) => {
  const t = translations[lang];

  // Mode: 'crm' | 'portal_view'
  const [subMode, setSubMode] = useState<'crm' | 'portal_view'>('crm');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerProfile>(customers[0]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Customer Form State
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newNationalId, setNewNationalId] = useState('');
  const [newAddress, setNewAddress] = useState('');

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery) ||
      c.nationalId.includes(searchQuery)
  );

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newPhone || !newNationalId) return;

    const newCust: CustomerProfile = {
      id: `cust-${Date.now()}`,
      name: newName,
      phone: newPhone,
      nationalId: newNationalId,
      address: newAddress,
      totalVisits: 1,
      totalSpent: 0,
      createdAt: new Date().toISOString().slice(0, 10),
      pastRepairs: [],
    };

    onAddCustomer(newCust);
    setSelectedCustomer(newCust);
    setIsAddModalOpen(false);
    setNewName('');
    setNewPhone('');
    setNewNationalId('');
    setNewAddress('');
  };

  return (
    <div className="space-y-6">
      {/* Top Section Banner & Mode Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>مدیریت مشتریان و پورتال اختصاصی</span>
            <span className="text-xs font-mono font-medium text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
              CRM & Customer Portal
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            پروفایل هوشمند مراجعین، تایم‌لاین مراجعات، ارسال آنلاین رسید به پیام‌رسان‌ها و درگاه پرداخت اینترنتی
          </p>
        </div>

        {/* Sub-Mode Toggle */}
        <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setSubMode('crm')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
              subMode === 'crm'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>پرونده‌های مشتریان (کارگاه)</span>
          </button>

          <button
            type="button"
            onClick={() => setSubMode('portal_view')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
              subMode === 'portal_view'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>پورتال اختصاصی مشتری (رهگیری و پرداخت)</span>
          </button>
        </div>
      </div>

      {subMode === 'portal_view' ? (
        /* Render Customer Portal */
        <CustomerPortal
          customers={customers}
          tickets={tickets}
          onPayTicket={onPayTicket}
          lang={lang}
        />
      ) : (
        /* Render Workshop CRM & Customer Directory */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Customer Directory (4 Cols) */}
          <div className="lg:col-span-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">فهرست مراجعین ({customers.length})</span>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>مشتری جدید</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجو نام، کدملی یا شماره همراه..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 ps-8 pe-3 text-xs text-slate-100 outline-none"
              />
            </div>

            {/* Customer List */}
            <div className="space-y-2 max-h-[500px] overflow-y-auto pe-1">
              {filteredCustomers.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCustomer(c)}
                  className={`w-full text-start p-3 rounded-xl border text-xs transition-all cursor-pointer ${
                    selectedCustomer.id === c.id
                      ? 'bg-amber-500/10 border-amber-500/50 text-white'
                      : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-100">{c.name}</span>
                    <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                      {c.totalVisits} مراجعه
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono mt-1 flex items-center justify-between">
                    <span>{c.phone}</span>
                    <span>کدملی: {c.nationalId}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Right Column: Active Customer Profile & Timeline (8 Cols) */}
          <div className="lg:col-span-8 bg-slate-900/70 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-6">
            {/* Customer Profile Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold text-lg">
                  {selectedCustomer.name.slice(0, 1)}
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">{selectedCustomer.name}</h2>
                  <div className="text-xs text-slate-400 font-mono mt-0.5">
                    شماره همراه: {selectedCustomer.phone} · کد ملی: {selectedCustomer.nationalId}
                  </div>
                  {selectedCustomer.address && (
                    <div className="text-[11px] text-slate-500 mt-0.5">{selectedCustomer.address}</div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setSubMode('portal_view')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                  <span>نمایش در پورتال مشتری</span>
                </button>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                <div className="text-[11px] text-slate-400">تعداد دفعات مراجعه</div>
                <div className="text-xl font-bold font-mono text-white mt-0.5">
                  {selectedCustomer.totalVisits} بار
                </div>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                <div className="text-[11px] text-slate-400">مجموع تراکنش و پرداخت</div>
                <div className="text-xl font-bold font-mono text-emerald-400 mt-0.5 tabular-nums">
                  {selectedCustomer.totalSpent.toLocaleString('fa-IR')} ت
                </div>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                <div className="text-[11px] text-slate-400">عضویت در باشگاه کارگاه</div>
                <div className="text-xs font-bold text-amber-400 mt-1 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>تخفیف مشتری قدیمی</span>
                </div>
              </div>
            </div>

            {/* Past Repairs Timeline */}
            <div className="space-y-3">
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <History className="w-4 h-4 text-sky-400" />
                <span>تایم‌لاین پرونده‌ها و مراجعات گذشته:</span>
              </div>

              {selectedCustomer.pastRepairs.length > 0 ? (
                <div className="space-y-2">
                  {selectedCustomer.pastRepairs.map((rep, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-200">
                          {rep.deviceModel} — {rep.issue}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          تاریخ: {rep.date} · شماره قبض: {rep.ticketNumber}
                        </div>
                      </div>

                      <div className="text-end">
                        <div className="font-bold font-mono text-emerald-400 tabular-nums">
                          {rep.cost.toLocaleString('fa-IR')} تومان
                        </div>
                        <span className="text-[10px] text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800">
                          تحویل و تسویه شده
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-500 text-center">
                  سوابق قبلی برای این مشتری ثبت نشده است (مشتری جدید).
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add New Customer Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">ثبت پروفایل مشتری جدید</h3>
            <form onSubmit={handleCreateCustomer} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">نام و نام خانوادگی مشتری</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="علی اکبری"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-slate-100 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">شماره تلفن همراه (جهت ورود به پورتال)</label>
                <input
                  type="tel"
                  required
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="09121234567"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-slate-100 font-mono outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">کد ملی ۱۰ رقمی</label>
                <input
                  type="text"
                  required
                  value={newNationalId}
                  onChange={(e) => setNewNationalId(e.target.value)}
                  placeholder="0012345678"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-slate-100 font-mono outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">آدرس (اختیاری)</label>
                <input
                  type="text"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  placeholder="تهران، خیابان ولیعصر..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-slate-100 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl transition-colors cursor-pointer"
                >
                  ثبت پروفایل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
