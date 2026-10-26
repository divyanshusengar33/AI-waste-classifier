import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Navigation,
  Search,
  Phone,
  Clock,
  ExternalLink,
  ShieldCheck,
  Filter,
  Info,
  Compass
} from 'lucide-react';
import type { RecyclingCenter } from '../types/locator';
import {
  BASE_RECYCLING_CENTERS,
  getCentersForLocation,
} from '../constants/recyclingCenters';
import { formatClassLabel } from '../constants/wasteGuidance';
import { awardPoints } from '../utils/rewardsStorage';

interface LocatorPageProps {
  onPointsAwarded: (pts: number, reason: string) => void;
}

export const LocatorPage: React.FC<LocatorPageProps> = ({ onPointsAwarded }) => {
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [searchCity, setSearchCity] = useState<string>('');
  const [selectedMaterial, setSelectedMaterial] = useState<string>('all');
  const [facilities, setFacilities] = useState<RecyclingCenter[]>(BASE_RECYCLING_CENTERS);
  const [selectedCenter, setSelectedCenter] = useState<RecyclingCenter | null>(
    BASE_RECYCLING_CENTERS[0]
  );
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Default coordinate if GPS is not yet acquired (New Delhi / Global Center)
  const defaultCoords = { lat: 28.6139, lng: 77.209 };
  const activeLat = userCoords?.lat || defaultCoords.lat;
  const activeLng = userCoords?.lng || defaultCoords.lng;

  const materialFilters = [
    { id: 'all', label: 'All Materials' },
    { id: 'Plastic', label: 'Plastics' },
    { id: 'Paper_Cardboard', label: 'Paper & Cardboard' },
    { id: 'Metal', label: 'Metals & Cans' },
    { id: 'Glass', label: 'Glass Bottles' },
    { id: 'E-Waste', label: 'E-Waste & Batteries' },
    { id: 'Organic_Compost', label: 'Organic Composting' },
  ];

  // Request browser geolocation
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUserCoords(coords);
        const localized = getCentersForLocation(coords.lat, coords.lng, selectedMaterial);
        setFacilities(localized);
        if (localized.length > 0) setSelectedCenter(localized[0]);
        setIsLocating(false);

        // Award Eco-Points for exploring local facilities
        awardPoints(30, 'Located Nearby Recycling Centers', { visitedLocator: true });
        onPointsAwarded(30, 'Found Local Recycling Centers (+30 Eco-Points!)');
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setIsLocating(false);
        setLocationError('Could not retrieve GPS location. Showing regional recycling hubs.');
        const localized = getCentersForLocation(defaultCoords.lat, defaultCoords.lng, selectedMaterial);
        setFacilities(localized);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  useEffect(() => {
    const localized = getCentersForLocation(activeLat, activeLng, selectedMaterial);
    setFacilities(localized);
    if (localized.length > 0) {
      setSelectedCenter(localized[0]);
    }
  }, [selectedMaterial, activeLat, activeLng]);

  const handleCitySearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchCity.trim()) return;

    // Simulated geocoding for popular cities or generic shift
    const query = searchCity.toLowerCase();
    let newCoords = { lat: 28.6139, lng: 77.209 };

    if (query.includes('new york') || query.includes('nyc')) {
      newCoords = { lat: 40.7128, lng: -74.006 };
    } else if (query.includes('london')) {
      newCoords = { lat: 51.5074, lng: -0.1278 };
    } else if (query.includes('mumbai')) {
      newCoords = { lat: 19.076, lng: 72.8777 };
    } else if (query.includes('bangalore') || query.includes('bengaluru')) {
      newCoords = { lat: 12.9716, lng: 77.5946 };
    } else if (query.includes('paris')) {
      newCoords = { lat: 48.8566, lng: 2.3522 };
    } else {
      // Offset slightly to demonstrate city movement
      newCoords = {
        lat: activeLat + (Math.random() - 0.5) * 0.1,
        lng: activeLng + (Math.random() - 0.5) * 0.1,
      };
    }

    setUserCoords(newCoords);
    const updated = getCentersForLocation(newCoords.lat, newCoords.lng, selectedMaterial);
    setFacilities(updated);
    if (updated.length > 0) setSelectedCenter(updated[0]);
  };

  // OpenStreetMap embed URL
  const mapCenterLat = selectedCenter ? selectedCenter.lat : activeLat;
  const mapCenterLng = selectedCenter ? selectedCenter.lng : activeLng;
  const mapEmbedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${mapCenterLng - 0.04}%2C${mapCenterLat - 0.03}%2C${mapCenterLng + 0.04}%2C${mapCenterLat + 0.03}&layer=mapnik&marker=${mapCenterLat}%2C${mapCenterLng}`;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="border-b border-slate-200 pb-6">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 text-xs font-semibold mb-2">
          <MapPin className="w-3.5 h-3.5 text-emerald-700" />
          <span>Municipal & Specialized Recycling Directory</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Nearby Recycling Center Locator
        </h1>
        <p className="text-sm text-slate-600 mt-1 max-w-3xl">
          Find certified recycling facilities, e-waste collection sites, scrap metal yards,
          and community composting depots closest to you.
        </p>
      </div>

      {/* Search & Location Bar */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* City search input */}
        <form onSubmit={handleCitySearch} className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchCity}
            onChange={(e) => setSearchCity(e.target.value)}
            placeholder="Search by city (e.g. New York, London)..."
            className="w-full text-xs pl-10 pr-20 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white text-[11px] font-semibold"
          >
            Find
          </button>
        </form>

        {/* GPS Button */}
        <button
          onClick={handleUseMyLocation}
          disabled={isLocating}
          className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 font-semibold text-xs shadow-2xs transition-colors"
        >
          <Navigation className={`w-3.5 h-3.5 text-emerald-700 ${isLocating ? 'animate-spin' : ''}`} />
          <span>{isLocating ? 'Acquiring GPS...' : 'Use My Current Location'}</span>
        </button>
      </div>

      {locationError && (
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
          <Info className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{locationError}</span>
        </div>
      )}

      {/* Material Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <Filter className="w-4 h-4 text-slate-400 shrink-0" />
        <span className="text-xs font-semibold text-slate-600 shrink-0">Filter Material:</span>
        <div className="flex gap-1.5">
          {materialFilters.map((f) => (
            <button
              key={f.id}
              onClick={() => setSelectedMaterial(f.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-colors ${
                selectedMaterial === f.id
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Map & Details Left, Facility List Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Interactive Map & Selected Center Card */}
        <div className="lg:col-span-7 space-y-6">
          {/* Map Viewer */}
          <div className="relative rounded-3xl overflow-hidden border border-slate-200 bg-slate-100 shadow-xs h-[360px]">
            <iframe
              title="OpenStreetMap Facility Location"
              src={mapEmbedUrl}
              className="w-full h-full border-0"
              loading="lazy"
            />
            {/* Map Overlay Badge */}
            <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-200 shadow-md text-xs font-semibold text-slate-800 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-emerald-700" />
              <span>Interactive OpenStreetMap</span>
            </div>
          </div>

          {/* Selected Facility Detail Card */}
          {selectedCenter && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-lg text-slate-900">{selectedCenter.name}</h3>
                    {selectedCenter.verified && (
                      <span className="text-emerald-600" title="Verified municipal partner">
                        <ShieldCheck className="w-4 h-4" />
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{selectedCenter.address}</p>
                </div>

                {selectedCenter.distanceKm !== undefined && (
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0">
                    {selectedCenter.distanceKm} km away
                  </span>
                )}
              </div>

              {/* Status, Hours & Contact */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="flex items-center gap-2 text-slate-700">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span>{selectedCenter.hours}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <a href={`tel:${selectedCenter.phone}`} className="hover:text-emerald-700 font-medium">
                    {selectedCenter.phone}
                  </a>
                </div>
              </div>

              {/* Accepted Materials */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Accepted Materials:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedCenter.acceptedMaterials.map((mat) => (
                    <span
                      key={mat}
                      className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200"
                    >
                      {formatClassLabel(mat)}
                    </span>
                  ))}
                </div>
              </div>

              {/* Tips & notes */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600 leading-relaxed">
                <strong className="text-slate-800">Drop-off guidelines: </strong>
                {selectedCenter.notes}
              </div>

              {/* Get Directions Link Button */}
              <div className="pt-2">
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${selectedCenter.lat},${selectedCenter.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-md shadow-emerald-800/20 transition-all"
                >
                  <Navigation className="w-4 h-4" />
                  <span>Get Driving Directions to Facility</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Facility List */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">
              Nearby Drop-off Sites ({facilities.length})
            </h3>
            <span className="text-xs text-slate-400">Sorted by proximity</span>
          </div>

          <div className="space-y-3 max-h-[640px] overflow-y-auto pr-1">
            {facilities.map((center) => {
              const isSelected = selectedCenter?.id === center.id;
              return (
                <div
                  key={center.id}
                  onClick={() => setSelectedCenter(center)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50/40 shadow-xs ring-2 ring-emerald-600/20'
                      : 'border-slate-200 bg-white hover:border-slate-300 shadow-2xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h4 className="font-bold text-sm text-slate-900 truncate">
                        {center.name}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{center.address}</p>
                    </div>
                    {center.distanceKm !== undefined && (
                      <span className="text-xs font-mono font-bold text-emerald-800 shrink-0">
                        {center.distanceKm} km
                      </span>
                    )}
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span
                      className={`font-semibold px-2 py-0.5 rounded text-[10px] ${
                        center.isOpenNow
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {center.isOpenNow ? 'Open Now' : 'Closed'}
                    </span>
                    <span className="text-slate-400 text-[11px] truncate max-w-[160px]">
                      {center.acceptedMaterials.slice(0, 3).join(', ')}...
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
