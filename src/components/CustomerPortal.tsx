import React, { useState } from 'react';
import { CustomerProfile, DeviceRepairTicket } from '../types/repair';
import { Language, translations } from '../lib/i18n';
import {
  User,
  Smartphone,
  CreditCard,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Download,
  Calendar,
  Lock,
  ArrowRight,
  LogOut,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';

interface CustomerPortalProps {
  customers: CustomerProfile[];
  tickets: DeviceRepairTicket[];
  onPayTicket?: (ticketId: string) => void;
  lang: Language;
}

export const CustomerPortal: React.FC<CustomerPortalProps> = ({
  customers,
  tickets,
  onPayTicket,
  lang,
}) => {
  const t = translations[lang];

  // Auth state for customer
  const [phoneInput, setPhoneInput] = useState('09123456789');
  const [nationalIdInput, setNationalIdInput] = useState('0019842512');
  const [loggedInCustomer, setLoggedInCustomer] = useState<CustomerProfile | null>(customers[0]);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Payment modal state
  const [payingTicket, setPayingTicket] = useState<DeviceRepairTicket | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState<boolean>(false);

  // Find active and past tickets for the customer
  const customerTickets = loggedInCustomer
    ? tickets.filter(
        (tk) =>
          tk.customerPhone === loggedInCustomer.phone ||
          tk.customerNationalId === loggedInCustomer.nationalId ||
          tk.customerName.includes(loggedInCustomer.name.split(' ')[0])
      )
    : [];

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const found = customers.find(
      (c) =>
        (c.phone === phoneInput.trim() || c.nationalId === nationalIdInput.trim())
    );

    if (found) {
      setLoggedInCustomer(found);
    } else {
      setLoginError(
        lang === 'fa'
          ? 'پروفایلی با این مشخصات یافت نشد. لطفاً شماره همراه و کدملی را بررسی نمایید.'
          : 'No profile found with these credentials. Please check your phone and National ID.'
      );
    }
  };

  const handleLogout = () => {
    setLoggedInCustomer(null);
  };

  const handleSimulatePayment = (ticket: DeviceRepairTicket) => {
    setPayingTicket(ticket);
    setPaymentSuccess(false);
  };

  const executePayment = () => {
    if (!payingTicket) return;
    onPayTicket?.(payingTicket.id);
    setPaymentSuccess(true);
    setTimeout(() => {
      setPayingTicket(null);
      setPaymentSuccess(false);
    }, 1800);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* If Not Logged In -> Login Screen */}
      {!loggedInCustomer ? (
        <div className="max-w-md mx-auto bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5">
          <div className="text-center space-y-1.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
              <User className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-white">ورود به پورتال مشتریان کارگاه</h2>
            <p className="text-xs text-slate-400">
              جهت پیگیری آنلاین وضعیت تعمیر دستگاه، پرداخت فاکتور و مشاهده سوابق
            </p>
          </div>

          {/* Quick Demo Credentials */}
          <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1 text-xs">
            <span className="text-slate-400 text-[11px]">حساب تستی آماده (آقای علی اکبری):</span>
            <div className="flex items-center justify-between font-mono text-amber-400">
              <span>همراه: 09123456789</span>
              <span>کدملی: 0019842512</span>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 mb-1">شماره تلفن همراه</label>
              <input
                type="tel"
                required
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                placeholder="09123456789"
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl py-2.5 px-3 text-slate-100 font-mono outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1">کد ملی ۱۰ رقمی مالک</label>
              <input
                type="text"
                required
                value={nationalIdInput}
                onChange={(e) => setNationalIdInput(e.target.value)}
                placeholder="0019842512"
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl py-2.5 px-3 text-slate-100 font-mono outline-none"
              />
            </div>

            {loginError && (
              <div className="p-2.5 bg-rose-950/40 border border-rose-800 rounded-lg text-rose-300 text-[11px]">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl transition-colors cursor-pointer text-xs"
            >
              ورود به داشبورد اختصاصی
            </button>
          </form>
        </div>
      ) : (
        /* Logged In Customer Dashboard */
        <div className="space-y-6">
          {/* Top Bar with User Info & Logout */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold text-sm">
                {loggedInCustomer.name.slice(0, 1)}
              </div>
              <div>
                <div className="text-sm font-bold text-white flex items-center gap-2">
                  <span>خوش‌آمدید، {loggedInCustomer.name}</span>
                  <span className="text-[10px] text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded-full border border-amber-500/30">
                    مشتری وفادار ({loggedInCustomer.totalVisits} بار مراجعه)
                  </span>
                </div>
                <div className="text-xs text-slate-400 font-mono mt-0.5">
                  کدملی: {loggedInCustomer.nationalId} · تلفن: {loggedInCustomer.phone}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>خروج از حساب</span>
            </button>
          </div>

          {/* Active Repair Tickets in Progress */}
          <div className="space-y-4">
            <div className="text-sm font-bold text-white flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-amber-400" />
              <span>دستگاه‌های در حال تعمیر شما ({customerTickets.length})</span>
            </div>

            {customerTickets.length > 0 ? (
              customerTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-5 shadow-lg"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                    <div>
                      <div className="text-base font-bold text-white">
                        {ticket.brand} {ticket.modelName}
                      </div>
                      <div className="text-xs text-slate-400 font-mono mt-0.5">
                        شماره قبض: {ticket.ticketNumber} · سریال: {ticket.serialOrImei}
                      </div>
                    </div>

                    <div className="text-end">
                      <div className="text-xs text-slate-400">هزینه نهایی:</div>
                      <div className="text-base font-bold font-mono text-emerald-400 tabular-nums">
                        {ticket.estimatedCost?.toLocaleString('fa-IR')} تومان
                      </div>
                    </div>
                  </div>

                  {/* Visual Status Stepper */}
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-slate-300">مراحل پیشرفت کارگاه:</div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      {[
                        { step: 1, title: 'پذیرش و صدور رسید', completed: true },
                        {
                          step: 2,
                          title: 'ولتاژگیری و تست فلت سه‌بعدی',
                          completed: ticket.status !== 'received',
                        },
                        {
                          step: 3,
                          title: 'تعویض قطعه و رفع ایراد',
                          completed: ticket.status === 'testing' || ticket.status === 'repaired' || ticket.status === 'delivered',
                        },
                        {
                          step: 4,
                          title: 'تست نهایی و تحویل',
                          completed: ticket.status === 'repaired' || ticket.status === 'delivered',
                        },
                      ].map((s) => (
                        <div
                          key={s.step}
                          className={`p-2.5 rounded-xl border text-center space-y-1 transition-all ${
                            s.completed
                              ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                              : 'bg-slate-950 border-slate-800 text-slate-500'
                          }`}
                        >
                          <div className="font-mono text-[10px]">مرحله {s.step}</div>
                          <div className="font-semibold text-[11px] leading-tight">{s.title}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Symptoms & Diagnostics findings */}
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1 text-xs">
                    <div className="text-slate-400">عیب اعلامی:</div>
                    <div className="text-slate-200">{ticket.symptoms.join(' · ')}</div>
                    {ticket.technicianNotes && (
                      <div className="text-[11px] text-amber-300 pt-1 border-t border-slate-800">
                        یادداشت کارشناس: {ticket.technicianNotes}
                      </div>
                    )}
                  </div>

                  {/* Actions & Payment */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                    <div className="text-xs text-slate-400 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>گارانتی ۳۰ روزه خدمات پس از تحویل</span>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      {ticket.paymentStatus === 'paid' ? (
                        <span className="flex items-center gap-1.5 px-4 py-2 bg-emerald-950/60 border border-emerald-800 text-emerald-400 font-bold text-xs rounded-xl">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>پرداخت شده</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSimulatePayment(ticket)}
                          className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer"
                        >
                          <CreditCard className="w-4 h-4" />
                          <span>پرداخت آنلاین وجه تعمیرات</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center bg-slate-900/40 border border-slate-800 rounded-2xl text-xs text-slate-500">
                در حال حاضر هیچ دستگاهی در دست تعمیر ندارید.
              </div>
            )}
          </div>

          {/* Past Repairs & Financial Ledger Timeline */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-sky-400" />
                <span>تاریخچه مراجعات گذشته و امور مالی</span>
              </div>
              <div className="text-xs text-slate-400 font-mono">
                مجموع پرداختی‌ها: {loggedInCustomer.totalSpent.toLocaleString('fa-IR')} تومان
              </div>
            </div>

            <div className="space-y-2.5">
              {loggedInCustomer.pastRepairs.map((rep, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="font-bold text-slate-200">
                      {rep.deviceModel} — {rep.issue}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      تاریخ مراجعه: {rep.date} · قبض {rep.ticketNumber}
                    </div>
                  </div>

                  <div className="text-end">
                    <div className="font-bold font-mono text-emerald-400 tabular-nums">
                      {rep.cost.toLocaleString('fa-IR')} ت
                    </div>
                    <div className="text-[10px] text-emerald-500">موفق و تسویه شده</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Payment Gateway Modal Simulation */}
      {payingTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl text-center">
            <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto">
              <CreditCard className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-base font-bold text-white">درگاه پرداخت الکترونیک شتاب</h3>
              <p className="text-xs text-slate-400 mt-1">
                پرداخت صورتحساب تعمیر {payingTicket.modelName} ({payingTicket.ticketNumber})
              </p>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl font-mono text-xl font-bold text-emerald-400">
              {payingTicket.estimatedCost?.toLocaleString('fa-IR')} تومان
            </div>

            {paymentSuccess ? (
              <div className="p-3 bg-emerald-950/60 border border-emerald-800 rounded-xl text-emerald-300 text-xs flex items-center justify-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>پرداخت با موفقیت انجام شد! صورتحساب تسویه گردید.</span>
              </div>
            ) : (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={executePayment}
                  className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  تایید و پرداخت اینترنتی
                </button>
                <button
                  type="button"
                  onClick={() => setPayingTicket(null)}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs transition-colors"
                >
                  انصراف
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
