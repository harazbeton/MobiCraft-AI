import React, { useState } from 'react';
import { RepairSOP, QuizQuestion } from '../types/repair';
import { Language, translations } from '../lib/i18n';
import { SAMPLE_SOPS, QUIZ_QUESTIONS } from '../data/sampleData';
import {
  BookOpen,
  Sparkles,
  Award,
  Clock,
  Wrench,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  RotateCcw,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface TrainingHubProps {
  lang: Language;
}

export const TrainingHub: React.FC<TrainingHubProps> = ({ lang }) => {
  const t = translations[lang];

  const [activeSubTab, setActiveSubTab] = useState<'sops' | 'generator' | 'quiz'>('sops');
  const [sopsList, setSopsList] = useState<RepairSOP[]>(SAMPLE_SOPS);
  const [selectedSop, setSelectedSop] = useState<RepairSOP>(SAMPLE_SOPS[0]);
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});

  // AI Generator state
  const [targetModel, setTargetModel] = useState('Samsung Galaxy S23 Ultra');
  const [repairTask, setRepairTask] = useState('تعویض کانکتور شارژ Type-C روی ساب‌برد');
  const [generating, setGenerating] = useState(false);
  const [generatorError, setGeneratorError] = useState<string | null>(null);

  // Quiz state
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

  const toggleStepCompleted = (stepNumber: number) => {
    const key = `${selectedSop.id}-${stepNumber}`;
    setCompletedSteps((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleGenerateSop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetModel || !repairTask) return;

    setGenerating(true);
    setGeneratorError(null);

    try {
      const res = await fetch('/api/sop/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceModel: targetModel,
          repairType: repairTask,
          lang,
        }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        const newSop: RepairSOP = {
          id: `sop-${Date.now()}`,
          ...json.data,
        };
        setSopsList((prev) => [newSop, ...prev]);
        setSelectedSop(newSop);
        setActiveSubTab('sops');
      } else {
        throw new Error(json.error || 'Failed to generate SOP');
      }
    } catch (err: any) {
      console.error(err);
      setGeneratorError(err?.message || 'Error occurred while generating SOP');
    } finally {
      setGenerating(false);
    }
  };

  const currentQuestion = QUIZ_QUESTIONS[currentQuestionIdx];

  const handleSelectOption = (idx: number) => {
    if (isAnswerSubmitted) return;
    setSelectedOption(idx);
  };

  const handleCheckAnswer = () => {
    if (selectedOption === null || isAnswerSubmitted) return;
    setIsAnswerSubmitted(true);
    if (selectedOption === currentQuestion.correctIndex) {
      setQuizScore((prev) => prev + 1);
    }
  };

  const handleNextQuestion = () => {
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
    if (currentQuestionIdx < QUIZ_QUESTIONS.length - 1) {
      setCurrentQuestionIdx((prev) => prev + 1);
    } else {
      // Finished
      setCurrentQuestionIdx(QUIZ_QUESTIONS.length);
    }
  };

  const handleRestartQuiz = () => {
    setCurrentQuestionIdx(0);
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
    setQuizScore(0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-800/80 pb-5">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
          {t.training.title}
        </h1>
        <p className="text-sm text-slate-400 mt-1">{t.training.subtitle}</p>
      </div>

      {/* Segmented Sub-Tabs */}
      <div className="flex items-center gap-2 bg-slate-900/80 p-1 rounded-xl border border-slate-800 max-w-md">
        <button
          type="button"
          onClick={() => setActiveSubTab('sops')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-lg transition-colors ${
            activeSubTab === 'sops'
              ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>{t.training.sopTab}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('generator')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-lg transition-colors ${
            activeSubTab === 'generator'
              ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>{t.training.aiGeneratorTab}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('quiz')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-lg transition-colors ${
            activeSubTab === 'quiz'
              ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>{t.training.quizTab}</span>
        </button>
      </div>

      {/* Sub-Tab 1: SOP Guides */}
      {activeSubTab === 'sops' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* SOP Directory (4 Cols) */}
          <div className="lg:col-span-4 space-y-3">
            <div className="text-xs font-semibold text-slate-300 px-1">
              راهنماهای موجود ({sopsList.length})
            </div>
            <div className="space-y-2">
              {sopsList.map((sop) => (
                <button
                  key={sop.id}
                  type="button"
                  onClick={() => setSelectedSop(sop)}
                  className={`w-full text-start p-3 rounded-xl border text-xs transition-all ${
                    selectedSop.id === sop.id
                      ? 'bg-amber-500/10 border-amber-500/50 text-white'
                      : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="font-semibold line-clamp-2">{sop.title}</div>
                  <div className="text-[11px] text-slate-400 mt-2 flex items-center gap-3 font-mono tabular-nums">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-400" />
                      <span>
                        {sop.estimatedTimeMin} {t.training.minutes}
                      </span>
                    </span>
                    <span>·</span>
                    <span className="capitalize text-slate-400">{sop.difficulty}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Active SOP Details (8 Cols) */}
          <div className="lg:col-span-8 bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-5">
            <div>
              <div className="text-xs text-amber-400 font-mono mb-1">{selectedSop.deviceModel}</div>
              <h2 className="text-lg font-bold text-white leading-snug">{selectedSop.title}</h2>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-2 font-mono tabular-nums">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>
                    {t.training.timeEstimate}: {selectedSop.estimatedTimeMin} {t.training.minutes}
                  </span>
                </span>
                <span>·</span>
                <span className="capitalize">
                  {t.training.difficulty}: {selectedSop.difficulty}
                </span>
              </div>
            </div>

            {/* Safety Warnings */}
            {selectedSop.safetyWarnings && selectedSop.safetyWarnings.length > 0 && (
              <div className="p-3.5 bg-rose-950/20 border border-rose-900/40 rounded-xl text-xs space-y-2">
                <div className="font-semibold text-rose-300 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <span>{t.training.safetyWarnings}:</span>
                </div>
                <ul className="space-y-1 text-rose-200/90 ps-2">
                  {selectedSop.safetyWarnings.map((warn, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-rose-400">·</span>
                      <span>{warn}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Tools Needed */}
            {selectedSop.toolsNeeded && selectedSop.toolsNeeded.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                  <Wrench className="w-4 h-4 text-slate-400" />
                  <span>{t.training.toolsNeeded}:</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedSop.toolsNeeded.map((tl, i) => (
                    <span
                      key={i}
                      className="text-[11px] font-mono bg-slate-950 border border-slate-800 text-slate-300 px-2.5 py-1 rounded-lg"
                    >
                      {tl}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Step-by-Step Procedure */}
            <div className="space-y-3 pt-2">
              <div className="text-xs font-semibold text-slate-200">مراحل اجرایی تعویض و تعمیر:</div>
              {selectedSop.steps.map((st) => {
                const isDone = !!completedSteps[`${selectedSop.id}-${st.stepNumber}`];
                return (
                  <div
                    key={st.stepNumber}
                    className={`p-4 rounded-xl border transition-colors ${
                      isDone
                        ? 'bg-emerald-950/20 border-emerald-800/40 text-slate-300'
                        : 'bg-slate-950/70 border-slate-800 text-slate-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        <button
                          type="button"
                          onClick={() => toggleStepCompleted(st.stepNumber)}
                          className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center border transition-colors cursor-pointer ${
                            isDone
                              ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                              : 'border-slate-700 hover:border-amber-400 text-transparent'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </button>
                        <div>
                          <div className="font-semibold text-xs text-white">
                            {t.training.step} {st.stepNumber}: {st.title}
                          </div>
                          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                            {st.action}
                          </p>

                          {st.heatOrTorque && (
                            <div className="text-[11px] font-mono text-amber-400/90 mt-1.5">
                              پارامتر حرارت / گشتاور: {st.heatOrTorque}
                            </div>
                          )}

                          {st.visualTip && (
                            <div className="text-[11px] text-slate-400 mt-1">
                              نکته بصری: {st.visualTip}
                            </div>
                          )}

                          {st.criticalCaution && (
                            <div className="text-[11px] text-rose-300 mt-2 p-2 bg-rose-950/30 rounded border border-rose-900/40">
                              توجه بحرانی: {st.criticalCaution}
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleStepCompleted(st.stepNumber)}
                        className={`text-[11px] font-medium px-2 py-0.5 rounded border transition-colors shrink-0 cursor-pointer ${
                          isDone
                            ? 'text-emerald-400 border-emerald-800 bg-emerald-950/40'
                            : 'text-slate-400 border-slate-800 hover:text-white'
                        }`}
                      >
                        {isDone ? t.training.stepDone : t.training.markDone}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Sub-Tab 2: AI SOP Generator */}
      {activeSubTab === 'generator' && (
        <div className="max-w-2xl mx-auto bg-slate-900/60 border border-slate-800 rounded-xl p-5 sm:p-6 space-y-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>{t.training.generateTitle}</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">{t.training.generateDesc}</p>
          </div>

          <form onSubmit={handleGenerateSop} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {t.training.targetModel}
              </label>
              <input
                type="text"
                required
                value={targetModel}
                onChange={(e) => setTargetModel(e.target.value)}
                placeholder="Galaxy Z Flip 5 / MacBook Air M2 / iPhone 15 Pro"
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg py-2 px-3 text-xs text-slate-100 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {t.training.repairType}
              </label>
              <input
                type="text"
                required
                value={repairTask}
                onChange={(e) => setRepairTask(e.target.value)}
                placeholder="تعویض سوکت شارژ / ریبال آی‌سی وای‌فای / تعمیر تاچ‌بار"
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg py-2 px-3 text-xs text-slate-100 outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={generating}
              className="w-full py-2.5 px-4 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 disabled:opacity-50 rounded-lg shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>{generating ? t.training.generating : t.training.generateBtn}</span>
            </button>
          </form>

          {generatorError && (
            <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl text-xs text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{generatorError}</span>
            </div>
          )}
        </div>
      )}

      {/* Sub-Tab 3: Apprentice Diagnostic Quiz */}
      {activeSubTab === 'quiz' && (
        <div className="max-w-2xl mx-auto bg-slate-900/60 border border-slate-800 rounded-xl p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400" />
                <span>{t.training.quizTitle}</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">{t.training.quizDesc}</p>
            </div>
            <div className="text-end">
              <div className="text-[11px] text-slate-400">{t.training.score}</div>
              <div className="text-lg font-bold font-mono tabular-nums text-amber-400">
                {quizScore} / {QUIZ_QUESTIONS.length}
              </div>
            </div>
          </div>

          {currentQuestionIdx < QUIZ_QUESTIONS.length ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>
                  سوال {currentQuestionIdx + 1} از {QUIZ_QUESTIONS.length}
                </span>
              </div>

              {/* Question Text */}
              <div className="text-sm font-semibold text-slate-100 leading-relaxed">
                {lang === 'fa' ? currentQuestion.questionFa : currentQuestion.question}
              </div>

              {/* Options */}
              <div className="space-y-2">
                {currentQuestion.options.map((opt, idx) => {
                  const isSelected = selectedOption === idx;
                  const isCorrect = idx === currentQuestion.correctIndex;
                  let borderClasses = 'border-slate-800 hover:border-slate-700 bg-slate-950/60';

                  if (isAnswerSubmitted) {
                    if (isCorrect) {
                      borderClasses = 'border-emerald-500 bg-emerald-950/30 text-emerald-300';
                    } else if (isSelected && !isCorrect) {
                      borderClasses = 'border-rose-500 bg-rose-950/30 text-rose-300';
                    }
                  } else if (isSelected) {
                    borderClasses = 'border-amber-400 bg-amber-500/10 text-white font-medium';
                  }

                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={isAnswerSubmitted}
                      onClick={() => handleSelectOption(idx)}
                      className={`w-full text-start p-3 rounded-xl border text-xs transition-colors flex items-center justify-between gap-3 cursor-pointer ${borderClasses}`}
                    >
                      <span>{lang === 'fa' ? opt.labelFa : opt.label}</span>
                      <span className="w-4 h-4 rounded-full border border-slate-700 shrink-0 flex items-center justify-center text-[10px] font-mono">
                        {String.fromCharCode(65 + idx)}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Explanation upon answer */}
              {isAnswerSubmitted && (
                <div
                  className={`p-3.5 rounded-xl border text-xs space-y-1 ${
                    selectedOption === currentQuestion.correctIndex
                      ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-200'
                      : 'bg-rose-950/30 border-rose-800/60 text-rose-200'
                  }`}
                >
                  <div className="font-semibold flex items-center gap-1.5">
                    {selectedOption === currentQuestion.correctIndex ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-400" />
                    )}
                    <span>
                      {selectedOption === currentQuestion.correctIndex
                        ? t.training.correct
                        : t.training.incorrect}
                    </span>
                  </div>
                  <p className="text-slate-300 text-xs">
                    {lang === 'fa' ? currentQuestion.explanationFa : currentQuestion.explanation}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3">
                {!isAnswerSubmitted ? (
                  <button
                    type="button"
                    disabled={selectedOption === null}
                    onClick={handleCheckAnswer}
                    className="px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 rounded-lg shadow-sm transition-colors cursor-pointer"
                  >
                    {t.training.checkAnswer}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleNextQuestion}
                    className="px-4 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-lg shadow-sm transition-colors cursor-pointer"
                  >
                    {t.training.nextQuestion}
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Quiz Completed View */
            <div className="text-center py-8 space-y-4">
              <Award className="w-12 h-12 text-amber-400 mx-auto" />
              <h3 className="text-lg font-bold text-white">آزمون به پایان رسید!</h3>
              <p className="text-xs text-slate-300">
                امتیاز شما: {quizScore} از {QUIZ_QUESTIONS.length} سوال (
                {Math.round((quizScore / QUIZ_QUESTIONS.length) * 100)}%)
              </p>
              <button
                type="button"
                onClick={handleRestartQuiz}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{t.training.restartQuiz}</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
