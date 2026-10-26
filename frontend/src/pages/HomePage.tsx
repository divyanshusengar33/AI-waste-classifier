import React, { useRef, useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  Upload,
  ShieldCheck,
  ChevronRight,
  Package,
  FileText,
  Wine,
  HelpCircle,
  AlertCircle
} from 'lucide-react';
import { WASTE_GUIDANCE_MAP, CLASS_COLORS, formatClassLabel } from '../constants/wasteGuidance';

interface HomePageProps {
  onStartDetection: (file?: File) => void;
  onNavigateTab: (tab: string) => void;
  isBackendHealthy?: boolean | null;
  feedbackRecordCount?: number | null;
  historyCount?: number;
}

export const HomePage: React.FC<HomePageProps> = ({
  onStartDetection,
  onNavigateTab,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragError, setDragError] = useState<string | null>(null);

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setDragError(null);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        setDragError('Please drop a valid image file (JPG, PNG, or WEBP).');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setDragError('File exceeds 10 MB limit.');
        return;
      }
      onStartDetection(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      onStartDetection(file);
    }
  };

  const classIcons: Record<string, React.ReactNode> = {
    Plastic: <Package className="w-5 h-5 text-amber-600" />,
    Paper_Cardboard: <FileText className="w-5 h-5 text-emerald-600" />,
    Metal: <ShieldCheck className="w-5 h-5 text-slate-600" />,
    Glass: <Wine className="w-5 h-5 text-teal-600" />,
    Other_Waste: <HelpCircle className="w-5 h-5 text-purple-600" />,
  };

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-emerald-900 via-emerald-950 to-slate-950 text-white p-8 sm:p-12 lg:p-16 shadow-xl border border-emerald-800/40">
        {/* Subtle decorative glow circles */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-green-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-800/60 border border-emerald-600/50 text-emerald-300 text-xs font-semibold uppercase tracking-wider backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
            <span>Powered by YOLOv8 Computer Vision</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight sm:leading-none">
            Smart Waste Detection for a{' '}
            <span className="text-emerald-400 bg-clip-text">Cleaner Planet</span>
          </h1>

          <p className="text-base sm:text-lg text-emerald-100/90 leading-relaxed max-w-2xl font-normal">
            EcoSort uses deep learning to identify and classify waste materials
            in real time. Upload any photo to detect plastics, paper, metal, glass,
            and other items, accompanied by actionable recycling recommendations to divert
            waste from landfills.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-4">
            <button
              onClick={() => onStartDetection()}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/25 transition-all hover:shadow-emerald-500/40 active:scale-98"
            >
              <Upload className="w-4 h-4" />
              <span>Launch Waste Detector</span>
            </button>

            <button
              onClick={() => onNavigateTab('guidance')}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-sm border border-white/20 backdrop-blur-sm transition-all active:scale-98"
            >
              <span>Explore Disposal Directory</span>
              <ArrowRight className="w-4 h-4 text-emerald-400" />
            </button>
          </div>
        </div>

        {/* Quick Drop Area Inside Hero */}
        <div className="mt-10 pt-8 border-t border-emerald-800/60">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleFileDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-emerald-300 bg-emerald-800/50 scale-[1.01]'
                : 'border-emerald-600/60 bg-emerald-900/30 hover:bg-emerald-900/50 hover:border-emerald-500'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileInputChange}
              className="hidden"
            />
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-300 mb-1">
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-white">
                Drag and drop your waste photo here, or{' '}
                <span className="text-emerald-300 underline underline-offset-2">browse files</span>
              </p>
              <p className="text-xs text-emerald-200/70">
                Supports JPG, PNG, WEBP up to 10 MB. Processed instantly.
              </p>
              {dragError && (
                <div className="mt-2 flex items-center gap-1.5 text-xs text-red-300 bg-red-950/80 px-3 py-1 rounded-md border border-red-500/30">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{dragError}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Supported Classification Classes */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Supported Waste Categories
            </h2>
            <p className="text-xs text-slate-500">
              Trained classes natively recognized by EcoSort YOLOv8
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('guidance')}
            className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
          >
            <span>View Full Guidance Directory</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(WASTE_GUIDANCE_MAP).map(([className, item]) => {
            const colors = CLASS_COLORS[className];
            return (
              <div
                key={className}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-emerald-300 transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-slate-100">
                        {classIcons[className]}
                      </div>
                      <h4 className="font-bold text-slate-900 text-base">
                        {formatClassLabel(className)}
                      </h4>
                    </div>
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${colors.badge}`}
                    >
                      {item.recyclableBadge === 'high'
                        ? 'Recyclable'
                        : item.recyclableBadge === 'variable'
                        ? 'Check Rules'
                        : 'Special Handling'}
                    </span>
                  </div>

                  <p className="text-xs font-medium text-slate-500 mb-2">
                    {item.category}
                  </p>

                  <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="font-semibold text-slate-900">Disposal Action: </span>
                    {item.action}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 italic">
                  Caveat: {item.caveat}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Human-in-the-Loop Callout */}
      <section className="rounded-2xl bg-emerald-50 border border-emerald-200 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 uppercase tracking-wide">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span>Human-In-The-Loop Quality Control</span>
          </div>
          <h3 className="text-lg font-bold text-emerald-950">
            Help improve EcoSort's accuracy with label feedback
          </h3>
          <p className="text-xs text-emerald-800/90 max-w-xl leading-relaxed">
            Did the AI mistake a carton for plastic? Use our interactive correction tool to review bounding boxes,
            reassign categories, and save verified feedback into the review database.
          </p>
        </div>
        <button
          onClick={() => onNavigateTab('feedback')}
          className="shrink-0 px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs shadow-sm transition-colors"
        >
          Open Annotation Reviewer
        </button>
      </section>
    </div>
  );
};
