import React, { useState } from 'react';
import {
  BookOpen,
  Package,
  FileText,
  ShieldAlert,
  Wine,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Info,
  Search,
  Volume2,
  Square
} from 'lucide-react';
import {
  WASTE_GUIDANCE_MAP,
  CLASS_COLORS,
  formatClassLabel,
} from '../constants/wasteGuidance';
import { speakText, stopSpeech } from '../utils/speechService';
import { CLASS_TRANSLATIONS } from '../constants/translations';

export const GuidancePage: React.FC = () => {
  const [selectedClass, setSelectedClass] = useState<string>('Plastic');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [playingAudioLang, setPlayingAudioLang] = useState<string | null>(null);

  const handleSpeak = (lang: 'en' | 'hi') => {
    if (playingAudioLang === lang) {
      stopSpeech();
      setPlayingAudioLang(null);
      return;
    }
    stopSpeech();
    setPlayingAudioLang(lang);
    const textToSpeak =
      CLASS_TRANSLATIONS[lang]?.[selectedClass]?.spokenGuidance ||
      (lang === 'hi' ? CLASS_TRANSLATIONS.hi[selectedClass]?.action : activeGuidance.action);
    speakText(textToSpeak || activeGuidance.action, lang);
  };

  const classIcons: Record<string, React.ReactNode> = {
    Plastic: <Package className="w-5 h-5 text-amber-600" />,
    Paper_Cardboard: <FileText className="w-5 h-5 text-emerald-600" />,
    Metal: <ShieldAlert className="w-5 h-5 text-slate-600" />,
    Glass: <Wine className="w-5 h-5 text-teal-600" />,
    Other_Waste: <HelpCircle className="w-5 h-5 text-purple-600" />,
  };

  const filteredEntries = Object.entries(WASTE_GUIDANCE_MAP).filter(
    ([className, item]) => {
      const formatted = formatClassLabel(className).toLowerCase();
      const q = searchQuery.toLowerCase();
      return (
        formatted.includes(q) ||
        item.action.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
      );
    }
  );

  const activeGuidance = WASTE_GUIDANCE_MAP[selectedClass] || WASTE_GUIDANCE_MAP.Plastic;
  const activeColors = CLASS_COLORS[selectedClass] || CLASS_COLORS.Other_Waste;

  return (
    <div className="space-y-10 max-w-6xl mx-auto">
      {/* Header */}
      <div className="border-b border-slate-200 pb-6">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 text-xs font-semibold mb-2">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Waste Disposal & Recycling Guide</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Materials & Recycling Directory
        </h1>
        <p className="text-sm text-slate-600 mt-1 max-w-3xl">
          Comprehensive, category-specific instructions for sorting, recycling,
          and responsible disposal of materials identified by the EcoSort YOLOv8 model.
        </p>
      </div>

      {/* Backend Integration Transparency Note */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3 text-xs text-slate-700">
        <Info className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-slate-900">
            Backend Architecture Alignment:
          </p>
          <p className="text-slate-600 leading-relaxed">
            The guidance rules displayed below directly reflect the logic defined in{' '}
            <code className="bg-slate-200/80 px-1 py-0.5 rounded font-mono text-[11px]">
              backend/ml/waste_guidance.py
            </code>
            . As the current FastAPI backend does not yet mount a dedicated REST endpoint for guidance, this frontend
            module cleanly mirrors the backend specification without modifying or bloating server code.
          </p>
        </div>
      </div>

      {/* Class Category Pills & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Pills */}
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {Object.keys(WASTE_GUIDANCE_MAP).map((c) => {
            const isSelected = selectedClass === c;
            return (
              <button
                key={c}
                onClick={() => setSelectedClass(c)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isSelected
                    ? 'bg-emerald-800 text-white shadow-sm shadow-emerald-800/20'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {classIcons[c]}
                <span>{formatClassLabel(c)}</span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search waste materials..."
            className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
          />
        </div>
      </div>

      {/* Featured Active Class Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-slate-100">
              {classIcons[selectedClass]}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900">
                  {formatClassLabel(selectedClass)}
                </h2>
                <span
                  className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${activeColors.badge}`}
                >
                  {activeGuidance.category}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Model Classification Category • Trained YOLOv8 Feature Class
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Audio Read-Aloud Buttons */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => handleSpeak('en')}
                title="Read instructions aloud in English"
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  playingAudioLang === 'en'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-white hover:text-slate-900'
                }`}
              >
                {playingAudioLang === 'en' ? (
                  <Square className="w-3.5 h-3.5 fill-current" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
                )}
                <span>Listen EN</span>
              </button>

              <button
                onClick={() => handleSpeak('hi')}
                title="हिंदी में निर्देश सुनें (Listen in Hindi)"
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  playingAudioLang === 'hi'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-white hover:text-slate-900'
                }`}
              >
                {playingAudioLang === 'hi' ? (
                  <Square className="w-3.5 h-3.5 fill-current" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
                )}
                <span>सुनें (हिन्दी)</span>
              </button>
            </div>

            <span
              className={`text-xs font-bold px-3 py-1.5 rounded-lg border ${
                activeGuidance.recyclableBadge === 'high'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : activeGuidance.recyclableBadge === 'variable'
                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                  : 'bg-slate-100 text-slate-700 border-slate-300'
              }`}
            >
              Recyclability: {activeGuidance.recyclableBadge.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Action and Caveat Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 space-y-2">
            <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              <span>Recommended Action</span>
            </div>
            <p className="text-sm font-medium text-emerald-950 leading-relaxed">
              {activeGuidance.action}
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-2">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
              <AlertTriangle className="w-4 h-4 text-amber-700" />
              <span>Important Caveat & Constraints</span>
            </div>
            <p className="text-sm font-medium text-amber-950 leading-relaxed">
              {activeGuidance.caveat}
            </p>
          </div>
        </div>

        {/* Preparation & Sorting Tips */}
        <div className="space-y-3 pt-2">
          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-600" />
            <span>Preparation & Recycling Best Practices</span>
          </h4>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {activeGuidance.tips.map((tip, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700"
              >
                <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span className="leading-relaxed">{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Grid of all classes */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-900">
          All Classification Guidelines
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEntries.map(([className, item]) => {
            const colors = CLASS_COLORS[className] || CLASS_COLORS.Other_Waste;
            return (
              <div
                key={className}
                onClick={() => setSelectedClass(className)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                  selectedClass === className
                    ? 'border-emerald-600 bg-white ring-2 ring-emerald-600/20 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-slate-100">
                      {classIcons[className]}
                    </div>
                    <h4 className="font-bold text-sm text-slate-900">
                      {formatClassLabel(className)}
                    </h4>
                  </div>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${colors.badge}`}
                  >
                    {item.category}
                  </span>
                </div>

                <div className="space-y-2 text-xs text-slate-600">
                  <p>
                    <strong className="text-slate-800">Action:</strong> {item.action}
                  </p>
                  <p className="text-slate-500 italic">
                    <strong className="text-slate-600">Notice:</strong> {item.caveat}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
