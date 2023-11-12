export type WeightsHash = { [feature: string]: number };

export type ISimpleOracleState = {
  actionIds?: string[];
  context?: string[];
  actionFeatures?: string[];
  learningRate: number;
  actionIdFeatures: boolean;
  contextActionIdInteractions: boolean;
  contextActionFeatureInteractions: boolean;
  useInversePropensityWeighting: boolean;
  targetLabel: string;
  name: string;
  oracleWeight: number;
  weights: { [feature: string]: number };
};

export type ISimpleBanditState = {
  oracleStates: ISimpleOracleState[];
  temperature: number;
  slateSize: number;
};
