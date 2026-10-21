import React, { useState, useRef } from 'react';
import { DiagnosticReport, VideoInspectionReport, IdentifiedComponent } from '../types/repair';
import { Language, translations } from '../lib/i18n';
import { PRESET_DIAGNOSTICS } from '../data/sampleData';
import {
  Sparkles,
  Camera,
  Video,
  Upload,
  Volume2,
  VolumeX,
  AlertTriangle,
  Flame,
  CheckCircle,
  Activity,
  Layers,
  Wrench,
  Gauge,
  Film,
  Zap,
} from 'lucide-react';

interface DiagnosticStudioProps {
  initialDeviceModel?: string;
  initialFault?: string;
  initialCurrentAmp?: number;
  lang: Language;
}

export const DiagnosticStudio: React.FC<DiagnosticStudioProps> = ({
  initialDeviceModel = '',
  initialFault = '',
  initialCurrentAmp = 0,
  lang,
}) => {
  const t = translations[lang];

  // Active diagnostic mode
  const [activeMode, setActiveMode] = useState<'photo' | 'video'>('photo');

  // Input States
  const [deviceType, setDeviceType] = useState<'smartphone' | 'laptop'>('smartphone');
  const [deviceModel, setDeviceModel] = useState(initialDeviceModel || 'Apple iPhone 13 Pro (A2638)');
  const [reportedFault, setReportedFault] = useState(
    initialFault || 'گوشی خاموش کامل است، منبع تغذیه روی ۰.۴۵ آمپر قفل شده و داغ می‌کند'
  );
  const [currentAmp, setCurrentAmp] = useState<number>(initialCurrentAmp || 0.45);

  // Media States
  const [imageSrc, setImageSrc] = useState<string>(PRESET_DIAGNOSTICS[0].imageUrl);
  const [videoFrames, setVideoFrames] = useState<string[]>([]);
  const [isCapturingCam, setIsCapturingCam] = useState<boolean>(false);

  // Analysis Result States
  const [loading, setLoading] = useState<boolean>(false);
  const [report, setReport] = useState<DiagnosticReport | null>(PRESET_DIAGNOSTICS[0].report);
  const [videoReport, setVideoReport] = useState<VideoInspectionReport | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Audio Guidance State
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Hidden references for webcam & video keyframe extraction
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoFileInputRef = useRef<HTMLInputElement | null>(null);

  // Preset Selection
  const handleSelectPreset = (presetId: string) => {
    const selected = PRESET_DIAGNOSTICS.find((p) => p.id === presetId);
    if (!selected) return;

    setDeviceType(selected.deviceType);
    setDeviceModel(selected.deviceModel);
    setReportedFault(lang === 'fa' ? selected.reportedFaultFa : selected.reportedFaultEn);
    setCurrentAmp(selected.currentAmp);
    setImageSrc(selected.imageUrl);
    setReport(selected.report);
    setVideoReport(null);
    setErrorMessage(null);
  };

  // Image File Upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImageSrc(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Video File Upload & Keyframe Extraction via HTML5 Canvas
  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const videoUrl = URL.createObjectURL(file);
    const tempVideo = document.createElement('video');
    tempVideo.src = videoUrl;
    tempVideo.muted = true;
    tempVideo.playsInline = true;

    tempVideo.onloadedmetadata = async () => {
      const duration = tempVideo.duration || 5;
      const numFrames = 4;
      const interval = duration / (numFrames + 1);
      const extracted: string[] = [];

      const canvas = document.createElement('canvas');
      canvas.width = 480;
      canvas.height = 360;
      const ctx = canvas.getContext('2d');

      for (let i = 1; i <= numFrames; i++) {
        tempVideo.currentTime = i * interval;
        await new Promise((resolve) => {
          tempVideo.onseeked = () => {
            if (ctx) {
              ctx.drawImage(tempVideo, 0, 0, canvas.width, canvas.height);
              extracted.push(canvas.toDataURL('image/jpeg', 0.8));
            }
            resolve(true);
          };
        });
      }

      setVideoFrames(extracted);
      URL.revokeObjectURL(videoUrl);
    };
  };

  // Live Camera Toggle
  const startCamera = async () => {
    setIsCapturingCam(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setIsCapturingCam(false);
      setErrorMessage(lang === 'fa' ? 'امکان دسترسی به دوربین وجود ندارد.' : 'Unable to access camera.');
    }
  };

  const captureCameraSnapshot = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setImageSrc(dataUrl);
    }
    stopCamera();
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCapturingCam(false);
  };

  // Run AI Inspection
  const handleRunInspection = async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      if (activeMode === 'photo') {
        const res = await fetch('/api/diagnose/inspect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: imageSrc,
            deviceType,
            deviceModel,
            reportedFault,
            currentAmp,
            lang,
          }),
        });

        const json = await res.json();
        if (json.success && json.data) {
          setReport(json.data);
          setVideoReport(null);
        } else {
          throw new Error(json.error || 'Failed to inspect image');
        }
      } else {
        // Video Frames analysis
        const framesToSend = videoFrames.length > 0 ? videoFrames : [imageSrc];
        const res = await fetch('/api/diagnose/video-frames', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            frames: framesToSend,
            deviceModel,
            description: reportedFault,
            lang,
          }),
        });

        const json = await res.json();
        if (json.success && json.data) {
          setVideoReport(json.data);
        } else {
          throw new Error(json.error || 'Failed to inspect video');
        }
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err?.message || 'Error occurred during AI diagnostic');
    } finally {
      setLoading(false);
    }
  };

  // Play Spoken Guidance via Gemini TTS
  const handlePlayVoiceGuidance = async () => {
    if (isPlayingAudio && audioRef.current) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
      return;
    }

    if (!report) return;

    setIsPlayingAudio(true);
    try {
      const textToRead = lang === 'fa'
        ? `مدار هدف: ${report.targetCircuit}. خلاصه تشخیص: ${report.faultSummary}. اولین گام پیشنهادی: ${report.repairActionPlan[0]?.title || ''}. دمای هیتر: ${report.repairActionPlan[0]?.heatGunSettings || '۳۴۰ درجه'}.`
        : `Target circuit: ${report.targetCircuit}. Fault summary: ${report.faultSummary}. Recommended first step: ${report.repairActionPlan[0]?.title || ''}. Heatgun setting: ${report.repairActionPlan[0]?.heatGunSettings || '340C'}.`;

      const res = await fetch('/api/audio/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToRead, lang }),
      });

      const json = await res.json();
      if (json.success && json.audioData) {
        if (!audioRef.current) {
          audioRef.current = new Audio(json.audioData);
        } else {
          audioRef.current.src = json.audioData;
        }

        audioRef.current.onended = () => setIsPlayingAudio(false);
        audioRef.current.onerror = () => setIsPlayingAudio(false);
        audioRef.current.play();
      } else {
        setIsPlayingAudio(false);
      }
    } catch (err) {
      console.error('Audio guidance error:', err);
      setIsPlayingAudio(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Hidden elements for media capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Header */}
      <div className="border-b border-slate-800/80 pb-5">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <span>{t.diagnostics.title}</span>
          <span className="text-xs font-mono font-medium text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
            Gemini 3.8 Flash Multimodal
          </span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">{t.diagnostics.subtitle}</p>
      </div>

      {/* Presets Strip */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 sm:p-4">
        <div className="text-xs font-medium text-slate-300 mb-2 flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>{t.diagnostics.presetLabel}</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {PRESET_DIAGNOSTICS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handleSelectPreset(preset.id)}
              className="text-start p-2.5 rounded-lg border border-slate-800 bg-slate-950/60 hover:border-amber-500/50 hover:bg-slate-900 transition-all text-xs group"
            >
              <div className="font-semibold text-slate-200 group-hover:text-amber-400 transition-colors">
                {lang === 'fa' ? preset.nameFa : preset.nameEn}
              </div>
              <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2 font-mono tabular-nums">
                <span>{preset.deviceModel}</span>
                <span>·</span>
                <span className="text-amber-400/90">{preset.currentAmp}A</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Two-Column Diagnostic Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Media Ingestion & Inputs (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Mode Switcher */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setActiveMode('photo')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-lg transition-colors ${
                activeMode === 'photo'
                  ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>{t.diagnostics.modePhoto}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveMode('video')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-lg transition-colors ${
                activeMode === 'video'
                  ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Film className="w-4 h-4" />
              <span>{t.diagnostics.modeVideo}</span>
            </button>
          </div>

          {/* Media Viewport */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden p-3 space-y-3">
            {activeMode === 'photo' ? (
              <div>
                {isCapturingCam ? (
                  <div className="relative aspect-4/3 bg-black rounded-lg overflow-hidden border border-slate-800">
                    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                    <div className="absolute bottom-3 inset-x-0 flex items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={captureCameraSnapshot}
                        className="px-3 py-1.5 bg-amber-500 text-slate-950 font-semibold rounded-md text-xs shadow-md"
                      >
                        ثبت تصویر (Capture)
                      </button>
                      <button
                        type="button"
                        onClick={stopCamera}
                        className="px-3 py-1.5 bg-slate-800 text-white rounded-md text-xs"
                      >
                        لغو (Cancel)
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="relative aspect-4/3 bg-slate-950 rounded-lg overflow-hidden border border-slate-800 group">
                    <img
                      src={imageSrc}
                      alt="Motherboard inspection"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 end-2 bg-slate-950/80 backdrop-blur-sm border border-slate-800 px-2 py-1 rounded text-[11px] font-mono text-slate-300">
                      Microscope / Macro
                    </div>
                  </div>
                )}

                {/* Upload & Camera Buttons */}
                <div className="flex items-center gap-2 mt-3">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-slate-200 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-lg transition-colors cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>آپلود تصویر لوپ</span>
                  </button>
                  <button
                    type="button"
                    onClick={startCamera}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-200 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-lg transition-colors cursor-pointer"
                    title="دوربین زنده میکروسکوپ"
                  >
                    <Camera className="w-3.5 h-3.5 text-amber-400" />
                    <span>دوربین لوپ</span>
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {/* Video Keyframes Strip */}
                {videoFrames.length > 0 ? (
                  <div className="space-y-2">
                    <div className="text-xs text-slate-400">فریم‌های کلیدی استخراج‌شده:</div>
                    <div className="grid grid-cols-2 gap-2">
                      {videoFrames.map((frame, idx) => (
                        <div key={idx} className="relative aspect-4/3 rounded-lg overflow-hidden border border-slate-800">
                          <img src={frame} alt={`Frame ${idx + 1}`} className="w-full h-full object-cover" />
                          <span className="absolute bottom-1 end-1 bg-black/70 px-1.5 py-0.5 rounded text-[10px] font-mono text-amber-300">
                            F{idx + 1}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-8 border-2 border-dashed border-slate-800 rounded-lg text-center flex flex-col items-center justify-center gap-2 text-xs text-slate-400">
                    <Video className="w-8 h-8 text-slate-600" />
                    <span>{t.diagnostics.videoUploadPrompt}</span>
                  </div>
                )}

                <div className="mt-3">
                  <input
                    type="file"
                    ref={videoFileInputRef}
                    accept="video/*"
                    onChange={handleVideoUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => videoFileInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-slate-200 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-lg transition-colors cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>بارگذاری فایل ویدئوی بررسی</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Form Fields */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {t.diagnostics.deviceModel}
              </label>
              <input
                type="text"
                value={deviceModel}
                onChange={(e) => setDeviceModel(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg py-2 px-3 text-xs text-slate-100 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {t.diagnostics.reportedFault}
              </label>
              <textarea
                value={reportedFault}
                onChange={(e) => setReportedFault(e.target.value)}
                rows={2}
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg py-2 px-3 text-xs text-slate-100 outline-none resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {t.diagnostics.deviceType}
                </label>
                <select
                  value={deviceType}
                  onChange={(e) => setDeviceType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-2 text-xs text-slate-200 outline-none"
                >
                  <option value="smartphone">{t.categories.smartphone}</option>
                  <option value="laptop">{t.categories.laptop}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {t.diagnostics.currentAmp}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={currentAmp}
                  onChange={(e) => setCurrentAmp(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-xs font-mono tabular-nums text-amber-400 outline-none"
                />
              </div>
            </div>

            {/* Run Diagnostic CTA */}
            <button
              type="button"
              disabled={loading}
              onClick={handleRunInspection}
              className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 disabled:opacity-50 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>
                {loading
                  ? activeMode === 'photo'
                    ? t.diagnostics.analyzing
                    : t.diagnostics.analyzingVideo
                  : activeMode === 'photo'
                  ? t.diagnostics.analyzeBtn
                  : t.diagnostics.analyzeVideoBtn}
              </span>
            </button>
          </div>

          {errorMessage && (
            <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl text-xs text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Right Column: AI Technical Findings & Measurement Guide (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {report && !videoReport ? (
            <div className="space-y-4">
              {/* Summary Card with Audio Guidance Button */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                  <div>
                    <div className="text-xs text-slate-400">{t.diagnostics.targetCircuit}</div>
                    <div className="text-base font-bold font-mono text-amber-400 mt-0.5">
                      {report.targetCircuit}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-end">
                      <div className="text-[11px] text-slate-400">{t.diagnostics.confidence}</div>
                      <div className="text-sm font-bold font-mono tabular-nums text-emerald-400">
                        {report.confidenceLevel}%
                      </div>
                    </div>

                    {/* Audio TTS button */}
                    <button
                      type="button"
                      onClick={handlePlayVoiceGuidance}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                        isPlayingAudio
                          ? 'bg-amber-500 text-slate-950 border-amber-400 font-semibold'
                          : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      {isPlayingAudio ? (
                        <>
                          <VolumeX className="w-4 h-4 animate-pulse" />
                          <span>{t.diagnostics.audioPlaying}</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-4 h-4 text-amber-400" />
                          <span>{t.diagnostics.listenAudio}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Fault Summary */}
                <p className="text-xs text-slate-200 leading-relaxed">
                  {report.faultSummary}
                </p>

                {/* Visual Defects list */}
                {report.visualDefects && report.visualDefects.length > 0 && (
                  <div className="pt-2">
                    <div className="text-xs font-medium text-slate-400 mb-1.5">
                      {t.diagnostics.visualDefects}:
                    </div>
                    <ul className="space-y-1">
                      {report.visualDefects.map((def, idx) => (
                        <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                          <span className="text-amber-400 font-bold">·</span>
                          <span>{def}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Identified Board Components */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
                <div className="px-4 py-3 bg-slate-950/60 border-b border-slate-800 text-xs font-semibold text-slate-200 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-amber-400" />
                  <span>{t.diagnostics.componentsTable}</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-start">
                    <thead>
                      <tr className="border-b border-slate-800/80 bg-slate-950/30 text-slate-400 font-medium text-[11px]">
                        <th className="py-2.5 px-4 text-start">{t.diagnostics.refDes}</th>
                        <th className="py-2.5 px-4 text-start">{t.diagnostics.type}</th>
                        <th className="py-2.5 px-4 text-start">{t.diagnostics.condition}</th>
                        <th className="py-2.5 px-4 text-start">{t.diagnostics.symptom}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {report.identifiedComponents.map((comp, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/20">
                          <td className="py-2.5 px-4 font-bold text-amber-300">{comp.refDesignator}</td>
                          <td className="py-2.5 px-4 text-slate-300 font-sans">{comp.partType}</td>
                          <td className="py-2.5 px-4">
                            <span
                              className={`text-[11px] font-semibold ${
                                comp.condition === 'damaged'
                                  ? 'text-rose-400'
                                  : comp.condition === 'corroded'
                                  ? 'text-orange-400'
                                  : comp.condition === 'suspect'
                                  ? 'text-amber-400'
                                  : 'text-emerald-400'
                              }`}
                            >
                              {comp.condition.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-slate-300 font-sans">{comp.symptomFound}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Multimeter Probing Checks */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
                <div className="px-4 py-3 bg-slate-950/60 border-b border-slate-800 text-xs font-semibold text-slate-200 flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-sky-400" />
                  <span>{t.diagnostics.multimeterHeader}</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-start">
                    <thead>
                      <tr className="border-b border-slate-800/80 bg-slate-950/30 text-slate-400 font-medium text-[11px]">
                        <th className="py-2.5 px-4 text-start">{t.diagnostics.testPoint}</th>
                        <th className="py-2.5 px-4 text-start">{t.diagnostics.mode}</th>
                        <th className="py-2.5 px-4 text-start">{t.diagnostics.expected}</th>
                        <th className="py-2.5 px-4 text-start">{t.diagnostics.indicator}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono tabular-nums">
                      {report.multimeterChecks.map((chk, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/20">
                          <td className="py-2.5 px-4 text-sky-300 font-bold">{chk.testPoint}</td>
                          <td className="py-2.5 px-4 text-slate-400 text-[11px] font-sans">
                            {chk.measurementMode}
                          </td>
                          <td className="py-2.5 px-4 text-emerald-400">{chk.expectedValue}</td>
                          <td className="py-2.5 px-4 text-rose-400 font-semibold">{chk.faultIndicator}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Repair Action Plan & Heatgun Profile */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="text-xs font-semibold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-2">
                  <Flame className="w-4 h-4 text-amber-500" />
                  <span>{t.diagnostics.actionPlan}</span>
                </div>
                <div className="space-y-3">
                  {report.repairActionPlan.map((action) => (
                    <div
                      key={action.step}
                      className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-lg space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-xs text-amber-400">
                          {action.step}. {action.title}
                        </span>
                        {action.heatGunSettings && (
                          <span className="text-[11px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                            {action.heatGunSettings}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {action.instructions}
                      </p>
                      {action.cautionNote && (
                        <div className="text-[11px] text-rose-300 flex items-start gap-1.5 bg-rose-950/20 p-2 rounded border border-rose-900/40">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                          <span>{action.cautionNote}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Tools Required */}
                {report.toolsRequired && report.toolsRequired.length > 0 && (
                  <div className="pt-2 border-t border-slate-800">
                    <div className="text-xs font-medium text-slate-400 mb-1 flex items-center gap-1.5">
                      <Wrench className="w-3.5 h-3.5 text-slate-400" />
                      <span>{t.diagnostics.tools}:</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {report.toolsRequired.map((tool, idx) => (
                        <span
                          key={idx}
                          className="text-[11px] font-mono bg-slate-950 border border-slate-800 px-2 py-0.5 rounded text-slate-300"
                        >
                          {tool}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : videoReport ? (
            /* Video Inspection Report */
            <div className="space-y-4">
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                  <div>
                    <div className="text-xs text-slate-400">{t.diagnostics.videoAssessment}</div>
                    <div className="text-sm font-semibold text-white mt-1">
                      {videoReport.overallAssessment}
                    </div>
                  </div>
                  <div className="text-end">
                    <div className="text-[11px] text-slate-400">{t.diagnostics.safetyScore}</div>
                    <div className="text-2xl font-bold font-mono tabular-nums text-emerald-400">
                      {videoReport.safetyScore}/100
                    </div>
                  </div>
                </div>

                {/* Phases */}
                <div className="space-y-2 pt-2">
                  <div className="text-xs font-semibold text-slate-200">
                    {t.diagnostics.phases}:
                  </div>
                  {videoReport.phaseBreakdown.map((p, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between text-amber-400 font-semibold">
                        <span>
                          فاز {idx + 1}: {p.phaseName}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          کیفیت: {p.qualityRating}
                        </span>
                      </div>
                      <p className="text-slate-300">{p.observation}</p>
                    </div>
                  ))}
                </div>

                {/* Recommendations */}
                <div className="pt-2 border-t border-slate-800">
                  <div className="text-xs font-semibold text-slate-200 mb-2">
                    {t.diagnostics.recommendations}:
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {videoReport.recommendations.map((rec, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 border border-slate-800 bg-slate-900/30 rounded-xl text-center flex flex-col items-center justify-center gap-2 text-xs text-slate-500">
              <Layers className="w-8 h-8 text-slate-600 stroke-1" />
              <span>تصویر یا ویدئوی مورد نظر را انتخاب و دکمه تحلیل را بزنید.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
