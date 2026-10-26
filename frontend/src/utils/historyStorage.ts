import type { HistoryItem } from '../types';

const STORAGE_KEY = 'ecosort_local_history_v1';
const MAX_HISTORY_ITEMS = 25;

export function getLocalHistory(): HistoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse EcoSort local history from localStorage', err);
    return [];
  }
}

export function saveLocalHistoryItem(item: HistoryItem): void {
  try {
    const current = getLocalHistory();
    // Prepend new item and filter duplicates by id
    const filtered = current.filter((i) => i.id !== item.id);
    const updated = [item, ...filtered].slice(0, MAX_HISTORY_ITEMS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Could not save detection to localStorage (quota may be full):', err);
  }
}

export function markHistoryItemFeedback(imageId: string): void {
  try {
    const current = getLocalHistory();
    const updated = current.map((item) =>
      item.imageId === imageId ? { ...item, feedbackSubmitted: true } : item
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to update history item feedback state', err);
  }
}

export function deleteHistoryItem(id: string): void {
  try {
    const current = getLocalHistory();
    const updated = current.filter((item) => item.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to delete item from local history', err);
  }
}

export function clearLocalHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear local history', err);
  }
}
