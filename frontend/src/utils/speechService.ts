import type { AppLanguage } from '../constants/translations';

// Web Speech API interface definitions for TypeScript
declare global {
  interface Window {
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
  }
}

let activeUtterance: SpeechSynthesisUtterance | null = null;

export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function isSpeechRecognitionSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
  );
}

/**
 * Read text aloud using browser SpeechSynthesis with appropriate language voice
 */
export function speakText(
  text: string,
  lang: AppLanguage = 'en',
  onEnd?: () => void
): void {
  if (!isSpeechSynthesisSupported()) {
    console.warn('Speech synthesis not supported in this browser.');
    if (onEnd) onEnd();
    return;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  activeUtterance = utterance;

  utterance.lang = lang === 'hi' ? 'hi-IN' : 'en-US';
  utterance.rate = 0.95;
  utterance.pitch = 1.0;

  // Try to find a matching voice
  const voices = window.speechSynthesis.getVoices();
  if (voices.length > 0) {
    const targetPrefix = lang === 'hi' ? 'hi' : 'en';
    const matchingVoice = voices.find((v) => v.lang.startsWith(targetPrefix));
    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }
  }

  utterance.onend = () => {
    activeUtterance = null;
    if (onEnd) onEnd();
  };

  utterance.onerror = (e) => {
    console.warn('Speech synthesis error:', e);
    activeUtterance = null;
    if (onEnd) onEnd();
  };

  window.speechSynthesis.speak(utterance);
}

export function stopSpeech(): void {
  if (isSpeechSynthesisSupported()) {
    window.speechSynthesis.cancel();
    activeUtterance = null;
  }
}

export function isSpeaking(): boolean {
  return isSpeechSynthesisSupported() && (window.speechSynthesis.speaking || activeUtterance !== null);
}

export interface VoiceCommandResult {
  action: 'navigate' | 'guidance' | 'unknown';
  target?: string; // Tab id or material name
  feedbackMessage: string;
}

/**
 * Parse spoken commands in English and Hindi
 */
export function parseVoiceCommand(
  transcript: string,
  lang: AppLanguage = 'en'
): VoiceCommandResult {
  const text = transcript.toLowerCase().trim();

  // Navigation commands
  if (
    text.includes('camera') ||
    text.includes('scanner') ||
    text.includes('कैमरा') ||
    text.includes('स्कैनर')
  ) {
    return {
      action: 'navigate',
      target: 'detect',
      feedbackMessage: lang === 'hi' ? 'कैमरा स्कैनर खोला जा रहा है...' : 'Opening Camera Scanner...',
    };
  }

  if (
    text.includes('reward') ||
    text.includes('point') ||
    text.includes('इनाम') ||
    text.includes('पॉइंट')
  ) {
    return {
      action: 'navigate',
      target: 'rewards',
      feedbackMessage: lang === 'hi' ? 'इनाम और पॉइंट्स खोले जा रहे हैं...' : 'Navigating to Eco-Rewards...',
    };
  }

  if (
    text.includes('locator') ||
    text.includes('center') ||
    text.includes('centre') ||
    text.includes('सेंटर') ||
    text.includes('केंद्र') ||
    text.includes('कहाँ')
  ) {
    return {
      action: 'navigate',
      target: 'locator',
      feedbackMessage: lang === 'hi' ? 'नजदीकी रीसाइक्लिंग केंद्र खोजे जा रहे हैं...' : 'Finding nearby recycling centers...',
    };
  }

  if (
    text.includes('impact') ||
    text.includes('carbon') ||
    text.includes('co2') ||
    text.includes('प्रभाव') ||
    text.includes('कार्बन')
  ) {
    return {
      action: 'navigate',
      target: 'impact',
      feedbackMessage: lang === 'hi' ? 'पर्यावरणीय प्रभाव डैशबोर्ड खोला जा रहा है...' : 'Opening Environmental Impact Dashboard...',
    };
  }

  if (
    text.includes('guide') ||
    text.includes('instruction') ||
    text.includes('नियम') ||
    text.includes('निर्देश')
  ) {
    return {
      action: 'navigate',
      target: 'guidance',
      feedbackMessage: lang === 'hi' ? 'कचरा निपटान गाइड खोला जा रहा है...' : 'Opening Waste Disposal Directory...',
    };
  }

  if (
    text.includes('plastic') ||
    text.includes('प्लास्टिक')
  ) {
    return {
      action: 'guidance',
      target: 'Plastic',
      feedbackMessage: lang === 'hi' ? 'प्लास्टिक रीसाइक्लिंग निर्देश' : 'Plastic disposal guidance',
    };
  }

  if (
    text.includes('paper') ||
    text.includes('cardboard') ||
    text.includes('कागज़') ||
    text.includes('गत्ता')
  ) {
    return {
      action: 'guidance',
      target: 'Paper_Cardboard',
      feedbackMessage: lang === 'hi' ? 'कागज़ और गत्ता रीसाइक्लिंग निर्देश' : 'Paper and cardboard recycling guidance',
    };
  }

  if (
    text.includes('metal') ||
    text.includes('can') ||
    text.includes('धातु') ||
    text.includes('डिब्बे')
  ) {
    return {
      action: 'guidance',
      target: 'Metal',
      feedbackMessage: lang === 'hi' ? 'धातु और डिब्बा निपटान निर्देश' : 'Metal and cans recycling guidance',
    };
  }

  if (
    text.includes('glass') ||
    text.includes('bottle') ||
    text.includes('कांच') ||
    text.includes('बोतल')
  ) {
    return {
      action: 'guidance',
      target: 'Glass',
      feedbackMessage: lang === 'hi' ? 'कांच की बोतलें निपटान निर्देश' : 'Glass bottle disposal guidance',
    };
  }

  return {
    action: 'unknown',
    feedbackMessage:
      lang === 'hi'
        ? `कमांड समझ नहीं आया: "${transcript}". कृपया 'कैमरा खोलो', 'इनाम दिखाओ', या 'प्लास्टिक' कहें।`
        : `Command not recognized: "${transcript}". Try saying "Open camera", "Show rewards", or "Plastic guidance".`,
  };
}
