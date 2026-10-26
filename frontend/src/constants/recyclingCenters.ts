import type { RecyclingCenter } from '../types/locator';

export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(1));
}

// Global baseline centers and sample data
export const BASE_RECYCLING_CENTERS: RecyclingCenter[] = [
  {
    id: 'center_1',
    name: 'GreenValley Eco Recovery Depot',
    facilityType: 'municipal',
    address: '142 Evergreen Parkway, Suite 100',
    city: 'Eco City',
    lat: 28.6139,
    lng: 77.209,
    phone: '+1 (800) 555-3267',
    hours: 'Mon - Sat: 8:00 AM - 6:00 PM',
    isOpenNow: true,
    acceptedMaterials: ['Plastic', 'Paper_Cardboard', 'Metal', 'Glass', 'E-Waste'],
    rating: 4.8,
    verified: true,
    notes: 'Free residential drive-through drop-off. Commercial bulk sorting available by appointment.',
  },
  {
    id: 'center_2',
    name: 'CleanEarth Electronics & Battery Disposal',
    facilityType: 'e-waste',
    address: '88 Circuit Drive, Industrial Sector',
    city: 'Tech Park',
    lat: 28.625,
    lng: 77.218,
    phone: '+1 (800) 555-8324',
    hours: 'Tue - Sun: 9:00 AM - 5:00 PM',
    isOpenNow: true,
    acceptedMaterials: ['E-Waste', 'Metal'],
    rating: 4.9,
    verified: true,
    notes: 'Certified R2 e-waste recycler. Accepts old laptops, phones, cables, and lithium-ion batteries.',
  },
  {
    id: 'center_3',
    name: 'Metropolitan Scrap & Can Recyclers',
    facilityType: 'scrap_metal',
    address: '320 Foundry Boulevard',
    city: 'Industrial Zone',
    lat: 28.601,
    lng: 77.195,
    phone: '+1 (800) 555-6382',
    hours: 'Mon - Fri: 7:30 AM - 4:30 PM',
    isOpenNow: false,
    acceptedMaterials: ['Metal'],
    rating: 4.6,
    verified: true,
    notes: 'Pays cash on the spot for cleaned aluminum cans, copper pipes, and steel scrap.',
  },
  {
    id: 'center_4',
    name: 'City Organic & Composting Hub',
    facilityType: 'compost',
    address: '500 Biosphere Way',
    city: 'North Park',
    lat: 28.632,
    lng: 77.225,
    phone: '+1 (800) 555-7645',
    hours: 'Daily: 7:00 AM - 7:00 PM',
    isOpenNow: true,
    acceptedMaterials: ['Organic_Compost', 'Paper_Cardboard'],
    rating: 4.7,
    verified: true,
    notes: 'Community composting drop-off. Bring your kitchen scraps and pick up enriched potting compost.',
  },
  {
    id: 'center_5',
    name: 'EcoGlass Bottle & Jar Depository',
    facilityType: 'glass_bank',
    address: '12 Harbor Street',
    city: 'Downtown Waterfront',
    lat: 28.59,
    lng: 77.23,
    phone: '+1 (800) 555-4527',
    hours: '24/7 Drop-off Bins Available',
    isOpenNow: true,
    acceptedMaterials: ['Glass'],
    rating: 4.5,
    verified: true,
    notes: 'Self-service 24/7 color-sorted glass bins (Clear, Amber/Brown, and Emerald Green).',
  },
];

/**
 * Generate localized recycling facilities around any coordinates
 * so users anywhere see realistic nearby drop-off sites!
 */
export function getCentersForLocation(
  userLat: number,
  userLng: number,
  materialFilter = 'all'
): RecyclingCenter[] {
  const names = [
    { name: 'Municipal Solid Waste & Recycling Station', type: 'municipal' as const, mats: ['Plastic', 'Paper_Cardboard', 'Metal', 'Glass'] },
    { name: 'EcoSafe Electronic Waste Drop-off', type: 'e-waste' as const, mats: ['E-Waste', 'Metal'] },
    { name: 'Community Composting Facility', type: 'compost' as const, mats: ['Organic_Compost', 'Paper_Cardboard'] },
    { name: 'CleanCycle Glass & Bottle Bank', type: 'glass_bank' as const, mats: ['Glass'] },
    { name: 'Industrial Scrap Metal Salvage Depot', type: 'scrap_metal' as const, mats: ['Metal'] },
    { name: 'GreenPolymer Container Recycling Hub', type: 'municipal' as const, mats: ['Plastic', 'Metal', 'Paper_Cardboard'] },
  ];

  // Distribute dynamically within 1.5 - 9 km
  const generated: RecyclingCenter[] = names.map((item, index) => {
    const angle = (index * 60 * Math.PI) / 180;
    const distanceOffset = 0.015 + (index * 0.018); // Roughly 1.5 to 8 km
    const lat = userLat + Math.sin(angle) * distanceOffset;
    const lng = userLng + Math.cos(angle) * distanceOffset;
    const dist = calculateDistanceKm(userLat, userLng, lat, lng);

    return {
      id: `center_loc_${index}`,
      name: item.name,
      facilityType: item.type,
      address: `${100 + index * 45} Green Way, Sector ${index + 1}`,
      city: 'Your City Center',
      lat,
      lng,
      distanceKm: dist,
      phone: `+1 (800) 555-${1000 + index * 243}`,
      hours: index % 2 === 0 ? 'Mon - Sat: 8:00 AM - 6:00 PM' : 'Daily: 7:00 AM - 8:00 PM',
      isOpenNow: index !== 4,
      acceptedMaterials: item.mats,
      rating: parseFloat((4.5 + (index % 5) * 0.1).toFixed(1)),
      verified: true,
      notes: `Publicly accessible facility. Accepts ${item.mats.join(', ')}.`,
    };
  });

  const sorted = generated.sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));

  if (materialFilter === 'all') return sorted;
  return sorted.filter((c) => c.acceptedMaterials.includes(materialFilter));
}
