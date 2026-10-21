import React from 'react';
import { DeviceRepairTicket } from '../types/repair';
import { Language, translations } from '../lib/i18n';
import { X, Printer, QrCode, ShieldCheck, CheckCircle2, XCircle } from 'lucide-react';

interface TicketDetailsModalProps {
  ticket: DeviceRepairTicket | null;
  onClose: () => void;
  lang: Language;
}

export const TicketDetailsModal: React.FC<TicketDetailsModalProps> = ({
  ticket,
  onClose,
  lang,
}) => {
  const t = translations[lang];

  if (!ticket) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto print:p-0 print:bg-white">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl print:bg-white print:border-none print:shadow-none print:text-black">
        {/* Modal Top Actions */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/80 print:hidden">
          <span className="text-xs font-semibold text-slate-300">
            {t.modal.passportTitle} — {ticket.ticketNumber}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{t.modal.printPassport}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Passport Content */}
        <div className="p-6 sm:p-8 space-y-6 text-xs text-slate-200 print:text-black print:p-6">
          {/* Header & Logo */}
          <div className="flex items-start justify-between border-b border-slate-800 print:border-slate-300 pb-5">
            <div>
              <div className="text-lg font-bold text-white print:text-black">
                {t.modal.workshopName}
              </div>
              <div className="text-slate-400 print:text-slate-600 text-[11px] mt-0.5">
                تخصصی‌ترین مرکز عیب‌یابی بردهای الکترونیکی موبایل و لپ‌تاپ با هوش مصنوعی
              </div>
              <div className="text-[11px] font-mono text-slate-400 print:text-slate-600 mt-2">
                {t.modal.intakeDate}: {ticket.createdAt}
              </div>
            </div>

            {/* QR Simulation & Ticket Badge */}
            <div className="text-end flex flex-col items-end">
              <div className="w-16 h-16 bg-white p-1 rounded-lg border border-slate-700 flex items-center justify-center">
                <QrCode className="w-14 h-14 text-slate-900" />
              </div>
              <div className="text-base font-bold font-mono text-amber-400 print:text-black mt-2">
                {ticket.ticketNumber}
              </div>
            </div>
          </div>

          {/* Two-Column Metadata */}
          <div className="grid grid-cols-2 gap-4 bg-slate-950/60 print:bg-slate-100 p-4 rounded-xl border border-slate-800 print:border-slate-300">
            <div>
              <div className="text-slate-400 print:text-slate-600 text-[11px] mb-1">
                مشخصات مشتری (Customer):
              </div>
              <div className="font-semibold text-slate-100 print:text-black">{ticket.customerName}</div>
              <div className="font-mono text-slate-300 print:text-slate-700 mt-0.5">
                {ticket.customerPhone}
              </div>
            </div>

            <div>
              <div className="text-slate-400 print:text-slate-600 text-[11px] mb-1">
                دستگاه و سریال (Device):
              </div>
              <div className="font-semibold text-slate-100 print:text-black">
                {ticket.brand} {ticket.modelName}
              </div>
              <div className="font-mono text-slate-300 print:text-slate-700 text-[11px] mt-0.5">
                {ticket.serialOrImei ? `IMEI: ${ticket.serialOrImei}` : 'بدون سریال'}
              </div>
            </div>
          </div>

          {/* Screen Lock Info */}
          {ticket.lockType !== 'none' && (
            <div className="flex items-center gap-3 p-3 bg-slate-950/40 print:bg-slate-50 rounded-lg border border-slate-800 print:border-slate-300">
              <span className="text-slate-400 print:text-slate-600 font-medium">اطلاعات قفل صفحه:</span>
              <span className="font-mono font-semibold text-amber-400 print:text-black">
                {ticket.lockType.toUpperCase()}: {ticket.lockCode || 'اعلام نشده'}
              </span>
            </div>
          )}

          {/* Intake Physical Condition Checklist */}
          <div>
            <div className="font-semibold text-slate-300 print:text-black mb-2 border-b border-slate-800 print:border-slate-300 pb-1">
              وضعیت فیزیکی دستگاه حین تحویل (Intake Condition Checklist):
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
              {[
                { label: 'روشن می‌شود', val: ticket.intakeCondition.powersOn },
                { label: 'صفحه/ال‌سی‌دی سالم', val: !ticket.intakeCondition.displayCracked },
                { label: 'بدون آثار آب‌خوردگی', val: !ticket.intakeCondition.liquidDamaged },
                { label: 'پیچ‌ها فابریک و کامل', val: !ticket.intakeCondition.missingScrews },
                { label: 'باتری سالم (بدون بادکردگی)', val: !ticket.intakeCondition.batterySwollen },
                { label: 'بدون دستکاری قبلی', val: !ticket.intakeCondition.priorRepairAttempt },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-1.5 p-2 bg-slate-950/40 print:bg-slate-50 border border-slate-800/80 print:border-slate-300 rounded-md"
                >
                  {item.val ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 print:text-emerald-700 shrink-0" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-rose-400 print:text-rose-700 shrink-0" />
                  )}
                  <span className="text-slate-300 print:text-slate-800">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Symptoms and Current Draw */}
          <div>
            <div className="font-semibold text-slate-300 print:text-black mb-1.5">
              عیوب اعلام‌شده و تست اولیه:
            </div>
            <div className="space-y-1">
              {ticket.symptoms.map((sym, i) => (
                <div key={i} className="text-slate-300 print:text-slate-800 flex items-center gap-2">
                  <span className="text-amber-400 print:text-black">·</span>
                  <span>{sym}</span>
                </div>
              ))}
            </div>

            {ticket.currentConsumptionAmp !== undefined && ticket.currentConsumptionAmp > 0 && (
              <div className="mt-2 text-[11px] font-mono text-amber-400 print:text-black">
                جریان‌کشی استارت منبع تغذیه DC: {ticket.currentConsumptionAmp} آمپر
              </div>
            )}
          </div>

          {/* Technician Notes */}
          {ticket.technicianNotes && (
            <div className="p-3 bg-slate-950/50 print:bg-slate-50 rounded-xl border border-slate-800 print:border-slate-300 space-y-1">
              <div className="font-semibold text-slate-400 print:text-slate-600 text-[11px]">
                یادداشت تکنسین مهندسی:
              </div>
              <p className="text-slate-300 print:text-slate-800 text-[11px] leading-relaxed">
                {ticket.technicianNotes}
              </p>
            </div>
          )}

          {/* Cost & Guarantee Notice */}
          <div className="pt-3 border-t border-slate-800 print:border-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-[11px] text-slate-400 print:text-slate-600">برآورد هزینه:</div>
              <div className="text-base font-bold font-mono tabular-nums text-emerald-400 print:text-black">
                {ticket.estimatedCost ? `${ticket.estimatedCost.toLocaleString('fa-IR')} تومان` : 'پس از عیب‌یابی اعلام می‌شود'}
              </div>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-slate-400 print:text-slate-700 max-w-xs">
              <ShieldCheck className="w-5 h-5 text-amber-400 print:text-black shrink-0" />
              <span>{t.modal.guaranteeNotice}</span>
            </div>
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex justify-end print:hidden">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            {t.modal.close}
          </button>
        </div>
      </div>
    </div>
  );
};
