import React, { useState } from 'react';
import {
  History,
  Trash2,
  Calendar,
  ArrowRight,
  Sparkles,
  Info,
  CheckCircle2,
  Filter,
  X
} from 'lucide-react';
import type { HistoryItem, Detection } from '../types';
import {
  CLASS_COLORS,
  formatClassLabel,
} from '../constants/wasteGuidance';
import {
  deleteHistoryItem,
  clearLocalHistory,
} from '../utils/historyStorage';

interface HistoryPageProps {
  historyItems: HistoryItem[];
  onHistoryUpdated: () => void;
  onSelectHistoryForFeedback: (item: HistoryItem) => void;
  onNavigateToDetect: () => void;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({
  historyItems,
  onHistoryUpdated,
  onSelectHistoryForFeedback,
  onNavigateToDetect,
}) => {
  const [filterClass, setFilterClass] = useState<string>('all');
  const [modalItem, setModalItem] = useState<HistoryItem | null>(null);

  const availableClasses = ['all', 'Plastic', 'Paper_Cardboard', 'Metal', 'Glass', 'Other_Waste'];

  const filteredItems = historyItems.filter((item) => {
    if (filterClass === 'all') return true;
    return item.detections.some((d) => d.label === filterClass);
  });

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteHistoryItem(id);
    onHistoryUpdated();
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear your local analysis history?')) {
      clearLocalHistory();
      onHistoryUpdated();
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 text-xs font-semibold mb-2">
            <History className="w-3.5 h-3.5" />
            <span>Local Browser Records</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Classification History
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Review your previously classified images, confidence levels, and detected materials.
          </p>
        </div>

        {historyItems.length > 0 && (
          <button
            onClick={handleClearAll}
            className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Local History</span>
          </button>
        )}
      </div>

      {/* Architecture Transparency Banner */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3 text-xs text-slate-700">
        <Info className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-slate-900">
            Client-Side Privacy Architecture:
          </p>
          <p className="text-slate-600 leading-relaxed">
            The EcoSort FastAPI backend handles image inference and feedback reviews without exposing a public
            history log API. For your privacy, past detection results are stored securely in your browser's{' '}
            <code className="bg-slate-200/80 px-1 py-0.5 rounded font-mono text-[11px]">localStorage</code>.
          </p>
        </div>
      </div>

      {/* Filter and Count Bar */}
      {historyItems.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-semibold text-slate-700">Filter by category:</span>
            <div className="flex flex-wrap gap-1">
              {availableClasses.map((cls) => (
                <button
                  key={cls}
                  onClick={() => setFilterClass(cls)}
                  className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors ${
                    filterClass === cls
                      ? 'bg-emerald-800 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cls === 'all' ? 'All Classes' : formatClassLabel(cls)}
                </button>
              ))}
            </div>
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Showing {filteredItems.length} of {historyItems.length} records
          </div>
        </div>
      )}

      {/* History Items Grid */}
      {historyItems.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4 shadow-xs">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
            <History className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="text-base font-bold text-slate-900">
              No Classification Records Yet
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              When you upload images and run waste classification, your results will appear here for easy comparison and review.
            </p>
          </div>
          <button
            onClick={onNavigateToDetect}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs transition-colors"
          >
            <Sparkles className="w-4 h-4 text-emerald-300" />
            <span>Classify First Image</span>
          </button>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 text-xs">
          No records match the selected class filter "{formatClassLabel(filterClass)}".
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredItems.map((item) => {
            const dateStr = new Date(item.timestamp).toLocaleString();
            return (
              <div
                key={item.id}
                onClick={() => setModalItem(item)}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between overflow-hidden cursor-pointer group"
              >
                <div>
                  {/* Thumbnail */}
                  <div className="relative bg-slate-950 aspect-video overflow-hidden flex items-center justify-center">
                    <img
                      src={item.annotatedImageUrl || item.previewUrl}
                      alt={item.fileName}
                      className="w-full h-full object-cover transition-transform group-hover:scale-102"
                    />
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-slate-900/80 text-white text-[10px] font-mono backdrop-blur-xs">
                      {item.detections.length} item{item.detections.length === 1 ? '' : 's'}
                    </div>
                    {item.feedbackSubmitted && (
                      <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-emerald-600/90 text-white text-[10px] font-semibold backdrop-blur-xs flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Reviewed</span>
                      </div>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-900 truncate">
                          {item.fileName}
                        </h4>
                        <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                          <Calendar className="w-3 h-3" />
                          <span>{dateStr}</span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => handleDelete(item.id, e)}
                        className="text-slate-300 hover:text-red-600 p-1 rounded transition-colors"
                        title="Delete from local history"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Detected classes pill summary */}
                    <div className="flex flex-wrap gap-1.5">
                      {item.detections.length === 0 ? (
                        <span className="text-[10px] text-slate-400 italic">
                          No items detected
                        </span>
                      ) : (
                        item.detections.map((det: Detection, idx: number) => {
                          const colors = CLASS_COLORS[det.label] || CLASS_COLORS.Other_Waste;
                          return (
                            <span
                              key={idx}
                              className={`text-[10px] font-medium px-2 py-0.5 rounded-md border ${colors.badge}`}
                            >
                              {formatClassLabel(det.label)} ({Math.round(det.confidence * 100)}%)
                            </span>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400 font-mono">
                    Conf: {Math.round(item.confidenceThreshold * 100)}%
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectHistoryForFeedback(item);
                    }}
                    className="inline-flex items-center gap-1 font-semibold text-emerald-800 hover:text-emerald-950 text-xs"
                  >
                    <span>Review Feedback</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal for viewing detailed history item */}
      {modalItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {modalItem.fileName}
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  Image ID: {modalItem.imageId}
                </p>
              </div>
              <button
                onClick={() => setModalItem(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Annotated image full preview */}
            <div className="relative rounded-2xl overflow-hidden bg-slate-950 flex items-center justify-center max-h-96">
              <img
                src={modalItem.annotatedImageUrl || modalItem.previewUrl}
                alt="Prediction detail"
                className="max-h-96 object-contain"
              />
            </div>

            {/* Detections breakdown */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-800">
                Detected Objects ({modalItem.detections.length})
              </h4>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {modalItem.detections.map((det, idx) => {
                  const colors = CLASS_COLORS[det.label] || CLASS_COLORS.Other_Waste;
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-700">#{idx + 1}</span>
                        <span className="font-semibold text-slate-900">
                          {formatClassLabel(det.label)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] text-slate-400 font-mono">
                          [{det.bbox_xyxy.join(', ')}]
                        </span>
                        <span
                          className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] border ${colors.badge}`}
                        >
                          {Math.round(det.confidence * 100)}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={() => setModalItem(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50"
              >
                Close
              </button>
              <button
                onClick={() => {
                  onSelectHistoryForFeedback(modalItem);
                  setModalItem(null);
                }}
                className="px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold"
              >
                Open in Annotation Reviewer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
