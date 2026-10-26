import type { AppLanguage } from '../constants/translations';

// Local storage key for custom user-provided Gemini API Key
export const GEMINI_API_KEY_STORAGE = 'ecosort_gemini_api_key';

export function getGeminiApiKey(): string {
  const stored = localStorage.getItem(GEMINI_API_KEY_STORAGE);
  if (stored && stored.trim().length > 0) {
    return stored.trim();
  }
  const envKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
  if (envKey && typeof envKey === 'string' && envKey.trim().length > 0) {
    return envKey.trim();
  }
  return '';
}

export function saveGeminiApiKey(key: string): void {
  if (!key || key.trim() === '') {
    localStorage.removeItem(GEMINI_API_KEY_STORAGE);
  } else {
    localStorage.setItem(GEMINI_API_KEY_STORAGE, key.trim());
  }
}

export interface AssistantAnswer {
  text: string;
  source: 'gemini' | 'cloud_ai' | 'knowledge_engine';
  navigateTab?: string; // Optional tab id to switch to
}

/**
 * System instruction provided to Gemini / Cloud LLM for waste and recycling expertise
 */
const SYSTEM_PROMPT = `You are EcoSort AI, a state-of-the-art voice assistant and environmental sustainability expert.
You answer any question about waste management, material recycling, composting, e-waste, hazardous materials, circular economy, and the EcoSort application.
Rules:
1. Provide concise, helpful, and friendly answers (2 to 4 sentences) designed specifically to be read aloud via voice synthesis.
2. If the user asks in Hindi (or Hinglish), reply fluently and conversationally in Hindi (Devanagari script preferred or easy-to-read Hindi).
3. If the user wants to perform an action in EcoSort (e.g. open camera, view rewards, find recycling centers, check carbon impact, see disposal guide), mention it and append the navigation tag at the very end:
   - Camera/detection: [NAVIGATE:detect]
   - Rewards/points: [NAVIGATE:rewards]
   - Drop-off locator: [NAVIGATE:locator]
   - Carbon impact dashboard: [NAVIGATE:impact]
   - Disposal guide: [NAVIGATE:guidance]
   - Human review: [NAVIGATE:feedback]
   - History: [NAVIGATE:history]
4. For recycling questions (e.g. pizza boxes, styrofoam, coffee cups, lightbulbs, batteries, aluminum, plastic numbers), provide clear, actionable rules regarding contamination and preparation.`;

/**
 * Ask Google Gemini API (gemini-1.5-flash)
 */
async function queryGemini(prompt: string, apiKey: string, lang: AppLanguage): Promise<AssistantAnswer | null> {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const langInstruction = lang === 'hi' ? ' Respond in Hindi language.' : ' Respond in English.';

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `${SYSTEM_PROMPT}\n\n${langInstruction}\n\nUser Question: ${prompt}`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 250,
        },
      }),
    });

    if (!response.ok) {
      console.warn('Gemini API returned status:', response.status);
      return null;
    }

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText || typeof rawText !== 'string') {
      return null;
    }

    let cleaned = rawText.trim();
    let navigateTab: string | undefined;

    const navMatch = cleaned.match(/\[NAVIGATE:([a-z]+)\]/i);
    if (navMatch) {
      navigateTab = navMatch[1].toLowerCase();
      cleaned = cleaned.replace(/\[NAVIGATE:[a-z]+\]/gi, '').trim();
    }

    return {
      text: cleaned,
      source: 'gemini',
      navigateTab,
    };
  } catch (err) {
    console.warn('Gemini request failed:', err);
    return null;
  }
}

/**
 * Query public high-speed AI fallback endpoint
 */
async function queryPublicAI(prompt: string, lang: AppLanguage): Promise<AssistantAnswer | null> {
  try {
    const langPrefix = lang === 'hi' ? 'उत्तर केवल हिंदी में दें (in Hindi): ' : '';
    const fullPrompt = `${SYSTEM_PROMPT}\n${langPrefix}User question: ${prompt}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000); // 6s timeout

    const url = `https://text.pollinations.ai/${encodeURIComponent(fullPrompt)}?model=openai`;

    const response = await fetch(url, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) return null;

    let reply = await response.text();
    if (!reply || reply.length < 5) return null;
    if (
      reply.includes('Free limit reached') ||
      reply.includes('Rate limit') ||
      reply.includes('pollinations.ai') ||
      reply.includes('Please wait')
    ) {
      return null;
    }

    reply = reply.trim();
    let navigateTab: string | undefined;
    const navMatch = reply.match(/\[NAVIGATE:([a-z]+)\]/i);
    if (navMatch) {
      navigateTab = navMatch[1].toLowerCase();
      reply = reply.replace(/\[NAVIGATE:[a-z]+\]/gi, '').trim();
    }

    return {
      text: reply,
      source: 'cloud_ai',
      navigateTab,
    };
  } catch {
    return null;
  }
}

/**
 * Comprehensive Local Environmental Reasoning Engine
 * Covers dozens of common recycling dilemmas, material science, and app navigation
 */
function queryKnowledgeEngine(query: string, lang: AppLanguage): AssistantAnswer {
  const q = query.toLowerCase().trim();

  // Navigation Intents
  if (q.includes('camera') || q.includes('scan') || q.includes('कैमरा') || q.includes('स्कैन')) {
    return {
      text:
        lang === 'hi'
          ? 'कैमरा स्कैनर खोला जा रहा है। आप अपने कैमरे से कचरा स्कैन करके तुरंत YOLOv8 मॉडल से पहचान सकते हैं और 15 इको-पॉइंट्स कमा सकते हैं।'
          : 'Opening the Real-Time Camera Scanner. You can aim your camera at waste items for live YOLOv8 classification and earn 15 Eco-Points.',
      source: 'knowledge_engine',
      navigateTab: 'detect',
    };
  }

  if (q.includes('reward') || q.includes('point') || q.includes('इनाम') || q.includes('पॉइंट') || q.includes('coin')) {
    return {
      text:
        lang === 'hi'
          ? 'इको-रिवार्ड्स पेज खोला जा रहा है। आप कचरा स्कैन करके और समीक्षा करके पॉइंट्स कमाते हैं, जिनसे आप असली पेड़ लगा सकते हैं या डिस्काउंट कूपन पा सकते हैं।'
          : 'Navigating to Eco-Rewards. You earn points by scanning items and reviewing detections, which you can redeem to plant real mangrove trees or get sustainable store coupons.',
      source: 'knowledge_engine',
      navigateTab: 'rewards',
    };
  }

  if (q.includes('locator') || q.includes('center') || q.includes('centre') || q.includes('drop') || q.includes('सेंटर') || q.includes('केंद्र')) {
    return {
      text:
        lang === 'hi'
          ? 'रीसाइक्लिंग केंद्र लोकेटर खोला जा रहा है। यह आपके पास स्थित सत्यापित प्लास्टिक, धातु, ई-कचरा और खाद डिपो दिखाता है।'
          : 'Opening the Drop-off Locator. It displays verified recycling centers, scrap yards, e-waste facilities, and composting hubs near your location.',
      source: 'knowledge_engine',
      navigateTab: 'locator',
    };
  }

  if (q.includes('impact') || q.includes('carbon') || q.includes('co2') || q.includes('कार्बन') || q.includes('डैशबोर्ड')) {
    return {
      text:
        lang === 'hi'
          ? 'पर्यावरणीय प्रभाव डैशबोर्ड खोला जा रहा है। यहाँ आप लैंडफिल से बचाए गए कचरे का वजन, CO₂ उत्सर्जन बचत और पेड़ अवशोषण के आंकड़े देख सकते हैं।'
          : 'Opening the Environmental Impact Dashboard. Here you can inspect cumulative waste diverted, lifecycle CO₂e emissions avoided, and tree absorption metrics.',
      source: 'knowledge_engine',
      navigateTab: 'impact',
    };
  }

  if (q.includes('guide') || q.includes('directory') || q.includes('गाइड') || q.includes('नियम')) {
    return {
      text:
        lang === 'hi'
          ? 'कचरा निपटान गाइड खोला जा रहा है। यहाँ सभी 5 सामग्रियों (प्लास्टिक, कागज़, धातु, कांच, आदि) के रीसाइक्लिंग नियम उपलब्ध हैं।'
          : 'Opening the Disposal Directory. You can explore complete sorting guidelines, preparation tips, and caveats for all 5 material classes.',
      source: 'knowledge_engine',
      navigateTab: 'guidance',
    };
  }

  // Common recycling dilemmas: Pizza Box
  if (q.includes('pizza') || q.includes('पिज़्ज़ा') || q.includes('पिज़ा')) {
    return {
      text:
        lang === 'hi'
          ? 'पिज़्ज़ा बॉक्स के चिकने या तेल लगे हिस्से को रीसायकल नहीं किया जा सकता। बॉक्स का साफ सूखा ढक्कन फाड़कर कागज़ रीसाइक्लिंग में डालें, और तेल लगा निचला हिस्सा गीले कचरे (कंपोस्ट) में डालें।'
          : 'Greasy pizza box bottoms cannot be recycled because oil ruins paper pulp. Tear off the clean, grease-free top lid for paper recycling, and compost or discard the oily base.',
      source: 'knowledge_engine',
    };
  }

  // Batteries & E-Waste
  if (q.includes('battery') || q.includes('batteries') || q.includes('electronic') || q.includes('e-waste') || q.includes('बैटरी') || q.includes('इलेक्ट्रॉनिक')) {
    return {
      text:
        lang === 'hi'
          ? 'बैटरियों और इलेक्ट्रॉनिक कचरे को कभी भी सामान्य कचरा बिन में न डालें। इनमें लिथियम और भारी धातुएं होती हैं। इन्हें नजदीकी ई-कचरा ड्रॉप-ऑफ सेंटर पर ही जमा करें।'
          : 'Never toss batteries or electronics in household bins. They contain toxic heavy metals and fire-risk lithium. Take them to designated e-waste drop-off bins at our Locator page.',
      source: 'knowledge_engine',
      navigateTab: 'locator',
    };
  }

  // Styrofoam / Thermocol
  if (q.includes('styrofoam') || q.includes('thermocol') || q.includes('थर्माकोल')) {
    return {
      text:
        lang === 'hi'
          ? 'थर्माकोल (पॉलीस्टायरीन) अधिकांश नगर निगमों में कर्बसाइड रीसाइक्लिंग योग्य नहीं है। इसे टूटने से बचाएं और विशेष रीसाइक्लिंग सेंटर पर ले जाएं या दोबारा इस्तेमाल करें।'
          : 'Styrofoam (expanded polystyrene) is rarely accepted in standard curbside bins due to high transport volume and low density. Look for specialty drop-off centers or reuse it for packing.',
      source: 'knowledge_engine',
    };
  }

  // Plastic Bags & Soft Plastics
  if (q.includes('plastic bag') || q.includes('polythene') || q.includes('polybag') || q.includes('पॉलीथीन') || q.includes('थैली')) {
    return {
      text:
        lang === 'hi'
          ? 'सॉफ्ट प्लास्टिक की थैलियों को curbside रीसाइक्लिंग बिन में न डालें क्योंकि वे रीसाइक्लिंग मशीनों में फंस जाती हैं। इन्हें सुपरमार्केट या प्लास्टिक फिल्म कलेक्शन पॉइंट पर दें।'
          : 'Do not put soft plastic bags in curbside bins because they tangle sorting machinery. Return clean plastic grocery bags to dedicated retail drop-off bins.',
      source: 'knowledge_engine',
    };
  }

  // Coffee cups
  if (q.includes('coffee cup') || q.includes('paper cup') || q.includes('कप')) {
    return {
      text:
        lang === 'hi'
          ? 'अधिकांश टेकअवे कॉफी कप अंदर से प्लास्टिक (पॉलीथीन) की पतली परत से लेपित होते हैं, इसलिए उन्हें सामान्य कागज़ के साथ रीसायकल नहीं किया जा सकता। इनका प्लास्टिक ढक्कन अलग करके रीसायकल करें।'
          : 'Most disposable coffee cups are lined with a thin polyethylene plastic film to prevent leaks, preventing normal paper recycling. Recycle only the plastic lid, and consider using reusable tumblers.',
      source: 'knowledge_engine',
    };
  }

  // Glass
  if (q.includes('glass') || q.includes('bottle') || q.includes('कांच') || q.includes('शीशा')) {
    return {
      text:
        lang === 'hi'
          ? 'कांच की बोतलें और जार 100% और असीमित बार रीसायकल हो सकते हैं। कृपया इन्हें धोकर साफ करें। खिड़की का कांच या चीनी मिट्टी के बर्तन इसमें न मिलाएं।'
          : 'Glass bottles and jars are 100% recyclable indefinitely without quality loss. Rinse thoroughly and separate from ceramics, lightbulbs, or window glass.',
      source: 'knowledge_engine',
    };
  }

  // Metal & Aluminum Cans
  if (q.includes('metal') || q.includes('aluminum') || q.includes('can') || q.includes('tin') || q.includes('धातु') || q.includes('एल्युमिनियम')) {
    return {
      text:
        lang === 'hi'
          ? 'एल्युमिनियम के डिब्बे रीसायकल करने पर 95% ऊर्जा की बचत होती है। डिब्बे को पूरी तरह खाली करें और मेटल रीसाइक्लिंग में डालें। डिब्बे को कुचलना भी ठीक है।'
          : 'Recycling aluminum cans saves 95% of the energy needed to make new aluminum from bauxite ore. Rinse food residue and place in metal recycling.',
      source: 'knowledge_engine',
    };
  }

  // Organic Waste / Composting
  if (q.includes('food') || q.includes('organic') || q.includes('compost') || q.includes('गीला कचरा') || q.includes('खाद') || q.includes('खाना')) {
    return {
      text:
        lang === 'hi'
          ? 'फलों और सब्जियों के छिलके, चाय पत्ती और बचा हुआ खाना गीला कचरा है। इसे सूखे कचरे से अलग रखकर घर पर जैविक खाद (कंपोस्ट) बनाएं या गीले कचरे के बिन में डालें।'
          : 'Fruit peels, vegetable scraps, and coffee grounds should be separated from dry recyclables. Compost them at home or use organic curbside collection to prevent methane in landfills.',
      source: 'knowledge_engine',
    };
  }

  // YOLOv8 / How AI model works
  if (q.includes('yolo') || q.includes('ai') || q.includes('model') || q.includes('how does it work') || q.includes('काम कैसे करता है')) {
    return {
      text:
        lang === 'hi'
          ? 'EcoSort एक फाइन-ट्यून YOLOv8 न्यूरल नेटवर्क का उपयोग करता है जो वास्तविक समय में प्लास्टिक, कागज़, धातु और कांच को पहचान कर सटीक निर्देशांक (bounding boxes) देता है।'
          : 'EcoSort uses a fine-tuned YOLOv8 neural network trained on thousands of labeled waste items to detect, localize, and classify recyclable materials in milliseconds.',
      source: 'knowledge_engine',
    };
  }

  // General helpful response for any other query
  return {
    text:
      lang === 'hi'
        ? `आप "${query}" के बारे में पूछ रहे हैं। पर्यावरण संरक्षण के लिए कचरे को सूखा और गीला अलग-अलग छांटें। आप हमारे कैमरा स्कैनर से किसी भी वस्तु को तुरंत पहचान सकते हैं या रीसाइक्लिंग केंद्र खोज सकते हैं।`
        : `Regarding "${query}": EcoSort recommends rinsing and sorting all recyclables to avoid municipal contamination. You can scan this item with our live camera, view disposal rules, or locate a drop-off hub.`,
    source: 'knowledge_engine',
  };
}

/**
 * Main query function that orchestrates Gemini API -> Cloud LLM -> Knowledge Engine
 */
export async function askEcoSortAssistant(
  prompt: string,
  lang: AppLanguage = 'en'
): Promise<AssistantAnswer> {
  const geminiKey = getGeminiApiKey();

  // 1. Try Gemini API if key exists
  if (geminiKey) {
    const geminiResult = await queryGemini(prompt, geminiKey, lang);
    if (geminiResult) {
      return geminiResult;
    }
  }

  // 2. Try High-speed Cloud AI endpoint
  const cloudResult = await queryPublicAI(prompt, lang);
  if (cloudResult) {
    return cloudResult;
  }

  // 3. Robust Knowledge Reasoning Engine
  return queryKnowledgeEngine(prompt, lang);
}
