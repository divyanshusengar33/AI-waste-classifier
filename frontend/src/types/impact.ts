export interface MaterialImpact {
  label: string;
  count: number;
  weightKg: number;
  co2SavedKg: number;
  percentage: number;
  color: string;
}

export interface EnvironmentalImpactData {
  totalItemsScanned: number;
  totalWeightDivertedKg: number;
  totalCo2SavedKg: number;
  equivalentTreesPlanted: number;
  equivalentKwhSaved: number;
  equivalentCarKmOffset: number;
  materialBreakdowns: MaterialImpact[];
  weeklyTrends: Array<{
    day: string;
    items: number;
    co2Kg: number;
  }>;
}

export interface ImpactAssumption {
  material: string;
  avgWeightGrams: number;
  co2FactorKgPerKg: number;
  energyFactorKwhPerKg: number;
  referenceSource: string;
}
