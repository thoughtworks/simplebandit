export type WeightsHash = { [feature: string]: number };

export type ISimpleOracleState = {
  actionIds?: string[];
  context?: string[];
  features?: string[];
  learningRate: number;
  regularizer: number;
  actionIdFeatures: boolean;
  actionFeatures: boolean;
  contextActionIdInteractions: boolean;
  contextActionFeatureInteractions: boolean;
  useInversePropensityWeighting: boolean;
  laplaceSmoothing: number;
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
