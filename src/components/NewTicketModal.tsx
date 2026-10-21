import React, { useState } from 'react';
import { DeviceRepairTicket, DeviceCategory } from '../types/repair';
import { Language, translations } from '../lib/i18n';
import { X, Smartphone, Laptop, Tablet, Plus, Check } from 'lucide-react';

interface NewTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (ticketData: Omit<DeviceRepairTicket, 'id' | 'ticketNumber' | 'createdAt' | 'updatedAt' | 'status'>) => void;
  lang: Language;
}

export const NewTicketModal: React.FC<NewTicketModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  lang,
}) => {
  const t = translations[lang];

  const [category, setCategory] = useState<'smartphone' | 'laptop' | 'tablet'>('smartphone');
  const [brand, setBrand] = useState('Apple');
  const [modelName, setModelName] = useState('');
  const [serialOrImei, setSerialOrImei] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [lockType, setLockType] = useState<'pin' | 'pattern' | 'password' | 'none'>('pin');
  const [lockCode, setLockCode] = useState('');
  const [symptomInput, setSymptomInput] = useState('');
  const [symptomsList, setSymptomsList] = useState<string[]>([]);
  const [currentConsumptionAmp, setCurrentConsumptionAmp] = useState<number>(0);
  const [estimatedCost, setEstimatedCost] = useState<number>(0);
  const [technicianNotes, setTechnicianNotes] = useState('');

  // Physical checklist
  const [intakeCondition, setIntakeCondition] = useState({
    powersOn: false,
    displayCracked: false,
    liquidDamaged: false,
    missingScrews: false,
    batterySwollen: false,
    priorRepairAttempt: false,
  });

  if (!isOpen) return null;

  const handleAddSymptom = () => {
    if (symptomInput.trim() && !symptomsList.includes(symptomInput.trim())) {
      setSymptomsList([...symptomsList, symptomInput.trim()]);
      setSymptomInput('');
    }
  };

  const handleRemoveSymptom = (index: number) => {
    setSymptomsList(symptomsList.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !modelName) return;

    onSubmit({
      category,
      brand,
      modelName,
      serialOrImei,
      customerName,
      customerPhone,
      lockType,
      lockCode,
      symptoms: symptomsList.length > 0 ? symptomsList : [symptomInput.trim() || 'عیب عمومی'],
      intakeCondition,
      currentConsumptionAmp: currentConsumptionAmp || 0,
      estimatedCost: estimatedCost || 0,
      technicianNotes,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 sticky top-0 bg-slate-900 z-10">
          <h2 className="text-base font-bold text-white">{t.modal.newTicketTitle}</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5 text-xs">
          {/* Customer Info */}
          <div className="space-y-3">
            <div className="font-semibold text-slate-300 border-b border-slate-800 pb-1">
              {t.modal.customerInfo}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">{t.modal.customerName} *</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="محمد رضایی"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg py-2 px-3 text-slate-100 outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">{t.modal.customerPhone} *</label>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="09121234567"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg py-2 px-3 text-slate-100 font-mono outline-none"
                />
              </div>
            </div>
          </div>

          {/* Device Info */}
          <div className="space-y-3">
            <div className="font-semibold text-slate-300 border-b border-slate-800 pb-1">
              {t.modal.deviceInfo}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">{t.modal.category}</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-2 text-slate-200 outline-none"
                >
                  <option value="smartphone">{t.categories.smartphone}</option>
                  <option value="laptop">{t.categories.laptop}</option>
                  <option value="tablet">{t.categories.tablet}</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">{t.modal.brand}</label>
                <input
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="Apple / Samsung / Xiaomi / Dell"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-slate-100 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">{t.modal.model} *</label>
                <input
                  type="text"
                  required
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  placeholder="iPhone 14 Pro / XPS 15"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg py-2 px-3 text-slate-100 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">{t.modal.serialOrImei}</label>
                <input
                  type="text"
                  value={serialOrImei}
                  onChange={(e) => setSerialOrImei(e.target.value)}
                  placeholder="358941109482114 / C02G9012MD6R"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-slate-100 font-mono outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">{t.modal.lockType}</label>
                  <select
                    value={lockType}
                    onChange={(e) => setLockType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-2 text-slate-200 outline-none"
                  >
                    <option value="pin">PIN</option>
                    <option value="pattern">Pattern</option>
                    <option value="password">Password</option>
                    <option value="none">None</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">{t.modal.lockCode}</label>
                  <input
                    type="text"
                    value={lockCode}
                    onChange={(e) => setLockCode(e.target.value)}
                    placeholder="1234"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-2 text-slate-100 outline-none font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Physical Intake Checklist */}
          <div className="space-y-2">
            <div className="font-semibold text-slate-300 border-b border-slate-800 pb-1">
              {t.modal.intakeChecks}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { key: 'powersOn', label: t.modal.powersOn },
                { key: 'displayCracked', label: t.modal.displayCracked },
                { key: 'liquidDamaged', label: t.modal.liquidDamaged },
                { key: 'missingScrews', label: t.modal.missingScrews },
                { key: 'batterySwollen', label: t.modal.batterySwollen },
                { key: 'priorRepairAttempt', label: t.modal.priorRepair },
              ].map((item) => (
                <label
                  key={item.key}
                  className="flex items-center gap-2 p-2 bg-slate-950 border border-slate-800 rounded-lg cursor-pointer hover:border-slate-700"
                >
                  <input
                    type="checkbox"
                    checked={(intakeCondition as any)[item.key]}
                    onChange={(e) =>
                      setIntakeCondition({
                        ...intakeCondition,
                        [item.key]: e.target.checked,
                      })
                    }
                    className="rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-0"
                  />
                  <span className="text-[11px] text-slate-300">{item.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Symptoms and Current */}
          <div className="space-y-3">
            <div className="font-semibold text-slate-300 border-b border-slate-800 pb-1">
              {t.modal.symptoms}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={symptomInput}
                onChange={(e) => setSymptomInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSymptom();
                  }
                }}
                placeholder="مثلاً: خاموش کامل، ارور کد، بک‌لایت قطع، و..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-slate-100 outline-none"
              />
              <button
                type="button"
                onClick={handleAddSymptom}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg flex items-center gap-1 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>افزودن</span>
              </button>
            </div>

            {symptomsList.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {symptomsList.map((sym, idx) => (
                  <span
                    key={idx}
                    className="bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] px-2.5 py-1 rounded-md flex items-center gap-1.5"
                  >
                    <span>{sym}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSymptom(idx)}
                      className="text-amber-400 hover:text-white"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-slate-400 mb-1">{t.modal.currentAmp}</label>
                <input
                  type="number"
                  step="0.01"
                  value={currentConsumptionAmp}
                  onChange={(e) => setCurrentConsumptionAmp(parseFloat(e.target.value) || 0)}
                  placeholder="0.35"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-amber-400 font-mono outline-none tabular-nums"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">{t.modal.estimatedCost}</label>
                <input
                  type="number"
                  step="50000"
                  value={estimatedCost}
                  onChange={(e) => setEstimatedCost(parseInt(e.target.value) || 0)}
                  placeholder="1500000"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-emerald-400 font-mono outline-none tabular-nums"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">{t.modal.notes}</label>
              <textarea
                value={technicianNotes}
                onChange={(e) => setTechnicianNotes(e.target.value)}
                rows={2}
                placeholder="توضیحات تکمیلی دریافت قطعه، تجهیزات همراه یا توافقات..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-slate-200 outline-none resize-none"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
            >
              {t.modal.cancel}
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              {t.modal.submit}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
