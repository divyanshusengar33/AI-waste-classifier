import React, { useState, useEffect } from 'react';
import {
  Edit3,
  CheckCircle2,
  Trash2,
  Plus,
  AlertCircle,
  Save,
  RotateCcw,
  Trophy,
  Sparkles,
  Image as ImageIcon,
  Layers,
  Upload,
  Clock
} from 'lucide-react';
import { submitFeedback, ApiError } from '../services/api';
import type {
  PredictResponse,
  CorrectedDetection,
  FeedbackResponse,
  HistoryItem,
} from '../types';
import { formatClassLabel, CLASS_COLORS } from '../constants/wasteGuidance';
import { markHistoryItemFeedback, getLocalHistory } from '../utils/historyStorage';

interface FeedbackPageProps {
  currentPrediction: PredictResponse | null;
  imagePreviewUrl: string | null;
  onFeedbackSaved: () => void;
  onNavigateToDetect: () => void;
}

interface EditableBox {
  id: string;
  class_id: number;
  label: string;
  x_center: number;
  y_center: number;
  width: number;
  height: number;
}

export const FeedbackPage: React.FC<FeedbackPageProps> = ({
  currentPrediction,
  imagePreviewUrl,
  onFeedbackSaved,
  onNavigateToDetect,
}) => {
  const [activeImageId, setActiveImageId] = useState<string>('');
  const [activePreviewUrl, setActivePreviewUrl] = useState<string | null>(null);
  const [boxes, setBoxes] = useState<EditableBox[]>([]);
  const [selectedBoxId, setSelectedBoxId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState<FeedbackResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [recentScans, setRecentScans] = useState<HistoryItem[]>([]);
  const [showRecentDrawer, setShowRecentDrawer] = useState<boolean>(false);
  const [manualIdEdit, setManualIdEdit] = useState<boolean>(false);

  // Available classes in backend model
  const classOptions = [
    { id: 0, name: 'Plastic' },
    { id: 1, name: 'Paper_Cardboard' },
    { id: 2, name: 'Metal' },
    { id: 3, name: 'Glass' },
    { id: 4, name: 'Other_Waste' },
  ];

  // Load recent scans from local history
  useEffect(() => {
    const history = getLocalHistory();
    setRecentScans(history);
  }, []);

  // Initialize from props if available, or load latest scan from history
  useEffect(() => {
    if (currentPrediction) {
      setActiveImageId(currentPrediction.image_id);
      setActivePreviewUrl(imagePreviewUrl || currentPrediction.annotated_image || null);
      const converted: EditableBox[] = currentPrediction.detections.map(
        (det, idx) => ({
          id: `box-${idx}-${Date.now()}`,
          class_id: det.class_id,
          label: det.label,
          x_center: det.bbox_yolo[0],
          y_center: det.bbox_yolo[1],
          width: det.bbox_yolo[2],
          height: det.bbox_yolo[3],
        })
      );
      setBoxes(converted);
      if (converted.length > 0) setSelectedBoxId(converted[0].id);
    } else {
      const history = getLocalHistory();
      if (history.length > 0) {
        const latest = history[0];
        handleLoadHistoryItem(latest);
      }
    }
  }, [currentPrediction, imagePreviewUrl]);

  const handleLoadHistoryItem = (item: HistoryItem) => {
    setActiveImageId(item.imageId);
    setActivePreviewUrl(item.previewUrl || item.annotatedImageUrl || null);
    const converted: EditableBox[] = item.detections.map((det, idx) => ({
      id: `box-${idx}-${Date.now()}`,
      class_id: det.class_id,
      label: det.label,
      x_center: det.bbox_yolo[0],
      y_center: det.bbox_yolo[1],
      width: det.bbox_yolo[2],
      height: det.bbox_yolo[3],
    }));
    setBoxes(converted);
    if (converted.length > 0) setSelectedBoxId(converted[0].id);
    setFeedbackSuccess(null);
    setErrorMessage(null);
    setShowRecentDrawer(false);
  };

  const handleClassChange = (boxId: string, newClassId: number) => {
    const selectedClass = classOptions.find((c) => c.id === newClassId);
    setBoxes((prev) =>
      prev.map((box) =>
        box.id === boxId
          ? {
              ...box,
              class_id: newClassId,
              label: selectedClass ? selectedClass.name : box.label,
            }
          : box
      )
    );
  };

  const handleCoordChange = (
    boxId: string,
    field: 'x_center' | 'y_center' | 'width' | 'height',
    val: number
  ) => {
    const clamped = Math.max(0.01, Math.min(1, val));
    setBoxes((prev) =>
      prev.map((box) => (box.id === boxId ? { ...box, [field]: clamped } : box))
    );
  };

  const handleNudge = (
    boxId: string,
    dx: number,
    dy: number,
    dw: number = 0,
    dh: number = 0
  ) => {
    setBoxes((prev) =>
      prev.map((box) => {
        if (box.id !== boxId) return box;
        const newX = Math.max(0.05, Math.min(0.95, box.x_center + dx));
        const newY = Math.max(0.05, Math.min(0.95, box.y_center + dy));
        const newW = Math.max(0.05, Math.min(0.95, box.width + dw));
        const newH = Math.max(0.05, Math.min(0.95, box.height + dh));
        return {
          ...box,
          x_center: parseFloat(newX.toFixed(3)),
          y_center: parseFloat(newY.toFixed(3)),
          width: parseFloat(newW.toFixed(3)),
          height: parseFloat(newH.toFixed(3)),
        };
      })
    );
  };

  const handleRemoveBox = (boxId: string) => {
    setBoxes((prev) => prev.filter((box) => box.id !== boxId));
    if (selectedBoxId === boxId) setSelectedBoxId(null);
  };

  const handleAddBox = () => {
    const newBox: EditableBox = {
      id: `box-manual-${Date.now()}`,
      class_id: 0,
      label: 'Plastic',
      x_center: 0.5,
      y_center: 0.5,
      width: 0.25,
      height: 0.25,
    };
    setBoxes((prev) => [...prev, newBox]);
    setSelectedBoxId(newBox.id);
  };

  const handleResetToPrediction = () => {
    if (!currentPrediction) return;
    const original: EditableBox[] = currentPrediction.detections.map(
      (det, idx) => ({
        id: `box-${idx}-${Date.now()}`,
        class_id: det.class_id,
        label: det.label,
        x_center: det.bbox_yolo[0],
        y_center: det.bbox_yolo[1],
        width: det.bbox_yolo[2],
        height: det.bbox_yolo[3],
      })
    );
    setBoxes(original);
    if (original.length > 0) setSelectedBoxId(original[0].id);
    setFeedbackSuccess(null);
    setErrorMessage(null);
  };

  const handleSubmitFeedback = async () => {
    if (!activeImageId.trim()) {
      setErrorMessage('Please select or specify a target Image ID to associate corrections.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const payloadCorrections: CorrectedDetection[] = boxes.map((box) => ({
      class_id: box.class_id,
      x_center: parseFloat(box.x_center.toFixed(4)),
      y_center: parseFloat(box.y_center.toFixed(4)),
      width: parseFloat(box.width.toFixed(4)),
      height: parseFloat(box.height.toFixed(4)),
    }));

    try {
      const response = await submitFeedback({
        image_id: activeImageId.trim(),
        corrections: payloadCorrections,
      });

      setFeedbackSuccess(response);
      markHistoryItemFeedback(activeImageId.trim());
      onFeedbackSaved();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to submit feedback. Check your backend status.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header with Eco-Points Incentive Pill */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 text-xs font-semibold mb-2">
            <Edit3 className="w-3.5 h-3.5 text-emerald-700" />
            <span>Human-in-the-Loop Model Review</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Review & Label Corrections
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-3xl">
            Verify bounding box alignments, correct waste classifications, and contribute verified training samples to improve future YOLOv8 model iterations.
          </p>
        </div>

        {/* Eco-Points Incentive Badge */}
        <div className="flex items-center gap-3 bg-gradient-to-r from-emerald-50 to-emerald-100/70 border border-emerald-200 p-3 rounded-2xl shadow-2xs self-start sm:self-auto">
          <div className="w-10 h-10 rounded-xl bg-emerald-800 text-white flex items-center justify-center shadow-xs">
            <Trophy className="w-5 h-5 text-emerald-300" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-950">
              <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
              <span>+50 Eco-Points</span>
            </div>
            <p className="text-[11px] text-emerald-800">
              Awarded for every verified review
            </p>
          </div>
        </div>
      </div>

      {/* Success Celebration Banner */}
      {feedbackSuccess && (
        <div className="p-6 rounded-3xl bg-emerald-50 border border-emerald-300 text-emerald-950 space-y-4 animate-in fade-in zoom-in-95 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">
                  Label Verification Successfully Saved!
                </h4>
                <p className="text-xs text-emerald-800 mt-0.5">
                  50 Eco-Points added to your balance. Your corrections will be included in the next model retraining batch.
                </p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold bg-white px-2.5 py-1 rounded-lg border border-emerald-300 text-emerald-900">
              +{feedbackSuccess.correction_count} Boxes Stored
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={onNavigateToDetect}
              className="px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold shadow-xs transition-colors"
            >
              Scan Another Waste Item
            </button>
            <button
              onClick={() => setFeedbackSuccess(null)}
              className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
            >
              Continue Refining Boxes
            </button>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-900 flex items-start gap-3 animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs">
            <span className="font-bold">Notice: </span>
            {errorMessage}
          </div>
        </div>
      )}

      {/* Top Scan Selector Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
            <ImageIcon className="w-5 h-5 text-emerald-700" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800">Active Review Target:</span>
              <span className="text-xs font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded truncate max-w-xs">
                {activeImageId || 'No image loaded'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {boxes.length} bounding box{boxes.length === 1 ? '' : 'es'} ready for verification
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {recentScans.length > 0 && (
            <button
              onClick={() => setShowRecentDrawer(!showRecentDrawer)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
            >
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>Choose Scan ({recentScans.length})</span>
            </button>
          )}

          <button
            onClick={onNavigateToDetect}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Scan New Photo</span>
          </button>
        </div>
      </div>

      {/* Recent Scans Drawer / Selector Strip */}
      {showRecentDrawer && recentScans.length > 0 && (
        <div className="p-4 rounded-2xl bg-slate-100/80 border border-slate-200 space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">
              Select a previous scan to review & correct:
            </span>
            <button
              onClick={() => setShowRecentDrawer(false)}
              className="text-xs text-slate-400 hover:text-slate-700"
            >
              Close
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {recentScans.slice(0, 6).map((item) => (
              <div
                key={item.id}
                onClick={() => handleLoadHistoryItem(item)}
                className={`p-2 rounded-xl border bg-white cursor-pointer transition-all hover:scale-102 ${
                  activeImageId === item.imageId
                    ? 'border-emerald-600 ring-2 ring-emerald-600/20 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="aspect-square rounded-lg bg-slate-900 overflow-hidden mb-1.5 flex items-center justify-center">
                  <img
                    src={item.previewUrl || item.annotatedImageUrl}
                    alt={item.fileName}
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-[10px] font-semibold text-slate-800 truncate">
                  {item.fileName}
                </p>
                <p className="text-[9px] text-slate-400">
                  {item.detections.length} item{item.detections.length === 1 ? '' : 's'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Studio: 2 Columns (Interactive Visual Canvas on Left, Box Controls on Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Visual Canvas */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-700" />
              <h3 className="font-bold text-base text-slate-900">
                Visual Annotation Studio
              </h3>
            </div>
            <span className="text-xs text-slate-400">
              Click any box to inspect & adjust
            </span>
          </div>

          {/* Interactive Bounding Box Viewport */}
          <div className="relative w-full aspect-4/3 rounded-2xl overflow-hidden bg-slate-950 flex items-center justify-center border border-slate-200 select-none shadow-inner">
            {activePreviewUrl ? (
              <div className="relative w-full h-full flex items-center justify-center">
                <img
                  src={activePreviewUrl}
                  alt="Review scan"
                  className="w-full h-full object-contain pointer-events-none"
                />

                {/* Render Interactive Bounding Boxes */}
                {boxes.map((box, idx) => {
                  const isSelected = selectedBoxId === box.id;
                  const colorConfig = CLASS_COLORS[box.label] || CLASS_COLORS.Other_Waste;

                  const leftPct = Math.max(0, (box.x_center - box.width / 2) * 100);
                  const topPct = Math.max(0, (box.y_center - box.height / 2) * 100);
                  const widthPct = Math.min(100 - leftPct, box.width * 100);
                  const heightPct = Math.min(100 - topPct, box.height * 100);

                  return (
                    <div
                      key={box.id}
                      onClick={() => setSelectedBoxId(box.id)}
                      className={`absolute cursor-pointer transition-all duration-150 rounded-sm ${
                        isSelected
                          ? 'border-2 ring-4 ring-white/30 z-20'
                          : 'border-2 opacity-85 hover:opacity-100 z-10'
                      }`}
                      style={{
                        left: `${leftPct}%`,
                        top: `${topPct}%`,
                        width: `${widthPct}%`,
                        height: `${heightPct}%`,
                        borderColor: colorConfig.chartColor,
                        backgroundColor: `${colorConfig.chartColor}22`,
                      }}
                    >
                      {/* Box Label Tag */}
                      <span
                        className="absolute -top-6 left-0 px-1.5 py-0.5 rounded text-[10px] font-bold text-white whitespace-nowrap shadow-xs"
                        style={{ backgroundColor: colorConfig.chartColor }}
                      >
                        #{idx + 1} {formatClassLabel(box.label)}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center p-8 text-slate-400 space-y-3">
                <ImageIcon className="w-12 h-12 mx-auto text-slate-600" />
                <p className="text-xs font-semibold">No Image Preview Available</p>
                <button
                  onClick={onNavigateToDetect}
                  className="px-4 py-2 rounded-xl bg-emerald-800 text-white text-xs font-bold"
                >
                  Scan an Image First
                </button>
              </div>
            )}
          </div>

          {/* Quick Coordinate Nudge Controls for Selected Box */}
          {selectedBoxId && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>Fine-Tune Alignment (Selected Box):</span>
                <span className="text-[11px] font-mono text-emerald-800">
                  {boxes.find((b) => b.id === selectedBoxId)?.label}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] text-slate-400 font-medium">Position:</span>
                <button
                  onClick={() => handleNudge(selectedBoxId, -0.02, 0)}
                  className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-bold hover:bg-slate-100"
                >
                  ← Left
                </button>
                <button
                  onClick={() => handleNudge(selectedBoxId, 0.02, 0)}
                  className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-bold hover:bg-slate-100"
                >
                  Right →
                </button>
                <button
                  onClick={() => handleNudge(selectedBoxId, 0, -0.02)}
                  className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-bold hover:bg-slate-100"
                >
                  ↑ Up
                </button>
                <button
                  onClick={() => handleNudge(selectedBoxId, 0, 0.02)}
                  className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-bold hover:bg-slate-100"
                >
                  Down ↓
                </button>

                <div className="h-4 w-px bg-slate-200 mx-1" />

                <span className="text-[11px] text-slate-400 font-medium">Size:</span>
                <button
                  onClick={() => handleNudge(selectedBoxId, 0, 0, 0.03, 0.03)}
                  className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-bold hover:bg-slate-100"
                >
                  + Enlarge
                </button>
                <button
                  onClick={() => handleNudge(selectedBoxId, 0, 0, -0.03, -0.03)}
                  className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-bold hover:bg-slate-100"
                >
                  - Shrink
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Editable Box List & Submit */}
        <div className="lg:col-span-5 space-y-5">
          {/* Box Header Toolbar */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Detected Boxes ({boxes.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Select correct waste class or remove false positives
                </p>
              </div>

              <div className="flex items-center gap-2">
                {currentPrediction && (
                  <button
                    onClick={handleResetToPrediction}
                    title="Restore initial YOLO detections"
                    className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={handleAddBox}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Box</span>
                </button>
              </div>
            </div>

            {/* List of Editable Boxes */}
            {boxes.length === 0 ? (
              <div className="p-8 rounded-2xl border border-dashed border-slate-200 text-center space-y-2 bg-slate-50/70">
                <p className="text-xs font-bold text-slate-700">No Bounding Boxes Defined</p>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  If this image has no waste items, submitting 0 boxes will verify the negative sample.
                </p>
                <button
                  onClick={handleAddBox}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 pt-1 hover:underline"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add a manual box</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {boxes.map((box, idx) => {
                  const isSelected = selectedBoxId === box.id;
                  const colorConfig = CLASS_COLORS[box.label] || CLASS_COLORS.Other_Waste;

                  return (
                    <div
                      key={box.id}
                      onClick={() => setSelectedBoxId(box.id)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-3 ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50/40 shadow-xs ring-1 ring-emerald-600/20'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-5 h-5 rounded-md text-white text-[11px] font-bold flex items-center justify-center shrink-0"
                            style={{ backgroundColor: colorConfig.chartColor }}
                          >
                            #{idx + 1}
                          </span>
                          <span className="text-xs font-bold text-slate-900">
                            {formatClassLabel(box.label)}
                          </span>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveBox(box.id);
                          }}
                          className="text-slate-400 hover:text-red-600 p-1 rounded-lg transition-colors"
                          title="Delete box"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Class Selection Dropdown */}
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                          Correct Category:
                        </label>
                        <select
                          value={box.class_id}
                          onChange={(e) =>
                            handleClassChange(box.id, parseInt(e.target.value, 10))
                          }
                          className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
                        >
                          {classOptions.map((opt) => (
                            <option key={opt.id} value={opt.id}>
                              {formatClassLabel(opt.name)} (Class {opt.id})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Coordinates (Center X, Y, W, H) */}
                      <div className="grid grid-cols-4 gap-1.5 text-center text-[10px] font-mono">
                        <div className="bg-slate-100 p-1.5 rounded-lg border border-slate-200/60">
                          <span className="text-slate-400 block text-[9px]">X</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max="1"
                            value={box.x_center}
                            onChange={(e) =>
                              handleCoordChange(box.id, 'x_center', parseFloat(e.target.value) || 0)
                            }
                            className="w-full text-center bg-transparent font-bold text-slate-800 text-xs focus:outline-none"
                          />
                        </div>
                        <div className="bg-slate-100 p-1.5 rounded-lg border border-slate-200/60">
                          <span className="text-slate-400 block text-[9px]">Y</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max="1"
                            value={box.y_center}
                            onChange={(e) =>
                              handleCoordChange(box.id, 'y_center', parseFloat(e.target.value) || 0)
                            }
                            className="w-full text-center bg-transparent font-bold text-slate-800 text-xs focus:outline-none"
                          />
                        </div>
                        <div className="bg-slate-100 p-1.5 rounded-lg border border-slate-200/60">
                          <span className="text-slate-400 block text-[9px]">W</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            max="1"
                            value={box.width}
                            onChange={(e) =>
                              handleCoordChange(box.id, 'width', parseFloat(e.target.value) || 0.05)
                            }
                            className="w-full text-center bg-transparent font-bold text-slate-800 text-xs focus:outline-none"
                          />
                        </div>
                        <div className="bg-slate-100 p-1.5 rounded-lg border border-slate-200/60">
                          <span className="text-slate-400 block text-[9px]">H</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            max="1"
                            value={box.height}
                            onChange={(e) =>
                              handleCoordChange(box.id, 'height', parseFloat(e.target.value) || 0.05)
                            }
                            className="w-full text-center bg-transparent font-bold text-slate-800 text-xs focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Submission Action Button */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <button
                type="button"
                onClick={handleSubmitFeedback}
                disabled={isSubmitting || !activeImageId.trim()}
                className={`w-full py-3 px-4 rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 ${
                  isSubmitting || !activeImageId.trim()
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                    : 'bg-emerald-800 hover:bg-emerald-900 text-white shadow-emerald-800/20 active:scale-98'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    <span>Submitting Verified Labels...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Submit Verified Review (+50 Eco-Points)</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                <span>Saved directly to backend feedback database</span>
                <button
                  type="button"
                  onClick={() => setManualIdEdit(!manualIdEdit)}
                  className="hover:text-slate-600 underline"
                >
                  {manualIdEdit ? 'Hide ID field' : 'Edit Image ID'}
                </button>
              </div>

              {manualIdEdit && (
                <div className="pt-1">
                  <input
                    type="text"
                    value={activeImageId}
                    onChange={(e) => setActiveImageId(e.target.value)}
                    placeholder="Custom image UUID"
                    className="w-full text-[11px] font-mono px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
