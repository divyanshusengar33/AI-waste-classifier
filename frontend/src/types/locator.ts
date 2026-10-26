export type FacilityType =
  | 'municipal'
  | 'e-waste'
  | 'scrap_metal'
  | 'compost'
  | 'glass_bank';

export interface RecyclingCenter {
  id: string;
  name: string;
  facilityType: FacilityType;
  address: string;
  city: string;
  lat: number;
  lng: number;
  distanceKm?: number;
  phone: string;
  hours: string;
  isOpenNow: boolean;
  acceptedMaterials: string[];
  rating: number;
  verified: boolean;
  notes: string;
}
