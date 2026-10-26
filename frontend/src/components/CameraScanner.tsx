import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Camera,
  CameraOff,
  RefreshCw,
  Sparkles,
  Sliders,
  Play,
  Square,
  ArrowRight,
  ShieldAlert,
  FileText,
  Wine,
  Package,
  HelpCircle
} from 'lucide-react';
import { predictImage, ApiError } from '../services/api';
import type { PredictResponse } from '../types';
import { formatClassLabel, getWasteGuidance } from '../constants/wasteGuidance';
import { saveLocalHistoryItem } from '../utils/historyStorage';
import { awardPoints } from '../utils/rewardsStorage';

interface CameraScannerProps {
  confidenceThreshold: number;
  onConfidenceChange: (val: number) => void;
  onNavigateToFeedback: (prediction: PredictResponse, previewUrl: string) => void;
  onPointsAwarded: (pts: number, reason: string) => void;
  onHistoryUpdated: () => void;
}

export const CameraScanner: React.FC<CameraScannerProps> = ({
  confidenceThreshold,
  onConfidenceChange,
  onNavigateToFeedback,
  onPointsAwarded,
  onHistoryUpdated,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const autoScanIntervalRef = useRef<number | null>(null);

  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isAutoScanActive, setIsAutoScanActive] = useState<boolean>(false);
  const [lastPrediction, setLastPrediction] = useState<PredictResponse | null>(null);
  const [capturedSnapshotUrl, setCapturedSnapshotUrl] = useState<string | null>(null);

  // Initialize camera stream
  const startCamera = useCallback(async () => {
    setCameraError(null);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access API is not supported in this browser environment.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setHasCameraPermission(true);
    } catch (err: unknown) {
      console.warn('Camera initialization error:', err);
      setHasCameraPermission(false);
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          setCameraError('Camera permission was denied. Please allow camera permissions in your browser bar.');
        } else if (err.name === 'NotFoundError') {
          setCameraError('No camera device was detected on your computer.');
        } else {
          setCameraError(err.message || 'Unable to access camera.');
        }
      } else {
        setCameraError('Failed to access camera.');
      }
    }
  }, [facingMode]);

  useEffect(() => {
    startCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (autoScanIntervalRef.current) {
        clearInterval(autoScanIntervalRef.current);
      }
    };
  }, [startCamera]);

  // Capture frame from video and run inference
  const captureAndDetect = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || isScanning) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    setIsScanning(true);

    try {
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.92)
      );

      if (!blob) throw new Error('Could not capture frame from camera.');

      const file = new File([blob], `camera-scan-${Date.now()}.jpg`, {
        type: 'image/jpeg',
      });

      const snapshotUrl = canvas.toDataURL('image/jpeg');
      setCapturedSnapshotUrl(snapshotUrl);

      const result = await predictImage(file, confidenceThreshold);
      setLastPrediction(result);

      // Save to local history
      saveLocalHistoryItem({
        id: crypto.randomUUID(),
        imageId: result.image_id,
        timestamp: Date.now(),
        fileName: `Live Camera Scan (${new Date().toLocaleTimeString()})`,
        fileSize: blob.size,
        previewUrl: snapshotUrl,
        annotatedImageUrl: result.annotated_image,
        detections: result.detections,
        confidenceThreshold,
      });
      onHistoryUpdated();

      // Award Eco-Points for camera scan
      const firstClass = result.detections[0]?.label;
      const { userRewards } = awardPoints(15, 'Real-Time Camera Scan', {
        isCamera: true,
        classScanned: firstClass,
      });
      onPointsAwarded(15, 'Real-time Camera Scan (+15 Eco-Points!)');
      console.log('Eco-Points updated:', userRewards.points);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setCameraError(`Inference failed: ${err.message}`);
      } else {
        console.warn('Scan capture error:', err);
      }
    } finally {
      setIsScanning(false);
    }
  }, [confidenceThreshold, isScanning, onHistoryUpdated, onPointsAwarded]);

  // Auto-scan loop
  const toggleAutoScan = () => {
    if (isAutoScanActive) {
      if (autoScanIntervalRef.current) {
        clearInterval(autoScanIntervalRef.current);
        autoScanIntervalRef.current = null;
      }
      setIsAutoScanActive(false);
    } else {
      setIsAutoScanActive(true);
      captureAndDetect();
      autoScanIntervalRef.current = window.setInterval(() => {
        captureAndDetect();
      }, 3000);
    }
  };

  const switchCamera = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

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
    <div className="space-y-6">
      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Viewfinder Card */}
      <div className="relative rounded-3xl overflow-hidden bg-slate-950 border-2 border-emerald-900/60 shadow-2xl flex flex-col items-center justify-center min-h-[420px] max-h-[580px]">
        {hasCameraPermission === false ? (
          <div className="p-8 text-center text-white space-y-4 max-w-md">
            <div className="w-16 h-16 rounded-2xl bg-red-950/80 border border-red-500/40 text-red-400 mx-auto flex items-center justify-center">
              <CameraOff className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold">Camera Access Required</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {cameraError ||
                'Please grant camera permissions in your browser to scan waste items in real-time.'}
            </p>
            <button
              onClick={startCamera}
              className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-semibold text-xs transition-colors"
            >
              Retry Camera Access
            </button>
          </div>
        ) : (
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Live Video Element */}
            <video
              ref={videoRef}
              playsInline
              muted
              className="w-full h-full object-cover max-h-[580px]"
            />

            {/* Viewfinder Target & Corner Brackets */}
            <div className="absolute inset-8 pointer-events-none border border-emerald-500/20 rounded-2xl flex flex-col justify-between p-4">
              {/* Top corners */}
              <div className="flex justify-between">
                <div className="w-8 h-8 border-t-2 border-l-2 border-emerald-400 rounded-tl-lg shadow-sm" />
                <div className="w-8 h-8 border-t-2 border-r-2 border-emerald-400 rounded-tr-lg shadow-sm" />
              </div>

              {/* Scanning Laser Animation */}
              {isScanning && (
                <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-lg shadow-emerald-400/80 animate-pulse" />
              )}

              {/* Bottom corners */}
              <div className="flex justify-between">
                <div className="w-8 h-8 border-b-2 border-l-2 border-emerald-400 rounded-bl-lg shadow-sm" />
                <div className="w-8 h-8 border-b-2 border-r-2 border-emerald-400 rounded-br-lg shadow-sm" />
              </div>
            </div>

            {/* Top HUD Bar */}
            <div className="absolute top-4 inset-x-4 flex items-center justify-between text-xs font-mono pointer-events-auto">
              <div className="flex items-center gap-2 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-emerald-500/30 text-white shadow-lg">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="text-[11px] font-semibold tracking-wide">
                  {isAutoScanActive ? 'AUTO-SCAN STREAM (3s)' : 'LIVE CAMERA'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={switchCamera}
                  className="bg-slate-950/80 hover:bg-slate-900 text-white p-2 rounded-full border border-white/20 backdrop-blur-md transition-colors"
                  title="Switch front/back camera"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Bottom Floating Detected Badge Overlay */}
            {lastPrediction && lastPrediction.detections.length > 0 && (
              <div className="absolute bottom-20 inset-x-6 z-20 pointer-events-auto animate-in fade-in slide-in-from-bottom-2">
                <div className="bg-slate-950/90 backdrop-blur-md p-4 rounded-2xl border border-emerald-500/40 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-white">
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="p-2.5 rounded-xl bg-emerald-900/60 border border-emerald-500/30">
                      {getClassIcon(lastPrediction.detections[0].label)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">
                          {formatClassLabel(lastPrediction.detections[0].label)}
                        </span>
                        <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-600/40">
                          {Math.round(lastPrediction.detections[0].confidence * 100)}%
                        </span>
                      </div>
                      <p className="text-[11px] text-emerald-200/90 mt-0.5 line-clamp-1">
                        {getWasteGuidance(lastPrediction.detections[0].label).action}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      onNavigateToFeedback(
                        lastPrediction,
                        capturedSnapshotUrl || lastPrediction.annotated_image
                      )
                    }
                    className="shrink-0 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold transition-colors flex items-center gap-1.5"
                  >
                    <span>Review Label</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Viewfinder Bottom Controls Bar */}
        <div className="absolute bottom-4 inset-x-4 flex items-center justify-center gap-4 z-10 pointer-events-auto">
          {/* Snap Button */}
          <button
            onClick={captureAndDetect}
            disabled={isScanning || hasCameraPermission === false}
            className={`flex items-center gap-2 px-6 py-3.5 rounded-2xl font-bold text-sm shadow-xl transition-all ${
              isScanning
                ? 'bg-emerald-400 text-slate-950 scale-95'
                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 active:scale-95 shadow-emerald-500/30'
            }`}
          >
            {isScanning ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Analyzing Frame...</span>
              </>
            ) : (
              <>
                <Camera className="w-5 h-5" />
                <span>Snap & Classify</span>
              </>
            )}
          </button>

          {/* Continuous Auto-Scan Toggle */}
          <button
            onClick={toggleAutoScan}
            disabled={hasCameraPermission === false}
            className={`flex items-center gap-2 px-4 py-3.5 rounded-2xl font-semibold text-xs border backdrop-blur-md transition-all ${
              isAutoScanActive
                ? 'bg-red-600 text-white border-red-500'
                : 'bg-slate-950/80 text-white border-white/20 hover:bg-slate-900'
            }`}
            title="Automatically run detection every 3 seconds"
          >
            {isAutoScanActive ? (
              <>
                <Square className="w-4 h-4 fill-white" />
                <span>Stop Auto-Scan</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-emerald-400 text-emerald-400" />
                <span>Auto-Scan</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Confidence threshold & tips */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Sliders className="w-4 h-4 text-emerald-700" />
          <span className="font-semibold text-slate-700">Sensitivity:</span>
          <input
            type="range"
            min="0.05"
            max="0.95"
            step="0.05"
            value={confidenceThreshold}
            onChange={(e) => onConfidenceChange(parseFloat(e.target.value))}
            className="w-36 accent-emerald-700 cursor-pointer"
          />
          <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            {Math.round(confidenceThreshold * 100)}%
          </span>
        </div>

        <div className="text-slate-500 text-[11px] flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Each live scan rewards you with +15 Eco-Points!</span>
        </div>
      </div>
    </div>
  );
};
