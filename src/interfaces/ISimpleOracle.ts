export type WeightsHash = { [feature: string]: number };


export type ISimpleOracleState = {
  actionIds: string[];
  context: string[];
  actionFeatures: string[];
  learningRate: number;
  contextActionIdInteractions: boolean;
  contextActionFeatureInteractions: boolean;
  useInversePropensityWeighting: boolean;
  negativeClassWeight: number;
  targetLabel: string;
  strictFeatures: boolean;
  weights: WeightsHash;
};

export interface SimpleOracleOptions {
  actionIds?: string[];
  context?: string[];
  actionFeatures?: string[];
  learningRate?: number;
  contextActionIdInteractions?: boolean;
  contextActionFeatureInteractions?: boolean;
  useInversePropensityWeighting?: boolean;
  negativeClassWeight?: number;
  targetLabel?: string;
  strictFeatures?: boolean;
  weights?: WeightsHash;
}
