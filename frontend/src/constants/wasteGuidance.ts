import type { WasteGuidance } from '../types';

/**
 * Waste disposal and recycling guidance data.
 * Directly mirrors the definitions in backend/ml/waste_guidance.py,
 * augmented with practical recycling tips and UI metadata.
 */
export const WASTE_GUIDANCE_MAP: Record<string, WasteGuidance> = {
  Plastic: {
    category: 'Usually non-biodegradable',
    action: 'Check local plastic recycling rules.',
    caveat: 'Recyclability depends on plastic type and local facilities.',
    iconName: 'Package',
    recyclableBadge: 'variable',
    tips: [
      'Empty and rinse containers to remove liquid and food residue.',
      'Check resin identification codes (PETE 1 and HDPE 2 are most widely collected).',
      'Remove plastic films, wraps, and straws unless local guidelines state otherwise.',
      'Compress bottles to save space in curbside collection bins.'
    ]
  },
  Paper_Cardboard: {
    category: 'Usually recyclable',
    action: 'Keep clean and dry; recycle if accepted locally.',
    caveat: 'Wet, greasy, or contaminated paper may not be recyclable.',
    iconName: 'FileText',
    recyclableBadge: 'high',
    tips: [
      'Flatten cardboard boxes to optimize bin capacity.',
      'Do not include pizza boxes or paper towels contaminated with grease or food oils.',
      'Remove plastic wrapping or tape where possible.',
      'Shredded paper should be bagged if required by your municipality.'
    ]
  },
  Metal: {
    category: 'Usually recyclable',
    action: 'Use an accepted metal collection service.',
    caveat: 'Acceptance depends on metal type and local facilities.',
    iconName: 'ShieldAlert',
    recyclableBadge: 'high',
    tips: [
      'Aluminum beverage cans and tin food cans can be endlessly recycled with low energy loss.',
      'Rinse food cans to prevent mold and insect attraction.',
      'Labels on tin cans are generally burned off during processing and do not require peeling.',
      'Aerosol cans must be completely empty before disposal.'
    ]
  },
  Glass: {
    category: 'Usually recyclable',
    action: 'Use an accepted glass collection point.',
    caveat: 'Broken glass requires safe handling; not all glass types are accepted.',
    iconName: 'Wine',
    recyclableBadge: 'high',
    tips: [
      'Glass bottles and jars can be recycled indefinitely without degradation.',
      'Rinse thoroughly and separate by colour (clear, green, brown) if required locally.',
      'Do not mix cookware (Pyrex), light bulbs, ceramics, or window panes with container glass.',
      'Never place broken shards loosely in recycling sacks to protect sanitation workers.'
    ]
  },
  Other_Waste: {
    category: 'Unknown — inspect the item',
    action: 'Identify the material before choosing a disposal route.',
    caveat: 'This class can contain different waste materials.',
    iconName: 'HelpCircle',
    recyclableBadge: 'variable',
    tips: [
      'Inspect product labels for composite material logos or municipal markings.',
      'Electronic waste (e-waste), batteries, and chemicals require dedicated drop-off sites.',
      'Organic food scraps should be diverted to organic or composting bins.',
      'When uncertain, check municipal sorting directories before landfilling.'
    ]
  }
};

export const CLASS_COLORS: Record<string, {
  badge: string;
  border: string;
  text: string;
  bgLight: string;
  chartColor: string;
}> = {
  Plastic: {
    badge: 'bg-amber-100 text-amber-800 border-amber-300',
    border: 'border-amber-400',
    text: 'text-amber-700',
    bgLight: 'bg-amber-50/60',
    chartColor: '#f59e0b'
  },
  Paper_Cardboard: {
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    border: 'border-emerald-500',
    text: 'text-emerald-700',
    bgLight: 'bg-emerald-50/60',
    chartColor: '#10b981'
  },
  Metal: {
    badge: 'bg-slate-200 text-slate-800 border-slate-300',
    border: 'border-slate-500',
    text: 'text-slate-700',
    bgLight: 'bg-slate-100/70',
    chartColor: '#64748b'
  },
  Glass: {
    badge: 'bg-teal-100 text-teal-800 border-teal-300',
    border: 'border-teal-500',
    text: 'text-teal-700',
    bgLight: 'bg-teal-50/60',
    chartColor: '#0d9488'
  },
  Other_Waste: {
    badge: 'bg-purple-100 text-purple-800 border-purple-300',
    border: 'border-purple-400',
    text: 'text-purple-700',
    bgLight: 'bg-purple-50/60',
    chartColor: '#8b5cf6'
  }
};

export function getWasteGuidance(label: string): WasteGuidance {
  return WASTE_GUIDANCE_MAP[label] || {
    category: 'Unknown',
    action: 'Review the item manually.',
    caveat: 'No specific guidance is available for this class.',
    iconName: 'HelpCircle',
    recyclableBadge: 'low',
    tips: ['Check local municipality website for guidance on this item.']
  };
}

export function formatClassLabel(rawLabel: string): string {
  if (rawLabel === 'Paper_Cardboard') return 'Paper & Cardboard';
  if (rawLabel === 'Other_Waste') return 'Other Waste';
  return rawLabel;
}
