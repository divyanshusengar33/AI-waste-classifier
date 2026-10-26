import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Sliders,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Image as ImageIcon,
  Layers,
  Info,
  Edit3,
  X,
  Package,
  FileText,
  ShieldAlert,
  Wine,
  HelpCircle,
  FileWarning,
  Camera,
  Volume2
} from 'lucide-react';
import { predictImage, ApiError } from '../services/api';
import type { PredictResponse, Detection } from '../types';
import {
  CLASS_COLORS,
  formatClassLabel,
  getWasteGuidance,
  WASTE_GUIDANCE_MAP
} from '../constants/wasteGuidance';
import { saveLocalHistoryItem } from '../utils/historyStorage';
import { awardPoints } from '../utils/rewardsStorage';
import { CameraScanner } from '../components/CameraScanner';
import { speakText, stopSpeech } from '../utils/speechService';
import { CLASS_TRANSLATIONS } from '../constants/translations';

interface DetectionPageProps {
  initialFile?: File | null;
  onNavigateToFeedback: (prediction: PredictResponse, originalPreview: string) => void;
  onHistoryUpdated: () => void;
  onPointsAwarded?: (pts: number, reason: string) => void;
}

export const DetectionPage: React.FC<DetectionPageProps> = ({
  initialFile,
  onNavigateToFeedback,
  onHistoryUpdated,
  onPointsAwarded,
}) => {
  const [scanMode, setScanMode] = useState<'upload' | 'camera'>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(0.25);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [predictionResult, setPredictionResult] = useState<PredictResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'annotated' | 'original'>('annotated');
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [selectedDetectionIndex, setSelectedDetectionIndex] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // If passed an initial file from HomePage
  useEffect(() => {
    if (initialFile) {
      handleFileSelected(initialFile);
    }
  }, [initialFile]);

  const handleFileSelected = (file: File) => {
    setErrorMessage(null);
    setPredictionResult(null);
    setSelectedDetectionIndex(null);

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setErrorMessage(
        `Invalid file type "${file.type || 'unknown'}". Allowed formats: JPG, JPEG, PNG, WEBP.`
      );
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage(
        `Image exceeds 10 MB limit (${(file.size / (1024 * 1024)).toFixed(2)} MB). Please select a smaller photo.`
      );
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setImagePreview(objectUrl);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleClearImage = () => {
    setSelectedFile(null);
    setImagePreview(null);
    setPredictionResult(null);
    setErrorMessage(null);
    setSelectedDetectionIndex(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRunDetection = async () => {
    if (!selectedFile) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const result = await predictImage(selectedFile, confidenceThreshold);
      setPredictionResult(result);
      setViewMode('annotated');

      // Save into local history
      saveLocalHistoryItem({
        id: crypto.randomUUID(),
        imageId: result.image_id,
        timestamp: Date.now(),
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        previewUrl: imagePreview || '',
        annotatedImageUrl: result.annotated_image,
        detections: result.detections,
        confidenceThreshold: confidenceThreshold,
      });
      onHistoryUpdated();

      // Award Eco-Points
      const firstClass = result.detections[0]?.label;
      awardPoints(25, 'Analyzed Waste Photo', { classScanned: firstClass });
      if (onPointsAwarded) {
        onPointsAwarded(25, 'Waste Photo Classification (+25 Eco-Points!)');
      }
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage(
          'An unexpected error occurred while processing the image. Check if FastAPI is running.'
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Aggregation of detections by class
  const classCounts: Record<string, number> = {};
  if (predictionResult?.detections) {
    for (const det of predictionResult.detections) {
      classCounts[det.label] = (classCounts[det.label] || 0) + 1;
    }
  }

  // Unique detected classes for guidance display
  const detectedClasses = Object.keys(classCounts);

  const getClassIcon = (label: string) => {
    switch (label) {
      case 'Plastic':
        return <Package className="w-4 h-4 text-amber-600" />;
      case 'Paper_Cardboard':
        return <FileText className="w-4 h-4 text-emerald-600" />;
      case 'Metal':
        return <ShieldAlert className="w-4 h-4 text-slate-600" />;
      case 'Glass':
        return <Wine className="w-4 h-4 text-teal-600" />;
      default:
        return <HelpCircle className="w-4 h-4 text-purple-600" />;
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive Waste Classifier</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            AI Waste Detection
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Upload an image of waste items to run real-time inference with our fine-tuned YOLOv8 model.
          </p>
        </div>

        {selectedFile && (
          <button
            onClick={handleClearImage}
            className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            <span>Choose Different Image</span>
          </button>
        )}
      </div>

      {/* Error Message Banner */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-900 flex items-start gap-3 animate-in fade-in">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-bold">Detection Request Failed</h4>
            <p className="text-xs text-red-700 mt-0.5 leading-relaxed">
              {errorMessage}
            </p>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-red-400 hover:text-red-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Mode Switcher: File Upload vs Real-Time Camera */}
      <div className="flex items-center gap-2 p-1 rounded-2xl bg-slate-100 border border-slate-200 self-start w-fit">
        <button
          onClick={() => setScanMode('upload')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            scanMode === 'upload'
              ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Upload className="w-4 h-4 text-emerald-700" />
          <span>Upload Image</span>
        </button>

        <button
          onClick={() => setScanMode('camera')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            scanMode === 'camera'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Camera className="w-4 h-4 text-emerald-300" />
          <span>Real-Time Camera Scan</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-600 text-white font-mono">
            LIVE
          </span>
        </button>
      </div>

      {scanMode === 'camera' ? (
        <CameraScanner
          confidenceThreshold={confidenceThreshold}
          onConfidenceChange={setConfidenceThreshold}
          onNavigateToFeedback={onNavigateToFeedback}
          onPointsAwarded={onPointsAwarded || (() => {})}
          onHistoryUpdated={onHistoryUpdated}
        />
      ) : (
        /* Main Grid: Upload & Controls on Left, Results & Preview on Right */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Upload dropzone and Inference Controls */}
        <div className="lg:col-span-5 space-y-6">
          {/* File Upload Box */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => !selectedFile && fileInputRef.current?.click()}
            className={`relative rounded-2xl border-2 border-dashed p-6 transition-all ${
              selectedFile
                ? 'border-slate-200 bg-white'
                : isDragOver
                ? 'border-emerald-600 bg-emerald-50 scale-[1.01]'
                : 'border-slate-300 bg-slate-50/70 hover:bg-slate-50 hover:border-emerald-500 cursor-pointer'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFileSelected(e.target.files[0]);
                }
              }}
              className="hidden"
            />

            {!selectedFile ? (
              <div className="text-center py-6 space-y-3">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Upload className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    Click to select photo or drag and drop
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Accepts JPG, JPEG, PNG, or WEBP (Max: 10 MB)
                  </p>
                </div>
                <div className="pt-2">
                  <span className="inline-block px-3 py-1 bg-white border border-slate-200 rounded-md text-xs font-medium text-slate-700 shadow-2xs">
                    Browse Computer
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative rounded-xl overflow-hidden bg-slate-900 border border-slate-200 flex items-center justify-center max-h-72">
                  <img
                    src={imagePreview || ''}
                    alt="Uploaded preview"
                    className="max-h-72 w-full object-contain"
                  />
                  <div className="absolute top-2 right-2 flex gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      className="px-2.5 py-1 rounded-md bg-slate-900/80 hover:bg-slate-900 text-white text-xs font-medium backdrop-blur-xs transition-colors"
                    >
                      Change
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <div className="truncate mr-2 font-medium text-slate-900">
                    {selectedFile.name}
                  </div>
                  <div className="shrink-0 text-slate-500">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Model Inference Settings Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-700" />
                <h3 className="text-sm font-bold text-slate-900">
                  Inference Parameters
                </h3>
              </div>
              <span className="text-xs text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded">
                YOLOv8n
              </span>
            </div>

            {/* Confidence Threshold Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <label
                  htmlFor="confidence-slider"
                  className="font-semibold text-slate-700 flex items-center gap-1"
                >
                  <span>Confidence Threshold</span>
                  <span className="text-slate-400" title="Boxes below this score are filtered out">
                    <Info className="w-3.5 h-3.5" />
                  </span>
                </label>
                <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {Math.round(confidenceThreshold * 100)}% ({confidenceThreshold.toFixed(2)})
                </span>
              </div>
              <input
                id="confidence-slider"
                type="range"
                min="0.01"
                max="0.99"
                step="0.01"
                value={confidenceThreshold}
                onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
                className="w-full accent-emerald-700 cursor-pointer h-2 bg-slate-200 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>1% (More boxes)</span>
                <span>Default: 25%</span>
                <span>99% (Strict)</span>
              </div>
            </div>

            {/* Detect Action Button */}
            <button
              onClick={handleRunDetection}
              disabled={!selectedFile || isLoading}
              className={`w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm shadow-md transition-all ${
                !selectedFile || isLoading
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                  : 'bg-emerald-800 hover:bg-emerald-900 text-white shadow-emerald-800/20 active:scale-98'
              }`}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  <span>Analyzing Image with YOLOv8...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-emerald-300" />
                  <span>Detect Waste</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Prediction Visualization and Details */}
        <div className="lg:col-span-7 space-y-6">
          {!predictionResult ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4 shadow-xs">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                <ImageIcon className="w-8 h-8" />
              </div>
              <div className="max-w-md mx-auto">
                <h3 className="text-base font-bold text-slate-800">
                  Awaiting Waste Classification
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Upload an image on the left and click <strong>Detect Waste</strong>.
                  EcoSort will highlight classified objects with bounding boxes, labels,
                  and confidence scores.
                </p>
              </div>
              <div className="pt-2 flex flex-wrap justify-center gap-2">
                {Object.keys(WASTE_GUIDANCE_MAP).map((c) => (
                  <span
                    key={c}
                    className="text-[11px] px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-medium"
                  >
                    {formatClassLabel(c)}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in">
              {/* Image Viewer Card with Tabs */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                {/* View Mode Toggle Header */}
                <div className="px-5 py-3 border-b border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-700">
                      View Mode:
                    </span>
                    <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
                      <button
                        onClick={() => setViewMode('annotated')}
                        className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                          viewMode === 'annotated'
                            ? 'bg-emerald-800 text-white'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        YOLO Annotated ({predictionResult.detections.length})
                      </button>
                      <button
                        onClick={() => setViewMode('original')}
                        className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                          viewMode === 'original'
                            ? 'bg-emerald-800 text-white'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Original Photo
                      </button>
                    </div>
                  </div>

                  <div className="text-xs text-slate-500 font-mono">
                    {predictionResult.image_width} × {predictionResult.image_height} px
                  </div>
                </div>

                {/* Display Image */}
                <div className="relative bg-slate-950 flex items-center justify-center min-h-[320px] max-h-[500px]">
                  <img
                    src={
                      viewMode === 'annotated'
                        ? predictionResult.annotated_image
                        : imagePreview || ''
                    }
                    alt="Waste classification result"
                    className="max-h-[500px] w-full object-contain"
                  />
                </div>

                {/* Quick Info Bar below image */}
                <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="font-semibold text-slate-800">
                      Analysis Complete
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-600">
                      {predictionResult.detections.length} object
                      {predictionResult.detections.length === 1 ? '' : 's'} identified
                    </span>
                  </div>

                  {/* Feedback CTA */}
                  <button
                    onClick={() =>
                      onNavigateToFeedback(predictionResult, imagePreview || '')
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Review & Correct Labels</span>
                  </button>
                </div>
              </div>

              {/* Detections List & Stats */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="w-5 h-5 text-emerald-700" />
                    <h3 className="text-base font-bold text-slate-900">
                      Classified Objects
                    </h3>
                  </div>
                  <span className="text-xs font-medium text-slate-500">
                    Threshold: {Math.round(confidenceThreshold * 100)}%
                  </span>
                </div>

                {/* Empty State if 0 detections */}
                {predictionResult.detections.length === 0 ? (
                  <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-2">
                    <FileWarning className="w-8 h-8 text-amber-500 mx-auto" />
                    <p className="text-sm font-bold text-slate-800">
                      No Waste Items Detected Above {Math.round(confidenceThreshold * 100)}%
                    </p>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Try lowering the confidence threshold using the slider on the left, or upload a photo with clearer lighting and focus.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Summary Badges */}
                    <div className="flex flex-wrap gap-2 pt-1 pb-2 border-b border-slate-100">
                      {Object.entries(classCounts).map(([label, count]) => {
                        const colors = CLASS_COLORS[label] || CLASS_COLORS.Other_Waste;
                        return (
                          <div
                            key={label}
                            className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold ${colors.badge}`}
                          >
                            {getClassIcon(label)}
                            <span>{formatClassLabel(label)}:</span>
                            <span className="font-bold">{count}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Detailed Card for Each Detection */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
                      {predictionResult.detections.map((det: Detection, idx: number) => {
                        const colors = CLASS_COLORS[det.label] || CLASS_COLORS.Other_Waste;
                        const isSelected = selectedDetectionIndex === idx;
                        const confidencePercent = Math.round(det.confidence * 100);

                        return (
                          <div
                            key={idx}
                            onClick={() =>
                              setSelectedDetectionIndex(isSelected ? null : idx)
                            }
                            className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                              isSelected
                                ? 'border-emerald-600 bg-emerald-50/50 shadow-xs'
                                : 'border-slate-200 bg-white hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center">
                                  #{idx + 1}
                                </span>
                                <span className="font-bold text-sm text-slate-900">
                                  {formatClassLabel(det.label)}
                                </span>
                              </div>
                              <span
                                className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md border ${colors.badge}`}
                              >
                                {confidencePercent}%
                              </span>
                            </div>

                            {/* Confidence Progress Bar */}
                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mb-2.5">
                              <div
                                className="h-full bg-emerald-600 rounded-full"
                                style={{ width: `${confidencePercent}%` }}
                              />
                            </div>

                            {/* Bounding Box Information */}
                            <div className="text-[10px] text-slate-500 font-mono space-y-0.5 bg-slate-50 p-2 rounded border border-slate-100">
                              <div>
                                <span className="font-medium text-slate-700">XYXY: </span>
                                [{det.bbox_xyxy.join(', ')}]
                              </div>
                              <div>
                                <span className="font-medium text-slate-700">YOLO (norm): </span>
                                [{det.bbox_yolo.join(', ')}]
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Integrated Disposal Guidance for Detected Materials */}
              {detectedClasses.length > 0 && (
                <div className="bg-emerald-50/80 rounded-2xl border border-emerald-200 p-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                    <h3 className="text-base font-bold text-emerald-950">
                      Disposal Guidance for Detected Items
                    </h3>
                  </div>
                  <p className="text-xs text-emerald-800">
                    Recommendations based on materials detected in this image:
                  </p>

                  <div className="space-y-3">
                    {detectedClasses.map((label) => {
                      const guidance = getWasteGuidance(label);
                      const colors = CLASS_COLORS[label] || CLASS_COLORS.Other_Waste;
                      return (
                        <div
                          key={label}
                          className="bg-white p-4 rounded-xl border border-emerald-200/80 shadow-2xs space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {getClassIcon(label)}
                              <h4 className="font-bold text-slate-900 text-sm">
                                {formatClassLabel(label)}
                              </h4>
                            </div>
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${colors.badge}`}
                            >
                              {guidance.category}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
                            <p className="text-xs text-slate-800 flex-1">
                              <strong>Action: </strong> {guidance.action}
                            </p>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                onClick={() => {
                                  stopSpeech();
                                  speakText(
                                    CLASS_TRANSLATIONS.en[label]?.spokenGuidance || guidance.action,
                                    'en'
                                  );
                                }}
                                title="Listen in English"
                                className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-800 text-[10px] font-semibold transition-colors"
                              >
                                <Volume2 className="w-3 h-3 text-emerald-600" />
                                <span>Listen EN</span>
                              </button>
                              <button
                                onClick={() => {
                                  stopSpeech();
                                  speakText(
                                    CLASS_TRANSLATIONS.hi[label]?.spokenGuidance ||
                                      CLASS_TRANSLATIONS.hi[label]?.action ||
                                      guidance.action,
                                    'hi'
                                  );
                                }}
                                title="हिंदी में सुनें (Listen in Hindi)"
                                className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-800 text-[10px] font-semibold transition-colors"
                              >
                                <Volume2 className="w-3 h-3 text-emerald-600" />
                                <span>सुनें HI</span>
                              </button>
                            </div>
                          </div>
                          <p className="text-xs text-slate-500 italic">
                            <strong>Notice: </strong> {guidance.caveat}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  );
};
