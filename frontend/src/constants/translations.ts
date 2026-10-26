export type AppLanguage = 'en' | 'hi';

export interface ClassTranslation {
  name: string;
  category: string;
  action: string;
  caveat: string;
  spokenGuidance: string;
}

export const CLASS_TRANSLATIONS: Record<AppLanguage, Record<string, ClassTranslation>> = {
  en: {
    Plastic: {
      name: 'Plastic Containers',
      category: 'Usually non-biodegradable',
      action: 'Check local plastic recycling rules. Empty and rinse thoroughly.',
      caveat: 'Recyclability depends on plastic resin type (PET 1 and HDPE 2 preferred).',
      spokenGuidance: 'Detected plastic material. Please empty any liquids, rinse thoroughly, and place in your clean plastic recycling bin.',
    },
    Paper_Cardboard: {
      name: 'Paper & Cardboard',
      category: 'Usually recyclable',
      action: 'Keep clean and dry; flatten boxes before curbside recycling.',
      caveat: 'Wet, greasy, or oil-contaminated paper cannot be recycled.',
      spokenGuidance: 'Detected paper or cardboard. Ensure it is clean and dry without grease, flatten the boxes, and recycle.',
    },
    Metal: {
      name: 'Metal & Cans',
      category: 'Usually recyclable',
      action: 'Use accepted metal collection service or scrap drop-off.',
      caveat: 'Aerosol cans must be completely empty before disposal.',
      spokenGuidance: 'Detected metal or aluminum. Rinse food cans clean. Metal can be recycled indefinitely with high energy savings.',
    },
    Glass: {
      name: 'Glass Bottles & Jars',
      category: 'Usually recyclable',
      action: 'Rinse and separate by color at your local glass bank.',
      caveat: 'Do not mix cookware, ceramics, or window glass with bottle glass.',
      spokenGuidance: 'Detected glass container. Rinse thoroughly and place in designated glass drop-off bins. Handle carefully.',
    },
    Other_Waste: {
      name: 'Other Waste',
      category: 'Mixed / Specialty Waste',
      action: 'Identify composite material before disposal or visit a drop-off center.',
      caveat: 'Electronic waste and hazardous items require specialized disposal.',
      spokenGuidance: 'Detected other waste or mixed material. Please inspect product labels for municipal disposal markings or drop off at a local center.',
    },
  },
  hi: {
    Plastic: {
      name: 'प्लास्टिक कचरा',
      category: 'आमतौर पर गैर-बायोडिग्रेडेबल',
      action: 'स्थानीय प्लास्टिक रीसाइक्लिंग नियमों की जांच करें। पूरी तरह से खाली और साफ करें।',
      caveat: 'रीसाइक्लिंग प्लास्टिक के प्रकार (PET 1 और HDPE 2) पर निर्भर करती है।',
      spokenGuidance: 'प्लास्टिक की पहचान हुई है। कृपया इसे पूरी तरह से खाली करें, धोकर सुखाएं और प्लास्टिक रीसाइक्लिंग बिन में डालें।',
    },
    Paper_Cardboard: {
      name: 'कागज़ और गत्ता (Cardboard)',
      category: 'आमतौर पर रीसाइक्लिंग योग्य',
      action: 'साफ और सूखा रखें; बक्सों को चपटा करके रीसाइक्लिंग में डालें।',
      caveat: 'गीला या तेल/चिकनाई से सना कागज़ रीसायकल नहीं किया जा सकता।',
      spokenGuidance: 'कागज़ या गत्ते की पहचान हुई है। सुनिश्चित करें कि यह सूखा और साफ है, और इसे सूखे कचरे के बिन में डालें।',
    },
    Metal: {
      name: 'धातु और डिब्बे (Metal & Cans)',
      category: 'आमतौर पर रीसाइक्लिंग योग्य',
      action: 'स्वीकृत धातु संग्रह सेवा या कबाड़ केंद्र में दें।',
      caveat: 'स्प्रे कैन पूरी तरह से खाली होने चाहिए।',
      spokenGuidance: 'धातु या एल्युमिनियम की पहचान हुई है। डिब्बों को साफ करें। धातुओं को बार-बार रीसायकल किया जा सकता है।',
    },
    Glass: {
      name: 'कांच की बोतलें और जार',
      category: 'आमतौर पर रीसाइक्लिंग योग्य',
      action: 'धोकर रंग के अनुसार कांच रीसाइक्लिंग केंद्र में जमा करें।',
      caveat: 'टूटे कांच को सुरक्षित रूप से पैक करके ही निपटान करें।',
      spokenGuidance: 'कांच की बोतल या जार की पहचान हुई है। इसे अच्छी तरह धोएं और निर्धारित कांच संग्रह केंद्र में जमा करें।',
    },
    Other_Waste: {
      name: 'अन्य मिश्रित कचरा',
      category: 'विशेष / मिश्रित सामग्री',
      action: 'सामग्री की जांच करें या नजदीकी कचरा निपटान केंद्र पर ले जाएं।',
      caveat: 'ई-कचरा (E-Waste) और बैटरी के लिए विशेष केंद्र पर जाएं।',
      spokenGuidance: 'अन्य या मिश्रित कचरे की पहचान हुई है। कृपया उत्पाद लेबल की जांच करें या नजदीकी संग्रह केंद्र पर संपर्क करें।',
    },
  },
};

export const UI_TRANSLATIONS = {
  en: {
    voiceAssistant: 'Voice Assistant',
    listening: 'Listening to your voice...',
    speakNow: 'Speak a command or ask how to recycle...',
    readAloud: 'Read Aloud',
    stopAudio: 'Stop Audio',
    impactDashboard: 'Impact Dashboard',
    sampleCommands: [
      '“Open camera scanner”',
      '“How do I recycle plastic?”',
      '“Show me my rewards”',
      '“Find nearby recycling centers”',
      '“What is my carbon impact?”',
    ],
  },
  hi: {
    voiceAssistant: 'आवाज सहायक (Voice Assistant)',
    listening: 'आपकी आवाज सुनी जा रही है...',
    speakNow: 'कोई कमांड बोलें या रीसाइक्लिंग के बारे में पूछें...',
    readAloud: 'निर्देश सुनें (Audio)',
    stopAudio: 'रोकें',
    impactDashboard: 'पर्यावरणीय प्रभाव (Impact)',
    sampleCommands: [
      '“कैमरा खोलो” (Open camera)',
      '“प्लास्टिक कैसे रीसायकल करें?”',
      '“मेरे इनाम दिखाओ”',
      '“रीसाइक्लिंग सेंटर कहां है?”',
      '“पर्यावरणीय प्रभाव दिखाओ”',
    ],
  },
};
