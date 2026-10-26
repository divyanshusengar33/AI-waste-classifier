export interface Detection {
  class_id: number;
  label: string;
  confidence: number;
  bbox_xyxy: [number, number, number, number];
  bbox_yolo: [number, number, number, number];
}

export interface PredictResponse {
  image_id: string;
  image_width: number;
  image_height: number;
  class_names: Record<string, string>;
  detections: Detection[];
  annotated_image: string; // Base64 Data URL (data:image/jpeg;base64,...)
}

export interface CorrectedDetection {
  class_id: number;
  x_center: number;
  y_center: number;
  width: number;
  height: number;
  label?: string;
}

export interface FeedbackPayload {
  image_id: string;
  corrections: CorrectedDetection[];
}

export interface FeedbackResponse {
  message: string;
  feedback_id: string;
  image_id: string;
  correction_count: number;
  reviewed: boolean;
  model_retrained: boolean;
}

export interface HealthResponse {
  status: string;
  model_loaded: boolean;
  classes: Record<string, string>;
}

export interface ClassItem {
  id: number;
  name: string;
}

export interface ClassesResponse {
  classes: ClassItem[];
}

export interface FeedbackCountResponse {
  total_feedback_records: number;
}

export interface WasteGuidance {
  category: string;
  action: string;
  caveat: string;
  iconName: string;
  recyclableBadge: 'high' | 'medium' | 'low' | 'variable';
  tips: string[];
}

export interface HistoryItem {
  id: string;
  imageId: string;
  timestamp: number;
  fileName: string;
  fileSize: number;
  previewUrl: string;
  annotatedImageUrl: string;
  detections: Detection[];
  confidenceThreshold: number;
  feedbackSubmitted?: boolean;
}
