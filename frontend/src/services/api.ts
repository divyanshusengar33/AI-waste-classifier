import type {
  ClassesResponse,
  FeedbackCountResponse,
  FeedbackPayload,
  FeedbackResponse,
  HealthResponse,
  PredictResponse,
} from '../types';

export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
).replace(/\/$/, '');

export class ApiError extends Error {
  status?: number;
  detail?: string;

  constructor(message: string, status?: number, detail?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorDetail = '';
    try {
      const data = await response.json();
      errorDetail = data.detail || data.message || JSON.stringify(data);
    } catch {
      errorDetail = await response.text();
    }

    let friendlyMessage = `Request failed with status ${response.status}`;
    if (response.status === 413) {
      friendlyMessage = 'Image is too large. Backend limits uploads to a maximum of 10 MB.';
    } else if (response.status === 415) {
      friendlyMessage = 'Unsupported file format. Please upload a JPEG, PNG, or WEBP image.';
    } else if (response.status === 404) {
      friendlyMessage = errorDetail || 'The requested resource was not found on the backend.';
    } else if (response.status === 400) {
      friendlyMessage = errorDetail || 'Invalid request parameters.';
    } else if (errorDetail) {
      friendlyMessage = errorDetail;
    }

    throw new ApiError(friendlyMessage, response.status, errorDetail);
  }

  return response.json() as Promise<T>;
}

/**
 * Check backend health and model status
 */
export async function checkHealth(): Promise<HealthResponse> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    const response = await fetch(`${API_BASE_URL}/health`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return await handleResponse<HealthResponse>(response);
  } catch (err: unknown) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(
      'Cannot connect to EcoSort backend at ' + API_BASE_URL + '. Ensure FastAPI server is running.',
      0
    );
  }
}

/**
 * Retrieve class names registered in backend model
 */
export async function getClasses(): Promise<ClassesResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/classes`);
    return await handleResponse<ClassesResponse>(response);
  } catch (err: unknown) {
    if (err instanceof ApiError) throw err;
    throw new ApiError('Failed to fetch class categories from backend.', 0);
  }
}

/**
 * Retrieve human feedback count stored in SQLite DB
 */
export async function getFeedbackCount(): Promise<FeedbackCountResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/feedback/count`);
    return await handleResponse<FeedbackCountResponse>(response);
  } catch (err: unknown) {
    if (err instanceof ApiError) throw err;
    throw new ApiError('Failed to retrieve feedback record count.', 0);
  }
}

/**
 * Submit image to YOLOv8 inference endpoint
 */
export async function predictImage(
  file: File,
  confidence = 0.25
): Promise<PredictResponse> {
  // Validate file size on client-side (10 MB limit as enforced by backend)
  const maxBytes = 10 * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new ApiError(
      `File size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds backend 10 MB limit.`,
      413
    );
  }

  // Validate allowed mime types
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    throw new ApiError(
      `File format "${file.type || 'unknown'}" is not supported. Please upload a JPEG, PNG, or WEBP image.`,
      415
    );
  }

  // Clamped confidence between 0.01 and 0.99
  const clampedConfidence = Math.max(0.01, Math.min(0.99, confidence));

  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch(
      `${API_BASE_URL}/predict?confidence=${clampedConfidence.toFixed(2)}`,
      {
        method: 'POST',
        body: formData,
      }
    );
    return await handleResponse<PredictResponse>(response);
  } catch (err: unknown) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(
      'Inference request failed. Make sure the FastAPI server is running at ' + API_BASE_URL,
      0
    );
  }
}

/**
 * Submit corrected annotations to feedback endpoint
 */
export async function submitFeedback(
  payload: FeedbackPayload
): Promise<FeedbackResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    return await handleResponse<FeedbackResponse>(response);
  } catch (err: unknown) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(
      'Failed to submit feedback. Check backend connection and image ID.',
      0
    );
  }
}
