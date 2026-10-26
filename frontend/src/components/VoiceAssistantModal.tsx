import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  X,
  Sparkles,
  Key,
  Check,
  Loader2,
  Bot
} from 'lucide-react';
import {
  isSpeechRecognitionSupported,
  speakText,
  stopSpeech,
} from '../utils/speechService';
import {
  askEcoSortAssistant,
  getGeminiApiKey,
  saveGeminiApiKey,
  type AssistantAnswer,
} from '../services/aiAssistant';
import {
  UI_TRANSLATIONS,
  type AppLanguage,
} from '../constants/translations';

interface VoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tabId: string) => void;
  currentLanguage: AppLanguage;
  onLanguageChange: (lang: AppLanguage) => void;
}

export const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
  currentLanguage,
  onLanguageChange,
}) => {
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [assistantReply, setAssistantReply] = useState<string>('');
  const [replySource, setReplySource] = useState<'gemini' | 'cloud_ai' | 'knowledge_engine'>('gemini');
  const [isSpeakingNow, setIsSpeakingNow] = useState<boolean>(false);
  const [manualInput, setManualInput] = useState<string>('');
  
  // Gemini Key Management
  const [showKeyConfig, setShowKeyConfig] = useState<boolean>(false);
  const [apiKeyInput, setApiKeyInput] = useState<string>(getGeminiApiKey());
  const [hasApiKey, setHasApiKey] = useState<boolean>(!!getGeminiApiKey());
  const [keySavedToast, setKeySavedToast] = useState<boolean>(false);

  const recognitionRef = useRef<any>(null);
  const t = UI_TRANSLATIONS[currentLanguage];

  useEffect(() => {
    if (!isOpen) {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      stopSpeech();
      setIsListening(false);
      setIsThinking(false);
      setIsSpeakingNow(false);
      setShowKeyConfig(false);
    }
  }, [isOpen]);

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    saveGeminiApiKey(apiKeyInput);
    setHasApiKey(!!apiKeyInput.trim());
    setKeySavedToast(true);
    setTimeout(() => {
      setKeySavedToast(false);
      setShowKeyConfig(false);
    }, 1200);
  };

  const startListening = () => {
    if (!isSpeechRecognitionSupported()) {
      setAssistantReply(
        currentLanguage === 'hi'
          ? 'आपके ब्राउज़र में वॉइस इनपुट समर्थित नहीं है। कृपया नीचे लिखकर पूछें।'
          : 'Voice input is not supported in this browser. Please type your query below.'
      );
      return;
    }

    try {
      const SpeechRecognitionClass =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognitionClass();
      recognitionRef.current = recognition;

      recognition.lang = currentLanguage === 'hi' ? 'hi-IN' : 'en-US';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
        setTranscript('');
        setAssistantReply('');
      };

      recognition.onresult = (event: any) => {
        const spoken = event.results[0][0].transcript;
        setTranscript(spoken);
        handleProcessQuery(spoken);
      };

      recognition.onerror = (event: any) => {
        console.warn('Recognition error:', event.error);
        setIsListening(false);
        setAssistantReply(
          currentLanguage === 'hi'
            ? 'माइक्रोफ़ोन से आवाज नहीं सुनाई दी। कृपया दोबारा बोलें।'
            : 'Could not hear voice. Please try speaking again.'
        );
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (e) {
      console.warn('SpeechRecognition start failed:', e);
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const handleProcessQuery = async (query: string) => {
    if (!query.trim()) return;

    setIsThinking(true);
    stopSpeech();
    setIsSpeakingNow(false);

    try {
      // Ask Gemini / Intelligent AI Engine
      const answer: AssistantAnswer = await askEcoSortAssistant(query, currentLanguage);
      
      setIsThinking(false);
      setAssistantReply(answer.text);
      setReplySource(answer.source);

      // Read aloud the response
      setIsSpeakingNow(true);
      speakText(answer.text, currentLanguage, () => setIsSpeakingNow(false));

      // Handle automatic navigation if the AI determined a page redirection is requested
      if (answer.navigateTab) {
        setTimeout(() => {
          onNavigateTab(answer.navigateTab!);
        }, 1800);
      }
    } catch {
      setIsThinking(false);
      const fallback =
        currentLanguage === 'hi'
          ? 'माफ़ कीजिए, AI उत्तर प्राप्त करने में त्रुटि हुई। कृपया पुनः प्रयास करें।'
          : 'Sorry, could not retrieve AI answer. Please try again.';
      setAssistantReply(fallback);
      speakText(fallback, currentLanguage, () => setIsSpeakingNow(false));
      setIsSpeakingNow(true);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    setTranscript(manualInput);
    handleProcessQuery(manualInput);
    setManualInput('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-5 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-800 text-white flex items-center justify-center shadow-xs">
              <Bot className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-slate-900">
                  {currentLanguage === 'hi' ? 'EcoSort AI वॉयस सहायक' : 'EcoSort AI Voice Assistant'}
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  <span>{hasApiKey ? 'Gemini 1.5 Live' : 'AI Reasoning'}</span>
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {currentLanguage === 'hi'
                  ? 'कचरा, रीसाइक्लिंग व नियमों पर हर सवाल का उत्तर'
                  : 'Ask any question about waste, recycling, or app features'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Gemini API Key Toggle */}
            <button
              onClick={() => setShowKeyConfig(!showKeyConfig)}
              title="Configure Google Gemini API Key"
              className={`p-2 rounded-xl text-xs font-semibold border transition-all ${
                hasApiKey
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Key className="w-4 h-4" />
            </button>

            {/* Language Switcher Pill */}
            <div className="flex items-center rounded-xl bg-slate-100 p-0.5 border border-slate-200 text-xs font-semibold">
              <button
                onClick={() => onLanguageChange('en')}
                className={`px-2 py-1 rounded-lg transition-all ${
                  currentLanguage === 'en'
                    ? 'bg-white text-emerald-800 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => onLanguageChange('hi')}
                className={`px-2 py-1 rounded-lg transition-all ${
                  currentLanguage === 'hi'
                    ? 'bg-white text-emerald-800 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                हिन्दी
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Gemini API Key Configuration Accordion */}
        {showKeyConfig && (
          <form
            onSubmit={handleSaveKey}
            className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs space-y-3 animate-in fade-in"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-emerald-950">
                <Sparkles className="w-4 h-4 text-emerald-700" />
                <span>Google Gemini API Key</span>
              </div>
              <span className="text-[10px] text-emerald-700 font-medium">
                {hasApiKey ? 'Active' : 'Optional (Free fallback active)'}
              </span>
            </div>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              Paste your Gemini API key from Google AI Studio to unlock live generative answers with Gemini 1.5 Flash. If left empty, our smart AI reasoning engine is automatically used.
            </p>
            <div className="flex items-center gap-2">
              <input
                type="password"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="AIzaSy..."
                className="flex-1 px-3 py-2 rounded-xl border border-emerald-300 bg-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-emerald-700/30"
              />
              <button
                type="submit"
                className="px-3.5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold transition-colors inline-flex items-center gap-1"
              >
                {keySavedToast ? <Check className="w-3.5 h-3.5" /> : null}
                <span>{keySavedToast ? 'Saved!' : 'Save Key'}</span>
              </button>
            </div>
          </form>
        )}

        {/* Central Audio Listening Visualizer */}
        <div className="flex flex-col items-center justify-center py-4 text-center space-y-3">
          <div className="relative">
            {isListening && (
              <div className="absolute inset-0 -m-3 rounded-full bg-emerald-400/40 animate-ping" />
            )}
            <button
              onClick={isListening ? stopListening : startListening}
              className={`w-20 h-20 rounded-full flex items-center justify-center text-white shadow-xl transition-all ${
                isListening
                  ? 'bg-red-600 scale-105 shadow-red-600/30'
                  : 'bg-emerald-800 hover:bg-emerald-700 active:scale-95 shadow-emerald-800/30'
              }`}
            >
              {isListening ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
            </button>
          </div>

          <div>
            <p className="text-sm font-bold text-slate-800">
              {isListening ? t.listening : t.speakNow}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              {currentLanguage === 'hi'
                ? 'बोलने के लिए माइक बटन दबाएं या नीचे टाइप करें'
                : 'Click mic to speak any waste question or type below'}
            </p>
          </div>
        </div>

        {/* Thinking Indicator */}
        {isThinking && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center gap-2 text-emerald-900 text-xs font-semibold animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin text-emerald-700" />
            <span>
              {currentLanguage === 'hi'
                ? 'AI आपके सवाल का उत्तर तैयार कर रहा है...'
                : 'Gemini AI is analyzing and preparing your response...'}
            </span>
          </div>
        )}

        {/* Live Transcript & Spoken Answer */}
        {(transcript || assistantReply) && !isThinking && (
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs">
            {transcript && (
              <div>
                <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px] block">
                  {currentLanguage === 'hi' ? 'आपने पूछा:' : 'You asked:'}
                </span>
                <p className="font-medium text-slate-800 italic mt-0.5">“{transcript}”</p>
              </div>
            )}

            {assistantReply && (
              <div className="pt-2 border-t border-slate-200/60 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-emerald-900 uppercase tracking-wider text-[10px]">
                      {currentLanguage === 'hi' ? 'AI उत्तर:' : 'EcoSort AI Answer:'}
                    </span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded font-medium bg-emerald-100 text-emerald-800">
                      {replySource === 'gemini'
                        ? 'Google Gemini 1.5'
                        : replySource === 'cloud_ai'
                        ? 'Cloud AI'
                        : 'Knowledge Engine'}
                    </span>
                  </div>

                  {isSpeakingNow ? (
                    <button
                      onClick={stopSpeech}
                      className="text-[11px] font-semibold text-red-600 flex items-center gap-1 hover:underline"
                    >
                      <VolumeX className="w-3.5 h-3.5" />
                      <span>{t.stopAudio}</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => speakText(assistantReply, currentLanguage, () => setIsSpeakingNow(false))}
                      className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1 hover:underline"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>{t.readAloud}</span>
                    </button>
                  )}
                </div>

                <p className="font-medium text-slate-900 leading-relaxed text-xs">
                  {assistantReply}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Text Input Fallback */}
        <form onSubmit={handleManualSubmit} className="relative">
          <input
            type="text"
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            placeholder={
              currentLanguage === 'hi'
                ? 'या कोई भी प्रश्न यहाँ लिखें (उदा. पिज़्ज़ा बॉक्स, बैटरी, कैमरा)...'
                : 'Or ask anything (e.g. pizza boxes, batteries, styrofoam, open camera)...'
            }
            className="w-full text-xs pl-3.5 pr-20 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white text-[11px] font-semibold"
          >
            Ask AI
          </button>
        </form>

        {/* Sample Voice Prompts */}
        <div className="space-y-1.5 pt-1 border-t border-slate-100">
          <span className="text-[10px] font-semibold text-slate-400 block uppercase tracking-wider">
            {currentLanguage === 'hi' ? 'पूछ कर देखें:' : 'Try asking anything:'}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {(currentLanguage === 'hi'
              ? [
                  'पिज़्ज़ा बॉक्स का क्या करें?',
                  'पुरानी बैटरियों को कहाँ डालें?',
                  'थर्माकोल कैसे रीसायकल करें?',
                  'कैमरा स्कैनर खोलो',
                  'इको पॉइंट्स कैसे मिलते हैं?',
                ]
              : [
                  'Can I recycle pizza boxes?',
                  'How to dispose of batteries?',
                  'Is styrofoam recyclable?',
                  'Open camera scanner',
                  'How do eco points work?',
                ]
            ).map((cmd, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setTranscript(cmd);
                  handleProcessQuery(cmd);
                }}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-600 transition-colors"
              >
                {cmd}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
